---
layout: default
title:  "【视频】超级账本HyperLedger：Fabric源码走读(一)：项目构建与代码结构"
author: 李佶澳
createdate: 2018/11/18 14:26:00
changedate: 2018/11/18 14:26:00
categories: 项目
tags: HyperLedgerCode 视频教程
keywords: 区块链,源代码走读,Hyperledger,超级账本,Fabric
description: 超级账本HyperLedger Fabric源代码走读第一部分，这里梳理一下HyperLedger Fabric项目的代码结构。
---

* auto-gen TOC:
{:toc}

## 说明

这是网易云课堂“[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。系列文章可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到。

这里梳理一下HyperLedger Fabric项目的代码结构。

这里分析的代码是Fabric 1.3：

```bash
git clone https://github.com/hyperledger/fabric.git
git branch release-1.3 -t origin/release-1.3
git checkout  release-1.3
```

下载代码后，先用`dep`命令更新一下依赖代码，需要翻qiang：

	dep ensure

dep命令的使用参考：[Go语言简明手册：依赖代码管理](https://go.lijiaocn.com/chapter04/01-dependency.html)

## 编译方法

在开始之前，先了解一下fabric项目是如何编译的，这样才能知道要从哪里开始看代码，修改的代码要怎样生效的。

fabric的README.md文件中没有介绍编译的方法，通过查看`Makefile`文件，得知可以用以下命令：

```bash
make all          # 编译所有目标，并进行测试
make peer         # 编译某一个组件
make release      # 为当前平台编译所有组件
make release-all  # 为所有支持的目标平台编译所有组件
...
```

Makefile中一些变量的含义，可以到[make：编译管理工具make与makefile](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2012/10/29/linux-tool-make.html)中查找。

## make peer

执行一些make peer：

```bash
$ make peer
.build/bin/peer
CGO_CFLAGS=" " GOBIN=/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric/.build/bin go install -tags "" -ldflags "-X github.com/hyperledger/fabric/common/metadata.Version=1.3.1 -X github.com/hyperledger/fabric/common/metadata.CommitSHA=6c073551a -X github.com/hyperledger/fabric/common/metadata.BaseVersion=0.4.13 -X github.com/hyperledger/fabric/common/metadata.BaseDockerLabel=org.hyperledger.fabric -X github.com/hyperledger/fabric/common/metadata.DockerNamespace=hyperledger -X github.com/hyperledger/fabric/common/metadata.BaseDockerNamespace=hyperledger -X github.com/hyperledger/fabric/common/metadata.Experimental=false" github.com/hyperledger/fabric/peer
Binary available as .build/bin/peer
```

可以看到peer对应的源代码目录是`github.com/hyperledger/fabric/peer`。

其它组件类似

## make release 和 make release-all

编译后的组件位于release目录中，每个平台一个目录：
 
```bash
$ ls release/darwin-amd64/bin/
configtxgen          discover             orderer
configtxlator        get-docker-images.sh peer
cryptogen            idemixgen
```

## 后续

编译过程很简单，代码入口也很找，一眼就看明白了。视频[HyperLedger Fabric进阶实战课](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)中稍微展开讲了下，主要针对对编译过程没有感性认识的朋友。

后续抽时间看代码，会在这里补充一些内容，当然重要的内容会开新的页面记录。
