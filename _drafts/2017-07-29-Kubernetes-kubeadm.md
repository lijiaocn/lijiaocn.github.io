---
layout: default
title: Kubernetes自动部署工具kubeadm的使用
author: lijiaocn
createdate: 2017/07/29 18:04:34
changedate: 2017/09/29 10:13:34
categories: 项目
tags: kubernetes 
keywords: kubeadm,k8s
description:  使用kubeadm部署kubernetes系统

---

* auto-gen TOC:
{:toc}

## 准备 

准备一台master机器和多个node机器。

在所有机器上安装docker-ce或者docker:

docker-ce:

	wget https://download.docker.com/linux/centos/docker-ce.repo
	mv docker-ce.repo /etc/yum.repos.d
	yum install -y docker-ce
	
	cat <<EOF >>/etc/sysctl.conf
	net.bridge.bridge-nf-call-ip6tables = 1
	net.bridge.bridge-nf-call-iptables = 1
	net.bridge.bridge-nf-call-arptables = 1
	EOF
	
	/etc/init.d/network restart 
	systemctl start docker 

docker:

	yum install -y docker
	systemctl start docker 

安装kubectl:

	curl -LO https://storage.googleapis.com/kubernetes-release/release/$(curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt)/bin/linux/amd64/kubectl
	chmod +x kubectl
	mv kubectl  /usr/local/bin/

安装kubelet && kueadm:

	cat <<EOF > /etc/yum.repos.d/kubernetes.repo
	[kubernetes]
	name=Kubernetes
	baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
	enabled=1
	gpgcheck=1
	repo_gpgcheck=1
	gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg
	        https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
	EOF

	setenforce 0
	yum install -y kubelet kubeadm
	systemctl enable kubelet && systemctl start kubelet

注意这时候虽然启动了kubelet，但是kubelet会在不停的重启中：

	The kubelet is now restarting every few seconds, as it waits in a crashloop for kubeadm to tell it what to do.

直到下面使用kubeadm准备好了相关的文件之后，kubelet才能成功启动:

	$ls /etc/kubernetes/manifests/
	etcd.yaml  kube-apiserver.yaml  kube-controller-manager.yaml  kube-scheduler.yaml

/etc/kubernetes/manifests/中的这些yaml文件描述的任务，也就是master上需要运行的组件。

## 创建集群

在master上运行，ip-address是master要暴露到外部的地址:

	kubeadm init --apiserver-advertise-address=172.16.1.10

可以在这个时候指定pod将要使用的网段:

	--pod-network-cidr=10.244.0.0/16

运行结束后得到token:

	 kubeadm join --token b5166f.fbec0862d328f48f 172.16.1.10:6443

注意，完成下面的网络设置以后，再添加node。

如果中间失败，可以使用下面的命令清除已经做过的操作:

	kubeadm reset

## 设置网络

在网络设置完成之前，kubectl get  node 

要等到kube-dns启动完成以后，网络设置才完成，这里使用的是canal。

calico:

	--pod-network-cidr=192.168.0.0/16
	kubectl apply -f http://docs.projectcalico.org/v2.3/getting-started/kubernetes/installation/hosted/kubeadm/1.6/calico.yaml

canal:

	--pod-network-cidr=10.244.0.0/16
	kubectl apply -f https://raw.githubusercontent.com/projectcalico/canal/master/k8s-install/1.6/rbac.yaml
	kubectl apply -f https://raw.githubusercontent.com/projectcalico/canal/master/k8s-install/1.6/canal.yaml

flannel:

	--pod-network-cidr=10.244.0.0/16
	kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel.yml
	kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/master/Documentation/kube-flannel-rbac.yml

Romana:

	kubectl apply -f https://raw.githubusercontent.com/romana/romana/master/containerize/specs/romana-kubeadm.yml

Weave:

	kubectl apply -f https://git.io/weave-kube-1.6

## 参考

1. [kubeadm][1]
2. [kubeadm安装绕过GFW][2]

[1]: https://kubernetes.io/docs/setup/independent/install-kubeadm/ "kubeadm" 
[2]: http://hairtaildai.com/blog/11  "kubeadm安装绕过GFW"
