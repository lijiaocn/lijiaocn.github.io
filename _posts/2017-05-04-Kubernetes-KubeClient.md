---
layout: default
title: Kubernetes的KubeClient实现
author: lijiaocn
createdate: 2017/05/04 15:13:00
changedate: 2017/05/04 16:17:43
categories:
tags: k8s
keywords: kubernetes,k8s,clientset,KubeClient
description: Kubelet等组件与apiserver进行通信，通过KubeClient完成，clientset.Interface约定了KubeClient需要实现的方法。

---

* auto-gen TOC:
{:toc}

Kubelet等组件与apiserver进行通信，通过KubeClient完成，clientset.Interface约定了KubeClient需要实现的方法。

这部分代码已经被拆分出来： k8s.io/client-go/kubernetes/clientset.go

## clientset.Interface

k8s.io/client-go/kubernetes/clientset.go:

	type Interface interface {
		Discovery() discovery.DiscoveryInterface
		CoreV1() corev1.CoreV1Interface
		// Deprecated: please explicitly pick a version if possible.
		Core() corev1.CoreV1Interface
		AppsV1beta1() appsv1beta1.AppsV1beta1Interface
		// Deprecated: please explicitly pick a version if possible.
		Apps() appsv1beta1.AppsV1beta1Interface
		AuthenticationV1() authenticationv1.AuthenticationV1Interface
		// Deprecated: please explicitly pick a version if possible.
		Authentication() authenticationv1.AuthenticationV1Interface
		AuthenticationV1beta1() authenticationv1beta1.AuthenticationV1beta1Interface
		AuthorizationV1() authorizationv1.AuthorizationV1Interface
		// Deprecated: please explicitly pick a version if possible.
		Authorization() authorizationv1.AuthorizationV1Interface
		AuthorizationV1beta1() authorizationv1beta1.AuthorizationV1beta1Interface
		AutoscalingV1() autoscalingv1.AutoscalingV1Interface
		// Deprecated: please explicitly pick a version if possible.
		Autoscaling() autoscalingv1.AutoscalingV1Interface
		AutoscalingV2alpha1() autoscalingv2alpha1.AutoscalingV2alpha1Interface
		BatchV1() batchv1.BatchV1Interface
		// Deprecated: please explicitly pick a version if possible.
		Batch() batchv1.BatchV1Interface
		BatchV2alpha1() batchv2alpha1.BatchV2alpha1Interface
		CertificatesV1beta1() certificatesv1beta1.CertificatesV1beta1Interface
		// Deprecated: please explicitly pick a version if possible.
		Certificates() certificatesv1beta1.CertificatesV1beta1Interface
		ExtensionsV1beta1() extensionsv1beta1.ExtensionsV1beta1Interface
		// Deprecated: please explicitly pick a version if possible.
		Extensions() extensionsv1beta1.ExtensionsV1beta1Interface
		PolicyV1beta1() policyv1beta1.PolicyV1beta1Interface
		// Deprecated: please explicitly pick a version if possible.
		Policy() policyv1beta1.PolicyV1beta1Interface
		RbacV1beta1() rbacv1beta1.RbacV1beta1Interface
		// Deprecated: please explicitly pick a version if possible.
		Rbac() rbacv1beta1.RbacV1beta1Interface
		RbacV1alpha1() rbacv1alpha1.RbacV1alpha1Interface
		SettingsV1alpha1() settingsv1alpha1.SettingsV1alpha1Interface
		// Deprecated: please explicitly pick a version if possible.
		Settings() settingsv1alpha1.SettingsV1alpha1Interface
		StorageV1beta1() storagev1beta1.StorageV1beta1Interface
		StorageV1() storagev1.StorageV1Interface
		// Deprecated: please explicitly pick a version if possible.
		Storage() storagev1.StorageV1Interface
	}

## Clientset

