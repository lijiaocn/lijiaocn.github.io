---
layout: default
title:  超级账本HyperLedger：Fabric Node.js SDK的使用
author: lijiaocn
createdate: 2018/04/25 11:11:00
changedate: 2018/07/16 10:19:16
categories: 编程
tags: HyperLedger
keywords: 超级账本,视频教程演示,区块链实践,hyperledger,fabric接口,nodejs
description: 当前(2018-04-25 11:16:23)fabric的SDK只有java和node是正式的，他倆的文档也是最丰富的。

---

* auto-gen TOC:
{:toc}

## 说明

[超级账本HyperLedger视频教程：HyperLedger Fabric全手动、多服务器部署与进阶教程--“主页”中可领优惠券](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)

当前(2018-04-25 11:16:23)fabric的SDK只有java和node是正式的，他倆的文档也是最丰富的。

[Hyperledger Fabric SDK for node.js][1]

当前支持的node版本是v8.9.0~v9.0，v9.0以上版本不支持(2018-07-15 14:11:01)。

## 下载SDK

	git clone https://gerrit.hyperledger.org/r/fabric-sdk-node

## 开发环境

[Setting up the Application Developer's Environment][2]

确保已经本地已经安装了node和npm。

	$ cat package.json
	{
	    "name": "fabcar",
	    "version": "1.0.0",
	    "description": "Hyperledger Fabric Car Sample Application",
	    "main": "fabcar.js",
	    "scripts": {
	        "test": "echo \"Error: no test specified\" && exit 1"
	    },
	    "dependencies": {
	        "fabric-ca-client": "1.0.3",
	        "fabric-client": "1.0.3",
	        "grpc": "^1.6.0"
	    },
	    "author": "Anthony O'Dowd",
	    "license": "Apache-2.0",
	    "keywords": [
	        "Hyperledger",
	        "Fabric",
	        "Car",
	        "Sample",
	        "Application"
	    ]
	}

## example-0

[Hyperledger Fabric SDK for node.js][1]中有每个类说明。

	/*
	 * client.js
	 * Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
	 *
	 * Distributed under terms of the GPL license.
	 */
	
	var Fabric_Client = require('fabric-client');
	
	Fabric_Client.newDefaultKeyValueStore({ path: '/tmp/xx/' }).then((state_store) => {
	    client=new Fabric_Client();
	    client.setStateStore(state_store)
	
	    var userOpt = {
	        username: 'Admin@saler.ennblock.cn',
	        mspid: 'saler',
	        cryptoContent: {
	            privateKey: './msp/keystore/9ac3c01e8b74eb5eb9dfb05041cef1d345e13d8e5bdc1f6a26365ed9803ba19e_sk',
	            signedCert: './msp/signcerts/Admin@saler.ennblock.cn-cert.pem'
	        }
	    }
	
	    return client.createUser(userOpt)
	
	}).then((user)=>{
	    //设置channel与peer
	    var channel = client.newChannel('mychannel');
	
	    var peer = client.newPeer(
	        'grpc://peer0.saler.ennblock.cn:7051'
	    );
	
	/* 使用TLS加密
	    var peer = client.newPeer(
	        'grpcs://peer0.saler.ennblock.cn:7051',
	        {
	            pem: './tls/ca.crt',
	            'ssl-target-name-override': 'peer0.saler.ennblock.cn'
	        }
	    );
	*/
	    channel.addPeer(peer);
	
	    //调用chaincode
	    const request = {
	        //targets : --- letting this default to the peers assigned to the channel
	        chaincodeId: 'saler',
	        fcn: 'saler',
	        args: ['info','saler-6']
	    };
	
	    // send the query proposal to the peer
	    return channel.queryByChaincode(request);
	
	}).then((response)=>{
	    console.log('Response is', response);
	   // console.log('Response is', response[0].toString());
	})

## example-1

[fabric node sdk example][3]

	cd fabric-samples/fabcar

安装依赖包：

	npm install --registry=https://registry.npm.taobao.org

## 问题

###  Could not load any root certificate.

依据[Operation initiated from the Hyperledger Fabric Client SDK for Node.js results in TSI error][4]中方法，将node sdk升级到1.0.3。

结果还是不行，最后把peer和client的tls都设置为false解决。

## 接下来...

[更多关于超级账本和区块链的文章](http://www.lijiaocn.com/tags/blockchain.html)

## 参考

1. [Hyperledger Fabric SDK for node.js][1]
2. [Setting up the Application Developer's Environment][2]
3. [fabric node sdk example][3]
4. [Operation initiated from the Hyperledger Fabric Client SDK for Node.js results in TSI error][4]
5. [使用Fabric Node SDK进行Invoke和Query][5]

[1]: https://fabric-sdk-node.github.io/  "Hyperledger Fabric SDK for node.js" 
[2]: https://fabric-sdk-node.github.io/tutorial-app-dev-env-setup.html "Setting up the Application Developer's Environment"
[3]: https://github.com/hyperledger/fabric-samples/tree/release-1.1/fabcar "fabric node sdk example"
[4]: https://developer.ibm.com/answers/questions/430049/operation-initiated-from-the-hyperledger-fabric-cl/  "Operation initiated from the Hyperledger Fabric Client SDK for Node.js results in TSI error"
[5]: http://www.cnblogs.com/studyzy/p/7524245.html "使用Fabric Node SDK进行Invoke和Query"
