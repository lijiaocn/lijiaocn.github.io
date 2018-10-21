---
layout: default
title:  "Kubernetes1.12从零开始（五）：自己动手部署kubernetes"
author: 李佶澳
createdate: "2018-10-07 15:38:55 +0800"
changedate: "2018-10-07 15:38:55 +0800"
categories: 项目
tags: 视频教程 kubernetes
keywords: kubernetes,从零部署,deploy,kubernetes视频教程,kubernetes系列教程
description: "经过前面的尝试（一次minikube部署，一次kubeadm部署）以及基本概念的梳理，终于走到了自己动手从零开始部署kubernetes这一步"
---

* auto-gen TOC:
{:toc}

## 注意

>该文档未完成。2018-10-21 18:59:32

可以先参考：[Kubernetes1.12从零开始（三）：用minikube部署开发测试环境](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/03/k8s-class-deploy.html) 和 [Kubernetes1.12从零开始（三）：用kubeadm部署多节点集群](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/04/k8s-class-a-deploy-kubeadm.html)

在准备[kubelet的manifests文件](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/07/k8s-class-deploy-from-scratch.html#%E5%90%AF%E5%8A%A8kube-apiserver)时，
打算直接使用kubeadm生成的manifest文件，发现里面有一些不曾了解过的参数，需要等核实之后，继续完成。证书的命名也要调整一下，尽量与kubeadm的证书命名方式保持一致，避免造成困扰。

另外，现在心里有点犯嘀咕：还有必要用这种既缓慢、又折腾，而且容易出错的全手动方式部署吗？直接用官方维护更新的kubeadm不是更好？

即使不用kubeadm，很早之前已经做过一套[ansible脚本](https://github.com/introclass/kubefromscratch-ansible)，不仅部署过程自动化，编译过程也自动化了。
现在似乎更应该把精力放在已经写好的ansible脚本上，然后逐渐以kubeadm为主，否则社区跑的太快，追起来会很被动。2018-10-21 19:31:18

好消息是，刚试验了一下kubeadm，发现之前导致卡壳的问题没有了：[使用kubeadm部署多节点Kubernetes](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/03/k8s-class-deploy.html#%E4%BD%BF%E7%94%A8kubeadm%E9%83%A8%E7%BD%B2%E5%A4%9A%E8%8A%82%E7%82%B9kubernetes)

## 说明

经过前面的尝试（一次[minikube部署][1]，一次[kubeadm部署][2]）以及[基本概念的梳理][4]，终于走到了自己动手从零开始部署kubernetes这一步。

这里参照的主要文档是： [Creating a Custom Cluster from Scratch][4]。不过这个文档只是给出了大概的过程，用它的原话说就是：

	this guide will provide an outline of the steps you need to take

具体的过程，还是需要我们自己摸索。

其实很早之前，我已经写过一套将Kubernetes、以及它依赖、和被选用的组件从编译到部署，一次性完成的脚本：[introclass/kubefromscratch](https://github.com/introclass/kubefromscratch)。
后来又做了升级，用ansible包裹了一下，更容易使用了：[kubefromscratch-ansible](https://github.com/introclass/kubefromscratch-ansible)。

这套工具现在还可以使用，支持到了kubernetes1.8.0（如果时间充裕，会继续完善）。但是在这一节接下来的过程中，我不打算调整、使用这套工具，而是像一个初学者一样，一点一点地折腾kubernetes1.12版本的部署。
并且尽可能使用一些我之前没有用到的工具或者方法。

选择这样做，是因为我对kubernetes做了一定程度的了解之后，中间有一段时间没有关注它的发展，后来发现新来的同事，以及新公司的同事，在用一些
我没见过的方法部署或者操作Kubernetes，这个现象很有意思。我感觉很有必要全面梳理一下，看看都冒出了哪些新方法，尽量尝试一下新的方法，也使这个教程的保质期更长一些。
这样做不好的地方是，我可能会随时挖一些坑，后续了解地更多了，再逐渐填上:)。

## 部署规划

### 在哪部署？

首先是想清楚要部署在哪里。你可能会奇怪，这还需要想吗？是的。

因为我们现在面对的基础设施已经不仅仅是一台又一台的服务器了，还有各种各样的云（Cloud）。
我们现在既可以在一台又一台的服务器上部署（这种情况被称作在“Bare Metal”上部署）系统，也可以在AWS、Google Cloud、Azure，以及国内的阿里云、腾讯云等IAAS平台上部署系统。

这里说的在云上部署，不是说在云上申请了很多个虚拟机后，在这些虚拟机里一点一点部署，这种部署方式还是在“Bare Metal”上部署，只不过物理机变成了虚拟机。
在云上部署，是用云平台相比“Bare Metal”多出的功能，将系统更方便、快速部署在云上，并且充分利用云平台的能力。

云平台不仅仅给我们提供了虚拟机，它还提供了负载均衡、云存储、DNS等一些列功能，更关键的是：云平台是提供API的，也就是有调用接口。
有了API，就意味着可以用工具完成一些事情，不需要手动在云平台的网页上点来点去。同时意味着，有些操作可以自动化了。

Kubernetes抽象出了一个Cloud Provider的概念，在[pkg/cloudprovider](https://github.com/kubernetes/kubernetes/tree/master/pkg/cloudprovider)中定义了一组接口。
Kubernetes可以操作实现了这些接口的云平台，使部署过程大大简化：

	aws
	azure
	cloudstack
	gce
	openstack
	ovirt
	photon
	vsphere

> 不过，在云上部署我还没有试过，以后找机会试一下。2018-10-07 16:07:55

下面采用的是通用性最好的部署方式：Bare Metal上部署。

### 部署一个什么样的集群？

在[Kubernetes1.12从零开始（二）：部署环境准备][5]中，我们准备了三台虚拟机，分别是：

	node1: 192.168.33.11  CentOS 7  1G2C
	node2: 192.168.33.12  CentOS 7  1G2C
	node3: 192.168.33.13  CentOS 7  1G2C

计划用node1做Master，node2和node3作为两个计算节点，部署一个单Master双节点的Kubernetes集群（Master的高可用，这里暂时不讨论，有机会单独写一小节）。

### 采用哪种网络方案？

想清楚了在哪部署，部署一个什么样的集群，接下来要考虑的是采用哪种网络方案。

在[Kubernetes的存储与网络][7]中提到过，Kubernetes的网络功能是由网络插件提供的，[Kubernetes Cluster Networking][6]中介绍了Kubernetes的网络模型，和可用的插件。

Kubernetes的网络模型，其实就对网络的约定，是网络插件的实现标准。标准只有三条：

	all containers can communicate with all other containers without NAT
	all nodes can communicate with all containers (and vice-versa) without NAT
	the IP that a container sees itself as is the same IP that others see it as

简单说就是每个Pod（这里用Pod更准确）都分配一个IP，它们可以通过各自分配的IP直接访问彼此，中间不需要经过NAT之类的转换。

这一句话里包含了很多信息，怎样把宿主机上运行的一个虚拟机/容器暴露出去，以及同一个宿主机、不同宿主机上的虚拟机/容器之间如何通信，是在IaaS时代就被充分讨论过的问题。
最完善的方案是SDN，在宿主机的网络上累加了一个虚拟网络，通常采用`overlay`技术（vxlan、gre等）。

Kubernetes对网络的要求比IaaS对网络的要求宽松很多，最主要的一个特点就是：不要求Pod带IP迁移。

在IaaS中有一个“迁移”的刚需，意思是原先在NodeA上运行的虚拟机，需要能够带着数据和状态迁移到NodeB上。迁移过去之后，虚拟机的IP不能变，必须还是原先的IP。
如果迁移过程中，虚拟机如果需要关机，叫做“冷迁移”，如果不需要关机，叫做“热迁移”（热迁移很有意思，带着内存一起迁移哦，猜猜是怎么实现的），不管哪种迁移IP都不能变。

到了Kubernetes中，没有这个要求了，为什么呢？

因为在IaaS中，对外暴露的就是虚拟机的IP，虚拟机IP就是IaaS对外提供的服务的地址，虚拟机迁移后，服务地址肯定不能变。
而Kubernetes对外暴露的服务的地址不是Pod的地址，而是一个专门的IP，这个IP不会变。用户访问的是不会变的IP，而Pod的IP被隐藏在了这个IP后面，用户感知不到。
这样一来，Pod地址发生了变化，Kubernetes只需要在内部更新一下与不变的IP关联的Pod IP就可以了，没必要要求每个Pod到了另一个机器上以后，IP不变。

另外，在Kubernetes的设计中，也根本就没有“迁移”这个概念，只有副本的概念。
在kubernetes中，每个Pod都是一个副本，可以随时被杀死。当副本数量不够了，就找一台node，重新在上面启动一个副本。
Kubernetes就是这样设计，用户想用，就得按找kubernetes的规矩行事。可以说，Kubernetes通过提高对用户的要求，放松对自己的要求，使技术实现得到极大地简化。

>题外话：以后会不会提供Pod迁移的功能呢？可以畅想下。

Kubernetes对网络插件的要求不高，相应的，能够满足Kubernetes的网络插件就相当多了。功能更强大完备的SDN肯定没有问题，功能弱一些的网络方案也能用：

	ACI:  Cisco Application Centric Infrastructure 
	AOS from Apstr
	Big Cloud Fabric from Big Switch Networks
	Cilium
	CNI-Genie from Huawei
	Contiv
	Contrail
	Flannel
	Google Compute Engine (GCE)
	Jaguar
	Knitter
	Kube-router
	L2 networks and linux bridging
	Multus (a Multi Network plugin)
	NSX-T
	Nuage Networks VCS (Virtualized Cloud Services)
	OpenVSwitch
	OVN (Open Virtual Networking)
	Project Calico
	Romana
	Weave Net from Weaveworks
	Jaguar

[How to implement the Kubernetes networking model](https://kubernetes.io/docs/concepts/cluster-administration/networking/#how-to-implement-the-kubernetes-networking-model)
中有对这些插件的详细介绍。看到这些，相信你应该明白，为什么我之前说，SDN是一个内容很多的领域：看看有多少家公司在这个领域里折腾就知道了。
除了一些开源的软件方案，思科、华为、华三等厂家还提供收费的软硬件一体方案，各种场景的应对方案都有，嗯，报价也是视客户钱包鼓胀程度而定。

这里初步选定的网络插件是[Flannel][8]，没太多原因，现在用Flannel的比较多而已，我以前主要用calico，也像趁机多了解一下flannel。
先用它，插件式设计，使得我们以后要切换成其它插件时也不麻烦，各个网络插件的部署方法可以提前到[Pod Network][9]里看一下。

### 其它琐碎事务

比如为Cluster命名之类的，管理规划上的琐碎事情，不同公司有不同规矩，不同人有不同习惯，这里不提了。

## 准备证书

### 制作证书前需要知道的事情

#### 一共有多少套证书？

Kubernetes的组件其实很少（如果你以前折腾过OpenStack，一定会认同），但有一个地方比较麻烦：证书，一个Kubernetes系统中会有好几套证书。

先从etcd算起：

	etcd对外提供服务，要有一套etcd server证书
	etcd节点之间进行通信，要有一套etcd peer证书
	kube-apiserver访问etcd，要有一套etcd client证书

这已经有了三套证书了（都用一套也行，但既然是三种用途不同的通信，etcd也支持分别设置证书，还是用三套不一样的证书更严谨），然后算kubernetes的：

	kube-apiserver对外提供服务，要有一套kube-apiserver server证书
	kube-scheduler、kube-controller-manager、kube-proxy、kubelet和其它可能用到的组件，需要访问kube-apiserver，要有一套kube-apiserver client证书
	kube-controller-manager要生成服务的service account，要有一对用来签署service account的证书（这个其实是一个CA）
	kubelet对外提供服务，要有一套kubelet server证书
	kube-apiserver需要访问kubelet，要有一套kubelet client证书

这又是5套证书，加起来有8套。
我们这里的`套`的意思是：同一个套内的证书必须是用同一个CA签署的，签署不同套里的证书的CA可以相同，也可以不同。
譬如所有etcd server证书需要是同一个CA签署的，所有的etcd peer证书也需要是同一个CA签署的，而一个etcd server证书和一个etcd peer证书，完全可以是两个CA机构签署的，彼此没有任何关系。这算做两套证书。

为什么同一个“套”内的证书必须是同一个CA签署的呢？原因在在验证这些证书的一端。
在要验证这些证书的一端，通常只能指定（或者一般都只指定）一个Root CA。这样一来，被验证的证书自然都需要是被这同一个Root CA对应的私钥签署了，不然不能通过认证。

你可能会感到奇怪，在其它的部署教程中，怎么没有多套证书的说法？很多网上的教程是把一套证书同时用在了多个地方，或者用同一个RootCA签署了所有证书，所以才没有感觉到证书有8套之多。

你可能会问：即使用一套证书，照样能上生产，一堆证书文件，被在所有的机器上拷贝过来拷贝过去，也没见有什么问题，有必要把证书分得这么细致吗？

我认为是有必要的。第一，证书本来就是需要被认真考虑，小心对待的，如果你没有这个感觉，说明安全意识不过关。
第二，如果没有搞清楚这些证书间的关系，在遇到因为证书错误，请求被拒绝的现象的时候，可能瞬间抓瞎，搞不清楚是哪里的证书出了问题。
第三，如果没有搞清楚这些证书间的关系，在维护或者解决问题的时候，贸然更换了证书，弄不好会把整个系统搞瘫哦。

我最早开始折腾Kubernetes的时候，官方没有文档说证书的事情，通过查看每个组件的参数说明，然后不断试验，摸清了这8套证书的用途和关系。
现在开始接触kubernetes的同学就幸福多了，文档和资料充沛多了，譬如[Kubernetes PKI Certificates and Requirements][11]中就对证书做了比较详细的说明：

	(kube-apiserver client)       Client certificates for the kubelet to authenticate to the API server
	(kube-apiserver server)       Server certificate for the API server endpoint
	(kube-apiserver server)       Client certificates for administrators of the cluster to authenticate to the API server
	(kubelet client)              Client certificates for the API server to talk to the kubelets
	(etcd client)                 Client certificate for the API server to talk to etcd
	(kube-apiserver client)       Client certificate/kubeconfig for the controller manager to talk to the API server
	(kube-apiserver client)       Client certificate/kubeconfig for the scheduler to talk to the API server.
	(这个上面没有提到)            Client and server certificates for the front-proxy
	(etcd server、peer、client)   etcd also implements mutual TLS to authenticate clients and peers

不过官方文档里的划分，我感觉还是没有我上面提到的8套证书的说法清晰。

此外，官方文档中提到了一个用于font-proxy的证书，并且注释：

	Note: front-proxy certificates are required only if you run kube-proxy to support an extension API server.

>这个我还不太清楚怎么回事，不太明白这里的`extension API server`是个什么概念，之前没遇到过。先在心里打个问号，后面没准还会遇到。2018-10-07 20:09:10

#### TLS bootstrapping 省去了kubelet证书的制作

Kubernetes1.4版本引入了一组签署证书用的API。这组API的引入，使我们可以不用提前准备kubelet用到的证书。

首先为什么会有这组API存在呢？

因为每个kubelet用到的证书都要是独一无二的，要绑定各自的IP地址，于是需要给每个kubelet`单独`制作证书。
而kubernetes集群中，kubelet的数量会是很多的，并且实际应用中还会经常变动（增减node），kukbelet证书的制作维护就成了一件很麻烦的事情。
于是社区开始考虑简化这个过程，在[Dramatically simplify Kubernetes deployment ][12]中提出了bootstrp的构想：

Kubelet第一次启动的时候，先用同一个bootstrap token作为凭证。
这个token已经被提前设置为隶属于用户组`system:bootstrappers`，并且这个用户组的权限也被限定为只能用来申请证书。
用这个bootstrap token通过认证后，kubelet申请到属于自己的两套证书（kubelet server、kube-apiserver client for kubelet），申请成功后，再用属于自己的证书做认证，从而拥有了kubelet应有的权限。

这样一来，就去掉了手动为每个kubelet准备证书的过程，[TLS bootstrapping][15]是官方的说明文档，
并且kubelet的证书还可以自动轮替更新，见[Certificate Rotation](https://kubernetes.io/docs/tasks/tls/certificate-rotation/)。k

#### Kubelet的证书为什么要不同？

思考一下，每个kubelet使用的证书为什么要是不同的？

这样做是一个为了审计，另一个为了安全。
每个kubelet既是服务端（kube-apiserver需要访问kubelet），也是客户端（kubelet需要访问kube-apiserver），所以要有服务端和客户端两组证书。

服务端证书要不相同，这没得说：服务端证书需要与服务器地址绑定，每个kubelet的地址都不相同，即使绑定域名也是绑定不同的域名，所以只能不同。
客户端证书也`不应该`相同。每个kubelet的认证证书与所在机器的IP绑定后，可以防止一个kubelet的认证证书泄露以后，使从另外的机器上伪造的请求通过验证。

讲到这里，有没有猜到我想说啥？

如果每个node上保留了用于签署证书的bootstrap token，那么bootstrap token泄漏以后，是不是可以随意签署证书了？安全隐患反而更大了？
所以，kubelet启动成功以后，本地的bootstrap token需要被删除。任何一个密码或者文件，都不能被抛洒地到处都是，它们`应当存在且仅存在`于需要它们的地方。

感觉有点坑爹的是，直到v1.12.1，[TLS bootstrapping][15]这个特性，还是只有kubelet在使用。
问题是分布在每个Node上的kube-proxy也应当有独一无二的证书啊，它怎么没有用[TLS bootstrapping][15]特性签署证书？
与kubelet在证书方面唯一的区别是，kube-proxy只需要一套访问kube-apiserver的client证书，因为它不是一个对外提供访问的服务，不需要自己的server证书。

>莫非是社区认为都使用相同的认证证书，不是什么大问题？还是说社区有别的方法部署kube-proxy？心里打个问号，再往后看看。2018-10-07 22:50:32

### 开始制作证书

好了，啰嗦这么多，该说一下应该怎么做了。因为想试用下[TLS bootstrapping][15]功能，所以需要准备的证书有：

	etcd server
	etcd peer
	etcd client for kube-apiserver
	kube-apiserver server
	kube-apiserver client for kube-scheduler、kube-controler-manager、kube-proxy
	cluster ca  (用来签署kubelet用到的证书)
	service account 

制作证书的工具比较多，[Certificates](https://kubernetes.io/docs/concepts/cluster-administration/certificates/)中介绍了`easyrsa`、`openssl`和`cfssl`。
这些工具的用法，可以私下里去研究，这里就不展开了。如果对tls证书不了解，可以参阅：《[RSA的私钥和公钥，以及用openssl制作的方法][13]》、《[https证书的制作][14]》。

这里使用[CFSSL][16]，它是cloudflare开发的一个开源的PKI工具，对它的介绍见：《[Introducing CFSSL - CloudFlare's PKI toolkit][17]》。
它其实是一个完备的CA服务系统，可以签署、撤销证书等，覆盖了一个证书的整个生命周期，后面只用到了它的命令行工具。

CFSSL的功能和使用方法，以及它的特别之处，参考：[用CloudFlare的PKI工具CFSSL生成Certificate Bundle][18]。

#### 下载cfssl命令行工具

在node1中制作证书：

	cd node1
	mkdir cfssl/bin/
	cd cfssl

下载cfssl命令行工具，如果是linux系统，使用下面的命令：

	mkdir bin
	cd bin
	curl -L https://pkg.cfssl.org/R1.2/cfssl_linux-amd64 -o cfssl
	chmod +x cfssl
	curl -L https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64 -o cfssljson
	chmod +x cfssljson
	curl -L https://pkg.cfssl.org/R1.2/cfssl-certinfo_linux-amd64 -o cfssl-certinfo
	chmod +x cfssl-certinfo

如果是mac系统，使用下面的命令：

	curl -L https://pkg.cfssl.org/R1.2/cfssl_darwin-amd64 -o cfssl
	chmod +x cfssl
	curl -L https://pkg.cfssl.org/R1.2/cfssljson_darwin-amd64 -o cfssljson
	chmod +x cfssljson
	curl -L https://pkg.cfssl.org/R1.2/cfssl-certinfo_darwin-amd64 -o cfssl-certinfo
	chmod +x cfssl-certinfo

如果下载的cfssl在Mac上运行出错，可以改成用brew安装，或者用go get本地编译：

	#这个过程要从github上下载依赖的源代码，可能会很慢
	go get -u github.com/cloudflare/cfssl/cmd/...

我遇到一个cfssl错误是：[Failed MSpanList_Insert 0xa0f000](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html#mac%E4%B8%8Acfssl%E6%89%A7%E8%A1%8C%E5%87%BA%E9%94%99failed-mspanlist_insert-0xa0f000-0x19b27193a1671-0x0-0x0)。用本地Go重新编译得到的cfssl没有问题。

为了后续的演示一致，在Mac上，将本地编译的cffs文件复制到node1目录中：

	mkdir bin
	cp $GOPATH/bin/cfssl* bin/

创建一个存放证书的目录：

	mkdir cert
	cd cert

#### 生成CA证书

虽然可以用多套证书，但是维护多套CA实在过于繁杂，这里还是用一个CA签署所有证书。

创建文件`cert/ca/ca-csr.json`，这个文件中是对要生成的CA证书的要求：

	{
	  "CN": "CN",
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names":[{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "kubernetes"
	  }]
	}

然后执行下面的命令，生成CA：

	./bin/cfssl gencert -initca cert/ca/ca-csr.json | ./bin/cfssljson -bare ca

得到下面的文件：

	ca-key.pem  ca.csr  ca.pem

其中ca-key.pem是ca的私钥，ca.csr是一个签署请求，ca.pem是CA证书，是后面kubernetes组件会用到的RootCA。

可以用下面的命令查看ca证书的内容：

	openssl x509 -in ca.pem -text

可以看到ca.pem中的Issuer、Subject就是ca-csr.json中设置的内容：

	    ...
	    Signature Algorithm: sha256WithRSAEncryption
	        Issuer: C=CN, ST=BeiJing, L=BeiJing, O=lijiaocn.com, OU=kubernetes, CN=CN
	        Validity
	            Not Before: Oct 13 16:49:00 2018 GMT
	            Not After : Oct 12 16:49:00 2023 GMT
	        Subject: C=CN, ST=BeiJing, L=BeiJing, O=lijiaocn.com, OU=kubernetes, CN=CN
	     ...

把这三个文件移动到cert/ca目录中：

	mv ca* cert/ca

另外还需要创建`cert/ca/ca-config.json`，这个文件中包含后面签署etcd、kubernetes等证书的时候，用到的配置：

	{
	  "signing": {
	    "default": {
	      "expiry": "87600h"
	    },
	    "profiles": {
	      "etcd": {
	        "usages": [
	          "signing",
	          "key encipherment",
	          "server auth",
	          "client auth"
	        ],
	        "expiry": "87600h"
	      },
	      "kubernetes": {
	        "usages": [
	          "signing",
	          "key encipherment",
	          "server auth",
	          "client auth"
	        ],
	        "expiry": "87600h"
	      }
	    }
	  }
	}

#### 生成etcd的证书

这里计划部署一个单节点的etcd，在192.168.33.11上。所以下面只生成了192.168.33.11的etcd证书。

##### etcd server证书

创建etcd server的证书配置，`cert/etcd/server/192.168.33.11/etcd-csr.json`：

	{
	  "CN": "etcd",
	  "hosts": [
	    "127.0.0.1",
	    "192.168.33.11"
	  ],
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names": [{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "etcd server"
	  }]
	}

然后执行下面的命令，生成etcd的server证书：

	./bin/cfssl gencert -ca=./cert/ca/ca.pem  -ca-key=./cert/ca/ca-key.pem  --config=./cert/ca/ca-config.json -profile=etcd ./cert/etcd/server/192.168.33.11/etcd-csr.json  | ./bin/cfssljson -bare etcd-server

得到下面的文件：

	etcd-server-key.pem etcd-server.csr     etcd-server.pem

`etcd-server.pem`和`etcd-server-key.pem`分别是etcd-server的证书和私钥，将它们移动到etcd/192.168.33.11目录中：

	mv etcd-server* cert/etcd/server/192.168.33.11

`etcd-server.csr`是签署时用到的中间文件，如果你不打算自己签署证书，而是让第三方的CA机构签署，只需要把etcd-server.csr文件提交给CA机构。

##### etcd peer证书

peer证书的制作过程类似，和server证书以及下面的etcd证书，本质上都是相同的证书，只不过用在了不同的地方。

创建etcd peer的证书配置，`cert/etcd/peer/192.168.33.11/etcd-csr.json`：

	{
	  "CN": "etcd",
	  "hosts": [
	    "127.0.0.1",
	    "192.168.33.11"
	  ],
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names": [{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "etcd peer"
	  }]
	}

然后执行下面的命令，生成etcd的peer证书：

	./bin/cfssl gencert -ca=./cert/ca/ca.pem  -ca-key=./cert/ca/ca-key.pem  --config=./cert/ca/ca-config.json -profile=etcd ./cert/etcd/peer/192.168.33.11/etcd-csr.json  | ./bin/cfssljson -bare etcd-peer

得到下面的文件：

	etcd-peer-key.pem etcd-peer.csr     etcd-peer.pem

将它们移动到peer目录中：

	mv etcd-peer* cert/etcd/peer/192.168.33.11

##### etcd client证书

etcd client证书是给需要访问etcd的程序用的，需要访问etcd的是kubernetes master的组件apiserver，它部署在192.168.33.11上。

创建etcd client的证书配置，`cert/etcd/client/192.168.33.11/etcd-csr.json`：

	{
	  "CN": "etcd",
	  "hosts": [
	    "127.0.0.1",
	    "192.168.33.11"
	  ],
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names": [{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "etcd client"
	  }]
	}

然后执行下面的命令，生成etcd的client证书：

	./bin/cfssl gencert -ca=./cert/ca/ca.pem  -ca-key=./cert/ca/ca-key.pem  --config=./cert/ca/ca-config.json -profile=etcd ./cert/etcd/client/192.168.33.11/etcd-csr.json  | ./bin/cfssljson -bare etcd-client

得到下面的文件：

	etcd-client-key.pem etcd-client.csr     etcd-client.pem

将它们移动到client目录中：

	mv etcd-client* cert/etcd/client/192.168.33.11

#### 生成kubernetes master证书

kube-apiserver、kube-scheduler、kube-controller-manager是kubernetes的master组件，这里生成它们使用的证书。

##### kube-apiserver的server证书

创建etcd client的证书配置，`cert/kube-apiserver/server/192.168.33.11/apiserver-csr.json`：

	{
	  "CN": "kube-apiserver",
	  "hosts": [
	    "127.0.0.1",
	    "192.168.33.11"
	  ],
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names": [{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "kube-apiserver"
	  }]
	}

