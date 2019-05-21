---
layout: default
title:  服务治理工具consul的功能介绍与使用入门
author: 李佶澳
createdate: 2018/08/17 11:54:00
changedate: 2018/09/06 13:56:00
categories: 项目
tags: consul
keywords: consul,服务发现,service mesh
description: consul是近几年比较流行的服务治理工具，可以用来进行服务发现、服务隔离、服务配置。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

consul是近几年比较流行的服务发现工具，工作中用到，简单了解一下。

consul的三个主要应用场景：[服务发现][5]、[服务隔离][6]、[服务配置][7]。

[服务发现][5]场景中，consul作为注册中心，服务地址被注册到consul中以后，可以使用consul提供的dns、http接口查询，consul支持health check。

[服务隔离][6]场景中，consul支持以服务为单位设置访问策略，能同时支持经典的平台和新兴的平台，支持tls证书分发，service-to-service加密。

[服务配置][7]场景中，consul提供key-value数据存储功能，并且能将变动迅速地通知出去，通过工具`consul-template`可以更方便地实时渲染配置文件。

可以通过[Introduction to Consul][8]了解consul的一些技术细节:

	每个被注册到consul中的node上，都部署一个consul agent，这个agent负责对本地的服务进行监控检查，以及将查询请求转发给consul server。
	consul server负责存放、备份数据(使用raft协议保证一致性)，通常要有多台形成集群，选举出一个leader。
	查询服务地址的时候，可以直接向consul server发起查询，也可以通过consul agent查询，后者将转发给consul server。
	如果是多数据中心，每个数据中心部署一组consul server。跨数据中心查询通过本数据中心的consul server进行。
	注意：多数据中心的时候，不同数据中心的consul server之间不会同步key-value数据。

