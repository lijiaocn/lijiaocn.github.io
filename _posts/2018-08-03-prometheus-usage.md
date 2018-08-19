---
layout: default
title:  新型监控告警工具prometheus（普罗米修斯）的使用（附视频讲解）
author: 李佶澳
createdate: 2018/08/03 10:26:00
changedate: 2018/08/19 13:14:48
categories: 项目
tags: prometheus
keywords: prometheus,监控
description: prometheus是最近几年开始流行的一个新兴监控告警工具，特别是kubernetes带动了prometheus的应用。

---

* auto-gen TOC:
{:toc}

## 说明

视频还在制作中，可以通过右侧链接进入[网易云课堂·IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)查询。

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

Prometheus系统由prometheus、alertmanager、*_exporter（多个）三组程序组成。下面分别讲解。

## Prometheus

prometheus是最主要的组件，负责采集数据，发出告警。

### prometheus初体验

`prometheus`负责根据配置文件发现监控目标，主动收集数据指标，并检查是否触发告警规则，是Prometheus系统的核心。

可以直接使用Prometheus提供二进制文件：[prometheus download][3]。

先下载下来，简单试用一下：

	wget https://github.com/prometheus/prometheus/releases/download/v2.3.2/prometheus-2.3.2.linux-amd64.tar.gz
	tar -xvf prometheus-2.3.2.linux-amd64.tar.gz

解压以后得到下面的文件：

	$ ls
	console_libraries  consoles  LICENSE  NOTICE  prometheus  prometheus.yml  promtool

如果想要学习源代码，可以自己从代码编译：

	go get github.com/prometheus/prometheus
	cd $GOPATH/src/github.com/prometheus/prometheus
	git checkout <需要的版本>
	make build

然后直接运行prometheus程序启动了prometheus：

	 ./prometheus
	level=info ts=2018-08-18T12:57:33.232435663Z caller=main.go:222 msg="Starting Prometheus" version="(version=2.3.2, branch=HEAD, revision=71af5e29e815795e9dd14742ee7725682fa14b7b)"
	level=info ts=2018-08-18T12:57:33.235107465Z caller=main.go:223 build_context="(go=go1.10.3, user=root@5258e0bd9cc1, date=20180712-14:02:52)"
	...

通过localhost:9090，可以打开promtheus的网页。

### prometheus的配置文件

使用prometheus最关键的还是搞清楚它的配置文件，通过仔细定义配置文件，才能发挥初它的功能。

略微不幸的是，prometheus的配置文件有一些复杂，官方文档也不是很好：[prometheus configuration][2]。

配置文件是yaml格式，结构如下：

	$  cat prometheus.yml
	# my global config
	global:
	  scrape_interval:     15s # Set the scrape interval to every 15 seconds. Default is every 1 minute.
	  evaluation_interval: 15s # Evaluate rules every 15 seconds. The default is every 1 minute.
	  # scrape_timeout is set to the global default (10s).
	
	# Alertmanager configuration
	alerting:
	  alertmanagers:
	  - static_configs:
	    - targets:
	      # - alertmanager:9093
	
	# Load rules once and periodically evaluate them according to the global 'evaluation_interval'.
	rule_files:
	  # - "first_rules.yml"
	  # - "second_rules.yml"
	
	# A scrape configuration containing exactly one endpoint to scrape:
	# Here it's Prometheus itself.
	scrape_configs:
	  # The job name is added as a label `job=<job_name>` to any timeseries scraped from this config.
	  - job_name: 'prometheus'
	
	    # metrics_path defaults to '/metrics'
	    # scheme defaults to 'http'.
	
	    static_configs:
	    - targets: ['localhost:9090']

其中`global`是一些常规的全局配置，这里只列出了两个参数：

	  scrape_interval:     15s      #每15s采集一次数据
	  evaluation_interval: 15s      #每15s做一次告警检测

