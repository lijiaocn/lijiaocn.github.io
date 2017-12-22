---
layout: default
title: 2017-12-14-pod-retart-fail
author: lijiaocn
createdate: 2017/12/14 18:35:27
changedate: 2017/12/14 19:05:09
categories:
tags:
keywords:
description: 

---

* auto-gen TOC:
{:toc}

## 现象 

Pod重复启动，始终失败：

	$ kubectl -n xdgc-idesign-dev get  pod ndpreportservice-3085001597-k89rt
	NAME                                READY     STATUS             RESTARTS   AGE
	ndpreportservice-3085001597-k89rt   0/1       CrashLoopBackOff   29         2h

node上的kubelet日志显示：

	Dec 14 16:22:39 paas-slave-20-47 kubelet[2973]: INFO:1214 16:22:39.031112    2973 kubelet.go:1912] SyncLoop (PLEG): "ndpreportservice-3085001597-k89rt_xdgc-idesign-dev(eff68f7e-e0a7-11e7-9d36-5254
		b24cbf5e)", event: &pleg.PodLifecycleEvent{ID:"eff68f7e-e0a7-11e7-9d36-5254b24cbf5e", Type:"ContainerStarted", Data:"c9219da653e2502db976e19236a6af66249737fa8346dc351a4922d63eae2617"}

node上的docker日志显示：

	$ grep -n "ndpreportservice" docker.log
	253730:Dec 14 13:58:44 paas-slave-20-47 dockerd[30336]: time="2017-12-14T13:58:44.039264968+08:00" level=info msg="failed to mount layer sha256:44f93e815927fed7d736682036245d762f6a4b94388a9b3c179b
		73be68ca71cd (sha256:a7010feea5befe431619589511b6a4fe04f953bc5985b342c880abad5297bad6) from reg.enncloud.cn/cdi-ndtp/ndpreportservice: errors:\ndenied: requested access to the resource is deni
		ed\nunauthorized: authentication required\n"
	253733:Dec 14 13:58:44 paas-slave-20-47 dockerd[30336]: time="2017-12-14T13:58:44.976426830+08:00" level=info msg="failed to mount layer sha256:533a2b13358e498802f193e2c0213bfbc8544a504d926ca382f5
		416d508a64f7 (sha256:aece77009cb0cdcd8f0c761f3f4d9580d7a6b5cf2814ec7be5fd881bb847f7ae) from reg.enncloud.cn/cdi-ndtp/ndpreportservice: errors:\ndenied: requested access to the resource is deni
		ed\nunauthorized: authentication required\n"
	253736:Dec 14 13:58:45 paas-slave-20-47 dockerd[30336]: time="2017-12-14T13:58:45.122043135+08:00" level=info msg="failed to mount layer sha256:0a74730e3aeaf3c4897877dc560d4b2954c0a7f09f89124d55fb
		dd1ea37d9f1f (sha256:9df1059c03bdacd5e80100d5b3d9920d31256ee56df032a583399e7b26b43586) from reg.enncloud.cn/cdi-ndtp/ndpreportservice: errors:\ndenied: requested access to the resource is deni
		ed\nunauthorized: authentication required\n"
	...

日志在20.47上。

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
