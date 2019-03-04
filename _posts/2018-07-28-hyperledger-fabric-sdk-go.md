---
layout: default
title:  "【视频】超级账本HyperLedger：Fabric Go SDK的使用"
author: 李佶澳
createdate: 2018/07/28 13:34:00
changedate: 2018/07/29 13:09:57
categories: 编程
tags: 视频教程 HyperLedger
keywords: 超级账本,视频教程演示,区块链实践,hyperledger,fabric接口,golang
description: HyperLedger Fabric的Golang SDK终于调通了，眼泪哗哗地。。

---

* auto-gen TOC:
{:toc}

## 说明

HyperLedger Fabric的Golang SDK终于调通了，眼泪哗哗地。。 @2018-07-28 13:36:06

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。操作、配置文件和代码讲解视频在[网易云课堂《HyperLeger Fabric进阶实战课》第五章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)中。

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

## 获取示例代码

源代码托管在github: [源代码地址](https://github.com/introclass/hyperledger-fabric-sdks-usage)，[fabric-sdk-go](https://github.com/hyperledger/fabric-sdk-go)

	go get github.com/introclass/hyperledger-fabric-sdks-usage
	cd $GOPATH/src/github.com/introclass/hyperledger-fabric-sdks-usage/go

## 准备msp和tls证书

将你自己环境的`crypto-config`复制到`hyperledger-fabric-sdks-usage/go`中。

crypto-config中只需要包含`需要的`msp和tls证书，需要哪些证书在调用go-sdk的程序使用的config.yaml中指定了。

## 查询合约

01-query中通过go-sdk做了一个最简单操作：链接peer，调用合约，查询账本。

	$ cd 01-query
	
	$ ./01-query
	AdminIdentify is found:
	&{Admin peers.member1.example.com [45 45 45 45 45 66 69 71 73 78
	...
	69 45 45 45 45 45 10] 0xc420329a90}
	response is key1value

源代码如下：

	package main
	
	import (
		"fmt"
		"github.com/hyperledger/fabric-sdk-go/pkg/client/channel"
		mspclient "github.com/hyperledger/fabric-sdk-go/pkg/client/msp"
		"github.com/hyperledger/fabric-sdk-go/pkg/core/config"
		"github.com/hyperledger/fabric-sdk-go/pkg/fabsdk"
		"log"
	)
	
	func main() {
	
		//读取配置文件，创建SDK
		configProvider := config.FromFile("./config.yaml")
		sdk, err := fabsdk.New(configProvider)
		if err != nil {
			log.Fatalf("create sdk fail: %s\n", err.Error())
		}
	
		//读取配置文件(config.yaml)中的组织(member1.example.com)的用户(Admin)
		mspClient, err := mspclient.New(sdk.Context(), mspclient.WithOrg("member1.example.com"))
		if err != nil {
			log.Fatalf("create msp client fail: %s\n", err.Error())
		}
	
		adminIdentity, err := mspClient.GetSigningIdentity("Admin")
		if err != nil {
			log.Fatalf("get admin identify fail: %s\n", err.Error())
		} else {
			fmt.Println("AdminIdentify is found:")
			fmt.Println(adminIdentity)
		}
	
		//调用合约
		channelProvider := sdk.ChannelContext("mychannel",
			fabsdk.WithUser("Admin"),
			fabsdk.WithOrg("member1.example.com"))
	
		channelClient, err := channel.New(channelProvider)
		if err != nil {
			log.Fatalf("create channel client fail: %s\n", err.Error())
		}
	
		var args [][]byte
		args = append(args, []byte("key1"))
	
		request := channel.Request{
			ChaincodeID: "mycc",
			Fcn:         "query",
			Args:        args,
		}
		response, err := channelClient.Query(request)
		if err != nil {
			log.Fatal("query fail: ", err.Error())
		} else {
			fmt.Printf("response is %s\n", response.Payload)
		}
	}

## 参考

1. [Tutorial Hyperledger Fabric SDK Go: How to build your first app?][1]

[1]: https://chainhero.io/2018/06/tutorial-build-blockchain-app-v1-1-0/  "Tutorial Hyperledger Fabric SDK Go: How to build your first app?" 
