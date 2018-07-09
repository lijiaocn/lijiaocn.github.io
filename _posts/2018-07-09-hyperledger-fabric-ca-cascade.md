---
layout: default
title: "超级账本HyperLedger：FabricCA的级联使用（InterMediaCA）"
author: 李佶澳
createdate: 2018/06/06 13:41:00
changedate: 2018/07/09 13:11:56
categories: 项目
tags: HyperLedger
keywords: hyperledger,fabricCA,超级账本,fabric
description: 在实际使用中，每个接入的机构都有自己用户管理系统，FabricCA必然要采用“级联”的方式部署

---

* auto-gen TOC:
{:toc}

## 说明

FabricCA级联的场景一直没有试验，也就是下图中场景：

![fabric-ca architecture](https://hyperledger-fabric-ca.readthedocs.io/en/latest/_images/fabric-ca.png)

在实际使用中，每个接入的机构都有自己用户管理系统，FabricCA必然要采用“级联”的方式部署。

下面将部署一个RootCA，在RootCA中创建一个为“Son”的机构，为Son机构的管理员创建一个账号。

然后Son机构用自己在RootCA中注册的账号，接入RootCA，作为Son机构的CA，成为一个InterMediaCA。

之后Son机构的管理员可以继续创建子机构，例如创建一个名为“GrandSon”的机构，相应在Son机构的CA中，为GrandSon创建一个账号。

GrandSon可以继续部署级联CA。

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

### 创建Son机构

先把默认创建的机构删除：

	fabric-ca-client -H  fabric-ca-cascade/admin affiliation remove --force org1
	fabric-ca-client -H  fabric-ca-cascade/admin affiliation remove --force org2

然后创建Son机构:

	fabric-ca-client -H  fabric-ca-cascade/admin affiliation add Son

查看新建的Son机构：

	# fabric-ca-client -H  fabric-ca-cascade/admin affiliation list
	2018/06/06 07:06:27 [INFO] [::1]:36168 GET /affiliations 201 0 "OK"
	affiliation: Son

为Son机构注册一个管理员用户，修改`fabric-ca-cascade/admin/fabric-ca-client-config.yaml`:

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

注册用户：

	fabric-ca-client register -H fabric-ca-cascade/admin --id.secret=password1

可以用下面的命令查看RootCA中已经注册的用户：

	fabric-ca-client -H fabric-ca-cascade/admin  identity  list

## 启动InterMediaCA

在第二台机器上启动InterMediaCA，注意`-u`参数，是`使用Admin@Son账号和密码，登录到了RootCA`：

	./fabric-ca-server start -b admin:pass1 -u http://Admin@Son:password1@192.168.88.10:7054 --cfg.affiliations.allowremove  --cfg.identities.allowremove  &

准备一个目录，存放InterMediaCA的管理员凭证：

	mkdir fabric-ca-cascade
	fabric-ca-client enroll -u http://admin:pass1@localhost:7054 -H fabric-ca-cascade/admin

删除默认的org1和org2机构：

	fabric-ca-client -H  fabric-ca-cascade/admin affiliation remove --force org1
	fabric-ca-client -H  fabric-ca-cascade/admin affiliation remove --force org2

创建机构GrandSon:

	fabric-ca-client -H  fabric-ca-cascade/admin affiliation add GrandSon

在InterMediaCA中注册GrandSon的管理员，修改fabric-ca-cascade/admin/fabric-ca-client-config.yaml: 

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

	fabric-ca-client register -H fabric-ca-cascade/admin --id.secret=password2

## 参考

1. [超级账本HyperLedger的fabricCA的用法讲解][1]
2. [Fabric-CA的使用演示(两个组织一个Orderer三个Peer)][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html "超级账本HyperLedger的fabricCA的用法讲解" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/04/fabric-ca-example.html  "超级账本HyperLedger视频教程：Fabric-CA的使用演示(两个组织一个Orderer三个Peer)" 
