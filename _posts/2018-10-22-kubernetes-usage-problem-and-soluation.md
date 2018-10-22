---
layout: default
title:  Kubernetes使用过程中遇到的一些问题与解决方法
author: 李佶澳
createdate: 2018/10/22 14:25:00
changedate: 2018/10/22 14:25:00
categories: 问题
tags: kubernetes
keywords: kubernetes,问题记录
description: 这里记录Kubernetes使用过程中遇到的一些比较的问题与解决方法

---

* auto-gen TOC:
{:toc}

## 说明

这里记录Kubernetes使用过程中遇到的一些`比较简单`的问题与解决方法，比较复杂的问题会单独分析：[关于Kubernetes的所有文章](https://www.lijiaocn.com/tags/kubernetes.html)。

## kubectl exec登陆容器后，shell终端窗口宽度太小

这个其实不是kubectl的问题，而是shell终端的问题，在shell终端中可以通过变量`COLUMNS`修改宽度：

	export COLUMNS=210

这个变量可以进入容器后设置，也可以在执行exec命令时传入，例如：

	kubectl exec -ti busybox -- env COLUMNS=500 LINES=100 bash 

参考：[解决kubectl exec terminal size问题](http://ju.outofmemory.cn/entry/331098)
