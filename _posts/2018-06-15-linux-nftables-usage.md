---
layout: default
title: Linux的nftables的使用
author: 李佶澳
createdate: 2018/06/15 10:23:00
last_modified_at: 2018/09/01 15:26:30
categories: 项目
tags: linux
keywords: linux nftables conntrack debuging 网络调试
description: nftables是一个新的报文分类框架（packet classification framework），被用来取代iptables，知识又要更新了

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[nftables introduction][1]中很详细的资料。[Why nftables?][2]中介绍了为什么开发nftables。

nftables依然使用netfiler中的5个hook：

	                                             Local
	                                            process
	                                              ^  |      .-----------.
	                   .-----------.              |  |      |  Routing  |
	                   |           |-----> input /    \---> |  Decision |----> output \
	--> prerouting --->|  Routing  |                        .-----------.              \
	                   | Decision  |                                                     --> postrouting
	                   |           |                                                    /
	                   |           |---------------> forward --------------------------- 
	                   .-----------.

不同的是nftables支持在linux kernel 4.2中新增的ingress hook:

	                                 .-----------.             
	                                 |           |-----> input ...
	---> ingress ---> prerouting --->|  Routing  |
	                                 | Decision  |
	                                 |           |
	                                 |           |-----> forward ...
	                                 .-----------.

## 概览

nftables由`table`、`chain`、`rule`组成，table包含chain，chain包含rule，rule是action。

安装：

	yum install -y nftables

### tables管理

	nft list tables [<family>]
	nft list table [<family>] <name> [-n] [-a]
	nft (add | delete | flush) table [<family>] <name>

### chains管理

chain的类型(`type`)分为filter、route、nat三种，针对不通的协议有不同的hook。

	filter: Supported by arp, bridge, ip, ip6 and inet table families.
	route:  Mark packets (like mangle for the output hook, for other hooks use the type filter instead), supported by ip and ip6.
	nat:    In order to perform Network Address Translation, supported by ip and ip6.

支持的`hooks`:

	ip, ip6 and inet families:  prerouting, input, forward, output, postrouting
	arp family: input, output
	The bridge family handles ethernet packets traversing bridge devices
	netdev: ingress

`priority`用来对chain排序，可以使用的值有：

	NF_IP_PRI_CONNTRACK_DEFRAG (-400)
	NF_IP_PRI_RAW (-300)
	NF_IP_PRI_SELINUX_FIRST (-225)
	NF_IP_PRI_CONNTRACK (-200)
	NF_IP_PRI_MANGLE (-150)
	NF_IP_PRI_NAT_DST (-100)
	NF_IP_PRI_FILTER (0)
	NF_IP_PRI_SECURITY (50)
	NF_IP_PRI_NAT_SRC (100)
	NF_IP_PRI_SELINUX_LAST (225)
	NF_IP_PRI_CONNTRACK_HELPER (300)

`policy`是对报文采取的动作：

	accept
	drop
	queue
	continue
	return

完成的管理命令如下：

	nft (add | create) chain [<family>] <table> <name> [ { type <type> hook <hook> [device <device>] priority <priority> \; [policy <policy> \;] } ]
	nft (delete | list | flush) chain [<family>] <table> <name>
	nft rename chain [<family>] <table> <name> <newname>

### Rules管理

`handle`用来标记rule的。

`position`用来指示rule将要被插入的位置。

	nft add rule [<family>] <table> <chain> <matches> <statements>
	nft insert rule [<family>] <table> <chain> [position <position>] <matches> <statements>
	nft replace rule [<family>] <table> <chain> [handle <handle>] <matches> <statements>
	nft delete rule [<family>] <table> <chain> [handle <handle>]

#### matches

matches是报文需要满足的条件。

