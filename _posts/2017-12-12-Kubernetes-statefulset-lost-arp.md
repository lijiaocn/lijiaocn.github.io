---
layout: default
title: cni插件使pod被重复删除，导致通过statefulset创建的pod被重新调度到同一个node上后，静态arp丢失，无法联通
author: lijiaocn
createdate: 2017/12/12 16:11:59
changedate: 2017/12/13 15:03:55
categories: 问题
tags: calico
keywords:
description: 终于找到pod的网关静态arp丢失,calico中的workloadendpoint丢失的原因了

---

* auto-gen TOC:
{:toc}

## 现象

在前面的几篇关于calico的问题调查中，屡次提到这个现象：

	Pod突然无法被访问，也无法访问外部，表面原因是容器内网关的静态ARP丢失。

在pod内查看arp记录：

	# ip neigh
		Segmentation fault (core dumped)
	# bash-4.3# arp
		? (169.254.1.1) at <incomplete>  on eth0

缺失了默认网关的mac后，所有pod的报文无法送出，但关键是arp记录为什么会丢失？

在之前的调查过程中，发现解决各种各样的其它问题，例如：

[calico的ipam的数据混乱，重建ipam记录][1]

[kubelet升级，导致calico中存在多余的workloadendpoint，node上存在多余的veth设备][2]

[calico路由丢失问题的调查][3]

但是arp记录为什么会丢失这个核心问题一直无解，calico的felix组件的代码也相当难读，迟迟没有进展。

现在终于把这个问题复现出来了！

## 提炼过程

在解决用户反馈过来的各种各样的网络问题过程中发现，虽然用户感知到的是各种状况，但是到我这里之后，这些千奇百怪的问题，一直没有逃脱下面的情形：

	1. 容器的网关静态arp记录丢失，calico中对应的workloadendpoint存在
	2. 容器的网关静态arp记录丢失，calico中对应的workloadendpoint不存在
	3. node上两个pod使用了同一个IP，这个IP在node上有两条arp记录
	4. Pod的IP在node上没有对应的arp记录，或者是failed状态

在起初无头绪的排查过程中，逐渐发现了大量的垃圾数据：

	1. calico中的workloadendpoint对应的Pod不存在
	2. node上以cali开头的veth设备，在calico中没有记录
	3. calico的ipam的block中记录了大量已经不存在的handler

将calico中多出的workloadendpoint删除、node上多出的veth设备删除、把ipam中的数据重建之后，情况有所改善，但问题还是会发生。

在这漫长的调查、处理过程中，心中潜藏的那个疑问的轮廓越来越来清晰了：

	为什么问题越来越集中在通过statefulset启动的容器上了？

在分析calico的ipam记录的格式、重建ipam记录的过程中，越发感觉到这与cni有关。

当开始思索`使用statefulset创建的容器和使用deployment创建的容器有什么不同？`的时候，突然有了一个想法：

>通过statefulset创建的Pod的名字是固定不变的！它们在calico的ipam中对应的handler的名字也是固定不变的！既然名字是不变的，那么有没有可能在删除一个老的Pod时候，把新的Pod的同名handler删除了？

## 现场日志

比较幸运的是，找到了一个不仅保存完整，而且Pod的创建日志和删除日志比较临近的日志。

	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Configured environment: [LANG=en_US.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin 
		CNI_COMMAND=ADD CNI_CONTAINERID=291716a39be97105e9169863bf847e714b3e7aed9a9add7a330e79f8a089b97b CNI_NETNS=/proc/16707/ns/net CNI_ARGS=IgnoreUnknown=1;IgnoreUnknown=1;K8S_POD_NAMESPACE=lijiaob;
		K8S_POD_NAME=etcd1-0;K8S_POD_INFRA_CONTAINER_ID=291716a39be97105e9169863bf847e714b3e7aed9a9add7a330e79f8a089b97b CNI_IFNAME=eth0 CNI_PATH=/opt/calico/bin:/opt/cni/bin 
		ETCD_AUTHORITY=kubernetes.default.svc.cluster.local:2379 ETCD_SCHEME=https ETCD_KEY_FILE=/etc/kubernetes/pki/client-key.pem ETCD_CERT_FILE=/etc/kubernetes/pki/client.pem 
		ETCD_CA_CERT_FILE=/etc/kubernetes/pki/ca.pem KUBECONFIG=/etc/kubernetes/kubelet.conf]"
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Datastore type: etcdv2"
	Dec 12 20:21:27 slave-197 kubelet[11608]: Calico CNI IPAM request count IPv4=1 IPv6=0
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Auto assigning IP" Workload=lijiaob.etcd1-0 assignArgs={1 0 0xc4204dbd40 map[]  <nil> <nil>}
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Auto-assign 1 ipv4, 0 ipv6 addrs for host 'slave-197'"
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Get Block affinity key from /calico/ipam/v2/host/slave-197/ipv4/block/192.168.252.64-26"
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Get Key: /calico/ipam/v2/assignment/ipv4/block/192.168.252.64-26"
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="New allocation attribute: {AttrPrimary:0xc4204dbd40 AttrSecondary:map[]}"
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Get Key: /calico/ipam/v2/handle/lijiaob.etcd1-0"
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Get Key: /calico/ipam/v2/config"
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Auto-assigned 1 out of 1 IPv4s: [192.168.252.66]"
	Dec 12 20:21:27 slave-197 kubelet[11608]: Calico CNI IPAM assigned addresses IPv4=[192.168.252.66] IPv6=[]
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="IPAM Result" Workload=lijiaob.etcd1-0 result.IP4=&\{192.168.252.66 ffffffff} <nil> []} result.IP6=<nil>
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Populated endpoint" Workload=lijiaob.etcd1-0 endpoint=&\{workloadEndpoint v1} \{} eth0 lijiaob.etcd1-0 k8
		s slave-197 map[]} {[192.168.252.66/32] [] <nil> <nil> [k8s_ns.lijiaob]  <nil>}}
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Fetched K8s labels" Workload=lijiaob.etcd1-0 labels=map[controller-revision-hash:etcd1-3950546577 tenxclo
		ud.com/petsetName:etcd1 tenxcloud.com/petsetType:etcd calico/k8s_ns:lijiaob ClusterID:CID-516874818ed4 UserID:8]
	Dec 12 20:21:27 slave-197 kubelet[11608]: Calico CNI using IPs: [192.168.252.66/32]
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Added Mac and interface name to endpoint" Workload=lijiaob.etcd1-0 endpoint=&\{workloadEndpoint v1} \{} e
		th0 lijiaob.etcd1-0 k8s slave-197 map[ClusterID:CID-516874818ed4 UserID:8 controller-revision-hash:etcd1-3950546577 tenxcloud.com/petsetName:etcd1 tenxcloud.com/petsetType:etcd calico/k8s_ns:l
		ijiaob]} {[192.168.252.66/32] [] <nil> <nil> [k8s_ns.lijiaob] cali9118ebbb10b 7e:b0:97:cb:d0:81}}
	Dec 12 20:21:27 slave-197 kubelet[11608]: time="2017-12-12T20:21:27+08:00" level=info msg="Wrote updated endpoint to datastore" Workload=lijiaob.etcd1-0

