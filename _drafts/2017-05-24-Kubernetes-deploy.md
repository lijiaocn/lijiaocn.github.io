---
layout: default
title: Kubernetes的几种部署方法
author: lijiaocn
createdate: 2017/05/24 09:11:37
changedate: 2017/06/23 17:03:04
categories: 项目
tags: kubernetes
keywords: kubernetes,k8s,kubeadm,deploy
description: kubeadm是k8s社区维护的一个自动部署kubernetes的工具。

---

* auto-gen TOC:
{:toc}

## 说明

[k8s setup][5]中给出了几种部署方法。这里收集了更多的部署方法。

### minikube

[minikube][6]部署的是一个单机的k8s，可以用来快速的部署一个简易的开发测试环境。

### kubeadm 

[kubeadm][1]是k8s社区维护的一个自动部署kubernetes的工具，源码在kubernetes项目中。

	▾ kubernetes/
	  ▾ cmd/
	    ▸ kubeadm/

编译：

	make all WHAT=cmd/kubeadm

### 使用

[Installing Kubernetes on Linux with kubeadm][3]中介绍了如何使用kubeadm部署k8s集群。

#### 要求

	One or more machines running Ubuntu 16.04+, CentOS 7 or HypriotOS v1.0.1+
	1GB or more of RAM per machine (any less will leave little room for your apps)
	Full network connectivity between all machines in the cluster (public or private network is fine)

运行kubeadm的机器上需要安装有：

	kubelet
	kubeadm
	docker 

### 准备node

在所有的node上安装docker、kubelet、kubectl、kubeadm。

可以直接使用[k8s release][4]中的脚本构建rpm：

	cd rpm
	./docker-build.sh

### 设置master

在被选择为master的node上，执行:

	kubeadm init

### 添加node

在node上执行:

	kubeadm join --token <token> <master-ip>:<master-port>

## 参考

1. [kubeadm][1]
2. [kops][2]
3. [Installing Kubernetes on Linux with kubeadm][3]
4. [k8s release][4]
5. [k8s setup][5]
6. [minikube][5]

[1]: https://github.com/kubernetes/kubeadm "kubeadm"
[2]: https://github.com/kubernetes/kops "kops"
[3]: https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/ "Installing Kubernetes on Linux with kubeadm"
[4]: https://github.com/kubernetes/release "k8s release"
[5]: https://kubernetes.io/docs/setup/ "k8s setup"
[6]: https://kubernetes.io/docs/getting-started-guides/minikube/ "minikube"
