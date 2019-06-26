---
layout: default
title: "Kubernetes 集群 Node 间歇性变为 NotReady 状态：IO 负载高，延迟严重"
author: 李佶澳
createdate: "2019-05-27 15:03:29 +0800"
changedate: "2019-06-26 15:21:34 +0800"
categories: 问题
tags: kubernetes
cover: 
keywords: kubernetes,NotReady,NodeNotReady
description: Kubernetes的node间歇性变成NodeNotReady，非常短暂，监听kubernetes集群的事件可以发现
---

* auto-gen TOC:
{:toc}

## 说明

Kubernetes 的 node 间歇性变成 NotReady，但是处于该状态的时间非常短暂，用 kubectl 观察一般看不到，通过监听 kubernetes 集群的事件可以发现，在日志中也能看到：

![kubernetes node NOTREADY]({{ site.imglocal }}/article/node-not-ready.png)

kubernetest 版本是 1.9.11。

## 分析日志

从日志入手，检查 kubelet 的日志没有发现有价值的线索，翻阅 kube-controller-manager 的日志，默认的日志级别只会打印事件信息，提供不了更多线索：

```sh
APIVersion:"", ResourceVersion:"", FieldPath:""}): type: 'Normal' reason: 'NodeNotReady' Node XXX status is now: NodeNotReady
```

将 kube-controller-manager 日志级别调整为 2，找到了一点线索：

```sh
3384 controller_utils.go:209] Recording status change NodeNotReady event message for node XXX
```

## 梳理代码

阅读 controller_utils.go:209 （版本 v1.9.11 ）的前后文代码，大概理清了思路，第 209 行代码只是记录日志和发送事件的代码：

```go
// controller_utils.go:209
// RecordNodeStatusChange records a event related to a node status change.
func RecordNodeStatusChange(recorder record.EventRecorder, node *v1.Node, newStatus string) {
    ref := &v1.ObjectReference{
        Kind:      "Node",
        Name:      node.Name,
        UID:       node.UID,
        Namespace: "",
    }
    glog.V(2).Infof("Recording status change %s event message for node %s", newStatus, node.Name)
    // TODO: This requires a transaction, either both node status is updated
    // and event is recorded or neither should happen, see issue #6055.
    recorder.Eventf(ref, v1.EventTypeNormal, newStatus, "Node %s status is now: %s", node.Name, newStatus)
}
```

重点是调用 RecordNodeStatusChange 函数的时机，调用代码位于 node_controller.go:753 行：

```go
// node_controller.go:753
func (nc *Controller) monitorNodeStatus() error {
    // We are listing nodes from local cache as we can tolerate some small delays
    // comparing to state from etcd and there is eventual consistency anyway.
    nodes, err := nc.nodeLister.List(labels.Everything())
    ...
    for i := range nodes {
        ...
            gracePeriod, observedReadyCondition, currentReadyCondition, err = nc.tryUpdateNodeStatus(node)
            ...
            // Report node event.
            if currentReadyCondition.Status != v1.ConditionTrue && observedReadyCondition.Status == v1.ConditionTrue {
                util.RecordNodeStatusChange(nc.recorder, node, "NodeNotReady")
                if err = util.MarkAllPodsNotReady(nc.kubeClient, node); err != nil {
                    utilruntime.HandleError(fmt.Errorf("Unable to mark all pods NotReady on node %v: %v", node.Name, err))
                }
            }
        ...
```

首先用`nc.nodeLister.List(labels.Everything())`取出所有的 node ，这一行代码上方很贴心地提示，这是从本地缓存提取的，会有一些延迟，但最终是和 etcd 一致的。

然后取出两个 observedReadyCondition、currentReadyCondition，observedReadyCondition 是 node 的原始状态，currentReadyCondition 是在 node 的原始状态的基础上调整生成的状态。

if 语句的逻辑是：如果 node 的原始状态是 Ready，调整之后变成了 NotReady，产生 NodeNotReady 事件。

因此问题焦点就是：什么情况下，原始的 Ready 状态会被调整为 NotReady ？

查看 nc.tryUpdateNodeStatus(node) 的实现得知，当前时间比 node 原始状态中的时间记录晚一个 `gracePeriod` 的时候，Status 会被设置为 "Unknown" （满足 != "True"）： 

