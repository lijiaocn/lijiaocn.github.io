---
layout: default
title:  "【视频】超级账本HyperLedger：Fabric源码走读(零)：源代码阅读环境准备"
author: 李佶澳
createdate: 2018/07/17 09:52:00
changedate: 2018/07/26 19:34:52
categories: 项目
tags: HyperLedgerCode 视频教程
keywords: 区块链,源代码走读,Hyperledger,超级账本,Fabric
description: 超级账本HyperLedger Fabric源代码走读第一部分，准备源代码阅读环境。

---

* auto-gen TOC:
{:toc}

## 说明

这是网易云课堂“[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。“工欲善其事，必先利其器”，这一节我们准备好源代码，以及阅读源代码的工具。可以根据自己的喜好选择IDE，这里使用的安装了go插件的IntelliJ IDEA。

**相关笔记**，都是一边学习一边记录的，时间紧难免粗糙，[查看更多相关内容](https://www.lijiaocn.com/tags/blockchain.html)：

[《超级账本HyperLedger：超级账本工作组旗下项目介绍》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/08/hyperledger-projects-intro.html)

[《超级账本HyperLedger：Fabric掰开揉碎，一文解惑》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/25/hyperledger-fabric-main-point.html)

[《超级账本HyperLedger：Fabric的基本概念与基础用法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/02/23/hyperledger-fabric-usage.html)

[《【视频】超级账本HyperLedger：Fabric的全手动、多服务器部署教程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html)

[《【视频】超级账本HyperLedger：使用Ansible进行Fabric多节点分布式部署（实战）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/09/hyperledger-fabric-ansible-deploy.html)

[《【视频】超级账本HyperLedger：Fabric从1.1.0升级到1.2.0》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/19/hyperledger-fabric-1-2-0.html)

[《【视频】超级账本HyperLedger：Fabric使用kafka进行区块排序（共识）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/28/hyperledger-fabric-orderer-kafka.html)

[《【视频】超级账本HyperLedger：为Fabric的Peer节点配置CouchDB》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/19/hyperledger-fabric-with-couchdb.html)

[《超级账本HyperLedger：FabricCA的基本概念与用法讲解》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html)

[《超级账本HyperLedger：FabricCA的级联使用（InterMediateCA）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/09/hyperledger-fabric-ca-cascade.html)

[《【视频】超级账本HyperLedger：Fabric-CA的使用演示(两个组织一个Orderer三个Peer)》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html)

[《超级账本HyperLedger：Fabric Chaincode（智能合约、链码）开发方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/05/hyperledger-fabric-chaincode.html)

[《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/17/hyperledger-fabric-chaincodes-example.html)

[《【视频】超级账本HyperLedger：Fabric Go SDK的使用》](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/07/28/hyperledger-fabric-sdk-go.html)

[《【视频】超级账本HyperLedger：Fabric nodejs SDK的使用》](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/04/25/hyperledger-fabric-sdk-nodejs.html)

[《超级账本HyperLedger：Fabric Channel配置的读取转换》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/19/hyperledger-channel-config-operation.html)

[《【视频】超级账本HyperLedger：Fabric进阶，在已有的Channel中添加新的组织》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/18/hyperledger-fabric-add-new-org.html)

[《超级账本HyperLedger：Explorer安装使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-explorer.html)

[《超级账本HyperLedger：Cello部署和使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/25/hyperledger-cello.html)

[《超级账本HyperLedger：Fabric部署过程时遇到的问题汇总》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/04/25/hyperledger-fabric-problem.html)

[《超级账本HyperLedger：Fabric的Chaincode开发过程中遇到的问题》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/20/hyperledger-fabric-chaincode-problem.html)

[《超级账本HyperLedger：Fabric Node.js SDK使用时遇到的问题》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/15/hyperledger-fabric-nodejs-problem.html)

[《超级账本HyperLedger：Fabric Golang SDK使用时遇到的问题》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/15/hyperledger-fabric-golang-problem.html)

[《超级账本HyperLedger：Fabric 1.2.0使用时遇到的问题》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/25/hyperledger-fabric-1-2-0-problems.html)

## Go开发环境准备

到[golang.org](https://golang.org)或者[www.golangtc.com](https://www.golangtc.com)下载Go安装文件。

下载后解压即可：

	$ mkdir -p ~/Work/Bin/go-1.10.3
	$ cd ~/Work/Bin/go-1.10.3
	$ wget https://dl.google.com/go/go1.10.3.darwin-amd64.tar.gz  (这里下载的是mac版)
	$ tar -xvf go1.10.3.darwin-amd64.tar.gz

准备存放源代码的GOPATH目录：

	$ mkdir -p ~/Work/Bin/gopath/{src,pkg,bin}

在~/.bash_profile中设置环境变量：

	export PATH="/Users/lijiao/Work/Bin/go-1.10.3/go/bin:$PATH"
	export GOROOT="/Users/lijiao/Work/Bin/go-1.10.3/go"
	export GOPATH="/Users/lijiao/Work/Bin/gopath"
	export PATH="$GOPATH/bin/:$GOPATH:$PATH"

更新：

	source ~/.bash_profile

## IntelliJ IDEA阅读环境准备

### 安装golang插件

1 打开Idea -> Perferences，点击“Plugins”，打开插件管理窗口

2 点击“ Browse repositories”，打开插件仓库管理窗口

3 在“Browse repositories”窗口搜索名为`"Go"`的插件，安装即可（注意不要用名为Golang的插件）

4 安装插件之后，重启idea。

插件安装期间，idea最底部会显示安装进度，如果提示超时安装失败，可能需要翻qiang。

如果习惯用vim，还可以安装一个vim插件。

### 设置Go语言的SDK

打开Idea -> Perferences -> Languages & Frameworks -> Go

分别设置GOROOT和GOPATH，以及保存时的动作。

	GOROOT指定使用Go安装文件目录
	GOPATH指定用来存放Go代码、以及编译文件的目录

可以在GOPATH中添加多个路径。

Go插件使idea具有goland的所有功能。

语法高亮到Perferences -> Editor -> Colors & Fonts -> Go中设置。

### 导入HyperLedger Fabric源码

用git下载源代码：

	mkdir -p $GOPATH/src/github.com/hyperledger
	cd $GOPATH/src/github.com/hyperledger
	git clone https://github.com/hyperledger/fabric.git

然后打开Idea，创建一个新的项目，类型为Go，选择好SDK，路径设置为刚下载的源码所在的目录。

通过Idea右下角的git图标，可以切换源代码的分支和Tag。

## Vim阅读环境准备

还可以使用Vim阅读代码，Vim的配置过程略微复杂，可以直接使用我已经配置的[插件包][1]。

	git clone --recursive https://github.com/lijiaocn/vim-config.git
	cd vim-config/vim
	./install.sh

## 参考

1. [vim插件包][1]

[1]: https://github.com/lijiaocn/vim-config  "https://github.com/lijiaocn/vim-config" 