注意这时候Pod的IP已经申请分配了，对应的SandboxID为： 291716a39be97105e9169863bf847e714b3e7aed9a9add7a330e79f8a089b97b

在node上可以看到正在运行的sandbox容器：

	$ docker ps |grep 291716a39be9
	291716a39be9        reg.lijiaocn.cn/lijiaocn/pause-amd64:3.0      "/pause"   40 minutes ago      Up 40 minutes        k8s_POD_etcd1-0_lijiaob_f8d1e7d4-df36-11e7-9d36-5254b24cbf5e_0

接下来的日志揭示了问题：

	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Configured environment: [LANG=en_US.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin 
		CNI_COMMAND=DEL CNI_CONTAINERID=94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21 CNI_NETNS= CNI_ARGS=IgnoreUnknown=1;IgnoreUnknown=1;K8S_POD_NAMESPACE=lijiaob;K8S_POD_NAME=etcd1-0;
		K8S_POD_INFRA_CONTAINER_ID=94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21 CNI_IFNAME=eth0 CNI_PATH=/opt/calico/bin:/opt/cni/bin ETCD_AUTHORITY=kubernetes.default.svc.cluster.
		local:2379 ETCD_SCHEME=https ETCD_KEY_FILE=/etc/kubernetes/pki/client-key.pem ETCD_CERT_FILE=/etc/kubernetes/pki/client.pem ETCD_CA_CERT_FILE=/etc/kubernetes/pki/ca.pem KUBECONFIG=/etc/kubern
		tes/kubelet.conf]"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Datastore type: etcdv2"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Releasing address using workloadID" Workload=lijiaob.etcd1-0
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Releasing all IPs with handle 'lijiaob.etcd1-0'"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Get Key: /calico/ipam/v2/handle/lijiaob.etcd1-0"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Get Key: /calico/ipam/v2/assignment/ipv4/block/192.168.176.64-26"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Released address using workloadID" Workload=lijiaob.etcd1-0
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Configured environment: [LANG=en_US.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin 
		CNI_COMMAND=DEL CNI_CONTAINERID=94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21 CNI_NETNS= CNI_ARGS=IgnoreUnknown=1;IgnoreUnknown=1;K8S_POD_NAMESPACE=lijiaob;K8S_POD_NAME=etcd
		1-0;K8S_POD_INFRA_CONTAINER_ID=94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21 CNI_IFNAME=eth0 CNI_PATH=/opt/calico/bin:/opt/cni/bin ETCD_AUTHORITY=kubernetes.default.svc.clus
		ter.local:2379 ETCD_SCHEME=https ETCD_KEY_FILE=/etc/kubernetes/pki/client-key.pem ETCD_CERT_FILE=/etc/kubernetes/pki/client.pem ETCD_CA_CERT_FILE=/etc/kubernetes/pki/ca.pem KUBECONFIG=/etc/ku
		bernetes/kubelet.conf]"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Datastore type: etcdv2"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Delete Key: /calico/v1/host/slave-197/workload/k8s/lijiaob.etcd1-0/endpoint/eth0"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Delete empty Key: /calico/v1/host/slave-197/workload/k8s/lijiaob.etcd1-0/endpoint"
	Dec 12 20:22:24 slave-197 kubelet[11608]: time="2017-12-12T20:22:24+08:00" level=info msg="Delete empty Key: /calico/v1/host/slave-197/workload/k8s/lijiaob.etcd1-0"
	Dec 12 20:22:24 slave-197 kubelet[11608]: WARNING:1212 20:22:24.966944   11608 cni.go:258] CNI failed to retrieve network namespace path: Cannot find network namespace for the terminated container
		"9fb800b7773e8413e1c0fc65ff957b615afa932cb1c7220491417d69dbcc0319"
	Dec 12 20:22:25 slave-197 kubelet[11608]: time="2017-12-12T20:22:25+08:00" level=info msg="Extracted identifiers" Node=slave-197 Orchestrator=k8s Workload=dev-laikang.cudoc-service-2824592204-3f6qj
	Dec 12 20:22:25 slave-197 kubelet[11608]: Calico CNI releasing IP address

