---
layout: default
title:  "【视频】Kubernetes1.12从零开始（初）：课程介绍与官方文档汇总"
author: 李佶澳
createdate: 2018/09/03 20:43:00
changedate: 2018/11/11 18:14:32
categories: 项目
tags: 视频教程 kubernetes 
keywords: kubernetes,容器集群,docker
description: 先概要地了解一下kubernetes，这一篇主要讲解一下它的基本原理和文档的使用

---

* auto-gen TOC:
{:toc}

## 说明

**为什么会有这门课？**

大概从2014年6、7月份开始，Kubernetes开始被国内的一些互联网公司关注，并研究使用。
经过四年多的发展，Kubernetes已经奠定了在容器集群管理、PaaS平台等领域的主导地位，越来越多的公司都是在围绕Kubernetes打造自己的基础平台。
经过四年多的发展，关于Kubernetes的资料也非常丰富了，有很多非常好的教程，可以说现在是学习Kubernetes最好的时候，面对的痛苦要比几年前少太多太多。

美中不足的是，很多教程依旧是灌输式地讲述知识点，而没有传授方法。

IT技术的变化是非常快的，软件可能几个月发布一个变动比较大的版本，如果只是传授知识，而不讲述方法，那么今天掌握的知识很可能几个月后就过时了，到那时候遇到新情况，又会产生各种困惑，而且面对技术的飞速变化，始终没有参与感。

经过这几年对Kubernetes断断续续地学习使用，感觉自己可以做一点事情，更好地`帮人入门`。

从一开始就告诉初学者可以从哪里找到答案、从哪里获得最新资讯、从哪里找到最完整、最权威的定义。从一开始就接触最权威的资料，可以大大减少对互联网上各种二手资料的依赖，节省大量的时间。

本课程没有正式的讲义，使用的资料是本站的相关文章，这些文章都是我个人在学习、工作过程中随手记录的笔记，你可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到它们。

## 资料和交流方式

