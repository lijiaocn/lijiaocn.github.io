---
layout: default
title: "Kubelet从1.7.16升级到1.9.11，Sandbox以外的容器都被重建的问题调查"
author: 李佶澳
createdate: "2019-01-14 16:38:38 +0800"
changedate: "2019-01-25 11:27:32 +0800"
categories:  问题
tags: kubernetes
keywords: kubernetes,kubelet升级,1.7.16,1.9.11,容器重启
description: kubelet从1.7.16升级到1.9.11，重启时，sandbox以外的容器会被重建，Container定义变化导致的
---

## 目录
* auto-gen TOC:
{:toc}

## 现象

将1.7.16版本的kubelet直接替换成1.9.11版本的kubelet，参数也一并调整，1.9.11版本的kubelet启动时，Sandbox以外的`非pause`容器会被重建，是`重建`不是重启。

```
$ docker ps
CONTAINER ID        IMAGE                                                     COMMAND                CREATED             STATUS           NAMES
e8b4a197e171        harbor.xxxx.com/kubernetes/node-exporter            "/bin/node_exporter"   31 seconds ago      Up 30 seconds    k8s_prometheus-node-exporter_prometheus-node-exporter-hpsrw_monitoring_8cdcb7ba-17d0-11e9-9243-52540064c479_2
ed0b86b380d2        harbor.xxxx.com/google_containers/pause-amd64:3.0   "/pause"               2 minutes ago       Up 2 minutes     k8s_POD_prometheus-node-exporter-hpsrw_monitoring_8cdcb7ba-17d0-11e9-9243-52540064c479_0
```

可以看到sandbox容器的创建时间是2分钟前，使用的还是以前的sandbox，另外一个容器的启动时间是32秒之前，被重建了。

换成1.9.11版本的kubelet之后，在kubectl get node看到的版本信息随之更新：

```
# 之前
10-10-66-204    Ready   <none>    1h     v1.7.16   <none>    CentOS Linux 7 (Core)   3.10.0-862.9.1.el7.x86_64   docker://17.5.0

# 之后
10-10-66-204    Ready   <none>    1h     v1.9.11   <none>    CentOS Linux 7 (Core)   3.10.0-862.9.1.el7.x86_64   docker://17.5.0
```

>从1.9.11换回1.7.16，也会重建非`pause`容器。

## 分析

比较奇怪的地方是，sandbox容器没有重建，而且重建前后Pod的ID是没有变化的：

```
# 之前
$ ls /var/lib/kubelet/pods/
4ec492d2-17de-11e9-9206-52540064c479

# 之后
$ ls /var/lib/kubelet/pods/
4ec492d2-17de-11e9-9206-52540064c479
```

再对比容器的ID：

```
# 之前
$ ls /sys/fs/cgroup/cpu/kubepods/besteffort/pod4ec492d2-17de-11e9-9206-52540064c479/
03eba336d229e81d1155d2de3b5c85369d851a823ab32734811aaf752f6cef3d  cgroup.clone_children  cgroup.procs       cpu.cfs_quota_us  cpu.rt_runtime_us  cpu.stat      cpuacct.usage         notify_on_release
74172e19e1a03f79231f6c0ca1fb666d490be6e70c6b7c4f00add4dbf72a3a43  cgroup.event_control   cpu.cfs_period_us  cpu.rt_period_us  cpu.shares         cpuacct.stat  cpuacct.usage_percpu  tasks

# 之后
$ ls /sys/fs/cgroup/cpu/kubepods/besteffort/pod4ec492d2-17de-11e9-9206-52540064c479/
74172e19e1a03f79231f6c0ca1fb666d490be6e70c6b7c4f00add4dbf72a3a43  cgroup.procs       cpu.rt_period_us   cpu.stat       cpuacct.usage_percpu                                              tasks
cgroup.clone_children                                             cpu.cfs_period_us  cpu.rt_runtime_us  cpuacct.stat   f59c4812a66d65572020efab38780c1271d671330b126642653390dc8b8d29f1
cgroup.event_control                                              cpu.cfs_quota_us   cpu.shares         cpuacct.usage  notify_on_release
```

可以看到sandbox以外的容器的ID发生了变化。

对比日志：

