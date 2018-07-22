---
layout: default
title:  "gdb：进程调试与查看工具，查阅内存等"
author: 李佶澳
createdate: 2018/07/22 15:05:00
changedate: 2018/07/22 15:12:36
categories: 技巧
tags: linuxtool
keywords: gdb,pmap,内存取证据,内存查看,调试工具
description: 通过gdb可以查看系统中的进程的详细信息，包括内存数据等

---

* auto-gen TOC:
{:toc}

## 说明

通过gdb可以查看系统中的进程的详细信息，包括内存数据等

## 导出内存数据

先用pmap或者直接查看[/proc/XX/maps][2]得到进程的内存地址：

	$ pmap -X 16210
	16210:   /tmp/docker -c /tmp/k.conf
			 Address Perm   Offset Device    Inode    Size   Rss   Pss Referenced Anonymous Swap Locked Mapping
			00400000 r-xp 00000000  fc:0a 25165962    2268   756   756        756         0    0      0 docker (deleted)
			00836000 rw-p 00236000  fc:0a 25165962      32    32    32         32        12    0      0 docker (deleted)
			0083e000 rw-p 00000000  00:00        0      36    20    20         20        20    0      0
			02571000 rw-p 00000000  00:00        0     212   144   144        144       144    0      0 [heap]
			025a6000 rw-p 00000000  00:00        0    1048   932   932        932       932    0      0 [heap]
		7f3c04000000 rw-p 00000000  00:00        0     132     8     8          8         8    0      0
		7f3c04021000 ---p 00000000  00:00        0   65404     0     0          0         0    0      0

然后用gdb导出内存数据：

	$ gdb --pid 16210
	$ (gdb) dump memory /tmp/heap2-1048.dat 0x025a6000 0x026ac000

## 参考

1. [Dump a linux process's memory to file][1]
2. [linux proc maps文件分析][2]

[1]: https://serverfault.com/questions/173999/dump-a-linux-processs-memory-to-file  "Dump a linux process's memory to file" 
[2]: https://blog.csdn.net/lijzheng/article/details/23618365 "linux proc maps文件分析"
