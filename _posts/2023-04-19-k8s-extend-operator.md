---
layout: default
title: "kubernetes 扩展：operator 开发"
author: 李佶澳
date: "2023-04-19 16:52:06 +0800"
last_modified_at: "2023-07-07 11:32:11 +0800"
categories: 项目
cover:
tags: kubernetes
keywords:
description: "进行 Operator 开发之前要先了解 CRD 使用，以及了解下 Operator 出现的背景和它要解决的问题"
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

进行 operator 开发之前要先了解 CRD 的使用，以及了解下 operator 出现的背景和它要解决的问题：

* [kubernetes API 与 Operator: 不为人知的开发者战争][3]
* [kubernetes 扩展：CRD 的使用][2]

## Operator 开发框架

从原理上来说，只要能够监听并操作集群中的 CR 就可以开发 operator 了，在 [自动生成的 CRD 代码][2] 基础上直接写 operator 是可行的。但这种方式需要从头实现所有逻辑，而 operator 中有相当一部分逻辑是可以通用的。这些通用部分并且已经被整理成了多种开发框架，比如 [kubernetes controller-runtime project][4] 、[kubebuilder][5]、[operator-framework/operator-sdk][6] 等，使用这些框架可以大幅提高 operator 的开发效率。

## 开发框架：controller-runtime

[kubernetes controller-runtime project][4] 的用法参照 [example-builder][7]。

```sh
mkdir -p crontab/cmd/operator/controller-runtime
go get sigs.k8s.io/controller-runtime@v0.14.6
```

通过 builder 创建一个 controller， For() 指定监听资源类型，Owns() 表示索引的子资源类型。当 Pod 发生变化时，Pod 所属的 ReplicaSet 也会被传入 Reconcile() 中。

```go
package main

import (
    "context"
    "fmt"
    "os"

    appsv1 "k8s.io/api/apps/v1"
    corev1 "k8s.io/api/core/v1"

    "sigs.k8s.io/controller-runtime/pkg/builder"
    "sigs.k8s.io/controller-runtime/pkg/client"
    "sigs.k8s.io/controller-runtime/pkg/client/config"

    logf "sigs.k8s.io/controller-runtime/pkg/log"
    "sigs.k8s.io/controller-runtime/pkg/log/zap"
    "sigs.k8s.io/controller-runtime/pkg/manager"
    "sigs.k8s.io/controller-runtime/pkg/manager/signals"
    "sigs.k8s.io/controller-runtime/pkg/reconcile"
)

func main() {
    logf.SetLogger(zap.New())

    var log = logf.Log.WithName("builder-examples")

    mgr, err := manager.New(config.GetConfigOrDie(), manager.Options{})
    if err != nil {
        log.Error(err, "could not create manager")
        os.Exit(1)
    }

    err = builder.
        ControllerManagedBy(mgr).  // Create the ControllerManagedBy
        For(&appsv1.ReplicaSet{}). // ReplicaSet is the Application API
        Owns(&corev1.Pod{}).       // ReplicaSet owns Pods created by it
        Complete(&ReplicaSetReconciler{})
    if err != nil {
        log.Error(err, "could not create controller")
        os.Exit(1)
    }

    if err := mgr.Start(signals.SetupSignalHandler()); err != nil {
        log.Error(err, "could not start manager")
        os.Exit(1)
    }
}

```

在 Reconcile() 中进行处理，传入的是发生变化的资源名称：

```go
type ReplicaSetReconciler struct {
    client.Client
}

func (a *ReplicaSetReconciler) Reconcile(ctx context.Context, req reconcile.Request) (reconcile.Result, error) {
    fmt.Printf("Reconcile: %s\n", req.String())
    rs := &appsv1.ReplicaSet{}
    err := a.Get(ctx, req.NamespacedName, rs)
    if err != nil {
        return reconcile.Result{}, err
    }

    pods := &corev1.PodList{}
    err = a.List(ctx, pods, client.InNamespace(req.Namespace), client.MatchingLabels(rs.Spec.Template.Labels))
    if err != nil {
        return reconcile.Result{}, err
    }
    fmt.Printf("Reconcile: pod num %v\n", len(pods.Items))

    rs.Labels["pod-count"] = fmt.Sprintf("%v", len(pods.Items))
    err = a.Update(ctx, rs)
    if err != nil {
        return reconcile.Result{}, err
    }

    return reconcile.Result{}, nil
}

func (a *ReplicaSetReconciler) InjectClient(c client.Client) error {
    a.Client = c
    return nil
}
```

## 参考

1. [李佶澳的博客][1]
2. [kubernetes 扩展：CRD 的使用（自定义资源）][2]
3. [kubernetes API 与 Operator: 不为人知的开发者战争][3]
4. [Kubernetes controller-runtime Project][4]
5. [https://github.com/kubernetes-sigs/kubebuilder][5]
6. [operator-framework/operator-sdk][6]
7. [controller-runtime/pkg/builder#example-Builder][7]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: /项目/2023/04/12/k8s-extend-crd.html "kubernetes 扩展：CRD 的使用（自定义资源）"
[3]: /项目/2019/01/08/kubernetes-api-and-operator-history.html "kubernetes API 与 Operator: 不为人知的开发者战争"
[4]: https://github.com/kubernetes-sigs/controller-runtime "Kubernetes controller-runtime Project"
[5]: https://github.com/kubernetes-sigs/kubebuilder "https://github.com/kubernetes-sigs/kubebuilder"
[6]: https://github.com/operator-framework/operator-sdk "operator-framework/operator-sdk"
[7]: https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/builder#example-Builder "controller-runtime/pkg/builder#example-Builder"
