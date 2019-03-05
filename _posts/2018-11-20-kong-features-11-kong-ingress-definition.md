---
layout: default
title: "API网关Kong学习笔记（十五）：KongIngress的定义细节"
author: 李佶澳
createdate: "2018-11-20 16:43:45 +0800"
changedate: "2019-03-05 14:59:09 +0800"
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

{% include kong_pages_list.md %}

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
