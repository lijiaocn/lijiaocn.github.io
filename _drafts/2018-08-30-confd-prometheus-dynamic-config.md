---
layout: default
title: 通过consul、confd，动态为prometheus添加监控目标和告警规则
author: 李佶澳
createdate: 2018/08/30 10:40:00
changedate: 2018/09/10 08:34:07
categories: 技巧
tags: prometheus
keywords: prometheus,consul,confd,服务发现
description: 通过consul向prometheus中注册监控目标，通过confd动态生成告警规则

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

在[新型监控告警工具prometheus（普罗米修斯）入门使用][1]简单提到了Prometheus的服务发现功能。

这里结合一个更具体的场景演示一下，视频在准备中：[网易云课堂·IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)。

## 目标和方案

目标：动态地为Prometheus添加监控目标（目标IP）和告警规则。

方案：将监控目标以Service形态写入到[consul][3]中，prometheus通过服务发现，自动从consul发现监控目标。
告警规则用key-value的方式记录在consul中，[confd][2]监测consul中的数据，自动更新告警规则文件并通知prometheus加载。

consul的使用：[服务治理工具consul的功能介绍与使用入门][3]。

confd的使用：[配置文件动态生成工具confd的使用][2]。

## 配置prometheus，动态发现监控目标

确定要在consul中写入的监控目标的格式，约定格式如下：

	$ cat app1_server.json
	{
	  "Name": "11@app1@ip@10.10.192.35",
	  "Tags": [
	    "icmp"
	  ],
	  "Address": "10.10.192.35",
	  "EnableTagOverride": false
	}

其中Name是由多个信息拼接而成的，这些信息中的一部分将被拆分出来作为指标上的label。

通过consul的api写入：

	curl --request PUT --data @app1_server.json  http://127.0.0.1:8500/v1/agent/service/register

在prometheus的配置文件中，添加服务发现`consul_sd_configs`：

	scrape_configs:
	  - job_name: "ip_icmp_detect_from_consul"
	    consul_sd_configs:
	    - server: 10.10.199.154:8500
	    scheme: http
	    metrics_path: /probe
	    params:
	      module: [icmp]
	    relabel_configs:
	    - action: keep
	      source_labels: [__meta_consul_tags]
	      regex: '.*,icmp,.*'
	    - source_labels: [__meta_consul_service]
	      regex: '(.+)@(.+)@(.+)@(.+)'
	      replacement: ${1}
	      target_label: alert_id
	    - source_labels: [__meta_consul_service]
	      regex: '(.+)@(.+)@(.+)@(.+)'
	      replacement: ${2}
	      target_label: app
	    - source_labels: [__meta_consul_service]
	      regex: '(.+)@(.+)@(.+)@(.+)'
	      replacement: ${3}
	      target_label: type
	    - source_labels: [__address__]
	      regex: (.+):(.+)
	      replacement: ${1}
	      target_label: __param_target
	    - source_labels: [__param_target]
	      target_label: instance
	    - target_label: __address__
	      replacement:  10.10.199.154:9115
	    - source_labels: [__address__]
	      regex: (.+):(.+)
	      replacement: consul
	      target_label: from

注意其中的source_labels配置，将名字中的信息解析出来以后，设置成了label。

这样配置之后，就可以在prometheus的页面中看到写入consul中的service。

## 配置confd，动态更新告警规则

prometheus的告警规则文件是独立的yml文件，用confd监控consul中的规则，动态生成告警规则文件。

这里使用的告警规则如下：

{% raw %}

	$ cat app1_rule.yml
	- alert: HAWKEYE_APP1_IP_UNREACHABLE
	  expr: probe_success{app="app1",instance="10.10.192.35"} == 0
	  for: 120s
	  labels:
	    level: 1
	  annotations:
	    summary:  app is {{ $labels.app }}，ip is {{ $labels.instance }}，alert id is {{ $labels.alert_id }}

{% endraw %}

调用consul的api，写入到consul中，注意这里是kv的方式：

	$ curl -X PUT --data-binary @app1_rule.yml  127.0.0.1:8500/v1/kv/prometheus/rules/app1_rule

然后配置confd.d/config.toml：

	$ cat conf.d/ip_detect.toml
	[template]
	src = "ip_detect_rules.conf.tmpl"
	dest = "/etc/prometheus/ip_detect_rules.conf"
	keys = [
		"/prometheus/rules/ip",
	]
	check_cmd = "touch /tmp/check"
	reload_cmd = "systemctl reload prometheus"

注意reload_cmd，是通知prometheus重新加载规则文件的命令。

写一下配置模版文件:

{% raw %}

	$ cat templates/ip_detect_rules.conf.tmpl
	groups:
	- name: container_cpu_usage_increase_rate
	  rules:{{range getvs "/prometheus/rules/ip/*"}}
	{{.}}{{end}}

{% endraw %}

在promethues的配置文件引入confd生成的最终文件`ip_detect_rules.yml`：

	rule_files:
	  - "alert_rule.yml"
	  - "ip_detect_rules.yml"

confd默认的探测时间是600秒，启动的时候可以指定一个更短的时间，例如10秒（`--interval 10`）:

	./confd -interval 10 -log-level info -confdir ./ -config-file config.toml -backend consul -node 127.0.0.1:8500 &

## 告警配置

告警用alertmanager管理，没有需要特别配置的地方：[alertmanager使用][4]。

## 参考

1. [新型监控告警工具prometheus（普罗米修斯）入门使用][1]
2. [配置文件动态生成工具confd的使用][2]
3. [服务治理工具consul的功能介绍与使用入门][3]
4. [alertmanager使用][4]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/03/prometheus-usage.html  "新型监控告警工具prometheus（普罗米修斯）入门使用" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/22/confd-usage.html  "配置文件动态生成工具confd的使用" 
[3]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/17/consul-usage.html "服务治理工具consul的功能介绍与使用入门"
[4]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/03/prometheus-usage.html#alertmanager "alertmanager使用"
