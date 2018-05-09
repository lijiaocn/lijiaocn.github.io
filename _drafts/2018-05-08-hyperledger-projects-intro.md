---
layout: default
title:  超级账本HyperLedger旗下项目介绍
author: 李佶澳
createdate: 2018/05/08 14:35:00
changedate: 2018/05/09 10:12:27
categories: 项目
tags: HyperLedger
keywords: 超级账本,HyperLedger
description: 超级账本HyperLedger旗下有很多的项目，对这些项目做了简单了解，并收集了一些资料。

---

* auto-gen TOC:
{:toc}

## 说明

超级账本HyperLedger旗下有很多的项目，对这些项目做了简单了解，并收集了一些资料。

## Burrow

[Burrow][1]是[Monax][2]开发的项目，现在在HyplerLedger中孵化。Burrow的[Incubation proposal][3]中介绍，burrown之前的名字是
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

Monax的CEO Casey Kuhlman在[Why we're joining Hyperledger][5]中介绍了加入HyperLedger的原因，那时候项目名还是eris-db。

从Casey Kuhlman的博文中，可以得知Burrow的目标是一个`通用的智能合约执行引擎`:

	When we started our company in 2014 we never really had the intention of being
	solely responsible for building an enterprise grade, general purpose smart contract machine. 

该项目的文档资料现在比较少，Monax的[blog][2]也在完善，目前有不少链接是失效的。

项目文档中的链接也是各种404，过段时间再看看。

## Caliper

[Caliper][6]是一个Benchmark工具，最早是华为开发的，[Measuring Blockchain Performance with Hyperledger Caliper][7]。

![配图不错](https://www.hyperledger.org/wp-content/uploads/2018/03/Hyperledger_BlogGraphic_V3.png)

## Cello

[Cello][8]是一个部署管理平台，也就是现在常说的baas，用来管理组成链的节点，以及链本身。

[超级账本HyperLedger的cello项目的部署和使用](http://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2018/04/25/hyperledger-cello.html)

## Composer

[Composer][9]用来合约、区块链应用的开发工具，用来简化、加快区块链应用的开发。

	Our primary goal is to accelerate time to value, and make it easier to integrate
	your blockchain applications with the existing business systems. You can use 
	Composer to rapidly develop use cases and deploy a blockchain solution in weeks 
	rather than months. Composer allows you to model your business network and 
	integrate existing systems and data with your blockchain applications.

![HyperLedger Composer Usage](https://hyperledger.github.io/composer/latest/assets/img/Composer-Diagram.svg)

## Explorer

[Explorer][11]是一个区块链浏览器。

在[超级账本HyperLedger的explorer的使用][12]中简单体验了下。

## Fabric

[Fabric][13]是一个区块链技术框架，是区块链的实现。这里已经发布了多篇关于Fabric的文章：

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
