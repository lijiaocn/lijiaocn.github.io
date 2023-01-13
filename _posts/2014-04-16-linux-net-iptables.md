---
layout: default
title: "iptables: Linux的iptables使用"
author: 李佶澳
createdate: 2014/04/16 10:16:55
last_modified_at: 2018/06/17 21:48:31
categories: 技巧
tags: manual
keywords: iptables规则,iptables使用方法,iptables原理,iptables报文处理,linux,iptables
description: 介绍了iptables的原理、表之间的关系、报文处理时经过规则链的顺序。以及iptables的调试方法和比较有意思的应用。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

iptables是linux自带的防火墙，这里做系统的介绍。完全不懂iptables的，可以到[iptables-contents][5]/[Iptables Tutorial 1.2.2][8]中学习。查看iptables的Target的配置项:

	man iptables-extensions

iptables相关笔记：

1. [iptables：Linux的iptables使用](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2014/04/16/linux-net-iptables.html)
2. [Linux的iptables规则调试、连接跟踪、报文跟踪](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/06/15/debug-linux-network.html)

## 概览

iptables的规则按照“表(table)->规则链(chain)->规则(rule)”的层次组织。总共有五张表:

	filter
	nat
	mangle
	raw
	security

系统中依据报文的路径，设置了五个固定的检查点:

	              INPUT                 OUPUT
	                .                     |
	               /_\           +--------+
	                |           _|_
	                +--------+  \ /
	                         |   ' 
	                         Router --------|> FORWARD
	                         .   |                |
	                        /_\  +--------+       |
	                         |           _|_     _|_
	               +---------+           \ /     \ /
	               |                      '       ' 
	    PKT ---> PREROUTING              POSTROUTING  ---> PKT

这五个转发点，对应了五个固定的规则链(Chain):

	Chain PREROUTING
	Chain INPUT
	Chain OUTPUT
	Chain FORWARD
	Chain POSTROUTING

并不是每张表都包含了所有的五个Chain，五张表的用途不同，它们只包含了需要包含的Chain。

	filter: 
	    Chain INPUT
	    Chain FORWARD
	    Chain OUTPUT
	
	nat:
	    Chain PREROUTING
	    Chain INPUT
	    Chain OUTPUT
	    Chain POSTROUTING
	
	mangle:
	    Chain PREROUTING
	    Chain INPUT
	    Chain FORWARD
	    Chain OUTPUT
	    Chain POSTROUTING
	
	raw:
	    Chain PREROUTING
	    Chain OUTPUT
	
	security:
	    Chain INPUT
	    Chain FORWARD
	    Chain OUTPUT

除了上述的5个固定的Chain，也可以自定义Chain，但只有通过上述5个Chain中设置的跳转规则，跳转到自定义的dChain，自定义的Chain才可以发生作用。

可以通过下面的命令查看规则:

	//查看fitler表中的所有chain
	iptables -t filter -L

	//查看fitler表中input chain中的所有规则
	iptables -t filter -L INPUT

如果不指定table，默认查看的是filter表。

## 表之间的关系

报文在匹配iptables的规则的时候，是按照固定的顺序进行的，既不是按照表的顺序执行，也不是按照检查点的顺序执行。

[structure-of-iptables][2]中做了非常详细的说明。

进入主机的报文:

	raw.PREROUTING -> mangle.PREROUTING -> nat.PREROUTING -> mangle.INPUT -> filter.INPUT 

经主机转发的报文:

	raw.PREROUTING -> mangle.PREROUTING -> nat.PREROUTING -> mangle.FORWARD -> filter.FORWARD
	-> mangle.POSTROUTING -> nat.POSTROUTING

主机发出的报文:

	raw.OUTPUT -> mangle.OUTPUT -> nat.OUTPUT -> filter.OUTPUT -> mangle.POSTROUTING 
	->nat.POSTROUTING

![nf-packet-flow]({{ site.imglocal }}/iptables/nf-packet-flow.png )

### filter表

IPtables使用的默认表，包含三个检查点

	INPUT
	FORWARD
	OUTPUT:

