---
layout: default
title:  "【视频】超级账本HyperLedger：Fabric nodejs SDK的使用"
author: 李佶澳
createdate: 2018/04/25 11:11:00
changedate: 2018/07/29 11:16:07
categories: 编程
tags: 视频教程 HyperLedger
keywords: 超级账本,视频教程演示,区块链实践,hyperledger,fabric接口,nodejs
description: 当前(2018-04-25 11:16:23)fabric的SDK只有java和node是正式的，他倆的文档也是最丰富的。

---

* auto-gen TOC:
{:toc}

## 说明

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。操作、配置文件和代码讲解视频在[网易云课堂《HyperLeger Fabric进阶实战课》第五章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)中。

当前(2018-04-25 11:16:23)fabric的SDK只有java和node是正式的，他倆的文档也是最丰富的，[Hyperledger Fabric SDK for node.js][1]。当前支持的node版本是v8.9.0~v9.0，v9.0以上版本不支持(2018-07-15 14:11:01)。

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

## 准备合适的node版本

当前支持的node版本是v8.9.0~v9.0，v9.0以上版本不支持(2018-07-15 14:11:01)。

在mac上可以用brew安装node8：

	$ brew install node@8
	$ echo 'export PATH="/usr/local/opt/node@8/bin:$PATH"' >> ~/.bash_profile
	$ source ~/.bash_profile
	$ node --version
	v8.11.3

或者直接下载安装：[nodejs download][6]

## 用npm管理依赖包

创建文件package.json：

	$ cat package.json
	{
	    "dependencies": {
	        "fabric-ca-client": "1.1.2",
	        "fabric-client": "1.1.2",
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

用npm安装依赖包：

	npm config set registry https://registry.npm.taobao.org  (设置淘宝提供的镜像源)
	npm install

## Example

调用mychannel中的mycc合约的query接口，参数为`key`:

	node ./01-query-chaincode.js

代码如下：

	/*
	 * client.js
	 * Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
	 *
	 * Distributed under terms of the GPL license.
	 */
	
	var fs = require('fs');
	var Fabric_Client = require('fabric-client');
	
	//创建一个Client
	Fabric_Client.newDefaultKeyValueStore({ path: '/tmp/xx/' }).then((state_store) => {
	    client=new Fabric_Client();
	    client.setStateStore(state_store)
	
	    //设置用户信息    
	    var userOpt = {
	        username: 'Admin@member1.example.com',
	        mspid: 'peers.member1.example.com',
	        cryptoContent: { 
	            privateKey: './msp/keystore/09dd09cf530d8f0fa6cb383b5b409ae8e895d32d31f75823f3bdb3c1f3ee180a_sk',
	            signedCert: './msp/signcerts/Admin@member1.example.com-cert.pem'
	        }
	    }
	
	    return client.createUser(userOpt)
	
	}).then((user)=>{
	
	    //设置要连接的Channel
	    var channel = client.newChannel('mychannel');
	
	    //设置要连接的Peer
	    var peer = client.newPeer(
	        'grpcs://peer0.member1.example.com:7051',
	        {
	            pem: fs.readFileSync('./tls/ca.crt', { encoding: 'utf8' }),
	            clientKey: fs.readFileSync('./tls/client.key', { encoding: 'utf8' }),
	            clientCert: fs.readFileSync('./tls/client.crt', { encoding: 'utf8' }),
	            'ssl-target-name-override': 'peer0.member1.example.com'
	        }
	    );
	
	    channel.addPeer(peer);
	
	    //调用chaincode
	    const request = {
	        chaincodeId: 'mycc',   //chaincode名称
	        fcn: 'query',          //调用的函数名
	        args: ['key1']         //参数
	    };
	
	    // send the query proposal to the peer
	    return channel.queryByChaincode(request);
	
	}).then((response)=>{
	    console.log('Response is', response.toString());
	})

[Hyperledger Fabric SDK for node.js][1]中有每个类说明，上面示例的源代码托管在Github上: [hyperledger-fabric-sdks-usage][8]。

HyperLedger官方源代码中还有更多的例子：[fabric node sdk example][3]

使用过程遇到的问题记录在： [《超级账本HyperLedger：Fabric的Node.js SDK使用时遇到的问题》][7]

[更多关于超级账本和区块链的文章](http://www.lijiaocn.com/tags/blockchain.html)

## 参考

1. [Hyperledger Fabric SDK for node.js][1]
2. [Setting up the Application Developer's Environment][2]
3. [fabric node sdk example][3]
4. [Operation initiated from the Hyperledger Fabric Client SDK for Node.js results in TSI error][4]
5. [使用Fabric Node SDK进行Invoke和Query][5]
6. [nodejs download][6]
7. [《超级账本HyperLedger：Fabric的Node.js SDK使用时遇到的问题》][7]
8. [hyperledger-fabric-sdks-usage][8]

[1]: https://fabric-sdk-node.github.io/  "Hyperledger Fabric SDK for node.js" 
[2]: https://fabric-sdk-node.github.io/tutorial-app-dev-env-setup.html "Setting up the Application Developer's Environment"
[3]: https://github.com/hyperledger/fabric-samples/tree/master/fabcar "fabric node sdk example"
[4]: https://developer.ibm.com/answers/questions/430049/operation-initiated-from-the-hyperledger-fabric-cl/  "Operation initiated from the Hyperledger Fabric Client SDK for Node.js results in TSI error"
[5]: http://www.cnblogs.com/studyzy/p/7524245.html "使用Fabric Node SDK进行Invoke和Query"
[6]: https://nodejs.org/en/  "nodejs download" 
[7]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/07/15/hyperledger-fabric-nodejs-problem.html "《超级账本HyperLedger：Fabric的Node.js SDK使用时遇到的问题》"
[8]: https://github.com/introclass/hyperledger-fabric-sdks-usage "hyperledger-fabric-sdks-usage"
