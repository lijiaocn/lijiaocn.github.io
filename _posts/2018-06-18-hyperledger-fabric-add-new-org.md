---
layout: default
title: 超级账本HyperLedger视频教程：Fabric，在已有的Channel中添加新的组织
author: 李佶澳
createdate: 2018/06/18 13:44:00
changedate: 2018/06/23 12:02:43
categories: 项目
tags: HyperLedger
keywords: HyperLedger,超级账本,视频教程,组织添加
description: 在已经建立的channel中添加新的组织

---

* auto-gen TOC:
{:toc}

## 说明

[超级账本HyperLedger视频教程演示汇总--“主页”中可领优惠券](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)

经过[视频教程][4]中的[Fabric的手动部署教程][3]和[Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][2]中的步骤之后，搭建了一个Fabric系统，并且建立一名为"mychannel"的频道，频道中有两个org1和org2两个成员。

这里演示“如何在已经已经创建的channel中增加新的组织”。 可以先移步到[超级账本HyperLedger Fabric中Channel配置的读取转换][8]中，了解一下Channel的配置，以更好理解接下来的内容。

参考资料：[Bring Org3 into the Channel Manually][1]

## 清空数据，重启的方法

停止每个peer和orderer，将./data目录中的内容都删除后重启。

之后执行下面命令，回到开始状态：

	cd Admin\@org1.example.com/
	./peer.sh channel create -o orderer.example.com:7050 -c mychannel -f ../mychannel.tx --tls true --cafile tlsca.example.com-cert.pem
	cp mychannel.block ../Admin\@org2.example.com/
	./peer.sh channel join -b mychannel.block
	./peer.sh channel join -b mychannel.block   //将peer.sh中的peer0修改为peer1后在执行一次
	./peer.sh channel update -o orderer.example.com:7050 -c mychannel -f ../Org1MSPanchors.tx --tls true --cafile ./tlsca.example.com-cert.pem

	cd ../Admin\@org2.example.com/
	./peer.sh channel join -b mychannel.block
	./peer.sh channel update -o orderer.example.com:7050 -c mychannel -f ../Org2MSPanchors.tx --tls true --cafile ./tlsca.example.com-cert.pem

可以根据自己的需要部署一下合约。

	go get github.com/lijiaocn/fabric-chaincode-example/demo
	./peer.sh chaincode package demo-pack.out -n demo -v 0.0.1 -s -S -p github.com/lijiaocn/fabric-chaincode-example/demo
	./peer.sh chaincode signpackage demo-pack.out signed-demo-pack.out
	./peer.sh chaincode install ./signed-demo-pack.out
	./peer.sh chaincode instantiate -o orderer.example.com:7050 --tls true --cafile ./tlsca.example.com-cert.pem -C mychannel -n demo -v 0.0.1 -c '{"Args":["init"]}' -P "OR('Org1MSP.member','Org2MSP.member')"
	./peer.sh chaincode query -C mychannel -n demo -c '{"Args":["attr","role"]}'
	./peer.sh chaincode query -C mychannel -n demo -c '{"Args":["attr","hf.Type"]}'

清空下面的操作过程中生成的文件：

	rm -rf fabric-ca-files/org3.example.com/
	rm -rf peer0.org3.example.com
	rm -rf org3-artifacts
	rm -rf certs/peerOrganizations/org3.example.com/
	rm -rf  Admin@org3.example.com

## 创建目录org3-artifacts 

后续操作在fabric-deploy中执行，创建一个目录org3-artifacts，用来存放整个过程生成的与org3有关的文件。

	mkdir org3-artifacts

## 准备后面会用到的tls证书

通过fabric-CA可以生成用户私钥和证书，但是不能得到通讯时使用tls证书。这些证书可以自己用openssl等生成，或者找专业的CA机构获取。

为了方便，这里使用`cryptogen`命令生成：

在`org3-artifacts/`中创建文件`org3-crypto.yaml`，内容如下：

	PeerOrgs:
	  # --------------------------------------------------------------------
	  # Org3
	  # --------------------------------------------------------------------
	  - Name: Org3
	    Domain: org3.example.com
	    EnableNodeOUs: true
	    Template:
	      Count: 1
	    Users:
	      Count: 1