### nat表

nat表，当遇到一个需要建立新连接的报文时，使用该表

	PREROUTING
	OUTPUT
	POSTROUTING

### mangle表

mangle表用于修改特定的报文

	PREROUTING
	OUTPUT
	INPUT

### raw表

raw表用于配置连接跟踪的例外情况

	PREROUTING
	OUTPUT

### security表

waiting

## 规则格式

	rule-specification = [matches...] [target]
	match = -m matchname [per-match-options]
	target = -j targetname [per-target-options]

可以使用的规则参数:

	-4, --ipv4
	-6, --ipv6
	[!] -p, --protocol protocol
	     可以使用:
	       1. tcp, udp, udplite, icmp, icmpv6,esp, ah, sctp, mh or the special keyword "all"
	       2. 协议号，0等同于"all"
	       3. /etc/protocols中列出的协议名
	[!] -s, --source address[/mask][,...]
	     Address can be either:
	         a network name, a hostname, a network IP address (with /mask), or a plain IP address.
	         Multiple addresses can be specified, but this will expand to multiple rules (when
	         adding with -A), or will cause multiple rules to be deleted (with -D).
	[!] -d, --destination address[/mask][,...]
	-m, --match match
	     不同的模块有不同的参数，在下一节中单独讨论
	-j, --jump target
	-g, --goto chain
	      Unlike the --jump option return will not continue processing in this chain but instead 
	      in the chain that called us via --jump
	[!] -i, --in-interface name
	[!] -o, --out-interface name
	[!] -f, --fragment
	      This means that the rule only refers to second and further IPv4 fragments of fragmented packets.
	      Since there is no way to tell the source or destination ports of  such  a  packet  (or ICMP type), 
	      such a packet will not match any rules which specify them.  
	      When the "!" argument precedes the "-f" flag, the rule will only match head fragments, or unfragmented packets.
	      This option is IPv4 specific, it is not available in ip6tables.
	-c, --set-counters packets bytes
	      This enables the administrator to initialize the packet and byte counters of a rule 
	      (during INSERT, APPEND, REPLACE operations).

### 常见规则

屏蔽接收：

	iptables -A INPUT -s xxx.xxx.xxx.xxx -j DROP
	iptables -A INPUT -p tcp -s xxx.xxx.xxx.xxx -j DROP
	iptables -A INPUT -p tcp --dport xxx -j ACCEPT
	iptables -A INPUT -p icmp -i eth0 -j DROP
	iptables -A INPUT -m mac --mac-source 00:00:00:00:00:00 -j DROP

屏蔽发送：

	 iptables -A OUTPUT -p tcp --dport xxx -j DROP

多端口设置：

	iptables -A INPUT  -p tcp -m multiport --dports 22,80,443 -j ACCEPT
	iptables -A OUTPUT -p tcp -m multiport --sports 22,80,443 -j ACCEPT

使用IP网段：

	iptables -A OUTPUT -p tcp -d 192.168.100.0/24 --dport 22 -j ACCEPT

本地端口转发：

	iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 25 -j REDIRECT --to-port 2525

限制连接速率，每分钟100个，上限200：

	iptables -A INPUT -p tcp --dport 80 -m limit --limit 100/minute --limit-burst 200 -j ACCEPT

限制并发连接：

	iptables -A INPUT -p tcp --syn --dport 22 -m connlimit --connlimit-above 3 -j REJECT

允许建立连接：

	iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
	iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED -j ACCEPT

## iptables-extensions

iptables-extensions由多个mach module和多个target module组成，每个module都有自己的参数。

在`man iptables-extensions`中可以看到所有的支持的module。

#### match module