```
# 1.7.16
I0114 17:55:49.989510   12551 kubelet.go:1882] SyncLoop (ADD, "api"): "prometheus-node-exporter-l7vzz_monitoring(4ec492d2-17de-11e9-9206-52540064c479)"
I0114 17:55:49.990031   12551 kubelet_pods.go:1220] Generating status for "prometheus-node-exporter-l7vzz_monitoring(4ec492d2-17de-11e9-9206-52540064c479)"
I0114 17:55:49.990366   12551 status_manager.go:340] Status Manager: adding pod: "4ec492d2-17de-11e9-9206-52540064c479", with status: ('\x01', {Running [{Initialized True 0001-01-01 00:00:00 +0000 UTC 2019-01-14 17:25:18 +0800 CST  } {Ready False 0001-01-01 00:00:00 +0000 UTC 2019-01-14 17:51:22 +0800 CST ContainersNotReady containers with unready status: [prometheus-node-exporter]} {PodScheduled True 0001-01-01 00:00:00 +0000 UTC 2019-01-14 17:25:19 +0800 CST  }]   10.10.66.204 10.10.66.204 2019-01-14 17:25:18 +0800 CST [] [{prometheus-node-exporter {nil nil &ContainerStateTerminated{ExitCode:143,Signal

# 1.9.11
I0114 17:57:39.258527   12945 config.go:405] Receiving a new pod "prometheus-node-exporter-l7vzz_monitoring(4ec492d2-17de-11e9-9206-52540064c479)"
...
I0114 17:57:41.448790   12945 manager.go:970] Added container: "/kubepods/besteffort/pod4ec492d2-17de-11e9-9206-52540064c479/f59c4812a66d65572020efab38780c1271d671330b126642653390dc8b8d29f1" (aliases: [k8s_prometheus-node-exporter_prometheus-node-exporter-l7vzz_monitoring_4ec492d2-17de-11e9-9206-52540064c479_1 f59c4812a66d65572020efab38780c1271d671330b126642653390dc8b8d29f1], namespace: "docker")
I0114 17:57:42.413318   12945 kubelet.go:1857] SyncLoop (ADD, "api"): "prometheus-node-exporter-l7vzz_monitoring(4ec492d2-17de-11e9-9206-52540064c479)"
I0114 17:57:42.413510   12945 kubelet.go:1902] SyncLoop (PLEG): "prometheus-node-exporter-l7vzz_monitoring(4ec492d2-17de-11e9-9206-52540064c479)", event: &pleg.PodLifecycleEvent{ID:"4ec492d2-17de-11e9-9206-52540064c479", Type:"ContainerStarted", Data:"f59c4812a66d65572020efab38780c1271d671330b126642653390dc8b8d29f1"}
I0114 17:57:42.413599   12945 kubelet.go:1902] SyncLoop (PLEG): "prometheus-node-exporter-l7vzz_monitoring(4ec492d2-17de-11e9-9206-52540064c479)", event: &pleg.PodLifecycleEvent{ID:"4ec492d2-17de-11e9-9206-52540064c479", Type:"ContainerDied", Data:"de1f8ebdf737297a1c591978d51de56ee2c0c4f3cc956517fe826bdfdef70e0f"}
```

后来通过梳理代码和查看日志，发现切换版本后，容器的hash发生了变化，1.9.11中的日志如下：

```
I0114 17:57:42.715551   12945 kuberuntime_manager.go:550] Container "prometheus-node-exporter" ({"docker" "f59c4812a66d65572020efab38780c1271d671330b126642653390dc8b8d29f1"})
                                       of pod prometheus-node-exporter-l7vzz_monitoring(4ec492d2-17de-11e9-9206-52540064c479): 
                                       Container spec hash changed (1559107639 vs 1428860573).. Container will be killed and recreated.
```

## 继续分析

先看一下1.7.16版本中的这部分代码：

```go
// kubernetes/pkg/kubelet/kuberuntime/kuberuntime_manager: 492
func (m *kubeGenericRuntimeManager) computePodContainerChanges(pod *v1.Pod, podStatus *kubecontainer.PodStatus) podContainerSpecChanges {
	...
	expectedHash := kubecontainer.HashContainer(&container)
	containerChanged := containerStatus.Hash != expectedHash
	if containerChanged {
		message := fmt.Sprintf("Pod %q container %q hash changed (%d vs %d), it will be killed and re-created.",
			pod.Name, container.Name, containerStatus.Hash, expectedHash)
		glog.Info(message)
		changes.ContainersToStart[index] = message
		continue
	}
	...
}

// kubernetes/pkg/kubelet/container/helpers.go: 99
// HashContainer returns the hash of the container. It is used to compare
// the running container with its desired spec.
func HashContainer(container *v1.Container) uint64 {
	hash := fnv.New32a()
	hashutil.DeepHashObject(hash, *container)
	return uint64(hash.Sum32())
}

// kubernetes/pkg/util/hash/hash.go: 28
func DeepHashObject(hasher hash.Hash, objectToWrite interface{}) {
	hasher.Reset()
	printer := spew.ConfigState{
		Indent:         " ",
		SortKeys:       true,
		DisableMethods: true,
		SpewKeys:       true,
	}
	printer.Fprintf(hasher, "%#v", objectToWrite)
}
```

