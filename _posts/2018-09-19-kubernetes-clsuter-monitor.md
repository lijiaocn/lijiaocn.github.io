---
layout: default
title: "使用Prometheus建设Kubernetes的监控告警系统"
author: 李佶澳
createdate: "2018-09-19 14:16:41 +0800"
changedate: "2018-09-19 14:16:41 +0800"
categories:  项目
tags: kubernetes prometheus
keywords: kubernetes,prometheus,告警监控
description: 最近参与了监控系统的建设，主要是用Prometheus监控Kubernetes集群自身以及托管在Kubernetes中的业务容器的状态。
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

最近参与了监控系统的建设，主要是用Prometheus监控Kubernetes集群自身以及托管在Kubernetes中的业务容器的状态。目标是主动探测及时发现系统异常，避免当用户开始抱怨、造成实际损失的时候，才发现问题。

这里简单总结一下，做个收尾，先贴张图：

![prometheus部署架构图]({{ site.imglocal }}/prometheus/arch.png)

Kubernetes1.8提供了[Metrics API][4]，待研究 @ 2018-09-19 18:15:07。

## 指标和Exporter汇总

每个Job采集的指标都相当多，要经常查询它们的含义，把它们的说明文档统一收集在这里：

Prometheus Node Exporter采集的指标可以在[Readme](https://github.com/prometheus/node_exporter)中看到大类，查询出的metrics中每个指标都有注释: [e2e-64k-page-output.txt](https://github.com/prometheus/node_exporter/blob/1c9ea46ccab252e217971eebd5da6e492c108ea2/collector/fixtures/e2e-64k-page-output.txt)

[Kuberntes内置Cadvisor采集的指标](https://github.com/google/cadvisor/blob/master/docs/storage/prometheus.md)

kube-state-metrics采集的指标分散在多个文件中：[kube state metrics](https://github.com/kubernetes/kube-state-metrics/tree/master/Documentation)

[Prometheus Exporter大全](https://github.com/prometheus/docs/blob/50084b8f2938cafcbbd6f5d71462f5c980870952/content/docs/instrumenting/exporters.md)

## 背景

公司已经有一套自己开发的监控系统，通过在Java应用中埋藏Agent采集调用信息与请求响应信息。因为植入了Agent，监控的粒度很细。
但是，实际的情况是业务方会“忘记”配置告警规则，或者配置的告警规则触发的告警太多，而导致告警完全被忽视。
另外，原先的监控告警系统侧重的是“应用性能分析”，反而缺少了对另一大类非常基础、非常重要目标的监控：机器状态、网络状态、域名和端口状态等。

## 做法

我们将原先监控系统中缺失的一大类监控项统称为“基础设施”，对应的告警称为“基础告警”。主要有：

	机器的CPU状态、内存使用率、剩余磁盘空间
	机器IP地址的联通情况、服务端口的开放情况
	业务域名的联通情况
	...

因为业务系统大多都托管在了Kubernetes集群中，因此还有：

	容器CPU状态
	容器内存使用率
	容器inode使用量
	容器运行状态（是否ready)
	容器启动次数
	...

Kubernetes的node和托管其中的容器的信息，用Prometheus的服务发现功能直接探测。

没有托管在Kubernetes上的资源，例如一些中间件、数据库，以及业务方自己的物理机、自己搭建的系统等，尽量对接。
暂时无法对接的，在原先的告警监控系统上开发“自定义监控项”功能，推动业务方进行手动录入。

Prometheus的服务发现: [新型监控告警工具prometheus（普罗米修斯）入门使用][1]

## 设计

用到了Prometheus的`prometheus`、`alert-manger`和`*_exporter`组件，`confd`，和一个外部的consul集群。

自定义监控项记录在consul中，prometheus可以通过服务发现配置找到自定义监控项。
但自定义监控项的告警规则不能通过服务发现获取。这里引入了`confd`，将consul中的告警规则变化同步到promethes的配置文件中，并通知prometheus重新加载。

prometheus、alert-manager、confd，加上一个自己开发的告警通知组件（为alert-manager提供webhook）构成一个了monitor-server。

![prometheus部署架构图]({{ site.imglocal }}/prometheus/arch.png)

这样的monitor-server有两台，各自独立工作，两个monitor-server上的alert-manager配置成了集群模式，防止告警重复发出。

	prometheus发出的告警传送到alertmanager，alertmanager再调用自己开发告警通知组件的webhook将告警送出。
	两个alert-manager通过gossip协议互相通知自己的告警发送记录，从而形成一份相同的的告警记录。
	alert-manager收到告警要向外发送的时候，会检查这个告警记录是否已经存在，是否达到了再次通知的标准。
	

自己开发的告警通知组件中会调用公司的其它系统，找到监控项的所属人和联系方式，用邮件、微信和电话等方式送达。

整个设计的关键点是：只要我们从公司层面认为状态异常，就想法设法通知到对应人员，对全公司的业务系统进行兜底监控。

用户的业务触及到公司的告警标准，无论他自己是否设置了监控，都会收到公司发送的告警，并且在告警解除前会以每小时一次的频率持续发送。

## Kubernetes集群node的指标采集

node的状态指标通过Promethes的[node_expoer][3]采集，使用daemonset的方式，在每个node上部署一个运行在host模式的node_exporter。

node_exporter的默认端口是9100，指标获取接口是`:9100/metrics`，指标名前缀是`node_`。

	  - job_name: 'prod-kubernetes-node-exporter'
	    scheme: http
	    tls_config:
	      ca_file: /etc/kubernetes/ssl/prodssl/ca.crt
	      cert_file: /etc/kubernetes/ssl/prodssl/cs_client.crt
	      key_file: /etc/kubernetes/ssl/prodssl/cs_client.key
	      server_name: kubernetes.default.svc.cluster.local
	      insecure_skip_verify: true
	    #bearer_token_file: /etc/kubernetes/ssl/token.csv
	    kubernetes_sd_configs:
	    - role: node
	      api_server: https://10.19.16.152:6443
	      tls_config:
	        ca_file: /etc/kubernetes/ssl/prodssl/ca.crt
	        cert_file: /etc/kubernetes/ssl/prodssl/cs_client.crt
	        key_file: /etc/kubernetes/ssl/prodssl/cs_client.key
	        #insecure_skip_verify: true
	        #server_name: kubernetes.default.svc.cluster.local
	    relabel_configs:
	    - source_labels: [job]
	      regex: '(.*)'
	      replacement: prod-kubernetes
	      target_label: cluster
	    - source_labels: [__address__]
	      regex: '(.*):10250'
	      replacement: '${1}:9100'
	      target_label: __address__
	    - source_labels: [__meta_kubernetes_node_name]
	      regex: (.+)
	      target_label: __metrics_path__
	      replacement: /metrics
	    - action: labelmap
	      regex: __meta_kubernetes_node_label_(.+)

## Kubernetes中的容器指标采集

使用kubelet的`:10255/metrics/cadvisor`接口。
从`:10255/metrics/cadvisor`可以获得node上容器的详细状态，指标名前缀是`container_`。

	  - job_name: 'prod-kubernetes-cadvisor'
	    scheme: http
	    tls_config:
	      ca_file: /etc/kubernetes/ssl/prodssl/ca.crt
	      cert_file: /etc/kubernetes/ssl/prodssl/cs_client.crt
	      key_file: /etc/kubernetes/ssl/prodssl/cs_client.key
	      server_name: kubernetes.default.svc.cluster.local
	      insecure_skip_verify: true
	    #bearer_token_file: /etc/kubernetes/ssl/token.csv
	    kubernetes_sd_configs:
	    - role: node
	      api_server: https://10.19.16.152:6443
	      tls_config:
	        ca_file: /etc/kubernetes/ssl/prodssl/ca.crt
	        cert_file: /etc/kubernetes/ssl/prodssl/cs_client.crt
	        key_file: /etc/kubernetes/ssl/prodssl/cs_client.key
	        #insecure_skip_verify: true
	        #server_name: kubernetes.default.svc.cluster.local
	    relabel_configs:
	    - source_labels: [job]
	      regex: '(.*)'
	      replacement: prod-kubernetes
	      target_label: cluster
	    - source_labels: [__address__]
	      regex: '(.*):10250'
	      replacement: '${1}:10255'
	      target_label: __address__
	    - source_labels: [__meta_kubernetes_node_name]
	      regex: (.+)
	      target_label: __metrics_path__
	      replacement: /metrics/cadvisor
	    - action: labelmap
	      regex: __meta_kubernetes_node_label_(.+)
	

## Kubernetes状态指标采集

Kubernetes状态指标指的是Kubernetes中的Pod、Service、ConfigMap、Ingress等资源情况。

用[kube-state-metrics][5]采集，指标名前缀是`kube_类型`。

## 自定义监控实现方法

就是把用户配置的目标和规则写入consul，目标通过prometheus的服务发现获得，规则用confd获得。

见：[通过consul、confd，动态为prometheus添加监控目标和告警规则][2]

## IP、域名、服务端口等监控

使用Prometheus的[blackbox_exporter][9]探测目标IP、域名，以及服务端口。

## 告警规则

告警规则比较多，不一一列举了，写告警规则关键是要对prometheus的查询语句比较熟悉。

主要熟悉[Prometheus: Operators][6]、[Prometheus: Functions][7]。

可以参考：[通过Prometheus查询计算Kubernetes集群中的容器CPU、内存使用率等指标][8]。

NodeCPU使用率：

	sum(irate(node_cpu_seconds_total{nodename="10.10.173.203",mode!="idle"}[1m]))*100

Node CPU负载:

	node_load1
	node_load5
	node_load15

Node内存使用率：

	(1-node_memory_MemAvailable_bytes/node_memory_MemTotal_bytes)*100

根分区剩余空间：

	node_filesystem_avail_bytes{device="rootfs"}

Node CPU数量:

	machine_cpu_cores

容器CPU使用率：

	 (sum(irate(container_cpu_usage_seconds_total{container_name!="",pod_name!="",namespace="test-godeyes"}[1m])) by(cluster,namespace,container_name,pod_name))/(sum(container_spec_cpu_quota{namespace="test-godeyes",container_name!="",pod_name!=""}) by(cluster,namespace,container_name,pod_name) /100000)*100

容器内存使用率:

	container_memory_rss{namespace="test-godeyes",container_name!="",pod_name!=""}/(container_spec_memory_limit_bytes{namespace="test-godeyes", container_name!="",pod_name!=""}) <=1

容器inode使用总数：

	container_fs_inodes_total{namespace="test-godeyes",container_name!="",pod_name!=""}

mysql连接数:

	mysql_global_status_connections{vip="10.19.124.36:3306"}

mysql状态：

	MySQL_Up{vip="10.19.124.36:3306"}

mysql ops:

	delta(mysql_global_status_innodb_row_ops_total{vip="10.19.185.107:3306"}[5m])

mysql hit命中率:

	(mysql_global_status_qcache_hits-mysql_global_status_qcache_inserts )/mysql_global_status_qcache_hits * 100

redis状态：

	redis_cluster_state{addr="10.19.100.8:7000"}

redis连接数：

	redis_connected_clients{addr="10.19.100.8:7000"}

redis命中率:

	redis_keyspace_hits_total{addr="10.19.100.8:7000"}/(redis_keyspace_misses_total{addr="10.19.100.8:7000"}+redis_keyspace_hits_total{addr="10.19.100.8:7000"})

redis内存使用率：

	redis_memory_used_bytes{addr="10.19.100.8:7000"}/redis_memory_max_bytes{addr="10.19.100.8:7000"}

mq状态：

	rabbitmq_up

mq积压：

	rabbitmq_queue_messages_ready

mq内存：

	rabbitmq_node_mem_used/rabbitmq_node_mem_limit

## 参考

1. [新型监控告警工具prometheus（普罗米修斯）入门使用][1]
2. [通过consul、confd，动态为prometheus添加监控目标和告警规则][2]
3. [Prometheus: node_exporter][3]
4. [Kubernetes 1.8: Metrics API][4]
5. [kubernetes/kube-state-metrics][5]
6. [Prometheus: Operators][6]
7. [Prometheus: Functions][7]
8. [通过Prometheus查询计算Kubernetes集群中的容器CPU、内存使用率等指标][8]
9. [Prometheus exporter: blackbox_exporter][9]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/03/prometheus-usage.html "新型监控告警工具prometheus（普罗米修斯）入门使用"
[2]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/08/30/confd-prometheus-dynamic-config.html "通过consul、confd，动态为prometheus添加监控目标和告警规则"
[3]: https://github.com/prometheus/node_exporter "Prometheus: node_exporter"
[4]: https://kubernetes.io/docs/tasks/debug-application-cluster/core-metrics-pipeline/#metrics-server "Kubernetes 1.8: Metrics API"
[5]: https://github.com/kubernetes/kube-state-metrics "kubernetes: kube-state-metrics"
[6]: https://prometheus.io/docs/prometheus/latest/querying/operators/ "Prometheus: Operators"
[7]: https://prometheus.io/docs/prometheus/latest/querying/functions/ "Prometheus: Functions"
[8]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/09/14/prometheus-compute-kubernetes-container-cpu-usage.html "通过Prometheus查询计算Kubernetes集群中的容器CPU、内存使用率等指标" 
[9]: https://github.com/prometheus/blackbox_exporter "Prometheus exporter: blackbox_exporter"
