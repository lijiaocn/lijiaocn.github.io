---
layout: default
title: kubernetes 的 Apiserver 的 storage 使用
author: 李佶澳
createdate: 2017/05/10 11:12:12
last_modified_at: 2017/06/09 15:19:29
categories: 项目
tags: kubernetes
keywords: kubernetes,etcd,apiserver
description: kubernetes中只有apiserver会直接使用etcd，其它的组件与apiserver交互，不会直接访问etcd。

---

## 目录
* auto-gen TOC:
{:toc}

在[kubernetes-apiserver][1]中介绍过，apiserver使用的kubernetes-style apiserver:

	1. 在APIGroupInfo中装载各类的storage
	2. GenericAPIServer依据传入的APIGroupInfo中的storage，自动生成REST handler。

apiserver在存取资源时，最终是通过各个storage完成，这里探究一下storage怎样创建的，又是怎样与etcd关联上的。

注意v1.6.4版本的代码发生了一些变化，主要是apiserver启动时config初始化的代码统一放置在了BuildMasterConfig()中，代码更为清晰了。

	func Run(s *options.ServerRunOptions) error {
	    config, sharedInformers, err := BuildMasterConfig(s)
	    if err != nil {
	        return err
	    }
	
	    return RunServer(config, sharedInformers, wait.NeverStop)
	}

storage的机制没有变化，下面的分析过程依然适用于v1.6.4。

## 代码结构

`registry`目录下收录的就是kubernetes的每类资源的REST实现代码。

	k8s.io/kubernetes/pkg/registry/
	▾ apps/
	  ▸ petset/
	  ▸ rest/
	       storage_apps.go
	▸ authentication/
	▸ authorization/
	▸ autoscaling/
	▸ batch/
	▸ cachesize/
	▸ certificates/
	▸ core/             #core/rest中实现了NewLegacyRESTStorage()
	▸ extensions/
	▸ policy/
	▸ rbac/
	▸ registrytest/
	▸ settings/
	▸ storage/

每类资源目录下都有一个rest目录，其中实现了各自的storage。例如`apps/rest`中的代码定义了可以提供给GenericAPIServer的storage。

