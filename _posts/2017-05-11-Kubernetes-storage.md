---
layout: default
title: Kubernetes的Storage的实现
author: lijiaocn
createdate: 2017/05/11 17:23:22
changedate: 2017/05/12 10:12:01
categories: 项目
tags: k8s
keywords: kubernetes,storage,kubernetes的storage的实现。
description: kubernetes的Apiserver没有直接使用etcd,而是通过storage访问etcd。

---

* auto-gen TOC:
{:toc}

在[Kubernetes-apiserver-storage][1]中已经说明了kuberapiserver是如何创建了storage的，这一篇章看一下storage的实现与使用。

## 回顾

apiserver的NodeStorage的创建最后在`StorageWithCacher()`中落实。

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

## storagebackend.Config

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/storage/storagebackend/config.go:

	type Config struct {
		Type string
		Prefix string
		ServerList []string
		KeyFile  string
		CertFile string
		CAFile   string
		Quorum bool
		DeserializationCacheSize int
		
		Codec  runtime.Codec
		Copier runtime.ObjectCopier
	}

## generic.NewRawStorage()

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/registry/generic/storage_decorator.go:

	// NewRawStorage creates the low level kv storage. This is a work-around for current
	// two layer of same storage interface.
	// TODO: Once cacher is enabled on all registries (event registry is special), we will remove this method.
	func NewRawStorage(config *storagebackend.Config) (storage.Interface, factory.DestroyFunc) {
		s, d, err := factory.Create(*config)
		if err != nil {
			glog.Fatalf("Unable to create storage backend: config (%v), err (%v)", config, err)
		}
		return s, d
	}

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/storage/storagebackend/factory/factory.go:

	func Create(c storagebackend.Config) (storage.Interface, DestroyFunc, error) {
		switch c.Type {
		case storagebackend.StorageTypeETCD2:
			return newETCD2Storage(c)
		case storagebackend.StorageTypeUnset, storagebackend.StorageTypeETCD3:
			// TODO: We have the following features to implement:
			// - Support secure connection by using key, cert, and CA files.
			// - Honor "https" scheme to support secure connection in gRPC.
			// - Support non-quorum read.
			return newETCD3Storage(c)
		default:
			return nil, nil, fmt.Errorf("unknown storage type: %s", c.Type)
		}
	}

目前只支持etcd2和etcd3。

### ETCD2Storage

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/storage/storagebackend/factory/etcd2.go:

	func newETCD2Storage(c storagebackend.Config) (storage.Interface, DestroyFunc, error) {
		tr, err := newTransportForETCD2(c.CertFile, c.KeyFile, c.CAFile)
		if err != nil {
			return nil, nil, err
		}
		client, err := newETCD2Client(tr, c.ServerList)
		if err != nil {
			return nil, nil, err
		}
		s := etcd.NewEtcdStorage(client, c.Codec, c.Prefix, c.Quorum, c.DeserializationCacheSize, c.Copier, etcd.IdentityTransformer)
		return s, tr.CloseIdleConnections, nil
	}

## storage.Cacher

创建方法:

	cacher := storage.NewCacherFromConfig(cacherConfig)

### CacherConfig

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/storage/cacher.go

	type CacherConfig struct {
		// Maximum size of the history cached in memory.
		CacheCapacity int
		// An underlying storage.Interface.
		Storage Interface
		// An underlying storage.Versioner.
		Versioner Versioner
		Copier runtime.ObjectCopier
		// The Cache will be caching objects of a given Type and assumes that they
		// are all stored under ResourcePrefix directory in the underlying database.
		Type           interface{}
		ResourcePrefix string
		// KeyFunc is used to get a key in the underlying storage for a given object.
		KeyFunc func(runtime.Object) (string, error)
		// GetAttrsFunc is used to get object labels and fields.
		GetAttrsFunc func(runtime.Object) (labels.Set, fields.Set, error)
		// TriggerPublisherFunc is used for optimizing amount of watchers that
		// needs to process an incoming event.
		TriggerPublisherFunc TriggerPublisherFunc
		// NewList is a function that creates new empty object storing a list of
		// objects of type Type.
		NewListFunc func() runtime.Object
		Codec runtime.Codec
	}

可以看到，CacherConfig中包含了一个Storage，Cacher在Storage的基础上做了缓存。

### Cacher

k8s.io/kubernetes/staging/src/k8s.io/apiserver/pkg/storage/cacher.go:

	// Cacher is responsible for serving WATCH and LIST requests for a given
	// resource from its internal cache and updating its cache in the background
	// based on the underlying storage contents.
	// Cacher implements storage.Interface (although most of the calls are just
	// delegated to the underlying storage).
	type Cacher struct {
		// HighWaterMarks for performance debugging.
		// Important: Since HighWaterMark is using sync/atomic, it has to be at the top of the struct due to a bug on 32-bit platforms
		// See: https://golang.org/pkg/sync/atomic/ for more information
		incomingHWM HighWaterMark
		// Incoming events that should be dispatched to watchers.
		incoming chan watchCacheEvent
	...

## 参考

1. [Kubernetes-apiserver-storage][1]

[1]: http://www.lijiaocn.com/2017/05/10/Kubernetes-apiserver-storage.html  "Kubernetes-apiserver-storage" 
