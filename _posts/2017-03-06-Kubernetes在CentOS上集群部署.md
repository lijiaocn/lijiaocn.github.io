---
layout: default
title: kubernetes在CentOS上的集群部署
author: 李佶澳
createdate: 2017/03/06 11:59:43
changedate: 2017/10/28 12:38:24
categories: 项目
tags: kubernetes
keywords: kubernetes,业务编排,centos
description: 介绍了如何在CentOS上部署kubernetes系统。

---

* auto-gen TOC:
{:toc}

## 环境

	操作系统： CentOS Linux release 7.3.1611 (Core) 

## 分布式部署

### 规划

	master 192.168.40.10
	slave1 192.168.40.11
	slave2 192.168.40.12

### 部署master

	yum install -y epel-release
	yum install -y etcd 
	yum install -y kubernetes-master

#### 准备根证书

根证书可以从CA机构获取，也可以自己制作：

	mkdir -p /etc/kubernetes/cert.d
	openssl req  -nodes -new -x509 -days 3650 -keyout /etc/kubernetes/cert.d/root-ca.key -out /etc/kubernetes/cert.d/root-ca.crt

根证书将作为参数传递给controller-manager，controller-manager会将根证书下发给每一个容器。

容器使用根证书来验证它所访问的https站点的证书是否合法。

#### 准备用于签署ServieAccount的证书

	mkdir -p /etc/kubernetes/cert.d
	openssl req  -nodes -new -x509 -days 3650 -keyout /etc/kubernetes/cert.d/service-account.key -out /etc/kubernetes/cert.d/service-account.crt

ServiceAccount`证书的key`将作为参数传递给controller-manager，controller-manager使用这个key签署ServiceAccount的Token，生成的Token被下发到对应的容器。

ServiceAccount`证书本身`将作为参数传递给apiserver，容器访问apiserver时会带上生成的token，apiserver用ServiceAccount证书验证请求者的token。

#### 配置master

/etc/kuberntes/config:

	KUBE_API_ADDRESS="--insecure-bind-address=192.168.40.10"
	KUBE_MASTER="--master=http://192.168.40.10:8080"

/etc/kubernetes/apiserver:

	KUBE_ETCD_SERVERS="--etcd-servers=http://192.168.40.10:2379"
	KUBE_API_ARGS="--service-account-key-file /etc/kubernetes/cert.d/service-account.crt --advertise-address 192.168.40.10"
	KUBE_API_ARGS+=$KUBE_API_ARGS + "  --advertise-address 192.168.40.10"

/etc/kubernetes/controller-manager:

	KUBE_CONTROLLER_MANAGER_ARGS="--service-account-private-key-file  /etc/kubernetes/cert.d/service-account.key "
	KUBE_CONTROLLER_MANAGER_ARGS+="--root-ca-file= /etc/kubernetes/cert.d/root-ca.crt "

/etc/etcd/etcd.conf:

	ETCD_LISTEN_CLIENT_URLS="http://192.168.40.10:2379"
	ETCD_ADVERTISE_CLIENT_URLS="http://192.168.40.10:2379"
	ETCD_LISTEN_PEER_URLS="http://192.168.40.10:2380"
	ETCD_INITIAL_CLUSTER="default=http://192.168.40.10:2380"

#### 启动master

	systemctl start etcd            
	systemctl start kube-apiserver 
	systemctl start kube-controller-manager
	systemctl start kube-scheduler

#### 查看状态

	$kubectl -s 192.168.40.10:8080 get cs
	NAME                 STATUS    MESSAGE              ERROR
	scheduler            Healthy   ok
	controller-manager   Healthy   ok
	etcd-0               Healthy   {"health": "true"}

#### 默认的ServiceAccount

	$kubectl -s 192.168.40.10:8080 get serviceAccounts
	NAME      SECRETS   AGE
	default   1         23h

每个namespace都有一个名为default的ServiceAccount:

	$kubectl -s 192.168.40.10:8080 get serviceAccount -n kube-system
	NAME      SECRETS   AGE
	default   1         23h

对应有一个secret:

	$kubectl -s 192.168.40.10:8080 get secret -n kube-system
	NAME                  TYPE                                  DATA      AGE
	default-token-sbvct   kubernetes.io/service-account-token   2         5m
	
	$kubectl -s 192.168.40.10:8080 get secret
	NAME                  TYPE                                  DATA      AGE
	default-token-z4tvt   kubernetes.io/service-account-token   2         5m

### 配置flannel

准备一个flannel的配置文件config，内容如下，并这些内容将被写入etcd:

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

如果salve有多个IP，需要在hosts中设置hostname绑定的ip，例如:

	# /etc/hosts on slave1
	192.168.40.11 slave1

	# /etc/hosts on slave2
	192.168.40.12 slave2

