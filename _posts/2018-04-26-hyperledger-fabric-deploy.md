---
layout: default
title:  【视频】超级账本HyperLedger：Fabric的全手动、多服务器部署教程
author: 李佶澳
createdate: 2018/04/28 18:45:00
changedate: 2018/10/18 21:50:06
categories: 项目
tags: 视频教程 HyperLedger
keywords: 超级账本,hyperledger,fabric,多服务器,视频教程,手动部署
description: 经历了诸多磨难之后，总算弄清楚了Fabric的组件间关系与配置项，这里演示全手动、多服务器部署

---

* auto-gen TOC:
{:toc}

## 说明

这是"网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)使用的素材。

操作和讲解视频位于[《HyperLedger Fabric手把手入门》](https://study.163.com/course/courseMain.htm?courseId=1005326005&share=2&shareId=400000000376006)第一章中。

虽然通过[Building Your First Network][1]中的docker-compose文件可以直接启动一个all-in-one的Fabric。
但这种方式隐藏了太多的细节，只能让人有个模糊的认识，对生产环境中部署方式、多服务器部署，依然不清不楚，
对各组件的配置文件也完全不了解。

通过反复阅读Fabric的文档，以及[Building Your First Network][1]中的脚本，经历了诸多磨难之后，总算弄清楚了Fabric的组件间关系与配置项。

这里直接使用“二进制+配置文件”的方式，部署了一个由多台服务器组成的Fabric网络(关于FabricCA的内容，见[FabricCA的使用演示][11])。

看文档感觉吃力或者一通操作后不知所以然的同学，可以使用网易云课堂视频教程： 

[超级账本HyperLedger视频教程：HyperLedger Fabric全手动、多服务器部署与进阶教程](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)

![网易云课堂: HperLedger Fabric全手动部署视频教程目录]({{ site.imglocal }}/hyperledger-class/fabric-deploy.png)

## 注意

实践过程中，可能遇到各种各样的问题，可以到知识星球“区块链实践分享”中提问（见页尾）。

比较典型的问题汇总在了这里：[超级账本HyperLedger的Fabric项目多服务器部署过程时遇到的问题][7]

特别提醒，如果你的操作做到了一半，需要`推倒重做`，一定将目标机器上的每个组件中的data目录删除:

	rm -rf /opt/app/fabric/orderer/data
	rm -rf /opt/app/fabric/peer/data

否则这些残留的数据会干扰运行，导致各种各样的情况。

## 规划

创建一个名为fabric-deploy的目录，用来存放部署过程使用到的文件。

	mkdir ~/fabric-deploy

这里将用三台机器部署一个fabric网络，该网络中有两个组织:

	org1.example.com
	org2.example.com

一个order:

	orderer.example.com

org1.example.com有两个peer:

	peer0.org1.example.com
	peer1.org1.example.com

org2.example.com有一个peer:

	peer0.org2.example.com

三台机器的IP，以及部署的组件如下：

	192.168.88.10  部署:  orderer、peer0@org1
	192.168.88.11  部署:  peer1@org1
	192.168.88.12  部署： peer0@org2

相应域名的IP分别为：

	192.168.88.10 orderer.example.com
	192.168.88.10 peer0.org1.example.com
	192.168.88.11 peer1.org1.example.com
	192.168.88.12 peer0.org2.example.com

将这四条记录添加到每台机器的/etc/hosts文件中。

每台机器上还需要安装docker:

	yum install -y docker 
	systemctl start docker

另外fabric的peer会调用docker，需要在所有peer上安装docker，并提前下载镜像：

	docker pull hyperledger/fabric-javaenv:x86_64-1.1.0
	docker pull hyperledger/fabric-ccenv:x86_64-1.1.0
	docker pull hyperledger/fabric-baseos:x86_64-0.4.6

下载的镜像需要与下面步骤中创建的core.yaml中的镜像配对：

	...
	chaincode:
	    peerAddress:
	    id:
	        path:
	        name:
	    builder: $(DOCKER_NS)/fabric-ccenv:$(ARCH)-$(PROJECT_VERSION)
	    golang:
	        runtime: $(BASE_DOCKER_NS)/fabric-baseos:$(ARCH)-$(BASE_VERSION)
	    car:
	        runtime: $(BASE_DOCKER_NS)/fabric-baseos:$(ARCH)-$(BASE_VERSION)
	    java:
	        Dockerfile:  |
	            from $(DOCKER_NS)/fabric-javaenv:$(ARCH)-$(PROJECT_VERSION)
	...

创建合约的时候会用到这些镜像，镜像下载可能比较慢，根据自己的情况配置加速器。另外每个peer上都需要下载。

我在"区块链实践分享”中提供的fabric-deploy中下载包中提供了这三个镜像，可以直接使用：

	cd fabric-deploy/docker-images
	./load.sh

## 编译或下载fabric文件

编译方法见：[hyperledger fabric编译][2]

执行下面的命令可以下载编译好的fabric以及依赖的镜像：

	curl -sSL https://goo.gl/6wtTN5 | bash 

或者直接到这里下载： [hyperledger fabric download][3]

这里使用的linux-amd64，fabric-1.1.0:

	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-1.1.0/hyperledger-fabric-linux-amd64-1.1.0.tar.gz
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-1.1.0/hyperledger-fabric-linux-amd64-1.1.0.tar.gz.md5

下载完成后校验一下：

	$ md5sum hyperledger-fabric-linux-amd64-1.1.0.tar.gz
	6be979ccd903752aefba9da4fc9e1d44  hyperledger-fabric-linux-amd64-1.1.0.tar.gz
	$ cat hyperledger-fabric-linux-amd64-1.1.0.tar.gz.md5
	6be979ccd903752aefba9da4fc9e1d44

解压后得到两个bin和config两个目录:

	tar -xvf hyperledger-fabric-linux-amd64-1.1.0.tar.gz

bin目录中是fabric的组件，config是配置文件模版。

	$ ls bin/
	configtxgen   configtxlator   cryptogen   get-byfn.sh   get-docker-images.sh orderer   peer
	
	$ ls config/
	configtx.yaml  core.yaml  orderer.yaml

保留备用。

## 准备证书

证书的准备方式有两种，一种用`cryptogen`命令生成，一种是通过`fabric-ca服务`生成。

### cryptogen的方式

创建一个配置文件`crypto-config.yaml`，这里配置了两个组织，org1的Count是2，表示两个peer：

	OrdererOrgs:
	  - Name: Orderer
	    Domain: example.com
	    Specs:
	      - Hostname: orderer
	PeerOrgs:
	  - Name: Org1
	    Domain: org1.example.com
	    Template:
	      Count: 2
	    Users:
	      Count: 1
	  - Name: Org2
	    Domain: org2.example.com
	    Template:
	      Count: 1
	    Users:
	      Count: 1

然后执行crypto，生成证书：

	./bin/cryptogen generate --config=crypto-config.yaml --output ./certs

certs目录下生成了两个目录：

	$ ls ./certs/
	ordererOrganizations  peerOrganizations

certs目录的内容比较多，并且目录很深，需要提前说明一下。搞清楚了这里面文件的含义，就懂了一半。

以`certs/ordererOrganizations/example.com/orderers/orderer.example.com/`目录中内容为例。

这里目录中的内容是用于orderer.example.com的，里面有两个子目录`tls`和`msp`：

	$ tree certs/ordererOrganizations/example.com/orderers/orderer.example.com/
	certs/ordererOrganizations/example.com/orderers/orderer.example.com/
	|-- msp
	|   |-- admincerts
	|   |   -- Admin@example.com-cert.pem
	|   |-- cacerts
	|   |   -- ca.example.com-cert.pem
	|   |-- keystore
	|   |   -- 16da15d400d4ca4b53d369b6d6e50a084d4354998c3b4d7a0934635d3907f90f_sk
	|   |-- signcerts
	|   |   -- orderer.example.com-cert.pem
	|   -- tlscacerts
	|       -- tlsca.example.com-cert.pem
	-- tls
	    |-- ca.crt
	    |-- server.crt
	    -- server.key

tls目录中的内容很好理解，它是order对外服务时使用的私钥(server.key)和证书(server.crt)，ca.crt是签注这个证书的CA，需要提供给发起请求的一端。

msp中有五个目录，对区块链进行操作时需要使用这些文件。

`msp/admincerts`中存放的是用户证书，使用该证书的用户对orderer.example.com具有管理权限。

`msp/cacerts`是签署`msp/signcerts`中用户证书的ca，可以用来校验用户的证书：

	$ cd ./certs/ordererOrganizations/example.com/orderers/orderer.example.com/msp/
	$ openssl verify -CAfile ./cacerts/ca.example.com-cert.pem  admincerts/Admin\@example.com-cert.pem
	admincerts/Admin@example.com-cert.pem: OK

`msp/keystore`是orderer.example.com操作区块，进行签署时使用的的私钥。

`msp/signcerts`是orderer.example.com提供其它组件用来核实它的签署的公钥。

`msp/tlscacerts`文件与`tls/ca.crt`相同。

这里需要特别提到的是`msp/admincerts`，在使用fabric时，你可能会发现有些操作需要admin权限，例如在某个peer上安装合约。

那么管理员是如何认定的？就是看当前用户的证书是不是在`msp/admincerts`目录中。

这个目录中的内容目前是(版本1.1.x)启动时加载的，因此如果在里面添加或删除文件后，需要重启使用到它的组件。

在`ordererOrganizations/example.com/`还有其它几个目录：

	ca  msp  orderers  tlsca  users

orderers中存放就签名分析的每个orderer组件的证书文件。

users中存放的用户的证书文件，与`orderer.example.com`中内容基本相同，不过tls目录中文件名变成了`client.X`：

	$ tree ordererOrganizations/example.com/users
	ordererOrganizations/example.com/users
	-- Admin@example.com
	    |-- msp
	    |   |-- admincerts
	    |   |   -- Admin@example.com-cert.pem
	    |   |-- cacerts
	    |   |   -- ca.example.com-cert.pem
	    |   |-- keystore
	    |   |   -- 1ac3b40c9ddda7e7a0f724b18faa0ce6fdf3f9e9ff5eac59e1e3f9739499ac2d_sk
	    |   |-- signcerts
	    |   |   -- Admin@example.com-cert.pem
	    |   -- tlscacerts
	    |       -- tlsca.example.com-cert.pem
	    -- tls
	        |-- ca.crt
	        |-- client.crt
	        -- client.key

`certs/peerOrganizations`中的内容与`certs/ordererOrganizations`中也基本相同，只不过它里面存放的是peer要使用的证书文件。

certs目录中的文件留着备用。

### 使用fabric-ca生成证书

fabric-ca的部署和详细用法见：[hyperledger的fabricCA的使用][4]

只用fabric-ca生成证书的过程相对繁琐很多，需要为每个组件、每个用户生成，这里不做示例。

## orderer.example.com

建一个目录存放orderer.example.com需要文件：

	mkdir orderer.example.com

先将bin/orderer以及证书复制到orderer.example.com目录中。

	cp bin/orderer orderer.example.com/
	cp -rf certs/ordererOrganizations/example.com/orderers/orderer.example.com/* orderer.example.com/

然后准备orderer的配置文件`orderer.example.com/orderer.yaml`:

	General:
	    LedgerType: file
	    ListenAddress: 0.0.0.0
	    ListenPort: 7050
	    TLS:
	        Enabled: true
	        PrivateKey: ./tls/server.key
	        Certificate: ./tls/server.crt
	        RootCAs:
	          - ./tls/ca.crt
	#        ClientAuthEnabled: false
	#        ClientRootCAs:
	    LogLevel: debug
	    LogFormat: '%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}'
	#    GenesisMethod: provisional
	    GenesisMethod: file
	    GenesisProfile: SampleInsecureSolo
	    GenesisFile: ./genesisblock
	    LocalMSPDir: ./msp
	    LocalMSPID: OrdererMSP
	    Profile:
	        Enabled: false
	        Address: 0.0.0.0:6060
	    BCCSP:
	        Default: SW
	        SW:
	            Hash: SHA2
	            Security: 256
	            FileKeyStore:
	                KeyStore:
	FileLedger:
	    Location:  /opt/app/fabric/orderer/data
	    Prefix: hyperledger-fabric-ordererledger
	RAMLedger:
	    HistorySize: 1000
	Kafka:
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

注意，orderer将被部署在目标机器的`/opt/apt/fabric/orderer`目录中，如果要部署在其它目录中，需要修改配置文件中路径。

这里需要用到一个data目录，存放orderer的数据:

	mkdir orderer.example.com/data

## peer0.org1.example.com

建一个目录存放peer0.org1.example.com需要文件：

	mkdir peer0.org1.example.com

先将bin/peer以及证书复制到peer0.org1.example.com目录中。

	cp bin/peer peer0.org1.example.com/
	cp -rf certs/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/* peer0.org1.example.com/

准备peer0.org1.example.com的配置文件core.yaml：

	logging:
	    peer:       debug
	    cauthdsl:   warning
	    gossip:     warning
	    ledger:     info
	    msp:        warning
	    policies:   warning
	    grpc:       error
	    format: '%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}'
	peer:
	    id: peer0.org1.example.com
	    networkId: dev
	    listenAddress: 0.0.0.0:7051
	    address: 0.0.0.0:7051
	    addressAutoDetect: false
	    gomaxprocs: -1
	    gossip:
	        bootstrap: 127.0.0.1:7051
	        bootstrap: peer0.org1.example.com:7051
	        useLeaderElection: true
	        orgLeader: false
	        endpoint:
	        maxBlockCountToStore: 100
	        maxPropagationBurstLatency: 10ms
	        maxPropagationBurstSize: 10
	        propagateIterations: 1
	        propagatePeerNum: 3
	        pullInterval: 4s
	        pullPeerNum: 3
	        requestStateInfoInterval: 4s
	        publishStateInfoInterval: 4s
	        stateInfoRetentionInterval:
	        publishCertPeriod: 10s
	        skipBlockVerification: false
	        dialTimeout: 3s
	        connTimeout: 2s
	        recvBuffSize: 20
	        sendBuffSize: 200
	        digestWaitTime: 1s
	        requestWaitTime: 1s
	        responseWaitTime: 2s
	        aliveTimeInterval: 5s
	        aliveExpirationTimeout: 25s
	        reconnectInterval: 25s
	        externalEndpoint: peer0.org1.example.com:7051
	        election:
	            startupGracePeriod: 15s
	            membershipSampleInterval: 1s
	            leaderAliveThreshold: 10s
	            leaderElectionDuration: 5s
	    events:
	        address: 0.0.0.0:7053
	        buffersize: 100
	        timeout: 10ms
	    tls:
	        enabled: true
	        cert:
	            file: ./tls/server.crt
	        key:
	            file: ./tls/server.key
	        rootcert:
	            file: ./tls/ca.crt
	        serverhostoverride:
	    fileSystemPath: /opt/app/fabric/peer/data
	    BCCSP:
	        Default: SW
	        SW:
	            Hash: SHA2
	            Security: 256
	            FileKeyStore:
	                KeyStore:
	    mspConfigPath: msp
	    localMspId: Org1MSP
	    profile:
	        enabled:    true
	        listenAddress: 0.0.0.0:6060
	vm:
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
	chaincode:
	    peerAddress:
	    id:
	        path:
	        name:
	    builder: $(DOCKER_NS)/fabric-ccenv:$(ARCH)-$(PROJECT_VERSION)
	    golang:
	        runtime: $(BASE_DOCKER_NS)/fabric-baseos:$(ARCH)-$(BASE_VERSION)
	    car:
	        runtime: $(BASE_DOCKER_NS)/fabric-baseos:$(ARCH)-$(BASE_VERSION)
	    java:
	        Dockerfile:  |
	            from $(DOCKER_NS)/fabric-javaenv:$(ARCH)-$(PROJECT_VERSION)
	    startuptimeout: 300s
	    executetimeout: 30s
	    mode: net
	    keepalive: 0
	    system:
	        cscc: enable
	        lscc: enable
	        escc: enable
	        vscc: enable
	        qscc: enable
	    logging:
	      level:  info
	      shim:   warning
	      format: '%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}'
	ledger:
	  blockchain:
	  state:
	    stateDatabase: goleveldb
	    couchDBConfig:
	       couchDBAddress: 127.0.0.1:5984
	       username:
	       password:
	       maxRetries: 3
	       maxRetriesOnStartup: 10
	       requestTimeout: 35s
	       queryLimit: 10000
	  history:
	    enableHistoryDatabase: true

注意，peer将被部署在目标机器的`/opt/apt/fabric/peer`目录中，如果要部署在其它目录中，需要修改配置文件中路径。

这里需要用到一个data目录，存放peer的数据:

	mkdir peer0.org1.example.com/data

## peer1.org1.example.com

过程与peer0.org1.example.com类似，注意将配置文件中的名称修改为peer1，并且不要拷错证书。

这里直接复制peer0.org1.exampl.com目录，然后替换其中的文件。

	cp -rf peer0.org1.example.com/ peer1.org1.example.com/
	rm -rf peer1.org1.example.com/msp/
	rm -rf peer1.org1.example.com/tls/
	cp -rf certs/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/* peer1.org1.example.com/

最后修改peer1.org1.example.com/core.yml，将其中的`peer0.org1.exampl.com`修改为`peer1.org1.example.com`，这里直接用sed命令替换:

	sed -i "s/peer0.org1.example.com/peer1\.org1\.example.com/g" peer1.org1.example.com/core.yaml

## peer0.org2.example.com

过程与peer0.org1.example.com类似，注意将配置文件中的名称修改为org2，并且不要拷错证书。

这里直接复制peer0.org1.exampl.com目录，然后替换其中的文件。

	cp -rf peer0.org1.example.com/ peer0.org2.example.com/
	rm -rf peer0.org2.example.com/msp/
	rm -rf peer0.org2.example.com/tls/
	cp -rf certs/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/*  peer0.org2.example.com/

最后修改peer0.org2.example.com/core.yml，将其中的`peer0.org1.exampl.com`修改为`peer0.org2.example.com`，这里直接用sed命令替换:

	sed -i "s/peer0.org1.example.com/peer0\.org2\.example.com/g" peer0.org2.example.com/core.yaml

将配置文件中Org1MSP替换成Org2MSP:

	sed -i "s/Org1MSP/Org2MSP/g" peer0.org2.example.com/core.yaml

## 开始部署

部署之前，先确保已经在每台机器的/etc/hosts文件中添加下列的记录：

	192.168.88.10 orderer.example.com
	192.168.88.10 peer0.org1.example.com
	192.168.88.11 peer1.org1.example.com
	192.168.88.12 peer0.org2.example.com

注意根据你自己的环境情况修改。

在192.168.88.10上创建目录:

	mkdir -p /opt/app/fabric/{orderer,peer}

将`orderer.example.com`和`peer0.org1.exmaple.com`中的内容复制到`192.168.88.10`:

	scp -r orderer.example.com/* root@192.168.88.10:/opt/app/fabric/orderer/
	scp -r peer0.org1.example.com/* root@192.168.88.10:/opt/app/fabric/peer/

在192.168.88.11上创建目录:

	mkdir -p /opt/app/fabric/peer

将`peer1.org1.exmaple.com`中的内容复制到`192.168.88.11`:

	scp -r peer1.org1.example.com/* root@192.168.88.11:/opt/app/fabric/peer/

在192.168.88.12上创建目录:

	mkdir -p /opt/app/fabric/peer

将`peer0.org2.exmaple.com`中的内容复制到`192.168.88.12`:

	scp -r peer0.org2.example.com/* root@192.168.88.12:/opt/app/fabric/peer/

## 启动前准备

order、peer都部署到位，但是对我这里示意的场景，需要的文件并不齐备。

查看orderer.yaml文件，你会看到有这样几行：

	GenesisMethod: file
	GenesisFile: ./genesisblock
	GenesisProfile: SampleInsecureSolo

前两行配置了创世块的获取方式。第一个区块的获取方式有多种，这里采用最简单的一种做法，用configtxgen生成。

>没有在前面的步骤中一次生成所有需要的文件是因为，如果你修改了配置、使用了其它的方式，可能不需要这里的操作。

回到存放了所有文件的fabric-deploy目录中，创建一个名为`configtx.yaml`的文件：

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
	        MSPDir: ./certs/ordererOrganizations/example.com/msp
	    - &Org1
	        Name: Org1MSP
	        ID: Org1MSP
	        MSPDir: ./certs/peerOrganizations/org1.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org1.example.com
	              Port: 7051
	    - &Org2
	        Name: Org2MSP
	        ID: Org2MSP
	        MSPDir: ./certs/peerOrganizations/org2.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org2.example.com
	              Port: 7051
	Orderer: &OrdererDefaults
	    OrdererType: solo
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

这个配置文件的内容比较多，这里就不做解释了，可以到视频解说中听讲解。

直接用`./bin/configtxgen`生成创世块文件。

	./bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./genesisblock

将./genesisblock文件复制到192.168.88.10的/opt/app/fabric/orderer/目录中:

	scp genesisblock root@192.168.88.10:/opt/app/fabric/orderer/

## 启动

分别到每台机器的orderer、peer目录中启动：

	./orderer 
	./peer node start 

为了方便查看输出的日志，可以写一个脚本：

>注意，启动方式根据自己需要进行安排，譬如可以使用systemd服务的方式启动，也可以打包到
>docker镜像中，以容器的方式启动。
>这里只演示最后启动命令，直接运行orderer和peer。

	$ cat start.sh
	./orderer 2>&1 |tee log

peer的脚本如下：

	$ cat start.sh
	./peer node start 2>&1 |tee log

然后将脚本放到后台运行：

	$ ./start.sh &

如果程序启动失败，那么核实之前的步骤。或者到右侧的“区块链实践分享”知识星球中咨询。

## 用户

如果每个组件的日志中没有错误，那么fabric启动就完成。现在的问题是如何使用？

首先要有用户，在前面用`cryptogen`准备证书的时候，默认创建了用户。

还记得certs目录下的几个`users`目录吗？那里面就是用户证书。

users目录一共有三个，分别是联盟的用户，和每个组织的用户：

	./certs/ordererOrganizations/example.com/users
	./certs/peerOrganizations/org1.example.com/users
	./certs/peerOrganizations/org2.example.com/users

其中每个组织有两个用户，Admin和User1：

	$ ls ./certs/peerOrganizations/org1.example.com/users
	Admin@org1.example.com  User1@org1.example.com

Admin和User1唯一的区别是，Admin的用户证书被添加到了对一个peer的`msp/admincerts`目录中。（还记得这个目录的作用吗？）

### Admin@org1.example.com

使用hyperledger fabric可以通过[SDK][5]，也可以使用peer命令。

这里直接演示peer命令的用法。

在fabric-deploy中创建目录`Admin@org1.example.com`，在其中存放该用户的所有资料。

	mkdir Admin@org1.example.com

将用户证书复制到其中：

	cp -rf certs/peerOrganizations/org1.example.com/users/Admin\@org1.example.com/* Admin\@org1.example.com/

还需要将core.yaml复制到用户目录下：

	cp peer0.org1.example.com/core.yaml  Admin\@org1.example.com/

为了方便使用，创建一个脚本`Admin@org1.example.com/peer.sh`：

	#!/bin/bash
	PATH=`pwd`/../bin:$PATH
	
	export FABRIC_CFG_PATH=`pwd`
	
	export CORE_PEER_TLS_ENABLED=true
	export CORE_PEER_TLS_CERT_FILE=./tls/client.crt
	export CORE_PEER_TLS_KEY_FILE=./tls/client.key
	
	export CORE_PEER_MSPCONFIGPATH=./msp
	export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
	export CORE_PEER_LOCALMSPID=Org1MSP
	export CORE_PEER_TLS_ROOTCERT_FILE=./tls/ca.crt
	export CORE_PEER_ID=cli
	export CORE_LOGGING_LEVEL=INFO
	
	peer $*

然后直接通过这个脚本访问peer0.org1.example.com:

	$ ./peer.sh node status
	status:STARTED
	2018-04-29 14:32:03.517 CST [main] main -> INFO 001 Exiting.....
	$ cd ..

可以看到`peer0.org1.example.com:7051`的状态是启动的。

**注意**：根据反馈，很多人遇到了类似问题：

	 failed to connect to peer0.org1.example.com:7051: failed to create new connection: context deadline exceeded

遇到这种情况，先用telnet看一下服务是是通的：

	telnet peer0.org1.example.com 7051

如果不通，检查一下/etc/hosts中是否设置了域名和IP的对应关系是否正确。

如果还是不通，看一下系统有没有防火墙，是否不是7051端口被防火墙禁止了。

如果还是不行，看一下你是否用的虚拟机，虚拟机的是否用添加了host模式的网卡，并且使用的是host模式网卡的IP。

如果还有问题，可以查看：[Fabric部署过程时遇到的问题汇总](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/04/25/hyperledger-fabric-problem.html)

还是不行，可以到QQ群`576555864`中交流。

还是不行，扫描下面的二维码，翻历史问题，发帖提问:

![我的网课](https://www.lijiaocn.com/img/xiaomiquan-class.jpeg)

为了减少演示过程中的重复操作，下面使用复制、替换的方式，准备另外两个用户的目录。

### User1@org1.example.com

User1与Admin1使用相同的peer，因此只需要替换用户证书即可：

	cp -rf  Admin\@org1.example.com/ User1\@org1.example.com/
	rm -rf  User1\@org1.example.com/msp
	rm -rf  User1\@org1.example.com/tls
	cp -rf  certs/peerOrganizations/org1.example.com/users/User1\@org1.example.com/* User1\@org1.example.com/

>注意上面的过程，就是把msp和tls目录替换了。

执行peer.sh检验：

	$ cd User1\@org1.example.com
	$ ./peer.sh node status
	status:STARTED
	2018-04-29 14:37:48.251 CST [main] main -> INFO 001 Exiting.....
	$ cd ..

### Admin@org2.example.com

同样在Admin\@org1.example.com/的基础上修改，替换掉msp和tls目录：

	cp -rf  Admin\@org1.example.com/ Admin\@org2.example.com/
	rm -rf  Admin\@org2.example.com/msp/
	rm -rf  Admin\@org2.example.com/tls/
	cp -rf certs/peerOrganizations/org2.example.com/users/Admin\@org2.example.com/* Admin\@org2.example.com/

对于Admin@org2.example.com另一个组织的用户，`core.yaml`需要替换成它自己组织(org2)的core.yaml：

	cp peer0.org2.example.com/core.yaml Admin\@org2.example.com/

还需要将`Admin\@org2.example.com/peer.sh`中peer地址修改为org2的peer地址：

	export CORE_PEER_ADDRESS=peer0.org1.example.com:7051
	export CORE_PEER_LOCALMSPID=Org1MSP
	
	修改为：
	
	export CORE_PEER_ADDRESS=peer0.org2.example.com:7051
	export CORE_PEER_LOCALMSPID=Org2MSP

>注意peer.sh中需要修改的地方有两个： org1->org2，Org1->Org2。

验证：

	$ cd Admin\@org2.example.com
	$ ./peer.sh node status
	status:STARTED
	2018-04-29 14:44:22.395 CST [main] main -> INFO 001 Exiting.....
	$ cd ..

## 创建channel与peer的设置

### 准备channel文件

这里用命令行演示channel的创建与peer的设置。(也可以通过SDK，SDK将单独讨论）

需要再次回到fabric-deploy目录中，用configtxgen生成channel文件：

	./bin/configtxgen -profile TwoOrgsChannel -outputCreateChannelTx mychannel.tx -channelID mychannel

channel名字为mychannel，生成的mychannel.tx备用。

还需要为每个组织的peer生成一个anchor文件，每个组织只需要一个：

	./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP
	./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate Org2MSPanchors.tx -channelID mychannel -asOrg Org2MSP

生成的Org1MSPanchors.tx和Org2MSPanchors.tx备用。

这里生成的三个文件的含义与内容，见[超级账本HyperLedger Fabric中Channel配置的读取转换][8]。

下一步操作中要访问orderer.example.com，需要将验证orderer.example.com的根证书复制到用户目录中：

	cp certs/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem  Admin\@org1.example.com/
	cp certs/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem  User1\@org1.example.com/
	cp certs/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem  Admin\@org2.example.com/

### 创建channel

在Admin@org1.exampl.com目录中执行下面的命令，：

	cd  Admin\@org1.exampl.com
	./peer.sh channel create -o orderer.example.com:7050 -c mychannel -f ../mychannel.tx --tls true --cafile tlsca.example.com-cert.pem


执行完成后，会生成一个`mychannel.block`文件：

	$ ls
	core.yaml  msp  mychannel.block  peer.sh  tls  tlsca.example.com-cert.pem

将mychannel.block复制一份到`Admin\@org2.example.com/`中备用：

	cp mychannel.block ../Admin\@org2.example.com/
	cd ..

### 将peer加入channel

**分别**在`Admin\@org1.example.com/`和`Admin\@org2.example.com/`执行下面的命令：

	cd Admin\@org1.example.com/
	./peer.sh channel join -b mychannel.block
	cd ..

因为org1有两个peer，因此需要将peer.sh中peer修改为`peer1.org1.example.com`后，再添加一次：

	./peer.sh channel join -b mychannel.block

在Admin\@org2.example.com/中执行一次：

	cd Admin\@org2.example.com/
	./peer.sh channel join -b mychannel.block
	cd ..

可以用channel list查看peer所在channel

	$ ./peer.sh channel list
	2018-04-29 16:37:47.016 CST [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
	Channels peers has joined:
	mychannel
	2018-04-29 16:37:47.018 CST [main] main -> INFO 002 Exiting.....

最后需要每个组织指定一个anchor peer，anchor peer是组织用来接收orderer下发的区块的peer:

	cd Admin\@org1.example.com/
	./peer.sh channel update -o orderer.example.com:7050 -c mychannel -f ../Org1MSPanchors.tx --tls true --cafile ./tlsca.example.com-cert.pem
	cd ..
	
	cd Admin\@org2.example.com/
	./peer.sh channel update -o orderer.example.com:7050 -c mychannel -f ../Org2MSPanchors.tx --tls true --cafile ./tlsca.example.com-cert.pem
	cd ..

## 安装合约（chaincode）

在hyperledger fabric中，合约被称为chaincode。

需要安装一个go语言的开发环境，安装方法这里就不介绍了。

这里将go的开发环境安装在fabric-deploy所在的机器上。

直接用`go get`获取一份合约代码：

	# 注意在浏览器打开地址为： https://github.com/introclass/hyperledger-fabric-chaincodes
	go get github.com/introclass/hyperledger-fabric-chaincodes/demo

注意代码的查看地址是：[https://github.com/introclass/fabric-chaincode-example ][9]

到`Admin@org1.example.com/`目录下，以Admin@org1.example.com的身份打包合约:

	cd Admin\@org1.example.com/

执行下面命令进行合约打包与签署：

	./peer.sh chaincode package demo-pack.out -n demo -v 0.0.1 -s -S -p github.com/introclass/fabric-chaincode-example/demo
	./peer.sh chaincode signpackage demo-pack.out signed-demo-pack.out

然后安装合约：

	./peer.sh chaincode install ./signed-demo-pack.out

安装之后，可以用chaincode list查看peer上已经安装的合约。

	$ ./peer.sh chaincode list   --installed
	Get installed chaincodes on peer:
	Name: demo, Version: 0.0.1, Path: github.com/introclass/fabric-chaincode-example/demo, Id: 3d733bd28accf77b06b2bec065d8ce7315bd7c5441c51beea4650982f79eab46
	2018-04-29 18:57:54.327 CST [main] main -> INFO 001 Exiting....

chaincode只能用Admin安装，并且需要在每个peer上都安装一次。

将peer0.org1.example.com切换为peer1.org1.example.com后(修改peer.sh中的地址)，再次安装一次：

	./peer.sh chaincode install ./signed-demo-pack.out  (不需要重新打包签署)
	cd ..

将signed-demo-pack.out复制到`Admin@org2.exmaple.com`中安装一次

	cp Admin\@org1.example.com/signed-demo-pack.out  Admin\@org2.example.com/
	cd Admin\@org2.example.com/
	./peer.sh chaincode install ./signed-demo-pack.out

## 合约初始化

合约安装之后，`需要且只需要`进行一次初始化，只能由`签署合约`的用户进行初始化:

	cd Admin\@org1.example.com/
	./peer.sh chaincode instantiate -o orderer.example.com:7050 --tls true --cafile ./tlsca.example.com-cert.pem -C mychannel -n demo -v 0.0.1 -c '{"Args":["init"]}' -P "OR('Org1MSP.member','Org2MSP.member')"

第一进行合约初始化的时候的会比较慢，因为需要需要创建、启动容器。

## 合约调用

可以在任意一个peer上调用合约，例如以admin@org2.example.com的进行写操作：

	cd Admin\@org2.example.com/
	./peer.sh chaincode invoke -o orderer.example.com:7050  --tls true --cafile ./tlsca.example.com-cert.pem -C mychannel -n demo -c '{"Args":["write","key1","key1valueisabc"]}'

如果是第一次在一个peer访问一个合约，这个peer需要先启动容器，响应会比较慢。进行写操作（invoke命令）时，需要指定orderer（-o orderer.example.com:7050）。

进行查询操作时，不需要指定orderer，例如：

	cd User1\@org1.example.com/
	./peer.sh chaincode query -C mychannel -n demo -c '{"Args":["query","key1"]}'

## 更新合约

将更改后的合约重新打包，使用一个新的版本号：

	cd Admin\@org1.example.com/

执行下面命令进行合约打包与签署：

	./peer.sh chaincode package demo-pack-2.out -n demo -v 0.0.2 -s -S -p github.com/introclass/fabric-chaincode-example/demo
	./peer.sh chaincode signpackage demo-pack-2.out signed-demo-pack-2.out

然后安装合约：

	./peer.sh chaincode install ./signed-demo-pack-2.out

更新的合约不需要初始化，需要进行更新操作：

	./peer.sh chaincode upgrade -o orderer.example.com:7050 --tls true --cafile ./tlsca.example.com-cert.pem -C mychannel -n demo -v 0.0.2 -c '{"Args":["init"]}' -P "OR('Org1MSP.member','Org2MSP.member')"

新的合约也需要在每个peer上单独安装。

因此需要将peer0.org1.example.com切换为peer1.org1.example.com后，再次安装一次：

	./peer.sh chaincode install ./signed-demo-pack-2.out  (不需要重新打包签署)

将signed-demo-pack.out复制到`Admin@org2.exmaple.com`中安装一次

	cp Admin\@org1.example.com/signed-demo-pack-2.out  Admin\@org2.example.com/
	cd Admin\@org2.example.com/
	./peer.sh chaincode install ./signed-demo-pack-2.out

## 接下来...

[Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][11]

[Fabric进阶，在已有的Channel中添加新的组织][12]

[更多关于超级账本和区块链的文章][10]

## 参考

1. [Building Your First Network][1]
2. [hyperledger fabric编译][2]
3. [hyperledger fabric download][3]
4. [hyperledger的fabricCA的使用][4]
5. [hyperledger项目fabric的nodejsSDK的使用][5]
6. [网易云课堂视频教程：HyperLedger Fabric全手动部署][6]
7. [超级账本HyperLedger的Fabric项目部署过程时遇到的问题][7]
8. [超级账本HyperLedger Fabric中Channel配置的读取转换][8]
9. [https://github.com/lijiaocn/fabric-chaincode-example/][9]
10. [更多关于超级账本和区块链的文章][10]
11. [超级账本HyperLedger视频教程：Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][11]
12. [超级账本HyperLedger视频教程：Fabric，在已有的Channel中添加新的组织][12]

[1]: http://hyperledger-fabric.readthedocs.io/en/latest/build_network.html  "Building Your First Network" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/02/23/hyperledger-fabric-usage.html#fabric%E7%BC%96%E8%AF%91 "hyperledger fabric编译"
[3]: https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/ "hyperledger fabric download"
[4]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html "hyperledger的fabricCA的使用"
[5]: http://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/04/25/hyperledger-fabric-sdk-nodejs.html "hyperledger项目fabric的nodejsSDK的使用"
[6]: http://study.163.com/course/introduction.htm?courseId=1005326005&share=2&shareId=400000000376006 "HyperLedger Fabric全手动部署网易云课堂教程"
[7]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/04/25/hyperledger-fabric-problem.html "超级账本HyperLedger的Fabric项目部署过程时遇到的问题"
[8]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/19/hyperledger-channel-config-operation.html "超级账本HyperLedger Fabric中Channel配置的读取转换"
[9]: https://github.com/introclass/fabric-chaincode-example/ "https://github.com/lijiaocn/fabric-chaincode-example/"
[10]: http://www.lijiaocn.com/tags/blockchain.html "更多关于超级账本和区块链的文章"
[11]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html  "Fabric-CA的使用演示(两个组织一个Orderer三个Peer)"
[12]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/18/hyperledger-fabric-add-new-org.html "超级账本HyperLedger视频教程：Fabric，在已有的Channel中添加新的组织"
