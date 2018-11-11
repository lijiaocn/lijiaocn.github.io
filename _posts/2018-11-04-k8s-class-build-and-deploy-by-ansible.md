---
layout: default
title:  "Kubernetes1.12从零开始（六）：从代码编译到自动部署"
author: 李佶澳
createdate: 2018/11/10 16:14:00
changedate: 2018/11/11 16:11:12
categories: 项目
tags: 视频教程 kubernetes
keywords: kubernetes,从零部署,deploy,kubernetes视频教程,kubernetes系列教程
description: "直接从github上下载相关代码，然后用统一容器进行编译，最后用ansible自动部署kubernetes集群"
---

* auto-gen TOC:
{:toc}

## 说明

本系列所有文章可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到，[Kubernetes1.12从零开始（一）：遇到的问题与解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html)记录了探索过程遇到的问题。

下面的操作中会从github上直接拉取kubernets以及依赖的组件的代码，在本地完成编译后，在[Kubernetes1.12从零开始（一）：部署环境准备][2]中准备的三台虚拟机上部署kubernetes集群，三台机器都同时是master和node。

## kubefromscratch-ansible和kubefromscratch介绍

[Github: kubefromscratch-ansible][3]是一套标准的ansible脚本，`inventories`目录中是不同部署环境，`roles`中是几组不同的操作，根目录下几个yml文件分别是几组操作的集合。

[Github: kubefromscratch][4]是最开始写的的一套编译部署脚本，但是用它来部署还是比较麻烦，后来专门写了kubefromscratch-ansible，将部署过程独立了出来。kubefromscratch中依然保留了部署部分的脚本，但是不建议使用，也不再维护这部分脚本，以后只维护编译部分的脚本。

kubefromscratch-ansible在执行编译操作的以后，会自动下载kubefromscratch，kubefromscratch在编译各个组件的时候，会自动下载各个组件的代码。

因此后续操作只需要在kubefromscratch-ansible中执行。

	git clone https://github.com/introclass/kubefromscratch-ansible.git
	cd kubefromscratch-ansible

## 使用前准备

使用yum安装Docker，可能会因为qiang的原因安装失败，因此这套脚本采用提前下载docker的rpm，将docker的rpm上传的方式安装，需要事先将docker的rpm下载到下面的目录中：

	mkdir -p roles/docker/files/
	pushd roles/docker/files/
	wget https://download.docker.com/linux/centos/7/x86_64/stable/Packages/docker-ce-18.03.1.ce-1.el7.centos.x86_64.rpm
	popd

Docker的版本发布计划可以到[moby、docker-ce与docker-ee][5]中了解。这里没有严格论证哪个版本的Docker是更可靠的，请根据自己的需要选择版本。

创建独立的python运行环境，在virtualenv创建的python运行环境中，执行后续的操作，可以避免系统上的python包的影响：

	virtualenv env
	source env/bin/activate
	pip install -r requirements.txt

本地机器上需要安装有`ansible`、`docker`、`git`，并能联网拉取docker镜像和github代码，mac上可以用brew安装：

	brew install ansible
	brew install git
	brew cask install docker

### 代码编译

使用下面的命令直接编译所有代码：

	ansible-playbook -i inventories/staging/hosts build.yml

编译过程中kubefromscratch代码，在`roles/build/tasks/main.yml`中指定，可以根据需要修改这个文件中内容：

	- name: checkout
	  tags: build
	  git:
	      repo: https://github.com/lijiaocn/kubefromscratch.git
	      dest: "{{ build_path }}"
	      version: master
	      force: yes
	
	- name: build component
	  tags: build
	  command: "{{ build_path }}/{{ item }}/build.sh"
	  args:
	      chdir: "{{ build_path }}/{{ item }}"
	  with_items:
	      - build-cni-plugins
	      - build-cni
	      - build-etcd
	      - build-kube-router
	      - build-kubernetes
	#     - build-coredns   //something is wrong