`rule_files`指定加载的告警规则文件，告警规则放到下一节讲。

`scrape_configs`指定prometheus要监控的目标，这部分是最复杂的。在scrape_config中每个监控目标是一个`job`，但job的类型有很多种。

可以是最简单的`static_config`，即静态地指定每一个目标，例如上面的：

	  - job_name: prometheus
	    static_configs:
	      - targets: ['localhost:9090']

也可以使用服务发现的方式，动态发现目标，例如将kubernetes中的node作为监控目标，在上面的配置文件后追加：

	  - job_name: 'kubernetes-nodes'
	    kubernetes_sd_configs:
	    - role: node
	      api_server: https://192.168.88.10
	      tls_config:
	        ca_file:   /opt/app/k8s/admin/cert/ca/ca.pem
	        cert_file: /opt/app/k8s/admin/cert/apiserver-client/cert.pem
	        key_file:  /opt/app/k8s/admin/cert/apiserver-client/key.pem
	    bearer_token_file: /opt/app/k8s/apiserver/cert/token.csv
	    scheme: https
	    tls_config:
	      ca_file:   /opt/app/k8s/admin/cert/ca/ca.pem
	      cert_file: /opt/app/k8s/admin/cert/apiserver-client/cert.pem
	      key_file:  /opt/app/k8s/admin/cert/apiserver-client/key.pem

然后启动prometheus：

	./prometheus --config.file=./prometheus.k8s.yml

prometheus运行的时候会自动探测kubernetes中的node变化，自动将kubernetes中的node作为监控目标，在prometheus的页面中可以看到自动生成的监控目标。这里就不贴图了，可以自己试一下，或者看下视频。

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

### 使用relabel_config扩展采集能力

[relabel_config][5]，顾名思义，可以用来重新设置标签。标签是附属在每个监控目标的每个指标上的。

在prometheus中有些标签是双下划线开头的，例如`__address__`，这样的标签是内置的有特殊意义的，不会附着在监控指标上。

这样的标签有：

	__address__         : 检测目标的地址 
	__scheme__          : http、https等
	__metrics_path__    : 获取指标的路径

上面的三个指标组合成一个完整的获取指标数据的url，可以通过改写这些标签，从而从另外的地方获取指标数据。

另外在每个服务发现配置中，还会定义与服务相关的内置指标，例如`kubernetes_sd_config`的`node`的类型中又定义了：

	__meta_kubernetes_node_name: The name of the node object.
	__meta_kubernetes_node_label_<labelname>: Each label from the node object.
	__meta_kubernetes_node_annotation_<annotationname>: Each annotation from the node object.
	__meta_kubernetes_node_address_<address_type>: The first address for each node address type, if it exists.

在上一节中，是直接从默认的地址`http://< NODE IP>/metrics`中采集到每个node数据的，这里用relabel修改一下，改成从apiserver中获取：

	  - job_name: 'kubernetes-nodes'
	    kubernetes_sd_configs:
	    - role: node
	      api_server: https://192.168.88.10
	      tls_config:
	        ca_file:   /opt/app/k8s/admin/cert/ca/ca.pem
	        cert_file: /opt/app/k8s/admin/cert/apiserver-client/cert.pem
	        key_file:  /opt/app/k8s/admin/cert/apiserver-client/key.pem
	    bearer_token_file: /opt/app/k8s/apiserver/cert/token.csv
	    scheme: https
	    tls_config:
	      ca_file:   /opt/app/k8s/admin/cert/ca/ca.pem
	      cert_file: /opt/app/k8s/admin/cert/apiserver-client/cert.pem
	      key_file:  /opt/app/k8s/admin/cert/apiserver-client/key.pem
	    relabel_configs:
	    - action: labelmap
	      regex: __meta_kubernetes_node_label_(.+)
	    - target_label: __address__
	      replacement: 192.168.88.10
	    - source_labels: [__meta_kubernetes_node_name]
	      regex: (.+)
	      target_label: __metrics_path__
	      replacement: /api/v1/nodes/${1}/proxy/metrics

