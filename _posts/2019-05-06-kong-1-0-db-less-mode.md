---
layout: default
title: "API网关Kong学习笔记（二十六）：kong 1.1引入db-less模式，无数据库部署"
author: 李佶澳
createdate: "2019-05-06 16:23:26 +0800"
changedate: "2019-05-07 15:24:12 +0800"
categories: 项目
tags: kong
keywords: kong,apigateway,db-less,api网关
description: "Kong 1.1.x实现了db-less模式，可以不使用数据库，每个kong独立工作，不通过数据库共享配置"
---

* auto-gen TOC:
{:toc}

## 说明

Kong 1.1.x 实现了db-less模式，可以不使用数据库了。DB-less模式中，每个kong都独立工作，不通过数据库共享配置。

部署在Kubernetes中的db-less模式的kong和nginx-ingress的工作模式是一样的：一个controller程序监听kubernetes中的变换，生成配置文件；一个转发代理实时加载最新的配置。

{% include kong_pages_list.md %}

## 部署

```sh
kubectl create -f https://raw.githubusercontent.com/Kong/kubernetes-ingress-controller/0.4.x/deploy/single/all-in-one-dbless.yaml
```

只有一个ingress-kong在运行，该Pod包含两个容器，一个是kong，一个是kong-ingress-controller：

```sh
$ ./kubectl.sh -n kong get pod -o wide
NAME                          READY   STATUS    RESTARTS   AGE   IP              NODE          NOMINATED NODE
ingress-kong-9446f846-7q897   2/2     Running   0          25m   172.16.129.70   10.10.64.58   <none>
```

只有kong-proxy：

```sh
$ ./kubectl.sh -n kong  get svc -o wide
NAME         TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE   SELECTOR
kong-proxy   LoadBalancer   172.16.113.243   <pending>     80:30028/TCP,443:31954/TCP   28m   app=kong
```

通过kong-proxy访问服务：

```sh
$ curl -H "host:echo.com" 10.10.64.58:30028

Hostname: echo-7df87d5c6d-s4vhq

Pod Information:
	-no pod information available-

Server values:
	server_version=nginx: 1.13.3 - lua: 10008

Request Information:
	client_address=172.16.129.70
	method=GET
	real path=/
	query=
	request_version=1.1
	request_uri=http://echo.com:8080/
...
```

CRD等没有变化。

## 分析

Kong的db-less模式和nginx-ingress-controller的部署方式是一样的，每个kong或者nginx自带一个监听kubernetes资源的controller，各自独立工作，构成一个完全松散的集群。

这种部署方式有两个好处：第一，组件更少，组件更少意味着依赖关系更简单，不容易出事故；第二，每个转发pod独立工作，不依赖相同的中心组件，避免了中心组件故障引发大规模故障。

如果把kong设计为独立于kubernetes集群的网关，让它可以同时接入kubernets集群中的服务和集群外的服务，db-less模式没有中心化的配置中心，实现起来会困难易出错。

如果把kong设计为kubernetes集群的一个组件，只负责代理kubernetes中的服务，那么kubernetes集群就是kong的配置中心，把kubernetes作为唯一的配置入口，不要绕过kubernetes单独配置kong。

## 实现

翻阅kong-ingress-controller的代码，使用db-less模式的时候，kong-ingress-controller调用kong 1.1的config接口，将最新配置下发给同一个pod中的kong:

```go
// internal/ingress/controller/kong.go: 121
req, err := http.NewRequest("POST", n.cfg.Kong.URL+"/config",
	bytes.NewReader(json))
if err != nil {
	return errors.Wrap(err, "creating new HTTP request for /config")
}
req.Header.Add("content-type", "application/json")
_, err = client.Do(nil, req, nil)
if err != nil {
	return errors.Wrap(err, "posting new config to /config")
}
```

## 参考

1. [Kong 1.1.0 ChangeLog][1]

[1]: https://github.com/Kong/kong/blob/master/CHANGELOG.md#110 "Kong 1.1.0 ChangeLog"
