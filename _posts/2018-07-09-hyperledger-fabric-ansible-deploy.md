---
layout: default
title:  超级账本HyperLedger：视频教程，使用Ansible进行Fabric多节点分布式部署（实战）
author: 李佶澳
createdate: 2018/07/09 08:57:00
changedate: 2018/07/29 13:03:43
categories: 项目
tags: 视频教程 HyperLedger
keywords: ansible,HyperLedger,多机部署,分布式部署
description: 已经是一套非常实用的Ansible部署脚本了，完全可以应用于生产，直接部署HyperLedger Fabric

---

* auto-gen TOC:
{:toc}

## 说明

这是“网易云课堂[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。操作、配置文件和代码讲解视频在[网易云课堂《HyperLeger Fabric进阶实战课》第三章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)中。


这其实已经是一套非常实用的Ansible部署脚本了，完全可以`应用于生产`。
脚本托管在github上：[hyperledger-fabric-ansible][5]，网易云上有视频讲解：[视频][2]。

要获得更多的内容，可以关注`微信公众号`：

微信公众号：`我的网课` (二维码在文末，关注后自动回复个人微信号)

QQ交流群：  `576555864`

如果视频中有讲解不到位或需要订正的地方，可以到知识星球“区块链实践分享”中提问（二维码在文末）。

>为了统一我的环境，这里的IP变为33网段了，之前视频中都是88网段的，IP变化不影响实质。

## 目标

在192.168.33.11、192.168.33.12、192.168.33.13上部署一个有两个组织三个Peer组成的联盟。

联盟的二级域名为： example.com。

组织一的域名为： member1.example.com 

组织二的域名为： member2.example.com

组织一中部署了一个Orderer和两个Peer，域名和IP分别为：

	orderer0.member1.example.com  192.168.33.11
	peer0.member1.example.com     192.168.33.11
	peer1.member1.example.com     192.168.33.12

组织二没有部署Orderer参与共识，只部署一个Peer：

	peer0.member2.example.com     192.168.33.13

共识算法是solo，如果要切换为其它共识算法，例如kafka，需要另外部署kafka，并修改配置文件。

## 准备

下载Ansible脚本，这里使用Fabric1.1.x，1.2.x以及正在准备的1.3暂时没有文档，可以直接参考对应分支中的[README.md](https://github.com/introclass/hyperledger-fabric-ansible/blob/Fabric-1.2.x/README.md)。

	git clone https://github.com/introclass/hyperledger-fabric-ansible.git
	cd hyperledger-fabric-ansible
	git branch Fabric-1.1.x -t origin/Fabric-1.1.x 
	git checkout Fabric-1.1.x  

0 将要部署到目标环境中的二进制文件复制到output/example.com/bin/目录中

	mkdir -p output/example.com/
	cd output/example.com/
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-1.1.0/hyperledger-fabric-linux-amd64-1.1.0.tar.gz
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/linux-amd64-1.1.0/hyperledger-fabric-linux-amd64-1.1.0.tar.gz.md5
	tar -xvf hyperledger-fabric-linux-amd64-1.1.0.tar.gz

1 在inventories/example.com中创建配置文件，以及ansible需要的hosts文件:

	configtx.yaml
	crypto-config.yaml
	hosts

2 准备在运行ansible的机器使用fabric命令：

注意事项1：

>`prepare.sh`会使用hyperledger fabric的命令，需要把在本地运行的fabric命令放到`output/bin`目录中。

例如，我是在mac上执行ansible的，下载的是darwin版本的fabric：

	mkdir -p output/bin
	cd output/bin
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/darwin-amd64-1.1.0/hyperledger-fabric-darwin-amd64-1.1.0.tar.gz
	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/darwin-amd64-1.1.0/hyperledger-fabric-darwin-amd64-1.1.0.tar.gz.md5
	tar -xvf hyperledger-fabric-darwin-amd64-1.1.0.tar.gz

3 运行perpare.sh生成证书，以及创世块(可以根据需要修改脚本)：

	./prepare.sh example

注意事项2：

>每个部署环境分别在output和inventories中有一个自己的目录，要增加新部署环境除了在output和inventories中准备目录和文件，您还可能需要根据自己的需要在prepare.sh中添加为新的环境生成证书和其它文件的命令。

## 部署

0 在本地生成ssh登陆证书

	$ ssh-keygen
	Generating public/private rsa key pair.
	Enter file in which to save the key (/Users/lijiao/.ssh/id_rsa):

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

## Fabric初始化

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

## 部署合约

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

## 管理操作

1 启动链：

	ansible-playbook -i inventories/example.com/hosts -u root playbooks/manage_start.yml

2 停止链：

	ansible-playbook -i inventories/example.com/hosts -u root playbooks/manage_stop.yml

3 清空链上所有数据：

	ansible-playbook -i inventories/example.com/hosts -u root playbooks/manage_rebuild.yml

4 销毁链：

	ansible-playbook -i inventories/example.com/hosts -u root playbooks/manage_destroy.yml

## 联系

要获得更多的内容，可以关注：

        微信公众号： “我的网课”，(关注后可以获得我微信)
        QQ交流群： 576555864

如果视频中有讲解不到位或需要订正的地方，可以加入：

[更多关于超级账本和区块链的文章][6]

## 参考

1. [网易云课堂，IT技术快速入门学院][1]
2. [HyperLedger Fabric进阶实战课][2]
3. [超级账本&区块链实战文档][3]
4. [HyperLedger Fabric原版文档中文批注][4]
5. [hyperledger-fabric-ansible][5]
6. [更多关于超级账本和区块链的文章][6]

[1]: https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006 "IT技术快速入门学院" 
[2]: https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006 "HyperLedger Fabric进阶实战课"
[3]: http://www.lijiaocn.com/tags/blockchain.html "超级账本&区块链实战文档"
[4]: http://fabric.lijiaocn.com "HyperLedger Fabric原版文档中文批注"
[5]: https://github.com/introclass/hyperledger-fabric-ansible "hyperledger-fabric-ansible"
[6]: http://www.lijiaocn.com/tags/blockchain.html "更多关于超级账本和区块链的文章"
