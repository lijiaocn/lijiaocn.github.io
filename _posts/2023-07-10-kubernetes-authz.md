---
layout: default
title: "kubernetes 鉴权：用户操作权限鉴定（Authorization）"
author: 李佶澳
date: "2023-07-10 16:57:32 +0800"
last_modified_at: "2023-07-11 17:17:43 +0800"
categories: 项目
cover:
tags:
tags: kubernetes
description: kubernetes 支持多种鉴权模式，实用的是 RBAC 和 Webhook，Node 和 ABAC 是早期方案局限性较大。详细说明见 [Authorization Overview][2]。

---

## 目录

* auto-gen TOC:
{:toc}

## 说明

kubernetes 支持多种鉴权模式，实用的是 RBAC 和 Webhook，Node 和 ABAC 是早期方案局限性较大。详细说明见 [Authorization Overview][2]。

* AlwaysDeny/AlwaysAllow/Node/ABAC
* RBAC
* Webhook

## ABAC：基于属性权限控制

在 apiserver 启动时传入一个 policy 文件，文件中以用户为单位进行操作授权，一行记录的格式如下（允许 Alice 对所有资源进行操作）：

```json
{
  "apiVersion": "abac.authorization.kubernetes.io/v1beta1",
  "kind": "Policy",
  "spec": {
    "user": "alice",
    "namespace": "*",
    "resource": "*",
    "apiGroup": "*"
  }
}
```

## RBAC

先创建各种 Role，分别赋予不同的权限，然后创建 RoleBinding，在 Role 中添加用户。

具有特定权限的 Role：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: pod-reader
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods"]
  verbs: ["get", "watch", "list"]BAC 模式中
```

在 pod-reader 中添加用户 Jane：

```yaml
apiVersion: rbac.authorization.k8s.io/v1
# This role binding allows "jane" to read pods in the "default" namespace.
# You need to already have a Role named "pod-reader" in that namespace.
kind: RoleBinding
metadata:
  name: read-pods
  namespace: default
subjects:
# You can specify more than one "subject"
- kind: User
  name: jane # "name" is case sensitive
  apiGroup: rbac.authorization.k8s.io
roleRef:
  # "roleRef" specifies the binding to a Role / ClusterRole
  kind: Role #this must be Role or ClusterRole
  name: pod-reader # this must match the name of the Role or ClusterRole you wish to bind to
  apiGroup: rbac.authorization.k8s.io
```

可以加入到 Role 中的除了 User 还有 ServiceGroup、Group：

```yaml
subjects:
- kind: ServiceAccount
  name: default
  namespace: kube-system
```

```yaml
subjects:
- kind: Group
  name: system:serviceaccounts
  apiGroup: rbac.authorization.k8s.io
```

## Webhook Mode

需要鉴权的时候，apiserver 向 webhook 发送 SubjectAccessReview，Webhook 填充 Status 后返回给 apiserver。

apiserver 调用 webhook 发送 SubjectAccessReview：

```json
{
  "apiVersion": "authorization.k8s.io/v1beta1",
  "kind": "SubjectAccessReview",
  "spec": {
    "resourceAttributes": {
      "namespace": "kittensandponies",
      "verb": "get",
      "group": "unicorn.example.org",
      "resource": "pods"
    },
    "user": "jane",
    "group": [
      "group1",
      "group2"
    ]
  }
}
```

webhook 返回填充了 Status 的 SubjectAccessReview，spec 可省略：

```json
{
  "apiVersion": "authorization.k8s.io/v1beta1",
  "kind": "SubjectAccessReview",
  "status": {
    "allowed": true
  }
}
```

## 参考

1. [李佶澳的博客][1]
2. [Authorization Overview][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://kubernetes.io/docs/reference/access-authn-authz/authorization/ "Authorization Overview"
