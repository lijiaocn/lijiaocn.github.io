---
layout: default
title: "Kubernetes1.12从零开始（一）：遇到的问题与解决方法"
author: 李佶澳
createdate: 2018/10/21 12:06:00
changedate: 2018/10/21 12:06:00
categories: 问题
tags: 视频教程 kubernetes 
keywords: kubernetes,容器集群,docker
description: 这里记录Kubernetes1.12从零开始的过程中遇到的一些问题与解决方法。

---

* auto-gen TOC:
{:toc}

## 说明

这里记录Kubernetes1.12从零开始的过程中遇到的一些问题与解决方法。

本系列所有文章可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到。

##  kubeadm init失败，kube-apiserver不停重启

>几周以后，使用最新版本的kubeadm，发现这个问题没有了 2018-10-21 20:27:11

`kubeadm init`时遇到了下面的问题：

	[init] waiting for the kubelet to boot up the control plane as Static Pods from directory "/etc/kubernetes/manifests" 
	[init] this might take a minute or longer if the control plane images have to be pulled
	
	                Unfortunately, an error has occurred:
	                        timed out waiting for the condition
	
	                This error is likely caused by:
	                        - The kubelet is not running
	                        - The kubelet is unhealthy due to a misconfiguration of the node in some way (required cgroups disabled)
	                        - No internet connection is available so the kubelet cannot pull or find the following control plane images:

观察发现其实apiserver已经启动，但是大概两分钟后自动推出，日志显示：

	E1006 09:45:23.046362       1 controller.go:173] no master IPs were listed in storage, refusing to erase all endpoints for the kubernetes service

东找西找，找到了这么一段[说明](https://deploy-preview-6695--kubernetes-io-master-staging.netlify.com/docs/admin/high-availability/#endpoint-reconciler):

	As mentioned in the previous section, the apiserver is exposed through a service called kubernetes. 
	The endpoints for this service correspond to the apiserver replicas that we just deployed.
	...
	there is special code in the apiserver to let it update its own endpoints directly. This code is called the “reconciler,” ..

这个和Apiserver高可用相关的，在kubernetes内部，apiserver被包装成一个名为`kubernetes`的服务，既然是服务，那么就要有后端的endpoints。对`kubernetes`服务来说，后端的endpoints
就是apiserver的地址，apiserver需要更新etcd中的endpoints记录。

另外从1.9以后，用参数`--endpoint-reconciler-type=lease`指定endpoint的更新方法，`lease`是默认值。

怀疑是1.12.1版本在apiserver高可用方面有bug，直接在`/etc/kubernetes/manifests/kube-apiserver.yaml`中，加了一行配置：

	 - --endpoint-reconciler-type=none
	 - --insecure-port=8080

然后apiserver就稳定运行不重启了，顺便把insecure-port设置为8080了。

github上两个issue[22609](https://github.com/kubernetes/kubernetes/issues/22609)、[1047](https://github.com/kubernetes/kubeadm/issues/1047)都很长时间没有可用的答案，让人感觉不太靠谱啊。。

这样更改之后，用`kubectl get cs`看到组件都正常：

	$ kubectl get cs
	NAME                 STATUS    MESSAGE              ERROR
	controller-manager   Healthy   ok
	scheduler            Healthy   ok
	etcd-0               Healthy   {"health": "true"}

虽然手动调整正常了，但是kubeadm init还是报错，没法获得添加node的命令

## Mac上CFSSL执行出错：Failed MSpanList_Insert 0xa0f000 0x19b27193a1671 0x0 0x0

下载的1.2版本的Mac版cfssl：

	curl -L https://pkg.cfssl.org/R1.2/cfssl_darwin-amd64 -o cfssl
	chmod +x cfssl

运行时直接报错：

	$ ./cfssl -h
	failed MSpanList_Insert 0xa0f000 0x19b27193a1671 0x0 0x0
	fatal error: MSpanList_Insert

	runtime stack:
	runtime.throw(0x6bbbe0, 0x10)
		/usr/local/go/src/runtime/panic.go:530 +0x90 fp=0x7ffeefbff3a0 sp=0x7ffeefbff388
	runtime.(*mSpanList).insert(0x9436e8, 0xa0f000)
		/usr/local/go/src/runtime/mheap.go:933 +0x293 fp=0x7ffeefbff3d0 sp=0x7ffeefbff3a0
	runtime.(*mheap).freeSpanLocked(0x942ee0, 0xa0f000, 0x100, 0x0)
	...

根据[runtime: fatal error: MSpanList_Insert on macOS 10.12 ](https://github.com/golang/go/issues/20888)中的说法，这应该是Go的版本不同造成的。我本地的Go版本是1.10.3，下载的cfssl文件，可能是用其它版本的Go编译的。

在[cfssl installation failed in OS X High Sierra](https://github.com/kelseyhightower/kubernetes-the-hard-way/issues/229)中，有人提出同样问题，看了一下回答，一种是建议用brew按照cfssl，一种是建议直接用go get，在本地重新编译。

