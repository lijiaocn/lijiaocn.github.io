---
layout: default
title: kubernetes的api定义与装载
author: 李佶澳
createdate: 2017/06/09 09:37:14
changedate: 2017/11/20 14:22:01
categories: 项目
tags: kubernetes
keywords: kubernetes,api
description:  kubernetes的api资源的定义，和使用方式。

---

* auto-gen TOC:
{:toc}

在[Kubernetes-apiserver][1]和[Kubernetes-apiserver-storage][2]中分析了apiserver是怎样工作、怎样实现了REST API的。

这里分析一下api中的定义的装载。

## 都有哪些api

`kubectl api-versions`可以看到集群支持的api：

	$ kubectl api-versions
	apps/v1beta1
	authentication.k8s.io/v1beta1
	authorization.k8s.io/v1beta1
	autoscaling/v1
	batch/v1
	certificates.k8s.io/v1alpha1
	extensions/v1beta1
	policy/v1beta1
	rbac.authorization.k8s.io/v1alpha1
	storage.k8s.io/v1beta1
	v1

这个可以通过kube-apiserver的`--runtime-config`来设置：

	--runtime-config=/api=true,api/all=true,apis=true,apis/v1=true

## api在哪里定义的？

api在`pkg/api/`和`pkg/apis`中定义, pkg/api目录中定义了pod等基础api，pkg/apis中定义的是扩展的api。

	▾ api/
	  ▸ annotations/
	  ▸ endpoints/
	  ▸ errors/
	  ▸ events/
	  ▸ install/
	  ▸ meta/
	
	▾ apis/
	  ▸ abac/
	  ▸ apps/
	  ▸ authentication/
	  ▸ authorization/
	  ▸ autoscaling/
	  ▸ batch/
	  ▸ certificates/
	  ▸ componentconfig/
	  ▸ extensions/
	  ▸ imagepolicy/
	  ▸ meta/
	  ▸ policy/
	  ▸ rbac/
	  ▸ settings/
	  ▸ storage/

## api是怎样被装载的？

如果你仔细查看api/和apis/的子目录，会发现很多都有一个名为install的目录（不是全部)。

这个目录中有一个名为install.go的文件，里面有这样一个`init()`函数：

	func init() {
		Install(api.GroupFactoryRegistry, api.Registry, api.Scheme)
	}

