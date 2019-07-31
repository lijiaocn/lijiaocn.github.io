---
layout: default
title: 监控系统prometheus的使用
author: lijiaocn
createdate: 2017/07/11 10:04:34
last_modified_at: 2017/07/31 17:22:36
categories: 项目
tags: prometheus 
keywords: prometheus,监控
description: prometheus是一个集合了数据采集、时间序列存储、告警功能的告警监控系统。

---

* auto-gen TOC:
{:toc}

## 说明

prometheus是一个集合了数据采集、时间序列存储、告警功能的告警监控系统。

通过指标的名字和标签唯一标记一个时间序列，格式如下:

	<metric name>{<label name>=<label value>, ...}

标签提供了对同一个指标的多纬度查询，修改标签名称或者增删标签都会创建一个新的时间序列。

指标名称:

	[a-zA-Z_:][a-zA-Z0-9_:]*

标签名称:

	[a-zA-Z_:][a-zA-Z0-9_:]*
	以`__`开头的标签名，为系统内部使用

Samples是采样点，由毫秒精度的时间戳和一个float64数值组成。

## Metric Types

Metric有四种类型，当前这四种类型只是在客户端library中标记，服务端没有类型概念。

	counter:    累计值(cumulative)，只会向上增长的指标
	gauge:      瞬时值
	histogram:  直方图(histogram)，统计采样数据在指定的区间内的分布情况
	summary:    汇总统计，支持分位数(φ-quantiles)

[metric types][3]中做了详细介绍。

## Query

[querying example][4]

## 编译

	go get github.com/prometheus/prometheus
	cd $GOPATHsrc/github.com/prometheus/prometheus
	cd cmd/prometheus/
	git checkout  v1.7.1
	go build

## 配置

编辑配置文件prometheus.yml:

	global:
	  scrape_interval:     15s # By default, scrape targets every 15 seconds.
	
	  # Attach these labels to any time series or alerts when communicating with
	  # external systems (federation, remote storage, Alertmanager).
	  external_labels:
	    monitor: 'codelab-monitor'
	
	# A scrape configuration containing exactly one endpoint to scrape:
	# Here it's Prometheus itself.
	scrape_configs:
	  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
	  - job_name: 'prometheus'
	
	    # Override the global default and scrape targets from this job every 5 seconds.
	    scrape_interval: 5s
	
	    static_configs:
	      - targets: ['localhost:9090']

这里只配置了一个监控目标，就是localhost:9090，prometheus自身。

static_configs是job中发现target的一种方式，[prometheus configuration][8]提供了多种发现方式。

	<scrape_config>
	<tls_config>
	<azure_sd_config>
	<consul_sd_config>
	<dns_sd_config>
	<ec2_sd_config>
	<openstack_sd_config>
	<file_sd_config>
	<gce_sd_config>
	<kubernetes_sd_config>
	<marathon_sd_config>
	<nerve_sd_config>
	<serverset_sd_config>
	<triton_sd_config>
	<static_config>
	<relabel_config>
	<metric_relabel_configs>
	<alert_relabel_configs>
	<alertmanager_config>
	<remote_write>
	<remote_read>

## 启动

默认将数据存放在./data目录中，可以通过-storage.local.path进行配置。

	./prometheus -config.file=./prometheus.yml

打开127.0.0.1:9090，就进入了prometheus界面，可以选择数据源查看。

## push网关

prometheus本身只支持pull的方式，如果要使用push的方式，需要部署一个pushgateway。

client向pushgateway中推送数据，在prometheus中配置job，轮询pushgateway的数据。

详情见[push gateway][5]。

## exporter

[exporter][6]用于在不改动目标程序的情况下，将已有的程序的监控指标转换为prometheus的格式，导入到prometheus中。

### HAProxy Exporter

	go get github.com/prometheus/haproxy_exporter
	cd $GOPATH/src/github.com/prometheus/haproxy_exporter

## 参考

1. [getting_started][1]
2. [prometheus github][2]
3. [metric types][3]
4. [querying example][4]
5. [push gateway][5]
6. [exporters][6]
7. [haproxy exporter][7]
8. [prometheus configuration][8]

[1]: https://prometheus.io/docs/introduction/getting_started/  "getting_started" 
[2]: https://github.com/prometheus/prometheus "prometheus github"
[3]: https://prometheus.io/docs/concepts/metric_types/ "metric types"
[4]: https://prometheus.io/docs/querying/examples/ "querying example"
[5]: https://github.com/prometheus/pushgateway/blob/master/README.md "push gateway"
[6]: https://prometheus.io/docs/instrumenting/exporters/ "exports"
[7]: https://github.com/prometheus/haproxy_exporter  "haproxy exporter"
[8]: https://prometheus.io/docs/operating/configuration/ "prometheus configuration"
