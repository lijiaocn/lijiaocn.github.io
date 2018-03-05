---
layout: default
title: linux的网络namespace
author: 李佶澳
createdate: 2017/08/10 14:16:11
changedate: 2017/10/22 17:24:26
categories: 技巧
tags: linuxnet
keywords: network,namespace,linux
description: namespace是一个独立的网络协议栈，通过namespace，可以将网络设备分隔开，设置独立的路由规则、防火墙规则等。

---

* auto-gen TOC:
{:toc}

## namespace

namespace是一个独立的网络协议栈，通过namespace，可以将网络设备分隔开，设置独立的路由规则、防火墙规则等。

一个设备只能属于一个namespace。

	man ip-netns

可以通过`ip netns [NAMESPACE] [CMD...] `在指定的namespace中操作，例如：

	//查看名为AAA的ns中的网络设备
	ip netns AAA ip link

### 基本操作

创建ns1:

	ip netns add ns1

查看ns1中的设备:

	ip netns exec ns1 ip link
	1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN mode DEFAULT qlen 1
	    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00

将网卡eth1添加到ns1中:

	$ip link set eth1 netns ns1
	
	$ip netns exec ns1 ip link
	1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN mode DEFAULT qlen 1
	    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
	3: eth1: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT qlen 1000
	    link/ether 08:00:27:b3:6c:38 brd ff:ff:ff:ff:ff:ff

将网卡eth1重新添加到默认的ns中:

	ip netns exec ns1 ip link set eth1 netns 1

注意必须在ns1中设置，最后一个1表示，进程1所在的namespace。

删除netns：

	ip netns delete ns1

[linux网络虚拟化][3]中给出了一个利用veth连接两个namespace的例子。

### 利用veth连接两个namespace

	ip netns add net0
	ip netns add net1
	ip link add type veth

	ip link set veth0 netns net0
	ip link set veth1 netns net1

	ip netns exec net0 ip link set veth0 up
	ip netns exec net0 ip address add 10.0.1.1/24 dev veth0

	ip netns exec net1 ip link set veth1 up
	ip netns exec net1 ip address add 10.0.1.2/24 dev veth1

	ip netns exec net1 ping 10.0.1.1
	PING 10.0.1.1 (10.0.1.1) 56(84) bytes of data.
	64 bytes from 10.0.1.1: icmp_seq=1 ttl=64 time=0.036 ms
	64 bytes from 10.0.1.1: icmp_seq=2 ttl=64 time=0.066 ms

### 两个namespace连接到bridge

![ns连接到网桥]({{ site.imglocal }}/namespace/ns-bridge.png)

创建三个ns，并利用veth连接:

	ip netns add net0
	ip netns add net1
	ip netns add bridge
	ip link add type veth
	ip link set dev veth0 name net0-bridge netns net0       //重新命名
	ip link set dev veth1 name bridge-net0 netns bridge
	ip link add type veth
	ip link set dev veth0 name net1-bridge netns net1
	ip link set dev veth1 name bridge-net1 netns bridge

配置bridge，将另外两个ns的对端veth设备接入bridge:

	ip netns exec bridge brctl addbr br
	ip netns exec bridge ip link set dev br up
	ip netns exec bridge ip link set dev bridge-net0 up
	ip netns exec bridge ip link set dev bridge-net1 up
	ip netns exec bridge brctl addif br bridge-net0
	ip netns exec bridge brctl addif br bridge-net1

配置两个ns中的veth设备:

	ip netns exec net0 ip link set dev net0-bridge up
	ip netns exec net0 ip address add 10.0.1.1/24 dev net0-bridge

	ip netns exec net1 ip link set dev net1-bridge up
	ip netns exec net1 ip address add 10.0.1.2/24 dev net1-bridge

## 参考

1. [Linux网络虚拟化][1]

[1]: https://blog.kghost.info/2013/03/01/linux-network-emulator "Linux网络虚拟化"
