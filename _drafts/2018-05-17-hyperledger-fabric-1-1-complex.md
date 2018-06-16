---
layout: default
title:  "超级账本HyperLedger Fabric1.1的使用进阶"
author: lijiaocn
createdate: 2018/05/17 14:54:00
changedate: 2018/06/12 11:24:46
categories: 项目
tags: hyperledger
keywords: hyperledger,fabric,使用进阶,生产实践
description: 

---

* auto-gen TOC:
{:toc}

## 说明

在Hyperledger Fabric最新(2018-05-17 15:04:40)文档中增加了[Adding an Org to a Channel][2]和
[Upgrading Your Network Components][3]两个章节。这是实践中会遇到的很实际的场景。

## 快速体验

这里先通过[fabric-samples][1]中提供的脚本，快速地体验一下。

	git clone https://github.com/hyperledger/fabric-samples.git
	cd fabric-samples
	git checkout v1.1.0

这里使用的版本是1.1.0，fabric-samples v1.1.0中的演示脚本对fabric版本是有要求的，不支持1.0.6版本的。

从网址[HyplerLedger Fabric Download][4]下载1.1.0版本的fabric文件：

	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/darwin-amd64-1.1.0/hyperledger-fabric-darwin-amd64-1.1.0.tar.gz
	tar -xvf hyperledger-fabric-darwin-amd64-1.1.0.tar.gz

一定要更新Docker镜像，fabric-samples中的脚本会通过运行Docker容器获取版本信息：

	./bin/get-docker-images.sh

>需要对这个脚本做修改：BASE_DOCKER_TAG=x86_64-1.1.0

别忘了将bin目录添加到环境变量PATH中。

### Adding an Org to a Channel

在目录`fabric-samples/first-network/`中操作，如果本地已经有运行的fabric，先停止：

	./byfn.sh down

然后生成将会使用的配置文件：

	./byfn.sh generate

最后启动，需要指定版本号1.1.0：

	./byfn.sh up -i 1.1.0

在Channel中添加新的组织`Org3`的过程被打包在`./eyfn.sh`脚本中，直接执行就可以完成Org3的添加：

	./eyfn.sh up

## 使用通过fabricCA生成的证书

[Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][5]中在[hyperledger的fabric项目的全手动部署][6]的基础上，通过FabricCA生成相关的证书后，
除了替换证书外，还重新生成了下面的文件：

	1. 初始块 ./genesisblock
	2. channel文件、锚点文件。 

## 在channel中添加新成员org3的过程

[Bring Org3 into the Channel Manually][7]中介绍了，怎样在一个已经拥有org1和org2的channel中，添加一个新成员org3。

下面分析添加的过程。

### 生成org3的组织、用户证书和私钥

首先生成org3的组织、用户证书和私钥，在目录`org3-artifacts/`中有一个org3-crypto.yaml文件：

	PeerOrgs:
	  # --------------------------------------------------------------------
	  # Org3
	  # --------------------------------------------------------------------
	  - Name: Org3
	    Domain: org3.example.com
	    EnableNodeOUs: true
	    Template:
	      Count: 2
	    Users:
	      Count: 1

使用`cryptogen`命令生成:

	cryptogen generate --config=./org3-crypto.yaml

执行以后得到下面的文件：

	$ls crypto-config/peerOrganizations/org3.example.com/
	ca  msp   peers tlsca users

>这里是用cryptogen命令生成证书的，也可以通过fabricCA生成。

然后生成org3的配置文件，org3.json：

	configtxgen -printOrg Org3MSP > ../channel-artifacts/org3.json

org3.json是org3的配置文件，里面包含了org3的策略配置和base64编码的证书，注意只有证书，不包含私钥。

包含的证书分别是org3的admin的证书、CA根证书、TLS根证书，文件比较大这里就不列出了。

### 将orderer的证书复制到org3的证书目录中

	cp -r crypto-config/ordererOrganizations org3-artifacts/crypto-config/

`crypto-config/ordererOrganizations`是已经部署好的fabric中orderer组织的证书。把它复制到org3的证书
目录中，是因为后续操作中会引用其中的文件。

### 获取channel的最新配置

获取mychannel的最新配置：

	./peer.sh channel fetch config config_block.pb -c mychannel -o orderer.example.com:7050  --tls --cafile tlsca.example.com-cert.pem

执行后会得到一个config_block.pb文件，config_block.pb是一个protobuf格式的文件。

