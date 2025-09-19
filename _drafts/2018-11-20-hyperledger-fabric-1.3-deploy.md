---
layout: default
title:  "超级账本HyperLedger：Fabric 1.3部署使用"
author: 李佶澳
createdate: 2018/11/20 22:23:00
last_modified_at: 2018/11/20 22:23:00
categories: 编程
tags: 视频教程 HyperLedger
keywords: HyperLedger,Fabric,1.3,部署安装
description: 

---

* auto-gen TOC:
{:toc}

## 说明

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。

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