```go
// node_controller.go: 1008
if nc.now().After(savedNodeStatus.probeTimestamp.Add(gracePeriod)) {
    // NodeReady condition was last set longer ago than gracePeriod, so update it to Unknown
    // (regardless of its current value) in the master.
    if currentReadyCondition == nil {
        glog.V(2).Infof("node %v is never updated by kubelet", node.Name)
        node.Status.Conditions = append(node.Status.Conditions, v1.NodeCondition{
            Type:               v1.NodeReady,
            Status:             v1.ConditionUnknown,
            Reason:             "NodeStatusNeverUpdated",
            Message:            fmt.Sprintf("Kubelet never posted node status."),
            LastHeartbeatTime:  node.CreationTimestamp,
            LastTransitionTime: nc.now(),
        })
    } else {
        glog.V(4).Infof("node %v hasn't been updated for %+v. Last ready condition is: %+v",
            node.Name, nc.now().Time.Sub(savedNodeStatus.probeTimestamp.Time), observedReadyCondition)
        if observedReadyCondition.Status != v1.ConditionUnknown {
            currentReadyCondition.Status = v1.ConditionUnknown
            currentReadyCondition.Reason = "NodeStatusUnknown"
            currentReadyCondition.Message = "Kubelet stopped posting node status."
            // LastProbeTime is the last time we heard from kubelet.
            currentReadyCondition.LastHeartbeatTime = observedReadyCondition.LastHeartbeatTime
            currentReadyCondition.LastTransitionTime = nc.now()
        }
    }
```

所以问题的原因是：对 node 状态的处理太晚了，可能是本地缓存的 node 信息更新太慢，也可能是 kube-controller-manager 处理太慢。

## 状态上传频率

检查参数，kube-controller-manager 默认 5 秒钟巡检一次，每次巡检是`串行`的，grace-period 是 40 秒，kubelet 每 10 秒上报一次。

kube-controller-manager 相关参数：

```sh
--node-monitor-period duration                 The period for syncing NodeStatus in NodeController. (default 5s)
--node-monitor-grace-period duration           Amount of time which we allow running Node to be unresponsive before marking it unhealthy.
                                               Must be N times more than kubelet\'s nodeStatusUpdateFrequency, where N means number of 
                                               retries allowed for kubelet to post node status. (default 40s)
--node-startup-grace-period duration           Amount of time which we allow starting Node to be unresponsive before marking it unhealthy. (default 1m0s)

```

kubelet 相关参数：

```sh
--node-status-update-frequency duration        Specifies how often kubelet posts node status to master. Note: be cautious when changing the constant, it 
                                               must work with nodeMonitorGracePeriod in nodecontroller. (default 10s)
```

调整这几个参数，譬如增加 grace-period 时间是不解决问题的。

## 继续跟踪

将日志级别调整为 4 ，观查滞后时间，记录滞后时间的日志格式如下： 

```sh
node %v hasn't been updated for %+v. Last ready condition is: %+v
```

再次出现该问题时，检查日志发现，node 的状态更新延迟最高达 2 分钟：

```sh
node_controller.go:1022] node xxxxxxxxx hasn't been updated for 2m5.699574064s. Last ready condition is: {Type:Ready Status:Unknown LastHeartbeatTime:2019-06-01 12:10:44 +0800 CST LastTransitionTime:2019-06-01 12:11:27 +0800 CST Reason:NodeStatusUnknown Message:Kubelet stopped posting node status.}
node_controller.go:1056] node xxxxxxxxx hasn't been updated for 2m5.699594105s. Last MemoryPressure is: &NodeCondition{Type:MemoryPressure,Status:Unknown,LastHeartbeatTime:2019-06-01 12:10:44 +0800 CST,LastTransitionTime:2019-06-01 12:11:27 +0800 CST,Reason:NodeStatusUnknown,Message:Kubelet stopped posting node status.,}
node_controller.go:1056] node xxxxxxxxx hasn't been updated for 2m5.699610878s. Last DiskPressure is: &NodeCondition{Type:DiskPressure,Status:Unknown,LastHeartbeatTime:2019-06-01 12:10:44 +0800 CST,LastTransitionTime:2019-06-01 12:11:27 +0800 CST,Reason:NodeStatusUnknown,Message:Kubelet stopped posting node status.,}
```

