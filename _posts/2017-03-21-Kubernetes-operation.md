---
layout: default
title: Kubernetes的基本操作
author: lijiaocn
createdate: 2017/03/21 15:32:31
changedate: 2017/05/10 11:23:02
categories: 项目
tags: k8s
keywords: kubernetes,k8s
description: 记录了kubernetes的基本操作

---

## 初始状态

查看系统状态：

	$ kubectl get cs
	NAME                 STATUS    MESSAGE              ERROR
	etcd-0               Healthy   {"health": "true"}
	controller-manager   Healthy   ok
	scheduler            Healthy   ok

查看物理节点:

	$ kubectl get nodes
	NAME        STATUS    AGE
	127.0.0.1   Ready     2h

查看endpoint:

	$ kubectl get ep
	NAME         ENDPOINTS        AGE
	kubernetes   10.0.2.15:6443   2h

查看services:

	$ kubectl get services
	NAME         CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
	kubernetes   10.254.0.1   <none>        443/TCP   2h

查看事件：

	$ kubectl get ev
	LASTSEEN   FIRSTSEEN   COUNT     NAME        KIND      SUBOBJECT   TYPE      REASON                  SOURCE                 MESSAGE
	54m        2h          3         127.0.0.1   Node                  Normal    NodeHasSufficientDisk   {kubelet 127.0.0.1}    Node 127.0.0.1 status is now: NodeHasSufficientDisk
	54m        54m         1         127.0.0.1   Node                  Normal    NodeNotReady            {controllermanager }   Node 127.0.0.1 status is now: NodeNotReady
	54m        54m         1         127.0.0.1   Node                  Normal    NodeReady               {kubelet 127.0.0.1}    Node 127.0.0.1 status is now: NodeReady

查看namespace:

	$ kubectl get ns
	NAME            STATUS    AGE
	default         Active    2h
	kube-system     Active    2h

查看serviceaccounts:

	$ kubectl get serviceaccounts
	NAME      SECRETS   AGE
	default   0         2h

查看services:

	$ kubectl get services
	NAME         CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
	kubernetes   10.254.0.1   <none>        443/TCP   2h

## 创建

### 创建namespace:

	$ kubectl create -f  ./api-v1-example/namespace.json

	$ kubectl get ns
	NAME              STATUS    AGE
	default           Active    20h
	first-namespace   Active    17h
	kube-system       Active    20h

namespace名称为first-namespace

### 创建pod:

	$ kubectl create -f ./api-v1-example/pod-sshproxy.json

	$ kubectl get pods/sshproxy -n first-namespace  -o wide
	NAME       READY     STATUS    RESTARTS   AGE       IP           NODE
	sshproxy   1/1       Running   0          10m       172.17.0.2   127.0.0.1

pod-sshproxy位于first-namespace，是在.json文件中指定的。

pod-sshproxy的中运行sshd服务，可以通过ssh连接，用户"root"，密码"123456"，是在.json文件中指定的。

可以在运行有kube-proxy的机器上，登陆pod：

	$ssh root@172.17.0.2
	The authenticity of host '172.17.0.2 (172.17.0.2)' can't be established.
	ECDSA key fingerprint is 34:e7:d1:03:0a:3b:b8:11:c3:4d:93:ea:b3:e6:34:41.
	Are you sure you want to continue connecting (yes/no)? yes
	Warning: Permanently added '172.17.0.2' (ECDSA) to the list of known hosts.
	root@172.17.0.2's password:
	[root@sshproxy ~]# pwd
	/root
	[root@sshproxy ~]# ip addr
	1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
	link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
	inet 127.0.0.1/8 scope host lo
	valid_lft forever preferred_lft forever
	inet6 ::1/128 scope host
	valid_lft forever preferred_lft forever
	4: eth0@if5: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP
	link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff link-netnsid 0
	inet 172.17.0.2/16 scope global eth0
	valid_lft forever preferred_lft forever
	inet6 fe80::42:acff:fe11:2/64 scope link tentative dadfailed
	valid_lft forever preferred_lft forever

创建过程中的事件:

	$ kubectl get ev -n first-namespace
	LASTSEEN   FIRSTSEEN   COUNT     NAME       KIND      SUBOBJECT                   TYPE      REASON      SOURCE                 MESSAGE
	30m        30m         1         sshproxy   Pod                                   Normal    Scheduled   {default-scheduler }   Successfully assigned sshproxy to 127.0.0.1
	28m        28m         1         sshproxy   Pod       spec.containers{sshproxy}   Normal    Pulling     {kubelet 127.0.0.1}    pulling image "127.0.0.1:5000/sshproxy:1.0"
	28m        28m         1         sshproxy   Pod       spec.containers{sshproxy}   Normal    Pulled      {kubelet 127.0.0.1}    Successfully pulled image "127.0.0.1:5000/sshproxy:1.0"
	28m        28m         1         sshproxy   Pod       spec.containers{sshproxy}   Normal    Created     {kubelet 127.0.0.1}    Created container with docker id fceb7fca9db8; Security:[seccomp=unconfined]
	28m        28m         1         sshproxy   Pod       spec.containers{sshproxy}   Normal    Started     {kubelet 127.0.0.1}    Started container with docker id fceb7fca9db8

### 创建Service

	$ kubectl create -f ./api-v1-example/webshell-service.json
	$ kubectl create -f ./api-v1-example/webshell-rc.json

	$ kubectl get service/webshell-service -o wide -n first-namespace
	NAME               CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE       SELECTOR
	webshell-service   10.254.197.238   <none>        80/TCP,22/TCP   1m        name=webshell,type=pod

	$ kubectl get rc -n first-namespace -o wide
	NAME          DESIRED   CURRENT   READY     AGE       CONTAINER(S)        IMAGE(S)                                                  SELECTOR
	webshell-rc   3         1         0         1m        webshell,sshproxy   127.0.0.1:5000/webshell:1.0,127.0.0.1:5000/sshproxy:1.0   name=webshell,type=pod

直接访问cluster-ip

## 更多命令

可以在"kubectl help"中看到更多的命令。

查看ns的信息：

	kubectl describe ns/first-namespace -n first-namespace

查看pod的信息：

	kubectl describe pod/sshproxy -n first-namespace

### 编辑资源

修改quota:

	$ kubectl edit quota/first-quota -n first-namespace
	在命令执行后得到的编辑器中，直接编辑。

