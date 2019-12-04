---
layout: default
title: "kubernetes code-generator 用法：生成 kubernetes-style 的 api 和 client 代码"
author: 李佶澳
createdate: "2019-04-04 15:36:14 +0800"
last_modified_at: "2019-12-04 10:45:03 +0800"
categories: 项目
tags: kubernetes
keywords: kubernetes,code-generator,kubernetes-style,api
description: "使用kubernetes的code-generator生成Kubernetes-style的API和client代码，查询、监听CRD"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

Kubernetes的api中有相当一部分代码是自动生成的，特别是api定义和调用方法，这些代码是用[kubernetes/code-generator](https://github.com/kubernetes/code-generator)中的脚本以及命令生成的。
在实现自定义的controller的时候， 如果用到了CRD，也可以用它来生成查询、监听CRD的代码。

## 导入k8s.io/code-generator

创建一个空白项目：

```sh
mkdir example-1
cd example-1
dep init
```

在`Gopkg.toml`中添加依赖k8s.io/code-generator：

```
required = [
  "k8s.io/code-generator",
]
```

然后用dep拉取code-generator，这个过程需要翻Q：

```sh
dep ensure -add  k8s.io/code-generator
```

## 编写API定义代码

API定义代码中会使用一些特殊的注释，code-generator根据这些注释生成相应的代码。文章[Kubernetes Deep Dive: Code Generation for CustomResources][2]对此作了详细介绍。

编写API定义代码，这里定义一个名为selfcrd资源，版本是v1：

```
mkdir -p internal/apis/selfcrd/v1
```

在internal/apis/selfcrd/v1/doc.go中设置global tag: 

```go
// Create: 2019/04/04 15:48:00 Change: 2019/04/04 15:48:22
// FileName: doc.go
// Copyright (C) 2019 lijiaocn <lijiaocn@foxmail.com>
//
// Distributed under terms of the GPL license.

// +k8s:deepcopy-gen=package

// Package v1 is the v1 version of the API.
// +groupName=crd.lijiaocn.com
package v1
```

“// +k8s:deepcopy-gen=package”：为这个package中的所有type生成deepcopy代码。

“// +groupName=crd.lijiaocn.com”：设置这个package对应的api group。

在internal/apis/selfcrd/v1/types.go中定义type：

```go
// Create: 2019/04/04 15:50:00 Change: 2019/04/04 15:51:29
// FileName: types.go
// Copyright (C) 2019 lijiaocn <lijiaocn@foxmail.com>
//
// Distributed under terms of the GPL license.

package v1

import (
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// +genclient
// +genclient:noStatus
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

// SelfCRD is a top-level type. A client is created for it.
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object
type SelfCRD struct {
	metav1.TypeMeta `json:",inline"`
	// +optional
	metav1.ObjectMeta `json:"metadata,omitempty"`

	// Username unique username of the consumer.
	Username string `json:"username,omitempty"`

	// CustomID existing unique ID for the consumer - useful for mapping
	// Kong with users in your existing database
	CustomID string `json:"custom_id,omitempty"`
}

// Configuration contains a plugin configuration
// +k8s:deepcopy-gen=false
type Configuration map[string]interface{}
```

“// +genclient”：为该type生成client代码。

“// +genclient:noStatus”：为该type生成的client代码，不包含`UpdateStatus`方法。 

“// +genclient:nonNamespaced”：如果是集群资源，设置为不带namespace。

还支持在注释中使用以下tag：

```go
// +genclient:noVerbs
// +genclient:onlyVerbs=create,delete
// +genclient:skipVerbs=get,list,create,update,patch,delete,deleteCollection,watch
// +genclient:method=Create,verb=create,result=k8s.io/apimachinery/pkg/apis/meta/v1.Status
```

## 生成CRD代码

生成代码之前的文件目录如下：

```
➜  example-1 git:(master) ✗ tree internal
internal
└── apis
    └── selfcrd
        └── v1
            ├── doc.go
            └── types.go
```

生成代码之前，还要准备一个代码文件模板，hack/boilerplate.go.txt，模板中的内容会在生成的代码文件中出现：

```go
/*
Copyright 2019 The Lijiao Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
 */
```

运行代码生成脚本generate-groups.sh：

```sh
$ vendor/k8s.io/code-generator/generate-groups.sh all \
github.com/lijiaocn/workspace/studys/study-k8s-develop/code-generator/example-1/internal/client/selfcrd     \
github.com/lijiaocn/workspace/studys/study-k8s-develop/code-generator/example-1/internal/apis selfcrd:v1  \
--go-header-file  hack/boilerplate.go.txt
```

上面命令的含义是：

1. 为第三个参数“github.com/lijiaocn/workspace/studys/study-k8s-develop/code-generator/example-1/internal/apis”中的`selfcrd/v1`生成client代码；

2. 生成的client代码位于第二个参数“github.com/lijiaocn/workspace/studys/study-k8s-develop/code-generator/example-1/internal/client/selfcrd”指定的目录中；

3. 使用模板文件hack/boilerplate.go.txt。

代码生成之后，目录结构如下：

```sh
➜  example-1 git:(master) ✗ tree internal
internal
├── apis
│   └── selfcrd
│       └── v1
│           ├── doc.go
│           ├── types.go
│           └── zz_generated.deepcopy.go
└── client
    └── selfcrd
        ├── clientset
        │   └── versioned
        │       ├── clientset.go
        │       ├── doc.go
        │       ├── fake
        │       │   ├── clientset_generated.go
        │       │   ├── doc.go
        │       │   └── register.go
        │       ├── scheme
        │       │   ├── doc.go
        │       │   └── register.go
        │       └── typed
        │           └── selfcrd
        │               └── v1
        │                   ├── doc.go
        │                   ├── fake
        │                   │   ├── doc.go
        │                   │   ├── fake_selfcrd.go
        │                   │   └── fake_selfcrd_client.go
        │                   ├── generated_expansion.go
        │                   ├── selfcrd.go
        │                   └── selfcrd_client.go
        ├── informers
        │   └── externalversions
        │       ├── factory.go
        │       ├── generic.go
        │       ├── internalinterfaces
        │       │   └── factory_interfaces.go
        │       └── selfcrd
        │           ├── interface.go
        │           └── v1
        │               ├── interface.go
        │               └── selfcrd.go
        └── listers
            └── selfcrd
                └── v1
                    ├── expansion_generated.go
                    └── selfcrd.go

```

## 参考

1. [kubernetes/code-generator][1]
2. [Kubernetes Deep Dive: Code Generation for CustomResources][2]

[1]: https://github.com/kubernetes/code-generator/ "kubernetes/code-generator"
[2]: https://blog.openshift.com/kubernetes-deep-dive-code-generation-customresources/ "Kubernetes Deep Dive: Code Generation for CustomResources"
