---
layout: default
title: linux中dns相关的工具
author: lijiaocn
createdate: 2017/08/02 18:57:12
changedate: 2017/11/29 18:50:58
categories: 技巧
tags: linuxtool
keywords: linux,dns,linuxtool
description: linux中dns相关的工具。

---

* auto-gen TOC:
{:toc}

## nslookup 

手册`man nslookup`：

	nslookup [-option] [name | -] [server]

### 非交互式查询

查询类型为srv，dns服务器为10.0.0.10，要查询的域名是etcd.lijiaob.svc.cluster.local。

	$ nslookup -query=srv etcd.lijiaob.svc.cluster.local 10.0.0.10
	Server:		10.0.0.10
	Address:	10.0.0.10#53
	
	etcd.lijiaob.svc.cluster.local	service = 10 33 0 etcd-2.etcd.lijiaob.svc.cluster.local.
	etcd.lijiaob.svc.cluster.local	service = 10 33 0 etcd-0.etcd.lijiaob.svc.cluster.local.
	etcd.lijiaob.svc.cluster.local	service = 10 33 0 etcd-1.etcd.lijiaob.svc.cluster.local.

### 交互式查询

也可以使用交互式查询，

	sh-4.2# nslookup 
	> server 10.0.0.10                  <--设置默认的dns服务器
	Default server: 10.0.0.10
	Address: 10.0.0.10#53
	> set q=srv                         <-- 设置查询的类型
	> etcd.lijiaob.svc.cluster.local    <-- 设置查询的名称
	Server:		10.0.0.10
	Address:	10.0.0.10#53

	etcd.lijiaob.svc.cluster.local	service = 10 33 0 etcd-2.etcd.lijiaob.svc.cluster.local.
	etcd.lijiaob.svc.cluster.local	service = 10 33 0 etcd-0.etcd.lijiaob.svc.cluster.local.
	etcd.lijiaob.svc.cluster.local	service = 10 33 0 etcd-1.etcd.lijiaob.svc.cluster.local.

交互式模式下，支持很多命令，可以在`man nslookup`手册中查看：

	host [server]
	          Look up information for host using the current default server or using server, if specified. If host is an Internet address and the query type is A or PTR, the name of the host is
	          returned. If host is a name and does not have a trailing period, the search list is used to qualify the name.
	          To look up a host not in the current domain, append a period to the name.
	
	server domain
	lserver domain
	    Change the default server to domain; lserver uses the initial server to look up information about domain, while server uses the current default server. If an authoritative answer can't be
	    found, the names of servers that might have the answer are returned.
	
	root
	    not implemented
	
	finger
	    not implemented
	...


## dig

域名查询:

	dig @NAMESERVER DOMAIN-NAME

example:

	$dig @114.114.114.114 www.baidu.com
	
	; <<>> DiG 9.8.3-P1 <<>> @114.114.114.114 www.baidu.com
	; (1 server found)
	;; global options: +cmd
	;; Got answer:
	;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 6758
	;; flags: qr rd ra; QUERY: 1, ANSWER: 3, AUTHORITY: 0, ADDITIONAL: 0
	
	;; QUESTION SECTION:
	;www.baidu.com.			IN	A
	
	;; ANSWER SECTION:
	www.baidu.com.		463	IN	CNAME	www.a.shifen.com.
	www.a.shifen.com.	141	IN	A	61.135.169.125
	www.a.shifen.com.	141	IN	A	61.135.169.121
	
	;; Query time: 18 msec
	;; SERVER: 114.114.114.114#53(114.114.114.114)
	;; WHEN: Wed Aug  2 18:59:47 2017
	;; MSG SIZE  rcvd: 90