再看一下1.9.11中的这部分代码：

```go
// kubernetes/pkg/kubelet/kuberuntime/kuberuntime_manager.go: 522
func (m *kubeGenericRuntimeManager) computePodActions(pod *v1.Pod, podStatus *kubecontainer.PodStatus) podActions {
	...
	if expectedHash, actualHash, changed := containerChanged(&container, containerStatus); changed {
		reason = fmt.Sprintf("Container spec hash changed (%d vs %d).", actualHash, expectedHash)
		// Restart regardless of the restart policy because the container
		// spec changed.
		restart = true
	}
	...
}

// kubernetes/pkg/kubelet/kuberuntime/kuberuntime_manager.go: 423
func containerChanged(container *v1.Container, containerStatus *kubecontainer.ContainerStatus) (uint64, uint64, bool) {
	expectedHash := kubecontainer.HashContainer(container)
	return expectedHash, containerStatus.Hash, containerStatus.Hash != expectedHash
}

// kubernetes/pkg/kubelet/container/helpers.go: 97
func HashContainer(container *v1.Container) uint64 {
	hash := fnv.New32a()
	hashutil.DeepHashObject(hash, *container)
	return uint64(hash.Sum32())
}

// kubernetes/pkg/util/hash/hash.go: 28
func DeepHashObject(hasher hash.Hash, objectToWrite interface{}) {
	hasher.Reset()
	printer := spew.ConfigState{
		Indent:         " ",
		SortKeys:       true,
		DisableMethods: true,
		SpewKeys:       true,
	}
	printer.Fprintf(hasher, "%#v", objectToWrite)
}
```

通过对比代码可以看到，哈希算法没有变化，那么导致哈希值不同的原因只能是`输入`发生了变化。

1.9.11中的Container定义：

```go
type Container struct {
    Name string `json:"name" protobuf:"bytes,1,opt,name=name"`
    Image string `json:"image,omitempty" protobuf:"bytes,2,opt,name=image"`
    Command []string `json:"command,omitempty" protobuf:"bytes,3,rep,name=command"`
    Args []string `json:"args,omitempty" protobuf:"bytes,4,rep,name=args"`
    WorkingDir string `json:"workingDir,omitempty" protobuf:"bytes,5,opt,name=workingDir"`
    Ports []ContainerPort `json:"ports,omitempty" patchStrategy:"merge" patchMergeKey:"containerPort" protobuf:"bytes,6,rep,name=ports"`
    EnvFrom []EnvFromSource `json:"envFrom,omitempty" protobuf:"bytes,19,rep,name=envFrom"`
    Env []EnvVar `json:"env,omitempty" patchStrategy:"merge" patchMergeKey:"name" protobuf:"bytes,7,rep,name=env"`
    Resources ResourceRequirements `json:"resources,omitempty" protobuf:"bytes,8,opt,name=resources"`
    VolumeMounts []VolumeMount `json:"volumeMounts,omitempty" patchStrategy:"merge" patchMergeKey:"mountPath" protobuf:"bytes,9,rep,name=volumeMounts"`
    VolumeDevices []VolumeDevice `json:"volumeDevices,omitempty" patchStrategy:"merge" patchMergeKey:"devicePath" protobuf:"bytes,21,rep,name=volumeDevices"`
    LivenessProbe *Probe `json:"livenessProbe,omitempty" protobuf:"bytes,10,opt,name=livenessProbe"`
    ReadinessProbe *Probe `json:"readinessProbe,omitempty" protobuf:"bytes,11,opt,name=readinessProbe"`
    Lifecycle *Lifecycle `json:"lifecycle,omitempty" protobuf:"bytes,12,opt,name=lifecycle"`
    TerminationMessagePath string `json:"terminationMessagePath,omitempty" protobuf:"bytes,13,opt,name=terminationMessagePath"`
    TerminationMessagePolicy TerminationMessagePolicy `json:"terminationMessagePolicy,omitempty" protobuf:"bytes,20,opt,name=terminationMessagePolicy,casttype=TerminationMessagePolicy"`
    ImagePullPolicy PullPolicy `json:"imagePullPolicy,omitempty" protobuf:"bytes,14,opt,name=imagePullPolicy,casttype=PullPolicy"`
    SecurityContext *SecurityContext `json:"securityContext,omitempty" protobuf:"bytes,15,opt,name=securityContext"`
    Stdin bool `json:"stdin,omitempty" protobuf:"varint,16,opt,name=stdin"`
    StdinOnce bool `json:"stdinOnce,omitempty" protobuf:"varint,17,opt,name=stdinOnce"`
    TTY bool `json:"tty,omitempty" protobuf:"varint,18,opt,name=tty"`
}
```