怀疑是 kubelet 的原因，找到更新 node 状态的代码：

```go
// pkg/kubelet/kubelet.go: 1405
go wait.Until(kl.syncNodeStatus, kl.nodeStatusUpdateFrequency, wait.NeverStop)
```

把前后代码都看了一边，如果 kubelet 调用 kube-apiserver 的接口失败，应当打印错误日志：

```go
// pkg/kubelet/kubele_node_status.go: 379
// updateNodeStatus updates node status to master with retries.
func (kl *Kubelet) updateNodeStatus() error {
	for i := 0; i < nodeStatusUpdateRetry; i++ {
		if err := kl.tryUpdateNodeStatus(i); err != nil {
			if i > 0 && kl.onRepeatedHeartbeatFailure != nil {
				kl.onRepeatedHeartbeatFailure()
			}
			glog.Errorf("Error updating node status, will retry: %v", err)
		} else {
			return nil
		}
	}
	return fmt.Errorf("update node status exceeds retry count")
}
```

检查 kubelet 日志，发现了几个错误日志，这些错误日志和触发的 NotReady `不是一一对应的`， 但是提供了很重要的线索 `etcdserver: request timed out`：

```sh
E0610 10:11:43.885472   25700 kubelet_node_status.go:386] Error updating node status, will retry: failed to patch status "{\"status\":{\"$setElementOrder/conditions\":[{\"type\":\"OutOfDisk\"},{\"type\":\"MemoryPressure\"},{\"type\":\"DiskPressure\"},{\"type\":\"Ready\"}],\"conditions\":[{\"lastHeartbeatTime\":\"2019-06-10T02:11:36Z\",\"type\":\"OutOfDisk\"},{\"lastHeartbeatTime\":\"2019-06-10T02:11:36Z\",\"type\":\"MemoryPressure\"},{\"lastHeartbeatTime\":\"2019-06-10T02:11:36Z\",\"type\":\"DiskPressure\"},{\"lastHeartbeatTime\":\"2019-06-10T02:11:36Z\",\"type\":\"Ready\"}]}}" for node "XXXX-40-237": etcdserver: request timed out, possibly due to previous leader failure
E0618 03:10:11.508639   25700 kubelet_node_status.go:386] Error updating node status, will retry: failed to patch status "{\"status\":{\"$setElementOrder/conditions\":[{\"type\":\"OutOfDisk\"},{\"type\":\"MemoryPressure\"},{\"type\":\"DiskPressure\"},{\"type\":\"Ready\"}],\"conditions\":[{\"lastHeartbeatTime\":\"2019-06-17T19:10:04Z\",\"type\":\"OutOfDisk\"},{\"lastHeartbeatTime\":\"2019-06-17T19:10:04Z\",\"type\":\"MemoryPressure\"},{\"lastHeartbeatTime\":\"2019-06-17T19:10:04Z\",\"type\":\"DiskPressure\"},{\"lastHeartbeatTime\":\"2019-06-17T19:10:04Z\",\"type\":\"Ready\"}]}}" for node "XXXX-40-237": etcdserver: request timed out, possibly due to previous leader failure
```

这个错误是向 kube-apiserver 提交 node 状态时发生的：

```go
// pkg/util/node/node.go: 190
func PatchNodeStatus(c v1core.CoreV1Interface, nodeName types.NodeName, oldNode *v1.Node, newNode *v1.Node) (*v1.Node, error) {
...
	updatedNode, err := c.Nodes().Patch(string(nodeName), types.StrategicMergePatchType, patchBytes, "status")
	if err != nil {
		return nil, fmt.Errorf("failed to patch status %q for node %q: %v", patchBytes, nodeName, err)
	}
	return updatedNode, nil
...
```

**会是 apiserver -> etcd 的过程有问题吗？** 

将 kube-apiserver 的日志级别调整为 2，继续观察。

## 更新请求达到 kube-apiserver 时已经延迟

kube-apiserver 的日志级别调整后，获取到了每个请求的到达时间。kube-controller-manager 的日志显示 node 状态上次 更新时间为 `16:37:25 +0800`，16:38:30 的时候因为超过 1 分钟没有更新，变为 NodeNotReady：

