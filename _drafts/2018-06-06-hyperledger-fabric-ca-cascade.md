---
layout: default
title: "超级账本Hyperledger的FabricCA级联使用"
author: 李佶澳
createdate: 2018/06/06 13:41:00
changedate: 2018/06/08 11:10:57
categories: 项目
tags: HyperLedger
keywords: hyperledger,fabricCA,超级账本,fabric
description: 

---

* auto-gen TOC:
{:toc}

## 说明

需求调研的事情基本完结了，产品思路也出来了。开始认认真真地搞技术。

最先需要考虑的是入住系统中的用户账号怎么管理，还好HyperLedger Fabric提供了Fabric-CA。

已经有两篇FabricCA的学习笔记了：

[超级账本HyperLedger的fabricCA的用法讲解][1]

[Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][2]

但是FabricCA级联的场景一直没有试验，也就是下图中场景：

![fabric-ca architecture](https://hyperledger-fabric-ca.readthedocs.io/en/latest/_images/fabric-ca.png)

在实际使用中，每个接入的机构都有自己用户管理系统，FabricCA必然要采用“级联”的方式部署。

下面将部署一个RootCA，在RootCA中创建一个为“son”的机构，为son机构创建一个账号。

第一级InterMediateCA通过son机构的账号，接入RootCA，作为son机构的CA。

然后在son机构的CA中，创建一个名为“grandson”的机构，相应为grandson创建一个账号。

第二级InterMediateCA通过grandson的账号，接入son结构的CA，成为grandson的CA。

## 启动RootCA 

编译安装方法在[超级账本HyperLedger的fabricCA的用法讲解][1]中已经提到了。

这里在三台上部署了fabric-ca，其实就是在每台机器上建立了一个目录，将fabricCA的client和server程序复制了过去：

	$ tree /opt/app/fabric-ca/server
	/opt/app/fabric-ca/server
	|-- fabric-ca-client
	`-- fabric-ca-server
	
	0 directories, 2 files

部署之后，做一个软连接：

	ln -s /opt/app/fabric-ca/server/fabric-ca-client /sbin/fabric-ca-client

这里没有使用LDAP、mysql等，直接使用fabricCA默认的sqlite，在一台机器上启动：

	cd /opt/app/fabric-ca/server
	./fabric-ca-server start -b admin:pass --cfg.affiliations.allowremove  --cfg.identities.allowremove &

准备一个目录，存放管理员的凭证：

	mkdir fabric-ca-cascade
	fabric-ca-client enroll -u http://admin:pass@localhost:7054 -H fabric-ca-cascade/admin

查看联盟：

	# fabric-ca-client -H  fabric-ca-cascade/admin affiliation list
	2018/06/06 07:00:26 [INFO] [::1]:36156 GET /affiliations 200 0 "OK"
	affiliation: .
	   affiliation: org2
	      affiliation: org2.department1
	   affiliation: org1
	      affiliation: org1.department1
	      affiliation: org1.department2

这里RootCA的服务地址是：

	192.168.88.10:7054

访问方式为：

	http://admin:pass@192.168.88.10:7054

但是admin是rootCA的管理员账号，不能把这个账号的名称和密码暴露给Intermediate CA。

### 创建son机构

先把默认创建的机构删除：

	fabric-ca-client -H  fabric-ca-cascade/admin affiliation remove --force org1
	fabric-ca-client -H  fabric-ca-cascade/admin affiliation remove --force org2

然后创建son机构:

	fabric-ca-client -H  fabric-ca-cascade/admin affiliation add son

查看新建的son机构：

	# fabric-ca-client -H  fabric-ca-cascade/admin affiliation list
	2018/06/06 07:06:27 [INFO] [::1]:36168 GET /affiliations 201 0 "OK"
	affiliation: son

为org1注册一个用户，修改`fabric-ca-cascade/admin/fabric-ca-client-config.yaml`:

	id:
	 name: Admin@son
	 type: client
	 affiliation: son
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

注册用户：

	fabric-ca-client register -H fabric-ca-cascade/admin --id.secret=password1

用下面的命令可以查看RootCA中的用户：

	fabric-ca-client -H fabric-ca-cascade/admin  identity  list

## 启动InterMediateCA

在第二台机器上启动fabricCA：

	./fabric-ca-server start -b admin:pass1 -u http://Admin@son:password1@192.168.88.10:7054 --cfg.affiliations.allowremove  --cfg.identities.allowremove  &

同样准备一个目录，存放管理员的凭证：

	mkdir fabric-ca-cascade
	fabric-ca-client enroll -u http://admin:pass1@localhost:7054 -H fabric-ca-cascade/admin

删除默认的org1和org2机构：

	fabric-ca-client -H  fabric-ca-cascade/admin affiliation remove --force org1
	fabric-ca-client -H  fabric-ca-cascade/admin affiliation remove --force org2

创建机构grandson:

	fabric-ca-client -H  fabric-ca-cascade/admin affiliation add grandson

修改fabric-ca-cascade/admin/fabric-ca-client-config.yaml: 

	id:
	  name: Admin@grandson
	  type: client
	  affiliation: grandson
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

注册用户：

	fabric-ca-client register -H fabric-ca-cascade/admin --id.secret=password2

## 参考

1. [超级账本HyperLedger的fabricCA的用法讲解][1]
2. [Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html "超级账本HyperLedger的fabricCA的用法讲解" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html  "超级账本HyperLedger视频教程：Fabric-CA的使用演示(两个组织一个Orderer三个Peer)" 
