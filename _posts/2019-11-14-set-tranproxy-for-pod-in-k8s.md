---
layout: default
title: "kubernetes 中的容器设置透明代理，自动在 HTTP 请求头中注入 Pod 信息"
author: 李佶澳
date: "2019-11-14 20:00:30 +0800"
last_modified_at: "2023-06-21 17:00:54 +0800"
categories: 技巧
cover:
tags: kubernetes nginx gateway
keywords: kubernetes,nginx,透明代理
description: 集群外部的服务获取不到 Pod 的信息，会给故障排查增加一些困难，基于源 IP 的功能也会受到影响
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

因为选用的 Kubernetes 的网络方案原因，Pod 内的程序访问集群外部的服务时，源 IP 会被转换成 Node 的 IP。

集群外部的服务或者网关层获取不到 Pod 本身的信息，会给故障排查增加一些困难，网关层基于源 IP 的功能，譬如限速，也会受到影响。
要求集群内的客户端发送请求时带上 Pod 信息是比较困难的，最好用技术手段偷偷实现。

研究了一下，可以通过基于 nginx 的透明代理实现。

## 采用的技术

就是在 Pod 内用 nginx 实现透明代理， 找了下 [正向代理、反向代理、透明代理][2] 的区别，这里采用的用户无感知的方式更贴近透明代理的概念，同时也是正向代理。

技术原理：

1. [使用 nginx 实现本地透明代理][3]

参考了 istio 的实现：

1. [istio是怎样强行代理Pod的进出请求的？][4]
2. [服务网格/ServiceMesh 项目 istio 的流量重定向、代理请求过程分析][5]

## 使用方法

相关配置已经打包成镜像 lijiaocn/nginx-tranproxy:0.1（[docker-nginx-tranproxy][6]），可以用 sidecar 的方式部署或者以 lijiaocn/nginx-tranproxy:0.1 为 base 镜像制作业务容器的镜像。

lijiaocn/nginx-tranproxy 的使用方法：

```sh
$ docker run --rm -it  lijiaocn/nginx-tranproxy:0.1 -h
Usage: entrypoint.sh
-h/--help        print this usage
-P/--port port   proxy traffic to this port, this option can repeat
                 eg: -P 80 -P 8080
-H/--header      headers add by tranproxy, this option can repeat
                 eg: -H header1:value1 -H header2:value2
-N/--nameserver  nameserver used by tranproxy, this option can repeat
                 eg: -N 114.114.114.114 -N 8.8.8.8
                 default value is nameservers in /etc/resolve.conf

--Set-Forwarded-For   tranproxy will add X-Forwarded-For header
                      if value is not provided, use env PODIP
                      if env PODIP is empty, use primary nic ip
--Set-Client-Hostname tranproxy will add X-Client-Hostname header
                      if value is not provided, get by command hostname
-- cmd arg arg...     execute cmd at last, may be empty
```

### SideCar 的方式

在 Pod 中添加一个名为 nginx-tranproxy 的 SideCar 容器，和名为 tail 的业务容器共用网络设置：

```yaml
... 省略 ...
containers:
# 业务容器
- image: lijiaocn/alpine-tool:0.1
  name: tail
  args:
  - tail
  - -f
  - /dev/null
  imagePullPolicy: IfNotPresent
... 省略 ...
- image: lijiaocn/nginx-tranproxy:0.1
  args:
  - -P
  - "80"
  - -P
  - "8080"
  - -N
  - "114.114.114.114"
  - -N
  - "8.8.8.8"
  - --Set-Forwarded-For
  - default
  - --Set-Client-Hostname
  - default
  - -H
  - tranproxy:true
  env:
  - name: PODIP
    valueFrom:
      fieldRef:
        fieldPath: status.podIP
  imagePullPolicy: Always
  name: nginx-tranproxy
  resources: {}
  securityContext:
    capabilities:
      add:
      - NET_ADMIN
```

