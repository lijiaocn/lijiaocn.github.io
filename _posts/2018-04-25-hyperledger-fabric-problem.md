---
layout: default
title:  超级账本HyperLedger：Fabric部署过程时遇到的问题汇总
author: 李佶澳
createdate: 2018/05/04 21:14:00
changedate: 2018/10/18 21:49:59
categories: 问题
tags: 视频教程 HyperLedger
keywords: 超级账本,视频教程演示,区块链实践,hyperledger,fabric,区块链问题
description: "这里记录部署hyperledger fabric时遇到的一些问题"

---

* auto-gen TOC:
{:toc}

## 说明

这里记录了部署hyperledger fabric时遇到的一些问题，部署过程见：[hyperledger的fabric项目的手动部署教程][1]、
视频教程地址是[HyperLedger Fabric全手动、多服务器部署与进阶教程](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)

一些问题是我自己遇到的，一些是通过知识星球“我的网课”和微信向我提问的。
把比较典型的问题都汇总到这里了。如果你有新的问题，可以到QQ群`576555864`中交流。QQ群解决不了，扫描下面的二维码，翻历史问题，发帖提问:

![我的网课](https://www.lijiaocn.com/img/xiaomiquan-class.jpeg)


{% include fabric_page_list.md %}

## Peer或者Orderer不通

如果你是用vmware或者virtualbox虚拟机部署的Fabric，注意使用的网络模式。最好使用Host模式或者桥接模式，因为虚拟机中的NAT网卡地址的IP通常都是相同的，并且从虚拟机外部主动发起访问的时候，也很容易出现各种状况。

当不通的时候，先确认域名对应的IP是否正确，然后用telnet检查服务端口：

	ping peer0.org1.example.com
	telnet peer0.org1.example.com 7051

如果不通，检查一下/etc/hosts中是否设置了域名和IP的对应关系是否正确。

如果还是不通，看一下系统有没有防火墙，7051端口有没有被防火墙禁止。

## ID不合法导致Orderer Panic

Orderer启动时Panic：

	2018-06-29 10:25:01.951 CST [orderer/commmon/multichannel] newLedgerResources -> CRIT 072 Error creating channelconfig bundle: initializing configtx manager failed: error converting config to map: Illegal characters in key: [Group]
	panic: Error creating channelconfig bundle: initializing configtx manager failed: error converting config to map: Illegal characters in key: [Group]

	goroutine 1 [running]:
	github.com/hyperledger/fabric/vendor/github.com/op/go-logging.(*Logger).Panicf(0xc420224cf0, 0xfac59d, 0x27, 0xc420315f90, 0x1, 0x1)
		/root/GOWORK/src/github.com/hyperledger/fabric/vendor/github.com/op/go-logging/logger.go:194 +0x126
	github.com/hyperledger/fabric/orderer/common/multichannel.(*Registrar).newLedgerResources(0xc42015e2a0, 0xc420224600, 0xc420224600)
		/root/GOWORK/src/github.com/hyperledger/fabric/orderer/common/multichannel/registrar.go:253 +0x389
	github.com/hyperledger/fabric/orderer/common/multichannel.NewRegistrar(0x102cf00, 0xc420124400, 0xc420161050, 0x1025880, 0x1640950, 0xc4200b0760, 0x1, 0x1, 0x0)
		/root/GOWORK/src/github.com/hyperledger/fabric/orderer/common/multichannel/registrar.go:144 +0x327
	github.com/hyperledger/fabric/orderer/common/server.initializeMultichannelRegistrar(0xc42026d400, 0x1025880, 0x1640950, 0xc4200b0760, 0x1, 0x1, 0x1)
		/root/GOWORK/src/github.com/hyperledger/fabric/orderer/common/server/main.go:262 +0x250
	github.com/hyperledger/fabric/orderer/common/server.Start(0xf903dc, 0x5, 0xc42026d400)
		/root/GOWORK/src/github.com/hyperledger/fabric/orderer/common/server/main.go:103 +0x1ec
	github.com/hyperledger/fabric/orderer/common/server.Main()
		/root/GOWORK/src/github.com/hyperledger/fabric/orderer/common/server/main.go:82 +0x204
	main.main()
		/root/GOWORK/src/github.com/hyperledger/fabric/orderer/main.go:15 +0x20

查看代码，发现`fabric/common/configtx/validator.go:48`中，对ID做了要求：

	// validateConfigID makes sure that the config element names (ie map key of
	// ConfigGroup) comply with the following restrictions
	//      1. Contain only ASCII alphanumerics, dots '.', dashes '-'
	//      2. Are shorter than 250 characters.
	//      3. Are not the strings "." or "..".
	func validateConfigID(configID string) error {
		re, _ := regexp.Compile(configAllowedChars)
		// Length
	...

ConfigID中不能使用下划线，可以用下面命令查看创世块:

	./configtxgen -inspectBlock  genesisblock

将`configtx.yaml`中的组织名和ID，修改为不带下划线的，重新生成创始块等文件。

注意，需要将orderer中以前的数据删除。

## 目标Peer上的Docker没有启动，导致合约实例化失败

实例化合约时出错：

	./peer.sh chaincode instantiate -o orderer.example.com:7050 --tls true --cafile ./tlsca.example.com-cert.pem -C mychannel -n demo -v 0.0.1 -c '{"Args":["init"]}' -P "OR('Org1MSP.member','Org2MSP.member')"

错误如下：

	Error: Error endorsing chaincode: rpc error: code = Unknown desc = error starting container: Post http://unix.sock/containers/create?name=dev-peer1.org1.example.com-demo-0.0.1: dial unix /var/run/docker.sock: connect: no such file or directory

这是目标peer上的docker没有启动造成的。

## genesisblock中admin证书错误导致orderer panic: x509: ECDSA verification failure

orderer在启动的时候报错，直接panic：

	-----END CERTIFICATE-----
	2018-06-22 14:27:30.462 UTC [orderer/commmon/multichannel] newLedgerResources -> CRIT 04d Error creating channelconfig bundle: initializing channelconfig failed: could not create channel Consortiums sub-group config: setting up the MSP manager failed: the supplied identity is not valid: x509: certificate signed by unknown authority (possibly because of "x509: ECDSA verification failure" while trying to verify candidate authority certificate "ca.org1.example.com")
	panic: Error creating channelconfig bundle: initializing channelconfig failed: could not create channel Consortiums sub-group config: setting up the MSP manager failed: the supplied identity is not valid: x509: certificate signed by unknown authority (possibly because of "x509: ECDSA verification failure" while trying to verify candidate authority certificate "ca.org1.example.com")

	goroutine 1 [running]:
	github.com/hyperledger/fabric/vendor/github.com/op/go-logging.(*Logger).Panicf(0xc4201ee120, 0x108668e, 0x27, 0xc42026af50, 0x1, 0x1)
		/w/workspace/fabric-binaries-x86_64/gopath/src/github.com/hyperledger/fabric/vendor/github.com/op/go-logging/logger.go:194 +0x134
	github.com/hyperledger/fabric/orderer/common/multichannel.(*Registrar).newLedgerResources(0xc42010a380, 0xc420138840, 0xc420138840)
		/w/workspace/fabric-binaries-x86_64/gopath/src/github.com/hyperledger/fabric/orderer/common/multichannel/registrar.go:253 +0x391

怀疑是创世块的原因，用下面的命令将创始块解开：

	./bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./genesisblock

发现比较奇怪的地方，Org1的Admin证书有两个：

	"groups": {
	  "Org1MSP": {
	  "mod_policy": "Admins",
	  ...
	  "mod_policy": "Admins",
	  "value": {
	  "config": {
	  "admins": [
	  "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNHVENDQWIrZ0F3SUJBZ0lRVXRxQWxlZENzWkErWStWdlZMUTZQakFLQmdncWhrak9QUVFEQWpCek1Rc3cKQ1FZRFZRUUdFd0pWVXpFVE1CRUdBMVVFQ0JNS1EyRnNhV1p2Y201cFlURVdNQlFHQTFVRUJ4TU5VMkZ1SUVaeQpZVzVqYVhOamJ6RVpNQmNHQTFVRUNoTVFiM0puTVM1bGVHRnRjR3hsTG1OdmJURWNNQm9HQTFVRUF4TVRZMkV1CmIzSm5NUzVsZUdGdGNHeGxMbU52YlRBZUZ3MHhPREEyTWpFd05qVTNNekJhRncweU9EQTJNVGd3TmpVM016QmEKTUZzeEN6QUpCZ05WQkFZVEFsVlRNUk13RVFZRFZRUUlFd3BEWVd4cFptOXlibWxoTVJZd0ZBWURWUVFIRXcxVApZVzRnUm5KaGJtTnBjMk52TVI4d0hRWURWUVFEREJaQlpHMXBia0J2Y21jeExtVjRZVzF3YkdVdVkyOXRNRmt3CkV3WUhLb1pJemowQ0FRWUlLb1pJemowREFRY0RRZ0FFRVp3cUhTVmxxRGNKNC9aVSt0YnB5RVBSTkl5ellMdTMKRGlRVUZOMklBZm5vVGhjTjRmY3Y4c2dsdXUxcnpJYUVHSFRFLzd0TC9EdEg2U3Fjd2tOQkthTk5NRXN3RGdZRApWUjBQQVFIL0JBUURBZ2VBTUF3R0ExVWRFd0VCL3dRQ01BQXdLd1lEVlIwakJDUXdJb0FnbkpjYVVLVFlseVJxCjcyckk4QXNINHNVZHB0ZytWY3IvbHkxZlp3QndrOEF3Q2dZSUtvWkl6ajBFQXdJRFNBQXdSUUloQUsvRXh6NlYKRVYwUFl4M1BQbitPMysvODQrdXFEVkZ2Q1ZRUEVNcU1yV3dkQWlBNVVqTDcyb2drTHB3UUtGZ1ptdTJqRmtPWApSVnhpY0htLzZCR3htelFRc1E9PQotLS0tLUVORCBDRVJUSUZJQ0FURS0tLS0tCg==",
	  "LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCk1JSUNGVENDQWJ5Z0F3SUJBZ0lRU3E0VzJ1SEVqbHdXZHdGY21WNUlpekFLQmdncWhrak9QUVFEQWpCek1Rc3cKQ1FZRFZRUUdFd0pWVXpFVE1CRUdBMVVFQ0JNS1EyRnNhV1p2Y201cFlURVdNQlFHQTFVRUJ4TU5VMkZ1SUVaeQpZVzVqYVhOamJ6RVpNQmNHQTFVRUNoTVFiM0puTVM1bGVHRnRjR3hsTG1OdmJURWNNQm9HQTFVRUF4TVRZMkV1CmIzSm5NUzVsZUdGdGNHeGxMbU52YlRBZUZ3MHhPREEyTWpFd056VXdNVEZhRncweU9EQTJNVGd3TnpVd01URmEKTUZneEN6QUpCZ05WQkFZVEFsVlRNUk13RVFZRFZRUUlFd3BEWVd4cFptOXlibWxoTVJZd0ZBWURWUVFIRXcxVApZVzRnUm5KaGJtTnBjMk52TVJ3d0dnWURWUVFERXhOallTNXZjbWN4TG1WNFlXMXdiR1V1WTI5dE1Ga3dFd1lICktvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUVxNHl6K0tqSTR2ZmtObzQ0bWp0Q25HQ2cwLzA3L2Y5VW1sZlEKMlpSZWtHN2lyVm1QY0N6YnRVVEcvTFJjbndVemgyaFMvZkg5cGxvZEM4a1pwSlpXQzZOTk1Fc3dEZ1lEVlIwUApBUUgvQkFRREFnZUFNQXdHQTFVZEV3RUIvd1FDTUFBd0t3WURWUjBqQkNRd0lvQWdPc1NNQ2VqcnBOMnBhNEZSCnBOMVE2eXJkVHJleXNGY0Q1Ym9TcVNzSnFLNHdDZ1lJS29aSXpqMEVBd0lEUndBd1JBSWdCQWo1Q3l2cEFhU0kKaTh4anpVVHZxbUt5dmxSOFFPeExBUTAvVi9jRGpTNENJRVg3V1lnZzYwTFUwTy9LNEpmVVpiQmoyNHRBbTkxcgpkQmczN21IZHZVcSsKLS0tLS1FTkQgQ0VSVElGSUNBVEUtLS0tLQo="
	  ],
	  ...


将上面的两大行字符串分别用base64解码得到证书，然后用openssl命令查看：

	echo "LS0tLS1CRUdJTiBDRVJUSU....tLS0tCg==" |base64 -D >a.cert
	openssl x509 -in a.cert -text

第一个证书正确：

	...
	 Subject: C=US, ST=California, L=San Francisco, CN=Admin@org1.example.com
	...

查看第二行：

	echo "LS0tLS1CRUdJTi....tLS0tLQo=" |base64 -D >b.cert
	openssl x509 -in b.cert -text

发现第二个证书是CA证书，不是用户证书！

	 Subject: C=US, ST=California, L=San Francisco, CN=ca.org1.example.com

检查生成genesisblock时使用的configtx.yaml文件，发现configtx.yaml中配置的msp目录：

	 MSPDir: ./certs/peerOrganizations/org1.example.com/msp

msp的admincerts子目录中，多出了一个ca证书：

	$ ls ./certs/peerOrganizations/org1.example.com/msp/admincerts/
	Admin@org1.example.com-cert.pem ca.org1.example.com-cert.pem

把多出的ca证书删除。

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

另一次遇到这个问题，Orderer日志如下：

	[31m2018-06-29 14:06:35.844 CST [cauthdsl] deduplicate -> ERRO 008^[[0m Principal deserialization failure (MSP Kecology_Orderer_MSP is unknown) for identity 0a144b65636f6c6f

这里是因为Orderer的配置文件Orderer.yaml中的LocalMSPID写错了：

	LocalMSPID: Kecology_Orderer_MSP

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

## 接下来...

[更多关于超级账本和区块链的文章](http://www.lijiaocn.com/tags/blockchain.html)

## 参考

1. [hyperledger的fabric项目的手动部署教程][1]
2. [peer channel creation fails in Hyperledger Fabric][2]
8. [peer channel creation fails in Hyperledger Fabric][8]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html  "hyperledger的fabric项目的手动部署教程" 
[2]: https://stackoverflow.com/questions/45726536/peer-channel-creation-fails-in-hyperledger-fabric "peer channel creation fails in Hyperledger Fabric"
[8]: https://stackoverflow.com/questions/45726536/peer-channel-creation-fails-in-hyperledger-fabric "peer channel creation fails in Hyperledger Fabric"
