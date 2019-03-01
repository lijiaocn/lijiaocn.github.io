---
layout: default
title: "系统性能分析方法论：统计图谱工具"
author: 李佶澳
createdate: "2019-03-01 15:09:50 +0800"
changedate: "2019-03-01 18:27:00 +0800"
categories: 方法
tags: linux 基础知识
keywords: 系统性能分析,火焰图,延迟热图,直方图,统计图表
description: 精心设计的统计图片能够将采集的系统状态数据以非常直观的方式呈现出来，揭示数据中蕴含的重要信息
---

* auto-gen TOC:
{:toc}

## 说明

一些经过精心设计的图片可以将不易读的数据以非常直观的方式呈现出来，揭示数据中蕴含的重要信息。

持续更新...

## 延迟热图，Latency Heat Maps

每个时刻都有一张分布直方图，将它们从二维平面上揭起竖立，然后按时间顺序挤压到一起成为一个三维物体，从上方看到的这个三维物体的平面图就是延迟热图，[Latency Heat Maps][1]中有详细介绍。

![延迟热图，Latency Heat Maps](http://www.brendangregg.com/HeatMaps/latency-heatmap.svg)

每一列都是一张直方图的，颜色越深表示方柱越高，竖坐标是直方图的统计的数值范围，横坐标是时间轴。

Brendan Gregg在进行延迟分析的时候发明该图，这个图片很好展示了数值分布随时间变换的情况。

## 火焰图，Flame Graphs

通过定时采样的方式探测到每个函数的运行时间，然后将这些函数按照调用关系堆放，被调用的位于上方，位于同一层的函数按照它们运行时间（在采样数据中的比例）分配占用的宽度，得到图片就是[火焰图][2]，[Flame Graphs][2]。

![火焰图，Flame Graphs](http://www.brendangregg.com/FlameGraphs/cpu-mysql-updated.svg)

哪个函数是系统瓶颈在火焰图中一目了然：`位于平顶位置函数`。理想的火焰图中应当全部是尖峰，表示每一个函数都很快运行结束，如果出现平顶，说明平顶的函数运行时间较长，需要被优化，平顶越高优化后效果越显著。

火焰图相关笔记：

1. [Web开发平台OpenResty（三）：火焰图性能分析](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/11/02/openresty-study-03-frame-md.html)

2. [火焰图生成工具nginx-systemtap-toolkit使用时遇到的问题](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/12/06/nginx-systemtap-toolkit-usage-md.html)

## 参考

1. [Latency Heat Maps][1]
2. [Flame Graphs][2]

[1]: http://www.brendangregg.com/HeatMaps/latency.html "Latency Heat Maps"
[2]: http://www.brendangregg.com/flamegraphs.html "Flame Graphs"
