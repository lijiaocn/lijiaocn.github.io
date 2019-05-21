---
layout: default
title: kubernetes的pod因为同名Sandbox的存在，一直无法删除
author: 李佶澳
createdate: 2017/12/08 16:58:13
changedate: 2017/12/13 17:39:17
categories: 问题
tags: kubernetes
keywords: 删除pod,kubernetes,无法删除pod,docker,sandbox
description: kubernetes版本为1.7.6，用kubectl删除pod后，pod一直处于Terminating的状态

---

## 目录
* auto-gen TOC:
{:toc}

## 现象

kubernetes版本为1.7.6，用kubectl删除pod后，pod一直处于Terminating的状态。

	$ kubectl -n XXXXXXXX get pod -o wide dev-decv-0
	NAME         READY     STATUS        RESTARTS   AGE	  IP        NODE
	dev-decv-0   0/1       Terminating   1          3d        <none>    paas-slave-20-45

该问题已经查明，是cni插件的导致的：

[cni插件使pod被重复删除，导致通过statefulset创建的pod被重新调度到同一个node上后，静态arp丢失，无法联通][1]

## 分析

查看kubelet的日志发现：

	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: INFO:1208 16:41:26.682756   31640 kubelet.go:1894] SyncLoop (DELETE, "api"): "dev-decv-0_XXXXXXXX(9d764474-d8d5-11e7-8e57-5254171bf8db)"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Releasing address using workloadID" Workload=XXXXXXXX.dev-decv-0
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Releasing all IPs with handle 'XXXXXXXX.dev-decv-0'"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Get Key: /calico/ipam/v2/handle/XXXXXXXX.dev-decv-0"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Get Key: /calico/ipam/v2/assignment/ipv4/block/192.168.21.192-26"
	...
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Released address using workloadID" Workload=XXXXXXXX.dev-decv-0
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Configured environment: [LANG=en_US.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin CNI_COMMAND=DEL CNI_CONTAINERID=788c8f3c216b6449265e15c6bebdd17b81af0be6b8878724959b744d9f139c6f CNI_NETNS=/proc/2557/ns/net CNI_ARGS=IgnoreUnknown=1;IgnoreUnknown=1;K8S_POD_NAMESPACE=XXXXXXXX;K8S_POD_NAME=dev-decv-0;K8S_POD_INFRA_CONTAINER_ID=788c8f3c216b6449265e15c6bebdd17b81af0be6b8878724959b744d9f139c6f CNI_IFNAME=eth0 CNI_PATH=/opt/calico/bin:/opt/cni/bin ETCD_AUTHORITY=kubernetes.default.svc.cluster.local:2379 ETCD_SCHEME=https ETCD_KEY_FILE=/etc/kubernetes/pki/client-key.pem ETCD_CERT_FILE=/etc/kubernetes/pki/client.pem ETCD_CA_CERT_FILE=/etc/kubernetes/pki/ca.pem KUBECONFIG=/etc/kubernetes/kubelet.conf]"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="No config file specified, loading config from environment"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Datastore type: etcdv2"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Delete Key: /calico/v1/host/paas-slave-20-45/workload/k8s/XXXXXXXX.dev-decv-0/endpoint/eth0"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Delete empty Key: /calico/v1/host/paas-slave-20-45/workload/k8s/XXXXXXXX.dev-decv-0/endpoint"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: WARNING
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Delete empty Key: /calico/v1/host/paas-slave-20-45/workload/k8s/XXXXXXXX.dev-decv-0"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: time="2017-12-08T16:41:26+08:00" level=info msg="Delete empty Key: /calico/v1/host/paas-slave-20-45/workload/k8s/XXXXXXXX.dev-decv-0"
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: Calico CNI deleting device in netns /proc/2557/ns/net

问题分析到一半，被其它事情打断，其他组的同事反馈:

>使用node上存在同名的且已经是Exist或者Dead状态的sandbox容器（pause）。
>kubelet在删除pod的时候，获取到的是错误的sandbox容器，所有迟迟无法成功删除。

	...
	Dec 08 16:41:26 paas-slave-20-45 kubelet[31640]: ERROR:1208 16:41:26.791039   31640 docker_sandbox.go:239] Failed to stop sandbox "d3d4d751f47ab02e8616efc2bdc6ae2d0be7ee20c2c51841298cf2c46d773549": Error response from daemon: {"message":"No such container: d3d4d751f47ab02e8616efc2bdc6ae2d0be7ee20c2c51841298cf2c46d773549"}
	...

这可能是kubelet的bug，应当获取running状态的sandbox容器。

## 参考

1. [cni插件使pod被重复删除，导致通过statefulset创建的pod被重新调度到同一个node上后，静态arp丢失，无法联通][1]

[1]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2017/12/12/Kubernetes-statefulset-lost-arp.html  "cni插件使pod被重复删除，导致通过statefulset创建的pod被重新调度到同一个node上后，静态arp丢失，无法联通"