build-coredns组件被注释了，一是因为coredns的代码依赖管理做的不好，部分代码没有被纳入vendor管理，二是dns服务可以在kubernetes集群部署完成之后，用插件的方式安装，管理起来更方便。

kubefromscratch被下载到`output/build`目录中，编译过程就是到它到每个子目录中执行build.sh脚本。

编译时需要拉取指定版本的代码、生成编译镜像，时间会比较长，特别是编译kubernetes的时候。

如果执行出错，可以不使用anbile，直接到`./out/build/build-XXX`中对每个组件进行单独编译，确保编译成功，例如：

	pushd output/build/; 
	for i in build-cni-plugins build-cni build-etcd build-kube-router build-kubernetes
	do
		pushd $i
		./build.sh
		popd
	done
	popd

一定要确保所有组件都成功编译。

编译使用的目录`./out/build`中存放的是[kubefromscratch](https://github.com/introclass/kubefromscratch)项目中的文件。

在编译kubeneters的时候特别注意，如果是在Mac上编译，因为Mac上的Docker实际上是在一个虚拟机中运行的，虚拟机默认内存是2G，在编译kubernetes中的部署组件，例如kubelet的时候，可以会因为内存不足，用来编译的容器被杀死：

	+++ [1110 18:33:03] Building go targets for linux/amd64:
	    cmd/kubelet
	/usr/local/go/pkg/tool/linux_amd64/link: signal: killed
	!!! [1110 18:34:41] Call tree:
	!!! [1110 18:34:41]  1: /go/src/github.com/kubernetes/kubernetes/hack/lib/golang.sh:600 kube::golang::build_some_binaries(...)
	!!! [1110 18:34:41]  2: /go/src/github.com/kubernetes/kubernetes/hack/lib/golang.sh:735 kube::golang::build_binaries_for_platform(...)
	!!! [1110 18:34:42]  3: hack/make-rules/build.sh:27 kube::golang::build_binaries(...)
	!!! [1110 18:34:42] Call tree:
	!!! [1110 18:34:42]  1: hack/make-rules/build.sh:27 kube::golang::build_binaries(...)
	!!! [1110 18:34:42] Call tree:
	!!! [1110 18:34:42]  1: hack/make-rules/build.sh:27 kube::golang::build_binaries(...)
	make: *** [all] Error 1

修改Mac上的Docker使用的虚拟机的配置的方法： 点击Docker图标，选择“preference"->“advanced”。

每个build.sh脚本有多个自命令：

	./build.sh        编译，如果没有编译环境则创建
	./build.sh bash   进入到编译容器中
	./build.sh reset  销毁编译环境

如果执行./build.sh提示已经存在同名的代码目录，且版本不匹配， 将同名的目录删除，重新执行build.sh。

## 部署规划

部署规划主要是修改`inventories/staging/group_vars/all`中的变量，和`inventories/staging/hosts`中的机器IP。

`inventories/staging/group_vars/all`中主要定义了安装路径，Servic IP地址段、Cluster IP地址段等：

	topdir: "{{ playbook_dir }}/output/staging"
	
	build_path: "{{ playbook_dir }}/output/build"
	log_path: "{{ topdir }}/log"
	
	certs_path: "{{ topdir }}/certs"
	
	ca_path: "{{ certs_path }}/ca"
	
	APISERVER: "https://{{ groups['apiserver'][0] }}"
	APISERVER_INCLUSTER_IP: "172.16.0.1"
	CLUSTER_DOMAIN: "cluster.local"
	CLUSTER_DNS: "172.16.0.2"
	
	SERVICE_CLUSTER_IP_RANGE: "172.16.0.0/17"
	CLUSTER_CIDR: "172.16.128.0/17"
	...

需要注意的是其中的`APISERVER`和`APISERVER_INCLUSTER_IP`：前者应该是指向三个master的负载均衡器的IP，这里用虚拟机准备环境没有负载均衡器，因此选用了第一个apiserver的IP；后者是kubernetes服务的cluster ip，是apiserver在集群内部的IP，它需要与`SERVICE_CLUSTER_IP_RANGE`对应。

`CLUSTER_DNS`是kubernetes中部署的dns服务的ClusterIP，后面在用插件的方式部署kube-dns的时候，会用到这个IP。

另外SERVICE_CLUSTER_IP_RANGE和CLUSTER_CIDR需要是两个不重叠的网段。

`inventories/staging/hosts`中，在每个组件下填入要安装该组件的机器的IP：

	[etcd]
	192.168.33.11
	192.168.33.12
	192.168.33.13
	
	[master]
	192.168.33.11
	192.168.33.12
	192.168.33.13
	
	[node]
	192.168.33.11
	192.168.33.12
	192.168.33.13
	
	[coredns]
	#192.168.33.11
	#192.168.33.12
	#192.168.33.13
	
	[kube-router]
	192.168.33.11
	192.168.33.12
	192.168.33.13

## 机器初始化

先确保本地有ssh证书，如果没有则生成：

	$ ssh-keygen
	Generating public/private rsa key pair.
	Enter file in which to save the key (/Users/lijiao/.ssh/id_rsa):
	...

下面的操作将ssh证书上传到机器、并安装依赖软件、设置时区等：

	ansible-playbook -u root -k -i inventories/staging/hosts prepare.yml

vagrant创建的虚拟机root密码默认是vagrant。

初始化后，执行下面的命令，确定可以直接使用root用户免密码登录所有机器：

	(env) lijiaos-mbp:kubefromscratch-ansible lijiao$ ansible all -u root -i inventories/staging/hosts -m command -a "pwd"
	192.168.33.13 | SUCCESS | rc=0 >>
	/root
	
	192.168.33.11 | SUCCESS | rc=0 >>
	/root
	
	192.168.33.12 | SUCCESS | rc=0 >>
	/root

## 组件证书生成

这一步操作会为Kubernetes集群的所有的组件生成需要的证书：

	ansible-playbook -i inventories/staging/hosts gencerts.yml

生成的证书都存放在output目录中，后面部署的时候，将组件和它们各自的证书一起上传到目标机器上。

	(env) lijiaos-mbp:kubefromscratch-ansible lijiao$ tree  output/staging/certs/
	output/staging/certs/
	├── apiserver
	│   ├── 192.168.33.11
	│   │   ├── cert.csr
	│   │   └── key.pem
	│   ├── 192.168.33.12
	│   │   ├── cert.csr
	│   │   └── key.pem
	│   ├── 192.168.33.13
	│   │   ├── cert.csr
	...

## 部署系统

这一步操作在目标机器上部署kubernetes集群：

	ansible-playbook -u root -i inventories/staging/hosts site.yml

执行后耐心等待即可，如果出现“文件找不到”之类错误，回顾一下前面的步骤，看一看是否有遗漏，特别是编译过程，是不是都成功的生成二进制文件了。

每个组件在/opt/app/k8s目录中占有一个目录，里面是该组件运行需要的所有文件，二进制文件、配置文件、证书，以及它们运行时生成的日志。

	# ls
	admin  apiserver  cni  controller  etcd  kubelet  kube-router  scheduler

组件使用[supervisord：进程管理工具supervisord][6]启动的，没有采用systemd，这样的一个好处是可以将kubernetes组件与系统上的其它服务区分开，supervisord在ubuntu系统上也可以使用，在容器中也可以使用，以后要适配其它部署环境时可以复用。

`supervisorctl status`命令查看用supervisord启动的服务：

	[root@192.168.33.11 k8s]# supervisorctl status
	etcd                             RUNNING   pid 2998, uptime 0:08:33
	kube-apiserver                   RUNNING   pid 2989, uptime 0:08:33
	kube-controller-manager          RUNNING   pid 2994, uptime 0:08:33
	kube-router                      RUNNING   pid 2988, uptime 0:08:33
	kube-scheduler                   RUNNING   pid 2987, uptime 0:08:33
	kubelet                          RUNNING   pid 2993, uptime 0:08:33

注意部署过程中，可能会出现下面的错误：

	RUNNING HANDLER [kubelet : restart kubelet] ************************************************************************************************************************************************************************************************************************************
	fatal: [192.168.33.11]: FAILED! => {"changed": true, "cmd": "supervisorctl restart kubelet", "delta": "0:00:00.182922", "end": "2018-11-10 23:24:05.443215", "msg": "non-zero return code", "rc": 2, "start": "2018-11-10 23:24:05.260293", "stderr": "", "stderr_lines": [], "stdout": "error: <class 'xmlrpclib.Fault'>, <Fault 6: 'SHUTDOWN_STATE'>: file: /usr/lib64/python2.7/xmlrpclib.py line: 794", "stdout_lines": ["error: <class 'xmlrpclib.Fault'>, <Fault 6: 'SHUTDOWN_STATE'>: file: /usr/lib64/python2.7/xmlrpclib.py line: 794"]}
	fatal: [192.168.33.12]: FAILED! => {"changed": true, "cmd": "supervisorctl restart kubelet", "delta": "0:00:00.477207", "end": "2018-11-10 23:24:05.693513", "msg": "non-zero return code", "rc": 2, "start": "2018-11-10 23:24:05.216306", "stderr": "", "stderr_lines": [], "stdout": "error: <class 'xmlrpclib.Fault'>, <Fault 6: 'SHUTDOWN_STATE'>: file: /usr/lib64/python2.7/xmlrpclib.py line: 794", "stdout_lines": ["error: <class 'xmlrpclib.Fault'>, <Fault 6: 'SHUTDOWN_STATE'>: file: /usr/lib64/python2.7/xmlrpclib.py line: 794"]}

只是执行handler的时候，而且是随机出现，暂时还不清楚是怎么回事，实际上机器上的kubelet已经启动了。找出原因后，我会将修改提交到github。2018-11-10 23:37:02

在每个master中还有一个admin目录，里面存放的是集群管理员的文件，可以用里面的`./kubectl.sh`脚本管理集群，拥有最高权限：

	[root@192.168.33.11 app]# cd /opt/app/k8s/admin/
	[root@192.168.33.11 admin]# ./kubectl.sh get cs
	NAME                 STATUS    MESSAGE              ERROR
	controller-manager   Healthy   ok
	scheduler            Healthy   ok
	etcd-2               Healthy   {"health": "true"}
	etcd-1               Healthy   {"health": "true"}
	etcd-0               Healthy   {"health": "true"}

只有看到类似上面的信息，所有组件状态都是Healthy的时候，才能判定部署初步成功。

如果有组件不正常，查看它的文件目录中的日志，根据日志查找原因。

核实kubernetes服务的ClusterIP，需要与前面配置的`APISERVER_INCLUSTER_IP`相同：

	[root@192.168.33.11 admin]# ./kubectl.sh get svc
	NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
	kubernetes   ClusterIP   172.16.0.1   <none>        443/TCP   51m

## 在其它机器上安装管理员文件

安装管理文件的操作在`role/admin`中，只需要为目标机器设置这个role就可以了，例如项目中cli.yml，是在ansible所在的机器上安装管理员文件。

	(env) lijiaos-mbp:kubefromscratch-ansible lijiao$ cat cli.yml
	- hosts: localhost
	  roles:
	      - admin

这一步操作在其它机器上部署kubernetes集群的管理员文件：

	ansible-playbook -u root -i inventories/staging/hosts cli.yml

执行完成之后，就可以在本地的/opt/app/k8s/目录中看到admin目录：

	$ ls /opt/app/k8s/admin/
	apiserver.curl.sh    bin    cert   kubeconfig-single.sh kubeconfig.yml    kubectl.sh      kubelet.curl.sh

需要注意的安装的管理文件中/bin/kubectl命令是ELF格式的，只能在linux上执行。

我这里用的mac的系统，就比较麻烦，需要再编译或者下载一个mac上可以运行kubectl程序，好在brew更新的比较快，里面有最新版本的kubectl：

	$ brew info kubectl
	kubernetes-cli: stable 1.12.2 (bottled), HEAD
	Kubernetes command-line interface
	https://kubernetes.io/
	...

因此直接用brew安装：

	$ brew install kubectl

然后替换掉/opt/app/k8s/admin/bin/kubectl：

	cp /usr/local/bin/kubectl /opt/app/k8s/admin/bin/kubectl

然后就可以在本地的/opt/app/k8s/admin目录中使用kubectl.sh管理集群：

	lijiaos-MacBook-Pro:admin lijiao$ ./kubectl.sh version
	Client Version: version.Info{Major:"1", Minor:"12", GitVersion:"v1.12.2", GitCommit:"17c77c7898218073f14c8d573582e8d2313dc740", GitTreeState:"clean", BuildDate:"2018-10-30T21:40:58Z", GoVersion:"go1.11.1", Compiler:"gc", Platform:"darwin/amd64"}
	Server Version: version.Info{Major:"1", Minor:"12", GitVersion:"v1.12.2", GitCommit:"17c77c7898218073f14c8d573582e8d2313dc740", GitTreeState:"clean", BuildDate:"2018-11-10T15:47:58Z", GoVersion:"go1.11.2", Compiler:"gc", Platform:"linux/amd64"}


可以用下面的方式将集群管理员的kubeconfig.yml以及证书打包到一个文件中，方便提供给其他用户使用：

	$ ./kubeconfig-single.sh

执行后会得到一个`kubeconfig-single.yml`文件，这个文件中包含了所有的配置。


如果要在任意地方使用kubectl命令管理集群，可以在/.kube目录中做一个名为config的连接，连接到kubeconfig-single.yml：

	$ ln -s /opt/app/k8s/admin/kubeconfig-single.yml ~/.kube/config
	$ kubectl config view
	apiVersion: v1
	clusters:
	- cluster:
	    certificate-authority-data: REDACTED
	    server: https://10.39.0.121
	  name: secure
	contexts:
	- context:
	    cluster: secure
	    namespace: default
	    user: admin
	  name: secure.admin.default
	current-context: secure.admin.default
	kind: Config
	preferences:
	  colors: true
	users:
	- name: admin
	  user:
	    client-certificate-data: REDACTED
	    client-key-data: REDACTED

kubectl以及[kubernetic](https://kubernetic.com/)等工具默认是从~./kube目录中读取配置的。

可以用下面的方式将kubeconfig-single.yml转换为json格式：

	$ yum install -y python2-pip
	$ pip install yq
	$ bash kubeconfig-single.sh
	$ cat kubeconfig-single.yml | yq . >kubeconfig-single.json

## 集群的关停、启动、销毁

启动集群:

	ansible-playbook -u root -i inventories/staging/hosts start.yml

关闭集群:

	ansible-playbook -u root -i inventories/staging/hosts stop.yml

用这套anbile部署的脚本内置了很多很方便的小工具，可以用来查询数据。

查看etcd中的数据，登录到部署了etcd的机器上操作，etcd使用的是etcd v3，在v3中没有了`目录`的概念，用下面的方式获取指定前缀的key：

	$ cd /opt/app/k8s/etcd
	$ ./etcdctl3.sh get /kubernetes --prefix  --keys-only
	/kubernetes/services/endpoints/default/kubernetes
	/kubernetes/services/endpoints/kube-system/kube-controller-manager
	/kubernetes/services/endpoints/kube-system/kube-scheduler
	/kubernetes/services/specs/default/kubernetes
	...

用`get`命令读取key的值，`-w`指定输出格式：

	./etcdctl3.sh get /kubernetes/services/endpoints/kube-system/kube-scheduler -w json
	./etcdctl3.sh get /kubernetes/services/endpoints/kube-system/kube-scheduler -w fields

集群管理员文件中，除了用来管理集群的kubectl.sh，还有一个`apiserver.curl.sh`和`kubelet.curl.sh`文件，它两用来直接访问apiserver和kubelet的http接口，例如：

	[root@192.168.33.11 admin]# ./kubelet.curl.sh 192.168.33.11:10255/metrics
	# HELP apiserver_audit_event_total Counter of audit events generated and sent to the audit backend.
	# TYPE apiserver_audit_event_total counter
	apiserver_audit_event_total 0
	...

这两个脚本可以用于调试。

## 在集群中安装插件

很多功能都可以插件的方法部署，譬如网络组件、DNS、日志采集、监控等，最简单的kubernetes集群需要的只有master的apiserver、scheduler、controller-manager，node上的kubelet和docker，以及一个etcd集群。

前面部署的是一个较为精简的Kubernetes集群，不是最精简的，kube-route组件是可以不部署的，它只是kubernete网络方案中的一种，可以用插件的方法安装，从而可以随时更换。

这里没有将kube-router作为组件部署，只是因为最初的想法是将所有的需要组件都单独部署，而不是以插件的方式部署。单独部署的好处是排查问题的时候比较方便，而且与Kubernetes解耦，但是从灵活性和方便程度上来说，用插件的形式部署更好一些，也更符合发展的方向，越来越多组件都是用插件的形式发布的。

如果你要使用其它的插件，部署之前，把前面的hosts文件中kube-router一节注释掉，然后用后面类似于dns插件安装的操作，安装想用的网络插件即可。

	//把这一节删除或者注释
	[kube-router]
	192.168.33.11
	192.168.33.12
	192.168.33.13

现在用的比较多的网络插件是flannel和calico，主要是因为它两出现的比较早，最先被使用，并且用法简单，很多文档中都是以它们为例，功能和效果都还可以，一般情况下够用了。

kube-router出现的比较晚，相对比较小众，但我觉得它的设计很好，它具备了kube-proxy的功能，可以省去一个组件，所以选择了它。

>需要特别注意是，我目前还没有在生产环境中使用kube-router的经验，只是尝鲜使用，生产环境用的是flannel和calico，也没有更换的计划和动力。

[kubernetes/cluster/addons](https://github.com/kubernetes/kubernetes/tree/master/cluster/addons)中是kubernetes的项目中的插件目录，下面是1.12.2版本代码中的包含插件：

	(env) lijiaos-mbp:kubefromscratch-ansible lijiao$ ls output/build/build-kubernetes/kubernetes/cluster/addons/
	BUILD                     dashboard                 ip-masq-agent             prometheus
	README.md                 device-plugins            kube-proxy                python-image
	addon-manager             dns                       metadata-agent            rbac
	calico-policy-controller  dns-horizontal-autoscaler metadata-proxy            runtimeclass
	cluster-loadbalancing     fluentd-elasticsearch     metrics-server            storage-class
	cluster-monitoring        fluentd-gcp               node-problem-detector

接下来演示其中一些插件的安装方法。

### 安装kube-dns插件

`cluter/addons/dns`目录中有两个dns插件，一个是kube-dns，一个是coredns。kube-dns使用的是经典的dnsmasq软件，coredns是一个全新的dns服务器软件。

	$ ls output/build/build-kubernetes/kubernetes/cluster/addons/dns
	OWNERS   coredns  kube-dns

下面演示是1.12.2版本中的kube-dns的安装，

如果是在mac上操作，需要安装有gettext：

	brew install -y gettext
	echo 'export PATH="/usr/local/opt/gettext/bin:$PATH"' >> ~/.zshrc  && source ~/.zshrc
	#或者
	echo 'export PATH="/usr/local/opt/gettext/bin:$PATH"' >> ~/.bash_profile && source ~/.bash_profile

然后设置DNS相关的环境变量，以cluster/addons/dns/kube-dns/kube-dns.yaml.sed为模版，生成kube-dns的部署文件：
	
	export DNS_DOMAIN=cluster.local
	export DNS_SERVER_IP=172.16.0.2
	cat output/build/build-kubernetes/kubernetes/cluster/addons/dns/kube-dns/kube-dns.yaml.sed | envsubst >./kube-dns.yaml

上面的`DNS_DOMAIN`、`DNS_SERVER_IP`分别与kubelet的`--cluster-domain`、`--cluster-dns`参数配置相同，一定不要忘了先设置环境变量，否则kube-dns.yam中会缺少相关信息。

kube-dns.yaml中用到下面的几个镜像，这些镜像因为“墙”的原因，在国内无法直接获取，我这里在电脑上开启了全局的VPN，虚拟机也能翻出去，所以能下载这些镜像。如果你不能翻，或者部署在公司内网中，需要将这些镜像替换为你提前下载好镜像，或公司内网中的镜像。

	lijiaos-MacBook-Pro:admin lijiao$ cat kube-dns.yaml |grep image
	        image: k8s.gcr.io/k8s-dns-kube-dns:1.14.13
	        image: k8s.gcr.io/k8s-dns-dnsmasq-nanny:1.14.13
	        image: k8s.gcr.io/k8s-dns-sidecar:1.14.13

得到部署文件kube-dns.yaml之后，直接用下面的命令部署：

	lijiaos-MacBook-Pro:admin lijiao$ kubectl create -f kube-dns.yaml
	service/kube-dns created
	serviceaccount/kube-dns created
	configmap/kube-dns created
	deployment.extensions/kube-dns created

确保pod都是running的状态：

	lijiaos-MacBook-Pro:admin lijiao$ kubectl -n kube-system get pod
	NAME                        READY   STATUS    RESTARTS   AGE
	kube-dns-596fbb8fbd-zcfxp   3/3     Running   0          100s

部署了网络组件和安装kube-dns插件之后，就可以在kubernetes中部署应用了，只不过缺少了日志、监控等插件时，会显得比较简陋。

### 安装dashboard插件

dashboard插件位于`cluster/addons/dashboard/`目录中，直接部署其中的yaml文件即可：

	$ ls *.yaml
	dashboard-configmap.yaml  dashboard-controller.yaml dashboard-rbac.yaml       
	dashboard-secret.yaml     dashboard-service.yaml

这里推荐一个名为[kubernetic](https://kubernetic.com/)的kubernetes客户端软件，用来查看集群内部信息很方便。

开源项目的Dashboard的一般都做的很简单，只能拿来看看数据啥的，企业使用，一般都是自己开发Dashboard，一些围绕开源项目做产品的公司，其实是在开发dashboard...

## 部署应用

[kubernetes-yamls](https://github.com/introclass/kubernetes-yamls)中是我正在积攒的一些yaml格式的部署文件。

这里演示部署一个名为webshell的应用：

	$ kubectl create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/webshell-all-in-one.yaml
	namespace/demo-webshell created
	ingress.extensions/webshell-ingress created
	service/webshell created
	service/webshell-nodeport created
	deployment.apps/webshell created

应用部署在一个新的名为`demo-webshell`的namespace中，这个pod中包含了两个容器：

	$ kubectl -n demo-webshell get pod -o wide
	NAME                      READY   STATUS    RESTARTS   AGE     IP             NODE            NOMINATED NODE
	webshell-594b49d7-wfcw7   2/2     Running   0          2m13s   172.16.129.3   192.168.33.12   <none>

可以在集群内直接通过pod的IP访问：

	[root@192.168.33.11 admin]# curl 172.16.129.3
	<html>
	<head>
	<meta content="text/html; charset=utf-8">
	<title>WebShell</title>
	</head>
	...

创建了两个Service，一个是CluserIP模式的，只能在集群内访问，另一个是NodePort模式的，可以在集群为通过32295端口访问：

	$ kubectl -n demo-webshell get svc
	NAME                TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)         AGE
	webshell            ClusterIP   172.16.46.6    <none>        80/TCP,22/TCP   3m50s
	webshell-nodeport   NodePort    172.16.83.52   <none>        80:32295/TCP    3m50s

可以直接在浏览器中打开`192.168.33.11:32295`，可以是任意一个node的IP。

这个应用的名为ssh的容器提供了sshd服务，可以在集群内通过用账号密码登陆到容器内部：

	[root@192.168.33.11 admin]# ssh root@172.16.129.3
	The authenticity of host '172.16.129.3 (172.16.129.3)' can't be established.
	ECDSA key fingerprint is SHA256:3T66QjaSacx901O3M8Y0K1UNAOA3u74j15oTC+xGHRU.
	ECDSA key fingerprint is MD5:b8:df:61:73:aa:31:46:c9:c0:b0:37:01:2b:fe:36:4e.
	Are you sure you want to continue connecting (yes/no)? yes
	Warning: Permanently added '172.16.129.3' (ECDSA) to the list of known hosts.
	root@172.16.129.3's password:
	[root@webshell-594b49d7-wfcw7 ~]# ps aux
	USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
	root         1  0.0  0.1  11684  1420 ?        Ss   19:25   0:00 bash /root/entrypoint.sh
	root        29  0.0  0.1 112812  1512 ?        Ss   19:25   0:00 /usr/sbin/sshd -E /root/sshd_log -f /root/sshd_config -p 22
	root        78  0.0  0.0   4360   352 ?        S    19:31   0:00 sleep 60
	root        81  1.0  0.5 149048  5900 ?        Ss   19:32   0:00 sshd: root@pts/0
	root        83  0.3  0.1  15252  1976 pts/0    Ss   19:32   0:00 -bash
	root        97  0.0  0.1  55140  1856 pts/0    R+   19:32   0:00 ps aux

## 总结

从编译到自动部署的讲解，暂时就这么多内容了。Kubernetes的使用细节非常多，它在PaaS领域中的位置，如同Linux在操作系统领域中的地位，换个说法就是，Kubernetes就是PaaS的操作系统。它所包含的内容，以后只会越来越多，现在开始学习还不算晚，是最好的上车时间。

后面我会尽力演示一下Kubernetes中各种各样的玩法，一般都是我在工作中遇到的一些场景，相关的笔记是一定会有的，就发布在这个www.lijiaocn.com这个博客上，一些业余时间写的脚本类工具也都会在github上公开。

但视频演示不一定有，制作视频需要准备环境和素材，并录制讲解，中间往往要折腾好多次，比较占用时间和精力，我会尽力录制简单、精炼的视频，让视频成为比较好的辅助内容，帮助有困惑和疑问的朋友，打通关键环节。

## 参考

1. [最快捷的本地部署方式：Minikube][1]
2. [Kubernetes1.12从零开始（一）：部署环境准备][2]
3. [Github: kubefromscratch-ansible][3]
4. [Github: kubefromscratch][4]
5. [moby、docker-ce与docker-ee][5]
6. [supervisord：进程管理工具supervisord][6]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/03/k8s-class-deploy.html#%E6%9C%80%E5%BF%AB%E6%8D%B7%E7%9A%84%E6%9C%AC%E5%9C%B0%E9%83%A8%E7%BD%B2%E6%96%B9%E5%BC%8Fminikube "最快捷的本地部署方式：Minikube"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/02/k8s-class-enviromnent.html "Kubernetes1.12从零开始（一）：部署环境准备"
[3]: https://github.com/introclass/kubefromscratch-ansible "Github: kubefromscratch-ansible"
[4]: https://github.com/introclass/kubefromscratch "Github: kubefromscratch"
[5]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/07/18/docker-commnuity.html "moby、docker-ce与docker-ee"
[6]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/08/23/linux-tool-supervisord.html "supervisord：进程管理工具supervisord"
