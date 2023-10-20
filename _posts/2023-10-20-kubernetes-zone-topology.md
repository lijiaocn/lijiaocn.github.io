---
layout: default
title: "kubernetes 使用：多可用区、Pod 部署拓扑与 Topology Aware Routing"
author: 李佶澳
date: "2023-10-20 15:33:09 +0800"
last_modified_at: "2023-10-20 17:12:57 +0800"
categories: 项目
cover:
tags: kubernetes
keywords:
description: 把分布在不同可用区中的 node 纳入到一个 kubernetes 集群，意味着操作其中的负载时需要考虑可用区的影响。比如 pod 如何在多个可用区之间分布，对 service 的请求会不会跨可用区传输。
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

把分布在不同可用区中的 node 纳入到一个 kubernetes 集群，意味着操作其中的负载时需要考虑可用区的影响。
比如 pod 如何在多个可用区之间分布，对 service 的请求会不会跨可用区传输。

[Running in multiple zones][2] 概括了包含多个可用区时需要考虑的问题以及解决方法：

1. 控制组件在多个可用区中部署副本
2. 在 node 上设置标识所属可用区的标签
3. 在 pod 定义中增加 topologySpreadConstraints，影响 pod 的调度
4. 启用名为 PersistentVolumeLabel 的 admission controller，为 PV 添加可用区 label
6. 将 storageClass 设置为 WaitForFirstConsumer，或者在定义中增加 allowedTopologies，限定可用区
7. 在 endpointSlice 注入可用区信息，影响 kube-proxy 的转发规则设置

整套方案在不冲击 kubernetes 整体架构的情况下增加了对可用区的支持，设计的比较巧妙，虽然不怎么强大。

## node 和 pv 的可用区标签设置

kubernetes 对用来标识可用区的 label 名称并没有约束，只需要在单个集群内保持统一。比较常用的标签名是：[topology.kubernetes.io/zone][3]。
kubernetes 不自动设置 node 和 pv 的可用区标签。node 可用区标签需要人为在 kubelet 中设置或者通过 cloud-controller-manager 设置。

## pod 跨可用区部署拓扑

topologySpreadConstraints 影响的是新增的 pod 被调度到 node 过程，实现 pod 在不同可用区中的数量平衡。具体用法见：[Pod Topology Spread Constraints][4]。

## pod 避免跨可用区挂载存储

通过在 pv 上设置可用区标签来避免 pod 挂载了其它可用区的存储。用 [persistentvolumelabel][6] 从 cloud provider 获取到可用区信息然后设置标签的做法已经不建议使用，建议用 cloud-controller-manager。

storagte-class 可以限定 [allowed-topologies][7]，主要还是通过设置 WaitForFirstConsumer 模式，在可用区已知的时候进行 pv 创建。

## Topology Aware Routing

为了避免访问 service 的请求被转发到另外的可用区，可以启用 [Topology Aware Routing][5]，kube-proxy 以及 dns 组件都需要开启。

## 参考

1. [李佶澳的博客][1]
2. [Running in multiple zones][2]
3. [topology.kubernetes.io/zone][3]
4. [Pod Topology Spread Constraints][4]
5. [Topology Aware Routing][5]
6. [admission-controllers/#persistentvolumelabel][6]
7. [storage-classes/#allowed-topologies][7]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://kubernetes.io/docs/setup/best-practices/multiple-zones/ "Running in multiple zones"
[3]: https://kubernetes.io/docs/reference/labels-annotations-taints/#topologykubernetesiozone "topology.kubernetes.io/zone"
[4]: https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/ "Pod Topology Spread Constraints"
[5]: https://kubernetes.io/docs/concepts/services-networking/topology-aware-routing/ "Topology Aware Routing"
[6]: https://kubernetes.io/docs/reference/access-authn-authz/admission-controllers/#persistentvolumelabel "admission-controllers/#persistentvolumelabel"
[7]: https://kubernetes.io/docs/concepts/storage/storage-classes/#allowed-topologies "storage-classes/#allowed-topologies"
