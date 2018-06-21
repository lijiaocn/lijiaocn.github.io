---
layout: default
title:  超级账本HyperLedger的Fabric项目部署过程时遇到的问题
author: 李佶澳
createdate: 2018/05/04 21:14:00
changedate: 2018/06/21 11:13:34
categories: 问题
tags: HyperLedger
keywords: 超级账本,视频教程演示,区块链实践,hyperledger,fabric,区块链问题
description: "这里记录部署hyperledger fabric时遇到的一些问题"

---

* auto-gen TOC:
{:toc}

## 说明

[超级账本HyperLedger视频教程演示汇总：HyperLedger Fabric的视频讲解--“主页”中可领优惠券](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)

本页内容会经常更新。

这里记录了部署hyperledger fabric时遇到的一些问题，部署过程见：[hyperledger的fabric项目的手动部署教程][1]

## 残留数据导致orderer启动失败

启动orderer的时候报错，orderer直接panic：

	2018-06-21 11:01:47.892 CST [orderer/commmon/multichannel] newLedgerResources -> CRIT 052 Error creating channelconfig bundle: initializing channelconfig failed: could not create channel Orderer sub-group config: setting up the MSP manager failed: the supplied identity is not valid: x509: certificate signed by unknown authority (possibly because of "x509: ECDSA verification failure" while trying to verify candidate authority certificate "ca.example.com")
	panic: Error creating channelconfig bundle: initializing channelconfig failed: could not create channel Orderer sub-group config: setting up the MSP manager failed: the supplied identity is not valid: x509: certificate signed by unknown authority (possibly because of "x509: ECDSA verification failure" while trying to verify candidate authority certificate "ca.example.com")

排查发现，部署orderer的机器上以前部署过orderer，并且orderer.yaml中配置的数据路径`/opt/app/fabric/orderer/data`中残留了以前的数据。

将/opt/app/fabric/orderer/data中的文件都删除后，问题解决。

## 创建channel时失败：Failed to reach implicit threshold of 1 sub-policies, required 1 remaining

问题现象与[peer channel creation fails in Hyperledger Fabric][2]中的现象相同

peer执行后，返回的结果如下：

	...
	Error: Got unexpected status: BAD_REQUEST -- Error authorizing update: Error validating DeltaSet: 
	Policy for [Groups] /Channel/Application not satisfied: Failed to reach implicit threshold of 1 
	sub-policies, required 1 remaining
	...

查看orderer的日志：

	ERRO 02d Principal deserialization failure (The supplied identity is
	not valid, Verify() returned x509: certificate signed by unknown
	authority) for identity

`yacovm`的在Stack Overflow上的[回答][2]非常有帮助，出现这种情况的原因通常有：

	The most common reasons are:
	
	    The identity is not in the list of admins for the org.
	    The identity's certificate is not validly signed by the org CA chain.
	    The identity's org is not known to the orderer.
	
	Some other unlikely possibilities because you are using the peer binary and not custom code:
	
	    The signature does not match the identity or signed bytes.
	    The identity is malformed.

我遇到这个问题的原因是用configtxgen生成创始块的时候，配置文件configtx.yaml指定了错误的msp目录。
导致生成的区块中包含的证书其它用户的证书。

	./bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./genesisblock

可以用下面的命令查看创始块的内容:

	./bin/configtxgen  -inspectBlock genesisblock

## /Channel/Application/Org2MSP but was in the read set

创建channel时,orderer报错，断开连接：

	Rejecting broadcast of config message from 10.4.108.90:56314 because of error:
	error authorizing update: error validating ReadSet: existing config does not 
	contain element for [Group]  /Channel/Application/Org2MSP but was in the read set

[peer channel creation fails in Hyperledger Fabric][8]有说明。

我遇到这个问题的原因是orderer的配置文件配置错误，

	GenesisMethod: provisional          <-- 应该是file
	GenesisProfile: SampleInsecureSolo
	GenesisFile: ./genesisblock

## premature execution - chaincode (mycc:1.0) is being launched - <nil>

