---
layout: default
title: Kubernetes的Apiserver的storage使用
author: lijiaocn
createdate: 2017/05/10 11:12:12
changedate: 2017/05/11 16:52:45
categories:
tags: k8s
keywords: kubernetes,etcd,apiserver
description: Kubernetes中只有apiserver会直接使用etcd，其它的组件与apiserver交互，不会直接访问etcd。

---

* auto-gen TOC:
{:toc}

Kubernetes中只有apiserver会直接使用etcd，其它的组件与apiserver交互，不会直接访问etcd。

在[Kubernetes-apiserver]({{ site.baseurl }} {% post_url  2017-05-04-Kubernetes-client-cache.md %})中介绍过，apiserver使用的kubernetes-style apiserver:

	1. 在APIGroupInfo中装载各类的storage
	2. GenericAPIServer依据传入的APIGroupInfo中的storage，自动生成REST handler。

这里探究一下每个storage中怎样创建的，又是怎样与etcd关联上的。

## 代码组织结构

提前剧透一下源码的组织结构，后续看起代码来会更清晰

`registry`目录下收录的就是kubernetes的每类资源的实现代码。

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
	▸ core/            //  core/rest中实现了NewLegacyRESTStorage()
	▸ extensions/
	▸ policy/
	▸ rbac/
	▸ registrytest/
	▸ settings/
	▸ storage/

每类资源目录下都有一个rest目录，其中实现了各自的storage。例如`apps/rest`中的代码定义了可以提供给GenericAPIServer的storage。

## 启动

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

记住这里的kubeAPIServerConfig，还会回来找它的！

## storage的创建

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

先看一下`InstallLegacyAPI()`和`InstallAPIs()`，XXProviders的实现单独分析。

