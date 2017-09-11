---
layout: default
title: linux系统的负载查看
author: lijiaocn
createdate: 2017/09/05 18:45:46
changedate: 2017/09/11 16:44:41
categories: 技巧
tags: linux
keywords: linux,load,top
description: linux上查看系统负载情况的方法

---

* auto-gen TOC:
{:toc}

## top

top命令除了可以看到系统的进程外，还会在第一行显示系统的负载；

	top - 18:47:28 up 104 days, 21:30,  1 user,  load average: 0.79, 0.96, 1.00
	Tasks: 288 total,   1 running, 287 sleeping,   0 stopped,   0 zombie
	%Cpu(s): 10.2 us, 13.1 sy,  0.1 ni, 76.5 id,  0.0 wa,  0.0 hi,  0.1 si,  0.1 st
	KiB Mem :  8010428 total,  1580136 free,  1173444 used,  5256848 buff/cache
	KiB Swap:  8388604 total,  8388604 free,        0 used.  6118680 avail Mem
	
	  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
	27631 root      20   0   76532  42480  13432 S  57.5  0.5  14032:22 kube-proxy
	27803 root      20   0   52624  30168   9668 S  26.0  0.4   3125:41 calico-felix
	 9097 root      20   0 1425452 199520   1016 S   1.8  2.5   1194:53 hyperkube

### load average

load average分别是最近1分钟、5分钟、15分钟的系统平均负载。

系统负载是系统中处于`running`和`runnable`状态进程数量，平均负载就是指定时间范围内的平均数量。

系统load为CPU核心数目的70%比较合适，如果超过CPU核心数，意味着任务过多，CPU不足。

## 参考

1. [Linux系统中Top命令中Load Average的含义][1]

[1]: http://www.jiagulun.com/thread-34544-1-1.html  "Linux系统中Top命令中Load Average的含义" 
