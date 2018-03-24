---
layout: default
title:  Hyperledger Fabric的使用
author: 李佶澳
createdate: 2018/02/23 10:50:00
changedate: 2018/03/23 16:35:09
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

另外有一个名为cli的容器会在启动10秒钟后自动退出：

	docker start cli

	CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
	CORE_PEER_ADDRESS=peer0.org1.example.com:7051
	CORE_PEER_LOCALMSPID="Org1MSP"
	CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt

## 源码编译

编译的过程会联网，需要翻墙。

编译前会用curl下载一个.jar文件，可以提前准备好：

	curl -fL https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/chaintool-1.0.0/hyperledger-fabric-chaintool-1.0.0.jar > build/bin/chaintool

编译：

	go get github.com/hyperledger/fabric
	cd $GOPATH/src/github.com/hyperledger/fabric
	make 

可以用GOARCH和GOOS指定目标平台，用CGO_FLAGS表示是否启用cgo：

	GOARCH=adm64 GOOS=linux make 

如果提示找不到protoc-gen-go:

	cp: build/docker/gotools/bin/protoc-gen-go: No such file or directory

将protoc-gen-go复制过去：

	cp gotools/build/gopath/bin/protoc-gen-go   build/docker/gotools/bin/protoc-gen-go

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

## cryptogen

cryptogen命令用来生成证书:

	cryptogen generate --config=./crypto-config.yaml

运行结束后在当前目录下会生成一个crypto-config目录。

配置文件格式如下：

	OrdererOrgs:    //order的证书
	  - Name: Orderer
	    Domain: example.com
	    Specs:
	      - Hostname: orderer
	PeerOrgs:      //peer的证书
	  - Name: Org1
	    Domain: org1.example.com
	    Template:   
	      Count: 2
	        Start: 0
	        Hostname: {{.Prefix}}{{.Index}} # default
	    Users:
	      Count: 1
	  - Name: Org2
	    Domain: org2.example.com
	    Template:
	      Count: 2
	    Users:
	      Count: 1

每个组织都有配置了一个ca证书，每个组件向fabric发起的交易和通信用keystore签署，对方用公钥signcerts进行验证。

