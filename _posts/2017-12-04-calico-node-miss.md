---
layout: default
title: kubelet升级，导致calico中存在多余的workloadendpoint，node上存在多余的veth设备
author: 李佶澳
createdate: 2017/12/04 10:52:09
last_modified_at: 2017/12/08 20:21:17
categories: 问题
tags:  calico kubernetes
keywords: calico,kubernetes,workloadendpoint,veth
description: 有一个pod容器，无法对外访问，发现容器内的arp记录缺失

---

## 目录
* auto-gen TOC:
{:toc}

## 现象

有一个pod容器，无法对外访问，检查容器内的arp:

	# ip neigh
	Segmentation fault (core dumped)
	# bash-4.3# arp
	? (169.254.1.1) at <incomplete>  on eth0

可以看到没有默认网关的mac。

## 调查

用kubebectl找到容器，可以看到容器运行在node-20-48上。

	$ kubectl -n XXXXX-system get pod -o wide |grep XXXXX
	XXXXX-0                    1/1       Running   0          41m       192.168.247.231   paas-slave-20-48

用calicoctl查看对应的workloadendpoint，发现没有对应的workloadendpoint！

	$ calicoctl get workloadendpoint |grep XXXXX-system |grep XXXXX-0
	$ 

在node-20-48上可以找到这个容器，只能在容器内部看到`192.168.247.231`，在容器所在的node上无法访问这个IP。

## 分析

首先容器已经获得了IP，因此容器在创建的时候，应当是成功的调用了cni插件。

