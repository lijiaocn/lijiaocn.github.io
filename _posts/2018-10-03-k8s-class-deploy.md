---
layout: default
title:  "Kubernetes1.12从零开始（三）：用minikube与kubeadm部署"
author: 李佶澳
createdate: 2018/09/03 20:43:00
changedate: 2018/09/04 17:24:51
categories: 项目
tags: kubernetes
keywords: kubernetes,容器集群,docker
description: 这一节部署Kubernetes，用于本地开发测试的minikube、不适合用于生产但是极其方便的kubeadm、与手动部署每个组件的方法，这里一次性全覆盖。

---

* auto-gen TOC:
{:toc}

## 说明

这一节部署Kubernetes，用于本地开发测试的[minikube][1]、不适合用于生产但是极其方便的[kubeadm部署][2]、与[手动部署][3]每个组件的方法，这里一次性全覆盖。

## 最快捷的本地部署方式：Minikube

[Running Kubernetes Locally via Minikube][1]中详细介绍了Minikube的使用方法。Minikube用来在本地启动一个单节点的Kubernetes。虽然用Minikube启动的Kubernetes集群极其简单，但是功能完善，创建简洁方便，特别适合用来做本地的开发调试环境。

这里在《[Kubernetes1.12从零开始（二）：部署环境准备][4]》中准备的node1上部署minikube。

Minikube可以直接安装在`宿主机`上，它会自动调用指定的`--vm-driver`调用virtualbox等虚拟化软件，创建作为Node节点的虚拟机。

如果将`--vm-driver`指定为`none`，直接在minikube所在的机器上创建kubernetes，需要提前安装docker。

鉴于Minikube本来就是用于搭建本地部署环境的，我们这里就不踩`--vm-dirver`为none时的坑了，直接用minikube自己创建虚拟机。

我这里的宿主机系统是MacOS，虚拟化软件是virtualbox。如果你用的是Linux或者Windows，除了安装命令和下载的文件格式不同，其它过程基本都是相同的。

### 先要安装设置kubectl

参考[Install and Set Up kubectl][6]。

现在各种操作系统以及它们不同的发行版对Kubernetes的支持越来越多，Kubernetes的一些组件，已经可以用这些系统支持的包管理工具安装。

