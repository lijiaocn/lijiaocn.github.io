---
layout: default
title: Kubernetes与calico的衔接过程
author: lijiaocn
createdate: 2017/09/11 16:45:48
changedate: 2017/09/12 16:35:08
categories: 项目
tags: kubernetes calico
keywords: k8s,kubernets,calico
description: kubernetes与calico的衔接过程

---

* auto-gen TOC:
{:toc}

## 说明

这里分析的是kubernetes 1.6.4。

## kubelet衔接calico的cni插件

kubelet与CNI插件的衔接过程，可以参考[Kubernetes的CNI插件初始化与Pod网络设置][3]。

kubelet默认在`/etc/cni/net.d`目录寻找配置文件，在`/opt/bin/`目录中寻找二进制程序文件。

	kubelet \
		...
		--network-plugin=cni 
		--cni-conf-dir=/etc/cni/net.d 
		--cni-bin-dir=/opt/cni/bin 
		...

如果要使用calico的CNI插件，需要使用如下格式的配置文件，`/etc/cni/net.d/10-calico.conf`：

	{
	  "name": "calico-k8s-network",
	  "type": "calico",
	  "etcd_authority": "127.0.0.1:2379",
	  "log_level": "info",
	  "ipam": {
	    "type": "calico-ipam"
	  },
	  "policy": {
	    "type": "k8s"
	  },
	  "kubernetes": {
	          "kubeconfig": "/etc/kubernetes/kubelet.conf"
	 }
	}

并且在`/opt/cni/bin`中准备好配置文件中`type`同名的插件程序：

	$ls /opt/cni/bin/calico
	/opt/cni/bin/calico

## calico的cni-plugin

[calico cni-plugin][4]是一个独立的项目，这里分析的版本是`v1.5.0`。

代码结构特别清晰，就实现了两个方法`cmdAdd()`和`cmdDel()`。

	- functions
	   -cmdAdd(args *skel.CmdArgs) : error
	   -cmdDel(args *skel.CmdArgs) : error
	   -init()
	   -main()

calico的cni-plugin被运行的时候，在calico中创建或者删除workloadEndpoint，具体过程可以阅读[calico的架构设计与组件交互过程][5]中的cni-plugin一节。

kubelet会将calico的配置传递给cni-plugin，cni-plugin依据传递来的信息连接calico，例如：

	{
	  "name": "calico-k8s-network",
	  "type": "calico",
	  "etcd_authority": "127.0.0.1:2379",
	  "log_level": "info",
	  "ipam": {
	    "type": "calico-ipam"
	  },
	  "policy": {
	    "type": "k8s"
	  },
	  "kubernetes": {
	          "kubeconfig": "/etc/kubernetes/kubelet.conf"
	 }
	}

## NetworkPolicy的下发

kubernetes 1.6.4支持networkpolicy，创建的networkpolicy存放在etcd的`*/networkpolicies`目录中：

	$etcdctl ls /registry/networkpolicies
	/registry/networkpolicies/lijiaob-space
	/registry/networkpolicies/earth
	/registry/networkpolicies/lijiaob-space2

calico中ACL是通过profile和policy实现，profile相当于Openstack中的安全组，直接绑定到endpoint上的。policy相当于网络防火墙。对报文做准入检查时，先检查policy，然后检查profile。

通过calico的cni-plugin创建的endpoint的默认绑定到了一个名为`k8s_ns.<NAMESPACE>`的profile。

## 参考

1. [kubernetes 1.6.4 networkpolicy][1]
2. [CNI][2]
3. [kubernetes的Pod网络设置][3]
4. [calico cni-plugin][4]
5. [calico的架构设计与组件交互过程][5]

[1]: https://v1-6.docs.kubernetes.io/docs/concepts/services-networking/network-policies/  "kubernetes 1.6.4 networkpolicy" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/03/CNI.html  "CNI"
[3]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/03/Kubernetes-pod-network.html  "Kubernetes的Pod网络设置"
[4]: https://github.com/projectcalico/cni-plugin  "calico cni-plugin"
[5]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/08/04/calico-arch.html "Calico的架构设计与组件交互"