```sh
I0621 16:38:30.582437   19525 node_controller.go:1022] node node-xxx-36-174 hasn't been updated for 1m0.063536447s. Last ready condition is: {Type:Ready Status:True LastHeartbeatTime:2019-06-21 16:37:25 +0800 CST LastTransitionTime:2019-06-16 13:31:48 +0800 CST Reason:KubeletReady Message:kubelet is posting ready status}
I0621 16:38:30.582542   19525 node_controller.go:1056] node node-xxx-36-174 hasn't been updated for 1m0.06364353s. Last MemoryPressure is: &NodeCondition{Type:MemoryPressure,Status:False,LastHeartbeatTime:2019-06-21 16:37:25 +0800 CST,LastTransitionTime:2019-06-16 13:31:48 +0800 CST,Reason:KubeletHasSufficientMemory,Message:kubelet has sufficient memory available,}
I0621 16:38:30.582596   19525 node_controller.go:1056] node node-xxx-36-174 hasn't been updated for 1m0.063696887s. Last DiskPressure is: &NodeCondition{Type:DiskPressure,Status:False,LastHeartbeatTime:2019-06-21 16:37:25 +0800 CST,LastTransitionTime:2019-06-16 13:31:48 +0800 CST,Reason:KubeletHasNoDiskPressure,Message:kubelet has no disk pressure,}
I0621 16:38:30.587861   19525 controller_utils.go:209] Recording status change NodeNotReady event message for node node-xxx-36-174
I0621 16:38:30.587921   19525 controller_utils.go:140] Update ready status of pods on node [node-xxx-36-174]
I0621 16:38:30.588469   19525 event.go:218] Event(v1.ObjectReference{Kind:"Node", Namespace:"", Name:"node-xxx-36-174", UID:"c45223c8-858a-11e8-8f09-525400dd6f19", APIVersion:"", ResourceVersion:"", FieldPath:""}): type: 'Normal' reason: 'NodeNotReady' Node node-xxx-36-174 status is now: NodeNotReady
```

查看 kube-apiserver 的日志，发现 kubelet 在 16:37:25 提交一次状态后，下次提交延迟了 1 分钟以上：

```sh
I0621 16:37:25.722896   20184 wrap.go:42] PATCH /api/v1/nodes/node-xxx-36-174/status: (6.452494ms) 200 [[kubelet/v0.0.0 (linux/amd64) kubernetes/$Format] 10.19.36.174:56686]
I0621 16:38:54.439074   20184 wrap.go:42] PATCH /api/v1/nodes/node-xxx-36-174/status: (6.404388ms) 200 [[kubelet/v0.0.0 (linux/amd64) kubernetes/$Format] 10.19.36.174:56686]
I0621 16:39:28.558555   20184 wrap.go:42] PATCH /api/v1/nodes/node-xxx-36-174/status: (5.707548ms) 200 [[kubelet/v0.0.0 (linux/amd64) kubernetes/$Format] 10.19.36.174:56686]
I0621 16:39:38.578372   20184 wrap.go:42] PATCH /api/v1/nodes/node-xxx-36-174/status: (5.609882ms) 200 [[kubelet/v0.0.0 (linux/amd64) kubernetes/$Format] 10.19.36.174:56686]
I0621 16:39:48.595442   20184 wrap.go:42] PATCH /api/v1/nodes/node-xxx-36-174/status: (6.052146ms) 200 [[kubelet/v0.0.0 (linux/amd64) kubernetes/$Format] 10.19.36.174:56686]
I0621 16:39:58.613101   20184 wrap.go:42] PATCH /api/v1/nodes/node-xxx-36-174/status: (5.451522ms) 200 [[kubelet/v0.0.0 (linux/amd64) kubernetes/$Format] 10.19.36.174:56686]
```

请求到达 kube-apiserver 时已经延迟了，kube-apiserver -> etcd 的环节可以排除了。

为什么会等了这么久才发起更新？回到 kubelet 中找答案。

## 为 kubelet 添加日志代码

因为 1.9.11 版本的 kubelet 提交 node 状态时没有日志，添加日志代码后，再次观察：

