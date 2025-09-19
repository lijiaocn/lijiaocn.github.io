---
layout: default
title: "grafana 的日常使用，入门学习，面板变量关联设置方法等"
author: 李佶澳
date: "2020-02-25T22:42:37+0800"
last_modified_at: "2020-02-25T22:42:37+0800"
categories:
cover:
tags: monitor
keywords:
description:
---

## 本篇目录

* auto-gen TOC:
{:toc}

## Grafana 高可用

[how-to-setup-grafana-for-high-availability][7] 默认使用数据存放 session，如果要卸载压力配置 remote_cache。

## Grafana 面板变量关联

如下图所示，选定 Namespace 之后，Deployment 下拉列表的内容自动变成选中的 namespace 中的 deployment： 

![grafana 的变量管理]({{ site.article }}/grafana-var-link.png)  

变量 Namespace 定义：

![name变量定义]({{ site.article }}/grafana-var-namespace.png)

Deployment 的定义中可以引用变量 Namespace，从而实现联动：

![deployment定义]({{ site.article }}/grafana-var-deloyment.png)

参考 [query-expressions][2]：

>One thing to note is that query expressions can contain references to other variables and in effect create linked variables. Grafana will detect this and automatically refresh a variable when one of it’s containing variables change.

## grafana 面板

[grafana/dashboards](https://grafana.com/grafana/dashboards)

## 添加用户

[grafana 添加用户][4]

## 配置文件

[grafana 配置文件说明][5]

## 安装插件 

Grafana 支持插件，直接用 grafana-cli 安装，插件安装在 /var/lib/grafana/plugins 中，例如 [Boom Theme][9]：

```sh
grafana-cli plugins install yesoreyeram-boomtheme-panel
```

安装之后需要重启 grafana。

## 告警配置

只有 Graph 支持告警，告警的 query 中不能使用模版变量，否则：Template variables are not supported in alert queries。 

[Grafana 邮件告警配置](https://www.jianshu.com/p/2b230390f37e)

[告警规则](https://grafana.com/docs/grafana/latest/alerting/rules/)

## 参考

1. [李佶澳的博客][1]
2. [grafana query-expressions][2]
3. [grafana getting_started][3]
4. [grafana 添加用户][4]
5. [grafana 配置文件说明][5]
6. [Grafana的基本概念][6]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://grafana.com/docs/grafana/latest/reference/templating/#query-expressions "query-expressions"
[3]: https://grafana.com/docs/grafana/latest/guides/getting_started/ "grafana getting_started"
[4]: https://blog.csdn.net/GX_1_11_real/article/details/85119451 "grafana 添加用户"
[5]: https://grafana.com/docs/grafana/latest/installation/configuration/ "grafana 配置文件说明"
[6]: https://yunlzheng.gitbook.io/prometheus-book/part-ii-prometheus-jin-jie/grafana/grafana-intro "Grafana的基本概念"
[7]: https://grafana.com/docs/grafana/latest/tutorials/ha_setup/#how-to-setup-grafana-for-high-availability  "how-to-setup-grafana-for-high-availability"
[8]: https://grafana.com/grafana/plugins/yesoreyeram-boomtheme-panel/installation "Boom Theme"
