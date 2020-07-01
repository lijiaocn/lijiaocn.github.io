---
layout: default
title: "数据仓库解惑：零基础入门（一）"
author: 李佶澳
date: "2020-06-26T15:48:34+0800"
last_modified_at: "2020-07-01T18:05:32+0800"
categories: 项目
cover:
tags: 数据仓库
keywords:
description: 从零开始学习数据仓库，经过连续多天的资料翻阅、看书看视频以及公开案例研究，总算搞清楚了数据仓库是干嘛的，以及要怎么建设。 
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

未完成，持续更新中

从零开始学习数据仓库，经过连续多天的资料翻阅、看书看视频以及公开案例研究，总算搞清楚了数据仓库是干嘛的，以及要怎么建设。 



## 为什么要有数据仓库？

为了方便查询。


## 概念构建

数据仓库构建思想两大流派：

* Bll Inmon 推崇：自上而下，从整个企业环境入手，基于 3 范式，建立统一的数据中心（EDW），构建数据集市，前端工具访问数据集市。
* Ralph Kimbal 推崇：自下而上，基于维度模型（星型模型/雪花模型），根据实际需求开发。

[youtube：两种流派的讲解](https://www.youtube.com/watch?v=U_xyt8A5y_s)

ETL（ Extrace/Transformation/Load）：清洗、转换、加载到数据仓库。

* ETL 是最耗时的过程
* 全量数据加载
* 增量数据加载
* ETL Job 任务调度设计
* 从灾备的数据库中抽取

原始细节数据 -> 当前细节数据（清洗后的数据）-> 轻度汇总数据  -> 高度汇总数据

数据仓库层次：

* STAGE 层： 与原始业务数据完全相同，临时性的
* ODS 层：   编码统一等处理后保留的细节数据，`符合 3 范式`
* MID 层：   MID 层，介于 DM（数据集市） 和 DW（数据湖） 之间，`反范式设计`，增加数据冗余（维度表和实时表）
* MRT 层：   最终展现的数据，多维模型，中高度的汇总数据

MID 层反范式设计举例：

情况1: 表没有主键，可以重复插入

```
时间维度   客户维度  金额
20131001    0001     100
20131001    0001     100
```

情况2: 字段之间冗余：

```
年编号   季度编号  月编号     日编号
2010     20201     2020112    202011202
```

元数据：

* 技术元数据：数据仓库的描述信息
* 业务元数据：

数据仓库和 OLAP 的关系是互补的，OLAD 从数据仓库中国呢抽取详细数据的子集。

OLAP 分为：

* 关系 OLAP,  RelationalOLAP，基于关系型数据库，ROLAP
* 多维 OLAP， MultidimensionalOLAP，MOLAP
* 混合型 OLAP， HOLAP 

## 维度和度量

每个分析角度是一个维，多角度分析称为多维分析，例如：时间、地域、产品、客户。

每个维度有层次粒度。

贷款分析模型：

```
维度：  时间   贷款银行    区域    贷款质量
        
时间维度的粒度： 年、季度、月
贷款银行的粒度： 总行、地方行
区域维度的粒度： 省、市
贷款质量的粒度： 合格、不合格
```

引入维度和维度粒度后，数据变成立体的，通过多个维度确定一个数据。

## 切片/切块/钻取/

切片/切块：设置多个维度条件，取出符合这些维度的数据。

上钻/下钻： 不良贷款又继续分为多种情况，细粒度向上是上钻，粗粒度向下是下钻。

旋转： 维度切换。

## 星型模型：事实表和维度表

事实表最简单的设计方式由维度 ID 和度量值组成：

```
id  dim1 dim2 dim3 ... measure1  meaure2...
```

维度表中的粒度是有层次的：

```
level1id level1name  属性...
level2id level2name  属性...
...

例如： 国家、省、地级市、县级市、镇、村 
```

缓慢变化维：维度表中信息发生变化。维度发生变化，有三种处理方式：

* type 1 scd，直接覆盖，与业务数据保持一致
* type 2 scd，新增一条变化后的维度记录，记下该记录的有效时间，在事实表中使用维度表的主键（Surrogate Keys）。
* type 3，把更新变化作为字段，譬如，当前城市、以往城市。

参考：[缓慢变化维的处理][2]

## 雪花模型：

对星型模型进一步层次化，将某些维度表扩展成事实表，表现为一个维度表会连接其它维度表。

## 视频教程

youtube：

1. [数据仓库系统及特点讲解](https://www.youtube.com/watch?v=YJASUNOUE-c)
2. [数据仓库设计思想及etl设计思想讲解](https://www.youtube.com/watch?v=JChO2jJCM_A&t=14s)
3. [数据仓库架构和概念](https://www.youtube.com/watch?v=pvLj2X8PAOs)
4. [数据仓库基本概念讲解](https://www.youtube.com/watch?v=nn8t0nS5Mm0)
5. [维度模型中的事实表](https://www.youtube.com/watch?v=7jcchVeyG0I)
6. [数据两种流派的讲解](https://www.youtube.com/watch?v=U_xyt8A5y_s)
7. [项目实践](https://www.youtube.com/watch?v=Zlrz0zQu9vU)
8. [Tableau、Microsoft BI Stack、Privot、View等大数据应用](https://www.youtube.com/watch?v=tJzryR4IOEU)

## 参考

1. [李佶澳的博客][1]
2. [缓慢变化维的处理][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.cnblogs.com/xqzt/p/4472005.html "缓慢变化维的处理"
