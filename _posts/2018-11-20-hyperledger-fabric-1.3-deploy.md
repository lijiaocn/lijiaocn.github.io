---
layout: default
title:  "超级账本HyperLedger：Fabric 1.3部署使用"
author: 李佶澳
createdate: 2018/11/20 22:23:00
changedate: 2018/11/20 22:23:00
categories: 编程
tags: 视频教程 HyperLedger
keywords: HyperLedger,Fabric,1.3,部署安装
description: 

---

* auto-gen TOC:
{:toc}

## 说明

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。

## Fabric 1.3的新特性

[What’s new in v1.3][1]中介绍了Fabric 1.3的新特性。

这里直接用源代码编译，如果你不想自己编译，可以从[ https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/ ](https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/ )中可以下载已经编译好的文件。

	git clone https://github.com/hyperledger/fabric.git
	git checkout -t origin/release-1.3 -b release-1.3
	# 或者使用更确定的版本
	# git checkout v1.3.0

编译：

	make all

## 参考

1. [What’s new in v1.3][1]
2. [文献2][2]

[1]: https://hyperledger-fabric.readthedocs.io/en/release-1.3/whatsnew.html "What’s new in v1.3" 
[2]: 2.com  "文献1" 
