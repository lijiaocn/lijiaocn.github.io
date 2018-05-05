---
layout: default
title:  超级账本hyperledger的fabric项目部署过程时遇到的问题
author: 李佶澳
createdate: 2018/05/04 21:14:00
changedate: 2018/05/05 10:02:40
categories: 问题
tags: blockchain
keywords: 超级账本,区块链实践,hyperledger,fabric,区块链问题
description: "这里记录部署hyperledger fabric时遇到的一些问题"

---

* auto-gen TOC:
{:toc}

## 说明

本页内容会经常更新。

这里记录了部署hyperledger fabric时遇到的一些问题，部署过程见：[hyperledger的fabric项目的手动部署教程][1]

[网易云课堂：HyperLedger Fabric手动部署教程的视频讲解](http://study.163.com/course/introduction.htm?courseId=1005326005&share=2&shareId=400000000376006)

![网易云课堂: HperLedger Fabric全手动部署视频教程目录]({{ site.imglocal }}/hyperledger-class/fabric-deploy.png)

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

![知识星球区块链实践分享]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 参考

1. [hyperledger的fabric项目的手动部署教程][1]
2. [peer channel creation fails in Hyperledger Fabric][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html  "hyperledger的fabric项目的手动部署教程" 
[2]: https://stackoverflow.com/questions/45726536/peer-channel-creation-fails-in-hyperledger-fabric "peer channel creation fails in Hyperledger Fabric"
