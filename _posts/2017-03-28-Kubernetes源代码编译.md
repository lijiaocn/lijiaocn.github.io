---
layout: default
title: Kubernetes源代码编译
author: lijiaocn
createdate: 2017/03/28 10:01:38
changedate: 2017/03/28 13:02:43
categories:
tags: k8s
keywords: kubernetes,源代码,编译
description: Kubernetes源代码编译

---

* auto-gen TOC:
{:toc}

## 要求
 
[Kubernetes Development Guild][2]中给出了对Golang版本对要求。

Kubernetes     requires Go
----------------------------
1.0 - 1.2        1.4.2
1.3, 1.4         1.6
1.5 and higher   1.7 - 1.7.5
                 1.8 not verified as of Feb 2017

## 直接编译

	go get k8s.io/kubernetes/kubernetes

编译hyperkube

	cd $GOPATH/k8s.io/kubernetes/cmd/hyperkube
	go build

## 参考

1. [kubernetes README][1]
2. [kubernetes Development Guilde][2]

[1]: https://github.com/kubernetes/kubernetes  "kubernetes REAMDME.md" 
[2]: https://github.com/kubernetes/community/blob/master/contributors/devel/development.md "kubernetes development"