通过`-m name [module-options...]`指定，标准的iptables包括下列match module:

	addrtype
	ah (IPv6-specific)
	ah (IPv4-specific)
	bpf
	cgroup
	cluster
	comment
	connbytes
	connlabel
	connlimit
	connmark
	conntrack
	cpu
	dccp
	devgroup
	dscp
	dst (IPv6-specific)
	ecn
	esp
	eui64 (IPv6-specific)
	frag (IPv6-specific)
	hashlimit
	hbh (IPv6-specific)
	helper
	hl (IPv6-specific)
	icmp (IPv4-specific)
	icmp6 (IPv6-specific)
	iprange
	ipv6header (IPv6-specific)
	ipvs
	length
	limit
	mac
	mark
	mh (IPv6-specific)
	multiport
	nfacct
	osf
	owner
	physdev
	pkttype
	policy
	quota
	rateest
	realm (IPv4-specific)
	recent
	rpfilter
	rt (IPv6-specific)
	sctp
	set
	socket
	state
	statistic
	string
	tcp
	tcpmss
	time
	tos
	ttl (IPv4-specific)
	u32
	udp
	unclean (IPv4-specific)

##### set

set模块监测是否命中ipset。ipset是用命令`ipset`管理的，可以查看:

	yum install -y ipset
	man ipset

##### mark



#### target modules

target modules是通过`-j modulename` 指定，标准的iptables中包括以下target modules:

	AUDIT
	CHECKSUM
	CLASSIFY
	CLUSTERIP (IPv4-specific)
	CONNMARK
	CONNSECMARK
	CT
	DNAT
	DNPT (IPv6-specific)
	DSCP
	ECN (IPv4-specific)
	HL (IPv6-specific)
	HMARK
	IDLETIMER
	LED
	LOG
	MARK
	MASQUERADE
	MIRROR (IPv4-specific)
	NETMAP
	NFLOG
	NFQUEUE
	NOTRACK
	RATEEST
	REDIRECT
	REJECT (IPv6-specific)
	REJECT (IPv4-specific)
	SAME (IPv4-specific)
	SECMARK
	SET
	SNAT
	SNPT (IPv6-specific)
	TCPMSS
	TCPOPTSTRIP
	TEE
	TOS
	TPROXY
	TRACE
	TTL (IPv4-specific)
	ULOG (IPv4-specific)

## 修改规则

`man iptables`。

追加、检查、删除规则：

	iptables [-t table] {-A|-C|-D} chain rule-specification    

插入规则:

	iptables [-t table] -I chain [rulenum] rule-specification

替换规则:

	iptables [-t table] -I chain [rulenum] rule-specification

插入和替换规则时，rule编号从1开始。

## 调试方法

iptables的日志信息是kernel日志，可以通过dmesg查看，为了方便，在/etc/(r)syslog.conf中配置一下，将kernal日志写到一个文件中：

	#在/etc/rsyslog.conf添加
	kern.=debug     /var/log/kern.debug.log

重启rsyslog:

	systemctl restart rsyslog

### 用LOG模块在任意位置打印报文

下面规则在本地发出的报文经过的每个检查点上都设置了日志:

	iptables -t raw -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "raw out: "
	iptables -t mangle -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "mangle out: "
	iptables -t nat -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "nat out: "
	iptables -t filter -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "filter out: "
	iptables -t mangle -A POSTROUTING -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "mangle post: "
	iptables -t nat -A POSTROUTING -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "nat post: "

>注意这里设置了--limit防止打印出太多的日志，--limit如果设置的太小，可能会恰好丢弃要观察的包的日志

执行命令“ping -c 1 3.3.3.3”，然后查看iptables的日志记录：

	$cat /var/log/kern.debug.log  |grep 3.3.3.3
	Mar 31 05:48:29 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: mangle post: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: nat post: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1

从日志中可以看到，报文依次经过了raw out、mangle out、nat out、filter out、mangle out、nat post。

设置一条规则，在filter阶段丢弃到1.1.1.1的报文:

	iptables -t filter -A OUTPUT -d 1.1.1.1 -j DROP 

执行命令`ping -c 1.1.1.1`后，查看日志

	$cat /var/log/kern.debug.log  |grep 1.1.1.1
	Mar 31 06:10:02 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1

从日志中可以看到，发送到1.1.1.1的报文到达filter表的OUTPUT规则后就终止了。

