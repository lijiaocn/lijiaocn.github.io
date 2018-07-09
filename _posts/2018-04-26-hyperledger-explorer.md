---
layout: default
title:  超级账本HyperLedger：Exploer安装使用
author: 李佶澳
createdate: 2018/04/26 16:33:00
changedate: 2018/07/09 11:15:29
categories: 项目
tags: HyperLedger
keywords: 超级账本,blockchain,hyperledger,explorer,区块链浏览器
description: HyperLedger的区块链浏览器

---

* auto-gen TOC:
{:toc}

## 说明

[超级账本HyperLedger视频教程演示汇总：HyperLedger Fabric的视频讲解--“主页”中可领优惠券](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)

[HyperLedger Explorer][1]是HyplerLedger的子项目，是一个区块链浏览器。

## 安装

安装依赖:

	yum install -y epel-release npm postgresql postgresql-server gcc-c++

nodejs版本需要高于7.6，如果不是重新安装：

	yum erase nodejs
	wget https://nodejs.org/dist/v8.11.3/node-v8.11.3-linux-x64.tar.xz
	tar -xvf node-v8.11.3-linux-x64.tar.xz
	cd node-v8.11.3-linux-x64
	cp -rf * /usr/

启动postgre:

	postgresql-setup initdb
	chown -R postgres:postgres /var/run/postgresql/
	systemctl start postgresql

获取代码:

	git clone https://github.com/hyperledger/blockchain-explorer.git
	cp app/persistance/postgreSQL/db/updatepg.sql /tmp/
	cp app/persistance/postgreSQL/db/explorerpg.sql /tmp/

>在不同版本的代码中,"sql"文件可能位于不同地方。

设置数据库：

	sudo -u postgres psql
	postgres=# \i /tmp/explorerpg.sql
	fabricexplorer=# \i /tmp/updatepg.sql

查看创建的表：

	fabricexplorer=# \l
	                                  List of databases
	      Name      |  Owner   | Encoding  |   Collate   | Ctype |   Access privileges
	----------------+----------+-----------+-------------+-------+-----------------------
	 fabricexplorer | hppoc    | SQL_ASCII | en_US.UTF-8 | C     |
	 postgres       | postgres | SQL_ASCII | en_US.UTF-8 | C     |
	 template0      | postgres | SQL_ASCII | en_US.UTF-8 | C     | =c/postgres          +
	                |          |           |             |       | postgres=CTc/postgres
	 template1      | postgres | SQL_ASCII | en_US.UTF-8 | C     | =c/postgres          +
	                |          |           |             |       | postgres=CTc/postgres
	(4 rows)
	
	fabricexplorer=# \d
	                   List of relations
	 Schema |           Name            |   Type   | Owner
	--------+---------------------------+----------+-------
	 public | blocks                    | table    | hppoc
	 public | blocks_id_seq             | sequence | hppoc
	 public | chaincodes                | table    | hppoc
	 public | chaincodes_id_seq         | sequence | hppoc
	 public | channel                   | table    | hppoc
	 public | channel_id_seq            | sequence | hppoc
	 public | peer                      | table    | hppoc
	 public | peer_id_seq               | sequence | hppoc
	 public | peer_ref_channel          | table    | hppoc
	 public | peer_ref_channel_id_seq   | sequence | hppoc
	 public | transaction               | table    | hppoc
	 public | transaction_id_seq        | sequence | hppoc
	 public | write_lock                | table    | hppoc
	 public | write_lock_write_lock_seq | sequence | hppoc

尝试登陆：

	 psql postgres://hppoc:password@127.0.0.1:5432/fabricexplorer

如果登陆失败，修改`/var/lib/pgsql/data/pg_hba.conf`:

	将：
	
	host    all             all             127.0.0.1/32            ident
	
	修改为：
	
	host    all             all             127.0.0.1/32            trust

修改之后重启postgresql：

	systemctl restart postgresql

根据自己的情况，修改配置文件`app/platform/fabric/config.json`:

	{
	    "network-config": {
	        "org1": {
	            "name": "platform",
	            "mspid": "platform",
	            "peer1": {
	                "requests": "grpcs://peer0.platform.ennblock.cn:7051",
	                "events": "grpcs://peer0.platform.ennblock.cn:7053",
	                "server-hostname": "peer0.platform.ennblock.cn",
	                "tls_cacerts": "/opt/app/fabric/cli/user/platform.ennblock.cn/Admin-peer0.platform.ennblock.cn/tls/ca.crt"
	            },
	            "admin": {
	                "key": "/opt/app/fabric/cli/user/platform.ennblock.cn/Admin-peer0.platform.ennblock.cn/msp/keystore",
	                "cert": "/opt/app/fabric/cli/user/platform.ennblock.cn/Admin-peer0.platform.ennblock.cn/msp/signcerts"
	            }
	        }
	    },
	    "host": "localhost",
	    "port": "8080",
	    "channel": "mychannel",
	    "keyValueStore": "/tmp/fabric-client-kvs",
	    "eventWaitTime": "30000",
	    "pg": {
	        "host": "127.0.0.1",
	        "port": "5432",
	        "database": "fabricexplorer",
	        "username": "hppoc",
	        "passwd": "password"
	    },
	    "license": "Apache-2.0"
	}