```go
// pkg/kubelet/kubelet_node_status.go: 396
func (kl *Kubelet) tryUpdateNodeStatus(tryNumber int) error {
    glog.V(5).Infof("NOTREADY SURVEY: try update node status, tryNumber is %d", tryNumber)
    opts := metav1.GetOptions{}
    if tryNumber == 0 {
        util.FromApiserverCache(&opts)
    }
    glog.V(5).Infof("NOTREADY SURVEY: heartbeatClient, node is %s", kl.nodeName)
    node, err := kl.heartbeatClient.Nodes().Get(string(kl.nodeName), opts)
    if err != nil {
        return fmt.Errorf("error getting node %q: %v", kl.nodeName, err)
    }

    originalNode := node.DeepCopy()
    if originalNode == nil {
        return fmt.Errorf("nil %q node object", kl.nodeName)
    }

    glog.V(5).Infof("NOTREADY SURVEY: updatePodCIDR, node is %s", node.Spec.PodCIDR)
    kl.updatePodCIDR(node.Spec.PodCIDR)

    kl.setNodeStatus(node)

    glog.V(5).Infof("NOTREADY SURVEY: patch node status, node is %s", kl.nodeName)
    updatedNode, err := nodeutil.PatchNodeStatus(kl.heartbeatClient, types.NodeName(kl.nodeName), originalNode, node)
    if err != nil {
        return err
    }
    kl.volumeManager.MarkVolumesAsReportedInUse(updatedNode.Status.VolumesInUse)
    return nil
}
```

很快又遇到了，kube-controller-manager 日志显示, 08:42:40 之后的更新发生了延迟，触发了 NotReady 认定：

```sh
node XXXXX hasn't been updated for 1m0.059730854s. Last ready condition is: {Type:Ready Status:True LastHeartbeatTime:2019-06-25 08:42:40 +0800 CST LastTransitionTime:2019-06-25 08:41:11 +0800 CST Reason:KubeletReady Message:kubelet is posting ready status}
```

从 kube-apiserver 的日志可以看到 08:42:40 有一次更新请求，下一次更新请求是 08:44:21，延迟了 1 分 30 秒：

```sh
# 正常
I0625 08:42:40.888966   19867 wrap.go:42] GET /api/v1/nodes/XXXXX?resourceVersion=0: (962.828<C2><B5>s) 200 [[kubelet/v1.9.11 (linux/amd64) kubernetes/9aafe17] 10.19.35.129:40554]
I0625 08:42:40.902182   19867 wrap.go:42] PATCH /api/v1/nodes/XXXXX/status: (5.647934ms) 200 [[kubelet/v1.9.11 (linux/amd64) kubernetes/9aafe17] 10.19.35.129:40554]

# 提交新的状态的时机延迟了 1 分 30 秒，且 GET 和 PATCH 间隔了 65 秒：
I0625 08:43:16.880865   19867 wrap.go:42] GET /api/v1/nodes/XXXXX?resourceVersion=0: (1.42937ms) 200 [[kubelet/v1.9.11 (linux/amd64) kubernetes/9aafe17] 10.19.35.129:40554]
I0625 08:44:21.722785   19867 wrap.go:42] PATCH /api/v1/nodes/XXXXX/status: (5.696645ms) 200 [[kubelet/v1.9.11 (linux/amd64) kubernetes/9aafe17] 10.19.35.129:40554]

# 提交延迟了 30 秒以上
I0625 08:45:06.949299   19867 wrap.go:42] GET /api/v1/nodes/XXXXX?resourceVersion=0: (1.612862ms) 200 [[kubelet/v1.9.11 (linux/amd64) kubernetes/9aafe17] 10.19.35.129:40554]
I0625 08:45:06.972904   19867 wrap.go:42] PATCH /api/v1/namespaces/default/events/XXXXX.15ab2937eddfdbd4: (12.42918ms) 200 [[kubelet/v1.9.11 (linux/amd64) kubernetes/9aafe17] 10.19.35.129:4
```

从 kubelet 日志可以看到，08:42:40 分的更新非常迅速，接下来的两次更新则非常耗时，然后又恢复了正常：