然后使用`cryptogen`生成org3的私钥、证书等：

	$ ./bin/cryptogen generate --config=./org3-artifacts/org3-crypto.yaml --output ./certs
	org3.example.com

执行结束后，可以在certs/peerOrganizations中看到新建的org3.example.com目录：

	$ ls certs/peerOrganizations/
	org1.example.com  org2.example.com  org3.example.com

注意cryptogen生成的是一套完备的证书，后续操作中只使用了其中的tls证书，每个账号的私钥和证书，是从fabric-ca中获取的。

## 在Fabric-CA中注册org3以及org3的成员

在Fabric-CA中注册组织Org3，并注册一个Admin用来管理org3，和一个peer0.org3.example.com用于org3的peer0。

### 注册组织com.example.org3

	fabric-ca-client  -H `pwd`/fabric-ca-files/admin  affiliation add com.example.org3

查看创建的联盟：

	$ fabric-ca-client  -H `pwd`/fabric-ca-files/admin  affiliation list
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org1
	      affiliation: com.example.org2
	      affiliation: com.example.org3

从fabric-ca中读取org3.example.com的msp:

	mkdir -p fabric-ca-files/org3.example.com/msp
	fabric-ca-client getcacert -M `pwd`/fabric-ca-files/org3.example.com/msp

删除这里没有用到的中间CA，这个空文件会导致执行时出现warning日志：

	rm fabric-ca-files/org3.example.com/msp/intermediatecerts/localhost-7054.pem

msp中还需要有一套tls证书（上一节中生成的）：

	cp -rf certs/peerOrganizations/org3.example.com/msp/tlscacerts fabric-ca-files/org3.example.com/msp/

以及admincerts:

	mkdir fabric-ca-files/org3.example.com/msp/admincerts

这个目录暂时为空的，在后面创建了Admin用户后，将Admin的证书复制到这个目录中。

### 注册org3的管理员Admin@org3.example.com

准备存放Admin@org3.example.com的私钥和证书的目录：

	mkdir -p ./fabric-ca-files/org3.example.com/admin

修改`fabric-ca-files/admin/fabric-ca-client-config.yaml`的id部分:

	id:
	  name: Admin@org3.example.com
	  type: client
	  affiliation: com.example.org3
	  maxenrollments: 0
	  attributes:
	    - name: hf.Registrar.Roles
	      value: client,orderer,peer,user
	    - name: hf.Registrar.DelegateRoles
	      value: client,orderer,peer,user
	    - name: hf.Registrar.Attributes
	      value: "*"
	    - name: hf.GenCRL
	      value: true
	    - name: hf.Revoker
	      value: true
	    - name: hf.AffiliationMgr
	      value: true
	    - name: hf.IntermediateCA
	      value: true
	    - name: role
	      value: admin
	      ecert: true

注册:

	fabric-ca-client register -H `pwd`/fabric-ca-files/admin --id.secret=password

从fabric-CA中读取凭证：

	$ fabric-ca-client enroll -u http://Admin@org3.example.com:password@localhost:7054  -H `pwd`/fabric-ca-files/org3.example.com/admin
	$ ls ./fabric-ca-files/org3.example.com/admin
	fabric-ca-client-config.yaml  msp

验证Admin@org3.example.com:

	$ fabric-ca-client affiliation list -H `pwd`/fabric-ca-files/org3.example.com/admin
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org3

>Admin用户注册之后，还需要将它的证书添加到org3.example.com中。

将Admin@org3.example.com的证书复制到`org3.example.com的msp/admincerts`中：

	cp fabric-ca-files/org3.example.com/admin/msp/signcerts/cert.pem  fabric-ca-files/org3.example.com/msp/admincerts/

### 注册组织org3的peer0用户

使用`Admin@org3.example.com`账号来注册账号`peer0.org3.example.com`，用于org3的peer0。

修改fabric-ca-files/`org3.example.com`/admin/fabric-ca-client-config.yaml的id部分：

	id:
	  name: peer0.org3.example.com
	  type: peer
	  affiliation: com.example.org3
	  maxenrollments: 0
	  attributes:
	    - name: role
	      value: peer
	      ecert: true

