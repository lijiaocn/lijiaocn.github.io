---
layout: default
title: "bpftrace 执行失败 Operation not permitted，不是因为 kernel lockdown!"
author: 李佶澳
date: "2019-12-14T15:06:07+0800"
last_modified_at: "2019-12-14T15:06:07+0800"
categories: 问题 
cover:
tags: linux
keywords: bpftrace,lockdown,kernel, maps failed
description: 网上关闭 lockdown 的方法不靠谱，是 snap 的原因，不是 kernel lockdown 造成的
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

正在学习 bpftrace，按照 [bpftrace 使用入门][5] 中的方法，用 snap 安装。

执行第一个命令的时候，遇到下面的错误：

```sh
$ bpftrace -e 'BEGIN { printf("hello world\n"); }'
Error creating printf map: Operation not permitted
Creation of the required BPF maps has failed.
Make sure you have all the required permissions and are not confined (e.g. like
snapcraft does). `dmesg` will likely have useful output for further troubleshooting
```

## 网上的方法不靠谱

到网上搜索解决方法，找到的资料都说这是因为 kernel lockdown 特性，[kernel localdown][2] 是 kernel 新的安全机制，可以防止不安全的代码被注入 kernel 运行。

网上给出了解决方法大都是通过 sysrq 关闭 lockdown 特性：

```sh
sudo bash -c 'echo 1 > /proc/sys/kernel/sysrq'
sudo bash -c 'echo x > /proc/sysrq-trigger'
```

在 CentOS 7.6 上试了一下，没有用。

而且第二条命令，向 /proc/sysrq-trigger 写入 `x`，完全是错误的！在 console 上（注意不是 ssh，是 console） 会打印出 sysrq-trigger 支持的字符，里面根本就没有 `x`。

这个方法至少对 CentOS 无效的，我将 kernel 版本从 5.4 一路降低到 3.10，都是一样的结果。

## 正确的方法是：snap connect

执行失败的输出中有一个 `like snapcraft does` 字符，我总感觉和 snap 有关系。

运气比较好，在 [bpftrace Install][3] 中看到这样一句：

>On Ubuntu 16.04 and later, bpftrace is also available as a snap package (https://snapcraft.io/bpftrace), however, the snap provides extremely limited file permissions so the --devmode option should be specified on installation in order avoid file access issues.

按到文档中的提示，执行下面的命令：

```sh
sudo snap install --devmode bpftrace
sudo snap connect bpftrace:system-trace
```

问题解决：

```sh
$ bpftrace -e 'BEGIN { printf("hello world\n"); }'
Attaching 1 probe...
hello world
```

## 参考

1. [李佶澳的博客][1]
2. [Kernel lockdown in 4.17?][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://lwn.net/Articles/750730/ "Kernel lockdown in 4.17?"
[3]: https://github.com/iovisor/bpftrace/blob/master/INSTALL.md#ubuntu-packages "bpftrace Install"
[4]: https://snapcraft.io/install/bpftrace/centos "Enable snaps on CentOS and install bpftrace"
[5]: https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2019/12/13/kernel-funcs-in-depth.html#bpftrace-%E4%BD%BF%E7%94%A8%E5%85%A5%E9%97%A8 "bpftrace 使用入门"
