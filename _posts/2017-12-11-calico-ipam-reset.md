---
layout: default
title: calico的ipam的数据混乱，重建ipam记录
author: lijiaocn
createdate: 2017/12/11 21:40:50
changedate: 2017/12/12 16:10:38
categories: 问题
tags: calico
keywords: calico,ipam
description: 自从上次系统升级之后，kubernetes故障频出，大部分都是网络问题。

---

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

过程比较复杂，相关脚本已经托管到[github: calico-ipam-reset][1]。

## 进一步分析

写编写重建脚本的时候，草草浏览了下calico-ipam的[源码][2]，想起了一个问题。

为什么出现问题的pod大多都是通过petset或者statefultset启动的？

通过petset或者statefulset创建的容器的，它们的名字是固定的，在ipam中对应的handler名称也固定：

	{
	  "handle_id": "lijiaob-space.etcd-0",
	  "secondary": null
	},

ipam在删除的时候，会将同名的所有handle都删除。

calico-ipam是在创建或者删除pod时候由kubelet调用，使用中发现会出现pod已经删除，但ipam中对应的handle
没有被删除的情况。

另外还有存在pod始终位于Termating状态，kubelet重复对其进行删除都不成功的问题。

查看calico-ipam的代码，可以知道attributes中的handler是不重复的，但是可以分配多个IP。

另外还存在一些pod始终删除失败，kubelet反复对其进行删除，反复对其调用cni。

如果一个通过statefulset创建的pod正在删除过程中或即将删除，kubernetes又把它调度到同一个node上。那么原先正在删除过程的pod完成后，会不会将新分配过来的pod的workloadendpoint删除？

这个过程发生在不同的时刻，可能会出现： calico中对应的workloadendpoint被删除、node上设置的veth设备、以及arp记录丢失的不同的情况。

这还只是个猜想，需要试验一下。

## 参考

1. [github: calico-ipam-reset][1]
2. [github: calico-ipam.go][2]

[1]: https://github.com/lijiaocn/calico-ipam-reset  "github: calico-ipam-reset" 
[2]: https://github.com/projectcalico/cni-plugin/tree/master/ipam "github: calico-ipam.go"
