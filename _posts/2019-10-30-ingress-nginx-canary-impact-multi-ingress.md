---
layout: default
title: "kubernetes ingress-nginx 的 canary 影响指向同一个 service 的所有 ingress"
author: 李佶澳
date: "2019-10-30 11:03:45 +0800"
last_modified_at: "2019-10-30 11:39:27 +0800"
categories: 问题
cover: 
tags: kubernetes_problem 
keywords: kubernetes,ingress-nginx,canary,金丝雀发布
description: 使用不同 host 的 ingress 指向同一个 service，一个启用金丝雀功能，全都受影响
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

这是 [ingress-nginx 的金丝雀（canary）发布功能][2] 的配套笔记。

当前版本（0.26.1）的 ingress-nginx 的金丝雀功能存在一个问题，[#4667][3]：

>几个使用不同 host 的 ingress 指向同一个 service 时，如果其中一个 ingress 启用了金丝雀功能，其它的 ingress 都会被动启用金丝雀，请求会被转发给金丝雀版本。

[#4667][3] 对该问题有描述。

## 原因分析

用 ingress-nginx 容器中的 dbg 查看 backends 会发现，启用了金丝雀功能的 backend 中有一个 alternativeBackends，alternativeBackends 就是金丝雀版本的 backend。

```sh
$ kubectl -n ingress-nginx exec nginx-ingress-controller-xxx /dbg backends  get canary.echo.example-demo-echo-echo-80
{
  "alternativeBackends": [
    "canary.echo.example-demo-echo-http-record-80"
  ],
  "endpoints": [
    {
      "address": "172.17.0.21",
      "port": "8080"
    }
  ],
  ...
```

在 ingress-nginx 中的 backends 在代码中对应的是 uptream，uptream 的命名方式是 “namespace-service-port”，因此使用相同的 service 的 ingress，即使使用了不同的域名也会指向相同的 upstream。

当前实现中将金丝雀版本的信息存放在 backends 中，这就出现了问题。ingress A 和 ingress B 使用同样的 service，对应同一个 backend，当 ingress A 启用了金丝雀时，会在与 B 共用的  backend 中设置 alternativeBackends，从而到 ingress B 的请求也被转发给了金丝雀版本。

## 解决方法

[4668](https://github.com/kubernetes/ingress-nginx/pull/4668) 提出了一种解决方法：修改 uptream 的名称格式，包含 host，规避共用 backends 的情况。

[4716](https://github.com/kubernetes/ingress-nginx/pull/4716) 的解决方式更好：将金丝雀的信息从 uptream 移动到 location 中，只在启用 canary 的 ingress 中起作用。

4716 还没有合并到 master 中 @2019-10-30 11:37:14。

## 参考

1. [李佶澳的博客][1]
2. [ingress-nginx 的金丝雀（canary）发布功能][2]
3. [An Ingress with canary will impact all ingresses with same service][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/canary.html "ingress-nginx 的金丝雀（canary）发布功能"
[3]: https://github.com/kubernetes/ingress-nginx/issues/4667 "An Ingress with canary will impact all ingresses with same service "
