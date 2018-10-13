---
layout: default
title: "VRRP协议，IPVS以及用KeepAlived实现高可用和负载均衡"
author: 李佶澳
createdate: "2018-10-11 12:44:06 +0800"
changedate: "2018-10-11 12:44:06 +0800"
categories: 技巧
tags: keepalived
keywords: vrrp,keepalived,高可用,vip
description: vrrp是用来实现网络高可用的虚拟路由冗余协议，通常通过keepalived设置
---

* auto-gen TOC:
{:toc}

## 说明

[VRRP][1]是用来实现高可用的网络协议，全称是`Virtual Router Redundancy Protocol`（虚拟机路由冗余协议）。
VRRP可以在网络设备之间运行，也可以在服务器之间运行（借助keepalived等软件）。

[IPVS][4]的全称是`IP Virtual Server`（IP虚拟服务器），字面意思就是从IP视角上，将多个实际的服务器合并成一个虚拟的服务器。
IPVS将发送到虚拟机服务器的TCP和UDP报文，转发给后端的真实服务器。IPVS集成到了[LVS][3]中，是负载均衡功能的一种实现。

Keepalived的功能有两个：一个是支持VRRPv2和VRRPv3协议，用来实现高可用；另一个是通过IPVS实现负载均衡。

通常使用keepalived设置两台或者多台服务器之间的VRRP协议，使vip在多个服务器上自动漂移。

## Vrrp协议简单了解

[RFC5788: Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, March 2010][1]是VRRP协议标准。

VRRP协议是IP层之上的协议，下面是[rfc5798.txt][2]中给出的vrrp报文格式：

	   This section defines the format of the VRRP packet and the relevant
	   fields in the IP header.
	
	     0                   1                   2                   3
	     0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
	    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	    |                    IPv4 Fields or IPv6 Fields                 |
	   ...                                                             ...
	    |                                                               |
	    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	    |Version| Type  | Virtual Rtr ID|   Priority    |Count IPvX Addr|
	    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	    |(rsvd) |     Max Adver Int     |          Checksum             |
	    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
	    |                                                               |
	    +                                                               +
	    |                       IPvX Address(es)                        |
	    +                                                               +
	    +                                                               +
	    +                                                               +
	    +                                                               +
	    |                                                               |
	    +                                                               +
	    |                                                               |
	    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

以后有时间再来补充vrrp的协议细节，想了解的可以直接阅读[rfc5798.txt][2]。

## IPVS简单了解

IPVS是集成到kernel中的功能，[Kernel Documents: ipvs-sysctl.txt][5]列出了相关的内核参数。

但是要使用IPVS，还需要安装一个管理工具ipvsadm：

	yum install -y ipvsadm

具体使用方法，参考：[ipvs的使用][6]。

## 安装keepalived

	yum install -y  keepalived

keepalived的配置文件是： /etc/keepalived/keepalived.conf。

配置文件由三大部分组成（详情见`man keepalived.conf`）：

	GLOBAL CONFIGURATION contains subblocks of:
	    Global definitions
	    Static routes
	    Static rules
	
	VRRPD CONFIGURATION contains subblocks of:
	    VRRP script(s)
	    VRRP synchronization group(s)
	    VRRP gratuitous ARP and unsolicited neighbour advert delay group(s) 
	    VRRP instance(s)
	
	LVS CONFIGURATION contains subblocks of
	    Virtual server group(s)
	    Virtual server(s)

## VRRPD配置例子1：

两台服务器的IP分别是192.168.192.37（默认是master）、192.168.193.38（默认是backup）。
可以在这两台机器上漂移的VIP是172.10.10.12。

                  _|_
                  \ /
             +-----'-----+            +-----------+         VIP:172.10.10.2
             |   VIP     | keepalived |   VIP     |
             |   LVS1    +------------+   LVS2    |
             |  Master   |            |   Backup  |
             +-----------+            +-----------+
            192.168.192.37            192.168.192.38

## 参考

1. [RFC5788: Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, March 2010][1]
2. [rfc5798.txt][2]
3. [What is the Linux Virtual Server?][3]
4. [IP Virtual Server][4]
5. [Kernel Documents: ipvs-sysctl.txt][5]
6. [ipvs的使用][6]

[1]: https://www.rfc-editor.org/info/rfc5798 "RFC5788: Virtual Router Redundancy Protocol (VRRP) Version 3 for IPv4 and IPv6, March 2010"
[2]: https://www.rfc-editor.org/rfc/rfc5798.txt  "rfc5798.txt"
[3]: http://www.linuxvirtualserver.org/ "What is the Linux Virtual Server?"
[4]: https://en.wikipedia.org/wiki/IP_Virtual_Server "IP Virtual Server"
[5]: https://github.com/torvalds/linux/blob/master/Documentation/networking/ipvs-sysctl.txt "Kernel Documents: ipvs-sysctl.txt"
[6]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/02/01/ipvs-usage.html "ipvs的使用"
