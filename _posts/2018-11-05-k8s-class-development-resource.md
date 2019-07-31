---
layout: default
title: "Kubernetes1.12从零开始（七）：kubernetes开发资源"
author: 李佶澳
createdate: 2018/11/05 20:43:00
last_modified_at: 2018/11/11 18:42:19
categories: 项目
tags: 视频教程 kubernetes
keywords: kubernetes,从零部署,deploy,kubernetes视频教程,kubernetes系列教程
description: Kubernetes提供了一些开发资源，需要与Kubernetes对接的时候，可以考虑使用这些社区维护的资源。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

本系列`所有文章`可以在**[系列教程汇总](https://www.lijiaocn.com/tags/class.html)**中找到，`演示和讲解视频`位于**[网易云课堂·IT技术快速入门学院 ](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)**，`课程说明`、`资料`和`QQ交流群`见 **[Kubernetes1.12从零开始（初）：课程介绍与官方文档汇总](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/01/k8s-class-kubernetes-intro.html#说明)**，探索过程遇到的问题记录在：[Kubernetes1.12从零开始（一）：遇到的问题与解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html)。

Kubernetes提供了一些开发资源，需要与Kubernetes对接的时候，可以考虑使用这些社区维护的资源。

## client-go

[kubernetes client-go](https://github.com/kubernetes/client-go)是最常用的kubernetes的go client。

使用时需要注意的client-go的版本与kubernetes的集群的版本是否兼容。

不兼容的情况有两种，一种是client-go中的特性，kubernetes不支持，另一中kubernetes的特性，client-go不包含。

兼容情况见：[Client与Kubernetes的适配情况](https://github.com/kubernetes/client-go#compatibility-matrix)

## api

[api](https://github.com/kubernetes/api)是Kubernetes的API参数的定义。

`This repo is still in the experimental stage.` 2018-11-05 13:02:26

## apiserver

[apiserver](https://github.com/kubernetes/apiserver)是一个用来编写kubernetes的apiserver风格的libarry。

## apiextensions-apiserver

[apiextensions-apiserver](https://github.com/kubernetes/apiextensions-apiserver)用来实现注册`CustomResourceDefinitions`API的代码。

## apimachinery

[apimachinery](https://github.com/kubernetes/apimachinery)用来编码、解码、以及转换Kubernetes样式的API参数。

## kube-openapi

[kube-openapi](https://github.com/kubernetes/kube-openapi)用来生成OpenAPI相关的定义。
