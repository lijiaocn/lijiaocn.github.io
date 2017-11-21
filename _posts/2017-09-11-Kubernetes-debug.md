---
layout: default
title: kubernetes的调试方法
author: lijiaocn
createdate: 2017/09/11 16:24:30
changedate: 2017/11/20 14:50:41
categories: 项目
tags:  kubernetes
keywords: kubernetes,debug
description: 持续更新的kubernetes的调试方法

---

* auto-gen TOC:
{:toc}

## 说明 

这篇文章会持续更新，主要记录实际使用的一些调试方法。

## 在代码中找到资源的定义

譬如，在kubernetes的`1.6.4`版本中调试NetworkPolicy。

定义的NetworkPolicy如下：

	$kubectl -n lijiaob-space get networkpolicy  -o yaml
	apiVersion: v1
	items:
	- apiVersion: extensions/v1beta1
	  kind: NetworkPolicy
	  metadata:
	    creationTimestamp: 2017-09-11T07:03:02Z
	    generation: 1
	    name: isolation-access-rules
	    namespace: lijiaob-space
	    resourceVersion: "23537272"
	    selfLink: /apis/extensions/v1beta1/namespaces/lijiaob-space/networkpolicies/isolation-access-rules
	    uid: 40c627ff-96bf-11e7-b118-52549da43ad9
	  spec:
	    ingress:
	    - from:
	      - namespaceSelector:
	          matchExpressions:
	          - key: namespace
	            operator: In
	            values:
	            - lijiaob-space
	    podSelector: {}
	kind: List
	metadata: {}

现在要在代码中找到NetworkPolicy的定义。

上面显示apiVersion为`extensions/v1beta1`，所以到`pkg/apis/extensions/v1beta1/types.go`中寻找NetworkPolicy的定义：

	...
	type NetworkPolicy struct {
		metav1.TypeMeta `json:",inline"`
		// Standard object's metadata.
		// More info: http://releases.k8s.io/HEAD/docs/devel/api-conventions.md#metadata
		// +optional
		metav1.ObjectMeta `json:"metadata,omitempty" protobuf:"bytes,1,opt,name=metadata"`
	
		// Specification of the desired behavior for this NetworkPolicy.
		// +optional
		Spec NetworkPolicySpec `json:"spec,omitempty" protobuf:"bytes,2,opt,name=spec"`
	}
	...

kubernetes 1.6.4中，资源在`api`和`apis`目录中定义:

pkg/api:

	▾ pkg/
	  ▾ api/
	    ▸ annotations/
	    ▸ endpoints/
	    ▸ errors/
	    ▸ events/
	    ▸ install/
	    ▸ meta/
	    ▸ pod/
	    ▸ resource/
	    ▸ service/
	    ▸ testapi/
	    ▸ testing/
	    ▸ unversioned/
	    ▸ util/
	    ▾ v1/
	      ▸ endpoints/
	      ▸ pod/
	      ▸ service/
	      ▸ validation/
	   ...

pkg/apis:

	▾ pkg/
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
	    ...

参考[kubernetes的api定义与装载][1]。

## 在代码中找到对输入参数的处理

到cmd目录中找到目标子目录，例如kubelet，main函数中调用的`AddFlags`中完成输入参数的设置。

cmd/kubelet/kubelet.go:

	...
	s := options.NewKubeletServer()
	s.AddFlags(pflag.CommandLine)
	
	flag.InitFlags()
	logs.InitLogs()
	...

例如:

cmd/kubelet/app/options/options.go:

	fs.StringVar(&s.CNIConfDir, "cni-conf-dir", s.CNIConfDir, "<Warning: Alpha feature> The full path of the directory in which to search for CNI config files. Default: /etc/cni/net.d")

包含所有参数的信息的`s`，被传入`app.Run()`:

cmd/kubelet/kubelet.go:

	...
	if err := app.Run(s, nil); err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}
	...

## 参考

1. [kubernetes的api定义与装载][1]

[1]: http://www.lijiaocn.com/项目/2017/06/09/Kubernetes-api-def.html "kubernetes的api定义与装载" 