从上面的日志可以看到，一个ID为`94feeebc95fb`的sandbox被删除了，这个sandbox使用的workloadendpoint刚才新建的Pod的workloadendpoint是同名的。

查阅这之以前的日志发现，发现ID为9494feeebc95fb的容器的删除一直失败：

	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Configured environment: [LANG=en_US.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin 
		CNI_COMMAND=DEL CNI_CONTAINERID=94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21 CNI_NETNS= CNI_ARGS=IgnoreUnknown=1;IgnoreUnknown=1;K8S_POD_NAMESPACE=lijiaob;K8S_POD_NAME=etcd
		1-0;K8S_POD_INFRA_CONTAINER_ID=94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21 CNI_IFNAME=eth0 CNI_PATH=/opt/calico/bin:/opt/cni/bin ETCD_AUTHORITY=kubernetes.default.svc.clus
		ter.local:2379 ETCD_SCHEME=https ETCD_KEY_FILE=/etc/kubernetes/pki/client-key.pem ETCD_CERT_FILE=/etc/kubernetes/pki/client.pem ETCD_CA_CERT_FILE=/etc/kubernetes/pki/ca.pem KUBECONFIG=/etc/kub
		ernetes/kubelet.conf]"                              
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Datastore type: etcdv2"
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Releasing address using workloadID" Workload=lijiaob.etcd1-0
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Releasing all IPs with handle 'lijiaob.etcd1-0'"
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Get Key: /calico/ipam/v2/handle/lijiaob.etcd1-0"
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Get Key: /calico/ipam/v2/assignment/ipv4/block/192.168.176.64-26"
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Released address using workloadID" Workload=lijiaob.etcd1-0
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Configured environment: [LANG=en_US.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin 
		CNI_COMMAND=DEL CNI_CONTAINERID=94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21 CNI_NETNS= CNI_ARGS=IgnoreUnknown=1;IgnoreUnknown=1;K8S_POD_NAMESPACE=lijiaob;K8S_POD_NAME=etcd
		1-0;K8S_POD_INFRA_CONTAINER_ID=94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21 CNI_IFNAME=eth0 CNI_PATH=/opt/calico/bin:/opt/cni/bin ETCD_AUTHORITY=kubernetes.default.svc.clus
		ter.local:2379 ETCD_SCHEME=https ETCD_KEY_FILE=/etc/kubernetes/pki/client-key.pem ETCD_CERT_FILE=/etc/kubernetes/pki/client.pem ETCD_CA_CERT_FILE=/etc/kubernetes/pki/ca.pem KUBECONFIG=/etc/kub
		ernetes/kubelet.conf]"
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Datastore type: etcdv2"
	Dec 12 20:00:18 slave-197 kubelet[11608]: time="2017-12-12T20:00:18+08:00" level=info msg="Delete Key: /calico/v1/host/slave-197/workload/k8s/lijiaob.etcd1-0/endpoint/eth0"
	Dec 12 20:00:18 slave-197 kubelet[11608]: ERROR:1212 20:00:18.678639   11608 cni.go:312] Error deleting network: resource does not exist: WorkloadEndpoint(node=slave-197, orchestrator=k8s, workloa
		d=lijiaob.etcd1-0, name=eth0)
	Dec 12 20:00:18 slave-197 kubelet[11608]: ERROR:1212 20:00:18.680159   11608 remote_runtime.go:114] StopPodSandbox "94feeebc95fbcf081f75bdc9bad7a97e74903e847a80b51bf89a6fadafc3ae21" from runtime 
		service failed: rpc error: code = 2 desc = NetworkPlugin cni failed to teardown pod "etcd1-0_lijiaob" network: resource does not exist: WorkloadEndpoint(node=slave-197, orchestrator=k8s,
		workload=lijiaob.etcd1-0, name=eth0)
	Dec 12 20:00:18 slave-197 kubelet[11608]: ERROR
	Dec 12 20:00:18 slave-197 kubelet[11608]: WARNING

到etcd中查看kubernetes的数据，删除pod的事件存放在`/registry/events/<Namespace>`中。

kubelet会定时重新执行失败的事件，重启kubelet的时候也可以看到重新执行失败的事件的过程。

猜测是在删除旧的Pod的过程中将新的Pod的workloadendpoint删除了。

## 问题复现

构造一个环境，开始复现这个问题，

kubernetes版本为1.7.6，calico的felix版本为2.0.0，calico的cni版本为1.5.0。

### 准备环境

创建一个正常的statefulset，只包含一个pod:

	$ kubectl -n lijiaob get pod -o wide |grep stateful
	stateful-new-pod-0   1/1       Running   0          1m        192.168.8.33   dev-slave-107

验证workloadendpoint的存在：

	$ calicoctl get workloadendpoint -o wide |grep stateful-new
	dev-slave-107       k8s            lijiaob.stateful-new-pod-0                              eth0   192.168.8.33/32             cali91dded39638   k8s_ns.lijiaob

Pod可以访问：

	$ ping  192.168.8.33
	PING 192.168.8.33 (192.168.8.33) 56(84) bytes of data.
	64 bytes from 192.168.8.33: icmp_seq=1 ttl=63 time=0.565 ms
	64 bytes from 192.168.8.33: icmp_seq=2 ttl=63 time=0.437 ms