注册：

	fabric-ca-client register -H `pwd`/fabric-ca-files/org3.example.com/admin --id.secret=password

查看org3.example.com的所有账号：

	$ fabric-ca-client  -H `pwd`/fabric-ca-files/org3.example.com/admin   identity list
	Name: Admin@org3.example.com, Type: client, Affiliation: com.example.org3, Max Enrollments: -1, Attributes: [{Name:hf.Registrar.Roles Value:client,orderer,peer,user ECert:false} {Name:hf.Registrar.DelegateRoles Value:client,orderer,peer,user ECert:false} {Name:hf.Registrar.Attributes Value:* ECert:false} {Name:hf.GenCRL Value:1 ECert:false} {Name:hf.Revoker Value:1 ECert:false} {Name:hf.AffiliationMgr Value:1 ECert:false} {Name:hf.IntermediateCA Value:1 ECert:false} {Name:role Value:admin ECert:true} {Name:hf.EnrollmentID Value:Admin@org3.example.com ECert:true} {Name:hf.Type Value:client ECert:true} {Name:hf.Affiliation Value:com.example.org3 ECert:true}]
	Name: peer0.org3.example.com, Type: peer, Affiliation: com.example.org3, Max Enrollments: -1, Attributes: [{Name:role Value:peer ECert:true} {Name:hf.EnrollmentID Value:peer0.org3.example.com ECert:true} {Name:hf.Type Value:peer ECert:true} {Name:hf.Affiliation Value:com.example.org3 ECert:true}]

从fabric-CA中读取peer0.org3.example.com的凭证：

	mkdir ./fabric-ca-files/org3.example.com/peer0
	fabric-ca-client enroll -u http://peer0.org3.example.com:password@localhost:7054 -H `pwd`/fabric-ca-files/org3.example.com/peer0

## 生成org3的配置文件

在文件configtx.yaml中，添加组织Org3（原先只有Org1和Org2）：

	Organizations:
	    ...
	    - &Org3
	        Name: Org3MSP
	        ID: Org3MSP
	        MSPDir: ./fabric-ca-files/org3.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org3.example.com
	              Port: 7051

注意MSPDIR路径不要写错了。

用configtxgen生成json格式的org3描述文件：

	$ ./bin/configtxgen -printOrg Org3MSP > ./org3-artifacts/org3.json
	2018-06-18 08:35:14.998 UTC [common/tools/configtxgen] main -> INFO 001 Loading configuration

configtxgen命令默认读取当前目录下的confitx.yaml文件，在1.1.0版本中不支持命令行指定配置文件。

单为了org3，configtx.yaml中只需要有以下内容：

	Organizations:
	    - &Org3
	        Name: Org3MSP
	        ID: Org3MSP
	        MSPDir: ./fabric-ca-files/org3.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org3.example.com
	              Port: 7051

这里的操作就是把org3的所有信息打包到一个json文件中，查看org3.json文件，你会看到org3的证书也被包含其中了。

## 更新channel

将org3的内容(前面生成的org3.json)添加到`mychannel`中。

### 准备channel的更新文件

需要先用一个账号从fabric中读取mychannel当前的配置，这里用`Admin@org1.example.com`，即org1的Admin用户来读取。

	cd Admin@org1.example.com/
	./peer.sh channel fetch config config_block.pb -c mychannel -o orderer.example.com:7050  --tls --cafile tlsca.example.com-cert.pem

执行结束后，会在当前目录得到一个`config_block.pb`文件，它是个protobuf格式的文件。

将这个文件移动到`../org3-artifacts`中：

	mv config_block.pb ../org3-artifacts/
	cd ..

使用configtxlator将其解码为json格式，并只取出其中config部分（舍弃了header以及metadata等内容）:

	./bin/configtxlator proto_decode --input ./org3-artifacts/config_block.pb --type common.Block | jq .data.data[0].payload.data.config > ./org3-artifacts/mychannel-config.json