然后执行下面的命令，生成kube-apiserver的server证书：

	./bin/cfssl gencert -ca=./cert/ca/ca.pem  -ca-key=./cert/ca/ca-key.pem  --config=./cert/ca/ca-config.json -profile=kubernetes ./cert/kube-apiserver/server/192.168.33.11/apiserver-csr.json  | ./bin/cfssljson -bare kube-apiserver-server

得到下面的文件：

	kube-apiserver-server-key.pem kube-apiserver-server.csr     kube-apiserver-server.pem

将它们移动到server目录中：

	mv kube-apiserver-server* cert/kube-apiserver/server/192.168.33.11

##### kube-apiserver的client证书

生成kube-apiserver的client证书的时候，需要特别注意。因为kubernetes会通过证书CN（Comman Name)识别当前请求者的角色，不同的角色有不同的操作权限。

因此kube-scheduer、kube-controller-manager的kube-apiserver client证书的CN分别是：

	system:kube-controller-manager
	system:kube-scheduler

###### kube-apiserver client证书 for kube-scheduler

创建kube-scheduler的kube-apiserverclient的证书配置，`cert/kube-apiserver/client/kube-scheduler/192.168.33.11/apiserver-csr.json`：

	{
	  "CN": "system:kube-scheduler",
	  "hosts": [
	    "127.0.0.1",
	    "192.168.33.11"
	  ],
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names": [{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "kube-scheduler"
	  }]
	}