k8s.io/client-go/kubernetes/clientset.go中实现了一个Clientset:

	// Clientset contains the clients for groups. Each group has exactly one
	// version included in a Clientset.
	type Clientset struct {
		*discovery.DiscoveryClient
		*corev1.CoreV1Client
		*appsv1beta1.AppsV1beta1Client
		*authenticationv1.AuthenticationV1Client
		*authenticationv1beta1.AuthenticationV1beta1Client
		*authorizationv1.AuthorizationV1Client
		*authorizationv1beta1.AuthorizationV1beta1Client
		*autoscalingv1.AutoscalingV1Client
		*autoscalingv2alpha1.AutoscalingV2alpha1Client
		*batchv1.BatchV1Client
		*batchv2alpha1.BatchV2alpha1Client
		*certificatesv1beta1.CertificatesV1beta1Client
		*extensionsv1beta1.ExtensionsV1beta1Client
		*policyv1beta1.PolicyV1beta1Client
		*rbacv1beta1.RbacV1beta1Client
		*rbacv1alpha1.RbacV1alpha1Client
		*settingsv1alpha1.SettingsV1alpha1Client
		*storagev1beta1.StorageV1beta1Client
		*storagev1.StorageV1Client
	}

## 创建Clientset

k8s.io/client-go/kubernetes/clientset.go:

	+New(c rest.Interface) : *Clientset
	+NewForConfig(c *rest.Config) : *Clientset, error
	+NewForConfigOrDie(c *rest.Config) : *Clientset

关键是传入参数：

k8s.io/client-go/rest/client.go:

	type Interface interface {
		GetRateLimiter() flowcontrol.RateLimiter
		Verb(verb string) *Request
		Post() *Request
		Put() *Request
		Patch(pt types.PatchType) *Request
		Get() *Request
		Delete() *Request
		APIVersion() schema.GroupVersion
	}

k8s.io/client-go/rest/config.go:

	type Config struct {
		Host string
		APIPath string
		Prefix string
		ContentConfig
		Username string
		Password string
		BearerToken string
		Impersonate ImpersonationConfig
		AuthProvider *clientcmdapi.AuthProviderConfig
		AuthConfigPersister AuthProviderConfigPersister
		TLSClientConfig
		UserAgent string
		Transport http.RoundTripper
		WrapTransport func(rt http.RoundTripper) http.RoundTripper
		QPS float32
		Burst int
		RateLimiter flowcontrol.RateLimiter
		Timeout time.Duration
	}

## corev1.CoreV1Client

ClientSet其实是由多个Client组合成的，这里只分析corev1.CoreV1Client

k8s.io/client-go/kubernetes/clientset.go, NewForConfig():

	cs.CoreV1Client, err = corev1.NewForConfig(&configShallowCopy)
	if err != nil {
		return nil, err
	}

k8s.io/client-go/kubernetes/typed/core/v1/core_client.go，由restClient和一堆的方法组成:

	-+CoreV1Client : struct
	    [fields]
	   -restClient : rest.Interface
	    [methods]
	   +ComponentStatuses() : ComponentStatusInterface
	   +ConfigMaps(namespace string) : ConfigMapInterface
	   +Endpoints(namespace string) : EndpointsInterface
	   +Events(namespace string) : EventInterface
	   +LimitRanges(namespace string) : LimitRangeInterface
	   +Namespaces() : NamespaceInterface
	   +Nodes() : NodeInterface
	   +PersistentVolumeClaims(namespace string) : PersistentVolumeClaimInterface
	   +PersistentVolumes() : PersistentVolumeInterface
	   +PodTemplates(namespace string) : PodTemplateInterface
	   +Pods(namespace string) : PodInterface
	   +RESTClient() : rest.Interface
	   +ReplicationControllers(namespace string) : ReplicationControllerInterface
	   +ResourceQuotas(namespace string) : ResourceQuotaInterface
	   +Secrets(namespace string) : SecretInterface
	   +ServiceAccounts(namespace string) : ServiceAccountInterface
	   +Services(namespace string) : ServiceInterface
	    [functions]
	   +New(c rest.Interface) : *CoreV1Client
	   +NewForConfig(c *rest.Config) : *CoreV1Client, error
	   +NewForConfigOrDie(c *rest.Config) : *CoreV1Client

k8s.io/client-go/kubernetes/typed/core/v1/core_client.go，创建:

	func NewForConfig(c *rest.Config) (*CoreV1Client, error) {
		config := *c
		if err := setConfigDefaults(&config); err != nil {
			return nil, err
		}
		client, err := rest.RESTClientFor(&config)
		if err != nil {
			return nil, err
		}
		return &CoreV1Client{client}, nil
	}

