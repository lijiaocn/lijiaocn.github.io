---
layout: default
title: "google cloud & firebase: 后端服务慈善家"
categories: "solo-income"
author: 李佶澳
tags: [独立赚钱]
keywords: 独立赚钱,google cloud,firebase
description: Google Cloud 提供了大量免费额度的后端服务，包括计算、消息、存储等，这些免费额度能满足早期资源需求。Firebase提供了一套完整的应用开发解决方案。
---

## 目录

* auto-gen TOC:
{:toc}

## 目标

开始考虑一个较复杂的多端应用的实现，需要确定应用的后端服务。

## Google Cloud 

通过和 gemini 的一通交流，意外发现 Google Cloud 简直是后端服务慈善家，计算/消息/存储等很多服务都有免费额度，这些免费额度就能满足早期的资源需求。

### Cloud Run

* 不仅有免费资源额度，还直接提供可以对外带 https 地址，直接就可以作为网页或者 app 的后端请求地址。
* 可以用来运行 worker，能够无缝对接 gcloud 的消息服务。
* 支持从 github 仓库构建，会自动创建触发器，代码提交后就触发构建和部署，CICD 也具有了
* 自动采集标准输出日志
* 直接引用 google cloud 提供的 opentelmetry exporter，就可以无缝对接 metrics explorer 和 trace explorer

可观测 tips:

* meter或者tracer的 provider 定义时指定 service_name 标签：semconv.ServiceNameKey.String("cloudrun-demo")
* http请求返回头 x-cloud-trace-context: 9f395ca841e135a66939c1767b9bb087;o=1 中记录就是 trace id, o=1表示这个请求被trace采样了
* 在 log exporter 中可以通过 trace id 查询
* 在 metric exporter 中用 PromQL 语句查询指标原始数据
* 定义的指标 meter.Int64Counter("http.server.requests") 在 metrics explorer 中对应为：{"__name"="workload.googleapis.com/http.server.requests"}
* 使用 slog 打印日志，并且从 ctx 中提取出 trace_id/span_id 

### Cloud Pub/Sub

Cloud Pub/Sub 每个月有 10G 的免费流量，

### FireStore

一个 NoSQL 数据库，同样有免费额度。

### Cloud Load Balance

这个没有免费额度，但是价格也不贵，直接就能获得一个全球任播 ip。

[Cloud Load Balancing 概览](https://cloud.google.com/load-balancing/docs/load-balancing-overview?_gl=1*1g9pfya*_up*MQ..&gclid=CjwKCAjwup3HBhAAEiwA7euZuhm_UY7MIFTcvrLBpkhJeL7GxlWz7AtWjcpqfDPQ8EmIMLzQScfg8hoCJyEQAvD_BwE&gclsrc=aw.ds&hl=zh-cn)


## Firebase

搞清楚了 Firebase 的用法以后，有一种饭送到了嘴边的幸福感，这个全套方案太实用了。就是入门文档实在不怎么样，对此完全不懂的我费了不少时间才搞清楚怎么个用法。
下面是几个关键tips：

* firebase提供给客户端/网页端的是一组 sdk。客户端/网页端可以通过 firebase 的 sdk 实现用户注册/认证、文档数据库操作、对象存储操作等等。
* 用户登陆方式/数据库/存储等在 firebase 控制台上配置
* 在 firebase 控制台给文档数据库、对象存储配置安全规则，控制用户可以操作的数据范围，比如只能操作当前 UserID 路径下数据
* 在 firebase 后台中可以添加云函数，客户端可以调用云函数，云函数还可以监听文档数据库的操作事件等

关于 firebase 的具体使用见下一篇。

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"