设置一条规则nat规则:

	iptables -t nat -A OUTPUT -d 2.2.2.2 -j DNAT  --to-destination 8.8.8.8

｀ping -c 2.2.2.2`之后，可以看到下面的日志:

	$cat /var/log/kern.debug.log |grep 2.2.2.2
	Mar 31 06:12:38 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	
	$ cat /var/log/kern.debug.log |grep 8.8.8.8
	Mar 31 06:12:38 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: mangle post: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: nat post: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1

从日志中可以看到，报文经过nat表的OUTPUT规则时进行了DNAT，然后使用新的DST地址经过filter的OUTPUT规则直到发送出。

### 用TRACE模块进行全程跟踪

更多调试方法[Linux网络调试：iptables规则、连接跟踪表、报文跟踪][10]

## 应用

### 使用iptables做通信数据劫持

被劫持机:

	ip: 192.168.1.10
	netmask: 255.255.255.0
	gateway: 192.168.1.1

劫持机有两个网卡eth0和eth1

	eth0:  内网口, 接入被劫持机
		ip: 192.168.1.1
		netmask: 255.255.255.0
	
	eth1:  外网口, 接入外网
		ip: 172.19.1.10
		netmask: 255.255.255.0
		gateway: 172.19.1.1
		dns: 172.19.1.1

在劫持机上配置规则:

	eth1发出的源IP为192.168.1.10的包，源地址被改写为172.19.1.10
		iptables -t nat -A POSTROUTING -o eth1 -s 192.168.1.10 -j SNAT --to 172.19.1.10

	eth1接收的目的地址为172.19.1.10的包，目的地址被改写为192.168.1.10
		iptables -t nat -A PREROUTING -i eth1 -d 172.19.1.10 -j DNAT --to 192.168.1.10

## iptables-extensions

iptables-extensions由多个mach module和多个target module组成，每个module都有自己的参数。

在`man iptables-extensions`中可以看到所有的支持的module。

#### match module

通过`-m name [module-options...]`指定，标准的iptables包括下列match module:

	addrtype
	ah (IPv6-specific)
	ah (IPv4-specific)
	bpf
	cgroup
	cluster
	comment
	connbytes
	connlabel
	connlimit
	connmark
	conntrack
	cpu
	dccp
	devgroup
	dscp
	dst (IPv6-specific)
	ecn
	esp
	eui64 (IPv6-specific)
	frag (IPv6-specific)
	hashlimit
	hbh (IPv6-specific)
	helper
	hl (IPv6-specific)
	icmp (IPv4-specific)
	icmp6 (IPv6-specific)
	iprange
	ipv6header (IPv6-specific)
	ipvs
	length
	limit
	mac
	mark
	mh (IPv6-specific)
	multiport
	nfacct
	osf
	owner
	physdev
	pkttype
	policy
	quota
	rateest
	realm (IPv4-specific)
	recent
	rpfilter
	rt (IPv6-specific)
	sctp
	set
	socket
	state
	statistic
	string
	tcp
	tcpmss
	time
	tos
	ttl (IPv4-specific)
	u32
	udp
	unclean (IPv4-specific)

##### set

set模块监测是否命中ipset。ipset是用命令`ipset`管理的，可以查看:

	yum install -y ipset
	man ipset

##### mark



#### target modules

target modules是通过`-j modulename` 指定，标准的iptables中包括以下target modules:

	AUDIT
	CHECKSUM
	CLASSIFY
	CLUSTERIP (IPv4-specific)
	CONNMARK
	CONNSECMARK
	CT
	DNAT
	DNPT (IPv6-specific)
	DSCP
	ECN (IPv4-specific)
	HL (IPv6-specific)
	HMARK
	IDLETIMER
	LED
	LOG
	MARK
	MASQUERADE
	MIRROR (IPv4-specific)
	NETMAP
	NFLOG
	NFQUEUE
	NOTRACK
	RATEEST
	REDIRECT
	REJECT (IPv6-specific)
	REJECT (IPv4-specific)
	SAME (IPv4-specific)
	SECMARK
	SET
	SNAT
	SNPT (IPv6-specific)
	TCPMSS
	TCPOPTSTRIP
	TEE
	TOS
	TPROXY
	TRACE
	TTL (IPv4-specific)
	ULOG (IPv4-specific)

## 修改规则

`man iptables`。

追加、检查、删除规则：

	iptables [-t table] {-A|-C|-D} chain rule-specification    

插入规则:

	iptables [-t table] -I chain [rulenum] rule-specification

替换规则:

	iptables [-t table] -I chain [rulenum] rule-specification

插入和替换规则时，rule编号从1开始。

## 调试方法

iptables的日志信息是kernel日志，可以通过dmesg查看，为了方便，在/etc/(r)syslog.conf中配置一下，将kernal日志写到一个文件中：

	#在/etc/rsyslog.conf添加
	kern.=debug     /var/log/kern.debug.log

重启rsyslog:

	systemctl restart rsyslog

### 用LOG模块在任意位置打印报文

下面规则在本地发出的报文经过的每个检查点上都设置了日志:

	iptables -t raw -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "raw out: "
	iptables -t mangle -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "mangle out: "
	iptables -t nat -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "nat out: "
	iptables -t filter -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "filter out: "
	iptables -t mangle -A POSTROUTING -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "mangle post: "
	iptables -t nat -A POSTROUTING -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "nat post: "

>注意这里设置了--limit防止打印出太多的日志，--limit如果设置的太小，可能会恰好丢弃要观察的包的日志

执行命令“ping -c 1 3.3.3.3”，然后查看iptables的日志记录：

	$cat /var/log/kern.debug.log  |grep 3.3.3.3
	Mar 31 05:48:29 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: mangle post: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: nat post: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1

从日志中可以看到，报文依次经过了raw out、mangle out、nat out、filter out、mangle out、nat post。

设置一条规则，在filter阶段丢弃到1.1.1.1的报文:

	iptables -t filter -A OUTPUT -d 1.1.1.1 -j DROP 

执行命令`ping -c 1.1.1.1`后，查看日志

	$cat /var/log/kern.debug.log  |grep 1.1.1.1
	Mar 31 06:10:02 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1

从日志中可以看到，发送到1.1.1.1的报文到达filter表的OUTPUT规则后就终止了。

设置一条规则nat规则:

	iptables -t nat -A OUTPUT -d 2.2.2.2 -j DNAT  --to-destination 8.8.8.8

｀ping -c 2.2.2.2`之后，可以看到下面的日志:

	$cat /var/log/kern.debug.log |grep 2.2.2.2
	Mar 31 06:12:38 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	
	$ cat /var/log/kern.debug.log |grep 8.8.8.8
	Mar 31 06:12:38 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: mangle post: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: nat post: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1