这里用到命令`jq`，如果本地没有这个命令，需要安装一下：

	yum install -y jq

将org3的描述文件`./org3-artifacts/org3.json`，添加到mychannel的配置文件中：

	jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP":.[1]}}}}}' ./org3-artifacts/mychannel-config.json ./org3-artifacts/org3.json > ./org3-artifacts/modified_config.json

得到一个包含org3配置的新的channel配置文件modified_config.json。

将mychannel-config.json和modified_config.json编码为protobuf格式：

	./bin/configtxlator proto_encode --input ./org3-artifacts/mychannel-config.json --type common.Config --output ./org3-artifacts/mychannel-config.pb
	
	./bin/configtxlator proto_encode --input ./org3-artifacts/modified_config.json --type common.Config --output ./org3-artifacts/modified_config.pb

计算出modified_config.pb与config.pb之间的差异，并记录到文件`org3_update.pb`中：

	./bin/configtxlator compute_update --channel_id mychannel --original ./org3-artifacts/mychannel-config.pb --updated ./org3-artifacts/modified_config.pb --output ./org3-artifacts/org3_update.pb

将差异文件`org3_update.pb`转换为json格式：

	./bin/configtxlator proto_decode --input ./org3-artifacts/org3_update.pb --type common.ConfigUpdate | jq . > ./org3-artifacts/org3_update.json

为`org3_update.json`添加envelope message，即添加header信息:

	echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":'$(cat ./org3-artifacts/org3_update.json)'}}}' | jq . > ./org3-artifacts/org3_update_in_envelope.json

最后，把`org3_update_in_envelope.json`转换成protobuf格式：

	./bin/configtxlator proto_encode --input ./org3-artifacts/org3_update_in_envelope.json --type common.Envelope --output ./org3-artifacts/org3_update_in_envelope.pb

### 签署更新文件，并提交更新

根据channel的mod_policy的要求，签署上一节得到的`org3_update_in_envelope.pb`。

要加入的channel只有org1和org2两个组织，channel的策略是`MAJORITY`，即更新操作需要Org1和Org2的签署:

	The modification policy (mod_policy) for our channel Application group is set 
	to the default of “MAJORITY”, which means that we need a majority of existing 
	org admins to sign it. 

先用`Org1的Admin`账号进行签署：

	cd Admin@org1.example.com/
	./peer.sh channel signconfigtx -f ../org3-artifacts/org3_update_in_envelope.pb

然后用`Org2的Admin`账号提交更新（提交时会自动进行签署）：

	cd ../Admin@org2.example.com/
	./peer.sh channel update -f ../org3-artifacts/org3_update_in_envelope.pb -c mychannel -o orderer.example.com:7050 --tls --cafile ./tlsca.example.com-cert.pem
	cd ..

## 部署org3的peer0

在目录peer0.org3.example.com存放部署文件：

	mkdir peer0.org3.example.com

### 准备peer程序与配置文件

现将peer命令准备好：

	cp bin/peer peer0.org3.example.com/

然后准备peer的配置文件`peer0.org3.example.com/core.yaml`:

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
	    id: peer0.org3.example.com
	    networkId: dev
	    listenAddress: 0.0.0.0:7051
	    address: 0.0.0.0:7051
	    addressAutoDetect: false
	    gomaxprocs: -1
	    gossip:
	        bootstrap: 127.0.0.1:7051
	        bootstrap: peer0.org3.example.com:7051
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
	        externalEndpoint: peer0.org3.example.com:7051
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
	    localMspId: Org3MSP
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

配置文件中指定的数据存放路径是./data，创建：

	mkdir peer0.org3.example.com/data

添加一个启动脚本peer0.org3.example.com/start.sh:

	#!/bin/bash
	./peer node start 2>&1 |tee log

### 准备peer0.org3.example.com的证书

