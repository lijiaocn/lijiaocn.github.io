---
layout: default
title: "Kubernetes集群的Node间歇性变更为NodeNotReady状态"
author: 李佶澳
createdate: "2019-05-27 15:03:29 +0800"
changedate: "2019-06-04 10:41:27 +0800"
categories: 问题
tags: kubernetes
cover: 
keywords: kubernetes,NotReady,NodeNotReady
description: Kubernetes的node间歇性变成NodeNotReady，非常短暂，监听kubernetes集群的事件可以发现
---

* auto-gen TOC:
{:toc}

## 说明

Kubernetes的node间歇性变成NodeNotReady，但是处于该状态的时间非常短暂，用kubectl观察一般看不到，通过监听kubernetes集群的事件可以发现，在日志中也能看到：

![kubernetes node NOTREADY]({{ site.imglocal }}/article/node-not-ready.png)

## 分析日志

从日志入手，检查kubelet的日志没有发现有价值的线索，翻阅kube-controller-manager的日志，默认的日志级别只会打印事件信息，提供不了更多线索：

```sh
APIVersion:"", ResourceVersion:"", FieldPath:""}): type: 'Normal' reason: 'NodeNotReady' Node XXX status is now: NodeNotReady
```

将kube-controller-manager日志级别调整为2，找到了一点线索：

```sh
3384 controller_utils.go:209] Recording status change NodeNotReady event message for node XXX
```

## 梳理代码

阅读 controller_utils.go:209 的前后文代码，大概理清了思路，第209行代码只是记录日志和发送事件的代码：

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

重点是调用RecordNodeStatusChange函数的时机，调用代码位于node_controller.go:753行：

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

首先用`nc.nodeLister.List(labels.Everything())`取出所有的node，这一行代码上方很贴心的提示，这是从本地缓存提取的，会有一些延迟，但最终是和etcd一致的。

然后取出两个 observedReadyCondition、currentReadyCondition，observedReadyCondition 是 node 的原始状态，currentReadyCondition 是在 node 的原始状态的基础上调整后生成的状态。

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

所以问题的原因是：对node状态的处理太晚了。晚的原因可能是本地缓存的node信息更新太慢，也可能是kube-controller-manager处理太慢。

## 继续分析 

检查参数，默认5秒钟巡检一次，每次巡检是`串行`的，grace-period 是 40 秒，kubelet 每 10 秒上报一次。

kube-controller-manager 相关参数：

```sh
--node-monitor-period duration                 The period for syncing NodeStatus in NodeController. (default 5s)
--node-monitor-grace-period duration           Amount of time which we allow running Node to be unresponsive before marking it unhealthy.
                                               Must be N times more than kubelet's nodeStatusUpdateFrequency, where N means number of 
                                               retries allowed for kubelet to post node status. (default 40s)
--node-startup-grace-period duration           Amount of time which we allow starting Node to be unresponsive before marking it unhealthy. (default 1m0s)

```

kubelet 相关参数：

```sh
--node-status-update-frequency duration        Specifies how often kubelet posts node status to master. Note: be cautious when changing the constant, it 
                                               must work with nodeMonitorGracePeriod in nodecontroller. (default 10s)
```

## 解决方法

将日志级别调整为 4 ，观查滞后时间，然后根据情况调整参数。

记录滞后时间的日志格式： 

```sh
node %v hasn't been updated for %+v. Last ready condition is: %+v
```

## 继续跟踪

调整日志级别，再次出现该问题时，检查日志发现，node 的状态更新延迟最高达 2 分钟，需要继续调查。

```sh
node_controller.go:1022] node xxxxxxxxx hasn't been updated for 2m5.699574064s. Last ready condition is: {Type:Ready Status:Unknown LastHeartbeatTime:2019-06-01 12:10:44 +0800 CST LastTransitionTime:2019-06-01 12:11:27 +0800 CST Reason:NodeStatusUnknown Message:Kubelet stopped posting node status.}
node_controller.go:1056] node xxxxxxxxx hasn't been updated for 2m5.699594105s. Last MemoryPressure is: &NodeCondition{Type:MemoryPressure,Status:Unknown,LastHeartbeatTime:2019-06-01 12:10:44 +0800 CST,LastTransitionTime:2019-06-01 12:11:27 +0800 CST,Reason:NodeStatusUnknown,Message:Kubelet stopped posting node status.,}
node_controller.go:1056] node xxxxxxxxx hasn't been updated for 2m5.699610878s. Last DiskPressure is: &NodeCondition{Type:DiskPressure,Status:Unknown,LastHeartbeatTime:2019-06-01 12:10:44 +0800 CST,LastTransitionTime:2019-06-01 12:11:27 +0800 CST,Reason:NodeStatusUnknown,Message:Kubelet stopped posting node status.,}
```

怀疑是 kubelet 的原因，找到更新 node 状态的代码：

```sh
// pkg/kubelet/kubelet.go: 1410
// start syncing lease
if utilfeature.DefaultFeatureGate.Enabled(features.NodeLease) {
    go kl.nodeLeaseController.Run(wait.NeverStop)
}
```

把前后代码都看了一边，如果 kubelet 调用 kube-apiserver 的接口失败，应当打印错误日志。kubelet 调用 kube-apiserver 更新状态的连接超时时间就是上报的时间间隔，如果耗时超过 10 秒，是一定会打印错误日志的。但是没有发现有相关日志，判定 kubelet 正常上报了状态，除非程序的定时机制有问题。

检查集群的 etcd 日志，发现有过载的提示，并且 entry 更新时间过长（预期100ms秒，实际超过500ms）。

```sh
Jun 04 09:33:39 xxxxx etcd[10200]: server is likely overloaded
Jun 04 09:33:39 xxxxx etcd[10200]: failed to send out heartbeat on time (exceeded the 100ms timeout for 295.879202ms)
Jun 04 09:33:39 xxxxx etcd[10200]: server is likely overloaded
Jun 04 09:33:39 xxxxx etcd[10200]: failed to send out heartbeat on time (exceeded the 100ms timeout for 295.856766ms)
Jun 04 09:33:38 xxxxx etcd[10200]: server is likely overloaded
Jun 04 09:33:38 xxxxx etcd[10200]: failed to send out heartbeat on time (exceeded the 100ms timeout for 218.239421ms)
Jun 04 09:33:38 xxxxx etcd[10200]: server is likely overloaded
Jun 04 09:33:38 xxxxx etcd[10200]: failed to send out heartbeat on time (exceeded the 100ms timeout for 218.166193ms)

Jun 04 08:20:54 xxxxx etcd[10094]: avoid queries with large range/delete range!
Jun 04 08:20:54 xxxxx etcd[10094]: apply entries took too long [527.734482ms for 1 entries]
```

日志看不明白，先去补一下 etcd 相关的知识。