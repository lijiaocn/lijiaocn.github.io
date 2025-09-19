---
layout: default
title: kubernetes的网络隔离networkpolicy
author: 李佶澳
createdate: 2017/11/10 10:47:51
last_modified_at: 2017/11/22 13:23:35
categories: 项目
tags: kubernetes
keywords: kubernetes,network policy,isolation
description: kubernetes1.7，网络隔离的api变更为networking.k8s.io/v1

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

kubernetes1.8中，网络隔离的api变更为networking.k8s.io/v1，并且增加了新特性。

特别注意，虽然kubernetes提供了networkpolicy的api，但隔离要生效还需要kubernetes的网络插件的支持。

例如如果使用calico，需要部署[calico: kube-controllers][2]。

## API

networkpolicy在pkg/apis/networking中定义。

1.8.X在1.7.X的基础上增加了`policyTypes`字段，支持`Ingress`和`Egress`，并且增加了`ipBlock`。

访问来源有`ipBlock`、`namespaceSelector`、`podSelector`三种表达方式，这三者是`或`的关系。

	apiVersion: networking.k8s.io/v1
	kind: NetworkPolicy
	metadata:
	  name: test-network-policy
	  namespace: default
	spec:
	  podSelector:
	    matchLabels:
	      role: db
	  policyTypes:
	  - Ingress
	  - Egress
	  ingress:
	  - from:
	    - ipBlock:
	        cidr: 172.17.0.0/16
	        except:
	        - 172.17.1.0/24
	    - namespaceSelector:
	        matchLabels:
	          project: myproject
	    - podSelector:
	        matchLabels:
	          role: frontend
	    ports:
	    - protocol: TCP
	      port: 6379
	  egress:
	  - to:
	    - ipBlock:
	        cidr: 10.0.0.0/24
	    ports:
	    - protocol: TCP
	      port: 5978

## Default Policy

可以灵活使用NetworkPolicy，设置默认规则。

### 默认隔离所有的pod

在v1.7.X中，选中了所有pod，不设置ingress，这些pod不能被访问。

	apiVersion: networking.k8s.io/v1
	kind: NetworkPolicy
	metadata:
	  name: default-deny
	  spec:
	    podSelector: {}

在v1.8.X中，增加了policyTypes字段，支持Engress，因此需要指定类型Ingress。

	apiVersion: networking.k8s.io/v1
	kind: NetworkPolicy
	metadata:
	  name: default-deny
	spec:
	  podSelector: {}
	  policyTypes:
	  - Ingress

### 默认放开所有的pod

选中所有的pod，设置一个ingress，所有的pod都允许任意来源的请求，v1.7.X和v1.8.X相同。

	apiVersion: networking.k8s.io/v1
	kind: NetworkPolicy
	metadata:
	  name: default-allow
	  spec:
	    podSelector: {}
	    ingress:
	    - {}

## 参考

1. [Kubernetes Network Policies][1]
2. [calico: kube-controllers][2]

[1]: https://kubernetes.io/docs/concepts/services-networking/network-policies/ "Kubernetes Network Policies" 
[2]: https://github.com/projectcalico/kube-controllers "calico: kube-controllers"
