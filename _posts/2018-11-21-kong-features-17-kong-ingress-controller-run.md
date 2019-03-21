---
layout: default
title: "API网关Kong学习笔记（十七）：Kong Ingress Controller的使用"
author: 李佶澳
createdate: "2018-11-21 16:08:54 +0800"
changedate: "2019-03-21 14:48:06 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关
description: 之前看过kong的ingresss controller的实现，这里记录一下它的用法，主要是命令行参数和运行
---

* auto-gen TOC:
{:toc}

## 说明



之前看过kong的[ingresss controller][2]的实现：[API网关Kong学习笔记（八）：Kong Ingress Controller的实现][1]。这里记录一下它的用法。

{% include kong_pages_list.md %}

## 编译

编译方法和代码结构见：[API网关Kong学习笔记（八）：Kong Ingress Controller的实现][1]，这里不赘述。

	make deps
	make build

## 参数

这里使用的kong-ingress-controller的版本是[0.2.0](https://github.com/Kong/kubernetes-ingress-controller/tree/0.2.0)

主要参数有：

	--kubeconfig                  # 访问kubernetes的凭证
	--default-backend-service     # 指定默认backend，namespace/service: kong/kong-proxy
	--publish-service             # ingress-controller，在kubernetes中对应的服务，namespace/service：kong/kong-ingress-controller
	--kong-url                    # kong admin地址
	--update-status               # 更新ingress状态，设置为true时，ingress-controller需要是kubernetes集群中的一个pod。

可以用下面的命令运行：

	$ ./kong-ingress-controller  \
	  --kubeconfig ./kubeconfig-single.yml  \
	  --default-backend-service kong/kong-proxy \
	  --publish-service kong/kong-ingress-controller  \
	  --kong-url 192.168.33.12:8001 \
	  --update-status=false

## 参考

1. [API网关Kong学习笔记（八）：Kong Ingress Controller的实现][1]
2. [Github: Kong kubernetes ingress controller][2]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/02/kong-features-05-ingress-controller-analysis.html "API网关Kong学习笔记（八）：Kong Ingress Controller的实现"
[2]: https://github.com/Kong/kubernetes-ingress-controller "Github: Kong kubernetes ingress controller"
