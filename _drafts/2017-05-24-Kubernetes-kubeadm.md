---
layout: default
title: Kubernetes的kubeadm的使用
author: lijiaocn
createdate: 2017/05/24 09:11:37
changedate: 2017/06/23 15:50:24
categories: 项目
tags: k8s
keywords: kubernetes,k8s,kubeadm
description: kubeadm是k8s社区维护的一个自动部署kubernetes的工具。

---

* auto-gen TOC:
{:toc}

## kubeadm 

[kubeadm][1]是k8s社区维护的一个自动部署kubernetes的工具，源码在kubernetes项目中。

	▾ kubernetes/
	  ▾ cmd/
	    ▸ kubeadm/

编译：

	make all WHAT=cmd/kubeadm

## 使用

[Installing Kubernetes on Linux with kubeadm][3]中介绍了如何使用kubeadm部署k8s集群。

### 使用要求

	One or more machines running Ubuntu 16.04+, CentOS 7 or HypriotOS v1.0.1+
	1GB or more of RAM per machine (any less will leave little room for your apps)
	Full network connectivity between all machines in the cluster (public or private network is fine)

### 准备

在目标机器上安装docker、kubelet、kubectl、kubeadm。

可以直接使用[k8s release][4]中的脚本构建rpm：

	cd rpm
	./docker-build.sh

## 参考

1. [kubeadm][1]
2. [kops][2]
3. [Installing Kubernetes on Linux with kubeadm][3]

[1]: https://github.com/kubernetes/kubeadm "kubeadm"
[2]: https://github.com/kubernetes/kops "kops"
[3]: https://kubernetes.io/docs/getting-started-guides/kubeadm/ "Installing Kubernetes on Linux with kubeadm"
[4]: https://github.com/kubernetes/release "k8s release"
