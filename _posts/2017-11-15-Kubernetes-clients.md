---
layout: default
title: kubernetes 的 Client Libraries 的使用
author: 李佶澳
createdate: 2017/11/15 15:37:33
last_modified_at: 2017/11/17 16:18:46
categories: 项目
tags: kubernetes
keywords: kubernetes
description: kubernetes的Client Libraries的使用

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

kubernetes 估计会成为 linux 一样的存在，[client-go][1] 是它的 go sdk，[client-go/examples/][5] 给出了一些用例，但是数量比较少。

## api

Resource 的定义不在client-go中，而是在一个名为 [api][3] 的项目中，这个项目中的内容同步自 kubernetes 项目的目录 [staging/src/k8s.io/api](https://github.com/kubernetes/kubernetes/blob/master/staging/src/k8s.io/api)，可以用下面的方式获取：

```bash
go get k8s.io/api
```

api的目录结构如下：

```vim
▾ api/
  ▸ admission/
  ▸ admissionregistration/
  ▸ apps/
  ▸ authentication/
  ▸ authorization/
  ▸ autoscaling/
  ▸ batch/
  ▸ certificates/
  ▸ core/
  ▸ extensions/
  ▸ Godeps/
  ▸ imagepolicy/
  ▸ networking/
  ▸ policy/
  ▸ rbac/
  ▸ scheduling/
  ▸ settings/
  ▸ storage/
  ▸ vendor/
    LICENSE
    OWNERS
    README.md
```

## client-go

[client-go][1]是kubernetes官方的项目，go语言实现，使用示例源码位于:  [go-code-example/k8sclient][2]。

获取 client-go:

```sh
go get k8s.io/client-go
go get k8s.io/apimachinery
go get k8s.io/api
go get k8s.io/kube-openapi
```

### 创建 Clientset

Clientset 包含 kubernetes 的所有资源的操作句柄，通过"k8s.io/client-go/kubernetes"中`NewForConfig()`创建。

创建 Clientset 需要提供一个 rest.Config，Config 可以用后面提到的 tools/clientcmd 生成，也可以自己填写：

```go
config := rest.Config{
    Host:            "https://10.39.0.105:6443",
    APIPath:         "/",
    Prefix:          "",
    BearerToken:     "af8cbdf725efadf8c4",
    TLSClientConfig: rest.TLSClientConfig{Insecure: true},
}
```

创建方法很简单：

```go
clientset, err := kubernetes.NewForConfig(&config)
```

### 使用 Clientset

Clientset，意如其名，是client 的集合，在client-go/kubernetes/clientset.go中定义。

```go
type Clientset struct {
    *discovery.DiscoveryClient
    admissionregistrationV1alpha1 *admissionregistrationv1alpha1.AdmissionregistrationV1alpha1Client
    appsV1beta1                   *appsv1beta1.AppsV1beta1Client
    appsV1beta2                   *appsv1beta2.AppsV1beta2Client
    appsV1                        *appsv1.AppsV1Client
    authenticationV1              *authenticationv1.AuthenticationV1Client
    authenticationV1beta1         *authenticationv1beta1.AuthenticationV1beta1Client
    authorizationV1               *authorizationv1.AuthorizationV1Client
    authorizationV1beta1          *authorizationv1beta1.AuthorizationV1beta1Client
    autoscalingV1                 *autoscalingv1.AutoscalingV1Client
    autoscalingV2beta1            *autoscalingv2beta1.AutoscalingV2beta1Client
    batchV1                       *batchv1.BatchV1Client
    batchV1beta1                  *batchv1beta1.BatchV1beta1Client
    batchV2alpha1                 *batchv2alpha1.BatchV2alpha1Client
    certificatesV1beta1           *certificatesv1beta1.CertificatesV1beta1Client
    coreV1                        *corev1.CoreV1Client
    extensionsV1beta1             *extensionsv1beta1.ExtensionsV1beta1Client
    networkingV1                  *networkingv1.NetworkingV1Client
    policyV1beta1                 *policyv1beta1.PolicyV1beta1Client
    rbacV1                        *rbacv1.RbacV1Client
    rbacV1beta1                   *rbacv1beta1.RbacV1beta1Client
    rbacV1alpha1                  *rbacv1alpha1.RbacV1alpha1Client
    schedulingV1alpha1            *schedulingv1alpha1.SchedulingV1alpha1Client
    settingsV1alpha1              *settingsv1alpha1.SettingsV1alpha1Client
    storageV1beta1                *storagev1beta1.StorageV1beta1Client
    storageV1                     *storagev1.StorageV1Client
}
```

用 Clientset 的方法获得不同资源的操作句柄，Clientset有以下的方法可供使用：

```vim
+Admissionregistration() : admissionregistrationv1alpha1.AdmissionregistrationV1alpha1Interface
+AdmissionregistrationV1alpha1() : admissionregistrationv1alpha1.AdmissionregistrationV1alpha1Interface
+Apps() : appsv1.AppsV1Interface
+AppsV1() : appsv1.AppsV1Interface
+AppsV1beta1() : appsv1beta1.AppsV1beta1Interface
+AppsV1beta2() : appsv1beta2.AppsV1beta2Interface
+Authentication() : authenticationv1.AuthenticationV1Interface
+AuthenticationV1() : authenticationv1.AuthenticationV1Interface
+AuthenticationV1beta1() : authenticationv1beta1.AuthenticationV1beta1Interface
+Authorization() : authorizationv1.AuthorizationV1Interface
+AuthorizationV1() : authorizationv1.AuthorizationV1Interface
+AuthorizationV1beta1() : authorizationv1beta1.AuthorizationV1beta1Interface
+Autoscaling() : autoscalingv1.AutoscalingV1Interface
+AutoscalingV1() : autoscalingv1.AutoscalingV1Interface
+AutoscalingV2beta1() : autoscalingv2beta1.AutoscalingV2beta1Interface
+Batch() : batchv1.BatchV1Interface
+BatchV1() : batchv1.BatchV1Interface
+BatchV1beta1() : batchv1beta1.BatchV1beta1Interface
+BatchV2alpha1() : batchv2alpha1.BatchV2alpha1Interface
+Certificates() : certificatesv1beta1.CertificatesV1beta1Interface
+CertificatesV1beta1() : certificatesv1beta1.CertificatesV1beta1Interface
+Core() : corev1.CoreV1Interface
+CoreV1() : corev1.CoreV1Interface
+Discovery() : discovery.DiscoveryInterface
+Extensions() : extensionsv1beta1.ExtensionsV1beta1Interface
+ExtensionsV1beta1() : extensionsv1beta1.ExtensionsV1beta1Interface
+Networking() : networkingv1.NetworkingV1Interface
+NetworkingV1() : networkingv1.NetworkingV1Interface
+Policy() : policyv1beta1.PolicyV1beta1Interface
+PolicyV1beta1() : policyv1beta1.PolicyV1beta1Interface
+Rbac() : rbacv1.RbacV1Interface
+RbacV1() : rbacv1.RbacV1Interface
+RbacV1alpha1() : rbacv1alpha1.RbacV1alpha1Interface
+RbacV1beta1() : rbacv1beta1.RbacV1beta1Interface
+Scheduling() : schedulingv1alpha1.SchedulingV1alpha1Interface
+SchedulingV1alpha1() : schedulingv1alpha1.SchedulingV1alpha1Interface
+Settings() : settingsv1alpha1.SettingsV1alpha1Interface
+SettingsV1alpha1() : settingsv1alpha1.SettingsV1alpha1Interface
+Storage() : storagev1.StorageV1Interface
+StorageV1() : storagev1.StorageV1Interface
+StorageV1beta1() : storagev1beta1.StorageV1beta1Interface
```

其中Core()和CoreV1()获取到的corev1.CoreV1Interface，用来操作kubernetes的最基础的Resrouce。

```go
type CoreV1Interface interface {
    RESTClient() rest.Interface
    ComponentStatusesGetter
    ConfigMapsGetter
    EndpointsGetter
    EventsGetter
    LimitRangesGetter
    NamespacesGetter
    NodesGetter
    PersistentVolumesGetter
    PersistentVolumeClaimsGetter
    PodsGetter
    PodTemplatesGetter
    ReplicationControllersGetter
    ResourceQuotasGetter
    SecretsGetter
    ServicesGetter
    ServiceAccountsGetter
}
```

例如查找指定 namespace 中的所有 Pod：

```go
pods, err := clientset.CoreV1().Pods("lijiaocn").List(v1.ListOptions{})
```

### 创建 RESTClient

[client-go/rest](https://github.com/kubernetes/client-go/tree/master/rest) 实现了 RESTClient，RESTClient 的创建方法有两种。

第一种方式是直接通过 config 创建，这种方式需要在 config 中填入 GroupVersion 信息：

```go
// create restClient from config
func CreateCoreRestClient(config *rest.Config) (*rest.RESTClient, error) {

    config.ContentConfig.GroupVersion = &core_v1.SchemeGroupVersion
    config.ContentConfig.NegotiatedSerializer = serializer.DirectCodecFactory{CodecFactory: scheme.Codecs}
    config.APIPath = "/api"

    restClient, err := rest.RESTClientFor(config)
    if err != nil {
        return nil, err
    }

    if restClient == nil {
        return nil, errors.New("restclient1 is nil")
    }

    return restClient, nil
}
```

第二种方式是从 Clientset 中获取，这种方式不需要手动填入 GroupVersion，调用 Clientset 对应的接口即可：

```go
// get restClient from clientset
func GetCoreRestClient(config *rest.Config) (rest.Interface, error) {

    clientset, err := kubernetes.NewForConfig(config)
    if err != nil {
        return nil, err
    }

    if clientset == nil {
        return nil, errors.New("clientset is nil")
    }

    restClient := clientset.CoreV1().RESTClient()
    if restClient == nil {
        return nil, errors.New("restclient is nil")
    }

    return restClient, nil
}
```

### 使用 RESTClient

RESTClient 是链式调用，使用方法如下，Do() 方法最后调用：

```go
// /<namespace>/<resource>/<name>
// GET https://10.10.173.203/api/v1/namespaces/default/pods?limit=500
// GET https://10.10.173.203/api/v1/namespaces/kube-system/pods?limit=500
// GET https://10.10.173.203/api/v1/namespaces/kube-system/pods/kube-dns-5b54cf547c-jl4r9
result := restClient.Get().
    Namespace("kube-system").
    Resource("pods").
    Name("kube-dns-5b54cf547c-jl4r9").
    Do()
bytes, err := result.Raw()
if err != nil {
    fmt.Printf("%s: %s\n", err.Error(), bytes)
} else {
    fmt.Printf("%s\n", bytes)
}
```

## client-go/tools

client-go 提供一套 [tools](https://github.com/kubernetes/client-go/tree/master/tools)，提供了配置文件加载、实现本地缓存等方法。

### tools/clientcmd: 加载配置

[tools/clientcmd](https://github.com/kubernetes/client-go/tree/master/tools/clientcmd) 中提供了一些辅助工具，例如加载 kubeconfig 文件生成创建 client 是必须的 Config：

```go
home, err := os.UserHomeDir()
if err != nil {
    glog.Fatal(err.Error())
}

file, err := filepath.Abs(home + "/.kube/config")
if err != nil {
    glog.Fatal(err.Error())
}

config, err := clientcmd.BuildConfigFromFlags("", file)
if err != nil {
    glog.Fatal(err.Error())
    return
}

clientset, err := kubernetes.NewForConfig(config)
if err != nil {
    glog.Fatal(err.Error())
    return
}
```

### tools/cache: 本地缓存

[tools/cache](https://github.com/kubernetes/client-go/tree/master/tools/cache) 中提供了本地缓存的功能，特别是提供了 informer。

创建 informer 需要提供的 listwatcher 和 handler 都用 cache 中方法创建或在 cache 中定义：

```go
labels := make(map[string]string)
selector := fields.SelectorFromSet(labels)
listwatch := cache.NewListWatchFromClient(restClient, "endpoints", "", selector)
```

handler 定义：

```go
handler := cache.ResourceEventHandlerFuncs{
    AddFunc: func(obj interface{}) {
        fmt.Printf("Add endpoint:\n")
        if ep, ok := obj.(*core_v1.Endpoints); !ok {
            fmt.Printf("not endpoints\n")
        } else {
            printEndpoint(ep)
        }
    },
    UpdateFunc: func(oldObj, newObj interface{}) {
        fmt.Printf("Update endpoint:\n")
        if epOld, ok := oldObj.(*core_v1.Endpoints); !ok {
            fmt.Printf("not endpoints\n")
        } else {
            printEndpoint(epOld)
        }

        if epNew, ok := newObj.(*core_v1.Endpoints); !ok {
            fmt.Printf("not endpoints\n")
        } else {
            printEndpoint(epNew)
        }
    },
    DeleteFunc: func(obj interface{}) {
        fmt.Printf("Delete endpoint:\n")
        if ep, ok := obj.(*core_v1.Endpoints); !ok {
            fmt.Printf("not endpoint")
        } else {
            printEndpoint(ep)
        }
    },
}
```

cache.NewInformer() 返回一个 store，一个controller，前者用于查询，后者用于控制同步。

```go
stop := make(chan struct{})
store, controller := cache.NewInformer(listwatch, &core_v1.Endpoints{}, 0*time.Second, handler)
controller.Run(stop)
````

## 参考

1. [kubernetes/client-go][1]
2. [go-code-example/k8sclient][2]
3. [kubernetes/api][3]
4. [kubernetes/apimachinery][4]
5. [client-go/examples/][5]

[1]: https://github.com/kubernetes/client-go  "kubernetes/client-go" 
[2]: https://github.com/introclass/go-code-example/tree/master/k8sclient "go-code-example/k8sclient"
[3]: https://github.com/kubernetes/api "kubernetes/api"
[4]: https://github.com/kubernetes/apimachinery "kubernetes/apimachinery"
[5]: https://github.com/kubernetes/client-go/tree/master/examples "client-go/examples/"
