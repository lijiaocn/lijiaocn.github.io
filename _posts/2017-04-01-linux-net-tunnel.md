---
layout: default
title: Linux的Network Tunnel技术
author: 李佶澳
createdate: 2017/04/01 14:33:46
changedate: 2017/09/28 20:35:17
categories: 技巧
tags: linux
keywords: tunnel,ipip,gre,vxlan,linux
description: 介绍了Linux上使用的网络隧道（tunnel）技术。

---

* auto-gen TOC:
{:toc}

## 概要

Linux上可以使用`ip tunnel`命令创建多种类型的tunnel。

在

	man ip-tunnel

中可以得知以下几种类型的tunnel:

	MODE :=  { ipip | gre | sit | isatap | vti | ip6ip6 | ipip6 | ip6gre | vti6 | any }

ip tunnel的使用方法:

	$ip tunnel help
	Usage: ip tunnel { add | change | del | show | prl | 6rd } [ NAME ]
	          [ mode { ipip | gre | sit | isatap | vti } ] [ remote ADDR ] [ local ADDR ]
	          [ [i|o]seq ] [ [i|o]key KEY ] [ [i|o]csum ]
	          [ prl-default ADDR ] [ prl-nodefault ADDR ] [ prl-delete ADDR ]
	          [ 6rd-prefix ADDR ] [ 6rd-relay_prefix ADDR ] [ 6rd-reset ]
	          [ ttl TTL ] [ tos TOS ] [ [no]pmtudisc ] [ dev PHYS_DEV ]
	
	Where: NAME := STRING
	       ADDR := { IP_ADDRESS | any }
	       TOS  := { STRING | 00..ff | inherit | inherit/STRING | inherit/00..ff }
	       TTL  := { 1..255 | inherit }
	       KEY  := { DOTTED_QUAD | NUMBER }

## ipip mode

ipip tunnel是最简单的一种，将ipv4报文封装在ip协议中送出，一对ipip tunnel设备之间只能建立一个tunnel。

因为ipip只能点对点等建立隧道，因此只能封装ipv4的单播报文，不能处理OSPF、RIP等多播协议。

下面在两台机器（192.168.40.2）和（192.168.40.3)之间建立ipip tunnel。

为了结构清晰，在两台机器上个创建一个ns，为这两个ns建立ipip tunnel。

### 试验规划

172.0.0.0/24网段的报文经封装后通过192.168.40.0/24网段传输。

	underlay的传输IP:   192.168.40.2   <-------->  192.168.40.3
	                         ^                           ^
	                         |                           |
	overlay的虚拟IP:     172.0.0.2                   172.0.0.3

### 准备环境

在192.168.40.2，将网卡eth1加入到ipip-ns，配置IP 192.168.40.2:

	ip netns add ipip-ns
	ip link set eth1 netns ipip-ns
	ip netns exec ipip-ns ip link set eth1 up
	ip netns exec ipip-ns ip addr add 192.168.40.2 dev eth1
	ip netns exec ipip-ns ip route add 192.168.40.0/24 via 192.168.40.2 dev eth1

	$ip netns exec ipip-ns ping 192.168.40.1
	PING 192.168.40.1 (192.168.40.1) 56(84) bytes of data.
	64 bytes from 192.168.40.1: icmp_seq=1 ttl=64 time=0.304 ms

在192.168.40.3，将网卡eth1加入到ipip-ns，配置IP 192.168.40.3:

	ip netns add ipip-ns
	ip link set eth1 netns ipip-ns
	ip netns exec ipip-ns ip link set eth1 up
	ip netns exec ipip-ns ip addr add 192.168.40.3 dev eth1
	ip netns exec ipip-ns ip route add 192.168.40.0/24 via 192.168.40.3 dev eth1

	$ip netns exec ipip-ns ping 192.168.40.2
	PING 192.168.40.2 (192.168.40.2) 56(84) bytes of data.
	64 bytes from 192.168.40.2: icmp_seq=1 ttl=64 time=0.436 ms

### 创建tunnel

在192.168.40.2上:

	modprobe ipip

	//创建隧道，隧道本地端传输IP是192.168.40.2，远端的传输IP是192.168.40.3，通过eth1传输
	$ip netns exec ipip-ns ip tunnel add ipiptun mode ipip local 192.168.40.2 remote 192.168.40.3 ttl 64 dev eth1
	
	//隧道的本地端虚拟IP是172.0.0.2，远端的虚拟IP是172.0.0.3
	$ip netns exec ipip-ns ip addr add dev ipiptun 172.0.0.2 peer 172.0.0.3

	//启动tunnel设备
	$ip netns exec ipip-ns ip link set dev ipiptun up

	//添加路由
	$ip netns exec ipip-ns ip route add 172.0.0.0/24 via 172.0.0.2