确保"hostname -i"看到的正确的IP地址，这个IP地址将会作为node的状态被上报：

	$ hostname -i
	192.168.40.11

#### 配置slave

/etc/kubernetes/config

	KUBE_MASTER="--master=http://192.168.40.10:8080"
	# in /etc/kuberntes/kubelet
	KUBELET_API_SERVER="--api-servers=http://192.168.40.10:8080"

/etc/sysconfig/flanneld

	FLANNEL_ETCD_ENDPOINTS="http://192.168.40.10:2379"
	FLANNEL_ETCD_PREFIX="/atomic.io/network"
	FLANNEL_OPTIONS="-iface eth1"

/etc/kubernetes/kubelet

	KUBELET_ADDRESS="--address=192.168.40.11"     #for slave1
	KUBELET_HOSTNAME="--hostname-override=slave1" #for slave1
	KUBELET_ARGS="--register-node=false"          #稍后手动添加slave

/etc/sysconfig/docker，添加镜像源

	OPTIONS='--selinux-enabled --log-driver=journald --signature-verification=false --registry-mirror=https://pee6w651.mirror.aliyuncs.com'

#### 启动slave

	systemctl start flanneld
	systemctl start kubelet
	systemctl start kube-proxy
	systemctl start docker

kubelet服务依赖docker，会自动触发docker服务的启动

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

从service中可以看到，dashboard服务使用的时NodePort，端口30976。通过访问192.168.40.11/12:30976访问。

如果需要更改deployment，可以直接运行:

	kubectl -s 192.168.40.10:8080 -n kube-system edit deployment/kubernetes-dashboard

保存编辑结果后，pod会被自动更新。

## 安装nginx-ingress-controller

获取nginx-ingress的yaml文件:

	wget https://rawgit.com/kubernetes/ingress/master/examples/deployment/nginx/kubeadm/nginx-ingress-controller.yaml

将其中的镜像替换为docker.io上镜像:

	image: docker.io/chasontang/defaultbackend:1.0
	image: docker.io/chancefocus/nginx-ingress-controller

并且在args中添加参数指定apiserver地址，注意这里还指定了default-service:

	args:
	    - /nginx-ingress-controller
	    - --default-backend-service=$(POD_NAMESPACE)/default-http-backend
	    - --apiserver-host=http://192.168.40.10:8080

创建nginx-ingress-controller:

	$ kubectl -s 192.168.40.10:8080 create -f ./nginx-ingress-controller.yaml

通过查看pod可以看到创建的nginx-ingress-controller运行在salve2上，地址是192.168.40.12。

>通过pod找地址的方式其实不好，最好能有一种方式直接获得指定deployment的所有pod的IP。

	$ kubectl -s 192.168.40.10:8080 get pods -n kube-system -o wide
	NAME                                       READY     STATUS    RESTARTS   AGE       IP              NODE
	default-http-backend-3109640233-b01sc      1/1       Running   0          2h        172.16.145.1    slave2
	kubernetes-dashboard-671379602-tg023       1/1       Running   1          23h       172.16.167.1    slave1
	nginx-ingress-controller-432417711-6r342   1/1       Running   0          1h        192.168.40.12   slave2

这时候就可以直接访问192.168.40.12:80，因为还没有创建ingress，所有发送到192.168.40.12的80端口的请求都会被转发到默认服务default-http-backend。

## 为apiserver签署https证书:

生成apiserver的签署请求：

	DIR=/etc/kubernetes/cert.d
	openssl genrsa -out ${DIR}/apiserver.key 1024               
	openssl req -new -key ${DIR}/apiserver.key -out ${DIR}/apiserver.csr

Comman Name输入kubernetes服务的地址：

	Common Name (eg, your name or your server's hostname) []:10.254.0.1

kubernetes服务地址的获取方式:

	$ kubectl -s 192.168.40.10:8080 get services
	NAME         CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
	kubernetes   10.254.0.1   <none>        443/TCP   4d

使用root证书签署：

	DIR=/etc/kubernetes/cert.d
	openssl x509 -req -days 365 -in ${DIR}/apiserver.csr -CA ${DIR}/root-ca.crt -CAkey ${DIR}/root-ca.key -CAcreateserial  -out ${DIR}/apiserver.crt 

在/etc/kubernetes/apiserver中添加配置：

	--tls-cert-file /etc/kubernetes/cert.d/apiserver.crt --tls-private-key-file  /etc/kubernetes/cert.d/apiserver.key --secure-port 443

## docker registry

这里直接在master部署安装:

	yum install -y docker-distribution

配置:

	# /etc/docker-distribution/registry/config.yml
	addr: 192.168.40.10:5000

启动:

	systemctl start docker-distribution

----

[1]: https://github.com/kubernetes/dashboard "kubernetes dashboard"
