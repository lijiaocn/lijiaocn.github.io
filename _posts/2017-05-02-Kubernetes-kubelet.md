---
layout: default
title: Kubernetes的kubelet的工作过程
author: lijiaocn
createdate: 2017/05/02 10:03:20
changedate: 2017/05/15 11:14:31
categories: 项目
tags: k8s
keywords: kubelet,kubelete,工作流程,源码走读
description: kubernetes中pod的创建过程，kubelet从启动到运行

---

* auto-gen TOC:
{:toc}

## 从启动到运行

### main()

k8s.io/kubernetes/cmd/kubelet/kubelet.go:

	func main() {
	    s := options.NewKubeletServer()   <--获取配置，按下不表
	    s.AddFlags(pflag.CommandLine)
	
	    flag.InitFlags()
	    logs.InitLogs()
	    defer logs.FlushLogs()
	
	    verflag.PrintAndExitIfRequested()
	
	    if err := app.Run(s, nil); err != nil {
	        fmt.Fprintf(os.Stderr, "error: %v\n", err)
	        os.Exit(1)
	    }
	}

### app.Run()

k8s.io/kubernetes/cmd/kubelet/app/server.go:

	func Run(s *options.KubeletServer, kubeDeps *kubelet.KubeletDeps) error {
	    if err := run(s, kubeDeps); err != nil {
	        return fmt.Errorf("failed to run Kubelet: %v", err)
	
	    }
	    return nil
	}

### run()

k8s.io/kubernetes/cmd/kubelet/app/server.go:

	func run(s *options.KubeletServer, kubeDeps *kubelet.KubeletDeps) (err error) {
	
	}

主要的过程都在run()中，run中的准备事项比较多，这里只捡重要的说。

### 参数kubeDeps

kubeDeps是用来实现功能插件，如果没有指定，使用默认的设置:

	if kubeDeps == nil {
	    var kubeClient clientset.Interface
	    var eventClient v1core.EventsGetter
	    var externalKubeClient clientgoclientset.Interface
	    var cloud cloudprovider.Interface
	    ...(省略)...
	    kubeDeps.Cloud = cloud
	    kubeDeps.KubeClient = kubeClient
	    kubeDeps.ExternalKubeClient = externalKubeClient
	    kubeDeps.EventClient = eventClient
	
	}

### 资源占用限制、容器管理器

	kubeDeps.ContainerManager, err = cm.NewContainerManager(
	    kubeDeps.Mounter,
	    kubeDeps.CAdvisorInterface,
	    cm.NodeConfig{
	        RuntimeCgroupsName:    s.RuntimeCgroups,
	        SystemCgroupsName:     s.SystemCgroups,
	        KubeletCgroupsName:    s.KubeletCgroups,
	        ContainerRuntime:      s.ContainerRuntime,
	        CgroupsPerQOS:         s.CgroupsPerQOS,
	        CgroupRoot:            s.CgroupRoot,
	        CgroupDriver:          s.CgroupDriver,
	        ProtectKernelDefaults: s.ProtectKernelDefaults,
	        EnableCRI:             s.EnableCRI,
	        NodeAllocatableConfig: cm.NodeAllocatableConfig{
	            KubeReservedCgroupName:   s.KubeReservedCgroup,
	            SystemReservedCgroupName: s.SystemReservedCgroup,
	            EnforceNodeAllocatable:   sets.NewString(s.EnforceNodeAllocatable...),
	            KubeReserved:             kubeReserved,
	            SystemReserved:           systemReserved,
	            HardEvictionThresholds:   hardEvictionThresholds,
	        },
	        ExperimentalQOSReserved: *experimentalQOSReserved,
	    },
	    s.ExperimentalFailSwapOn,
	    kubeDeps.Recorder)

### RunKubelet()

k8s.io/kubernetes/cmd/kubelet/app/server.go:577

	if err := RunKubelet(&s.KubeletConfiguration, kubeDeps, s.RunOnce, standaloneMode); err != nil {
	    return err
	}

RunKubelet():

	builder := kubeDeps.Builder
	if builder == nil {
	    builder = CreateAndInitKubelet
	}
	if kubeDeps.OSInterface == nil {
	    kubeDeps.OSInterface = kubecontainer.RealOS{}
	}
	k, err := builder(kubeCfg, kubeDeps, standaloneMode)
	if err != nil {
	    return fmt.Errorf("failed to create kubelet: %v", err)
	}
	
	...(省略)...
	
	if runOnce {
	    if _, err := k.RunOnce(podCfg.Updates()); err != nil {
	        return fmt.Errorf("runonce failed: %v", err)
	    }
	    glog.Infof("Started kubelet %s as runonce", version.Get().String())
	} else {
	    startKubelet(k, podCfg, kubeCfg, kubeDeps)
	    glog.Infof("Started kubelet %s", version.Get().String())
	}

### startKubelet()