生成的文件目录结构如下：

	crypto-config
	├── ordererOrganizations
	│   └── example.com
	│       ├── ca
	│       │   ├── ca.example.com-cert.pem
	│       │   └── f9628f7288c14b291ff0ed13a30b63893e872e7a2f598fc012c8e8769edad25e_sk
	│       ├── msp
	│       │   ├── admincerts
	│       │   │   └── Admin@example.com-cert.pem
	│       │   ├── cacerts
	│       │   │   └── ca.example.com-cert.pem
	│       │   └── tlscacerts
	│       │       └── tlsca.example.com-cert.pem
	│       ├── orderers
	│       │   └── orderer.example.com
	│       │       ├── msp
	│       │       │   ├── admincerts
	│       │       │   │   └── Admin@example.com-cert.pem
	│       │       │   ├── cacerts
	│       │       │   │   └── ca.example.com-cert.pem
	│       │       │   ├── keystore
	│       │       │   │   └── b3d4dbe09aa4d4b3825201e73970ef80b09ec98d01c6203f6c70ad155f84e3f5_sk
	│       │       │   ├── signcerts
	│       │       │   │   └── orderer.example.com-cert.pem
	│       │       │   └── tlscacerts
	│       │       │       └── tlsca.example.com-cert.pem
	│       │       └── tls
	│       │           ├── ca.crt
	│       │           ├── server.crt
	│       │           └── server.key
	│       ├── tlsca
	│       │   ├── 7f92c812607da0cfa24eb774c234c90d81564cdcdc4de875fb8d529d912fbbc0_sk
	│       │   └── tlsca.example.com-cert.pem
	│       └── users
	│           └── Admin@example.com
	│               ├── msp
	│               │   ├── admincerts
	│               │   │   └── Admin@example.com-cert.pem
	│               │   ├── cacerts
	│               │   │   └── ca.example.com-cert.pem
	│               │   ├── keystore
	│               │   │   └── cb1531785ee203640940006a29452171cac011120d7928308881fdcb13d34d0b_sk
	│               │   ├── signcerts
	│               │   │   └── Admin@example.com-cert.pem
	│               │   └── tlscacerts
	│               │       └── tlsca.example.com-cert.pem
	│               └── tls
	│                   ├── ca.crt
	│                   ├── server.crt
	│                   └── server.key
	└── peerOrganizations
	    ├── org1.example.com
	    │   ├── ca
	    │   │   ├── 869dd5c17fc22592abf6d16db6c77a16f19e6d3e723fe6f7b734e82fc31c6818_sk
	    │   │   └── ca.org1.example.com-cert.pem
	    │   ├── msp
	    │   │   ├── admincerts
	    │   │   │   └── Admin@org1.example.com-cert.pem
	    │   │   ├── cacerts
	    │   │   │   └── ca.org1.example.com-cert.pem
	    │   │   └── tlscacerts
	    │   │       └── tlsca.org1.example.com-cert.pem
	    │   ├── peers
	    │   │   ├── peer0.org1.example.com
	    │   │   │   ├── msp
	    │   │   │   │   ├── admincerts
	    │   │   │   │   │   └── Admin@org1.example.com-cert.pem
	    │   │   │   │   ├── cacerts
	    │   │   │   │   │   └── ca.org1.example.com-cert.pem
	    │   │   │   │   ├── keystore
	    │   │   │   │   │   └── 7f93d3cdfee4d51f572cd7a53e03bcf60e8fef014f2e0d3b343010b175fb448c_sk
	    │   │   │   │   ├── signcerts
	    │   │   │   │   │   └── peer0.org1.example.com-cert.pem
	    │   │   │   │   └── tlscacerts
	    │   │   │   │       └── tlsca.org1.example.com-cert.pem
	    │   │   │   └── tls
	    │   │   │       ├── ca.crt
	    │   │   │       ├── server.crt
	    │   │   │       └── server.key
	    │   │   └── peer1.org1.example.com
	    │   │       ├── msp
	    │   │       │   ├── admincerts
	    │   │       │   │   └── Admin@org1.example.com-cert.pem
	    │   │       │   ├── cacerts
	    │   │       │   │   └── ca.org1.example.com-cert.pem
	    │   │       │   ├── keystore
	    │   │       │   │   └── ab7fb5af179ead343bac23b3442d7a9a319682afeb2d208860a4df93705b7e5a_sk
	    │   │       │   ├── signcerts
	    │   │       │   │   └── peer1.org1.example.com-cert.pem
	    │   │       │   └── tlscacerts
	    │   │       │       └── tlsca.org1.example.com-cert.pem
	    │   │       └── tls
	    │   │           ├── ca.crt
	    │   │           ├── server.crt
	    │   │           └── server.key
	    │   ├── tlsca
	    │   │   ├── 1ac7e9ef82a641bba43aba4c6d3da5ccdcf02b2b01401eb05f559dd89ee126ef_sk
	    │   │   └── tlsca.org1.example.com-cert.pem
	    │   └── users
	    │       ├── Admin@org1.example.com
	    │       │   ├── msp
	    │       │   │   ├── admincerts
	    │       │   │   │   └── Admin@org1.example.com-cert.pem
	    │       │   │   ├── cacerts
	    │       │   │   │   └── ca.org1.example.com-cert.pem
	    │       │   │   ├── keystore
	    │       │   │   │   └── 06cb1e1bdc16b811353b84e25993822b1990b8fbdcab18552207b12d84761791_sk
	    │       │   │   ├── signcerts
	    │       │   │   │   └── Admin@org1.example.com-cert.pem
	    │       │   │   └── tlscacerts
	    │       │   │       └── tlsca.org1.example.com-cert.pem
	    │       │   └── tls
	    │       │       ├── ca.crt
	    │       │       ├── server.crt
	    │       │       └── server.key
	    │       └── User1@org1.example.com
	    │           ├── msp
	    │           │   ├── admincerts
	    │           │   │   └── User1@org1.example.com-cert.pem
	    │           │   ├── cacerts
	    │           │   │   └── ca.org1.example.com-cert.pem
	    │           │   ├── keystore
	    │           │   │   └── 98d5218ccb2dc8060e53e3bdb7ef27708d68099e65e3e9022f93641b5ded9063_sk
	    │           │   ├── signcerts
	    │           │   │   └── User1@org1.example.com-cert.pem
	    │           │   └── tlscacerts
	    │           │       └── tlsca.org1.example.com-cert.pem
	    │           └── tls
	    │               ├── ca.crt
	    │               ├── server.crt
	    │               └── server.key
	...

