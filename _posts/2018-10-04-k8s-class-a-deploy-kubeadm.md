---
layout: default
title:  "Kubernetes1.12从零开始（三）：用kubeadm部署多节点集群"
author: 李佶澳
createdate: 2018/09/03 20:43:00
changedate: 2018/09/04 17:24:51
categories: 项目
tags: 视频教程 kubernetes
keywords: kubernetes,容器集群,docker
description: 这一节部署Kubernetes，用于本地开发测试的minikube、不适合用于生产但是极其方便的kubeadm、与手动部署每个组件的方法，这里一次性全覆盖。

---

* auto-gen TOC:
{:toc}

## 说明

这一节在[Kubernetes1.12从零开始（二）：部署环境准备](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/02/k8s-class-enviromnent.html)中设置的虚拟机上部署Kubernetes，用[kubeadm部署][2]一个多节点的kubernetes集群。

本系列所有文章可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到，[Kubernetes1.12从零开始（一）：遇到的问题与解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html)记录了探索过程遇到的问题。

## 使用kubeadm部署多节点Kubernetes

[Creating a single master cluster with kubeadm][8]是创建多节点Kubernetes的快捷方式。不过kubeadm现在还处于Beta阶段，没有GA（General Availability），预计今年（2018）进入GA状态。 

	Command line UX              beta
	Implementation               beta
	Config file API              alpha
	Self-hosting                 alpha
	kubeadm alpha subcommands    alpha
	CoreDNS                      GA
	DynamicKubeletConfig         alpha

