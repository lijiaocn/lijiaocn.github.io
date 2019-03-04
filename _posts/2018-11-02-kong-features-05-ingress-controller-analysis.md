---
layout: default
title:  "API网关Kong学习笔记（八）：Kong Ingress Controller的实现"
author: 李佶澳
createdate: "2018-11-05 10:52:44 +0800"
changedate: "2019-03-04 14:34:35 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关,code,代码分析
description: Ingress Controller可以将Kong与Kubernetes无缝集成，自动将kubernetes中的操作同步到kong中
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的学习笔记](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

[Kong Ingress Controller][1]可以将Kong与Kubernetes无缝集成，自动将kubernetes中的操作同步到kong中。
[API网关Kong（二）：Kong与Kubernetes集成的方法][2]有过介绍，这里做代码级别的了解，部署与使用方法参考[API网关Kong（二）：Kong与Kubernetes集成的方法][2]。

**相关笔记**，这些笔记是学习过程中做的记录，写的比较仓促，有疑惑的地方以Kong官方文档为准：

[《API网关Kong学习笔记（零）：使用过程中遇到的问题以及解决方法》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/29/kong-usage-problem-and-solution.html)

[《API网关Kong学习笔记（一）：Nginx、OpenResty和Kong的基本概念与使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html)

[《API网关Kong学习笔记（二）：Kong与Kubernetes集成的方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html)

[《API网关Kong学习笔记（三）：功能梳理和插件使用-基本使用过程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-00-basic.html)

[《API网关Kong学习笔记（四）：功能梳理和插件使用-认证插件使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-01-auth.html)

[《API网关Kong学习笔记（五）：功能梳理和插件使用-安全插件使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-02-security.html)

[《API网关Kong学习笔记（六）：Kong数据平面的事件、初始化与插件加载》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html)

[《API网关Kong学习笔记（七）：Kong数据平面Plugin的调用与实现》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html)

[《API网关Kong学习笔记（八）：Kong Ingress Controller的实现》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/02/kong-features-05-ingress-controller-analysis.html)

[《API网关Kong学习笔记（九）：Kong对WebSocket的支持》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/06/kong-features-06-websocket.html)

[《API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/08/kong-features-06-production-and-benchmark.html)

[《API网关Kong学习笔记（十一）：自己动手写一个插件》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/09/kong-features-07-write-plugins.html)

[《API网关Kong学习笔记（十二）：插件的目录中schema分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-08-plugin-schema.html)

[《API网关Kong学习笔记（十三）：向数据库中插入记录的过程分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-09-database-insert.html)

[《API网关Kong学习笔记（十四）：Kong的Admin API概览和使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/19/kong-features-10-apis.html)

[《API网关Kong学习笔记（十五）：KongIngress的定义细节》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-11-kong-ingress-definition.html)

[《API网关Kong学习笔记（十六）：Kong转发请求的工作过程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-16-work-process.html)

[《API网关Kong学习笔记（十七）：Kong Ingress Controller的使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/21/kong-features-17-kong-ingress-controller-run.html)

[《API网关Kong学习笔记（十八）：Kong Ingress Controller的CRD详细说明》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/30/kong-features-18-kong-ingress-controller-crd.html)

[《API网关Kong学习笔记（十九）：Kong的性能测试（与Nginx对比）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/03/kong-features-19-kong-performance.html)

## CustomResourceDefinitions

[API网关Kong（二）：Kong与Kubernetes集成的方法: CustomResourceDefinitions][3]中介绍了Kong Ingress Controller在Kubernetes中定义的CRD。

这些CRD中的记录需要被同步到Kong中，Kong Ingress Controller监督这些CRD以及Kubernetes集群中的其它相关资源，发现变化后，及时将其同步。

## 代码编译

[Kong kubernetes ingress controller][1]使用dep管理依赖包，将代码下载之后，先用下面的命令导入依赖包：

	make deps

然后编译：

	make build

## 程序启动

主流程在ngx中实现，ngx中包含两个client，一个是访问kubernetes的kubeClient，一个是访问kong的kongClient。

	//kubernetes-ingress-controller/cli/ingress-controller/main.go
	func main() {
	...
	    conf.KubeClient = kubeClient
	    conf.KubeConf = kubeCfg
	    conf.Kong.Client = kongClient
	
	    ngx := controller.NewNGINXController(conf, fs)
	    ...
	    ngx.Start()
	...

## 监听Kubernetes中的资源

ngx中有一个`store`成员：

```go
//kubernetes-ingress-controller/internal/ingress/controller/run.go
func NewNGINXController(config *Configuration, fs file.Filesystem) *NGINXController {
...
	n.store = store.New(
		config.EnableSSLChainCompletion,
		config.Namespace,
		"",
		"",
		"",
		"",
		config.ResyncPeriod,
		config.KubeClient,
		config.KubeConf,
		fs,
		n.updateCh)
...
```

n.store中存放的是kubernetes的client-go实现的`informer`，当kubernetes中的资源发生变化时，注册到informer中的`handler`会被调用：

```go
//kubernetes-ingress-controller/internal/ingress/controller/store/store.go
func New(checkOCSP bool,
	...
	store := &k8sStore{
		isOCSPCheckEnabled: checkOCSP,
		informers:          &Informer{},
		listers:            &Lister{},
		sslStore:           NewSSLCertTracker(),
		filesystem:         fs,
		updateCh:           updateCh,
		mu:                 &sync.Mutex{},
		secretIngressMap:   NewObjectRefMap(),
	}
	...
	ingEventHandler := cache.ResourceEventHandlerFuncs{
	AddFunc: func(obj interface{}) {
		ing := obj.(*extensions.Ingress)
		...
		recorder.Eventf(ing, corev1.EventTypeNormal, "CREATE", fmt.Sprintf("Ingress %s/%s", ing.Namespace, ing.Name))
		store.updateSecretIngressMap(ing)
		store.syncSecrets(ing)
		updateCh.In() <- Event{
			Type: CreateEvent,
			Obj:  obj,
		}
	},
	...
	store.informers.Ingress.AddEventHandler(ingEventHandler)
	...
```

一共有5个Handler：

```go
//kubernetes-ingress-controller/internal/ingress/controller/store/store.go
func New(checkOCSP bool,
...
ingEventHandler := cache.ResourceEventHandlerFuncs{
	AddFunc: func(obj interface{}) {
		ing := obj.(*extensions.Ingress)
	...
secrEventHandler := cache.ResourceEventHandlerFuncs{
	AddFunc: func(obj interface{}) {
		sec := obj.(*corev1.Secret)
	...
epEventHandler := cache.ResourceEventHandlerFuncs{
	AddFunc: func(obj interface{}) {
		updateCh.In() <- Event{
			Type: CreateEvent,
			Obj:  obj,
		}
	},
	...
serviceEventHandler := cache.ResourceEventHandlerFuncs{
	UpdateFunc: func(old, cur interface{}) {
		updateCh.In() <- Event{
			Type: ConfigurationEvent,
			Obj:  cur,
		}
	},
	...
crdEventHandler := cache.ResourceEventHandlerFuncs{
	AddFunc: func(obj interface{}) {
		updateCh.In() <- Event{
			Type: ConfigurationEvent,
			Obj:  obj,
		}
	},
	...
```

这5个Handler被注册到8个informer中，分别监听kubernetes中的ingress、endpoint、secret、service、kong plugin、kong consumer、kong credential、kong configuration：

```go
//kubernetes-ingress-controller/internal/ingress/controller/store/store.go
func New(checkOCSP bool,
...
store.informers.Ingress.AddEventHandler(ingEventHandler)
store.informers.Endpoint.AddEventHandler(epEventHandler)
store.informers.Secret.AddEventHandler(secrEventHandler)
store.informers.Service.AddEventHandler(serviceEventHandler)
store.informers.Kong.Plugin.AddEventHandler(crdEventHandler)
store.informers.Kong.Consumer.AddEventHandler(crdEventHandler)
store.informers.Kong.Credential.AddEventHandler(crdEventHandler)
store.informers.Kong.Configuration.AddEventHandler(crdEventHandler)
```

需要注意的CRD的的监听方式，就是Kong.Plugin，Kong.Consumer，Kong.Credential，Kong.Configuration，它们不是Kubernetes中的原生类型。

```go
//kubernetes-ingress-controller/internal/ingress/controller/store/store.go
func New(checkOCSP bool,
...

pluginClient, _ := pluginclientv1.NewForConfig(clientConf)
pluginFactory := plugininformer.NewFilteredSharedInformerFactory(pluginClient, resyncPeriod, namespace, func(*metav1.ListOptions) {})

store.informers.Kong.Plugin = pluginFactory.Configuration().V1().KongPlugins().Informer()
store.listers.Kong.Plugin = store.informers.Kong.Plugin.GetStore()
store.informers.Kong.Plugin.AddEventHandler(crdEventHandler)
```

它们对应的informer实现略复杂一些，是通过封装Kubernetes的REST Client实现的，后面单独分析。

其它的informer是直接调用client-go的方法创建的)：

```go
infFactory := informers.NewFilteredSharedInformerFactory(client, resyncPeriod, namespace, func(*metav1.ListOptions) {})
store.informers.Ingress = infFactory.Extensions().V1beta1().Ingresses().Informer()
```

### CRD informer的实现

CRD的informer是通过封装Kubernetes的REST Client实现的：

```go
//kubernetes-ingress-controller/internal/ingress/controller/store/store.go
func New(checkOCSP bool,
...
pluginClient, _ := pluginclientv1.NewForConfig(clientConf)
pluginFactory := plugininformer.NewFilteredSharedInformerFactory(pluginClient, resyncPeriod, namespace, func(*metav1.ListOptions) {})

store.informers.Kong.Plugin = pluginFactory.Configuration().V1().KongPlugins().Informer()
...
```

`pluginclientv1.NewForConfig()`封装了client-go中的原生REST：

```go
//kubernetes-ingress-controller/internal/client/plugin/clientset/versioned/clientset.go
func NewForConfig(c *rest.Config) (*Clientset, error) {
	...
	var cs Clientset
	cs.configurationV1, err = configurationv1.NewForConfig(&configShallowCopy)
	...
	cs.DiscoveryClient, err = discovery.NewDiscoveryClientForConfig(&configShallowCopy)
```

可以看到创建了`cs.configurationV1`和`cs.DiscoveryClient`两个client。

cs.DiscoveryClient是调用client-go的接口创建，没有特别之处，重点是cs.configurationV1。

`cs.configurationV1`的实现如下：

```go
//kubernetes-ingress-controller/internal/client/plugin/clientset/versioned/typed/plugin/v1/plugin_client.go
func NewForConfig(c *rest.Config) (*ConfigurationV1Client, error) {
	config := *c
	if err := setConfigDefaults(&config); err != nil {
		return nil, err
	}
	client, err := rest.RESTClientFor(&config)
	if err != nil {
		return nil, err
	}
	return &ConfigurationV1Client{client}, nil
}
```

关键是`setConfigDefaults(&config)`中，设置了config：

```go
//kubernetes-ingress-controller/internal/client/plugin/clientset/versioned/typed/plugin/v1/plugin_client.go
func setConfigDefaults(config *rest.Config) error {
	gv := v1.SchemeGroupVersion
	config.GroupVersion = &gv
	config.APIPath = "/apis"
	config.NegotiatedSerializer = serializer.DirectCodecFactory{CodecFactory: scheme.Codecs}
	if config.UserAgent == "" {
		config.UserAgent = rest.DefaultKubernetesUserAgent()
	}
	return nil
}
```

config.GroupVersion的值为：

	config.GroupVersion -- > gv --> &v1.SchemeGroupVersion

继续追究v1.SchemeGroupVersion，发现它包含了CRD的Group名称和版本：

```go
//kubernetes-ingress-controller/internal/apis/plugin/v1/register.go
var SchemeGroupVersion = info.SchemeGroupVersion

//kubernetes-ingress-controller/internal/apis/group/info.go
var GroupName = "configuration.konghq.com"
var SchemeGroupVersion = schema.GroupVersion{Group: GroupName, Version: "v1"}
```

这个GroupName和Version是与CRD定义中的字段对应的：

```yaml
apiVersion: apiextensions.k8s.io/v1beta1
kind: CustomResourceDefinition
metadata:
  name: kongconsumers.configuration.konghq.com
spec:
  group: configuration.konghq.com
  version: v1
  scope: Namespaced
  names:
    kind: KongConsumer
    plural: kongconsumers
    shortNames:
    - kc
```

## 配置更新 

上一节注册的Handler函数中，最后都会向`updateCh`中写入事件：

```go
//kubernetes-ingress-controller/internal/ingress/controller/store/store.go
func New(checkOCSP bool,
	...
	updateCh *channels.RingChannel) Storer {
	...
	ingEventHandler := cache.ResourceEventHandlerFuncs{
	AddFunc: func(obj interface{}) {
		ing := obj.(*extensions.Ingress)
		...
		updateCh.In() <- Event{
			Type: CreateEvent,
			Obj:  obj,
		}
	},
	...
```

这个updateCh和ngx.updateCh是同一个，创建n.store的时候传入的：

```go
//kubernetes-ingress-controller/internal/ingress/controller/run.go
func NewNGINXController(config *Configuration, fs file.Filesystem) *NGINXController {
...
	n := &NGINXController{
		...
		}
	n.store = store.New( config.EnableSSLChainCompletion,
			config.Namespace,
			"",
			"",
			"",
			"",
			config.ResyncPeriod,
			config.KubeClient,
			config.KubeConf,
			fs,
			n.updateCh)
...
```

ngx调用Start()启动之后，每从updateCh中收到一个事件，就向任务队列中添加一个任务：

```go
//kubernetes-ingress-controller/internal/ingress/controller/run.go
func (n *NGINXController) Start() {
	glog.Infof("starting Ingress controller")
	...
	n.store.Run(n.stopCh)
	...
	go n.syncQueue.Run(time.Second, n.stopCh)
	// force initial sync
	n.syncQueue.Enqueue(&extensions.Ingress{})
	for {
		select {
		...
		case event := <-n.updateCh.Out():
			...
			if evt, ok := event.(store.Event); ok {
				...
				n.syncQueue.Enqueue(evt.Obj)
			...
		case <-n.stopCh:
			break
		}
	}
```

## 任务队列的创建

任务队列也是在创建ngx的时候创建的：

```go
//kubernetes-ingress-controller/internal/ingress/controller/run.go
func NewNGINXController(config *Configuration, fs file.Filesystem) *NGINXController {
...
	n.syncQueue = task.NewTaskQueue(n.syncIngress)
```

`n.syncIngress(interface{}))`传入参数是通过`event.Obj`生成的字符串key，分析`kubernetes-ingress-controller/internal/task/queue.go`中queue的实现可以知晓。

n.syncIngress()是输入参数它的用途是将配置信息同步到kong中，当队列中有事件时，被触发执行，并不关心具体是什么事件。


## n.syncIngress()

n.syncIngress()的实现分为两步，第一步从n.store中读取ings信息，第二步是将信息传递给n.OnUpdate()

```go
//kubernetes-ingress-controller/internal/ingress/controller/controller.go:
func (n *NGINXController) syncIngress(interface{}) error {
	...
	ings := n.store.ListIngresses()
	...
	upstreams, servers := n.getBackendServers(ings)
	pcfg := ingress.Configuration{
		Backends: upstreams,
		Servers:  servers,
	}
	err := n.OnUpdate(&pcfg)
	n.runningConfig = &pcfg
	...
```

>注意当前syncIngress(0.2.0版本)的实现中，无论输入参数是什么，都进行全局更新，这可能是一个隐患，需要改成根据输入参数进行部分更新。

### ings

ings是存放在n.store中的，n.store.ListIngresses()使用的是通过client-go创建的informer，以及store

```go
//kubernetes-ingress-controller/internal/ingress/controller/store/store.go
func (s k8sStore) ListIngresses() []*extensions.Ingress {
	...
	var ingresses []*extensions.Ingress
	for _, item := range s.listers.Ingress.List() {
		ing := item.(*extensions.Ingress)
		...
		ingresses = append(ingresses, ing)
	}
	
	return ingresses
}

//kubernetes-ingress-controller/internal/ingress/controller/store/store.go
func New(checkOCSP bool,
...
	infFactory := informers.NewFilteredSharedInformerFactory(client, resyncPeriod, namespace, func(*metav1.ListOptions) {})

	store.informers.Ingress = infFactory.Extensions().V1beta1().Ingresses().Informer()
	store.listers.Ingress.Store = store.informers.Ingress.GetStore()
...
```

因此查询出来的ings就是kubernetes中标准的ingress：

```go
//k8s.io/api/extentions/v1beta1/types.go
type Ingress struct {
	metav1.TypeMeta 
	metav1.ObjectMeta 
	
	Spec IngressSpec 
	//这里直接嵌套IngressSpec的定义，这不是Go的语法，只是方便查看，下同
	type IngressSpec struct {
		//默认Backend，至少需要一个Backend或者一个Rule
		Backend *IngressBackend 
		
		TLS []IngressTLS 
			type IngressTLS struct {
				//证书绑定的hostname
				Hosts []string 
				//证书
				SecretName string 
			}
			
		Rules []IngressRule 
			type IngressRule struct {
				Host string 
				IngressRuleValue 
				type IngressRuleValue struct {
					HTTP *HTTPIngressRuleValue 
					type HTTPIngressRuleValue struct {
						Paths []HTTPIngressPath 
						type HTTPIngressPath struct {
							Path string 
							Backend IngressBackend 
								type IngressBackend struct {
									ServiceName string 
									ServicePort intstr.IntOrString 
								}
						}
					}
				}
			}
	}
	Status IngressStatus 
}
```

通过遍历所有的ingress，得到server和backend列表：

```go
//kubernetes-ingress-controller/internal/ingress/controller/controller.go:
func (n *NGINXController) syncIngress(interface{}) error {
	...
	upstreams, servers := n.getBackendServers(ings)
	...
	pcfg := ingress.Configuration{
		Backends: upstreams,
		Servers:  servers,
	}
	err := n.OnUpdate(&pcfg)
	...
```

通过函数`n.OnUpdate()`进行更新：

```go
//kubernetes-ingress-controller/internal/ingress/controller/controller.go:
func (n *NGINXController) syncIngress(interface{}) error {
	...
	err := n.syncCertificates(ingressCfg.Servers)
	for _, server := range ingressCfg.Servers {
		...
		err := n.syncUpstreams(server.Locations, ingressCfg.Backends)
		...
	}
	err = n.syncConsumers()
	...
	err = n.syncCredentials()
	...
	err = n.syncGlobalPlugins()
	...
	checkServices, err := n.syncServices(ingressCfg)
	...
	checkRoutes, err := n.syncRoutes(ingressCfg)
	...
```

## 参考

1. [Github: Kong kubernetes ingress controller][1]
2. [API网关Kong（二）：Kong与Kubernetes集成的方法][2]
3. [API网关Kong（二）：Kong与Kubernetes集成的方法: CustomResourceDefinitions][3]

[1]: https://github.com/Kong/kubernetes-ingress-controller "Github: Kong kubernetes ingress controller"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html "API网关Kong（二）：Kong与Kubernetes集成的方法"
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html#customresourcedefinitions "API网关Kong（二）：Kong与Kubernetes集成的方法: CustomResourceDefinitions"