## 设置过程

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func Run(runOptions *options.ServerRunOptions, stopCh <-chan struct{}) error {
		kubeAPIServerConfig, sharedInformers, insecureServingOptions, err := CreateKubeAPIServerConfig(runOptions)
		...
		kubeAPIServer, err := CreateKubeAPIServer(kubeAPIServerConfig, sharedInformers, stopCh)
		...

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func CreateKubeAPIServer(kubeAPIServerConfig *master.Config, sharedInformers informers.SharedInformerFactory, stopCh <-chan struct{}) (*master.Master, error) {
		kubeAPIServer, err := kubeAPIServerConfig.Complete().New()
		...

记住这里的`kubeAPIServerConfig`，还会回来找它的！

storage在kubeAPIServerConfig.Complete().New()中完成了设置。

v1.6.4中这部代码做了更改，结构更为清晰了：

cmd/kube-apiserver/app/server.go:

	func Run(s *options.ServerRunOptions) error {
		//在BuildMasterConfig中创建了config
		config, sharedInformers, err := BuildMasterConfig(s)
		if err != nil {
			return err
		}
		
		return RunServer(config, sharedInformers, wait.NeverStop)
	}
	
	func RunServer(config *master.Config, sharedInformers informers.SharedInformerFactory, stopCh <-chan struct{}) error {
		//在config.Complete().New()中完成所有的设置，包括storage的设置。
		m, err := config.Complete().New()
		if err != nil {
			return err
		}
		
		sharedInformers.Start(stopCh)
		return m.GenericAPIServer.PrepareRun().Run(stopCh)
	}

## storage的设置

k8s.io/kubernetes/pkg/master/master.go:

	func (c completedConfig) New() (*Master, error) {
		...
		m := &Master{
			GenericAPIServer: s,
		}
		if c.APIResourceConfigSource.AnyResourcesForVersionEnabled(apiv1.SchemeGroupVersion) {
			legacyRESTStorageProvider := corerest.LegacyRESTStorageProvider{
				StorageFactory:       c.StorageFactory,
				ProxyTransport:       c.ProxyTransport,
				KubeletClientConfig:  c.KubeletClientConfig,
				EventTTL:             c.EventTTL,
				ServiceIPRange:       c.ServiceIPRange,
				ServiceNodePortRange: c.ServiceNodePortRange,
				LoopbackClientConfig: c.GenericConfig.LoopbackClientConfig,
			}
			//装载pod、service的资源操作的REST api
			m.InstallLegacyAPI(c.Config, c.Config.GenericConfig.RESTOptionsGetter, legacyRESTStorageProvider)
		}
		restStorageProviders := []RESTStorageProvider{
			authenticationrest.RESTStorageProvider{Authenticator: c.GenericConfig.Authenticator},
			authorizationrest.RESTStorageProvider{Authorizer: c.GenericConfig.Authorizer},
			autoscalingrest.RESTStorageProvider{},
			batchrest.RESTStorageProvider{},
			certificatesrest.RESTStorageProvider{},
			extensionsrest.RESTStorageProvider{ResourceInterface: thirdparty.NewThirdPartyResourceServer(s, c.StorageFactory)},
			policyrest.RESTStorageProvider{},
			rbacrest.RESTStorageProvider{Authorizer: c.GenericConfig.Authorizer},
			settingsrest.RESTStorageProvider{},
			storagerest.RESTStorageProvider{},
			// keep apps after extensions so legacy clients resolve the extensions versions of shared resource names.
			// See https://github.com/kubernetes/kubernetes/issues/42392
			appsrest.RESTStorageProvider{},
		}
		//装载其它的api
		m.InstallAPIs(c.Config.APIResourceConfigSource, c.Config.GenericConfig.RESTOptionsGetter, restStorageProviders...)

留意这里创建的`legacyRESTStorageProvider`和`restStorageProviders`，通过接下来的过程可以看到storage最终是由它们创建的。

## m.InstallLegacyAPI()

	//k8s.io/kubernetes/pkg/master/master.go:
	func (m *Master) InstallLegacyAPI(c *Config, restOptionsGetter generic.RESTOptionsGetter, legacyRESTStorageProvider corerest.LegacyRESTStorageProvider) {
		legacyRESTStorage, apiGroupInfo, err := legacyRESTStorageProvider.NewLegacyRESTStorage(restOptionsGetter)
		...
		if err := m.GenericAPIServer.InstallLegacyAPIGroup(genericapiserver.DefaultLegacyAPIPrefix, &apiGroupInfo); err != nil {
			glog.Fatalf("Error in registering group versions: %v", err)
		}
		...

可以看到，这里生成了一个apiGroupInfo，然后将其装载到了`m.GenericAPIServer`中，与GenericAPIServer的工作方式衔接上了。

## legacyRESTStorageProvider

在上面的代码中看到，apiGroupInfo是通过调用 legacyRESTStorageProvider.NewLegacyRESTStorage () 创建的。

	//k8s.io/kubernetes/pkg/registry/core/rest/storage_core.go
	func (c LegacyRESTStorageProvider) NewLegacyRESTStorage(restOptionsGetter generic.RESTOptionsGetter) (LegacyRESTStorage, genericapiserver.APIGroupInfo, error) {
		apiGroupInfo := genericapiserver.APIGroupInfo{
			GroupMeta:                    *api.Registry.GroupOrDie(api.GroupName),
			VersionedResourcesStorageMap: map[string]map[string]rest.Storage{},
			Scheme:                      api.Scheme,
			ParameterCodec:              api.ParameterCodec,
			NegotiatedSerializer:        api.Codecs,
			SubresourceGroupVersionKind: map[string]schema.GroupVersionKind{},
		}
		restStorage := LegacyRESTStorage{}
		...
		nodeStorage, err := nodestore.NewStorage(restOptionsGetter, c.KubeletClientConfig, c.ProxyTransport)
		...
		//按资源创建了Storage
		podTemplateStorage := podtemplatestore.NewREST(restOptionsGetter)
		eventStorage := eventstore.NewREST(restOptionsGetter, uint64(c.EventTTL.Seconds()))
		limitRangeStorage := limitrangestore.NewREST(restOptionsGetter)
		...
		podStorage := podstore.NewStorage(
				restOptionsGetter,
				nodeStorage.KubeletConnectionInfo,
				c.ProxyTransport,
				podDisruptionClient,
				)
		...
		
		//将新建的storage保存到
		restStorageMap := map[string]rest.Storage{
			"pods":             podStorage.Pod,
			"pods/attach":      podStorage.Attach,
			"pods/status":      podStorage.Status,
			"pods/log":         podStorage.Log,
			...
			"nodes":        nodeStorage.Node,
		...
		//restStorageMap被装载到了apiGroupInfo
		apiGroupInfo.VersionedResourcesStorageMap["v1"] = restStorageMap
		...

重点分析几个具体的storage，了解它们的实现。

### nodeStorage 

在上面的代码中可以看到nodeStorage是通过调用`nodestore.NewStorage`创建的。

	//k8s.io/kubernetes/pkg/registry/core/node/storage/storage.go:
	func NewStorage(optsGetter generic.RESTOptionsGetter, kubeletClientConfig client.KubeletClientConfig, proxyTransport http.RoundTripper) (*NodeStorage, error) {
		store := &genericregistry.Store{
		...
		return &NodeStorage{
			Node:   nodeREST,
			Status: statusREST,
			Proxy:  proxyREST,
			KubeletConnectionInfo: connectionInfoGetter,
		}, nil
		...

NodeStorage的成员变量`Status`实现了Get()、New()、Update(), Status类型是｀StatusREST`。

	-+StatusREST : struct
	    [fields]
	   -store : *genericregistry.Store
	    [methods]
	   +Get(ctx genericapirequest.Context, name string, options *metav1.GetOptions) : runtime.Object, error
	   +New() : runtime.Object
	   +Update(ctx genericapirequest.Context, name string, objInfo rest.UpdatedObjectInfo) : runtime.Object, bool, error

`StatusREST.Get()`:

	func (r *StatusREST) Get(ctx genericapirequest.Context, name string, options *metav1.GetOptions) (runtime.Object, error) {
		return r.store.Get(ctx, name, options)
	}

回到创建NodeStorage的函数中，找到变量`StatusREST.store`的创建。

	//k8s.io/kubernetes/pkg/registry/core/node/storage/storage.go:
	func NewStorage(optsGetter generic.RESTOptionsGetter, kubeletClientConfig client.KubeletClientConfig, proxyTransport http.RoundTripper) (*NodeStorage, error) {
		store := &genericregistry.Store{
			Copier:      api.Scheme,
			NewFunc:     func() runtime.Object { return &api.Node{} },
			NewListFunc: func() runtime.Object { return &api.NodeList{} },
			ObjectNameFunc: func(obj runtime.Object) (string, error) {
				return obj.(*api.Node).Name, nil
			},
			PredicateFunc:     node.MatchNode,
			QualifiedResource: api.Resource("nodes"),
			WatchCacheSize:    cachesize.GetWatchCacheSizeByResource("nodes"),
			
			CreateStrategy: node.Strategy,
			UpdateStrategy: node.Strategy,
			DeleteStrategy: node.Strategy,
			ExportStrategy: node.Strategy,
		}
		...
		statusStore := *store
		statusStore.UpdateStrategy = node.StatusStrategy
		...
		//r.store就是statusStore
		statusREST := &StatusREST{store: &statusStore}
		...
		return &NodeStorage{
			Node:   nodeREST,
			Status: statusREST,
			Proxy:  proxyREST,
			KubeletConnectionInfo: connectionInfoGetter,
		}, nil
	}

可以看到，`StatusREST.store`是`genericregistry.Store`。

`genericregistry.Store`中包含了NewFunc、NewListFunc等函数变量，需要看一下genericregistry.Store的Get等方法是怎样实现的。

#### genericregistry.Store

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go:
	// Store implements pkg/api/rest.StandardStorage. It's intended to be
	// embeddable and allows the consumer to implement any non-generic functions
	// that are required. This object is intended to be copyable so that it can be
	// used in different ways but share the same underlying behavior.
	//
	// All fields are required unless specified.
	//
	// The intended use of this type is embedding within a Kind specific
	// RESTStorage implementation. This type provides CRUD semantics on a Kubelike
	// resource, handling details like conflict detection with ResourceVersion and
	// semantics. The RESTCreateStrategy, RESTUpdateStrategy, and
	// RESTDeleteStrategy are generic across all backends, and encapsulate logic
	// specific to the API.

genericregistry.Store的成员:

	-+Store : struct
	    [fields]
	   +AfterCreate : ObjectFunc
	   +AfterDelete : ObjectFunc
	   +AfterUpdate : ObjectFunc
	   +Copier : runtime.ObjectCopier
	   +CreateStrategy : rest.RESTCreateStrategy
	   +Decorator : ObjectFunc
	   +DeleteCollectionWorkers : int
	   +DeleteStrategy : rest.RESTDeleteStrategy
	   +DestroyFunc : func()
	   +EnableGarbageCollection : bool
	   +ExportStrategy : rest.RESTExportStrategy
	   +KeyFunc : func(ctx genericapirequest.Context, name string) string, error
	   +KeyRootFunc : func(ctx genericapirequest.Context) string
	   +NewFunc : func() runtime.Object
	   +NewListFunc : func() runtime.Object
	   +ObjectNameFunc : func(obj runtime.Object) string, error
	   +PredicateFunc : func(label labels.Selector, field fields.Selector) storage.SelectionPredicate
	   +QualifiedResource : schema.GroupResource
	   +ReturnDeletedObject : bool
	   +Storage : storage.Interface
	   +TTLFunc : func(obj runtime.Object, existing uint64, update bool) uint64, error
	   +UpdateStrategy : rest.RESTUpdateStrategy
	   +WatchCacheSize : int
	    [methods]
	   +CompleteWithOptions(options *generic.StoreOptions) : error
	   +Create(ctx genericapirequest.Context, obj runtime.Object) : runtime.Object, error
	   +Delete(ctx genericapirequest.Context, name string, options *metav1.DeleteOptions) : runtime.Object, bool, error
	   +DeleteCollection(ctx genericapirequest.Context, options *metav1.DeleteOptions, listOptions *metainternalversion.ListOptions) : runtime.Object, error
	   +Export(ctx genericapirequest.Context, name string, opts metav1.ExportOptions) : runtime.Object, error
	   +Get(ctx genericapirequest.Context, name string, options *metav1.GetOptions) : runtime.Object, error
	   +List(ctx genericapirequest.Context, options *metainternalversion.ListOptions) : runtime.Object, error
	   +ListPredicate(ctx genericapirequest.Context, p storage.SelectionPredicate, options *metainternalversion.ListOptions) : runtime.Object, error
	   +New() : runtime.Object
	   +NewList() : runtime.Object
	   +Update(ctx genericapirequest.Context, name string, objInfo rest.UpdatedObjectInfo) : runtime.Object, bool, error
	   +Watch(ctx genericapirequest.Context, options *metainternalversion.ListOptions) : watch.Interface, error
	   +WatchPredicate(ctx genericapirequest.Context, p storage.SelectionPredicate, resourceVersion string) : watch.Interface, error

看一下`Create()`方法的实现:

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go，
	func (e *Store) Create(ctx genericapirequest.Context, obj runtime.Object) (runtime.Object, error) {
		if err := rest.BeforeCreate(e.CreateStrategy, ctx, obj); err != nil {
			return nil, err
		}
		
		name, err := e.ObjectNameFunc(obj)
		...
		key, err := e.KeyFunc(ctx, name)
		...
		ttl, err := e.calculateTTL(obj, 0, false)
		...
		out := e.NewFunc()
		if err := e.Storage.Create(ctx, key, obj, out, ttl); err != nil {
			...
		}
		if e.AfterCreate != nil {
			...
		}
		if e.Decorator != nil {
			...
		}
		return out, nil
	}

`e.NewFunc()`是创建时传入的变量，对于NodeStorage而言是:

	 store := &genericregistry.Store{
	    Copier:      api.Scheme,
	    NewFunc:     func() runtime.Object { return &api.Node{} },
	    NewListFunc: func() runtime.Object { return &api.NodeList{} },
	    ObjectNameFunc: func(obj runtime.Object) (string, error) {
	        return obj.(*api.Node).Name, nil
	    },
	    PredicateFunc:     node.MatchNode,
	    QualifiedResource: api.Resource("nodes"),
	    WatchCacheSize:    cachesize.GetWatchCacheSizeByResource("nodes"),
	
	    CreateStrategy: node.Strategy,
	    UpdateStrategy: node.Strategy,
	    DeleteStrategy: node.Strategy,
	    ExportStrategy: node.Strategy,
	}

创建时在调用了e.NewFunc()之后，又调用了`e.Storage.Create(ctx, key, obj, out, ttl)`，需要继续回溯找到创建`e.Storage`的地方。

创建store时，传入参数中没有e.Storage，所以应该是store建立后再设置的e.Storage。

	//k8s.io/kubernetes/pkg/registry/core/node/storage/storage.go:
	func NewStorage(optsGetter generic.RESTOptionsGetter, kubeletClientConfig client.KubeletClientConfig, proxyTransport http.RoundTripper) (*NodeStorage, error) {
		store := &genericregistry.Store{
			Copier:      api.Scheme,
		...
		options := &generic.StoreOptions{RESTOptions: optsGetter, AttrFunc: node.GetAttrs, TriggerFunc: node.NodeNameTriggerFunc}
		if err := store.CompleteWithOptions(options); err != nil {
			return nil, err
		}
		...

回溯代码的时候，发现了`store.CompleteWithOptions()`，kubernetes的代码中经常会用这种方式来补全一个结构体的成员变量。

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go:
	func (e *Store) CompleteWithOptions(options *generic.StoreOptions) error {
		...
		opts, err := options.RESTOptions.GetRESTOptions(e.QualifiedResource)
		...
		if e.Storage == nil {
			capacity := DefaultWatchCacheSize
			if e.WatchCacheSize != 0 {
				capacity = e.WatchCacheSize
			}
			e.Storage, e.DestroyFunc = opts.Decorator(
				e.Copier,
				opts.StorageConfig,
				capacity,
				e.NewFunc(),
				prefix,
				keyFunc,
				e.NewListFunc,
				options.AttrFunc,
				triggerFunc,
			)
		}
		...

不出所料，e.Storage就是在这里创建的，还需要继续回溯，找到`opts.Decorator()`的实现。

##### opts.Decorator()

要找到opts.Decorator()的实现，看它是如何创建了e.Storage。

在上面的代码中可以看到opts是通过`options.RESTOptions.GetRESTOptions()`创建的。

而options则是在NewStorage中调用store.CompletWithOptions之前创建的，如下所示：

	//k8s.io/kubernetes/pkg/registry/core/node/storage/storage.go:
	func NewStorage(optsGetter generic.RESTOptionsGetter, kubeletClientConfig client.KubeletClientConfig, proxyTransport http.RoundTripper) (*NodeStorage, error) {
		store := &genericregistry.Store{
			Copier:      api.Scheme,
		...
		//options的创建
		options := &generic.StoreOptions{RESTOptions: optsGetter, AttrFunc: node.GetAttrs, TriggerFunc: node.NodeNameTriggerFunc}
		if err := store.CompleteWithOptions(options); err != nil {
			return nil, err
		}
		...

options.RESTOptions就是变量optsGetter，继续回溯，找到`optsGetter`的实现：

	//k8s.io/kubernetes/pkg/master/master.go:
	func (c completedConfig) New() (*Master, error) {
		...
		m := &Master{
			GenericAPIServer: s,
		}
		if c.APIResourceConfigSource.AnyResourcesForVersionEnabled(apiv1.SchemeGroupVersion) {
			...
			//装载pod、service的资源操作的REST api
			//参数2就是optsGetter
			m.InstallLegacyAPI(c.Config, c.Config.GenericConfig.RESTOptionsGetter, legacyRESTStorageProvider)
		}

c.Config.GenericConfig.RESTOptionsGetter就是optsGetter，而c.Config就是一开始就提醒要记住的`kubeAPIServerConfig`:

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	func Run(runOptions *options.ServerRunOptions, stopCh <-chan struct{}) error {
		kubeAPIServerConfig, sharedInformers, insecureServingOptions, err := CreateKubeAPIServerConfig(runOptions)
		...

要找到 kubeAPIServerConfig.GenericConfig. RESTOptionsGetter

	//src/k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	func CreateKubeAPIServerConfig(s *options.ServerRunOptions) (*master.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
	
		//genericConfig在这里创建
		genericConfig, sharedInformers, insecureServingOptions, err := BuildGenericConfig(s)
		...
		config := &master.Config{
			GenericConfig: genericConfig,
		...
		return config, sharedInformers, insecureServingOptions, nil
	}

BuildGenericConfig()：

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	func BuildGenericConfig(s *options.ServerRunOptions) (*genericapiserver.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		genericConfig := genericapiserver.NewConfig(api.Codecs)

NewConfig()：

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:
	func NewConfig(codecs serializer.CodecFactory) *Config {
		return &Config{
			Serializer:                  codecs,
			ReadWritePort:               443,
			RequestContextMapper:        apirequest.NewRequestContextMapper(),
			BuildHandlerChainFunc:       DefaultBuildHandlerChain,
			LegacyAPIGroupPrefixes:      sets.NewString(DefaultLegacyAPIPrefix),
			HealthzChecks:               []healthz.HealthzChecker{healthz.PingHealthz},
			EnableIndex:                 true,
			EnableDiscovery:             true,
			EnableProfiling:             true,
			MaxRequestsInFlight:         400,
			MaxMutatingRequestsInFlight: 200,
			MinRequestTimeout:           1800,
			
			// Default to treating watch as a long-running operation
			// Generic API servers have no inherent long-running subresources
			LongRunningFunc: genericfilters.BasicLongRunningRequestCheck(sets.NewString("watch"), sets.NewString()),
		}
	}

kubeAPIServerConfig的创建过程中，没有设置RESTOptionsGetter，回溯继续找。

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go
	func Run(runOptions *options.ServerRunOptions, stopCh <-chan struct{}) error {
		//这里没有设置RESTOptionsGetter
		kubeAPIServerConfig, sharedInformers, insecureServingOptions, err := CreateKubeAPIServerConfig(runOptions)
		if err != nil {
			return err
		}
		//到这里看一下
		kubeAPIServer, err := CreateKubeAPIServer(kubeAPIServerConfig, sharedInformers, stopCh)
		if err != nil {
			return err
		}

到`CreateKubeAPIServer()`中看一下:

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	func CreateKubeAPIServer(kubeAPIServerConfig *master.Config, sharedInformers informers.SharedInformerFactory, stopCh <-chan struct{}) (*master.Master, error) {
		kubeAPIServer, err := kubeAPIServerConfig.Complete().New()
		...

这里又有一个Complete()函数，看到这个就开心了，因为kubernetes中通常都是在Complete()中设置必须设置的变量。

	//k8s.io/kubernetes/pkg/master/master.go:
	func (c *Config) Complete() completedConfig {
		c.GenericConfig.Complete()
		...

我们现在要找的是 kubeAPIServerConfig.GenericConfig.RESTOptionsGetter ，在 c.GenericConfig 的 Complete() 方法没有发现设置 RESTOptionsGetter。

回到创建c.GenericConfig的地方，继续寻找。

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	func CreateKubeAPIServerConfig(s *options.ServerRunOptions) (*master.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		...
		genericConfig, sharedInformers, insecureServingOptions, err := BuildGenericConfig(s)
		...
		config := &master.Config{
			GenericConfig: genericConfig,
		...

c.GenericConfig是在BuildGenericConfig中创建的。

BuildGenericConfig():

	//k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:
	func BuildGenericConfig(s *options.ServerRunOptions) (*genericapiserver.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		//这里没有设置RESTOptionsGetter
		genericConfig := genericapiserver.NewConfig(api.Codecs)
		...
		if err := s.Etcd.ApplyWithStorageFactoryTo(storageFactory, genericConfig); err != nil {
			return nil, nil, nil, err
		}

进入到`s.Etcd.ApplyWithStorageFactoryTo()`中，才猛然发现:

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/options/etcd.go:
	func (s *EtcdOptions) ApplyWithStorageFactoryTo(factory serverstorage.StorageFactory, c *server.Config) error {
		c.RESTOptionsGetter = &storageFactoryRestOptionsFactory{Options: *s, StorageFactory: factory}
		return nil
	}

而且注意s的类型是EtcdOptions!

要找的目标是e.Storage -> opts.Decorator -> opts -> options.RESTOptions.GetRESTOptions。

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/options/etcd.go:
	func (f *storageFactoryRestOptionsFactory) GetRESTOptions(resource schema.GroupResource) (generic.RESTOptions, error) {
		storageConfig, err := f.StorageFactory.NewConfig(resource)
		if err != nil {
			return generic.RESTOptions{}, fmt.Errorf("unable to find storage destination for %v, due to %v", resource, err.Error())
		}

		ret := generic.RESTOptions{
			StorageConfig:           storageConfig,
			Decorator:               generic.UndecoratedStorage,
			DeleteCollectionWorkers: f.Options.DeleteCollectionWorkers,
			EnableGarbageCollection: f.Options.EnableGarbageCollection,
			ResourcePrefix:          f.StorageFactory.ResourcePrefix(resource),
		}
		if f.Options.EnableWatchCache {
			ret.Decorator = genericregistry.StorageWithCacher
		}

		return ret, nil
	}

找到Decorator了，e.Storage就是通过调用这个函数实现的，也就是genericregistry.StorageWithCacher:

##### genericregistry.StorageWithCacher()

别忘了NodeStorage最终落实到e.Storage，而e.Storage是通过opts.Decorator()创建的。

opt.Decorator就是genericregistry.StorageWithCacher()

	//k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/storage_factory.go:
	func StorageWithCacher(
		copier runtime.ObjectCopier,
		storageConfig *storagebackend.Config,
		capacity int,
		objectType runtime.Object,
		resourcePrefix string,
		keyFunc func(obj runtime.Object) (string, error),
		newListFunc func() runtime.Object,
		getAttrsFunc storage.AttrFunc,
		triggerFunc storage.TriggerPublisherFunc) (storage.Interface, factory.DestroyFunc) {
		...
	s, d := generic.NewRawStorage(storageConfig)
	cacherConfig := storage.CacherConfig{
		CacheCapacity:        capacity,
		Storage:              s,
		Versioner:            etcdstorage.APIObjectVersioner{},
		Copier:               copier,
		Type:                 objectType,
		ResourcePrefix:       resourcePrefix,
		KeyFunc:              keyFunc,
		NewListFunc:          newListFunc,
		GetAttrsFunc:         getAttrsFunc,
		TriggerPublisherFunc: triggerFunc,
		Codec:                storageConfig.Codec,
	}
	cacher := storage.NewCacherFromConfig(cacherConfig)
	destroyFunc := func() {
		cacher.Stop()
		d()
	}
	
	return cacher, destroyFunc
	}

StorageWithCache又是一个很复杂的过程，它会与etcd通信。

## m.InstallAPIs()

m.InstallAPIS()装载了其它个api组

### authenticationrest. RESTStorageProvider

	//k8s.io/kubernetes/pkg/master/master.go:
	restStorageProviders := []RESTStorageProvider{
		authenticationrest.RESTStorageProvider{Authenticator: c.GenericConfig.Authenticator},
		...

NewRESTStorage()：

	//k8s.io/kubernetes/pkg/registry/authentication/rest/storage_authentication.go:
	func (p RESTStorageProvider) NewRESTStorage(apiResourceConfigSource serverstorage.APIResourceConfigSource, restOptionsGetter generic.RESTOptionsGetter) (genericapiserver.APIGroupInfo, bool) {
		apiGroupInfo := genericapiserver.NewDefaultAPIGroupInfo(authentication.GroupName, api.Registry, api.Scheme, api.ParameterCodec, api.Codecs)
		...
		if apiResourceConfigSource.AnyResourcesForVersionEnabled(authenticationv1.SchemeGroupVersion) {
			apiGroupInfo.VersionedResourcesStorageMap[authenticationv1.SchemeGroupVersion.Version] = p.v1Storage(apiResourceConfigSource, restOptionsGetter)
			apiGroupInfo.GroupMeta.GroupVersion = authenticationv1.SchemeGroupVersion
		}
		
		return apiGroupInfo, true
	}

可以看到`SchemeGroupVersion`中存放了groupname和version：

	//k8s.io/kubernetes/pkg/apis/authentication/v1/register.go，
	const GroupName = "authentication.k8s.io"
	var SchemeGroupVersion = schema.GroupVersion{Group: GroupName, Version: "v1"}

v1Storage()：

	//k8s.io/kubernetes/pkg/registry/authentication/rest/storage_authentication.go，:
	func (p RESTStorageProvider) v1Storage(apiResourceConfigSource serverstorage.APIResourceConfigSource, restOptionsGetter generic.RESTOptionsGetter) map[string]rest.Storage {
		version := authenticationv1.SchemeGroupVersion

		storage := map[string]rest.Storage{}
		if apiResourceConfigSource.AnyResourcesForVersionEnabled(authenticationv1.SchemeGroupVersion) {
			if apiResourceConfigSource.ResourceEnabled(version.WithResource("tokenreviews")) {
				tokenReviewStorage := tokenreview.NewREST(p.Authenticator)
				storage["tokenreviews"] = tokenReviewStorage
			}
		}
		
		return storage
	}

可以看到这里最终使用的storage是`tokenreview.NewREST()`创建的。

## 参考

1. [kubernetes-apiserver][1]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/04/kubernetes-apiserver.html "kubernetes-apiserver" 