查看node-20.48上的kubelet日志：

	Dec 04 10:09:10 paas-slave-20-48 kubelet[5448]: INFO:1204 10:09:10.421593 5448 kuberuntime_manager.go:636]
	Determined the ip "192.168.247.220" for pod "XXXXX-0_XXXXX-system(1d402e65-d898-11e7-b1cd-5254171bf8db)" after sandbox changed
	...
	Dec 04 10:09:13 paas-slave-20-48 kubelet[5448]: INFO:1204 10:09:13.199012    5448 status_manager.go:325] 
	Ignoring same status for pod "XXXXX-0_XXXXX-system(1d402e65-d898-11e7-b1cd-5254171bf8db)", status: {Phase:Running Conditions:
	[{Type:Initialized Status:True LastProbeTime:0001-01-01 00:00:00 +0000 UTC LastTransitionTime:2017-12-04 10:09:08 +0800 CST Reason: Message:} 
	{Type:Ready Status:False LastProbeTime:0001-01-01 00:00:00 +0000 UTC LastTransitionTime:2017-12-04 10:09:08 +0800 CST Reason:ContainersNotReady Message:containers with unready status: [XXXXX]}
	{Type:PodScheduled Status:True LastProbeTime:0001-01-01 00:00:00 +0000 UTC LastTransitionTime:2017-12-04 10:09:09 +0800 CST Reason: Message:}] 
	Message: Reason: HostIP:10.39.20.48 PodIP:192.168.247.220 StartTime:2017-12-04 10:09:08 +0800 CST InitContainerStatuses:[] ContainerStatuses:[{Name:XXXXX State:{Waiting:nil Running:&ContainerStateRunning{StartedAt:2017-12-04 10:09:10 +0800 CST,}Terminated:nil}LastTerminationState:{Waiting: nil Running:nil Terminated:nil}
	Ready:false RestartCount:0 Image:reg.XXXXXXX.COM/paas/etcd-pet:3.2.4-v1 
	ImageID:docker-pullable://reg.XXXXXXX.COM/paas/etcd-pet@sha256:d1cffc59ea746082969c9323b9a6ab72145b39180570a51e13fea9b3253414ce
	ContainerID:docker://6a661302e2726a1c4aaaccb1ac96b31b0805f76e2fe6494dee023cef9bfde603}] QOSClass:Burstable}

可以看到容器XXXXX-0_XXXXX-system创建的时候，分配的IP是`192.168.247.220`，这是很奇怪的！kubect命名显示容器的IP是247.231。

继续看日志，发现在随后的status日志中，容器的ID和IP都发生了变化！

	Dec 04 10:11:45 paas-slave-20-48 kubelet[5448]: INFO:1204 10:11:45.929000    5448 status_manager.go:325] 
	Ignoring same status for pod "XXXXX-0_XXXXX-system(4f663934-d898-11e7-b1cd-5254171bf8db)", status: {Phase:Running Conditions:
	[{Type:Initialized Status:True LastProbeTime:0001-01-01 00:00:00 +0000 UTC LastTransitionTime:2017-12-04 10:10:32 +0800 CST Reason: Message:}
	{Type:Ready Status:False LastProbeTime:0001-01-01 00:00:00 +0000 UTC LastTransitionTime:2017-12-04 10:10:32 +0800 CST Reason:ContainersNotReady Message:containers with unready status: [XXXXX]}
	{Type:PodScheduled Status:True LastProbeTime:0001-01-01 00:00:00 +0000 UTC LastTransitionTime:2017-12-04 10:10:33 +0800 CST Reason: Message:}] 
	Message: Reason: HostIP:10.39.20.48 PodIP:192.168.247.231 StartTime:2017-12-04 10:10:32 +0800 CST InitContainerStatuses:[] ContainerStatuses:[{Name:XXXXX State:{Waiting:nil Running:&ContainerStateRunning{StartedAt:2017-12-04 10:10:34 +0800 CST,}Terminated:nil}LastTerminationState:{Waiting: nil Running:nil Terminated:nil}
	Ready:false RestartCount:0 Image:reg.XXXXXXX.COM/paas/etcd-pet:3.2.4-v1 
	ImageID:docker-pullable://reg.XXXXXXX.COM/paas/etcd-pet@sha256:d1cffc59ea746082969c9323b9a6ab72145b39180570a51e13fea9b3253414ce 
	ContainerID:docker://f8189c4b982a4e740210e9a0c1c8a730cd5d64ccf2b1f53ce092823bc7f46739}] QOSClass:Burstable}

而在node-20.48上看到的也是这个192.168.247.231的容器，容器ID为`f8189...`：

	# docker ps |grep XXXXX-0
	f8189c4b982a   reg.XXXXXXX.COM/paas/etcd-pet@sha256:d1cffc59ea746082969c9323b9a6ab72145b39180570a51e13fea9b3253414ce
	59436e9b460f   reg.XXXXXXX.COM/enncloud/pause-amd64:3.0 

在后续的日志再也没有看到192.168.247.220的出现。

这个192.168.247.231的容器是怎么出现的！！！怎么就鸠占鹊巢的把220的容器给顶替了！！！

甚至在node上都看不到那个消失的容器的尸体：

	# docker ps -a  |grep 6a661302e2726a
	#

## 继续分析

现在只能去分析220最后一次和231第一次出现中间的日志，期待能够发现有意义的线索。。

只发现了这样一条日志：

	Dec 04 10:10:48 paas-slave-20-48 kubelet[5448]: INFO:1204 10:10:48.059714    5448 summary.go:389] Missing default interface "eth0" for pod:XXXXX-system_XXXXX-0

其它的都是一些probe的日志，过于冗长，这里就不列出了。

怀疑kubernetes的问题，因为不久之前对kubernetes做过升级，从1.4.2升级到了1.7.6，calico没有做过改动。

用`kubectl -n XXXXX-system get ev`也没有发现什么有价值的信息。

## 再思考

考虑在调查问题时，经常发现有的pod的对应的calico网卡丢失了，有的多出来了。

将calico中所有的workloadendpoint列出来：

	calico get workloadendpoint -o wide 

然后将所有node上的网卡汇总：

	ip node

两者一对比，惊讶的发现calico中记录的网卡比node上实际存在的网卡整整多处了600多个！

calico中的网卡的创建和删除都是由kubelet调用CNI完成的，怀疑是在升级的时候，替换了kubelet，导致了所有pod重启，由于某种暂时未知的原因，在没有删除原先的workloadendpoint的时候，CNI插件就被调用创建了新的workloadendpint。

另外将node上的所有cali设备找出来，与calico中的记录比较，发现有一些cali设备在calico中没有记录。

手动删除了calico中多余的workloadenpoint，和node上多余的cali+XX设备

veth设备删除方法：

	ip link delete XXX type veth
