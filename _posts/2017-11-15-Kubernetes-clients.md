---
layout: default
title: kubernetes的Client Libraries的使用
author: 李佶澳
createdate: 2017/11/15 15:37:33
changedate: 2017/11/17 16:18:46
categories: 项目
tags: kubernetes
keywords: kubernetes
description: kubernetes的Client Libraries的使用

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

kubernetes越来越火，希望它会成为一个像linux一样的存在。

## client-go

[client-go][1]是kubernetes官方的项目，go语言实现。

示例源码: [study-k8s-client][2]

获取:

	go get k8s.io/client-go
	go get k8s.io/apimachinery
	go get k8s.io/api
	go get k8s.io/kube-openapi

### 创建Clientset

Clientset是用来与kubernetes集群交互的，通过"k8s.io/client-go/kubernetes"中`NewForConfig()`创建。

例如：

	 config := rest.Config{
	     Host:            "https://10.39.0.105:6443",
	     APIPath:         "/",
	     Prefix:          "",
	     BearerToken:     "af8cbdf725efadf8c4",
	     TLSClientConfig: rest.TLSClientConfig{Insecure: true},
	 }
	 clientset, err := kubernetes.NewForConfig(&config)

"k8s.io/client-go/tools/clientcmd"中提供了一些工具方法，用来生成rest.Config，例如：

	BuildConfigFromFlags(masterUrl, kubeconfigPath string) 
	BuildConfigFromKubeconfigGetter(masterUrl string, kubeconfigGetter KubeconfigGetter) 

### 使用Clientset

Clientset，意如其名，是client的集合，在client-go/kubernetes/clientset.go中定义。

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
## 目录
	    autoscalingV1                 *autoscalingv1.AutoscalingV1Client
## 目录
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

使用的时候不会直接使用Clientset的成员，而是通过调用它的方法来访问kubernetes，例如：

	pods, err := clientset.CoreV1().Pods("you-name-space").List(v1.ListOptions{})

Clientset有以下的方法可供使用：

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

其中Core()和CoreV1()获取到的corev1.CoreV1Interface，用来操作kubernetes的最基础的Resrouce。

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

例如查找指定namespace-lijiaocn中的所有Pod：

	pods, err := clientset.CoreV1().Pods("lijiaocn").List(v1.ListOptions{})

### Resource定义

Resource的定义不在client-go中，而是在一个名为[api][3]的项目中，也就是前面获取的：

	go get k8s.io/api

api的目录结构如下：

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

## 参考

1. [kubernetes/client-go][1]
2. [study-k8s-client][2]
3. [kubernetes/api][3]
4. [kubernetes/apimachinery][4]

[1]: https://github.com/kubernetes/client-go  "kubernetes/client-go" 
[2]: https://github.com/lijiaocn/study-k8s-client "study-k8s-client"
[3]: https://github.com/kubernetes/api "kubernetes/api"
[4]: https://github.com/kubernetes/apimachinery "kubernetes/apimachinery"
