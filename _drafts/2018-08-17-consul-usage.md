---
layout: default
title:  服务发现工具consul的使用
author: 李佶澳
createdate: 2018/08/17 11:54:00
changedate: 2018/08/20 14:42:24
categories: 项目
tags: consul
keywords: consul,服务发现,service mesh
description: consul是近几年比较流行的服务发现工具

---

* auto-gen TOC:
{:toc}

## 说明

文献是这样引用的: [文献1][1]、[文献2][2]。

## 快速体验

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

注册服务，注意，注册的时候使用的api是`agent/service`：

	# curl --request PUT --data @server.json  http://127.0.0.1:8500/v1/agent/service/register
	# cat server.json
	{
	  "Name": "user1.server.10.10.199.154",
	  "Tags": [
	    "primary",
	    "v1"
	  ],
	  "Address": "10.10.199.154",
	  "Port": 8000,
	  "Meta": {
	    "version": "4.0"
	  },
	  "EnableTagOverride": false
	}

查询服务：

	$ ./consul catalog services
	consul
	user1.server.10.10.199.154
	web
	
	$ curl http://10.10.199.154:8500/v1/catalog/service/user1.server.10.10.199.154
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
	...

删除服务：

	curl --request PUT  http://127.0.0.1:8500/v1/agent/service/deregister/user1.server.10.10.199.154

## 参考

1. [Consul][1]
2. [Consul download][2]

[1]: https://www.consul.io/intro/getting-started/install.html  "Consul" 
[2]: https://www.consul.io/downloads.html  "consul download" 