然后执行下面的命令，生成证书：

	./bin/cfssl gencert -ca=./cert/ca/ca.pem  -ca-key=./cert/ca/ca-key.pem  --config=./cert/ca/ca-config.json -profile=kubernetes ./cert/kube-apiserver/client/kube-scheduler/192.168.33.11/apiserver-csr.json  | ./bin/cfssljson -bare kube-apiserver-scheduler

得到三个文件：

	kube-apiserver-scheduler-key.pem kube-apiserver-scheduler.csr     kube-apiserver-scheduler.pem

移动到对应目录：

	mv kube-apiserver-scheduler* cert/kube-apiserver/client/kube-scheduler/192.168.33.11

###### kube-apiserver client证书 for kube-controller-manager

创建kube-controller-manager的kube-apiserver client的证书配置，`cert/kube-apiserver/client/kube-controller/192.168.33.11/apiserver-csr.json`：

	{
	  "CN": "system:kube-controller-manager",
	  "hosts": [
	    "127.0.0.1",
	    "192.168.33.11"
	  ],
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names": [{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "kube-scheduler"
	  }]
	}

然后执行下面的命令，生成证书：

	./bin/cfssl gencert -ca=./cert/ca/ca.pem  -ca-key=./cert/ca/ca-key.pem  --config=./cert/ca/ca-config.json -profile=kubernetes ./cert/kube-apiserver/client/kube-controller/192.168.33.11/apiserver-csr.json  | ./bin/cfssljson -bare kube-apiserver-controller

