---
layout: default
title: 使用calico的kubernetes集群，在pod内部无法访问外部服务
author: lijiaocn
createdate: 2017/08/04 10:22:14
changedate: 2017/11/29 11:02:05
categories: 问题
tags: calico kubernetes
keywords: calico,k8s,workloadEndpoint
description: 使用calico的kubernetes集群中，pod断网的问题调查

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

## 另一个现场

	$ calicoctl get workloadendpoint --workload=olef-idalijn-adcbackend.etcd-2 -o yaml
	- apiVersion: v1
	  kind: workloadEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: olef-idalijn-adcbackend
	      tenxcloud.com/petsetName: etcd
	      tenxcloud.com/petsetType: etcd
	    name: eth0
	    node: slave-140
	    orchestrator: k8s
	    workload: olef-idalijn-adcbackend.etcd-2
	  spec:
	    interfaceName: calid3abf7c1be4
	    ipNetworks:
	    - 192.168.91.33/32
	    mac: aa:0f:5b:3d:76:4a
	    profiles:
	    - k8s_ns.olef-idalijn-adcbackend

在容器内手动设置arp：

	arp -s 169.254.1.1    ce:00:8d:99:39:ee

无效。

在node上ping容器的地址，可以ping通。

	ping 192.168.91.33
	PING 192.168.91.33 (192.168.91.33) 56(84) bytes of data.
	64 bytes from 192.168.91.33: icmp_seq=1 ttl=64 time=0.548 ms
	64 bytes from 192.168.91.33: icmp_seq=2 ttl=64 time=0.062 ms
	64 bytes from 192.168.91.33: icmp_seq=3 ttl=64 time=0.053 ms
	64 bytes from 192.168.91.33: icmp_seq=4 ttl=64 time=0.055 ms
	64 bytes from 192.168.91.33: icmp_seq=5 ttl=64 time=0.029 ms
	64 bytes from 192.168.91.33: icmp_seq=6 ttl=64 time=0.066 ms

同时在容器内抓包：

	tcpdump -i eth0
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on eth0, link-type EN10MB (Ethernet), capture size 65535 bytes
	19:42:00.619029 IP slave-140.49319 > 10.0.0.10.domain: 46611+ SRV? etcd.svc.cluster.local. (40)

可以ping通，但是在容器内却捕捉不到报文。

在node查看路由：

	$ ip route |grep 192.168.91.33
	192.168.91.33 dev calia3201341d16  scope link

发现问题，`calia3201341d16`不是对应容器的设备！192.168.91.33对应的应当前面workloadendpoint中的`calid3abf7c1be4`

在node上查看arp，也发现问题：

	$ arp  |grep 192.168.91.33
	192.168.91.33            ether   9e:83:2f:5d:c5:1e   CM                    calic49657a1e1a
	192.168.91.33            ether   4e:14:1c:51:f1:80   CM                    calic0372e7228c
	192.168.91.33            ether   aa:0f:5b:3d:76:4a   CM                    calid3abf7c1be4
	192.168.91.33            ether   22:cc:4e:58:fc:15   CM                    cali5eb76b4e59d
	192.168.91.33            ether   a6:46:39:fa:db:9c   CM                    cali3ac2fb6f921
	192.168.91.33            ether   f2:4f:de:48:06:11   CM                    cali102d89dd0fc
	192.168.91.33            ether   c2:94:4b:7e:d0:fd   CM                    calia3201341d16
	192.168.91.33            ether   46:86:58:88:2d:99   CM                    cali2b6bddc6647
	192.168.91.33            ether   b2:de:2a:b6:e6:7a   CM                    cali61dda4e772c
	192.168.91.33            ether   36:b5:98:66:09:6a   CM                    cali7bc527be618
	192.168.91.33            ether   92:1b:61:f9:c1:9c   CM                    calidc70be659ad

	$ ip neigh |grep 192.168.91.33
	192.168.91.33 dev calic49657a1e1a lladdr 9e:83:2f:5d:c5:1e PERMANENT
	192.168.91.33 dev calic0372e7228c lladdr 4e:14:1c:51:f1:80 PERMANENT
	192.168.91.33 dev calid3abf7c1be4 lladdr aa:0f:5b:3d:76:4a PERMANENT
	192.168.91.33 dev cali5eb76b4e59d lladdr 22:cc:4e:58:fc:15 PERMANENT
	192.168.91.33 dev cali3ac2fb6f921 lladdr a6:46:39:fa:db:9c PERMANENT
	192.168.91.33 dev cali102d89dd0fc lladdr f2:4f:de:48:06:11 PERMANENT
	192.168.91.33 dev calia3201341d16 lladdr c2:94:4b:7e:d0:fd REACHABLE
	192.168.91.33 dev cali2b6bddc6647 lladdr 46:86:58:88:2d:99 PERMANENT
	192.168.91.33 dev cali61dda4e772c lladdr b2:de:2a:b6:e6:7a PERMANENT
	192.168.91.33 dev cali7bc527be618 lladdr 36:b5:98:66:09:6a PERMANENT
	192.168.91.33 dev calidc70be659ad lladdr 92:1b:61:f9:c1:9c PERMANENT

