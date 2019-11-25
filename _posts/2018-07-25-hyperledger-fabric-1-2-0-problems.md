---
layout: default
title:  超级账本HyperLedger：Fabric 1.2.0使用时遇到的问题
author: 李佶澳
createdate: 2018/07/26 11:07:00
last_modified_at: 2018/09/01 15:15:53
categories: 问题
tags: HyperLedger
keywords: HyperLedger,1.2.0,problems
description: HyperLedger Fabric 1.2.0使用过程中遇到的一些问题。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。操作、配置文件和代码讲解视频在[网易云课堂《HyperLeger Fabric进阶实战课》第三章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)中。

HyperLedger Fabric 1.2.0使用过程中遇到的一些问题。

## 创建channel时： existing config does not contain element for [Group]  /Channel/Application/peers.member2.example.com but was in the read set

在全新部署的Fabric中，第一次创建channel，日志如下：

	Error: got unexpected status: BAD_REQUEST -- error authorizing update: error validating ReadSet: existing config does not contain element for [Group]  /Channel/Application/peers.member2.example.com but was in the read set

从日志看，肯能是创世块中没有包含`/Channel/Application/peers.member2.example.com`。

解开创世块的内容，里面没有找到Application：

	 ./output/bin/bin/configtxgen -inspectBlock  ./output/example.com/channel-artifacts/genesisblock -configPath ./inventories/example.com/ >genesis.json

解开channel更新文件：

	 ./output/bin/bin/configtxgen  -inspectChannelCreateTx ./output/example.com/channel-artifacts/channel.tx  --configPath ./inventories/example.com/ >channel.json

没有看出什么问题。

查看orderer的日志和数据，发现mychannel已经存在了:

	$ ls data/chains/
	mychannel

orderer启动的时候根据创世块创建的channel名为mychannel:

	2018-07-26 03:23:41.824 UTC [orderer/common/server] initializeMultichannelRegistrar -> INFO 025^[[0m Not bootstrapping because of existing chains
	2018-07-26 03:23:41.824 UTC [fsblkstorage] newBlockfileMgr -> DEBU 026 newBlockfileMgr() initializing file-based block storage for ledger: mychannel
	2018-07-26 03:23:41.824 UTC [kvledger.util] CreateDirIfMissing -> DEBU 027 CreateDirIfMissing [data/chains/mychannel/]
	...
	2018-07-26 03:23:41.847 UTC [orderer/commmon/multichannel] NewRegistrar -> INFO 0c4 Starting system channel 'mychannel' with genesis block hash 118df032431755f077183ee7f2c1cdbb72d6336879947f2b03ae87b1be59b69f and orderer type solo

之前为了消除configtxgen产生的告警，在生成创世块时指定了channel名称：

	# CHANNEL_NAME为mychannel
	$BIN_PATH/configtxgen -profile OrdererGenesis -outputBlock $output/genesisblock -channelID $CHANNEL_NAME

修改一下名称：

	$BIN_PATH/configtxgen -profile OrdererGenesis -outputBlock $output/genesisblock  -channelID genesis

重新生成创世块，重新部署后成功。

>对创世块和channel之间的关系还是不了解，哎..@2018-07-26 12:03:52

Question:  What is the orderer system channel?

Answer:  The orderer system channel (sometimes called ordering system channel) is the channel the orderer is initially bootstrapped with. It is used to orchestrate channel creation. The orderer system channel defines consortia and the initial configuration for new channels. At channel creation time, the organization definition in the consortium, the /Channel group’s values and policies, as well as the /Channel/Orderer group’s values and policies, are all combined to form the new initial channel definition.

## 查看node状态时：bad request: Envelope must have a Header

	./peer.sh node status
	2018-07-26 12:18:37.443 CST [nodeCmd] status -> INFO 001 Error trying to get status from local peer: rpc error: code = Unknown desc = bad request: Envelope must have a Header
	status:UNKNOWN
	Error: Error trying to connect to local peer: rpc error: code = Unknown desc = bad request: Envelope must have a Header
	Usage:

使用1.1版本的peer访问1.2版本的peer的缘故：

## 依赖的镜像变化， 合约初始化不成功

Fabric 1.2.0的Peer依赖的镜像：

	docker pull hyperledger/fabric-ccenv:latest
	docker pull hyperledger/fabric-baseos:amd64-0.4.10
	docker pull hyperledger/fabric-javaenv:x86_64-1.1.0     #for java
	docker pull hyperledger/fabric-baseimage:amd64-0.4.10   #for node.js