![consul arch](https://www.consul.io/assets/images/consul-arch-420ce04a.png)

注意上图中有两种类型的gossip，一类是同一个数据中心内部的client之间进行gossip通信，一类是不同数据中心的server之间进行gossip通信。

另外[Consul vs. Other Software][9]中将consul与zookeeper、serf、eureka、istio等做了对比，读完之后可以知道这些系统之间的差异，推荐阅读。

## 部署启动

下载consul文件，[consul download][2]：

	wget https://releases.hashicorp.com/consul/1.2.2/consul_1.2.2_linux_amd64.zip
	unzip consul_1.2.2_linux_amd64.zip

解压后就是一个`consul`文件。

启动第一个consul server，注意`-bootstrap`：

	# cat start.sh
	#!/bin/bash
	nohup ./consul agent  -bootstrap -bind=10.10.199.154 -server -data-dir=./data/ 2>&1 1>consul.log  &

启动后，可以直接通过网址`http://127.0.0.1:8500/ui`打开consul的网页。

查看组成consul服务的node：

	$ ./consul catalog nodes
	Node           ID        Address        DC
	10-10-199-154  3f33abc5  10.10.199.154  dc1
	
	$ curl 127.0.0.1:8500/v1/catalog/nodes 2>/dev/null |python -m json.tool
	[
	    {
	        "Address": "10.10.199.154",
	        "CreateIndex": 5,
	        "Datacenter": "dc1",
	        "ID": "3f33abc5-a8b1-8dfc-d553-051ea2be6750",
	        "Meta": {
	            "consul-network-segment": ""
	        },
	        "ModifyIndex": 6,
	        "Node": "10-10-199-154",
	        "TaggedAddresses": {
	            "lan": "10.10.199.154",
	            "wan": "10.10.199.154"
	        }
	    }
	]

还可以通过dns查询成员node的地址，默认后缀为node.consul：

	$ dig @127.0.0.1 -p 8600 10-10-199-154.node.consul
	
	; <<>> DiG 9.9.4-RedHat-9.9.4-61.el7 <<>> @127.0.0.1 -p 8600 10-10-199-154.node.consul
	; (1 server found)
	;; global options: +cmd
	;; Got answer:
	;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 35964
	;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 2
	;; WARNING: recursion requested but not available
	
	;; OPT PSEUDOSECTION:
	; EDNS: version: 0, flags:; udp: 4096
	;; QUESTION SECTION:
	;10-10-199-154.node.consul.	IN	A
	
	;; ANSWER SECTION:
	10-10-199-154.node.consul. 0	IN	A	10.10.199.154
	
	;; ADDITIONAL SECTION:
	10-10-199-154.node.consul. 0	IN	TXT	"consul-network-segment="
	
	;; Query time: 0 msec
	;; SERVER: 127.0.0.1#8600(127.0.0.1)
	;; WHEN: Tue Aug 21 17:55:03 CST 2018
	;; MSG SIZE  rcvd: 106

## 服务操作

服务是consul管理的基本单元之一。

### 注册服务

要注册的服务可以直接做成本地配置文件：

	sudo mkdir /etc/consul.d
	echo '{"service": {"name": "web", "tags": ["rails"], "port": 80}}'  | sudo tee /etc/consul.d/web.json

或者通过api注册，注意api是`agent/service`：

	$ cat web2.json
	{
	    "Name": "web2",
	    "Tags": [
	        "rails"
	    ],
	    "Address": "",
	    "Port": 81,
	    "ServiceEnableTagOverride": false
	}
	$ curl --request PUT --data @web2.json  http://127.0.0.1:8500/v1/agent/service/register

### 查询服务地址

命令行查看所有服务：

	$ ./consul catalog services
	consul
	web
	web1
	
dns查询指定服务地址，默认后缀为`service.consul`，注意查询类型要指定为为srv，才能看到服务端口：

	$ dig @127.0.0.1 -p 8600 web.service.consul srv
	
	; <<>> DiG 9.9.4-RedHat-9.9.4-61.el7 <<>> @127.0.0.1 -p 8600 web.service.consul srv
	; (1 server found)
	;; global options: +cmd
	;; Got answer:
	;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 28545
	;; flags: qr aa rd; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 3
	;; WARNING: recursion requested but not available
	
	;; OPT PSEUDOSECTION:
	; EDNS: version: 0, flags:; udp: 4096
	;; QUESTION SECTION:
	;web.service.consul.		IN	SRV
	
	;; ANSWER SECTION:
	web.service.consul.	0	IN	SRV	1 1 80 10-10-199-154.node.dc1.consul.
	
	;; ADDITIONAL SECTION:
	10-10-199-154.node.dc1.consul. 0 IN	A	10.10.199.154
	10-10-199-154.node.dc1.consul. 0 IN	TXT	"consul-network-segment="
	
	;; Query time: 0 msec
	;; SERVER: 127.0.0.1#8600(127.0.0.1)
	;; WHEN: Tue Aug 21 18:54:22 CST 2018
	;; MSG SIZE  rcvd: 148

http api查询：

	$ curl http://10.10.199.154:8500/v1/catalog/service/web |python -m json.tool
	[
	    {
	        "ID": "3f33abc5-a8b1-8dfc-d553-051ea2be6750",
	        "Node": "10-10-199-154",
	        "Address": "10.10.199.154",
	        "Datacenter": "dc1",
	        "TaggedAddresses": {
	            "lan": "10.10.199.154",
	            "wan": "10.10.199.154"
	        },
	        "NodeMeta": {
	            "consul-network-segment": ""
	        },
	        "ServiceKind": "",
	        "ServiceID": "web",
	        "ServiceName": "web",
	        "ServiceTags": [
	            "rails"
	        ],
	        "ServiceAddress": "",
	        "ServiceMeta": {},
	        "ServicePort": 80,
	        "ServiceEnableTagOverride": false,
	        "ServiceProxyDestination": "",
	        "ServiceConnect": {
	            "Native": false,
	            "Proxy": null
	        },
	        "CreateIndex": 10,
	        "ModifyIndex": 10
	    }
	]

查看agent上的所有服务：

	curl http://10.10.199.154:8500/v1/agent/services 2>/dev/null |python -m json.tool

### 删除服务

	curl --request PUT  http://127.0.0.1:8500/v1/agent/service/deregister/web1

## Connect配置

Connect是consul的重要特性，简单说就是，consul可以为服务配置访问代理，并且负责中间的认证和加密。

[Consul Connect][10]中有详细说明，这里使用的也是其中的例子。

在本地启动一个echo服务：

	$ yum install -y socat
	$ socat -v tcp-l:8181,fork exec:"/bin/cat"

注册到consul中，注意connect字段不为空，表示consul需要为socat服务准备代理:

	$ cat <<EOF | sudo tee /etc/consul.d/socat.json
	{
	  "service": {
	    "name": "socat",
	    "port": 8181,
	    "connect": { "proxy": {} }
	  }
	}
	EOF

重启consul，或者给consul发送SIGHUB信号，重新加载配置。

用下面的命令，手动在本地启动一个proxy：

	./consul connect proxy -service web -upstream socat:9191

然后就可以通过9191端口访问8181端口的服务：

	$ nc 127.0.0.1 9191
	helo

操作到这里的时候报错，通过9191无法联通，consul日志显示：

	2018/08/21 19:31:44 [WARN] agent: Check "service:socat-proxy" socket connection failed: dial tcp 10.10.199.154:20233: connect: connection refused

## Key操作

更详细的文档位于：[Consul Key 操作][3]。

需要注意的是consul支持多数据中心，key-value存储不在多个数据中心之间同步。见：[What data is replicated between Consul datacenters? ][4]

写入一个名为"k1"的key，value为"hello":

	curl -X PUT --data "hello" 127.0.0.1:8500/v1/kv/k1

读取k1:

	$ curl 127.0.0.1:8500/v1/kv/k1
	[
	    {
	        "LockIndex": 0,
	        "Key": "k1",
	        "Flags": 0,
	        "Value": "aGVsbG8=",      //base64编码
	        "CreateIndex": 20077,
	        "ModifyIndex": 20077
	    }
	]

key的读取接口支持6个参数：

	key (string: "")         - Specifies the path of the key to read.
	dc (string: "")          - Specifies the datacenter to query. 
	                           This will default to the datacenter of the agent being queried. 
	                           This is specified as part of the URL as a query parameter.
	recurse (bool: false)    - Specifies if the lookup should be recursive and key treated as a prefix instead of a literal match. 
	                           This is specified as part of the URL as a query parameter.
	raw (bool: false)        - Specifies the response is just the raw value of the key, without any encoding or metadata. 
	                           This is specified as part of the URL as a query parameter.
	keys (bool: false)       - Specifies to return only keys (no values or metadata). Specifying this implies recurse. 
	                           This is specified as part of the URL as a query parameter.
	separator (string: '/')  - Specifies the character to use as a separator for recursive lookups. 
	                           This is specified as part of the URL as a query parameter.

例如查看指定路径下的所有key：

	$ curl 127.0.0.1:8500/v1/kv/k1?keys
	[
	    "k1",
	    "k1/k11"
	]

删除key:

	curl -X DELETE 127.0.0.1:8500/v1/kv/k1

## consul-template

[consul-template][11]是一个根据consul中的数据自动渲染配置文件的工具，和[confd][13]很类似，虽然consul-template自称：

	Q: How is this different than confd?
	A: The answer is simple: Service Discovery as a first class citizen. You are
	also encouraged to read this Pull Request on the project for more background
	information. We think confd is a great project, but Consul Template fills a 
	missing gap. Additionally, Consul Template has first class integration with 
	Vault, making it easy to incorporate secret material like database credentials
	or API tokens into configuration files.

不过我感觉没有什么太大的区别，confd支持的后端还更丰富：

	etcd
	consul
	vault
	environment variables
	file
	redis
	zookeeper
	dynamodb
	rancher
	ssm (AWS Simple Systems Manager Parameter Store)

这里简单了解一下consul-template，没准以后会用到。

在[consul tools download][12]页面中可以找到下载地址：

	wget https://releases.hashicorp.com/consul-template/0.19.5/consul-template_0.19.5_linux_amd64.tgz
	tar -xvf consul-template_0.19.5_linux_amd64.tgz

解压后得到一个二进制文件`consul-template`。

## 参考

1. [Consul][1]
2. [Consul download][2]
3. [Consul kv 操作][3]
4. [What data is replicated between Consul datacenters? ][4]
5. [consul usage: service discovery][5]
6. [consul usage: service segmentation][6]
7. [consul usage: service configuration][7]
8. [Introduction to Consul][8]
9. [Consul vs. Other Software ][9]
10. [Consul Connect][10]
11. [consul-template][11]
12. [consul tools download][12]
13. [confd][13]

[1]: https://www.consul.io/intro/getting-started/install.html  "Consul" 
[2]: https://www.consul.io/downloads.html "consul download" 
[3]: https://www.consul.io/api/kv.html "consul kv store"
[4]: https://www.consul.io/docs/faq.html#q-what-data-is-replicated-between-consul-datacenters- "What data is replicated between Consul datacenters? "
[5]: https://www.consul.io/discovery.html "consul usage: service discovery"
[6]: https://www.consul.io/segmentation.html "consul usage: service segmentation"
[7]: https://www.consul.io/configuration.html "consul usage: service configuration"
[8]: https://www.consul.io/intro/index.html "Introduction to Consul"
[9]: https://www.consul.io/intro/vs/index.html "Consul vs. Other Software "
[10]: https://www.consul.io/intro/getting-started/connect.html "Consul Connect"
[11]: https://github.com/hashicorp/consul-template "consul-template"
[12]: https://www.consul.io/downloads_tools.html "consul tools download"
[13]: https://github.com/kelseyhightower/confd/blob/master/docs/quick-start-guide.md "confd"
