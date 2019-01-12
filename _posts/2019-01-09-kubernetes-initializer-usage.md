---
layout: default
title: "Kubernetes Initializer功能的使用方法：在Pod等Resource落地前修改Pod"
author: 李佶澳
createdate: "2019-01-09 17:01:30 +0800"
changedate: "2019-01-10 15:09:29 +0800"
categories: 技巧
tags: kubernetes
keywords: kubernetes,initializer
description: "Kubernetes Initializers可以在pod/的pending阶段对pod进行修改，譬如注入新的容器、挂载volume等"
---

* auto-gen TOC:
{:toc}

## 说明

在研究[通过LXCFS，在容器内显示容器的CPU、内存状态][3]的时候，遇到了[Kubernetes Initializers][2]，学习一下。

注意[Kubernetes Initializers][2]和[Kubernetes Init Containers][4]是不同的，前者可以修改Pod的定义，后者是在Pod中正式容器启动前，进行一些准备工作。两者发生作用的时机也不一样。

## 用途
 
[Kubernetes Initializers][2]可以在pod/的pending阶段对pod进行修改，譬如注入新的容器、挂载volume等。

例如[通过LXCFS，在容器内显示容器的CPU、内存状态][3]中，就是用Initializer的方式，为每个pod自动挂载了lxcfs维护的/proc文件。

## Initializer功能开启

在Kubernetes 1.13中[initializers][2]还是一个alpha特性，需要在Kube-apiserver中添加参数开启。

这里使用的是kubernets 1.12，设置方法是一样的：

	--enable-admission-plugins="Initializers,NamespaceLifecycle,NamespaceExists,LimitRanger,SecurityContextDeny,ServiceAccount,ResourceQuota"
	--runtime-config=admissionregistration.k8s.io/v1alpha1

`--enable-admission-plugins`和`--admission-control`互斥，如果同时设置，kube-apiserver启动报错：

	error: [admission-control and enable-admission-plugins/disable-admission-plugins flags are mutually exclusive, 
	enable-admission-plugins plugin "--runtime-config=admissionregistration.k8s.io/v1alpha1" is unknown]

## InitializerConfiguration

`InitializerConfiguration`资源中定义了一组的`initializers`。

每个initializer有一个名字和多个规则，规则中是它要作用的资源，例如下面的initializers中只有一个initializer，名称为`podimage.example.com`，作用于v1版本的pods。

```yaml

apiVersion: admissionregistration.k8s.io/v1alpha1
kind: InitializerConfiguration
metadata:
  name: example-config
initializers:
  # the name needs to be fully qualified, i.e., containing at least two "."
  - name: podimage.example.com
    rules:
      # apiGroups, apiVersion, resources all support wildcard "*".
      # "*" cannot be mixed with non-wildcard.
      - apiGroups:
          - ""
        apiVersions:
          - v1
        resources:
          - pods

```

在kubernets中创建了上面的initializers之后，新建的pod在pending阶段，metadata中会添加一个initializer列表：

```yaml
  metadata:
    creationTimestamp: 2019-01-09T08:56:36Z
    generateName: echo-7cfbbd7d49-
    initializers:
      pending:
      - name: podimage.example.com
```

注意需要加上参数`--include-uninitialized=true`才能看到处于这个阶段的Pod:

```
 ./kubectl.sh -n demo-echo get pod --include-uninitialized=true -o yaml
```

metadata中`initializers`列表不为空的Pod，处于正在等待初始化状态，需要部署一个`initializer controller`对处于这个阶段中的pod完成初始化后， pod才能退出pending状态。。

initializer controller需要自己根据需要实现。

## Initializer Controller

initializer controller监听指定类型的resource，当发现有新创建的resouce创建时，通过检查resource的metadata中的initializer名单，决定是否要对resource进行初始化设置，并且在完成设置之后，需要将对应的initializer名单从resource的metadata中删除，否则resource就一直处于等待初始化设置的状态。

具体实现可以参考[lxcfs-initializer][5]。

## 如果有多个InitializerConfiguration和多个Initializer Controller，会怎样？

没有在文档中找到具体的说明，k8s的文档中Initializer章节的内容很少，这里通过实验，判断一下。

