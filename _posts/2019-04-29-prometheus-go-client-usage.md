---
layout: default
title: "Prometheus的HTTP API的Go语言封装client_golang的使用"
author: 李佶澳
createdate: "2019-04-29 18:51:49 +0800"
changedate: "2019-04-30 16:30:37 +0800"
categories: 编程
tags: prometheus
keywords: prometheus,client_golang
description: client_golang是Prometheus的一个子项目，是Prometheus的Go client library，HTTP API的实现位于
---

* auto-gen TOC:
{:toc}

## 说明

[Prometheus/client_golang][1]是Prometheus的一个子项目，是Prometheus的Go client library，HTTP API的实现位于[子目录/api/prometheus](https://github.com/prometheus/client_golang/tree/master/api/prometheus)。这里简单记录一下它的用法。

## 下载

用go get下载：

```sh
go get  github.com/prometheus/client_golang/api/prometheus
```

或者用使用[Go语言项目的依赖代码管理工具][2]下载，譬如dep：

```sh
dep init
# 执行dep ensure的时候，当前目录需要有一个.go文件，不然会提示：no dirs contained any Go code
dep ensure -add   github.com/prometheus/client_golang/api/prometheus
```

## HTTP API

[Prometheus HTTP API][3]中介绍了Prometheus的Query接口，可以使用GET/POST的方法。

Instant queries：查询指定时间点的数值，uri为/api/v1/query，参数有三个：

	query:   查询表达式（指标名等）
	time:    目标时间，不指定默认为当前时间
	timeout: 查询等待时间
	
	$ curl 'http://localhost:9090/api/v1/query?query=up&time=2015-07-01T20:10:51.781Z'

Range queries: 查询指定时间范围的数值，uri为/api/v1/query_range，参数有五个：

	query:   查询表达式（指标名等）
	start:   开始时间
	end:     结束时间
	step:    间距
	timeout: 查询等待时间
	
	$ curl 'http://localhost:9090/api/v1/query_range?query=up&start=2015-07-01T20:10:30.781Z&end=2015-07-01T20:11:00.781Z&step=15s'

Querying metadata: 查询匹配label的指标在指定时间范围的数值，uri为/api/v1/series，参数有三个：

	match[]: 指标筛选条件，可以设置多个，多个match是或的关系
	start:   开始时间
	end:     结束时间
	
	$ curl -g 'http://localhost:9090/api/v1/series?' --data-urlencode='match[]=up' --data-urlencode='match[]=process_start_time_seconds{job="prometheus"}'

Getting label names: 获取指标名称，uri为/api/v1/labels，无参数：

	$ curl 'localhost:9090/api/v1/labels'

Querying label values: 查询指定label对应的数值，无参数：

	$ curl http://localhost:9090/api/v1/label/job/values


返回的json字符串格式：

```
{
  "status": "success" | "error",
  "data": <data>,

  // Only set if status is "error". The data field may still hold
  // additional data.
  "errorType": "<string>",
  "error": "<string>",

  // Only if there were warnings while executing the request.
  // There will still be data in the data field.
  "warnings": ["<string>"]
}
```

其中data格式因查询类型的不同而不同，有`Range vectors`、`Instant vectors`、`Scalars`、`Strings`四种，见[Prometheus Expression query result formats][4]。

## 使用

接口很简单，一个Client，一个QueryAPI，对应有两个创建函数：

```sh
▼+Client : interface
    [methods]
   -do(context.Context, *http.Request) : *http.Response, []byte, error
   -url(ep string, args map[string]string) : *url.URL

▼+QueryAPI : interface
    [methods]
   +Query(ctx context.Context, query string, ts time.Time) : model.Value, error
   +QueryRange(ctx context.Context, query string, r Range) : model.Value, error

▼ functions
   +New(cfg Config) : Client, error
   +NewQueryAPI(c Client) : QueryAPI
```

使用代码见：[github.com/introclass/prometheus_example/client_golang](https://github.com/introclass/prometheus_example/blob/master/client_golang/main.go)。

## 参考

1. [prometheus/client_golang][1]
2. [Go语言项目的依赖代码管理][2]
3. [Prometheus HTTP API][3]
4. [Prometheus Expression query result formats][4]

[1]: https://github.com/prometheus/client_golang "prometheus/client_golang"
[2]: https://www.lijiaocn.com/programming/chapter-go/chapter04/01-dependency.html "Go语言项目的依赖代码管理"
[3]: https://prometheus.io/docs/prometheus/latest/querying/api/ "Prometheus HTTP API"
[4]: https://prometheus.io/docs/prometheus/latest/querying/api/#expression-query-result-formats "Prometheus Expression query result formats"
