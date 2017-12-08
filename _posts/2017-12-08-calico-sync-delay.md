---
layout: default
title: calico node重启时路由同步信息延迟高达4分钟
author: lijiaocn
createdate: 2017/12/08 10:37:35
changedate: 2017/12/08 20:06:05
categories: 问题
tags: calico
keywords: calico,kubernetes,delay
description: kubernetes有100个node，1416个pod，重启node上的calico时，路由同步时间高达4分钟

---

* auto-gen TOC:
{:toc}

## 现象

kubernetes集群规模为100个node，1400多个pod，calico版本为2.0.0。

经常发现pod内部的网关arp记录丢失，导致pod无法连接外网的问题。

重启calico node可以恢复，但是这里有一个新的问题。

在另一个node上，不停的ping目标node的上一个pod的地址：

	$ ping 192.168.108.145
	PING 192.168.108.145 (192.168.108.145) 56(84) bytes of data.
	64 bytes from 192.168.108.145: icmp_seq=229 ttl=63 time=1.04 ms
	64 bytes from 192.168.108.145: icmp_seq=230 ttl=63 time=0.323 ms
	64 bytes from 192.168.108.145: icmp_seq=231 ttl=63 time=0.297 ms
	64 bytes from 192.168.108.145: icmp_seq=232 ttl=63 time=0.228 ms
	64 bytes from 192.168.108.145: icmp_seq=233 ttl=63 time=0.317 ms

然后在目标pod上重启calico-node，calico-node启动完成后，无法ping通目标node上pod。

观察目标node上的route信息:

	$ ip route
	default via 10.39.20.1 dev eth0  proto static  metric 100
	10.39.20.0/24 dev eth0  proto kernel  scope link  src 10.39.20.38  metric 100
	172.17.0.0/16 dev docker0  proto kernel  scope link  src 172.17.0.1
	192.168.108.141 dev cali7c25142c56d  scope link
	192.168.108.145 dev cali1f0f6707af2  scope link
	192.168.108.146 dev calid906b09d36a  scope link
	192.168.108.151 dev cali2b058c51ad8  scope link
	192.168.108.152 dev cali8684fc235be  scope link
	192.168.108.158 dev calibbaedae901a  scope link
	192.168.108.161 dev calif4c983253d9  scope link
	192.168.108.168 dev caliedcaffa4673  scope link
	192.168.108.173 dev califcb50505281  scope link
	192.168.108.186 dev cali170ae1eebfc  scope link

发现目标node需要4分钟以后，才会更新router信息，router信息更新完成后，pod可以ping通。

	$ ip route
	default via 10.39.20.1 dev eth0  proto static  metric 100
	10.39.20.0/24 dev eth0  proto kernel  scope link  src 10.39.20.38  metric 100
	172.17.0.0/16 dev docker0  proto kernel  scope link  src 172.17.0.1
	192.168.2.128/26 via 10.39.1.36 dev tunl0  proto bird onlink
	192.168.6.0/26 via 10.39.20.44 dev tunl0  proto bird onlink
	192.168.9.64/26 via 10.39.1.179 dev tunl0  proto bird onlink
	192.168.9.128/26 via 10.39.1.92 dev tunl0  proto bird onlink
	192.168.10.192/26 via 10.39.1.181 dev tunl0  proto bird onlink
	192.168.12.64/26 via 10.39.1.136 dev tunl0  proto bird onlink
	192.168.13.64/26 via 10.39.1.215 dev tunl0  proto bird onlink
	192.168.17.0/26 via 10.39.20.36 dev tunl0  proto bird onlink
	192.168.17.128/26 via 10.39.1.111 dev tunl0  proto bird onlink
	192.168.19.128/26 via 10.39.20.43 dev tunl0  proto bird onlink
	192.168.20.0/26 via 10.39.1.180 dev tunl0  proto bird onlink
	192.168.20.192/26 via 10.39.1.201 dev tunl0  proto bird onlink
	192.168.21.192/26 via 10.39.1.187 dev tunl0  proto bird onlink
	192.168.22.128/26 via 10.39.1.89 dev tunl0  proto bird onlink
	192.168.23.192/26 via 10.39.1.213 dev tunl0  proto bird onlink
	192.168.24.0/26 via 10.39.1.35 dev tunl0  proto bird onlink
	192.168.26.128/26 via 10.39.1.64 dev tunl0  proto bird onlink
	192.168.28.0/26 via 10.39.1.230 dev tunl0  proto bird onlink
	192.168.29.128/26 via 10.39.1.113 dev tunl0  proto bird onlink
	192.168.38.192/26 via 10.39.1.97 dev tunl0  proto bird onlink
	192.168.39.0/26 via 10.39.1.219 dev tunl0  proto bird onlink
	...