其实就是在原先的配置后面增加了一节`relabel_configs`的配置。

这时候重新加载配置文件，过一小会儿，就会发现target的url发生了变化。

relabel_config是一个很强大的功能，除了修改标签，还可以为采集的指标添加上新标签：

	    - source_labels: [__meta_kubernetes_node_name]
	      regex: (.+)
	      replacement: hello_${1}
	      target_label: label_add_by_me

在配置文件中再次附加一段，为每个指标都添加了一个名为`label_add_by_me`的标签。

### prometheus的查询语句

prometheus的查询语句也是很重要的内容，除了用来查询数据，后面将要讲的告警规则也要用查询语句描述。

查询语句直接就是指标的名称：

	go_memstats_other_sys_bytes

但是可以通过标签筛选：

	go_memstats_other_sys_bytes{instance="192.168.88.10"}

标签属性可以使用4个操作符：

	=: Select labels that are exactly equal to the provided string.
	!=: Select labels that are not equal to the provided string.
	=~: Select labels that regex-match the provided string (or substring).
	!~: Select labels that do not regex-match the provided string (or substring).

并且可以使用多个标签属性，用“,”间隔，彼此直接是与的关系，下面是prometheus文档中的一个例子：

	http_requests_total{environment=~"staging|testing|development",method!="GET"}

甚至只有标签：

	{instance="192.168.88.10"}

对查询出来的结果进行运算也是可以的：

	时间范围截取，Range Vector Selectors：
	http_requests_total{job="prometheus"}[5m]
	
	时间偏移：
	http_requests_total offset 5m
	
	时间段内数值累加：
	sum(http_requests_total{method="GET"} offset 5m) 

还可以进行多元运算，[Operators][10]，以及使用函数，[Functions][11]。

### prometheus的告警规则配置

[alert rules][12]在单独的文件中定义，在prometheus.yml中引用：

	rule_files:
	  - "first_rules.yml"
	  # - "second_rules.yml"

每个rules文件格式如下：

	$ cat first_rules.yml
	groups:
	- name: rule1-http_requst_total
	  rules:
	  - alert:  HTTP_REQUEST_TOTAL
	    expr: http_requests_total > 100
	    for: 1m
	    labels:
	      severity: page
	    annotations:
	      summary: Http request total reach limit


需要注意，还要在prometheus.yml中配置alertmanager的地址：

	# Alertmanager configuration
	alerting:
	  alertmanagers:
	  - static_configs:
	    - targets:
	      - 127.0.0.1:9093

重新加载配置文件后，可以在prometheus的rule页面看到告警规则，在alert页面看到触发的告警，

现在alertmanager还没有部署，在下一节部署了alertmanager之后，告警可以在alertmanager中看到。

## alertmanager

alertmanager是用来接收prometheus发出的告警，然后按照配置文件的要求，将告警用对应的方式发送出去。

将告警集中到alertmanager，可以对告警进行更细致的管理。

### 下载启动

	wget https://github.com/prometheus/alertmanager/releases/download/v0.15.2/alertmanager-0.15.2.linux-amd64.tar.gz
	tar -xvf alertmanager-0.15.2.linux-amd64.tar.gz

解压以后会得到下面这些文件：

	alertmanager  alertmanager.yml  amtool  LICENSE  NOTICE

直接运行alertmanager就可以启动，然后通过`http://IP地址:9093/#/alerts`可以打开alertmanager的页面。

### alertmanager的配置文件

alertmanager的配置文件格式如下：

	global:
	  resolve_timeout: 5m
	
	route:
	  group_by: ['alertname']
	  group_wait: 10s
	  group_interval: 10s
	  repeat_interval: 1h
	  receiver: 'web.hook'
	receivers:
	- name: 'web.hook'
	  webhook_configs:
	  - url: 'http://127.0.0.1:5001/'
	inhibit_rules:
	  - source_match:
	      severity: 'critical'
	    target_match:
	      severity: 'warning'
	    equal: ['alertname', 'dev', 'instance']