将certs中的目录复制到peer0.org3.example.com中，后面将在cryptogen生成的证书目录的基础上进行替换：

	cp -rf certs/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/* peer0.org3.example.com/

使用从fabric-CA中获取的msp替换cryptogen生成的msp：

	rm -rf peer0.org3.example.com/msp/
	cp -rf fabric-ca-files/org3.example.com/peer0/msp peer0.org3.example.com/

将没有用到的中间CA删除：

	rm peer0.org3.example.com/msp/intermediatecerts/localhost-7054.pem

将`Admin@org3.example.com`的证书添加到msp/admincerts目录中：

	mkdir peer0.org3.example.com/msp/admincerts
	cp fabric-ca-files/org3.example.com/admin/msp/signcerts/cert.pem peer0.org3.example.com/msp/admincerts/

### 部署

将peer0.org3.example.com目录中的内容复制到目标机器上。

目标机器上需要安装并启动docker：

	yum install -y epel-release
	yum install -y docker
	systemctl start docker

并导入当前使用的版本会用到docker镜像:

	scp -r docker-images root@192.168.88.13:/root/
	
然后到目标机器的docker-images目录中执行：

	./load.sh

这里将peer0.org3.example.com部署在机器`192.168.88.13`上，在上面创建目录：

	mkdir -p /opt/app/fabric/peer
	scp -r peer0.org3.example.com/* root@192.168.88.13:/opt/app/fabric/peer/

更新所有机器上的/etc/hosts文件，在其中增加peer0.org3.example.com：

	192.168.88.10 orderer.example.com
	192.168.88.10 peer0.org1.example.com
	192.168.88.11 peer1.org1.example.com
	192.168.88.12 peer0.org2.example.com
	192.168.88.13 peer0.org3.example.com

然后在org3.example.com上启动peer:

	cd /opt/app/fabric/peer
	./start.sh

这时候peer0.org3.example.com只是启动了，还没有加入到channel中。

## 管理peer0.org3.example.com

在fabric-deloy中创建一个目录Admin@org3.example.com，用来对peer0.org3.example.com进行操作：

	mkdir Admin@org3.example.com

将通过cryptogen生成的tls等证书复制过来：

	cp -rf certs/peerOrganizations/org3.example.com/users/Admin@org3.example.com/*  Admin\@org3.example.com/

用从fabric-CA获取的msp替换其中的msp:

	rm -rf Admin@org3.example.com/msp/
	cp -rf fabric-ca-files/org3.example.com/admin/msp Admin\@org3.example.com/

添加admincerts，必须要有否则报错:

	mkdir Admin@org3.example.com/msp/admincerts
	cp Admin@org3.example.com/msp/signcerts/cert.pem Admin@org3.example.com/msp/admincerts/

删除没有用到的中间CA：

	rm -rf Admin@org3.example.com/msp/intermediatecerts/localhost-7054.pem

还需要准备一个core.yaml，否则会报错：

	cp peer0.org3.example.com/core.yaml Admin@org3.example.com/

如果要访问orderer.example.com，还需要将example.com的CA复制过来：

	cp certs/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem  Admin@org3.example.com/

创建脚本`Admin@org3.example.com/peer.sh`，通过这个脚本运行peer程序，可以简化后续的操作:

	#!/bin/bash
	PATH=`pwd`/../bin:$PATH
	
	export FABRIC_CFG_PATH=`pwd`
	
	export CORE_PEER_TLS_ENABLED=true
	export CORE_PEER_TLS_CERT_FILE=./tls/client.crt
	export CORE_PEER_TLS_KEY_FILE=./tls/client.key
	
	export CORE_PEER_MSPCONFIGPATH=./msp
	export CORE_PEER_ADDRESS=peer0.org3.example.com:7051
	export CORE_PEER_LOCALMSPID=Org3MSP
	export CORE_PEER_TLS_ROOTCERT_FILE=./tls/ca.crt
	export CORE_PEER_ID=cli
	export CORE_LOGGING_LEVEL=INFO
	
	peer $*

进入Admin@org3.example.com目录进行操作：

	$ cd Admin@org3.example.com/
	$ ls
	core.yaml  msp  peer.sh  tls
	$ ./peer.sh node status
	status:STARTED
	2018-06-18 10:32:00.759 UTC [main] main -> INFO 001 Exiting.....

### 加入channel

在Admin@org3.example.com目录中操作：

	cd Admin@org3.example.com/

向orderer请求要加入的channel的`genesis block`。

	./peer.sh channel fetch 0 mychannel.block -o orderer.example.com:7050 -c mychannel --tls --cafile tlsca.example.com-cert.pem

然后加入channel: 

	./peer.sh channel join -b mychannel.block

执行下面的命令，应当看到`mychannel`:

	$ ./peer.sh channel list
	Channels peers has joined:
	mychannel

注意观察日志中是否有报错，peer0.org3.example.com的日志中刚开始会有一个错误：

	2018-06-18 15:27:17.839 UTC [gossip/service] updateAnchors -> ERRO 02c Tried joining channel mychannel but our org( Org3MSP ), isn't among the orgs of the channel: [Org2MSP Org1MSP] , aborting.

这个错误应当是刚开始加入channel是出现的，不影响最终结果。（更具体的情况，还需要进一步深入研究）

### 更新合约

由于增加了新的成员，因此需要更新合约的背书策略。

在org1、org2、org3中均安装最新版本的合约：

	./peer.sh chaincode install -n demo -v 0.0.2 -p github.com/lijiaocn/fabric-chaincode-example/demo

然后通过org1或org2发起更新合约的请求：

	./peer.sh chaincode upgrade -o orderer.example.com:7050 --tls true --cafile ./tlsca.example.com-cert.pem -C mychannel -n demo -v 0.0.2 -c '{"Args":["init"]}' -P "OR('Org1MSP.member','Org2MSP.member', 'Org3MSP.member')

然后就可以通过org3的peer调用合约：

	cd Admin@org3.example.com
	./peer.sh chaincode query -C mychannel -n demo -c '{"Args":["attr","role"]}'

### 指定AnchorPeer

[Anchor Peer][9]是一个组织的锚点Peer，这个peer的地址被写入到Channel的配置中，这样其它组织的peer就能够通过这个组织
的Anchor Peer的找到该组织内的其它Peer。

注意下面这种修改方法是不行的。

修改configtx.yaml，在profile中加入org3:

	    TwoOrgsChannel:
	        Consortium: SampleConsortium
	        Application:
	            <<: *ApplicationDefaults
	            Organizations:
	                - *Org1
	                - *Org2
	                - *Org3

然后生成org3的锚点文件：

	./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate Org3MSPanchors.tx -channelID mychannel -asOrg Org3MSP

然后设置锚点：

	cd Admin@org3.example.com/
	./peer.sh channel update -o orderer.example.com:7050 -c mychannel -f ../Org3MSPanchors.tx --tls true --cafile ./tlsca.example.com-cert.pem

报错！这种方式是不行的。

	!!Error: got unexpected status: BAD_REQUEST -- error authorizing update: error validating ReadSet: readset expected key [Group]  /Channel/Application at version 1, but got version 2

查看`configtxgen -h`可以看到`only for the first update`：

	-outputAnchorPeersUpdate string
	   Creates an config update to update an anchor peer (works only with the default channel creation, and only for the first update)

需要读取最新的channel配置，然后更新其中的Anchor。

注意下面的操作在`Admin@org3.example.com目录中`进行。

	cd Admin@org3.example.com/

读取最新的channel配置:

	./peer.sh channel fetch config config_block.pb -c mychannel -o orderer.example.com:7050  --tls --cafile tlsca.example.com-cert.pem
	
转换成json格式：

	../bin/configtxlator proto_decode --input ./config_block.pb --type common.Block | jq .data.data[0].payload.data.config > ./mychannel-config.json

创建文件org3_anchor.json：

	{
	"AnchorPeers": {
	   "mod_policy": "Admins",
	   "value": {
	     "anchor_peers": [
	       {
	         "host": "peer0.org3.example.com",
	         "port": 7051
	       }
	     ]
	   },
	   "version": "0"
	 }
	}

将org3-anchor.json添加到mychannel-config.json中，得到一个新的配置文件

	jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP": { "values": .[1]}}}}}}' ./mychannel-config.json ./org3-anchor.json > ./modified_config.json

将mychannel-config.json和modified_config.json编码为protobuf格式（后续基本上就是重复添加org3时的操作）：

	../bin/configtxlator proto_encode --input ./mychannel-config.json --type common.Config --output ./mychannel-config.pb
	
	../bin/configtxlator proto_encode --input ./modified_config.json --type common.Config --output ./modified_config.pb

计算出modified_config.pb与config.pb之间的差异，并记录到文件`org3_update.pb`中：

	../bin/configtxlator compute_update --channel_id mychannel --original ./mychannel-config.pb --updated ./modified_config.pb --output ./org3_update.pb

将差异文件`org3_update.pb`转换为json格式：

	../bin/configtxlator proto_decode --input ./org3_update.pb --type common.ConfigUpdate | jq . > ./org3_update.json

为`org3_update.json`添加envelope message，即添加header信息:

	echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":'$(cat ./org3_update.json)'}}}' | jq . > ./org3_update_in_envelope.json

把`org3_update_in_envelope.json`转换成protobuf格式：

	../bin/configtxlator proto_encode --input ./org3_update_in_envelope.json --type common.Envelope --output ./org3_update_in_envelope.pb

提交更新：

	./peer.sh channel update -f ./org3_update_in_envelope.pb -c mychannel -o orderer.example.com:7050 --tls --cafile ./tlsca.example.com-cert.pem

注意这里不需要再去找org1和org2进行签署了，因为改动的只有org3的anchor。

这时候在读取channel的配置，会看到Org3MSP已经有Anchor了：

	$ ./peer.sh channel fetch config new_config_block.pb -c mychannel -o orderer.example.com:7050  --tls --cafile tlsca.example.com-cert.pem
	$ ../bin/configtxlator proto_decode --input ./new_config_block.pb --type common.Block | jq .data.data[0].payload.data.config > ./new_mychannel-config.json
	$ cat ./new_mychannel-config.json |grep peer0
	                      "host": "peer0.org1.example.com",
	                      "host": "peer0.org2.example.com",
	                      "host": "peer0.org3.example.com",

## 回顾Channel配置更新

[Updating a Channel Configuration][5]中对Channel的配置更新做出详细介绍。

Channel的配置信息也存放在区块链上，是一个配置区块(configuration block)。第一个配置区块就是部署Fabric的使用的创世块（genesis block）。

更新Channel的过程就是从Fabric中读取最新的配置，然后将其转换为可读格式，完成更改后，提交到Fabric中。

[Channel Configuration (configtx)][6]中介绍了channel的配置文件格式，以及更新过程。

[Capability Requirements][7]中介绍了网络中fabric的不同版本共存时，应当怎样处理。

![区块链实践分享]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 参考

1. [Bring Org3 into the Channel Manually][1]
2. [Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][2]
3. [超级账本HyperLedger视频教程：Fabric的手动部署教程][3]
4. [超级账本HyperLedger视频教程][4]
5. [Updating a Channel Configuration][5]
6. [Channel Configuration (configtx)][6]
7. [Capability Requirements][7]
8. [超级账本HyperLedger Fabric中Channel配置的读取转换][8]
9. [HyperLedger Fabric :Anchor Peer][9]

[1]: http://hyperledger-fabric.readthedocs.io/en/latest/channel_update_tutorial.html#bring-org3-into-the-channel-manually "Bring Org3 into the Channel Manually" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html  "Fabric-CA的使用演示(两个组织一个Orderer三个Peer)" 
[3]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html "fabric项目的手动部署教程"
[4]: https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006 "超级账本HyperLedger视频教程"
[5]: http://hyperledger-fabric.readthedocs.io/en/latest/config_update.html "Updating a Channel Configuration"
[6]: http://hyperledger-fabric.readthedocs.io/en/latest/configtx.html  "Channel Configuration (configtx)"
[7]: http://hyperledger-fabric.readthedocs.io/en/latest/capability_requirements.html "Capability Requirements"
[8]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/19/hyperledger-channel-config-operation.html "超级账本HyperLedger Fabric中Channel配置的读取转换"
[9]: http://hyperledger-fabric.readthedocs.io/en/latest/glossary.html#anchor-peer  "HyperLedger Fabric :Anchor Peer"

