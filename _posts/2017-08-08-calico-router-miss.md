---
layout: default
title: calico路由丢失问题的调查
author: 李佶澳
createdate: 2017/08/08 14:32:12
changedate: 2017/12/13 18:00:35
categories: 问题
tags: calico
keywords: calico
description: kubernetes中的一个pod访问一个service的时候，时不时的出现timeout，经查发现是BGP连接故障，路由缺失。

---

* auto-gen TOC:
{:toc}

## 现象

kubernetes中的一个pod访问一个service的时候，时不时的出现timeout。

	$kubectl -n lijiaocn get endpoints nginx -o yaml

在这个pod上依次访问service的endpoint，发现是有一个endpoint(192.168.39.4)无法访问：

	/opt # curl 192.168.39.4
	^C

在这个pod所在的node上访问endpoint，也无法访问:

	/ # ping 192.168.39.4
	PING 192.168.39.4 (192.168.39.4) 56(84) bytes of data.

从其它的node以及其它node上的pod中则可以访问到192.168.39.4。

所以应该是发起访问的pod所在的node与endpoint所在的node之间出现了问题。

## 调查过程

endpoint位于10.39.1.219上，发起访问的pod位于node10.39.1.231。

### 查看访问发起端的状态

在10.39.1.231上查看路由，发现没有到10.39.1.219的路由：

	/ # route |grep 10.39.1.219
	/ #

在10.39.1.231上查看bird中的信息:

	$birdcl -s /var/run/calico/bird.ctl show protocols  |grep 10.39.1.219
	Mesh_10_39_1_219 BGP      master   start  2017-08-05  Connect       BGP Error: Hold timer expired

可以看到是BGP Error，10.39.1.231到10.39.1.219的BGP连接：
	
	/ # netstat -nt |grep 10.39.1.219
	tcp        0      1 10.39.1.231:52496       10.39.1.219:179         SYN_SENT

连接状态一直是SYN_SENT。

### 查看被访问端的状态

在10.39.1.219上看到的情况是:

	/ # birdcl -s /var/run/calico/bird.ctl show  protocols |grep 10.39.1.231
	Mesh_10_39_1_231 BGP      master   up     06:53:59    Established
	
	/ # birdcl -s /var/run/calico/bird.ctl show  protocols |grep 10.39.1.231
	Mesh_10_39_1_231 BGP      master   start  06:54:04    Active        Socket: Connection closed

BGP连接建立，但很快又被关闭。用netstat查看连接状态：

	/ # netstat -nt | grep 10.39.1.231
	tcp        0      0 10.39.1.219:179         10.39.1.231:38688       SYN_RECV
	tcp        0      0 10.39.1.219:47617       10.39.1.231:179         ESTABLISHED

可以看到10.39.1.231与10.39.1.219的BGP连接出现了问题。

10.39.1.231向10.39.1.219发起的连接一直停留在SYN_SENT的状态。

10.39.1.219向10.39.1.231发起了BGP连接，建立后又立刻断开了。

10.39.1.231上的bird日志：

	/var/log/calico/bird # cat current |grep 10_39_1_219
	2017-08-05_09:50:21.93291 bird: Adding protocol Mesh_10_39_1_219
	2017-08-05_09:50:21.93291 bird: Mesh_10_39_1_219: Initializing
	2017-08-05_09:50:21.93291 bird: Mesh_10_39_1_219: Starting
	2017-08-05_09:50:21.93291 bird: Mesh_10_39_1_219: State changed to start
	2017-08-05_09:50:22.95776 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:50:25.95629 bird: Mesh_10_39_1_219: Connected to table master
	2017-08-05_09:50:25.95632 bird: Mesh_10_39_1_219: State changed to feed
	2017-08-05_09:50:25.95632 bird: Mesh_10_39_1_219: State changed to up
	2017-08-05_09:50:30.93502 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:50:35.61321 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:01.57281 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:02.52864 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:04.53120 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:08.48007 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:12.90718 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:22.48820 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:39.77904 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:48.22299 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:48.70868 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:49.08971 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:51:57.54426 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:52:29.93101 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:52:30.87087 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:52:37.69522 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:52:59.76152 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:53:05.94477 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:53:08.71657 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:53:18.71867 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:53:19.46358 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:53:27.14068 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_09:53:27.29774 bird: Mesh_10_39_1_219: Reconfigured
	2017-08-05_14:37:50.31882 bird: Mesh_10_39_1_219: Error: Hold timer expired
	2017-08-05_14:37:50.31886 bird: Mesh_10_39_1_219: State changed to stop
	2017-08-05_14:37:50.31989 bird: Mesh_10_39_1_219: State changed to down
	2017-08-05_14:37:50.31990 bird: Mesh_10_39_1_219: Starting
	2017-08-05_14:37:50.31991 bird: Mesh_10_39_1_219: State changed to start