它调用的`Install()`函数，也在这个文件里实现：

	func Install(groupFactoryRegistry announced.APIGroupFactoryRegistry, 
			registry *registered.APIRegistrationManager, scheme *runtime.Scheme) {
		...

`Install()`将完成api的装载，但是这个过程比较复杂，在下一节中分析。

问题是这些init()函数是什么时候给调用的？通过搜索、回溯代码发现了这个过程。

kube-apiserver的代码`cmd/kube-apiserver/app/server.go:67`中导入了名为`master`的package:

	"k8s.io/kubernetes/pkg/master"

master的代码`pkg/master/import_known_versions.go`中导入了api/和apis/子目录中的install:

	// These imports are the API groups the API server will support.
	import (
	    "fmt"
	    "k8s.io/kubernetes/pkg/api"
	    _ "k8s.io/kubernetes/pkg/api/install"
	    _ "k8s.io/kubernetes/pkg/apis/apps/install"
	    _ "k8s.io/kubernetes/pkg/apis/authentication/install"
	    _ "k8s.io/kubernetes/pkg/apis/authorization/install"
	    _ "k8s.io/kubernetes/pkg/apis/autoscaling/install"
	    _ "k8s.io/kubernetes/pkg/apis/batch/install"
	    _ "k8s.io/kubernetes/pkg/apis/certificates/install"
	    _ "k8s.io/kubernetes/pkg/apis/componentconfig/install"
	    _ "k8s.io/kubernetes/pkg/apis/extensions/install"
	    _ "k8s.io/kubernetes/pkg/apis/imagepolicy/install"
	    _ "k8s.io/kubernetes/pkg/apis/policy/install"
	    _ "k8s.io/kubernetes/pkg/apis/rbac/install"
	    _ "k8s.io/kubernetes/pkg/apis/settings/install"
	    _ "k8s.io/kubernetes/pkg/apis/storage/install"
	)
	...

因此init()函数得以执行，完成api的装载。

## api的装载过程

这里以"k8s.io/kubernetes/pkg/api/install"为例。

pkg/api/install/install.go中实现了init()函数，用来装载pkg/api目录下定义的资源：

	// Package install installs the v1 monolithic api, making it available as an
	// option to all of the API encoding/decoding machinery.
	func init() {
	    Install(api.GroupFactoryRegistry, api.Registry, api.Scheme)
	}
	
	// Install registers the API group and adds types to a scheme
	func Install(groupFactoryRegistry announced.APIGroupFactoryRegistry, registry *registered.APIRegistrationManager, scheme *runtime.Scheme) {
	    if err := announced.NewGroupMetaFactory(
	        &announced.GroupMetaFactoryArgs{
	            GroupName:                  api.GroupName,
	            VersionPreferenceOrder:     []string{v1.SchemeGroupVersion.Version},
	            ImportPrefix:               "k8s.io/kubernetes/pkg/api",
	            AddInternalObjectsToScheme: api.AddToScheme,
	            RootScopedKinds: sets.NewString(
	                "Node",
	                "Namespace",
	                "PersistentVolume",
	                "ComponentStatus",
	            ),
	            IgnoredKinds: sets.NewString(
	                "ListOptions",
	                "DeleteOptions",
	                "Status",
	                "PodLogOptions",
	                "PodExecOptions",
	                "PodAttachOptions",
	                "PodPortForwardOptions",
	                "PodProxyOptions",
	                "NodeProxyOptions",
	                "ServiceProxyOptions",
	                "ThirdPartyResource",
	                "ThirdPartyResourceData",
	                "ThirdPartyResourceList",
	            ),
	        },
	        announced.VersionToSchemeFunc{
	            v1.SchemeGroupVersion.Version: v1.AddToScheme,
	        },
	    ).Announce(groupFactoryRegistry).RegisterAndEnable(registry, scheme); err != nil {
	        panic(err)
	    }
	}

从`Install()`函数的实现中可以看到，Install的过程是通过announced.NewGroupMetaFactory()完成的:

	announced.NewGroupMetaFactory().Annouce().RegisterAndEnable()

announced是`"k8s.io/apimachinery/pkg/apimachinery/announced"`。

通过走读代码，可以知道这里是将api的定义注册到了"k8s.io/kubernetes/pkg/api"中的`GroupFactoryRegistry`中:

	var GroupFactoryRegistry = make(announced.APIGroupFactoryRegistry)

其它apis分组目录下的资源也注册到了这个GroupFactoryRegistry中。

有三个参数需要关注：

	api.GroupName
	api.AddToScheme
	v1.SchemeGroupVersion.Version: v1.AddToScheme,

>TODO：分析这个过程。

### v1.AddToScheme

pkg/api/v1/register.go:

	var (
	    SchemeBuilder = runtime.NewSchemeBuilder(addKnownTypes, addDefaultingFuncs, addConversionFuncs, addFastPathConversionFuncs)
	    AddToScheme   = SchemeBuilder.AddToScheme
	)

AddToScheme是一个函数，它的作用就是调用SchemeBuilder中注册的函数：

	func (sb *SchemeBuilder) AddToScheme(s *Scheme) error {
	    for _, f := range *sb {
	        if err := f(s); err != nil {
	            return err
	        }
	    }
	    return nil
	}

也就是SchemeBuilder创建时传入的函数:

	addKnownTypes, 
	addDefaultingFuncs, 
	addConversionFuncs, 
	addFastPathConversionFuncs

api/v1中的addKnownTypes():

	// Adds the list of known types to api.Scheme.
	func addKnownTypes(scheme *runtime.Scheme) error {
	    scheme.AddKnownTypes(SchemeGroupVersion,
	        &Pod{},
	        &PodList{},
	        &PodStatusResult{},
	        &PodTemplate{},
	        &PodTemplateList{},
	        &ReplicationController{},
	        &ReplicationControllerList{},
	        &Service{},
	        &ServiceProxyOptions{},
	        &ServiceList{},
	        &Endpoints{},
	        &EndpointsList{},
	        &Node{},
	        &NodeList{},
	        &NodeProxyOptions{},
	        &Binding{},
	        &Event{},
	        &EventList{},
	        &List{},
	...

## 参考

1. [Kubernetes-apiserver][1]
2. [Kubernetes-apiserver-storage][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/04/Kubernetes-apiserver.html "Kubernetes-apiserver" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/10/Kubernetes-apiserver-storage.html "Kubernetes apiserver storage"
