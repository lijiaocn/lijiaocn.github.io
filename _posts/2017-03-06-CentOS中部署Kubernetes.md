---
layout: default
title: CentOS中部署Kubernetes
author: lijiaocn
createdate: 2017/03/06 11:59:43
changedate: 2017/03/26 21:54:32
categories:
tags: k8s
keywords: kubernetes,业务编排,centos
description: 介绍了如何在CentOS上部署kubernetes系统。

---

* 目录
{:toc}

## 环境

	操作系统： CentOS Linux release 7.3.1611 (Core) 

## all-in-one部署

### 安装

安装epel源：

	yum install -y epel-release    //epel源中收录了etcd和kubernetes的安装包

安装etcd:

	yum install -y etcd            //kubernetes依赖的组件，会有专门文章介绍etcd
	
	$rpm -qa|grep etcd
	etcd-3.0.15-1.el7.x86_64

安装docker:

	yum install -y docker           //kuberntes依赖的组件，有专门的文章讲解docker

	$rpm -qa|grep docker
	docker-common-1.10.3-59.el7.centos.x86_64
	docker-1.10.3-59.el7.centos.x86_64

安装kubernetes:

	yum install -y kubernetes      //kubernetes all-in-one套件

	$rpm -qa|grep kuber
	kubernetes-client-1.4.0-0.1.git87d9d8d.el7.x86_64   //命令行工具
	kubernetes-1.4.0-0.1.git87d9d8d.el7.x86_64
	kubernetes-master-1.4.0-0.1.git87d9d8d.el7.x86_64   //master节点服务
	kubernetes-node-1.4.0-0.1.git87d9d8d.el7.x86_64     //node节点服务,

在启动之前，我们先看一下kubernetes系统都包含了哪些文件。

#### kuberntes-master

	$rpm -ql kubernetes-master
	/etc/kubernetes                        // /etc目录下安放了配置文件
	/etc/kubernetes/apiserver
	/etc/kubernetes/config
	/etc/kubernetes/controller-manager
	/etc/kubernetes/scheduler
	/run/kubernetes
	/usr/bin/hyperkube                     // /usr/bin目录下二进制程序
	/usr/bin/kube-apiserver
	/usr/bin/kube-controller-manager
	/usr/bin/kube-scheduler
	/usr/lib/systemd/system/kube-apiserver.service       // 安装了三个systemd服务
	/usr/lib/systemd/system/kube-controller-manager.service
	/usr/lib/systemd/system/kube-scheduler.service
	/usr/lib/tmpfiles.d/kubernetes.conf
	/usr/share/doc/kubernetes-master-1.4.0
	/usr/share/doc/kubernetes-master-1.4.0/CHANGELOG.md
	/usr/share/doc/kubernetes-master-1.4.0/CONTRIB.md
	/usr/share/doc/kubernetes-master-1.4.0/CONTRIBUTING.md
	/usr/share/doc/kubernetes-master-1.4.0/DESIGN.md
	/usr/share/doc/kubernetes-master-1.4.0/README.md
	/usr/share/doc/kubernetes-master-1.4.0/code-of-conduct.md
	/usr/share/licenses/kubernetes-master-1.4.0
	/usr/share/licenses/kubernetes-master-1.4.0/LICENSE
	/usr/share/man/man1/kube-apiserver.1.gz
	/usr/share/man/man1/kube-controller-manager.1.gz
	/usr/share/man/man1/kube-scheduler.1.gz

从上面可以看出，kubernetes-master包含三个服务：

	kube-apiserver.service               // apiserver
	kube-controller-manager.service      // 控制器
	kube-scheduler.service               // 调度器

