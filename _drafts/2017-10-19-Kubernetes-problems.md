---
layout: default
title: Kubernetes使用常见问题记录
author: lijiaocn
createdate: 2017/10/19 13:32:29
last_modified_at: 2017/10/19 14:25:13
categories: 问题
tags: kubernetes
keywords: kuberntes,常见问题,问题记录
description: Kubernetes使用常见问题记录

---

* auto-gen TOC:
{:toc}

## Pod sandbox changed, it will be killed and re-created.

Cni启动失败，没有成功设置pod的IP，在kubelet日志中可以看到:

	W1019 01:45:24.090796    8816 cni.go:119] Error loading CNI config file /etc/cni/net.d/._10-kuberouter.conf: error parsing configuration: invalid character '\x00' looking for beginning of valueV
	W1019 05:33:33.046367    8816 docker_sandbox.go:343] failed to read pod IP from plugin/docker: Couldn't find network status for default/webshell-59cf8d4d97-h6fbt through plugin: invalid network status for
	E1019 05:33:33.361616    8816 docker_sandbox.go:666] ResolvConfPath is empty.
	W1019 05:33:33.362764    8816 docker_sandbox.go:343] failed to read pod IP from plugin/docker: Couldn't find network status for default/webshell-59cf8d4d97-h6fbt through plugin: invalid network status for
	I1019 05:33:33.363997    8816 kuberuntime_manager.go:738] checking backoff for container "webshell" in pod "webshell-59cf8d4d97-h6fbt_default(9823fe60-b48c-11e7-a847-525400bd971e)"


将kubelet的日志级别设置未`-v=4`后，可以看到，pod没有分配到IP：

	1019 06:14:09.824227   26945 kuberuntime_manager.go:556] computePodActions got {KillPod:true CreateSandbox:true SandboxID:04a8562354480779cf678e2ed6db3264453c0ca68c7c57740fb6eb0b1cefb331 Attempt:788 NextInitContainerToStart:nil ContainersToStart:[0] ContainersToKill:map[]} for pod "webshell-59cf8d4d97-9zckd_default(4fbf6715-b492-11e7-a847-525400bd971e)"
	I1019 06:14:09.824286   26945 kuberuntime_manager.go:574] Stopping PodSandbox for "webshell-59cf8d4d97-9zckd_default(4fbf6715-b492-11e7-a847-525400bd971e)", will start new one


## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