得到三个文件：

	kube-apiserver-controller-key.pem kube-apiserver-controller.csr     kube-apiserver-controller.pem

移动到对应目录：

	mv kube-apiserver-controller* cert/kube-apiserver/client/kube-controller/192.168.33.11

##### kube-controller-manager签署service account的证书

kube-controller-manager会为kubernetes中的每个namespace创建一个ServiceAccount，这个service account需要被用证书签署。

这里生成用来签署service account的证书，本质上是一个CA证书，创建配置文件`cert/ServiceAccount/service-account-csr.json`：

	{
	  "CN": "CN",
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names":[{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "ServiceAccount"
	  }]
	}

然后执行下面的命令，生成CA：

	./bin/cfssl gencert -initca cert/ServiceAccount/service-account-csr.json | ./bin/cfssljson -bare service-account 

得到下面的文件：

	service-account-key.pem service-account.csr     service-account.pem

把这三个文件移动到对应目录中：

	mv service-account* cert/ServiceAccount

## 组件部署

需要安装的软件有：

	etcd
	A container runner, one of:
	    docker
	    rkt
	Kubernetes
	    kubelet
	    kube-proxy
	    kube-apiserver
	    kube-controller-manager
	    kube-scheduler

Docker和etcd，是独立于Kubernetes的项目，按照它们各自提供的方式安装即可。

