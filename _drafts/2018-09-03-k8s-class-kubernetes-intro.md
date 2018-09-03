---
layout: default
title:  "Kubernetes容器集群从零讲解：正篇"
author: 李佶澳
createdate: 2018/09/03 10:43:00
changedate: 2018/09/03 19:05:52
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

## 完成Kubernetes官网上的Task，掌握使用细节

[Kubernetes Tasks][18]中给出了很多的操作示例，涵盖了Kubernetes的绝大多数特性。

[Pod的内存资源设置](https://kubernetes.io/docs/tasks/configure-pod-container/assign-memory-resource/)

[Pod的CPU资源设置](https://kubernetes.io/docs/tasks/configure-pod-container/assign-cpu-resource/)

[Pod被分配的QOS策略](https://kubernetes.io/docs/tasks/configure-pod-container/quality-service-pod/)

[为Node设置扩展资源数量](https://kubernetes.io/docs/tasks/administer-cluster/extended-resource-node/)和[为Pod分配扩展资源](https://kubernetes.io/docs/tasks/configure-pod-container/extended-resource/)

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
