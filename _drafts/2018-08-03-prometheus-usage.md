---
layout: default
title:  新型监控告警工具prometheus（普罗米修斯）的使用
author: 李佶澳
createdate: 2018/08/03 10:26:00
changedate: 2018/08/10 17:31:03
categories: 项目
tags: prometheus
keywords: prometheus,监控
description: prometheus是最近几年开始流行的一个新兴监控告警工具，特别是kubernetes的流行带动了prometheus的应用。

---

* auto-gen TOC:
{:toc}

## 说明

[Prometheus][1]是最近几年开始流行的一个新兴监控告警工具，特别是kubernetes的流行带动了prometheus的应用。

Prometheus的主要特点有：

	1. a multi-dimensional data model with time series data identified by metric name and key/value pairs
	2. a flexible query language to leverage this dimensionality
	3. no reliance on distributed storage; single server nodes are autonomous
	4. time series collection happens via a pull model over HTTP
	5. pushing time series is supported via an intermediary gateway
	6. targets are discovered via service discovery or static configuration
	7. multiple modes of graphing and dashboarding support

作为一个监控系统，主要的功能就是提供时间序列数据的存储、查询、展示，这是prometheus的基本功能。

时间序列数据存储，很多系统都具有这样的功能例如influxdb、openTSDB等，是专门时间序列数据库，但它们不是一套完整的监控告警系统，缺少告警功能。

Prometheus是一套完整的监控告警系统：