## configtxgen

configtxgen用来生成第一个区块，fabric的channel、peer。

	configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./genesis.block
	configtxgen -profile TwoOrgsChannel -outputCreateChannelTx ./channel.tx -channelID $CHANNEL_NAME
	configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP
	configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate ./Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP

configtxgen默认从configtx.yaml读取配置，`-profile`指定将要从中读取的内容:

	Profiles:
	    TwoOrgsOrdererGenesis:
	        Orderer:
	            <<: *OrdererDefaults
	            Organizations:
	                - *OrdererOrg
	        Consortiums:
	            SampleConsortium:
	                Organizations:
	                    - *Org1
	                    - *Org2
	    TwoOrgsChannel:
	        Consortium: SampleConsortium
	        Application:
	            <<: *ApplicationDefaults
	            Organizations:
	                - *Org1
	                - *Org2
	Organizations:
	    - &OrdererOrg
	        Name: OrdererOrg
	        ID: OrdererMSP
	        MSPDir: crypto-config/ordererOrganizations/example.com/msp
	    - &Org1
	        Name: Org1MSP
	        ID: Org1MSP
	        MSPDir: crypto-config/peerOrganizations/org1.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org1.example.com   //用来进行流言发布的分布式协议
	              Port: 7051
	    - &Org2
	        Name: Org2MSP
	        ID: Org2MSP
	        MSPDir: crypto-config/peerOrganizations/org2.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org2.example.com
	              Port: 7051
	Orderer: &OrdererDefaults
	    OrdererType: solo    //solo or kafka
	    Addresses:
	        - orderer.example.com:7050
	    BatchTimeout: 2s
	    BatchSize:
	        MaxMessageCount: 10
	        AbsoluteMaxBytes: 99 MB
	        PreferredMaxBytes: 512 KB
	    Kafka:
	        Brokers:
	            - 127.0.0.1:9092
	    Organizations:
	Application: &ApplicationDefaults
	    Organizations:

## orderer 

order配置文件格式如下：

	General:
	    LedgerType: file       //账本类型
	    ListenAddress: 0.0.0.0
	    ListenPort: 7050
	    TLS:
	        Enabled: true
	        PrivateKey: tls/server.key
	        Certificate: tls/server.crt
	        RootCAs:
	          - tls/ca.crt
	        ClientAuthEnabled: false
	        ClientRootCAs:
	    LogLevel: debug
	
	    GenesisMethod: file    //创世块获取方式
	    GenesisProfile: SampleSingleMSPSolo  //如果从文件获取创世块，忽略
	    GenesisFile: genesis.block           //创世块内容
	
	    LocalMSPDir: msp
	    LocalMSPID: OrdererMSP
	
	    Profile:                     // go pprof
	        Enabled: false
	        Address: 0.0.0.0:6060
	
	    BCCSP:                       // 区块加密设置
	        Default: SW
	        SW:
	            Hash: SHA2
	            Security: 256
	            FileKeyStore:
	                KeyStore:
	
	FileLedger:    //文件账本配置
	    Location: /var/hyperledger/fabric/orderer
	    Prefix: hyperledger-fabric-ordererledger
	
	RAMLedger:     //内存账本配置
	    HistorySize: 1000
	
	Kafka:        //如果基于kafka
	    Retry:
	        ShortInterval: 5s
	        ShortTotal: 10m
	        LongInterval: 5m
	        LongTotal: 12h
	        NetworkTimeouts:
	            DialTimeout: 10s
	            ReadTimeout: 10s
	            WriteTimeout: 10s
	        Metadata:
	            RetryBackoff: 250ms
	            RetryMax: 3
	        Producer:
	            RetryBackoff: 100ms
	            RetryMax: 3
	        Consumer:
	            RetryBackoff: 2s
	    Verbose: false
	    TLS:
	      Enabled: false
	      PrivateKey:
	        #File: path/to/PrivateKey
	      Certificate:
	        #File: path/to/Certificate
	      RootCAs:
	        #File: path/to/RootCAs
	    Version:

