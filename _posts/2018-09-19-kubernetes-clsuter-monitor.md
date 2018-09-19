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

* auto-gen TOC:
{:toc}

## 说明

最近参与了监控系统的建设，主要是用Prometheus监控Kubernetes集群自身以及托管在Kubernetes中的业务容器的状态。目标是主动探测及时发现系统异常，避免当用户开始抱怨、造成实际损失的时候，才发现问题。

这里简单总结一下，做个收尾。

Kubernetes1.8提供了[Metrics API][4]，待研究 @ 2018-09-19 18:15:07。

## 背景

公司成立时间较短，在过去几年飞速扩张、业务团队快速扩充、打法各异，有的监控做的比较完善，有的经验不足，监控覆盖不完善，存在一些处于“裸奔”状态的服务。历史上发生过几次故障，都是等到用户投诉过来后才知晓，才开始定位、解决，给公司造成了实质性的损失。

最近所处行业“风声鹤唳”，稳定压倒一切。公司技术团队Leaders意识到需要把“公司级”监控平台`用起来`，要求只有一个：及时发现问题。

公司已经有一套自己开发的监控系统，通过在Java应用中埋藏Agent采集调用信息与请求响应信息。因为植入了Agent，监控的粒度很细。但是，实际的情况是业务方会“忘记”配置告警规则，或者配置的告警规则，触发的告警太多，而导致告警完全被忽视。

另外，原先的监控告警系统侧重的是“应用性能分析”，反而缺少了对另一大类非常基础、非常重要目标的监控：机器状态、网络状态、域名和端口状态等。

## 做法

我们将原先监控系统中缺失的一大类监控项统称为“基础设施”，对应的告警称为“基础告警”。主要有：

	机器的CPU状态、内存使用率、剩余磁盘空间
	机器IP地址的联通情况、服务端口的开放情况
	业务域名的联通情况

因为业务系统大多都托管在了Kubernetes集群中，因此还有：

	容器的CPU状态、内存使用率、inode使用量等

Kubernetes的node和托管其中的容器的信息，用Prometheus的服务发现功能直接探测到。

对于没有托管在Kubernetes上的资源，例如一些中间件、数据库，以及业务方自己的物理机、自己搭建系统等，尽量对接， 实现监控项的自动发现。
暂时无法对接的，在原先的告警监控系统上开发“自定义监控项”功能，推动业务方进行手动录入。

Prometheus的服务发现: [新型监控告警工具prometheus（普罗米修斯）入门使用][1]

用户自定义监控项以及自定义的监控规则更新到Prometheus中的方法：[通过consul、confd，动态为prometheus添加监控目标和告警规则][2]

## 设计

用到了Prometheus的`prometheus`、`alert-manger`和`*_exporter`组件，confd，和一个外部的consul集群。

自定义监控项记录在consul中，prometheus可以通过配置的服务发现找到自定义监控项。
但自定义监控项的告警规则不能通过服务发现获取，这里引入了`confd`，将consul中的告警规则变化同步到promethes的配置文件中，并通知prometheus重新加载。

prometheus、alert-manager、confd，加上一个自己开发的告警通知组件（为alert-manager提供webhook）构成一个了monitor-server。

这样的monitor-server有两台，各自独立工作，两个monitor-server上的alert-manager配置成了集群模式，防止告警重复。

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

Kubernetes自身的组件都有`/metrics`接口，可以直接查询，需要通过服务发现添加每个node，也就是kubelet的`:10255/metrics/cadvisor`接口：

配置如下：

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

从`:10255/metrics/cadvisor`可以获得node上容器的详细状态，指标名前缀是`container_`。

## Kubernetes状态指标采集

Kubernetes状态指标指的是Kubernetes中的Pod、Service、ConfigMap、Ingress等资源情况。

可以用[kube-state-metrics][5]采集到，指标名前缀是`kube_类型`。

## 自定义监控实现方法

见：[通过consul、confd，动态为prometheus添加监控目标和告警规则][2]

就是把用户配置的目标和规则写入consul，目标通过prometheus的服务发现获得，规则用confd获得。

## 告警规则

告警规则比较多，不一一列举了，写告警规则关键是要对prometheus的查询语句比较熟悉。

主要熟悉[Prometheus: Operators][6]、[Prometheus: Functions][7]。

可以参考：[通过Prometheus查询计算Kubernetes集群中的容器CPU、内存使用率等指标][8]。

## 参考

1. [新型监控告警工具prometheus（普罗米修斯）入门使用][1]
2. [通过consul、confd，动态为prometheus添加监控目标和告警规则][2]
3. [Prometheus: node_exporter][3]
4. [Kubernetes 1.8: Metrics API][4]
5. [kubernetes/kube-state-metrics][5]
6. [Prometheus: Operators][6]
7. [Prometheus: Functions][7]
8. [通过Prometheus查询计算Kubernetes集群中的容器CPU、内存使用率等指标][8]


[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/03/prometheus-usage.html "新型监控告警工具prometheus（普罗米修斯）入门使用"
[2]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/08/30/confd-prometheus-dynamic-config.html "通过consul、confd，动态为prometheus添加监控目标和告警规则"
[3]: https://github.com/prometheus/node_exporter "Prometheus: node_exporter"
[4]: https://kubernetes.io/docs/tasks/debug-application-cluster/core-metrics-pipeline/#metrics-server "Kubernetes 1.8: Metrics API"
[5]: https://github.com/kubernetes/kube-state-metrics "kubernetes: kube-state-metrics"
[6]: https://prometheus.io/docs/prometheus/latest/querying/operators/ "Prometheus: Operators"
[7]: https://prometheus.io/docs/prometheus/latest/querying/functions/ "Prometheus: Functions"
[8]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/09/14/prometheus-compute-kubernetes-container-cpu-usage.html "通过Prometheus查询计算Kubernetes集群中的容器CPU、内存使用率等指标"