其中最主要的是receivers，它定义了告警的处理方式，这里是webhook_config，意思是alertmananger将告警转发到这个url。

[alertmanager configuration][13]提供多种告警处理方式，webhook_configs只是其中一种：

	email_config
	hipchat_config
	pagerduty_config
	pushover_config
	slack_config
	opsgenie_config
	victorops_config
	webhook_config
	wechat_config 

### alertmanager配置邮件通知

这里给出一个用邮件通知告警的例子，发件邮箱用的是网易邮箱：

	global:
	  resolve_timeout: 5m
	route:
	  group_by: ['alertname']
	  group_wait: 10s
	  group_interval: 10s
	  repeat_interval: 1h
	  receiver: 'mail'
	receivers:
	- name: 'web.hook'
	  webhook_configs:
	  - url: 'http://127.0.0.1:5001/'
	- name: 'mail'
	  email_configs:
	  - to: lijiaocn@foxmail.com
	    from: 你的发件用的网易邮箱
	    smarthost:  smtp.163.com:25
	    auth_username: 网易邮箱账号
	    auth_password: 网易邮箱密码
	    # auth_secret:
	    # auth_identity:
	inhibit_rules:
	  - source_match:
	      severity: 'critical'
	    target_match:
	      severity: 'warning'
	    equal: ['alertname', 'dev', 'instance']

注意这里有`web.hook`和`mail`两个reciver，使用那个receive是在上面的route中配置的：

	route:
	  group_by: ['alertname']
	  group_wait: 10s
	  group_interval: 10s
	  repeat_interval: 1h
	  receiver: 'mail'

重新加载配置后，就可以收到告警邮件了。

### alertmanager集群模式

alertmanager可以配置成集群模式，即多个alaertmanager一起运行，彼此之间通过gossip协议获知告警的处理状态，防止告警重复发出。

这种模式通常用在prometheus需要做高可用的场景中。

[prometheus ha deploy][14]的高可用部署通常至少会有两套prometheus独立工作，它们会执行各自的告警检察。

与之相伴的通常也要部署多个alaertmanager，这时候这些alertmanager之间就需要同步信息，防止告警重复发出。

由于使用的是gossip协议，alermanager的集群模式配置很简单，只需要启动时指定另一个或多个alertmanager的地址即可：

	--cluster.peer=192.168.88.10:9094

## *_exporter

[exporter][5]是一组程序，它们分别被用来采集物理机、中间件的信息。有prometheus官方实现的，还有更多第三方实现的：

	Databases
	    Aerospike exporter
	    ClickHouse exporter
	    Consul exporter (official)
	    CouchDB exporter
	    ElasticSearch exporter
	    EventStore exporter
	...
	Hardware related
	    apcupsd exporter
	    Collins exporter
	    IoT Edison exporter
	...
	Messaging systems
	    Beanstalkd exporter
	    Gearman exporter
	    Kafka exporter
	...
	Storage
	
	    Ceph exporter
	    Ceph RADOSGW exporter
	...
	HTTP
	
	    Apache exporter
	    HAProxy exporter (official)
	...
	APIs
	    AWS ECS exporter
	    AWS Health exporter
	    AWS SQS exporter
	Logging
	
	    Fluentd exporter
	    Google's mtail log data extractor
	...
	Other monitoring systems
	    Akamai Cloudmonitor exporter
	    AWS CloudWatch exporter (official)
	    Cloud Foundry Firehose exporter
	    Collectd exporter (official)
	...
	Miscellaneous
	
	    ACT Fibernet Exporter
	    Bamboo exporter
	    BIG-IP exporter
	...

