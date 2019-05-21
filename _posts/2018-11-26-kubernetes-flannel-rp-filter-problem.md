---
layout: default
title: "Kubernetes: 内核参数rp_filter设置为Strict RPF，导致Service不通"
author: 李佶澳
createdate: "2018-11-26 17:40:06 +0800"
changedate: "2018-11-26 17:40:06 +0800"
categories: 问题
tags: kubernetes
keywords: kubernetes,flannel,rp_filter,strict Reverse Path Forwarding,strict RPF
description: 网络方案是flannel，从node上直接用telnet访问Service的服务地址（IP 端口），不通
---

## 目录
* auto-gen TOC:
{:toc}

## 现象

网络方案是flannel， 从node上直接用telnet访问Service的服务地址（IP 端口），不通。

```bash
[node-70-155 ~]$ telnet 10.12.164.251 5432
Trying 10.12.164.251...
^C
```

同一台node上，直接访问Service对应的Pod的地址，可以通：

```bash
[node-70-155 ~]$ telnet 17.0.51.13  5432
Trying 17.0.51.13...
Connected to 17.0.51.13.
Escape character is '^]'.
```

在Pod所在的node上，用telnet访问Service的服务地址，也可以通。很奇怪。

## 调查

在nodeA(10.10.70.155)上发起请求，Pod在nodeB(10.10.67.156)上运行。

从nodeA上访问Service(10.12.164.251:5432)时 :

```bash
[node-70-155 ~]$ telnet 10.12.164.251 5432
Trying 10.12.164.251...
```

在nodeB上对flannel0抓包，发现没有回应包：

```bash
[root@k8s-node-67-156 flannel0]# tcpdump -i flannel0 host 10.10.70.155
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on flannel0, link-type RAW (Raw IP), capture size 65535 bytes
17:48:05.470698 IP 10.10.70.155.56192 > 17.0.51.13.postgres: Flags [S], seq 2778311576, win 28280, options [mss 1414,sackOK,TS val 844872206 ecr 0,nop,wscale 7], length 0
17:48:06.471586 IP 10.10.70.155.56192 > 17.0.51.13.postgres: Flags [S], seq 2778311576, win 28280, options [mss 1414,sackOK,TS val 844873208 ecr 0,nop,wscale 7], length 0
17:48:07.855606 IP 10.10.70.155.55820 > 17.0.51.13.postgres: Flags [P.], seq 2472621440:2472621762, ack 1631278827, win 314, options [nop,nop,TS val 844874592 ecr 2559804523], length 322
17:48:08.475632 IP 10.10.70.155.56192 > 17.0.51.13.postgres: Flags [S], seq 2778311576, win 28280, options [mss 1414,sackOK,TS val 844875212 ecr 0,nop,wscale 7], length 0
^C
```

在容器(17.0.51.13)内抓包，发现容器没有收到报文，并且可以看到目的地址已经被转换成了Pod的地址，iptables规则经核实也没有问题。

问题在nodeA上，flannel0收到了报文，但是没有转发给容器，查看nodeA上的路由，

```bash
[root@k8s-node-67-156 flannel0]# ip route
default via 10.10.0.1 dev eth0
10.10.0.0/16 dev eth0  proto kernel  scope link  src 10.10.67.156
17.0.0.0/16 dev flannel0
17.0.51.0/24 dev docker0  proto kernel  scope link  src 17.0.51.1
```

根据最后一条路由，目标IP是17.0.51.13的报文，要经过docker0送到容器中，在docker0上抓包，也没有收到包。

核对nodeA上的arp和容器内的网卡mac相同，也没有问题：

```bash
[root@k8s-node-67-156 flannel0]# arp -n |grep 51.13
17.0.51.13               ether   02:42:11:00:33:0d   C                     docker0
```

陷入困境。

## 继续调查

将问题反馈其他同事，发现可以通过修改内核参数`rp_filter`解决问题，操作如下：

	echo 0 > /proc/sys/net/ipv4/conf/flannel0/rp_filter

然后就立马通了，很神奇。

在`/etc/sysctl.conf`中添加：

	net.ipv4.conf.all.rp_filter = 0

然后更新：

	sysctl -p

查阅rp_filter参数的说明，原来这是linux kernel中实现的一种抗DOS攻击的方法。`rp_filter`为1时，将严格检查接受报文的网卡，和访问报文的源IP的网卡是否是同一个网卡，如果不是，就丢弃。

在nodeA上直接访问Service时，报文的源IP是nodeA的eth0的IP，在nodeB上，flannel0收到报文后，检查发现，回应时要使用的网卡是eth0，接收网卡和回应网卡不一致，报文被丢弃，因此docker0压根接没有看到包，也不会送给容器。

rp_filter参数的详细见：[Linux内核参数用途记录: rp_filter][1]

## 参考

1. [rp_filter][1]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/11/26/linux-kernel-parameters.html#rp_filter "rp_filter"