pod中的路由与静态arp正常：

	/ # ip route
	default via 169.254.1.1 dev eth0
	169.254.1.1 dev eth0

	/ # ip neigh
	169.254.1.1 dev eth0 lladdr 32:76:e6:6f:ff:22 ref 1 used 0/0/0 probes 1 REACHABLE

在node上查看pod的两个容器，sandbox容器的ID为`41857f70ed13`：

	$ docker ps |grep stateful-new
	689a30daab62     "/bin/bash /daemon.sh"   6 minutes ago       Up 6 minutes      k8s_stateful-pod_stateful-new-pod-0_lijiaob_0bdc387d-dfac-11e7-9a8f-52549da43ad9_0
	41857f70ed13     "/pause"                 6 minutes ago       Up 6 minutes      k8s_POD_stateful-new-pod-0_lijiaob_0bdc387d-dfac-11e7-9a8f-52549da43ad9_0

### 触发问题

直接删除pod的workloadendpoint：

	$ calicoctl delete workloadendpoint eth0 --workload=lijiaob.stateful-new-pod-0 --node=dev-slave-107  --orchestrator=k8s
	Successfully deleted 1 'workloadEndpoint' resource(s)

这时候Pod无法ping通：

	$ ping  192.168.8.33
	PING 192.168.8.33 (192.168.8.33) 56(84) bytes of data.
	^C
	--- 192.168.8.33 ping statistics ---
	40 packets transmitted, 0 received, 100% packet loss, time 38992ms

Pod内路由正确，arp丢失，与线上问题的现象一致：

	/ # ip route
	default via 169.254.1.1 dev eth0
	169.254.1.1 dev eth0
	/ # ip neigh
	Segmentation fault (core dumped)

在node上查看Pod的容器，还是以前的容器：

	$ docker ps |grep stateful-new
	689a30daab62     "/bin/bash /daemon.sh"   6 minutes ago       Up 6 minutes       k8s_stateful-pod_stateful-new-pod-0_lijiaob_0bdc387d-dfac-11e7-9a8f-52549da43ad9_0
	41857f70ed13     "/pause"                 6 minutes ago       Up 6 minutes       k8s_POD_stateful-new-pod-0_lijiaob_0bdc387d-dfac-11e7-9a8f-52549da43ad9_0

这时候删除Pod：

	$ kubectl -n lijiaob delete pod stateful-new-pod-0
	pod "stateful-new-pod-0" deleted

一段时间后，statefulset自动创建了同名的Pod：

	$ kubectl -n lijiaob get pod -o wide |grep stateful
	stateful-new-pod-0   0/1       Running   0          15s       192.168.8.34   dev-slave-107

>注意IP地址已经改变了，它申请了一个新的workloadendpint：

但是，没有在calico中找到这个workloadendpoint：

	$ calicoctl get workloadendpoint -o wide |grep stateful-new
	<empty>

并且新Pod的地址无法ping通：

	 $ ping 192.168.8.34
	 PING 192.168.8.34 (192.168.8.34) 56(84) bytes of data.
	 ^C
	 --- 192.168.8.34 ping statistics ---
	 4 packets transmitted, 0 received, 100% packet loss, time 2998ms

查看容器内状态，路由正常，静态arp丢失：

	/ # ip route
	default via 169.254.1.1 dev eth0
	169.254.1.1 dev eth0
	/ # ip neigh
	Segmentation fault (core dumped)

查看node上容器，新的容器已经替换了老的容器：

	$ docker ps -a |grep stateful-new
	50fbf6844903        "/bin/bash /daemon.sh"   About a minute ago   Up About a minute    k8s_stateful-pod_stateful-new-pod-0_lijiaob_35b722f5-dfad-11e7-9a8f-52549da43ad9_0
	247d3c783345        "/pause"                 About a minute ago   Up About a minute    k8s_POD_stateful-new-pod-0_lijiaob_35b722f5-dfad-11e7-9a8f-52549da43ad9_0

复现完成。

### 复现结果核实

查看Node上的日志，第一次删除Pod的时候，因为workloadendpoint不存在，删除失败。

	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=info msg="Datastore type: etcdv2"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=debug msg="Using datastore type 'etcdv2'"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=info msg="Delete Key: /calico/v1/host/dev-slave-107/workload/k8s/lijiaob.stateful-new-pod-0/endpoint/eth0"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=debug msg="Key not found error"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: ERROR:1213 10:27:42.891750   15567 cni.go:312] Error deleting network: resource does not exist: WorkloadEndpoint(node=dev-slave-107, orchestrator=k8s,
		workload=lijiaob.stateful-new-pod-0, name=eth0)
	Dec 13 10:27:43 dev-slave-107 kubelet[15567]: ERROR:1213 10:27:43.029094   15567 remote_runtime.go:114] StopPodSandbox "41857f70ed13326dbc2c04e7d8e7c56c28f83df67e82e76d2fb4d74b7ab24659" from runti
		me service failed: rpc error: code = 2 desc = NetworkPlugin cni failed to teardown pod "stateful-new-pod-0_lijiaob" network: resource does not exist: WorkloadEndpoint(node=dev-slave-107, orche
		strator=k8s, workload=lijiaob.stateful-new-pod-0, name=eth0)
	Dec 13 10:27:43 dev-slave-107 kubelet[15567]: ERROR
	Dec 13 10:27:43 dev-slave-107 kubelet[15567]: ERROR:1213 10:27:43.029274   15567 kubelet.go:1530] error killing pod: failed to "KillPodSandbox" for "0bdc387d-dfac-11e7-9a8f-52549da43ad9" with Kill
		PodSandboxError: "rpc error: code = 2 desc = NetworkPlugin cni failed to teardown pod \"stateful-new-pod-0_lijiaob\" network: resource does not exist: WorkloadEndpoint(node=dev-slave-107, orch
		estrator=k8s, workload=lijiaob.stateful-new-pod-0, name=eth0)"

