---
layout: default
title: "超级账本HyperLedger：FabricCA的级联使用（InterMediateCA）"
author: 李佶澳
createdate: 2018/06/06 13:41:00
changedate: 2018/07/20 13:57:53
categories: 项目
tags: HyperLedger
keywords: hyperledger,fabricCA,超级账本,fabric
description: 在HyperLedger Fabric实际使用中，每个接入的机构都有自己用户管理系统，FabricCA必然要采用“级联”的方式部署

---

* auto-gen TOC:
{:toc}

## 说明

这是网易云课堂“[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。FabricCA级联部署的场景一直没有试验，也就是下图中的场景：

![fabric-ca architecture](https://hyperledger-fabric-ca.readthedocs.io/en/latest/_images/fabric-ca.png)

在实际使用中，每个接入的机构都有自己用户管理系统，FabricCA必然要采用“级联”的方式部署。
下面将部署一个RootCA，在RootCA中创建一个为“Son”的机构，为Son机构的管理员创建一个账号。
然后Son机构用自己在RootCA中注册的账号，接入RootCA，成为Son机构的CA，一个InterMediateCA。
之后Son机构的管理员可以继续创建子机构，例如创建一个名为“GrandSon”的机构，相应在Son机构的CA中，为GrandSon创建一个账号。

>注意：我使用的1.1.1版本的FabricCA，在InterMediateCA基础上继续级联CA时失败，下面有记录(2018-07-09 14:54:32)。

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

## 部署

三台机器的IP如下：

	RootCA     192.168.88.10
	SonCA      192.168.88.11
	GrandSon   192.168.88.12

编译安装方法在[超级账本HyperLedger的fabricCA的用法讲解][1]中已经提到了。

在三台机器上部署了fabric-ca，其实就是在每台机器上建立了一个目录，将fabricCA的client和server程序复制了过去：

	$ tree /opt/app/fabric-ca/server
	/opt/app/fabric-ca/server
	|-- fabric-ca-client
	`-- fabric-ca-server
	
	0 directories, 2 files

部署之后，做一个软连接：

	ln -s /opt/app/fabric-ca/server/fabric-ca-client /sbin/fabric-ca-client

## 启动RootCA 

这里没有使用LDAP、mysql等，直接使用fabricCA默认的sqlite，在192.168.88.10机器上启动：

	cd /opt/app/fabric-ca/server
	./fabric-ca-server start -b admin:pass --cfg.affiliations.allowremove  --cfg.identities.allowremove &

准备一个目录，存放管理员的凭证：

	mkdir fabric-ca-user-cert
	fabric-ca-client enroll -u http://admin:pass@localhost:7054 -H fabric-ca-user-cert/admin

查看联盟：

	# fabric-ca-client -H  fabric-ca-user-cert/admin affiliation list
	2018/06/06 07:00:26 [INFO] [::1]:36156 GET /affiliations 200 0 "OK"
	affiliation: .
	   affiliation: org2
	      affiliation: org2.department1
	   affiliation: org1
	      affiliation: org1.department1
	      affiliation: org1.department2

留意RootCA的服务地址是：

	192.168.88.10:7054

RootCA管理员的登录方式为：

	http://admin:pass@192.168.88.10:7054

admin是RootCA的管理员账号，不能把这个账号的名称和密码暴露给Intermediate CA，需要为每个Intermediate CA 单独创建账号。

## 在RootCA中创建Son机构和它的管理员

先把RootCA中默认创建的机构删除：

	fabric-ca-client -H  fabric-ca-user-cert/admin affiliation remove --force org1
	fabric-ca-client -H  fabric-ca-user-cert/admin affiliation remove --force org2

然后创建Son机构:

	fabric-ca-client -H  fabric-ca-user-cert/admin affiliation add Son

查看新建的Son机构：

	# fabric-ca-client -H  fabric-ca-user-cert/admin affiliation list
	2018/06/06 07:06:27 [INFO] [::1]:36168 GET /affiliations 201 0 "OK"
	affiliation: Son

为Son机构注册一个管理员用户，修改`fabric-ca-user-cert/admin/fabric-ca-client-config.yaml`:

	id:
	 name: Admin@Son
	 type: client
	 affiliation: Son
	 maxenrollments: 0
	 attributes:
	   - name: hf.Registrar.Roles
	     value: client,orderer,peer,user
	   - name: hf.Registrar.DelegateRoles
	     value: client,orderer,peer,user
	   - name: hf.Registrar.Attributes
	     value: "*"
	   - name: hf.GenCRL
	     value: true
	   - name: hf.Revoker
	     value: true
	   - name: hf.AffiliationMgr
	     value: true
	   - name: hf.IntermediateCA
	     value: true
	   - name: role
	     value: admin
	     ecert: true

在RootCA中注册Son的管理员：

	fabric-ca-client register -H fabric-ca-user-cert/admin --id.secret=password1

可以用下面的命令查看RootCA中已经注册的用户：

	fabric-ca-client -H fabric-ca-user-cert/admin  identity  list

## 启动InterMediateCA

在第二台机器192.168.88.11上启动InterMediateCA，注意`-u`参数，使用的是`Admin@Son账号和密码`：

	./fabric-ca-server start -b admin:pass1 -u http://Admin@Son:password1@192.168.88.10:7054 --cfg.affiliations.allowremove  --cfg.identities.allowremove  &

准备一个目录，存放InterMediateCA的管理员凭证：

	mkdir fabric-ca-user-cert
	fabric-ca-client enroll -u http://admin:pass1@localhost:7054 -H fabric-ca-user-cert/admin

删除默认的org1和org2机构：

	fabric-ca-client -H  fabric-ca-user-cert/admin affiliation remove --force org1
	fabric-ca-client -H  fabric-ca-user-cert/admin affiliation remove --force org2

## 在InterMediateCA中继续创建子机构，并注册管理员

如果Son机构还有下属的独立机构，可以继续创建子机构的子机构GrandSon，下面操作在192.168.88.11上执行:

	fabric-ca-client -H  fabric-ca-user-cert/admin affiliation add GrandSon

在InterMediateCA中注册GrandSon的管理员，修改`fabric-ca-user-cert/admin/fabric-ca-client-config.yaml`: 

	id:
	  name: Admin@GrandSon
	  type: client
	  affiliation: GrandSon
	  maxenrollments: 0
	  attributes:
	    - name: hf.Registrar.Roles
	      value: client,orderer,peer,user
	    - name: hf.Registrar.DelegateRoles
	      value: client,orderer,peer,user
	    - name: hf.Registrar.Attributes
	      value: "*"
	    - name: hf.GenCRL
	      value: true
	    - name: hf.Revoker
	      value: true
	    - name: hf.AffiliationMgr
	      value: true
	    - name: hf.IntermediateCA
	      value: true
	    - name: role
	      value: admin
	      ecert: true

注册Admin@GrandSon：

	fabric-ca-client register -H fabric-ca-user-cert/admin --id.secret=password2

## 是否能在InterMediateCA的上，继续级联CA？

在第三台机器192.168.88.13上尝试在做一个InterMediateCA，注意`-u`参数，这时候使用的是`Admin@GrandSon账号和密码`，IP地址是`Son机构的CA地址`：

	./fabric-ca-server start -b admin:pass2 -u http://Admin@GrandSon:password2@192.168.88.11:7054 --cfg.affiliations.allowremove  --cfg.identities.allowremove  &

结果报错：

	2018/07/09 05:57:36 [INFO] Configuration file location: /opt/app/fabric-ca/server/fabric-ca-server-config.yaml
	2018/07/09 05:57:36 [INFO] Starting server in home directory: /opt/app/fabric-ca/server
	2018/07/09 05:57:36 [INFO] Server Version: 1.1.1-snapshot-e656889
	2018/07/09 05:57:36 [INFO] Server Levels: &{Identity:1 Affiliation:1 Certificate:1}
	2018/07/09 05:57:36 [INFO] generating key: &{A:ecdsa S:256}
	2018/07/09 05:57:36 [INFO] encoded CSR
	Error: Response from server: Error Code: 0 - Certificate signing failure: {"code":5300,"message":"Policy violation request"}

查看Son机构的CA发现报错：

	2018/07/09 05:57:36 [ERROR] local signer certificate disallows issuing CA certificate
	2018/07/09 05:57:36 [INFO] 192.168.88.12:57932 POST /enroll 500 0 "Certificate signing failure: {"code":5300,"message":"Policy violation request"}"

日志提示Son机构的CA（InterMediateCA）不能签署CA证书。

>不支持多层级联？还是权限设置不对？有待核实。2018-07-09 14:15:19

## 从RootCA中获取的用户证书，与从InterMediaCA中获取的用户证书有何不同？

从RootCA中，获取Admin@Son的证书：
	
	mkdir -p  fabric-ca-user-cert/Admin@Son
	fabric-ca-client enroll -u http://Admin@Son:password1@192.168.88.10:7054 -H fabric-ca-user-cert/Admin@Son

从Son的CA中，获取Admin@GrandSon的证书：

	mkdir -p  fabric-ca-user-cert/Admin@GrandSon
	fabric-ca-client enroll -u http://Admin@GrandSon:password2@192.168.88.11:7054 -H fabric-ca-user-cert/Admin@GrandSon

注意上面的两步操作访问的IP是不同的。

对比发现，从RootCA中获取的证书中包含的Intermedia Cert是一个空文件，也就是说没有intermeidate certs：

	$ cat fabric-ca-user-cert/Admin@Son/msp/intermediatecerts/192-168-88-10-7054.pem
	< 内容为空 >

从Son CA中获取的证书中，InterMediate Certs中的文件不为空，并且是`Admin@Son`的证书：

	$ openssl x509 -in fabric-ca-user-cert/Admin@GrandSon/msp/intermediatecerts/192-168-88-11-7054.pem  -text
	Signature Algorithm: ecdsa-with-SHA256
	    Issuer: C=US, ST=North Carolina, O=Hyperledger, OU=Fabric, CN=fabric-ca-server
	    Validity
	        Not Before: Jul  9 05:16:00 2018 GMT
	        Not After : Jul  8 05:21:00 2023 GMT
	    Subject: C=US, ST=North Carolina, O=Hyperledger, OU=client, OU=Son, CN=Admin@Son
	...

这两份从不同的CA中获取的用户证书中，cacerts目录中的证书是相同的（`内容相同`）：

	$ md5sum fabric-ca-user-cert/Admin@GrandSon/msp/cacerts/192-168-88-11-7054.pem
	920409e7d7648cb2b3dfb967b339dc39  fabric-ca-user-cert/Admin@GrandSon/msp/cacerts/192-168-88-11-7054.pem
	
	$ md5sum fabric-ca-user-cert/Admin@Son/msp/cacerts/192-168-88-10-7054.pem
	920409e7d7648cb2b3dfb967b339dc39  fabric-ca-user-cert/Admin@Son/msp/cacerts/192-168-88-10-7054.pem

都是RootCA的根证书：

	# openssl x509 -in fabric-ca-user-cert/Admin@Son/msp/cacerts/192-168-88-10-7054.pem -text
	Certificate:
	    Data:
	        Version: 3 (0x2)
	        Serial Number:
	            6a:a7:8a:ba:73:ce:1e:57:8c:a0:70:b1:2c:b3:cc:d3:4f:dd:2b:23
	    Signature Algorithm: ecdsa-with-SHA256
	        Issuer: C=US, ST=North Carolina, O=Hyperledger, OU=Fabric, CN=fabric-ca-server
	        Validity
	            Not Before: Jul  9 05:09:00 2018 GMT
	            Not After : Jul  5 05:09:00 2033 GMT
	        Subject: C=US, ST=North Carolina, O=Hyperledger, OU=Fabric, CN=fabric-ca-server

## 接下来...

[更多关于超级账本和区块链的文章](http://www.lijiaocn.com/tags/blockchain.html)

## 参考

1. [超级账本HyperLedger的fabricCA的用法讲解][1]
2. [Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html "超级账本HyperLedger的fabricCA的用法讲解" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html  "超级账本HyperLedger视频教程：Fabric-CA的使用演示(两个组织一个Orderer三个Peer)" 
