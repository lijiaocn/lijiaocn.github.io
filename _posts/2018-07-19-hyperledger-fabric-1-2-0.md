---
layout: default
title: "超级账本HyperLedger：Fabric从1.1.0升级到1.2.0"
author: 李佶澳
createdate: 2018/07/19 14:48:00
changedate: 2018/07/26 13:33:43
categories: 项目
tags: HyperLedger
keywords: HyperLedger升级,超级账本,Fabric
description: HyperLedger Fabric的升级还是比较方便的，直接替换程序文件和配置文件。

---

* auto-gen TOC:
{:toc}

## 说明

这是网易云课堂“[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。

Fabric1.2增加了这些新特性：私有数据、服务发现、访问控制和插拔式背书验证。详情可见[Fabric: What’s new in v1.2][1]。

升级过程也比较简单：[Upgrading to the Newest Version of Fabric][2]。

这里演示怎样将[《使用Ansible进行Fabric多节点分布式部署（实战）》][3]中部署1.1.0版本的Fabric升级到Fabric 1.2.0。

使用的Ansible脚本托管在github上： [Ansible脚本][5]。

## 从 Fabric 1.1 升级到 Fabric 1.2

**重要**: 升级要在部署Fabric 1.1时使用的`hyperledger-fabric-ansible`目录中进行操作。

备份上一个版本的二进制文件，注意只备份bin和config：

	cd output/example.com
	mv bin bin-1.1.0
	mv config config-1.1.0

**注意1**：不要改动output/example.com中的`crypto-config`，这个目录中存放的是证书，在升级时不应当被更新！

下载1.2版本的文件:

	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-1.2.0/hyperledger-fabric-linux-amd64-1.2.0.tar.gz
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-1.2.0/hyperledger-fabric-linux-amd64-1.2.0.tar.gz.md5
	tar -xvf hyperledger-fabric-linux-amd64-1.2.0.tar.gz

对比config和config-1.1.0中的文件，看一下1.2.0版本的配置文件中引入了哪些新的配置。

将原先的配置文件备份：

	mv ../../roles/peer/templates/core.yaml.j2 config-1.1.0/
	mv ../../roles/orderer/templates/orderer.yaml.j2 config-1.1.0/
	mv ../../roles/cli/templates/core.yaml.j2 config-1.1.0/

然后在config中准备最新的配置模版：

	cd config
	cp core.yaml core.server.yaml.j2
	cp core.yaml core.client.yaml.j2
	cp orderer.yaml  orderer.yaml.j2

编辑core.yaml.j2和orderer.yaml.j2之后，将其复制到对应的目录：

	cp `pwd`/config/orderer.yaml.j2       ../../roles/orderer/templates/orderer.yaml.j2
	cp `pwd`/config/core.server.yaml.j2   ../../roles/peer/templates/core.yaml.j2
	cp `pwd`/config/core.client.yaml.j2   ../../roles/cli/templates/core.yaml.j2


**注意2**：下面是直接关停所有节点，然后用anbile一次替换所有节点上的程序文件，生产环境中注意要逐台升级，并做好备份！

关停节点：

	ansible-playbook -i inventories/example.com/hosts -u root ./playbooks/manage_stop.yml

`Ansible脚本能确保只更新发生了变化的文件，应当只有程序文件或者更新后的配置文件被更新`

更新所有机器上的程序文件：

	ansible-playbook -i inventories/example.com/hosts -u root deploy_nodes.yml

更新cli中的程序文件：

	ansible-playbook -i inventories/example.com/hosts -u root deploy_cli.yml

验证:

	$ cd /opt/app/fabric/cli/user/member1.example.com/Admin-peer0.member1.example.com
	$ ./peer.sh node status
	status:STARTED

原先的数据和合约依旧可以使用：

	$ ./5_query_chaincode.sh
	key1value

## 直接部署Fabric-1.2.0

直接部署过程与分支Fabric-1.1.x的部署过程类似，只是将程序文件换成了1.2.0版本。

Fabric 1.2.0的Peer依赖的镜像，提前在Peer上下载好：

	docker pull hyperledger/fabric-ccenv:latest
	docker pull hyperledger/fabric-baseos:amd64-0.4.10
	docker pull hyperledger/fabric-javaenv:x86_64-1.1.0     #for java
	docker pull hyperledger/fabric-baseimage:amd64-0.4.10   #for node.js

### 目标

在192.168.88.10、192.168.88.11、192.168.88.12上部署一个有两个组织三个Peer组成的联盟。

联盟的二级域名为： example.com。

组织一的域名为： member1.example.com 

组织二的域名为： member2.example.com

组织一中部署了一个Orderer和两个Peer，域名和IP分别为：

	orderer0.member1.example.com  192.168.88.10
	peer0.member1.example.com     192.168.88.10
	peer1.member1.example.com     192.168.88.11

组织二没有部署Orderer参与共识，只部署一个Peer：

	peer0.member2.example.com     192.168.88.12

共识算法是solo，如果要切换为其它共识算法，例如kafka，需要另外部署kafka，并修改配置文件。

### 准备

0 将要部署到目标环境中的二进制文件复制到output/example.com/bin/目录中

	mkdir -p output/example.com/
	cd output/example.com/
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-1.2.0/hyperledger-fabric-linux-amd64-1.2.0.tar.gz
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-1.2.0/hyperledger-fabric-linux-amd64-1.2.0.tar.gz.md5
	tar -xvf hyperledger-fabric-linux-amd64-1.2.0.tar.gz

1 在inventories/example.com中创建配置文件，以及ansible需要的hosts文件:

	configtx.yaml
	crypto-config.yaml
	hosts

2 准备在运行ansible的机器使用fabric命令。

`prepare.sh`会使用hyperledger fabric的命令，需要把在本地运行的fabric命令放到`output/bin`目录中。

例如，我是在mac上执行ansible的，下载的是darwin版本的fabric：

	mkdir -p output/bin
	cd output/bin
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/darwin-amd64-1.2.0/hyperledger-fabric-darwin-amd64-1.2.0.tar.gz
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/darwin-amd64-1.2.0/hyperledger-fabric-darwin-amd64-1.2.0.tar.gz.md5
	tar -xvf hyperledger-fabric-darwin-amd64-1.2.0.tar.gz
	cd ../../

3 运行perpare.sh生成证书，以及创世块(可以根据需要修改脚本)：

	./prepare.sh example

>每个部署环境分别在output和inventories中有一个自己的目录，要增加新部署环境除了在output和inventories中准备目录和文件，您还可能需要根据自己的需要在prepare.sh中添加为新的环境生成证书和其它文件的命令。

### 部署

1 初始化目标机器

	export ANSIBLE_HOST_KEY_CHECKING=False
	ansible-playbook -k -i inventories/example.com/hosts -u root deploy_prepare.yml

2 检测证书设置是否成功

	ansible -i inventories/example.com/hosts -u root  all  -m command -a "pwd"

3 如果域名没有绑定IP，修改每台机器的/etc/hosts，（会替换整个文件）：

	ansible -i inventories/example.com/hosts -u root  all  -m copy -a "src=./inventories/example.com/etc_hosts dest=/etc/hosts"

4 部署节点

	ansible-playbook -i inventories/example.com/hosts -u root deploy_nodes.yml

5 部署客户端

	ansible-playbook -i inventories/example.com/hosts -u root deploy_cli.yml

### Fabric初始化

1 进入member1的管理员目录，对peer0.member1.example.com进行操作：

	cd /opt/app/fabric/cli/user/member1.example.com/Admin-peer0.member1.example.com/
	
	//创建channel，channel只需要创建一次
	./0_create_channel.sh
	
	//加入channel
	./1_join_channel.sh
	
	//设置锚点Peer：
	./2_set_anchor_peer.sh

2 进入member1的管理员目录，对peer1.member1.example.com进行操作：

	cd /opt/app/fabric/cli/user/member1.example.com/Admin-peer1.member1.example.com
	./1_join_channel.sh

3 进入member2的管理员目录，对peer0.member1.example.com进行操作：

	cd /opt/app/fabric/cli/user/member2.example.com/Admin-peer0.member2.example.com
	
	//加入channel
	./1_join_channel.sh
	
	//设置锚点Peer：
	./2_set_anchor_peer.sh

### 部署合约

1 进入member1的管理员目录，对peer0.member1.example.com进行操作：

	cd /opt/app/fabric/cli/user/member1.example.com/Admin-peer0.member1.example.com/
	
	//先获取合约代码，可能会比较慢，拉取代码比较耗时
	go get github.com/lijiaocn/fabric-chaincode-example/demo
	
	//安装合约
	./3_install_chaincode.sh
	
	//查看已经安装的合约
	./peer.sh chaincode list --installed
	
	//合约实例化，只需要实例化一次
	./4_instantiate_chaincode.sh

2 在其它Peer上部署合约

	//peer1.member1.example.com
	//先获取合约代码，可能会比较慢，拉取代码比较耗时
	go get github.com/lijiaocn/fabric-chaincode-example/demo
	
	cd /opt/app/fabric/cli/user/member1.example.com/Admin-peer1.member1.example.com/
	./3_install_chaincode.sh
	
	//peer0.member2.example.com
	//先获取合约代码，可能会比较慢，拉取代码比较耗时
	go get github.com/lijiaocn/fabric-chaincode-example/demo
	
	cd /opt/app/fabric/cli/user/member2.example.com/Admin-peer0.member2.example.com/
	./3_install_chaincode.sh

>同一个合约，只需要在任意一个Peer上实例化一次。

3 调用合约，写数据

	./6_invoke_chaincode.sh

4 调用合约，查数据

	./5_query_chaincode.sh

### 管理操作

1 启动链：

	ansible-playbook -i inventories/example.com/hosts -u root playbooks/manage_start.yml

2 停止链：

	ansible-playbook -i inventories/example.com/hosts -u root playbooks/manage_stop.yml

3 清空链上所有数据：

	ansible-playbook -i inventories/example.com/hosts -u root playbooks/manage_rebuild.yml

4 销毁链：

	ansible-playbook -i inventories/example.com/hosts -u root playbooks/manage_destroy.yml

## 参考

1. [Fabric: What’s new in v1.2][1]
2. [Upgrading to the Newest Version of Fabric][2]
3. [使用Ansible进行Fabric多节点分布式部署（实战）][3]
4. [introclass/hyperledger-fabric-ansible][4]
5. [hyperledger-fabric-ansible部署脚本][5]
6. [网易云课堂，IT技术快速入门学院][6]

[1]: http://fabric.lijiaocn.com/zh_CN/release-1.2/whatsnew.html "Fabric: What’s new in v1.2" 
[2]: https://hyperledger-fabric.readthedocs.io/en/release-1.2/upgrade_to_newest_version.html  "Upgrading to the Newest Version of Fabric" 
[3]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/09/hyperledger-fabric-ansible-deploy.html "使用Ansible进行Fabric多节点分布式部署（实战）"
[4]: https://github.com/introclass/hyperledger-fabric-ansible "introclass/hyperledger-fabric-ansible"
[5]: https://github.com/introclass/hyperledger-fabric-ansible "https://github.com/introclass/hyperledger-fabric-ansible"
[6]: https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006 "IT技术快速入门学院" 
