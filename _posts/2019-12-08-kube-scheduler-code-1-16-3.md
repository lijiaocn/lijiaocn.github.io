---
layout: default
title: "kubernetes 调度组件 kube-scheduler 1.16.3 源代码阅读指引"
author: 李佶澳
date: "2019-12-08 22:23:33 +0800"
last_modified_at: "2019-12-10 10:27:33 +0800"
categories: 编程
cover:
tags: kubernetes
keywords: kubernetes,kube-scheduler,调度算法,调度组件
description: 找不到命令行参数的初始化过程，是阻止你阅读 kube-scheduler 源代码的最大障碍
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

找不到命令行参数的初始化过程，是刚开始阅读 kube-scheduler 源代码时遇到的最大障碍。这一步走不通，后面的代码即使能看明白，也会感觉心里没底，如同空中楼阁。
第二个障碍是不知道分散在哪里的 init()。

**代码阅读技巧**：从 main 函数开始，每进入一个新目录，把新目录下的文件粗略扫视一下，如果目录中有 readme 文件一定要看，每个文件开头的注释要看。

**怎样才算熟悉代码？**：想要查看某一环节的代码实现时，能够通过目录翻找到对应的代码文件，不需要从 main 函数开始按照执行顺序查找。

## 代码入口与代码组成

cmd/kube-scheduler 是源代码阅读入口，main 函数就在这个目录中：

![kube-scheduler源代码1]({{ site.imglocal }}/article/kube-scheduler-src-1.png)

上面只是 kube-scheduler 所有代码的的很小一部分，大部分代码位于 pkg/scheduler：

![kube-scheduler源代码2]({{ site.imglocal }}/article/kube-scheduler-src-2.png)

![kube-scheduler源代码8]({{ site.imglocal }}/article/kube-scheduler-src-8.png)

## 命令行参数设置

如果不熟悉 corbra 会很疑惑，命令行参数是什么时候设置的？

![kube-scheduler源代码2]({{ site.imglocal }}/article/kube-scheduler-src-3.png)

注意 2 和 4，位置 2 通过 cmd 获取 fs，然后在位置 4 调用 fs.AddFlags，参数 f 来自位置 3，进入 opts.Flags() 就会看到熟悉的 flags 设置了。
opts.Flags() 中指定用 opts 的成员保留命令行参数的值：

```go
// Flags returns flags for a specific scheduler by section name
func (o *Options) Flags() (nfs cliflag.NamedFlagSets) {
    fs := nfs.FlagSet("misc")
    fs.StringVar(&o.ConfigFile, "config", o.ConfigFile, "The path to the configuration file. Flags override values in this file.")
    fs.StringVar(&o.WriteConfigTo, "write-config-to", o.WriteConfigTo, "If set, write the configuration values to this file and exit.")
    fs.StringVar(&o.Master, "master", o.Master, "The address of the Kubernetes API server (overrides any value in kubeconfig)")

    o.SecureServing.AddFlags(nfs.FlagSet("secure serving"))
    o.CombinedInsecureServing.AddFlags(nfs.FlagSet("insecure serving"))
    o.Authentication.AddFlags(nfs.FlagSet("authentication"))
    o.Authorization.AddFlags(nfs.FlagSet("authorization"))
    o.Deprecated.AddFlags(nfs.FlagSet("deprecated"), &o.ComponentConfig)

    leaderelectionconfig.BindFlags(&o.ComponentConfig.LeaderElection.LeaderElectionConfiguration, nfs.FlagSet("leader election"))
    utilfeature.DefaultMutableFeatureGate.AddFlag(nfs.FlagSet("feature gate"))

    return nfs
}
```

而后带有命令行参数值的 opts 被前面图中的 runCommand(cmd, args, opts) 使用，从而将参数代入下一个环节。

## 参数默认值/运行时配置

通常情况下，大部分命令行参数都不会直接设置，因此命令行参数的默认值非常关键。kube-scheduler 的命令默认值设置过程有点绕。
这里只说明一些最主要最绕的 ComponentConfig 的设置过程。

前面图片的位置 1 调用下面函数生成 opts：

```go
// NewOptions returns default scheduler app options.
func NewOptions() (*Options, error) {
    cfg, err := newDefaultComponentConfig()    //运行时配置的主要组成
    if err != nil {
        return nil, err
    }
    ...
    o := &Options{
    ComponentConfig: *cfg,
    ...
```

