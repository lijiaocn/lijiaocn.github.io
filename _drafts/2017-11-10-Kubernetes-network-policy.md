---
layout: default
title: kubernetes的网络隔离策略
author: lijiaocn
createdate: 2017/11/10 10:47:51
changedate: 2017/11/15 15:37:20
categories: 项目
tags: kubernetes
keywords: kubernetes,network policy,isolation
description: kubernetes1.7，网络隔离的api变更为networking.k8s.io/v1

---

* auto-gen TOC:
{:toc}

## 说明

kubernetes1.7后，网络隔离的api变更为networking.k8s.io/v1

## API

NetworkPolicy使用的白名单策略，即只允许选定的目标访问指定的pod。

[Kubernetes API: Network Policy][2]对network policy的api进行了介绍。

	apiVersion: networking.k8s.io/v1
	kind: NetworkPolicy
	metadata:
	  name: test-network-policy
	  namespace: default
	spec:
	  podSelector:
	    matchLabels:
	      role: db
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

可以看到，network policy是归属于namespace的资源。

访问来源有`ipBlock`、`namespaceSelector`、`podSelector`三种表达方式，这三者是`或`的关系。

## Default Policy

可以灵活使用NetworkPolicy，设置默认规则。

默认不允许访问：

	apiVersion: networking.k8s.io/v1
	kind: NetworkPolicy
	metadata:
	  name: default-deny
	  spec:
	    podSelector:

默认允许访问：

	apiVersion: networking.k8s.io/v1
	kind: NetworkPolicy
	metadata:
	  name: allow-all
	spec:
	  podSelector:
	  ingress:
	  - {}

## 参考

1. [Kubernetes Network Policies][1]
2. [Kubernetes API: Network Policy][2]

[1]: https://v1-7.docs.kubernetes.io/docs/concepts/services-networking/network-policies/  "Kubernetes Network Policies" 
[2]: https://v1-7.docs.kubernetes.io/docs/api-reference/v1.7/#networkpolicy-v1-networking "Kubernetes API: Network Policy"