日志中显示StopPodSandbox失败，但是查看node上的容器，已经是全新的容器，之前的Pod的容器已经被彻底删除：

	$ docker ps -a |grep stateful-new
	50fbf6844903        "/bin/bash /daemon.sh"   About a minute ago   Up About a minute    k8s_stateful-pod_stateful-new-pod-0_lijiaob_35b722f5-dfad-11e7-9a8f-52549da43ad9_0
	247d3c783345        "/pause"                 About a minute ago   Up About a minute    k8s_POD_stateful-new-pod-0_lijiaob_35b722f5-dfad-11e7-9a8f-52549da43ad9_0

找到新的Pod创建过程中的日志，发现申请了新的workloadednpoint，并且完成了设置：

	Dec 13 10:27:48 dev-slave-107 kubelet[15567]: INFO:1213 10:27:48.190087   15567 kubelet.go:1931] SyncLoop (ADD, "api"): "stateful-new-pod-0_lijiaob(35b722f5-dfad-11e7-9a8f-52549da43ad9)"
	...
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="Datastore type: etcdv2"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Using datastore type 'etcdv2'"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="List Key: /calico/v1/host/dev-slave-107/workload/k8s/lijiaob.stateful-new-pod-0/endpoint"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Key not found error"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Retrieved endpoints: &\{workloadEndpointList v1} {} []}" Workload=lijiaob.stateful-new-pod-0
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: Calico CNI checking for existing endpoint: <nil>
	...
	...(workloadendpoint不存在，调用CNI创建) ...
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="Configured environment: [LANG=en_US.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin 
		CNI_COMMAND=ADD CNI_CONTAINERID=247d3c7833453715487a4cc892be62060707cd933d618e32a596c159fe23166e CNI_NETNS=/proc/21740/ns/net CNI_ARGS=IgnoreUnknown=1;IgnoreUnknown=1;K8S_POD_NAMESPACE=lijiaob;
		K8S_POD_NAME=stateful-new-pod-0;K8S_POD_INFRA_CONTAINER_ID=247d3c7833453715487a4cc892be62060707cd933d618e32a596c159fe23166e CNI_IFNAME=eth0 CNI_PATH=/opt/calico/bin:/opt/cni/bin ETCD_ENDPOINTS=
		https://10.39.0.105:2379 ETCD_KEY_FILE=/etc/cni/net.d/calico-tls/etcd-key ETCD_CERT_FILE=/etc/cni/net.d/calico-tls/etcd-cert ETCD_CA_CERT_FILE=/etc/cni/net.d/calico-tls/etcd-ca KUBECONFIG=/etc/cni
		/net.d/calico-kubeconfig K8S_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIs
		Imt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkZWZhdWx0LXRva2VuLWdlcXU3Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImRlZmF1bHQiLCJrdWJlcm5ldGVzLmlvL3NlcnZp
		Y2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiJmOWI5NTJiNi00YzBkLTExZTctYmM3MC01MjU0OWRhNDNhZDkiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZS1zeXN0ZW06ZGVmYXVsdCJ9.MxpUsaClCniErwiB96JCheAHR61AUbsVEaG
		eUUtUpdROY4aO8BGKI2qNN7axCDKyZTejDnifVgayBEQZH9vkf-lZeCci5iLCUU3KxPZm_014hEd9zl2iruNUB2VNhX3jPbBrJAyVckTR96jvGOzphW9_qa45mp2_SiJKIJ2q1JL3IpuqI9AOa35QnjGclvwT81UYSYwV5MDDziwvbXrshFDiLuoM82aFZvhExt
		AQdV5EdtNQfhUXLi8GNgekLmr1Hdt5eWcpPNCnvgT86oq4_uAYro_q_mb1uyC245gdyaftHyv8xGCkBoyX_1elijsb2SJ-9z2uz-W46fErKq4YrA]"
	...
	...(分配的到新的IP地址为192.168.8.34)...
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="Auto-assigned 1 out of 1 IPv4s: [192.168.8.34]"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: Calico CNI IPAM assigned addresses IPv4=[192.168.8.34] IPv6=[]
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="IPAM Result" Workload=lijiaob.stateful-new-pod-0 result.IP4=&\{192.168.8.34 ffffffff} <nil> []} result.IP6=<nil>
	...
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Block '192.168.8.0/26' provided addresses: [192.168.8.34]"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="Get Key: /calico/ipam/v2/config"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Key not found error"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Allocate new blocks? Config: &{StrictAffinity:false AutoAllocateBlocks:true}"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="Auto-assigned 1 out of 1 IPv4s: [192.168.8.34]"
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: Calico CNI IPAM assigned addresses IPv4=[192.168.8.34] IPv6=[]
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="IPAM Result" Workload=lijiaob.stateful-new-pod-0 result.IP4=&\{192.168.8.34 ffffffff} <nil> []} result.IP6=<nil>
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="IPAM plugin returned: IP4:{IP:{IP:192.168.8.34 Mask:ffffffff} Gateway:<nil> Routes:[]}, DNS:{Nameser
		vers:[] Domain: Search:[] Options:[]}" Workload=lijiaob.stateful-new-pod-0
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="Populated endpoint" Workload=lijiaob.stateful-new-pod-0 endpoint=&\{workloadEndpoint v1} \{} eth0 lij
		iaob.stateful-new-pod-0 k8s dev-slave-107 map[]} {[192.168.8.34/32] [] <nil> <nil> [k8s_ns.lijiaob]  <nil>}}
	...
	...(CNI完成了对Pod的设置)...
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: Calico CNI using IPs: [192.168.8.34/32]
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Found MAC for container veth" MAC="82:5b:71:af:af:84" Workload=lijiaob.stateful-new-pod-0
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="Added Mac and interface name to endpoint" Workload=lijiaob.stateful-new-pod-0 endpoint=&\{workloadEnd
		point v1} \{} eth0 lijiaob.stateful-new-pod-0 k8s dev-slave-107 map[ClusterID:CID-f794208bc85f UserID:44 controller-revision-hash:stateful-new-pod-741587310 tenxcloud.com/petsetName:stateful-p
		od tenxcloud.com/petsetType:etcd calico/k8s_ns:lijiaob]} {[192.168.8.34/32] [] <nil> <nil> [k8s_ns.lijiaob] cali91dded39638 82:5b:71:af:af:84}}
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Setting KV in etcd" key=WorkloadEndpoint(node=dev-slave-107, orchestrator=k8s, workload=lijiaob.stat
		eful-new-pod-0, name=eth0) options=&{ 0  0s false false false} rev=<nil> ttl=0s value=&{active cali91dded39638 82:5b:71:af:af:84 [k8s_ns.lijiaob] [192.168.8.34/32] [] [] [] map[UserID:44 contr
		oller-revision-hash:stateful-new-pod-741587310 tenxcloud.com/petsetName:stateful-pod tenxcloud.com/petsetType:etcd calico/k8s_ns:lijiaob ClusterID:CID-f794208bc85f] <nil> <nil>}
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=debug msg="Set succeeded" key=WorkloadEndpoint(node=dev-slave-107, orchestrator=k8s, workload=lijiaob.stateful-
		new-pod-0, name=eth0) newRev=72540944 rev=<nil> ttl=0s value=&{active cali91dded39638 82:5b:71:af:af:84 [k8s_ns.lijiaob] [192.168.8.34/32] [] [] [] map[ClusterID:CID-f794208bc85f UserID:44 con
		troller-revision-hash:stateful-new-pod-741587310 tenxcloud.com/petsetName:stateful-pod tenxcloud.com/petsetType:etcd calico/k8s_ns:lijiaob] <nil> <nil>}
	Dec 13 10:27:49 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:49+08:00" level=info msg="Wrote updated endpoint to datastore" Workload=lijiaob.stateful-new-pod-0