runCommand(cmd, args, opts) 中怎样用 opts 生成运行配置这里不说了，这里关心 opts 的重要成员也是运行时配置的关键组成 ComponentConfig。

下面这段代码信息含量很大：

```go
func newDefaultComponentConfig() (*kubeschedulerconfig.KubeSchedulerConfiguration, error) {
    cfgv1alpha1 := kubeschedulerconfigv1alpha1.KubeSchedulerConfiguration{}
    kubeschedulerscheme.Scheme.Default(&cfgv1alpha1)     //这里是关键
    cfg := kubeschedulerconfig.KubeSchedulerConfiguration{}
    if err := kubeschedulerscheme.Scheme.Convert(&cfgv1alpha1, &cfg, nil); err != nil {
        return nil, err
    }
    return &cfg, nil
}
```

这段代码把我们引到 pkg/scheduler 目录中，它引用的两个 package 是：：

```go
kubeschedulerconfigv1alpha1 "k8s.io/kube-scheduler/config/v1alpha1"
kubeschedulerscheme "k8s.io/kubernetes/pkg/scheduler/apis/config/scheme"
```

kubeschedulerscheme.Scheme 是一个全局变量用于 struct 转换，跳转到 kubeschedulerscheme.Scheme.Default(&cfgv1alpha1) 的实现，会发现这里会使用 Scheme 存放的 default 函数对传入参数，也就是前面的 cfgv1alpha1 进行设置：

```go
// Default sets defaults on the provided Object.
func (s *Scheme) Default(src Object) {
    if fn, ok := s.defaulterFuncs[reflect.TypeOf(src)]; ok {
        fn(src)
    }
}
```

那么这些 default 函数是什么时候存放到 Scheme 中的？如下图所示： 

![kube-scheduler源代码4]({{ site.imglocal }}/article/kube-scheduler-src-4.png)

这里藏着一个 init，进入 addDefaultingFuncs() -> RegisterDefaults() -> ... -> SetDefaults_KubeSchedulerConfiguration()：

```go
func SetDefaults_KubeSchedulerConfiguration(obj *kubescedulerconfigv1alpha1.KubeSchedulerConfiguration) {
    if len(obj.SchedulerName) == 0 {
        obj.SchedulerName = api.DefaultSchedulerName
    }

    if obj.HardPodAffinitySymmetricWeight == 0 {
        obj.HardPodAffinitySymmetricWeight = api.DefaultHardPodAffinitySymmetricWeight
    }

    if obj.AlgorithmSource.Policy == nil &&
        (obj.AlgorithmSource.Provider == nil || len(*obj.AlgorithmSource.Provider) == 0) {
        val := kubescedulerconfigv1alpha1.SchedulerDefaultProviderName
        obj.AlgorithmSource.Provider = &val
    }
    ...
}
```

上面就是设置默认值的代码，可以看到 AlgorithmSource.Provider 的默认值为 SchedulerDefaultProviderName（字符串 "DefaultProvider"）。

## 执行主线

### 调度启动的主线

调度的主线位于 pkg/scheduler/scheduler.go ，包含调度算法的 config 和 informer 的设置都是在生成/设置的，sched 的 Run() 就是调度任务的开始：

```go
// New returns a Scheduler
func New(client clientset.Interface,
    ...
    config = sc
    ...
    sched := NewFromConfig(config)
    ...
    AddAllEventHandlers(sched, options.schedulerName, nodeInformer, podInformer, pvInformer, pvcInformer, serviceInformer, storageClassInformer)
    ...
}

// Run begins watching and scheduling. It waits for cache to be synced, then starts a goroutine and returns immediately.
func (sched *Scheduler) Run() {
    if !sched.config.WaitForCacheSync() {
        return
    }

    go wait.Until(sched.scheduleOne, 0, sched.config.StopEverything)
}
````

### 调度算法的主线

调度算法执行的主线位于 pkg/scheduler/core/generic_scheduler.go：

```go
// pkg/scheduler/core/generic_scheduler.go
// NewGenericScheduler creates a genericScheduler object.
func NewGenericScheduler(
    ...
) ScheduleAlgorithm {
    ...
}
```

genericScheduler 的 Schedule() 方法就是调度算法执行的主线，被 scheduleOne() 调用：

```go
// pkg/scheduler/scheduler.go
func (sched *Scheduler) scheduleOne() {
    ...
    scheduleResult, err := sched.schedule(pod, pluginContext)
    ...
}

