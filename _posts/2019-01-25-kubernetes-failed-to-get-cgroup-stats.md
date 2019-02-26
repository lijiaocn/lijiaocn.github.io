---
layout: default
title: "Kubernetes问题调查：failed to get cgroup stats for /systemd/system.slice"
author: 李佶澳
createdate: "2019-01-25 11:28:17 +0800"
changedate: "2019-01-29 14:38:16 +0800"
categories: 问题
tags: kubernetes
keywords: kubernetes,cgroup,system.slice,unkown container
description: 'summary.go:92] Failed to get system container stats for "/systemd/system.slice" cgroup stats'
---

* auto-gen TOC:
{:toc}

## 说明

Kubelet日志中不停的出现下面的错误：

	Jan 25 ... summary.go:92] Failed to get system container stats for "/systemd/system.slice": failed to get cgroup stats for "/systemd/system.slice": failed to get container info for "/systemd/system.slice": unknown container "/systemd/system.slice"
	Jan 25 ... summary.go:92] Failed to get system container stats for "/systemd/system.slice": failed to get cgroup stats for "/systemd/system.slice": failed to get container info for "/systemd/system.slice": unknown container "/systemd/system.slice"

又是和cgroup有关的错误，见到cgroup就头大，之前学习过cgroup（[《cgroup：linux的cgroup的使用》][1]），但是一直没形成很清晰的认识，借着排查这个问题的机会深入了解一下。

Kubernetes版本1.9.11。

## 扫代码

kubelet版本是1.9.11，错误日志来自这里：

```go
// pkg/kubelet/server/stats/summary.go
// Get provides a new Summary with the stats from Kubelet.
func (sp *summaryProviderImpl) Get() (*statsapi.Summary, error) {
	...省略...
	systemContainers := map[string]string{
		statsapi.SystemContainerKubelet: nodeConfig.KubeletCgroupsName,
		statsapi.SystemContainerRuntime: nodeConfig.RuntimeCgroupsName,
		statsapi.SystemContainerMisc:    nodeConfig.SystemCgroupsName,
	}
	for sys, name := range systemContainers {
		// skip if cgroup name is undefined (not all system containers are required)
		if name == "" {
			continue
		}
		s, _, err := sp.provider.GetCgroupStats(name)
		if err != nil {
			glog.Errorf("Failed to get system container stats for %q: %v", name, err)
			continue
		}
		// System containers don't have a filesystem associated with them.
		s.Logs, s.Rootfs = nil, nil
		s.Name = sys
		nodeStats.SystemContainers = append(nodeStats.SystemContainers, *s)
	}
	...省略...
	}
```

通过阅读代码上下文，得知这里查找的是`--runtime-cgroups`和`--kubelet-cgroups`指定的cgroup。

