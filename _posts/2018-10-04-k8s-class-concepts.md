---
layout: default
title:  "Kubernetes1.12从零开始（四）：必须先讲一下基本概念"
author: 李佶澳
createdate: "2018-10-05 22:07:51 +0800"
changedate: "2018-10-05 22:07:51 +0800"
categories: 项目
tags: 视频教程 Kubernetes
Keywords: Kubernetes,基本概念,pod,docker
description: Kubernetes中的一些基本概念，有必要先讲一下，不然后面容易感觉云里雾里
---

* auto-gen TOC:
{:toc}

## 说明

[上一节][1]中，成功用minikube启动了一个本地kubernetes（可惜是1.10的，1.12的没成功），用kubeadm部署1.12也[尴尬的失败了](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/03/k8s-class-deploy.html#%E9%97%AE%E9%A2%981-kubeadmi-init%E5%A4%B1%E8%B4%A5kube-apiserver%E4%B8%8D%E5%81%9C%E9%87%8D%E5%90%AF)。

没能顺利部署1.12的一个重要原因是：1.12这个版本太新了。v1.12.0是9月27日release的，才刚刚过去没几天。v1.12.1刚在19个小时前release（2018-10-06 22:18:44）。这么新的版本，很多配套工具，可能都还没有磨合好。

如果是生产环境，选择kubernetes版本的时候，一定要小心斟酌，别选太新的版本，选择上一个，或者上上个稳定版本。
我这里是在做教程，就“择新不择旧”了，哪个版本新用哪个，让时效性尽量好一点。

前面用minikube和kubeadm部署1.12版本都没有成功，本来应该先讲一下怎样全手动的把kubernetes1.12部署起来：自己定制每一个组件、敲定每一个参数。但是，这个过程会有一些繁琐，甚至有一些波折。

因此，先介绍一下kubernetes中的一些基本概念，或许更好一些，不然后面容易感觉云里雾里。这一节，你只要知道这些概念就可以了，以后遇到感觉面熟就行。

我的习惯还是借花献佛，请多参考官方文档：[kubernetes Concepts][2]。

## Kubernetes的组成

[kubernetes Components][3]可以按照Master和Node进行划分。Master就是kubernetes的管理节点，它是kubernetes的大脑，是调度中心，Node是kubernetes的任务节点，提供计算资源，承担运行容器的工作。这是一种很经典的设计方式。

Master组件包括：

	etcd
	kube-apiserver
	kube-scheduler
	kube-controller-manager
	cloud-controller-manager

Node组件包括：

	kubelet
	kube-proxy
	Container Runtime

### etcd用来做什么的，为什么选择它？

etcd是用来存放数据并通知变动的。

Kubernetes中没有用到数据库，它把关键数据都存放在etcd中，这使kubernetes的整体结构变得非常简单。

因为在kubernetes中，数据是随时发生变化的，比如说用户提交了新任务、增加了新的Node、Node宕机了、容器死掉了等等，都会触发状态数据的变更。状态数据变更之后呢，Master上的kube-scheduler和kube-controller-manager，就会重新安排工作，它们的工作安排结果也是数据。这些变化，都需要及时地通知给每一个组件。

etcd有一个特别好用的特性，可以调用它的api监听其中的数据，一旦数据发生变化了，就会收到通知。有了这个特性之后，kubernetes中的每个组件只需要监听etcd中数据，就可以知道自己应该做什么。kube-scheduler和kube-controller-manager呢，也只需要把最新的工作安排写入到etcd中就可以了，不用自己费心去逐个通知了。

试想一下，如果没有etcd，那么要怎样做？这里的本质是：数据的传递有两种方式，一种是消息的方式，比如说NodeA有了新的任务，Master直接给NodeA发一个消息，中间不经过任何人；一种是轮询的方式，大家都把数据写到同一个地方，每个人自觉地盯着看，及时发现变化。前者演化出rabbitmq这样的消息队列系统，后者演化出一些有订阅功能的分布式系统。

第一种方式的问题是，所有要通信的组件之间都要建立长连接，并且要处理各种异常情况，比例如连接断开、数据发送失败等。不过有了消息队列(message queue)这样的中间件之后，问题就简单多了，组件都和mq建立连接即可，将各种异常情况都在mq中处理。

那么为什么kubernetes没有选用mq而是选用etcd呢？mq和etcd是本质上完全不同的系统，mq的作用消息传递，不储存数据（消息积压不算储存，因为没有查询的功能），etcd是个分布式存储（它的设计目标是分布式锁，顺带有了存储功能），是一个带有订阅功能的key-value存储。如果使用mq，那么还需要引入数据库，在数据库中存放状态数据。

选择etcd还有一个好处，etcd使用raft协议实现一致性，它是一个分布式锁，可以用来做选举。如果在kubernetes中部署了多个kube-schdeuler，那么同一时刻只能有一个kube-scheduler在工作，否则各自安排各自的工作，就乱套了。怎样保证只有一个kube-schduler在工作呢？通过etcd选举出一个leader。

关于分布式锁和etcd可以参阅Google的论文：[The Chubby lock service for loosely-coupled distributed systems][4]

需要注意，虽然etcd可以存储数据，但不要滥用，它运行raft协议保证整个系统中数据一致，因此写入、读取速度都是很慢的。kubernetes早期支持的Node数量有限，就是因为etcd是瓶颈。etcd主要在一些分布式系统中提供选举功能。

别看kubernetes现在可以支撑的集群规模很大，但是它产生的请求数，要比一些大型网站面临的请求数，少很多个很多数量级。那里是mysql、memcache、redis的地盘。

### Kube-apiserver，kube-scheduler、kube-controller-manager、cloud-controller-manager

前面讲，每个组件只需要和etcd通信就可以及时获得通知了。但实际上，每个组件不是直接和etcd通信的，它们都是和kube-apiserver通信，然后kube-apiserver再和etcd通信。这就是kube-apiserver的作用。在组件与etcd中间加上了这一层，可以实现访问控制等，并且在一定程度上与etcd解耦。

Kube-scheduler是调度器，是安排容器的去处的，就是为每个容器找到一个合适的Node。

Kube-controller-manager是管理器，是用来管理kubernetes中的任务的，保证每个任务处于正确的状态。这个现在可能不好理解，后面看到Deployment、Daemonset等kubernetes中的概念就知道了。

cloud-controller-manager使用来打通IaaS的，在云上部署kubernetes的时候用到，可以自动增减Node之类的。这个我还没用过(2018-10-06 23:19:56)。

### Kubelet、kube-proxy、Container Runtime

在上一节[kubelet的用途](https://www.lijiaocn.com/项目/2018/10/03/k8s-class-deploy.html#kubelet的用途)中已经介绍过kubelet的作用，这里不赘述了。记住它就是node上的agent就可以了。

Kube-proxy需要说一下，它是用来在node上设置报文转发策略、通行策略的，也就是iptables规则。额，这个现在也只能说到这，这属于网络方面的SDN领域，一时半会儿说不清楚。

Container Runtime，不要被这个词唬住了，在实际使用中，一般就是Docker。但是概念还是要掰扯清楚的，kubernetes不是离开Docker不能运转的，因为它实现了自己的agent——kubelet，docker对它来说只是kubelet管理的一个组件。哪天kubelet不开心，它完全可以把docker踢掉，换成别的组件，有kubelet屏蔽底层的差异，上层感觉不到变化一切照旧。

后来kubelet还真的不开心了，折腾出一个叫做Container Runtime的。其实就是kubelet定义了一个叫做CRI的接口，任何实现了CRI接口的软件，都可以和kubelet对接。只要符合标准就可以和kubelet玩耍。这样一来，docker不过是众多符合标准的软件中的一个。

出现这种情况，一是架构设计上有“解耦”的需要，另外也有商业的因素。当时Docker公司表现出很强烈的自成一派的倾向，想要通过把持docker从头吃到尾，包揽所有组件，引发了不少抗议。

虽然Docker最终落败，kubernetes奠定了江湖地位，也搞出了CRI。但是，现在主流还是用docker，以后或许会变。

### 以插件（Addon）形式存在的组件

上述的几个组件搭起了kubernetes的总体框架，仅靠上面的几个组件，就可以把kubernetes搭起来，但是不能用！
因为上述的几个组件解决了管理、调度、执行这三个最基本、最基本的工作，它们真的只完成了这三个工作。

只这样是不行的，部署在kubernetes中的容器，怎样被访问，容器与容器之间怎样通信？还有日志监控等等，都是必须有的功能。

Kubernetes在设计上高屋建瓴，把这些统统归结到插件（Addon）中了。这样一解耦，其它公司、团队，就可以撒着欢地设计自己的插件了，多样的插件带来了多种可能。譬如说，单单官方收录的[网络插件][5]就有六七种。

通过插件化设计，kubernetes团队就可以专心做管理、调度、执行三个工作，分工明确，更新有序。

而且插件可以直接部署在kubernetes中，这样一来插件的管理也变得非常方便。在第五篇“手动部署”中我们会陆续接触到一些核心插件。

## Kubernetes中任务(Workload)

我们把提交到kubernetes中的任务统一称为Workload，任务分位两大类：`Pod`和`Controller`。

[Pod](https://kubernetes.io/docs/concepts/workloads/pods/pod-overview/)好理解，它就是一组不可分离的容器。

>注意: 虽然前面的章节中我们总是提起的是`容器`，但kubernetes中任务的最小单位其实是`Pod`，之前因为还没有介绍Pod，所以都用容器指代。

Kubernetes中任务的最小单位是Pod，Pod可以是一个容器或者多个容器。如果是多个容器，这些容器都是紧密结合在一起的，它们不仅要位于相同的Node上，并且拥有相同的IP地址，甚至于进程空间。

Pod是比容器更高一层的概念。增加了这一层，自然是为了增加灵活性。如果一个Pod中只能有一个容器，那么一个功能复杂一点的Pod，就需要在这个容器中同时运行几种不同类型的服务。Pod支持多容器，就可以把这些任务拆解到不同的容器中。

对于Pod，需要特别关注的是[Pod的生命周期](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)，
甚至可以在不同阶段挂载钩子[Attach Handlers to Container Lifecycle Events](https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/),
我把和Pod相关的文档，都收集在了[Pod和Container操作](http://127.0.0.1:4000/%E9%A1%B9%E7%9B%AE/2018/10/01/k8s-class-kubernetes-intro.html#pod%E5%92%8Ccontainer%E6%93%8D%E4%BD%9C)中。

Controller是比Pod更高一层的概念。Controller是由一组Pod组成的，这一组Pod是可以分布在不同的Node上。Pod虽然支持多个容器，但是它的定位还是单一任务，不支持无法跨Node分布容器。跨Node分布任务的重任，分派给了Controller，Pod安心关注内部的容器就可以了。

怎样跨Node分布Pod？这是最容易出“花活儿”的地方，事实也确实如此，现在kubernetes支持的Controller有以下几种：

[ReplicaSet](https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/)，确保始终有固定数量的Pod在运行；

[Deployment](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)，比ReplicaSet更高一层，用来定义Pod或者ReplicaSet；

[StatefulSet](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)，确保始终有固定数量的Pod在运行，并且保证这些Pod是严格按照顺序启动的；

[DaemonSet](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/)，确保每个Node上都有指定的Pod在运行；

[Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/jobs-run-to-completion/)，一批运行结束即退出的“非常驻”Pod；

[CronJob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/)，定时在kubernetes中启动的一批Pod。

还是建议直接阅读官方文档，上面的超连接连接到了对应文档页。这部分官方文档写的很好，比较容易理解。

## Kubernetes中的配置(Configuration)

注意，这里指定的是kubernetes`中`的配置，不是kubernetes的配置。

一个软件系统其实就是由两部分组成的：程序文件和配置文件。前一小节我们简单介绍了kubernetes中的任务，那么这些任务使用的配置要如何管理？

最傻最直接的方式就是把配置文件和程序文件打包在一起，比如说全打包到容器中。但这样显然是不好的，程序文件就是程序文件，配置文件就是配置文件。
最好将两者严格分开，这样很多用户可以共用相同的程序文件，维护各自不同的配置文件。升级的时候，也可以很好地保护原先的配置。

在kubernetes中部署任务的时候，最好这样规划：

	容器的镜像就是纯粹的程序文件，运行时需要的配置用其它方式获得。

配置怎样获得呢？kubernetes支持这样几种方式：

在提交任务的时候，指定命令行参数、或者环境变量，见[数据注入应用的方法](http://127.0.0.1:4000/%E9%A1%B9%E7%9B%AE/2018/10/01/k8s-class-kubernetes-intro.html#%E6%95%B0%E6%8D%AE%E6%B3%A8%E5%85%A5%E5%BA%94%E7%94%A8%E7%9A%84%E6%96%B9%E6%B3%95);

将配置保存在ConfigMap中，提交任务的时候挂载ConfigMap，见[Configure a Pod to Use a ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/);

一些敏感配置，比如账号密码等，最好做成Secrets，提交任务的时候挂载它，见[Secret](https://kubernetes.io/docs/concepts/configuration/secret/);

如果你的配置文件是由kubernetes外部的系统管理的，可以考虑使用[Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)，在Pod正式启动前，准备好配置。

这样几种方式，基本上能应对各种情况了。

## Kubernetes的存储与网络

前面已经介绍了“任务”和“配置”，解决了“计算”方面的问题。那么“存储”和“网络”方面是怎样的呢？

先说存储，kubernetes支持很多类型的[Volume](https://kubernetes.io/docs/concepts/storage/volumes/#types-of-volumes)，如下：

	awsElasticBlockStore
	azureDisk
	azureFile
	cephfs
	configMap
	csi
	downwardAPI
	emptyDir
	fc (fibre channel)
	flocker
	gcePersistentDisk
	gitRepo (deprecated)
	glusterfs
	hostPath
	iscsi
	local
	nfs
	persistentVolumeClaim
	projected
	portworxVolume
	quobyte
	rbd
	scaleIO
	secret
	storageos
	vsphereVolume

注意，这里的“支持”是说，kubernetes可以将这些类型的存储挂载到容器中，而不是说它提供了这些存储系统。计算、存储、网络，是基础设施的三大块内容，kubernetes只做计算这块。

你可以把这些存储系统，比如说Ceph等，部署在kubernetes外部，或者部署在kubernetes中（这样是可以的，存储系统也是一堆运行的任务），对kubernetes来说没有什么区别，都是一个外部的服务。

不过存储系统是应该单独部署，还是和其它业务容器混部在kubernetes中，可一定要仔细想清楚了，要防止某个组件崩溃，导致一系列系统崩溃。更要小心，别出现你依赖我，我依赖你的死循环。

“网络”方面的内容有两个: 一个是基础网络是怎样的，也就是Pod之间的网络通信是怎样进行的，这个依靠[网络插件][5]实现；一个是部署在kubernetes中的任务怎样被访问到？这里的访问又
分为从kubernetes内部访问，和从kubernetes外部访问。

Kubernetes中用[Service](https://kubernetes.io/docs/concepts/services-networking/service/)描述要暴露的服务，而后借助[DNS](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/)
和[Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)等，实现了服务的内部暴露和外部暴露。

## 其它

Kubernetes发展至今，已经成了一个相当庞大、复杂的系统。我们上面介绍的都是最基本的内容，在这些内容之外，还有[kubernetes的功能拓展](https://kubernetes.io/docs/concepts/extend-kubernetes/extend-cluster/)，以及[联邦集群](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/01/k8s-class-kubernetes-intro.html#kubernetes%E9%9B%86%E7%BE%A4%E8%81%94%E9%82%A6)等内容。

围绕kubernetes发展的系统也有很多，除了多次提到的[网络插件][5]，在日志采集、监控告警方面，还有fluentd、filebeat、prometheus等等。

这些内容，以后择机介绍。

## 参考

1. [kubernetes1.12从零开始（三）：用minikube与kubeadm部署][1]
2. [kubernetes Concepts][2]
3. [kubernetes Components][3]
4. [The Chubby lock service for loosely-coupled distributed systems][4]
5. [Installing a pod network add-on][5]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/03/k8s-class-deploy.html "kubernetes1.12从零开始（三）：用minikube与kubeadm部署"
[2]: https://kubernetes.io/docs/concepts/ "kubernetes Concepts"
[3]: https://kubernetes.io/docs/concepts/overview/components/ "kubernetes Components"
[4]: https://static.googleusercontent.com/media/research.google.com/zh-CN//archive/chubby-osdi06.pdf "The Chubby lock service for loosely-coupled distributed systems"
[5]: https://kubernetes.io/docs/setup/independent/create-cluster-kubeadm/#pod-network "Installing a pod network add-on"