继续看后面的日志，CNI又被调用了一次，要删除workloadendpint是`K8S_POD_NAMESPACE=lijiaob;K8S_POD_NAME=stateful-new-pod-0`，与前面新建的workoadendpoint同名:

	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Configured environment: [LANG=en_US.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin CNI_
	COMMAND=DEL CNI_CONTAINERID=41857f70ed13326dbc2c04e7d8e7c56c28f83df67e82e76d2fb4d74b7ab24659 CNI_NETNS= CNI_ARGS=IgnoreUnknown=1;IgnoreUnknown=1;K8S_POD_NAMESPACE=lijiaob;K8S_POD_NAME=stateful-new
	-pod-0;K8S_POD_INFRA_CONTAINER_ID=41857f70ed13326dbc2c04e7d8e7c56c28f83df67e82e76d2fb4d74b7ab24659 CNI_IFNAME=eth0 CNI_PATH=/opt/calico/bin:/opt/cni/bin ETCD_ENDPOINTS=https://10.39.0.105:2379 ETC
	D_KEY_FILE=/etc/cni/net.d/calico-tls/etcd-key ETCD_CERT_FILE=/etc/cni/net.d/calico-tls/etcd-cert ETCD_CA_CERT_FILE=/etc/cni/net.d/calico-tls/etcd-ca KUBECONFIG=/etc/cni/net.d/calico-kubeconfig K8S
	_API_TOKEN=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSIsImt1YmVybmV0ZXMuaW8vc2Vydmlj
	ZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJkZWZhdWx0LXRva2VuLWdlcXU3Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImRlZmF1bHQiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNj
	b3VudC51aWQiOiJmOWI5NTJiNi00YzBkLTExZTctYmM3MC01MjU0OWRhNDNhZDkiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZS1zeXN0ZW06ZGVmYXVsdCJ9.MxpUsaClCniErwiB96JCheAHR61AUbsVEaGeUUtUpdROY4aO8BGKI2qNN7axCDK
	yZTejDnifVgayBEQZH9vkf-lZeCci5iLCUU3KxPZm_014hEd9zl2iruNUB2VNhX3jPbBrJAyVckTR96jvGOzphW9_qa45mp2_SiJKIJ2q1JL3IpuqI9AOa35QnjGclvwT81UYSYwV5MDDziwvbXrshFDiLuoM82aFZvhExtAQdV5EdtNQfhUXLi8GNgekLmr1Hdt
	5eWcpPNCnvgT86oq4_uAYro_q_mb1uyC245gdyaftHyv8xGCkBoyX_1elijsb2SJ-9z2uz-W46fErKq4YrA]"

