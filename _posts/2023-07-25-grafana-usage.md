---
layout: default
title: "Grafana 面版配置中常常用到的操作"
author: 李佶澳
date: "2023-07-25 19:08:10 +0800"
last_modified_at: "2024-04-16 18:02:41 +0800"
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

有些软件很长时间不用以后，用法会忘到一点都想不起来，每次都要重新学习。这里做个记录。

## 筛选项变量的定义和使用

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

### 变量名称和数值的映射

要实现变量值的映射，比如在面板上选择时显示「上海」，选中后对应的变量值是「SH」。要实现这个效果，需要通过 Custom 类型的变量。在它的可用值中用「key : value,key : value,...」的格式填入映射。比如：

```sh
北京市 : BJ,上海市 : SH,天津市 : TJ
```

### 获取 prometheus 标签

变量类型为 Query 时，可以从 Prometheus 数据源中查询 label value 作为变量的可用值。在 query 使用 label_values 函数获取：label_values(cluster)。该函数是 grafana 提供。

## 更改坐标轴单位

在 panel 的编辑页面右侧找 Axes -> Left Y -> Unit，下拉列表中有多种单位可选。数值默认是 short，如果要显示成用「,」分隔的数字，选择 Misc-> Locale format。

## 图表调整

### 调整 pie chart 饼图的颜色 

边界状态，直接在点击 legend 前面的颜色条，会弹出颜色选项。

### 调整 legend 格式

在编辑页面中点击 Transform，添加 Rename by regex，可以通过正则匹配修改 legend。

### 调整表格中的字段

编辑页面中，在侧边栏的 Visualization 中选择 Table，将图表显示为表格。

在 Qeury tab 中，Format 设置为 table，开启 instant（只显示最新值）。

在 Transform 中添加 Organize Fields，然后就可以看到所有字段，可以调整为隐藏/显示。


## 参考

1. [李佶澳的博客][1]
2. [Grafana Variable syntax][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://grafana.com/docs/grafana/latest/dashboards/variables/variable-syntax/ "Grafana Variable syntax"