#### kubernetes-node

	$rpm -ql kubernetes-node
	/etc/kubernetes
	/etc/kubernetes/config
	/etc/kubernetes/kubelet
	/etc/kubernetes/proxy
	/etc/systemd/system.conf.d/kubernetes-accounting.conf
	/run/kubernetes
	/usr/bin/hyperkube
	/usr/bin/kube-proxy
	/usr/bin/kubelet
	/usr/lib/systemd/system/kube-proxy.service
	/usr/lib/systemd/system/kubelet.service
	/usr/lib/tmpfiles.d/kubernetes.conf
	/usr/share/doc/kubernetes-node-1.4.0
	/usr/share/doc/kubernetes-node-1.4.0/CHANGELOG.md
	/usr/share/doc/kubernetes-node-1.4.0/CONTRIB.md
	/usr/share/doc/kubernetes-node-1.4.0/CONTRIBUTING.md
	/usr/share/doc/kubernetes-node-1.4.0/DESIGN.md
	/usr/share/doc/kubernetes-node-1.4.0/README.md
	/usr/share/doc/kubernetes-node-1.4.0/code-of-conduct.md
	/usr/share/licenses/kubernetes-node-1.4.0
	/usr/share/licenses/kubernetes-node-1.4.0/LICENSE
	/usr/share/man/man1/kube-proxy.1.gz
	/usr/share/man/man1/kubelet.1.gz
	/var/lib/kubelet

从上面可以看出，kubernetes-node包含两个服务：

	kube-proxy.service       // 控制进出报文流向
	kubelet.service          // 管理本机上容器

#### kubernetes-client

	$rpm -ql kubernetes-client
	/usr/bin/hyperkube
	/usr/bin/kubectl
	/usr/share/bash-completion/completions/kubectl
	/usr/share/doc/kubernetes-client-1.4.0
	/usr/share/doc/kubernetes-client-1.4.0/CHANGELOG.md
	/usr/share/doc/kubernetes-client-1.4.0/CONTRIB.md
	/usr/share/doc/kubernetes-client-1.4.0/CONTRIBUTING.md
	/usr/share/doc/kubernetes-client-1.4.0/DESIGN.md
	/usr/share/doc/kubernetes-client-1.4.0/README.md
	/usr/share/doc/kubernetes-client-1.4.0/code-of-conduct.md
	/usr/share/licenses/kubernetes-client-1.4.0
	/usr/share/licenses/kubernetes-client-1.4.0/LICENSE
	/usr/share/man/man1/kubectl-annotate.1.gz
	...(略去了更多的手册页)...

从上面可以看出，kubernetes-client就是提供了一个kubectl命令。

#### 需要留心kubernetes.rpm

上面我们查看了kubernetes-master、kubernetes-node、kubernetes-client的文件内容，为何没有提及kubernetes-1.4.0-0.1.git87d9d8d.el7.x86_64这个rpm？

用rpm命去列出kubernetes包含的文件时候，会发现是空的：

	$rpm -ql kubernetes 
	(contains no files)

这是因为kuberntes这个rpm的目前存在的意义只是为了提供一个简化的安装方式，它只包含一个依赖关系，而没有任何的内容。使用yum deplist查看一下依赖关系，就清楚了：

	yum deplist kubernetes
	Loaded plugins: fastestmirror
	Loading mirror speeds from cached hostfile
	 * c7-media: 
	 * centosplus: mirrors.btte.net
	 * epel: mirrors.neusoft.edu.cn
	 * extras: mirrors.cn99.com
	 * updates: mirrors.btte.net
	package: kubernetes.x86_64 1.4.0-0.1.git87d9d8d.el7
	  dependency: kubernetes-master = 1.4.0-0.1.git87d9d8d.el7
	   provider: kubernetes-master.x86_64 1.4.0-0.1.git87d9d8d.el7
	  dependency: kubernetes-node = 1.4.0-0.1.git87d9d8d.el7
	   provider: kubernetes-node.x86_64 1.4.0-0.1.git87d9d8d.el7

可以看到，kubernetes这个rpm的目的只是为了引发对kubernets-master和kubernetes-node的安装，而后者又会引发对kubernetes-client的安装。

这样意味上，如果不是使用all-in-one的部署方式，完全可以在master节点上只安装kubernetes-master，node也同样如此。