这些exporter分别采集对应系统的指标，并将其以prometheus的格式呈现出来，供prometheus采集。

## blackbox_exporter

blackbox_exporter是一个用来探测url、domain等联通、响应情况的exporter。

	wegt https://github.com/prometheus/blackbox_exporter/releases/download/v0.12.0/blackbox_exporter-0.12.0.linux-amd64.tar.gz
	tar -xvf blackbox_exporter-0.12.0.linux-amd64.tar.gz

解压后得到：

	blackbox_exporter  blackbox.yml  LICENSE  NOTICE

直接运行，默认监听地址是:9115：

	./blaxkbox_exporter

### blackbox_exporter配置文件与工作原理

[prometheus/blackbox_exporter][7]是一个用来探测HTTP、HTTPS、DNS、TCP和ICMP等网络状态的工具。

在blockbox_exporter中配置的一个个工作模块，[prometheus/blackbox_exporter config][8]。

配置文件如下：

	$ cat blackbox.yml
	modules:
	  http_2xx:
	    prober: http
	    http:
	  http_post_2xx:
	    prober: http
	    http:
	      method: POST
	  tcp_connect:
	    prober: tcp
	  pop3s_banner:
	    prober: tcp
	    tcp:
	      query_response:
	      - expect: "^+OK"
	      tls: true
	      tls_config:
	        insecure_skip_verify: false
	  ssh_banner:
	    prober: tcp
	    tcp:
	      query_response:
	      - expect: "^SSH-2.0-"
	  irc_banner:
	    prober: tcp
	    tcp:
	      query_response:
	      - send: "NICK prober"
	      - send: "USER prober prober prober :prober"
	      - expect: "PING :([^ ]+)"
	        send: "PONG ${1}"
	      - expect: "^:[^ ]+ 001"
	  icmp:
	    prober: icmp

例如下面的配置中，有两个工作模块`http_2xx`和`http_post_2xx`。

	modules:
	  http_2xx:
	    prober: http
	    http:
	  http_post_2xx:
	    prober: http
	    timeout: 5s
	    http:
	      method: POST
	      headers:
	        Content-Type: application/json
	    body: '{}'

模块可以根据需要设置更多的参数和判断条件：

	http_2xx_example:
	  prober: http
	  timeout: 5s
	  http:
	    valid_http_versions: ["HTTP/1.1", "HTTP/2"]
	    valid_status_codes: []  # Defaults to 2xx
	    method: GET
	    headers:
	      Host: vhost.example.com
	      Accept-Language: en-US
	    no_follow_redirects: false
	    fail_if_ssl: false
	    fail_if_not_ssl: false
	    fail_if_matches_regexp:
	      - "Could not connect to database"
	    fail_if_not_matches_regexp:
	      - "Download the latest version here"
	    tls_config:
	      insecure_skip_verify: false
	    preferred_ip_protocol: "ip4" # defaults to "ip6"

通过blackbox_exporter的服务地址调用这些模块，并传入参数。

例如要检测一下打开www.baidu.com时指标，下面调用的是http_2xx模块，传入的参数 http://www.baidu.com ：

	http://192.168.88.10:9115/probe?module=http_2xx&target=http%3A%2F%2Fwww.baidu.com%2F

blackbox_exporter将按照http_2xx中的配置探测目标网址http://www.baidu.com， 并返回探测到的指标：

	# HELP probe_dns_lookup_time_seconds Returns the time taken for probe dns lookup in seconds
	...<省略>....
	probe_http_version 1.1
	# HELP probe_ip_protocol Specifies whether probe ip protocol is IP4 or IP6
	# TYPE probe_ip_protocol gauge
	probe_ip_protocol 4
	# HELP probe_success Displays whether or not the probe was a success
	# TYPE probe_success gauge
	probe_success 1

成为promethues的监控目标之后，上面的这些指标将被prometheus中采集。

