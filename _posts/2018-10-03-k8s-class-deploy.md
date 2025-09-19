---
layout: default
title:  "kubernetes 1.12 从零开始（二）: 用 minikube 部署开发测试环境"
author: 李佶澳
createdate: 2018/09/03 20:43:00
last_modified_at: 2018/11/11 18:41:41
categories: 项目
tags: 视频教程 kubernetes
keywords: kubernetes,容器集群,docker
description: 这一节部署Kubernetes，用于本地开发测试的minikube、不适合用于生产但是极其方便的kubeadm、与手动部署每个组件的方法，这里一次性全覆盖。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

本系列`所有文章`可以在**[系列教程汇总](https://www.lijiaocn.com/tags/class.html)**中找到，`演示和讲解视频`位于**[网易云课堂·IT技术快速入门学院 ](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)**，`课程说明`、`资料`和`QQ交流群`见 **[课程介绍与官方文档汇总](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/01/k8s-class-kubernetes-intro.html#说明)**，探索过程遇到的问题记录在：[遇到的问题与解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html)。

这一节在 [部署环境准备](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/02/k8s-class-enviromnent.html) 中设置的虚拟机上部署 Kubernetes，用 [minikube][1] 在本地部署一个开发测试环境，

本系列所有文章可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到，[Kubernetes1.12从零开始（一）：遇到的问题与解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html)记录了探索过程遇到的问题。

## 最快捷的本地部署方式

[Running Kubernetes Locally via Minikube][1] 中详细介绍了 Minikube 的使用方法。Minikube 用来在本地启动一个单节点的 Kubernetes。虽然用 Minikube 启动的 Kubernetes 集群极其简单，但是功能完善，创建简洁方便，特别适合用来做本地的开发调试环境。这里在《[Kubernetes1.12从零开始（二）：部署环境准备][4]》中准备的 node1 上部署 minikube。

Minikube 可以直接安装在`宿主机`上，它会自动调用指定的 `--vm-driver`调用 virtualbox 等虚拟化软件，创建作为Node节点的虚拟机。如果将 `--vm-driver` 指定为 `none`，会在当前机器上创建 kubernetes，当前机器上需要安装有 docker。

鉴于 Minikube 本来就是用于搭建本地部署环境的，这里就不踩 `--vm-dirver` 为 none 时的坑了，直接用 minikube 自己创建虚拟机。这里的宿主机系统是MacOS，虚拟化软件是 virtualbox。如果你用的是 Linux 或者 Windows，除了安装命令和下载的文件格式不同，其它过程基本都是相同的。

## 安装设置kubectl

参考 [Install and Set Up kubectl][6]，现在各种操作系统以及它们不同的发行版对 Kubernetes 的支持越来越多，Kubernetes 的一些组件，已经可以用这些系统支持的包管理工具安装。
例如 kubectl命令：

* 在Redhat/CentOS/Fedora上，可以[通过yum源安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-using-native-package-management)，
* 在Ubuntu/Debain/HypriotOS上，可以[通过apt-get安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-using-native-package-management)，
* Ubuntu上还可以[用snap工具安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-with-snap-on-ubuntu)，
* 在Mac上可以用[macports工具安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-with-homebrew-on-macos)或者brew，
* 在Windows上可以[用Powershell Gallery安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-with-powershell-from-psgallery)或者
[用Chocolate工具安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-with-chocolatey-on-windows)，
* 直接安装下载Google Cloud SDK，然后用[gcloud工具安装](https://kubernetes.io/docs/tasks/tools/install-kubectl/#download-as-part-of-the-google-cloud-sdk)。

上面的各种安装工具能够为以后的维护提供方便，可以根据自己的需要选用，这里使用最直接的方式：[用curl下载kubectl二进制文件](https://kubernetes.io/docs/tasks/tools/install-kubectl/#install-kubectl-binary-using-curl)

```sh
mkdir -p  k8s-1.12/bin
cd k8s-1.12/bin
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.12.0/bin/darwin/amd64/kubectl
chmod +x ./kubectl
```

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

### 设置kubectl命令自动补全

这一步不是必须的，kubectl是操作管理Kubernetes集群的命令，它包含的子命令以及参数比较多，为了操作便利，可以设置[命令自动补全](https://kubernetes.io/docs/tasks/tools/install-kubectl/#enabling-shell-autocompletion)。 这里用的是`Oh-My-Zsh`，只需要在~/.zshrc的plugins中加一行kubectl：

	plugins=(
	  git
	  kubectl
	)

更改后，重新加载配置:

```sh
source ~/.zshrc
```

如果用 `Bash`，需要安装bash-completion：

```sh
yum install bash-completion -y   
echo "source <(kubectl completion bash)" >> ~/.bashrc
source ~/.bashrc
```

Mac上的安装bash-completion方法：

```sh
## If running Bash 3.2 included with macOS
brew install bash-completion
## or, if running Bash 4.1+
brew install bash-completion@2
```

如果在Mac上用的是bash，并且用brew安装的kubectl，会自行设置命令补全，如果不是用brew安装的kubectl，还需要需要手动设置一下：

```sh
kubectl completion bash > $(brew --prefix)/etc/bash_completion.d/kubectl
```

## 安装minikube

Minikube是一个单独项目，可以直接到它的[release][7]页面中下载最新版本，也可以用brew、choco等工具安装，在minikube项目的[Readme](https://github.com/kubernetes/minikube)中有介绍。这里采用直接下载二进制文件的方式，下载 Mac 版本：

```sh
cd k8s-1.12/bin/
curl -Lo minikube https://github.com/kubernetes/minikube/releases/download/v0.29.0/minikube-darwin-amd64
chmod +x minikube 
cd ../../
```

Linux的下载地址是：

```sh
curl -Lo minikube https://github.com/kubernetes/minikube/releases/download/v0.29.0/minikube-linux-amd64
```

## 用minikube启动kubernetes集群

minikube [支持多种虚拟化软件](https://kubernetes.io/docs/setup/minikube/#quickstart)，用 `--vm-driver=` 指定，如果不需要虚拟化使用 `--vm-driver=none`。关闭虚拟化后，在当前机器上直接部署 kubernetes，b本机需要安装有 docker。

```sh
virtualbox
vmwarefusion
kvm2 (driver installation)
kvm (driver installation)
hyperkit (driver installation)
xhyve (driver installation) (deprecated)
```

`--vm-driver` 默认是 virtualbox，下面的命令在 virtualbox 管理的虚拟机中创建 v1.12.0 版本的 kubernetes：

	minikube start --kubernetes-version v1.12.0

这里用的是当前（2018-10-05 23:04:41）最新的版本的minikube（0.29.0），默认下载的kubernetes版本是v1.10.0，如果强行执行指定使用v1.12.0，启动会报错，或许是和v1.12.0版本的kubernetes还没有磨合好。
因此，退回使用minikube默认的1.10.0版本：

```sh
minikube stop
minikube delete
minikube start
```

启动过程中，minikube需要下载minikube的虚拟机镜像会比较慢，镜像的地址如下，可能需要翻_qiang才能下载，镜像总共171.87M：

	https://storage.googleapis.com/minikube/iso/minikube-v0.29.0.iso

最终启动过程如下：

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

启动后用kubectl操作：

	$ kubectl get cs
	NAME                 STATUS    MESSAGE              ERROR
	controller-manager   Healthy   ok
	scheduler            Healthy   ok
	etcd-0               Healthy   {"health": "true"}
	
	$ kubectl get service
	NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
	kubernetes   ClusterIP   10.96.0.1    <none>        443/TCP   1m

minikube部署的kubernetes中部分组件例如coredns等也是部署在kubernetes中，它们使用的镜像都位于`gcr.io`中，这个地址需要翻_qiang才能访问。

所有的Pod都是Running状态时，Kubernetes才进入正常状态：

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

如果不使用虚拟化软件，直接在宿主机部署，可以用下面的脚本，这是minikube项目的Readme中给出的：

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

## minikube管理创建的Kubernetes

启动，以及启动特定版本的kubernetes，上一节已经提到了：

	minikube start --kubernetes-version v1.12.0

停止：

	minikube stop

删除：

	minikube delete

## minikube的其它命令

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

## 操作kubernetes

kubectl的详细使用方法在以后的章节中，这里只说一下和minikube有关的部分。

minikube创建kubernetes的时候，会创建一个名为`minikube`的上下文(context)，就是Apiserver地址和用户证书的组合，指示kubectl用相应用户的证书访问相应的地址。
这个上下文在 ~/.kube/config 中：

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

如果你自己增加了上下文，可以在执行kubectl命令的时候指定：

	kubectl get pods --context=minikube

minikube有一个强大的子命令叫做`addons`，它可以在kubernetes中安装插件（addon），就是部署在Kubernetes中的Deploymen或者Daemonset。

Kubernetes在设计上有一个特别有意思的地方，就是它的很多扩展功能，甚至于基础功能也可以部署在Kubernetes中，比如网络插件、DNS插件等。
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

根据自己的需要启用或者关停：

	 minikube addons disable XXX
	 minikube addons enable  XXX

minikube默认部署了dashborad插件，用下面的命令自动打开dashboard，注意Dashboard的Pod必须已经启动：

	minikube dashboard

获取通过nodeport暴露的服务，用下面的命令获取地址：

	# minikube service [-n NAMESPACE] [--url] NAME
	# 例如： 
	$ minikube service -n kube-system --url kubernetes-dashboard
	http://192.168.99.100:30000

或者：

	minikube service list

用minikube部署kubernetes的介绍就到这里，主要内容基本都覆盖了，接下来，可以用kubeadm部署多节点集群的方法，或手动部署的Kubernetes集群，也可以跳过安装，直接学习“Kubernetes的操作使用”。

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
[4]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/02/k8s-class-enviromnent.html "Kubernetes1.12从零开始（二）：部署环境准备"
[5]: https://kubernetes.io/docs/tasks/tools/install-minikube/ "Install Minikube"
[6]: https://kubernetes.io/docs/tasks/tools/install-kubectl/ "Install and Set Up kubectl"
[7]: https://github.com/kubernetes/minikube/releases "kubernetes minikube project"
[8]: https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/ "Creating a single master cluster with kubeadm"
[9]: https://kubernetes.io/docs/setup/independent/install-kubeadm/ "Installing kubeadm"
[10]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/07/18/docker-commnuity.html "moby、docker-ce与docker-ee"
[11]: https://kubernetes.io/docs/setup/independent/high-availability/ "Creating Highly Available Clusters with kubeadm"
