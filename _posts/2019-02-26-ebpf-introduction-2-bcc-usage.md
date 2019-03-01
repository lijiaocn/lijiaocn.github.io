---
layout: default
title: "Linux内核功能eBPF入门学习（二）：BCC中的eBPF应用与bpftrace等"
author: 李佶澳
createdate: "2019-02-26 11:42:41 +0800"
changedate: "2019-03-01 18:27:13 +0800"
categories: 技巧
tags: linux
keywords: ebpf,bpf,bcc,linux kernerl
description: BCC封装了将eBPF应用代码注入到内核中的操作，同时收集了很多和linux性能调试相关的eBPF应用
---

* auto-gen TOC:
{:toc}

## 说明

一图抵万言，这张图片是2017年的时候BCC收录的eBPF应用分布，可以在bcc的[github repo][1]中找到这张图，可以把它和[Brendan Gregg](http://www.brendangregg.com/)绘制的Linux性能分析工具图谱摆在一起对比查看：

![Linux bcc/BPF Tracing Tools](https://www.lijiaocn.com/linux/img/linux/05-bcc_tracing_tools_2017.png)

![Linux Performance Tools](https://www.lijiaocn.com/img/linux/03-linux-performance-tools.png)

把这两张图中的工具和背后原理掌握了，就是板上钉钉的性能分析专家，要做到完全掌握需要对kernel非常熟悉，并且掌握最基本方法论。

相关笔记：

1. [Linux内核功能eBPF入门学习（一）：BPF、eBPF、BCC等基本概念](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/25/ebpf-introduction-1.html)
2. [Linux内核功能eBPF入门学习（二）：BCC中收集的eBPF应用的使用](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/26/ebpf-introduction-2-bcc-usage.html)

## BCC收集的eBPF应用

Brendan Gregg在[Linux Extended BPF (eBPF) Tracing Tools][2]中进行了系统性介绍，BCC中收集的应用都是用于Trace的，可以对linux系统的内核态和用户态进行跟踪，相当于几乎可以在任意位置加上打印日志的代码。

下面不会列出BCC收集的所有eBPF应用，只会记录几个典型常用的eBPF应用，[iovisor/bcc](https://github.com/iovisor/bcc)中有完整列表。

### 追踪单一事件的工具

execsnoop跟踪系统调用`exec()`：

```
$ execsnoop
PCOMM            PID    PPID   RET ARGS
ls               1253   1217     0 /usr/bin/ls --color=auto
```
opensnoop跟踪系统调用`open()`：

```
$ opensnoop
PID    COMM               FD ERR PATH
997    zabbix_agentd       5   0 /proc/stat
1699   opensnoop          -1   2 /usr/lib64/python2.7/encodings/ascii.so
1699   opensnoop          -1   2 /usr/lib64/python2.7/encodings/asciimodule.so
1699   opensnoop          14   0 /usr/lib64/python2.7/encodings/ascii.py
1699   opensnoop          15   0 /usr/lib64/python2.7/encodings/ascii.pyc
```

### 内核态动态跟踪

统计内核中以tcp_send开头的函数的调用次数，`-i 1`表示每秒钟统计一次：

```
$ funccount -i 1 'tcp_send*'
Tracing 16 functions for "tcp_send*"... Hit Ctrl-C to end.

FUNC                                    COUNT
tcp_send_mss                                2
tcp_sendmsg                                 2
tcp_sendmsg_locked                          2
tcp_send_ack                               54
tcp_send_delayed_ack                       58
```

追踪do_sys_open，并且打印它的第二个参数，即打开的文件名：

```
$ trace 'p::do_sys_open "%s", arg2'
PID     TID     COMM            FUNC             -
997     997     zabbix_agentd   do_sys_open      /proc/stat
997     997     zabbix_agentd   do_sys_open      /proc/stat
```

追踪do_sys_open，打印它的返回值：

```
$ trace 'r::do_sys_open "ret: %d", retval'
PID     TID     COMM            FUNC             -
997     997     zabbix_agentd   do_sys_open      ret: 5
997     997     zabbix_agentd   do_sys_open      ret: 5
997     997     zabbix_agentd   do_sys_open      ret: 5
```

追踪do_nanosleep，打印第二个参数和内核调用栈：

```
$ trace -K 'do_nanosleep "mode: %d", arg2'
1162    1163    kube-router     do_nanosleep     mode: 1
        do_nanosleep+0x1 [kernel]
        __x64_sys_nanosleep+0x91 [kernel]
        do_syscall_64+0x60 [kernel]
        entry_SYSCALL_64_after_hwframe+0x44 [kernel]zo
```

### 用户态动态追踪

追踪用户态`libc中`定义的函数nanosleep()：

```
$ trace 'p:c:nanosleep(struct timespec *req) "%d sec %d nsec", req->tv_sec, req->tv_nsec'
PID     TID     COMM            FUNC             -
997     997     zabbix_agentd   nanosleep        1 sec 0 nsec
1001    1001    zabbix_agentd   nanosleep        1 sec 0 nsec
2659    2659    sleep           nanosleep        1 sec 0 nsec
```

统计进程1217调用`libc中`的write()的次数：

```
$ argdist -p 1217 -C 'p:c:write(int fd):int:fd'
[18:08:39]
p:c:write(int fd):int:fd
    COUNT      EVENT
[18:08:40]
p:c:write(int fd):int:fd
    COUNT      EVENT
    2          fd = 1
    6          fd = 2
[18:08:41]
p:c:write(int fd):int:fd
    COUNT      EVENT
    6          fd = 2
```

### 追踪用户静态定义的跟踪点，User Statically Defined Tracing（USDT）

```
# trace 'u:pthread:pthread_create "%x", arg1'
PID     TID     COMM            FUNC             -
2414    2414    curl            pthread_create   3004cd00
```

## bpftrace

[bpftrace][3]是一个基于bcc的eBPF应用注入工具。

## 参考

1. [GitHub：iovisor/bcc][1]
2. [Linux Extended BPF (eBPF) Tracing Tools][2]
3. [bpftrace][3]

[1]: https://github.com/iovisor/bcc "GitHub：iovisor/bcc"
[2]: http://www.brendangregg.com/ebpf.html "Linux Extended BPF (eBPF) Tracing Tools"
[3]: https://github.com/iovisor/bpftrace "bpftrace"
