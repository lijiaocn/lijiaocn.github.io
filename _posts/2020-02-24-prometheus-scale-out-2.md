---
layout: default
title: "Prometheus 水平扩展方案（二）: Victoria Metrics 学习、试用"
author: 李佶澳
date: "2020-02-24T10:59:11+0800"
last_modified_at: "2020-04-21T23:01:15+0800"
categories: 项目
cover:
tags: monitor prometheus
keywords: victoria metrics,tsdb,prometheus,prometheus扩展,监控数据存储
description: VictoriaMetrics 是支持水平扩展的时序数据库，可以作为 Prometheus 的远端存储，实现了 PromSQL
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

[VictoriaMetrics][2] 是一个支持水平扩展的时序数据库，可以作为 Prometheus 的远端存储，并且实现了 PromSQL，可以直接通过 VictoriaMetrics 查询时序数据，避开 Prometheus 查询时的单点瓶颈。

VictoriaMetrics 与其它方案的对比见：[Prometheus 水平扩展方案（一）][4]

源代码阅读：[VictoriaMetrics水平扩展的实现](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2020/04/21/virctoria-metrics-code.html)

【配套视频讲解】：【Prometehus入门->[水平扩展之Victoria Metrics][10]】



## 业务量指标

VictoriaMetrics 分为 [单机版本][9] 和 [集群版本][6]，`单机版本和集群版本用法不同`，这里使用的是集群版。

时间序列（time series）是时序数据库的最小管理单位，每个 time series 对应一系列按时间分布的的采样点。我们需要考虑以下几个问题：

```
1. 能存储多少个 time series，total number of time series；
2. 能支持多少个 time series 的并发写入，number of active time series；
3. 能支持多高速度的采样数据写入，每秒写入点数；
4. 能支持多高查询频率，average query rate；
5. 每次查询耗时，query duration；
```

## 实践案例

以下是几个公司公开的 [使用情况][5]，不代表 Victora 的性能上限：

wix.com 使用的 `单机版` 承接的业务量：

1. 累计序列数 4 亿；
2. 并发序列数 2000 万；
3. 每秒写入点数 80 万；
4. 查询频率每分钟 1000 次；
5. 查询耗时平均 70ms，99th 是 2 秒；

Dreamteam 使用 `单机版` 承接的业务量：

1. 累计序列数 3.2 亿
2. 并发序列数 72.5 万
3. 数据点总数 1550 亿

Wedos.com 使用 `集群版` 承接的业务量：

1. 并发序列数 500 万
2. 每秒写入点数 17 万 
3. 查询平均耗时 2ms，99th 是 2 秒


## VictoriaMetrics Cluster 模式部署

VictoriaMetrics [集群版本][6] 的架构如下：

![VictoriaMetrics的系统架构]({{ site.article }}/victoria_metrics_arch.png)


vminsert 和 vmselect 是无状态的写入、查询节点，vmstorage 是有状态的存储节点。数据平均分配到 vmstorage 节点，每个 vmstorage 分担一部分数据，`没有冗余`，如果 vmstorage 节点丢失，那么数据对应丢失。

三个组件的镜像：

```sh
victoriametrics/vminsert:v1.34.0-cluster
victoriametrics/vmselect:v1.34.0-cluster
victoriametrics/vmstorage:v1.34.0-cluster
```

vmstorage 有状态服务，监听端口 8482(http)、8400(insert)、8401(select)，主要参数：

```sh
-retentionPeriod  # 存储时间，单位是月
-storageDataPath  # 数据存放路径
```

vminsert 无状态服务，指向所有的 vmstorage，监听端口 8480，主要参数：

```sh
-storageNode=<vmstorage_host>:8400
```

vmselect 无状态服务，指向所有的 vmstorage，监听端口 8481，主要参数：

```sh
-storageNode=<vmstorage_host>:8401
```

### 本地部署一个最小集群

用下面的 VictoriaMetrics/docker-compose.yaml 在本地启动一个最小集群：

```sh
git clone https://github.com/introclass/docker-compose-files.git
```

分别访问下面三个地址，查看组件的状态数据：

```
insert:  http://127.0.0.1:8480/metrics、
select:  http://127.0.0.1:8481/metrics、
storage：http://127.0.0.1:8482/metrics、
```

打开 grafana 地址 127.0.0.1:3000，用 admin/admin 登陆后，进入设置密码。

在 grafana 中添加 prometheus  数据源：

```sh
# grafana 中添加的 victorai 数据源 
http://vmselect:8481/select/0/prometheus/   
```

这个数据源地址要和 Prometheus 中的 remote write 相对应：

```sh
# prometheus 中配置的 remote write 
http://vminsert:8480/insert/0/prometheus
```

验证数据：

```sh
curl http://127.0.0.1:8481/select/0/prometheus/api/v1/labels
```

可以导入 victoria metrics 的 [dashboards/11176][7]，查看 victoria 的状态。

## Victoria Metrics 的数据写入

vminsert 的写入 API 格式如下：

```sh
http://<vminsert>:8480/insert/<accountID>/<suffix>
```

