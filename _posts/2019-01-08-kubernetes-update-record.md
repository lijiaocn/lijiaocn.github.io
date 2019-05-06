---
layout: default
title: "Kubernetes版本特性：新特性支持版本和组件兼容版本"
author: 李佶澳
createdate: "2019-01-08 16:00:22 +0800"
changedate: "2019-05-06 16:42:32 +0800"
categories: 项目
tags:  kubernetes
keywords: kubernetes
description: "Kubernetes每个版本特性，关注新特性的支持版本和主要组件兼容版本，主要收集文档连接"
---

* auto-gen TOC:
{:toc}

## 说明

Kubernetes每个版本特性，关注新特性的支持版本和主要组件兼容版本，主要收集文档连接，根据工作情况随时更新。

## Release工作计划

[Sig-Release](https://github.com/kubernetes/sig-release/tree/master/releases)中有每次发布的文件目录，提供了每个Release计划的Google Doc文档地址。

最近一些Release计划的任务列表，Google Doc文档，国内不能直接访问，要翻：

[Kubernetes Enhancements Tracking - 1.13 Release](https://docs.google.com/spreadsheets/d/1_nPzArx7ptlrNfwQpLGUoTYLQ9XULnMAJbT8UBuPlYs/edit#gid=0)

[Kubernetes Features Tracking - 1.12 Release](https://docs.google.com/spreadsheets/d/177LIKnO3yUmE0ryIg9OBek54Y-abw8OE8pq-9QgnGM4/edit#gid=0)

[Kubernetes Features OSS tracking board (1.11 release)](https://docs.google.com/spreadsheets/d/16N9KSlxWwxUA2gV6jvuW9N8tPRHzNhu1-RYY4Y0RZLs/edit#gid=0)

[Kubernetes Features OSS tracking board (1.10 release)](https://docs.google.com/spreadsheets/d/17bZrKTk8dOx5nomLrD1-93uBfajK5JS-v1o-nCLJmzE/edit#gid=0)

[Kubernetes Features OSS tracking board (1.9 release)](https://docs.google.com/spreadsheets/d/1WmMJmqLvfIP8ERqgLtkKuE_Q2sVxX8ZrEcNxlVIJnNc/edit#gid=0)

[Kubernetes Features OSS tracking board (1.8 release)](https://docs.google.com/spreadsheets/d/1AFksRDgAt6BGA3OjRNIiO3IyKmA-GU7CXaxbihy48ns/edit#gid=0)


```
                             1.11.x       1.12.x       1.13.x     1.14.x    
--------------------------------------------------------------------------
Docker                     >=1.11.x     >=1.11.x    >=1.11.x     >=1.11.x
IPVS                          GA
CoreDNS                       GA                     default
TLSBootStrap                              GA
垂直扩容                                 Beta
CSI（存储插件）                                        GA
KubeAdm                                                GA
drop support for etcd2                                 GA
Kubelet Device Plugin                                  GA
```

[Kubernetes Feature Gates](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/#overview)收录的更全面，
并且有对[Feature Gates](https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/#feature-gates)的说明。

## 组件兼容性考虑

>The minimum required Docker version will vary as the kubelet version changes. 
>The newest stable release is a good choice. 
>Kubelet will log a warning and refuse to start pods if the version is too old, so pick a version and try it.

	Kubelet    DockerAPI   Docker
	-------------------------------
	1.8.15     >=1.22.0   >=1.10.x
	1.9.11     >=1.22.0   >=1.10.x
	1.10.12    >=1.23.0   >=1.11.x
	1.11.6     >=1.23.0   >=1.11.x
	1.12.4     >=1.23.0   >=1.11.x
	1.13.1     >=1.23.0   >=1.11.x

## 参考

1. [kubenetes setup: docker][1]
2. [kubelet: MinimumDockerAPIVersion][2]
3. [Kubernetes 1.11: In-Cluster Load Balancing and CoreDNS Plugin Graduate to General Availability][3]
4. [Kubernetes 1.12: Kubelet TLS Bootstrap and Azure Virtual Machine Scale Sets (VMSS) Move to General Availability][4]
5. [Kubernetes 1.13: Simplified Cluster Management with Kubeadm, Container Storage Interface (CSI), and CoreDNS as Default DNS are Now Generally Available][5]

[1]: https://kubernetes.io/docs/setup/scratch/#docker "kubenetes setup: docker"
[2]: https://github.com/kubernetes/kubernetes/blob/master/pkg/kubelet/dockershim/libdocker/client.go "Kubernetes: MinimumDockerAPIVersion"
[3]: https://kubernetes.io/blog/2018/06/27/kubernetes-1.11-release-announcement/ "Kubernetes 1.11: In-Cluster Load Balancing and CoreDNS Plugin Graduate to General Availability"
[4]: https://kubernetes.io/blog/2018/09/27/kubernetes-1.12-kubelet-tls-bootstrap-and-azure-virtual-machine-scale-sets-vmss-move-to-general-availability/ "Kubernetes 1.12: Kubelet TLS Bootstrap and Azure Virtual Machine Scale Sets (VMSS) Move to General Availability"
[5]: https://kubernetes.io/blog/2018/12/03/kubernetes-1-13-release-announcement/ "Kubernetes 1.13: Simplified Cluster Management with Kubeadm, Container Storage Interface (CSI), and CoreDNS as Default DNS are Now Generally Available"
