---
layout: default
title: "API网关Kong学习笔记（十八）：Kong Ingress Controller的CRD详细说明"
author: 李佶澳
createdate: 2018/11/30 10:33:00
changedate: 2018/11/30 10:33:00
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关
description: 这里详细介绍Kkong Ingress Controller定义的CRD的使用方法

---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的学习笔记](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

[API网关Kong学习笔记（二）：Kong与Kubernetes集成的方法][1]中介绍过Kong Ingress Controller定义的`CustomResourceDefinitions`，那时候了解不多，没详细记录用法。把Kong Ingress Controller的代码读了以后，基本上摸清了它的工作过程，这里详细记录一下`KongPlugin`、`KongConsumer`、`KongIngress`和`KongCredential`的用法。

{% include kong_pages_list.md %}

## KongPlugin的用法

KongPlugin的格式如下：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: <object name>
  namespace: <object namespace>
  labels: global: "true" # optional, please note the quotes around true
consumerRef: <optional, name of an existing consumer> # optional
disabled: <boolean>  # optional
config:
    key: value
plugin: <name-of-plugin>
```

Kong实现了很多[插件](https://docs.konghq.com/hub/)，每个插件的配置都不相同，这些不同的配置都体现在`config`中。

`rate-limiting`插件的一个实例可能是这个样子的：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: http-svc-consumer-ratelimiting
consumerRef: consumer-team-x
config:
  hour: 1000
  limit_by: ip
  second: 100
plugin: rate-limiting
```

而`ip-restriction`插件的一个实例可能是下面这个样子：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-ip-restriction
  namespace: demo-echo
disabled: false  # optional
plugin: ip-restriction
config:
#  whitelist:     #用“,”间隔的一组IP或者CIDR，要么白名单、要么黑名单
  blacklist: 192.168.33.12,172.16.129.1
```

它们的`config`字段的结构是不同的，每个插件的config字段中可以有哪些配置，在每个插件插件的文档中可以找到：[rate-limiting](https://docs.konghq.com/hub/kong-inc/rate-limiting/)，[ip-restriction](https://docs.konghq.com/hub/kong-inc/ip-restriction/)。

## KongIngress的用法

`KongIngress`中是一些`增强配置`的，这一点要特别注意。kong ingress controller会将kubernetes中原生定义的ingress转换成kong中的配置，但是kong的配置是要多于标准ingress中的内容的，多出的这些配置在KongIngress中设置。

KongIngress的结构如下，由`upstream`、`proxy`和`route`三部分组成：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongIngress
metadata:
  name: configuration-demo
upstream:
  hash_on: none
  hash_fallback: none
  healthchecks:
    active:
      concurrency: 10
      healthy:
        http_statuses:
        - 200
        - 302
        interval: 0
        successes: 0
      http_path: "/"
      timeout: 1
      unhealthy:
        http_failures: 0
        http_statuses:
        - 429
        interval: 0
        tcp_failures: 0
        timeouts: 0
    passive:
      healthy:
        http_statuses:
        - 200
        successes: 0
      unhealthy:
        http_failures: 0
        http_statuses:
        - 429
        - 503
        tcp_failures: 0
        timeouts: 0
    slots: 10
proxy:
  protocol: http
  path: /
  connect_timeout: 10000
  retries: 10
  read_timeout: 10000
  write_timeout: 10000
route:
  methods:
  - POST
  - GET
  regex_priority: 0
  strip_path: false
  preserve_host: true
  protocols:
  - http
  - https
```

`upstream`中配置的负载均衡算法、健康检查方法等，`proxy`中设置的kong与backend server通信的时超时时间、重试次数等，`route`中设置的是路由匹配的协议、方法以及路由的优先级。

## 参考

1. [API网关Kong学习笔记（二）：Kong与Kubernetes集成的方法][1]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html#customresourcedefinitions  "API网关Kong学习笔记（二）：Kong与Kubernetes集成的方法" 
