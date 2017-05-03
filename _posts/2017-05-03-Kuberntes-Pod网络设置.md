---
layout: default
title: Kubernetes的Pod网络设置
author: lijiaocn
createdate: 2017/05/03 09:30:33
changedate: 2017/05/03 09:47:31
categories:
tags: k8s
keywords: kuberntes,pod,network
description: kubernetes的pod网络设置过程分析,pod的网络由kubelet负责在pod创建时设置。

---

* auto-gen TOC:
{:toc}

## 网络模块初始化

在k8s.io/kubernetes/pkg/kubelet/kubelet.go，NewMainKubelet()中:

	if plug, err := network.InitNetworkPlugin(kubeDeps.NetworkPlugins, 
	        kubeCfg.NetworkPluginName, 
	        &criNetworkHost{&networkHost{klet}, &network.NoopPortMappingGetter{}}, 
	        klet.hairpinMode, 
	        klet.nonMasqueradeCIDR, 
	        int(kubeCfg.NetworkPluginMTU)); err != nil {

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 

