---
layout: default
title: kubernetes的Pod内挂载的Service Account的使用方法
author: 李佶澳
createdate: 2017/04/26 17:32:58
changedate: 2017/04/27 13:23:49
categories: 项目
tags: kubernetes
keywords: kubernetes,安全性
description: kubernetes的安全方面的考虑，例如访问控制，从容器内访问apiserver等。

---

## 目录
* auto-gen TOC:
{:toc}

## 从容器内访问apiserver 

kubernetes内置了一个名为kuberntes的service，这个service就是kubernetes的api服务。

从容器中可以访问这个地址，容器要对kuberntes的具有的操作权限：

	$kubectl get service
	NAME         CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE
	kubernetes   10.0.0.1     <none>        443/TCP   29d

在容器里可以看到这个地址:

	$curl https://10.0.0.1:443 --cacert /run/secrets/kubernetes.io/serviceaccount/ca.crt
	Unauthorized

准备一个curl.sh文件，内容如下:

	token=`cat /run/secrets/kubernetes.io/serviceaccount/token`
	curl https://10.0.0.1:443 --cacert /run/secrets/kubernetes.io/serviceaccount/ca.crt -H "Authorization: Bearer $token"

运行后，可以看到，使用token可以访问apiserver: 

	$./curl.sh
	{
	  "paths": [
	    "/api",
	    "/api/v1",
	    "/apis",
	    "/apis/apps",
	    "/apis/apps/v1alpha1",
	    "/apis/authentication.k8s.io",
	    "/apis/authentication.k8s.io/v1beta1",
	    "/apis/authorization.k8s.io",
	    "/apis/authorization.k8s.io/v1beta1",
	    "/apis/autoscaling",
	    "/apis/autoscaling/v1",
	    "/apis/batch",
	    "/apis/batch/v1",
	    "/apis/batch/v2alpha1",
	    "/apis/certificates.k8s.io",
	    "/apis/certificates.k8s.io/v1alpha1",
	    "/apis/extensions",
	    "/apis/extensions/v1beta1",
	    "/apis/policy",
	    "/apis/policy/v1alpha1",
	    "/apis/rbac.authorization.k8s.io",
	    "/apis/rbac.authorization.k8s.io/v1alpha1",
	    "/apis/storage.k8s.io",
	    "/apis/storage.k8s.io/v1beta1",
	    "/healthz",
	    "/healthz/ping",
	    "/logs",
	    "/metrics",
	    "/swaggerapi/",
	    "/ui/",
	    "/version"
	  ]
	}

在容器设置了环境变量后，就可以通过上传到容器内部的kubectl直接操作集群了:

	export KUBERNETES_SERVICE_HOST=10.0.0.1
	export KUBERNETES_SERVICE_PORT=443

kubectl运行时会自动加载容器里的token:

	//   However, if it appears that we're running in a kubernetes cluster
	//   container environment, then run with the auth info kubernetes mounted for
	//   us. Specifically:
	//     The env vars KUBERNETES_SERVICE_HOST and KUBERNETES_SERVICE_PORT are
	//     set, and the file /var/run/secrets/kubernetes.io/serviceaccount/token
	//     exists and is not a directory.

[docker-kubectl][1]已经内置了kubectl，可以直接使用，服务地址可以从env.init中找到。

## 参考

1. [docker-kubectl][1]

[1]: docker-kubectl "https://github.com/lijiaocn/docker-kubectl"
