---
layout: default
title: "Prometheus 水平扩展方案（一）：监控数据的转储、聚合、查询"
author: 李佶澳
date: "2020-02-12T08:55:50+0800"
last_modified_at: "2020-02-12T08:55:50+0800"
categories: 项目
cover:
tags:  prometheus monitor
keywords: tsdb,prometheus,prometheus扩展,监控数据存储
description: Prometheus 自带的时序数据库不支持集群模式，不能承接海量的时序数据，社区提供了多个方案
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

Prometheus 自带的时序数据库不支持集群模式，难以承接海量的时序数据。RemoteRead 和 RemoteWrite 机制，主要解决了数据的存放问题，海量数据的查询依然是严重的瓶颈。

## VictoriaMetrics

[VictoriaMetrics][10] 实现了 Prometheus 数据的汇聚、转储、查询，支持 PromQL。

日本游戏公司 colopl 在 2020年1月15日分享了实践经验，考察 Cortex、thanos、m3db、Victoria Metrics 之后，选用了 Victoria Metrics。

colopl 表示：

    cortex过于复杂，没有正式 release；
    使用 thanos，prometheus 通过 thanos 进行 remote read 内存开销增加1倍，oom；
    m3db 复杂，学习、管理成本高。

2020年1月15日用日语分享的：

youtube 视频：[Large-scale, super-load system monitoring platform built with VictoriaMetrics][13]

PPT：[monitoring-platform-with-victoria-metrics][14]

一台 Prometheus 承载 8000 Pod 时，运转正常：

![单机支撑 8000 Pod]({{ site.article }}/victoria-1.png)

VictoriaMetrics 能够承接 1 万 Pod：

![多集群支撑了 10000 pod]({{ site.article }}/victoria-2.png)

VictoriaMetrics 的系统架构如下:

![VictoriaMetrics的系统架构]({{ site.article }}/victoria_metrics_arch.png)

VictoriaMetrics 的使用方法见后续文章。

## Cortex

[Cortex][6] 基于 Prometheus 实现，支持水平扩展、支持 PromQL，CNCF 沙盒项目。

## Thanos

[Thanos][12] 实现了 Prometheus 数据的汇聚、转储、查询，支持 Prometheus’ v1 API，CNCF 沙盒项目。

## M3DB

[M3DB][8] 是 Uber 开源的分布式时间序列数据库。

## 参考

1. [李佶澳的博客][1]
2. [Cortex][6]
3. [CrateDB][7]
4. [M3DB][8]
5. [QuasarDB][9]
6. [VictoriaMetrics][10]
7. [InfluxDB][11]
8. [Thanos][12]
9. [Large-scale, super-load system monitoring platform built with VictoriaMetrics][13]
10. [monitoring-platform-with-victoria-metrics][14]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.taosdata.com/cn/ "taos"
[3]: https://www.taosdata.com/blog/2020/01/13/%e7%94%a8influxdb%e5%bc%80%e6%ba%90%e7%9a%84%e6%80%a7%e8%83%bd%e6%b5%8b%e8%af%95%e5%b7%a5%e5%85%b7%e5%af%b9%e6%af%94influxdb%e5%92%8ctdengine/ "用InfluxDB开源的性能测试工具对比InfluxDB和TDengine"
[4]: https://www.taosdata.com/cn/getting-started/ "taos 使用方法"
[5]: https://www.taosdata.com/cn/documentation/ "TDengine文档"
[6]: https://www.weave.works/oss/cortex/ "cortex"
[7]: https://crate.io/ "CrateDB"
[8]: https://www.m3db.io/ "M3DB"
[9]: https://www.quasardb.net/ "QuasarDB"
[10]: https://victoriametrics.com/ "VictoriaMetrics"
[11]: https://www.influxdata.com/ "InfluxDB"
[12]: https://thanos.io/quick-tutorial.md/ "Thanos"
[13]: https://www.youtube.com/watch?v=hUpHIluxw80 "Large-scale, super-load system monitoring platform built with VictoriaMetrics"
[14]: https://speakerdeck.com/inletorder/monitoring-platform-with-victoria-metrics  "monitoring-platform-with-victoria-metrics"