和配置文件`appconfig.json`，注意配置文件格式可能因为版本不同而不同:

	{
	    "host": "0.0.0.0",
	    "port": "80",
	    "channel": "mychannel",
	    "keyValueStore": "/tmp/fabric-client-kvs",
	    "eventWaitTime": "30000",
	    "pg": {
	        "host": "127.0.0.1",
	        "port": "5432",
	        "database": "fabricexplorer",
	        "username": "hppoc",
	        "passwd": "password"
	    },
	    "license": "Apache-2.0"
	}

安装、启动：

	npm config set registry https://registry.npm.taobao.org
	npm install
	
	//还需要到client目录中编译，否则页面看不到内容
	cd client
	npm install 
	npm run build

如果遇到：

	npm: relocation error: npm: symbol SSL_set_cert_cb, version libssl.so.10 not defined in file libssl.so.10 with link time reference

更新openssl:

	yum update openssl -y

## 问题汇总

### 页面空白没有任何内容

如果在浏览器里打开后页面空白，没有任何内容，很可能是没有到client目录中进行安装编译：

	//还需要到client目录中编译，否则页面看不到内容
	cd client
	npm install 
	npm run build

注意需要`npm run build`，

### openssl需要更新

如果遇到下面的问题：

	npm: relocation error: npm: symbol SSL_set_cert_cb, version libssl.so.10 not defined in file libssl.so.10 with link time reference

升级openssl:

	yum update openssl -y

启动explorer：

	npm build
	node ./main.js

### Error: No identity has been assigned to this client

如果遇到下面的错误：

	postgres://hppoc:password@127.0.0.1:5432/fabricexplorer
	Please open web browser to access ：http://0.0.0.0:8080/
	[2018-04-26 19:26:42.977] [ERROR] Query - Error: No identity has been assigned to this client
		at Client._getSigningIdentity (/root/blockchain-explorer/node_modules/fabric-client/lib/Client.js:1206:11)
		at Channel.queryInfo (/root/blockchain-explorer/node_modules/fabric-client/lib/Channel.js:896:36)
		at helper.getOrgAdmin.then (/root/blockchain-explorer/app/query.js:98:18)
	[2018-04-26 19:26:42.979] [ERROR] blockscanner - TypeError: Cannot read property 'low' of undefined
		at getChainInfo.then.response (/root/blockchain-explorer/app/query.js:213:23)

原因是config.json的中组织不是以`org`开头的。。。。这个还真是有点坑。。

### SyntaxError: Unexpected token function

	opt/app/blockchain-explorer/main.js:46
	async function startExplorer() {
	      ^^^^^^^^
	
	SyntaxError: Unexpected token function
	    at createScript (vm.js:56:10)
	    at Object.runInThisContext (vm.js:97:10)
	    at Module._compile (module.js:549:28)
	    at Object.Module._extensions..js (module.js:586:10)
	    at Module.load (module.js:494:32)
	    at tryModuleLoad (module.js:453:12)
	    at Function.Module._load (module.js:445:3)
	    at Module.runMain (module.js:611:10)
	    at run (bootstrap_node.js:394:7)
	    at startup (bootstrap_node.js:160:9)

node的版本太老的缘故:

[Async functions are not supported by Node versions older than version 7.6][5]

## 接下来...

[更多关于超级账本和区块链的文章](http://www.lijiaocn.com/tags/blockchain.html)

![区块链实践分享]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 参考

1. [HyperLedger Explorer][1]
2. [blockchain explorer][2]
3. [npm install命令遇到relocation error: npm: symbol SSL_set_cert_cb的报错问题][3]
4. [Hyperledger Explorer is empty with Query - Error: No identity has been assigned to this client][4]
5. [Async functions are not supported by Node versions older than version 7.6][5]

[1]: https://www.hyperledger.org/projects/explorer "HyperLedger Explorer" 
[2]: https://github.com/hyperledger/blockchain-explorer  "blockchain explorer"
[3]: https://www.cnblogs.com/hsia2017/p/8387604.html "npm install命令遇到relocation error: npm: symbol SSL_set_cert_cb的报错问题"
[4]: https://stackoverflow.com/questions/49853848/hyperledger-explorer-is-empty-with-query-error-no-identity-has-been-assigned?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa  "Hyperledger Explorer is empty with Query - Error: No identity has been assigned to this client"
[5]: https://stackoverflow.com/questions/37815790/syntaxerror-unexpected-token-function-async-await-nodejs "Async functions are not supported by Node versions older than version 7.6."
