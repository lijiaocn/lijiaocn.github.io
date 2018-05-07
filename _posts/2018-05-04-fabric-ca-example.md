---
layout: default
title:  超级账本HyperLedger的Fabric-CA的使用演示(两个组织一个Orderer三个Peer)
author: 李佶澳
createdate: 2018/05/04 14:09:00
changedate: 2018/05/07 10:31:25
categories: 项目
tags: blockchain
keywords: 超级账本部署,fabric-ca,hyperledger,orderer证书
description: 这里将演示如何使用fabric-ca为每个组件和用户生成证书，本文是对hyperledger的fabric项目的全手动部署的补充

---

* auto-gen TOC:
{:toc}

## 说明

[网易云课堂：HyperLedger Fabric手动部署教程的视频讲解](http://study.163.com/course/introduction.htm?courseId=1005326005&share=2&shareId=400000000376006)

[超级账本HyperLedger Fabric手动部署教程的文字实录(公开)](http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html)

本文是对[hyperledger的fabric项目的全手动部署][3]的补充，这里将演示如何使用fabric-ca为每个组件和用户生成证书。

可以使用下面的部署方式：

![fabric-deploy-example]({{ site.imglocal }}/hyperledger-class/fabric-ca-deploy-example-1.png)

这里做了简化，只部署了一个Fabric-CA作为rootCA。

![fabric-deploy-example]({{ site.imglocal }}/hyperledger-class/fabric-ca-deploy-example-2.png)

将创建一个由两个组织`org1.example.com`和`org2.example.com`组成的的联盟。

另外还有一个组织`example.com`用来部署orderer。

example.com部署了一个`solo`模式的orderer。（多个orderer的部署方式，以后探讨）

	orderer.example.com

org1.example.com部署了两个peer:

	peer0.org1.example.com
	peer1.org1.example.com

org2.example.com部署了一个peer:

	peer0.org2.example.com

每个组织都要有一个Admin用户，每个组件(peer/orderer)也需要一个账号，因此需要通过fabric-ca创建7个用户：

	example.com:       Admin@example.com       orderer.example.com
	org1.example.com:  Admin@org1.example.com  peer0.org1.example.com  peer1.org1.example.com  
	org2.example.com:  Admin@org2.example.com  peer0.org2.example.com

这里只创建了Admin用户，普通用户的创建方式相同，只是普通用户的证书不需要添加到目标组件的admincerts目录中。

## 启动fabric-ca

fabirc-ca的编译：

	$ go get -u github.com/hyperledger/fabric-ca
	$ cd $GOPATH/src/github.com/hyperledger/fabric-ca
	$ make fabric-ca-server
	$ make fabric-ca-client
	$ ls bin/
	fabric-ca-client  fabric-ca-server

这里将fabric-ca部署在`/opt/app/fabric-ca/server`目录中：

	mkdir -p /opt/app/fabric-ca/server
	cp -rf $GOPATH/src/github.com/hyperledger/fabric-ca/bin/*  /opt/app/fabric-ca/server
	ln -s /opt/app/fabric-ca/server/fabric-ca-client  /usr/bin/fabric-ca-client

直接启动ca，fabric-ca admin的名称为admin，密码为pass。(这里只是演示，生产中使用，你需要根据实际的情况配置)

	cd /opt/app/fabric-ca/server
	./fabric-ca-server start -b  admin:pass &

如果有删除联盟和用户的需求，需要用下面的方式启动：

	cd /opt/app/fabric-ca/server
	./fabric-ca-server start -b admin:pass --cfg.affiliations.allowremove  --cfg.identities.allowremove &

## fabric-ca admin的凭证

后续操作在《[hyperledger的fabric项目的全手动部署][3]》中创建的fabric-deploy目录中进行后续操作。

	cd ~/fabric-deploy
	mkdir fabric-ca-files 

生成fabric-ca admin的凭证：

	export FABRIC_CA_CLIENT_HOME=`pwd`/fabric-ca-files/admin
	mkdir -p $FABRIC_CA_CLIENT_HOME
	fabric-ca-client enroll -u http://admin:pass@localhost:7054

环境变量`FABRIC_CA_CLIENT_HOME`指定了client的工作目录，生成的用户凭证将存放在这个目录中。

也可以用`-H`参数指定：

	mkdir -p `pwd`/fabric-ca-files/admin
	fabric-ca-client enroll -u http://admin:pass@localhost:7054 -H `pwd`/fabric-ca-files/admin

为了防止混乱，后面的演示操作中，都直接用`-H`指定目录。

## 创建联盟

执行下面命令创建联盟：
	
	fabric-ca-client  -H `pwd`/fabric-ca-files/admin  affiliation add com 
	fabric-ca-client  -H `pwd`/fabric-ca-files/admin  affiliation add com.example
	fabric-ca-client  -H `pwd`/fabric-ca-files/admin  affiliation add com.example.org1
	fabric-ca-client  -H `pwd`/fabric-ca-files/admin  affiliation add com.example.org2

创建联盟如下：

	$ fabric-ca-client -H `pwd`/fabric-ca-files/admin  affiliation list
	2018/04/28 15:19:34 [INFO] 127.0.0.1:38160 GET /affiliations 201 0 "OK"
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org1
	      affiliation: com.example.org2

你可能会看到fabric-ca启动时自动创建的org1和org2联盟，可以用下面的命令将其删除：

	fabric-ca-client -H `pwd`/fabric-ca-files/admin  affiliation remove --force  org1
	fabric-ca-client -H `pwd`/fabric-ca-files/admin  affiliation remove --force  org2

## 为每个组织准备msp

为example.com准备msp，将ca证书等存放改目录中:

	mkdir -p ./fabric-ca-files/example.com/msp
	fabric-ca-client getcacert -M `pwd`/fabric-ca-files/example.com/msp    //-M需要指定绝对路径

命令执行结束后，会在`fabric-ca-files/example.com/msp`得到文件：

	$ tree example.com/msp/
	example.com/msp/
	|-- cacerts
	|   `-- localhost-7054.pem
	|-- intermediatecerts
	|   `-- localhost-7054.pem
	|-- keystore
	`-- signcerts

注意通过getcacert得到msp目录中只有CA证书。

同样的方式为org1.example.com获取msp:

	mkdir -p fabric-ca-files/org1.example.com/msp
	fabric-ca-client getcacert -M `pwd`/fabric-ca-files/org1.example.com/msp

用同样的方式为org2.example.com准备msp:

	mkdir -p ./fabric-ca-files/org2.example.com/msp
	fabric-ca-client getcacert -M `pwd`/fabric-ca-files/org2.example.com/msp

## 注册example.com的管理员Admin@example.com

可以直接用命令行（命令比较长，这里用`\\`截断了）：

	fabric-ca-client register --id.name Admin@example.com --id.type client --id.affiliation "com.example.org1"  \
	    --id.attrs '"hf.Registrar.Roles=client,orderer,peer,user","hf.Registrar.DelegateRoles=client,orderer,peer,user",\
	                 hf.Registrar.Attributes=*,hf.GenCRL=true,hf.Revoker=true,hf.AffiliationMgr=true,hf.IntermediateCA=true,role=admin:ecert'

也可以将命令行参数写在fabric-ca admin的配置文件`fabric-ca-fiels/admin/fabric-ca-client-config.yaml`中。

	$ ls fabric-ca-fiels/admin/admin/
	fabric-ca-client-config.yaml  msp

将其中的`id`部分修改为：

	id:
	  name: Admin@example.com
	  type: client
	  affiliation: com.example
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

直接执行下面的命令，即可完成用户`Admin@example.com`注册：
	
	fabric-ca-client register -H `pwd`/fabric-ca-files/admin --id.secret=password

如果不用`--id.secret`指定密码，会自动生成密码。

其它配置的含义是用户名为`Admin@example.com`，类型是`client`，它能够管理`com.example.*`下的用户，如下:

	--id.name  Admin@example.com                           //用户名
	--id.type client                                       //类型为client
	--id.affiliation "com.example"                         //权利访问
	hf.Registrar.Roles=client,orderer,peer,user            //能够管理的用户类型
	hf.Registrar.DelegateRoles=client,orderer,peer,user    //可以授权给子用户管理的用户类型
	hf.Registrar.Attributes=*                              //可以为子用户设置所有属性
	hf.GenCRL=true                                         //可以生成撤销证书列表
	hf.Revoker=true                                        //可以撤销用户
	hf.AffiliationMgr=true                                 //能够管理联盟
	hf.IntermediateCA=true                                 //可以作为中间CA
	role=admin:ecert                                       //自定义属性

生成Admin@example.com凭证：

	$ mkdir -p ./fabric-ca-files/example.com/admin
	$ fabric-ca-client enroll -u http://Admin@example.com:password@localhost:7054  -H `pwd`/fabric-ca-files/example.com/admin
	$ ls ./fabric-ca-files/example.com/admin
	fabric-ca-client-config.yaml  msp/

这时候可以用Admin@example.com的身份查看联盟：

	$ fabric-ca-client affiliation list -H `pwd`/fabric-ca-files/example.com/admin
	2018/04/28 15:35:10 [INFO] 127.0.0.1:38172 GET /affiliations 201 0 "OK"
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org1
	      affiliation: com.example.org2

最后需要将Admin@example.com的证书复制到example.com/msp/admincerts/

	mkdir fabric-ca-files/example.com/msp/admincerts/
	cp fabric-ca-files/example.com/admin/msp/signcerts/cert.pem  fabric-ca-files/example.com/msp/admincerts/

只有这样，才能具备管理员权限。

## 注册org1.example.com的管理员Admin@org1.example.com

为org1.example.com的管理员Admin@org1.example.com准备一个目录:
	
	cd ~/fabric-deploy
	mkdir -p ./fabric-ca-files/org1.example.com/admin

修改fabric-ca admin目录下的`fabric-ca-client-config.yaml`文件:

	id:
	  name: Admin@org1.example.com
	  type: client
	  affiliation: com.example.org1
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

	fabric-ca-client register -H `pwd`/fabric-ca-files/admin --id.secret=password

生成凭证：

	$ fabric-ca-client enroll -u http://Admin@org1.example.com:password@localhost:7054  -H `pwd`/fabric-ca-files/org1.example.com/admin
	$ ls ./fabric-ca-files/org1.example.com/admin
	fabric-ca-client-config.yaml  msp/

查看联盟：

	$ fabric-ca-client affiliation list -H `pwd`/fabric-ca-files/org1.example.com/admin
	2018/05/04 15:42:53 [INFO] 127.0.0.1:51298 GET /affiliations 201 0 "OK"
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org1

注意与`Admin@example.com`的区别，这里智能看到组织com.example.org1

将Admin@org1.example.com的证书复制到org1.example.com的msp/admincerts中：

	mkdir fabric-ca-files/org1.example.com/msp/admincerts/
	cp fabric-ca-files/org1.example.com/admin/msp/signcerts/cert.pem  fabric-ca-files/org1.example.com/msp/admincerts/

在Admin@org1.example.com中也需要创建msp/admincerts目录，通过peer命令操作fabric的时候会要求admincerts存在：

	mkdir fabric-ca-files/org1.example.com/admin/msp/admincerts/
	cp fabric-ca-files/org1.example.com/admin/msp/signcerts/cert.pem  fabric-ca-files/org1.example.com/admin/msp/admincerts/

另外，这里没有中间CA，将intermediatecerts中的空文件删除，否则peer会提示Warning：

	rm fabric-ca-files/org1.example.com/admin/msp/intermediatecerts/*
 
## 注册org2.example.com的管理员Admin@org2.example.com

为org2.example.com的管理员Admin@org2.example.com准备一个目录:
	
	cd ~/fabric-deploy
	mkdir -p ./fabric-ca-files/org2.example.com/admin

修改fabric-ca admin目录下的`fabric-ca-client-config.yaml`文件:

	id:
	  name: Admin@org2.example.com
	  type: client
	  affiliation: com.example.org2
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

	fabric-ca-client register -H `pwd`/fabric-ca-files/admin --id.secret=password

生成凭证：

	$ fabric-ca-client enroll -u http://Admin@org2.example.com:password@localhost:7054  -H `pwd`/fabric-ca-files/org2.example.com/admin
	$ ls ./fabric-ca-files/org2.example.com/admin
	fabric-ca-client-config.yaml  msp/

查看联盟：

	$ fabric-ca-client affiliation list -H `pwd`/fabric-ca-files/org2.example.com/admin
	2018/05/02 16:49:00 [INFO] 127.0.0.1:50828 GET /affiliations 201 0 "OK"
	affiliation: com
	   affiliation: com.example
	      affiliation: com.example.org2

Admin@org2.example.com只能看到组织`com.example.org2`。

将Admin@org2.example.com的证书复制到org2.example.com的msp/admincerts中：

	mkdir fabric-ca-files/org2.example.com/msp/admincerts/
	cp fabric-ca-files/org2.example.com/admin/msp/signcerts/cert.pem  fabric-ca-files/org2.example.com/msp/admincerts/

在Admin@org2.example.com中也需要创建msp/admincerts目录，通过peer命令操作fabric的时候会要求admincerts存在：

	mkdir fabric-ca-files/org2.example.com/admin/msp/admincerts/
	cp fabric-ca-files/org2.example.com/admin/msp/signcerts/cert.pem  fabric-ca-files/org2.example.com/admin/msp/admincerts/

另外，这里没有中间CA，将intermediatecerts中的空文件删除，否则peer会提示Warning：

	rm fabric-ca-files/org2.example.com/admin/msp/intermediatecerts/*

## 各个组织分别使用自己的Admin账户创建其它账号

example.com、org1.example.com、org2.example.com三个组织这时候可以分别使用自己的Admin账号创建子账号。

### orderer.example.com

使用`Admin@example.com`为唯一的orderer注册账号。	

注意这时候我们要指定的目录是`fabric-ca-files/example.com/admin/`。

修改fabric-ca-files/example.com/admin/fabric-ca-client-config.yaml:

	id:
	  name: orderer.example.com
	  type: orderer
	  affiliation: com.example
	  maxenrollments: 0
	  attributes:
	    - name: role
	      value: orderer:ecert

注册以及生成凭证：

	fabric-ca-client register -H `pwd`/fabric-ca-files/example.com/admin --id.secret=password
	mkdir ./fabric-ca-files/example.com/orderer
	fabric-ca-client enroll -u http://orderer.example.com:password@localhost:7054 -H `pwd`/fabric-ca-files/example.com/orderer

将`Admin@example.com`的证书复制到fabric-ca-files/example.com/orderer/msp/admincerts：

	mkdir fabric-ca-files/example.com/orderer/msp/admincerts
	cp fabric-ca-files/example.com/admin/msp/signcerts/cert.pem fabric-ca-files/example.com/orderer/msp/admincerts/

### peer0.org1.example.com

注意这时候我们要指定的目录是`fabric-ca-files/org1.example.com/admin/`。

修改fabric-ca-files/org1.example.com/admin/fabric-ca-client-config.yaml:

	id:
	  name: peer0.org1.example.com
	  type: peer
	  affiliation: com.example.org1
	  maxenrollments: 0
	  attributes:
	    - name: role
	      value: peer:ecert

注册以及生成凭证：

	fabric-ca-client register -H `pwd`/fabric-ca-files/org1.example.com/admin --id.secret=password
	mkdir ./fabric-ca-files/org1.example.com/peer0
	fabric-ca-client enroll -u http://peer0.org1.example.com:password@localhost:7054 -H `pwd`/fabric-ca-files/org1.example.com/peer0

将`Admin@org1.example.com`的证书复制到fabric-ca-files/org1.example.com/peer0/msp/admincerts：

	mkdir fabric-ca-files/org1.example.com/peer0/msp/admincerts
	cp fabric-ca-files/org1.example.com/admin/msp/signcerts/cert.pem fabric-ca-files/org1.example.com/peer0/msp/admincerts/

### peer1.org1.example.com

注意这时候我们要指定的目录是`fabric-ca-files/org1.example.com/admin/`。

修改fabric-ca-files/org1.example.com/admin/fabric-ca-client-config.yaml:

	id:
	  name: peer1.org1.example.com
	  type: peer
	  affiliation: com.example.org1
	  maxenrollments: 0
	  attributes:
	    - name: role
	      value: peer:ecert

注册以及生成凭证：

	fabric-ca-client register -H `pwd`/fabric-ca-files/org1.example.com/admin --id.secret=password
	mkdir ./fabric-ca-files/org1.example.com/peer1
	fabric-ca-client enroll -u http://peer1.org1.example.com:password@localhost:7054 -H `pwd`/fabric-ca-files/org1.example.com/peer1

将`Admin@org1.example.com`的证书复制到fabric-ca-files/org1.example.com/peer1/msp/admincerts：

	mkdir fabric-ca-files/org1.example.com/peer1/msp/admincerts
	cp fabric-ca-files/org1.example.com/admin/msp/signcerts/cert.pem fabric-ca-files/org1.example.com/peer1/msp/admincerts/

### peer0.org2.example.com

注意这时候我们要指定的目录是`fabric-ca-files/org2.example.com/admin/`。

修改fabric-ca-files/org2.example.com/admin/fabric-ca-client-config.yaml:

	id:
	  name: peer0.org2.example.com
	  type: peer
	  affiliation: com.example.org2
	  maxenrollments: 0
	  attributes:
	    - name: role
	      value: peer:ecert

注册以及生成凭证：

	fabric-ca-client register -H `pwd`/fabric-ca-files/org2.example.com/admin --id.secret=password
	mkdir ./fabric-ca-files/org2.example.com/peer0
	fabric-ca-client enroll -u http://peer0.org2.example.com:password@localhost:7054 -H `pwd`/fabric-ca-files/org2.example.com/peer0

将`Admin@org2.example.com`的证书复制到fabric-ca-files/org2.example.com/peer0/msp/admincerts：

	mkdir fabric-ca-files/org2.example.com/peer0/msp/admincerts
	cp fabric-ca-files/org2.example.com/admin/msp/signcerts/cert.pem fabric-ca-files/org2.example.com/peer0/msp/admincerts/

## 重新部署

然后在[hyperledger的fabric项目的全手动部署][3]`执行结束后得到的fabric-deploy目录`基础上，进行下面的操作。

修改`configtx.yaml`，将其中的msp路径修改为通过fabric-ca创建的msp目录:

	Profiles:
	    TwoOrgsOrdererGenesis:
	        Orderer:
	            <<: *OrdererDefaults
	            Organizations:
	                - *OrdererOrg
	        Consortiums:
	            SampleConsortium:
	                Organizations:
	                    - *Org1
	                    - *Org2
	    TwoOrgsChannel:
	        Consortium: SampleConsortium
	        Application:
	            <<: *ApplicationDefaults
	            Organizations:
	                - *Org1
	                - *Org2
	Organizations:
	    - &OrdererOrg
	        Name: OrdererOrg
	        ID: OrdererMSP
	        MSPDir: ./fabric-ca-files/example.com/msp
	    - &Org1
	        Name: Org1MSP
	        ID: Org1MSP
	        MSPDir: ./fabric-ca-files/org1.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org1.example.com
	              Port: 7051
	    - &Org2
	        Name: Org2MSP
	        ID: Org2MSP
	        MSPDir: ./fabric-ca-files/org2.example.com/msp
	        AnchorPeers:
	            - Host: peer0.org2.example.com
	              Port: 7051
	Orderer: &OrdererDefaults
	    OrdererType: solo
	    Addresses:
	        - orderer.example.com:7050
	    BatchTimeout: 2s
	    BatchSize:
	        MaxMessageCount: 10
	        AbsoluteMaxBytes: 99 MB
	        PreferredMaxBytes: 512 KB
	    Kafka:
	        Brokers:
	            - 127.0.0.1:9092
	    Organizations:
	Application: &ApplicationDefaults
	    Organizations:

注意`configtx.yaml`中使用的每个组织的msp，不是组件的或者用户的。这个文件备用。

更新orderer.example.com/中的msp：

	rm -rf orderer.example.com/msp/ 
	cp -rf fabric-ca-files/example.com/orderer/msp orderer.example.com/

更新peer0.org1.example.com的msp:

	rm -rf peer0.org1.example.com/msp/
	cp -rf fabric-ca-files/org1.example.com/peer0/msp  peer0.org1.example.com/

更新peer1.org1.example.com的msp:

	rm -rf peer1.org1.example.com/msp/
	cp -rf fabric-ca-files/org1.example.com/peer1/msp  peer1.org1.example.com/

更新peer0.org2.example.com的msp:

	rm -rf peer0.org2.example.com/msp/
	cp -rf fabric-ca-files/org2.example.com/peer0/msp   peer0.org2.example.com/

然后重新部署下面的组件，参考[hyperledger的fabric项目的全手动部署: 开始部署][4]。

	scp -r orderer.example.com/*     root@192.168.88.10:/opt/app/fabric/orderer/
	scp -r peer0.org1.example.com/*  root@192.168.88.10:/opt/app/fabric/peer/
	scp -r peer1.org1.example.com/*  root@192.168.88.11:/opt/app/fabric/peer/
	scp -r peer0.org2.example.com/*  root@192.168.88.12:/opt/app/fabric/peer/

重新部署的时候，注意将之前已经启动的服务停止，并删除安装文件。

重新部署完成后，重新生成./genesisblock文件，并上传到orderer.example.com的安装路径中:

	./bin/configtxgen -profile TwoOrgsOrdererGenesis -outputBlock ./genesisblock

这里没有使用中间CA，生成genesisblock的时候，会提示:

	2018-05-04 16:37:17.788 CST [msp] getPemMaterialFromDir -> WARN 002 Failed reading file /root/fabric-deploy/fabric-ca-files/example.com/msp/intermediatecerts/localhost-7054.pem: no pem content for file /root/fabric-deploy/fabric-ca-files/example.com/msp/intermediatecerts/localhost-7054.pem

将intermediatecerts中的文件删除即可，

	rm fabric-ca-files/example.com/msp/intermediatecerts/localhost-7054.pem
	rm fabric-ca-files/org1.example.com/msp/intermediatecerts/localhost-7054.pem
	rm fabric-ca-files/org2.example.com/msp/intermediatecerts/localhost-7054.pem

如果是通过intermediateCA生成的证书，intermediatecerts中包含中间CA的证书。这里只部署了一个fabric-ca作为rootCA，因此intermediatecerts中是一个空文件。

将生成的genesisblock上传到orderer.example.com：

	scp genesisblock root@192.168.88.10:/opt/app/fabric/orderer/

可以用下面的命令查看创始块的内容:

	./bin/configtxgen  -inspectBlock genesisblock

然后重新启动fabric的所有组件。

## 更新用户的证书以及后续操作

因为我们是在[hyperledger的fabric项目的全手动部署][3]`执行结束后得到的fabric-deploy目录`基础上，进行操作的。

所有还要更新一下该目录下用户目录中的msp：

	$ rm -rf Admin\@org1.example.com/msp
	$ cp -rf fabric-ca-files/org1.example.com/admin/msp Admin\@org1.example.com/
	$ cd Admin\@org1.example.com
	$ ./peer.sh node status
	status:STARTED
	2018-05-04 17:03:06.202 CST [main] main -> INFO 001 Exiting.....

	$ rm -rf Admin\@org2.example.com/msp
	$ cp -rf fabric-ca-files/org2.example.com/admin/msp Admin\@org2.example.com/
	$ cd Admin\@org2.example.com
	$ ./peer.sh node status
	status:STARTED
	2018-05-04 17:08:27.959 CST [main] main -> INFO 001 Exiting.....

重新创建channel，设置anchor peer：

	./bin/configtxgen -profile TwoOrgsChannel -outputCreateChannelTx mychannel.tx -channelID mychannel
	./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate Org1MSPanchors.tx -channelID mychannel -asOrg Org1MSP
	./bin/configtxgen -profile TwoOrgsChannel -outputAnchorPeersUpdate Org2MSPanchors.tx -channelID mychannel -asOrg Org2MSP
	
	cd Admin\@org1.example.com/
	./peer.sh channel create -o orderer.example.com:7050 -c mychannel -f ../mychannel.tx --tls true --cafile tlsca.example.com-cert.pem
	cp mychannel.block ../Admin\@org2.example.com/
	./peer.sh channel join -b mychannel.block
	./peer.sh channel join -b mychannel.block   //将peer.sh中的peer0修改为peer1后在执行一次
	./peer.sh channel update -o orderer.example.com:7050 -c mychannel -f ../Org1MSPanchors.tx --tls true --cafile ./tlsca.example.com-cert.pem
	
	cd ../Admin\@org2.example.com/
	./peer.sh channel join -b mychannel.block
	./peer.sh channel update -o orderer.example.com:7050 -c mychannel -f ../Org2MSPanchors.tx --tls true --cafile ./tlsca.example.com-cert.pem

这些操作的含义见： [hyperledger的fabric项目的全手动部署-创建channel与peer的设置][5]

后续的合约创建、更新、调用等操作这里就不演示了，请直接查看: [hyperledger的fabric项目的全手动部署][3]

![区块链实践分享]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 参考

1. [Welcome to Hyperledger Fabric CA][1]
2. [fabric-ca codes][2]
3. [hyperledger的fabric项目的全手动部署][3]
4. [hyperledger的fabric项目的全手动部署: 开始部署][4]
5. [hyperledger的fabric项目的全手动部署-创建channel与peer的设置][5]
6. [超级账本HyperLedger的fabricCA的用法讲解][6]

[1]: https://hyperledger-fabric-ca.readthedocs.io/en/latest/  "Welcome to Hyperledger Fabric CA" 
[2]: https://github.com/hyperledger/fabric-ca "fabric-ca codes"
[3]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html "hyperledger的fabric项目的全手动部署"
[4]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html#%E5%BC%80%E5%A7%8B%E9%83%A8%E7%BD%B2 "开始部署"
[5]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/26/hyperledger-fabric-deploy.html#%E5%88%9B%E5%BB%BAchannel%E4%B8%8Epeer%E7%9A%84%E8%AE%BE%E7%BD%AE "hyperledger的fabric项目的全手动部署-创建channel与peer的设置"
[6]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/04/27/hyperledger-fabric-ca-usage.html  "超级账本HyperLedger的fabricCA的用法讲解"