与此同时，10.39.1.219上的bird中，频繁刷日志:

	2017-08-05_19:23:00.10888 bird: Mesh_10_39_1_58: State changed to feed
	2017-08-05_19:23:00.10889 bird: Mesh_10_39_1_58: State changed to up
	2017-08-05_19:23:04.10944 bird: Mesh_10_39_1_58: State changed to start
	2017-08-05_19:23:04.10953 bird: Mesh_10_39_1_231: State changed to feed
	2017-08-05_19:23:04.10967 bird: Mesh_10_39_1_231: State changed to up
	2017-08-05_19:23:07.12346 bird: Mesh_10_39_1_231: State changed to start
	2017-08-05_19:23:07.12348 bird: Mesh_10_39_1_58: State changed to feed
	2017-08-05_19:23:07.12460 bird: Mesh_10_39_1_58: State changed to up
	2017-08-05_19:23:11.14042 bird: Mesh_10_39_1_58: State changed to start
	2017-08-05_19:23:11.14441 bird: Mesh_10_39_1_231: State changed to feed

## 继续调查

发现在10.39.1.231上无法ping通10.39.1.219:

	[root@slave-231 ~]# ping -I eth0 10.39.1.219
	PING 10.39.1.219 (10.39.1.219) from 10.39.1.231 eth0: 56(84) bytes of data.
	^C
	--- 10.39.1.219 ping statistics ---
	5 packets transmitted, 0 received, 100% packet loss, time 3999ms

反过来却能ping通:

	[root@slave-219 ~]# ping 10.39.1.231
	PING 10.39.1.231 (10.39.1.231) 56(84) bytes of data.
	64 bytes from 10.39.1.231: icmp_seq=1 ttl=64 time=0.579 ms
	64 bytes from 10.39.1.231: icmp_seq=2 ttl=64 time=0.164 ms
	64 bytes from 10.39.1.231: icmp_seq=3 ttl=64 time=0.151 ms

同时在10.39.1.231和10.39.1.219上用tcpdump抓包。

	# 10.39.1.231
	$tcpdump -n -i eth0 host 10.39.1.219 and icmp
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on eth0, link-type EN10MB (Ethernet), capture size 65535 bytes
	16:41:43.571916 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 39, length 64
	16:41:44.571942 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 40, length 64
	16:41:45.571955 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 41, length 64
	16:41:46.571919 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 42, length 64

	# 10.39.1.219
	$tcpdump -n -i eth0 host 10.39.1.231 and icmp
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on eth0, link-type EN10MB (Ethernet), capture size 65535 bytes
	16:41:05.586548 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 1, length 64
	16:41:05.586829 IP 10.39.1.219 > 10.39.1.231: ICMP echo reply, id 19809, seq 1, length 64
	16:41:06.584091 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 2, length 64
	16:41:06.584128 IP 10.39.1.219 > 10.39.1.231: ICMP echo reply, id 19809, seq 2, length 64
	16:41:07.584134 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 3, length 64
	16:41:07.584201 IP 10.39.1.219 > 10.39.1.231: ICMP echo reply, id 19809, seq 3, length 64
	16:41:08.584135 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 4, length 64
	16:41:08.584183 IP 10.39.1.219 > 10.39.1.231: ICMP echo reply, id 19809, seq 4, length 64
	16:41:09.584085 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 5, length 64

可以看到231发出的icmp报文送达了219，219的icmp回应包却没有能够回到231。

查看了一下两台机器的Iptables规则没有发现问题，将iptables规则都清空后，情况没有变化。

猜测可能不是calico的原因，因为这两台机器是IaaS上的虚拟机，估计是提供虚拟机的IaaS的问题。
