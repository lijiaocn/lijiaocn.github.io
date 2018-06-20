---
layout: default
title:  超级账本HyperLedger Fabric中Channel配置的读取转换
author: 李佶澳
createdate: 2018/06/19 19:38:00
changedate: 2018/06/20 14:12:28
categories: 项目
tags: HyperLedger
keywords: HyperLedger,超级账本,configtxlator,配置文件
description: HyperLedger Fabric的Channel的配置文件，以及配置的读取、更新是比较让人迷惑的

---

* auto-gen TOC:
{:toc}

## 说明

[超级账本HyperLedger视频教程演示汇总：HyperLedger Fabric的视频讲解--“主页”中可领优惠券](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)

HyperLedger Fabric的Channel的配置文件，以及配置的读取、更新是比较让人迷惑的，有必要单独介绍一下。

## Channel配置也是区块

[Channel Configuration (configtx)][1]中对`configuration transactions`做了清晰的介绍。

Channel的信息，例如有几个成员、每个成员的情况等，是打包在区块中，分发到每个peer中的。

[超级账本HyperLedger视频教程：Fabric的手动部署教程][2]中部署Fabric时，生成的创始块，是第一个channel的配置信息:

	./bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./genesisblock

对channel配置的更新，是对账本的更改，也是一次`transaction`，被称为`configuration transactions`，缩写为`configtx`。

HyplerLedger Fabric中有两个以"configtx"为前缀的工具：

[configtxgen][3]用来生成或者查看channel的配置文件。

[configtxlator][4]用来将配置文件在protobuf和json格式之间转换。

## Channel配置的文件格式

[Channel Configuration (configtx)][1]中介绍channel的配置文件格式:

	Groups
	    Application
	    Orderer
	    Consortiums
	Values

配置文件是json格式，有`Groups`和`Values`组成，其中Groups分为三部分，`Application`记录的是Channel的成员，Orderer中记录的用来排序的orderer，Consortiums是用来组成Fabric网络的成员。

完整的定义如下：

	&ConfigGroup{
	    Groups: map<string, *ConfigGroup> {
	        "Application":&ConfigGroup{
	            Groups:map<String, *ConfigGroup> {
	                {{org_name}}:&ConfigGroup{
	                    Values:map<string, *ConfigValue>{
	                        "MSP":msp.MSPConfig,
	                        "AnchorPeers":peer.AnchorPeers,
	                    },
	                },
	            },
	        },
	        "Orderer":&ConfigGroup{
	            Groups:map<String, *ConfigGroup> {
	                {{org_name}}:&ConfigGroup{
	                    Values:map<string, *ConfigValue>{
	                        "MSP":msp.MSPConfig,
	                    },
	                },
	            },
	
	            Values:map<string, *ConfigValue> {
	                "ConsensusType":orderer.ConsensusType,
	                "BatchSize":orderer.BatchSize,
	                "BatchTimeout":orderer.BatchTimeout,
	                "KafkaBrokers":orderer.KafkaBrokers,
	            },
	        },
	        "Consortiums":&ConfigGroup{
	            Groups:map<String, *ConfigGroup> {
	                {{consortium_name}}:&ConfigGroup{
	                    Groups:map<string, *ConfigGroup> {
	                        {{org_name}}:&ConfigGroup{
	                            Values:map<string, *ConfigValue>{
	                                "MSP":msp.MSPConfig,
	                            },
	                        },
	                    },
	                    Values:map<string, *ConfigValue> {
	                        "ChannelCreationPolicy":common.Policy,
	                    }
	                },
	            },
	        },
	    },
	
	    Values: map<string, *ConfigValue> {
	        "HashingAlgorithm":common.HashingAlgorithm,
	        "BlockHashingDataStructure":common.BlockDataHashingStructure,
	        "Consortium":common.Consortium,
	        "OrdererAddresses":common.OrdererAddresses,
	    },
	}

## Channel配置的更新文件

更新channel配置的时候，只需要提交更新的部分：

	message ConfigUpdateEnvelope {
		bytes config_update = 1;
		repeated ConfigSignature signatures = 2;
	}

被更新的条目会有各自的更改策略`mod_policy`，提交的更新必须包含足够的签名(满足mod_policy)，才能被接受。

	message ConfigSignature {
	    bytes signature_header = 1;
	    bytes signature = 2;
	}

[在已有的Channel中添加新的组织][5]的操作中，有一步就是计算出被更新的部分：

	./bin/configtxlator compute_update --channel_id mychannel --original ./org3-artifacts/mychannel-config.pb --updated ./org3-artifacts/modified_config.pb --output ./org3-artifacts/org3_update.pb

## Channel配置的生成

`configtxgen`是用来生成配置文件的，它读取confitx.yaml中的信息，然后按照命令行参数，生成对应的配置文件。