k8s.io/client-go/rest/config.go, RESTClientFor():

	func RESTClientFor(config *Config) (*RESTClient, error) {
		
		...
		
		baseURL, versionedAPIPath, err := defaultServerUrlFor(config)
		if err != nil {
			return nil, err
		}
		
		transport, err := TransportFor(config)
		if err != nil {
			return nil, err
		}
		
		var httpClient *http.Client
		if transport != http.DefaultTransport {
			httpClient = &http.Client{Transport: transport}
			if config.Timeout > 0 {
				httpClient.Timeout = config.Timeout
			}
		}
		
		return NewRESTClient(baseURL, versionedAPIPath, config.ContentConfig, qps, burst, config.RateLimiter, httpClient)
	}

NewRESTClient中创建了最终的RESTClient。


## RESTClient

k8s.io/client-go/rest/client.go:

	-+RESTClient : struct
	    [fields]
	   +Client : *http.Client
	   +Throttle : flowcontrol.RateLimiter
	   -base : *url.URL
	   -contentConfig : ContentConfig
	   -createBackoffMgr : func() BackoffManager
	   -serializers : Serializers
	   -versionedAPIPath : string
	    [methods]
	   +APIVersion() : schema.GroupVersion
	   +Delete() : *Request
	   +Get() : *Request
	   +GetRateLimiter() : flowcontrol.RateLimiter
	   +Patch(pt types.PatchType) : *Request
	   +Post() : *Request
	   +Put() : *Request
	   +Verb(verb string) : *Request
	    [functions]
	   +NewRESTClient(baseURL *url.URL, versionedAPIPath string, config ContentConfig, maxQPS float32, maxBurst int, rateLimiter flowcontrol.RateLimiter, client *http.Client) : *RESTClient, error

## RESTClient使用

首先使用Verb()，或者GET()、Post()等（最终调用的还是Verb())，得到一个Request，然后调用这个Request方法添加查询条件，最后调用Do()，得到Result。

k8s.io/client-go/rest/client.go:

	// Verb begins a request with a verb (GET, POST, PUT, DELETE).
	//
	// Example usage of RESTClient's request building interface:
	// c, err := NewRESTClient(...)
	// if err != nil { ... }
	// resp, err := c.Verb("GET").
	//  Path("pods").
	//  SelectorParam("labels", "area=staging").
	//  Timeout(10*time.Second).
	//  Do()
	// if err != nil { ... }
	// list, ok := resp.(*api.PodList)
	//

k8s.io/client-go/rest/request.go:

	type Request struct {
		// required
		client HTTPClient
		verb   string

		baseURL     *url.URL
		content     ContentConfig
		serializers Serializers
		
		...
	
	// Result contains the result of calling Request.Do().
	type Result struct {
		body        []byte
		contentType string
		err         error
		statusCode  int

		decoder runtime.Decoder
	}

## 示例，kubelet查询pod

k8s.io/kubernetes/pkg/kubelet/config/apiserver.go:

	func NewSourceApiserver(c clientset.Interface, nodeName types.NodeName, updates chan<- interface{}) {
		lw := cache.NewListWatchFromClient(c.Core().RESTClient(), "pods", metav1.NamespaceAll, fields.OneTermEqualSelector(api.PodHostField, string(nodeName)))
		newSourceApiserverFromLW(lw, updates)
	}

k8s.io/client-go/tools/cache/listwatch.go:

	// NewListWatchFromClient creates a new ListWatch from the specified client, resource, namespace and field selector.
	func NewListWatchFromClient(c Getter, resource string, namespace string, fieldSelector fields.Selector) *ListWatch {
		listFunc := func(options metav1.ListOptions) (runtime.Object, error) {
			return c.Get().
				Namespace(namespace).
				Resource(resource).
				VersionedParams(&options, metav1.ParameterCodec).
				FieldsSelectorParam(fieldSelector).
				Do().
				Get()
		}
		watchFunc := func(options metav1.ListOptions) (watch.Interface, error) {
			options.Watch = true
			return c.Get().
				Namespace(namespace).
				Resource(resource).
				VersionedParams(&options, metav1.ParameterCodec).
				FieldsSelectorParam(fieldSelector).
				Watch()
		}
		return &ListWatch{ListFunc: listFunc, WatchFunc: watchFunc}
	}
