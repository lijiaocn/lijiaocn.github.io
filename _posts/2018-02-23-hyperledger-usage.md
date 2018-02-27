---
layout: default
title:  Hyperledger Fabric的使用
author: lijiaocn
createdate: 2018/02/23 10:50:00
changedate: 2018/02/27 13:50:14
categories: 项目
tags: blockchain
keywords: 区块链,Hyperledger,使用
description: 初步了解一下

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

## 概念

Fabric的模型主要由以下几个概念组成：

	Assets:           交易的资产
	ChainCode:        描述交易逻辑的代码 
	Ledger Features:  账本功能
	Privacy through Channels: channel的私密性，可以对全网开发，也可以只对部分成员开放
	                          包含交易逻辑的ChainCode可以只部署在特定用户端，实现部分公开的效果
	                          还可以在ChainCode中对数据进行加密
	Security & Membership Services: 参与交易的用户都经过认证的可信用户
	Consensus:  交易从发起到被提交到账本的过程中的检验

## 部署示例

下面使用的fabric提供的一个部署示例，这个例子中会创建一个由4个peer组成的fabric网络。

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

执行结束后，在/opt/fabr	/1.0.6/bin目录中可以看到以下文件：

	configtxgen             //用于生成配置文件，存放在channel-artifacts目录中
	configtxlator
	cryptogen               //用于为网络的参与者生成证书，存放在crypto-config目录中
	get-byfn.sh
	get-docker-images.sh
	orderer
	peer

上面的命令执行时还会下载9个镜像，这9个镜像构成了fabric系统。

	hyperledger/fabric-tools    
	hyperledger/fabric-orderer  
	hyperledger/fabric-peer     
	hyperledger/fabric-javaenv  
	hyperledger/fabric-ca       
	hyperledger/fabric-ccenv    
	hyperledger/fabric-zookeeper
	hyperledger/fabric-kafka    
	hyperledger/fabric-couchdb  

到fabric-samples/first-network/目录中执行`byfn.sh`，byfn.sh脚本可以用来创建一个由4个peer(分属2个组织)组成的网络

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

	./byfn.sh -m generate      #准备证书文件等
	./byfn.sh -m up            #启动网络

执行完成后，会启动8个容器，其中6个用`first-network/docker-compose-cli.yaml`启动的容器：

	orderer.example.com         # 用于形成共识 
	peer0.org1.example.com      # 成员org1.example.com的第一个peer
	peer1.org1.example.com      # 成员org1.example.com的第二个peer
	peer0.org2.example.com      # 成员org2.example.com的第一个peer
	peer1.org2.example.com      # 成员org2.example.com的第二个peer
	cli                         # 命令行工具，启动后sleep一段时间后退出

另外三个是运行智能合约的容器：

	dev-peer1.org2.example.com-mycc-1.0
	dev-peer0.org1.example.com-mycc-1.0
	dev-peer0.org2.example.com-mycc-1.0

一个容器是在创建合约后，实例化时创建的,两个是指定peer进行查询、交易时，需要智能合约的时候创建的。

## 源码编译

编译的过程会联网，需要翻墙。

编译前会用curl下载一个.jar文件，可以提前准备好：

	curl -fL https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/chaintool-1.0.0/hyperledger-fabric-chaintool-1.0.0.jar > build/bin/chaintool

编译：

	go get github.com/hyperledger/fabric
	cd $GOPATH/src/github.com/hyperledger/fabric
	make 

如果在mac上遇到下面的错误：

	Step 3/5 : ADD payload/goshim.tar.bz2 $GOPATH/src/
	failed to copy files: Error processing tar file(bzip2 data invalid: bad magic value in continuation file):
	make: [build/image/ccenv/.dummy-x86_64-1.0.7-snapshot-ac3fabd] Error 1

需要安装gnu-tar，用gnu-tar替换mac默认的bsdtar，可以用`brew list gnu-tar`找到gnu-tar的位置:

	$ brew install gnu-tar --with-default-names
	$ export PATH="/usr/local/Cellar/gnu-tar/1.30/libexec/gnubin/:$PATH"
	$ which tar
	/usr/local/Cellar/gnu-tar/1.30/libexec/gnubin//tar

编译过程中会生成多个镜像，以及联网下载多个文件，需要较长的时间。编译完成后，会得到下面的二进制文件：

	$ ls build/bin/
	chaintool     configtxgen   configtxlator cryptogen     orderer       peer

chaintool是编译过程中使用的工具，Farbic主要由下面的程序组成：

	configtxgen             //用于生成配置文件、创世区块，存放在channel-artifacts目录中
	configtxlator           //用于将fabric的数据在json和protobuf格式之间转换
	cryptogen               //用于为网络的参与者生成证书，存放在crypto-config目录中
	orderer                 //用于形成共识
	peer                    //用于peer操作管理，包含5个不同用途的子命令

order([Hyperledger Fabric Ordering Service][4])是用来形成共识的，这里的共识就是交易的顺序。当前版本(1.0.6)支持三种共识方式：

	Solo，只部署一个order，因为只有一个order，所以不需要进行共识协商，仅用于测试
	Kafka-based，使用kafka的发布/订阅功能进行排序，存在拜占庭将军问题(Byzantine failures)
	PBFT，正在开发中，能够应对拜占庭将军问题

每个order中都存放一份账本，当前版本(1.0.6)支持三种账本格式：

	File Ledger，存放在本地的levelDB数据库文件中，可用于生产
	RAM Ledger, 在内存中保留最近一端时间内的交易记录，可用于测试
	JSON Ledger，以json文件的方式存放，正在开发中

peer是最常用的管理命令，[Hyperledger Fabric: Peer Commands][5]，包括5个子命令：

	peer chaincode : 对链进行操作
	peer channel   : channel相关操作
	peer logging   : 设置日志级别
	peer node      : 启动、管理节点
	peer version   : 查看版本信息

Farbric的主体是由order和peer组成的，如下图所示:

![hyperleader fabric arch](https://hyperledger-fabric.readthedocs.io/en/latest/_images/flow-4.png)

## 参考

1. [Hyperledger][1]
2. [Fabric][2]
3. [Fabric: Building Your First Network][3]
4. [Hyperledger Fabric Ordering Service][4]
5. [Hyperledger Fabric: Peer Commands][5]
6. [Hyperledger Fabric: Architecture Explained][6]

[1]: https://cn.hyperledger.org/ "Hyperledger" 
[2]: https://hyperledger-fabric.readthedocs.io/en/latest/blockchain.html "Fabric"
[3]: https://hyperledger-fabric.readthedocs.io/en/latest/build_network.html "Fabric: Building Your First Network"
[4]: https://github.com/hyperledger/fabric/tree/release/orderer  "Hyperledger Fabric Ordering Service"
[5]: https://hyperledger-fabric.readthedocs.io/en/latest/commands/peercommand.html  "Hyperledger Fabric: Peer Commands"
[6]: https://hyperledger-fabric.readthedocs.io/en/latest/arch-deep-dive.html "Hyperledger Fabric: Architecture Explained"
