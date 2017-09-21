---
layout: default
title: "linux的traffic control"
author: lijiaocn
createdate: 2017/08/10 15:44:17
changedate: 2017/09/21 19:25:08
categories: 技巧
tags: linuxnet
keywords: tc,trickle,dummynet,流量控制,限速,traffic control
description: "收集几种linux上的限速工具: tc、hashlimit、dummynet、trickle、wondershaper、pyshaper。"

---

* auto-gen TOC:
{:toc}

## 说明

这里收集了多种linux上的限速工具，有的是在内核态，需要管理员进行全局设置的，如tc、iptalbes，有的是在用户态，例如trickle。

只对tc做过测试，并实际使用过，其他工具的限速情况没有测试过，这里只做收录。2017-08-11 14:34:32

## tc

tc是linux上工具，用来进行带宽控制、流量整型(shaping)，可以细致到IP和端口。

[Queueing Disciplines for Bandwidth Management][2]中介绍了tc的原理和使用方法。

tc只能控制对发出的报文进行整型(shaping)，通过干涉报文发送队列(queue)，管理报文的发送实现。

tc不能直接控制报文的流入，可以通过将流入报文转送到一个fbr设备，fbr设备再将整型后的流量回注给接收网卡的方式影响报文的流入速率。

tc设置的规则分为classful和classless两大类，classful可以流量进行分组，分别限制带宽，classless不能对流量分组，只控制目标发送队列的报文发送。

	Classless Queueing Disciplines: 只对目标队列中的要发送出去的报文进行整型(shaping)，不对流量进行分组。
	Classful Queueing Disciplines:  可以对流量进行分组，分别限制带宽，并可以对空闲带宽进行借用。

classless和classful不是对立的关系，而是层级关系，classful在上层，经过它分组、整流的报文，最后一步的送出在classless的控制下进行。

linux手册中对tc中的每一类规则做了介绍:

	tc-basic(8)
	tc-bfifo(8)
	tc-cbq(8)
	tc-cgroup(8)
	tc-choke(8)
	tc-codel(8)
	tc-drr(8)
	tc-ematch(8)
	tc-flow(8)
	tc-fq(8)
	tc-fq_codel(8)
	tc-fw(8)
	tc-hfsc(7)
	tc-hfsc(8)
	tc-htb(8)
	tc-pfifo(8)
	tc-pfifo_fast(8)
	tc-red(8)
	tc-route(8)
	tc-sfb(8)
	tc-sfq(8)
	tc-stab(8)
	tc-tbf(8)
	tc-tcindex(8)
	tc-u32(8)
	tc-prio(8)

### Classless Queueing Disciplines

可以参考[tc classless example][3]中的例子。

#### bfifo && pfifo

First In, First Out, which means that no packet receives special treatment。

#### pfifo_fast

#### red

#### sfq

#### tbf

### Classful Queueing Disciplines

可以参考[tc classful example][4]中的例子。

#### cbq

#### htb

#### prio

### 使用ifb控制报文的流入

[ifb][5]，Intermediate Functional Block device。

## iptables hashlimit

iptables的hashlimit也可以用来进行限速：

	iptables -A FORWARD -m hashlimit --hashlimit-above 512kb/sec --hashlimit-burst 1mb --hashlimit-mode srcip,dstip --hashlimit-name bwlimit -j DROP

That rule limits traffic that pass through FORWARD chain as 512kb/sec with 1mb burst for each source and destination pair.

[iptables-extensions][11]中有对hashlimit的介绍。

## dummynet

[dummynet][9]通过创建pipe接管指定的报文，对其进行整型。

源码以及使用见: [dummynet code][10]。

limit the total incoming TCP traffic to 2Mbit/s, and UDP to 300Kbit/s

	ipfw add pipe 2 in proto tcp
	ipfw add pipe 3 in proto udp
	ipfw pipe 2 config bw 2Mbit/s
	ipfw pipe 3 config bw 300Kbit/s 
	
limit incoming traffic to 300Kbit/s for each host on network 10.1.2.0/24

	ipfw add pipe 4 src-ip 10.1.2.0/24 in
	ipfw pipe 4 config bw 300Kbit/s queue 20 mask dst-ip 0x000000ff 

simulate an ADSL link to the moon:

	ipfw add pipe 3 out
	ipfw add pipe 4 in
	ipfw pipe 3 config bw 128Kbit/s queue 10 delay 1000ms
	ipfw pipe 4 config bw 640Kbit/s queue 30 delay 1000ms 

## trickle

trickle是google开发的一个可以针对进程进行流量限制的工具，详情见[trickle paper][7]。

trickle通过加载一个preloading的.so，截获socket的方式控制进程的流量收发，工作在用户态。

源码以及使用见：[trickle code][8]

	trickle -u (upload limit in KB/s) -d (download limit in KB/s) application

安装:

	yum install -y epel-release
	yum install -y trickle

## wondershaper

[wondershaper][13]是一个shell文件，简化了tc的使用。

wondershaper的使用和源码见: [wondershaper][12]

## pyshaper

[pyshaper][14]是一个带有gui的限速工具。

在github上，有一个同名的项目，可以通过yaml文件描述限速规则，最后由tc落实：[another pyshaper][15]

## 参考

1. [Linux Advanced Routing & Traffic Control HOWTO][1]
2. [Queueing Disciplines for Bandwidth Management][2]
3. [tc classless example][3]
4. [tc classful example][4]
5. [ifb][5]
6. [ifb example][6]
7. [trickle paper][7]
8. [trickle code][8]
9. [dummynet][9]
10. [dymmynet code][10]
11. [iptables-extensions][11]
12. [wondershaper code][12]
13. [wondershaper][13]
14. [pyshaper][14]
15. [another pyshpaer][15]

[1]: http://lartc.org/lartc.html "Linux Advanced Routing & Traffic Control HOWTO" 
[2]: http://lartc.org/lartc.html#LARTC.QDISC "Queueing Disciplines for Bandwidth Management"
[3]: https://github.com/lijiaocn/traffic-control/tree/master/classless "tc classless example"
[4]: https://github.com/lijiaocn/traffic-control/tree/master/classful  "tc classful example"
[5]: https://wiki.linuxfoundation.org/networking/ifb "ifb"
[6]: https://github.com/rfrail3/misc/blob/master/tc/traffic-control.sh "ifb example"
[7]: https://www.usenix.org/legacy/event/usenix05/tech/freenix/full_papers/eriksen/eriksen.pdf  "trickle paper"
[8]: https://github.com/mariusae/trickle  "trickl project"
[9]: http://info.iet.unipi.it/~luigi/dummynet/ "dummynet"
[10]: https://github.com/luigirizzo/dummynet "dummynet code"
[11]: http://ipset.netfilter.org/iptables-extensions.man.html "iptables-extensions"
[12]: https://github.com/magnific0/wondershaper  "wondershaper code"
[13]: http://lartc.org/wondershaper/ "wondershaper"
[14]: http://freenet.mcnabhosting.com/python/pyshaper/  "pyshaper"
[15]: https://github.com/irmatov/pyshaper "another pyshaper"