```sh
# 正常更新无延迟
I0625 08:42:40.915180   28911 kubelet_node_status.go:403] NOTREADY SURVEY: try update node status, tryNumber is 0
I0625 08:42:40.915201   28911 kubelet_node_status.go:408] NOTREADY SURVEY: heartbeatClient, node is XXXXX
I0625 08:42:40.917055   28911 kubelet_node_status.go:419] NOTREADY SURVEY: updatePodCIDR, node is
I0625 08:42:40.922501   28911 kubelet_node_status.go:424] NOTREADY SURVEY: patch node status, node is XXXXX

# 定时更新正常启动，但是最终提交更新的时间延迟 1 分 30 秒
I0625 08:42:50.930319   28911 kubelet_node_status.go:403] NOTREADY SURVEY: try update node status, tryNumber is 0
I0625 08:43:16.913674   28911 kubelet_node_status.go:408] NOTREADY SURVEY: heartbeatClient, node is XXXXX
I0625 08:43:16.916334   28911 kubelet_node_status.go:419] NOTREADY SURVEY: updatePodCIDR, node is
I0625 08:44:21.723264   28911 kubelet_node_status.go:424] NOTREADY SURVEY: patch node status, node is XXXXX

# 定时更新正常启动，最终提交时间延迟 30 秒
I0625 08:44:31.760191   28911 kubelet_node_status.go:403] NOTREADY SURVEY: try update node status, tryNumber is 0
I0625 08:45:06.986980   28911 kubelet_node_status.go:408] NOTREADY SURVEY: heartbeatClient, node is XXXXX
I0625 08:45:06.991113   28911 kubelet_node_status.go:419] NOTREADY SURVEY: updatePodCIDR, node is
I0625 08:45:06.999802   28911 kubelet_node_status.go:424] NOTREADY SURVEY: patch node status, node is XXXXX

# 恢复正常
I0625 08:45:17.018406   28911 kubelet_node_status.go:403] NOTREADY SURVEY: try update node status, tryNumber is 0
I0625 08:45:17.018421   28911 kubelet_node_status.go:408] NOTREADY SURVEY: heartbeatClient, node is XXXXX
I0625 08:45:17.020870   28911 kubelet_node_status.go:419] NOTREADY SURVEY: updatePodCIDR, node is
I0625 08:45:17.026053   28911 kubelet_node_status.go:424] NOTREADY SURVEY: patch node status, node is XXXXX
```

根据日志整理一下代码各阶段耗时：

```go
// 08:42:50 开始，耗时 26 秒
glog.V(5).Infof("NOTREADY SURVEY: try update node status, tryNumber is %d", tryNumber)
opts := metav1.GetOptions{}
if tryNumber == 0 {
    util.FromApiserverCache(&opts)
}

// 08:43:16 开始，耗时 0.xx 秒，到达 apiserver 耗时不到 1 秒
glog.V(5).Infof("NOTREADY SURVEY: heartbeatClient, node is %s", kl.nodeName)
node, err := kl.heartbeatClient.Nodes().Get(string(kl.nodeName), opts)
if err != nil {
    return fmt.Errorf("error getting node %q: %v", kl.nodeName, err)
}

originalNode := node.DeepCopy()
if originalNode == nil {
    return fmt.Errorf("nil %q node object", kl.nodeName)
}

// 08:43:16 开始，耗时 65 秒
glog.V(5).Infof("NOTREADY SURVEY: updatePodCIDR, node is %s", node.Spec.PodCIDR)
kl.updatePodCIDR(node.Spec.PodCIDR)

kl.setNodeStatus(node)

// 08:44:21 开始，到达 apiserver 耗时不到 1 秒。
glog.V(5).Infof("NOTREADY SURVEY: patch node status, node is %s", kl.nodeName)
updatedNode, err := nodeutil.PatchNodeStatus(kl.heartbeatClient, types.NodeName(kl.nodeName), originalNode, node)
if err != nil {
    return err
}
```

kubelet 到 apiserver 的耗时几乎可以忽略不计，大部分延迟发生在 kubelet 自身的几行简单代码上！第一段代码极其简单，竟然消耗了 26 秒，非常不正常，耗时最长的一段操作是获取 Pod 的状态和填充 Node 的状态。
而紧跟的下一次更新延迟了 30 秒，延迟全部发生在第一段非常非常简单的代码：

```go
// 08:44:31 开始，耗时 30 秒：
glog.V(5).Infof("NOTREADY SURVEY: try update node status, tryNumber is %d", tryNumber)
opts := metav1.GetOptions{}
if tryNumber == 0 {
    util.FromApiserverCache(&opts)
}
```