#### 需要留心hyperkube

细心的朋友或许已经发现，前面一直有一个叫做“hyperkube”的二进制文件出现，这个文件是做什么的，为什么哪里都有它？

hyperkube是一个将kubernetes的所有的二进制文件集成到一起后的一个二进制文件，所有kubernetes的命令都是它的子命令。

hyperkube诞生的是为了简化kubernetes组件在宿主机上的分发过程。

### 启动

	systemctl start etcd            //localhost:2379
	systemctl start kube-apiserver  //localhost:8080
	systemctl start kube-controller-manager
	systemctl start kube-scheduler
	systemctl start kube-proxy
	systemctl start kubelet

查看组件状态：

	$ kubectl  get  cs   //cs是componentstatuses命令的简写
	NAME                 STATUS    MESSAGE              ERROR
	scheduler            Healthy   ok
	controller-manager   Healthy   ok
	etcd-0               Healthy   {"health": "true"}

查看节点状态：

	$ kubectl  get  nodes
	NAME        STATUS    AGE
	127.0.0.1   Ready     33s

### 到此为止了吗？

NO！这才是刚刚开始，能够部署与能够掌控完全不是一回事情。并且，在上面的部署过程中，使用的都是默认配置，没有改动过一个配置文件。

但kubernetes系统本身虽然并不复杂，想要三言两语就说清楚，很难。下面尝试做一个比较粗介绍，详细说明请跟踪本站的相关文章。

### 先说配置文件

除了了解清楚kuberenetes的系统组成，最重要的就是学会配置、懂得配置项的含义。回想一下，在工作学习当中，是否是大把的时间都用在了看手册、学配置上面？:-)

CentOS中提供的kubernetes安装包，将配置文件统一放置在/etc/kubernetes目录中：

	$ls /etc/kubernetes
	apiserver  config  controller-manager  kubelet  proxy  scheduler

在all-in-one部署后，一共有6个配置文件。

	config:              日志级别、特权模式、master地址等最基本的配置
	                     kubernetes的每个常驻服务都会使用这个配置文件
	apiserver:           apiserver自己的配置文件
	controller-manager:  controller-manager自己的配置文件 
	scheduler:           scheduler自己的配置文件
	kubelet:             kubelet自己的配置文件
	proxy:               kube-proxy自己的配置文件

服务启动的时候是如何解读这些配置文件，又将其传递给了哪个进程，这就是另一个关于systemd的话题。这里不做展开，可以参考本站文章《CentOS中使用Docker》中对CentOS上docker服务启动过程的介绍。

### 再说功能

了解都有哪些配置项，每一个配置项的含义是什么的过程，其实就是探索每一个服务、每一个组件的功能的过程。知晓了功能，自然明白了系统的结构。

kuberntes系统中的服务组件的配置项相当的多！可以通过每一个二进制程序的命令行提示得知，例如：

	$kube-apiserver -h

是的！配置文件中的所有参数最终都是通过命令行参数传递给进程的，所以在“-h”中看到命令行参数，就是配置文件中可配置项。

kube-apiserver.service 

	用户与kuberntes交互的入口，kubernetes组件间交互的入口
	
	用户或者内部组件在与master通信的时候，使用的master地址，就是apiserver的对外服务地址。
	
	需要与etcd进行通讯，对外提供服务

kube-controller-manager.service 

	控制器，控制器的功能很多，进行配额管理等等
	
	需要与apiserver通信，不对外提供服务

kube-scheduler.service             // 调度器

	实现调度功能
	
	需要与apiserver通信，不对外提供服务

kube-proxy.service

	设置出入宿主机的报文流向
	
	需要与apiserver通信，不对外提供服务

kubelet.service

	管理本机上的容器（注意是容器，容器不等于docker）
	
	需要与apiserver通信，对外服务，接收外部状态查询、监控查询、attach容器等指令。

所以，最终的情形就是，apiserver以外所有的组件都在与apiserver进行通信，而apiserver直接与etcd进行通信。