从日志中可以看到，报文经过nat表的OUTPUT规则时进行了DNAT，然后使用新的DST地址经过filter的OUTPUT规则直到发送出。

### 用TRACE模块进行全程跟踪

更多调试方法[Linux网络调试：iptables规则、连接跟踪表、报文跟踪][10]

## 应用

### 使用iptables做通信数据劫持

被劫持机:

	ip: 192.168.1.10
	netmask: 255.255.255.0
	gateway: 192.168.1.1

劫持机有两个网卡eth0和eth1

	eth0:  内网口, 接入被劫持机
		ip: 192.168.1.1
		netmask: 255.255.255.0
	
	eth1:  外网口, 接入外网
		ip: 172.19.1.10
		netmask: 255.255.255.0
		gateway: 172.19.1.1
		dns: 172.19.1.1

在劫持机上配置规则:

	eth1发出的源IP为192.168.1.10的包，源地址被改写为172.19.1.10
		iptables -t nat -A POSTROUTING -o eth1 -s 192.168.1.10 -j SNAT --to 172.19.1.10

	eth1接收的目的地址为172.19.1.10的包，目的地址被改写为192.168.1.10
		iptables -t nat -A PREROUTING -i eth1 -d 172.19.1.10 -j DNAT --to 192.168.1.10

## iptables-extensions

