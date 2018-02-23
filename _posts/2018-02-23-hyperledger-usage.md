---
layout: default
title:  Hyperledger Fabric的使用
author: lijiaocn
createdate: 2018/02/23 10:50:00
changedate: 2018/02/23 18:14:53
categories: 项目
tags: blockchain
keywords: 区块链,Hyperledger,使用
description: 

---

* auto-gen TOC:
{:toc}

## 说明

[Hyperledger][1]是Linux基金会在2015年发起的项目，目的是推进区块链技术的开发应用。Hyperledger收录了多个区块链项目。

区块链技术平台：

	Sawtooth
	Iroha
	Fabric 
	Burrow
	Indy

区块链工具：

	Cello
	Composer
	Explorer
	Quilt

## Farbric

[Fabric][2]是一个支持智能合约(smart contracts)的分布式账本(ledger)系统。

Fabric是私有的，只有通过MSP(Membership Service Provider)认证的成员才可以进入到系统，参与合约的缔造与执行。

Fabric是插件式设计，账本数据有多种存放方式，共识机制(consensus mechanisms)可以切换，支持不同类型的MSP。

Fabric开发了channel功能，一个channel对应一个账本，只有加入channel的成员可见，可以防止竞争对手知晓交易的细节。

账本由两部分组成：全局状态(word state)和交易日志(transaction log）。
全局状态中记录的是当前状态，交易日志中记录了所有的交易记录，全局状态是这些交易记录的执行结果。

智能合约(Smart Contracts)用`chaincode`编写，由区块链外部的应用调用执行，chaincode通常是用来更新账本的。

Farbric的chaincode目前(2018-02-23 15:08:54)只支持Go语言，以后会支持Java和其它的语言。

达成共识的过程中，交易需要严格按照发生的顺序记录到账本中，Farbric提供了多种共识机制(SOLO、Kafka、SBFT...)，建立交易网络的时候根据实际需要选用共识机制。

## 组成

Fabric的模型主要由一下几个部分组成：

	Assets:           交易的资产
	ChainCode:        描述交易逻辑的代码 
	Ledger Features:  账本功能
	Privacy through Channels: channel的私密性，可以对全网开发，也可以只对部分成员开放
	                          包含交易逻辑的ChainCode可以只部署在特定用户端，实现部分公开的效果
	                          还可以在ChainCode中对数据进行加密
	Security & Membership Services: 参与交易的用户都经过认证的可信用户
	Consensus:  交易从发起到被提交到账本的过程中的检验

## 建立网络

部署要求：

	docker版本不低于17.06.2
	docker-compose版本不低于1.14.0
	go版本1.9.x
	如果用node.js开发应用，node.js版本不低于8.9.x

下载示例:

	git clone https://github.com/hyperledger/fabric-samples.git
	cd fabric-samples/first-network/

下载fabric的命令文件，`-s`指定要安装的版本：

	mkdir -p /opt/fabric/1.0.6 
	cd /opt/fabric/1.0.6 
	curl -sSL https://goo.gl/6wtTN5 | bash -s 1.0.6   #这个网址需要翻墙访问
	export PATH=$PATH:/opt/fabric/1.0.6/bin

然后到fabric-samples/first-network/目录中执行`byfn.sh`，byfn.sh脚本可以用来创建一个由4个peer(分属2个组织)组成的网络

	$./byfn.sh -h
	Usage:
	  byfn.sh -m up|down|restart|generate [-c <channel name>] [-t <timeout>] [-d <delay>] [-f <docker-compose-file>] [-s <dbtype>] [-i <imagetag>]
	  byfn.sh -h|--help (print this message)
	    -m <mode> - one of 'up', 'down', 'restart' or 'generate'
	      - 'up' - bring up the network with docker-compose up
	      - 'down' - clear the network with docker-compose down
	      - 'restart' - restart the network
	      - 'generate' - generate required certificates and genesis block
	    -c <channel name> - channel name to use (defaults to "mychannel")
	    -t <timeout> - CLI timeout duration in microseconds (defaults to 10000)
	    -d <delay> - delay duration in seconds (defaults to 3)
	    -f <docker-compose-file> - specify which docker-compose file use (defaults to docker-compose-cli.yaml)
	    -s <dbtype> - the database backend to use: goleveldb (default) or couchdb
	    -i <imagetag> - pass the image tag to launch the network using the tag: 1.0.1, 1.0.2, 1.0.3, 1.0.4 (defaults to latest)
	
	Typically, one would first generate the required certificates and
	genesis block, then bring up the network. e.g.:
	
	    byfn.sh -m generate -c mychannel
	    byfn.sh -m up -c mychannel -s couchdb
	    byfn.sh -m up -c mychannel -s couchdb -i 1.0.6
	    byfn.sh -m down -c mychannel
	
	Taking all defaults:
	    byfn.sh -m generate
	    byfn.sh -m up
	    byfn.sh -m down

创建网络：

	./byfn.sh -m generate 

## 参考

1. [Hyperledger][1]
2. [Fabric][2]
3. [Fabric: Building Your First Network][3]

[1]: https://cn.hyperledger.org/ "Hyperledger" 
[2]: https://hyperledger-fabric.readthedocs.io/en/latest/blockchain.html "Fabric"
[3]: https://hyperledger-fabric.readthedocs.io/en/latest/build_network.html "Fabric: Building Your First Network"