特别提示：

	1. kubernetes系统中是没有数据库的，apiserver自身也不保存数据，元数据等信息都存放在etcd中；
	
	2. kube-proxy是一个比较有意思的存在，它的作用是负责地址转换，系统内容器之间通信，容器访问Service的时候，都需要它来做地址的转换。
	
	3. kuberntes系统外部，譬如说你的自己的PC想去访问托管在kubernetes系统中服务的时候，其中一种方式是在你自己的PC上安装kube-proxy，并将其接入apiserver。

### 最后

上面只进行了一个all-on-one的部署，当搞清楚了配置项的含义以后，从all-in-one到跨多台服务器就是一个很简单的过程。

kubernetes的使用、自动化部署以及组件的详细解析等内容，将独立成篇。

## 分布式部署

### 规划

	master 192.168.40.10
	slave1 192.168.40.11
	slave2 192.168.40.12

### 部署master:

	yum install -y epel-release
	yum install -y etcd 
	yum install -y kubernetes-master

准备根证书,根证书可以从CA机构获取，也可以自己制作：

	mkdir -p /etc/kubernetes/cert.d
	openssl req  -nodes -new -x509 -days 3650 -keyout /etc/kubernetes/cert.d/root-ca.key -out /etc/kubernetes/cert.d/root-ca.crt

>根证书将作为参数传递给controller-manager，controller-manager会将根证书下发给每一个容器。

准备用于签署ServieAccount的证书：

	mkdir -p /etc/kubernetes/cert.d
	openssl req  -nodes -new -x509 -days 3650 -keyout /etc/kubernetes/cert.d/service-account.key -out /etc/kubernetes/cert.d/service-account.crt

>ServiceAccount证书的key将作为参数传递给controller-manager，controller-manager使用这个key签署ServiceAccount的Token，生成的Token被下发到对应的容器。

>ServiceAccount证书将作为参数传递给apiserver，apiserver用ServiceAccount证书验证请求者的key。

配置master:

	# in /etc/kuberntes/config
	KUBE_API_ADDRESS="--insecure-bind-address=192.168.40.10"
	KUBE_MASTER="--master=http://192.168.40.10:8080"

	# in /etc/kubernetes/apiserver
	KUBE_ETCD_SERVERS="--etcd-servers=http://192.168.40.10:2379"
	KUBE_API_ARGS="--service-account-key-file /etc/kubernetes/cert.d/service-account.crt --advertise-address 192.168.40.10"
	KUBE_API_ARGS+=$KUBE_API_ARGS + "  --advertise-address 192.168.40.10"

	# in /etc/kubernetes/controller-manager
	KUBE_CONTROLLER_MANAGER_ARGS="--service-account-private-key-file  /etc/kubernetes/cert.d/service-account.key "
	KUBE_CONTROLLER_MANAGER_ARGS+="--root-ca-file= /etc/kubernetes/cert.d/root-ca.crt "

	# in /etc/etcd/etcd.conf
	ETCD_LISTEN_CLIENT_URLS="http://192.168.40.10:2379"
	ETCD_ADVERTISE_CLIENT_URLS="http://192.168.40.10:2379"
	ETCD_LISTEN_PEER_URLS="http://192.168.40.10:2380"
	ETCD_INITIAL_CLUSTER="default=http://192.168.40.10:2380"

启动master:

	systemctl start etcd            
	systemctl start kube-apiserver 
	systemctl start kube-controller-manager
	systemctl start kube-scheduler

查看状态:

	$kubectl -s 192.168.40.10:8080 get cs
	NAME                 STATUS    MESSAGE              ERROR
	scheduler            Healthy   ok
	controller-manager   Healthy   ok
	etcd-0               Healthy   {"health": "true"}

查看默认的ServiceAccount:

	$kubectl -s 192.168.40.10:8080 get serviceAccounts
	NAME      SECRETS   AGE
	default   1         23h

