---
layout: default
title: Kubernetes的Controller-manager的工作过程
author: lijiaocn
createdate: 2017/05/08 13:54:33
changedate: 2017/05/10 11:16:08
categories: 项目
tags: kubernetes
keywords: kubernetes,controller-manger,工作原理,工作过程
description: kubernetes的controller-manager的工作过程,源码走读分析。

---

* auto-gen TOC:
{:toc}

## 启动

controller-manager的启动过程比较简单。完成了Leader选举之后，leader运行run函数，启动多个controller。

k8s.io/kubernetes/cmd/kube-controller-manager/app/controllermanager.go:

	run := func(stop <-chan struct{}) {
		rootClientBuilder := controller.SimpleControllerClientBuilder{
			ClientConfig: kubeconfig,
		}
		var clientBuilder controller.ControllerClientBuilder
		if len(s.ServiceAccountKeyFile) > 0 && s.UseServiceAccountCredentials {
			clientBuilder = controller.SAControllerClientBuilder{
				ClientConfig:         restclient.AnonymousClientConfig(kubeconfig),
				CoreClient:           kubeClient.Core(),
				AuthenticationClient: kubeClient.Authentication(),
				Namespace:            "kube-system",
			}
		} else {
			clientBuilder = rootClientBuilder
		}
		
		err := StartControllers(newControllerInitializers(), s, rootClientBuilder, clientBuilder, stop)
		glog.Fatalf("error running controllers: %v", err)
		panic("unreachable")
	}

## Controllers

k8s.io/kubernetes/cmd/kube-controller-manager/app/controllermanager.go:

	func newControllerInitializers() map[string]InitFunc {
		controllers := map[string]InitFunc{}
		controllers["endpoint"] = startEndpointController
		controllers["replicationcontroller"] = startReplicationController
		controllers["podgc"] = startPodGCController
		controllers["resourcequota"] = startResourceQuotaController
		controllers["namespace"] = startNamespaceController
		controllers["serviceaccount"] = startServiceAccountController
		controllers["garbagecollector"] = startGarbageCollectorController
		controllers["daemonset"] = startDaemonSetController
		controllers["job"] = startJobController
		controllers["deployment"] = startDeploymentController
		controllers["replicaset"] = startReplicaSetController
		controllers["horizontalpodautoscaling"] = startHPAController
		controllers["disruption"] = startDisruptionController
		controllers["statefuleset"] = startStatefulSetController
		controllers["cronjob"] = startCronJobController
		controllers["certificatesigningrequests"] = startCSRController
		controllers["ttl"] = startTTLController
		controllers["bootstrapsigner"] = startBootstrapSignerController
		controllers["tokencleaner"] = startTokenCleanerController
		
		return controllers
	}

每个controller承担不同的工作，譬如EndpointController负责维护Service的endpoint（service对应的pod的IP)，具体内容还是看代码为好，这里不展开了。

### StartControllers

