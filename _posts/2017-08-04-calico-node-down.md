---
layout: default
title: Calico的workloadEndpoint无法访问网络的问题调查
author: lijiaocn
createdate: 2017/08/04 10:22:14
changedate: 2017/08/10 20:13:04
categories: 问题
tags: calico
keywords: calico,k8s,workloadEndpoint
description: 遗憾的是丢失了现场，kubernetes中使用calico的pod断网的问题调查了一半。

---

* auto-gen TOC:
{:toc}

## 现象

k8s中的一个名为"XXXXX"（敏感信息用X替换)的pod无法访问网络：

	/opt # ping www.baidu.com
	ping: bad address 'www.baidu.com'
	/opt # ping 114.114.114.114
	PING 114.114.114.114 (114.114.114.114): 56 data bytes

使用calicoctl找到这个容器的网卡，在calico中称为`workloadEndpoint`：

	$calicoctl get workloadEndpoint  --workload=XXXXX -o yaml
	- apiVersion: v1
	  kind: workloadEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: XXXXXX
	      name: group
	      pod-template-hash: "83380476"
	      XXXXXX.com/appName: group
	      XXXXXX.com/svcName: group
	    name: eth0
	    node: slave-96
	    orchestrator: k8s
	    workload: XXXXX
	  spec:
	    interfaceName: calic577831ffc7
	    ipNetworks:
	    - 192.168.156.177/32
	    mac: 96:fb:dc:4a:26:e7
	    profiles:
	    - k8s_ns.XXXXX

可以看到，该容器的网卡分配到了slave-96上，名称为calic577831ffc7。

到slave-96上抓包:

	$tcpdump -i calic577831ffc7
	tcpdump: WARNING: calic577831ffc7: no IPv4 address assigned
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on calic577831ffc7, link-type EN10MB (Ethernet), capture size 65535 bytes
	10:31:43.775985 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:44.777494 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:45.779434 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:46.781508 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:47.783432 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:48.786429 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28

pod中的route信息与其它正常的pod的route信息相同：

	/opt # ip route
	default via 169.254.1.1 dev eth0
	169.254.1.1 dev eth0

问题来了，为什么arp请求没有被回应。

## 调查

遗憾的在试图隔离有问题的pod所在的node的时候，将pod删除了，丢失了现场。。

只能进行试验、推测。

通过阅读[felix][4]和[cni-plugin][5]的代码得知，cailco会设置两个arp。

第一个arp，是[cni-plugin][5]在创建workloadEndpoint的时候，在容器的namespace中设置默认网关的arp。

容器中默认网关(169.254.1.1)的MAC地址被设置为veth设备在host一端(node上以cali+开头的网卡)的MAC地址。

第二个arp，是[flex][4]感知到了workloadEndpoint的创建后，在node上设置了workloadEndpoint的arp。

node上workloadEndpoint的IP对应mac地址是veth设备在容器中的一端，即容器内网卡的mac。

容器中的网卡、路由和arp:

	$ip addr
	...
	3: eth0@if57: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP
	    link/ether b2:21:5b:82:e1:27 brd ff:ff:ff:ff:ff:ff link-netnsid 0
	    inet 192.168.8.42/32 scope global eth0
	    ...
	
	# ip route
	default via 169.254.1.1 dev eth0
	169.254.1.1 dev eth0  scope link
	
	# arp
	Address                  HWtype  HWaddress           Flags Mask            Iface
	gateway                  ether   ea:88:97:5f:06:d9   C                     eth0
	
	注意：arp中网关的mac地址下面的node设备中网卡的mac。

用calicoctl找到pod的workloadEndpoint：

	$calicoctl get workloadendpoint -o wide |grep POD-XXXXX
	dev-slave-107    k8s    XXXXXXXXX     eth0   192.168.8.42/32    cali69de609d5af   XXXX

node上的对应的网卡、路由和arp:

	$ip link show cali69de609d5af
	57: cali69de609d5af@if3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DEFAULT
	    link/ether ea:88:97:5f:06:d9 brd ff:ff:ff:ff:ff:ff link-netnsid 2
	
	$ip route | grep 192.168.8.42
	192.168.8.42 dev cali69de609d5af  scope link
	
	$arp | grep 192.168.8.42
	192.168.8.42             ether   b2:21:5b:82:e1:27   CM                    cali69de609d5af
	
	可以看到，这里的mac地址是容器中网卡的mac。

## 推断

在calico的设计中，正常情况下，容器中发出的报文直接送到了网关，不需要发出arp报文去寻找ip对应的mac。

但是在前面现象中，容器在通过arp寻找169.254.1.1的网卡地址，这是不应当出现的！

因为容器没有运行在特权模式，在容器内是无法更改arp记录的:

	$arp -d gateway -i eth0
	SIOCDARP(dontpub): Operation not permitted

有可能是fliex和cni-plugin的某种错误，使得容器中的arp记录丢失，但也不能完全排除是docker或者linux的问题。

当再次遇到此问题，或者成功复现后，再做分析。

## 现场来了

运气太好，得到了一个现场！

出问题的容器是基于alpine，在其中执行ip neigh直接段错误。

到容器所在的node上，利用nsenter进去容器的网络namespace:

	$nsenter -t 13110 -n /bin/sh
	sh-4.2# ip neigh
	169.254.1.1 dev eth0  FAILED

果然arp不存在。

node上的arp记录是存在的:

	$ip neigh |grep "d7:46:8f:34"
	192.168.42.25 dev cali933d88d7b8a lladdr 4e:fe:d7:46:8f:34 STALE

但是ping的时候：

	$ping 192.168.42.25
	connect: Invalid argument



## 参考

1. [calico网络的原理、组网方式与使用][1]
2. [bird][2]
3. [confd][3]
4. [felix][4]
5. [cni-plugin][5]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/04/11/calico-usage.html  "calico网络的原理、组网方式与使用" 
[2]: http://bird.network.cz/ "bird"
[3]: http://www.confd.io/  "confd"
[4]: https://github.com/projectcalico/felix  "felix"
[5]: https://github.com/projectcalico/cni-plugin "calico cni-plugin"
