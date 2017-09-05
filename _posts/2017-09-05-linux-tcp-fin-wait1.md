---
layout: default
title: 服务器存在较多的FIN_WAIT1和TIME_WAIT状态的连接
author: lijiaocn
createdate: 2017/09/05 17:08:50
changedate: 2017/09/05 18:34:02
categories: 问题
tags: linuxnet
keywords: FIN_WAIT1,tcp,linux
description: 发现linux服务器上的FIN_WAIT1状态的连接持续很长时间

---

* auto-gen TOC:
{:toc}

## 现象 

发现linux服务器上的FIN_WAIT1状态的连接持续很长时间。

	$netstat -nat|awk '{print awk $NF}'|sort|uniq -c|sort -n
	      1 CLOSE_WAIT
	      1 FIN_WAIT2
	      1 State
	      1 established)
	      3 LAST_ACK
	     30 FIN_WAIT1
	    151 LISTEN
	    280 TIME_WAIT
	   1548 ESTABLISHED

## FIN_WAIT1的解决

有三个内核参数会影响到FIN_WAIT1状态的连接的存在：`tcp_max_orphans`，`tcp_retries2`，`tcp_orphan_retries`。

注意，参数`tcp_fin_timeout`对FIN_WAIT1状态的连接无影响，它设置的是FIN_WAIT2状态的等待时间。

将`tcp_orphan_retries`设置为1:

	echo "net.ipv4.tcp_orphan_retries=1" >> /etc/sysctl.conf
	sysctl -p

## TIME_WAIT的解决

按照TCP的协议TIME_WAIT等待的时间为2MSL，可以设置参数快速回收处于TIME_WAIT状态的socket。

	echo "net.ipv4.tcp_tw_reuse=1"   >>/etc/sysctl.conf
	echo "net.ipv4.tcp_tw_recycle=1" >>/etc/sysctl.conf
	sysctl -p

## 附录：参数说明

[linux上TCP连接的状态、超时时间和状态观察][1]中有更详细的介绍，这里只摘取了一部分。

### tcp_tw_recycle

开启tcp连接中TIME-WAIT的socket的快速回收功能，默认为0，表示关闭。

注: 内核文档没有介绍这个参数.

### tcp_tw_reuse

	Allow to reuse TIME-WAIT sockets for new connections when it is
	safe from protocol viewpoint. Default value is 0.
	It should not be changed without advice/request of technical
	experts.

允许重用位于TIME-WAIT状态的socket，默认关闭。

注意：打开这个选项，可以减少TIME-WAIT状态的连接。

### tcp_max_orphans

	Maximal number of TCP sockets not attached to any user file handle,
	held by system.	If this number is exceeded orphaned connections are
	reset immediately and warning is printed. This limit exists
	only to prevent simple DoS attacks, you _must_ not rely on this
	or lower the limit artificially, but rather increase it
	(probably, after increasing installed memory),
	if network conditions require more than default value,
	and tune network services to linger and kill such states
	more aggressively. Let me to remind again: each orphan eats
	up to ~64K of unswappable memory.

### tcp_retries2

	This value influences the timeout of an alive TCP connection,
	when RTO retransmissions remain unacknowledged.
	Given a value of N, a hypothetical TCP connection following
	exponential backoff with an initial RTO of TCP_RTO_MIN would
	retransmit N times before killing the connection at the (N+1)th RTO.

	The default value of 15 yields a hypothetical timeout of 924.6
	seconds and is a lower bound for the effective timeout.
	TCP will effectively time out at the first RTO which exceeds the
	hypothetical timeout.

	RFC 1122 recommends at least 100 seconds for the timeout,
	which corresponds to a value of at least 8.

### tcp_orphan_retries

	This value influences the timeout of a locally closed TCP connection,
	when RTO retransmissions remain unacknowledged.
	See tcp_retries2 for more details.
	
	The default value is 8.
	If your machine is a loaded WEB server,
	you should think about lowering this value, such sockets
	may consume significant resources. Cf. tcp_max_orphans.

注意： 0表示默认值，也就是8。

	/* Calculate maximal number or retries on an orphaned socket. */
	static int tcp_orphan_retries(struct sock *sk, int alive)
	{
	         int retries = sysctl_tcp_orphan_retries; /* May be zero. */
	 
	         /* We know from an ICMP that something is wrong. */
	         if (sk->sk_err_soft && !alive)
	                 retries = 0;
	 
	         /* However, if socket sent something recently, select some safe
	          * number of retries. 8 corresponds to >100 seconds with minimal
	          * RTO of 200msec. */
	         if (retries == 0 && alive)
	                 retries = 8;
	         return retries;
	}

## 参考

1. [linux上TCP连接的状态、超时时间和状态观察][1]
2. [What does tcp_orphan_retries set to 0 mean?][2]

[1]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/09/04/linux-net-tcp.html  "linux上TCP连接的状态、超时时间和状态观察" 
[2]: https://serverfault.com/questions/274212/what-does-tcp-orphan-retries-set-to-0-mean/408882#408882 "What does tcp_orphan_retries set to 0 mean?"