k8s.io/kubernetes/cmd/kube-controller-manager/app/controllermanager.go:

	func StartControllers(controllers map[string]InitFunc, s *options.CMServer, rootClientBuilder, clientBuilder controller.ControllerClientBuilder, stop <-chan struct{}) error {
		versionedClient := rootClientBuilder.ClientOrDie("shared-informers")
		sharedInformers := informers.NewSharedInformerFactory(versionedClient, ResyncPeriod(s)())
		...
		ctx := ControllerContext{
			ClientBuilder:      clientBuilder,
			InformerFactory:    sharedInformers,
			Options:            *s,
			AvailableResources: availableResources,
			Stop:               stop,
		}

versionedClient被用来创建sharedInformers，sharedInformers又被用来创建ControllerContext。

启动具体的controller的时候，又会传入ControllerContext，这里以endpointController为例子:

k8s.io/kubernetes/cmd/kube-controller-manager/app/core.go:

	func startEndpointController(ctx ControllerContext) (bool, error) {
		go endpointcontroller.NewEndpointController(
			ctx.InformerFactory.Core().V1().Pods(),
			ctx.InformerFactory.Core().V1().Services(),
			ctx.ClientBuilder.ClientOrDie("endpoint-controller"),
		).Run(int(ctx.Options.ConcurrentEndpointSyncs), ctx.Stop)
		return true, nil
	}

在了解`Run()`中做了哪些事情之前，先看一下传入参数，NewEndpointController的传入参数。

### ctx.InformerFactory，即sharedInformers

ctx.InformerFactory就是变量sharedInformers，sharedInformers实现了接口SharedInformerFactory。

k8s.io/kubernetes/cmd/kube-controller-manager/app/controllermanager.go:

	sharedInformers := informers.NewSharedInformerFactory(versionedClient, ResyncPeriod(s)())

startEndpointController中调用了`ctx.InformerFactory.Core().V1().Pods()`，依次看着这些方法里做了什么事情。

sharedInformers.Core(), k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/factory.go:

	func (f *sharedInformerFactory) Core() core.Interface {
		return core.New(f)
	}

core.New(f), k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/interface.go

	func New(f internalinterfaces.SharedInformerFactory) Interface {
		return &group{f}
	}

group, k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/interface.go:

	type group struct {
		internalinterfaces.SharedInformerFactory
	}

ctx.InformerFactory.Core()执行后就是创建了一个group类型的变量，唯一成员就调用者sharedInformers，而在随后的V1()中，又使用了v1.New()

`InformerFactory.Core().V1()`，k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/interface.go:

	func (g *group) V1() v1.Interface {
		return v1.New(g.SharedInformerFactory)
	}

`v1.New()`，k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/v1/interface.go:

	func New(f internalinterfaces.SharedInformerFactory) Interface {
		return &version{f}
	}

继续传递sharedInformers，直到创建了类型为`version`的变量，version变量实现了Interface接口

k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/v1/interface.go:

	type Interface interface {
		ComponentStatuses() ComponentStatusInformer
		ConfigMaps() ConfigMapInformer
		Endpoints() EndpointsInformer
		Events() EventInformer
		LimitRanges() LimitRangeInformer
		Pods() PodInformer
		...

通过version的成员方法，可以得到类型更为具体的Informer，例如`ctx.InformerFactory.Core().V1().Pods()`:

k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/v1/interface.go:

	func (v *version) Pods() PodInformer {
		return &podInformer{factory: v.SharedInformerFactory}
	}

一言而概之，这个过程就是以sharedInformers为传入参数，生成更为具体的Informer，后续从更为具体的Informer中获取信息。

### podInformer

以podInformer为例子大概了解一下Informer。

k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/v1/pod.go:

	type podInformer struct {
		factory internalinterfaces.SharedInformerFactory
	}

	--podInformer : struct
	    [fields]
	   -factory : internalinterfaces.SharedInformerFactory
	    [methods]
	   +Informer() : cache.SharedIndexInformer
	   +Lister() : v1.PodLister

k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/v1/pod.go:

	func (f *podInformer) Lister() v1.PodLister {
		return v1.NewPodLister(f.Informer().GetIndexer())
	}

	func (f *podInformer) Informer() cache.SharedIndexInformer {
		return f.factory.InformerFor(&api_v1.Pod{}, newPodInformer)
	}

注意f.factory就是前面一开始创的变量`sharedInformers`:

k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/factory.go:

	func (f *sharedInformerFactory) InformerFor(obj runtime.Object, newFunc internalinterfaces.NewInformerFunc) cache.SharedIndexInformer {
		f.lock.Lock()
		defer f.lock.Unlock()

		informerType := reflect.TypeOf(obj)
		informer, exists := f.informers[informerType]
		if exists {
			return informer
		}
		informer = newFunc(f.client, f.defaultResync)
		f.informers[informerType] = informer

		return informer
	}

newFunc就是newPodInformer，而f.client就是一开始就创建的`versionedClient`。

newPodInformer，k8s.io/kubernetes/pkg/client/informers/informers_generated/externalversions/core/v1/pod.go:

	func newPodInformer(client clientset.Interface, resyncPeriod time.Duration) cache.SharedIndexInformer {
		sharedIndexInformer := cache.NewSharedIndexInformer(
			&cache.ListWatch{
				ListFunc: func(options meta_v1.ListOptions) (runtime.Object, error) {
					return client.CoreV1().Pods(meta_v1.NamespaceAll).List(options)
				},
				WatchFunc: func(options meta_v1.ListOptions) (watch.Interface, error) {
					return client.CoreV1().Pods(meta_v1.NamespaceAll).Watch(options)
				},
			},
			&api_v1.Pod{},
			resyncPeriod,
			cache.Indexers{cache.NamespaceIndex: cache.MetaNamespaceIndexFunc},
		)
		
		return sharedIndexInformer
	}

PodInformer就是一个类型为sharedIndexInformer的变量，它的ListFunc和WatchFunc只通过client获取pod相关的信息。

### EndpointController

以EndpointController为例，说明controller是如何使用Informer。

创建EndpointController的时候，传入具体类型的Informer，例如EndpoingController的创建:

k8s.io/kubernetes/cmd/kube-controller-manager/app/core.go

	func startEndpointController(ctx ControllerContext) (bool, error) {
		go endpointcontroller.NewEndpointController(
			ctx.InformerFactory.Core().V1().Pods(),
			ctx.InformerFactory.Core().V1().Services(),
			ctx.ClientBuilder.ClientOrDie("endpoint-controller"),
		).Run(int(ctx.Options.ConcurrentEndpointSyncs), ctx.Stop)
		return true, nil
	}

NewEndpointController()，k8s.io/kubernetes/pkg/controller/endpoint/endpoints_controller.go:

	func NewEndpointController(podInformer coreinformers.PodInformer, serviceInformer coreinformers.ServiceInformer, client clientset.Interface) *EndpointController {
		if client != nil && client.Core().RESTClient().GetRateLimiter() != nil {
			metrics.RegisterMetricAndTrackRateLimiterUsage("endpoint_controller", client.Core().RESTClient().GetRateLimiter())
		}
		...
		podInformer.Informer().AddEventHandler(cache.ResourceEventHandlerFuncs{
			AddFunc:    e.addPod,
			UpdateFunc: e.updatePod,
			DeleteFunc: e.deletePod,
		})
		e.podLister = podInformer.Lister()
		e.podsSynced = podInformer.Informer().HasSynced
		...

可以看到在podInformer中注入了事件响应方法,`e.addPod`、`e.updatePod`、`e.deletePod`，这三个方法负责维护EndpointController中的数据。

例入addPod，当有新的pod时候，addPod会找到这个pod对应的services，把service作为key写入queue。

k8s.io/kubernetes/pkg/controller/endpoint/endpoints_controller.go

	func (e *EndpointController) addPod(obj interface{}) {
		pod := obj.(*v1.Pod)
		services, err := e.getPodServiceMemberships(pod)
		if err != nil {
			utilruntime.HandleError(fmt.Errorf("Unable to get pod %v/%v's service memberships: %v", pod.Namespace, pod.Name, err))
			return
		}
		for key := range services {
			e.queue.Add(key)
		}
	}

EndpointController的主工作流程就会从queue中取出受到影响的service，完成对应的处理:

### EndpointController主流程

Run()，k8s.io/kubernetes/pkg/controller/endpoint/endpoints_controller.go:

	func (e *EndpointController) Run(workers int, stopCh <-chan struct{}) {
		...
		for i := 0; i < workers; i++ {
			go wait.Until(e.worker, time.Second, stopCh)
		}
		...
	}

worker()，k8s.io/kubernetes/pkg/controller/endpoint/endpoints_controller.go:

	func (e *EndpointController) worker() {
		for e.processNextWorkItem() {
		}
	}

processNextWorkItem()，k8s.io/kubernetes/pkg/controller/endpoint/endpoints_controller.go:

	func (e *EndpointController) processNextWorkItem() bool {
		eKey, quit := e.queue.Get()
		if quit {
			return false
		}
		defer e.queue.Done(eKey)

		err := e.syncService(eKey.(string))
		...
	}

syncService()，k8s.io/kubernetes/pkg/controller/endpoint/endpoints_controller.go:

	func (e *EndpointController) syncService(key string) error {
	...
	if createEndpoints {
		_, err = e.client.Core().Endpoints(service.Namespace).Create(newEndpoints)
	} else {
		_, err = e.client.Core().Endpoints(service.Namespace).Update(newEndpoints)
	}

