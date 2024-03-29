---
layout: default
title:  "超级账本HyperLedger: Fabric Golang SDK使用时遇到的问题"
author: 李佶澳
createdate: 2018/07/17 13:24:00
last_modified_at: 2018/07/29 13:04:53
categories: 问题
tags: HyperLedger  
keywords: 超级账本,golang sdk,fabric sdk,hyperledger,fabric,区块链问题
description: 这里记录使用HyperLedger Fabric的golang sdk时遇到的一些问题

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。操作、配置文件和代码讲解视频在[网易云课堂《HyperLeger Fabric进阶实战课》第五章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)中。

这里记录使用HyperLedger Fabric的golang sdk时遇到的一些问题，示例代码在：[HyperLedger Fabric nodejs sdk examples][1]

{% include fabric_page_list.md %}

## could not get chConfig cache reference: read configuration for channel peers failed

	2018/07/17 13:23:13 create channel client fail: event service creation failed: could not get chConfig cache reference: read configuration for channel peers failed

## 配置文件中没有指定组织的`certificateAuthorities`

如果配置文件中缺少50,51行：

	 44 organizations:
	 45   org1:
	 46     mspid: peers.member1.example.com
	 47     cryptoPath: ./crypto-config/peerOrganizations/member1.example.com/users/Admin@member1.example.com/msp/
	 48     peers:
	 49       - peer0.member1.example.com
	 50     certificateAuthorities:
	 51       - ca.org1.example.com

会导致：

	panic: runtime error: invalid memory address or nil pointer dereference
	[signal SIGSEGV: segmentation violation code=0x1 addr=0x28 pc=0x44351d3]

	goroutine 1 [running]:
	github.com/hyperledger/fabric-sdk-go/pkg/context.(*Client).Identifier(0xc4201d9920, 0xc420017680)
		<autogenerated>:1 +0x33
	github.com/hyperledger/fabric-sdk-go/pkg/fab/chconfig.(*ChannelConfig).calculateTargetsFromConfig(0xc4201b0b60, 0x4bb5420, 0xc4201d9920, 0x0, 0x0, 0x0, 0x0, 0x0)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/fab/chconfig/chconfig.go:217 +0x25e
	github.com/hyperledger/fabric-sdk-go/pkg/fab/chconfig.(*ChannelConfig).queryPeers(0xc4201b0b60, 0x4bb06c0, 0xc4201e8960, 0xc42019f8f0, 0xc42019f8f8, 0xc4201d9a00)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/fab/chconfig/chconfig.go:175 +0x654
	github.com/hyperledger/fabric-sdk-go/pkg/fab/chconfig.(*ChannelConfig).Query(0xc4201b0b60, 0x4bb06c0, 0xc4201e8960, 0x1, 0x1, 0x4bb06c0, 0xc4201e8960)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/fab/chconfig/chconfig.go:154 +0x9d
	github.com/hyperledger/fabric-sdk-go/pkg/fab/chconfig.(*Ref).initializer.func1(0x0, 0x0, 0x0, 0x0)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/fab/chconfig/reference.go:52 +0x26d
	github.com/hyperledger/fabric-sdk-go/pkg/util/concurrent/lazyref.New.func1(0x0, 0x0, 0xc4201d99e0, 0xc42019fa00, 0x45c3e45, 0xc4201732c8)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/util/concurrent/lazyref/lazyref.go:90 +0x26
	github.com/hyperledger/fabric-sdk-go/pkg/util/concurrent/lazyref.NewWithData.func1(0x0, 0x0, 0x0, 0x0, 0x0, 0x45c5d40)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/util/concurrent/lazyref/lazyref.go:113 +0x52
	github.com/hyperledger/fabric-sdk-go/pkg/util/concurrent/lazyref.(*Reference).Get(0xc420173280, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/util/concurrent/lazyref/lazyref.go:158 +0x1a4
	github.com/hyperledger/fabric-sdk-go/pkg/fabsdk/provider/chpvdr.(*ChannelProvider).channelConfig(0xc4201e8720, 0x5409f38, 0xc4201d9920, 0x47c7616, 0x9, 0x20, 0x30, 0xc4201ee1b0, 0x54064a8)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/fabsdk/provider/chpvdr/chprovider.go:209 +0xa5
	github.com/hyperledger/fabric-sdk-go/pkg/fabsdk/provider/chpvdr.(*ChannelService).ChannelConfig(0xc4201ee0c0, 0x0, 0x458e943, 0xc42014d7c0, 0x47e3c2c)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/fabsdk/provider/chpvdr/chprovider.go:282 +0x89
	github.com/hyperledger/fabric-sdk-go/pkg/fabsdk/provider/chpvdr.(*ChannelService).EventService(0xc4201ee0c0, 0x0, 0x0, 0x0, 0x4013057, 0xc420063980, 0x40, 0x38)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/fabsdk/provider/chpvdr/chprovider.go:244 +0x2f
	github.com/hyperledger/fabric-sdk-go/pkg/client/channel.New(0xc420063980, 0x0, 0x0, 0x0, 0x0, 0x0, 0xc420063980)
		/Users/lijiao/Work/Bin/gopath/src/github.com/hyperledger/fabric-sdk-go/pkg/client/channel/chclient.go:62 +0x215
	main.main()
		/Users/lijiao/Work/Bin/gopath/src/github.com/introclass/hyperledger-fabric-sdks-usage/go/query/main.go:26 +0x109

## 配置文件中没有指定的certificateAuthorities:

	2018/07/17 20:54:51 create sdk fail: failed to initialize configuration: unalbe to load identity config: failed to initialize identity config from config backend: failed to create identity config from backends: failed to load all CA configs : CA Server Name [ca.org1.example.com] not found

需要在config.yaml中配置certificateAuthorities：

	 65 certificateAuthorities:
	 66   ca.member1.example.com:
	 67     url: https://ca.member1.example.com:7054
	 68     tlsCACerts:
	 69       path: ./crypto-config/ordererOrganizations/member1.example.com/ca/ca.member1.example.com-cert.pem
	 70       #      path/to/tls/cert/for/ca-org1
	 ...

## 参考

1. [HyperLedger Fabric golang sdk examples][1]

[1]: https://github.com/introclass/hyperledger-fabric-sdks-usage/tree/master/go "HyperLedger Fabric golang sdk examples" 
