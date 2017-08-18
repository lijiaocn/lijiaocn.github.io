---
layout: default
title: calico的网络故障排查方法
author: lijiaocn
createdate: 2017/08/18 09:40:11
changedate: 2017/08/18 10:34:37
categories: 问题
tags:  calico
keywords: calico,排查,调查
description: calico的网络故障排查方法，遇到calico的网络问题的时候可以按照这个步骤进行。

---

* auto-gen TOC:
{:toc}

## 步骤 

假设遇到了从容器A中无法访问容器B的问题：

### 从calico中获取容器的网卡信息

从calico中获取到发送端容器的workloadEndpoint：

	$calicoctl get workloadendpoint --workload=<NAMESPACE>.<PODNAME> -o yaml
	- apiVersion: v1
	  kind: workloadEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: <NAMESPACE>
	      name: sshproxy-internal
	      pod-template-hash: "3693247749"
	      tenxcloud.com/appName: sshproxy-internal
	      tenxcloud.com/svcName: sshproxy-internal
	    name: eth0
	    node: dev-slave-107
	    orchestrator: k8s
	    workload: <NAMESPACE>.<PODNAME>
	  spec:
	    interfaceName: cali69de609d5af
	    ipNetworks:
	    - 192.168.8.42/32
	    mac: b2:21:5b:82:e1:27
	    profiles:
	    - k8s_ns.<NAMESPACE>

上面的查询结果说明:

	1. 容器内的IP为192.168.8.42/32，mac地址是b2:21:5b:82:e1:27
	2. 容器位于node端网卡为cali69de609d5af
	3. 容器位于dev-slave-107

从calico中获取容器的接收端信息:

	$calicoctl get workloadendpoint --workload=<NAMESPACE>.<PODNAME> -o yaml
	- apiVersion: v1
	  kind: workloadEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: <NAMESPACE>
	      name: sshproxy-cluster
	      pod-template-hash: "162298777"
	      tenxcloud.com/appName: sshproxy-cluster
	      tenxcloud.com/svcName: sshproxy-cluster
	    name: eth0
	    node: dev-slave-140
	    orchestrator: k8s
	    workload: <NAMESPACE>.<PODNAME>
	  spec:
	    interfaceName: calie664becc2fd
	    ipNetworks:
	    - 192.168.60.173/32
	    mac: da:ba:8d:7a:45:dc
	    profiles:
	    - k8s_ns.<NAMESPACE>

上面的查询结果说明:

	1. 接收端node上的calio网卡为calie664becc2fd
	2. 容器位于dev-slave-140

### 检查发送端的容器

1. 查看容器内网卡是否正确，ip和mac是否与从calico中查询到的一致:

	sh-4.2# ip addr
	...
	3: eth0@if57: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP
	    link/ether b2:21:5b:82:e1:27 brd ff:ff:ff:ff:ff:ff link-netnsid 0
	    inet 192.168.8.42/32 scope global eth0
	       valid_lft forever preferred_lft forever
	    inet6 fe80::b021:5bff:fe82:e127/64 scope link
	       valid_lft forever preferred_lft forever

2. 查看容器的默认路由是否是168.254.1.1，且没有额外的路由:

	sh-4.2# ip route
	default via 169.254.1.1 dev eth0
	169.254.1.1 dev eth0  scope link

3. 在node上读取node对应的calico网卡的mac:

	$ip link show cali69de609d5af
	57: cali69de609d5af@if3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DEFAULT
	    link/ether ea:88:97:5f:06:d9 brd ff:ff:ff:ff:ff:ff link-netnsid 2

4. 查看容器内记录的168.254.1.1的mac地址是否是node上的calico网卡的mac：

	sh-4.2# ip neigh
	169.254.1.1 dev eth0 lladdr ea:88:97:5f:06:d9 REACHABLE

### 检查发送端的node

1. 在node上用tcpdump监听cali69de609d5af网卡，查看是否能够收到从容器内发出的报文

	$tcpdump -i cali69de609d5af

2. 检查node上的路由，目标IP的下一跳地址是否正确，目标IP是容器的地址，下一跳是否对应了正确的node ip：

	$ip route
	...
	192.168.60.128/26 via 10.39.0.140 dev eth0  proto bird
	...

3. 检查node上的iptables规则，是否将容器的报文正确的送出

### 检查接收端的node

1. 监听接收端node的网卡，检查是否收到了发送端node发送来的报文

	$tcpdump -i eth0

2. 检查接收端node上的路由，检查目标IP是否对应了正确的calico网卡

	$ip route
	...
	192.168.60.173 dev calie664becc2fd  scope link
	...

3. 检查接收端node上的iptables规则，是否接受了报文

### 检查接收端的容器

1. 监听接收端容器的网卡，检查是否收到了报文。

### 最后

颠倒发送端和接收端，再做一次检查。

## 参考
