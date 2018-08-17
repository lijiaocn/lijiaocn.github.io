---
layout: default
title: Prometheus（普罗米修斯）使用过程中遇到的问题
author: 李佶澳
createdate: 2018/08/03 10:26:00
changedate: 2018/08/17 11:52:17
categories: 问题
tags: prometheus
keywords: prometheus,监控
description: prometheus是最近几年开始流行的一个新兴监控告警工具，特别是kubernetes的流行带动了prometheus的应用。

---

## 说明

prometheus是最近几年开始流行的一个新兴监控告警工具，特别是kubernetes的流行带动了prometheus的应用。

这里持续记录使用过程中遇到一些问题。

## WAL log samples: log series: write /data/prometheus/wal/000007: file already closed

Prometheus的Target的列表上显示：

	WAL log samples: log series: write /data/prometheus/wal/000007: file already closed

查看日志，发现出现这行日志之前，还有一个日志：

	err="WAL log samples: log series: open /data/prometheus/wal: too many open files"

Github上有人提交过这个问题：

[2.3.0 - WAL log samples: log series: /wal/007913: file already closed ](https://github.com/prometheus/prometheus/issues/4303)

原因是打开文件太多超过ulimit设置。

查看promethesu进程的limits，发现open file的限制是1024，明显不够:

	$ cat /proc/1895/limits
	Limit                     Soft Limit           Hard Limit           Units
	Max cpu time              unlimited            unlimited            seconds
	Max file size             unlimited            unlimited            bytes
	Max data size             unlimited            unlimited            bytes
	Max stack size            8388608              unlimited            bytes
	Max core file size        0                    unlimited            bytes
	Max resident set          unlimited            unlimited            bytes
	Max processes             127964               127964               processes
	Max open files            1024                 4096                 files
	Max locked memory         65536                65536                bytes
	Max address space         unlimited            unlimited            bytes
	Max file locks            unlimited            unlimited            locks
	Max pending signals       127964               127964               signals
	Max msgqueue size         819200               819200               bytes
	Max nice priority         0                    0
	Max realtime priority     0                    0
	Max realtime timeout      unlimited            unlimited            us

在system/prometheus.service中扩大上文件数:

	LimitNOFILE=10240