![Prometheus系统组成](https://prometheus.io/assets/architecture-cb2ada1ece6.png)

另外Prometheus系统的[服务发现][2]功能很强大，可以直接通过Kubernetes等系统的接口，发现要监控的目标，不需要人员干预，不需要做系统对接方面的开发。

## 下载或编译

Prometheus系统由prometheus、alertmanager、*_exporter（多个）三组程序组成。

可以直接使用Prometheus提供二进制文件：[prometheus download][3]。

	wget https://github.com/prometheus/prometheus/releases/download/v2.3.2/prometheus-2.3.2.darwin-amd64.tar.gz   //mac
	wget https://github.com/prometheus/prometheus/releases/download/v2.3.2/prometheus-2.3.2.linux-amd64.tar.gz    //linux

或者自己下载代码编译：

	go get github.com/prometheus/prometheus
	cd $GOPATH/src/github.com/prometheus/prometheus
	git checkout <需要的版本>
	make build

>alertmanager和*_exporter的下载地址和源代码，在下载页和github上都可以找到。

## prometheus

`prometheus`负责根据配置文件发现监控目标，主动收集数据指标，并检查是否触发告警规则，是Prometheus系统的核心。

使用prometheus最关键的还是搞清楚它的配置文件。略微不幸的是，prometheus的配置文件略微复杂，官方文档也不是很好：[prometheus configuration][2]。

通过prometheus的配置文件，可以大概了解它的运作原理。配置文件是yaml格式，结构如下：

	global:
	  scrape_interval:     15s
	  evaluation_interval: 15s
	
	rule_files:
	  # - "first.rules"
	  # - "second.rules"
	
	scrape_configs:
	  - job_name: prometheus
	    static_configs:
	      - targets: ['localhost:9090']

其中`global`是一些常规的全局配置，这里只列出了两个参数：

	  scrape_interval:     15s      #每15s采集一次数据
	  evaluation_interval: 15s      #每15s做一次告警检测

`rule_files`指定加载的其它规则文件。

`scrape_configs`指定prometheus要监控的目标，这部分是最复杂的。scrape_configs中每个监控目标是一个`job`，但job的类型有很多种。

可以是最简单的`static_config`，即静态地指定每一个目标，例如上面的：

	  - job_name: prometheus
	    static_configs:
	      - targets: ['localhost:9090']

也可以使用服务发现的方式，动态发现目标，配置的是服务发现的地址，例如将kubernetes中的node作为监控目标：

	  - job_name: 'kubernetes-nodes'
	    kubernetes_sd_configs:
	    - role: node
	      api_server: https://10.10.199.154:6443
	      tls_config:
	        ca_file: /etc/kubernetes/ssl/ca.pem
	        cert_file: /etc/kubernetes/ssl/admin.pem
	        key_file: /etc/kubernetes/ssl/admin-key.pem
	    bearer_token_file: /etc/kubernetes/ssl/token.csv
	    scheme: https
	    tls_config:
	        ca_file: /etc/kubernetes/ssl/ca.pem
	        cert_file: /etc/kubernetes/ssl/admin.pem
	        key_file: /etc/kubernetes/ssl/admin-key.pem
	    relabel_configs:
	    - action: labelmap
	      regex: __meta_kubernetes_node_label_(.+)
	    - target_label: __address__
	      replacement: 10.10.199.154:6443
	    - source_labels: [__meta_kubernetes_node_name]
	      regex: (.+)
	      target_label: __metrics_path__
	      replacement: /api/v1/nodes/${1}/proxy/metrics

prometheus运行的时候会自动探测kubernetes中的node变化，自动将kubernetes中的node作为监控目标，无需逐个配置。
当前@2018-08-10 17:14:05，prometheus中与服务发现有关的配置有以下几项（前缀就是支持的系统，sd表示service discovery）：

        azure_sd_config
        consul_sd_config
        dns_sd_config
        ec2_sd_config
        openstack_sd_config
        file_sd_config
        gce_sd_config
        kubernetes_sd_config
        marathon_sd_config
        nerve_sd_config
        serverset_sd_config
        triton_sd_config

`服务发现`是prometheus最强大的功能之一，这个功能配合[relabel_config][5]、[*_exporter][6]可以做成很多事情。

### prometheus服务启动与目标发现

TODO: 配置文件样例、使用promtool检查、启动、页面操作、查询语法、kubernetes集群节点发现。

## alertmanager

TODO: 告警规则

## *_exporter

TODO: 通过exporter获取更多监控指标，blackbox_exporter的使用。

## 资料

规则检查：

	promtool check rules /etc/prometheus/alert-rules.yml
	./promtool check rules alert_rule_test.yml

监测cpu:

https://stackoverflow.com/questions/49083348/cadvisor-prometheus-integration-returns-container-cpu-load-average-10s-as-0

In order to get the metric "container_cpu_load_average_10s" the cAdvisor must run with the option "--enable_load_reader=true",

设置kubelet的参数：--enable-load-reader

[container_spec_cpu_quota](https://en.wikipedia.org/wiki/Completely_Fair_Scheduler)

[cadvisro指标](https://yunlzheng.gitbook.io/prometheus-book/part-ii-prometheus-jin-jie/exporter/commonly-eporter-usage/use-prometheus-monitor-container)

[alertmanager-webhook-receiver](https://prometheus.io/docs/operating/integrations/#alertmanager-webhook-receiver)

[Write a bash shell script that consumes a constant amount of RAM for a user defined time](https://stackoverflow.com/questions/4964799/write-a-bash-shell-script-that-consumes-a-constant-amount-of-ram-for-a-user-defi)

[Cadvisor metric "container_network_tcp_usage_total" always "0"](https://github.com/kubernetes/kubernetes/issues/60279)

[Cadvisor常用容器监控指标](http://yjph83.iteye.com/blog/2394091)

[prometheus-book](https://yunlzheng.gitbook.io/prometheus-book/introduction)

[Relabeling is a powerful tool to dynamically rewrite the label set of a target before it gets scraped. ](https://prometheus.io/docs/prometheus/latest/configuration/configuration/#%3Crelabel_config%3E)

## 查询语句 

运算[Operators](https://prometheus.io/docs/prometheus/latest/querying/operators/)

	# 容器CPU负载告警
	# container_cpu_load_average_10s, container_spec_cpu_quota, container_spec_cpu_shares, container_spec_cpu_quota
	# 容器CPU limit: container_spec_cpu_quota / container_spec_cpu_period
	# 计算空间的CPU使用率：sum(rate(container_cpu_usage_seconds_total{namespace=~".+"}[1m])) by (namespace) * 100
	# 计算容器CPU使用率：sum(rate(container_cpu_usage_seconds_total{name=~".+"}[1m])) by (name) * 100
	# rate(container_cpu_usage_seconds_total{name=~".+"}[1m])

计算容器的内存使用率：

	container_memory_usage_bytes{container_name!="", pod_name!=""} / container_spec_memory_limit_bytes{container_name!="", pod_name!=""}
	
	container_memory_usage_bytes{instance="prod-k8s-node-155-171",container_name!="", pod_name!=""} / container_spec_memory_limit_bytes{instance="prod-k8s-node-155-171",container_name!="", pod_name!=""}
	
	container_memory_usage_bytes{container_name!="", pod_name!=""} / container_spec_memory_limit_bytes{container_name!="", pod_name!=""} > 0.98
	
	container_memory_rss{container_name!="", pod_name!=""}/container_spec_memory_limit_bytes{container_name!="", pod_name!=""} >0.98

## 参考

1. [prometheus documents][1]
2. [prometheus configuration][2]
3. [prometheus download][3]
4. [prometheus first_steps][4]
5. [prometheus relabel_config][5]
6. [prometheus exporters][6]

[1]: https://prometheus.io/docs/introduction/overview/ "prometheus documents"
[2]: https://prometheus.io/docs/prometheus/latest/configuration/configuration/ "prometheus configuration"
[3]: https://prometheus.io/download/ "prometheus download"
[4]: https://prometheus.io/docs/introduction/first_steps/ "prometheus first_steps"
[5]: https://prometheus.io/docs/prometheus/latest/configuration/configuration/#%3Crelabel_config%3E "prometheus relabel_config"
[6]: https://prometheus.io/docs/instrumenting/exporters/ "prometheus exporters"

[1]: https://prometheus.io/docs/prometheus/latest/configuration/configuration/  "prometheus配置文件与服务发现" 
[2]: 2.com  "文献1" 

