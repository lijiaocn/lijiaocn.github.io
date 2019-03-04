---
layout: default
title:  "超级账本HyperLedger：Fabric Node.js SDK使用时遇到的问题"
author: 李佶澳
createdate: 2018/07/15 17:38:00
changedate: 2018/07/29 13:05:29
categories: 问题
tags: HyperLedger
keywords: 超级账本,nodejs sdk,fabric sdk,hyperledger
description: 这里记录使用HyperLedger Fabric的nodejs sdk时遇到的一些问题

---

* auto-gen TOC:
{:toc}

## 说明

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。操作、配置文件和代码讲解视频在[网易云课堂《HyperLeger Fabric进阶实战课》第五章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)中。

HyperLedger Fabric的Node.js SDK的使用方法见：[《超级账本HyperLedger：Fabric Node.js SDK的使用》][2]，这里记录使用HyperLedger Fabric Node.js SDK时遇到的一些问题，示例代码在Github上：[HyperLedger Fabric nodejs sdk examples][1]

**相关笔记**，都是一边学习一边记录的，时间紧难免粗糙，[查看更多相关内容](https://www.lijiaocn.com/tags/blockchain.html)：

[《超级账本HyperLedger：超级账本工作组旗下项目介绍》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/08/hyperledger-projects-intro.html)

[《超级账本HyperLedger：Fabric掰开揉碎，一文解惑》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/25/hyperledger-fabric-main-point.html)

[《超级账本HyperLedger：Fabric的基本概念与基础用法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/02/23/hyperledger-fabric-usage.html)

[《【视频】超级账本HyperLedger：Fabric的全手动、多服务器部署教程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html)

[《【视频】超级账本HyperLedger：使用Ansible进行Fabric多节点分布式部署（实战）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/09/hyperledger-fabric-ansible-deploy.html)

[《【视频】超级账本HyperLedger：Fabric从1.1.0升级到1.2.0》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/19/hyperledger-fabric-1-2-0.html)

[《【视频】超级账本HyperLedger：Fabric使用kafka进行区块排序（共识）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/28/hyperledger-fabric-orderer-kafka.html)

[《【视频】超级账本HyperLedger：为Fabric的Peer节点配置CouchDB》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/19/hyperledger-fabric-with-couchdb.html)

[《超级账本HyperLedger：FabricCA的基本概念与用法讲解》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html)

[《超级账本HyperLedger：FabricCA的级联使用（InterMediateCA）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/09/hyperledger-fabric-ca-cascade.html)

[《【视频】超级账本HyperLedger：Fabric-CA的使用演示(两个组织一个Orderer三个Peer)》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html)

[《超级账本HyperLedger：Fabric Chaincode（智能合约、链码）开发方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/05/hyperledger-fabric-chaincode.html)

[《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/17/hyperledger-fabric-chaincodes-example.html)

[《【视频】超级账本HyperLedger：Fabric Go SDK的使用》](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/07/28/hyperledger-fabric-sdk-go.html)

[《【视频】超级账本HyperLedger：Fabric nodejs SDK的使用》](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/04/25/hyperledger-fabric-sdk-nodejs.html)

[《超级账本HyperLedger：Fabric Channel配置的读取转换》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/19/hyperledger-channel-config-operation.html)

[《【视频】超级账本HyperLedger：Fabric进阶，在已有的Channel中添加新的组织》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/06/18/hyperledger-fabric-add-new-org.html)

[《超级账本HyperLedger：Explorer安装使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-explorer.html)

[《超级账本HyperLedger：Cello部署和使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/25/hyperledger-cello.html)

[《超级账本HyperLedger：Fabric部署过程时遇到的问题汇总》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/04/25/hyperledger-fabric-problem.html)

[《超级账本HyperLedger：Fabric的Chaincode开发过程中遇到的问题》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/20/hyperledger-fabric-chaincode-problem.html)

[《超级账本HyperLedger：Fabric Node.js SDK使用时遇到的问题》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/15/hyperledger-fabric-nodejs-problem.html)

[《超级账本HyperLedger：Fabric Golang SDK使用时遇到的问题》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/15/hyperledger-fabric-golang-problem.html)

[《超级账本HyperLedger：Fabric 1.2.0使用时遇到的问题》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/25/hyperledger-fabric-1-2-0-problems.html)

## Node.js SDK: 加载pem证书，验证失败

如果，指定了pem证书为./tls/ca.crt

	 40     var peer = client.newPeer(
	 41         'grpcs://peer0.member1.example.com:7051',
	 42         {
	 43             pem: './tls/ca.crt',
	 44             clientKey: './tls/client.key',
	 45             clientCert: './tls/client.crt'
	 46         }
	 47     );

运行时出错，如下：

	(node:93025) UnhandledPromiseRejectionWarning: Error: Input parameter does not appear to be PEM-encoded.
	    at Object.module.exports.pemToDER (/Users/lijiao/Work/Docker/GOPATH/src/github.com/lijiaocn/hyperledger-fabric-sdks-usage/nodejs/node_modules/fabric-client/lib/utils.js:538:9)
	    at Peer.getClientCertHash (/Users/lijiao/Work/Docker/GOPATH/src/github.com/lijiaocn/hyperledger-fabric-sdks-usage/nodejs/node_modules/fabric-client/lib/Remote.js:169:25)
	    at Function.sendTransactionProposal (/Users/lijiao/Work/Docker/GOPATH/src/github.com/lijiaocn/hyperledger-fabric-sdks-usage/nodejs/node_modules/fabric-client/lib/Channel.js:1524:23)
	    at Channel.sendTransactionProposal (/Users/lijiao/Work/Docker/GOPATH/src/github.com/lijiaocn/hyperledger-fabric-sdks-usage/nodejs/node_modules/fabric-client/lib/Channel.js:1459:18)
	    at Channel.queryByChaincode (/Users/lijiao/Work/Docker/GOPATH/src/github.com/lijiaocn/hyperledger-fabric-sdks-usage/nodejs/node_modules/fabric-client/lib/Channel.js:1738:15)
	    at Fabric_Client.newDefaultKeyValueStore.then.then (/Users/lijiao/Work/Docker/GOPATH/src/github.com/lijiaocn/hyperledger-fabric-sdks-usage/nodejs/client.js:59:20)
	    at <anonymous>

原因是pem、clientkey、clientcert需要是证书的内容：

	 40     var peer = client.newPeer(
	 41         'grpcs://peer0.member1.example.com:7051',
	 42         {
	 43             pem: fs.readFileSync('./tls/ca.crt', { encoding: 'utf8' }),
	 44             clientKey: fs.readFileSync('./tls/client.key', { encoding: 'utf8' }),
	 45             clientCert: fs.readFileSync('./tls/client.crt', { encoding: 'utf8' }),
	 46             'ssl-target-name-override': 'peer0.member1.example.com'
	 47         }
	 48     );

## Node.js SDK: Invalid cert chain file

错误如下：

	0715 16:34:03.966476000 140736069952384 ssl_transport_security.cc:664] Invalid cert chain file.
	E0715 16:34:03.966695000 140736069952384 security_connector.cc:1062]   Handshaker factory creation failed with TSI_INVALID_ARGUMENT.
	E0715 16:34:03.966702000 140736069952384 secure_channel_create.cc:121] Failed to create secure subchannel for secure name 'peer0.member1.example.com'
	E0715 16:34:03.966709000 140736069952384 secure_channel_create.cc:154] Failed to create subchannel arguments during subchannel creation.

