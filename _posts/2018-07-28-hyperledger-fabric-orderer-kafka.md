---
layout: default
title:  "【视频】超级账本HyperLedger：Fabric使用kafka进行区块排序（共识）"
author: 李佶澳
createdate: 2018/07/28 23:17:00
changedate: 2018/07/29 13:09:49
categories: 项目
tags: 视频教程 HyperLedger
keywords: 超级账本,HyperLedger,orderer,kafka
description:  在HyperLedger Fabric1.2以及之前的版本中，使用kafka进行区块排序（共识）是比较贴近生产的

---

* auto-gen TOC:
{:toc}

## 说明

这是"网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)使用的素材。操作和讲解视频位于[《HyperLedger Fabric手把手入门》第四章](https://study.163.com/course/courseMain.htm?courseId=1005326005&share=2&shareId=400000000376006)中。

在Fabric1.2以及之前的版本中，使用kafka进行排序是比较贴近生产的。Fabric支持的三种共识机制：solo（单台orderer相当于没有共识）、kafka、pbft(还在开发中)，[Bringing up a Kafka-based Ordering Service][1]中介绍了使用kafka进行排序时需要注意的事项。

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

## 什么是kafka，为什么能用来做排序（共识）？

[Kafka is a distributed streaming platform][8]，也就是我们通常将的“消息队列”。

生产者可以通过kafka将消息传递给消费者，kafka保证消息的顺序以及不丢失：

