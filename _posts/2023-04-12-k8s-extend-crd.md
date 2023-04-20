---
layout: default
title: "kubernetes 扩展：CRD 的使用（自定义资源）"
author: 李佶澳
date: "2023-04-12 17:23:16 +0800"
last_modified_at: "2023-04-20 15:18:02 +0800"
categories: 项目
cover:
tags: kubernetes
keywords:
description: "kubernetes 提供了 Custom Resources 功能，允许增加自定义的 Resource。可以为自定义的 CRD 自动生成 client 等代码，使自定义资源的操作方式和内置资源的使用方式统一。"
---


## 目录

* auto-gen TOC:
{:toc}

## 说明

kubernetes 提供了 [Custom Resources][2] 功能，允许增加自定义的 Resource。可以为自定义的 CRD 自动生成 client 等代码，使自定义资源的操作方式和内置资源的使用方式统一。

CRD 使用见:

* [Extend the Kubernetes API with CustomResourceDefinitions][3]

## CRD 定义和创建

CRD 的创建过程和 kubernetes 的其它资源创建方式类似，用 yaml 文件描述，kind 为 CustomResourceDefinition。下面的文件定义了一个名为 CronTab 的资源。

* CronTab 的 api 路径 /apis/`stable.example.com`/v1/namespaces/*/crontabs/ 和 group 字段值对应

```yaml
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  # name must match the spec fields below, and be in the form: <plural>.<group>
  name: crontabs.stable.example.com
spec:
  # group name to use for REST API: /apis/<group>/<version>
  group: stable.example.com
  # list of versions supported by this CustomResourceDefinition
  versions:
    - name: v1
      # Each version can be enabled/disabled by Served flag.
      served: true
      # One and only one version must be marked as the storage version.
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                cronSpec:
                  type: string
                image:
                  type: string
                replicas:
                  type: integer
  # either Namespaced or Cluster
  scope: Namespaced
  names:
    # plural name to be used in the URL: /apis/<group>/<version>/<plural>
    plural: crontabs
    # singular name to be used as an alias on the CLI and for display
    singular: crontab
    # kind is normally the CamelCased singular type. Your resource manifests use this.
    kind: CronTab
    # shortNames allow shorter string to match your resource on the CLI
    shortNames:
    - ct
```

创建 CRD：

```sh
$ kubectl apply -f crd_crontab.yaml 
customresourcedefinition.apiextensions.k8s.io/crontabs.stable.example.com created
```

查看 CRD：

```sh
$ kubectl get crd 
NAME                          CREATED AT
crontabs.stable.example.com   2023-04-12T09:53:53Z
```

openAPIV3Schema 中定义了 crd 的属性以及属性值类型，具体用法见 [Extend the Kubernetes API with CustomResourceDefinitions][3]。

## CRD 操作代码生成

kubernetes 中有大量的生成代码，自定义的 CRD 也可以用 kubernetes 的代码生成机制生成对应的代码。[How to generate client codes for Kubernetes Custom Resource Definitions (CRD)][8] 介绍了代码生成过程（但是一些操作已经过时，比如用 go get 获取code-gen），结合 kubernetes 给出的示例 [github.com/kubernetes/sample-controller][9] ，创建一个简单项目为上面定义的 CronTab 生成代码。

### 项目初始化

新建项目：

```sh
go mod init 
go mod init study_kubernetes/crd/crontab
```

获取依赖代码，v0.26.3 对应 kuberntes 1.26.3：

```sh
go get k8s.io/apimachinery@v0.26.3      # CronTab 定义需要引用其中的 Struct
go get k8s.io/code-generator@v0.26.3    # 用于代码生成的脚本
```

其中 [code-generator][5] 是从 kubernetes 主代码仓库中抽取出来的代码生成工具，这个工具默认是行在 $GOPATH/src/XX 目录中（Go z早期的代码组织方式）。现在 Go 的代码组织都是用 go mod 的方式，为了运行 code-generator 中的脚本，需要进行一些特殊处理。

创建 hack/tools.go，在其中 import k8s.io/code-generator。保证后面用的 go mod vendor 命令会在 vendor 目录中添加 code-generator。

```go
package hack

import _ "k8s.io/code-generator"
```

执行 go mod vendor，生成 vendor 目录，并且确保存在 vendor/k8s.io/code-generator 目录，后面生成代码时就使用其中的脚本。

```sh
$ go mod vendor
$ ls vendor/k8s.io/code-generator 
```

### 代码生成原理 

code-generator 原理是通过执行 .go 文件注释中的命令生成代码，比如 [kubernetes/pkg/apis](https://github.com/kubernetes/kubernetes/tree/master/pkg/apis) 中的代码大量使用如下格式的注释：

```go
// +k8s:conversion-gen=k8s.io/kubernetes/pkg/apis/admission
// +k8s:conversion-gen-external-types=k8s.io/api/admission/v1
// +k8s:defaulter-gen=TypeMeta
// +k8s:defaulter-gen-input=k8s.io/api/admission/v1

// +groupName=admission.k8s.io

package v1 // import "k8s.io/kubernetes/pkg/apis/admission/v1"
```

代码的生成逻辑已经 clone 到单独的 [github.com/kubernetes/gengo][10] 仓库中，但是没有找到这些注释中命令的使用说明。[How to generate client codes for Kubernetes Custom Resource Definitions (CRD)][8] 中介绍了一部分命令的用途：

* `+genclient`  - generate default client verb functions (create, update, delete, get, list, update, patch, watch and depending on the existence of .Status field in the type the client is generated for also updateStatus).
* `+genclient:nonNamespaced` - all verb functions are generated without namespace.
* `+genclient:onlyVerbs=create,get` - only listed verb functions will be generated.
* `+genclient:skipVerbs=watch` - all default client verb functions will be generated except watch verb.
* `+genclient:noStatus` - skip generation of updateStatus verb even thought the .Status field exists.
* `+genclient:method=Scale,verb=update,subresource=scale, input=k8s.io/api/extensions/v1beta1.Scale,result=k8s.io/api/extensions/v1beta1.Scale` - in this case a new function Scale(string, *v1beta.Scale) *v1beta.Scalewill be added to the default client and the body of the function will be based on the update verb. The optional subresource argument will make the generated client function use subresource scale. Using the optional input and result arguments you can override the default type with a custom type. If the import path is not given, the generator will assume the type exists in the same package.
* `+groupName=policy.authorization.k8s.io` – used in the fake client as the full group name (defaults to the package name).
* `+groupGoName=AuthorizationPolicy` – a CamelCase Golang identifier to de-conflict groups with non-unique prefixes like policy.authorization.k8s.io and policy.k8s.io. These would lead to two Policy() methods in the clientset otherwise (defaults to the upper-case first segement of the group name).
* `+k8s:deepcopy-gen:interfaces` tag can and should also be used in cases where you define API types that have fields of some interface type, for example, field SomeInterface. Then // +k8s:deepcopy-gen:interfaces=example.com/pkg/apis/example.SomeInterface will lead to the generation of a DeepCopySomeInterface() SomeInterface method. This allows it to deepcopy those fields in a type-correct way.
* `+groupName=example.com` defines the fully qualified API group name. If you get that wrong, client-gen will produce wrong code. Be warned that this tag must be in the comment block just above package


###  编写 CRD 定义

在项目中新建一个目录存放 CRD 的定义代码文件 doc.go、types.go 和 register.go，在这些代码中包含代码生成的注释命令：

```sh
mkdir -p pkg/apis/crontab/v1
```

doc.go 声明要生成的代码类型以及 groupName（groupName需要在 pacakge v1 的正上方）

```go
// +k8s:deepcopy-gen=package
// +k8s:defaulter-gen=TypeMeta
// +groupName=stable.example.com
package v1
```

types.go 给出目标资源对应的 struct，并用注释命令指定要生成的代码：

```go
package v1

import (
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
)

// +genclient
// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

type CronTab struct {
    metav1.TypeMeta   `json:",inline"`
    metav1.ObjectMeta `json:"metadata,omitempty"`
    Spec              CronTabSpec   `json:"spec"`
    Status            CronTabStatus `json:"status"`
}

type CronTabSpec struct {
    CronSpec string `json:"cronSpec"`
    Image    string `json:"image"`
    Replicas int    `json:"replicas"`
}

type CronTabStatus struct {
    AvailableReplicas int32 `json:"availableReplicas"`
}

// +k8s:deepcopy-gen:interfaces=k8s.io/apimachinery/pkg/runtime.Object

type CronTabList struct {
    metav1.TypeMeta `json:",inline"`
    metav1.ListMeta `json:"metadata"`

    Items []CronTab `json:"items"`
}
```

register.go 代码：

```go
package v1

import (
    metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/apimachinery/pkg/runtime"
    "k8s.io/apimachinery/pkg/runtime/schema"
)

const GroupName = "stable.example.com"

var SchemeGroupVersion = schema.GroupVersion{Group: GroupName, Version: "v1"}

func Resource(resource string) schema.GroupResource {
    return SchemeGroupVersion.WithResource(resource).GroupResource()
}

var (
    SchemeBuilder = runtime.NewSchemeBuilder(addKnownTypes)
    AddToScheme   = SchemeBuilder.AddToScheme
)

func addKnownTypes(scheme *runtime.Scheme) error {
    scheme.AddKnownTypes(SchemeGroupVersion, &CronTab{})
    scheme.AddKnownTypes(SchemeGroupVersion, &metav1.Status{})

    metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
    return nil
}
```


### 生成代码

在 hack 中创建一个空文件 boilerplate.go.txt：

```sh
touch hack/boilerplate.go.txt
```

在 hack 中创建一个生成脚本：

```sh
#!/bin/sh
go mod tidy && go mod vendor
chmod +x vendor/k8s.io/code-generator/*.sh

# 脚本所在目录
ROOT=$(dirname "${BASH_SOURCE[0]}")/..
CODEGEN_PKG=${ROOT}/vendor/k8s.io/code-generator
${CODEGEN_PKG}/generate-groups.sh "deepcopy,client,informer,lister" \
  study_kubernetes/crd/crontab/pkg/generated \
  study_kubernetes/crd/crontab/pkg/apis \
  crontab:v1 \
  --go-header-file ${ROOT}/hack/boilerplate.go.txt \
  --output-base ${ROOT}/../../../   # 必须是study_kubernetes所在的目录，如果没有用 --output-base 指定目录，代码默认生成在 $GOPATH/src 中
rm -rf ${ROOT}/vendor   # 生成完成后 vendor 就不再需要了
```

如果有没有用 --output-base 指定目录，代码默认生成在 $GOPATH/src 中。

执行脚本得到生成代码：

```sh
$ bash hack/update_codegen.sh 
Generating deepcopy funcs
Generating clientset for crontab:v1 at study_kubernetes/crd/crontab/pkg/generated/clientset
Generating listers for crontab:v1 at study_kubernetes/crd/crontab/pkg/generated/listers
Generating informers for crontab:v1 at study_kubernetes/crd/crontab/pkg/generated/informers
```

生成的代码文件有两部分

* 位于 CRD 定义文件所在目录的 zz_generated.deepcopy.go，为 struct 定义增加了 DeepCopy 等方法
* 位于 pkg/generated 中的 client 相关代码

```sh
$ ls pkg/apis/crontab/v1/zz_generated.deepcopy.go 
pkg/apis/crontab/v1/zz_generated.deepcopy.go
$ ls pkg/generated 
clientset informers listers
```

### 生成代码的使用

写一个程序用生成的 clientSet 从 kubernetes 集群中读取 crontab：

```sh
mkdir -p cmd/client
go get k8s.io/client-go@v0.26.3   # 配置文件解析需要用 client-go
```

```go
package main

import (
    "context"
    "flag"
    "fmt"
    "k8s.io/apimachinery/pkg/apis/meta/v1"
    "k8s.io/client-go/tools/clientcmd"
    "k8s.io/klog/v2"

    clientset "study_kubernetes/crd/crontab/pkg/generated/clientset/versioned"    //注意用的是生成的 clientset
)

var (
    masterURL  string
    kubeconfig string
)

func init() {
    flag.StringVar(&kubeconfig, "kubeconfig", "", "Path to a kubeconfig. Only required if out-of-cluster.")
    flag.StringVar(&masterURL, "master", "", "The address of the Kubernetes API server. Overrides any value in kubeconfig. Only required if out-of-cluster.")
}

func main() {
    klog.InitFlags(nil)
    flag.Parse()

    ctx := context.Background()
    logger := klog.FromContext(ctx)

    // config 的加载读取还需要用 k8s.io/client-go 中的代码
    config, err := clientcmd.BuildConfigFromFlags(masterURL, kubeconfig)
    if err != nil {
        logger.Error(err, "Error BuildConfigFromFlags")
        klog.FlushAndExit(klog.ExitFlushTimeout, 1)
    }

    // 这里使用生成的 clientset，不是 k8s.io/client-go 的实现
    cronTabClient, err := clientset.NewForConfig(config)
    if err != nil {
        logger.Error(err, "Error create cronTabClient")
        klog.FlushAndExit(klog.ExitFlushTimeout, 1)
    }

    // 生成的 clientset 包含 CronTabs() 方法，可以对 CronTab 进行相关操作：
    cronTabList, err := cronTabClient.StableV1().CronTabs("default").List(ctx, v1.ListOptions{})
    if err != nil {
        logger.Error(err, "ListCronTabs fail")
        klog.FlushAndExit(klog.ExitFlushTimeout, 1)
    }
    for _, cronTab := range cronTabList.Items {
        fmt.Printf("namespace=%s,name=%s,image=%s,cronSpec=%s,replicas=%d",
            cronTab.Namespace, cronTab.Name, cronTab.Spec.Image, cronTab.Spec.CronSpec, cronTab.Spec.Replicas)
    }
}
```

运行效果如下：

```sh
$ ./client --kubeconfig=/Users/lijiaocn/.kube/config
namespace=default,name=my-new-cron-object,image=my-awesome-cron-image,cronSpec=* * * * */5,replicas=10
```

informer、lister 的用法类似。通过这些自动生成代码，自定义资源的操作方法可以和 kubernetes 内置的标准资源的操作方法保持统一。

## 参考

1. [李佶澳的博客][1]
2. [custom-resource-definitions][2]
3. [Extend the Kubernetes API with CustomResourceDefinitions][3]
4. [Kubernetes controller-runtime Project][4]
5. [code-generator][5]
6. [Kubernetes Deep Dive: Code Generation for CustomResources][6]
7. [Build a Kubernetes Operator in 10 Minutes][7]
8. [How to generate client codes for Kubernetes Custom Resource Definitions (CRD)][8]
9. [github.com/kubernetes/sample-controller][9]
10. [github.com/kubernetes/gengo][10]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://kubernetes.io/docs/tasks/extend-kubernetes/custom-resources/custom-resource-definitions/ "custom-resource-definitions"
[3]: https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/ "Extend the Kubernetes API with CustomResourceDefinitions"
[4]: https://github.com/kubernetes-sigs/controller-runtime "Kubernetes controller-runtime Project"
[5]: https://github.com/kubernetes/code-generator "code-generator"
[6]: https://cloud.redhat.com/blog/kubernetes-deep-dive-code-generation-customresources "Kubernetes Deep Dive: Code Generation for CustomResources"
[7]: https://betterprogramming.pub/build-a-kubernetes-operator-in-10-minutes-11eec1492d30 "Build a Kubernetes Operator in 10 Minutes"
[8]: https://itnext.io/how-to-generate-client-codes-for-kubernetes-custom-resource-definitions-crd-b4b9907769ba "How to generate client codes for Kubernetes Custom Resource Definitions (CRD)"
[9]: https://github.com/kubernetes/sample-controller "github.com/kubernetes/sample-controller"
[10]: https://github.com/kubernetes/gengo "https://github.com/kubernetes/gengo"
