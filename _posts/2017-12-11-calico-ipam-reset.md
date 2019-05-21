---
layout: default
title: calico的ipam的数据混乱，重建ipam记录
author: 李佶澳
createdate: 2017/12/11 21:40:50
changedate: 2017/12/22 19:24:46
categories: 问题
tags: calico
keywords: calico,ipam
description: 自从上次系统升级之后，kubernetes故障频出，大部分都是网络问题。

---

## 目录
* auto-gen TOC:
{:toc}

## 现象 

自从上次系统升级之后，kubernetes故障频出，大部分都是网络问题。

譬如说两个pod居然使用了同一个IP，一个pod好好地运行着，突然容器内网关的静态arp突然没了。

calico中查出了一堆的workloadendpoint，可是并没有对应的pod。

node上也莫名的多了或者少了veth设备，导致pod无法ping通。

还有因为这些故障导致许多其它问题。

## 调查

调查过长相当曲折，在发现calico中多出了很多的workloadendpoint之后，就意识到可能是升级过程有问题。

于是对多出的workloadendpoint进行了删除，并且核对了所有node上的veth设备，对多出的veth设备也进行了删除处理。

但是，IP冲突和静态arp丢失对问题还是很经常的发生，百思不得其解。

后来，在ectcd中一个一个目录的查看calico的数据，发现ipam中的数据异常。

	$ etcdctl get  /calico/ipam/v2/assignment/ipv4/block/192.168.106.64-26
	{
	  "cidr": "192.168.106.64/26",
	  "affinity": "host:dev-slave-108",
	  "strictAffinity": false,
	  "allocations": [
	    null,
	    null,
	    null,
	    3,
	   ...
	 ],
	  "unallocated": [
	    0,
	    1,
	    2,
	    4,
	    5,
	    6,
	    7,
	    ...
	 ],
	  "attributes": [
	    {
	      "handle_id": "kube-system.prometheus-3355405412-iyww3",
	      "secondary": null
	    },
	    {
	      "handle_id": "kube-system.kubernetes-dashboard-2069275773-iun7h",
	      "secondary": null
	    },
	  ]
	}

ipam在etcd中记录的数据格式如上所示，attributes中有很多不存在的workloadendpoint。

基本可以断定，是升级过程，pod没有走完一个完整的删除过程，导致calico中的数据混乱。

## 重建

用calicoctl查出所有的workloadendpoint以及它们的IP、所在的node，然后计算出每个node上的IPAM数据。

过程比较复杂，相关脚本见[github: calico-ipam-reset][1]。

## 参考

1. [github: calico-ipam-reset][1]
2. [github: calico-ipam.go][2]

[1]: https://github.com/lijiaocn/k8s-tools/tree/master/calico-ipam-reset  "github: calico-ipam-reset" 
[2]: https://github.com/projectcalico/cni-plugin/tree/master/ipam "github: calico-ipam.go"
