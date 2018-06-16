---
layout: default
title:  kubernetes的node上的重启linux网络服务后，pod无法联通
author: 李佶澳
createdate: 2018/06/12 11:25:00
changedate: 2018/06/16 18:16:45
categories: 问题
tags: kubernetes calico
keywords: kubernetes calico
description: 在node上重启网络(执行`systemctl restart network`)后，pod无法联通

---

* auto-gen TOC:
{:toc}

## 说明

以前合作的同事在实施过程遇到了这个问题，比较有意思，调查一下。

## 现象

在node上重启linux操作系统的网络服务：

	systemctl restart network

重启之后，从其它node上无法访问该node上的所有pod。

从该node上的pod中也无法访问任何外部地址：

	sh-4.2# ping www.baidu.com
	^C
	sh-4.2# ping 8.8.8.8
	PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.

kubernetes使用的网络方案是calico，node的操作系统是centos7。

## 排查

开始的时候发现，pod内容器arp记录丢失，重启calico-node后，arp记录被添加后，依然不通。

>重启network，不是一定会出现arp记录丢失的情况。

检查node上的网卡，也正常。

	# 容器内arp记录，mac地址是node上的calidc7f3a1b60c的mac。
	$ ip neigh
	169.254.1.1 dev eth0 lladdr 46:2a:0d:29:d1:eb REACHABLE

	# node上路由，送往192.168.4.25的报文经过calidc7f3a1b60c送出
	# ip route |grep 192.168.4.25
	192.168.4.25 dev calidc7f3a1b60c  scope link
	
	# ifconfig calidc7f3a1b60c
	calidc7f3a1b60c: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
	        inet6 fe80::442a:dff:fe29:d1eb  prefixlen 64  scopeid 0x20<link>
	        ether 46:2a:0d:29:d1:eb  txqueuelen 0  (Ethernet)
	        RX packets 0  bytes 0 (0.0 B)
	        RX errors 0  dropped 0  overruns 0  frame 0
	        TX packets 0  bytes 0 (0.0 B)
	        TX errors 0  dropped 0 overruns 0  carrier 0  collisions 0

在容器内`ping 8.8.8.8`，在node上对calidc7f3a1b60c抓包，能够看到从容器中发出的icmp报文，有去无回：

	# tcpdump -n -i  calidc7f3a1b60c host 8.8.8.8
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on calidc7f3a1b60c, link-type EN10MB (Ethernet), capture size 262144 bytes
	13:32:36.585366 IP 192.168.4.25 > 8.8.8.8: ICMP echo request, id 8996, seq 14, length 64
	13:32:37.585366 IP 192.168.4.25 > 8.8.8.8: ICMP echo request, id 8996, seq 15, length 64
	13:32:38.585356 IP 192.168.4.25 > 8.8.8.8: ICMP echo request, id 8996, seq 16, length 64
	13:32:40.851603 IP 192.168.4.25 > 8.8.8.8: ICMP echo request, id 9151, seq 1, length 64
	13:32:41.851353 IP 192.168.4.25 > 8.8.8.8: ICMP echo request, id 9151, seq 2, length 64

在node的eth0网卡上抓包，可以看到icmp报文有去有回：

	# tcpdump -n -i  eth0 host 8.8.8.8
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes
	13:43:11.428388 IP 10.39.0.110 > 8.8.8.8: ICMP echo request, id 14147, seq 36, length 64
	13:43:11.482462 IP 8.8.8.8 > 10.39.0.110: ICMP echo reply, id 14147, seq 36, length 64
	13:43:12.428369 IP 10.39.0.110 > 8.8.8.8: ICMP echo request, id 14147, seq 37, length 64
	13:43:12.482807 IP 8.8.8.8 > 10.39.0.110: ICMP echo reply, id 14147, seq 37, length 64

应当是回包没有被正确转换导致的。

在pod所在的node上可以ping通pod:

	# ping 192.168.4.25
	PING 192.168.4.25 (192.168.4.25) 56(84) bytes of data.
	64 bytes from 192.168.4.25: icmp_seq=1 ttl=64 time=0.092 ms
	64 bytes from 192.168.4.25: icmp_seq=2 ttl=64 time=0.073 ms
	64 bytes from 192.168.4.25: icmp_seq=3 ttl=64 time=0.115 ms

并且在pod中可以用tcpdump捕获到icmp报文。

在pod中可以ping通所在的node的IP，但是ping不通其它node的IP。

## 分析

从pod访问外部的报文时，最后一步是MASQUERADE：

	-A cali-nat-outgoing -m comment --comment "cali:Wd76s91357Uv7N3v" -m set --match-set cali4-masq-ipam-pools src -m set ! --match-set cali4-all-ipam-pools dst -j MASQUERADE

在node上用tcpdump抓包时，获取的报文的源地址已经被转换成为node的地址。

如果直接在caliXXXX网卡上抓包，可以看到MASQUERADE之前的报文，源地址没有被改变，但是看不到回应报文。

所以可以确定：`回应包到达了node，却没能到达pod`。

通过调试iptables发现，8.8.8.8的回应报文，在mangle表PREROUTING链中被接受“accept”：

