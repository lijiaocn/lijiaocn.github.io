---
layout: default
title: Linux内核参数用途记录
author: 李佶澳
createdate: 2018/11/26 16:14:00
last_modified_at: 2018/11/26 16:14:00
categories: 技巧
tags: linux
keywords: kernel,linux,获取知识,documention
description: 这里记录一下实际工作中遇到的一些内核参数，每了解一个参数，就过来记录一笔

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这里记录一下实际工作中遇到的一些内核参数，每了解一个参数，就过来记录一笔。

[怎样获取Linux kernel相关的知识？Linux内核文档汇总][1]中收集了一些文档。

## rp_filter

[ip-sysctl.txt][2]中对rp_filter参数有说明：

	rp_filter - INTEGER
		0 - No source validation.
		1 - Strict mode as defined in RFC3704 Strict Reverse Path
		    Each incoming packet is tested against the FIB and if the interface
		    is not the best reverse path the packet check will fail.
		    By default failed packets are discarded.
		2 - Loose mode as defined in RFC3704 Loose Reverse Path
		    Each incoming packet's source address is also tested against the FIB
		    and if the source address is not reachable via any interface
		    the packet check will fail.
		
		Current recommended practice in RFC3704 is to enable strict mode
		to prevent IP spoofing from DDos attacks. If using asymmetric routing
		or other complicated routing, then loose mode is recommended.
		
		The max value from conf/{all,interface}/rp_filter is used
		when doing source validation on the {interface}.
		
		Default value is 0. Note that some distributions enable it
		in startup scripts.

[RFC2827](https://www.rfc-editor.org/info/rfc2827)（Network Ingress Filtering: Defeating Denial of Service Attacks which employ IP Source Address Spoofing）和[RFC3704](https://www.rfc-editor.org/info/rfc3704)(Ingress Filtering for Multihomed Networks)设置了一些包过滤规则，可以抵御“伪造源IP”方式的DOS攻击。

RFC2827中给出了一个用伪造源IP的方式进行DOS攻击的示意图：

	host <----- router <--- Internet <----- router <-- attacker
	
	         TCP/SYN
	     <---------------------------------------------
	           Source: 192.168.0.4/32
	SYN/ACK
	no route
	         TCP/SYN
	     <---------------------------------------------
	           Source: 10.0.0.13/32
	SYN/ACK
	no route
	         TCP/SYN
	     <---------------------------------------------
	           Source: 172.16.0.2/32
	SYN/ACK
	no route
	
	[etc.]

对于这种类型的攻击，如果源IP是伪造的、不可达，那么这种类型的报文可以在接收的时候，直接丢弃，不进入TCP握手过程。 但是如果伪造的源头IP是真实存在的IP，那么就不能简单地丢弃，这样会使正常的访问也受影响。

RFC2827提出的一种方法是，网络设备收到转发报文后，检查报文的源IP是否是正确，如果不是就丢弃，从源头上遏止伪造源IP的报文。

RFC3704中提出了多种实现方法，考虑到了多个网络段的情况。

`Ingress Access Lists`方法是直接配置过滤规则，每次收到报文时，检查源IP。

`Strict Reverse Path Forwarding`方法是到转发表Forwarding Information Base(FIB)中找到向源IP发送报文时使用的网卡，如果和收到报文的网卡是同一个网卡就放行，否则丢弃。

`Feasible Path Reverse Path Forwarding`是对Strict Reverse Path Forwarding的扩展，Strict Reverse Path Forwarding中只考虑最佳路由，这种方法会同时考虑其它发送报文的路径，更合理、宽松一些。

`Loose Reverse Path Forwarding`方法只检查是否存在到源IP的路由，只要存在路由就放行，即使是default路由。

`Loose Reverse Path Forwarding Ignoring Default Routes`方法也是只检查到源IP的路由，但是不考虑默认路由。

## arp_filter

[ip-systctl.txt][2]对apr_filter参数有说明：

	arp_filter - BOOLEAN
		1 - Allows you to have multiple network interfaces on the same
		subnet, and have the ARPs for each interface be answered
		based on whether or not the kernel would route a packet from
		the ARP'd IP out that interface (therefore you must use source
		based routing for this to work). In other words it allows control
		of which cards (usually 1) will respond to an arp request.
		
		0 - (default) The kernel can respond to arp requests with addresses
		from other interfaces. This may seem wrong but it usually makes
		sense, because it increases the chance of successful communication.
		IP addresses are owned by the complete host on Linux, not by
		particular interfaces. Only for more complex setups like load-
		balancing, does this behaviour cause problems.
		
		arp_filter for the interface will be enabled if at least one of
		conf/{all,interface}/arp_filter is set to TRUE,
		it will be disabled otherwise

当一台机器有多个位于同一个网段中的网卡，每个网卡都有各自IP，是否允许把一个网卡的MAC地址作为对另一个网卡的ARP请求的回应。

设置为0，表示允许，这样子就是其中一个网卡故障的了，报文可以被另一块网卡接收。

## 参考

1. [怎样获取Linux kernel相关的知识？Linux内核文档汇总][1]
2. [ip-sysctl.txt][2]

[1]: https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2017/11/13/howto-linux-kernel-doc.html  "怎样获取Linux kernel相关的知识？Linux内核文档汇总" 
[2]: https://www.kernel.org/doc/Documentation/networking/ip-sysctl.txt "ip-sysctl.txt"
