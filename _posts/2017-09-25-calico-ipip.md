---
layout: default
title: 使用calico的ipip模式解决k8s的跨网段通信
author: 李佶澳
createdate: 2017/09/25 15:41:31
changedate: 2017/11/29 13:51:13
categories: 项目
tags: kubernetes  calico
keywords: kubernetes,跨网段通信,calico
description: 使用calico的ipip模式解决k8s的跨网段通信

---

## 目录
* auto-gen TOC:
{:toc}

## 现象说明

kubernetes集群使用的网络方案是calico（v2.0.0）`node mesh`的方式。

新增加的node与原先的node不属于同一个网段，发现新的node中pod无法与原先的node中的pod通信。

## 不能通信的原因调查

node`10.39.0.110`上的pod的地址为192.168.70.42，node`10.39.3.75`上的pod的地址为192.168.169.196。

从node10.39.0.110上无法ping通192.168.169.196，查看10.39.0.110上的路由:

	# ip route
	default via 10.39.0.1 dev eth0  proto static  metric 100
	192.168.169.192/26 via 10.39.0.1 dev eth0  proto bird
	...

从路由表中发现到192.168.169.196的路由是通过网关`10.39.0.1`送出。

在本文使用的kubernetes集群中，calico没有网关进行路由交换，网关10.39.0.1并不知道192.168.169.192的存在。

暂时不能操作网关，考虑通过ipip的方式联通不同的网段。

## 开启ipip模式

执行calicoctl get ippool -o json >pool.json，得到json文件。

	[
	  {
	    "kind": "ipPool",
	    "apiVersion": "v1",
	    "metadata": {
	      "cidr": "192.168.0.0/16"
	    },
	    "spec": {
	      "ipip":{
	        "enabled": true
	      },
	      "nat-outgoing": true
	    }
	  }
	]

将ipip设置为enable之后，通过`calicoctl apply -f pool.json`更新ippool。

## 开支ipip模式后的路由变化

node10.39.0.110上的路由表变更为:

	# ip route
	default via 10.39.0.1 dev eth0  proto static  metric 100
	192.168.169.192/26 via 10.39.3.75 dev tunl0  proto bird onlink
	...

发送到192.168.169.196上的报文将直接通过`tunl0`发送到目标pod所在的node上。

node10.39.0.110上的tunl0设备:

	91: tunl0@NONE: <NOARP,UP,LOWER_UP> mtu 1440 qdisc noqueue state UNKNOWN qlen 1
		link/ipip 0.0.0.0 brd 0.0.0.0
		inet 192.168.70.57/32 scope global tunl0
		   valid_lft forever preferred_lft forever

从192.168.70.42 ping 192.168.169.196的时候，在node10.39.0.110上抓取报文可以看到:

	# tcpdump -n -i eth0 host 10.39.3.75
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
	16:41:06.884185 IP 10.39.0.110 > 10.39.3.75: IP 192.168.70.42 > 192.168.169.196: ICMP echo request, id 20142, seq 12, length 64 (ipip-proto-4)
	16:41:07.884165 IP 10.39.0.110 > 10.39.3.75: IP 192.168.70.42 > 192.168.169.196: ICMP echo request, id 20142, seq 13, length 64 (ipip-proto-4)
	16:41:08.884128 IP 10.39.0.110 > 10.39.3.75: IP 192.168.70.42 > 192.168.169.196: ICMP echo request, id 20142, seq 14, length 64 (ipip-proto-4)

## 参考
