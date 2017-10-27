---
layout: default
title: kube-router的源码走读
author: lijiaocn
createdate: 2017/10/13 17:28:23
changedate: 2017/10/27 19:28:20
categories: 项目
tags: kube-router
keywords:  kube-router源码走读,kube-router源码分析,kubernetes
description: kube-router是一个挺有想法的项目，兼备了calico和kube-proxy的功能，代码也很整洁。

---

* auto-gen TOC:
{:toc}

## 说明

[kube-router][1]是一个挺有想法的项目，兼备了calico和kube-proxy的功能。

这里分析的kube-router版本是v0.0.9。

## 编译

[kube-router developer guild][2]很详细的介绍了编译的过程。

## 原理

使用ipvs，将访问service的流量分发给pod。

使用iptables、ipset实现network policy。

使用gobgp实现pod的网络。

## 架构

[kube-router architecture][3]中介绍了kube-router的设计，很简洁的架构。

![kube-router architecture](https://github.com/cloudnativelabs/kube-router/raw/master/Documentation/img/kube-router-arch.png)

## 源码

kube-router的源码很简洁，启动之后，首先创建wathcer:

	func (kr *KubeRouter) Run() error {
		...
		err = kr.startApiWatchers()

在`startApiWatchers`中，会启动pod、endpoint、networkpolicy、namespace、service、node六个wather。

这六个wathcer将监听的变化发送到`Broadcaster

	func NewBroadcaster() *Broadcaster {
		return &Broadcaster{}
	}
	
	func (b *Broadcaster) Add(listener Listener) {
		b.listenerLock.Lock()
		defer b.listenerLock.Unlock()
		b.listeners = append(b.listeners, listener)
	}
	
	func (b *Broadcaster) Notify(instance interface{}) {
		b.listenerLock.RLock()
		listeners := b.listeners
		b.listenerLock.RUnlock()
		for _, listener := range listeners {
			go listener.OnUpdate(instance)
		}
	}

之后创建三个controller：NetworkPolicyController、NetworkRoutingController、NetworkServicesControllers。
每个controller会监听所关心的资源的变化。

	func NewNetworkServicesController(clientset *kubernetes.Clientset,\
		config *options.KubeRouterConfig) (*NetworkServicesController, error) {
		...
		nsc := NetworkServicesController{}
		...
		watchers.EndpointsWatcher.RegisterHandler(&nsc)
		watchers.ServiceWatcher.RegisterHandler(&nsc)
		...

## 参考

1. [kube-router][1]
2. [kube-router developer guild][2]
3. [kube-router architecture][3]

[1]: https://github.com/cloudnativelabs/kube-router  "kube-router" 
[2]: https://github.com/cloudnativelabs/kube-router/blob/master/Documentation/developing.md "kube-router developer guide"
[3]: https://github.com/cloudnativelabs/kube-router/blob/master/Documentation/README.md#architecture "kube-router architecture"