1.7.16中的Container定义：

```go
type Container struct {
	Name string `json:"name" protobuf:"bytes,1,opt,name=name"`
	Image string `json:"image" protobuf:"bytes,2,opt,name=image"`
	Command []string `json:"command,omitempty" protobuf:"bytes,3,rep,name=command"`
	Args []string `json:"args,omitempty" protobuf:"bytes,4,rep,name=args"`
	WorkingDir string `json:"workingDir,omitempty" protobuf:"bytes,5,opt,name=workingDir"`
	Ports []ContainerPort `json:"ports,omitempty" patchStrategy:"merge" patchMergeKey:"containerPort" protobuf:"bytes,6,rep,name=ports"`
	EnvFrom []EnvFromSource `json:"envFrom,omitempty" protobuf:"bytes,19,rep,name=envFrom"`
	Env []EnvVar `json:"env,omitempty" patchStrategy:"merge" patchMergeKey:"name" protobuf:"bytes,7,rep,name=env"`
	Resources ResourceRequirements `json:"resources,omitempty" protobuf:"bytes,8,opt,name=resources"`
	VolumeMounts []VolumeMount `json:"volumeMounts,omitempty" patchStrategy:"merge" patchMergeKey:"mountPath" protobuf:"bytes,9,rep,name=volumeMounts"`
	LivenessProbe *Probe `json:"livenessProbe,omitempty" protobuf:"bytes,10,opt,name=livenessProbe"`
	ReadinessProbe *Probe `json:"readinessProbe,omitempty" protobuf:"bytes,11,opt,name=readinessProbe"`
	Lifecycle *Lifecycle `json:"lifecycle,omitempty" protobuf:"bytes,12,opt,name=lifecycle"`
	TerminationMessagePath string `json:"terminationMessagePath,omitempty" protobuf:"bytes,13,opt,name=terminationMessagePath"`
	TerminationMessagePolicy TerminationMessagePolicy `json:"terminationMessagePolicy,omitempty" protobuf:"bytes,20,opt,name=terminationMessagePolicy,casttype=TerminationMessagePolicy"`
	ImagePullPolicy PullPolicy `json:"imagePullPolicy,omitempty" protobuf:"bytes,14,opt,name=imagePullPolicy,casttype=PullPolicy"`
	SecurityContext *SecurityContext `json:"securityContext,omitempty" protobuf:"bytes,15,opt,name=securityContext"`
	Stdin bool `json:"stdin,omitempty" protobuf:"varint,16,opt,name=stdin"`
	StdinOnce bool `json:"stdinOnce,omitempty" protobuf:"varint,17,opt,name=stdinOnce"`
	TTY bool `json:"tty,omitempty" protobuf:"varint,18,opt,name=tty"`
}
```

仔细对比发现，1.9.11的Container定义中多出了一个字段：

```go
VolumeDevices []VolumeDevice `json:"volumeDevices,omitempty" patchStrategy:"merge" patchMergeKey:"devicePath" protobuf:"bytes,21,rep,name=volumeDevices"`
```

因此是Container定义发生了变化，导致哈希值发生了变化。

## 解决方法

只能通过改代码了，1.9.11版本计算出的hash值和1.7.16版本计算出的哈希值不相同，是因为Container的定义发生了变化，那就从Container中抽取出部分字段，组成一个新的结构体作为hash算法的输入。

先修改代码，将hash算法的输入字符串打印出来对比：

