---
layout: default
title: "Prometheus 采集 Kubernetes 中的 pod 的 metrics 的方法"
author: 李佶澳
date: "2020-04-15T16:15:59+0800"
last_modified_at: "2020-04-21T10:52:27+0800"
categories: 技巧
cover:
tags: prometheus kubernetes
keywords: prometheus,metrics,kubernetes_sd_config
description: 为pod/service配置annotation，prometheus通过annotation采集pod的metrics
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

在 servcie 中配置 annotation，通过 endpoints 发现是一种比较好的方式。

## 设置方法

为 service 配置 annotation：

```sh
annotations:
 prometheus.io/scrape: "true"
 prometheus.io/scheme: "http"
 prometheus.io/path: "/metrics"
 prometheus.io/port: "8888"
```

在 prometheus 中配置 endpoints 发现，通过 [endpoints][3] 发现的 target 会把对应 service、pod 的 annotation 一同带过来，所以下面的配置中可以使用 `__meta_kubernetes_service_annotation...`：

```yaml
- job_name: 'kubernetes-service-endpoints'
  kubernetes_sd_configs:
    - role: endpoints
  relabel_configs:
    # kubernetes 服务单独在 kubernetes-apiservers 中采集
    - action: labelmap
      regex: __meta_kubernetes_service_label_(.+)
    - action: labelmap
      regex: __meta_kubernetes_pod_label_(.+)
    - source_labels: [__meta_kubernetes_namespace]
      action: replace
      target_label: kubernetes_namespace
    - source_labels: [__meta_kubernetes_service_name]
      action: replace
      target_label: kubernetes_service_name
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape] # 如果 prometheus.io/scrape: "true" 则采集
      action: keep
      regex: true
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scheme]
      action: replace
      target_label: __scheme__
      regex: (https?)
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]  # metrics 路径
      action: replace
      target_label: __metrics_path__
      regex: (.+)
    - source_labels: [__address__,__meta_kubernetes_service_annotation_prometheus_io_port] # 采集地址
      action: replace
      target_label: __address__
      regex: (.+)(?::\d+);(\d+)
      replacement: $1:$2
```

然后在 prometheus 的 Service Discovery 和 Targets 中可以发现对应的 pod。

## 参考

1. [李佶澳的博客][1]
2. [Prometheus: kubernetes_sd_config][2]
3. [Prometheus: kubernetes_sd_config: endpoints][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://prometheus.io/docs/prometheus/latest/configuration/configuration/#kubernetes_sd_config "Prometheus: kubernetes_sd_config"
[3]: https://prometheus.io/docs/prometheus/latest/configuration/configuration/#endpoints "Prometheus: kubernetes_sd_config: endpoints"