>调试前先关停了node上的calico和kube-proxy，防止它们更新iptables。

	*raw
	-A PREROUTING -p icmp -s 8.8.8.8/32  -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "raw prerouting: "
	...
	-A cali-PREROUTING -p icmp -s 8.8.8.8/32 -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "raw accept: "
	-A cali-PREROUTING -m comment --comment "cali:VX8l4jKL9w89GXz5" -m mark --mark 0x1000000/0x1000000 -j ACCEPT

	*mangle
	...
	-A PREROUTING -p icmp -s 8.8.8.8/32 -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "mangle prerouting: "
	-A PREROUTING -m comment --comment "cali:6gwbT8clXdHdC1b1" -j cali-PREROUTING
	-A cali-PREROUTING -p icmp -s 8.8.8.8/32  -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "mangle before cali-PREROUTING: "
	-A cali-PREROUTING -p icmp -s 8.8.8.8/32  -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "mangle accept start: "
	-A cali-PREROUTING -m comment --comment "cali:6BJqBjBC7crtA-7-" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
	-A cali-PREROUTING -p icmp -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "mangle not accept: "

从日志信息中能够看到“mangle accept start”，看不到“mangle not accept”，因此报文在下面这条规则中被接受：

	-A cali-PREROUTING -m comment --comment "cali:6BJqBjBC7crtA-7-" -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT

在nat表中添加调试规则：

	-A PREROUTING -p icmp -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "nat prerouting start: "
	-A PREROUTING -m comment --comment "cali:6gwbT8clXdHdC1b1" -j cali-PREROUTING
	-A PREROUTING -p icmp -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "nat prerouting end: "

没有输出nat表的日志，即报文被accept之后，不再经过后续规则。

回应包经过iptables时的日志：

	Jun 13 11:22:44 dev-slave-110 kernel: mangle accept start: IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 
	SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=6560 SEQ=1497

因此问题很可能存在于linux的连接跟踪表。

## 进一步分析

在mangle表中继续添加调试规则：

	*mangle
	...
	-A FORWARD -p icmp -s 8.8.8.8/32 -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "mangle forward: "
	-A PREROUTING -p icmp -s 8.8.8.8/32 -m limit --limit 500/minute -j LOG --log-level 7 --log-prefix "mangle prerouting: "

	...

然后继续在容器内ping，日志如下：

	Jun 13 19:58:21 dev-slave-110 kernel: raw prerouting: IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=13629 SEQ=15
	Jun 13 19:58:21 dev-slave-110 kernel: raw accept: IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=13629 SEQ=15
	Jun 13 19:58:21 dev-slave-110 kernel: mangle prerouting: IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=13629 SEQ=15
	Jun 13 19:58:21 dev-slave-110 kernel: mangle before cali-PREROUTINGIN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=13629 SEQ=15
	Jun 13 19:58:21 dev-slave-110 kernel: mangle accept start: IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=13629 SEQ=15

注意日志在`mangle accept start`以后就没有了。

在一个正常的node（没有重启network）上，进行调试发现明显不同：

	...
	Jun 13 20:07:48 dev-slave-107 kernel: raw prerouting: IN=eth0 OUT= MAC=52:54:31:1e:e1:d9:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.107 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=8554 SEQ=10
	Jun 13 20:07:48 dev-slave-107 kernel: raw accept: IN=eth0 OUT= MAC=52:54:31:1e:e1:d9:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.107 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=8554 SEQ=10
	Jun 13 20:07:48 dev-slave-107 kernel: mangle prerouting: IN=eth0 OUT= MAC=52:54:31:1e:e1:d9:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.107 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=8554 SEQ=10
	Jun 13 20:07:48 dev-slave-107 kernel: mangle accept start: IN=eth0 OUT= MAC=52:54:31:1e:e1:d9:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.107 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=8554 SEQ=10
	Jun 13 20:07:48 dev-slave-107 kernel: mangle forward: IN=eth0 OUT=cali91dded39638 MAC=52:54:31:1e:e1:d9:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=192.168.54.50 LEN=84 TOS=0x00 PREC=0x00 TTL=31 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=8554 SEQ=10

在正常的node上打印出了`mangle forward`日志，并且报文目的地址被修改为了Pod的地址。

而在network被重启、pod无法ping通外部的node上，没有`mangle foward`这条日志，也就是说`回应包没有被转发`。

查看linux的路由转发功能：

	$ cat /proc/sys/net/ipv4/ip_forward
	0

问题找到了！网络重启后，转发功能被关闭了。

开始转发功能后，问题解决：

	echo "1">/proc/sys/net/ipv4/ip_forward

永久配置转发功能，在`/etc/sysctl.conf`中添加下面一行：

	net.ipv4.ip_forward=1

执行`sysctl -p`。

## 其它调试方法

使用[Linux的iptables规则调试、连接跟踪、报文跟踪][1]中提供的方式，调试更方便，但只能在RAW表中使用，在RAW表中添加规则：

	-A PREROUTING -p icmp -s 8.8.8.8/32 -j TRACE

之后/var/log/message中可以看到报文日志：

	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:PREROUTING:rule:2 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:rule:1 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:rule:3 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-from-host-endpoint:return:1 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
	Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:return:5 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24

## 参考

1. [Linux的iptables规则调试、连接跟踪、报文跟踪][1]

[1]: http://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2018/06/15/debug-linux-network.html  "Linux的iptables规则调试、连接跟踪、报文跟踪" 
