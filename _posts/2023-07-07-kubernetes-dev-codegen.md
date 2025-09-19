---
layout: default
title: "kubernetes 开发：代码生成工具"
author: 李佶澳
date: "2023-07-07 11:41:17 +0800"
last_modified_at: "2023-07-07 14:57:53 +0800"
categories: 编程
cover:
tags: kubernetes
keywords:
description: "kubernetes 项目中一些通用的代码，比如资源的 DeepCopy 函数、ClientSet、Informer 等是通过脚本自动生成的，相关脚本是 hack/update-codegen.sh"
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

kubernetes 项目中一些通用的代码，比如资源的 DeepCopy 函数、ClientSet、Informer 等是通过脚本自动生成的，相关脚本是 [hack/update-codegen.sh][4]。kubernestes 的 Makefile 以及 hack 中脚本内容比较繁杂，这里直接跳过，只需要知道他们最终使用 [github.com/kubernetes/code-generator][2] 中的命令生成代码。

## code-generator

code-generator 实现代码位于 kubernetes/staging/src/k8s.io/code-generator 中，跟随 kubernetes 的版本发布被同步到独立的 repo [github.com/kubernetes/code-generator][2]。

code-generator 提供了多个命令，分别用于生成不同代码：

![code-generator cmds]({{ site.article }}/k8s_code_gen.png)

## gengo

code-generator 中一部分比较通用的代码生成是通过 [gengo][3] 实现的。gengo 中给出了几个代码生成示范：

![gengo exmaple]({{ site.article }}/gengo.png)

## 参考

1. [李佶澳的博客][1]
2. [github.com/kubernetes/code-generator][2]
3. [github.com/kubernetes/gengo][3]
4. [hack/update-codegen.sh][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://github.com/kubernetes/code-generator "github.com/kubernetes/code-generator"
[3]: https://github.com/kubernetes/gengo "github.com/kubernetes/gengo"
[4]: https://github.com/kubernetes/kubernetes/blob/release-1.27/hack/update-codegen.sh "hack/update-codegen.sh"
