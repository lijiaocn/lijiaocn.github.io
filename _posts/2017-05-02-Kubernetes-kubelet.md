---
layout: default
title: Kubernetes的kubelet的工作过程
author: lijiaocn
createdate: 2017/05/02 10:03:20
changedate: 2017/06/22 13:09:03
categories: 项目
tags: kubernetes
keywords: kubelet,kubelete,工作流程,源码走读
description: kubernetes中pod的创建过程，kubelet从启动到运行

---

* auto-gen TOC:
{:toc}

## 启动过程

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
		...

主要的过程都在run()中，run中的准备事项比较多，这里只捡重要的说。

### 参数kubeDeps

kubeDeps是用来实现功能插件，如果没有指定，使用默认的设置:

cmd/kubelet/app/server.go:

	func run(s *options.KubeletServer, kubeDeps *kubelet.KubeletDeps) (err error) {
		standaloneMode := (len(s.APIServerList) == 0 && !s.RequireKubeConfig)
		...
		if kubeDeps == nil {
			var kubeClient clientset.Interface
			var eventClient v1core.EventsGetter
			var externalKubeClient clientgoclientset.Interface
			var cloud cloudprovider.Interface
			...
			kubeDeps, err = UnsecuredKubeletDeps(s)  <--- 注意这里完成了一些设置
			...
			kubeDeps.Cloud = cloud
			kubeDeps.KubeClient = kubeClient
			kubeDeps.ExternalKubeClient = externalKubeClient
			kubeDeps.EventClient = eventClient
		}
		if kubeDeps.Auth == nil {
			auth, err := buildAuth(nodeName, kubeDeps.ExternalKubeClient, s.KubeletConfiguration)
			...
			kubeDeps.Auth = auth
		}
		
		if kubeDeps.CAdvisorInterface == nil {
			kubeDeps.CAdvisorInterface, err = cadvisor.New(uint(s.CAdvisorPort), s.ContainerRuntime, s.RootDirectory)
			...
		}
		
		makeEventRecorder(&s.KubeletConfiguration, kubeDeps, nodeName)
		
		if kubeDeps.ContainerManager == nil {
			if s.CgroupsPerQOS && s.CgroupRoot == "" {
				glog.Infof("--cgroups-per-qos enabled, but --cgroup-root was not specified.  defaulting to /")
				s.CgroupRoot = "/"
			}
			kubeReserved, err := parseResourceList(s.KubeReserved)
				...
			systemReserved, err := parseResourceList(s.SystemReserved)
				...
			var hardEvictionThresholds []evictionapi.Threshold
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
		}
		...

cmd/kubelet/app/server.go:

	func UnsecuredKubeletDeps(s *options.KubeletServer) (*kubelet.KubeletDeps, error) {
		return &kubelet.KubeletDeps{
			Auth:               nil, // default does not enforce auth[nz]
			CAdvisorInterface:  nil, // cadvisor.New launches background processes (bg http.ListenAndServe, and some bg cleaners), not set here
			Cloud:              nil, // cloud provider might start background processes
			ContainerManager:   nil,
			DockerClient:       dockerClient,
			KubeClient:         nil,
			ExternalKubeClient: nil,
			Mounter:            mounter,
			NetworkPlugins:     ProbeNetworkPlugins(s.NetworkPluginDir, s.CNIConfDir, s.CNIBinDir),
			OOMAdjuster:        oom.NewOOMAdjuster(),
			OSInterface:        kubecontainer.RealOS{},
			Writer:             writer,
			VolumePlugins:      ProbeVolumePlugins(s.VolumePluginDir),
			TLSOptions:         tlsOptions,
		}, nil
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

## Pod的创建

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

pkg/kubelet/kubelet.go:

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

注意这里调用的是`kl.containerRuntime.SyncPod()`

pkg/kubelet/kubelet.go:

	func NewMainKubelet(kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *KubeletDeps, standaloneMode bool) (*Kubelet, error) {
		...
		runtime, err := kuberuntime.NewKubeGenericRuntimeManager(
			kubecontainer.FilterEventRecorder(kubeDeps.Recorder),
			klet.livenessManager,
			containerRefManager,
			machineInfo,
			klet.podManager,
			kubeDeps.OSInterface,
			klet.networkPlugin,
			klet,
			klet.httpClient,
			imageBackOff,
			kubeCfg.SerializeImagePulls,
			float32(kubeCfg.RegistryPullQPS),
			int(kubeCfg.RegistryBurst),
			klet.cpuCFSQuota,
			runtimeService,
			imageService,
		)

NewKubeGenericRuntimeManager在pkg/kubelet/kuberuntime/kuberuntime_manager.go中实现。

#### InitContainers

K8S的Pod有一个init-containers功能，可以在metadata中添加一个注解:

	metadata:
		annotations:
			pod.alpha.kubernetes.io/initialized: "true"
			pod.alpha.kubernetes.io/init-containers: '[{POD的JSON描述}]'

这样Pod在启动的时候，首先启动init-containers，然后在启动Pod的中容器。

pkg/kubelet/kuberuntime/kuberuntime_manager.go:

	func (m *kubeGenericRuntimeManager) SyncPod(pod *v1.Pod, _ v1.PodStatus, podStatus *kubecontainer.PodStatus, \
		pullSecrets []v1.Secret, backOff *flowcontrol.Backoff) (result kubecontainer.PodSyncResult) {
			status, next, done := findNextInitContainerToRun(pod, podStatus)
			...
			if next != nil {
				if len(podContainerChanges.ContainersToStart) == 0 {
					...
				}
				...
				if msg, err := m.startContainer(podSandboxID, podSandboxConfig, container, pod, podStatus, pullSecrets, podIP); err != nil {
					...
				}
			...

InitContainers可以有多个，多个Container严格按照顺序启动，只有当前一个Container退出了以后，才开始启动下一个Container。

通过findNextInitContainerToRun()控制这个过程：

pkg/kubelet/kuberuntime/kuberuntime_container.go:

	func findNextInitContainerToRun(pod *v1.Pod, podStatus *kubecontainer.PodStatus) (status *kubecontainer.ContainerStatus, next *v1.Container, done bool) {
		...
		// There are no failed containers now.
		for i := len(pod.Spec.InitContainers) - 1; i >= 0; i-- {
			container := &pod.Spec.InitContainers[i]
			status := podStatus.FindContainerStatusByName(container.Name)
			if status == nil {
				continue
			}
			if status.State == kubecontainer.ContainerStateRunning {
				return nil, nil, false
			}
			if status.State == kubecontainer.ContainerStateExited {
				if i == (len(pod.Spec.InitContainers) - 1) {
					return nil, nil, true
				}
				return nil, &pod.Spec.InitContainers[i+1], false
			}
		}
		return nil, &pod.Spec.InitContainers[0], false
	}

## Volume的挂载

### 插件的集成与初始化

Volume的插件在创建kubeDep的时候加载。

可以通过volume-plugin-dir指定volume插件：

cmd/kubelet/app/options/options.go:

	func (s *KubeletServer) AddFlags(fs *pflag.FlagSet) {
		...
		fs.StringVar(&s.VolumePluginDir, "volume-plugin-dir", s.VolumePluginDir, \
			<Warning: Alpha feature> The full path of the directory in which to \
			search for additional third party volume plugins")
		...

探测插件：

cmd/kubelet/app/server.go:

	func UnsecuredKubeletDeps(s *options.KubeletServer) (*kubelet.KubeletDeps, error) {
		...
		VolumePlugins:      ProbeVolumePlugins(s.VolumePluginDir),
		...

可以看到内置很aws、empty等很多插件，从目录中加载的插件类型是flexvolume.ProbeVolumePlugins。
cmd/kubelet/app/plugins.go:

	func ProbeVolumePlugins(pluginDir string) []volume.VolumePlugin {
		allPlugins := []volume.VolumePlugin{}
		allPlugins = append(allPlugins, aws_ebs.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, empty_dir.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, gce_pd.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, git_repo.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, host_path.ProbeVolumePlugins(volume.VolumeConfig{})...)
		allPlugins = append(allPlugins, nfs.ProbeVolumePlugins(volume.VolumeConfig{})...)
		allPlugins = append(allPlugins, secret.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, iscsi.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, glusterfs.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, rbd.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, cinder.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, quobyte.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, cephfs.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, downwardapi.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, fc.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, flocker.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, flexvolume.ProbeVolumePlugins(pluginDir)...)
		allPlugins = append(allPlugins, azure_file.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, configmap.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, vsphere_volume.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, azure_dd.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, photon_pd.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, projected.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, portworx.ProbeVolumePlugins()...)
		allPlugins = append(allPlugins, scaleio.ProbeVolumePlugins()...)
		return allPlugins
	}

接口VolumePlugin在pkg/volume/plugins.go中定义。

	-+VolumePlugin : interface
	   [methods]
	   +CanSupport(spec *Spec) : bool
	   +ConstructVolumeSpec(volumeName, mountPath string) : *Spec, error
	   +GetPluginName() : string
	   +GetVolumeName(spec *Spec) : string, error
	   +Init(host VolumeHost) : error
	   +NewMounter(spec *Spec, podRef *v1.Pod, opts VolumeOptions) : Mounter, error
	   +NewUnmounter(name string, podUID types.UID) : Unmounter, error
	   +RequiresRemount() : bool
	   +SupportsBulkVolumeVerification() : bool
	   +SupportsMountOption() : bool

在NewMainKubelet()中传入参数kubeDeps.VolumePlugins，创建volumePluginMgr:

pkg/kubelet/kubelet.go:

	func NewMainKubelet(kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *KubeletDeps, standaloneMode bool) (*Kubelet, error) {
		...
		klet.volumePluginMgr, err =
			NewInitializedVolumePluginMgr(klet, secretManager, kubeDeps.VolumePlugins)
		...

volumePluginMgr创建过程完成了volume插件的初始化。

pkg/kubelet/volume_host.go:

	func NewInitializedVolumePluginMgr(
		kubelet *Kubelet,
		secretManager secret.Manager,
		plugins []volume.VolumePlugin) (*volume.VolumePluginMgr, error) {
		kvh := &kubeletVolumeHost{
			kubelet:         kubelet,
			volumePluginMgr: volume.VolumePluginMgr{},
			secretManager:   secretManager,
		}
		if err := kvh.volumePluginMgr.InitPlugins(plugins, kvh); err != nil {
			...
		return &kvh.volumePluginMgr, nil
	}

pkg/volume/plugins.go:

	func (pm *VolumePluginMgr) InitPlugins(plugins []VolumePlugin, host VolumeHost) error {
		pm.mutex.Lock()
		defer pm.mutex.Unlock()
		if pm.plugins == nil {
			pm.plugins = map[string]VolumePlugin{}
		}
		allErrs := []error{}
		for _, plugin := range plugins {
			name := plugin.GetPluginName()
			...
			err := plugin.Init(host)
			...
			pm.plugins[name] = plugin
		}
		return utilerrors.NewAggregate(allErrs)
	}

### VolumeManager的运行

在NewMainKubelet()中创建了volumePluginMgr以后，继续创建volumeManager。

pkg/kubelet/kubelet.go:

	func NewMainKubelet(kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *KubeletDeps, standaloneMode bool) (*Kubelet, error) {
		...
		klet.volumePluginMgr, err =
			NewInitializedVolumePluginMgr(klet, secretManager, kubeDeps.VolumePlugins)
		...
		klet.volumeManager, err = volumemanager.NewVolumeManager(
			kubeCfg.EnableControllerAttachDetach,
			nodeName,
			klet.podManager,
			klet.statusManager,
			klet.kubeClient,
			klet.volumePluginMgr,
			klet.containerRuntime,
			kubeDeps.Mounter,
			klet.getPodsDir(),
			kubeDeps.Recorder,
			kubeCfg.ExperimentalCheckNodeCapabilitiesBeforeMount,
			kubeCfg.KeepTerminatedPodVolumes)
		...

pkg/kubelet/volumemanager/volume_manager.go:

	func NewVolumeManager(
		...
		keepTerminatedPodVolumes bool) (VolumeManager, error) {
		
		vm := &volumeManager{
			kubeClient:          kubeClient,
			volumePluginMgr:     volumePluginMgr,
			desiredStateOfWorld: cache.NewDesiredStateOfWorld(volumePluginMgr),
			actualStateOfWorld:  cache.NewActualStateOfWorld(nodeName, volumePluginMgr),
			operationExecutor: operationexecutor.NewOperationExecutor(operationexecutor.NewOperationGenerator(
				kubeClient,
				volumePluginMgr,
				recorder,
				checkNodeCapabilitiesBeforeMount),
			),
		}
		
		vm.reconciler = reconciler.NewReconciler(
			...
			vm.desiredStateOfWorld,
			vm.actualStateOfWorld,
			vm.operationExecutor,
			...)
		
		vm.desiredStateOfWorldPopulator = populator.NewDesiredStateOfWorldPopulator(
			...
		return vm, nil
	}

在Kubelet.Run()时候启动volumeManager:

pkg/kubelet/kubelet.go:

	func (kl *Kubelet) Run(updates <-chan kubetypes.PodUpdate) {
		...
		go kl.volumeManager.Run(kl.sourcesReady, wait.NeverStop)
		...

### 管理Volume的后台协程

在volumeManager.Run()中会创建两个协程:

pkg/kubelet/volumemanager/volume_manager.go

	func (vm *volumeManager) Run(sourcesReady config.SourcesReady, stopCh <-chan struct{}) {
		defer runtime.HandleCrash()
		go vm.desiredStateOfWorldPopulator.Run(stopCh)
		go vm.reconciler.Run(sourcesReady, stopCh)
		<-stopCh
	}

vm.desiredStateOfWorldPopulator.Run()负责监控Pod，将需要挂载的volume记录到队列中。

vm.reconciler.Run()进行volume的创建、挂载、卸载等。

#### vm.desiredStateOfWorldPopulator.Run()

pkg/kubelet/volumemanager/populator/desired_state_of_world_populator.go:

	func (dswp *desiredStateOfWorldPopulator) Run(stopCh <-chan struct{}) {
		wait.Until(dswp.populatorLoopFunc(), dswp.loopSleepDuration, stopCh)
	}

pkg/kubelet/volumemanager/populator/desired_state_of_world_populator.go:

	func (dswp *desiredStateOfWorldPopulator) populatorLoopFunc() func() {
		return func() {
			dswp.findAndAddNewPods()
			....
			dswp.findAndRemoveDeletedPods()
		}
	}

	func (dswp *desiredStateOfWorldPopulator) findAndAddNewPods() {
		for _, pod := range dswp.podManager.GetPods() {
			if dswp.isPodTerminated(pod) {
				continue
			}
			dswp.processPodVolumes(pod)
		}
	}

	func (dswp *desiredStateOfWorldPopulator) processPodVolumes(pod *v1.Pod) {
		...
		uniquePodName := volumehelper.GetUniquePodName(pod)
		if dswp.podPreviouslyProcessed(uniquePodName) {
			return
		}
		for _, podVolume := range pod.Spec.Volumes {
			volumeSpec, volumeGidValue, err :=
				dswp.createVolumeSpec(podVolume, pod.Namespace)
				...
				continue
			}
			_, err = dswp.desiredStateOfWorld.AddPodToVolume(
				uniquePodName, pod, volumeSpec, podVolume.Name, volumeGidValue)
				...
			}
		}
		dswp.markPodProcessed(uniquePodName)
	}

pkg/kubelet/volumemanager/cache/desired_state_of_world.go:

	func (dsw *desiredStateOfWorld) AddPodToVolume(....)
		...
		volumePlugin, err := dsw.volumePluginMgr.FindPluginBySpec(volumeSpec)

#### vm.reconciler.Run()

pkg/kubelet/volumemanager/reconciler/reconciler.go

	func (rc *reconciler) Run(sourcesReady config.SourcesReady, stopCh <-chan struct{}) {
		wait.Until(rc.reconciliationLoopFunc(sourcesReady), rc.loopSleepDuration, stopCh)
	}

	func (rc *reconciler) reconciliationLoopFunc(sourcesReady config.SourcesReady) func() {
		return func() {
			rc.reconcile()
			if sourcesReady.AllReady() && time.Since(rc.timeOfLastSync) > rc.syncDuration {
				...
			}
		}
	}

	func (rc *reconciler) reconcile() {
		// Ensure volumes that should be unmounted are unmounted.
		for _, mountedVolume := range rc.actualStateOfWorld.GetMountedVolumes() {
			if !rc.desiredStateOfWorld.PodExistsInVolume(mountedVolume.PodName, mountedVolume.VolumeName) {
				...
		// Ensure volumes that should be attached/mounted are attached/mounted.
		for _, volumeToMount := range rc.desiredStateOfWorld.GetVolumesToMount() {
			volMounted, devicePath, err := rc.actualStateOfWorld.PodExistsInVolume(volumeToMount.PodName, volumeToMount.VolumeName)
			volumeToMount.DevicePath = devicePath
				...

### 创建Pod时触发Volume操作

在创建的pod的过程中，调用`WaitForAttachAndMount`:

pkg/kubelet/kubelet.go:

	func (kl *Kubelet) syncPod(o syncPodOptions) error {
		...
		if err := kl.volumeManager.WaitForAttachAndMount(pod); err != nil {
			kl.recorder.Eventf(pod, v1.EventTypeWarning, events.FailedMountVolume, "Unable to mount volumes for pod %q: %v", format.Pod(pod), err)
			glog.Errorf("Unable to mount volumes for pod %q: %v; skipping pod", format.Pod(pod), err)
			return err
		}

而在WaitForAttachAndMount()中将pod提交到了vm.desiredStateOfWorldPopulator:

pkg/kubelet/volumemanager/volume_manager.go:

	func (vm *volumeManager) WaitForAttachAndMount(pod *v1.Pod) error {
		expectedVolumes := getExpectedVolumes(pod)
		..
		uniquePodName := volumehelper.GetUniquePodName(pod)
		vm.desiredStateOfWorldPopulator.ReprocessPod(uniquePodName)
		vm.actualStateOfWorld.MarkRemountRequired(uniquePodName)
		err := wait.Poll(
			podAttachAndMountRetryInterval,
			podAttachAndMountTimeout,
			vm.verifyVolumesMountedFunc(uniquePodName, expectedVolumes))
		...
	}

pkg/kubelet/volumemanager/populator/desired_state_of_world_populator.go:

	func (dswp *desiredStateOfWorldPopulator) ReprocessPod(
		podName volumetypes.UniquePodName) {
		dswp.deleteProcessedPod(podName)
	}

	func (dswp *desiredStateOfWorldPopulator) deleteProcessedPod(
		podName volumetypes.UniquePodName) {
		dswp.pods.Lock()
		defer dswp.pods.Unlock()
		delete(dswp.pods.processedPods, podName)
	}

vm.actualstateofworld.MarkRemountRequired()

pkg/kubelet/volumemanager/cache/actual_state_of_world.go

	func (asw *actualStateOfWorld) MarkRemountRequired(
		podName volumetypes.UniquePodName) {
		asw.Lock()
		defer asw.Unlock()
		for volumeName, volumeObj := range asw.attachedVolumes {
			for mountedPodName, podObj := range volumeObj.mountedPods {
				if mountedPodName != podName {
					continue
				}
				volumePlugin, err :=
					asw.volumePluginMgr.FindPluginBySpec(volumeObj.spec)
					...
					continue
				}
				if volumePlugin.RequiresRemount() {
					podObj.remountRequired = true
					asw.attachedVolumes[volumeName].mountedPods[podName] = podObj
				}
			}
		}
	}

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
