---
layout: default
title: kubernetes启动pod的时候，长时间无法挂载volume的问题调查
author: lijiaocn
createdate: 2017/11/02 15:22:14
changedate: 2017/11/02 16:24:28
categories:
tags:
keywords:
description: 

---

* auto-gen TOC:
{:toc}

## 现象

用describe命令查看pod状态发现：

	...
	Events:
	  FirstSeen	LastSeen	Count	From			SubobjectPath		Type		Reason		Message
	  ---------	--------	-----	----			-------------		--------	------		-------
	  10m		10m		1	{default-scheduler }				Normal		Scheduled	Successfully assigned ceres-1 to slave-92
	  8m		2m		4	{kubelet slave-92}				Warning		FailedMount	Unable to mount volumes for pod "ceres-1_ceres-system(13c9e316-bf9d-11e7-9478-5254c2cdf2fd)": timeout expired waiting for volumes to attach/mount for pod "ceres-1"/"ceres-system". list of unattached/unmounted volumes=[datadir]
	  8m		2m		4	{kubelet slave-92}				Warning		FailedSync	Error syncing pod, skipping: timeout expired waiting for volumes to attach/mount for pod "ceres-1"/"ceres-system". list of unattached/unmounted volumes=[datadir]

同时在kubelet的日志中发现:

	E1102 15:20:19.406830   14157 kubelet.go:1813] Unable to mount volumes for pod "ceres-1_ceres-system(13c9e316-bf9d-11e7-9478-5254c2cdf2fd)": timeout expired waiting for volumes to attach/mount for pod "ceres-1"/"ceres-system". list of unattached/unmounted volumes=[datadir]; skipping pod
	E1102 15:20:19.406885   14157 pod_workers.go:184] Error syncing pod 13c9e316-bf9d-11e7-9478-5254c2cdf2fd, skipping: timeout expired waiting for volumes to attach/mount for pod "ceres-1"/"ceres-system". list of unattached/unmounted volumes=[datadir]

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