环境变量可以覆盖配置文件中的相关配置，下面是一个用docker-compose启动的order：

	command: orderer
	environment:
	  - ORDERER_GENERAL_LOGLEVEL=debug
	  - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
	  - ORDERER_GENERAL_GENESISMETHOD=file
	  - ORDERER_GENERAL_GENESISFILE=/var/hyperledger/orderer/orderer.genesis.block
	  - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
	  - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp  //orderer.example.com目录下的msp
	  # enabled TLS
	  - ORDERER_GENERAL_TLS_ENABLED=true
	  - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
	  - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
	  - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]

## peer node

[Hyperledger Fabric: peer node][7]

peer node启动是默认使用配置文件`$FABRIC_CFG_PATH/core.yaml`

fabric中提供了两个配置示例：

	$ find . -name "core.yaml"
	./examples/cluster/config/core.yaml
	./sampleconfig/core.yaml

core.yaml文件格式如下，下面摘取了主要的配置：

	peer:
	
	    id: jdoe                       //peer的id
	    networkId: dev                 //peer隶属的网络的id
	    listenAddress: 0.0.0.0:7051
	    address: 0.0.0.0:7051          //向同组织内的其它peer暴露的接口
	    addressAutoDetect: false       //是否自动发现地址，在docker中运行可以使用
	    gomaxprocs: -1                 //设置GOMAXPROCS，<1时保留原状
	
	    gossip:                        //流言协议配置
	        bootstrap: 127.0.0.1:7051  //初始化地址
	        useLeaderElection: true    //是否参与leader选举
	        orgLeader: false           //是否手动指定leader
	                                   //一个组织内的leader将与order通信获取账本
	        endpoint:                  //ID
	        maxBlockCountToStore: 100  //在内存中保留的区块数量
	        maxPropagationBurstLatency: 10ms  //消息推送的最大时间间隔
	        maxPropagationBurstSize: 10       //滞留发送的消息的最大数量
	        propagateIterations: 1            //消息被向外发送的次数
	        propagatePeerNum: 3               //消息被推送给另外3个peer
	        pullInterval: 4s                  //拉取时间间隔
	        pullPeerNum: 3                    //从3个peer中拉取消息
	        requestStateInfoInterval: 4s
	        publishStateInfoInterval: 4s
	        stateInfoRetentionInterval:
	        publishCertPeriod: 10s
	        skipBlockVerification: false
	        dialTimeout: 3s
	        connTimeout: 2s
	        recvBuffSize: 20
	        sendBuffSize: 20
	        digestWaitTime: 1s
	        requestWaitTime: 1s
	        responseWaitTime: 2s
	        aliveTimeInterval: 5s
	        aliveExpirationTimeout: 25s
	        reconnectInterval: 25s
	        externalEndpoint:         //向其它组织中的peer发布的id，如果为空其它组织不会感知到这个peer
	
	        //选举相关配置
	        election: 
	            startupGracePeriod: 15s
	            membershipSampleInterval: 1s
	            leaderAliveThreshold: 10s
	            leaderElectionDuration: 5s
	
	    //数据同步配置
	    sync:
	        blocks:
	            channelSize: 10
	        state:
	            snapshot:
	                channelSize: 50
	                writeTimeout: 60s
	            deltas:
	                channelSize: 20
	
	    //如果peer被设置为validator(验证节点），则监听事件
	    events:
	        address: 0.0.0.0:7053
	        buffersize: 100
	        timeout: 10
	    tls:                    //p2p加密通信
	        enabled: true
	        cert:
	            file: tls/server.crt
	        key:
	            file: tls/server.key
	        rootcert:
	            file: tls/ca.crt
	        serverhostoverride:    //验证tls证书中的hostname
	
	    fileSystemPath: /var/hyperledger/fabric/peer      //文件存放地址
	
	    BCCSP:                     //指定区块加密算法
	        Default: SW
	        SW:
	            Hash: SHA2
	            Security: 256
	            FileKeyStore:
	                KeyStore:    //默认是'mspConfigPath'/keystore
	
	    mspConfigPath: msp       //msp配置文件地址
	    localMspId: Org1MSP      //msp服务id
	
	    profile:                 // go profiling
	        enabled:     false
	        listenAddress: 0.0.0.0:6060
	vm:  //虚拟机或容器的api，以及配置等
	     //peer需要以容器的方式启动链码
	    endpoint: unix:///var/run/docker.sock
	    docker:
	        tls:
	            enabled: false
	            ca:
	                file: docker/ca.crt
	            cert:
	                file: docker/tls.crt
	            key:
	                file: docker/tls.key
	        attachStdout: false
	        hostConfig:
	            NetworkMode: host
	            Dns:
	               # - 192.168.0.1
	            LogConfig:
	                Type: json-file
	                Config:
	                    max-size: "50m"
	                    max-file: "5"
	            Memory: 2147483648
	chaincode:  //链码配置
	    id:
	        path:
	        name:
	    builder: $(DOCKER_NS)/fabric-ccenv:$(ARCH)-$(PROJECT_VERSION)  //链码的编译环境
	    golang:
	        runtime: $(BASE_DOCKER_NS)/fabric-baseos:$(ARCH)-$(BASE_VERSION)
	    car:
	        runtime: $(BASE_DOCKER_NS)/fabric-baseos:$(ARCH)-$(BASE_VERSION)
	    java:
	        Dockerfile: 
	            from $(DOCKER_NS)/fabric-javaenv:$(ARCH)-$(PROJECT_VERSION)
	    startuptimeout: 300000   //容器启动的超时时间，毫秒
	    executetimeout: 30000    //命令的初始化调用超时时间，毫秒
	    deploytimeout:  30000    //链码部署的超时时间
	
	    mode: net    //dev模式在本地运行链码，net在容器中运行链码
	    keepalive: 0
	    system:      //系统链码白名单
	        cscc: enable
	        lscc: enable
	        escc: enable
	        vscc: enable
	        qscc: enable
	
	    logLevel: warning
	    logFormat: '%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}'
	
	ledger:   #账本配置
	  blockchain:
	  state:
	    stateDatabase: goleveldb
	    couchDBConfig:
	       couchDBAddress: 127.0.0.1:5984
	       username:
	       password:
	    historyDatabase: true
	    queryLimit: 10000