![kafka usage](http://kafka.apache.org/11/images/kafka-apis.png)

![kafka consumer-groups](http://kafka.apache.org/11/images/consumer-groups.png)

需要注意的是，kafka虽然是一个分布式系统，但它本身是被中心化管理，并且依赖zookeeper。

Fabric使用kafka的时候，为了安全，应当配置tls加密和认证，特别是经过公网的时候。为了演示不过于繁琐，下面
没有配置认证和tls加密，可以仔细研读[Generate SSL key and certificate for each Kafka broker][4]，进行尝试。

## 部署kafka

首先要有一个kafka集群，[kafka][2]本身是一个分布式系统，部署配置略复杂。

这里的重点是Fabric，因此只部署了单节点的kafk，参考[kafka quick start][3]。

下载kafka，[下载地址][5]：

	wget http://mirror.bit.edu.cn/apache/kafka/1.1.1/kafka_2.12-1.1.1.tgz
	tar -xvf kafka_2.12-1.1.1.tgz
	cd kafka_2.12-1.1.1/

安装java，运行kafka需要java：

	$ yum install -y java-1.8.0-openjdk
	$ java -version
	openjdk version "1.8.0_181"
	OpenJDK Runtime Environment (build 1.8.0_181-b13)
	OpenJDK 64-Bit Server VM (build 25.181-b13, mixed mode)

启动kafka自带的zookeeper：

	./bin/zookeeper-server-start.sh config/zookeeper.properties 

根据HyperLedger Fabric对[kafka的需求][7]修改kafka的配置文件，可以到这里查看kafka的所有[配置项][6]）：

	# 默认为false
	unclean.leader.election.enable = false     
	
	# 根据kafka的节点数设置，需要小于备份数
	# 意思完成了“指定数量”的备份后，写入才返回成功
	min.insync.replicas = 1                    
	
	# 数据备份数
	default.replication.factor = 1             
	
	# 需要大于创世块中设置的 Orderer.AbsoluteMaxBytes
	# 注意不要超过 socket.request.max.bytes(100M)
	# 这里设置的是10M
	message.max.bytes = 10000120                
	                                           
	# 需要大于创世块中设置的 Orderer.AbsoluteMaxBytes
	# 注意不要超过 socket.request.max.bytes(100M)
	# 这里设置的是10M
	replica.fetch.max.bytes = 10485760

	                                           
	# 当前orderer不支持kafka log，需要关闭这个功能
	# @2018-07-29 08:19:32
	log.retention.ms = -1                      

将上面的配置添加到`config/server.properties`中，然后启动kafka：

	bin/kafka-server-start.sh config/server.properties

注意，你可能需要根据自己的实际情况配置`advertised.listeners`，使用kafka的机器需要能够通过
下面配置的hostname访问对应的节点，默认获取当前hostname，如果不配置hostname，可以修改为主机的对外IP。

	#advertised.listeners=PLAINTEXT://your.host.name:9092

如果要进行多节点部署，在另一台机器上用同样方式部署：

	注意更改server.properties中的zk地址，所有节点要使用同一个zk
	其它节点不需要再启动zookeeper

zookeeper也可以进行多节点部署，这里就不展开了，参考[zookeeper的资料][9]。

部署启动后，测试一下kafka：

	# 创建名为`test`的topic
	$ bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic test
	
	# 查看topic
	$ bin/kafka-topics.sh --list --zookeeper localhost:2181
	test
	
	# 启动生产者，并输入任意字符
	$ bin/kafka-console-producer.sh --broker-list localhost:9092 --topic test
	>This is a message
	>This is another message

	# 启动消费者，接收到生产者的输入
	$ bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test --from-beginning
	This is a message
	This is another message

## 生成创世区块 & 重新部署Fabric

需要注意现在(@2018-07-29 08:20:48)Fabric不支持切换共识机制！一旦选定了共识机制后，无法修改，除非清空所有数据，重新部署。

修改`configtx.yaml`中`Orderer`部分的内容，将共识机制修改为kafka，并填入kafka节点的地址：

	101 Orderer: &OrdererDefaults
	102     OrdererType: kafka
	103     Addresses:
	104         - orderer0.member1.example.com:7050
	105     BatchTimeout: 2s
	106     BatchSize:
	107         MaxMessageCount: 10
	108         AbsoluteMaxBytes: 8 MB         # 注意要小于kafka中设置的10M
	109         PreferredMaxBytes: 512 KB
	110     MaxChannels: 0
	111     Kafka:
	112         Brokers:
	113             - 192.168.88.11:9092       # 可以填入多个kafka节点的地址

如果kafka配置了tls加密，还要修改修改每个orderer的配置文件`orderer.yaml`中的Kakfa部分的内容，并上传证书。

重新生成创世块，重新部署Fabric，即可。

	./prepare.sh example 
	ansible-playbook -i inventories/example.com/hosts -u root  playbooks/manage_destroy.yml
	ansible-playbook -i inventories/example.com/hosts -u root  deploy_nodes.yml
	ansible-playbook -i inventories/example.com/hosts -u root  deploy_cli.yml
	ansible-playbook -i inventories/example.com/hosts -u root  deploy_cli_local.yml

## 创建Channel & 观察kafka中的topic

Fabric重新部署启动后，可以看到kafka中多了一个名为`genesis`的topic，genesis是我们这里使用的创世区块的channel的名称：

	$ bin/kafka-topics.sh --list --zookeeper localhost:2181
	__consumer_offsets
	genesis
	test

创建了名为`mychannel`的channel之后，kafka中多出了一个同名的topic：

	$bin/kafka-topics.sh --list --zookeeper localhost:2181
	__consumer_offsets
	genesis
	mychannel
	test

## ZooKeeper和Kafka数据的清空

如果要重新部署，清空zk和kafka的数据：

	rm -rf /tmp/zookeeper/
	rm -rf /tmp/kafka-logs/

## 参考

1. [Bringing up a Kafka-based Ordering Service][1]
2. [kafka][2]
3. [kafka quick start][3]
4. [Generate SSL key and certificate for each Kafka broker][4]
5. [kafka download][5]
6. [Kafka Broker Configs][6]
7. [Kafka steps][7]
8. [Kafka is a distributed streaming platform.][8]
9. [Welcome to Apache ZooKeeper][9]

[1]: http://fabric.lijiaocn.com/zh_CN/release-1.2/kafka.html#  "Bringing up a Kafka-based Ordering Service" 
[2]: http://kafka.apache.org/  "kafka" 
[3]: http://kafka.apache.org/quickstart "kafka quick start"
[4]: https://docs.confluent.io/2.0.0/kafka/ssl.html "Generate SSL key and certificate for each Kafka broker"
[5]: http://kafka.apache.org/downloads "kafka download"
[6]: http://kafka.apache.org/documentation/#brokerconfigs "Kafka Broker Configs"
[7]: http://fabric.lijiaocn.com/zh_CN/release-1.2/kafka.html#steps "Kafka steps"
[8]: http://kafka.apache.org/intro " Kafka® is a distributed streaming platform."
[9]: https://zookeeper.apache.org/ "Welcome to Apache ZooKeeper"
