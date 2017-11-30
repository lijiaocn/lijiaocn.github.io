---
layout: default
title: kubernetes的dnsmasq缓存查询结果，导致pod偶尔无法访问域名
author: lijiaocn
createdate: 2017/08/03 14:22:43
changedate: 2017/11/30 09:49:02
categories: 问题
tags: kubernetes
keywords: dnsmasq,kube-dns,k8s
description: 在kubernete的pod中，访问域名`repo1.maven.org`的时候，发现无法访问。

---

* auto-gen TOC:
{:toc}

## 现象

在kubernete的pod中，访问域名`repo1.maven.org`的时候，发现无法访问：

	$ping repo1.maven.org
	 ... Bad address ...

pod的使用的域名服务器是kubernetes中部署的kube-dns。

	$cat /etc/resolv.conf
	search admin.svc.cluster.local svc.cluster.local cluster.local
	nameserver 10.0.0.10
	options ndots:5

重启kube-dns的pod后，问题消失，但是经过不确定的时间后，问题又出现。

## 开启dnsmasq的日志

kube-dns中直接对外提供服务的是运行dnsmasq的容器，在kube-dns.yaml中可以看到:

	- args:
	        - --cache-size=1000
	        - --no-resolv
	        - --server=/cluster.local/127.0.0.1#10053
	        - --server=10.36.8.40
	        - --server=10.36.8.41
	        image: XXXXX/kube-dnsmasq-amd64:1.3

要打开日志功能，需要将其修改为:

	- args:
	        - -q
	        - --cache-size=1000
	        - --no-resolv
	        - --log-facility=/dev/stdout
	        - --server=/cluster.local/127.0.0.1#10053
	        - --server=10.36.8.40
	        - --server=10.36.8.41
	        image: XXXXX/kube-dnsmasq-amd64:1.3

参数`-q`表示记录查询日志，`--log-facility`指定日志文件。

## 分析日志

### 第一次域名解析，以及成功的时候

	Aug  3 02:11:35 dnsmasq[1]: query[A] repo1.maven.org from 192.168.91.1\n","stream":"stdout","time":"2017-08-03T02:11:35.696997573Z
	Aug  3 02:11:35 dnsmasq[1]: forwarded repo1.maven.org to 10.36.8.41\n","stream":"stdout","time":"2017-08-03T02:11:35.697008546Z
	Aug  3 02:11:35 dnsmasq[1]: query[A] repo1.maven.org from 192.168.91.1\n","stream":"stdout","time":"2017-08-03T02:11:35.697011973Z
	Aug  3 02:11:35 dnsmasq[1]: forwarded repo1.maven.org to 10.36.8.41\n","stream":"stdout","time":"2017-08-03T02:11:35.697181313Z
	...
	Aug  3 02:11:35 dnsmasq[1]: reply repo1.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:11:35.822215656Z
	Aug  3 02:11:35 dnsmasq[1]: reply central.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:11:35.822232258Z
	Aug  3 02:11:35 dnsmasq[1]: reply sonatype.map.fastly.net is 151.101.40.209\n","stream":"stdout","time":"2017-08-03T02:11:35.822236436Z
	Aug  3 02:11:35 dnsmasq[1]: reply repo1.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:11:35.822239784Z
	Aug  3 02:11:35 dnsmasq[1]: reply central.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:11:35.822243195Z
	Aug  3 02:11:35 dnsmasq[1]: reply sonatype.map.fastly.net is 151.101.40.209\n","stream":"stdout","time":"2017-08-03T02:11:35.822246586Z
	...
	Aug  3 02:11:36 dnsmasq[1]: query[A] repo1.maven.org from 192.168.91.1\n","stream":"stdout","time":"2017-08-03T02:11:36.031788497Z
	Aug  3 02:11:36 dnsmasq[1]: cached repo1.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:11:36.031803088Z
	Aug  3 02:11:36 dnsmasq[1]: cached central.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:11:36.031807428Z
	Aug  3 02:11:36 dnsmasq[1]: cached sonatype.map.fastly.net is 151.101.40.209\n","stream":"stdout","time":"2017-08-03T02:11:36.031811367Z

可以看到，dnsmasq将repo1.maven.org转发到上游的DNS Server，并且最终得到上游DNS Server的返回的IP。

dnsmasq缓存了上游DNS Server返回的结果，在后续的查询请求中，直接返回cache的结果。

