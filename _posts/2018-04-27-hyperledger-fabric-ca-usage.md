---
layout: default
title: 超级账本HyperLedger的fabricCA的用法讲解
author: 李佶澳
createdate: 2018/04/27 10:58:00
changedate: 2018/05/10 14:35:38
categories: 项目
tags: HyperLedger
keywords: 超级账本,fabricCA,hyperledger,blockchain,区块链,联盟链
description: "fabricCA用于管理hyperledger fabric以及fabric用户使用到的证书"

---

* auto-gen TOC:
{:toc}

## 说明

[视频教程汇总：HyperLedger Fabric的视频讲解--“主页”中可领优惠券](https://study.163.com/provider/400000000376006/course.htm)

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


## fabric-ca-server初始化

	mkdir -p /opt/app/fabric-ca/client
	cp $GOPATH/src/github.com/hyperledger/fabric-ca/bin/fabric-ca-client /opt/app/fabric-ca/client/
	ln -s /opt/app/fabric-ca/client/fabric-ca-client  /usr/bin/fabric-ca-client

	mkdir -p /opt/app/fabric-ca/server
	cp $GOPATH/src/github.com/hyperledger/fabric-ca/bin/fabric-ca-server /opt/app/fabric-ca/server/
	cd /opt/app/fabric-ca/server

初始化，可以使用ldap、mysql、postgresql，或者本地sqlite，默认sqlite：

	./fabric-ca-server init -b admin:pass

如果启动的是中间CA，用`-u`指定上级CA：

	./fabric-ca-server start -b admin:adminpw -u http://<enrollmentID>:<secret>@<parentserver>:<parentport>

如果直接作为RootCA，后面两个参数表示允许删除联盟和用户:

	./fabric-ca-server start -b admin:pass --cfg.affiliations.allowremove  --cfg.identities.allowremove

初始化后，会在当前目录生成以下文件：

	ca-cert.pem  fabric-ca-server-config.yaml  fabric-ca-server.db  msp/

fabric-ca-server-config.yaml是fabric-ca-server的配置文件。

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

## 生成fabric-ca管理员的凭证

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

	export FABRIC_CA_CLIENT_HOME=/opt/app/fabric-ca/clients/admin2
	mkdir -p $FABRIC_CA_CLIENT_HOME

然后生成凭证：

	fabric-ca-client enroll -u http://admin2:wvkpvMzLsjPz@localhost:7054

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

	fabric-ca-client register --id.name admin2 --id.affiliation org1.department1 --id.attrs 'hf.Revoker=true,admin=true:ecert'

这些属性是一定要了解的，以`hf.`开头的属性，是fabric-ca的内置属性:

    hf.Registrar.Roles            List        List of roles that the registrar is allowed to manage
    hf.Registrar.DelegateRoles    List        List of roles that the registrar is allowed to give to a registree for its ‘hf.Registrar.Roles’ attribute
    hf.Registrar.Attributes       List        List of attributes that registrar is allowed to register
    hf.GenCRL                     Boolean     Identity is able to generate CRL if attribute value is true
    hf.Revoker                    Boolean     Identity is able to revoke a user and/or certificates if attribute value is true
    hf.AffiliationMgr             Boolean     Identity is able to manage affiliations if attribute value is true
    hf.IntermediateCA             Boolean     Identity is able to enroll as an intermediate CA if attribute value is true

这些属性表示的是用户是否拥有相关的权限:

`hf.Registrar.Roles`该用户可以增加的新用户类型，用户类型都有：client、orderer、peer、user。

`hf.Registrar.DelegateRoles`该用户可以设置的新用户的`hf.Registrar.Roles`属性。

`hf.Registrar.Attributes`该用户可以为新用户设置的保留属性和自定义属性。

`hf.GenCRL`该用户是否可以获取CRL列表，已经撤销的证书列表。

`hf.Revoker`该用户是否能够撤销其它用户。

`hf.AffiliationMgr`该用户是否可以管理联盟。

`hf.IntermediateCA`该用户是否可以作为中间CA。

除了这些以`hf.`开头的属性外，还可以自定义属性，例如下面的`admin=true`:

	fabric-ca-client register --id.name admin2 --id.affiliation org1.department1 \
	--id.attrs 'hf.Revoker=true,admin=true:ecert'

用户自定义的属性可以写入到用户的凭证中，在合约中可以获取发起请求的用户属性，根据用户属性决定用户是否由操作权限。

参考[HyplerLedger FabricCA ABAC][6]，[HyperLedger Fabric Chaincode ABAC][7]给出一个使用ABAC的chaincode:

	...
	"github.com/hyperledger/fabric/core/chaincode/lib/cid"
	...
	
	err := cid.AssertAttributeValue(stub, "abac.init", "true")
	if err != nil {
	    return shim.Error(err.Error())
	}
	...

cid的使用说明见: [HyperLedger Fabric: Client Identity Chaincode Library][8]

cid（Client Identity）中提供下面的方法：

	+AssertAttributeValue(stub ChaincodeStubInterface, attrName, attrValue string) : error
	+GetAttributeValue(stub ChaincodeStubInterface, attrName string) : string, bool, error
	+GetID(stub ChaincodeStubInterface) : string, error
	+GetMSPID(stub ChaincodeStubInterface) : string, error
	+GetX509Certificate(stub ChaincodeStubInterface) : *x509.Certificate, error
	+New(stub ChaincodeStubInterface) : ClientIdentity, error
	
	▼+ClientIdentity : interface
	    [methods]
	   +AssertAttributeValue(attrName, attrValue string) : error
	   +GetAttributeValue(attrName string) : string, bool, error
	   +GetID() : string, error
	   +GetMSPID() : string, error
	   +GetX509Certificate() : *x509.Certificate, error

"admin=true:ecert"中的`ecert`的意思是，该属性会被自动写入到用户凭证中(enrollment certificate)。

对于没有注明`ecert`的属性，可以在生成用户凭证的时候，例如注册了这样一个用户的时候:

	fabric-ca-client register --id.name user1 --id.secret user1pw --id.type user \
	--id.affiliation org1 --id.attrs 'app1Admin=true:ecert,email=user1@gmail.com'

它的属性`email=user1@gmail.com`没有注明是ecert，在生成凭证的时候，可以指定下面的属性：

	fabric-ca-client enroll -u http://user1:user1pw@localhost:7054 --enrollment.attrs "email,phone:opt"

`app1Admin`将被自动包含在凭证中；`email`是被明确指定的，它必须是存在的，否则报错；`phone:opt`也是明确指定的，`opt`表示phone属性可选的，如果没有phone属性不会报错。

以`hf.`开头的下面三个属性，也会被自动包含在登陆凭证中：

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

## 参考

1. [Welcome to Hyperledger Fabric CA][1]
2. [fabric-ca codes][2]
3. [hyperledger的fabric项目的全手动部署][3]
4. [hyperledger的fabric项目的全手动部署: 开始部署][4]
5. [hyperledger的fabricCA的安装使用][5]
6. [HyplerLedger FabricCA ABAC][6]
7. [HyperLedger Fabric Chaincode ABAC][7]
8. [HyperLedger Fabric: Client Identity Chaincode Library][8]

[1]: https://hyperledger-fabric-ca.readthedocs.io/en/latest/  "Welcome to Hyperledger Fabric CA" 
[2]: https://github.com/hyperledger/fabric-ca "fabric-ca codes"
[3]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html#%E5%90%AF%E5%8A%A8%E5%89%8D%E5%87%86%E5%A4%87  "hyperledger的fabric项目的全手动部署"
[4]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html#%E5%BC%80%E5%A7%8B%E9%83%A8%E7%BD%B2 "开始部署"
[5]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html#%E7%BC%96%E8%AF%91%E5%AE%89%E8%A3%85 "hyperledger的fabricCA的安装使用"
[6]: https://hyperledger-fabric-ca.readthedocs.io/en/latest/users-guide.html#attribute-based-access-control  "HyplerLedger FabricCA ABAC"
[7]: https://github.com/hyperledger/fabric-samples/tree/release-1.1/chaincode/abac/go "HyperLedger Fabric Chaincode ABAC"
[8]: https://github.com/hyperledger/fabric/blob/release-1.1/core/chaincode/lib/cid/README.md  "HyperLedger Fabric: Client Identity Chaincode Library"