一个peer的启动示例：

	environment:
	  - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
	  # the following setting starts chaincode containers on the same
	  # bridge network as the peers
	  # https://docs.docker.com/compose/networking/
	  - CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=${COMPOSE_PROJECT_NAME}_byfn
	  - CORE_LOGGING_LEVEL=DEBUG
	  - CORE_PEER_TLS_ENABLED=true
	  - CORE_PEER_GOSSIP_USELEADERELECTION=true
	  - CORE_PEER_GOSSIP_ORGLEADER=false
	  - CORE_PEER_PROFILE_ENABLED=true
	  - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
	  - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
	  - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
	  - CORE_PEER_ID=peer0.org1.example.com
	  - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
	  - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.org1.example.com:7051
	  - CORE_PEER_LOCALMSPID=Org1MSP
	command: peer node start

## 

## 参考

1. [Hyperledger][1]
2. [Fabric][2]
3. [Fabric: Building Your First Network][3]
4. [Hyperledger Fabric Ordering Service][4]
5. [Hyperledger Fabric: Peer Commands][5]
6. [Hyperledger Fabric: Architecture Explained][6]
7. [Hyperledger Fabric: peer node][7]

[1]: https://cn.hyperledger.org/ "Hyperledger" 
[2]: https://hyperledger-fabric.readthedocs.io/en/latest/blockchain.html "Fabric"
[3]: https://hyperledger-fabric.readthedocs.io/en/latest/build_network.html "Fabric: Building Your First Network"
[4]: https://github.com/hyperledger/fabric/tree/release/orderer  "Hyperledger Fabric Ordering Service"
[5]: https://hyperledger-fabric.readthedocs.io/en/latest/commands/peercommand.html  "Hyperledger Fabric: Peer Commands"
[6]: https://hyperledger-fabric.readthedocs.io/en/latest/arch-deep-dive.html "Hyperledger Fabric: Architecture Explained"
[7]: http://hyperledger-fabric.readthedocs.io/en/latest/commands/peernode.html  "Hyperledger Fabric: peer node"