matches的内容非常多，可以识别以下几种类型的报文：

	ip          :  ipv4协议字段
	ip6         :  ipv6协议字段
	tcp         :  tcp协议字段
	udp         :  udp协议字段
	udplite     :  udp-lite协议
	sctp         
	dccp
	ah
	esp
	comp
	icmp
	icmpv6
	ether       :  以太头
	dst
	frag        :
	hbh
	mh
	rt            
	vlan        :  vlan
	arp         :  arp协议
	ct          :  连接状态
	meta        :  报本的基本信息

对每一种类型，又可以检查多个字段，例如：

	ip dscp cs1
	ip dscp != cs1
	ip dscp 0x38
	ip dscp != 0x20
	ip dscp {cs0, cs1, cs2, cs3, cs4, cs5, cs6, cs7, af11, af12, af13, af21, 
	af22, af23, af31, af32, af33, af41, af42, af43, ef}
	
	ip length 232
	ip length != 233
	ip length 333-435
	ip length != 333-453
	ip length { 333, 553, 673, 838}
	
	ip6 flowlabel 22
	ip6 flowlabel != 233
	ip6 flowlabel { 33, 55, 67, 88 }
	ip6 flowlabel { 33-55 }

[nftables matches][3]的内容相当多，这里不列出了。

#### statements

`statement`是报文匹配rule时，触发的操作：

	Verdict statements :   action
	Log                :   日志
	Reject             :   拒绝
	Counter            :   计数
	Limit              :   限速
	Nat                :   NAT
	Queuea             :   队列

其中Verdict Statements是一组action:

	accept: Accept the packet and stop the remain rules evaluation.
	drop: Drop the packet and stop the remain rules evaluation.
	queue: Queue the packet to userspace and stop the remain rules evaluation.
	continue: Continue the ruleset evaluation with the next rule.
	return: Return from the current chain and continue at the next rule of the last chain. In a base chain it is equivalent to accept
	jump <chain>: Continue at the first rule of <chain>. It will continue at the next rule after a return statement is issued
	goto <chain>: Similar to jump, but after the new chain the evaluation will continue at the last chain instead of the one containing the goto statement

### 其它

导出配置：

	nft export (xml | json)

查看事件：

	nft monitor [new | destroy] [tables | chains | sets | rules | elements] [xml | json]

### 规则文件

	nft list ruleset
	nft flush ruleset

例如导出所有规则，然后重新导入：

	$ nft list ruleset > /etc/nftables.rules
	$ nft flush ruleset
	$ nft -f /etc/nftables.rules

### example

	flush ruleset
	
	table firewall {
	  chain incoming {
	    type filter hook input priority 0; policy drop;        //chain的属性
	
	    # established/related connections                      //chain中的规则
	    ct state established,related accept
	
	    # loopback interface
	    iifname lo accept
	
	    # icmp
	    icmp type echo-request accept
	
	    # open tcp ports: sshd (22), httpd (80)
	    tcp dport {ssh, http} accept
	  }
	}
	
	table ip6 firewall {
	  chain incoming {
	    type filter hook input priority 0; policy drop;
	
	    # established/related connections
	    ct state established,related accept
	
	    # invalid connections
	    ct state invalid drop
	
	    # loopback interface
	    iifname lo accept
	
	    # icmp
	    # routers may also want: mld-listener-query, nd-router-solicit
	    icmpv6 type {echo-request,nd-neighbor-solicit} accept
	
	    # open tcp ports: sshd (22), httpd (80)
	    tcp dport {ssh, http} accept
	  }
	}

## 参考

1. [nftables introduction][1]
2. [Why nftables?][2]
3. [nftables matches][3]


[1]: https://wiki.nftables.org/wiki-nftables/index.php/Main_Page#Introduction "nftables introduction"
[2]: https://wiki.nftables.org/wiki-nftables/index.php/Why_nftables%3F  "Why nftables?"
[3]: https://wiki.nftables.org/wiki-nftables/index.php/Quick_reference-nftables_in_10_minutes#Matches "nftables matches"