完整的 yaml 文件是 [usage-sidecar-mode.yaml](https://github.com/lijiaocn/containers/blob/master/docker-nginx-tranproxy/usage-sidecar-mode.yaml)，tail 容器是一个什么也不做的业务容器。

在 nginx-tranproxy 容器中可查看设置的 iptables 规则：

```sh
~ # iptables-save
# Generated by iptables-save v1.6.2 on Mon Nov 18 02:43:17 2019
*nat
:PREROUTING ACCEPT [0:0]
:INPUT ACCEPT [0:0]
:OUTPUT ACCEPT [1:60]
:POSTROUTING ACCEPT [2:120]
:LOCAL_PROXY - [0:0]
-A OUTPUT -p tcp -j LOCAL_PROXY
-A LOCAL_PROXY -m owner --uid-owner 100 -j RETURN
-A LOCAL_PROXY -p tcp -m tcp --dport 80 -j REDIRECT --to-ports 80
-A LOCAL_PROXY -p tcp -m tcp --dport 8080 -j REDIRECT --to-ports 8080
COMMIT
# Completed on Mon Nov 18 02:43:17 2019
```

在 nginx-tranproxy 容器或者业务容器（tail）中发起的到 80/8080 的 http 请求会被添加 http 头，譬如访问 [echo 服务][7] 时返回下面的结果：

```sh
/ # curl 172.17.0.21:8080

Hostname: echo-597d89dcd9-m84tq

Pod Information:
	-no pod information available-

Server values:
...省略...

Request Headers:
	accept=*/*
	connection=close
	host=172.17.0.21:8080
	user-agent=curl/7.61.1
	
	...透明代理添加的请求头，和 nginx-tranproxy 的运行参数对应....
	tranproxy=true
	x-client-hostname=tail-with-nginx-tranproxy-59d8b5f4f9-ptpq2
	x-forwarded-for=172.17.0.28

Request Body:
	-no body in request-
```

### InOne 方式

InOne方式（生造的词..）就是把 nginx 透明代理和业务系统打包在一起，lijiaocn/nginx-tranproxy:0.1 镜像是一个很好的 base 镜像，它的 entrypoint.sh 脚本支持追加要执行的命令，譬如：

```yaml
containers:
- image: lijiaocn/nginx-tranproxy:0.1
  args:
  - -P
  - "80"
  - -P
  - "8080"
  - -N
  - "114.114.114.114"
  - -N
  - "8.8.8.8"
  - --Set-Forwarded-For
  - default
  - --Set-Client-Hostname
  - default
  - -H
  - tranproxy:true
  - --
  # -- 后面是在容器内运行的服务的启动命令，这里用 tail 模拟
  - tail
  - -f
  - /dev/null
  env:
  - name: PODIP
    valueFrom:
      fieldRef:
        fieldPath: status.podIP
```

`--`之后是业务系统的启动命令，这种方式可以少用一个 sidecar 容器，完整的 yaml 文件：[usage-together-mode.yaml][8]。

## 参考

1. [李佶澳的博客][1]
2. [图解正向代理、反向代理、透明代理][2]
3. [使用 nginx 实现本地透明代理][3]
4. [istio是怎样强行代理Pod的进出请求的？][4]
5. [服务网格/ServiceMesh 项目 istio 的流量重定向、代理请求过程分析][5]
6. [docker-nginx-tranproxy][6]
7. [用 echoserver 观察代理/转发效果][7]
8. [usage-together-mode.yaml][8]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://blog.csdn.net/z69183787/article/details/41802505 "图解正向代理、反向代理、透明代理"
[3]: https://www.lijiaocn.com/soft/nginx/proxy.html "使用 nginx 实现本地透明代理"
[4]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/11/07/istio-local-proxy.html "istio是怎样强行代理Pod的进出请求的？"
[5]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/11/01/istio-packet-forward.html "服务网格/ServiceMesh 项目 istio 的流量重定向、代理请求过程分析"
[6]: https://github.com/lijiaocn/containers/tree/master/docker-nginx-tranproxy "docker-nginx-tranproxy"
[7]: https://www.lijiaocn.com/soft/envoy/echoserver.html "用 echoserver 观察代理/转发效果"
[8]: https://github.com/lijiaocn/containers/blob/master/docker-nginx-tranproxy/usage-together-mode.yaml "usage-together-mode.yaml"