在每个peer上都安装了合约之后，在其中一个节点上实例化后，成功启动了合约容器。然后通过另一个peer使用合约的时候，另一个peer上合约迟迟不能启动。

再次使用合约的时候，提示合约正在创建中：

	Error: Error endorsing query: rpc error: code = Unknown desc = error executing chaincode: premature execution - chaincode (mycc:1.0) is being launched - <nil>

查看目标peer上的docker日志，发现是找不到镜像：

	Handler for POST /containers/dev-peer0.org2.example.com-mycc-1.0/stop returned error: No such container: dev-peer0.org2.example.com-mycc-1.0"
	Handler for POST /containers/dev-peer0.org2.example.com-mycc-1.0/kill returned error: Cannot kill container dev-peer0.org2.example.com-mycc-1.0: No such container: dev-peer0.org2.example.com-mycc-1.0"
	Handler for DELETE /containers/dev-peer0.org2.example.com-mycc-1.0 returned error: No such container: dev-peer0.org2.example.com-mycc-1.0"
	Handler for POST /containers/create returned error: No such image: dev-peer0.org2.example.com-mycc-1.0-15b571b3ce849066b7ec74497da3b27e54e0df1345daff3951b94245ce09c42b:latest"
	Handler for GET /images/hyperledger/fabric-ccenv:x86_64-1.1.0/json returned error: No such image: hyperledger/fabric-ccenv:x86_64-1.1.0"
	Download failed, retrying: read tcp 10.39.0.127:35768->54.230.212.139:443: read: connection reset by peer"
	Download failed, retrying: read tcp 10.39.0.127:41289->54.230.212.252:443: read: connection reset by peer"
	Download failed, retrying: read tcp 10.39.0.127:58820->54.230.212.188:443: read: connection reset by peer"
	Download failed, retrying: read tcp 10.39.0.127:48137->54.230.212.184:443: read: connection reset by peer"
	Download failed, retrying: read tcp 10.39.0.127:41304->54.230.212.252:443: read: connection reset by peer"
	Download failed, retrying: read tcp 10.39.0.127:35801->54.230.212.139:443: read: connection reset by peer"
	Download failed, retrying: read tcp 10.39.0.127:48156->54.230.212.184:443: read: connection reset by peer"

怀疑是`hyperledger/fabric-ccenv:x86_64-1.1.0`下载不下来，在/etc/docker/daemon.json中添加镜像源:

	{"registry-mirror":["https://pee6w651.mirror.aliyuncs.com"],....}

重启docker后，下载下面的镜像：

	docker pull hyperledger/fabric-javaenv:latest
	docker pull hyperledger/fabric-javaenv:x86_64-1.1.0
	docker pull hyperledger/fabric-ccenv:latest
	docker pull hyperledger/fabric-ccenv:x86_64-1.1.0

## Failed to generate platform-specific docker build

向一个还没有运行合约容器的peer发起访问时，报错：

	Failed to generate platform-specific docker build: Error executing build: API error (500): {"message":"failed to initialize logging driver: dial tcp 127.0.0.1:24224: getsockopt: connection refused"}
	 "Error attaching: dial tcp 127.0.0.1:24224: getsockopt: connection refused

docker配置错误，配置了fluentd driver，但是fluentd不存在。

## No such image: dev-peer0.org2.example.com

向一个还没有运行合约容器的peer发起访问时，迟迟得不到相应，在peer上查看docker日志：

	No such image: dev-peer0.org2.example.com-mycc-1.0-15b571b3ce849066b7ec74497da3b27e54e0df1345daff3951b94245ce09c42b:latest

找不到合约容器的镜像，是因为peer上却少相关镜像，参考下面的“合约实例化不成功”。

## 合约实例化不成功

