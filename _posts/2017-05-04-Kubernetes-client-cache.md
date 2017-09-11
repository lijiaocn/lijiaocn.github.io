---
layout: default
title: Kubernetes的Client端Cache
author: lijiaocn
createdate: 2017/05/04 10:06:47
changedate: 2017/05/17 13:21:57
categories: 项目
tags: kubernetes
keywords: client-go,kubernetes,cache
description: Kubernetes的client端使用一个名为cache的库, 在本地缓存pod等信息,减少对服务端的请求。

---

* auto-gen TOC:
{:toc}

## 作用

Kubernetes的client端使用一个名为cache的库, 在本地缓存pod等信息,减少对服务端的请求。

k8s.io/client-go/tools/cache/doc.go:

	// Package cache is a client-side caching mechanism. It is useful for
	// reducing the number of server calls you'd otherwise need to make.
	// Reflector watches a server and updates a Store. Two stores are provided;
	// one that simply caches objects (for example, to allow a scheduler to
	// list currently available nodes), and one that additionally acts as
	// a FIFO queue (for example, to allow a scheduler to process incoming
	// pods).

## Store

interface Strore是基础，是客户端保存数据的最终接口：

k8s.io/client-go/tools/cache/store.go:

	type Store interface {
		Add(obj interface{}) error
		Update(obj interface{}) error
		Delete(obj interface{}) error
		List() []interface{}
		ListKeys() []string
		Get(obj interface{}) (item interface{}, exists bool, err error)
		GetByKey(key string) (item interface{}, exists bool, err error)

		// Replace will delete the contents of the store, using instead the
		// given list. Store takes ownership of the list, you should not reference
		// it after calling this function.
		Replace([]interface{}, string) error
		Resync() error
	}

### ThreadSafeStore 

ThreadSafeStore是一个线程安全的store。

k8s.io/client-go/tools/cache/thread_safe_store.go:

	type ThreadSafeStore interface {
		Add(key string, obj interface{})
		Update(key string, obj interface{})
		Delete(key string)
		Get(key string) (item interface{}, exists bool)
		List() []interface{}
		ListKeys() []string
		Replace(map[string]interface{}, string)
		Index(indexName string, obj interface{}) ([]interface{}, error)
		ListIndexFuncValues(name string) []string
		ByIndex(indexName, indexKey string) ([]interface{}, error)
		GetIndexers() Indexers

		// AddIndexers adds more indexers to this store.  If you call this after you already have data
		// in the store, the results are undefined.
		AddIndexers(newIndexers Indexers) error
		Resync() error
	}

### UndeltaStore

UndeltaStore会将增、删、改等操作通过PushFunc()向外通知。

	// UndeltaStore listens to incremental updates and sends complete state on every change.
	// It implements the Store interface so that it can receive a stream of mirrored objects
	// from Reflector.  Whenever it receives any complete (Store.Replace) or incremental change
	// (Store.Add, Store.Update, Store.Delete), it sends the complete state by calling PushFunc.
	// It is thread-safe.  It guarantees that every change (Add, Update, Replace, Delete) results
	// in one call to PushFunc, but sometimes PushFunc may be called twice with the same values.
	// PushFunc should be thread safe.
	
	type UndeltaStore struct {
		Store
		PushFunc func([]interface{})
	}

## Reflector

Reflector通过传入参数ListerWatcher感知服务端的内容变化，并实时更新到传入的store，保证store中的内容与服务端一致。

k8s.io/client-go/tools/cache/reflector.go:

	func NewNamedReflector(name string, 
			lw ListerWatcher, 
			expectedType interface{}, 
			store Store, 
			resyncPeriod time.Duration) *Reflector {

	func NewReflector(
			lw ListerWatcher, 
			expectedType interface{}, 
			store Store, 
			resyncPeriod time.Duration) *Reflector {

k8s.io/client-go/tools/cache/reflector.go:

	// Run starts a watch and handles watch events. Will restart the watch if it is closed.
	// Run starts a goroutine and returns immediately.
	func (r *Reflector) Run() {
		glog.V(3).Infof("Starting reflector %v (%s) from %s", r.expectedType, r.resyncPeriod, r.name)
		go wait.Until(func() {
			if err := r.ListAndWatch(wait.NeverStop); err != nil {
				utilruntime.HandleError(err)
			}
		}, r.period, wait.NeverStop)
	}

### ListerWatcher

Reflector依赖ListerWatcher接口，来感知服务端的变动

k8s.io/client-go/tools/cache/listwatch.go:

	// ListerWatcher is any object that knows how to perform an initial list and start a watch on a resource.
	type ListerWatcher interface {
		// List should return a list type object; the Items field will be extracted, and the
		// ResourceVersion field will be used to start the watch in the right place.
		List(options metav1.ListOptions) (runtime.Object, error)
		// Watch should begin a watch at the specified version.
		Watch(options metav1.ListOptions) (watch.Interface, error)
	}

### ListWath

ListWatch实现了ListerWatcher接口

	-+ListWatch : struct
	    [fields]
	   +ListFunc : ListFunc
	   +WatchFunc : WatchFunc
	    [methods]
	   +List(options metav1.ListOptions) : runtime.Object, error
	   +Watch(options metav1.ListOptions) : watch.Interface, error
	    [functions]
	   +NewListWatchFromClient(c Getter, resource string, namespace string, fieldSelector fields.Selector) : *ListWatch

