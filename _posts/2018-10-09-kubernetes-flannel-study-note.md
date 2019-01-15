---
layout: default
title: "Kubernetes网络方案Flannel的学习笔记"
author: 李佶澳
createdate: "2018-10-09 14:15:58 +0800"
changedate: "2019-01-15 19:14:53 +0800"
categories: 项目
tags: flannel kubernetes
keywords: kubernetes,flannel,docker network,overlay,network
description: Flannel是最早接触的Kubernetes的网络，当时只了解到它采用overlay的方式，于是重点学习calico了，后来发现用到flannel的公司还挺多，需要系统学习下
---

* auto-gen TOC:
{:toc}

## 说明

[Flannel][1]是Kubernetes最早期的网络方案之一，也是现在常用的方案之一。当时只了解到它采用overlay的方式，出于性能方面的考虑，重点学习calico了，后来发现用到flannel的公司还挺多，需要系统学习下。

## 下载编译

	git clone https://github.com/coreos/flannel.git
	cd flannel
	make dist/flanneld-amd64

编译得到的文件`flanneld-amd64`位于dist目录中，参考[Building flannel](https://github.com/coreos/flannel/blob/master/Documentation/building.md)。

## 工作原理

Flannel的工作原理很简单，在每一个需要使用Flannel网络的机器上都运行一个名为flanneld的服务。

Flanneld为所在的机器申请一小段虚拟网络的地址空间，并负责将`通过这些虚拟地址发送的`报文封装，用宿主机的网络送出。Flanneld还要负责解读宿主机网络收到`发送给虚拟网络的中的地址`的报文。

虚拟网络地址的分配情况直接写入etcd，或者通过kubernetes的api写入。

**核心问题**：Flannel是怎样通过宿主机网络传递虚拟机网络中的报文的？

Flannel支持几种不同的封装转发方式，把它们叫做[Backends][2]。

## 配置文件

在了解flannel支持的多个backend之前，先了解一下它的配置文件和命令行参数。

```
$ /usr/bin/flanneld -h
Usage of /usr/bin/flanneld:
  -alsologtostderr
    	log to standard error as well as files
  -etcd-cafile string
    	SSL Certificate Authority file used to secure etcd communication
  -etcd-certfile string
    	SSL certification file used to secure etcd communication
  -etcd-endpoints string
    	a comma-delimited list of etcd endpoints (default "http://127.0.0.1:2379")
  ...
```

使用`-h`可以看到所有的命令行参数，这里只记录几个比较重要的参数的用法，flannel的版本是0.7.0。

`-kube-subnet-mgr`，如果是true，flanneld读取配置文件`/etc/kube-flannel/net-conf.json`，否则从etcd中读取配置。

从etcd中读取配置时，默认读取`/coreos.com/network/config`目录，可以用`-etcd-prefix`修改为其它目录。

config文件格式如下：

```json
{
	"Network": "10.0.0.0/8",
	"SubnetLen": 20,
	"SubnetMin": "10.10.0.0",
	"SubnetMax": "10.99.0.0",
	"Backend": {
		"Type": "udp",
		"Port": 7890
	}
}
```

其中Backend配置因为选择的Backend的类型不同而不同，如果Backend为空，默认使用udp（建议用vxlan）。

## 已经支持的Backends

@2018-10-09 16:47:10

### vxlan模式

最推荐使用的是`vxlan`，使用linux kernel的vxlan实现。vxlan backend的配置项有以下几个：

	Type: string，backend类型，就是"vxlan"
	VNI:  number，vxlan协议中的vni编号，不同的vni号码代表不同网段，类似vlan号，默认是1
	Port: number,  宿主机的udp端口，用来发送封装后的报文，使用linux内核默认配置，8472
	GBP:  boolean，是否使用vxlan Group Policy，默认false
	DirectRouting:  boolean，是否启用直接路由，当两台宿主机位于同一个网段时，不封装通过路由直接送达，默认false

`GBP`特性参考：[vxlan: Group Policy extension][6]。

`DriectRouting`：能够直接路由的时候采用直接路由的方式，否则就通过vxlan。

### host-gw模式

其次是`host-gw`，通过直接路由的方式传送虚拟网络报文。

Host-gw原理和vxlan中的DirectRouting相同，但是要求所有宿主机都支持直接路由方式（即在同一个二层网络中），并全部采用采用直接路由的方式。

Host-gw的配置项只有一个：

	Type: string，backend类型，就是"host-gw"

`udp`只建议调试时使用，或者另外两种方式不能使用的时候（譬如宿主机内核不支持vxlan）使用。

	Type：string，backend类型，就是"udp"
	Port: number，宿主机udp端口，默认8285

## 处于试验阶段的Backends

@2018-10-09 16:47:23

AliVPC，阿里云的VPC

	Type (string): alloc

Alloc，这个没明白怎么回事，说是"performs subnet allocation with no forwarding of data packets"：

	Type (string): alloc

AWS VPC，AWS的VPC：

	Type (string): aws-vpc
	RouteTableID (string): [optional] The ID of the VPC route table to add routes to. 

GCE，Google的云服务：

	Type (string): gce

IPIP，使用内核实现的ipip隧道：

	Type (string): ipip
	DirectRouting (Boolean):

IPSec，使用内核实现的IpSec：

	Type (string): ipsec
	PSK (Boolean): Required. 
	UDPEncap (string): Optional
	ESPProposal (string): Optional

## 怎样做网络隔离？

Flannel是一个特别简单的网络方案，文档也就特别简单。把上面的backends梳理完，文档基本上就全读完了。

[Kubernetes1.12从零开始（五）：自己动手部署Kubernetes][3]中讲到，Kubernetes设计的时候，就降低了对网络模型的要求。所以Flannel这样简单的网络方案，可以用于Kubernetes。

不过要注意，Flannel这个项目小而精，缺少了一些功能。最直接的缺陷就是：`不支持ACL`，即Kubernetes中的Network Policy。

`网络隔离`是非常重要的刚需，但是flannel不支持。根据flannel项目[Readme][1]中的表述，这个项目似乎也不打算支持"network policy"：

	Flannel is focused on networking. For network policy, other projects such as Calico can be used.

有意思的是Calico启动了一个[Canal][4]项目，糅合了Calico和Flannel。Network policy功能由calico提供，network功能由flannel提供，也是醉了。

[Flannels, Canals and Tigers, Oh My! — Big News in the Land of Project Calico][5]介绍了Canal的诞生过程。

![糅合了Calico和Flannel的Kubernetes网络方案Canal](https://raw.githubusercontent.com/projectcalico/canal/master/Canal%20Phase%201%20Diagram.png)

## 参考

1. [Github Flannel][1]
2. [Flannel: Backends][2]
3. [Kubernetes1.12从零开始（五）：自己动手部署Kubernetes][3]
4. [Github: Canal][4]
5. [Flannels, Canals and Tigers, Oh My! — Big News in the Land of Project Calico][5]
6. [vxlan: Group Policy extension][6]

[1]: https://github.com/coreos/flannel "Github: Flannel"
[2]: https://github.com/coreos/flannel/blob/master/Documentation/backends.md "Flannel: Backends"
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/07/k8s-class-deploy-from-scratch.html#%E9%87%87%E7%94%A8%E5%93%AA%E7%A7%8D%E7%BD%91%E7%BB%9C%E6%96%B9%E6%A1%88 "Kubernetes1.12从零开始（五）：自己动手部署Kubernetes"
[4]: https://github.com/projectcalico/canal "Github: Canal"
[5]: https://www.projectcalico.org/canal-tigera/ "Flannels, Canals and Tigers, Oh My! — Big News in the Land of Project Calico"
[6]: https://github.com/torvalds/linux/commit/3511494ce2f3d3b77544c79b87511a4ddb61dc89 "vxlan: Group Policy extension "