[grpc issues 4689](https://github.com/grpc/grpc/issues/4689)中说，说明输入的应当是文件内容？不是文件名

	 40     var peer = client.newPeer(
	 41         'grpcs://peer0.member1.example.com:7051',
	 42         {
	 43             pem: './tls/ca.crt',
	 44             clientKey: './tls/client.key',
	 45             clientCert: './tls/client.crt'
	 46         }
	 47     );

原因是pem、clientkey、clientcert需要是证书的内容：

	 40     var peer = client.newPeer(
	 41         'grpcs://peer0.member1.example.com:7051',
	 42         {
	 43             pem: fs.readFileSync('./tls/ca.crt', { encoding: 'utf8' }),
	 44             clientKey: fs.readFileSync('./tls/client.key', { encoding: 'utf8' }),
	 45             clientCert: fs.readFileSync('./tls/client.crt', { encoding: 'utf8' }),
	 46             'ssl-target-name-override': 'peer0.member1.example.com'
	 47         }
	 48     );

## 参考

1. [HyperLedger Fabric Node.js sdk examples][1]
2. [《超级账本HyperLedger：Fabric Node.js SDK的使用》][2]

[1]: https://github.com/introclass/hyperledger-fabric-sdks-usage/tree/master/nodejs "HyperLedger Fabric nodejs sdk examples" 
[2]: http://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/04/25/hyperledger-fabric-sdk-nodejs.html "《超级账本HyperLedger：Fabric Node.js SDK的使用》"
