---
layout: default
title: Kubernetes-rbac
author: lijiaocn
createdate: 2017/10/18 17:05:14
changedate: 2017/10/19 18:35:41
categories:
tags:
keywords:
description: 

---

* auto-gen TOC:
{:toc}

## 说明

kubernetes1.8版本中，rbac特性已经是stable的状态。

## RBAC相关的Resource

	Role:        对Role所在的namspace拥有的权限
	ClusterRole: 对整个集群拥有对权限，不隶属与任何一个namespace
	RoleBinding: 对users、groups、service accounts授予namespace内的权限
	ClusterRoleBinding: 授予在cluster内的权限

### Role

	kind: Role
	apiVersion: rbac.authorization.k8s.io/v1
	metadata:
	  namespace: default
	  name: pod-reader
	rules:
	- apiGroups: [""] # "" indicates the core API group
	  resources: ["pods"]
	  verbs: ["get", "watch", "list"]

### ClusterRole

	kind: ClusterRole
	apiVersion: rbac.authorization.k8s.io/v1
	metadata:
	  # "namespace" omitted since ClusterRoles are not namespaced
	  name: secret-reader
	rules:
	- apiGroups: [""]
	  resources: ["secrets"]
	  verbs: ["get", "watch", "list"]

### RoleBinding

RoleBinding可以索引namespace中的Role。

	# This role binding allows "jane" to read pods in the "default" namespace.
	kind: RoleBinding
	apiVersion: rbac.authorization.k8s.io/v1
	metadata:
	  name: read-pods
	  namespace: default
	subjects:
	- kind: User
	  name: jane
	  apiGroup: rbac.authorization.k8s.io
	roleRef:
	  kind: Role
	  name: pod-reader
	  apiGroup: rbac.authorization.k8s.io

RoleBinding也可以索引ClusterRole，但只授予在namespace的权限:

	# This role binding allows "dave" to read secrets in the "development" namespace.
	kind: RoleBinding
	apiVersion: rbac.authorization.k8s.io/v1
	metadata:
	  name: read-secrets
	  namespace: development # This only grants permissions within the "development" namespace.
	subjects:
	- kind: User
	  name: dave
	  apiGroup: rbac.authorization.k8s.io
	roleRef:
	  kind: ClusterRole
	  name: secret-reader
	  apiGroup: rbac.authorization.k8s.io

### ClusterRoleBinding

	# This cluster role binding allows anyone in the "manager" group to read secrets in any namespace.
	kind: ClusterRoleBinding
	apiVersion: rbac.authorization.k8s.io/v1
	metadata:
	  name: read-secrets-global
	subjects:
	- kind: Group
	  name: manager
	  apiGroup: rbac.authorization.k8s.io
	roleRef:
	  kind: ClusterRole
	  name: secret-reader
	  apiGroup: rbac.authorization.k8s.io

## 授权Rules

### 目标资源

Resource的url格式:

	/api/v1/namespaces/{namespace}/pods/{name}/log

描述目标资源，sub resource用`/`间隔:

	rules:
	- apiGroups: [""]
	  resources: ["pods", "pods/log"]
	  verbs: ["get", "list"] 

指定具体的目标资源:

	rules:
	- apiGroups: [""]
	  resources: ["configmaps"]
	  resourceNames: ["my-configmap"]
	  verbs: ["update", "get"]

### 被授权目标

user、group、serviceaccount:

	subjects:
	- kind: User
	  name: "alice@example.com"
	  apiGroup: rbac.authorization.k8s.io
	
	subjects:
	- kind: Group
	  name: "frontend-admins"
	  apiGroup: rbac.authorization.k8s.io
	
	subjects:
	- kind: ServiceAccount
	  name: default
	  namespace: kube-system

名为`qa`的namespace中的serviceaccount:

	subjects:
	- kind: Group
	  name: system:serviceaccounts:qa
	  apiGroup: rbac.authorization.k8s.io