每个namespace都有一个名为default的ServiceAccount:

	$kubectl -s 192.168.40.10:8080 get serviceAccount -n kube-system
	NAME      SECRETS   AGE
	default   1         23h

对应有一个secret:

	# kubectl -s 192.168.40.10:8080 get secret -n kube-system
	NAME                  TYPE                                  DATA      AGE
	default-token-sbvct   kubernetes.io/service-account-token   2         5m
	# kubectl -s 192.168.40.10:8080 get secret
	NAME                  TYPE                                  DATA      AGE
	default-token-z4tvt   kubernetes.io/service-account-token   2         5m

### 配置flannel

准备一个flannel的配置文件config，内容如下，这些内容将被写入etcd:

	#!/bin/bash
	FLANNEL_PREFIX="/atomic.io/network"
	value='
	{
	    "Network":"172.16.128.0/17",
	        "Subnetlen":24,
	        "SubnetMin":"172.16.128.100",
	        "SubnetMax":"172.16.254.254",
	        "Backend":{
	            "Type":"udp",
	            "Port":7890
	        }
	}'
	etcdctl --endpoints http://192.168.40.10:2379  set  ${FLANNEL_PREFIX}/config "$value"

上述配置的含义是sdn网络地址为172.168.128.0/17，每个node分配到的掩码长度为24。

注意每个slave上的flannel需要配置同样的FLANNEL_PREFIX。

### 部署slave（flannel):

	yum install -y kubernetes-node
	yum install -y flannel

如果salve多个IP，需要在hosts中设置hostname绑定的ip，例如:

	# /etc/hosts on slave1
	192.168.40.11 slave1

	# /etc/hosts on slave2
	192.168.40.12 slave2

确保"hostname -i"看到的正确的IP地址，这个IP地址将会作为node的状态被上报：

	$ hostname -i
	192.168.40.11

配置slave:

	# in /etc/kubernetes/config
	KUBE_MASTER="--master=http://192.168.40.10:8080"
	# in /etc/kuberntes/kubelet
	KUBELET_API_SERVER="--api-servers=http://192.168.40.10:8080"

	# /etc/sysconfig/flanneld
	FLANNEL_ETCD_ENDPOINTS="http://192.168.40.10:2379"
	FLANNEL_ETCD_PREFIX="/atomic.io/network"
	FLANNEL_OPTIONS="-iface eth1"

	# /etc/kubernetes/kubelet
	KUBELET_ADDRESS="--address=192.168.40.11"     #for slave1
	KUBELET_HOSTNAME="--hostname-override=slave1" #for slave1
	KUBELET_ARGS="--register-node=false"          #稍后手动添加slave

	# /etc/sysconfig/docker，添加镜像源
	OPTIONS='--selinux-enabled --log-driver=journald --signature-verification=false --registry-mirror=https://pee6w651.mirror.aliyuncs.com'

启动slave:

	systemctl start flanneld
	systemctl start kubelet
	systemctl start kube-proxy
	systemctl start docker

>kubelet服务依赖docker，会自动触发docker服务的启动

### 注册slave

创建文件slaves.yaml：

	apiVersion: v1
	kind: List
	items:
	- apiVersion: v1
	  kind: Node
	  metadata:
		labels:
		  name: slave1
		name: slave1
		namespace: ""
	  spec:
		externalID: slave1
	- apiVersion: v1
	  kind: Node
	  metadata:
		labels:
		  name: slave2
		name: slave2
		namespace: ""

注册：

	$ kubectl -s 192.168.40.10:8080 create -f slaves.yaml

注册成功：

	$ kubectl -s 192.168.40.10:8080 get  nodes
	NAME      STATUS    AGE
	slave1    Ready     30m
	slave2    Ready     2m

