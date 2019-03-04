---
layout: default
title: "API网关Kong学习笔记（十五）：KongIngress的定义细节"
author: 李佶澳
createdate: "2018-11-20 16:43:45 +0800"
changedate: "2019-03-04 14:36:27 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关,KongIngress
description:  KongIngress中提供了Ingress之外的配置项，可以通过这些配置项，控制请求转发过程
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的学习笔记](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

[API网关Kong（二）：Kong与Kubernetes集成的方法](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html#customresourcedefinitions)中提到过KongIngress的定义，这里详细展开。

**相关笔记**，这些笔记是学习过程做的记录，写的比较仓促，有疑惑的地方以Kong官方文档为准：

[《API网关Kong学习笔记（零）：使用过程中遇到的问题以及解决方法》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/29/kong-usage-problem-and-solution.html)

[《API网关Kong学习笔记（一）：Nginx、OpenResty和Kong的基本概念与使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html)

[《API网关Kong学习笔记（二）：Kong与Kubernetes集成的方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html)

[《API网关Kong学习笔记（三）：功能梳理和插件使用-基本使用过程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-00-basic.html)

[《API网关Kong学习笔记（四）：功能梳理和插件使用-认证插件使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-01-auth.html)

[《API网关Kong学习笔记（五）：功能梳理和插件使用-安全插件使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-02-security.html)

[《API网关Kong学习笔记（六）：Kong数据平面的事件、初始化与插件加载》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html)

[《API网关Kong学习笔记（七）：Kong数据平面Plugin的调用与实现》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html)

[《API网关Kong学习笔记（八）：Kong Ingress Controller的实现》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/02/kong-features-05-ingress-controller-analysis.html)

[《API网关Kong学习笔记（九）：Kong对WebSocket的支持》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/06/kong-features-06-websocket.html)

[《API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/08/kong-features-06-production-and-benchmark.html)

[《API网关Kong学习笔记（十一）：自己动手写一个插件》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/09/kong-features-07-write-plugins.html)

[《API网关Kong学习笔记（十二）：插件的目录中schema分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-08-plugin-schema.html)

[《API网关Kong学习笔记（十三）：向数据库中插入记录的过程分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-09-database-insert.html)

[《API网关Kong学习笔记（十四）：Kong的Admin API概览和使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/19/kong-features-10-apis.html)

[《API网关Kong学习笔记（十五）：KongIngress的定义细节》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-11-kong-ingress-definition.html)

[《API网关Kong学习笔记（十六）：Kong转发请求的工作过程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-16-work-process.html)

[《API网关Kong学习笔记（十七）：Kong Ingress Controller的使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/21/kong-features-17-kong-ingress-controller-run.html)

[《API网关Kong学习笔记（十八）：Kong Ingress Controller的CRD详细说明》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/30/kong-features-18-kong-ingress-controller-crd.html)

[《API网关Kong学习笔记（十九）：Kong的性能测试（与Nginx对比）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/03/kong-features-19-kong-performance.html)

## 定义

`KongIngress`在代码文件github.com/kong/kubernetes-ingress-controller/internal/apis/configuration/v1/types.go中定义：

```go
// github.com/kong/kubernetes-ingress-controller/internal/apis/configuration/v1/types.go中定义
type KongIngress struct {
	metav1.TypeMeta `json:",inline"`
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	Upstream *Upstream `json:"upstream,omitempty"`
	Proxy    *Proxy    `json:"proxy,omitempty"`
	Route    *Route    `json:"route,omitempty"`
}
```

可以看到由三部分组成`Upstream`、`Proxy`、`Route`。

```go
type Upstream struct {
	HashOn       string        `json:"hash_on"`
	HashOnHeader string        `json:"hash_on_header"`
	HashFallback string        `json:"hash_fallback"`
	Healthchecks *Healthchecks `json:"healthchecks,omitempty"`
	Slots        int           `json:"slots"`
}

type Proxy struct {
	Protocol       string `json:"protocol"`
	Path           string `json:"path"`
	ConnectTimeout int    `json:"connect_timeout"`
	Retries        int    `json:"retries"`
	ReadTimeout    int    `json:"read_timeout"`
	WriteTimeout   int    `json:"write_timeout"`
}

type Route struct {
	Methods       []string `json:"methods"`
	RegexPriority int      `json:"regex_priority"`
	StripPath     bool     `json:"strip_path"`
	PreserveHost  bool     `json:"preserve_host"`
	Protocols     []string `json:"protocols"`
}
```

需要注意的是，这里的Upstream、Proxy、Route中都是一些配置参数，不是Kong中的对应对象的完整定义，譬如说，这里明显缺失了Name、Host、以及Path等。这和KongIngress定位是匹配的，KongIngress只是对Kubernetes中原生的Ingress的补充，包含了一些Kong支持的参数。

`Upstream`中设置的是转发时使用的哈希算法，以及slot和健康检查。

`Proxy`中配置的是将请求转发给Upstream对应的Target时的参数，Kong中是没有Proxy这个对象的，这里的Proxy是[Service](https://docs.konghq.com/0.14.x/admin-api/#service-object)的配置项的一部分：转发时使用的协议、转发目标路径、超时时间以及重试次数。

`Route`中设置路由的请求方法、用正则描述的Path的优先级、是否修改Path和Host，和支持的协议等。

[API网关Kong（十六）：Kong转发请求的工作过程][1]

## 参考

1. [API网关Kong（十六）：Kong转发请求的工作过程][1]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-16-work-process.html "API网关Kong（十六）：Kong转发请求的工作过程"
