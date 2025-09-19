---
layout: default
title: "通过 prometheus 查询计算Kubernetes集群中的容器CPU、内存使用率等指标"
author: 李佶澳
createdate: "2018-09-14 13:36:26 +0800"
last_modified_at: "2023-04-12 16:40:54 +0800"
categories: 技巧
tags: prometheus
keywords: prometheus,kubernetes,cpu usage,mem usage
description: Kubernetes的kubelet组件内置了cadvisor，将Node上容器的指标以Prometheus支持的格式展示，可以通过这些指标计算得到更多有用的数据。
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

Kubernetes的kubelet组件内置了cadvisor，将Node上容器的指标以Prometheus支持的格式展示，可以通过这些指标计算得到更多有用的数据。

## Kubelet的Cadvisor指标获取

直接访问Kubelet的10255端口，可以读取以Prometheus支持的格式呈现的指标：

	$ curl http://192.168.88.10:10255/metrics/cadvisor
	# HELP cadvisor_version_info A metric with a constant '1' value labeled by kernel version, OS version, docker version, cadvisor version & cadvisor revision.
	# TYPE cadvisor_version_info gauge
	cadvisor_version_info{cadvisorRevision="",cadvisorVersion="",dockerVersion="17.05.0-ce",kernelVersion="3.10.0-693.11.6.el7.x86_64",osVersion="CentOS Linux 7 (Core)"} 1
	# HELP container_cpu_load_average_10s Value of container cpu load average over the last 10 seconds.
	# TYPE container_cpu_load_average_10s gauge
	container_cpu_load_average_10s{container_name="",id="/",image="",name="",namespace="",pod_name=""} 1
	container_cpu_load_average_10s{container_name="POD",id="/kubepods.slice/kubepods-besteffort.slice/kubepods-besteffort-pod1a666636_a687_11e8_9cc4_525400160f15.slice/docker-e433276784317535e206d33e8e703a7360de86402c8b3e0b335e0d8071edde72.scope",image="registry.aliyuncs.com/archon/pause-amd64:3.0",name="k8s_POD_prometheus-node-exporter-4mck8_default_1a666636-a687-11e8-9cc4-525400160f15_1",namespace="default",pod_name="prometheus-node-exporter-4mck8"} 0
	...

在Prometheus的配置文件中，配置了相关的Target之后，这些指标就可以从Prometheus中查询到。见：[新型监控告警工具prometheus（普罗米修斯）入门使用（附视频讲解）][1]

## 容器CPU使用率的计算

从`man top`手册中找到了CPU使用率的定义：

	1. %CPU  --  CPU Usage
	  The task's share of the elapsed CPU time since the last screen update, expressed as a percentage of total CPU time.
	
	  In a true SMP environment, if a process is multi-threaded and top is not operating in Threads mode, amounts greater
	  than 100% may be reported.  You toggle Threads mode with the `H' inter-active command.
	
	  Also for multi-processor environments, if Irix mode is Off, top will operate in Solaris mode where a task's cpu usage
	  will be divided by the total number of CPUs.  You toggle Irix/Solaris modes with the `I' interactive command.

即在过去的一段时间里进程占用的CPU时间与CPU总时间的比率，如果有多个CPU或者多核，需要将每个CPU的时间相加。

kubelet中的cadvisor采集的指标与含义，见：[Monitoring cAdvisor with Prometheus][2]。

其中有一项是：

	container_cpu_usage_seconds_total 	Counter 	Cumulative cpu time consumed 	seconds

`container_cpu_usage_seconds_total`是container累计使用的CPU时间，用它除以CPU的总时间，就得到了容器的CPU使用率：

先计算出容器的CPU占用时间，因为Node上的CPU有多个，需要将容器在每个CPU上占用的时间累加起来：

	sum(
	   delta(
	       container_cpu_usage_seconds_total
	           {container_name="webshell",pod_name="webshell-rc-8wjhv"}[1m]
	   )
	) 

然后计算CPU的总时间，这里的CPU数量是容器分配到CPU数量，公式如下：

	sum(
	    container_spec_cpu_quota
	        {container_name="webshell",pod_name="webshell-rc-8wjhv"}
	) / 1000 * 60

`container_spec_cpu_quota`是容器的CPU配额，它的值是：为容器指定的CPU个数*100000。

将上面两个公式的结果相除，就得到了容器的CPU使用率：

	sum(
	   delta(
	       container_cpu_usage_seconds_total
	           {container_name="webshell",pod_name="webshell-rc-8wjhv"}[1m]
	   )
	) 
	/ 
	( sum(
	    container_spec_cpu_quota
	        {container_name="webshell",pod_name="webshell-rc-8wjhv"}
	  ) / 1000 * 60
	)

写成一行就是：

	sum(delta(container_cpu_usage_seconds_total{container_name="webshell",pod_name="webshell-rc-8wjhv"}[1m])) / (sum(container_spec_cpu_quota{container_name="webshell",pod_name="webshell-rc-8wjhv"}) /100000 * 60)

上面使用`delta()`计算增量，算的是1m中内的时间变化，用`rate()`直接计算比率更好：

	sum(rate(container_cpu_usage_seconds_total{container_name="webshell",pod_name="webshell-rc-8wjhv"}[1m])) / (sum(container_spec_cpu_quota{container_name="webshell",pod_name="webshell-rc-8wjhv"}/100000))
	

如果要同时计算所有容器的CPU使用率：

	(sum(rate(container_cpu_usage_seconds_total{container_name!="",pod_name!=""}[1m])) by(cluster,namespace,container_name,pod_name))/(sum(container_spec_cpu_quota{container_name!="",pod_name!=""}) by(cluster,namespace,container_name,pod_name) /100000)*100
	

## 容器内存使用率的计算

容器内存使用率的计算就简单多了，直接用CPU使用量除以CPU配额即可：

	container_memory_rss{container_name="webshell",pod_name="webshell-rc-8wjhv"}
	/
	container_spec_memory_limit_bytes{container_name="webshell",pod_name="webshell-rc-8wjhv"}

## 计算Node CPU的空闲率

	avg(rate(node_cpu_seconds_total{mode="idle"}[1m])) by (cluster,instance,nodename) < 0.1

## 参考

1. [新型监控告警工具prometheus（普罗米修斯）入门使用（附视频讲解）][1]
2. [Monitoring cAdvisor with Prometheus][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/03/prometheus-usage.html "新型监控告警工具prometheus（普罗米修斯）入门使用（附视频讲解）"
[2]: https://github.com/google/cadvisor/blob/2fa6c624a2b22004ef437c0798c0253189b2f01f/docs/storage/prometheus.md "Monitoring cAdvisor with Prometheus"
