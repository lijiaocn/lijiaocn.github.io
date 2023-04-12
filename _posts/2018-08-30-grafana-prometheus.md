---
layout: default
title:  "kubernetes 集群状态监控：通过 grafana 和 prometheus"
author: 李佶澳
createdate: 2018/08/30 15:59:00
last_modified_at: 2018/08/31 18:23:21
categories: 技巧
tags: prometheus kubernetes
keywords: promethues,grafana,kubernetes
description: grafana和prometheus是现在最常用的组合，grafana提供了监控kubernetes集群的插件

---

* auto-gen TOC:
{:toc}

## 说明

grafana和prometheus是现在最常用的组合，grafana提供了监控kubernetes集群的插件。

## Kubernetes

Kubernetes集群的

## Prometheus

Promehtues的使用在[新型监控告警工具prometheus（普罗米修斯）入门使用][7]中已经做了介绍，这里就不重复了。

这里使用的Prometheus配置文件如下：

## Grafana

### Grafana下载安装

这里直接下载二进制包：

	wget https://s3-us-west-2.amazonaws.com/grafana-releases/release/grafana-5.2.3.linux-amd64.tar.gz
	tar -zxvf grafana-5.2.3.linux-amd64.tar.gz

解压以后得到的文件：

	$ ls grafana-5.2.3
	LICENSE.md  NOTICE.md  README.md  VERSION  bin  conf  public  scripts  tools

启动：

	ln -s `pwd`/conf /etc/grafana
	./bin/grafana-server -config /etc/grafana/defaults.ini &

然可以通过`ip:3000`访问grafana，初始用户名和密码均为`admin`。

### Grafana启动

grafana的使用比较简单，页面做的很友好。

首先添加数据源，grafana支持的有：

	CloudWatch
	Elasticsearch
	Graphite
	InfluxDB
	Microsoft SQL Server
	MySQL
	OpenTSDB
	PostgreSQL
	Prometheus
	...

这里以添加Prometheus为例，直接填入Prometheus的地址即可，如果有账号和证书，一并添加。

测试通过之后，可以添加DashBoard。

DashBoard可以自己进行定制，也可以直接到[grafana dashboards][3]查找其他人共享的Dashboard，然后在grafana中导入即可。

### 安装kubernetes插件

Grafana有很多[插件][4]，[grafana-kubernetes-app][5]是一个比较好用的kubernetes插件：


	$ ./bin/grafana-cli  --pluginsDir ./data/plugins/ plugins install grafana-kubernetes-app
	installing grafana-kubernetes-app @ 1.0.1
	from url: https://grafana.com/api/plugins/grafana-kubernetes-app/versions/1.0.1/download
	into: ./data/plugins
	✔ Installed grafana-kubernetes-app successfully
	Restart grafana after installing plugins . <service grafana-server restart>

安装plugin之后需要重启grafana。

重启以后，进入grafana首页，将`kubernetes enable`之后，左侧边栏就会多处一个kubernetes的图标。

## 问题

### Grafana K8S Container的DashBoard打开时加载所有Pod信息，导致页面打不开的问题

进入DashBoard之后，点击右上角的`Setting图标`，进入DashBoard的设置页面，然后点击左侧`Variables`，在右侧会看到所有的变量，
点击要修改的变量，重新设置All的默认值即可。

参考：[grafana dashboard variables][6]

### 修改插件代码

可以考虑自己修改代码：

	$ cd data/plugins/grafana-kubernetes-app/
	$ npm install
	$ npm install grunt-cli

修改之后重新编译代码：

	grunt default

## 参考

1. [grafana website][1]
2. [grafana download][2]
3. [grafana dashboards][3]
4. [grafana plugins][4]
5. [grafana kubernetes plugin][5]
6. [grafana dashboard variables][6]
7. [新型监控告警工具prometheus（普罗米修斯）入门使用][7]

[1]: https://grafana.com/  "grafana website" 
[2]: https://grafana.com/grafana/download  "grafana download" 
[3]: https://grafana.com/dashboards "grafana dashboards"
[4]: https://grafana.com/plugins "grafana plugins"
[5]: https://grafana.com/plugins/grafana-kubernetes-app "grafana kubernetes plugin"
[6]: http://docs.grafana.org/reference/templating/ "grafana dashboard variables"
[7]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/08/03/prometheus-usage.html "新型监控告警工具prometheus（普罗米修斯）入门使用"
