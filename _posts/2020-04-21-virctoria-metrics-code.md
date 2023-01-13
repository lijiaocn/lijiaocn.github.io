---
layout: default
title: "Victoria Metrics源码: 水平扩展实现，查询拆分与时序数据打散写入"
author: 李佶澳
date: "2020-04-21T10:38:12+0800"
last_modified_at: "2020-04-21T23:10:11+0800"
categories: 项目
cover:
tags: prometheus
keywords: VictoriaMetrics,时序数据,
description: vmselect 怎样把查询任务分散以及 vminsert 怎样将写入时序数据分散到多个 vmstorage
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

学习 Victoria Metrics 的源代码，了解它的实现，特别是水平扩展的实现方法，即 vmselect 是怎样把时序数据的查询任务分散到多个 vmstorage，以及 vminsert 怎样将写入的时序数据分散到多个 vmstorage。

**注意** Victoria Metrics 的单机版和集群版是两个分支：

```sh
git clone https://github.com/VictoriaMetrics/VictoriaMetrics.git
git checkout master                                              # master 分支中是单机版
git branch cluster -t origin/cluster && git checkout cluster     # cluster 分支中是集群版
```

这里学习的是集群版（cluster 分支）的代码。

在寻找 Prometheus 的水平扩展方案时发现的 [VictoriaMetrics][3]：

1. [Prometheus 水平扩展方案（一）：监控数据的转储、聚合、查询][2]
2. [Prometheus 水平扩展方案（二）：Victoria Metrics 学习、试用][4]
3. [Prometheus 水平扩展方案（三）：Prometheus 与 Victoria Metrics 的 API][5]

视频演示：[章节2-Prometheus水平扩展之Victoria Metrics][7]

## vmselect

./app/vmselect 将查询任务拆分成多个任务分发给 vmstorage，然后将 vmstorage 响应数据汇聚返回。

考虑的几个参数：

```
1. 并发查询的上限: maxConcurrentRequests（search.maxConcurrentRequests） 
2. 达到并发查询上限后，后续查询等待执行的最长时间: maxQueueDuration（search.maxQueueDuration）
3. 最小采样间隔：minScrapeInterval（dedup.minScrapeInterval），过于临近的采样点将保留其一
```

vmselect 接收的 url 格式：`/{prefix}/{authToken}/{suffix}`，另外还有一个特殊的 /internal/resetRollupResultCache。

```
prefix:     操作类型，vmselect 支持的是 select 和 delete，vminsert 支持的是 insert
authToken:  账号类型，格式为 accountID[:projectID]，用于租户隔离，projectID 可选
suffix:     prometheus 查询 api 
```

