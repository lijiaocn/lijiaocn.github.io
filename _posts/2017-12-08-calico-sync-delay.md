---
layout: default
title: calico node重启时路由同步信息延迟高达4分钟
author: lijiaocn
createdate: 2017/12/08 10:37:35
changedate: 2017/12/08 10:56:24
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

	$ ping 192.168.235.10
	PING 192.168.235.10 (192.168.235.10) 56(84) bytes of data.
	64 bytes from 192.168.235.10: icmp_seq=229 ttl=63 time=1.04 ms
	64 bytes from 192.168.235.10: icmp_seq=230 ttl=63 time=0.323 ms
	64 bytes from 192.168.235.10: icmp_seq=231 ttl=63 time=0.297 ms
	64 bytes from 192.168.235.10: icmp_seq=232 ttl=63 time=0.228 ms
	64 bytes from 192.168.235.10: icmp_seq=233 ttl=63 time=0.317 ms

然后在目标pod上重启calico-node，calico-node启动完成后，无法ping通目标node上pod。

观察目标node上的route信息:

	$ watch ip route

发现目标node需要4分钟以后，才会更新router信息，router信息更新完成后，pod可以ping通。