在192.168.40.3上:

	modprobe ipip

	$ip netns exec ipip-ns ip tunnel add ipiptun mode ipip local 192.168.40.3 remote 192.168.40.2 ttl 64 dev eth1
	$ip netns exec ipip-ns ip addr add dev ipiptun 172.0.0.3 peer 172.0.0.2
	$ip netns exec ipip-ns ip link set dev ipiptun up
	$ip netns exec ipip-ns ip route add 172.0.0.0/24 via 172.0.0.3

### 观察设备

观察192.168.40.2上的网络设备

	$ip netns exec ipip-ns ip addr
	1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
	    ...省略...
	2: tunl0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN qlen 1
	    link/ipip 0.0.0.0 brd 0.0.0.0
	3: eth1: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
	    link/ether 08:00:27:b3:6c:38 brd ff:ff:ff:ff:ff:ff
	    inet 192.168.40.2/32 scope global eth1
	       valid_lft forever preferred_lft forever
	    inet6 fe80::a00:27ff:feb3:6c38/64 scope link
	       valid_lft forever preferred_lft forever
	4: ipiptun@eth1: <POINTOPOINT,NOARP,UP,LOWER_UP> mtu 1480 qdisc noqueue state UNKNOWN qlen 1
	    link/ipip 192.168.40.2 peer 192.168.40.3
	    inet 172.0.0.2 peer 172.0.0.3/32 scope global ipiptun
	       valid_lft forever preferred_lft forever

可以看到增加了一个ipiptun@eth1设备，就是在上面创建的ipiptun设备。

该设备的本地IP是192.168.40.2和172.0.0.2，对端IP是192.168.40.3和172.0.0.3。

### 联通测试

在192.168.40.2上发起ping:

	$ip netns exec ipip-ns ping 172.0.0.3
	PING 172.0.0.3 (172.0.0.3) 56(84) bytes of data.
	64 bytes from 172.0.0.3: icmp_seq=1 ttl=64 time=0.319 ms
	64 bytes from 172.0.0.3: icmp_seq=2 ttl=64 time=0.535 ms
	64 bytes from 172.0.0.3: icmp_seq=3 ttl=64 time=0.552 ms

在192.168.40.3上抓包:

	$ip netns exec ipip-ns tcpdump -i eth1
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on eth1, link-type EN10MB (Ethernet), capture size 65535 bytes
	08:02:29.287573 IP 192.168.40.2 > 192.168.40.3: IP 172.0.0.2 > 172.0.0.3: ICMP echo request, id 4363, seq 1, length 64 (ipip-proto-4)
	08:02:29.287631 IP 192.168.40.3 > 192.168.40.2: IP 172.0.0.3 > 172.0.0.2: ICMP echo reply, id 4363, seq 1, length 64 (ipip-proto-4)
	08:02:30.288665 IP 192.168.40.2 > 192.168.40.3: IP 172.0.0.2 > 172.0.0.3: ICMP echo request, id 4363, seq 2, length 64 (ipip-proto-4)
	08:02:30.288749 IP 192.168.40.3 > 192.168.40.2: IP 172.0.0.3 > 172.0.0.2: ICMP echo reply, id 4363, seq 2, length 64 (ipip-proto-4)
	08:02:31.290073 IP 192.168.40.2 > 192.168.40.3: IP 172.0.0.2 > 172.0.0.3: ICMP echo request, id 4363, seq 3, length 64 (ipip-proto-4)
	08:02:31.290157 IP 192.168.40.3 > 192.168.40.2: IP 172.0.0.3 > 172.0.0.2: ICMP echo reply, id 4363, seq 3, length 64 (ipip-proto-4)

可以看到172.0.0.0/24网段的报文，经过封装后，通过192.168.40.0/24网段完成了传输。

### 高级应用

如果远端的设备上设置NAT，那么本地就可以通过建立的IPIP隧道，接入到远端机器所在的另一个网络。

## 参考

1. [linux tunneling][1]
2. [Network Namespaces][2]
3. [linux ipip隧道及实现][3]

[1]: https://wiki.linuxfoundation.org/networking/tunneling  "linux tunneling" 
[2]: https://lwn.net/Articles/580893/ "Network Namespaces"
[3]: http://www.361way.com/linux-tunnel/5199.html  "linux ipip隧道及实现"
