---
layout: default
title: 引发kernal panic的方法
author: lijiaocn
createdate: 2017/07/20 15:01:23
last_modified_at: 2017/07/20 16:36:15
categories: 技巧
tags: linuxtool
keywords: kernal,panic,sysrq
description: 在一些情况下，会有通过一个命令引发kernel panic的需求

---

* auto-gen TOC:
{:toc}

在一些情况下，会有通过一个命令引发kernel panic的需求

linux:

	echo c > /proc/sysrq-trigger

freebsd:

	sysctl debug.kdb.panic=1

## 参考

1. [how-to-cause-kernel-panic-with-a-single-command][1]

[1]: https://unix.stackexchange.com/questions/66197/how-to-cause-kernel-panic-with-a-single-command "how-to-cause-kernel-panic-with-a-single-command" 