其中etcd最好使用[cluster/images/etcd/Makefile](https://github.com/kubernetes/kubernetes/blob/v1.12.1/cluster/images/etcd/Makefile)中使用的版本，这是kubernetes测试时使用的etcd版本。

	LATEST_ETCD_VERSION?=3.2.24

kube-apiserver、kube-controller-manager、kube-scheduler，文档中建议[用容器的方式启动](https://kubernetes.io/docs/setup/scratch/#selecting-images)，需要提前准备好镜像。
它们的镜像，可以从k8s.gcr.io中下载，也可以从kubernetes的release文件中获得。

kubelet、kube-proxy可以直接下载二进制文件部署，也可以通过Google提供的yum源安装。

### 部署etcd

etcd是独立于kubernetes的，但它对kubernetes极为重要，kubernetes依赖etcd，将数据都保存在etcd中。

鉴于etcd的重要性，将etcd集群单独部署、单独维护，是非常应当的。

etcd版本选用[cluster/images/etcd/Makefile (v1.12.1)](https://github.com/kubernetes/kubernetes/blob/v1.12.1/cluster/images/etcd/Makefile)中使用的版本：

	LATEST_ETCD_VERSION?=3.2.24

这里直接从[etcd的github主页](https://github.com/etcd-io/etcd/releases)下载：

	cd node1/
	wget https://github.com/etcd-io/etcd/releases/download/v3.2.24/etcd-v3.2.24-linux-amd64.tar.gz
	tar -xvf etcd-v3.2.24-linux-amd64.tar.gz

>这里暂时使用yum源中的etcd，自己定义etcd service的方法，以后有时间再补充。2018-10-21 16:08:54

#### yum安装etcd

进入虚拟机中部署：

	vagrant up
	vagrant ssh
	yum install -y etcd

然后编辑`/etc/etcd/etcd.conf`，指定我们前面创建的etcd证书：

	ETCD_LISTEN_CLIENT_URLS="https://192.168.33.11:2379"
	...
	ETCD_ADVERTISE_CLIENT_URLS="https://192.168.33.11:2379"
	...
	[Security]
	ETCD_CERT_FILE="/vagrant/cfssl/cert/etcd/server/192.168.33.11/etcd-server.pem"
	ETCD_KEY_FILE="/vagrant/cfssl/cert/etcd/server/192.168.33.11/etcd-server-key.pem"
	ETCD_CLIENT_CERT_AUTH="true"
	ETCD_TRUSTED_CA_FILE="/vagrant/cfssl/cert/ca/ca.pem"
	ETCD_AUTO_TLS="false"
	ETCD_PEER_CERT_FILE="/vagrant/cfssl/cert/etcd/peer/192.168.33.11/etcd-peer.pem"
	ETCD_PEER_KEY_FILE="/vagrant/cfssl/cert/etcd/peer/192.168.33.11/etcd-peer-key.pem"
	ETCD_PEER_CLIENT_CERT_AUTH="false"
	ETCD_PEER_TRUSTED_CA_FILE="/vagrant/cfssl/cert/ca/ca.pem"
	ETCD_PEER_AUTO_TLS="false"

>注意：如果URLS没有使用https的样式，那么即使指定了证书，也不会启用。

还需要把etcd证书的所属用户修改为etcd，否则etcd不能启动：

	chown -R  etcd:etcd /vagrant/cfssl/cert/etcd/

启动：

	systemctl start etcd

用下面的命令验证一下：

	etcdctl  --endpoints=https://192.168.33.11:2379 --ca-file=/vagrant/cfssl/cert/ca/ca.pem  --cert-file=/vagrant/cfssl/cert/etcd/client/192.168.33.11/etcd-client.pem --key-file=/vagrant/cfssl/cert/etcd/client/192.168.33.11/etcd-client-key.pem member list
	8e9e05c52164694d: name=default peerURLs=http://localhost:2380 clientURLs=https://192.168.33.11:2379 isLeader=true

### 部署master

#### 下载文件和镜像

在[kubernetes release list](https://github.com/kubernetes/kubernetes/releases/)中可以找到二进制文件的下载地址，例如v1.12.1的下载地址是：

	https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG-1.12.md#downloads-for-v1121

在node1目录中下载服务端和客户端的二进制文件：

	cd node1
	wget https://dl.k8s.io/v1.12.1/kubernetes-server-linux-amd64.tar.gz
	tar -xvf kubernetes-server-linux-amd64.tar.gz
	wget https://dl.k8s.io/v1.12.1/kubernetes-node-linux-amd64.tar.gz
	tar -xvf kubernetes-node-linux-amd64

解压以后，在服务端文件中可以找到几个.tar文件，它们就是同名组件的docker镜像：

	$ find . -name "*.tar"
	./kubernetes/server/bin/kube-proxy.tar
	./kubernetes/server/bin/kube-scheduler.tar
	./kubernetes/server/bin/kube-controller-manager.tar
	./kubernetes/server/bin/cloud-controller-manager.tar
	./kubernetes/server/bin/kube-apiserver.tar

这些文件保留备用。

#### 安装docker和kubelet

在master节点上，docker和kubelet其实不是必须的，但是现在比较常见的一个做法是使用kubelet启动kube-apiserver等组件。

这样就需要安装docker和kubelet了，在[Kubernetes1.12从零开始（三）：用minikube与kubeadm部署](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/03/k8s-class-deploy.html#%E5%AE%89%E8%A3%85dockerkubeletkubeadm)中介绍过，这里不赘述了。

最后安装的时候，可以去掉kubeadm：

	yum install -y kubelet kubectl --disableexcludes=kubernetes
	systemctl enable kubelet && systemctl start kubelet

Google提供的yum源中默认就是最新的kubernetes。如果你不想用，可以将相应的文件替换掉。

#### 启动kube-apiserver

首先导入前面下载的kube-apiserver的docker镜像：

	docker load -i /vagrant/kubernetes/server/bin/kube-apiserver.tar

用images命令查看导入的镜像名称：

	$ docker images |grep kube-apiserver
	gcr.io/google_containers/kube-apiserver                                        v1.12.1             dcb029b5e3ad        2 weeks ago         194MB
	k8s.gcr.io/kube-apiserver                                                      v1.12.1             dcb029b5e3ad        2 weeks ago         194MB

然后创建文件`/etc/kubernetes/manifests/kube-apiserver.yaml`

#### 启动kube-controller-manager

#### 启动kube-scheduler

### 部署node

## 问题排查

## 参考

1. [最快捷的本地部署方式：Minikube][1]
2. [使用kubeadm部署多节点Kubernetes][2]
3. [Kubernetes1.12从零开始（四）：必须先讲一下基本概念][3]
4. [Creating a Custom Cluster from Scratch][4]
5. [Kubernetes1.12从零开始（二）：部署环境准备][5]
6. [Kubernetes Cluster Networking][6]
7. [Kubernetes的存储与网络][7]
8. [Github Flannel][8]
9. [Kubernetes Pod Network][9]
10. [Kubernetes的TLS证书][10]
11. [Kubernetes PKI Certificates and Requirements][11]
12. [Dramatically simplify Kubernetes deployment ][12]
13. [RSA的私钥和公钥，以及用openssl制作的方法][13]
14. [https证书的制作][14]
15. [Kubernetes TLS bootstrapping][15]
16. [Github cfssl][16]
17. [Introducing CFSSL - CloudFlare's PKI toolkit][17]
18. [用CloudFlare的PKI工具CFSSL生成Certificate Bundle][18]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/03/k8s-class-deploy.html#%E6%9C%80%E5%BF%AB%E6%8D%B7%E7%9A%84%E6%9C%AC%E5%9C%B0%E9%83%A8%E7%BD%B2%E6%96%B9%E5%BC%8Fminikube "最快捷的本地部署方式：Minikube"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/03/k8s-class-deploy.html#%E4%BD%BF%E7%94%A8kubeadm%E9%83%A8%E7%BD%B2%E5%A4%9A%E8%8A%82%E7%82%B9kubernetes "使用kubeadm部署多节点Kubernetes"
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/04/k8s-class-concepts.html "Kubernetes1.12从零开始（四）：必须先讲一下基本概念"
[4]: https://kubernetes.io/docs/setup/scratch/ "Creating a Custom Cluster from Scratch"
[5]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/02/k8s-class-enviromnent.html "Kubernetes1.12从零开始（二）：部署环境准备"
[6]: https://kubernetes.io/docs/concepts/cluster-administration/networking/#how-to-achieve-this/ "Kubernetes Cluster Networking"
[7]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/04/k8s-class-concepts.html#kubernetes%E7%9A%84%E5%AD%98%E5%82%A8%E4%B8%8E%E7%BD%91%E7%BB%9C "Kubernetes的存储与网络"
[8]: https://github.com/coreos/flannel#flannel "Github Flannel"
[9]: https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network "Kubernetes Pod Network"
[10]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/01/k8s-class-kubernetes-intro.html#tls%E8%AF%81%E4%B9%A6 "Kubernetes的TLS证书"
[11]: https://kubernetes.io/docs/setup/certificates/ "Kubernetes PKI Certificates and Requirements"
[12]: https://github.com/kubernetes/kubernetes/issues/2303 "Dramatically simplify Kubernetes deployment "
[13]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/01/23/rsa-key.html "RSA的私钥和公钥，以及用openssl制作的方法"
[14]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/08/18/https-certs-creat.html "https证书的制作"
[15]: https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet-tls-bootstrapping/ "Kubernetes TLS bootstrapping"
[16]: https://github.com/cloudflare/cfssl "Github cfssl"
[17]: https://blog.cloudflare.com/introducing-cfssl/ "Introducing CFSSL - CloudFlare's PKI toolkit"
[18]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/10/13/cfssl-cloudflare-pki-toolkit.html "用CloudFlare的PKI工具CFSSL生成Certificate Bundle"
