---
layout: default
title: "时间序列数据库 taos TDengine 简单学习"
author: 李佶澳
date: "2020-02-12T16:34:59+0800"
last_modified_at: "2020-02-12T16:34:59+0800"
categories: 项目
cover:
tags: tsdb
keywords: tsdb,时间序列存储,时间序列数据库,监控数据存储,涛思
description: TDengine 是国内的涛思数据在 2019 下半年推出的时间序列数据库，官宣的性能十分感人
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

[taos][2] 是 2019 年下半年在朋友圈刷屏的项目，国内公司开发的专注于时间序列的存储，官宣的性能报告十分感人。

![涛思TDengine性能报告]({{ site.article }}/taos-perf.png)

[用InfluxDB开源的性能测试工具对比InfluxDB和TDengine][3]

## 安装

```sh
$ yum install TDengine-server-1.6.5.5-Linux-x64.rpm
```

配置文件：

```sh
/etc/taos/taos.cfg
```

启动：

```sh
$ systemctl start taosd
```

## 使用

操作 taos：

```sh
$ taos

Welcome to the TDengine shell from linux, community client version:1.6.5.5 community server version:1.6.5.5
Copyright (c) 2017 by TAOS Data, Inc. All rights reserved.

taos>
```

如果遇到下面的问题，在 /etc/taos/taos.cfg 中设置 local 和 charset：

```
Welcome to the TDengine shell from linux, community client version:1.6.5.5 02/12 01:28:31.055738 4303 7f1de0216740 ERROR UTL can't get locale from system
Invalid locale:, please set the valid locale in config file
failed to get charset, please set the valid charset in config file
```

```sh
# system locale
locale                en_US.UTF-8
# default system charset
charset               UTF-8
```

写入查询：

```sh
create database db;
use db;
create table t (ts timestamp, speed int);
insert into t values ('2019-07-15 00:00:00', 10);
insert into t values ('2019-07-15 01:00:00', 20);
select * from t;
          ts          |   speed   |
===================================
 19-07-15 00:00:00.000|         10|
 19-07-15 01:00:00.000|         20|
Query OK, 2 row(s) in set (0.001700s)
```

更详细的说明文档：[TDengine文档][5]。

## 注意事项

1. 每个采集点使用独立的表，每个采集点的数据存放位置连续；
2. 如果一个采集点有多组不同频率的采样，对应建立多张表；
3. 落盘时间默认一小时一次，缓存数据达到一定数量时落盘；
4. 数据默认保存时间 3650 天；
5. 通过超级表管理大量相同格式的子表（每个采集点对应的表）；
6. 标签在超级表中定义，最多 6 个；
7. 创建子表时选定超级表，并给出标签值;
8. 只对时间建立索引；
9. 可以在写数据时自动建立子表；

## 参考

1. [李佶澳的博客][1]
2. [taos][2]
3. [用InfluxDB开源的性能测试工具对比InfluxDB和TDengine][3]
4. [taos 使用方法][4]
5. [TDengine文档][5]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.taosdata.com/cn/ "taos"
[3]: https://www.taosdata.com/blog/2020/01/13/%e7%94%a8influxdb%e5%bc%80%e6%ba%90%e7%9a%84%e6%80%a7%e8%83%bd%e6%b5%8b%e8%af%95%e5%b7%a5%e5%85%b7%e5%af%b9%e6%af%94influxdb%e5%92%8ctdengine/ "用InfluxDB开源的性能测试工具对比InfluxDB和TDengine"
[4]: https://www.taosdata.com/cn/getting-started/ "taos 使用方法"
[5]: https://www.taosdata.com/cn/documentation/ "TDengine文档"
