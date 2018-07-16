---
layout: default
title:  "超级账本HyperLedger：Fabric的nodejs sdk使用时遇到的问题"
author: 李佶澳
createdate: 2018/07/15 17:38:00
changedate: 2018/07/16 10:20:38
categories: 问题
tags: HyperLedger
keywords: 超级账本,nodejs sdk,fabric sdk,hyperledger,fabric,区块链问题
description: 这里记录使用HyperLedger Fabric的nodejs sdk时遇到的一些问题

---

* auto-gen TOC:
{:toc}

## 说明

这里记录使用HyperLedger Fabric的nodejs sdk时遇到的一些问题，示例代码在：[HyperLedger Fabric nodejs sdk examples][1]

## nodejs SDK: 加载pem证书，验证失败

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

## nodejs SDK: Invalid cert chain file

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

1. [HyperLedger Fabric nodejs sdk examples][1]

[1]: https://github.com/introclass/hyperledger-fabric-sdks-usage/tree/master/nodejs "HyperLedger Fabric nodejs sdk examples" 
