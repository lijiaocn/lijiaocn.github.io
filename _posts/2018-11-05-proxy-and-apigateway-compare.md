---
layout: default
title: "代理服务软件haproxy、nginx、envoy对比，以及开源的API网关项目对比"
author: 李佶澳
createdate: "2018-11-05 15:12:07 +0800"
last_modified_at: "2019-05-09 17:24:54 +0800"
categories: 项目
tags: 系统设计
keywords:  gateway,haproxy,nginx,envoy
description: 基于OpenResty的api网关项目kong的学习曲线有些陡峭，特别是如果要添加一些nginx不支持的特性，大概率要自己开发nginx模块，需要抬头看看路
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

基于OpenResty的api网关项目kong的学习曲线有些陡峭，如果要自主修改增删，至少需要掌握：nginx、nginx模块开发、lua语言、openresty中的多个模块，然后是kong。特别是如果要添加一些nginx不支持的特性，大概率要自己开发nginx模块，因此很有必要了解一下其它的API网关项目，多储备几个选择。

## 代理服务软件对比：haproxy、nginx、envoy

[Envoy vs NGINX vs HAProxy: Why the open source Ambassador API Gateway chose Envoy][1]中详细说明了[Ambassador](https://www.getambassador.io/)作为底层代理软件的原因。

简单总结一些：

haproxy，发展速度太慢，对SSL的支持、以及热加载(hitloss)的支持，都非常晚。

nginx，主要担心nginx公司推出了收费的nginx plus之后，社区版的更新会明显滞后。

envoy，选择它的原因是因为这个一个比较活跃的项目，lyft公司贡献的，背后没有太多的商业因素。

## 开源API网关项目对比

[nginx-ingress vs kong vs traefik vs haproxy vs voyager vs contour vs ambassador vs istio ingress][2]中对比了8个api网关项目。

作者的观点是: nginx-ingress是最稳定可靠的，Ambassador和Istio是比较前沿的，可以用来做POC。

[painless-nginx-ingress](https://danielfm.me/posts/painless-nginx-ingress.html)中列出了多个使用nginx-ingress时需要注意的问题，非常值得一看。

## 参考

1. [Envoy vs NGINX vs HAProxy: Why the open source Ambassador API Gateway chose Envoy][1]
2. [nginx-ingress vs kong vs traefik vs haproxy vs voyager vs contour vs ambassador vs istio ingress][2]
3. [Comparing API Gateway Performances: NGINX vs. ZUUL vs. Spring Cloud Gateway vs. Linkerd][3]
4. [Tyk Documentation][4]
5. [AMBASSADOR][5]
6. [Traefik][6]

[1]: https://blog.getambassador.io/envoy-vs-nginx-vs-haproxy-why-the-open-source-ambassador-api-gateway-chose-envoy-23826aed79ef "Envoy vs NGINX vs HAProxy: Why the open source Ambassador API Gateway chose Envoy"
[2]: https://kubedex.com/nginx-ingress-vs-kong-vs-traefik-vs-haproxy-vs-voyager-vs-contour-vs-ambassador/ "nginx-ingress vs kong vs traefik vs haproxy vs voyager vs contour vs ambassador vs istio ingress"
[3]: https://engineering.opsgenie.com/comparing-api-gateway-performances-nginx-vs-zuul-vs-spring-cloud-gateway-vs-linkerd-b2cc59c65369 "Comparing API Gateway Performances: NGINX vs. ZUUL vs. Spring Cloud Gateway vs. Linkerd"
[4]: https://tyk.io/docs/ "Tyk Documentation"
[5]: https://www.getambassador.io/docs "AMBASSADOR"
[6]: https://docs.traefik.io/  "Traefik"