新建的workloadendpoint被成功的删除：

	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Get Key: /calico/ipam/v2/handle/lijiaob.stateful-new-pod-0"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=debug msg="Deleting handle: lijiaob.stateful-new-pod-0"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Delete Key: /calico/ipam/v2/handle/lijiaob.stateful-new-pod-0"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=debug msg="Command completed without error"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Decremented handle 'lijiaob.stateful-new-pod-0' by 1"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Released address using workloadID" Workload=lijiaob.stateful-new-pod-0

	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Datastore type: etcdv2"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=debug msg="Using datastore type 'etcdv2'"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Delete Key: /calico/v1/host/dev-slave-107/workload/k8s/lijiaob.stateful-new-pod-0/endpoint/eth0"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Delete empty Key: /calico/v1/host/dev-slave-107/workload/k8s/lijiaob.stateful-new-pod-0/endpoint"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=info msg="Delete empty Key: /calico/v1/host/dev-slave-107/workload/k8s/lijiaob.stateful-new-pod-0"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: time="2017-12-13T10:28:09+08:00" level=debug msg="Command completed without error"

接下来停止sandbox，但是sandbox已经在第一次删除的时候删除了，不过这里只显示了WARNING

	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: WARNING:1213 10:28:09.474170   15567 docker_sandbox.go:342] failed to read pod IP from plugin/docker: NetworkPlugin cni failed on the status hook 
		for pod "stateful-new-pod-0_lijiaob": CNI failed to retrieve network namespace path: Cannot find network namespace for the terminated container "41857f70ed13326dbc2c04e7d8e7c56c28f83df67e82e76d2fb4d74b7ab24659"
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: WARNING
	Dec 13 10:28:09 dev-slave-107 kubelet[15567]: WARNING

后续的日志没有再出现删除老的Pod日志，可以认为第一次删除Pod的操作，直到删除了新Pod的同名workloadendpoint之后才结束，在这之前会循环的执行删除操作。

## 生产环境的问题是怎么发生的？

在复现的环境中，老的Pod已经被成功删除时，将新的Pod的workloadendpoint一起删除了，导致新的Pod现在无法被访问，也无法访问外部。

而且，因为新的Pod没有了workloadendpoint，所以对它的删除也将失败，直到下一个新的Pod的同名workloadendpoint成为替死鬼，又开始了一个新的循环。

但是线上的问题是怎样发生的？并没有人主动删除workloadenpoint。

回想起线上环境曾经遇到的一个问题，docker日志中有大量的删除失败的记录：

	Jul 14 15:22:06 slave-97 dockerd: time="2017-07-14T15:22:06.567346680+08:00" level=error msg="Handler for DELETE /containers/593d8a89ee37580673159eb34937654338786d1de8ea6e09cf794f5a4c9f410c
		returned error: Unable to remove filesystem for 593d8a89ee37580673159eb34937654338786d1de8ea6e09cf794f5a4c9f410c: 
		remove /var/lib/docker/containers/593d8a89ee37580673159eb34937654338786d1de8ea6e09cf794f5a4c9f410c/shm: device or resource busy"
	Jul 14 15:22:06 slave-97 dockerd: time="2017-07-14T15:22:06.569694133+08:00" level=error msg="Handler for DELETE /containers/3a2739cb382df62d46fe8ab9f8955c492838ef65f239d41d6a8dff0f87757b69 
		returned error: Unable to remove filesystem for 3a2739cb382df62d46fe8ab9f8955c492838ef65f239d41d6a8dff0f87757b69: 
		remove /var/lib/docker/containers/3a2739cb382df62d46fe8ab9f8955c492838ef65f239d41d6a8dff0f87757b69/shm: device or resource busy"
	Jul 14 15:22:06 slave-97 kernel: device-mapper: thin: Deletion of thin device 65 failed.
	Jul 14 15:22:06 slave-97 dockerd: time="2017-07-14T15:22:06.580657644+08:00" level=error msg="Error removing mounted layer c8d3ee5070ba7f5d4963f18b9c6f2d7c719d2e0bb519b11829dbf9d44f2b6904: 
		remove /var/lib/docker/devicemapper/mnt/353abb03acd5a934943ff11ba8f2bacb9c0a342ac86b6586c0cb7f3f1e98ba91: device or resource busy"

一些处于Dead状态的容器也无法删除：

	$docker ps -a |grep Dead |awk '{print $1}' |xargs docker rm
	Error response from daemon: Driver devicemapper failed to remove root filesystem a5144c558eabbe647ee9a25072746935e03bb797f4dcaf44c275e0ea4ada463a:
		remove /var/lib/docker/devicemapper/mnt/25cb26493fd3c804d96e802a95d6c74d7cae68032bf50fc640f40ffe40cc4188: device or resource busy
	Error response from daemon: Driver devicemapper failed to remove root filesystem bdd60d5104076351611efb4cdb34c50c9d3f2136fdaea74c9752e2df9fd6f40f: 
		remove /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7: device or resource busy
	Error response from daemon: Driver devicemapper failed to remove root filesystem 847b5bb74762a7356457cc331d948e5c47335bbd2e0d9d3847361c6f69e9c369: 
		remove /var/lib/docker/devicemapper/mnt/71e7b20dca8fd9e163c3dfe90a3b31577ee202a03cd1bd5620786ebabdc4e52a: device or resource busy
	Error response from daemon: Driver devicemapper failed to remove root filesystem a85e44dfa07c060244163e19a545c76fd25282f2474faa205d462712866aac51: 
		remove /var/lib/docker/devicemapper/mnt/8bcd524cc8bfb1b36506bf100090c52d7fbbf48ea00b87a53d69f32e537737b7: device or resource busy