将多余的arp删除：

	$ ip neigh delete 192.168.91.33 dev calic0372e7228c
	..

还是不行，发现还是多出了一个arp条目：

	$ ip neigh |grep 192.168.91.33
	192.168.91.33 dev calid3abf7c1be4 lladdr aa:0f:5b:3d:76:4a PERMANENT
	192.168.91.33 dev calia3201341d16 lladdr c2:94:4b:7e:d0:fd REACHABLE

找到这个多出arp条目对应的workloadendpoint：

	$ calicoctl get workloadendpoint -o wide |grep calia3201341d16
	slave-140     k8s     adqsdxadc.store-mysql-0     eth0   192.168.91.33/32       calia3201341d16   k8s_ns.adqsdxadc
	slave-57      k8s     adqsdxadc.store-mysql-0     eth0   192.168.201.71/32      calia3201341d16   k8s_ns.adqsdxadc

	$ calicoctl get workloadendpoint --node=slave-140 --workload=adqsdxadc.store-mysql-0 -o yaml
	- apiVersion: v1
	  kind: workloadEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: adqsdxadc
	      tenxcloud.com/petsetName: store-mysql
	      tenxcloud.com/petsetType: mysql
	    name: eth0
	    node: slave-140
	    orchestrator: k8s
	    workload: adqsdxadc.store-mysql-0
	  spec:
	    interfaceName: calia3201341d16
	    ipNetworks:
	    - 192.168.91.33/32
	    mac: c2:94:4b:7e:d0:fd
	    profiles:
	    - k8s_ns.adqsdxadc

这个workloadendpoint的IP也是192168.91.33！！！

在node上再次查看一下，发现大量的重复IP！！！

	$ calicoctl get workloadendpoint -o wide |grep 192.168.91.33
	slave-140          k8s            bdadservicexadc.adqsd-meeting-web-1739418049-g6qes                eth0   192.168.91.33/32            calic49657a1e1a   k8s_ns.bdadservicexadc
	slave-140          k8s            bdadservicexadc.grafana-1932004613-auazz                          eth0   192.168.91.33/32            cali61dda4e772c   k8s_ns.bdadservicexadc
	slave-140          k8s            adqsdxadc.store-mysql-0                                           eth0   192.168.91.33/32            calia3201341d16   k8s_ns.adqsdxadc
	slave-140          k8s            adqsd-prod.fwf123-2                                               eth0   192.168.91.33/32            cali3ac2fb6f921   k8s_ns.adqsd-prod
	slave-140          k8s            adqsd-study.es01-0                                                eth0   192.168.91.33/32            cali7bc527be618   k8s_ns.adqsd-study
	slave-140          k8s            xxxxxxxxplatform.elastic-qa-0                                     eth0   192.168.91.33/32            cali102d89dd0fc   k8s_ns.xxxxxxxxplatform
	slave-140          k8s            abcdw-prod.group-3899345145-v631u                                 eth0   192.168.91.33/32            cali5eb76b4e59d   k8s_ns.abcdw-prod
	slave-140          k8s            adfadddxin.etcd2-0                                                eth0   192.168.91.33/32            calidc70be659ad   k8s_ns.adfadddxin
	slave-140          k8s            abcdjiand.fox-1                                                   eth0   192.168.91.33/32            calic0372e7228c   k8s_ns.abcdjiand
	slave-140          k8s            olef-idalijn-adcbackend.etcd-2                                    eth0   192.168.91.33/32            calid3abf7c1be4   k8s_ns.olef-idalijn-adcbackend
	slave-140          k8s            dlojyolgh.dlojyolg-db-0                                           eth0   192.168.91.33/32            cali2b6bddc6647   k8s_ns.dlojyolgh

kubernetes中也可以看到大量容器的IP冲突：

	$ kubectl get pod -o wide --all-namespaces |grep 192.168.91.33
	bdadservicexadc                  adqsd-meeting-web-1739418049-g6qes             1/1       Running             0          20h       192.168.91.33     slave-140
	bdadservicexadc                  grafana-1932004613-auazz                       1/1       Running             0          20h       192.168.91.33     slave-140
	adqsdxadc                        store-mysql-0                                  1/1       Running             0          20h       192.168.91.33     slave-140
	adqsd-prod                       fwf123-2                                       1/1       Running             0          20h       192.168.91.33     slave-140
	adqsd-study                      es01-0                                         0/1       Running             0          20h       192.168.91.33     slave-140
	xxxxxxxxplatform                 elastic-qa-0                                   0/1       Running             0          20h       192.168.91.33     slave-140
	abcdw-prod                       group-3899345145-v631u                         1/1       Running             0          20h       192.168.91.33     slave-140
	adfadddxin                       etcd2-0                                        0/1       Running             0          20h       192.168.91.33     slave-140
	abcdjiand                        fox-1                                          0/1       Init:1/2            0          20h       192.168.91.33     slave-140
	dlojyolgh                        dlojyolg-db-0                                  0/1       Init:1/2            0          20h       192.168.91.33     slave-140

先进行紧急恢复，通过下面的命令找出所有的冲突IP

	kubectl get pod -o wide --all-namespaces | awk '{print $7}' |sort | uniq -c | sort -n

将IP冲突的Pod删除重建后，IP不再冲突。

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
