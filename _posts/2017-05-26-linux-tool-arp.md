---
layout: default
title: "arp: arp相关的命令"
author: 李佶澳
createdate: 2017/05/26 09:28:32
last_modified_at: 2018/07/22 14:26:28
categories: 技巧
tags: manual
keywords: arp arping
description:  管理的本地的arp记录和发送arp请求。

---

## 目录
* auto-gen TOC:
{:toc}

## ip neigh

arp命令已经不推荐使用，推荐使用`ip neigh`

## arp - 管理本地的arp记录

arp - manipulate the system ARP cache

	Arp manipulates or displays the kernel's IPv4 network neighbour cache. It can add entries to the table, delete one or display the current content.
	This program is obsolete. For replacement check ip neigh. (man 8 ip-neighbour)

手册：

	man 8  arp

### 查看arp entry：

	arp [-vn] [-H type] [-i if] [-ae] [hostname]

	-v: verbose
	-n: shows numerical addresses
	-H: 过滤条件，arp entry类型, 默认为"ether", 
	    可用类型有： ARCnet (arcnet) , PROnet (pronet) , AX.25 (ax25) and NET/ROM (netrom) ...
	-i: 过滤条件，arp entry所在的网口
	-a: 显示格式，Use alternate BSD style output format (with no fixed columns).
	-e: 显示格式，Use default Linux style output format (with fixed columns).
	hostname: 过滤条件，查看该IP地址或主机名的arp entry

查看所有arp entry

	[root@localhost ~]# arp 
	Address                  HWtype  HWaddress           Flags Mask            Iface
	localhost                ether   00:0c:29:81:35:6c   C                     eno50332208
	localhost                ether   00:50:56:fa:26:95   C                     eno33554984
	localhost                ether   00:50:56:c0:00:01   C                     eno33554984
	localhost                ether   00:0c:29:81:35:6c   CM                    eno50332208
	localhost                ether   00:50:56:f3:1f:8b   C                     eno16777736
	localhost                ether   00:50:56:fd:02:ef   C                     eno16777736

Flags Mask说明:

	C:  complete entry
	M:  permanent entry
	P:  published entry

查看指定主机的的arp entry

	[root@localhost ~]# arp -n 10.10.64.151
	Address                  HWtype  HWaddress           Flags Mask            Iface
	10.10.64.151             ether   00:0c:29:81:35:6c   C                     eno50332208

查看指定网口上的arp entry

	[root@localhost ~]# arp -n -i eno50332208
	Address                  HWtype  HWaddress           Flags Mask            Iface
	10.10.64.151             ether   00:0c:29:81:35:6c   C                     eno50332208
	10.10.64.192             ether   00:0c:29:81:35:6c   CM                    eno50332208

### 删除arp entry:

	arp [-v] [-i if] -d hostname [pub]
	-v: verbose
	-i: 过滤条件，指定网口
	-d: 删除模式, 删除arp entry
	pub: 过滤条件，arp entry具有pub标记
	     具有pub标记的arp entry是代理arp

### 添加arp entry:

	arp [-v] [-H type] [-i if] -s hostname hw_addr [temp]
	arp [-v] [-H type] [-i if] -s hostname hw_addr [netmask nm] pub
	arp [-v] [-H type] [-i if] -Ds hostname ifname [netmask nm] pub
	arp [-vnD] [-H type] [-i if] -f [filename]

	-v: verbose
	-H: arp entry类型,可用类型有： IEEE 802.3(ether), ARCnet (arcnet) , PROnet (pronet) , AX.25 (ax25) and NET/ROM (netrom) ...
	-i: 所属的网口
	-s: 添加模式，增加arp entry
	hostname: arp entry的IP
	hw_addr:  arp entry的mac地址
	temp: arp entry标记，临时arp, 如果么有指定temp, arp entry将一直保存
	pub:  arp entry标记，代理arp
	netmask: 代理arp作用的网段
	-D: 使用指定网口的MAC地址作为hw_addr
	-f: 从文件中读取要设置的arp条目, 文件中每行记录的格式： hostname  hw_addr  [temp|netmask nm pub]

## arping - 发送arp请求

arping - send ARP REQUEST to a neighbour host

	arping [-AbDfhqUV] [-c count] [-w deadline] [-s source] [-I interface] destination
	
	Ping destination on device interface by ARP packets, using source address sourc

示例:

	 arping -I eth1 192.168.40.1
	 ARPING 192.168.40.1 from 192.168.40.2 eth1
	 Unicast reply from 192.168.40.1 [0A:00:27:00:00:00]  0.701ms
	 Unicast reply from 192.168.40.1 [0A:00:27:00:00:00]  0.699ms
	 Unicast reply from 192.168.40.1 [0A:00:27:00:00:00]  0.731ms
	 Unicast reply from 192.168.40.1 [0A:00:27:00:00:00]  0.722ms

## 参考

1. [Linux命令大全][1]

[1]: http://man.linuxde.net/ "Linux命令大全"