查看node的状态，注意观察node的IP地址：

	$ kubectl -s 192.168.40.10:8080 get  nodes/slave1 -o yaml
	apiVersion: v1
	kind: Node
	metadata:
	  creationTimestamp: 2017-03-23T06:22:53Z
	  labels:
	    name: slave1
	  name: slave1
	  resourceVersion: "33357"
	  selfLink: /api/v1/nodesslave1
	  uid: 257632c3-0f91-11e7-9d3a-525400bd971e
	spec:
	  externalID: slave1
	status:
	  addresses:
	  - address: 192.168.40.11
	    type: LegacyHostIP
	  - address: 192.168.40.11
	    type: InternalIP
	  - address: slave1
	...

## 安装dashboard

在[kubernetes dashboard][1]的Readme中给出了安装方式，可以直接创建:

	$ kubectl create -f https://rawgit.com/kubernetes/dashboard/master/src/deploy/kubernetes-dashboard.yaml

但是因为dashboard的镜像位于gcr.io上，被墙，可以将yaml文件下载下来，修改其中的镜像：

将:

	image: gcr.io/google_containers/kubernetes-dashboard-amd64:v1.5.0

修改为:

	image: docker.io/mritd/kubernetes-dashboard-amd64:v1.5.0

另外，因为上面的部署中，apiserver没有启用https，所以修改dashboard的参数，访问apiserver的http地址:

	args:
	  - --apiserver-host=http://192.168.40.10:8080

dashboard本身是作为一个deployment部署的：

	kubectl -s 192.168.40.10:8080 create -f kubernetes-dashboard.yaml

查看deployment状态:

	kubectl -s 192.168.40.10:8080 get deployment -n kube-system
	NAME                   DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
	kubernetes-dashboard   1         1         1            0           30s

dashboard的deployment包含一个service和一个pod:

	$kubectl -s 192.168.40.10:8080 -n kube-system get service
	NAME                   CLUSTER-IP     EXTERNAL-IP   PORT(S)        AGE
	kubernetes-dashboard   10.254.4.182   <nodes>       80:30976/TCP   2m

	$kubectl -s 192.168.40.10:8080 -n kube-system get pod
	NAME                                    READY     STATUS             RESTARTS   AGE
	kubernetes-dashboard-1734305112-rjcjb   0/1       CrashLoopBackOff   3          1m

如果需要更改deployment，可以直接运行:

	kubectl -s 192.168.40.10:8080 -n kube-system edit deployment/kubernetes-dashboard

保存编辑结果后，pod会被自动更新。

## 安装ingress

	wget https://rawgit.com/kubernetes/ingress/master/examples/deployment/nginx/kubeadm/nginx-ingress-controller.yaml

将其中的镜像替换为docker.io上镜像:

	image: docker.io/chasontang/defaultbackend:1.0
	image: docker.io/chancefocus/nginx-ingress-controller

并且在args中添加参数指定apiserver地址:

	args:
	    - /nginx-ingress-controller
	    - --default-backend-service=$(POD_NAMESPACE)/default-http-backend
	    - --apiserver-host=http://192.168.40.10:8080

创建inginx-ingress-controller:

	$ kubectl -s 192.168.40.10:8080 create -f ./nginx-ingress-controller.yaml

可以看到创建的inginx-ingress-controller运行在salve2上，地址是192.168.40.12

	$ kubectl -s 192.168.40.10:8080 get pods -n kube-system -o wide
	NAME                                       READY     STATUS    RESTARTS   AGE       IP              NODE
	default-http-backend-3109640233-b01sc      1/1       Running   0          2h        172.16.145.1    slave2
	kubernetes-dashboard-671379602-tg023       1/1       Running   1          23h       172.16.167.1    slave1
	nginx-ingress-controller-432417711-6r342   1/1       Running   0          1h        192.168.40.12   slave2

这时候发送到192.168.40.12的80端口请求就会被转发到服务defaultbackend。


## docker registry

这里直接在master部署安装:

	yum install -y docker-distribution

配置:

	# /etc/docker-distribution/registry/config.yml
	addr: 192.168.40.10:5000

启动:

	systemctl start docker-distribution

----

本文由[k8s.top](http://k8s.top/?p=300&lang=zh)提供

[1]: https://github.com/kubernetes/dashboard "kubernetes dashboard"