func (sched *Scheduler) schedule(pod *v1.Pod, pluginContext *framework.PluginContext) (core.ScheduleResult, error) {
    result, err := sched.config.Algorithm.Schedule(pod, sched.config.NodeLister, pluginContext)
    if err != nil {
        pod = pod.DeepCopy()
        sched.recordSchedulingFailure(pod, err, v1.PodReasonUnschedulable, err.Error())
        return core.ScheduleResult{}, err
    }
    return result, err
}

// pkg/scheduler/core/generic_scheduler.go
func (g *genericScheduler) Schedule(pod *v1.Pod, nodeLister algorithm.NodeLister, pluginContext *framework.PluginContext) (result ScheduleResult, err error) {
    ...
}
```

## 调度任务获取

调度就是为 Pod 选择 Node，kube-scheduler 通过各种 informer 获取调度任务。

事件处理函数都在 pkg/scheduler/eventhandlers.go 中：

![kube-scheduler源代码6]({{ site.imglocal }}/article/kube-scheduler-src-6.png)

## 调度执行过程

kube-scheduler 一次只调度一个 Pod （2019-12-09 16:39:35），调度过程在文件 pkg/scheduler/scheduler.go 中：

```go
// pkg/scheduler/scheduler.go
func (sched *Scheduler) Run() {
    ...
    //每次只调度一个 pod 的 sched.scheduleOne，无限重复执行
    go wait.Until(sched.scheduleOne, 0, sched.config.StopEverything)
}
```

### 调度算法

调度算法通过 --algorithm-provider 或者 --policy-config-file/--policy-configmap 设置，默认配置是 --algorithm-provider="DefaultProvider"。

调度算法在 pkg/scheduler/scheduler.go 中设置：

![kube-scheduler源代码7]({{ site.imglocal }}/article/kube-scheduler-src-7.png)

DefaultProvider 在 pkg/scheduler/algorithmprovider/defaults/ 中定义：

![kube-scheduler源代码5]({{ site.imglocal }}/article/kube-scheduler-src-5.png)

### 调度插件

调度插件是调度过程中一系列钩子，在 pkg/scheduler/scheduler.go 中调用：

```go
// pkg/scheduler/scheduler.go
func (sched *Scheduler) scheduleOne() {
    fwk := sched.config.Framework
    ...
    // Run "reserve" plugins.
    if sts := fwk.RunReservePlugins(pluginContext, assumedPod, scheduleResult.SuggestedHost); !sts.IsSuccess() {
        sched.recordSchedulingFailure(assumedPod, sts.AsError(), SchedulerError, sts.Message())
        metrics.PodScheduleErrors.Inc()
        return
    }
    ...
        // Run "permit" plugins.
        permitStatus := fwk.RunPermitPlugins(pluginContext, assumedPod, scheduleResult.SuggestedHost)
        ...
        // Run "prebind" plugins.
        prebindStatus := fwk.RunPrebindPlugins(pluginContext, assumedPod, scheduleResult.SuggestedHost)

            // Run "postbind" plugins.
            fwk.RunPostbindPlugins(pluginContext, assumedPod, scheduleResult.SuggestedHost)
    ...
}
```

支持的钩子列表：

```go
type Framework interface {
    FrameworkHandle
    QueueSortFunc() LessFunc
    RunPrefilterPlugins(pc *PluginContext, pod *v1.Pod) *Status
    RunPrebindPlugins(pc *PluginContext, pod *v1.Pod, nodeName string) *Status
    RunPostbindPlugins(pc *PluginContext, pod *v1.Pod, nodeName string)
    RunReservePlugins(pc *PluginContext, pod *v1.Pod, nodeName string) *Status
    RunUnreservePlugins(pc *PluginContext, pod *v1.Pod, nodeName string)
    RunPermitPlugins(pc *PluginContext, pod *v1.Pod, nodeName string) *Status
}
```

kube-scheduler 只是预留了插件接口，方便开发者自行开发插件干预调度过程，现在 kube-scheduler 中的插件是空的：

```go
func NewRegistry() Registry {
    return Registry{
        // FactoryMap:
        // New plugins are registered here.
        // example:
        // {
        //  stateful_plugin.Name: stateful.NewStatefulMultipointExample,
        //  fooplugin.Name: fooplugin.New,
        // }
    }
}
```

pkg/scheduler/framework/plugins/examples 中有几个示范插件，可以参照实现。

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