可以借助relabel_configs将`__address__`替换为blackbox_exporter的地址，从而生成从blackbox中获取指标的检测目标。

### 示例：探测kubernetes的集群node是否ping通

在blackbox的配置文件中配置icmp模块：

	  icmp:
	    prober: icmp

在prometheus.yml中配置服务发现，设置blackbox目标：

	  - job_name: 'kubernetes-nodes-ping'
	    kubernetes_sd_configs:
	    - role: node
	      api_server: https://192.168.88.10
	      tls_config:
	        ca_file:   /opt/app/k8s/admin/cert/ca/ca.pem
	        cert_file: /opt/app/k8s/admin/cert/apiserver-client/cert.pem
	        key_file:  /opt/app/k8s/admin/cert/apiserver-client/key.pem
	    bearer_token_file: /opt/app/k8s/apiserver/cert/token.csv
	    scheme: http
	    metrics_path: /probe
	    params:
	      module: [icmp]
	    relabel_configs:
	    - source_labels: [__address__]
	      regex: (.+):(.+)
	      replacement: ${1}
	      target_label: __param_target
	    - target_label: __address__
	      replacement: 192.168.88.10:9115
	    - action: labelmap
	      regex: __meta_kubernetes_node_label_(.+)

重新加载配置后，就可以在prometheus的页面中可以看到新增的target，而它们的地址是blackbox的地址。

搜索指标probe_success：

	http://10.10.199.154:9090/graph?g0.range_input=1h&g0.expr=probe_success&g0.tab=0

可以编写下面的告警规则，持续2分钟ping不通，触发告警：

	- name: node_icmp_avaliable
	  rules:
	  - alert: NODE_ICMP_UNREACHABLE
	    expr: probe_success{job="kubernetes-nodes-ping"} == 0
	    for: 2m
	    labels:
	      level: 1
	    annotations:
	      summary: node is {{ $labels.instance }}

## 杂项

下面是学习过程中，查询的一些资料，直接罗列，没有做整理。

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
7. [prometheus/blackbox_exporter][7]
8. [prometheus/blackbox_exporter config][8]
9. [Promtheus Remote Storage使用案例：多Kubernetes集群监控方案][9]
10. [Operators][10]
11. [Functions][11]
12. [alerting rules][12]
13. [alertmanager configuration][13]
14. [prometheus ha deploy][14]
15. [prometheus exporter][15]

[1]: https://prometheus.io/docs/introduction/overview/ "prometheus documents"
[2]: https://prometheus.io/docs/prometheus/latest/configuration/configuration/ "prometheus configuration"
[3]: https://prometheus.io/download/ "prometheus download"
[4]: https://prometheus.io/docs/introduction/first_steps/ "prometheus first_steps"
[5]: https://prometheus.io/docs/prometheus/latest/configuration/configuration/#%3Crelabel_config%3E "prometheus relabel_config"
[6]: https://prometheus.io/docs/instrumenting/exporters/ "prometheus exporters"
[7]: https://github.com/prometheus/blackbox_exporter "prometheus/blackbox_exporter"
[8]: https://github.com/prometheus/blackbox_exporter/blob/master/example.yml "prometheus/blackbox_exporter config"
[9]: http://ylzheng.com/2018/04/25/prometheus-with-mutil-k8s-environment/ "Promtheus Remote Storage使用案例：多Kubernetes集群监控方案"
[10]: https://prometheus.io/docs/prometheus/latest/querying/operators/ "Operators"
[11]: https://prometheus.io/docs/prometheus/latest/querying/functions/ "Functions"
[12]: https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/ "alerting rules"
[13]: https://prometheus.io/docs/alerting/configuration/ "alertmanager configuration"
[14]: http://ylzheng.com/2018/03/17/promethues-ha-deploy/ "prometheus ha deploy"
[15]: https://prometheus.io/docs/instrumenting/exporters/ "prometheus exporter"