之前调查的时候，网上有人说，将这两个参数的数值都设置为`/systemd/system.slice`，[Github Issue #56850: Failed to get system container stats for..][2]：

	--runtime-cgroups=/systemd/system.slice --kubelet-cgroups=/systemd/system.slice

对这个解决方法很怀疑，他设置的参数值明显和参数名称不搭，并且在我的环境中，这个方法无效，上面打印的日志就是这样设置以后打印的。

是不是`--runtime-cgroups`和`--kubelet-cgroups`应该设置为其它数值呢？

没找到具体的例子，从参数说明中也看不到要怎样设置，随便尝试了几种：

	/
	/sys/fs/cgroup/systemd/system.slice
	/system.slice/kubelet.service
	/sys/fs/cgroup/systemd/system.slice/kubelet.service

结果都不行，设置为哪个值，日志里就显示名称为哪个值的容器找不到。

## 继续调查

没办法，只能继续爬代码，具体过程就不说了，总之最后发现，`sp.provider.GetCgroupStats(name)`是用cadvisor client从cadvisor中查找容器信息的。

cadvisor client的创建代码：

```go
// cmd/kubelet/app/server.go: 418
func run(s *options.KubeletServer, kubeDeps *kubelet.Dependencies) (err error) {
	...
	if kubeDeps.CAdvisorInterface == nil {
		imageFsInfoProvider := cadvisor.NewImageFsInfoProvider(s.ContainerRuntime, s.RemoteRuntimeEndpoint)
		kubeDeps.CAdvisorInterface, err = cadvisor.New(s.Address, uint(s.CAdvisorPort), imageFsInfoProvider, s.RootDirectory, cadvisor.UsingLegacyCadvisorStats(s.ContainerRuntime, s.RemoteRuntimeEndpoint))
		if err != nil {
			return err
		}
	}
```

参照kubelet，写一个从cadvisor中查询容器信息工具，看一下从cadvisor中到底能不能查找到目标容器：

```go
// Copyright (C) 2019 lijiaocn <lijiaocn@foxmail.com>
//
// Distributed under terms of the GPL license.

package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/golang/glog"
	cadvisorapiv2 "github.com/google/cadvisor/info/v2"
	"k8s.io/kubernetes/pkg/kubelet/cadvisor"
	"time"
)

type CmdLine struct {
	ContainerName string
}

var cmdline CmdLine

func init() {
	flag.StringVar(&cmdline.ContainerName, "name", "/", "container name")
}

func main() {
	flag.Parse()

	ContainerRuntime := "docker"
	RemoteRuntimeEndpoint := ""
	imagefs := cadvisor.NewImageFsInfoProvider(ContainerRuntime, RemoteRuntimeEndpoint)
	usingLegacyStats := cadvisor.UsingLegacyCadvisorStats(ContainerRuntime, RemoteRuntimeEndpoint)
	ca, err := cadvisor.New("127.0.0.1", 4000, imagefs, "/var/lib/kubelet", usingLegacyStats)
	if err != nil {
		glog.Error(err)
	}

	if err := ca.Start(); err != nil {
		glog.Error(err)
	}

	options := cadvisorapiv2.RequestOptions{
		IdType:    cadvisorapiv2.TypeName,
		Count:     2, // 2 samples are needed to compute "instantaneous" CPU
		Recursive: true,   //设置为true，递归查找，深入到目录中
	}

	machineInfo, err := ca.MachineInfo()
	if err != nil {
		glog.Error(err.Error())
	}
	bytes, err := json.Marshal(&machineInfo)
	fmt.Printf("machineInfo: %s\n", bytes)

	rootfsInfo, err := ca.RootFsInfo()
	if err != nil {
		glog.Error(err.Error())
	}
	bytes, err = json.Marshal(&rootfsInfo)
	fmt.Printf("rootfsInfo: %s\n", bytes)

	infoMap, err := ca.ContainerInfoV2(cmdline.ContainerName, options)
	if err != nil {
		glog.Error(err.Error())
	}

	if infoMap == nil {
		glog.Error("infoMap is null")
	}

	for name, value := range infoMap {
		fmt.Printf("%s: %s  %s\n", name, value.Spec.Namespace, value.Spec.Image)
	}

	time.Sleep(600 * time.Second)
}
```

上面的代码需要放到$GOPATH/src/k8s.io/kubernetes目录或者它的子目录中，例如放在新建的子目录中lijiaocn/cadvisor中：

```bash
$ ls $GOPATH/src/k8s.io/kubernetes/lijiaocn/cadvisor/main.go
main.go
$ cd $GOPATH/src/k8s.io/kubernetes/lijiaocn/cadvisor/
$ go build 
```

编译得到文件cadvisor，将它拷贝到目标机器上，查看cadvisor发现的容器：

```bash
$ ./cadvisor
kube-proxy
/system.slice/rsyslog.service
/system.slice/polkit.service
/kubepods/besteffort/podca8a190e-156f-11e9-97b9-52540064c479/450f1b5757d45c2367fa06ec65de03508a47e9d9037cd5769a4c17e29299f10a
/system.slice/kmod-static-nodes.service
/system.slice/crond.service
/system.slice/system-getty.slice
/user.slice
/system.slice/rhel-import-state.service
/system.slice/systemd-udevd.service
/kubepods
/system.slice/system-selinux\x2dpolicy\x2dmigrate\x2dlocal\x2dchanges.slice
/system.slice/kubelet.service
...省略...
/systemd/system.slice
...
/systemd/system.slice/docker.service
...
```

可以确定两件事情：第一，不需要在名称前面加上cgroup的挂载路径/sys/fs/cgroup；第二，传入的参数`/`、`/systemd/system.slice`以及`/system.slice/kubelet.service`等都是存在的。

直接用cadvisor能查到容器的cgroup，为什么kubelet无论如何也查不到呢？这里写的查询方法是直接抄的kubelet，为什么我们能查到，kubelet查不到？：

用./cadvisor能查到`/system.slice/kubelet.service`：

```bash
$ ./cadvisor --name=/system.slice/kubelet.service
/system.slice/kubelet.service
```

陷入僵局。

## 直接用cadvisor查询所有cgroup

猛然想起还有另一个集群，在那个集群中似乎没有见过这个错误，两个集群使用的是同一个版本的kubelet。

比对两个集群的kubelet命令行参数，发现了不同：没有报该错误的集群上，没有使用`--docker-only`参数。

赶紧去看这个参数的作用：

	--docker-only   Only report docker containers in addition to root stats

莫非使用了该参数之后，cadvisor不采集docker以外的cgroup信息？

将这个参数去掉之后，错误消失！猜测大概是对的。

另外结合前面的分析过程，如果要设置--kubelet-cgroups和--runtime-cgroups，应该设置为如下的数值：

```
# 根据自己环境设置，我这里是CentOS7，用systemd启动kubelet和docker
--kubelet-cgroups=/system.slice/kubelet.service
--runtime-cgroups=/system.slice/docker.service
```

需要特别注意的是，这里的kubelet和docker，是在CentOS上用systemctl启动的，这两个cgroup都是systemd创建的。
如果不用systemctl启动，而是直接在命令行运行kubelet，例如：

	./kubelet --kubelet-cgroups=/system.slice/kubelet.service --XXXX（省略）

会因为/system.slice/kubelet.service没有被创建，导致继续打印本页开头粘贴的错误日志，这时候才是真的找不到指定的cgroup。

## 参考

1. [《cgroup：linux的cgroup的使用》][1]
2. [Github Issue #56850: Failed to get system container stats for..][2]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html "《cgroup：linux的cgroup的使用》"
[2]: https://github.com/kubernetes/kubernetes/issues/56850#issuecomment-354539158  "Github Issue #56850: Failed to get system container stats for.."
