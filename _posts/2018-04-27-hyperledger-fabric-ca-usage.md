---
layout: default
title:  hyperledger的fabricCA的使用
author: 李佶澳
createdate: 2018/04/27 10:58:00
changedate: 2018/04/28 18:45:12
categories: 项目
tags: blockchain
keywords: fabricCA,hyperledger,blockchain,区块链,联盟链
description: "fabricCA用于管理hyperledger fabric以及fabric用户使用到的证书"

---

* auto-gen TOC:
{:toc}

## 说明

Hyperledger Fabric CA是Hyperledger Fabric的证书授权中心，支持：

	添加用户、或者对接LDAP
	签发注册证书
	证书的更新和撤销

[Welcome to Hyperledger Fabric CA][1]

[fabric-ca codes][2]

## 概览

如下图所示，fabric-ca可以对接ldap，或者mysql、pgsql数据库。

通过fabric-ca client或者fabric-ca的sdk获得证书后，就可以用这些证书访问Peer。

![fabric-ca architecture](https://hyperledger-fabric-ca.readthedocs.io/en/latest/_images/fabric-ca.png)

## 编译安装

	$ go get -u github.com/hyperledger/fabric-ca
	$ cd $GOPATH/src/github.com/hyperledger/fabric-ca
	$ make fabric-ca-server
	$ make fabric-ca-client
	$ ls bin/
	fabric-ca-client  fabric-ca-server

## fabric-ca-server启动前准备

	$ mkdir /opt/app/fabric-ca/server
	$ cp $GOPATH/src/github.com/hyperledger/fabric-ca/bin/fabric-ca-server /opt/app/fabric-ca/server
	$ cd /opt/app/fabric-ca/server

初始化：

	$ ./fabric-ca-server init  -b  admin:pass

运行结束后，会在当前目录生成以下文件：

	ca-cert.pem  fabric-ca-server-config.yaml  fabric-ca-server.db  msp/

其中`ca-cert.pem`是一个自签署的证书：

	$ openssl verify -CAfile ca-cert.pem ca-cert.pem
	ca-cert.pem: OK

这个证书是根据`fabric-ca-server-config.yaml`中的`csr`生成的：
	
	csr:
	   cn: fabric-ca-server
	   names:
	      - C: US
	        ST: "North Carolina"
	        L:
	        O: Hyperledger
	        OU: Fabric
	   hosts:
	     - 10-39-0-121
	     - localhost
	   ca:
	      expiry: 131400h
	      pathlength: 1

可以用下面的命令查看：

	openssl x509 -in ca-cert.pem  -text

如果要生成被其它CA签署的证书，使用`-u`指定上一级CA：

	-u <parent-fabric-ca-server-URL>
	
	URL格式：
	    <scheme>://<enrollmentID>:<secret>@<host>:<port>

如果要签署已经准备好的key，需要用`ca.certfile`和`ca.keyfile`指定：

	ca:
	  # Name of this CA
	  name:
	  # Key file (is only used to import a private key into BCCSP)
	  keyfile:
	  # Certificate file (default: ca-cert.pem)
	  certfile:
	  # Chain file
	  chainfile:

`msp/keystore`中存放的`BCCSP (BlockChain Crypto Service Provider)`中用到的key:

	bccsp:
	    default: SW
	    sw:
	        hash: SHA2
	        security: 256
	        filekeystore:
	            # The directory used for the software file-based keystore
	            keystore: msp/keystore

还可以通过指定`-cacount`生成多个CA：

	fabric-ca-server start -b admin:adminpw --cacount 2

以及指定多个cafiles:

	fabric-ca-server start -b admin:adminpw --cafiles ca/ca1/fabric-ca-config.yaml --cafiles ca/ca2/fabric-ca-config.yaml

每个cafiles格式如下：

	ca:
	# Name of this CA
	name: <CANAME>
	
	csr:
	  cn: <COMMONNAME>

目录结构可以如下：

	--<Server Home>
	  |--ca
	    |--ca1
	      |-- fabric-ca-config.yaml
	    |--ca2
	      |-- fabric-ca-config.yaml

## 启动fabric-ca

如果没有使用LDAP，需要用`-b`设置第一个用户。

	$ fabric-ca-server start -b  admin:pass
	2018/04/27 11:31:06 [INFO] Starting server in home directory: /opt/app/fabric-ca/server
	2018/04/27 11:31:06 [INFO] Server Version: 1.1.1-snapshot-d536f5a
	2018/04/27 11:31:06 [INFO] Server Levels: &{Identity:1 Affiliation:1 Certificate:1}
	2018/04/27 11:31:06 [INFO] The CA key and certificate already exist
	2018/04/27 11:31:06 [INFO] The key is stored by BCCSP provider 'SW'
	2018/04/27 11:31:06 [INFO] The certificate is at: /opt/app/fabric-ca/server/ca-cert.pem
	2018/04/27 11:31:06 [INFO] Initialized sqlite3 database at /opt/app/fabric-ca/server/fabric-ca-server.db
	2018/04/27 11:31:06 [INFO] Home directory for default CA: /opt/app/fabric-ca/server
	2018/04/27 11:31:06 [INFO] Listening on http://0.0.0.0:7054

如果启动的是中间CA，用`-u`指定上级CA：

	fabric-ca-server start -b admin:adminpw -u http://<enrollmentID>:<secret>@<parentserver>:<parentport>

## fabric-ca client使用准备

为了方便，将fabric-ca-client连接到/usr/bin目录中：

	# ln -s $GOPATH/src/github.com/hyperledger/fabric-ca/bin/fabric-ca-client  /usr/bin/fabric-ca-client
	# ls /usr/bin/fabric-ca-client  -lh
	lrwxrwxrwx 1 root root 71 Apr 28 10:13 /usr/bin/fabric-ca-client -> /root/GOWORK//src/github.com/hyperledger/fabric-ca/bin/fabric-ca-client

这样之后，就可以在shell中直接使用命令`fabric-ca-client`了。

## 第一个用户的凭证

生成第一个用户的凭证:

	export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/admin
	mkdir -p $FABRIC_CA_CLIENT_HOME
	fabric-ca-client enroll -u http://admin:pass@localhost:7054

或者：

	fabric-ca-client enroll -u http://admin:pass@localhost:7054 -H `pwd`

在`/opt/app/fabric-ca/clients/admin`可以看到生成了以下文件：

	fabric-ca-client-config.yaml  msp/

其中`fabric-ca-client-config.yaml`是一个默认的配置文件,`msp/`中存放的是相关的证书。

	msp/
	|-- cacerts
	|   -- localhost-7054.pem
	|-- intermediatecerts
	|   -- localhost-7054.pem
	|-- keystore
	|   -- a17c01f53b037cbf51ad76f2a95684e6b2a4b8371e0b247949805af8035bf50e_sk
	-- signcerts
	    -- cert.pem

之后就可以通过`msp`目录中的证书，访问fabric-ca，不需要在输入密码。

## 查看联盟成员

fabric-ca默认注册了几个联盟，可以用`affiliation list`查看：

	$ fabric-ca-client affiliation list
	2018/04/28 14:59:55 [INFO] 127.0.0.1:38094 GET /affiliations 200 0 "OK"
	affiliation: .
	   affiliation: org1
	      affiliation: org1.department1
	      affiliation: org1.department2
	   affiliation: org2
	      affiliation: org2.department1

添加/删除联盟成员，也是通过这个命令进行：

	fabric-ca-client affiliation add another
	fabric-ca-client affiliation add another.sub

新增加的联盟成员如下：

	[root@10-39-0-121 admin]# fabric-ca-client affiliation list
	2018/04/28 15:03:42 [INFO] 127.0.0.1:38104 GET /affiliations 201 0 "OK"
	affiliation: .
	   affiliation: org1
	      affiliation: org1.department1
	      affiliation: org1.department2
	   affiliation: org2
	      affiliation: org2.department1
	   affiliation: another
	      affiliation: another.sub1

默认是禁止删除联盟，如果需要开启，需要在启动fabric-ca-server时传入参数`--cfg.affiliations.allowremove`:

	./fabric-ca-server start -b  admin:pass  --cfg.affiliations.allowremove

然后可以删除：

	fabric-ca-client affiliation remove another.sub1

如果联盟下还有联盟，可以加上参数`-force`级联删除。

## 注册新用户

例如注册一个名为`admin2`的用户，先指定要使用的用户的client目录：

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/admin

也可以用`-H`参数指定：

	$ fabric-ca-client -H /opt/app/fabric-ca/clients/admin  <其它参数...>

注册新用户的命令如下：

	$ fabric-ca-client register --id.name admin2 --id.affiliation org1.department1 --id.attrs 'hf.Revoker=true,admin=true:ecert'
	2018/04/28 10:20:42 [INFO] Configuration file location: /opt/app/fabric-ca/clients/admin/fabric-ca-client-config.yaml
	2018/04/28 10:20:42 [INFO] 127.0.0.1:38036 POST /register 201 0 "OK"
	Password: wvkpvMzLsjPz

新用户注册后，会自动为新用户生成一个密码，新用户需要使用这个密码，生成自己的凭证，就像第一个用户那样。

为新注册的用户`admin2`准备一个目录，注意要使用一个新的目录，防止与其它用户混淆：

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/admin2
	$ mkdir -p $FABRIC_CA_CLIENT_HOME

然后生成凭证：

	$ fabric-ca-client enroll -u http://admin2:wvkpvMzLsjPz@localhost:7054

之后可以看到新的目录中也生成了`fabric-ca-client-config.yaml`和`msp/`，这是admin2用户的凭证：

	$ tree admin2/
	admin2/
	|-- fabric-ca-client-config.yaml
	-- msp
	    |-- cacerts
	    |   -- localhost-7054.pem
	    |-- intermediatecerts
	    |   -- localhost-7054.pem
	    |-- keystore
	    |   -- 6732d8d3802384c8935aa7174930975ba6141b6d4bc419e6ccbe5f4d76db58f0_sk
	    -- signcerts
	        -- cert.pem

## 用户的属性

在注册admin2的时候，指定了这样一些属性`--id.attrs 'hf.Revoker=true,admin=true:ecert'`：

	$ fabric-ca-client register --id.name admin2 --id.affiliation org1.department1 --id.attrs 'hf.Revoker=true,admin=true:ecert'

这些属性是一定了解的，以`hf.`开头的属性，是fabric-ca的保留属性:

    hf.Registrar.Roles            List        List of roles that the registrar is allowed to manage
    hf.Registrar.DelegateRoles    List        List of roles that the registrar is allowed to give to a registree for its ‘hf.Registrar.Roles’ attribute
    hf.Registrar.Attributes       List        List of attributes that registrar is allowed to register
    hf.GenCRL                     Boolean     Identity is able to generate CRL if attribute value is true
    hf.Revoker                    Boolean     Identity is able to revoke a user and/or certificates if attribute value is true
    hf.AffiliationMgr             Boolean     Identity is able to manage affiliations if attribute value is true
    hf.IntermediateCA             Boolean     Identity is able to enroll as an intermediate CA if attribute value is true

这些属性表示的是用户是否拥有相关的权限。

`hf.Registrar.Roles`该用户可以增加的新用户类型，用户类型都有：client、orderer、peer、user。

`hf.Registrar.DelegateRoles`该用户可以设置的新用户的`hf.Registrar.Roles`属性。

`hf.Registrar.Attributes`该用户可以为新用户设置的保留属性和自定义属性。

`hf.GenCRL`该用户是否可以获取CRL列表，已经撤销的证书列表。

`hf.Revoker`该用户是否能够撤销其它用户。

`hf.AffiliationMgr`该用户是否可以管理联盟。

`hf.IntermediateCA`该用户是否可以作为中间CA。

除了这些以`hf.`开头的属性外，还可以自定义属性，例如下面的`admin=true`:

	$ fabric-ca-client register --id.name admin2 --id.affiliation org1.department1 --id.attrs 'hf.Revoker=true,admin=true:ecert'

用户自定义的属性可以写入到用户的凭证中，之后在合约中可以通过检查用户的属性，判断用户是否具有操作权限。

`admin=true:ecert`中的`ecert`的意思是，该属性会被自动写入到用户凭证中(enrollment certificate)。

对于没有注明`ecert`的属性，可以在生成用户凭证的时候，例如注册了这样一个用户:

	fabric-ca-client register --id.name user1 --id.secret user1pw --id.type user --id.affiliation org1 --id.attrs 'app1Admin=true:ecert,email=user1@gmail.com'

它的属性`email=user1@gmail.com`没有注明ecert，在生成凭证的时候，可以指定：

	fabric-ca-client enroll -u http://user1:user1pw@localhost:7054 --enrollment.attrs "email,phone:opt"

`email`是必须要在登陆凭证中包含的属性，`phone:opt`则是可选的。

以`hf.`开头的下面三个属性，被自动包含在登陆凭证中：

	hf.EnrollmentID    The enrollment ID of the identity
	hf.Type            The type of the identity
	hf.Affiliation     The affiliation of the identity

## 查看用户详情

可以用`fabric-ca-client identity list`查看`有权限`查看的用户的详情：

	$ fabric-ca-client identity list
	Name: admin, Type: client, Affiliation: , Max Enrollments: -1, Attributes: [{Name:hf.GenCRL Value:1 ECert:false} {Name:hf.Registrar.Attributes Value:* ECert:false} {Name:hf.AffiliationMgr Value:1 ECert:false} {Name:hf.Registrar.Roles Value:peer,orderer,client,user ECert:false} {Name:hf.Registrar.DelegateRoles Value:peer,orderer,client,user ECert:false} {Name:hf.Revoker Value:1 ECert:false} {Name:hf.IntermediateCA Value:1 ECert:false}]
	Name: admin2, Type: client, Affiliation: org1.department1, Max Enrollments: -1, Attributes: [{Name:hf.Revoker Value:true ECert:false} {Name:admin Value:true ECert:true} {Name:hf.EnrollmentID Value:admin2 ECert:true} {Name:hf.Type Value:client ECert:true} {Name:hf.Affiliation Value:org1.department1 ECert:true}]

## 用户的权利范围

用户的权利范围是用联盟属性`hf.Affiliation`来控制的。

	hf.Affiliation     The affiliation of the identity

联盟属性一个类似"a.b.c"样式的字符串，最顶层用户的该属性为"."。

一个用户只能管理平级以及下级的用户。

例如如果一个用户的hf.Affiliation是"a.b.*"，那么它能管理的用户的联盟属性必须以"a.b"开头。

联盟属性可以配置多个，并且支持通配符，例如：

	hf.Registrar.Attributes = a.b.*, x.y.z

另外:

	一个用户管理它的`hf.Registrar.Roles`属性中列出用户类型。
	一个用户能够管理的其它用户的属性，只能是它的`hf.Registrar.Attributes`属性列出的属性。
	    其中保留属性，还要求必须是当前用户拥有的属性。

后续的很多操作都受到`权利范围`的约束。

## 示范

创建一个由两个组织`org1.example.com`和`org2.example.com`组成的名为`example`的联盟。

org1.example.com有两个peer:

	peer0.org1.example.com
	peer1.org1.example.com

org2.example.com有一个peer:

	peer0.org2.example.com

每个组织都有一个Admin用户，和一个普通的User1用户。

联盟中的org1.example.com部署了一个`solo`模式的orderer。（多个orderer的使用，以后探讨）

## 启动fabic-ca

直接在本地上启动ca，第一个用户为admin，密码为pass。

	$ fabric-ca-server start -b  admin:pass &

并生成了凭证：

	export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/admin
	mkdir -p $FABRIC_CA_CLIENT_HOME
	fabric-ca-client enroll -u http://admin:pass@localhost:7054

### 创建联盟

	fabric-ca-client affiliation add com 
	fabric-ca-client affiliation add com.example
	fabric-ca-client affiliation add com.example.org1
	fabric-ca-client affiliation add com.example.org2

创建联盟如下：

	$ fabric-ca-client affiliation list
	2018/04/28 15:19:34 [INFO] 127.0.0.1:38160 GET /affiliations 201 0 "OK"
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org1
	      affiliation: com.example.org2

### org1.example.com的管理员注册

为org1.example.com注册一个管理员，准备一个目录存放管理员的凭证：

	mkdir -p /opt/app/fabric-ca/clients/org1.example.com/admin

用命令行注册，命令比较长，这里用`\\`截断了：

	fabric-ca-client register --id.name org1admin --id.type client --id.affiliation "com.example.org1"  \
	    --id.attrs '"hf.Registrar.Roles=client,orderer,peer,user","hf.Registrar.DelegateRoles=client,orderer,peer,user",\
	                 hf.Registrar.Attributes=*,hf.GenCRL=true,hf.Revoker=true,hf.AffiliationMgr=true,hf.IntermediateCA=true,role=admin:ecert'


该用户名称为`org1admin`，类型是`client`，它能够管理`org1.example.com.*`下的用户，各个参数含义如下:

	--id.name org1admin                                        //用户名
	--id.type client                                           //类型为client
	--id.affiliation "com.example.org1"                      //权利访问
	hf.Registrar.Roles=client,orderer,peer,user            //能够管理的用户类型
	hf.Registrar.DelegateRoles=client,orderer,peer,user    //可以授权给子用户管理的用户类型
	hf.Registrar.Attributes=*                                  //可以为子用户设置所有属性
	hf.GenCRL=true                                             //可以生成撤销证书列表
	hf.Revoker=true                                            //可以撤销用户
	hf.AffiliationMgr=true                                     //能够管理联盟
	hf.IntermediateCA=true                                     //可以作为中间CA
	role=admin:ecert                                           //自定义属性

命令行参数过程，也可以将设置写在配置文件中。在生成第一个用户的凭证时，在该用户的目录下生成了一个实例的client配置文件。

	$ ls admin/
	fabric-ca-client-config.yaml  msp

将其中的id部分修改为：

	id:
	  name: org1admin
	  type: client
	  affiliation: org1.example.com.*
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
	      value: admin:ecert

然后直接执行下面的命令，即可完成用户org1admin注册：

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/admin
	$ fabric-ca-client register
	Password: sPfsnUDFCcMu

这一步会自动生成密码，如果要使用指定密码，通过参数`--id.secret`指定。

生成org1admin凭证：

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org1.example.com/admin
	$ fabric-ca-client enroll -u http://org1admin:sPfsnUDFCcMu@localhost:7054
	$ ls org1.example.com/admin/
	fabric-ca-client-config.yaml  msp/

这时候我们以org1admin的身份查看联盟：

	$ fabric-ca-client affiliation list
	2018/04/28 15:35:10 [INFO] 127.0.0.1:38172 GET /affiliations 201 0 "OK"
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org1

可以发现，只能看到org1联盟，也就是只能看到org1admin权限范围中的内容。

### org2.example.com的管理员注册

为org2.example.com注册管理员的方式相同，需要先将`FABRIC_CA_CLIENT_HOME`重新设置为第一用户的client目录：

	export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/admin

然后准备目录：

	mkdir -p /opt/app/fabric-ca/clients/org2.example.com/admin

修改第一个用户client目录下配置文件，将其中的id部分修改为：

	id:
	  name: org2admin
	  type: client
	  affiliation: org2.example.com.*
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
	      value: admin:ecert

注册：

	$ fabric-ca-client register
	Password: hTGAbaajcstN

生成凭证：

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org2.example.com/admin
	$ fabric-ca-client enroll -u http://org2admin:hTGAbaajcstN@localhost:7054
	$ ls org2.example.com/admin/
	fabric-ca-client-config.yaml  msp/

查看联盟：

	$ fabric-ca-client affiliation list
	2018/04/28 15:40:48 [INFO] 127.0.0.1:38178 GET /affiliations 201 0 "OK"
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org2

### org1.example.com的部署

org1.example.com中部署一个order和两个peer。我们对应的注册三个用户。

注意，这三个用户使用org1.exampl.com的admin注册即可：

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org1.example.com/admin

为了将fabric组件使用的帐号与人员使用的帐号区分，建立两个机构：

	fabric-ca-client affiliation add com.example.org1.component
	fabric-ca-client affiliation add com.example.org1.user

然后通过修改org1.example.com/admin目录下的fabric-ca-client-config.yaml，分别创建对应的用户：

orderer1的设置:

	id:
	  name: orderer1
	  type: orderer
	  affiliation: com.example.org1.component
	  maxenrollments: 0
	  attributes:
	    - name: role
	      value: orderer:ecert

创建:

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org1.example.com/admin
	$ fabric-ca-client register
	Password: GVLalyhWawUb
	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org1.example.com/orderer1
	$ mkdir -p $FABRIC_CA_CLIENT_HOME
	fabric-ca-client enroll -u http://orderer1:GVLalyhWawUb@localhost:7054

peer0的设置:

	id:
	  name: peer0
	  type: peer
	  affiliation: com.example.org1.component
	  maxenrollments: 0
	  attributes:
	    - name: role
	      value: peer:ecert

创建:

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org1.example.com/admin
	$ fabric-ca-client register
	Password: RPhCdqcvdKLm
	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org1.example.com/peer0
	$ mkdir -p $FABRIC_CA_CLIENT_HOME
	fabric-ca-client enroll -u http://peer0:RPhCdqcvdKLm@localhost:7054

peer1的设置:

	id:
	  name: peer1
	  type: peer
	  affiliation: com.example.org1.component
	  maxenrollments: 0
	  attributes:
	    - name: role
	      value: peer:ecert

创建:

	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org1.example.com/admin
	$ fabric-ca-client register
	Password: mLMyFkjxhxDR
	$ export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/org1.example.com/peer1
	$ mkdir -p $FABRIC_CA_CLIENT_HOME
	fabric-ca-client enroll -u http://peer1:mLMyFkjxhxDR@localhost:7054


order、peer启动的时候还需要读取`msp/admincerts`目录中的证书，需要创建一个用户，然后
将用户证书复制到到admincerts目录中，这样之后，该用户就对对应的order和peer具备了管理员权限。

这里直接使用org1admin的证书。

	cd /opt/app/fabric-ca/clients/org1.example.com/
	mkdir {orderer1,peer0,peer1}/msp/admincerts
	cp admin/msp/signcerts/cert.pem  orderer1/msp/admincerts/
	cp admin/msp/signcerts/cert.pem  peer0/msp/admincerts/
	cp admin/msp/signcerts/cert.pem  peer1/msp/admincerts/

然后order1、peer0、peer1的msp分别复制到order和peer组件所在的目录中。

在org1admin的msp目录中也需要创建admincerts目录：

	mkdir msp/admincerts
	cp msp/signcerts/cert.pem msp/admincerts/

现在就可以直接使用org1admin用户创建chaincode了。

## 参考

1. [Welcome to Hyperledger Fabric CA][1]
2. [fabric-ca codes][2]

[1]: https://hyperledger-fabric-ca.readthedocs.io/en/latest/  "Welcome to Hyperledger Fabric CA" 
[2]: https://github.com/hyperledger/fabric-ca "fabric-ca codes"