调查发现，这些已经退出的容器中的目录被挂载到了其它的容器或者namespace中，因此无法删除。

直接原因是在容器B以hostpath的方式将/var/lib/docker和/var/lib/kubelet目录挂载到了容器B中，具体情况见 [因为目录被其它的容器挂载使用，导致已经退出的容器无法被删除][4]。

怀疑这些删不掉的容器虽然后来被手动清除，但是它们对应的Pod的删除事件一直都是执行失败的状态，kubelet还在不停执行删除操作，成为无缘无故删除workloadendpoint的元凶。

## 升级CNI版本

在复现环境中使用的calico的cni版本是1.5.0，该版本的cni在Pod的workloadendpoint不存在的时候，直接返回错误：

	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=info msg="Datastore type: etcdv2"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=debug msg="Using datastore type 'etcdv2'"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=info msg="Delete Key: /calico/v1/host/dev-slave-107/workload/k8s/lijiaob.stateful-new-pod-0/endpoint/eth0"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: time="2017-12-13T10:27:42+08:00" level=debug msg="Key not found error"
	Dec 13 10:27:42 dev-slave-107 kubelet[15567]: ERROR:1213 10:27:42.891750   15567 cni.go:312] Error deleting network: resource does not exist: WorkloadEndpoint(node=dev-slave-107, orchestrator=k8s,
		workload=lijiaob.stateful-new-pod-0, name=eth0)
	Dec 13 10:27:43 dev-slave-107 kubelet[15567]: ERROR:1213 10:27:43.029094   15567 remote_runtime.go:114] StopPodSandbox "41857f70ed13326dbc2c04e7d8e7c56c28f83df67e82e76d2fb4d74b7ab24659" from runti
		me service failed: rpc error: code = 2 desc = NetworkPlugin cni failed to teardown pod "stateful-new-pod-0_lijiaob" network: resource does not exist: WorkloadEndpoint(node=dev-slave-107, orche
		strator=k8s, workload=lijiaob.stateful-new-pod-0, name=eth0)
	Dec 13 10:27:43 dev-slave-107 kubelet[15567]: ERROR
	Dec 13 10:27:43 dev-slave-107 kubelet[15567]: ERROR:1213 10:27:43.029274   15567 kubelet.go:1530] error killing pod: failed to "KillPodSandbox" for "0bdc387d-dfac-11e7-9a8f-52549da43ad9" with Kill
		PodSandboxError: "rpc error: code = 2 desc = NetworkPlugin cni failed to teardown pod \"stateful-new-pod-0_lijiaob\" network: resource does not exist: WorkloadEndpoint(node=dev-slave-107, orch
		estrator=k8s, workload=lijiaob.stateful-new-pod-0, name=eth0)"

而calico的cni1.10.0版本在Pod的workloadendpoint不存在的时候，不会报错：

	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.189 [INFO][14313] client.go 202: Loading config from environment
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.189 [DEBUG][14313] client.go 31: Using datastore type 'etcdv2'
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.190011 I | warning: ignoring ServerName for user-provided CA for backwards compatibility is deprecated
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.190 [DEBUG][14313] validator.go 168: Validate namespacedname: eth0
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.190 [DEBUG][14313] validator.go 168: Validate namespacedname: lijiaob.stateful-new-pod-0
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.190 [DEBUG][14313] validator.go 168: Validate namespacedname: k8s
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.190 [DEBUG][14313] validator.go 162: Validate name: dev-slave-107
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.190 [DEBUG][14313] etcd.go 214: Get Key: /calico/v1/host/dev-slave-107/workload/k8s/lijiaob.stateful-new-pod-0/endpoint/eth0
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.223 [DEBUG][14313] etcd.go 363: Key not found error
	Dec 13 14:19:24 dev-slave-107 kubelet[15567]: 2017-12-13 14:19:24.223 [WARNING][14313] k8s.go 313: WorkloadEndpoint does not exist in the datastore, moving forward with the clean up Workload="lijiaob.stateful-new-pod-0" WorkloadEndpoint=api.WorkloadEndpointMetadata{ObjectMetadata:unversioned.ObjectMetadata{Revision:interface {}(nil)}, Name:"eth0", Workload:"lijiaob.stateful-new-pod-0", Orchestrator:"k8s", Node:"dev-slave-107", ActiveInstanceID:"", Labels:map[string]string(nil)}

1.5.0版本中报错导致Pod的删除始终处于失败的状态，1.10.0中不报错，容器被顺利的删除，Pod的删除操作被认定成功，kubelet不再反复执行删除操作。

将复现环境中的CNI版本升级到1.10.0后，删除workloadendpoint不再触发Pod的网关arp丢失的问题，问题解决。

## 参考

1. [calico的ipam的数据混乱，重建ipam记录][1]
2. [kubelet升级，导致calico中存在多余的workloadendpoint，node上存在多余的veth设备][2]
3. [calico路由丢失问题的调查][3]
4. [因为目录被其它的容器挂载使用，导致已经退出的容器无法被删除][4]

[1]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2017/12/11/calico-ipam-reset.html  "calico的ipam的数据混乱，重建ipam记录" 
[2]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2017/12/04/calico-node-miss.html  "kubelet升级，导致calico中存在多余的workloadendpoint，node上存在多余的veth设备" 
[3]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2017/08/08/calico-router-miss.html "calico路由丢失问题的调查"
[4]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2017/07/14/docker-unable-to-rm-filesystem.html "因为目录被其它的容器挂载使用，导致已经退出的容器无法被删除"