k8s.io/kubernetes/cmd/kubelet/app/server.go:

	func startKubelet(k kubelet.KubeletBootstrap, podCfg *config.PodConfig, kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *kubelet.KubeletDeps) {
	    // start the kubelet
	    go wait.Until(func() { k.Run(podCfg.Updates()) }, 0, wait.NeverStop)
	
	    // start the kubelet server
	    if kubeCfg.EnableServer {
	        go wait.Until(func() {
	            k.ListenAndServe(net.ParseIP(kubeCfg.Address), uint(kubeCfg.Port), kubeDeps.TLSOptions, kubeDeps.Auth, kubeCfg.EnableDebuggingHandlers, kubeCfg.EnableContentionProfiling)
	        }, 0, wait.NeverStop)
	    }
	    if kubeCfg.ReadOnlyPort > 0 {
	        go wait.Until(func() {
	            k.ListenAndServeReadOnly(net.ParseIP(kubeCfg.Address), uint(kubeCfg.ReadOnlyPort))
	        }, 0, wait.NeverStop)
	    }
	}

### CreateAndInitKubelet()

回到CreateAndInitKubelet()中一探究竟，找到k.Run(),k.ListenAndServe()的实现等。

k8s.io/kubernetes/cmd/kubelet/app/server.go:

	k, err = kubelet.NewMainKubelet(kubeCfg, kubeDeps, standaloneMode)

