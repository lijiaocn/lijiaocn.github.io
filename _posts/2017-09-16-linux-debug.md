---
layout: default
title: linux中疑难问题的调查方法
author: lijiaocn
createdate: 2017/09/16 16:05:43
changedate: 2017/09/16 17:00:11
categories: 技巧
tags: linuxtool
keywords: linux,疑难杂症,奇葩问题
description: 持续更新，linux上遇到奇葩的问题的调查方法

---

* auto-gen TOC:
{:toc}

## 说明

程序员使用、接触的工具越来越复杂了，几乎没有人可以去细致的了解每一个工具。

我们不得不依靠有限的认知去面对无穷的现实，并解决其中的各种奇葩问题。

这个页面的内容会持续更新。

## 用dmesg查看发生了什么

dmesg可以用来查看kernel中发生的事情。

	dmesg is used to examine or control the kernel ring buffer.
	The default action is to read all messages from kernel ring buffer.

dmesg命令多个命令选项，可以查看`man dmesg`。

其中`-T`选项可以将时间戳转换为可读的格式：

	# dmesg -T
	[Thu Aug 17 10:43:03 2017] XFS (dm-7): Mounting V5 Filesystem
	[Thu Aug 17 10:43:03 2017] XFS (dm-7): Ending clean mount
	[Thu Aug 17 10:43:03 2017] XFS (dm-7): Unmounting Filesystem
	[Thu Aug 17 10:43:03 2017] XFS (dm-7): Mounting V5 Filesystem
	[Thu Aug 17 10:43:03 2017] XFS (dm-7): Ending clean mount

## 用netstat查看网络连接的状态

查看所有TCP连接的状态分布：

	# netstat -nat|awk '{print awk $NF}'|sort|uniq -c|sort -n
	      1 CLOSE_WAIT
	      1 SYN_RECV
	      1 State
	      1 established)
	      2 FIN_WAIT2
	     27 FIN_WAIT1
	     73 TIME_WAIT
	    151 LISTEN
	   1406 ESTABLISHED

查看连接到80端口的TCP连接的源IP分布：

	 netstat -nat|grep ":80"|awk '{print $5}' |awk -F: '{print $1}' | sort| uniq -c|sort -n
	      1 0.0.0.0
	      1 10.24.200.135
	      1 10.37.33.104
	      6 10.39.1.227
	      7 36.98.102.22
	     12 192.168.237.249

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
