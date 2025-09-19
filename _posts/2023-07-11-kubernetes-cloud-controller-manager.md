---
layout: default
title: "kubernetes 扩展：Cloud Controller Manager"
author: 李佶澳
date: "2023-07-11 17:18:26 +0800"
last_modified_at: "2023-07-11 19:22:10 +0800"
categories:
cover:
tags: kubernetes
keywords:
description: "Cloud Controller Manager 主要用于 kubernetes 和云平台的对接，监听 kubernetes 中的 Node、Service 等资源的状态，然后调用云平台的接口完成相应设置。"
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

[Cloud Controller Manager][2] 主要用于 kubernetes 和云平台的对接，监听 kubernetes 中的 Node、Service 等资源的状态，然后调用云平台的接口完成相应设置。

下图中的 c-c-m 即 cloud controller manager：

![kubernetes构成]({{ site.article }}/components-of-kubernetes.svg)

## 实现

kubernetes 定义了一份 cloud-provider interface，并给出了一个默认实现：

* [github.com/kubernetes/cloud-provider][3]

代码结构比较简单，主要就是监听 Node 变化从 cloud-provider 同步 node 属性、设置 node 间路由以及为 Service 在 cloud 中配置 load balancer 等。

## 参考

1. [李佶澳的博客][1]
2. [Cloud Controller Manager][2]
3. [github.com/kubernetes/cloud-provider][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://kubernetes.io/docs/concepts/architecture/cloud-controller/ "Cloud Controller Manager"
[3]: https://github.com/kubernetes/cloud-provider "github.com/kubernetes/cloud-provider"
