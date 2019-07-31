---
layout: default
title:  "【视频】超级账本HyperLedger：为Fabric的Peer节点配置CouchDB"
author: 李佶澳
createdate: 2018/07/19 09:38:00
last_modified_at: 2018/07/29 13:08:07
categories: 项目
tags: 视频教程  HyperLedger
keywords: CouchDB,HyperLedger,Peer,超级账本
description: HyperLedger Fabric当前版本(1.1~1.2)的Peer的数据存储支持LevelDB和CouchDB两种方式，默认为LevelDB

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这是"网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)使用的素材。操作和讲解视频位于[《HyperLedger Fabric手把手入门》](https://study.163.com/course/courseMain.htm?courseId=1005326005&share=2&shareId=400000000376006)第三章。

当前(1.1~1.2)版本的Fabric的Peer的数据存储支持LevelDB和CouchDB两种方式，默认为LevelDB。

[LevelDB][2]是Google实现的高效kv数据库，可以应用于很多平台，是很多大数据系统的底层存储方案。

[CouchDB][3]是Apache旗下的文档型数据库，提供了更多样的数据操作，支持数据同步，[CouchDB Technical Overview][4]。

文档型数据库是相对于关系型数据而言的，文档数据库中可以直接存、取包含多种信息的文本，相比预先设计表结构的关系型数据库，文档数据库能应对变化、多样的数据。

Fabric的Peer在CouchDB中存储的是json数据，所有写入Fabric的数据都需要转换成json格式。Fabric部署之后，不支持在CouchDB和LevelDB之间切换！

{% include fabric_page_list.md %}

## CouchDB部署启动

[Installation on Unix-like systems][5]中出了在多种系统上安装方式，这里使用的CentOS系统。

创建文件/etc/yum.repos.d/bintray-apache-couchdb-rpm.repo，内容如下：

	[bintray--apache-couchdb-rpm]
	name=bintray--apache-couchdb-rpm
	baseurl=http://apache.bintray.com/couchdb-rpm/el7/$basearch/
	gpgcheck=0
	repo_gpgcheck=0
	enabled=1

安装：

	yum -y install epel-release && yum install couchdb

默认安装在`/opt/couchdb/`目录中:

	$ ls /opt/couchdb/
	LICENSE  bin  data  erts-8.3.5  etc  lib  releases  share  var

启动:

	systemctl start couchdb

默认监听127.0.0.1:5984：

	$ curl 127.0.0.1:5984
	{"couchdb":"Welcome","version":"2.1.2","features":["scheduler"],"vendor":{"name":"The Apache Software Foundation"}}

## CouchDB配置与控制台的使用

配置文件位于`/opt/couchdb/etc/`目录中：

	$ ls etc/
	default.d/  default.ini  local.d/  local.ini  vm.args

default.d和default.ini在版本更新的时候会被覆盖，因此自行配置的参数在local.ini和local.d中修改。

在local.d中创建一个以.ini结尾的文件，`couchdb.ini`：

	[chttpd]
	port = 5984
	bind_address = 0.0.0.0

	[admins]
	admin = password

然后重启couchdb：

	systemctl restart couchdb

5984端口提供了一个web控制台，使用下面的url访问：

	http://192.168.88.10:5984/_utils

如果没有创建couchdb.ini，都使用默认配置，刚启动时候默认所有人都可以访问，且都是管理员

可以在web控制台中设置管理员名称和密码。

## CouchDB的其它内容

可以直接在web控制台中创建数据库和文档，也可以使用[CouchDB API][7]

登录认证：[CouchDB Authentication][8]

## 为每个Peer配置CouchDB

修改每个Peer的core.yaml文件，设置

	ledger:
	  blockchain:
	  state:
	    stateDatabase: CouchDB   #将goleveldb修改为CouchDB
	    couchDBConfig:
	       couchDBAddress: 127.0.0.1:5984
	       username: admin
	       password: password

然后重启启动Peer。

**注意**：如果以前使用的是goleveldb，切换未CouchDB后，之前的数据不会被转移到CouchDB中！！

## first-network中的couchDB

可以看一下HyperLedgerFabric提供的All-in-One部署方式中的couchdb，这里直接使用Fabric1.2.0。

创建一个目录存放1.2.0的文件：

	mkdir fabric-1.2.0-example
	cd fabric-1.2.0-example/

下载fabric1.2.0的程序文件，这里使用的mac版:

	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/darwin-amd64-1.2.0/hyperledger-fabric-darwin-amd64-1.2.0.tar.gz
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/darwin-amd64-1.2.0/hyperledger-fabric-darwin-amd64-1.2.0.tar.gz.md5
	tar -xvf hyperledger-fabric-darwin-amd64-1.2.0.tar.gz

下载Fabric1.2.0匹配的镜像：

	./bin/get-docker-images.sh

如果下载失败，例如：

	$ ./bin/get-docker-images.sh
	Pulling hyperledger/fabric-peer:amd64-1.2.0-stable

这是因为[docker hub](https://hub.docker.com/r/hyperledger/fabric-peer/tags/)上没有1.2.0-stable这个标签。

修改./bin/get-docker-images.sh：

	ARCH=amd64
	#VERSION=1.2.0-stable
	VERSION=1.2.0          <-- 没有-stable

然后重新执行：

	$ ./bin/get-docker-images.sh

并将latest标签加到最新到镜像上：

	docker tags hyperledger/fabric-tools:amd64-1.2.0  hyperledger/fabric-tools:latest

将bin目录添加到PATH环境变量中：

	export PATH="/Users/lijiao/Work/Fabric/fabric-1.2.0-example/bin/:$PATH"

下载fabric-samples，这是HyperLedger提供Fabric部署示例：
	
	git clone https://github.com/hyperledger/fabric-samples.git

启动，注意要用`-s couchdb`指定使用couddb：

	cd fabric-samples/first-network
	./byfn.sh up -s couchdb

cli容器启动时执行`scripts/script.sh`，完成channel设置。

>我运行的时候cli容器出错，说是连接不上节点，基本上已经不依赖官方的例子了，所以没有深入分析@2018-07-19 21:27:23

## 参考

1. [HyperLedger Fabric: Using CouchDB][1]
2. [A light-weight, single-purpose library for persistence with bindings to many platforms][2]
3. [Apache CouchDB][3]
4. [CouchDB Technical Overview][4]
5. [Installation on Unix-like systems][5]
6. [CouchDB Config][6]
7. [CouchDB API Reference][7]
8. [CouchDB Authentication][8]

[1]: http://fabric.lijiaocn.com/zh_CN/release-1.2/couchdb_tutorial.html "HyperLedger Fabric: Using CouchDB" 
[2]: http://leveldb.org/  "A light-weight, single-purpose library for persistence with bindings to many platforms" 
[3]: http://couchdb.apache.org/ "Apache CouchDB"
[4]: http://docs.couchdb.org/en/2.1.2/intro/overview.html "CouchDB Technical Overview"
[5]: http://docs.couchdb.org/en/2.1.2/install/unix.html "Installation on Unix-like systems"
[6]: http://docs.couchdb.org/en/2.1.2/config/intro.html "CouchDB Config"
[7]: http://docs.couchdb.org/en/2.1.2/api/index.html "CouchDB API Reference"
[8]: http://docs.couchdb.org/en/2.1.2/api/server/authn.html "CouchDB Authentication"
