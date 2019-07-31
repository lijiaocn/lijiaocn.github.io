---
layout: default
title: "nsenter：使用nsenter进入另一个进程的namespace"
author: 李佶澳
createdate: 2017/07/14 14:54:49
last_modified_at: 2018/07/22 14:27:13
categories: 技巧
tags: linuxtool
keywords: nsenter,namespace,process
description: "nsenter: run program with namespaces of other processes"

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

通过nsenter进入到另一个进程的namespace，从而可以非常方便的调试问题。

当前进程的mnt ns:

	ls /proc/$$/ns/mnt -l
	lrwxrwxrwx 1 root root 0 Jul 14 15:06 /proc/3968/ns/mnt -> mnt:[4026531840]

目标进程的mnt ns:

	ls /proc/32264/ns/mnt -l
	lrwxrwxrwx 1 root root 0 Jul 14 14:01 /proc/32264/ns/mnt -> mnt:[4026532243]

进入目标进程的mnt ns:

	nsenter -t 32264 -m   /bin/sh
	# -t 指定目标进程
	# -m 继承目标进程的mnt ns

当前进程的mnt ns:

	ls /proc/$$/ns/mnt -l
	lrwxrwxrwx 1 root root 0 Jul 14 15:11 /proc/2425/ns/mnt -> mnt:[4026532243]

## 参考

1. [man nsenter][1]

[1]: https://www.systutorials.com/docs/linux/man/1-nsenter/  "man nsenter" 
