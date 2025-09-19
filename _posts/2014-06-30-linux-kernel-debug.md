---
layout: default
title: Linux内核调试、修改
author: 李佶澳
createdate: 2014/06/30 14:26:15
last_modified_at: 2017/11/14 15:24:33
categories: 技巧
tags: linux
keywords: linux内核知识
description: 虽然很多时候我们可能没有感受到，但是Linux内核确实是在不停的发展着的。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

内核相关的文档可以到[kernel documentation][1]中查找。

## kdump

[kdump](http://linuxsysconfig.com/2013/03/kdump-on-centos-6/)

kdump是用于内核调试的工具，可以在内核panic后，将内存数据保存下来。

安装：

	yum --enablerepo=debug install kexec-tools crash kernel-debug kernel-debuginfo-`uname -r`
	#debuginfo的源位于：/etc/yum.repos.d/CentOS-Debuginfo.repo 

>kernel-debuginfo-XXX，会在/usr/lib/debug/lib/modules目录下安装未压缩的kernel，crash调试时使用这个kernel.

在grub中配置crashkernel的大小

	crashkernel=128M

启动kdump: 
	chkconfig kdump on
	service kdump start

重启机器后，测试引发panic:

	echo c > /proc/sysrq-trigger

这时候，机器panic后，应该会自动重启，重启后在/var/crash看到保存的coredump文件。

## vmlinux解压

umzip.sh:

	#!/bin/bash
	if [[ ! $# -eq 1 ]];then
			echo "usage: $0  vmlinuzfile"
			exit
	fi
	str=`od -t x1 -A d $1|grep "1f 8b 08"`
	echo $str
 
操作：

	[root@b]# ./umzip.sh vmlinuz-2.6.32-504.8.1.el6.x86_64.debug 
	0014432 48 8d 83 00 35 41 00 ff e0 1f 8b 08 00 04 59 c9

	[root@b]# dd if=vmlinuz-2.6.32-504.8.1.el6.x86_64.debug bs=1 skip=14441 |zcat >vmlinux-2.6.32-504.8.1.el6.x86_64.debug
	4289063+0 records in
	4289063+0 records out
	4289063 bytes (4.3 MB) copied, 14.7371 s, 291 kB/s
	 
	gzip: stdin: decompression OK, trailing garbage ignored

查看:
	[root@b]# file vmlinuz-2.6.32-504.8.1.el6.x86_64.debug 
	vmlinuz-2.6.32-504.8.1.el6.x86_64.debug: Linux kernel x86 boot executable bzImage, version 2.6.32-504.8.1.el6.x86_64.debug, RO-rootFS, swap_dev 0x4, Normal VGA

## 参考

1. [kernel documentation][1]

[1]: http://www.lijiaocn.com/方法/2017/11/13/howto-linux-kernel-doc.html  "kernel documentation"
