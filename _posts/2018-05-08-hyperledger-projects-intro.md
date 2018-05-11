---
layout: default
title:  超级账本HyperLedger旗下项目介绍
author: 李佶澳
createdate: 2018/05/08 14:35:00
changedate: 2018/05/11 20:23:12
categories: 项目
tags: HyperLedger
keywords: 超级账本,HyperLedger
description: 超级账本HyperLedger旗下有很多的项目，对这些项目做了简单了解，并收集了一些资料

---

* auto-gen TOC:
{:toc}

## 说明

[超级账本HyperLedger视频教程汇总：HyperLedger Fabric的视频讲解--“主页”中可领优惠券](https://study.163.com/provider/400000000376006/course.htm)

超级账本HyperLedger旗下有很多的项目，对这些项目进行了简单的了解。

	As an open consortium, Hyperledger incubates a range of business blockchain technologies, 
	including distributed ledger frameworks, smart contract engines, client libraries, 
	graphical interfaces, utility libraries and sample applications.

>目前(2018-05-09 16:22:40)，只对HyperLedger Fabric进行了部署体验，其它的项目只是通过阅读它们的文档进行了解。

## Burrow

[Burrow][1]是最早[Monax][2]开发的项目，后来进入HyplerLedger孵化。Burrow的[Incubation proposal][3]中介绍，burrown之前的名字是
`eris-db`。

看了半天Burrow的[介绍][4]，也没搞懂burrow到底是啥。burrow自称是:

	Hyperledger Burrow is a permissioned Ethereum smart-contract blockchain node built with <3 by Monax.
	It executes Ethereum smart contract code on a permissioned virtual machine.

Burrow的[Incubation proposal][3]中的介绍更具体一些：

	Burrow's primary users are businesses aiming at value chain level optimization 
	amongst other blockchain and smart contract benefits. These users require 
	permissions on their blockchain deployments in order to fulfill numerous legal
	and/or commercial requirements for their applications. 

好像是说一些商业用户为了满足法规以及商业需求，它们的区块链需要得到许可？

后来从Iroha中了解到什么是`permissioned`，意思是说，节点需要得到授权才能接入到区块链网络，比特币和以太坊的节点是`permissionless`的。

	Bitcoin and Ethereum are designed to be permissionless ledgers where anyone can join and access all the data.

Monax的CEO Casey Kuhlman在[Why we're joining Hyperledger][5]中介绍了加入HyperLedger的原因，那时候项目名还是eris-db。

从Casey Kuhlman的博文中，可以得知Burrow的定位是一个`通用的智能合约执行引擎`:

	When we started our company in 2014 we never really had the intention of being
	solely responsible for building an enterprise grade, general purpose smart contract machine. 

该项目的文档资料现在比较少，Monax的[blog][2]也在完善，目前有不少链接是失效的。

根据已有到资料判断，Burrow应当是一个支持授权的合约引擎，它的目标可能是要支持多种类型的合约，或许会成为一个通用的区块链节点系统？

Burrown项目文档中的链接现在(2018-05-09 16:33:02)是各种404，过段时间再看看。

## Caliper

[Caliper][6]是一个Benchmark工具，华为贡献的，[Measuring Blockchain Performance with Hyperledger Caliper][7]。

![配图不错](https://www.hyperledger.org/wp-content/uploads/2018/03/Hyperledger_BlogGraphic_V3.png)

## Cello

[Cello][8]是一个部署管理平台，也就是现在常说的baas，用来管理组成链的节点，以及部署链、管理链。用户可以直接通过Cello部署合约。

[超级账本HyperLedger的cello项目的部署和使用](http://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2018/04/25/hyperledger-cello.html)

## Composer

[Composer][9]是用于合约、区块链应用开发的工具，用来简化、加快区块链应用的开发过程。

	Our primary goal is to accelerate time to value, and make it easier to integrate
	your blockchain applications with the existing business systems. You can use 
	Composer to rapidly develop use cases and deploy a blockchain solution in weeks 
	rather than months. Composer allows you to model your business network and 
	integrate existing systems and data with your blockchain applications.

![HyperLedger Composer Usage](https://hyperledger.github.io/composer/latest/assets/img/Composer-Diagram.svg)

## Explorer

[Explorer][11]是一个区块链浏览器。

[超级账本HyperLedger的explorer的使用][12]中简单体验了下。

## Fabric

[Fabric][13]是一个区块链技术框架。对Fabric已经做了比较深入的了解：

[超级账本Hyperledger fabric的chaincode开发](http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/05/hyperledger-fabric-chaincode.html)

[超级账本HyperLedger的Fabric-CA的使用演示(两个组织一个Orderer三个Peer)](http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html)

[超级账本HyperLedger的fabricCA的用法讲解](http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html)

[超级账本HyperLedger的fabric项目的手动部署教程](http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html)

[超级账本HyperLedger项目fabric的nodejsSDK的使用](http://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/04/25/hyperledger-fabric-sdk-nodejs.html)

[超级账本HyperLedger的fabric项目部署过程时遇到的问题](http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/04/25/hyperledger-fabric-problem.html)

[超级账本Hyperledger Fabric的使用](http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/02/23/hyperledger-fabric-usage.html)

## Indy

[Indy][14]是用于去中心化身份认证(decentralized identity)的分布式账本。

[Indy get started](https://github.com/hyperledger/indy-node/blob/stable/getting-started.md)中虚构了一个故事，通过这个故事可以很容易理解
Indy的用途。

Indy这个项目挺有意思，是一个挺实在的应用，以后有时间要重点研究下。

## Iroha

[Iroha][15]也是一个区块链的framework，是日本的金融科技公司Soramitsu, Hitachi，以及NTT Data、Colu等贡献的。

[HyperLedger Iroha Resources][16]中介绍Iroha时，称Iroha的设计是移动优先。

[HyperLedger Iroha Documents][17]中是这样介绍Iroha的：

	Hyperledger Iroha is a simple blockchain platform you can use to make trusted,
	secure, and fast applications by bringing the power of permission-based blockchain
	with Byzantine fault-tolerant consensus. It’s free, open-source, and works on
	Linux and Mac OS, with a variety of mobile and desktop libraries.

Iroha的介绍中也提到了`permissioned`，它解释了这个词的含义，意思是说：

	节点需要得到授权才能接入到区块链网络，
	数据的写入读取也需要得到授权，这区别于比特币和以太坊地方，

在比特币和以太坊中，节点加入和数据读取写入是不需要授权的。

与其它BlockChain FrameWorks相比，Iroha自称所使用的共识算法更加高效、低延迟，内置了一些可以简化使用地命令，并声称它的授权实现目前是最好的：

	Iroha is the only ledger that has a robust permission system, allowing permissions to 
	be set for all commands, queries, and joining of the network.

之前有个误解，以为HyperLedger下的项目都是同一个大项目的不同子项目，各自承担不同使命。
现在看来并不是这样的，有些项目之间是竞争关系，例如这里的Iroha与前面提到的Fabric，以及后面的Sawtooth，都是区块链framework。

## Quilt

[Quilt][18]是[Interledger Protocol (ILP)][20]协议的Java实现，是日本的NTT Data贡献的。
日本人对区块链很热情嘛，10个项目中，有2个是日本公司贡献的。

[Interledger Protocol (ILP)][20]定义了分布式账本与分布式账本之间、传统账本与分布式账本之间的交互过程。

[Interledger.org](https://interledger.org)中介绍是ILP协议时，称ILP是十多年的研究成果：

	The interledger protocol is the culmination of more than a decade of research in decentralized payment protocols. 
	This work was started in 2004 by Ryan Fugger, augmented by the development of Bitcoin in 2008 and has involved 
	numerous contributors since then.

[HyperLedger Quilt Intro][19]

## Sawtooth

[Sawtooth][21]是另一个区块链的framework，采用模块化设计。
framework的竞争很激烈，会上演类似mesos、swarm、kubernetes之间的三国杀嘛？

	Sawtooth is built to solve the challenges of permissioned (private) networks.
	Clusters of Sawtooth nodes can be easily deployed with separate permissioning
	
相比Fabric，Sawtooth的一个亮点是能够并行的处理事务：

	Sawtooth includes an advanced parallel scheduler that splits transactions into parallel flows.
	When possible, transactions are executed in parallel, while preventing double-spending even 
	with multiple modifications to the same state.

支持事件订阅：

	Subscribe to events that occur related to the blockchain, such as a new block being committed or switching to a new fork.
	Subscribe to application specific events defined by a transaction family.
	Relay information about the execution of a transaction back to clients without storing that data in state.

另外通过Sawtooth和Ethereum集成项目[Seth][22]，Sawtooth上可以运行以太坊的合约。

## 参考

1. [Burrow][1]
2. [Monax][2]
3. [Burrow Incubation proposal][3]
4. [HyperLedger Borrow Intro][4]
5. [Casey Kuhlman: Why we're joining Hyperledger][5]
6. [HyperLedger Caliper][6]
7. [Measuring Blockchain Performance with Hyperledger Caliper][7]
8. [HyperLedger Cello][8]
9. [HyperLedger Composer][9]
10. [Welcome to Hyperledger Composer][10]
11. [HyperLedger Explorer][11]
12. [超级账本HyperLedger的explorer的使用][12]
13. [HyperLedger Fabric][13]
14. [HyperLedger Indy][14]
15. [HyperLedger Iroha][15]
16. [HyperLedger Iroha Resources][16]
17. [HyperLedger Iroha Documents][17]
18. [HyperLedger Quilt][18]
19. [HyperLedger Quilt Intro][19]
20. [Interledger Protocol (ILP)][20]
21. [HyperLedger Sawtooth][21]
22. [Hyperledger Sawtooth - Seth][22]

[1]: https://www.hyperledger.org/projects/hyperledger-burrow "HyperLedger Borrow" 
[2]: https://monax.io/  "Monax"
[3]: https://www.hyperledger.org/wp-content/uploads/2017/06/HIP_Burrowv2.pdf
[4]: https://github.com/hyperledger/burrow/blob/master/README.md "HyperLedger Borrow Intro"
[5]: https://monax.io/2017/02/28/why-were-joining-hyperledger/ "Casey Kuhlman: Why we're joining Hyperledger"
[6]: https://www.hyperledger.org/projects/caliper "HyperLedger Caliper"
[7]: https://www.hyperledger.org/blog/2018/03/19/measuring-blockchain-performance-with-hyperledger-caliper "Measuring Blockchain Performance with Hyperledger Caliper"
[8]: https://www.hyperledger.org/projects/cello "HyperLedger Cello"
[9]: https://www.hyperledger.org/projects/composer "HyperLedger Composer"
[10]: https://hyperledger.github.io/composer/latest/introduction/introduction.html "Welcome to Hyperledger Composer"
[11]: https://www.hyperledger.org/projects/explorer "HyperLedger Explorer"
[12]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-explorer.html "超级账本HyperLedger的explorer的使用"
[13]: https://www.hyperledger.org/projects/fabric  "HyperLedger Fabric"
[14]: https://www.hyperledger.org/projects/hyperledger-indy  "HyperLedger Indy"
[15]: https://www.hyperledger.org/projects/iroha "HyperLedger Iroha"
[16]: https://www.hyperledger.org/projects/iroha/resources "HyperLedger Iroha Resources"
[17]: http://iroha.readthedocs.io/en/latest/ "HyperLedger Iroha Documents"
[18]: https://www.hyperledger.org/projects/quilt "HyperLedger Quilt"
[19]: https://www.hyperledger.org/blog/2017/10/16/hyperledger-gets-cozy-with-quilt  "HyperLedger Quilt Intro"
[20]: https://interledger.org/rfcs/0003-interledger-protocol/ "Interledger Protocol (ILP)"
[21]: https://www.hyperledger.org/projects/sawtooth "HyperLedger Sawtooth"
[22]: https://github.com/hyperledger/sawtooth-seth "Hyperledger Sawtooth - Seth"