accountID 是不同用户/租户的 ID，必须是数字，否则通过 vmselect 查询的时候会遇到下面的问题：

```sh
# localcluster 不是数字，vmselect 报错
auth error: cannot parse accountID from "localcluster": strconv.Atoi: parsing "localcluster": invalid syntax
```

VictoriaMetrics  支持多种写入方式，通过 sufficx 区分，suffix 支持以下几种：

```sh
prometheus                :for inserting data with Prometheus remote write API
influx/write              :for inserting data with Influx line protocol
influx/api/v2/write       :for inserting data with Influx line protocol
opentsdb/api/put          :for accepting OpenTSDB HTTP /api/put requests.
prometheus/api/v1/import  :for importing data obtained via api/v1/export on vmselect
```

例如在 prometheus 中配置远程写入，使用的 suffix 是 prometheus：

```yaml
remote_write:
  - url: http://<vminsert>:8480/insert/<accountID>/prometheus
    queue_config:
      max_samples_per_send: 10000
      capacity: 20000
      max_shards: 30
```

建议根据需要在 Prometehus 中设置全局 label：

```yaml
global:
  external_labels:
    datacenter: dc-123
```

Prometheus 在 remote_write 时，本地的数据依旧会保存，本地数据保留时间设置：

```
--storage.tsdb.retention.time=
```

## Victoria Metrics 的数据查询

vmselect 采用 [prometheus 的查询语法][8]，API 格式如下：

```sh
http://<vmselect>:8481/select/<accountID>/prometheus/<suffix>
```

suffix 可以是下面的字符串，和 prometheus 的 api 对应：

```sh
api/v1/query           :performs PromQL instant query
api/v1/query_range     :performs PromQL range query
api/v1/series          :performs series query
api/v1/labels                       :returns a list of label names
api/v1/label/<label_name>/values    :returns values for the given <label_name> according to API
federate                            :returns federated metrics
api/v1/export                       :exports raw data. See this article for details
```

通过 Prometheus 的 API 查询：

```sh
$ curl -g 'http://localhost:9090/api/v1/series' --data-urlencode 'match[]=vm_rows{}' |jq

{
  "status": "success",
  "data": [
    {
      "__name__": "vm_rows",
      "instance": "172.29.128.2:8482",
      "job": "victoria",
      "type": "indexdb"
    },
    {
      "__name__": "vm_rows",
      "instance": "172.29.128.2:8482",
      "job": "victoria",
      "type": "storage/big"
    },
    {
      "__name__": "vm_rows",
      "instance": "172.29.128.2:8482",
      "job": "victoria",
      "type": "storage/small"
    }
  ]
}
```

通过 VictoriaMetrics 的 API 查询：

```sh
$ curl 'http://127.0.0.1:8481/select/0/prometheus/api/v1/series' --data-urlencode 'match[]=vm_rows{}' |jq
{
  "status": "success",
  "data": [
    {
      "__name__": "vm_rows",
      "job": "victoria",
      "type": "indexdb",
      "instance": "172.29.128.49:8482"
    },
    {
      "__name__": "vm_rows",
      "job": "victoria",
      "type": "indexdb",
      "instance": "172.29.128.2:8482"
    },
    {
      "__name__": "vm_rows",
      "job": "victoria",
      "type": "indexdb",
      "instance": "172.29.128.7:8482"
    },
   ...
```


## Victoria 自身的监控

Victora 官方提供了一个 grafana 面板，[dashboards/11176][7]：

![victorai grafana 监控]({{site.article}}/victoria-grafana-monitor.png)

## 参考

1. [李佶澳的博客][1]
2. [VictoriaMetrics][2]
3. [Prometheus 的查询语法][3]
4. [Prometheus 水平扩展方案：监控数据的转储、聚合、查询（一）][4]
5. [CaseStudies][5]
6. [Victora Cluster版本][6]
7. [dashboards/11176][7]
8. [prometheus http api][8]
9. [Victora 单机版本][9]
10. [视频讲解：Prometheus 水平扩展之Victoria Metrics][10]


[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://victoriametrics.github.io/ "VictoriaMetrics"
[3]: https://www.lijiaocn.com/soft/prometheus/query.html "Prometheus 的查询语法"
[4]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2020/02/12/prometheus-scale-out-1.html "Prometheus 水平扩展方案：监控数据的转储、聚合、查询（一）"
[5]: https://github.com/VictoriaMetrics/VictoriaMetrics/wiki/CaseStudies "CaseStudies"
[6]: https://github.com/VictoriaMetrics/VictoriaMetrics/tree/cluster "victora cluster"
[7]: https://grafana.com/grafana/dashboards/11176  "dashboards/11176"
[8]: https://prometheus.io/docs/prometheus/latest/querying/api/ "prometheus http api"
[9]: https://github.com/VictoriaMetrics/VictoriaMetrics/ "Victora 单机版本"
[10]: https://study.163.com/course/introduction.htm?shareId=400000000376006&trace_c_p_k2_=4b9989a268b5410392276efde7315c5f&courseId=1005950011#/courseDetail?tab=1 "视频讲解：Prometheus 水平扩展之Victoria Metrics"
