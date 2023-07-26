---
layout: default
title: "Grafana 高频功能的使用方法"
author: 李佶澳
date: "2023-07-25 19:08:10 +0800"
last_modified_at: "2023-07-26 16:12:27 +0800"
categories:  技巧
cover:
tags: grafana
keywords:
description: "要实现变量值的映射，比如在面板上选择时显示「上海」，选中后对应的变量值是「SH」。要实现这个效果，需要通过 Custom 类型的变量。在它的可用值中用「key : value,key : value,...」的格式填入映射"
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

有些功能很长时间不用，具体用法忘到一点都想不起来，这里记录一下，用到一个功能记录一个功能。

## 筛选变量的定义和使用

[Grafana Variable syntax][2]。在 Dashboard Setting 的 Variable 中添加变量。变量的 value 可以指定一个数据源，然后写一个对应的查询语句从数据源中获取。

### 变量值的引用

在面板的查询语句中用 $ 或者 ${} 引用变量，例如针对 prometheus 数据源的查询语句中使用变量：

```sh
agent_metric_online{provider=~"${provider:pipe}",province=~"${province:pipe}",city=~"${city:pipe}",isp=~"${isp:pipe}"}
```

### 变量值的格式调整

特别是支持多选的变量，在使用的时候可能需要根据数据源进行格式转换。Grafana 提供多种转换函数，具体间 [Grafana Variable syntax][2]。

比如 pipe 将数组转换成｜分隔的字符串：

```
servers = ['test1.', 'test2']
String to interpolate: '${servers:pipe}'
Interpolation result: 'test1.|test2'
```

### 变量名成和数值的映射

要实现变量值的映射，比如在面板上选择时显示「上海」，选中后对应的变量值是「SH」。要实现这个效果，需要通过 Custom 类型的变量。在它的可用值中用「key : value,key : value,...」的格式填入映射。比如：

```sh
北京市 : BJ,上海市 : SH,天津市 : TJ
```

## 更改坐标轴单位

在 panel 的编辑页面右侧找 Axes -> Left Y -> Unit，下拉列表中有多种单位可选。数值默认是 short，如果要显示成用「,」分隔的数字，选择 Misc-> Locale format。

## 参考

1. [李佶澳的博客][1]
2. [Grafana Variable syntax][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/ "Grafana Variable syntax"