合约实例化时，长时间没有结果，peer日志现实如下：

	2018-03-29 16:33:59.167 CST [sccapi] deploySysCC -> INFO 031^[[0m system chaincode qscc/mychannel(github.com/hyperledger/fabric/core/chaincode/qscc) deployed
	2018-03-29 16:33:59.167 CST [nodeCmd] serve -> INFO 032^[[0m Starting peer with ID=[name:"peer1.org1.example.com" ], network ID=[dev], address=[10.39.0.122:7051]
	2018-03-29 16:33:59.168 CST [nodeCmd] serve -> INFO 033^[[0m Started peer with ID=[name:"peer1.org1.example.com" ], network ID=[dev], address=[10.39.0.122:7051]
	2018-03-29 16:33:59.168 CST [nodeCmd] func7 -> INFO 034^[[0m Starting profiling server with listenAddress = 0.0.0.0:6060
	2018-03-29 16:34:05.564 CST [golang-platform] GenerateDockerBuild -> INFO 035^[[0m building chaincode with ldflagsOpt: '-ldflags "-linkmode external -extldflags '-static'"'
	2018-03-29 16:34:05.564 CST [golang-platform] GenerateDockerBuild -> INFO 036^[[0m building chaincode with tags:

查看代码，发现是卡在了构建合约镜像地方。

	func DockerBuild(opts DockerBuildOptions) error {
		   client, err := cutil.NewDockerClient()
		   if err != nil {
		   	   return fmt.Errorf("Error creating docker client: %s", err)
		   }
		   if opts.Image == "" {
		   	   opts.Image = cutil.GetDockerfileFromConfig("chaincode.builder")
		   	   if opts.Image == "" {
		   	   	   return fmt.Errorf("No image provided and \"chaincode.builder\" default does not exist")
		   	   }
		   }

		   logger.Debugf("Attempting build with image %s", opts.Image)
	...

“Attempting build with image”这行日志没有打印出来。

查看core.yml文件，发现chaincode一节中指定了几个镜像：

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

将fabirc-ccenv、fabric-baseos、fabric-javaenv三个镜像提前下载好以后，实例化成功。

![知识星球区块链实践分享]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 连接其它Peer超时

日志显示，从其它Peer(192.168.88.10:7051)中读取信息是超时：

	2018-06-18 13:48:54.509 UTC [gossip/comm] authenticateRemotePeer -> WARN 035 Failed reading messge from 192.168.88.10:7051, reason: Timed out waiting for connection message from 192.168.88.10:7051
	2018-06-18 13:48:54.509 UTC [gossip/comm] Handshake -> WARN 036 Authentication failed: Timed out waiting for connection message from 192.168.88.10:7051

并且紧接着的是认证失败的日志。

查看另一个Peer的日志，发起连接的peer没有使用tls：

	2018-06-18 10:48:19.131 UTC [gossip/comm] authenticateRemotePeer -> WARN 3bda192.168.88.13:53496 didn't send TLS certificate
	2018-06-18 10:48:19.131 UTC [gossip/comm] GossipStream -> ERRO 3bdbAuthentication failed: No TLS certificate

检查发现是组织org3的msp目录中没有tlscacerts，导致通过configtxgen生成的org3.json中没有包含tls证书。

	    - &Org3
	        Name: Org3MSP
	        ID: Org3MSP
	        MSPDir: ./fabric-ca-files/org3.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org3.example.com
	              Port: 7051

应到有这个目录，且包含这个证书，直接从fabric-CA中读取的msp目录是没有tlscacerts的，通过crytogen生成的msp中有。

	$ ls ./fabric-ca-files/org3.example.com/msp/tlscacerts/
	tlsca.org3.example.com-cert.pem

## 参考

1. [hyperledger的fabric项目的手动部署教程][1]
2. [peer channel creation fails in Hyperledger Fabric][2]
8. [peer channel creation fails in Hyperledger Fabric][8]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html  "hyperledger的fabric项目的手动部署教程" 
[2]: https://stackoverflow.com/questions/45726536/peer-channel-creation-fails-in-hyperledger-fabric "peer channel creation fails in Hyperledger Fabric"
[8]: https://stackoverflow.com/questions/45726536/peer-channel-creation-fails-in-hyperledger-fabric "peer channel creation fails in Hyperledger Fabric"