Prometheus HTTP API: * [Query API](https://prometheus.io/docs/prometheus/latest/querying/api/)

Prometheus 的[子查询](https://prometheus.io/blog/2019/01/28/subquery-support/)，在 VictoriaMetrics 中被成为 rollup，会单独处理。

下面是一个带有子查询的语句：

```sh
min_over_time( rate(http_requests_total[5m])[30m:1m] )
# rate(http_requests_total[5m])[30m:1m] 是带有时间窗口的子查询
# 30m:1m，表示过去 30 分钟，步长是 1 分钟
```

从 api 到查询 vmstorage，中间有很多过程（主要就是解析查询语句，挺烧脑的代码，没细看...），最后通过 netstorage 查询 vmstorage：

```go
// app/vmselect/promql/eval.go: 644
sq := &storage.SearchQuery{
	AccountID:    ec.AuthToken.AccountID,
	ProjectID:    ec.AuthToken.ProjectID,
	MinTimestamp: minTimestamp,
	MaxTimestamp: ec.End,
	TagFilterss:  [][]storage.TagFilter{tfs},
}
rss, isPartial, err := netstorage.ProcessSearchQuery(ec.AuthToken, sq, true, ec.Deadline)
```

进入 netstorage.ProcessSearchQuery() 会发现，vmselect 会同时查询所有的 vmstorage，无差别对待：

```go
// app/vmselect/netstorage/netstorage.go:747 in func ProcessSearchQuery()
for _, sn := range storageNodes {
	go func(sn *storageNode) {
		sn.searchRequests.Inc()
		err := sn.processSearchQuery(tbfw, requestData, tr, fetchData, deadline)
		if err != nil {
			sn.searchRequestErrors.Inc()
			err = fmt.Errorf("cannot perform search on vmstorage %s: %s", sn.connPool.Addr(), err)
		}
		resultsCh <- err
	}(sn)
}
```

storageNodes 是全局变量，它的值是启动 vmselect 的时候用参数指定的。没找在运行时动态添加 storageNode 的方法，这意味着当前（2020-04-21 13:02:10）用增加 storageNodes 的方式扩容 VictoriaMetrics ，可能要修改 vmselect 和 vminsert 的参数并重启。

**如果有一个 vmstorage 宕机，查询出来数据可能是不完整的**，下节通过分析 vminsert 的代码来验证。

## vminsert

./app/vminsert 将采集数据分发给 vmstorage。考虑的几个参数：

```
1. 每个时间序列可以带有 label 上限：maxLabelsPerTimeseries（maxLabelsPerTimeseries），默认 30。
```

vminsert 接收的 http 请求的 path 命名规范和 vminsert 相同，但只支持 `insert` 前缀，后缀支持以下[几种][6]：

```
1. prometheus                          - for inserting data with Prometheus remote write API
2. influx/write or influx/api/v2/write - for inserting data with Influx line protocol
3. opentsdb/api/put                    - for accepting OpenTSDB HTTP /api/put requests
4. prometheus/api/v1/import            - for importing data obtained via api/v1/export on vmselect
```

vminsert 收到请求后，经过一系列过程，最终在 insertRows() 中开始写入：

```go
// ./app/vminsert/promremotewrite/request_handlers.go
func insertRows(at *auth.Token, timeseries []prompb.TimeSeries) error {
	ctx := netstorage.GetInsertCtx()
	defer netstorage.PutInsertCtx(ctx)

	ctx.Reset() // This line is required for initializing ctx internals.
	rowsTotal := 0
	for i := range timeseries {
		ts := &timeseries[i]
		storageNodeIdx := ctx.GetStorageNodeIdx(at, ts.Labels)
		ctx.MetricNameBuf = ctx.MetricNameBuf[:0]
		for i := range ts.Samples {
			r := &ts.Samples[i]
			if len(ctx.MetricNameBuf) == 0 {
				ctx.MetricNameBuf = storage.MarshalMetricNameRaw(ctx.MetricNameBuf[:0], at.AccountID, at.ProjectID, ts.Labels)
			}
			if err := ctx.WriteDataPointExt(at, storageNodeIdx, ctx.MetricNameBuf, r.Timestamp, r.Value); err != nil {
				return err
			}
		}
		rowsTotal += len(ts.Samples)
	}
	rowsInserted.Get(at).Add(rowsTotal)
	rowsPerInsert.Update(float64(rowsTotal))
	return ctx.FlushBufs()
}
```

ctx.GetStorageNodeIdx(at, ts.Labels) 是获取 vmstorage 节点 id 的函数，正是我们特别关心的：写入的数据如何分散到多个 vmstorage。

查看 ctx.GetStorageNodeIdx() 的实现，发现就是以 accountid 和 label 为输入计算 hash 后取模。

和前面 vminsert 的分析结合起来就释然了，VictoriaMetrics 采用的策略是：

**写入数据时随机打散到 vmstorage，查询时从所有的 vmstorage 查询，通过全节点查询保证数据完整。**

如果 vmstorage 宕机导致写入失败，vminsert 中有一个单独的协程尝试重新路由到其它 vmstorage。

## vmstorage

vmstorage 向 vmselect 提供查询接口，向 vminsert 提供写入接口，有需要的时候再学习... 

## 参考

1. [李佶澳的博客][1]
2. [Prometheus 水平扩展方案（一）：监控数据的转储、聚合、查询][2]
3. [VictoriaMetrics][3]
4. [Prometheus 水平扩展方案（二）：Victoria Metrics 学习、试用][4]
5. [Prometheus 水平扩展方案（三）：Prometheus 与 Victoria Metrics 的 API][5]
6. [VictoriaMetrics url-format][6]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2020/02/12/prometheus-scale-out-1.html "Prometheus 水平扩展方案（一）：监控数据的转储、聚合、查询"
[3]: https://github.com/VictoriaMetrics/VictoriaMetrics "VictoriaMetrics"
[4]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2020/02/24/prometheus-scale-out-2.html "Prometheus 水平扩展方案（二）：Victoria Metrics 学习、试用"
[5]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2020/03/02/prometheus-scale-out-3.html "Prometheus 水平扩展方案（三）：Prometheus 与 Victoria Metrics 的 API"
[6]: https://github.com/VictoriaMetrics/VictoriaMetrics/tree/cluster#url-format "VictoriaMetrics url-format"
[7]: https://study.163.com/course/introduction.htm?shareId=400000000376006&trace_c_p_k2_=4b9989a268b5410392276efde7315c5f&courseId=1005950011#/courseDetail?tab=1 "视频讲解：Prometheus 水平扩展之Victoria Metrics"
