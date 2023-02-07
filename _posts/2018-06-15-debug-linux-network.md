---
layout: default
title: "Linux网络调试: iptables规则、连接跟踪表、报文跟踪"
author: 李佶澳
createdate: 2018/06/15 10:23:00
last_modified_at: 2018/09/01 15:27:24
categories: 技巧
tags: linux
keywords: linux iptables conntrack debuging 网络调试
description: 突然发现，一直没有掌握一套行之有效的调试iptables规则、追踪linux上的连接、报文的方法

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

在调查[kubernetes的node上的重启linux网络服务后，pod无法联通][1]的问题时，突然发现，没有掌握一套行之有效的调试linux网络的方法，诸如iptables规则、连接跟踪表以及跟踪报文的方法。

## 在iptables中追踪报文 -- iptables

相关笔记：

[iptables：Linux的iptables使用](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2014/04/16/linux-net-iptables.html#%E7%94%A8log%E6%A8%A1%E5%9D%97%E5%9C%A8%E4%BB%BB%E6%84%8F%E4%BD%8D%E7%BD%AE%E6%89%93%E5%8D%B0%E6%8A%A5%E6%96%87)

### 使用LOG模块在任意位置打印报文信息 

[linux的iptables使用][2]中介绍了一种调试方法：使用`LOG`模块打印日志

	#在/etc/rsyslog.conf添加
	kern.=debug     /var/log/kern.debug.log

>可能需要手动创建文件/var/log/kern.debug.log

重启rsyslog:

	touch /var/log/kern.debug.log
	systemctl restart rsyslog

之后可以添加如下的iptables规则，当报文到达该规则时，会在/var/log/kern.debug.log中打印出日志：

	iptables -t raw -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "raw out: "

打印出来的日志如下：

	Jun 13 19:58:21 dev-slave-110 kernel: raw prerouting: IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=13629 SEQ=15

和其它iptables一样，也可以添加IP、端口等条件：

	iptables -t raw -A PREROUTING -p icmp -s 8.8.8.8/32 -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "mangle prerouting: "

[iptables：Linux的iptables使用][6]中有更多使用示例。

### 使用TRACE模块对报文进行全程跟踪

>TRACE只能在raw表中使用

[netfilter/iptables/conntrack debugging][3]中给出了另一个方法，通过`-j TRACE`

	iptables -t raw -A PREROUTING -p icmp -s 8.8.8.8/32 -j TRACE

在`man iptables-extensions`中可以找到对`TRACE`的介绍：

	This target marks packets so that the kernel will log every rule which match
	the packets as those traverse the tables, chains, rules.

TRACE模块会在符合规则的报文上打上标记，将该报文经过的每一条规则打印出来，很方便的对报文做全程跟踪。`TRACE模块只能在raw表中使用`，还需要加载内核模块：

	modprobe ipt_LOG ip6t_LOG nfnetlink_log

之后可以通过`dmesg`，或者在/var/log/message中查看到匹配的报文的日志：

	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:PREROUTING:rule:2 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:rule:1 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:rule:3 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-from-host-endpoint:return:1 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:return:5 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24

## 查看连接跟踪表 -- conntrack

安装：

	yum install -y conntrack-tools

使用：

	$ conntrack -h
	Command line interface for the connection tracking system. Version 1.4.4
	Usage: conntrack [commands] [options]
	
	Commands:
	  -L [table] [options]        List conntrack or expectation table
	  -G [table] parameters       Get conntrack or expectation
	  -D [table] parameters       Delete conntrack or expectation
	  -I [table] parameters       Create a conntrack or expectation
	  -U [table] parameters       Update a conntrack
	  -E [table] [options]        Show events
	  -F [table]            Flush table
	  -C [table]            Show counter
	  -S                    Show statis

连接跟踪表的参数可以在kernel文档`Documentation/networking/nf_conntrack-sysctl.txt`中找到。

## 参考

1. [kubernetes的node上的重启linux网络服务后，pod无法联通][1]
2. [linux的iptables使用-调试方法][2]
3. [netfilter/iptables/conntrack debugging][3]
4. [nftables HOWTO][4]
5. [利用raw表实现iptables调试][5]
6. [iptables：Linux的iptables使用][6]

[1]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/06/12/Kubernetes-network-restart-not-avalible.html "kubernetes的node上的重启linux网络服务后，pod无法联通" 
[2]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2014/04/16/linux-net-iptables.html#%E8%B0%83%E8%AF%95%E6%96%B9%E6%B3%95 "linux的iptables使用-调试方法"
[3]: https://strlen.de/talks/nfdebug.pdf "netfilter/iptables/conntrack debugging"
[4]: https://wiki.nftables.org/wiki-nftables/index.php/Main_Page "nftables HOWTO"
[5]: http://www.360doc.com/content/14/1009/11/2633_415482198.shtml "利用raw表实现iptables调试"
[6]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2014/04/16/linux-net-iptables.html#%E7%94%A8log%E6%A8%A1%E5%9D%97%E5%9C%A8%E4%BB%BB%E6%84%8F%E4%BD%8D%E7%BD%AE%E6%89%93%E5%8D%B0%E6%8A%A5%E6%96%87 "iptables：Linux的iptables使用"
