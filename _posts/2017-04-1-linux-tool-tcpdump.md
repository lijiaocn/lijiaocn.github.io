---
layout: default
title: tcpdump使用手册
author: 李佶澳
createdate: 2017/04/01 10:39:05
changedate: 2017/10/28 12:24:51
categories: 技巧
tags: linuxtool
keywords: tcpdump使用，抓包规则
description: 介绍了tcpdump的使用、过滤语法，和一些特别有用的应用方法。

---

* auto-gen TOC:
{:toc}

## 过滤语法

### 主机(IP)过滤

	host   192.168.1.2
	src host  192.168.1.2
	dst host  192.168.1.3

### 端口(PORT)过滤

	port  80
	src port  80
	dst port  89

### 网段(NET)过滤

	net 192.168
	src net 192.168.1
	dst net 10.10

### 协议(PROTO)过滤

	arp
	ip
	tcp
	udp
	icmp

### 逻辑表达式

非:

	!
	not

且:

	&&
	and

或:

	||
	or

规则组合:

	支持用英文括号将规则组合起来
	tcpdump -i eth1 '((tcp) and ((dst net 192.168) and (not dst host 192.168.1.200)))'

## 应用

一些比较有意思的应用。

### 抓取SYN

	tcpdump -i eth1 'tcp[tcpflags] = tcp-syn'

### 抓取SYN&ACK

	tcpdump -i eth1 'tcp[tcpflags] & tcp-syn != 0 and tcp[tcpflags] & tcp-ack != 0'

### 抓取SMTP

	tcpdump -i eth1 '((port 25) and (tcp[(tcp[12]>>2):4] = 0x4d41494c))'

TCP的Payload开始字符为"MAIL"，0x4d41494c是"MAIL"的16进制表示。

"0x4d41494c" -> "MAIL"

### 抓取HTTP GET

	tcpdump -i eth1 'tcp[(tcp[12]>>2):4] = 0x47455420'

"0x47455420" -> "GET" 

### 抓取SSH返回

	tcpdump eth1 'tcp[(tcp[12]>>2):4] = 0x5353482D'"

"0x5353482D" -> "SSH-"

## 参考

1. [tcpdump非常实用的抓包实例][1]
2. [tcpdump link-layer types][2]


[1]: http://blog.csdn.net/nanyun2010/article/details/23445223  "tcpdump非常实用的抓包实例" 
[2]: http://www.tcpdump.org/linktypes.html "tcpdump linktypes"
