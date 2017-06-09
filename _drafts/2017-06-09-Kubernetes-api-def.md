---
layout: default
title: Kubernetes的api定义
author: lijiaocn
createdate: 2017/06/09 09:37:14
changedate: 2017/06/09 11:14:59
categories: 项目
tags: k8s
keywords: kubernetes,api
description:  kubernetes的api资源的定义，和使用方式。

---

* auto-gen TOC:
{:toc}

在[Kubernetes-apiserver][1]和[Kubernetes-apiserver-storage][2]中分析了apiserver是怎样工作、怎样实现了REST API的。这里分析一下api中资源的定义和使用方式。

## 定义与引用过程

资源的定义文件在`pkg/api/`和`pkg/apis`目录中, pkg/api目录中定义了pod等基本的资源自类型，pkg/apis中定义扩展的api中用的资源类型。

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

每组api资源中都有一个install目录，定义了一个名为install的pkg。

apiserver的实现代码cmd/kube-apiserver/app/server.go:67中导入了名为master的package:

	"k8s.io/kubernetes/pkg/master"

master的实现文件中pkg/master/import_known_versions.go中导入了每组api的install:

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
	
	func init() {
	    if missingVersions := api.Registry.ValidateEnvRequestedVersions(); len(missingVersions) != 0 {
	        panic(fmt.Sprintf("KUBE_API_VERSIONS contains versions that are not installed: %q.", missingVersions))
	    }
	}

这些install中完成对所在目录的资源的装载，`kubectl api-versions`中列出的api都有对应的install：

	$kubectl api-versions
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

## "k8s.io/kubernetes/pkg/api/install"

pkg/api/install/install.go中也实现了init()函数，用来装载pkg/api目录下定义的资源：

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

announced是`"k8s.io/apimachinery/pkg/apimachinery/announced"`，这里暂且不关心apimachinery的实现，通过走读代码，可以知道这里是将资源的定义注册到了"k8s.io/kubernetes/pkg/api"中的GroupFactoryRegistry中:

	var GroupFactoryRegistry = make(announced.APIGroupFactoryRegistry)

其它apis分组目录下的资源都注册到了同一个GroupFactoryRegistry中。

这里有三个参数需要关注

	api.GroupName
	api.AddToScheme
	v1.SchemeGroupVersion.Version: v1.AddToScheme,

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

## 

## 参考

1. [Kubernetes-apiserver][1]
2. [Kubernetes-apiserver-storage][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/04/Kubernetes-apiserver.html "Kubernetes-apiserver" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/05/10/Kubernetes-apiserver-storage.html "Kubernetes apiserver storage"
