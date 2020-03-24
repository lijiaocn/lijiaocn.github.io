---
layout: default
title: "Prometheus 水平扩展方案（三）：Prometheus 与 Victoria Metrics 的 API"
author: 李佶澳
date: "2020-03-02T11:19:29+0800"
last_modified_at: "2020-03-02T11:19:29+0800"
categories: 项目
cover:
tags: monitor prometheus
keywords: victoria metrics,tsdb,prometheus,prometheus扩展,监控数据存储
description: Prometheus 与 VictoriaMetrics 的常用 API，查询所有的 metrics name、labels 等
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

## 元数据查询

### Metrics Name

Prometheus 查询所有的 metrics，limit 限制查询的数量， [querying-metric-metadata][2]：

```sh
$ curl "127.0.0.1:9090/api/v1/metadata?limit=2" |jq
{
  "status": "success",
  "data": {
    "prometheus_tsdb_head_min_time": [
      {
        "type": "gauge",
        "help": "Minimum time bound of the head block. The unit is decided by the library consumer.",
        "unit": ""
      }
    ],
    "prometheus_tsdb_vertical_compactions_total": [
      {
        "type": "counter",
        "help": "Total number of compactions done on overlapping blocks.",
        "unit": ""
      }
    ]
  }
}
```

VictoriaMetrics 当前不支持。

### Series 

Prometehus 查询 Series Value，注意这个方法只是查询满足条件的时间序列，没有数值：

```sh
$ curl -g 'http://127.0.0.1:9090/api/v1/series' --data-urlencode 'match[]=vm_rows{}'  --data-urlencode 'start=2020-03-02T00:00:00Z|jq
{
  "status": "success",
  "data": [
    {
      "__name__": "vm_rows",
      "instance": "vmstorage:8482",
      "job": "victoria",
      "type": "indexdb"
    },
    {
      "__name__": "vm_rows",
      "instance": "vmstorage:8482",
      "job": "victoria",
      "type": "storage/big"
    },
    {
      "__name__": "vm_rows",
      "instance": "vmstorage:8482",
      "job": "victoria",
      "type": "storage/small"
    }
  ]
}
```

VictoriaMetrics 支持：

```sh
$ curl 'http://127.0.0.1:8481/select/0/prometheus/api/v1/series' --data-urlencode 'match[]=vm_rows{}' |jq
```

### Labels & Label Value

Prometeus：

```sh
$ curl 127.0.0.1:9090/api/v1/labels |jq
{
  "status": "success",
  "data": [
    "GOARCH",
    "GOOS",
    "GOROOT",
    "__name__",
    "accountID",
    "action",
    ...
```

```sh
$ curl 127.0.0.1:9090/api/v1/label/job/values | jq
{
  "status": "success",
  "data": [
    "prometheus",
    "victoria"
  ]
}
```

VictoriaMetrics 支持:

```sh
$ curl 127.0.0.1:8481/select/0/prometheus/api/v1/labels |jq
$ curl 127.0.0.1:8481/select/0/prometheus/api/v1/label/job/values | jq
```

## 数值查询

Prometheus 当前值查询：

```sh
$ curl 'http://localhost:9090/api/v1/query?query=vm_rows' |jq
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": {
          "__name__": "vm_rows",
          "instance": "vmstorage:8482",
          "job": "victoria",
          "type": "indexdb"
        },
        "value": [
          1583123606.056,
          "14398"
        ]
      },
...
```

VictoriaMetrics 支持。

```sh
$ curl 'http://localhost:8481/select/0/prometheus/api/v1/query?query=vm_rows' |jq
```

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://prometheus.io/docs/prometheus/latest/querying/api/#querying-metric-metadata "querying-metric-metadata"
