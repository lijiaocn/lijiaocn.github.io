---
layout: default
title: calico路由丢失问题的调查
author: lijiaocn
createdate: 2017/08/08 14:32:12
changedate: 2017/08/08 18:50:53
categories: 问题
tags: calico k8s
keywords:
description: 

---

* auto-gen TOC:
{:toc}

## 现象

kubernetes中的一个pod访问一个service的时候，时不时的出现timeout。

	$kubectl -n XXX get endpoints nginx -o yaml

在这个pod上依次访问service的endpoint，发现是有一个endpoint(192.168.39.4)无法访问：

	/opt # curl 192.168.39.4
	^C

在该pod所在的node上访问，也无法访问:

	/ # ping 192.168.4.39
	PING 192.168.4.39 (192.168.4.39) 56(84) bytes of data.

从其它的node以及其它node上的pod中则可以访问到192.168.4.39。

所以猜测是该endpoint以及所在的node(10.39.1.231)上存在问题。

## 调查node(10.39.1.231)

endpoint(192.168.39.4)位于node(10.39.1.219)上，有问题的pod位于node(10.39.1.231)上。

在node(10.39.1.231)上查看路由，发现没有到219的路由：

	/ # route |grep 10.39.1.219
	/ #

在node(10.39.1.231)上查看bird中的信息:

	$birdcl -s /var/run/calico/bird.ctl show protocols  |grep 10.39.1.219
	Mesh_10_39_1_219 BGP      master   start  2017-08-05  Connect       BGP Error: Hold timer expired
	
	/ # netstat -nt |grep 10.39.1.219
	tcp        0      1 10.39.1.231:52496       10.39.1.219:179         SYN_SENT

在node(10.39.1.219)上看到的情况是:

	/ # birdcl -s /var/run/calico/bird.ctl show  protocols |grep 10.39.1.231
	Mesh_10_39_1_231 BGP      master   up     06:53:59    Established

	/ # birdcl -s /var/run/calico/bird.ctl show  protocols |grep 10.39.1.231
	Mesh_10_39_1_231 BGP      master   start  06:54:04    Active        Socket: Connection closed

	/ # netstat -nt | grep 10.39.1.231
	tcp        0      0 10.39.1.219:179         10.39.1.231:38688       SYN_RECV
	tcp        0      0 10.39.1.219:47617       10.39.1.231:179         ESTABLISHED

可以看到node(10.39.1.231)与node(10.39.1.219)的BGP连接出现了问题。

node(10.39.1.231)向node(10.39.1.219)发起的连接一直停留在SYN_SENT的状态。

node(10.39.1.219)向node(10.39.1.231)发起了BGP连接，但是建立后又立刻断开了。

node(10.39.1.231)上的bird日志：

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

与此同时，node(10.39.1.219)上的bird中，频繁刷日志:

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

发现在node(10.39.1.231)上无法ping通node(10.39.1.219):

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

同时在node(10.39.1.231)和node(10.39.1.219)上用tcpdump抓包。

	# on node(10.39.1.231)
	$tcpdump -n -i eth0 host 10.39.1.219 and icmp
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on eth0, link-type EN10MB (Ethernet), capture size 65535 bytes
	16:41:43.571916 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 39, length 64
	16:41:44.571942 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 40, length 64
	16:41:45.571955 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 41, length 64
	16:41:46.571919 IP 10.39.1.231 > 10.39.1.219: ICMP echo request, id 19809, seq 42, length 64

	# on node(10.39.1.219)
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

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
