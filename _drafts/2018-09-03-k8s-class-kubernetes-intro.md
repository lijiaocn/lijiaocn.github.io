---
layout: default
title:  "Kubernetes容器集群从零讲解：正篇"
author: 李佶澳
createdate: 2018/09/03 20:43:00
changedate: 2018/09/04 17:24:51
categories: 项目
tags: kubernetes
keywords: kubernetes,容器集群,docker
description: 先概要地了解一下kubernetes，这一篇主要讲解一下它的基本原理和文档的使用

---

* auto-gen TOC:
{:toc}

## 说明

Kubernetes网站的域名是[kubernetes.io][1]，可以用短域名[k8s.io](https://k8s.io)直接访问。

强调！Kubernetes的[官方文档][2]，应当是学习工作中最常使用的。其它所有的资料都是二手的，包括这篇文章。

能够使用官方文档，是真正掌握Kubernetes的第一步，因为只有这样，才能在独立解决问题的时候找到思路，才能从正规渠道了解到Kubernetes的最新变化。

不过Kubernetes的官方文档虽然完善了很多，但是对初学者还是不够友好，而这正是这篇文章存在的理由：释疑解惑，帮人入门。

## Kubernetes的文档介绍

[Kubernetes Documentation][2]相比以前已经完善太多了，如果英文还可以，只学习它的文档就足够了。
这篇文章以及配套视频的目的是缩短自行摸索学习的时间，最终是要促使你主动地从正确的渠道猎取信息、自发自驱的深入研究。

文档首页[Kubernetes Documentation Home][3]最有价值的部分是页面底部，经过分类整理的页面链接：

[Kubernetes Setup][4]是Kubernetes的安装部署文档，给出多种部署Kubernetes的方法，例如通过[kubeadm][5]、[在aws上直接部署][6]、[基于云上的CoreOS部署][7]、
[在CloudStack上部署][8]、[使用Salt部署][9]、以及[从零开始部署Kubernetes][12]，或者[通过Minikube在本地运行Kubernetes][15]。

此外还有部署大规模Kubernetes集群时需要注意的问题：[Building Large Clusters][10]，跨可用区部署时需要注意的问题：[kubernetes Running in Multiple Zones][11]，[源代码编译][13]

[Kubernetes PKI Certificates and Requirements][14]中介绍了Kubernetes集群中使用到证书的地方，[Validate Node Setup][16]中提供了验证node设置的方法。

[Kubernetes Concepts][17]是非常重要的文档，这里解释了Kubernetes使用的所有名词，以及对应的使用方法，还有Kubernetes的系统架构等内容，建议全部阅读一遍！
把这里的文档吃透，基本就可以成为Kubernetes的使用专家了。

[Kubernetes Tasks][18]汇总了常用的Kubernetes操作，非常有用，也建议通读一遍，这样以后要满足某些需求的时候，就不用漫山遍野地搜索了。

[Kubernetes Reference][19]是Kubernetes的API手册和命令手册，这里有不少小技巧，譬如设置kubelet的命令提示：[Kubectl Cheat Sheet][20]。

[Tutorials][23]是Kubernetes官方提供的教学材料，适合初学者。

[Contribute to Kubernetes docs][21]和[Community][22]介绍了怎样参与社区开发，可以根据自己的需要阅读。

## Kubernetes演示集群与各个组件的功能和参数详解

TODO

## Kubernetes官网上的Task

[Kubernetes Tasks][18]中给出了很多的操作示例，涵盖了Kubernetes的绝大多数特性。

### Pod和容器操作

[Pod的内存资源设置](https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/)

[Pod的CPU资源设置](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)

[Pod被分配的QOS策略](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)

[为Node设置扩展资源](https://kubernetes.io/docs/tasks/administer-cluster/extended-resource-node/)和[为Pod分配扩展资源](https://kubernetes.io/docs/tasks/configure-pod-container/extended-resource/)

[为Pod设置Volume(存储卷)](https://kubernetes.io/docs/tasks/configure-pod-container/configure-volume-storage/)

[PV、PVC的创建，以及为Pod设置PVC(持久存储卷)](https://kubernetes.io/docs/tasks/configure-pod-container/configure-persistent-volume-storage/)

[为Pod设置Projected Volume](https://kubernetes.io/docs/tasks/configure-pod-container/configure-projected-volume-storage/)

[为Pod设置Security Context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/)

[为Pod设置Service Account](https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/)

[Pod使用私有镜像仓库中的镜像](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)

[为Pod配置存活监测和就绪监测](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-probes/)

[将Pod绑定到指定的Node](https://kubernetes.io/docs/tasks/configure-pod-container/assign-pods-nodes/)

[为Pod设置Init Container](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-initialization/)

[在Pod的生命周期中设置钩子(handler)](https://kubernetes.io/docs/tasks/configure-pod-container/attach-handler-lifecycle-event/)

[为Pod设置ConfigMap](https://kubernetes.io/docs/tasks/configure-pod-container/configure-pod-configmap/)

[Pod的多个容器共享进程空间，以及访问其它容器中的文件](https://kubernetes.io/docs/tasks/configure-pod-container/share-process-namespace/)

[将Docker Compose文件转换kuberntes file](https://kubernetes.io/docs/tasks/configure-pod-container/translate-compose-kubernetes/)

### 集群管理员操作

[在namespace中设置容器默认的内存用量](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/memory-default-namespace/)

[在namespace中设置容器默认的CPU用量](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/cpu-default-namespace/)

[在namespace中设置容器内存使用量的上限和下限](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/memory-constraint-namespace/)

[在namespace中设置容器CPU使用量的上限和下限](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/cpu-constraint-namespace/)

[设置一个namespace可以使用的内存和CPU总量](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/quota-memory-cpu-namespace/)

[设置一个namespace可以创建的Pod的总数](https://kubernetes.io/docs/tasks/administer-cluster/manage-resources/quota-pod-namespace/)

[访问cluster api的几种方法](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-api/)

[访问cluster中的服务的几种方法](https://kubernetes.io/docs/tasks/administer-cluster/access-cluster-services/)

[为Node设置扩展资源](https://kubernetes.io/docs/tasks/administer-cluster/extended-resource-node/)

[设置PV的回收策略](https://kubernetes.io/docs/tasks/administer-cluster/change-pv-reclaim-policy/)

[修改默认的Storage Class](https://kubernetes.io/docs/tasks/administer-cluster/change-default-storage-class/)

[Cluster生命周期管理：维护、升级等](https://kubernetes.io/docs/tasks/administer-cluster/cluster-management/)

[配置多个调度器](https://kubernetes.io/docs/tasks/administer-cluster/configure-multiple-schedulers/)

[Pod资源耗尽时的处理策略](https://kubernetes.io/docs/tasks/administer-cluster/out-of-resource/)

[设置一个namespace可以使用的资源总量](https://kubernetes.io/docs/tasks/administer-cluster/quota-api-object/)、
[设一个namespace可以使用的存储空间](https://kubernetes.io/docs/tasks/administer-cluster/limit-storage-consumption/)

[修改CPU管理、分配策略：配置Pod独占CPU](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/)

[定制集群的DNS服务](https://kubernetes.io/docs/tasks/administer-cluster/dns-custom-nameservers/)

[DNS调试方法](https://kubernetes.io/docs/tasks/administer-cluster/dns-debugging-resolution/)

[NetworkPolicy的使用](https://kubernetes.io/docs/tasks/administer-cluster/declare-network-policy/)

[正在开发中的Cloud Controller Manager](https://kubernetes.io/docs/tasks/administer-cluster/developing-cloud-controller-manager/)

[数据加密存放](https://kubernetes.io/docs/tasks/administer-cluster/encrypt-data/)

[关键Pod的调度保证](https://kubernetes.io/docs/tasks/administer-cluster/guaranteed-scheduling-critical-addon-pods/)

[Pod地址隐藏](https://kubernetes.io/docs/tasks/administer-cluster/ip-masq-agent/)

[namespace介绍](https://kubernetes.io/docs/tasks/administer-cluster/namespaces-walkthrough/)

[Etcd集群的管理](https://kubernetes.io/docs/tasks/administer-cluster/configure-upgrade-etcd/)

[更改正在运行中的kubelet的配置](https://kubernetes.io/docs/tasks/administer-cluster/reconfigure-kubelet/)

[为系统守护进程保留计算资源](https://kubernetes.io/docs/tasks/administer-cluster/reserve-compute-resources/)

[安全地摘除节点](https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/)

[集群通信过程加密](https://kubernetes.io/docs/tasks/administer-cluster/securing-a-cluster/)

[通过配置文件设置kubelet的运行参数](https://kubernetes.io/docs/tasks/administer-cluster/kubelet-config-file/)

[Master的高可用设置](https://kubernetes.io/docs/tasks/administer-cluster/highly-available-master/)

[Namespace的使用](https://kubernetes.io/docs/tasks/administer-cluster/namespaces/)

[直接由kubelet管理的static pod](https://kubernetes.io/docs/tasks/administer-cluster/static-pod/)

[pv删除保护：在被占用时，不执行删除](https://kubernetes.io/docs/tasks/administer-cluster/storage-object-in-use-protection/)

[使用CoreDNS做服务发现](https://kubernetes.io/docs/tasks/administer-cluster/coredns/)

[使用KMS管理用于数据加密的密钥](https://kubernetes.io/docs/tasks/administer-cluster/kms-provider/)

[设置Pod中的内核参数](https://kubernetes.io/docs/tasks/administer-cluster/sysctl-cluster/)

### 数据注入应用的方法

[通过容器的命令行参数注入](https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/)

[通过环境变量注入](https://kubernetes.io/docs/tasks/inject-data-application/define-environment-variable-container/)

[将Pod和Container的信息通过环境变量注入](https://kubernetes.io/docs/tasks/inject-data-application/environment-variable-expose-pod-information/)

[将Pod和Container的信息通过文件注入](https://kubernetes.io/docs/tasks/inject-data-application/downward-api-volume-expose-pod-information/)

[注入保存在Secret中的敏感数据](https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/)

[用ProdPreset在Pod创建时注入](https://kubernetes.io/docs/tasks/inject-data-application/podpreset/)

### 部署应用

[使用Deployment部署无状态应用](https://kubernetes.io/docs/tasks/run-application/run-stateless-application-deployment/)

[部署单个有状态应用](https://kubernetes.io/docs/tasks/run-application/run-single-instance-stateful-application/)

[使用StatefulSet部署有状态应用](https://kubernetes.io/docs/tasks/run-application/run-replicated-stateful-applicatio)、[StatefulSet的扩张](https://kubernetes.io/docs/tasks/run-application/scale-stateful-set/)、[StatefulSet的删除](https://kubernetes.io/docs/tasks/run-application/delete-stateful-set/)

[kubectl patch的使用](https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/)

[滚动升级](https://kubernetes.io/docs/tasks/run-application/rolling-update-replication-controller/)

[Pod自动水平扩展](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)、[Pod自动水平扩展示例](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale-walkthrough/)

[使用PodDisruptionBudget防止Pod数量过低](https://kubernetes.io/docs/tasks/run-application/configure-pdb/)

### 部署任务

[部署定时任务CronJob](https://kubernetes.io/docs/tasks/job/automated-tasks-with-cron-jobs/)

[多个Job的并行运行](https://kubernetes.io/docs/tasks/job/parallel-processing-expansion/)

[通过消息队列为多个并行运行Job分配不同的任务](https://kubernetes.io/docs/tasks/job/coarse-parallel-processing-work-queue/)

[通过Redis队列为多个并行运行Job分配不通的任务](https://kubernetes.io/docs/tasks/job/fine-parallel-processing-work-queue/)

### 访问集群和集群内的应用

[集群Dashboard](https://kubernetes.io/docs/tasks/access-application-cluster/web-ui-dashboard/)

[集群的访问方式配置](https://kubernetes.io/docs/tasks/access-application-cluster/access-cluster/)

[多个集群的访问方式集中配置](https://kubernetes.io/docs/tasks/access-application-cluster/configure-access-multiple-clusters/#set-the-kubeconfig-environment-variable)

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
