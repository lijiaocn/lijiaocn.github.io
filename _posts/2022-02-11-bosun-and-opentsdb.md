---
layout: default
title: "Bosun 和 OpenTSDB 的关系，以及查询语法"
author: 李佶澳
date: "2022-02-11 18:18:59 +0800"
last_modified_at: "2022-03-08 20:11:52 +0800"
categories: 项目
cover:
tags:
keywords: bosun,openstdb
description: 从多种 TSDB 数据库查询出 metric 数据，将查询结果转化成 Bosun 定义的数据类型后统一处理
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

Bosun 是一种监控告警的领域专用语言（DSL），支持从多种 TSDB 数据库查询出 metric 数据，将查询结果转化成 Bosun 定义的数据类型后统一处理，并提供了告警触发 、告警通知等功能。支持 [OpenTSDB][2] 、[Graphite][3]、Prometheus、influxDB 等。

## Bosun 启动

Bosun 提供一份 [docker-compose 文件][4]，用来在本地快速启动一个 Bosun 环境：

```sh
git clone https://github.com/bosun-monitor/bosun.git
cd bosun/docker
docker-compose up -d 
```

Bosun 服务地址：http://localhost:8070，OpenTSDB 服务地址：http://localhost:4242。

## Bosun 语法

[Bosun Expression][9] 详细介绍了 Bosun 表达式的语法。

定义了三种数值类型：

```sh
1. Scalar：一个独立数值
2. NumberSet：一组数值，每个分组只有一个对应数值
3. SeriesSet：一组数值，一个分组的时间序列数值
```

提供了多种查询函数 ：一部分是和底层的 TSDB 数据系统对应的查询函数，一部分是作用于以上三种数据类型的标准函数 。

和具体 TSDB 相关的函数，[Bosun Query Functions][10]：

```sh
# 查询 Azure
az(namespace string, metric string, tagKeysCSV string, rsg string, resName string, agType string, interval string, startDuration string, endDuration string) seriesSet
# 查询 Graphite
graphite(query string, startDuration string, endDuration string, format string) seriesSet
# 查询 InfluxDB
influx(db string, query string, startDuration string, endDuration, groupByInterval string) seriesSet
# 查询 Elastic
escount(indexRoot ESIndexer, keyString string, filter ESQuery, bucketDuration string, startDuration string, endDuration string) seriesSet
# 查询 OpenTSDB，query 是 OpenTSDB 的查询语句
q(query string, startDuration string, endDuration string) seriesSet
# 查询 Prometheus，
prom(metric, groupByTags, filter, agType, stepDuration, startDuration, endDuration string) seriesSet
# 查询 CloudWatch
cw(region, namespace, metric, period, statistic, dimensions, startDuration, endDuration string) seriesSet
```

基于 Bosun 数据类型的通用函数，[Bosun Reduction Functions][11]：

```sh
avg(seriesSet) numberSet
max(seriesSet) numberSet
dev(seriesSet) numberSet
first(seriesSet) numberSet
...
```

OpenTSDB 中查询`sum:sys.cpu{host=ny-*}`，计算每个分组的时间序列的平均值：

```sh
avg(q("sum:sys.cpu{host=ny-*}", "5m", "")) > 0.8
```

其中 “sum:sys.cpu{host=ny-*}” 是 OpenTSDB 的查询语句，表示查找指标 sys.cpu，按照 host 筛选并分组，sum 表示将隶属同一分组的同一时间点上的数值累加。OpenTSDB 的聚合策略见后文。

## Bosun 图形界面

items 里列出了所有的 metrics，graph 绘制图形：

![bosun图形界面]({{site.article}}/bosun-graph.png)

## OpenTSDB 查询语法

[OpenTSDB: Querying or Reading Data][8] 概要介绍了时序数据的查询方法和注意事项。

语句构成：开始时间、结束时间、指标名、聚合函数、过滤tag、降采样级别、计算比率、函数、运算符。

OpenTSDB 可以存储毫秒精度的数据，但是默认返回的是秒级数据。
如果底层数据时毫秒级别，查询语句中需要用降采样函数`1s-<func>`；如果查询毫秒级的原始数据，需要指定 msResolution。

一个时序数列由「指标名+标签 」确定，：

```sh
# metric      tags                   timestamp  value
sys.cpu.user host=webserver01,cpu=0  1356998400  1
sys.cpu.user host=webserver01,cpu=1  1356998400  4
sys.cpu.user host=webserver02,cpu=0  1356998400  2
sys.cpu.user host=webserver02,cpu=1  1356998400  1
```

降采样需要指定聚合函数和时间间隔，将指定时间内的数据样本聚合成一个。

对 counter 类型的指标可以计算变化率：
如果 counter 数值溢出了最大数值，OpenTSDB 2.0 会自动修正计算出正确的变化率；
如果 coutner 数值因为来源系统重启后归零，可以设置一个 resetValue，将超过该数值的变化率都修正为 0，避免出现计数规律导致的变化率毛刺。

查询语句的处理顺序：

```
Filtering
Grouping
Downsampling
Interpolation
Aggregation
Rate Conversion
Functions
Expressions
```

## OpenTSDB 聚合策略

OpenTSDB 的查询语句必须指定聚合策略，[OpenTSDB Aggregation][6]。这里的聚合指的的是：`隶属同一分组的、位于同一时刻`的多个数据加工成一个数值的策略，可以加和(sum)、取最大（max）、取最小（min）等等。