k8s.io/kubernetes/pkg/master/master.go:

	func (m *Master) InstallLegacyAPI(c *Config, restOptionsGetter generic.RESTOptionsGetter, legacyRESTStorageProvider corerest.LegacyRESTStorageProvider) {
		legacyRESTStorage, apiGroupInfo, err := legacyRESTStorageProvider.NewLegacyRESTStorage(restOptionsGetter)
		...
		if err := m.GenericAPIServer.InstallLegacyAPIGroup(genericapiserver.DefaultLegacyAPIPrefix, &apiGroupInfo); err != nil {
			glog.Fatalf("Error in registering group versions: %v", err)
		}
		...

可以看到，这里生成了一个apiGroupInfo，然后将其装载到了`m.GenericAPIServer`中，与GenericAPIServer的工作方式衔接上了。

k8s.io/kubernetes/pkg/master/master.go，`m.InstallAPIs()`:

	func (m *Master) InstallAPIs(apiResourceConfigSource serverstorage.APIResourceConfigSource, restOptionsGetter generic.RESTOptionsGetter, restStorageProviders ...RESTStorageProvider) {
		...
		apiGroupInfo, enabled := restStorageBuilder.NewRESTStorage(apiResourceConfigSource, restOptionsGetter)
		...
		for i := range apiGroupsInfo {
			if err := m.GenericAPIServer.InstallAPIGroup(&apiGroupsInfo[i]); err != nil {
				glog.Fatalf("Error in registering group versions: %v", err)
			}
		}

`m.InstallAPIs()`的工作过程类似，也是完成了对m.GenericAPIServer的装载。装载过程的发生了哪些事情，已经在《kubernetes的apiserver的工作过程》中介绍了，这篇文章中关心的每个storage是如何生成的，又是怎样和etcd关联上的。

## legacyRESTStorageProvider

legacyRESTStorageProvider提供的是存取pod、servcice等主要资源的storaga。

k8s.io/kubernetes/pkg/master/master.go:

	func (m *Master) InstallLegacyAPI(c *Config, restOptionsGetter generic.RESTOptionsGetter, legacyRESTStorageProvider corerest.LegacyRESTStorageProvider) {
		legacyRESTStorage, apiGroupInfo, err := legacyRESTStorageProvider.NewLegacyRESTStorage(restOptionsGetter)
		...
		if err := m.GenericAPIServer.InstallLegacyAPIGroup(genericapiserver.DefaultLegacyAPIPrefix, &apiGroupInfo); err != nil {
			glog.Fatalf("Error in registering group versions: %v", err)
		}
		...

`NewLegacyRESTStorage`又是一个很长的函数，关键过程都在这里了，需要好好阅读一下。它返回的`apiGroupInfo`中装载了各类资源的storage。

k8s.io/kubernetes/pkg/registry/core/rest/storage_core.go

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
		//restStorageMap被装载到了apiGroupInfo
		apiGroupInfo.VersionedResourcesStorageMap["v1"] = restStorageMap
		...

重点分析几个具体的storage，了解它们的实现。

### nodeStorage 

k8s.io/kubernetes/pkg/registry/core/rest/storage_core.go

	func (c LegacyRESTStorageProvider) NewLegacyRESTStorage(restOptionsGetter generic.RESTOptionsGetter) (LegacyRESTStorage, genericapiserver.APIGroupInfo, error) {
		...
		nodeStorage, err := nodestore.NewStorage(restOptionsGetter, c.KubeletClientConfig, c.ProxyTransport)
		...

k8s.io/kubernetes/pkg/registry/core/node/storage/storage.go:

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

NodeStorage的成员变量`Status`实现了Get()、New()、Update()。

	-+StatusREST : struct
	    [fields]
	   -store : *genericregistry.Store
	    [methods]
	   +Get(ctx genericapirequest.Context, name string, options *metav1.GetOptions) : runtime.Object, error
	   +New() : runtime.Object
	   +Update(ctx genericapirequest.Context, name string, objInfo rest.UpdatedObjectInfo) : runtime.Object, bool, error

`Status.Get()`:

	func (r *StatusREST) Get(ctx genericapirequest.Context, name string, options *metav1.GetOptions) (runtime.Object, error) {
		return r.store.Get(ctx, name, options)
	}

现在开始回溯，找到变量`r.store`创建的地方。

k8s.io/kubernetes/pkg/registry/core/node/storage/storage.go:

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
		statusREST := &StatusREST{store: &statusStore}
		...
		return &NodeStorage{
			Node:   nodeREST,
			Status: statusREST,
			Proxy:  proxyREST,
			KubeletConnectionInfo: connectionInfoGetter,
		}, nil
	}

可以看到，`r.store`类型为`*genericregistry.Store`。

`genericregistry.Store`中包含了NewFunc、NewListFunc等函数变量，应当是最后的storage了。

#### genericregistry.Store

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go:

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

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go，

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

	NewFunc:     func() runtime.Object { return &api.Node{} },

创建的动作还需要通过`e.Storage.Create(ctx, key, obj, out, ttl)`，需要继续回溯找到创建`e.Storage`的地方:

k8s.io/kubernetes/pkg/registry/core/node/storage/storage.go:

	func NewStorage(optsGetter generic.RESTOptionsGetter, kubeletClientConfig client.KubeletClientConfig, proxyTransport http.RoundTripper) (*NodeStorage, error) {
		store := &genericregistry.Store{
			Copier:      api.Scheme,
		...
		options := &generic.StoreOptions{RESTOptions: optsGetter, AttrFunc: node.GetAttrs, TriggerFunc: node.NodeNameTriggerFunc}
		if err := store.CompleteWithOptions(options); err != nil {
			return nil, err
		}
		...

回溯代码的时候，发现了`store.CompleteWithOptions()`，kubernetes的代码中经常会用这种方式来补全一个变量。

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go:

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

不出所料，e.Storage就是在这里创建的，还需要继续回溯，找到`opts.Decorator()`的实现

opts是通过`options.RESTOptions.GetRESTOptions()`创建的，options的创建:

k8s.io/kubernetes/pkg/registry/core/node/storage/storage.go:

	func NewStorage(optsGetter generic.RESTOptionsGetter, kubeletClientConfig client.KubeletClientConfig, proxyTransport http.RoundTripper) (*NodeStorage, error) {
		store := &genericregistry.Store{
			Copier:      api.Scheme,
		...
		options := &generic.StoreOptions{RESTOptions: optsGetter, AttrFunc: node.GetAttrs, TriggerFunc: node.NodeNameTriggerFunc}
		if err := store.CompleteWithOptions(options); err != nil {
			return nil, err
		}
		...

RESTOptions就是变量optsGetter，继续回溯，找到`optsGetter`的实现：

k8s.io/kubernetes/pkg/master/master.go:

	func (c completedConfig) New() (*Master, error) {
		...
		m := &Master{
			GenericAPIServer: s,
		}
		if c.APIResourceConfigSource.AnyResourcesForVersionEnabled(apiv1.SchemeGroupVersion) {
			...
			//装载pod、service的资源操作的REST api
			m.InstallLegacyAPI(c.Config, c.Config.GenericConfig.RESTOptionsGetter, legacyRESTStorageProvider)
		}

`c.Config.GenericConfig.RESTOptionsGetter`就是`optsGetter`，继续回溯，这里的c.Config就是一开始就提醒要记住的`kubeAPIServerConfig`

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func Run(runOptions *options.ServerRunOptions, stopCh <-chan struct{}) error {
		kubeAPIServerConfig, sharedInformers, insecureServingOptions, err := CreateKubeAPIServerConfig(runOptions)
		...

src/k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func CreateKubeAPIServerConfig(s *options.ServerRunOptions) (*master.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {

		genericConfig, sharedInformers, insecureServingOptions, err := BuildGenericConfig(s)
		...
		config := &master.Config{
			GenericConfig: genericConfig,
		...
		return config, sharedInformers, insecureServingOptions, nil
	}

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go, `BuildGenericConfig()`:

	func BuildGenericConfig(s *options.ServerRunOptions) (*genericapiserver.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		genericConfig := genericapiserver.NewConfig(api.Codecs)

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go, `NewConfig()`:

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

在kubeAPIServerConfig的创建过程中，没有设置RESTOptionsGetter，回溯继续找。

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go

	func Run(runOptions *options.ServerRunOptions, stopCh <-chan struct{}) error {
		kubeAPIServerConfig, sharedInformers, insecureServingOptions, err := CreateKubeAPIServerConfig(runOptions)
		if err != nil {
			return err
		}
		kubeAPIServer, err := CreateKubeAPIServer(kubeAPIServerConfig, sharedInformers, stopCh)
		if err != nil {
			return err
		}

到`CreateKubeAPIServer()`中看一下:

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func CreateKubeAPIServer(kubeAPIServerConfig *master.Config, sharedInformers informers.SharedInformerFactory, stopCh <-chan struct{}) (*master.Master, error) {
		kubeAPIServer, err := kubeAPIServerConfig.Complete().New()
		...

这里有一个Complete()函数，看到这个该开心了，因为kubernetes中通常都是在这个方法中设置必须设置的变量。

k8s.io/kubernetes/pkg/master/master.go:

	func (c *Config) Complete() completedConfig {
		c.GenericConfig.Complete()
		...

而`c.GenericConfig`是在kubeAPIServerConfig的创建过程中创建的：

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func CreateKubeAPIServerConfig(s *options.ServerRunOptions) (*master.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		...
		genericConfig, sharedInformers, insecureServingOptions, err := BuildGenericConfig(s)
		...
		config := &master.Config{
			GenericConfig: genericConfig,
		...

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go:

	func BuildGenericConfig(s *options.ServerRunOptions) (*genericapiserver.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		...
		genericConfig := genericapiserver.NewConfig(api.Codecs)
		...

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/config.go:

	func (c *Config) Complete() completedConfig {
		...

很遗憾也没有找到，只能到代码中搜索`RESTOptionsGetter`，最后终于发现，在前面见过的`BuildGenericConfig()`中还有一行代码:

k8s.io/kubernetes/cmd/kube-apiserver/app/server.go, `BuildGenericConfig()`:

	func BuildGenericConfig(s *options.ServerRunOptions) (*genericapiserver.Config, informers.SharedInformerFactory, *kubeserver.InsecureServingInfo, error) {
		genericConfig := genericapiserver.NewConfig(api.Codecs)
		...
		if err := s.Etcd.ApplyWithStorageFactoryTo(storageFactory, genericConfig); err != nil {
			return nil, nil, nil, err
		}

进入到`s.Etcd.ApplyWithStorageFactoryTo()`中，才猛然发现:

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/options/etcd.go:

	func (s *EtcdOptions) ApplyWithStorageFactoryTo(factory serverstorage.StorageFactory, c *server.Config) error {
		c.RESTOptionsGetter = &storageFactoryRestOptionsFactory{Options: *s, StorageFactory: factory}
		return nil
	}

回顾一下我们目标，`RESTOptions.GetRESTOptions()`和`opts.Decorator()`:

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/store.go:

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

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/server/options/etcd.go:

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

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/registry/storage_factory.go:

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

好吧，总算看到了storage，篇幅有限，storage是如何运作的放在下一篇中分析。

## authenticationrest.RESTStorageProvider

k8s.io/kubernetes/pkg/master/master.go:

	restStorageProviders := []RESTStorageProvider{
		authenticationrest.RESTStorageProvider{Authenticator: c.GenericConfig.Authenticator},
		...

k8s.io/kubernetes/pkg/registry/authentication/rest/storage_authentication.go，`NewRESTStorage()`:

	func (p RESTStorageProvider) NewRESTStorage(apiResourceConfigSource serverstorage.APIResourceConfigSource, restOptionsGetter generic.RESTOptionsGetter) (genericapiserver.APIGroupInfo, bool) {
		apiGroupInfo := genericapiserver.NewDefaultAPIGroupInfo(authentication.GroupName, api.Registry, api.Scheme, api.ParameterCodec, api.Codecs)
		...
		if apiResourceConfigSource.AnyResourcesForVersionEnabled(authenticationv1.SchemeGroupVersion) {
			apiGroupInfo.VersionedResourcesStorageMap[authenticationv1.SchemeGroupVersion.Version] = p.v1Storage(apiResourceConfigSource, restOptionsGetter)
			apiGroupInfo.GroupMeta.GroupVersion = authenticationv1.SchemeGroupVersion
		}
		
		return apiGroupInfo, true
	}

k8s.io/kubernetes/pkg/apis/authentication/v1/register.go，可以看到`SchemeGroupVersion`中存放了groupname和version:

	const GroupName = "authentication.k8s.io"
	var SchemeGroupVersion = schema.GroupVersion{Group: GroupName, Version: "v1"}

k8s.io/kubernetes/pkg/registry/authentication/rest/storage_authentication.go，`v1Storage()`:

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
