---
layout: default
title: Kubernetes与CNI(calico)的衔接过程
author: lijiaocn
createdate: 2017/09/11 16:45:48
changedate: 2017/09/12 10:06:27
categories: 项目
tags: kubernetes calico
keywords: k8s,kubernets,calico
description: kubernetes与calico的衔接过程

---

* auto-gen TOC:
{:toc}

## 说明

这里分析的是kubernetes 1.6.4。

## Kubelet与CNI

在kubernetes中，网络相关的设置是通过kubelet中指定的cni设置的，这个过程可以参考[Kubernetes的Pod网络设置][3]。

kubelet启动时，需要指定几个参数：

	kubelet \
		...
		--network-plugin=cni 
		--cni-conf-dir=/etc/cni/net.d 
		--cni-bin-dir=/opt/cni/bin 
		...

`--network-plugin`表示使用的网络插件为cni，cni是一个网络插件的标准，可以参考[CNI][2]。

`--cni-conf-dir`指定了cni插件的配置文件，配置文件中指定了cni要使用的`--cni-bin-dir`中的哪个程序：

	$ls /opt/cni/bin/
	bridge  calico  calico-ipam  cnitool  dhcp  flannel  host-local  ipvlan  loopback  macvlan  noop  nsenter  ptp  tuning

不同的二进制插件，需要不同的配置文件，calico的配置文件如下：

## NetworkPolicy的下发

kubernetes 1.6.4支持networkpolicy，创建的networkpolicy存放在etcd的`*/networkpolicies`目录中：

	$etcdctl ls /registry/networkpolicies
	/registry/networkpolicies/lijiaob-space
	/registry/networkpolicies/earth
	/registry/networkpolicies/lijiaob-space2

## 参考

1. [kubernetes 1.6.4 networkpolicy][1]
2. [CNI][2]
3. [kubernetes的Pod网络设置][3]

[1]: https://v1-6.docs.kubernetes.io/docs/concepts/services-networking/network-policies/  "kubernetes 1.6.4 networkpolicy" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/03/CNI.html  "CNI"
[3]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/03/Kubernetes-pod-network.html  "Kubernetes的Pod网络设置"