iptables-extensions由多个mach module和多个target module组成，每个module都有自己的参数。

在`man iptables-extensions`中可以看到所有的支持的module。

#### match module

通过`-m name [module-options...]`指定，标准的iptables包括下列match module:

	addrtype
	ah (IPv6-specific)
	ah (IPv4-specific)
	bpf
	cgroup
	cluster
	comment
	connbytes
	connlabel
	connlimit
	connmark
	conntrack
	cpu
	dccp
	devgroup
	dscp
	dst (IPv6-specific)
	ecn
	esp
	eui64 (IPv6-specific)
	frag (IPv6-specific)
	hashlimit
	hbh (IPv6-specific)
	helper
	hl (IPv6-specific)
	icmp (IPv4-specific)
	icmp6 (IPv6-specific)
	iprange
	ipv6header (IPv6-specific)
	ipvs
	length
	limit
	mac
	mark
	mh (IPv6-specific)
	multiport
	nfacct
	osf
	owner
	physdev
	pkttype
	policy
	quota
	rateest
	realm (IPv4-specific)
	recent
	rpfilter
	rt (IPv6-specific)
	sctp
	set
	socket
	state
	statistic
	string
	tcp
	tcpmss
	time
	tos
	ttl (IPv4-specific)
	u32
	udp
	unclean (IPv4-specific)

##### set

set模块监测是否命中ipset。ipset是用命令`ipset`管理的，可以查看:

	yum install -y ipset
	man ipset

##### mark

#### target modules

target modules是通过`-j modulename` 指定，标准的iptables中包括以下target modules:

	AUDIT
	CHECKSUM
	CLASSIFY
	CLUSTERIP (IPv4-specific)
	CONNMARK
	CONNSECMARK
	CT
	DNAT
	DNPT (IPv6-specific)
	DSCP
	ECN (IPv4-specific)
	HL (IPv6-specific)
	HMARK
	IDLETIMER
	LED
	LOG
	MARK
	MASQUERADE
	MIRROR (IPv4-specific)
	NETMAP
	NFLOG
	NFQUEUE
	NOTRACK
	RATEEST
	REDIRECT
	REJECT (IPv6-specific)
	REJECT (IPv4-specific)
	SAME (IPv4-specific)
	SECMARK
	SET
	SNAT
	SNPT (IPv6-specific)
	TCPMSS
	TCPOPTSTRIP
	TEE
	TOS
	TPROXY
	TRACE
	TTL (IPv4-specific)
	ULOG (IPv4-specific)

## 修改规则

`man iptables`。

追加、检查、删除规则：

	iptables [-t table] {-A|-C|-D} chain rule-specification    

插入规则:

	iptables [-t table] -I chain [rulenum] rule-specification

替换规则:

	iptables [-t table] -I chain [rulenum] rule-specification

插入和替换规则时，rule编号从1开始。

## 调试方法

iptables的日志信息是kernel日志，可以通过dmesg查看，为了方便，在/etc/(r)syslog.conf中配置一下，将kernal日志写到一个文件中：

	#在/etc/rsyslog.conf添加
	kern.=debug     /var/log/kern.debug.log

重启rsyslog:

	systemctl restart rsyslog

### 用LOG模块在任意位置打印报文

下面规则在本地发出的报文经过的每个检查点上都设置了日志:

	iptables -t raw -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "raw out: "
	iptables -t mangle -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "mangle out: "
	iptables -t nat -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "nat out: "
	iptables -t filter -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "filter out: "
	iptables -t mangle -A POSTROUTING -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "mangle post: "
	iptables -t nat -A POSTROUTING -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "nat post: "

>注意这里设置了--limit防止打印出太多的日志，--limit如果设置的太小，可能会恰好丢弃要观察的包的日志

执行命令“ping -c 1 3.3.3.3”，然后查看iptables的日志记录：

	$cat /var/log/kern.debug.log  |grep 3.3.3.3
	Mar 31 05:48:29 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: mangle post: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
	Mar 31 05:48:29 compile kernel: nat post: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1