由此断定这里遇到的问题与 [kubelet fails to heartbeat with API server with stuck TCP connections #48638](https://github.com/kubernetes/kubernetes/issues/48638)（对应的 pullrequest： [track/close kubelet->API connections on heartbeat failure ](https://github.com/kubernetes/kubernetes/pull/63492)）、[kubelet stopped posting node status, seems to be hung #75846](https://github.com/kubernetes/kubernetes/issues/75846) 不是同一个问题。

问题根源在 kubelet 上，kubelet 进程在执行过程中突然`暂停`了一段时间，可能是 Go 语言自身机制导致的，也可能是系统异常导致的。

## 观察 kubelet 进程状态

用 top 观察 kubelet 进程状态，发现 wa（wa, IO-wait : time waiting for I/O completion）占比偏高，经常超过 15% 。

```sh
$ top -p 24342
top - 17:40:56 up 547 days,  6:10,  3 users,  load average: 7.02, 6.83, 6.59
Tasks:   1 total,   0 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu(s):  1.2 us,  0.2 sy,  0.0 ni, 80.6 id, 18.1 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem : 32813276 total,  7235080 free, 10777444 used, 14800752 buff/cache
KiB Swap:        0 total,        0 free,        0 used. 19434460 avail Mem
```

键入 `H` 切换到线程模式会发现时不时有一个 kubelet 线程的状态是 D，并会持续几秒到十几秒的时间。

用 iostat 查看，发现两个磁盘的 w_await 很高，有时候能达到 20 秒！同时 %util 长时间是 100%，磁盘处于过饱和状态。

```sh
$ iostat -d -x 2
Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     0.00   10.00   11.00    60.00 11296.00  1081.52   126.62 5874.76   54.70 11165.73  47.62 100.00
vdb               0.00     0.00    0.00    0.00     0.00     0.00     0.00   128.00    0.00    0.00    0.00   0.00 100.00

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     0.00   17.00    0.00   100.00     0.00    11.76   128.00   70.24   70.24    0.00  58.82 100.00
vdb               0.00    10.00    0.00   12.00     0.00  6684.00  1114.00   127.97 11913.42    0.00 11913.42  83.33 100.00

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     1.00   29.00   12.00   252.00  7340.50   370.37   127.69 3453.02  106.55 11540.33  24.39 100.00
vdb               0.00     2.00    0.00   31.00     0.00 16400.00  1058.06   123.11 8431.26    0.00 8431.26  32.26 100.00

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     0.00    2.00   16.00    12.00 16364.50  1819.61   121.15 8499.33  178.00 9539.50  55.56 100.00
vdb               0.00     0.00    0.00    0.00     0.00     0.00     0.00   121.00    0.00    0.00    0.00   0.00 100.00

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     4.00    6.00   10.00    56.00 10284.00  1292.50   125.88 12701.31    8.33 20317.10  62.50 100.00
vdb               0.00     0.00    0.00   15.00     0.00  8200.00  1093.33   126.94 5351.00    0.00 5351.00  66.67 100.00
```

用 `pidstat -d 3` 找到 IO 操作频繁的进程，发现有一个 java 进程和 dockerd 在执行的大量的写操作：

```sh
$ pidstat -d 3
05:49:45 PM   UID       PID   kB_rd/s   kB_wr/s kB_ccwr/s  Command
05:49:46 PM     0     11709      0.00   5032.00      0.00  dockerd
05:49:46 PM     0     18686      0.00  14500.00      0.00  java

05:53:40 PM   UID       PID   kB_rd/s   kB_wr/s kB_ccwr/s  Command
05:53:43 PM     0     11709      0.00  29128.00      0.00  dockerd
05:53:43 PM     0     17665   5976.00      0.00      0.00  filebeat
05:53:43 PM     0     18686      0.00  59776.00      0.00  java
05:53:43 PM     0     23429      0.00      9.33      0.00  kworker/u48:3
```

通过 java 进程号找到了容器，该容器正在大量写日志，容器目录中文件已经 12G：

```sh
$ ls -lh
total 13G
drwx------ 2 root root    6 Jun 21 14:50 checkpoints
-rw-r--r-- 1 root root  11K Jun 21 14:50 config.v2.json
-rw-r----- 1 root root  12G Jun 25 17:57 dbef3588aa6d495ae36796b46a285f5397776b11ade70c67097b2a915851fc0d-json.log
-rw-r--r-- 1 root root 1.9K Jun 21 14:50 hostconfig.json
```

把运行有该容器的 node 全部找出来，发现间歇性 NotReady 的 node 上都运行有这个容器，不会这么巧吧？

查了一下没有该容器、也没有间歇 NotReady 的 node，IO 负载非常低：

```sh
$ iostat -d -x 2
Linux 4.1.0-17.el7.ucloud.x86_64 (p-k8s-node58-11-12) 	06/25/2019 	_x86_64_	(16 CPU)

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     0.42    1.65    2.93     7.85   112.58    52.61     0.02    3.40    0.17    5.23   0.26   0.12
vdb               0.00     0.02    0.04    0.53     4.02    94.80   343.88     0.02   29.27    3.90   31.26   1.39   0.08

Device:         rrqm/s   wrqm/s     r/s     w/s    rkB/s    wkB/s avgrq-sz avgqu-sz   await r_await w_await  svctm  %util
vda               0.00     0.00    0.50    1.00     4.00     5.25    12.33     0.03   18.00   52.00    1.00  18.00   2.70
vdb               0.00     0.00    0.00    1.00     0.00    10.75    21.50     0.00    1.00    0.00    1.00   1.00   0.10

$ pidstat -d 2
Linux 4.1.0-17.el7.ucloud.x86_64 (p-k8s-node58-11-12) 	06/25/2019 	_x86_64_	(16 CPU)

06:04:13 PM   UID       PID   kB_rd/s   kB_wr/s kB_ccwr/s  Command
06:04:15 PM     0      4846      0.00    601.98      0.00  dockerd
06:04:15 PM     0      7535      0.00      5.94      0.00  filebeat
06:04:15 PM     0      7671      0.00     41.58      0.00  java
06:04:15 PM     0     21839      0.00      1.98      0.00  kube-proxy
06:04:15 PM     0     24253      0.00     13.86      0.00  kubelet
06:04:15 PM     0     27068      0.00      1.98      0.00  java

06:04:15 PM   UID       PID   kB_rd/s   kB_wr/s kB_ccwr/s  Command
06:04:17 PM     0      4846      0.00    288.00      0.00  dockerd
06:04:17 PM     0      7671      0.00   1092.00      0.00  java
06:04:17 PM     0     24253      0.00      2.00      0.00  kubelet
```

另外还发现一个特别有趣的现象，经常 NotReady 的 node 的 cadvisor 数据获取有时候非常慢，需要 10 秒乃至 20 秒以上：

```sh
$ curl -k https://XX.XX.XX.4:10250/metrics/cadvisor >1.log
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  877k  100  877k    0     0  78414      0  0:00:11  0:00:11 --:--:--  203k

$ curl -k https://XX.XX.XX.4:10250/metrics/cadvisor >1.log
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  877k  100  877k    0     0  39923      0  0:00:22  0:00:22 --:--:--  199k
```

其它 node 是秒回：

```sh
$ curl  -k https://XX.XX.XX.12:10250/metrics/cadvisor >1.log
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  637k  100  637k    0     0  5796k      0 --:--:-- --:--:-- --:--:-- 5849k
```

而 Prometheus 每 15秒就会调一次该接口。

## 解决方法

先联系业务方减少日志量，然后研究下有没有限制的方法。

业务方关闭标准输出日志后，恢复正常。Docker 的容器日志相关配置见 [Docker Document][3] 中的 `log-driver` 和 `log-opts`。

公众号【我的网课】回顾文章：[Kubernetes集群Node间歇性NotReady，查到最后竟然是这个原因][2]。

## 参考

1. [李佶澳的博客笔记][1]
2. [Kubernetes集群Node间歇性NotReady，查到最后竟然是这个原因][2]
3. [Docker Document][3]

[1]: https://www.lijiaocn.com "李佶澳的博客笔记"
[2]: https://mp.weixin.qq.com/s/aNt1uI1RWf73Y3Dd6gmnLg "Kubernetes集群Node间歇性NotReady，查到最后竟然是这个原因"
[3]: https://docs.docker.com/engine/reference/commandline/dockerd/ "Docker Document"
