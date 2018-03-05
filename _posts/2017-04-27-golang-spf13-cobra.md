---
layout: default
title: "go Library: spf13/cobra(用于命令行程序)"
author: 李佶澳
createdate: 2017/04/27 10:03:27
changedate: 2017/11/08 13:49:19
categories: 编程
tags: golang
keywords: golang,cli,cobra
description: cobra是一个golang的库，用来处理命令行参数,在kuberntes、docker、etcd等多个项目中使用。

---

* auto-gen TOC:
{:toc}

## 概览

[cobra][1]是一个golang的库，用来处理命令行参数,在kuberntes、docker、etcd等多个项目中使用。

使用cobra开发工具的命令行参数格式如下:

	程序名  全局配置参数  子命令  子命令配置参数

## cobra命令

cobra提供了一个命令，用于直接生成程序框架:

	go get github.com/spf13/cobra/cobra

## 

## 参考

1. [cobra-github][1]

[1]: https://github.com/spf13/cobra "https://github.com/spf13/cobra"
