---
layout: default
title: "Kubernetes1.12从零开始（一）：遇到的问题与解决方法"
author: 李佶澳
createdate: 2018/10/21 12:06:00
changedate: 2018/10/21 12:06:00
categories: 问题
tags: 视频教程 kubernetes 
keywords: kubernetes,容器集群,docker
description: 这里记录Kubernetes1.12从零开始的过程中遇到的一些问题与解决方法。

---

* auto-gen TOC:
{:toc}

## 说明

这里记录Kubernetes1.12从零开始的过程中遇到的一些问题与解决方法。

所有成系列的文章，都可以在页面[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到。

## Mac上CFSSL执行出错：Failed MSpanList_Insert 0xa0f000 0x19b27193a1671 0x0 0x0

下载的1.2版本的Mac版cfssl：

	curl -L https://pkg.cfssl.org/R1.2/cfssl_darwin-amd64 -o cfssl
	chmod +x cfssl

运行时直接报错：

	$ ./cfssl -h
	failed MSpanList_Insert 0xa0f000 0x19b27193a1671 0x0 0x0
	fatal error: MSpanList_Insert

	runtime stack:
	runtime.throw(0x6bbbe0, 0x10)
		/usr/local/go/src/runtime/panic.go:530 +0x90 fp=0x7ffeefbff3a0 sp=0x7ffeefbff388
	runtime.(*mSpanList).insert(0x9436e8, 0xa0f000)
		/usr/local/go/src/runtime/mheap.go:933 +0x293 fp=0x7ffeefbff3d0 sp=0x7ffeefbff3a0
	runtime.(*mheap).freeSpanLocked(0x942ee0, 0xa0f000, 0x100, 0x0)
	...

根据[runtime: fatal error: MSpanList_Insert on macOS 10.12 ](https://github.com/golang/go/issues/20888)中的说法，这应该是Go的版本不同造成的。我本地的Go版本是1.10.3，下载的cfssl文件，可能是用其它版本的Go编译的。

在[cfssl installation failed in OS X High Sierra](https://github.com/kelseyhightower/kubernetes-the-hard-way/issues/229)中，有人提出同样问题，看了一下回答，一种是建议用brew按照cfssl，一种是建议直接用go get，在本地重新编译。

