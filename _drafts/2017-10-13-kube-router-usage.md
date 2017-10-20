---
layout: default
title: kube-router的使用
author: lijiaocn
createdate: 2017/10/13 17:28:23
changedate: 2017/10/20 10:07:22
categories: 项目
tags: kube-router
keywords: 
description: 

---

* auto-gen TOC:
{:toc}

## 说明

[kube-router][1]是一个挺有想法的项目，兼备了calico和kube-proxy的功能。

## 编译

[kube-router developer guild][2]很详细的介绍了编译的过程。

## 原理

使用ipvs，将访问service的流量分发给pod。

使用iptables、ipset实现network policy。

使用gobgp实现pod的网络。

## 参考

1. [kube-router][1]
2. [kube-router developer guild][2]

[1]: https://github.com/cloudnativelabs/kube-router  "kube-router" 
[2]: https://github.com/cloudnativelabs/kube-router/blob/master/Documentation/developing.md "kube-router developer guide"