使用configtxlator将其解码为json格式，并只取出其中config部分（舍弃了header以及metadata等内容）

	configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config > config.json

将config.json复制到`fabric-samples/first-network/`，后续操作在该目录下进行。

将前面生成的`./channel-artifacts/org3.json`文件追加到channel配置文件中：

	jq -s '.[0] * {"channel_group":{"groups":{"Application":{"groups": {"Org3MSP":.[1]}}}}}' config.json ./channel-artifacts/org3.json > modified_config.json

得到一个包含org3配置的新的channel配置文件modified_config.json。

将config.json和modified_config.json编码为protobuf格式：

	configtxlator proto_encode --input config.json --type common.Config --output config.pb
	configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb

然后计算出modified_config.pb与config.pb之间的差异`org3_update.pb`：

	configtxlator compute_update --channel_id mychannel --original config.pb --updated modified_config.pb --output org3_update.pb

将差异文件`org3_update.pb`解码为json格式`org3_update.json`：

	configtxlator proto_decode --input org3_update.pb --type common.ConfigUpdate | jq . > org3_update.json

为`org3_update.json`添加envelope message，即添加header信息:

	echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":'$(cat org3_update.json)'}}}' | jq . > org3_update_in_envelope.json

最后，把`org3_update_in_envelope.json`转换成protobuf格式：

	configtxlator proto_encode --input org3_update_in_envelope.json --type common.Envelope --output org3_update_in_envelope.pb

### 签署并提交更新

根据channel的mod_policy的要求，签署上一节得到的`org3_update_in_envelope.pb`。

`fabric-samples/first-network/`中只有两个组织，channel的策略是`MAJORITY`:

	The modification policy (mod_policy) for our channel Application group is set 
	to the default of “MAJORITY”, which means that we need a majority of existing 
	org admins to sign it. 

将org3_update_in_envelope.pb复制到tmp:

	cp org3_update_in_envelope.pb /tmp/

首先用org1的Admin进行签署：

	cd /opt/app/fabric/cli/user/org1.example.com/Admin-peer0.org1.example.com/
	./peer.sh channel signconfigtx -f /tmp/org3_update_in_envelope.pb

然后用org2的Admin再签署一次：

	cd /opt/app/fabric/cli/user/org2.example.com/Admin-peer0.org2.example.com/
	./peer.sh channel signconfigtx -f /tmp/org3_update_in_envelope.pb

最后用任意一个组织的Admin用户更新channel：

	./peer.sh channel update -f /tmp/org3_update_in_envelope.pb -c mychannel -o orderer.example.com:7050 --tls --cafile ./tlsca.example.com-cert.pem

### Org3的Peer加入channel

Org3的Peer启动之后，首先向orderer请求要加入的channel的`genesis block`。

	peer channel fetch 0 mychannel.block -o orderer.example.com:7050 -c $CHANNEL_NAME --tls --cafile $ORDERER_CA

>However, we can’t begin our ledger with a downstream block – we must start with block 0.

然后加入channel：

	peer channel join -b mychannel.block

## 参考

1. [github fabric-samples][1]
2. [HyplerLedger Fabric: Adding an Org to a Channel][2]
3. [HyplerLedger Fabric: Upgrading Your Network Components][3]
4. [HyplerLedger Fabric Download][4]
5. [Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][5]
6. [hyperledger的fabric项目的全手动部署][6]
7. [Bring Org3 into the Channel Manually][7]

[1]: https://github.com/hyperledger/fabric-samples.git "github fabric-samples" 
[2]: http://hyperledger-fabric.readthedocs.io/en/latest/channel_update_tutorial.html "HyplerLedger Fabric: Adding an Org to a Channel"
[3]: http://hyperledger-fabric.readthedocs.io/en/latest/upgrading_your_network_tutorial.html "HyplerLedger Fabric: Upgrading Your Network Components"
[4]: https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/ "HyplerLedger Fabric Download"
[5]: http://www.lijiaocn.com/项目/2018/05/04/fabric-ca-example.html "Fabric-CA的使用演示(两个组织一个Orderer三个Peer)"
[6]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html "hyperledger的fabric项目的全手动部署"
[7]: http://hyperledger-fabric.readthedocs.io/en/latest/channel_update_tutorial.html#bring-org3-into-the-channel-manually "Bring Org3 into the Channel Manually"
