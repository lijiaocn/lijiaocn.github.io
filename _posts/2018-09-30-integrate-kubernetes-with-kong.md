---
layout: default
title: "Kubernetes与API网关Kong的集成"
author: 李佶澳
createdate: "2018-09-30 16:07:13 +0800"
changedate: "2018-09-30 16:07:13 +0800"
categories: 项目
tags: kubernetes kong
keywords: kubernetes,kong,api gateway,API网关集成
description: Kong是一个Api网关，也是一个特性更丰富的反向代理。既然它有代理流量的功能，那么能不能直接成为Kubernetes的流量入口？使Kubernetes上托管的服务都通过Kong发布。
---

* auto-gen TOC:
{:toc}

## 说明

经过前面的学习([Nginx、OpenResty和Kong的基本概念与使用方法][3])，对Api网关是什么，以及Kong能够做什么已经有了足够的了解。
现在Kubernetes一统计算资源与应用发布编排的趋势已经形成，我们更关心Kong能否和Kubernetes结合。

Kong是一个Api网关，也是一个特性更丰富的反向代理。既然它有代理流量的功能，那么能不能直接成为Kubernetes的流量入口？使Kubernetes上托管的服务都通过Kong发布。

Kong实现了一个[Kubernetes Ingress Controller][2]（后面用kong-ingress-controller指代这个项目）来做这件事。另外也可以把Kong部署在Kubernetes中，见[Kong CE or EE on Kubernetes][1]。

## 先说设计

[Kubernetes Ingress Controller for Kong][4]中介绍了部署方法。不算PostgreSQL，总共有两个Deployment。

第一个Deployment是[ingress-controller.yaml][5]，部署的是一个有三个容器的Pod：
第一个容器是InitContainer，负责初始化数据库；
第二个容器是只开启了Admin管理地址的kong-proxy，负责提供Kong的管理API；
第三个容器是kong-ingress-controller，负责Kubernetes资源与Kong的衔接：监测Kubernetes资源的变动，及时调用Kong的管理API，更新Kong的配置。

第二个Deployment是[Deployment：Kong]，pod中包含的是只开启了代理地址的kong-proxy。

第一个Deployment属于控制平面，负责管理Kong。第二个Deployment属于数据平面，负责根据指示反向代理API请求。下面的图片是kong-ingress-controller中的图片，
红色箭头表示控制信息的流动，绿色箭头表示API请求的流动：

![kong kubernetes ingress conroller deployment](https://raw.githubusercontent.com/Kong/kubernetes-ingress-controller/master/docs/images/deployment.png)

## kong自定义的kubernetes资源

Kubernetes支持自定义资源（[Extend the Kubernetes API with CustomResourceDefinitions][7]，kong-ingress-controller充分利用了这个CRD特性。
在[custer-types.yml][8]中定义了`KongPlugin`、`KongConsumer`、`KongCredential`和`KongIngress`四种自定义资源(@2018-09-30 17:19:38)。

[Kong ingress controller: custom types][8]中对这四种自定义资源用法做了说明：

	KongPlugin:     kong插件的配置项
	KongConsumer:   kong的用户
	KongCredential: kong用户的认证凭证
	KongIngress:    对ingress的增强配置，可以设置更多细节

## 开始部署


## 参考

1. [Kong CE or EE on Kubernetes][1]
2. [Kong/kubernetes-ingress-controller][2]
3. [Nginx、OpenResty和Kong的基本概念与使用方法][3]
4. [Kubernetes Ingress Controller for Kong][4]
5. [Deployment: ingress-controller.yaml][5]
6. [Deployment: Kong]
7. [Extend the Kubernetes API with CustomResourceDefinitions][7]
8. [Kong ingress controller: custom types][8]

[1]: https://docs.konghq.com/install/kubernetes/ "Kong CE or EE on Kubernetes"
[2]: https://github.com/Kong/kubernetes-ingress-controller "Github: Kong/kubernetes-ingress-controller"
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html "Nginx、OpenResty和Kong的基本概念与使用方法"
[4]: https://github.com/Kong/kubernetes-ingress-controller "Kubernetes Ingress Controller for Kong"
[5]: https://github.com/Kong/kubernetes-ingress-controller/blob/master/deploy/manifests/ingress-controller.yaml "Deployment: ingress-controller.yaml"
[6]: https://github.com/Kong/kubernetes-ingress-controller/blob/master/deploy/manifests/kong.yaml "Deployment: Kong"
[7]: https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definitions/ "Extend the Kubernetes API with CustomResourceDefinitions"
[8]: https://github.com/Kong/kubernetes-ingress-controller/blob/master/deploy/manifests/custom-types.yaml "Kong ingress controller: custom types"