### 解析失败的时候

	Aug  3 02:27:15 dnsmasq[1]: query[A] repo1.maven.org from 192.168.91.1\n","stream":"stdout","time":"2017-08-03T02:27:15.462049449Z
	Aug  3 02:27:15 dnsmasq[1]: forwarded repo1.maven.org to 10.36.8.40\n","stream":"stdout","time":"2017-08-03T02:27:15.462052408Z
	Aug  3 02:27:15 dnsmasq[1]: forwarded repo1.maven.org to 10.36.8.41\n","stream":"stdout","time":"2017-08-03T02:27:15.462058375Z
	...
	Aug  3 02:27:17 dnsmasq[1]: reply repo1.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:27:17.92674093Z
	Aug  3 02:27:17 dnsmasq[1]: reply central.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:27:17.926778956Z
	Aug  3 02:27:17 dnsmasq[1]: reply sonatype.map.fastly.net is NODATA-IPv4\n","stream":"stdout","time":"2017-08-03T02:27:17.926783393Z
	Aug  3 02:27:17 dnsmasq[1]: reply repo1.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:27:17.926786834Z
	...
	Aug  3 02:27:19 dnsmasq[1]: query[A] repo1.maven.org from 192.168.91.1\n","stream":"stdout","time":"2017-08-03T02:27:19.659929868Z
	Aug  3 02:27:19 dnsmasq[1]: cached repo1.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:27:19.659945829Z
	Aug  3 02:27:19 dnsmasq[1]: cached central.maven.org is \u003cCNAME\u003e\n","stream":"stdout","time":"2017-08-03T02:27:19.659950352Z
	Aug  3 02:27:19 dnsmasq[1]: cached sonatype.map.fastly.net is NODATA-IPv4\n","stream":"stdout","time":"2017-08-03T02:27:19.659954325Z

域名被转发到上游的DNS Server，但是上游的DNS Server返回的是[NODATA-IPv4][1]。

dnsmasq缓存了这个结果，在后续的查询中，也返回[NODATA-IPv4][1]。

### 分析域名repo1.maven.org

得到域名`repo1.maven.org`的IP地址，需要经过下面的过程:

	Query:        repo1.maven.org
	Query cname:  central.maven.org
	Query cname:  sonatype.map.fastly.net
	GET IP:       151.101.40.209

用dig不停地查询域名`sonatype.map.fastly.net`，发现这个域名的查询结果有以下几种:

查询到了A记录:

	$ dig @10.36.8.40 sonatype.map.fastly.net
	
	; <<>> DiG 9.8.3-P1 <<>> sonatype.map.fastly.net
	;; global options: +cmd
	;; Got answer:
	;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 22582
	;; flags: qr rd ra; QUERY: 1, ANSWER: 1, AUTHORITY: 0, ADDITIONAL: 0
	
	;; QUESTION SECTION:
	;sonatype.map.fastly.net.	IN	A
	
	;; ANSWER SECTION:
	sonatype.map.fastly.net. 26	IN	A	151.101.24.209
	
	;; Query time: 3699 msec
	;; SERVER: 10.36.8.41#53(10.36.8.41)
	;; WHEN: Thu Aug  3 14:53:33 2017
	;; MSG SIZE  rcvd: 57

没有查询到：

	dig @10.36.8.40  sonatype.map.fastly.net
	
	; <<>> DiG 9.8.3-P1 <<>> @10.36.8.40 sonatype.map.fastly.net
	; (1 server found)
	;; global options: +cmd
	;; Got answer:
	;; ->>HEADER<<- opcode: QUERY, status: SERVFAIL, id: 44393
	;; flags: qr rd ra; QUERY: 1, ANSWER: 0, AUTHORITY: 0, ADDITIONAL: 0
	
	;; QUESTION SECTION:
	;sonatype.map.fastly.net.	IN	A
	
	;; Query time: 2553 msec
	;; SERVER: 10.36.8.40#53(10.36.8.40)
	;; WHEN: Thu Aug  3 14:57:53 2017
	;; MSG SIZE  rcvd: 41

由此可知，上游的DNS Server不能稳定的响应对该域名的查询。

## 解决方法

根本原因在于上游的DNS Server，当上游DNS Server没有返回正确的结果时，dnsmasq将查询失败的结果缓存，导致dnsmasq的用户长时间得不到正确的查询结果。

好在dnsmasq还有这样一个配置项:

	-N, --no-negcache                       Do NOT cache failed search results.

编辑kube-dns，将其开启:

	- args:
	        - -N
	        - -q
	        - --cache-size=1000
	        - --no-resolv
	        - --log-facility=/dev/stdout
	        - --server=/cluster.local/127.0.0.1#10053
	        - --server=10.36.8.40
	        - --server=10.36.8.41
	        image: XXXXX/kube-dnsmasq-amd64:1.3

## 参考

1. [NODATA-IPv4][1]

[1]: http://lists.thekelleys.org.uk/pipermail/dnsmasq-discuss/2005q2/000282.html "NODATA-IPv4" 