k8s.io/kubernetes/pkg/kubelet/kubelet.go:

	// NewMainKubelet instantiates a new Kubelet object along with all the required internal modules.
	// No initialization of Kubelet and its modules should happen here.
	func NewMainKubelet(kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *KubeletDeps, standaloneMode bool) (*Kubelet, error) {
	    if kubeCfg.RootDirectory == "" {
	        return nil, fmt.Errorf("invalid root directory %q", kubeCfg.RootDirectory)
	    }
	...

在NewMainKubelet中完成所有的准备:

	klet := &Kubelet{
	    hostname:                       hostname,
	    nodeName:                       nodeName,
	    dockerClient:                   kubeDeps.DockerClient,
	    kubeClient:                     kubeDeps.KubeClient,
	    rootDirectory:                  kubeCfg.RootDirectory,
	    resyncInterval:                 kubeCfg.SyncFrequency.Duration,
	    containerRefManager:            containerRefManage
	    ...

Kubelet在k8s.io/kubernetes/pkg/kubelet/kubelet.go中定义:

	-+Kubelet : struct
	    [fields]
	   -admitHandlers : lifecycle.PodAdmitHandlers
	   -appArmorValidator : apparmor.Validator
	   -autoDetectCloudProvider : bool
	   -babysitDaemons : bool
	   -backOff : *flowcontrol.Backoff
	   -cadvisor : cadvisor.Interface
	   ... 省略 ...
	   +BirthCry()
	   +GetClusterDNS(pod *v1.Pod) : []string, []string, bool, error
	   +GetConfiguration() : componentconfig.KubeletConfiguration
	   +GetKubeClient() : clientset.Interface
	   +HandlePodAdditions(pods []*v1.Pod)
	   ...

## 创建Pod

### Pod任务分发

Kubelet的方法syncLoop()中监听pod信息，将任务发送到podWorkers:

k8s.io/kubernetes/pkg/kubelet/kubelet.go:

	func (kl *Kubelet) syncLoop(updates <-chan kubetypes.PodUpdate, handler SyncHandler) {
	
	}

syncLoop中调用syncLoopIteration:

	func (kl *Kubelet) syncLoopIteration(configCh <-chan kubetypes.PodUpdate, handler SyncHandler,
	    syncCh <-chan time.Time, housekeepingCh <-chan time.Time, plegCh <-chan *pleg.PodLifecycleEvent) bool {
	    kl.syncLoopMonitor.Store(kl.clock.Now())
	    select {
	    case u, open := <-configCh:
	        // Update from a config source; dispatch it to the right handler
	        // callback.
	        if !open {
	            glog.Errorf("Update channel is closed. Exiting the sync loop.")
	            return false
	        }
	
	        switch u.Op {
	        case kubetypes.ADD:
	            glog.V(2).Infof("SyncLoop (ADD, %q): %q", u.Source, format.Pods(u.Pods))
	            // After restarting, kubelet will get all existing pods through
	            // ADD as if they are new pods. These pods will then go through the
	            // admission process and *may* be rejected. This can be resolved
	            // once we have checkpointing.
	            handler.HandlePodAdditions(u.Pods)

传入参数handler就是kl，HandlePodAddtions也是struct Kubelet的成员函数。

	kl.syncLoop(updates, kl)

在HandlePodAddtion()中可以看到，通过dispatchWork分发pod任务。

	mirrorPod, _ := kl.podManager.GetMirrorPodByPod(pod)
	kl.dispatchWork(pod, kubetypes.SyncPodCreate, mirrorPod, start)
	kl.probeManager.AddPod(pod)

在dispatchWork()中可以看到，落实在podWorkers中:

	kl.podWorkers.UpdatePod(&UpdatePodOptions{
	    Pod:        pod,
	    MirrorPod:  mirrorPod,
	    UpdateType: syncType,
	    OnCompleteFunc: func(err error) {
	        if err != nil {
	            metrics.PodWorkerLatency.WithLabelValues(syncType.String()).Observe(metrics.SinceInMicroseconds(start))
	        }
	    },
	})

### podWorkers

k8s.io/kubernetes/pkg/kubelet/pod_workers.go:

	klet.podWorkers = newPodWorkers(klet.syncPod, kubeDeps.Recorder, klet.workQueue, klet.resyncInterval, backOffPeriod, klet.podCache)

在UpdatePod中，可以看到managePodLoop()处理pod:

	func (p *podWorkers) UpdatePod(options *UpdatePodOptions) {
	....
	    go func() {
	        defer runtime.HandleCrash()
	        p.managePodLoop(podUpdates)
	    }()

而在mangePodLoop中，使用syncPodFn处理pod:

	func (p *podWorkers) managePodLoop(podUpdates <-chan UpdatePodOptions) {
	    var lastSyncTime time.Time
	    for update := range podUpdates {
	        err := func() error {
	            podUID := update.Pod.UID
	            // This is a blocking call that would return only if the cache
	            // has an entry for the pod that is newer than minRuntimeCache
	            // Time. This ensures the worker doesn't start syncing until
	            // after the cache is at least newer than the finished time of
	            // the previous sync.
	            status, err := p.podCache.GetNewerThan(podUID, lastSyncTime)
	            if err != nil {
	                return err
	            }
	            err = p.syncPodFn(syncPodOptions{
	                mirrorPod:      update.MirrorPod,
	                pod:            update.Pod,
	                podStatus:      status,
	                killPodOptions: update.KillPodOptions,
	                updateType:     update.UpdateType,
	            })
	            lastSyncTime = time.Now()
	            return err
	        }()
	...

而syncPodFn是创建podWorkers时，传入的参数klet.syncPod。

### syncPod

	func (kl *Kubelet) syncPod(o syncPodOptions) error {
	    // pull out the required options
	    pod := o.pod
	    mirrorPod := o.mirrorPod
	    podStatus := o.podStatus
	    updateType := o.updateType
	    ...
	    // Call the container runtime's SyncPod callback
	   result := kl.containerRuntime.SyncPod(pod, apiPodStatus, podStatus, pullSecrets, kl.backOff)
	    ...

syncPod中内容比较多，这里重点提一下容器网络的设置

#### 容器网络的设置

网络的设置在`kl.containerRuntime.SyncPod()`中创建容器的时候设置。

`kl.containerRuntime`的动态类型取决于选用的容器引擎,

	//如果容器不是rkt，并且使用CRI(Container runtime interface)
	runtime, err := kuberuntime.NewKubeGenericRuntimeManager(
	        kubecontainer.FilterEventRecorder(kubeDeps.Recorder),
	        klet.livenessManager,
	        containerRefManager,
	        ...
	//如果容器是docker
	runtime := dockertools.NewDockerManager(
	    kubeDeps.DockerClient,
	    kubecontainer.FilterEventRecorder(kubeDeps.Recorder),
	    klet.livenessManager,
	
	//如果容器是rkt
	runtime, err := rkt.New(
	    kubeCfg.RktAPIEndpoint,
	    conf,
	    klet,
	    kubeDeps.Recorder,
	    containerRefManager,

无论动态类型是什么，最后都是通过接口`NetworkPlugin`完成网络配置的：

	-+NetworkPlugin : interface
	    [methods]
	   +Capabilities() : utilsets.Int
	   +Event(name string, details map[string]interface{})
	   +GetPodNetworkStatus(namespace string, name string, podInfraContainerID kubecontainer.ContainerID) : *PodNetworkStatus, error
	   +Init(host Host, hairpinMode componentconfig.HairpinMode, nonMasqueradeCIDR string, mtu int) : error
	   +Name() : string
	   +SetUpPod(namespace string, name string, podInfraContainerID kubecontainer.ContainerID, annotations map[string]string) : error
	   +Status() : error
	   +TearDownPod(namespace string, name string, podInfraContainerID kubecontainer.ContainerID) : error

例如在DockerManager中,k8s.io/kubernetes/pkg/kubelet/dockertools/docker_manager.go:

	if !kubecontainer.IsHostNetworkPod(pod) {
	    if err := dm.network.SetUpPod(pod.Namespace, pod.Name, podInfraContainerID.ContainerID(), pod.Annotations); err != nil {
	        setupNetworkResult.Fail(kubecontainer.ErrSetupNetwork, err.Error())
	        glog.Error(err)

可以参考一下calico的cni实现:[calico-cni-plugin][1]

## Event Recorder

kubelet通过event recorder

k8s.io/kubernetes/cmd/kubelet/app/server.go:772

	makeEventRecorder(kubeCfg, kubeDeps, nodeName)

## 参考

1. [calico-cni-plugin][1]

[1]: calico-cni-plugin  "https://github.com/projectcalico/cni-plugin" 