在[Fabric的手动部署教程][2]的中，用这个命令生成了创始块，也就是channel的第一个配置：

	./bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./genesisblock

mychannel的配置：

	./bin/configtxgen -profile TwoOrgsChannel -outputCreateChannelTx mychannel.tx -channelID mychannel

以及两个组织的AnchorPeer更新文件：

	./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP
	./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate Org2MSPanchors.tx -channelID mychannel -asOrg Org2MSP

在[在已有的Channel中添加新的组织][5]中，用configtxgen生成了Org3的json格式的配置文件：

	$ ./bin/configtxgen -printOrg Org3MSP > ./org3-artifacts/org3.json
	2018-06-18 08:35:14.998 UTC [common/tools/configtxgen] main -> INFO 001 Loading configuration

查看configtxgen的命令行手册，可以看到它所有的功能：

	$ ./configtxgen -h
	Usage of ./configtxgen:
	  -asOrg string
	        Performs the config generation as a particular organization (by name), only including values in the write set that org (likely) has privilege to set
	  -channelID string
	        The channel ID to use in the configtx (default "testchainid")
	  -inspectBlock string
	        Prints the configuration contained in the block at the specified path
	  -inspectChannelCreateTx string
	        Prints the configuration contained in the transaction at the specified path
	  -outputAnchorPeersUpdate string
	        Creates an config update to update an anchor peer (works only with the default channel creation, and only for the first update)
	  -outputBlock string
	        The path to write the genesis block to (if set)
	  -outputCreateChannelTx string
	        The path to write a channel creation configtx to (if set)
	  -printOrg string
	        Prints the definition of an organization as JSON. (useful for adding an org to a channel manually)
	  -profile string
	        The profile from configtx.yaml to use for generation. (default "SampleInsecureSolo")
	  -version
	        Show version information

它的主要功能就是使用三个`-outputXXX`分别生成AnchorPeer的更新文件、创世块、channel的创建文件：

	-outputAnchorPeersUpdate string
	    Creates an config update to update an anchor peer (works only with the default channel creation, and only for the first update)
	-outputBlock string
	    The path to write the genesis block to (if set)
	-outputCreateChannelTx string
	    The path to write a channel creation configtx to (if set)

以及一个`-printOrg`用来将指定的组织的所有信息打包到一个json文件中：

	  -printOrg string


## 查看Channel的配置文件与更新

`configtxgen`对应的还提供了两个`-inspectXX`参数，用来将生成的二进制文件转换称可读格式:

查看创始区块：

	./bin/configtxgen -inspectBlock ./genesisblock
	{
	    "data": {
	        "data": [
	            {
	                "payload": {
	                    "data": {
	                        "config": {
	                            "channel_group": {
	...

查看channel的创建文件：

	$ ./bin/configtxgen  -inspectChannelCreateTx mychannel.tx
	{
	    "payload": {
	        "data": {
	            "config_update": {
	                "channel_id": "mychannel",
	                "read_set": {
	...

channel的更新文件用同样的方式查看：

	$ ./bin/configtxgen  -inspectChannelCreateTx   Org1MSPanchors.tx
	{
	    "payload": {
	        "data": {
	            "config_update": {
	                "channel_id": "mychannel",
	                "read_set": {
	...

## 从Fabric中读取最新的Channel配置

[Channel Configuration][5]介绍了channel的[创建][6]过程与[更新][7]过程，channel的配置最终也要分发到每个peer。

可以用`peer channel`命令从Fabric中读取最新的channel配置，[在已有的Channel中添加新的组织][5]中就是这样做的：

	cd Admin@org1.example.com/
	./peer.sh channel fetch config config_block.pb -c mychannel -o orderer.example.com:7050  --tls --cafile tlsca.example.com-cert.pem

peer1.1.0中，子命令channel的子命令都有：

	Available Commands:
	  create       Create a channel
	  fetch        Fetch a block
	  getinfo      get blockchain information of a specified channel.
	  join         Joins the peer to a channel.
	  list         List of channels peer has joined.
	  signconfigtx Signs a configtx update.
	  update       Send a configtx update.

## protobuf与json格式的转换

从fabric中读取的block格式为protobuf格式，可以用`configtxlator`将其转换为json格式：

	./bin/configtxlator proto_decode --input ./org3-artifacts/config_block.pb --type common.Block

[configtxlator][4]中介绍了configtxlator的使用方法，主要有四个子命令：

	start [<flags>]
	    Start the configtxlator REST server
	
	proto_encode --type=TYPE [<flags>]
	    Converts a JSON document to protobuf.
	
	proto_decode --type=TYPE [<flags>]
	    Converts a proto message to JSON.
	
	compute_update --channel_id=CHANNEL_ID [<flags>]
	    Takes two marshaled common.Config messages and computes the config update which transitions between the two.

将json文件编码为protobuf格式:

	./bin/configtxlator proto_encode --input ./org3-artifacts/modified_config.json --type common.Config --output ./org3-artifacts/modified_config.pb

>注意在解码、编码操作中，都需要用参数`--type`指定类型。

计算出modified_config.pb与config.pb之间的差异，并记录到文件`org3_update.pb`中：

	./bin/configtxlator compute_update --channel_id mychannel --original ./org3-artifacts/mychannel-config.pb --updated ./org3-artifacts/modified_config.pb --output ./org3-artifacts/org3_update.pb

## protobuf消息的类型

configtxlator在编码解码过程中，需要用`--type`指定类型，fabric的类型定义文件在源代码目录[protos][8]中:

	$ find ./protos -name "*.proto"
	./protos/ledger/rwset/kvrwset/kv_rwset.proto
	./protos/ledger/rwset/rwset.proto
	./protos/ledger/queryresult/kv_query_result.proto
	./protos/gossip/message.proto
	./protos/orderer/configuration.proto
	./protos/orderer/kafka.proto
	./protos/orderer/ab.proto
	./protos/peer/events.proto
	./protos/peer/chaincode_shim.proto
	./protos/peer/transaction.proto
	./protos/peer/configuration.proto
	./protos/peer/peer.proto
	./protos/peer/chaincode.proto
	./protos/peer/query.proto
	./protos/peer/signed_cc_dep_spec.proto
	./protos/peer/proposal_response.proto
	./protos/peer/proposal.proto
	./protos/peer/chaincode_event.proto
	./protos/peer/admin.proto
	./protos/common/policies.proto
	./protos/common/ledger.proto
	./protos/common/configuration.proto
	./protos/common/configtx.proto
	./protos/common/common.proto
	./protos/msp/msp_principal.proto
	./protos/msp/identities.proto
	./protos/msp/msp_config.proto

还是以[在已有的Channel中添加新的组织][5]中的操作为例。

下面命令中指定的`common.Block`：

	./bin/configtxlator proto_decode --input ./org3-artifacts/config_block.pb --type common.Block

就是在`protos/common/common.proto`中定义的：

	message Block {
	    BlockHeader header = 1;
	    BlockData data = 2;
	    BlockMetadata metadata = 3;
	}

对应的go语言的源码`./protos/common/common.pb.go`：

	type Block struct {
	    Header   *BlockHeader   `protobuf:"bytes,1,opt,name=header" json:"header,omitempty"`
	    Data     *BlockData     `protobuf:"bytes,2,opt,name=data" json:"data,omitempty"`
	    Metadata *BlockMetadata `protobuf:"bytes,3,opt,name=metadata" json:"metadata,omitempty"`
	}

channel配置的更新文件对应的类型为`common.ConfigUpdate`：

	./bin/configtxlator proto_decode --input ./org3-artifacts/org3_update.pb --type common.ConfigUpdate | jq . > ./org3-artifacts/org3_update.json

将更新内容向fabric中提交时，需要加上信封，对应类型为`common.Envelope`：

	echo '{"payload":{"header":{"channel_header":{"channel_id":"mychannel", "type":2}},"data":{"config_update":'$(cat ./org3-artifacts/org3_update.json)'}}}' | jq . > ./org3-artifacts/org3_update_in_envelope.json
	./bin/configtxlator proto_encode --input ./org3-artifacts/org3_update_in_envelope.json --type common.Envelope --output ./org3-artifacts/org3_update_in_envelope.pb

## 参考

1. [Channel Configuration (configtx)][1]
2. [超级账本HyperLedger视频教程：Fabric的手动部署教程][2]
3. [configtxgen][3]
4. [configtxlator][4]
5. [在已有的Channel中添加新的组织][5]
6. [Channel Configuration: Channel creation][6]
7. [Channel Configuration: Configuration updates][7]
8. [HyperLedger Fabric protos][8]

[1]: http://hyperledger-fabric.readthedocs.io/en/latest/configtx.html  "Channel Configuration (configtx)"
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html "超级账本HyperLedger视频教程：Fabric的手动部署教程"
[3]: http://hyperledger-fabric.readthedocs.io/en/latest/commands/configtxgen.html "configtxgen"
[4]: http://hyperledger-fabric.readthedocs.io/en/latest/commands/configtxlator.html "configtxlator"
[5]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/18/hyperledger-fabric-add-new-org.html#%E6%9B%B4%E6%96%B0channel "在已有的Channel中添加新的组织"
[6]: http://hyperledger-fabric.readthedocs.io/en/latest/configtx.html#channel-creation "Channel Configuration: Channel creation"
[7]: http://hyperledger-fabric.readthedocs.io/en/latest/configtx.html#configuration-updates "Channel Configuration: Configuration updates"
[8]: https://github.com/hyperledger/fabric/tree/release-1.1/protos "HyperLedger Fabric protos"
