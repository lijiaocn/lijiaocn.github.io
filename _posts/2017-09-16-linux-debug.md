---
layout: default
title: linux中疑难问题的调查方法
author: 李佶澳
createdate: 2017/09/16 16:05:43
changedate: 2017/11/27 10:55:59
categories: 技巧
tags: linux
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

## 查看文件系统的inode

分区剩余空间足够，但是无法创建文件：

	$ df -h
	Filesystem      Size  Used Avail Use% Mounted on
	/dev/vda1        20G   14G  5.3G  72% /

或许是inode耗尽了：

	# df -i
	Filesystem      Inodes   IUsed   IFree IUse% Mounted on
	/dev/vda1      1310720 1310720       0  100% /

查看目录占用的inode情况:

	find . -printf "%h\n" | cut -d/ -f-2 | sort | uniq -c | sort -rn

或者:

	for d in `find -maxdepth 1 -type d |cut -d\/ -f2 |grep -xv . |sort`; do c=$(find $d |wc -l) ; printf "$c\t\t- $d\n" ; done ; printf "Total: \t\t$(find $(pwd) | wc -l)\n"

## 参考

1. [How to count INODE usage in Linux][1]

[1]: https://www.2daygeek.com/how-to-count-inode-usage-in-linux/#  "How to count INODE usage in Linux" 
