---
layout: default
title:  超级账本HyperLedger：Fabric Golang SDK的使用
author: 李佶澳
createdate: 2018/07/28 13:34:00
changedate: 2018/07/28 14:31:18
categories: 编程
tags: HyperLedger
keywords: 超级账本,视频教程演示,区块链实践,hyperledger,fabric接口,golang
description: HyperLedger Fabric的Golang SDK终于调通了，眼泪哗哗地。。

---

* auto-gen TOC:
{:toc}

## 说明

HyperLedger Fabric的Golang SDK终于调通了，眼泪哗哗地。。 @2018-07-28 13:36:06

## 获取示例代码

	go get github.com/introclass/hyperledger-fabric-sdks-usage
	cd $GOPATH/src/github.com/introclass/hyperledger-fabric-sdks-usage/go

## 准备msp和tls证书

将你自己环境的`crypto-config`复制到hyperledger-fabric-sdks-usage/go中。

crypto-config中只需要包含需要的msp和tls证书，需要哪些证书在调用go-sdk的程序使用的config.yaml中指定了。

## 查询合约

演示视频和代码讲解在[网易云课堂《HyperLeger Fabric进阶实战课》第五章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)中。

01-query中通过go-sdk做了一个最简单操作：链接peer，调用合约查询账本。

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
