---
layout: default
title: "基于Envoy的ApiGateway/Ingress Controller项目梳理（总结）"
author: 李佶澳
createdate: "2019-05-09 17:01:01 +0800"
changedate: "2019-05-21 16:57:38 +0800"
categories: 项目
tags: apigateway envoy
cover:
keywords: apigateway,envoy,kong,nginx,servicemesh,ingress controller
description: "对比Kubernetes文档列出的Ingress Controller：ambassador,contour,gloo,istio,traefik,voyager"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[Nginx-ingress vs kong vs traefik vs haproxy ...][2]中比对了8个 apigateway 项目：

![Nginx-ingress vs kong vs traefik vs haproxy vs voyager vs contour vs ambassador vs istio ingress]({{ site.imglocal }}/article/apigateway-compare.png)

只看别人的分析不亲自了解下是不会有深刻认识的，这里粗略了解下[Kubernetes文档][1]中列出 Ingress Controller：

|项目    |      数据平面   |   免费社区版    |   商业服务     |   主要贡献者   | Release次数/贡献人数 |
|------------------------------------------------------------------------------|
|[Ambassador](https://github.com/datawire/ambassador)   |  envoy     |     yes         |      yes       |   Datawire Inc. |265/77|
|[Contour](https://github.com/heptio/contour) | envoy |  yes | no |  Heptio |23/57|
|[Gloo](https://github.com/solo-io/gloo) | envoy |  yes | yes | solo.io, Inc. |92/18|
|[Istio](https://github.com/istio/istio) |  envoy |  yes | no | Istio Community  |56/367|
|[NGINX Ingress Controller from Nginx](https://www.nginx.com/products/nginx/kubernetes-ingress-controller) | nginx | yes | yes | NGINX, Inc |23/41|
|[NGINX Ingress Controller from Kubernetes](https://github.com/kubernetes/ingress-nginx/)  | nginx | yes| no | Kubernetes Community | 50/377 |
|[Kong-ingress-controller](https://github.com/Kong/kubernetes-ingress-controller) | Kong(nginx/openresty)|  yes | yes | Kong Inc. | 13/27|
|[Traefik](https://github.com/containous/traefik) |  go binary| yes | yes | Containous Inc. |246/367|
|[Voyager](https://github.com/appscode/voyager/) | haproxy  |   yes | no | AppsCode Inc. |78/48|
|[Haproxy-ingress](https://github.com/jcmoraisjr/haproxy-ingress) |haproxy| yes| no |  jcmoraisj |54/23|
|[Citrix-k8s-ingress-controller](https://github.com/citrix/citrix-k8s-ingress-controller) | Citrix's MPX/VPX/CPX |  no |yes |  Citrix Systems, Inc.|0/11|
|[F5 BIG-IP Controller for Kubernetes](https://clouddocs.f5.com/products/connectors/k8s-bigip-ctlr/v1.9/) | F5  hardware | no |yes | F5 .Inc |unknow|

<br>
上表有两个基于 nginx 的 ingress-controller：

1. [NGINX Ingress Controller from Nginx](https://github.com/nginxinc/kubernetes-ingress/)是Nginx官方维护的，[文档](https://www.nginx.com/products/nginx/kubernetes-ingress-controller)；
2. [NGINX Ingress Controller from Kubernetes](https://github.com/kubernetes/ingress-nginx/)是Kubernetes社区维护的，[文档](https://kubernetes.github.io/ingress-nginx/how-it-works/)。

## 数据平面的选择

数据平面以nginx和envoy为主，traefix等少部分项目自己实现了数据面功能。数据面承担大流量、高并发请求的转发工作，工作内容比较独立，应该选择独立、专业的代理转发软件。

Haproxy和Nginx是经典的代理转发软件，应用广泛、性能好，但是它们诞生较早没有清晰的控制接口，只能通过重新加载配置文件的方式刷新配置。
其中Nginx因为支持模块扩展，灵活性相对较高，kubernetes/ingress-nginx、kong等项目使用lua模块，减少了配置加载次数或者为nginx开发了控制接口。

Envoy诞生较晚，有完备的控制接口，正致力于成为数据平面的标准方案，应当作为首要选择。
Haproxy对新的场景和新的需求跟进缓慢，最先排除。
Nginx扩展性好、社区活跃，目前没有一个统一的控制接口，开源版本功能弱于收费版的nginx-plus，可以选择。

从apigateway开源项目的数量来看，也是envoy>nginx>haproxy，ambassador详细介绍了选择envoy的[心路历程](https://blog.getambassador.io/envoy-vs-nginx-vs-haproxy-why-the-open-source-ambassador-api-gateway-chose-envoy-23826aed79ef)。

## 控制平面的选择

控制平面看似各有各的特色功能，实际上它们的能力范围都是由数据平面决定的，对于使用同样数据平面的控制面，不存在A项目支持的功能，B项目在技术上无法支持的情况。

因此如果控制平面有良好的设计，可以暂时容忍功能的不完备。

选择控制平面的时候，需要关注项目的整体规划、实现质量、社区活跃程度、项目的可持续性以及解耦是否充分。

## 项目梳理

1. [基于Envoy的ApiGateway/Ingress Controller项目梳理（一）：Ambassador](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/05/21/apigateway-base-envoy-compare-ambassador.html)
2. [基于Envoy的ApiGateway/Ingress Controller项目梳理（二）：Contour](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/05/21/apigateway-base-envoy-compare-contour.html)
3. [基于Envoy的ApiGateway/Ingress Controller项目梳理（三）：Gloo](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/05/21/apigateway-base-envoy-compare-gloo.html)
4. [基于Envoy的ApiGateway/Ingress Controller项目梳理（四）：Istio](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/05/21/apigateway-base-envoy-compare-istio.html)
5. 更早之前对基于nginx的kong进行了深入了解：[API网关Kong学习笔记](https://www.lijiaocn.com/tags/all.html#kong)

## 个人观点

如果只是单纯需要一个 ingress，用来暴露 kubernetes 中的服务，优先考虑 nginx-ingress-controller（基于nginx） 和 contour（基于envoy），它们足够简单又能满足需求。
如果需要的是一个功能强大的网关，能够对API进行管理以及对请求进行精细管理：

1. 时间和精力足够，硬啃 istio（据说现在坑比较多，但其它项目的坑也不见得少）；
2. 短平快的上线基于 nginx 的网关使用 kong，虽然在和 kubernetes 结合方面还有比较多的坑，但它是一个比较完备的网关，而且正在快速更新中；
3. 短平快的上线基于 envoy 的网关使用 gloo，它真正体现出了对 api 的管理，但是功能较弱，认证限速等功能只有企业版支持。

## 功能需求整理

| 基本功能     |  扩展功能1          | 扩展功能2 |
|--------------+---------------------+-----------|
| 按Host转发   |  按Header转发       | 按参数转发|
| 按路径转发   |                     | 比例转发（将40%流量转发给版本1，60%流量转发给版本2）|
| 负载均衡策略 |                     | 复制转发  | 
|              |  局部限速           | 全局限速  |
|              |                     | 错误注入  |
| WebSocket    |                     |           |
| GRPC         |                     |           |
|              |                     | Tracing   |
| 会话粘连     |  按源IP粘连         |           |
|              |  按Cookie粘连       |           |
| IP黑白名单   |  认证服务           | 流量清洗  |
|              |                     |           |
| Uri Rewrite  |  请求数据改写       |           |
|              |  响应数据改写       |           |
|              |  状态可视           |           |
|              |  API管理            |           |
|              |                     | 接口发现  |
|              |                     | 函数服务  |

概括一下就是：更灵活的转发规则、限速、可视化、访问控制、防护、链路跟踪。

## 项目支持情况

|  项目名称  |        免费支持的功能                        |               付费支持的功能               |
|------------+----------------------------------------------+--------------------------------------------|
| Ambassador | Authentication、Rate limiting、Tracing、gRPC | SSO、Advanced Rate Limiting、Access Control|
| Contour    | TLS、WebSocket、Prefix Rewrite、路由级联、 Health Checking   |   |
| Gloo       | transformations（内容修改）、faults（注入一定比例的错误返回）、prefix Rewrite| Authentication、Rate Limit |
| Istio      | Fault Injection、Traffic Shifting、Authentication、Control Headers and Routing、Enabling Rate Limits、Denials and White/Black Listing、Distributed Tracing||
| Kong       | Kong的插件是最多的：[Kong Hub](https://docs.konghq.com/hub/) ||

## 参考

1. [Kubernetes Additional controllers][1]
2. [nginx-ingress vs kong vs traefik vs haproxy vs voyager vs contour vs ambassador vs istio ingress][2]

[1]: https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/#additional-controllers "Additional controllers"
[2]: https://kubedex.com/nginx-ingress-vs-kong-vs-traefik-vs-haproxy-vs-voyager-vs-contour-vs-ambassador/ "nginx-ingress vs kong vs traefik vs haproxy vs voyager vs contour vs ambassador vs istio ingress"
