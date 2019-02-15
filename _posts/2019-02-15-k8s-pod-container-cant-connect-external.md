---
layout: default
title: "iptables snat规则缺失导致kubernetes集群node上的容器无法ping通外网"
author: 李佶澳
createdate: "2019-02-15 12:04:04 +0800"
changedate: "2019-02-15 14:33:51 +0800"
categories: 问题
tags: kubernetes
keywords: kubernetes,iptables,ipvs,node,网络不通
description: "kubernets集群问题node上缺失了一条iptables snat规则，导致node上所有容器不能访问外网iptables -t nat -A POSTROUTING -s 10.12.9.138/26 ! -o docker0 -j MASQUERADE"
---

* auto-gen TOC:
{:toc}


## 现象

Kubernetes集群的一个node出现问题，该问题node上所有的容器不能ping外网IP。

网络方案是flannel，kube-proxy使用ipvs的方式。

## 调查

选择集群外的一台机器作为目标机器，在问题机器的容器内ping目标机器，容器的IP是`10.12.9.139`，目标机器地址是`10.10.64.58`。

在目标机器上抓包：

```
[root@10.10.64.58 lxcfs]# tcpdump -n -i eth0 icmp
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 65535 bytes
11:51:40.167453 IP 10.12.9.139 > 10.10.64.58: ICMP echo request, id 31744, seq 115, length 64
11:51:40.167560 IP 10.10.64.58 > 10.12.9.139: ICMP echo reply, id 31744, seq 115, length 64
11:51:41.167434 IP 10.12.9.139 > 10.10.64.58: ICMP echo request, id 31744, seq 116, length 64
11:51:41.167561 IP 10.10.64.58 > 10.12.9.139: ICMP echo reply, id 31744, seq 116, length 64
11:51:42.167453 IP 10.12.9.139 > 10.10.64.58: ICMP echo request, id 31744, seq 117, length 64
11:51:42.167581 IP 10.10.64.58 > 10.12.9.139: ICMP echo reply, id 31744, seq 117, length 64
```

目标机器收到了容器内发出的请求包，并且做了回应，但在问题机器上抓包，没有抓到目标机器的回应包。

查看目标机器上抓到的报文情况，发现`源IP是容器的IP（10.12.9.139）`。这是有问题的，因为目标机器不是kubernetes中的机器，压根不能访问容器的IP，它看到IP应当是`容器所在的node的IP`。

## 解决方法 

问题应该出iptables上，容器的报文被送离node时没有做snat。

对比问题node的iptables规则和正常node的iptables规则，发现问题node上缺失了一条iptables规则：

	-A POSTROUTING -s 10.12.9.138/26 ! -o docker0 -j MASQUERADE

将这条规则添加上以后，状况消失（注意-s指定的是node分配的虚拟网段）：

	iptables -t nat -A POSTROUTING -s 10.12.9.138/26 ! -o docker0 -j MASQUERADE

为什么会缺了一条iptables规则？需要继续尝试复现。2019-02-15 13:13:18

[Kubernetes使用过程中遇到问题汇总](https://www.lijiaocn.com/categories/%E9%97%AE%E9%A2%98.html)