```
1.9.11：

I0118 13:38:29.285449   18645 hash.go:39] hashstr is before: (v1.Container){Name:(string)prometheus-node-exporter Image:(string)harbor.finupgroup.com/kubernetes/node-exporter:v0.16.0 Command:([]string    )<nil> Args:([]string)<nil> WorkingDir:(string) Ports:([]v1.ContainerPort)[{Name:(string)prom-node-exp HostPort:(int32)9100 ContainerPort:(int32)9100 Protocol:(v1.Protocol)TCP HostIP:(string)}] EnvFro    m:([]v1.EnvFromSource)<nil> Env:([]v1.EnvVar)<nil> Resources:(v1.ResourceRequirements){Limits:(v1.ResourceList)<nil> Requests:(v1.ResourceList)<nil>} VolumeMounts:([]v1.VolumeMount)[{Name:(string)defa    ult-token-bks80 ReadOnly:(bool)true MountPath:(string)/var/run/secrets/kubernetes.io/serviceaccount SubPath:(string) MountPropagation:(*v1.MountPropagationMode)<nil>}] VolumeDevices:([]v1.VolumeDevice    )<nil> LivenessProbe:(*v1.Probe)<nil> ReadinessProbe:(*v1.Probe)<nil> Lifecycle:(*v1.Lifecycle)<nil> TerminationMessagePath:(string)/dev/termination-log TerminationMessagePolicy:(v1.TerminationMessage    Policy)File ImagePullPolicy:(v1.PullPolicy)IfNotPresent SecurityContext:(*v1.SecurityContext)<nil> Stdin:(bool)false StdinOnce:(bool)false TTY:(bool)false}

1.7.16：

I0118 13:53:05.394834   19753 hash.go:39] hashstr is before: (v1.Container){Name:(string)prometheus-node-exporter Image:(string)harbor.finupgroup.com/kubernetes/node-exporter:v0.16.0 Command:([]string    )<nil> Args:([]string)<nil> WorkingDir:(string) Ports:([]v1.ContainerPort)[{Name:(string)prom-node-exp HostPort:(int32)9100 ContainerPort:(int32)9100 Protocol:(v1.Protocol)TCP HostIP:(string)}] EnvFro    m:([]v1.EnvFromSource)<nil> Env:([]v1.EnvVar)<nil> Resources:(v1.ResourceRequirements){Limits:(v1.ResourceList)<nil> Requests:(v1.ResourceList)<nil>} VolumeMounts:([]v1.VolumeMount)[{Name:(string)defa    ult-token-bks80 ReadOnly:(bool)true MountPath:(string)/var/run/secrets/kubernetes.io/serviceaccount SubPath:(string)}] LivenessProbe:(*v1.Probe)<nil> ReadinessProbe:(*v1.Probe)<nil> Lifecycle:(*v1.Lif    ecycle)<nil> TerminationMessagePath:(string)/dev/termination-log TerminationMessagePolicy:(v1.TerminationMessagePolicy)File ImagePullPolicy:(v1.PullPolicy)IfNotPresent SecurityContext:(*v1.SecurityCon    text)<nil> Stdin:(bool)false StdinOnce:(bool)false TTY:(bool)false}
```

1.9.11相比1.7.16多出来的字符串（注意引号中的空格也算）：

	"VolumeDevices:([]v1.VolumeDevice)<nil> "
	" MountPropagation:(*v1.MountPropagationMode)<nil>"

直接简单粗暴地修改1.9.11的`pkg/util/hash/hash.go`，将1.9.11的Container定义改变导致多出的字符去掉：

```go
package hash

import (
	"github.com/davecgh/go-spew/spew"
	"github.com/golang/glog"
	"hash"
	"strings"
)

// DeepHashObject writes specified object to hash using the spew library
// which follows pointers and prints actual values of the nested objects
// ensuring the hash does not change when a pointer changes.
func DeepHashObject(hasher hash.Hash, objectToWrite interface{}) {
	hasher.Reset()
	printer := spew.ConfigState{
		Indent:         " ",
		SortKeys:       true,
		DisableMethods: true,
		SpewKeys:       true,
	}
	//printer.Fprintf(hasher, "%#v", objectToWrite)
	hashstr := printer.Sprintf("%#v", objectToWrite)
	glog.V(2).Infof("hashstr is before: %s", hashstr)
	hashstr = strings.Replace(hashstr, "VolumeDevices:([]v1.VolumeDevice)<nil> ", "", -1)
	hashstr = strings.Replace(hashstr, " MountPropagation:(*v1.MountPropagationMode)<nil>", "", -1)
	glog.V(2).Infof("hashstr is after : %s", hashstr)
	printer.Fprintf(hasher, "%s", hashstr)
}
```

实测可行，1.7.16和1.9.11来回切换，容器都不会重建。不过这可能不是一个非常理想的解决方案，只是能工作而已。
七牛提供了一个类似的解决方法，更完善一些：[Hack container hash method to make it compatible when upgrading cluster from 1.7/1.8 to 1.9.](https://github.com/qbox/kubernetes/pull/53)。
