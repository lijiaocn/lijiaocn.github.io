---
layout: default
title: "Kubernetes的nginx-ingress-controller刷新nginx的配置滞后十分钟导致504"
author: 李佶澳
createdate: "2019-05-17 19:37:07 +0800"
last_modified_at: "2019-09-16 14:12:26 +0800"
categories: 问题
tags: kubernetes_problem
cover: 
keywords: kubernetes,ingress-controller,ingress,nginx规则慢
description: Kubernetes集群上的应用在重新部署的之后，频繁出现504错误，nginx-ingress-controller刷新配置滞后
---

## 目录
* auto-gen TOC:
{:toc}

## 现象

Kubernetes集群上的应用在重新部署的之后，频繁出现504错误，查询nginx日志发现是nginx到upstream超时。

进一步比对发现，引发超时的upstream的ip是已经被删除的pod的ip，nginx的配置更新严重滞后，长达10分钟，并且三台ingress-controller的延迟情况不相同。

## 开始分析

查看ingress-controller自身的日志没有遇到可以信息。

查看kube-controlle-manager日志，pod重建很及时，没有异常。

查看kube-apiserver日志，发现有下面的错误：

```sh
May 11  W0511 12:16:48.055669   12085 mastercount.go:135] Resetting endpoints for master service "kubernetes" to &{ } {kubernetes  default /api/v1/namespaces/
May 11  W0511 12:16:58.126750   12085 mastercount.go:135] Resetting endpoints for master service "kubernetes" to &{ } {kubernetes  default /api/v1/namespaces/
May 11  I0511 12:16:58.672825   12085 trace.go:76] Trace[448669459]: "List /api/v1/pods" (started: 2019-05-11 12:16:58.140742684 +0800 CST m=+9321924.400299946
May 11  Trace[448669459]: [457.075423ms] [457.00572ms] Listing from storage done
May 11  I0511 12:16:58.951538   12085 trace.go:76] Trace[1102411702]: "List /api/v1/pods" (started: 2019-05-11 12:16:58.159402971 +0800 CST m=+9321924.41896043
May 11  Trace[1102411702]: [765.172941ms] [765.006482ms] Listing from storage done
May 11  I0511 12:16:59.051044   12085 trace.go:76] Trace[649259613]: "List /api/v1/pods" (started: 2019-05-11 12:16:58.164831739 +0800 CST m=+9321924.424389018
May 11  Trace[649259613]: [846.233181ms] [846.171476ms] Listing from storage done
May 11  I0511 12:16:59.098335   12085 trace.go:76] Trace[1034542772]: "List /api/v1/pods" (started: 2019-05-11 12:16:58.214100403 +0800 CST m=+9321924.47365766
May 11  Trace[1034542772]: [871.610482ms] [871.492514ms] Listing from storage done
May 11  I0511 12:17:06.662729   12085 trace.go:76] Trace[1008287935]: "List /api/v1/pods" (started: 2019-05-11 12:17:05.83139885 +0800 CST m=+9321932.090956328
May 11  Trace[1008287935]: [816.830054ms] [816.678248ms] Listing from storage done
May 11  I0511 12:17:06.665535   12085 trace.go:76] Trace[1786067911]: "List /api/v1/pods" (started: 2019-05-11 12:17:06.001922322 +0800 CST m=+9321932.26147957
May 11  Trace[1786067911]: [649.532267ms] [649.401272ms] Listing from storage done
May 11  W0511 12:17:08.264020   12085 mastercount.go:135] Resetting endpoints for master service "kubernetes" to &{ } {kubernetes  default /api/v1/namespaces/
May 11  W0511 12:17:18.322626   12085 mastercount.go:135] Resetting endpoints for master service "kubernetes" to &{ } {kubernetes  default /api/v1/namespaces/
May 11  I0511 12:17:22.821647   12085 trace.go:76] Trace[1751175724]: "List /api/v1/pods" (started: 2019-05-11 12:17:22.316292977 +0800 CST m=+9321948.57585028
May 11  Trace[1751175724]: [491.955722ms] [491.885932ms] Listing from storage done
```

重点是“Resetting endpoints for master service "kubernetes" ”，kubernetes集群服务的endpoint在不停的被重置，网上找了一下说是因为没有使用[--apiserver-count=N](https://blog.51cto.com/ipcpu/1981771)。

## 验证问题 

检查问题集群中的kube-apiserver，确实没有使用--apiserver-count指定apiserver个数。稳妥起见，没有立即添加这个参数，而是将另外三台apiserver暂时关停，只保留一个apiserver。

这时候，pod的变更能够迅速被ingress-controller感知到，并且三台ingress的配置文件几乎是在同一时间被更新，更新滞后的问题消失。
