---
layout: default
title: "Kubelet1.7.16使用kubeconfig时，没有设置--require-kubeconfig，导致node不能注册"
author: 李佶澳
createdate: "2019-01-14 11:08:17 +0800"
changedate: "2019-01-23 16:00:00 +0800"
categories: 问题
tags: kubernetes
keywords: kubernetes,kubelet,node
description:  “因为没有指定apiservers，所以node状态不会上报”，用kubeconfig文件就不能上报node状态了？？
---

* auto-gen TOC:
{:toc}

## 现象

kubelet启动时日志报错：

```
E0114 11:06:58.217478     738 kubelet.go:1234] Image garbage collection failed once. Stats initialization may not have completed yet: unable to find data for container /
E0114 11:06:58.223804     738 kubelet.go:1733] Failed to check if disk space is available for the runtime: failed to get fs info for "runtime": unable to find data for container /
E0114 11:06:58.223845     738 kubelet.go:1741] Failed to check if disk space is available on the root partition: failed to get fs info for "root": unable to find data for container /
E0114 11:06:58.228106     738 container_manager_linux.go:543] [ContainerManager]: Fail to get rootfs information unable to find data for container /
```

用`kubectl get node`命令一直看不到对应的node，也就说kubelet一直没有向master注册。

kubelet版本是`1.7.16`，kubernetes master版本是`1.9.11`。

## 结论

分析过程走了好大一个弯路，上面的日志是在命令行运行kubelet时打印的，只有ERROR。

一直以为是这几个ERROR导致node不能注册，调查了好久。

后来纳闷代码中的一些日志怎么没在屏幕上打印出来，查看kubelet的运行参数，发现`--logtostderr=false`，所以屏幕上只打印了Error...

修改为`--logtostderr=true`之后，出现了大量日志，调查过程就顺利多了。

日志中有这样一行：

```
W0114 15:32:13.582668   27521 kubelet.go:1318] No api server defined - no node status update will be sent.
```

“因为没有指定apiservers，所以node状态不会上报”。kubelet用的是kubeconfig文件，没有在命令行指定apiserver，难道这样就不能上报node状态了？？

检查kubelet 1.7.16的参数发现有一个`--require-kubeconfig`参数：

	--require-kubeconfig     If true the Kubelet will exit if there are configuration errors, and will ignore the 
	                         value of --api-servers in favor of the server defined in the kubeconfig file.

加上这个参数，就可以注册了。

## 存档之前走的歪路

### 分析

打印日志的kubelet代码：

```go
// kubernetes/pkg/kubelet/kubelet.go：1727
// isOutOfDisk detects if pods can't fit due to lack of disk space.
func (kl *Kubelet) isOutOfDisk() bool {
	// Check disk space once globally and reject or accept all new pods.
	withinBounds, err := kl.diskSpaceManager.IsRuntimeDiskSpaceAvailable()
	// Assume enough space in case of errors.
	if err != nil {
		glog.Errorf("Failed to check if disk space is available for the runtime: %v", err)
	} else if !withinBounds {
		return true
	}

	withinBounds, err = kl.diskSpaceManager.IsRootDiskSpaceAvailable()
	// Assume enough space in case of errors.
	if err != nil {
		glog.Errorf("Failed to check if disk space is available on the root partition: %v", err)
	} else if !withinBounds {
		return true
	}
	return false
}
```

通过分析代码可以确定是下面的`dm.cadvisor.ImagesFsInfo`和`dm.cadvisor.RootFsInfo`函数运行报错：

```go
// pkg/kubelet/disk_manager.go: 86
func (dm *realDiskSpaceManager) IsRuntimeDiskSpaceAvailable() (bool, error) {
	return dm.isSpaceAvailable("runtime", dm.policy.DockerFreeDiskMB, dm.cadvisor.ImagesFsInfo)
}

func (dm *realDiskSpaceManager) IsRootDiskSpaceAvailable() (bool, error) {
	return dm.isSpaceAvailable("root", dm.policy.RootFreeDiskMB, dm.cadvisor.RootFsInfo)
}
```

另外第三行日志也与cadvisor有关，`cm.cadvisorInterface.RootFsInfo()`：

```go
// kubernetes/pkg/kubelet/cm/container_manager_linux.go: 543
func (cm *containerManagerImpl) Start(node *v1.Node, activePods ActivePodsFunc) error {
	...
	stopChan := make(chan struct{})
	go wait.Until(func() {
		if err := cm.setFsCapacity(); err != nil {
			glog.Errorf("[ContainerManager]: %v", err)
			return
		}
		close(stopChan)
	}, time.Second, stopChan)
	return nil
}

func (cm *containerManagerImpl) setFsCapacity() error {
	rootfs, err := cm.cadvisorInterface.RootFsInfo()
	if err != nil {
		return fmt.Errorf("Fail to get rootfs information %v", err)
	}
	...
}
```

### 查找dm.cadvisor的创建位置

dm.cadvisor是第一个参数`kubeDeps.CAdvisorInterface`：

```go
// kubernetes/pkg/kubelet/kubelet.go: 424
diskSpaceManager, err := newDiskSpaceManager(kubeDeps.CAdvisorInterface, diskSpacePolicy)
```

kubeDeps.CAdvisorInterface的创建：

```go
// kubernetes/cmd/kubelet/app/server.go: 538
func run(s *options.KubeletServer, kubeDeps *kubelet.KubeletDeps) (err error) {
	...
	if kubeDeps.CAdvisorInterface == nil {
		kubeDeps.CAdvisorInterface, err = cadvisor.New(uint(s.CAdvisorPort), s.ContainerRuntime, s.RootDirectory)
		if err != nil {
			return err
		}
	}
}
```

上面调用的cadvisor是`"k8s.io/kubernetes/pkg/kubelet/cadvisor"`：

```go
// kubernetes/pkg/kubelet/cadvisor/cadvisor_linux.go: 97
func New(port uint, runtime string, rootPath string) (Interface, error) {
	sysFs := sysfs.NewRealSysFs()

	// Create and start the cAdvisor container manager.
	m, err := manager.New(memory.New(statsCacheDuration, nil), sysFs, maxHousekeepingInterval, allowDynamicHousekeeping, \
	            cadvisormetrics.MetricSet{cadvisormetrics.NetworkTcpUsageMetrics: struct{}{}}, http.DefaultClient)
	if err != nil {
		return nil, err
	}

	cadvisorClient := &cadvisorClient{
		runtime:  runtime,
		rootPath: rootPath,
		Manager:  m,
	}

	err = cadvisorClient.exportHTTP(port)
	if err != nil {
		return nil, err
	}
	return cadvisorClient, nil
}
```

怎么是`cadvisorUnsupported{}`？

```go
// kubernetes/pkg/kubelet/cadvisor/cadvisor_linux.go: 188
func (cc *cadvisorClient) ImagesFsInfo() (cadvisorapiv2.FsInfo, error) {
	var label string
	
	switch cc.runtime {
	case "docker":
		label = cadvisorfs.LabelDockerImages
	case "rkt":
		label = cadvisorfs.LabelRktImages
	default:
		return cadvisorapiv2.FsInfo{}, fmt.Errorf("ImagesFsInfo: unknown runtime: %v", cc.runtime)
	}
	
	return cc.getFsInfo(label)
}

func (cc *cadvisorClient) RootFsInfo() (cadvisorapiv2.FsInfo, error) {
	return cc.GetDirFsInfo(cc.rootPath)
}
```