所有的serviceaccounts:

	subjects:
	- kind: Group
	  name: system:serviceaccounts
	  apiGroup: rbac.authorization.k8s.io

所有的认证通过的用户:

	subjects:
	- kind: Group
	  name: system:authenticated
	  apiGroup: rbac.authorization.k8s.io

所有未认证的用户:

	subjects:
	- kind: Group
	  name: system:unauthenticated
	  apiGroup: rbac.authorization.k8s.io

所有用户:

	subjects:
	- kind: Group
	  name: system:authenticated
	  apiGroup: rbac.authorization.k8s.io
	- kind: Group
	  name: system:unauthenticated
	  apiGroup: rbac.authorization.k8s.io

## 内置的ClusterRole

	$kubectl get clusterrole
	NAME                                                                   AGE
	admin                                                                  2m
	cluster-admin                                                          2m
	edit                                                                   2m
	system:auth-delegator                                                  2m
	system:basic-user                                                      2m
	system:certificates.k8s.io:certificatesigningrequests:nodeclient       2m
	system:certificates.k8s.io:certificatesigningrequests:selfnodeclient   2m
	system:controller:attachdetach-controller                              2m
	system:controller:certificate-controller                               2m
	system:controller:cronjob-controller                                   2m
	system:controller:daemon-set-controller                                2m
	system:controller:deployment-controller                                2m
	system:controller:disruption-controller                                2m
	system:controller:endpoint-controller                                  2m
	system:controller:generic-garbage-collector                            2m
	system:controller:horizontal-pod-autoscaler                            2m
	system:controller:job-controller                                       2m
	system:controller:namespace-controller                                 2m
	system:controller:node-controller                                      2m
	system:controller:persistent-volume-binder                             2m
	system:controller:pod-garbage-collector                                2m
	system:controller:replicaset-controller                                2m
	system:controller:replication-controller                               2m
	system:controller:resourcequota-controller                             2m
	system:controller:route-controller                                     2m
	system:controller:service-account-controller                           2m
	system:controller:service-controller                                   2m
	system:controller:statefulset-controller                               2m
	system:controller:ttl-controller                                       2m
	system:discovery                                                       2m
	system:heapster                                                        2m
	system:kube-aggregator                                                 2m
	system:kube-controller-manager                                         2m
	system:kube-dns                                                        2m
	system:kube-scheduler                                                  2m
	system:node                                                            2m
	system:node-bootstrapper                                               2m
	system:node-problem-detector                                           2m
	system:node-proxier                                                    2m
	system:persistent-volume-provisioner                                   2m
	view                                                                   2m

## 内置的clusterrolebingdings

	$./kubectl.sh get clusterrolebindings
	NAME                                           AGE
	cluster-admin                                  1h
	system:basic-user                              1h
	system:controller:attachdetach-controller      1h
	system:controller:certificate-controller       1h
	system:controller:cronjob-controller           1h
	system:controller:daemon-set-controller        1h
	system:controller:deployment-controller        1h
	system:controller:disruption-controller        1h
	system:controller:endpoint-controller          1h
	system:controller:generic-garbage-collector    1h
	system:controller:horizontal-pod-autoscaler    1h
	system:controller:job-controller               1h
	system:controller:namespace-controller         1h
	system:controller:node-controller              1h
	system:controller:persistent-volume-binder     1h
	system:controller:pod-garbage-collector        1h
	system:controller:replicaset-controller        1h
	system:controller:replication-controller       1h
	system:controller:resourcequota-controller     1h
	system:controller:route-controller             1h
	system:controller:service-account-controller   1h
	system:controller:service-controller           1h
	system:controller:statefulset-controller       1h
	system:controller:ttl-controller               1h
	system:discovery                               1h
	system:kube-controller-manager                 1h
	system:kube-dns                                1h
	system:kube-scheduler                          1h
	system:node                                    1h
	system:node-proxier                            1h

## 参考

1. [kubernetes-rbac][1]

[1]: https://kubernetes.io/docs/admin/authorization/rbac/  "kubernetes-rbac" 