例如kubectl命令，在Redhat/CentOS/Fedora上，可以[通过yum源安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-using-native-package-management)，
在Ubuntu/Debain/HypriotOS上，可以[通过apt-get安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-using-native-package-management),
Ubuntu上还可以[用snap工具安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-with-snap-on-ubuntu)，
在Mac上可以用[macports工具安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-with-homebrew-on-macos)或者brew，
在Windows上可以[用Powershell Gallery安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-with-powershell-from-psgallery)或者
[用Chocolate工具安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-with-chocolatey-on-windows)，
还可以直接安装下载Google Cloud SDK，然后用[gcloud工具安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#download-as-part-of-the-google-cloud-sdk)。

上面的各种安装工具能够为以后的维护提供方便，可以根据自己的需要选用。

这里使用最直接的方式安装，[用curl下载kubectl二进制文件](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-using-curl)

	mkdir -p  k8s-1.12/bin
	cd k8s-1.12/bin
	curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.12.0/bin/darwin/amd64/kubectl
	chmod +x ./kubectl

注意，如果是linux系统，下载地址是：

	curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.12.0/bin/linux/amd64/kubectl

如果是windows系统，下载地址是：

	curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.12.0/bin/windows/amd64/kubectl.exe

下载完成之后，将所在目录添加到环境变量中，我用的[Oh-My-Zsh](https://github.com/robbyrussell/oh-my-zsh)，更改的是~/.zshrc：

	echo "export PATH=`pwd`:\$PATH" >>~/.zshrc
	source ~/.zshrc
	cd ../../

如果用的是bash，更改~/.bashrc：

	echo "export PATH=`pwd`:\$PATH" >>~/.bashrc
	source ~/.bashrc
	cd ../../

windows上也可以更改环境变量，参考java在windows上的安装设置方法。

#### 设置kubectl命令自动补全

这一步不是必须的。

kubectl是操作管理Kubernetes集群的命令，它包含的子命令以及参数比较多，为了操作便利，可以设置[命令自动补全](https://kubernetes.io/docs/tasks/tools/install-kubectl/#enabling-shell-autocompletion)。

我用的是`Oh-My-Zsh`，只需要在~/.zshrc的plugins中加一行kubectl：

	plugins=(
	  git
	  kubectl
	)

更改后，要重新`source ~/.zshrc`。

如果使用的是`Bash`，需要安装bash-completion：

	yum install bash-completion -y   
	echo "source <(kubectl completion bash)" >> ~/.bashrc
	source ~/.bashrc

在Mac上的安装bash-completion方法是：

	## If running Bash 3.2 included with macOS
	brew install bash-completion
	## or, if running Bash 4.1+
	brew install bash-completion@2

如果在Mac上用的是bash，并且用brew安装的kubectl，会自行设置命令补全，如果不是用brew安装的kubectl，还需要需要手动设置一下：

	kubectl completion bash > $(brew --prefix)/etc/bash_completion.d/kubectl

### 安装minikube

Minikube是一个单独项目，可以直接到它的[release][7]页面中下载最新版本：

也可以用brew、choco等工具安装，在minikube项目的[Readme](https://github.com/kubernetes/minikube)中有介绍。

这里采用直接下载二进制文件的方式，下载的也是Mac版本：

	cd k8s-1.12/bin/
	curl -Lo minikube https://github.com/kubernetes/minikube/releases/download/v0.29.0/minikube-darwin-amd64
	chmod +x minikube 
	cd ../../

Linux的下载地址是：

	 curl -Lo minikube https://github.com/kubernetes/minikube/releases/download/v0.29.0/minikube-linux-amd64

### 使用minikube启动kubernetes集群

minikube是[支持多种虚拟化软件](https://kubernetes.io/docs/setup/minikube/#quickstart)的：

	virtualbox
	vmwarefusion
	kvm2 (driver installation)
	kvm (driver installation)
	hyperkit (driver installation)
	xhyve (driver installation) (deprecated)

前面章节提过，可以在运行的时候用`--vm-driver=`指定，如果不需要就使用none，`--vm-driver=none`，这时候就在宿主机中部署kubernetes，需要自己准备好Docker。

我们这里使用的virtualbox，`--vm-driver`的默认值就是virtualbox，所以不需要指定，直接启动：

	minikube start --kubernetes-version v1.12.0

特别注意，我用的是当前（2018-10-05 23:04:41）最新的版本的minikube（0.29.0），默认下载的kubernetes版本还是v1.10.0。
强行执行指定使用v1.12.0之后，启动报错，或许是和v1.12.0版本的kubernetes没有磨合好。

因此，退回使用minikube默认的1.10.0版本了：

	minikube stop
	minikube delete
	minikube start

启动过程中，minikube下载minikube的虚拟机镜像会比较慢，镜像的地址如下，可能需要翻_qiang才能下载：

	https://storage.googleapis.com/minikube/iso/minikube-v0.29.0.iso

镜像总共171.87M，我挂载VPN从香港下载速度还可以。

整个启动过程如下：

	$ minikube start
	Starting local Kubernetes v1.10.0 cluster...
	Starting VM...
	Downloading Minikube ISO
	 171.87 MB / 171.87 MB [============================================] 100.00% 0s
	Getting VM IP address...
	Moving files into cluster...
	Downloading kubelet v1.10.0
	Downloading kubeadm v1.10.0
	Finished Downloading kubelet v1.10.0
	Finished Downloading kubeadm v1.10.0
	Setting up certs...
	Connecting to cluster...
	Setting up kubeconfig...
	Starting cluster components...
	Kubectl is now configured to use the cluster.
	Loading cached images from config file.

然后就可以直接用kubectl操作整个单节点的kubernetes了：

	$ kubectl get cs
	NAME                 STATUS    MESSAGE              ERROR
	controller-manager   Healthy   ok
	scheduler            Healthy   ok
	etcd-0               Healthy   {"health": "true"}
	
	$ kubectl get service
	NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
	kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   1m

另外要注意，minikube部署的kubernetes中部分组件例如coredns等也是部署在kubernetes中，它们使用的镜像都位于`gcr.io`中，这个地址需要翻_qiang才能访问。

用下面的命令看到所有的Pod都是Running状态时，Kubernetes才进入正常状态：

	$ kubectl get pod --all-namespaces
	NAMESPACE     NAME                                    READY   STATUS    RESTARTS   AGE
	kube-system   coredns-c4cffd6dc-497p6                 1/1     Running   0          2m
	kube-system   etcd-minikube                           1/1     Running   0          4m
	kube-system   kube-addon-manager-minikube             1/1     Running   0          4m
	kube-system   kube-apiserver-minikube                 1/1     Running   1          4m
	kube-system   kube-controller-manager-minikube        1/1     Running   0          4m
	kube-system   kube-dns-86f4d74b45-8lzfb               3/3     Running   0          5m
	kube-system   kube-proxy-9229q                        1/1     Running   0          5m
	kube-system   kube-scheduler-minikube                 1/1     Running   0          5m
	kube-system   kubernetes-dashboard-6f4cfc5d87-mrl2l   1/1     Running   0          2m
	kube-system   storage-provisioner                     1/1     Running   0          2m

如果不使用虚拟化软件，直接在宿主机部署，可以考虑用下面的脚本，这是minikube项目的Readme中给出的：

	export MINIKUBE_WANTUPDATENOTIFICATION=false
	export MINIKUBE_WANTREPORTERRORPROMPT=false
	export MINIKUBE_HOME=$HOME
	export CHANGE_MINIKUBE_NONE_USER=true
	mkdir -p $HOME/.kube
	mkdir -p $HOME/.minikube
	touch $HOME/.kube/config
	
	export KUBECONFIG=$HOME/.kube/config
	sudo -E minikube start --vm-driver=none
	
	# this for loop waits until kubectl can access the api server that Minikube has created
	for i in {1..150}; do # timeout for 5 minutes
	   kubectl get po &> /dev/null
	   if [ $? -ne 1 ]; then
	      break
	  fi
	  sleep 2
	done
	
	# kubectl commands are now able to interact with Minikube cluster

### minikube管理创建的Kubernetes

启动，以及启动特定版本的kubernetes，上一节已经提到了：

	minikube start --kubernetes-version v1.12.0

停止：

	minikube stop

删除：

	minikube stop

### minikube的其它命令

首先在用minikube启动kubernetes集群的时候，子命令`start`有很多参数可以用：

	minikube start --help

[Running Kubernetes Locally via Minikube][1]给出了几个例子，分别是指定cni，runtime等：

	$ minikube start \
	    --network-plugin=cni \
	    --container-runtime=containerd \
	    --bootstrapper=kubeadm

	$ minikube start \
	    --network-plugin=cni \
	    --extra-config=kubelet.container-runtime=remote \
	    --extra-config=kubelet.container-runtime-endpoint=unix:///run/containerd/containerd.sock \
	    --extra-config=kubelet.image-service-endpoint=unix:///run/containerd/containerd.sock \
	    --bootstrapper=kubeadm

还可以在启动的时候通过`--extra-config`参数，配置kubernetes的下列组件：

	kubelet
	apiserver
	proxy
	controller-manager
	etcd
	scheduler

使用方法如下，格式为“组件名.参数名=设置的value”：

	--extra-config=kubelet.MaxPods=5
	--extra-config=scheduler.LeaderElection.LeaderElect=true
	--extra-config=apiserver.Authorization.Mode=RBAC

### 操作kubernetes

操作kubernetes当然使用kubectl，无论使用哪种方式部署的kubernetes，都使用kubectl命令直接管理。

kubectl的详细使用，我们放在以后的章节中，这里只说一下minikube自己的一些小命令。

首先，minikube创建kubernetes的时候，会创建一个名为`minikube`的上下文(context)。这个所谓的context，其实就是Apiserver地址和用户证书的组合，
指示kubectl用相应用户的证书访问相应的地址。

这个上下文放在哪里呢？~/.kube/config中：

	$ cat ~/.kube/config
	apiVersion: v1
	clusters:
	- cluster:
	    certificate-authority: /Users/lijiao/.minikube/ca.crt
	    server: https://192.168.99.100:8443
	  name: minikube
	contexts:
	- context:
	    cluster: minikube
	    user: minikube
	  name: minikube
	current-context: minikube
	kind: Config
	preferences: {}
	users:
	- name: minikube
	  user:
	    client-certificate: /Users/lijiao/.minikube/client.crt
	    client-key: /Users/lijiao/.minikube/client.key

这个是需要了解的，知道我们正在用哪些证书访问哪个地址，如果你自己增加了上下文，可以在执行kubectl命令的时候指定：

	kubectl get pods --context=minikube

然后，minikube有一个强大的子命令叫做`addons`，它可以在kubernetes中安装插件（addon）。这里所说的插件，就是部署在Kubernetes中的Deploymen或者Daemonset。

Kubernetes在设计上有一个特别有意思的地方，就是它的很多扩展功能，甚至于基础功能也可以部署在Kubernetes中，比如网络插件、DNS插件等。安装这些插件的时候，
就是用kubectl命令，直接在kubernetes中部署。

minikube集成了常用的插件，但默认没有全部开启，用下面的命令可以看到所有插件的状态：

	$ minikube addons list
	- addon-manager: enabled
	- coredns: enabled
	- dashboard: enabled
	- default-storageclass: enabled
	- efk: disabled
	- freshpod: disabled
	- heapster: disabled
	- ingress: disabled
	- kube-dns: disabled
	- metrics-server: disabled
	- nvidia-driver-installer: disabled
	- nvidia-gpu-device-plugin: disabled
	- registry: disabled
	- registry-creds: disabled
	- storage-provisioner: enabled

你可以根据自己的需要启用或者关停：

	 minikube addons disable XXX
	 minikube addons enable  XXX

minikube默认部署了dashborad插件，用下面的命令自动打开dashboard，注意Dashboard的Pod必须已经启动：

	minikube dashboard

获取通过nodeport暴露的服务，用下面的命令获取地址：

	# minikube service [-n NAMESPACE] [--url] NAME
	# 例如： 
	$ minikube service -n kube-system --url kubernetes-dashboard
	http://192.168.99.100:30000

用minikube部署kubernetes的介绍就到这里，主要内容基本都覆盖了，kubernetes的操作我们不展开，因为那是另一个内容相当多的部分。
接下来，你可以继续了解下用kubeadm部署多节点集群的方法，以及手动部署的Kubernetes集群的方法，也可以跳过安装，直接了解后面的“Kubernetes的操作使用”。

## 使用kubeadm部署多节点Kubernetes

>这里的操作卡壳了：kubeadm init报错，没法获得添加node的命令，等官方回应修复(2018-10-06 19:12:59)，现象见后面的问题1。

[Creating a single master cluster with kubeadm][8]是创建多节点Kubernetes的快捷方式。不kubeadm现在还不是很成熟，处于Beta阶段，没有GA（General Availability），预计今年（2018）进入GA状态。 

	Command line UX              beta
	Implementation               beta
	Config file API              alpha
	Self-hosting                 alpha
	kubeadm alpha subcommands    alpha
	CoreDNS                      GA
	DynamicKubeletConfig         alpha

[kubeadm](https://github.com/kubernetes/kubernetes/tree/master/cmd/kubeadm)是项目kubernetes的一个命令：[cmd/kubeadm](https://github.com/kubernetes/kubernetes/tree/master/cmd/kubeadm)。好像也是kubernetes官方打造的唯一个向`生产级别`发展的部署工具。

不过，现在估计没有多少公司会直接用kubeadm部署Kubernetes。我经历的公司都是自己全手动部署的，每个组件自己安置、自己配置参数，用ansible等运维工具进行批量部署、管理。

但是了解一下kubeadm的用法，也不会少点什么，毕竟是社区发力的部署工具，以后或许会成为标准工具。

kubeadm和kubernetes的其它组件一起发布(本来就是kubernetes项目中的一部分)，支持部署v1.12.x版本的kubernetes。

### 安装kubeadm

[Installing kubeadm][9]中介绍了kubeadm的安装方法。要求每个机器至少2G内存，2个CPU，我设置的虚拟机用了1G内存也勉强能跑起来。

单独的一个kubeadm不能工作，`每个机器上`还需要安装有docker、kubelet，可选安装kubectl。

从kubernetes1.6.0以后，kubernetes支持CRI，不一定非要用Docker，不过我们这里还是先不踩其它坑了，毕竟用Docker的还是大多数。

Docker的版本发布计划与安装方法见[moby、docker-ce与docker-ee][10]。为了聚焦主旨，这里不岔开了，直接用yum安装CentOS默认版本的Docker：

	yum install -y docker
	systemctl start  docker
	systemctl enable docker.service

然后安装kubeadm、kubelet和kubectl，这三个命令可以自己编译或者下载编译好的kubernetes文件。

我们这里使用Google提供的yum源，
直接用yum安装（[Ubuntu和其它操作系统中的安装方法](https://kubernetes.io/docs/setup/independent/install-kubeadm/#installing-kubeadm-kubelet-and-kubectl)）。
注意这个源需要翻_qiang才能访问。

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

然后关闭Selinux：

	setenforce 0
	sed -i 's/^SELINUX=enforcing$/SELINUX=permissive/' /etc/selinux/config

在CentOS7上还需要设置一下内核参数，放置流量被错误转发：

	cat <<EOF >  /etc/sysctl.d/k8s.conf
	net.bridge.bridge-nf-call-ip6tables = 1
	net.bridge.bridge-nf-call-iptables = 1
	EOF
	sysctl --system

再然后安装：

	# 默认安装最新版本的kubernetes
	yum install -y kubelet kubeadm kubectl --disableexcludes=kubernetes

最后启动kubelet：

	systemctl enable kubelet && systemctl start kubelet

这里需要解释一下，为什么在每个机器上都启动的kubelet。kubelet是node上的agent，它负责根据至少启动、关停容器，是一个持续运行的后台服务。

它除了执行Kubernetes的Master下发任务外，还会加载本地`/etc/kubernetes/manifests/`目录中的Kubernetes任务，通常就是描述Kubernetes中应用的yaml文件。

Kubeadm使用的部署方式中，Kubernetes的Master组件`apiserver`、`controller-manager`、`scheduler`，以及依赖的`etcd`等最基础的组件，被做成了kubernetes任务，用kubelet启动。

组件依赖分层如下：：

	最上层： apiserver、controller-manager、scheduler
	         etcd
	
	中层：   Docker、Kubelet
	
	最底层： 操作系统

后面用kubeadm部署之后，会在每个node的`/etc/kubernetes/manifests`目录中看到这些任务的yaml文件。

### 开始创建Kubernetes集群

用kubeadm创建kuberntes集群，分位设置master和添加node两步。

另外下面部署的是一个单Master的Kubernetes集群，kubeadm现在也支持部署多个Master节点的Kubernetes集群了。

多个Master目的就是提高可用性，[Creating Highly Available Clusters with kubeadm][11]中介绍操作过程。

这个过程呢，简单说，就是在三台机器上部署三次...，我们会在这一节的最后一小节说明，下面先部署一个单Master的。

#### 初始化Master

这里用node1作为master，初始化Master，就是直接在node1上执行`kubeadm init`。但是需要注意一下参数：

第一个重要参数`--pod-network-cidr`，这个是指定Pod要使用的网段，具体怎样指定，根据选用的[网络插件](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network)
而定。

我之前主要用calico，后来发现有不少公司用flannel，这里就直接演示用flannel。至于哪个网络插件好，这个不好说，calico和flannel都有用于生产。网络插件这方面属于SDN领域，是一个可以宏篇大论的领域...

我们根据[网络插件](https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network)中的建议选用`10.244.0.0/16`(这个根据自己情况来)：

	--pod-network-cidr=10.244.0.0/16

第二个重要参数是`--apiserver-advertise-address`，这个非常重要，特别是在我们这个环境中。

我们这里使用的环境中，每个虚拟机有两个网卡，一个是默认带有的NAT网卡，是虚拟机用来联通外网，另一个是我们在[准备环境][4]时添加的host网卡。

查看一下每个node上的网卡，你会会发现，每个NAT网卡的IP都是`10.0.2.15/24`，我们不能用这个网卡的IP作为每个组件的服务地址，需要明确指定使用第二个网卡。

因此在node1上，需要指定参数：

	--apiserver-advertise-address=192.168.88.11

最终，命令如下：

	kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.33.11

这个命令执行过程中，可能会出报错，直接按照提示进行解决就可以了。譬如我现在遇到这样一个错误：

	[root@localhost vagrant]#  kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=192.168.88.11
	[init] using Kubernetes version: v1.12.1
	[preflight] running pre-flight checks
	[preflight] Some fatal errors occurred:
		[ERROR Swap]: running with swap on is not supported. Please disable swap
	[preflight] If you know what you are doing, you can make a check non-fatal with `--ignore-preflight-errors=...`

提示不正常swap，直接Google找一下[swap禁用的方法](https://serverfault.com/questions/684771/best-way-to-disable-swap-in-linux)：

	swapoff -a

这个地方还有一个不好的消息，kubeadm在执行的时候，要拉取docker镜像，不好的地方在哪里呢？答案是有需要翻_qiang....

可以执行在init之前执行下面的命令，先将镜像下载下来：

	kubeadm config images pull

kubeamd的[代码中显示](https://github.com/kubernetes/kubernetes/blob/8a3888dcfae0c8d4b66c8f9b2a64de93f08002c2/cmd/kubeadm/app/apis/kubeadm/v1beta1/doc.go)
可以指定镜像仓库地址，默认地址是需要翻-qiang才能访问的k8s.gcr.io，可以在配置文件中修改。

	imageRepository: "k8s.gcr.io"

这个坑我们先不踩，一是kubeadm现在是beta3阶段，文档还不全，二是不想在工具上用太多时间，三是，亲，做技术，你一定要找到翻_qiang的方法，必须的。

`kubeadm init`过程如果出错，将出错原因处理后，可以直接重新执行，如果重新执行提示文件已经存在之类的，执行下面的命令恢复初始状态:

	kubeadm reset

##### 问题1: kubeadmi init失败，kube-apiserver不停重启

遇到了下面的问题：

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

虽然手动调整正常了，但是kubeadm init还是报错，没法获得添加node的命令，卡壳了，等官方回应修复(2018-10-06 19:12:59)。


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