[kubeadm](https://github.com/kubernetes/kubernetes/tree/master/cmd/kubeadm)是项目kubernetes的一个命令：[cmd/kubeadm](https://github.com/kubernetes/kubernetes/tree/master/cmd/kubeadm)，似乎也是kubernetes官方打造的唯一个向`生产级别`发展的部署工具。

不过，估计没有多少公司会直接用kubeadm部署Kubernetes，我经历的公司都是自己全手动部署，每个组件自己安置、自己配置参数，用ansible等运维工具进行批量部署、管理。

了解一下kubeadm的用法，也不会少点什么，毕竟是社区发力的部署工具，以后或许会成为标准工具。
Kubeadm和kubernetes的其它组件一起发布的(本来就是kubernetes项目中的一部分)，支持部署v1.12.x版本的kubernetes。

## 安装docker、kubelet、kubeadm

[Installing kubeadm][9]中介绍了kubeadm的安装方法，要求每个机器至少2G内存，2个CPU，我设置的虚拟机用了1G内存也勉强能跑起来。

单独的一个kubeadm不能工作，`每个机器上`还需要安装有docker、kubelet，kubectl可选。

>从kubernetes1.6.0以后支持CRI，不一定非要用Docker，这里还是选用Docker，毕竟用Docker的还是大多数。

### 安装docker

Docker的版本发布计划与安装方法见[moby、docker-ce与docker-ee][10]，这里直接用yum安装CentOS默认的Docker：

	yum install -y docker
	systemctl start  docker
	systemctl enable docker.service

### 安装kubeadm、kubelet

安装kubeadm、kubelet和kubectl，这三个命令可以自己编译或者下载编译好的kubernetes文件。

这里使用Google提供的yum源，直接用yum命令安装，如果不是CentOS系统参考：
[Ubuntu和其它操作系统中的安装方法](https://kubernetes.io/docs/setup/independent/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl)。

注意这里用到的Google的源需要翻_qiang才能访问。

执行下面的命令，创建`kubernetes.repo`：

	cat <<EOF > /etc/yum.repos.d/kubernetes.repo
	[kubernetes]
	name=Kubernetes
	baseurl=https://packages.cloud.google.com/yum/repos/kubernetes-el7-x86_64
	enabled=1
	gpgcheck=1
	repo_gpgcheck=1
	gpgkey=https://packages.cloud.google.com/yum/doc/yum-key.gpg https://packages.cloud.google.com/yum/doc/rpm-package-key.gpg
	exclude=kube*
	EOF

关闭Selinux：

	setenforce 0
	sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config

在CentOS7上还需要设置一下内核参数，防止流量被错误转发：

	cat <<EOF >  /etc/sysctl.d/k8s.conf
	net.bridge.bridge-nf-call-ip6tables = 1
	net.bridge.bridge-nf-call-iptables = 1
	EOF
	sysctl --system

然后安装：

	# 默认安装最新版本的kubernetes
	yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes

最后启动kubelet：

	systemctl enable kubelet && systemctl start kubelet

### kubelet的用途

解释一下为什么在每个机器上都安装kubelet。

kubelet是node上的agent，它负责根据指示启动、关停容器，是一个持续运行的后台服务。

它除了执行kubernetes的master下发的任务外，还会加载本地`/etc/kubernetes/manifests/`目录中的Kubernetes任务，也就是static pod。

kubeadm使用的部署方式中，master组件`apiserver`、`controller-manager`、`scheduler`，以及依赖的`etcd`等，被做成了static pod，用kubelet启动。

因此master节点上也需要安装kubelet，kubeadm初始化master之后，会在master的`/etc/kubernetes/manifests`目录中看到static pod的yaml文件。

## 创建kubernetes集群

用kubeadm创建kuberntes集群，分为初始化master和添加node两步。

kubeadm现在也支持部署多个master节点的Kubernetes集群了，多个master目的是提高可用性，[Creating Highly Available Clusters with kubeadm][11]中介绍操作过程。

这个过程简单说，就是在三台机器上部署三次...，下面先部署一个单master的kubernetes集群。

### 初始化master

用node1作为master，直接在node1上执行`kubeadm init`，需要注意几个参数。

第一个重要参数是`--pod-network-cidr`，指定Pod要使用的网段，指定方法根据选用的[网络插件][12]而定。

之前主要用calico，后来发现有不少公司用flannel，这里就直接演示flannel。哪个网络插件好，这个不好说，calico和flannel都有用于生产。网络插件这方面属于SDN领域，是一个可以宏篇大论的领域。

根据[网络插件](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network)中的建议选用`10.244.0.0/16`(根据你自己的情况设置)：

	--pod-network-cidr=10.244.0.0/16

第二个重要参数是`--apiserver-advertise-address`，这个非常重要，特别是在我们这个环境中。

我们这里使用的环境中，每个虚拟机有两个网卡，一个是默认带有的NAT网卡，是虚拟机用来联通外网的，另一个是我们在[准备环境][4]时添加的host网卡。

查看一下每个node上的网卡会发现，每个NAT网卡的IP都是`10.0.2.15/24`，不能用这个网卡的IP作为每个组件的服务地址，需要明确指定使用第二个网卡。

因此需要指定第二个网卡的IP：

	--apiserver-advertise-address=192.168.33.11

最终，命令如下：

	kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.33.11 --node-name=master1

这个命令执行过程中，可能会出报错，直接按照提示解决就可以了，譬如遇到这样一个错误：

	[root@localhost vagrant]#  kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.33.11
	[init] using Kubernetes version: v1.12.1
	[preflight] running pre-flight checks
	[preflight] Some fatal errors occurred:
		[ERROR Swap]: running with swap on is not supported. Please disable swap
	[preflight] If you know what you are doing, you can make a check non-fatal with `--ignore-preflight-errors=...`

`不支持swap`，直接Google找一下[swap禁用的方法](https://serverfault.com/questions/684771/best-way-to-disable-swap-in-linux)：

	swapoff -a

一个不好的消息是，kubeadm在执行的时候，要拉取docker镜像，需要翻_qiang....

可以执行在init之前先将镜像下载下来：

	kubeadm config images pull

kubeamd的[代码中显示](https://github.com/kubernetes/kubernetes/blob/8a3888dcfae0c8d4b66c8f9b2a64de93f08002c2/cmd/kubeadm/app/apis/kubeadm/v1beta1/doc.go)
镜像仓库地址是可以指定的，默认是需要翻-qiang才能访问的k8s.gcr.io，可以在配置文件中修改：

	imageRepository: "k8s.gcr.io"

配置文件的坑先不踩，一是kubeadm现在是beta3阶段，文档还不全，二是不想在工具上用太多时间，三是找到翻_qiang的方法是必须的。

`kubeadm init`过程如果出错，将出错原因处理后，可以直接重新执行，如果重新执行提示文件已经存在之类的，执行下面的命令恢复初始状态:

	kubeadm reset

master初始化成功以后，会显示下面的信息：

	...
	[bootstraptoken] creating the "cluster-info" ConfigMap in the "kube-public" namespace
	[addons] Applied essential addon: CoreDNS
	[addons] Applied essential addon: kube-proxy
	
	Your Kubernetes master has initialized successfully!
	
	To start using your cluster, you need to run the following as a regular user:
	
	  mkdir -p $HOME/.kube
	  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
	  sudo chown $(id -u):$(id -g) $HOME/.kube/config
	
	You should now deploy a pod network to the cluster.
	Run "kubectl apply -f [podnetwork].yaml" with one of the options listed at:
	  https://kubernetes.io/docs/concepts/cluster-administration/addons/
	
	You can now join any number of machines by running the following on each node
	as root:
	
	  kubeadm join 192.168.33.11:6443 --token 32j47g.i6dc2vn30uwpq93e --discovery-token-ca-cert-hash sha256:ec51f99cf5e66d5615a5ada7707bdb50fe6b4573a083dc8dc25790c934cd5883

其中最重要的是最后一行：

	  kubeadm join 192.168.33.11:6443 --token 32j47g.i6dc2vn30uwpq93e --discovery-token-ca-cert-hash sha256:ec51f99cf5e66d5615a5ada7707bdb50fe6b4573a083dc8dc25790c934cd5883

这是将node添加到kubernetes中的方法。


### 操作一下master

按照提示执行下面三个命令：

	  mkdir -p $HOME/.kube
	  sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
	  sudo chown $(id -u):$(id -g) $HOME/.kube/config

然后就可以使用kubectl命令了：

	$ kubectl get cs
	NAME                 STATUS    MESSAGE              ERROR
	controller-manager   Healthy   ok
	scheduler            Healthy   ok
	etcd-0               Healthy   {"health": "true"}
	
	$ kubectl get ns
	NAME          STATUS   AGE
	default       Active   6m6s
	kube-public   Active   6m6s
	kube-system   Active   6m6s

需要修改一下kubelet的配置文件，用`--node-ip`明确指定IP，默认使用第一个网卡的IP：

	$cat /etc/sysconfig/kubelet
	KUBELET_EXTRA_ARGS="--node-ip=192.168.33.11"

改动后需要重启，确保node的ip是正确的（网络插件没安装之前，master1会是NotReady状态）：

	$ kubectl get node  -o wide
	NAME      STATUS     ROLES    AGE     VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE                KERNEL-VERSION               CONTAINER-RUNTIME
	master1   NotReady   master   8m14s   v1.12.1   192.168.33.11   <none>        CentOS Linux 7 (Core)   3.10.0-862.14.4.el7.x86_64   docker://18.3.1

安装[网络插件][12]，这里使用flannel：

	kubectl apply -f https://raw.githubusercontent.com/coreos/flannel/bc79dd1505b0c8681ece4de4c0d86c5cd2643275/Documentation/kube-flannel.yml

可以看到有多个Pod正在创建中：

	$ kubectl get pod  --all-namespaces
	NAMESPACE     NAME                                            READY   STATUS     RESTARTS   AGE
	kube-system   coredns-576cbf47c7-ww8bz                        0/1     Pending    0          20m
	kube-system   coredns-576cbf47c7-x9bhv                        0/1     Pending    0          20m
	kube-system   etcd-localhost.localdomain                      1/1     Running    0          19m
	kube-system   kube-apiserver-localhost.localdomain            1/1     Running    0          19m
	kube-system   kube-controller-manager-localhost.localdomain   1/1     Running    0          19m
	kube-system   kube-flannel-ds-amd64-rhg9b                     0/1     Init:0/1   0          35s
	kube-system   kube-proxy-d4rtt                                1/1     Running    0          20m
	kube-system   kube-scheduler-localhost.localdomain            1/1     Running    0          19m

## 在集群中添加node

在一台已经[安装docker、kubelet、kubeadm](https://www.lijiaocn.com/项目/2018/10/04/k8s-class-adeploy-kubeadm.html#安装dockerkubeletkubeadm)的机器上，
执行下面的命令，将当前机器添加到kubernetes集群中：

	kubeadm join 192.168.33.11:6443  --node-name node2 --token 32j47g.i6dc2vn30uwpq93e --discovery-token-ca-cert-hash sha256:ec51f99cf5e66d5615a5ada7707bdb50fe6b4573a083dc8dc25790c934cd5883

这个命令就是master初始化完成时显示的那条命令，多了一个--node-name参数。

这里在node2（192.168.33.12）机器上执行：

	$ kubeadm join 192.168.33.11:6443 --node-name node2 --token 32j47g.i6dc2vn30uwpq93e --discovery-token-ca-cert-hash sha256:ec51f99cf5e66d5615a5ada7707bdb50fe6b4573a083dc8dc25790c934cd5883
	...
	[preflight] Activating the kubelet service
	[tlsbootstrap] Waiting for the kubelet to perform the TLS Bootstrap...
	[patchnode] Uploading the CRI Socket information "/var/run/dockershim.sock" to the Node API object "localhost.localdomain" as an annotation
	
	This node has joined the cluster:
	* Certificate signing request was sent to apiserver and a response was received.
	* The Kubelet was informed of the new secure connection details.
	
	Run 'kubectl get nodes' on the master to see this node join the cluster.

同样需要修改一下kubelet的配置文件，用`--node-ip`明确指定IP，默认使用第一个网卡的IP：

	$cat /etc/sysconfig/kubelet
	KUBELET_EXTRA_ARGS="--node-ip=192.168.33.12"

修改后重启kubelet：

	systemctl restart kubelet

在node1中可以看到新加的node：

	[root@localhost vagrant]# kubectl get node -o wide
	NAME                    STATUS     ROLES    AGE     VERSION   INTERNAL-IP     EXTERNAL-IP   OS-IMAGE                KERNEL-VERSION               CONTAINER-RUNTIME
	master1                 Ready      master   15m     v1.12.1   192.168.33.11   <none>        CentOS Linux 7 (Core)   3.10.0-862.14.4.el7.x86_64   docker://18.3.1
	node2                   NotReady   <none>   7s      v1.12.1   192.168.33.12   <none>        CentOS Linux 7 (Core)   3.10.0-862.14.4.el7.x86_64   docker://18.3.1

用同样的方式将node3添加到集群中。

## 参考

1. [Running Kubernetes Locally via Minikube][1]
2. [Bootstrapping Clusters with kubeadm][2]
3. [Creating a Custom Cluster from Scratch][3]
4. [Kubernetes1.12从零开始（二）：部署环境准备][4]
5. [Install Minikube][5]
6. [Install and Set Up kubectl][6]
7. [kubernetes minikube project][7]
8. [Creating a single master cluster with kubeadm][8]
9. [Installing kubeadm][9]
10. [moby、docker-ce与docker-ee][10]
11. [Creating Highly Available Clusters with kubeadm][11]
12. [kubernetes network add-on][12]

[1]: https://kubernetes.io/docs/setup/minikube/ "Running Kubernetes Locally via Minikube"
[2]: https://kubernetes.io/docs/setup/independent/ "Bootstrapping Clusters with kubeadm"
[3]: https://kubernetes.io/docs/setup/scratch/ "Creating a Custom Cluster from Scratch"
[4]: http://127.0.0.1:4000/%E9%A1%B9%E7%9B%AE/2018/10/02/k8s-class-enviromnent.html "Kubernetes1.12从零开始（二）：部署环境准备"
[5]: https://kubernetes.io/docs/tasks/tools/install-minikube/ "Install Minikube"
[6]: https://kubernetes.io/docs/tasks/tools/install-kubectl/ "Install and Set Up kubectl"
[7]: https://github.com/kubernetes/minikube/releases "kubernetes minikube project"
[8]: https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/ "Creating a single master cluster with kubeadm"
[9]: https://kubernetes.io/docs/setup/independent/install-kubeadm/ "Installing kubeadm"
[10]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/07/18/docker-commnuity.html "moby、docker-ce与docker-ee"
[11]: https://kubernetes.io/docs/setup/independent/high-availability/ "Creating Highly Available Clusters with kubeadm"
[12]: https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network "kubernetes network add-on"
