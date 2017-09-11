---
layout: default
title: Kubernetes的federation部署，跨区Service
author: lijiaocn
createdate: 2017/05/16 14:21:30
changedate: 2017/05/17 13:22:41
categories: 项目
tags: kubernetes
keywords: k8s,federation,跨区,Service
description: 通过kubernetes的联邦机制,可以统一管理多个k8s集群。

---

* auto-gen TOC:
{:toc}

通过kubernetes的联邦机制,可以统一管理多个k8s集群。

## 联邦服务

kubernetes中包含了两个子程序: fedeartion-apiserver和federation-controller-manager。

	▾ federation/
	  ▸ apis/
	  ▸ client/
	  ▸ cluster/
	  ▾ cmd/
	    ▸ federation-apiserver/
	    ▸ federation-controller-manager/
	    ▸ genfeddocs/
	    ▸ kubefed/

这两个程序实现了联邦功能，它俩启动后构成的服务，称为联邦服务。

联邦服务可以独立部署，也可以作为服务部署在一个k8s集群中(host cluster)。

其它的k8s集群可以注册到联邦服务中，之后可以通过联邦服务的API创建跨多个k8s集群的服务。

## 架构

	                      public dns
	
	
	    fedeartion-apiserver   federation-controller-manager
	
	
	      cluster1     cluster2     cluster3     cluster3 

## 部署

kubernetes的1.5版本引入了一个用来部署联邦的新命令`kubefed`。

	kubefed init fellowship \            
	   --host-cluster-context=rivendell \
	   --dns-provider="google-clouddns" \
	   --dns-zone-name="example.com."

参数说明:

	fellowship: 联邦的名字，会创建同名的context
	--host-cluster-context: 用来部署联邦的cluster的访问配置
	--dns-provider: dns服务提供商
	--dns-zone-name: 域名后缀，必须以`.`结尾，联邦会为cluster和服务分配域名

[Setting up Cluster Federation with Kubefed][3]中有更详细的说明。

## 注册集群

	kubefed join gondor --host-cluster-context=rivendell --cluster-context=gondor_needs-no_king

k8s集群必须手动注册到联邦，如果要注册的集群是1.5及以上的版本，kubefed是1.6及以上的版本，kube-dns会被自动更新，否则需要更新注入的集群的kube-dns。

[Setting up Cluster Federation with Kubefed][3]中有更详细的说明。

## 参考

1. [k8s federation][1]
2. [Cross-cluster Service Discovery using Federated Services][2]
3. [Setting up Cluster Federation with Kubefed][3]

[1]: https://github.com/kubernetes/kubernetes/tree/1780a527f6accd283fb95ab01beda3d380ff20e1/federation  "k8s federation" 
[2]: https://kubernetes.io/docs/tasks/federation/federation-service-discovery/ "Cross-cluster Service Discovery using Federated Services"
[3]: https://kubernetes.io/docs/tasks/federation/set-up-cluster-federation-kubefed/  "Setting up Cluster Federation with Kubefed"