创建了两个不同名的但是包含相同rule的InitializerConfiguration：

```yaml
apiVersion: admissionregistration.k8s.io/v1alpha1
kind: InitializerConfiguration
metadata:
  name: example-config
initializers:
  # the name needs to be fully qualified, i.e., containing at least two "."
  - name: podimage.example.com
    rules:
      # apiGroups, apiVersion, resources all support wildcard "*".
      # "*" cannot be mixed with non-wildcard.
      - apiGroups:
          - ""
        apiVersions:
          - v1
        resources:
          - pods

```

```yaml
apiVersion: admissionregistration.k8s.io/v1alpha1
kind: InitializerConfiguration
metadata:
  name: example-config-2
initializers:
  # the name needs to be fully qualified, i.e., containing at least two "."
  - name: podimage-2.example.com rules:
      # apiGroups, apiVersion, resources all support wildcard "*".
      # "*" cannot be mixed with non-wildcard.
      - apiGroups:
          - ""
        apiVersions:
          - v1
        resources:
          - pods
  - name: podimage.example.com
    rules:
      # apiGroups, apiVersion, resources all support wildcard "*".
      # "*" cannot be mixed with non-wildcard.
      - apiGroups:
          - ""
        apiVersions:
          - v1
        resources:
          - pods
```

Pod中的metadata是这样的：

```
  metadata:
    creationTimestamp: 2019-01-10T04:03:12Z
    generateName: echo-7cfbbd7d49-
    initializers:
      pending:
      - name: podimage.example.com
      - name: podimage-2.example.com
      - name: podimage.example.com
```

之后又通过调整InitializerConfiguration的名称排序、创建的先后顺序、内部的rules的顺序，多次试验之后发现，`多个InitializerConfiguration`的在metadata中是按照它们的`名称排序`的，和创建时间无关。

每个InitializerConfiguration中的`rules`在metadata中顺序与它们`定义的顺序`一致。

根据[lxcfs-initializer][5]的实现以及k8s的文档，Initializer Controller对目标Resource完成设置之后，需要从metadata中移除对应的Initializer。

如果定义了多个Initializer，并且有多个Initializer Controller各自负责不同的Initializer，这时候需要小心设计，既要防止“漏掉”应当处理的Resource，导致Resource长期不落地，又要防止已经被删除的Initializer又被重新写上了，重复处理时出现错误。

根据现在掌握的信息，目前比较稳妥的做法是，将多个Initializer设计为顺序无关，谁先执行都可以，否则只有创建一个InitializerConfiguration，rules的顺序就是Initiliazer的顺序。只设计一个Initializer Controller,或者将多个Initializer Controller设计成串行执行，让它们监测Resource的创建和变化，不仅仅是刚创建，否则一些Initializer可能被漏掉。

[lxcfs-initializer][5]这个Initializer只关心`ADD`事件，如果同时有其它的Initializer Controller存在，可能会漏掉一些Resource。

```go
_, controller := cache.NewInformer(includeUninitializedWatchlist, &v1.Deployment{}, resyncPeriod,
	cache.ResourceEventHandlerFuncs{
		AddFunc: func(obj interface{}) {
			err := initializeDeployment(obj.(*v1.Deployment), c, clientset)
			if err != nil {
				log.Println(err)
			}
		},
	},
)
```

## 参考

1. [Kubernetes之路 2 - 利用LXCFS提升容器资源可见性 ][1]
2. [Kubernetes Initializers][2]
3. [通过LXCFS，在容器内显示容器的CPU、内存状态][3]
4. [Kubernetes Init Containers][4]
5. [lxcfs-initializer][5]

[1]: https://yq.aliyun.com/articles/566208/ "Kubernetes之路 2 - 利用LXCFS提升容器资源可见性 "
[2]: https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/#initializers "Kubernetes Initializers"
[3]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/09/kubernetes-lxcfs-docker-container.html "通过LXCFS，在容器内显示容器的CPU、内存状态"
[4]: https://kubernetes.io/docs/concepts/workloads/pods/init-containers/ "Kubernetes Init Containers"
[5]: https://github.com/lijiaocn/lxcfs-initializer "lxcfs-initializer"
