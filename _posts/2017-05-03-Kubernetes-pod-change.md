---
layout: default
title: kubernetes的Pod变更过程
author: 李佶澳
createdate: 2017/05/03 17:09:37
last_modified_at: 2017/06/13 11:37:41
categories: 项目
tags: kubernetes
keywords: kubernete,pod,receive,变更通知
description: kubelet是如何接收到pod的变更通知的？

---

## 目录
* auto-gen TOC:
{:toc}

Kubelet的syncLoop()方法中会监听pod信息，将任务发送到podWorkers:

pkg/kubelet/kubelet.go:

	func (kl *Kubelet) Run(updates <-chan kubetypes.PodUpdate) {
		...
		kl.syncLoop(updates, kl)
	}

那么chan updates中的内容是如何写入的？

## kubelet的启动过程回顾

cmd/kubelet/app/server.go:

	func Run(s *options.KubeletServer, kubeDeps *kubelet.KubeletDeps) error {
		if err := run(s, kubeDeps); err != nil {
			return fmt.Errorf("failed to run Kubelet: %v", err)
		}
		return nil
	}

cmd/kubelet/app/server.go:

	func run(s *options.KubeletServer, kubeDeps *kubelet.KubeletDeps) (err error) {
		// TODO: this should be replaced by a --standalone flag
		standaloneMode := (len(s.APIServerList) == 0 && !s.RequireKubeConfig)
		...
		if err := RunKubelet(&s.KubeletConfiguration, kubeDeps, s.RunOnce, standaloneMode); err != nil {
			return err
		}
		...

cmd/kubelet/app/server.go:

	func RunKubelet(kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *kubelet.KubeletDeps, runOnce bool, standaloneMode bool) error {
		hostname := nodeutil.GetHostname(kubeCfg.HostnameOverride)
		// Query the cloud provider for our node name, default to hostname if kcfg.Cloud == nil
		
		...
		
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
		
		...
		
		podCfg := kubeDeps.PodConfig
		
		...
		
		// process pods and exit.
		if runOnce {
			if _, err := k.RunOnce(podCfg.Updates()); err != nil {
				return fmt.Errorf("runonce failed: %v", err)
			}
			glog.Infof("Started kubelet %s as runonce", version.Get().String())
		} else {
			startKubelet(k, podCfg, kubeCfg, kubeDeps)
			glog.Infof("Started kubelet %s", version.Get().String())
		}
		return nil

cmd/kubelet/app/server.go:

	func startKubelet(k kubelet.KubeletBootstrap, podCfg *config.PodConfig, kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *kubelet.KubeletDeps) {
		// start the kubelet
		go wait.Until(func() { k.Run(podCfg.Updates()) }, 0, wait.NeverStop)
		...
	}

k的类型是Kubelet，k8s.io/kubernetes/pkg/kubelet/kubelet.go:

	// Run starts the kubelet reacting to config updates
	func (kl *Kubelet) Run(updates <-chan kubetypes.PodUpdate) {
		if kl.logServer == nil {
			kl.logServer = http.StripPrefix("/logs/", http.FileServer(http.Dir("/var/log/")))
		}
		...
		kl.syncLoop(updates, kl)
		...

## k的创建

cmd/kubelet/app/server.go:

	func RunKubelet(kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *kubelet.KubeletDeps, runOnce bool, standaloneMode bool) error {
		hostname := nodeutil.GetHostname(kubeCfg.HostnameOverride)
		// Query the cloud provider for our node name, default to hostname if kcfg.Cloud == nil
		
		...
		
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
		
		...
		
		podCfg := kubeDeps.PodConfig
		
		...

从上下文代码中可以看到，builder是CreateAndInitKubelet，`k`和`kubeDeps.PodConfig`都在这里面创建、设置。

cmd/kubelet/app/server.go:

	func CreateAndInitKubelet(kubeCfg *componentconfig.KubeletConfiguration, kubeDeps *kubelet.KubeletDeps, standaloneMode bool) (k kubelet.KubeletBootstrap, err error) {
		// TODO: block until all sources have delivered at least one update to the channel, or break the sync loop
		// up into "per source" synchronizations
		
		k, err = kubelet.NewMainKubelet(kubeCfg, kubeDeps, standaloneMode)
		if err != nil {
			return nil, err
		}
		
		k.BirthCry()
		
		k.StartGarbageCollection()
		
		return k, nil
	}

## PodConfig的创建

pkg/kubelet/kubelet.go, NewMainKubelet():

	if kubeDeps.PodConfig == nil {
		var err error
		kubeDeps.PodConfig, err = makePodSourceConfig(kubeCfg, kubeDeps, nodeName)
		if err != nil {
			return nil, err
		}
	}

## PodConfig的内容

PodConfig的Updates()方法，直接返回c.updates，看一下初始化时候做了哪些设置，谁负责向updates中写入。

	// Updates returns a channel of updates to the configuration, properly denormalized.
	func (c *PodConfig) Updates() <-chan kubetypes.PodUpdate {
		return c.updates
	}

pkg/kubelet/kubelet.go，makePodSourceConfig():

	...
	
	// source of all configuration
	cfg := config.NewPodConfig(config.PodConfigNotificationIncremental, kubeDeps.Recorder)
	
	// define file config source
	if kubeCfg.PodManifestPath != "" {
		glog.Infof("Adding manifest file: %v", kubeCfg.PodManifestPath)
		config.NewSourceFile(kubeCfg.PodManifestPath, nodeName, kubeCfg.FileCheckFrequency.Duration, cfg.Channel(kubetypes.FileSource))
	}
	
	// define url config source
	if kubeCfg.ManifestURL != "" {
		glog.Infof("Adding manifest url %q with HTTP header %v", kubeCfg.ManifestURL, manifestURLHeader)
		config.NewSourceURL(kubeCfg.ManifestURL, manifestURLHeader, nodeName, kubeCfg.HTTPCheckFrequency.Duration, cfg.Channel(kubetypes.HTTPSource))
	}
	if kubeDeps.KubeClient != nil {
		glog.Infof("Watching apiserver")
		config.NewSourceApiserver(kubeDeps.KubeClient, nodeName, cfg.Channel(kubetypes.ApiserverSource))
	}
	
	...

注意每个Source分到了不同的channel, `cfg.Channel([SourceName])`

以最后一个“Watching apiserver"为例，k8s.io/kubernetes/pkg/kubelet/config/apiserver.go:

	func NewSourceApiserver(c clientset.Interface, nodeName types.NodeName, updates chan<- interface{}) {
		lw := cache.NewListWatchFromClient(c.Core().RESTClient(), "pods", metav1.NamespaceAll, fields.OneTermEqualSelector(api.PodHostField, string(nodeName)))
		newSourceApiserverFromLW(lw, updates)
	}

在这里创建了一个lw，lw实现了ListerWatcher接口，cache相关的内容见前面的文章"kubernetes-Client-Cache"。

pkg/kubelet/config/apiserver.go:

	// newSourceApiserverFromLW holds creates a config source that watches and pulls from the apiserver.
	func newSourceApiserverFromLW(lw cache.ListerWatcher, updates chan<- interface{}) {
		send := func(objs []interface{}) {
			var pods []*v1.Pod
			for _, o := range objs {
				pods = append(pods, o.(*v1.Pod))
			}
			updates <- kubetypes.PodUpdate{Pods: pods, Op: kubetypes.SET, Source: kubetypes.ApiserverSource}
		}
		cache.NewReflector(lw, &v1.Pod{}, cache.NewUndeltaStore(send, cache.MetaNamespaceKeyFunc), 0).Run()
	}

最后一行，创建了一个reflector，并且使用的storage类型是UndeltaStore，这个store的特点是，每次遇到变更，都会调用传入的send()函数，从而将更新信息写入了channel。

这时候，只是把更新写入了每个source自己在PodConfig中分配的channel中。

## PodConfig的更新传递

pkg/kubelet/config/config.go:

	type PodConfig struct {
		pods *podStorage
		mux  *config.Mux
		
		// the channel of denormalized changes passed to listeners
		updates chan kubetypes.PodUpdate
		
		// contains the list of all configured sources
		sourcesLock sync.Mutex
		sources     sets.String
	}

创建:

	func NewPodConfig(mode PodConfigNotificationMode, recorder record.EventRecorder) *PodConfig {
		updates := make(chan kubetypes.PodUpdate, 50)
		storage := newPodStorage(updates, mode, recorder)
		podConfig := &PodConfig{
			pods:    storage,
			mux:     config.NewMux(storage),
			updates: updates,
			sources: sets.String{},
		}
		return podConfig
	}

注意mux，每个source的channel就在mux中，mux创建时传入参数storage，而storage中包含了最终的update channel。

	// NewMux creates a new mux that can merge changes from multiple sources.
	func NewMux(merger Merger) *Mux {
		mux := &Mux{
			sources: make(map[string]chan interface{}),
			merger:  merger,
		}
		return mux
	}

而在mux中创建source对应的channel时，会同时启动一个协程监听channel:

	func (m *Mux) Channel(source string) chan interface{} {
		if len(source) == 0 {
			panic("Channel given an empty name")
		}
		m.sourceLock.Lock()
		defer m.sourceLock.Unlock()
		channel, exists := m.sources[source]
		if exists {
			return channel
		}
		newChannel := make(chan interface{})
		m.sources[source] = newChannel
		go wait.Until(func() { m.listen(source, newChannel) }, 0, wait.NeverStop)
		return newChannel
	}

在listen函数中就会调用创建时传入的参数storage（类型podStorage)的`Merge()`方法：

	func (m *Mux) listen(source string, listenChannel <-chan interface{}) {
		for update := range listenChannel {
			m.merger.Merge(source, update)
		}
	}

在`podStorage`的Merge中，更具设置的规则，将更新写入最终的channel，`s.updates`，k8s.io/kubernetes/pkg/kubelet/config/config.go:

	func (s *podStorage) Merge(source string, change interface{}) error {
		s.updateLock.Lock()
		defer s.updateLock.Unlock()

		seenBefore := s.sourcesSeen.Has(source)
		adds, updates, deletes, removes, reconciles := s.merge(source, change)
		firstSet := !seenBefore && s.sourcesSeen.Has(source)

		// deliver update notifications
		switch s.mode {
		case PodConfigNotificationIncremental:
			if len(removes.Pods) > 0 {
				s.updates <- *removes
			}

Kubelet的syncLoop中就从最终的channel中得到了更新信息。

## 简而言之

每个Source在PodConfig申请一个channel，将各自通过ListerWather获得的更新写入各自的channel。

PodConfig开启一个协程监听每个Source的channel，通过podStorage中的Merge()方法，将得到的更新汇总写入到最终channel。

Kubelet的从最终的channel中得到Pod的更新信息。
