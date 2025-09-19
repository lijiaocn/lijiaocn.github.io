---
layout: default
title: "web 框架的性能基准测试方法和测试结果 webframework benchmark"
author: 李佶澳
date: "2020-01-17T18:54:04+0800"
last_modified_at: "2020-01-17T18:54:04+0800"
categories: 方法
cover:
tags: benchmark
keywords: benchmark,web框架测试
description: TechEmpower 在 Web Framework Benchmarks 中提出了 7 个场景
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

[Server-side I/O Performance: Node vs. PHP vs. Java vs. Go][2] 介绍了 webserver 的技术演进过程（多进程->多线程->单进程事件回调->协程），值得一读。文中有两项内容值得留意，第一个是 cpu 主频与时钟的换算关系，另一个是基准测试方法。

## CPU 主频的时间换算

1GHz 主频每 1 纳秒（10^-9秒）发生一次时钟嘀嗒，3Ghz 主频每 1 纳秒发生三次时钟嘀嗒。嘀嗒（cycle） 是 cpu 的指令执行步长，一纳秒内发生几次 cycle ，简单等同于 cpu 执行了几条指令。

## 基准测试

基准测试的关键是：`测量什么情况下什么指标`。

[Server-side I/O][2] 中为了对比 php、java、node、go 的性能，测量了 300 并发、5000 并发下的请求响应时间，把平均响应时间或者处理速率（RPS，req/sec）认定为性能的表征。

Nginx 除了 RPS，还使用 CPS（连接新建速率）、Throughput（见 [《nginx 的性能报告》][3]）。

RPS、CPS、Throughput 三个指标足够了，有些场景只需要前两个指标。选定指标之后的问题是选择场景。

## Web 框架的测试场景

Web 框架执行的任务类型多样，综合性能不好评估，需要测量哪些场景的？

TechEmpower 发起的 Web Framework Benchmarks 收集了数百个框架，提出了 7 个测量场景：

1. json 序列化
2. 数据库单条查询
3. 数据库多条查询
4. 查询未预知数目的全表数据
5. 写数据库
6. 直接返回文本信息
7. 本地有数据库缓存时的查询

其中「查询未预知数目的全表数据」 被命名为 Fortunes。fortune 是 linux 上可以安装的一个命令，就是显示随机句子，类似于每天一句名人名言：

```sh
$ yum install fortune-mod
$ fortune
...the increased productivity fostered by a friendly environment and quality
tools is essential to meet ever increasing demands for software.
-- M. D. McIlroy, E. N. Pinson and B. A. Tague
```

这个场景是在程序不知道总数据量有多少的情况下，查询全表数据。

[Project Information Framework Tests Overview][5] 对每种场景有详细说明。

[Web Framework Benchmarks][4] 是测试报告，如下：

![webbenchmark.png]({{ site.imglocal }}/article/webbenchmark.png)

## 参考

1. [李佶澳的博客][1]
2. [Server-side I/O Performance: Node vs. PHP vs. Java vs. Go][2]
3. [从 nginx 的性能报告中学习 webserver 的性能评估方法和压测方法][3]
4. [Web Framework Benchmarks][4]
5. [Project Information Framework Tests Overview][5]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.toptal.com/back-end/server-side-io-performance-node-php-java-go "Server-side I/O Performance: Node vs. PHP vs. Java vs. Go"
[3]: https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2020/01/17/nginx-benchmark-method.html "从 nginx 的性能报告中学习 webserver 的性能评估方法和压测方法" 
[4]: https://www.techempower.com/benchmarks/  "Web Framework Benchmarks"
[5]: https://github.com/TechEmpower/FrameworkBenchmarks/wiki/Project-Information-Framework-Tests-Overview "Project Information Framework Tests Overview"
