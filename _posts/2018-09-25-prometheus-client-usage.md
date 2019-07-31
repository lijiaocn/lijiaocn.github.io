---
layout: default
title: "使用Prometheus SDK输出Prometheus格式的Metrics"
author: 李佶澳
createdate: "2018-09-25 16:02:37 +0800"
last_modified_at: "2018-09-25 16:02:37 +0800"
categories: 编程
tags: prometheus
keywords: prometheus,go,client,api
description: client_golang是prometheus的go client，主要有两部分：用于吐出metrics的sdk，和调用prometheus的api的sdk。应用程序可以直接使用Prometheus sdk输出Prometheus格式的Metrics

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[client_golang][1]是prometheus的go client，主要有两部分：用于吐出metric的sdk，和调用prometheus的api的sdk。

通过client_golang可以在程序内集成prometheus，将metric以prometheus支持的格式吐出。

## 起步

[client_golang][1]中已经提供了[两个例子](https://github.com/prometheus/client_golang/tree/master/examples)。

	go get github.com/prometheus/client_golang
	cd $GOPATH/src/github.com/prometheus/client_golang

simple是一个最简单的例子：

	package main
	
	import (
		"flag"
		"log"
		"net/http"
		
		"github.com/prometheus/client_golang/prometheus/promhttp"
	)
	
	var addr = flag.String("listen-address", ":8080", "The address to listen on for HTTP requests.")
	
	func main() {
		flag.Parse()
		http.Handle("/metrics", promhttp.Handler())
		log.Fatal(http.ListenAndServe(*addr, nil))
	}

其中promhttp.Handler()中注册了prometheus默认的metrics生成器：

	func Handler() http.Handler {
		return InstrumentMetricHandler(
			prometheus.DefaultRegisterer, HandlerFor(prometheus.DefaultGatherer, HandlerOpts{}),
		)
	}

编译运行:

	cd simple
	go build
	./simple

访问"127.0.0.1:8080/metric"就可以读取到metrics。

## 添加指标

random复杂一点点，注册了两个采集器，注意第一个采集器后面的"service"，它是label名称：

	...
	var (
		rpcDurations = prometheus.NewSummaryVec(
			prometheus.SummaryOpts{
				Name:       "rpc_durations_seconds",
				Help:       "RPC latency distributions.",
				Objectives: map[float64]float64{0.5: 0.05, 0.9: 0.01, 0.99: 0.001},
			},
			[]string{"service"},
		)
		rpcDurationsHistogram = prometheus.NewHistogram(prometheus.HistogramOpts{
			Name:    "rpc_durations_histogram_seconds",
			Help:    "RPC latency distributions.",
			Buckets: prometheus.LinearBuckets(*normMean-5**normDomain, .5**normDomain, 20),
		})
	)
	
	func init() {
		// Register the summary and the histogram with Prometheus's default registry.
		prometheus.MustRegister(rpcDurations)
		prometheus.MustRegister(rpcDurationsHistogram)
	}
	...

采集器在与[采集器类型](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/03/prometheus-usage.html#metric%E7%B1%BB%E5%9E%8B)同名的.go文件中实现：

	prometheus/counter.go
	prometheus/gauge.go
	prometheus/histogram.go
	prometheus/summary.go

在主程序中可以向这两个采集器中写入指标，并可以设置label的数值：
	
	func main() {
		...
				v := rand.Float64() * *uniformDomain
				rpcDurations.WithLabelValues("uniform").Observe(v)
				...
				v := (rand.NormFloat64() * *normDomain) + *normMean
				rpcDurations.WithLabelValues("normal").Observe(v)
				rpcDurationsHistogram.Observe(v)
				...
				v := rand.ExpFloat64() / 1e6
				rpcDurations.WithLabelValues("exponential").Observe(v)
				...
		...
		// Expose the registered metrics via HTTP.
		http.Handle("/metrics", promhttp.Handler())
		log.Fatal(http.ListenAndServe(*addr, nil))
	}

注意用`WithLabelValues()`设置label的value的时候，参数是多个label的数值，它们的顺序必须和声明采集器时定义的相同。
否则label的值会错配，为了防止这种情况，可以用`GetMetricWith(labels Labels)`方法设置。

启动后可以查询到下面到指标：

	...
	rpc_durations_seconds{service="exponential",quantile="0.5"} 7.380919552318622e-07
	rpc_durations_seconds{service="exponential",quantile="0.9"} 2.291519677915514e-06
	rpc_durations_seconds{service="exponential",quantile="0.99"} 4.539723552933882e-06
	rpc_durations_seconds_sum{service="exponential"} 0.0005097984764772547
	rpc_durations_seconds_count{service="exponential"} 532
	..

## 参考

1. [Prometheus SDK: client go][1]

[1]: https://github.com/prometheus/client_golang "Prometheus SDK: client go"
