---
layout: default
title: "ipset: linux的ipset命令的使用"
author: 李佶澳
createdate: 2017/08/06 23:09:01
last_modified_at: 2017/09/15 16:00:47
categories: 技巧
tags: manual
keywords: ipset
description: ipset用来管理linux中的ipset，ipset可以被iptables引用

---

## 目录
* auto-gen TOC:
{:toc}

## 说明 

ipset是linux kernel的一个功能，可以将ip等组合成一个ipset，在iptables中可以直接指定ipset。

## 创建ipset

`ipset -n`或者`ipset create`:

	 n, create SETNAME TYPENAME [ CREATE-OPTIONS ]

SETNAME是创建的ipset的名称，TYPENAME是ipset的类型：

	 TYPENAME := method:datatype[,datatype[,datatype]]

method指定ipset中的entry存放的方式，随后的datatype约定了每个entry的格式。

可以使用的method:

	bitmap, hash, list

可以使用的datatype:

	ip, net, mac, port, iface

## 添加记录

`ipset add`用于在ipset中添加记录：

	add SETNAME ADD-ENTRY [ ADD-OPTIONS ]

向ipset中添加entry的时候，加入的entry的格式必须与创建ipset是指定的格式匹配。

	$ipset creat foo hash:ip,port,ip
	$ipset add foo ipaddr,portnum,ipaddr
	
	$ipset list foo
	Name: foo
	Type: hash:ip,port,ip
	Revision: 2
	Header: family inet hashsize 1024 maxelem 65536
	Size in memory: 16584
	References: 0
	Members:
	192.168.1.2,tcp:80,192.168.1.3

## 删除记录

`ipset del`用于从ipset中删除记录：

	del SETNAME DEL-ENTRY [ DEL-OPTIONS ]

## 查询记录

`ipset test`可以检查目标entry是否在ipset中:

	test SETNAME TEST-ENTRY [ TEST-OPTIONS ]

`ipset list`可以查看ipset的所有内容：

	list [ SETNAME ] [ OPTIONS ]

## 导出导入

`ipset save`可以导出所有的ipset:

	save [ SETNAME ]

`ipset restore`则用于将导出的内容导入。

## 其它

	flush [ SETNAME ]
	       Flush all entries from the specified set or flush all sets if none is given.
	
	e, rename SETNAME-FROM SETNAME-TO
	       Rename a set. Set identified by SETNAME-TO must not exist.
	
	w, swap SETNAME-FROM SETNAME-TO
	       Swap the content of two sets, or in another words, exchange the name of two sets. The referred sets must exist and identical type of sets can be swapped only.
	
	help [ TYPENAME ]
	       Print help and set type specific help if TYPENAME is specified.
	
	version
	       Print program version.
	
	-      If  a dash is specified as command, then ipset enters a simple interactive mode and the commands are read from the standard input.  The interactive mode can be finished by entering the
	       pseudo-command quit.

## 在iptables中使用ipset

在iptables中可以使用`-m set`启用ipset模块，例如。

	-A POSTROUTING -m set --match-set felix-masq-ipam-pools src -m set ! --match-set felix-all-ipam-pools dst -j MASQUERADE

iptables的set模块：

	set
	This module matches IP sets which can be defined by ipset(8).
	
	[!] --match-set setname flag[,flag]...
	       where flags are the comma separated list of src and/or dst specifications and there can be no more than six of them. Hence the command
	
	        iptables -A FORWARD -m set --match-set test src,dst
	...

在`TARGET`中也可以操作ipset：

	SET
	This module adds and/or deletes entries from IP sets which can be defined by ipset(8).
	
	--add-set setname flag[,flag...]
	       add the address(es)/port(s) of the packet to the set
	
	--del-set setname flag[,flag...]
	       delete the address(es)/port(s) of the packet from the set
	
	       where flag(s) are src and/or dst specifications and there can be no more than six of them.
	...

在`man iptables-extensions`中可以找到`set module`和`SET TARGET`的所有选项。

## 参考

1. [ipset][1]

[1]: http://bbs.chinaunix.net/thread-2064657-1-1.html  "ipset" 