**相关文章**：[系列教程汇总](https://www.lijiaocn.com/tags/class.html)

本站上的[技术文章](https://www.lijiaocn.com/tags/all.html)都是我学习时记的笔记，其中一些整理汇总成了[系列教程](https://www.lijiaocn.com/tags/class.html)。

**演示视频**：[网易云课堂·IT技术快速入门学院 ](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)

制作视频需要准备环境和素材，录制讲解过程中往往要返工好多次，比较占用时间和精力，因此不是每一篇笔记都有视频演示（文档是一定有的，都是我自己在使用的笔记）。
视频力求精炼，附带一些不方便用文字记录的入门讲解，目标是成为比较好的辅助内容，帮助有困惑和疑问的朋友，打通关键环节。

**QQ群**：`947371129` (Kubernetes实践互助)

QQ群用于这门课程的学习者以及所有对Kubernetes感兴趣的人员的交流，注意不要灌水讨论无关话题和发广告。

**知识星球**：[我的网课](https://www.lijiaocn.com/img/xiaomiquan-class.jpeg)

知识星球是一个知识社区，有[网页版](https://wx.zsxq.com/dweb/)和[APP](https://www.zsxq.com/)，类似于早期的BBS，可以发帖提问。相比QQ群，星球主题集中并且留有记录，容易查找。可以通过[不贵、回报超高的，付费社区都有哪些?](https://www.lijiaocn.com/%E5%A5%BD%E8%B4%A7/2018/04/25/fu-fei-she-que.html)这篇文章了解知识星球。

知识星球早先创建的时候没搞清楚规则设置了一年的有效期，目前正在想办法解除，变更成永久有效，以防止球内人员失去联系。

**微信公众号**：`我的网课`（公众号二维码在网页右下角）

关注微信公众号后，会自动回复我的`个人微信`，欢迎加好友，最好备注一下来自于哪里。公众号更新很不频繁，偶尔有时间、有话题了，会写一篇两篇的，以经验总结为主。

**其它事项**

我不是专门做教程的，也不是职业讲师，平时要上班，会有意防止微信、QQ、企业微信等将大块的时间分割成小块，导致一天做不了多少事，因此很少能够及时回复。并且通过QQ、微信私下交流，花费同样的时间，只对你我两个人有效，沟通的价值没有最大化，这非常不好。因此建议尽量使用知识星球，

另外，正在给站点添加的`评论功能`，也是非常好的沟通方式，区别是知识星球我使用的比较频繁，回复地更及时一些，并且星球里所有的人都可以参与解答。

## Kubernetes的文档介绍

[kubectl-commands](https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands)是kubectl所有子命令的用法，有例子，非常好的文档。

[ https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/ ](https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.12/)是v1.12的API索引手册。

Kubernetes网站的域名是[kubernetes.io][1]，可以用短域名[k8s.io](https://k8s.io)直接访问。
Kubernetes的[官方文档][2]，应当是学习工作中最常使用的，其它所有的资料都是二手的，包括这篇文章。

能够使用官方文档，是开始掌握Kubernetes的第一步，因为只有这样才能独立解决问题，才能第一时间得知了解到Kubernetes的最新变化。Kubernetes的官方文档虽然完善了很多，但是对初学者还是不够友好，有必要专门介绍一下。

[Kubernetes Documentation][2]相比以前已经完善太多了，如果英文还可以，只学习它的文档应该是足够的。

[Kubernetes Documentation Home][3]页面中最有价值的部分是底部经过分类整理的页面链接。

Kubernetes的安装部署文档：[Kubernetes Setup][4]，包括[通过kubeadm][5]、[在aws上直接部署][6]、[在托管于云上的CoreOS上部署][7]、
[在CloudStack上部署][8]、[使用Salt部署][9]、[从零开始部署Kubernetes][12]，或者[通过Minikube在本地运行Kubernetes][15]。

大规模Kubernetes集群时需要注意的问题：[Building Large Clusters][10]。

跨可用区部署时需要注意的问题：[kubernetes Running in Multiple Zones][11]，[源代码编译][13]。

Kubernetes集群中证书的使用：[Kubernetes PKI Certificates and Requirements][14]。

集群节点Node的验证方法：[Validate Node Setup][16]。

Kubernetes的基本概念：[Kubernetes Concepts][17]，这是非常重要的文档，解释了Kubernetes使用的术语以及对应的使用方法，包括Kubernetes的系统架构介绍。

Kubernetes的常用操作：[Kubernetes Tasks][18]，比较有用，演示了很多操作，也建议通读一遍，对Kubernetes能做到的事情有所了解。 

Kubernetes的API手册和命令手册：[Kubernetes Reference][19]，包括一些使用技巧，譬如设置kubelet的命令提示：[Kubectl Cheat Sheet][20]。

Kubernetes官方提供的教学材料，[Tutorials][23]，适合初学者。

社区：[Contribute to Kubernetes docs][21]和[Community][22]介绍了怎样参与社区开发。

## Kubernetes中的术语与资源的操作方法

[Concepts][24]中罗列了Kubernetes中的所有术语，并介绍了这些术语对应的对象的使用方法。

[Kubernetes组件中](https://kubernetes.io/docs/concepts/overview/components/)介绍了几个主要组件：

	Master的组件：
	    kube-apiserver、etcd、kube-scheduler、kube-controller-manager、cloud-controller-manager、
	
	Node的组件：
	    kubelet、kube-proxy、Container Runtime
	
	可选插件：
	    DNS、Web UI、Container Resource Monitoring、Cluster-level Logging

### Kubernetes的API约定与启用方法

[The Kubernetes API](https://kubernetes.io/docs/concepts/overview/kubernetes-api/)

### Kubernetes中资源(Object)的定义

[Understanding Kubernetes Objects](https://kubernetes.io/docs/concepts/overview/working-with-objects/kubernetes-objects/)中介绍了Kubernetes的设计原则：

	Object的定义是`声明式`的，spec中记录的是期待达成状态，status中记录的是当前状态。

>延伸：到哪找到每类Object的完整定义？Object的定义代码在哪里？

[Namespaces](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/):

	nodes and persistentVolumes, are not in any namespace.

[Labels and Selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/labels/):

	松耦合设计
	
	We don’t want to pollute labels with non-identifying, 
	especially large and/or structured, data. Non-identifying information should be recorded using annotations.
	
	Equality-based requirement:  Three kinds of operators are admitted =,==,!=
	Set-based requirement:       Three kinds of operators are supported: in,notin and exists (only the key identifier)
	
	Similarly the comma separator acts as an AND operator:  partition,environment notin (qa)
	
	Set-based requirements can be mixed with equality-based requirements:  partition in (customerA, customerB),environment!=qa
	
	kubectl get pods -l 'environment in (production, qa)'
	
	Service and ReplicationController:  equality-based requirement selectors are supported
	
	Newer resources, such as Job, Deployment, Replica Set, and Daemon Set, support set-based requirements as well.

[Annotations](https://kubernetes.io/docs/concepts/overview/working-with-objects/annotations/):

	Annotations are not used to identify and select objects. 
	The metadata in an annotation can be small or large, structured or unstructured, and can include characters not permitted by labels.

[Field Selectors](https://kubernetes.io/docs/concepts/overview/working-with-objects/field-selectors/):

	Supported operators: =, ==, and !=
	field selectors can be chained together as a comma-separated list
	
	use field selectors across multiple resource types:
	    kubectl get statefulsets,services --field-selector metadata.namespace!=default

[Recommended Labels](https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/):

	这只是建议使用的labels
	
	apiVersion: apps/v1
	kind: StatefulSet
	metadata:
	  labels:
	    app.kubernetes.io/name: mysql
	    app.kubernetes.io/instance: wordpress-abcxzy
	    app.kubernetes.io/version: "5.7.21"
	    app.kubernetes.io/component: database
	    app.kubernetes.io/part-of: wordpress
	    app.kubernetes.io/managed-by: helm

### kubectl命令

[kubectl管理命令](https://kubernetes.io/docs/concepts/overview/object-management-kubectl/overview/)



## Kubernetes集群部署与各个组件的功能和参数详解

TODO

## Kubernetes官网上的Task

[Kubernetes Tasks][18]中给出了很多的操作示例，涵盖了Kubernetes的绝大多数特性。

### Pod和Container操作

[Pod的内存设置](https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/)

[Pod的CPU设置](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)

[Pod的QOS策略](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)

	Guaranteed:  request == limit，            Pod分配的资源是固定受限的
	Burstable:   request <  limit(包括未设置)  Pod分配的资源在request~limit之间变动
	BestEffort:  request和limit均未设置        Pod的资源不受限也没有最低保证     

[为Node声明扩展资源](https://kubernetes.io/docs/tasks/administer-cluster/extended-resource-node/)

	扩展资源是CPU、Memory、磁盘等通用资源之外的、Kubernetes感知不到的资源，例如Node上的特殊硬件。

[为Pod分配扩展资源](https://kubernetes.io/docs/tasks/configure-pod-container/extended-resource/)

[为Pod设置Volume(存储卷)](https://kubernetes.io/docs/tasks/configure-pod-container/configure-volume-storage/)

[PV、PVC的创建，以及为Pod设置PVC(持久存储卷)](https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/)

[为Pod设置Projected Volume](https://kubernetes.io/docs/tasks/configure-pod-container/configure-projected-volume-storage/)

	Projected Volume可以将secret、configMap、serviceAccountToken、downwardAPI几种不同类型的Source挂载到同一个目录中。

[为Pod设置Security Context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)

	Security Context定义了Pod和Container的操作权限和访问控制。

[为Pod设置Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)

	Service Account被挂载到Pod中，Pod中的进程可以用Service Account来通过其它服务的认证。

[为Pod配置私有镜像仓库的访问凭证](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)

	将私有镜像仓库的账号和密码保存成Kubernetes中的secret，然后在Pod的声明中指定要使用的secret。

[为Pod配置存活监听(liveness)和就绪监听(readiness)](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)

	liveness probes用来判定Container是否需要被重启
	readiness probes 用来判定Container是否可以开始接收请求

[将Pod调度到特定范围内的Node](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/)

[为Pod设置Init Container](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-initialization/)

	Init Container在Pod中的业务容器启动之前*完成运行*，可以用来为业务容器准备运行环境。

[在Pod的生命周期中设置钩子(handler)](https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/)

	postStart：容器启动后执行的命令，与容器中的entrypoint异步执行
	preStop：  容器停止前执行的命令，容器需要等到preStop指定的命令运行结束后才能终止，除非等待时间超过了grace period

[为Pod设置ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)

	容器的环境变量的值可以从ConfigMap中读取，ConfigMap也可以被以volumn的形式挂载到容器中

[Pod中多个容器进程空间的共享，以及访问其它容器中文件的方法](https://kubernetes.io/docs/tasks/configure-pod-container/share-process-namespace/)

	Kubernetes v1.11 alpha特性。

[将Docker Compose文件转换Kubernetes file](https://kubernetes.io/docs/tasks/configure-pod-container/translate-compose-kubernetes/)

	一个名为Kompose的工具。

### 集群管理员操作

[将Cluster切分成多个namespace提供给用户](https://kubernetes.io/docs/tasks/administer-cluster/namespaces/)

[Namespace介绍](https://kubernetes.io/docs/tasks/administer-cluster/namespaces-walkthrough/)

[在namespace中为容器设置默认内存配额](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/memory-default-namespace/)

[在namespace中为容器设置默认CPU配额](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/cpu-default-namespace/)

[在namespace中设置单个容器内存配额的上限和下限](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/memory-constraint-namespace/)

[在namespace中设置单个容器CPU配额上限和下限](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/cpu-constraint-namespace/)

[设置namespace的内存和CPU配额](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/quota-memory-cpu-namespace/)

[设置namespace的Pod配额](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/quota-pod-namespace/)

[设置namespace的PVC和Service配额](https://kubernetes.io/docs/tasks/administer-cluster/quota-api-object/)、

[设置namespaces中单个PVC存储空间配额上限和下限、设置Namespace的存储空间配额](https://kubernetes.io/docs/tasks/administer-cluster/limit-storage-consumption/)

[为Node设置扩展资源](https://kubernetes.io/docs/tasks/administer-cluster/extended-resource-node/)

[PV的回收策略](https://kubernetes.io/docs/tasks/administer-cluster/change-pv-reclaim-policy/)

	Retain   :  用户删除PVC时，动态分配的PV保留，标记为released，不能被其它的PVC使用 
	Delete   :  用户删除PVC时，动态分配的PV一同删除
	Recycle  :  (deprecated)用户删除PVC时，对应PV中的数据被删除，PV可以再次用于其它PVC。

[保护正在被使用的PVC和PV：完全释放后才能删除](https://kubernetes.io/docs/tasks/administer-cluster/storage-object-in-use-protection/)

[设置默认的Storage Class](https://kubernetes.io/docs/tasks/administer-cluster/change-default-storage-class/)

[Storage Class的使用](https://kubernetes.io/docs/concepts/storage/storage-classes/)

[Node资源不足时，Kubelet驱逐Pod的策略](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/)

[启动多个调度器，为Pod分配指定的调度器](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers/)

[设置Node的CPU分配策略：支持CPU独占](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/)

[NetworkPolicy的使用](https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/)

[Kubelet直接引导启动的static pod](https://kubernetes.io/docs/tasks/administer-cluster/static-pod/)

[保证关键Pod的运行](https://kubernetes.io/docs/tasks/administer-cluster/guaranteed-scheduling-critical-addon-pods/)

[在Node上为宿主机进程保留资源](https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources/)

[在Pod中设置内核参数](https://kubernetes.io/docs/tasks/administer-cluster/sysctl-cluster/)

[Master的高可用设置](https://kubernetes.io/docs/tasks/administer-cluster/highly-available-master/)

[安全地从集群中移除Node](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/)

[Kubernetes集群的安全防护](https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/)

[Kubernetes集群的DNS服务配置](https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/)

[使用CoreDNS做服务发现](https://kubernetes.io/docs/tasks/administer-cluster/coredns/)

[敏感数据的加密存放](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)

[设置NAT转换，隐藏Pod的IP地址](https://kubernetes.io/docs/tasks/administer-cluster/ip-masq-agent/)

[Kubelet从文件中加载参数](https://kubernetes.io/docs/tasks/administer-cluster/kubelet-config-file/)

[Kubelet配置参数的热更新](https://kubernetes.io/docs/tasks/administer-cluster/reconfigure-kubelet/)





[访问cluster api的几种方法](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/)

[访问cluster中的服务的几种方法](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-services/)




[Cluster生命周期管理：维护、升级等](https://kubernetes.io/docs/tasks/administer-cluster/cluster-management/)







[DNS调试方法](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/)


[正在开发中的Cloud Controller Manager](https://kubernetes.io/docs/tasks/administer-cluster/developing-cloud-controller-manager/)

[Etcd集群的管理](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)

[使用KMS管理用于数据加密的密钥](https://kubernetes.io/docs/tasks/administer-cluster/kms-provider/)


### 数据注入应用的方法

[通过容器的命令行参数注入](https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/)

[通过环境变量注入](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)

[将Pod和Container的信息通过环境变量注入](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/)

[将Pod和Container的信息通过文件注入](https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/)

[将Secret注入到容器中](https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/)

[用ProdPreset在Pod创建时注入](https://kubernetes.io/docs/tasks/inject-data-application/podpreset/)

### 部署应用

[用Deployment部署无状态应用](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/)

[应用PVC，部署单个有状态应用](https://kubernetes.io/docs/tasks/run-application/run-single-instance-stateful-application/)

[使用StatefulSet部署多副本的有状态应用](https://kubernetes.io/docs/tasks/run-application/run-replicated-stateful-application/)

[StatefulSet的扩张](https://kubernetes.io/docs/tasks/run-application/scale-stateful-set/)

[StatefulSet删除时应当注意的事项](https://kubernetes.io/docs/tasks/run-application/delete-stateful-set/)

[用Kubectl Patch更新](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/)

[滚动升级](https://kubernetes.io/docs/tasks/run-application/rolling-update-replication-controller/)

[Pod自动水平扩展](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

[Pod自动水平扩展示例](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)

[使用PodDisruptionBudget防止Pod数量过低](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)

### 部署任务

[定时任务CronJob](https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/)

[并行运行的Job](https://kubernetes.io/docs/tasks/job/parallel-processing-expansion/)

[通过消息队列为多个并行运行Job分配不同的任务](https://kubernetes.io/docs/tasks/job/coarse-parallel-processing-work-queue/)

[通过Redis队列为多个并行运行Job分配不通的任务](https://kubernetes.io/docs/tasks/job/fine-parallel-processing-work-queue/)

### 访问集群和集群内的应用

[集群Dashboard](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/)

[集群的访问方式配置](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster/)

[同时配置多个集群的访问方式](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/#set-the-kubeconfig-environment-variable)

[用端口转发的方式从本地访问集群中的应用](https://kubernetes.io/docs/tasks/access-application-cluster/port-forward-access-application-cluster/)

[为集群内的应用创建Service，通过Service访问应用](https://kubernetes.io/docs/tasks/access-application-cluster/load-balance-access-application-cluster/)

[应用之间通过Service地址访问彼此](https://kubernetes.io/docs/tasks/access-application-cluster/connecting-frontend-backend/)

[创建外部负载均衡器](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/)

[LoadBalancer对接防火墙](https://kubernetes.io/docs/tasks/access-application-cluster/configure-cloud-provider-firewall/)

[几个查看集群内容器的技巧](https://kubernetes.io/docs/tasks/access-application-cluster/configure-cloud-provider-firewall/)

[同一个Pod中的容器通过存储卷通信](https://kubernetes.io/docs/tasks/access-application-cluster/communicate-containers-same-pod-shared-volume/)

[为集群配置DNS服务](https://kubernetes.io/docs/tasks/access-application-cluster/configure-dns-cluster/)

### 监控、日志、调试

[用describe命令查看详情](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-application-introspection/)

[操作审计](https://kubernetes.io/docs/tasks/debug-application-cluster/audit/)

[Metric Server](https://kubernetes.io/docs/tasks/debug-application-cluster/core-metrics-pipeline/)

	Starting from Kubernetes 1.8, resource usage metrics, such as container CPU and memory usage, are available in Kubernetes through the Metrics API.
	These metrics can be either accessed directly by user, for example by using kubectl top command, or used by a controller in the cluster, e.g. Horizontal Pod Autoscaler, to make decisions.
	

[Service调试](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-service/)

[使用crictl调试Kubernetes node](https://kubernetes.io/docs/tasks/debug-application-cluster/crictl/)

[Pod调试](https://kubernetes.io/docs/tasks/debug-application-cluster/determine-reason-pod-failure/)

[登陆容器](https://kubernetes.io/docs/tasks/debug-application-cluster/get-shell-running-container/)

[使用ELK采集日志](https://kubernetes.io/docs/tasks/debug-application-cluster/logging-elasticsearch-kibana/)

[部署日志采集Agent](https://kubernetes.io/docs/tasks/debug-application-cluster/logging-stackdriver/)

[node状态检查](https://kubernetes.io/docs/tasks/debug-application-cluster/monitor-node-health/)

[常用的监控工具](https://kubernetes.io/docs/tasks/debug-application-cluster/resource-usage-monitoring/)

[应用故障排查方法](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-application/)

[集群故障排查方法](https://kubernetes.io/docs/tasks/debug-application-cluster/debug-cluster/)

### Kubernetes集群扩展

[添加自定义的资源](https://kubernetes.io/docs/tasks/access-kubernetes-api/custom-resources/custom-resource-definitions/)

[aggregation layer配置](https://kubernetes.io/docs/tasks/access-kubernetes-api/configure-aggregation-layer/)和[apiserver扩展](https://kubernetes.io/docs/tasks/access-kubernetes-api/setup-extension-api-server/)

### TLS证书

[证书轮替](https://kubernetes.io/docs/tasks/tls/certificate-rotation/)

[集群使用的证书管理](https://kubernetes.io/docs/tasks/tls/managing-tls-in-a-cluster/)

### Kubernetes集群联邦

[跨集群服务发现](https://kubernetes.io/docs/tasks/federation/federation-service-discovery/)

[设置集群联邦](https://kubernetes.io/docs/tasks/federation/set-up-cluster-federation-kubefed/)

[CoreDNS作为联邦集群的DNS服务](https://kubernetes.io/docs/tasks/federation/set-up-coredns-provider-federation/)

[联邦集群的放置策略](https://kubernetes.io/docs/tasks/federation/set-up-placement-policies-federation/)

[联邦集群的系列操作](https://kubernetes.io/docs/tasks/administer-federation/cluster/)

### DaemonSet管理

[DaemonSet回滚](https://kubernetes.io/docs/tasks/manage-daemon/rollback-daemon-set/)

[Daemonset更新](https://kubernetes.io/docs/tasks/manage-daemon/update-daemon-set/)

### 添加外部服务目录Catalog

[用Helm安装服务目录](https://kubernetes.io/docs/tasks/service-catalog/install-service-catalog-using-helm/)

[用sc安装服务目录](https://kubernetes.io/docs/tasks/service-catalog/install-service-catalog-using-sc/)

### 其它

[hugepage的管理使用](https://kubernetes.io/docs/tasks/manage-hugepages/scheduling-hugepages/)

[gpu](https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/)

## 关于TLS证书文档

[PKI Certificates and Requirements](https://kubernetes.io/docs/setup/certificates/)

[Certificates](https://kubernetes.io/docs/concepts/cluster-administration/certificates/)

[Manage TLS Certificates in a Cluster](https://kubernetes.io/docs/tasks/tls/managing-tls-in-a-cluster/)

[Kubelet通过bootstrap申请证书：TLS bootstrapping](https://kubernetes.io/docs/reference/command-line-tools-reference/kubelet-tls-bootstrapping/)

[Kubelet的证书轮转更替：Certificate Rotation](https://kubernetes.io/docs/tasks/tls/certificate-rotation/)

[Authenticating with Bootstrap Tokens](https://kubernetes.io/docs/reference/access-authn-authz/bootstrap-tokens/)

## 参考

1. [Kubernetes website][1]
2. [Kubernetes documentation][2]
3. [Kubernetes documentation home][3]
4. [Kubernetes Setup][4]
5. [Deploy Kubernetes by kubeadm][5]
6. [Deploy Kubernetes on aws][6]
7. [Deploy Kubernetes on CoreOS on AWS or GCE][7]
8. [Deploy Kubernetes on CloudStack][8]
9. [Deploy Kubernetes by salt][9]
10. [Kubernetes Building Large Clusters][10]
11. [Kubernetes Running in Multiple Zones][11]
12. [Deploy Kubernetes from Scratch][12]
13. [Kubernetes Building][13]
14. [Kubernetes PKI Certificates and Requirements][14]
15. [Running Kubernetes Locally via Minikube][15]
16. [Validate Node Setup][16]
17. [Kubernetes Concepts][17]
18. [Kubernetes Tasks][18]
19. [Kubernetes Reference][19]
20. [Kubectl Cheat Sheet][20]
21. [Contribute to Kubernetes docs][21]
22. [Community][22]
23. [Tutorials][23]
24. [Concepts][24]

[1]: https://kubernetes.io/  "kubernetes website" 
[2]: https://kubernetes.io/docs/home/?path=users&persona=app-developer&level=foundational "kubernetes Documentation" 
[3]: https://kubernetes.io/docs/home/?path=users&persona=app-developer&level=foundational "kubernetes Documentation Home"
[4]: https://kubernetes.io/docs/setup/ "Kubernetes Setup"
[5]: https://kubernetes.io/docs/setup/independent/ "deploy kubernetes by kubeadm"
[6]: https://kubernetes.io/docs/setup/turnkey/ "deploy kubernetes on aws" 
[7]: https://kubernetes.io/docs/setup/custom-cloud/ "deploy kubernetes on CoreOS on AWS or GCE"
[8]: https://kubernetes.io/docs/setup/on-premises-vm/ "deploy kubernetes on CloudStack"
[9]: https://kubernetes.io/docs/setup/salt/ "deploy kubernetes by salt"
[10]: https://kubernetes.io/docs/setup/cluster-large/ "kubernetes Building Large Clusters"
[11]: https://kubernetes.io/docs/setup/multiple-zones/ "kubernetes Running in Multiple Zones"
[12]: https://kubernetes.io/docs/setup/scratch/ "Deploy Kubernetes from Scratch"
[13]: https://kubernetes.io/docs/setup/building-from-source/ "Kubernetes Building"
[14]: https://kubernetes.io/docs/setup/certificates/ "Kubernetes PKI Certificates and Requirements"
[15]: https://kubernetes.io/docs/setup/minikube/ "Running Kubernetes Locally via Minikube"
[16]: https://kubernetes.io/docs/setup/node-conformance/ "Validate Node Setup"
[17]: https://kubernetes.io/docs/concepts/ "Kubernetes Concepts"
[18]: https://kubernetes.io/docs/tasks/ "Kubernetes Tasks"
[19]: https://kubernetes.io/docs/reference/ "Kubernetes Reference"
[20]: https://kubernetes.io/docs/reference/kubectl/cheatsheet/ "Kubectl Cheat Sheet"
[21]: https://kubernetes.io/docs/contribute/ "Contribute to Kubernetes docs"
[22]: https://kubernetes.io/docs/community/ "Community"
[23]: https://kubernetes.io/docs/tutorials/ "Tutorials"
[24]: https://kubernetes.io/docs/concepts/ "Concepts"
