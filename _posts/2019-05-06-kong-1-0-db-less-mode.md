---
layout: default
title: "API网关Kong学习笔记（二十六）：Kong 1.1引入db-less模式，无数据库部署"
author: 李佶澳
createdate: "2019-05-06 16:23:26 +0800"
changedate: "2019-05-07 18:43:04 +0800"
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
$ kubectl create -f https://raw.githubusercontent.com/Kong/kubernetes-ingress-controller/0.4.x/deploy/single/all-in-one-dbless.yaml
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

## 分析

Kong的db-less模式和nginx-ingress-controller的部署方式是一样的，每个kong或者nginx自带一个监听kubernetes资源的controller，各自独立工作，构成一个完全松散的集群。

这种部署方式有两个好处：第一，组件更少，组件更少意味着依赖关系更简单，不容易出事故；第二，每个转发pod独立工作，不依赖相同的中心组件，避免了中心组件故障引发大规模故障。

采用哪种部署方式，取决于kong的设计定位：

1. 把kong设计成独立于kubernetes集群的网关，让它可以同时接入kubernets集群中的服务、多个kubernets集群、集群外的服务
2. 把kong设计成kubernetes集群的一个组件，只负责代理kubernetes中的服务

第一种定位采用带有数据库的部署方式更好，db-less模式没有中心化的配置中心，归整多个来源的配置会困难一些且易出错，不如全部统一到数据库中，也便于管理员进行全局管控。

第二种定位采用db-less模式更好，这时kubernetes集群就是kong的中心化的配置中心，且是唯一配置管理入口，kong退到kubernetes身后。

db-less的模式更实用、更简单，是以后的趋势。

## 延伸

之前粗略了解过[envoy](https://www.lijiaocn.com/tags/all.html#envoy)，个人感觉envoy带后发优势，有全面清晰的接口，是一个更好的转发代理组件。
那么是不是可以参照db-less的做法，为envoy写一个controller，组合成一个网关呢？

翻出一直没细看的kubernetes文档——[Additional controllers][2]，早就有人这样做了：

|项目    |      数据平面   |   免费社区版    |   商业服务     |   主要贡献者   | Release次数/贡献人数 |
|------------------------------------------------------------------------------|
|[Ambassador](https://github.com/datawire/ambassador)   |  envoy     |     yes         |      yes       |   Datawire Inc. |265/77|
|[Contour](https://github.com/heptio/contour) | envoy |  yes | no |  Heptio |23/57|
|[Gloo](https://github.com/solo-io/gloo) | envoy |  yes | no | solo.io, Inc. |92/18|
|[istio](https://github.com/istio/istio) |  envoy |  yes | no | Istio Community  |56/367|
|[NGINX Ingress Controller for Kubernetes](https://www.nginx.com/products/nginx/kubernetes-ingress-controller) | nginx | yes | yes | NGINX, Inc |23/41|
|[kong-ingress-controller](https://github.com/Kong/kubernetes-ingress-controller) | Kong(nginx/openresty)|  yes | yes | Kong Inc. | 13/27|
|[traefik](https://github.com/containous/traefik) |  go binary| yes | yes | Containous Inc. |246/367|
|[Voyager](https://github.com/appscode/voyager/) | haproxy  |   yes | no | AppsCode Inc. |78/48|
|[jcmoraisjr/haproxy-ingress](https://github.com/jcmoraisjr/haproxy-ingress) |haproxy| yes| no |  jcmoraisj |54/23|
|[citrix-k8s-ingress-controller](https://github.com/citrix/citrix-k8s-ingress-controller) | Citrix's MPX/VPX/CPX |  no |yes |  Citrix Systems, Inc.|0/11|
|[F5 BIG-IP Controller for Kubernetes](https://clouddocs.f5.com/products/connectors/k8s-bigip-ctlr/v1.9/) | F5  hardware | no |yes | F5 .Inc |unknow|

## 参考

1. [Kong 1.1.0 ChangeLog][1]
2. [Additional controllers][2]

[1]: https://github.com/Kong/kong/blob/master/CHANGELOG.md#110 "Kong 1.1.0 ChangeLog" 
[2]: https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/#additional-controllers "Additional controllers"
