---
layout: default
title:  超级账本HyperLedger：Fabric的Chaincode开发过程中遇到的问题
author: 李佶澳
createdate: 2018/07/20 16:22:00
changedate: 2018/09/01 15:15:31
categories: 问题
tags: HyperLedger
keywords: Chaincode,智能合约,HyperLedger,链码开发
description: 这里记录在开发ChainCode的过程中遇到的一些问题，以及解决方法。

---

* auto-gen TOC:
{:toc}

## 说明

这是网易云课堂“[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。讲解视频位于[《HyperLedger Fabric进阶实战课》第四章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)。演示用的合约代码托管在在Github上：[合约代码][1]。

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

## 本地编译报错: undefined: tar.FormatPAX

写完ChainCode后，在本地编译时报错：

	go build
	# github.com/hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive
	../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:364:5: hdr.Format undefined (type *tar.Header has no field or method Format)
	../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:364:15: undefined: tar.FormatPAX
	../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:1166:7: hdr.Format undefined (type *tar.Header has no field or method Format)
	../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:1166:17: undefined: tar.FormatPAX
	lijiaos-MacBook-Pro:demo lijiao$ cd ../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:364:5: hdr.Format undefined (type *tar.Header has no field or method Format)

报错的代码是docker的代码：

	 355 // FileInfoHeader creates a populated Header from fi.
	 356 // Compared to archive pkg this function fills in more information.
	 357 // Also, regardless of Go version, this function fills file type bits (e.g. hdr.Mode |= modeISDIR),
	 358 // which have been deleted since Go 1.9 archive/tar.
	 359 func FileInfoHeader(name string, fi os.FileInfo, link string) (*tar.Header, error) {
	 360 |   hdr, err := tar.FileInfoHeader(fi, link)
	 361 |   if err != nil {
	 362 |   |   return nil, err
	 363 |   }
	 364 |   hdr.Format = tar.FormatPAX

本地使用的go版本是1.9.2：

	$ go version
	go version go1.9.2 darwin/amd64

查看本地HyperLedger代码，发现是最新的release-1.2的代码：

	$ cd ../../../hyperledger/fabric
	$ git branch
	  release-1.1
	* release-1.2

HyperLedger 1.2使用的是go1.10，所以需要升级本地Go版本，或者将HyperLedger代码切换为1.1版本。

>使用go get拉取代码时，会直接拉取依赖代码的最新版本，所以直接拉取了Hyperledger 1.2版本的代码。

因为我的目标环境是1.1的，所以将HyperLedger代码切换回到1.1解决：

	$ cd ../../../hyperledger/fabric
	$ git branch release-1.1 -t origin/release-1.1
	$ git checkout release-1.1

## 参考

1. [《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》][1]
2. [《超级账本HyperLedger：Fabric Chaincode（智能合约、链码）开发方法》][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/17/hyperledger-fabric-chaincodes-example.html "《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/05/hyperledger-fabric-chaincode.html  "《超级账本HyperLedger：Fabric Chaincode（智能合约、链码）开发方法》" 