譬如：

```sh
sum:sys.cpu{} ：只有一个分组，将同一时刻的所有数值相加  
sum:sys.cpu{host=*}：按照 host 分组，将每个 host 组的同一时刻数值分别相加
```

bosun 中要用 bosun 的 q() 函数执行：

```sh
q("sum:linux.cpu{host=*,type=*}","5m","1m")
```

[Bosun Available Aggregators][12]：

![OpenTSDB聚合函数]({{ site.article}}/openstdb-aggr.png)




## OpenTSDB Cli


进入 OpenTSDB 容器，/tsdb/build 目录中存放的 cli 工具：tsdb。
```sh
$ docker  exec -it opentsdb /bin/sh
/hbase # cd /tsdb/build
/tsdb/build # ./tsdb
tsdb            tsdb-2.4.0.jar
/tsdb/build # ./tsdb -h
tsdb: error: unknown command '-h'
usage: tsdb <command> [args]
Valid commands: fsck, import, mkmetric, query, tsd, scan, search, uid, version
```

查询命令 [query][13]，展示聚合后的数据：

```sh
$ ./tsdb query 1h-ago  sum linux.cpu host=*
linux.cpu 1646733829000 2754632 {host=82c657fb8ee0}
linux.cpu 1646733844000 2763279 {host=82c657fb8ee0}
linux.cpu 1646733859000 2771904 {host=82c657fb8ee0}
```

调试命令 [scan][14]，展示参与聚合的原始数据：

```sh
./tsdb scan 1h-ago  sum linux.cpu  host=*
[0, 0, -12, 98, 39, 41, 32, 0, 0, 1, 0, 0, 1, 0, 0, 8, 0, 0, 71] linux.cpu 1646733600 (Tue Mar 08 10:00:00 GMT 2022) {host=82c657fb8ee0, type=guest}
  [14, 80]	[0]	229	l	1646733829	(Tue Mar 08 10:03:49 GMT 2022)
  [15, 64]	[0]	244	l	1646733844	(Tue Mar 08 10:04:04 GMT 2022)
  [16, 48]	[0]	259	l	1646733859	(Tue Mar 08 10:04:19 GMT 2022)
  [17, 32]	[0]	274	l	1646733874	(Tue Mar 08 10:04:34 GMT 2022)
  [18, 16]	[0]	289	l	1646733889	(Tue Mar 08 10:04:49 GMT 2022)
  ...
[0, 0, -12, 98, 39, 41, 32, 0, 0, 1, 0, 0, 1, 0, 0, 8, 0, 0, 72] linux.cpu 1646733600 (Tue Mar 08 10:00:00 GMT 2022) {host=82c657fb8ee0, type=guest_nice}
  [14, 80]	[0]	229	l	1646733829	(Tue Mar 08 10:03:49 GMT 2022)
  [15, 64]	[0]	244	l	1646733844	(Tue Mar 08 10:04:04 GMT 2022)
  [16, 48]	[0]	259	l	1646733859	(Tue Mar 08 10:04:19 GMT 2022)
  [17, 32]	[0]	274	l	1646733874	(Tue Mar 08 10:04:34 GMT 2022)
  ...
```


更多命令：[OpenTSDB cli tools][15]。

## 参考

1. [李佶澳的博客][1]
2. [Bosun Quick Start][2]
3. [Bosun Quick Start: Graphite][3]
4. [bosun/docker/][4]
5. [OpenTSDB User Guide][5]
6. [OpenTSDB Aggregation][6]
7. [OpenTSDB Query Filters][7]
8. [OpenTSDB: Querying or Reading Data][8]
9. [Bosun Expression][9]
10. [Bosun Query Functions][10]
11. [Bosun Reduction Functions][11]
12. [Bosun Available Aggregators][12]
13. [OpenTSDB cli query][13]
14. [OpenTSDB cli scan][14]
15. [OpenTSDB cli tools][15]

[1]: https://bosun.org/ "Bosun"
[2]: https://bosun.org/quickstart "Bosun Quick Start"
[3]: https://bosun.org/quickstart#graphite "Bosun Quick Start: Graphite"
[4]: https://github.com/bosun-monitor/bosun/tree/master/docker "bosun/docker/"
[5]: http://opentsdb.net/docs/build/html/user_guide/index.html "OpenTSDB  User Guide"
[6]: http://opentsdb.net/docs/build/html/user_guide/query/aggregators.html "OpenTSDB Aggregation"
[7]: http://opentsdb.net/docs/build/html/user_guide/query/filters.html "OpenTSDB Query Filters"
[8]: http://opentsdb.net/docs/build/html/user_guide/query/index.html "OpenTSDB: Querying or Reading Data"
[9]: https://bosun.org/expressions#reduction-functions "Bosun Expression"
[10]: https://bosun.org/expressions#query-functions "Bosun Query Functions"
[11]: https://bosun.org/expressions#reduction-functions "Bosun Reduction Functions"
[12]: http://opentsdb.net/docs/build/html/user_guide/query/aggregators.html#available-aggregators "Bosun Available Aggregators"
[13]: http://opentsdb.net/docs/build/html/user_guide/cli/query.html "OpenTSDB cli query"
[14]: http://opentsdb.net/docs/build/html/user_guide/cli/scan.html "OpenTSDB cli scan"
[15]: http://opentsdb.net/docs/build/html/user_guide/cli/index.html "OpenTSDB cli tools"
