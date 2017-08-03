---
layout: default
title: linux中dns相关的工具
author: lijiaocn
createdate: 2017/08/02 18:57:12
changedate: 2017/08/02 19:51:17
categories: 技巧
tags: linuxtool dns
keywords: linux,dns,linuxtool
description: linux中dns相关的工具。

---

* auto-gen TOC:
{:toc}

## nslookup 

域名查询：

	nslookup DOMAIN-NAME - [NAMESERVER]

example:

	$nslookup www.baidu.com - 114.114.114.114
	Server:		114.114.114.114
	Address:	114.114.114.114#53
	
	Non-authoritative answer:
	www.baidu.com	canonical name = www.a.shifen.com.
	Name:	www.a.shifen.com
	Address: 61.135.169.121
	Name:	www.a.shifen.com

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

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
