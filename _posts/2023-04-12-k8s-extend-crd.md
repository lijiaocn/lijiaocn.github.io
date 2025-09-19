---
layout: default
title: "kubernetes 扩展：CRD 的使用方法"
author: 李佶澳
date: "2023-04-12 17:23:16 +0800"
last_modified_at: "2023-07-07 11:13:05 +0800"
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

Kubernetes 提供了 [Custom Resources][2] 功能，允许增加自定义的 Resource。用户自定义资源简称为 CR，用户自定义资源的定义简称 CRD。需要先在 kubernetes 集群中创建 CRD，然后才可以创建对应的 CR。CR 的操作管理和 kubernetes 内置资源的操作方式相同，而且可以用 kubernetes 项目中的代码生成工具为 CR 生成类似的操作代码，比如 clientset、informer 等。

CRD 使用见:

* [Extend the Kubernetes API with CustomResourceDefinitions][3]


## 环境准备

准备一个 kubernetes 集群，这里用 minikube 代替：

```sh
minikube start --driver=docker --kubernetes-version=v1.26.3
```

## 在 Kubernetes 集群中创建 CRD 

CRD 的创建过程和 kubernetes 的其它资源创建方式类似，都是用 yaml 文件描述，CRD 的 kind 为 CustomResourceDefinition。定义一个名为 CronTab 的 CRD：

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

* `group: stable.example.com` 定义了 CronTab 对应的 http api 路径： /apis/`stable.example.com`/v1/namespaces/*/crontabs/
* versions 定义了 CronTab 的版本
* openAPIV3Schema 定义了 CronTab 的属性，具体用法见 [Extend the Kubernetes API with CustomResourceDefinitions][3]

```sh
$ kubectl apply -f crd_crontab.yaml 
customresourcedefinition.apiextensions.k8s.io/crontabs.stable.example.com created
```

```sh
$ kubectl get crd 
NAME                          CREATED AT
crontabs.stable.example.com   2023-04-12T09:53:53Z
```

## 在集群中操作 CR

在 kubernetes 中完成 crd 定义后，就可以创建对应类型的资源（CR）：

```yaml
apiVersion: "stable.example.com/v1"
kind: CronTab
metadata:
  name: my-new-cron-object
spec:
  image: my-awesome-cron-image
  cronSpec: "* * * * */5"
  replicas: 10
```

自定义资源的操作方式和操作 kubernetes 内置资源的操作方法相同：

```sh
$ kubectl create -f my_crontab.yaml
crontab.stable.example.com/my-new-cron-object created

$ kubectl get crontab         
NAME                 AGE
my-new-cron-object   78d
```

## 编写 CRD 处理代码

在 kubernetes 中创建了 CRD 后，还需要为 CRD 编写处理代码，为 crontab 创建一个项目：

```sh
go mod init 
go mod init study_kubernetes/crd/crontab
```

### 自动生成的 CRD 代码

kubernetes 代码生成机制对自定义的 CRD 同样适用。根据以下材料演示一下为自定义 CRD 生成代码的过程：

* [How to generate client codes for Kubernetes Custom Resource Definitions (CRD)][8] （其中提到的一些操作已经过时，比如用 go get 获取code-gen）
* 参考 kubernetes 给出的示范：[github.com/kubernetes/sample-controller][9] 

#### 引入代码生成工具

引入代码生成工具。kubernetes 的代码生成工具的实现代码位于 [staging/src/k8s.io/code-generator][11] 中，它有一个单独的镜像 repo [k8s.io/code-generator][5]。code-generator 的 v0.26.3 对应 kubernetes 1.26.3：


```sh
go get k8s.io/apimachinery@v0.26.3      # CronTab 定义需要引用其中的 Struct
go get k8s.io/code-generator@v0.26.3    # 用于代码生成的脚本
```

code-generator 默认项目采用 Go 早期的代码组织方式，即认为运行环境在 $GOPATH/src/k8s.io/code-generator 目录中，需要做一下处理：

* 在当前项目中创建 hack/tools.go，并且添加对 k8s.io/code-generator 的引用

```go
package hack

import _ "k8s.io/code-generator"
```

* 执行 go mod vendor，检查生成的 vendor 目录，确定导入了 vendor/k8s.io/code-generator 目录

```sh
$ go mod vendor
$ ls vendor/k8s.io/code-generator 
```

* 后续用 vendor/k8s.io/code-generator 目录中的脚本生成代码。

#### 代码生成原理 

code-generator 通过执行 .go 文件注释中的命令来生成代码，比如 [kubernetes/pkg/apis][12] 大量使用如下注释：

```go
// +k8s:conversion-gen=k8s.io/kubernetes/pkg/apis/admission
// +k8s:conversion-gen-external-types=k8s.io/api/admission/v1
// +k8s:defaulter-gen=TypeMeta
// +k8s:defaulter-gen-input=k8s.io/api/admission/v1

// +groupName=admission.k8s.io

