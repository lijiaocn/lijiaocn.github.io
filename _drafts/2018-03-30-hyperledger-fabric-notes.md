---
layout: default
title:  Hyperledger Fabric学习笔记
author: 李佶澳
createdate: 2018/03/30 15:40:00
changedate: 2018/03/30 17:12:16
categories: 项目
tags: blockchain
keywords: Hyperledger,fabric,学习笔记,notes
description: 还需要了解包括原理在内的细节，防止因为使用上的失误，造成了安全事故。

---

* auto-gen TOC:
{:toc}

## 说明

[Hyperledger Fabric的使用][1]中记录了Fabric的部署方法和基本使用。
只知道了基本使用方式是不够的，还需要了解包括原理在内的细节，防止因为使用上的失误，造成了安全事故。

## 中英名词

Transactions/交易/事务:  更改区块数据的操作。
Peer:          组成fabic网络的结点之一。
endorsed/背书：事务得到其它peer的确定。
chaincode/合约/链码:   包含处理逻辑的代码、容器。

## 概述

Fabric是一个以`chaincode`为主体的分布式区块链系统。交易都是交由指定的chaincode进行处理，但是只有
得到其它peer的背书后，才能将数据写入到区块中。

### 事务

事务分为两类，一类是初始化合约，在区块中启动合约，并传入初始化参数；一类是调用合约的函数。

合约初始化和调用时，需要指定peer地址的同时指定orderer的地址。
如果调用的合约函数不会在区块中增加数据，可以使用`query`方法，只需指定peer地址，无需指定orderer地址。
可以理解为`写操作`需要通知到orderer，`读操作`只需要指定peer。

### 数据存取

数据存储方式为`K -> (V X N)`:

	K:  keys
	V:  任意的二进制数据
	N:  数据的版本号

Ledger记录了所有的历史状态，Ledger由orderer负责构建，是一个区块链结构，每个区块中记录了已经排好序的交易。

每个peer都保存一份Ledger，orderer可以设置为保存部分账本。

peer保存的账本称为`PeerLedger`，order保存的账本称为`OrdererLedger`。

### 结点

整个fabric网络中有三个结点。

	client，submitting-client:   查询、调用合约 
	peer:      保存账本、执行合约、履行背书
	orderer:   提供分发保障和排序

client根据需要，向peer、order发起请求。

peer从ordering service中接收已经排好序的状态更新，保存在本地。

peer还有背书职责，向区块链中写入数据前，需要得到指定peer的背书。背书策略是在合约实例化的时候指定的。

orderer提供ordering service服务，ordering service有中心式、错误能力不同的分布式部署方式。

ordering service为clients和peers提供一个channel，在这个channel中，client可以向所有的peer广播消息，
ordering service保证所有的peer收到消息的顺序是相同的。

ordering service可以创建多个channel，类似于消息系统(messaging system)的发布/订阅，client和peer可以接入多个channel。

clinet向channel中广播消息，broadcast(blob)，order将消息分发到peer，deliver(seqno, prevhash, blob)。
peer保存ordering service广播出的所有消息。

### 交易过程

[Hyperledger Transactions Flow][3]。

## 参考

1. [Hyperledger Fabric的使用][1]
2. [Hyperledger Fabric Architecture][2]
3. [Hyperledger Transactions Flow][3]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/02/23/hyperledger-fabric-usage.html "Hyperledger Fabric的使用" 
[2]: http://hyperledger-fabric.readthedocs.io/en/latest/architecture.html  "Hyperledger Fabric Architecture"
[3]: http://hyperledger-fabric.readthedocs.io/en/latest/txflow.html  "Hyperledger Transactions Flow"