从日志中可以看到，报文依次经过了raw out、mangle out、nat out、filter out、mangle out、nat post。

设置一条规则，在filter阶段丢弃到1.1.1.1的报文:

	iptables -t filter -A OUTPUT -d 1.1.1.1 -j DROP 

执行命令`ping -c 1.1.1.1`后，查看日志

	$cat /var/log/kern.debug.log  |grep 1.1.1.1
	Mar 31 06:10:02 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
	Mar 31 06:10:02 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1

从日志中可以看到，发送到1.1.1.1的报文到达filter表的OUTPUT规则后就终止了。

设置一条规则nat规则:

	iptables -t nat -A OUTPUT -d 2.2.2.2 -j DNAT  --to-destination 8.8.8.8

｀ping -c 2.2.2.2`之后，可以看到下面的日志:

	$cat /var/log/kern.debug.log |grep 2.2.2.2
	Mar 31 06:12:38 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	
	$ cat /var/log/kern.debug.log |grep 8.8.8.8
	Mar 31 06:12:38 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: mangle post: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
	Mar 31 06:12:38 compile kernel: nat post: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1

从日志中可以看到，报文经过nat表的OUTPUT规则时进行了DNAT，然后使用新的DST地址经过filter的OUTPUT规则直到发送出。

### 用TRACE模块进行全程跟踪

更多调试方法[Linux网络调试：iptables规则、连接跟踪表、报文跟踪][10]

## 应用

### 使用iptables做通信数据劫持

被劫持机:

	ip: 192.168.1.10
	netmask: 255.255.255.0
	gateway: 192.168.1.1

劫持机有两个网卡eth0和eth1

	eth0:  内网口, 接入被劫持机
		ip: 192.168.1.1
		netmask: 255.255.255.0
	
	eth1:  外网口, 接入外网
		ip: 172.19.1.10
		netmask: 255.255.255.0
		gateway: 172.19.1.1
		dns: 172.19.1.1

在劫持机上配置规则:

	eth1发出的源IP为192.168.1.10的包，源地址被改写为172.19.1.10
		iptables -t nat -A POSTROUTING -o eth1 -s 192.168.1.10 -j SNAT --to 172.19.1.10

	eth1接收的目的地址为172.19.1.10的包，目的地址被改写为192.168.1.10
		iptables -t nat -A PREROUTING -i eth1 -d 172.19.1.10 -j DNAT --to 192.168.1.10

## 参考

1. man iptables
2. [sturcture of iptables][2]
3. [利用raw表实现iptables调试][3]
4. [iptables-debugging][4]
5. [iptables-contents][5]
6. man iptables-extensions
7. [target REDIRECT][7]
8. [Iptables Tutorial 1.2.2][8]
9. [netfilter][9]
10. [使用TRACE模块对报文进行全程跟踪][10]
11. [20条IPTables防火墙规则用法！][11]

[2]: http://www.iptables.info/en/structure-of-iptables.html "structure-of-iptables"
[3]: http://flymanhi.blog.51cto.com/1011558/1276331 "利用raw表实现iptables调试"
[4]: http://adminberlin.de/iptables-debugging/ "iptables-debugging"
[5]: http://www.iptables.info/en/iptables-contents.html "iptables-contents"
[7]: https://www.frozentux.net/iptables-tutorial/chunkyhtml/x4529.html "target REDIRECT"
[8]: https://www.frozentux.net/iptables-tutorial/iptables-tutorial.html "Iptables Tutorial 1.2.2"
[9]: https://www.netfilter.org/projects/iptables/index.html "netfilter"
[10]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/06/15/debug-linux-network.html#%E4%BD%BF%E7%94%A8trace%E6%A8%A1%E5%9D%97%E5%AF%B9%E6%8A%A5%E6%96%87%E8%BF%9B%E8%A1%8C%E5%85%A8%E7%A8%8B%E8%B7%9F%E8%B8%AA "使用TRACE模块对报文进行全程跟踪"
[11]: https://www.cnblogs.com/linuxprobe/p/5643684.html "20条IPTables防火墙规则用法！"
