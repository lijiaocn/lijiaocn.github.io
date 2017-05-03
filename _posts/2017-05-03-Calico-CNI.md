---
layout: default
title: Calico的cni-plugin实现
author: lijiaocn
createdate: 2017/05/03 14:13:39
changedate: 2017/05/03 15:31:06
categories:
tags: k8s
keywords: Calico,CNI
description: calico实现了符合CNI标准的plugin，可以接入kubernetes，这里分析一下它的实现。

---

* auto-gen TOC:
{:toc}

## 概况

[calico-cni-plugin][1]的实现很简单，直接使用[skel][2]，直接需要实现add命令和del命令。

## 非k8s

calico-cni-plugin中将k8s场景下的使用和非k8s场景下的使用分离开了。

	if orchestrator == "k8s" {
		if result, err = k8s.CmdAddK8s(args, conf, nodename, calicoClient, endpoint); err != nil {
			return err
		}
	} else {
		// Default CNI behavior - use the CNI network name as the Calico profile.
		profileID := conf.Name
	......

非k8s的场景中,github.com/projectcalico/cni-plugin/calico.go：

	// There's no existing endpoint, so we need to do the following:
	// 1) Call the configured IPAM plugin to get IP address(es)
	// 2) Configure the Calico endpoint
	// 3) Create the veth, configuring it on both the host and container namespace.

过程很简单，获取IP，配置endpoint，在host上创建veth设备，host端命令默认以"caliXX"，容器端命名指定的ifname.

## k8s

如果是k8s下使用，主要是添加对k8s注解的解读，实现人为指定IP等功能。

github.com/projectcalico/cni-plugin/k8s/k8s.go:

	func CmdAddK8s(args *skel.CmdArgs, conf utils.NetConf, nodename string, calicoClient *calicoclient.Client, endpoint *api.WorkloadEndpoint) (*current.Result, error) {
		var err error
		var result *current.Result

		k8sArgs := utils.K8sArgs{}
		err = types.LoadArgs(args.Args, &k8sArgs)
		......
		ipAddrsNoIpam := annot["cni.projectcalico.org/ipAddrsNoIpam"]
		ipAddrs := annot["cni.projectcalico.org/ipAddrs"]
		......

设置endpoint，创建veth的过程与非k8s场景下的使用相同。

## 参考

1. [calico-cni-plugin][1]
2. [containernetworking skel][2]

[1]: https://github.com/projectcalico/cni-plugin  "cni-plugin" 
[2]: https://github.com/containernetworking/cni/tree/master/pkg/skel "skel" 