package v1 // import "k8s.io/kubernetes/pkg/apis/admission/v1"
```

[How to generate client codes for Kubernetes Custom Resource Definitions (CRD)][8] 中介绍了部分命令的用途。具体的生成逻辑已经拆分到 [github.com/kubernetes/gengo][10]（没有文档说明）。

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


####  编写 CRD 定义代码

在项目中新建一个目录存放 CRD 的定义代码文件 doc.go、types.go 和 register.go，并在注释中写入生成命令：

```sh
mkdir -p pkg/apis/crontab/v1
```

doc.go 主要用途就是在注释中添加代码生成指令、指定 groupName 等（groupName 需要在 pacakge v1 的正上方）

```go
// +k8s:deepcopy-gen=package
// +k8s:defaulter-gen=TypeMeta
// +groupName=stable.example.com
package v1
```

types.go 定义 CRD 对应的 struct，并在注释中指定要生成的代码：

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

register.go 代码给出自定义的 CRD struct 注册到 Scheme 的方法。后面 Operator 开发时会用到这里的 AddtoScheme。

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
    scheme.AddKnownTypes(SchemeGroupVersion,
        &CronTab{},
        &CronTabList{})
    metav1.AddToGroupVersion(scheme, SchemeGroupVersion)
    return nil
}
```


#### 生成 CRD 代码

在 hack 中创建一个空文件 boilerplate.go.txt：

```sh
touch hack/boilerplate.go.txt
```

在 hack 中创建一个生成脚本 update_codegen.sh，写入下面的生成命令：

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

生成的代码文件有两部分：

* 位于 CRD 定义文件所在目录的 zz_generated.deepcopy.go，为 struct 增加了 DeepCopy 等方法
* 位于 pkg/generated 中的 client 相关代码

```sh
$ ls pkg/apis/crontab/v1/zz_generated.deepcopy.go 
pkg/apis/crontab/v1/zz_generated.deepcopy.go
$ ls pkg/generated 
clientset informers listers
```

#### 自动生成的 CRD 代码的使用方法

用生成的 clientSet 从 kubernetes 集群中读取 crontab：

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

### 编写 CRD 处理逻辑

CRD 的处理逻辑可以在 Operator 中实现：[kubernetes 扩展：operator 的开发][13]。下面是一个简单的 operator，单纯把发生变化的 CrontTab 打印出来：

```sh
go get sigs.k8s.io/controller-runtime@v0.14.6
```

```go
package main

import (
    "context"
    "fmt"
    "k8s.io/apimachinery/pkg/runtime"
    "os"
    v1 "study_kubernetes/crd/crontab/pkg/apis/crontab/v1"

    "sigs.k8s.io/controller-runtime/pkg/builder"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/client/config"

    logf "sigs.k8s.io/controller-runtime/pkg/log"
    "sigs.k8s.io/controller-runtime/pkg/log/zap"
    "sigs.k8s.io/controller-runtime/pkg/manager"
    "sigs.k8s.io/controller-runtime/pkg/manager/signals"
    "sigs.k8s.io/controller-runtime/pkg/reconcile"
)

var (
    scheme = runtime.NewScheme()
)

func init() {
    if err := v1.AddToScheme(scheme); err != nil {
        panic(err)
    }
}

func main() {
    logf.SetLogger(zap.New())

    var log = logf.Log.WithName("builder-examples")

    mgr, err := manager.New(config.GetConfigOrDie(), manager.Options{Scheme: scheme})
    if err != nil {
        log.Error(err, "could not create manager")
        os.Exit(1)
    }

    err = builder.ControllerManagedBy(mgr).
        For(&v1.CronTab{}).
        Complete(&CrontabReconciler{})

    if err != nil {
        log.Error(err, "could not create controller")
        os.Exit(1)
    }

    if err := mgr.Start(signals.SetupSignalHandler()); err != nil {
        log.Error(err, "could not start manager")
        os.Exit(1)
    }
}

type CrontabReconciler struct {
    client.Client
}

func (a *CrontabReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
    fmt.Printf("Reconcile: %s\n", req.String())
    rs := &v1.CronTab{}
    err := a.Get(ctx, req.NamespacedName, rs)
    if err != nil {
        return reconcile.Result{}, err
    }
    fmt.Printf("CronTab: %+v\n", rs)

    return reconcile.Result{}, nil
}

func (a *CrontabReconciler) InjectClient(c client.Client) error {
    a.Client = c
    return nil
}
```

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
11. [staging/src/k8s.io/code-generator][11]
12. [kubernetes/tree/master/pkg/apis][12]
13. [kubernetes 扩展：operator 的开发][13]

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
[11]: https://github.com/kubernetes/kubernetes/tree/master/staging/src/k8s.io/code-generator "staging/src/k8s.io/code-generator"
[12]: https://github.com/kubernetes/kubernetes/tree/master/pkg/apis "kubernetes/tree/master/pkg/apis"
[13]: /项目/2023/04/19/k8s-extend-operator.html "kubernetes 扩展：operator 的开发"
