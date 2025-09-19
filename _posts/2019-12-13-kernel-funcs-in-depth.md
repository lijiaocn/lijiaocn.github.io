---
layout: default
title: "在用户态观测 Linux 内核函数的调用情况（调用次数、传入参数、运行时长等）"
author: 李佶澳
date: "2019-12-13T22:11:00+0800"
last_modified_at: "2019-12-13T22:11:00+0800"
categories: 方法
cover:
tags: linux
keywords: ebpf,bpftrace,linux,内核函数,性能分析
description: 掌握该技能后，能够把黑暗的内核划开，看清里面的各种细节，为内核学习打开方便之门
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

公司又缩减成本过冬，抓紧时间储备新工作，趁机把一直想梳理的内容整理出来。

在用户态观测内核函数的状态，是一项利刃般的技能。掌握该技能后，能够把黑暗的内核划开，看清里面的各种细节，为内核学习打开方便之门。

But，工具归根结底还是工具，要把工具的效力发挥出来，还是要懂内核，两者是相辅相成的关系吧。

## 第一个流派：Dtrace

Dtrace 是系统诊断大神 Brendan D. Gregg 为 Solaris 开发的系统诊断工具。Dtrace 最大特点是可以在实时运行的生产系统上安全使用，既能检查用户程序的行为也能检查操作系统的行为，详情见 Oracle 网站上的手册:

* [DTrace 用户指南][2]
* [系统诊断调优大神 Brendan D. Gregg][4] 

Dtrace 可以在 Solaris、Mac OS X、FreeBSD 等系统上运行，不包含 linux。

[dtrace4linux][5] 项目试图将 dtrace 移植到 linux 中，Brendan D. Gregg 在 2015 出版的《性能之巅》中提到，“这些移植项目是新项目可能会导致内核崩溃（现状未知 2019-12-13 23:36:39）”

从 Brendan D. Gregg 在 [DTrace Tools][3] 中的表述以及他所做的工作判断，Brendan D. Gregg 更倾向于在 linux 上使用 [bcc][6] 和 [bpftrace][7]。 

[bcc][6] 提供了一系列专用工具，每个命令用来观测某一类行为，这些命令和 [DTraceToolkit][8]（Brendan D. Gregg 制作的工具包）提供的命令类似。

[bpftrace][7] 类似于 Dtrace 的 linux 翻版，支持使用自定义的脚本语言。

### 补充资料

kernel 3.15 引入的 ebpf 功能已经是或者将要是各种观测工具的基础，kernel>=4.1 时，bcc/bpftrace 的功能能够完整发挥。ebpf 可以通过早期的笔记了解：

* [Linux内核功能eBPF入门学习（一）：BPF、eBPF、BCC等基本概念][1]
* [Linux内核功能eBPF入门学习（二）：BCC中的eBPF应用与bpftrace等][2]

## 第二个流派：systemtap

在没有 dtrace 的日子里，kernel 经过持续多年的吸收，用另外一套工具实现了类似于 dtrace 的功能：

* profiling and PMC events (perf_events)
* kernel static tracing (tracepoints)
* kernel dynamic tracing (kprobes)
* user dynamic tracing (uprobes)

Brendan D. Gregg 专门写了基于 perf 实现的 DTraceToolkit： [perf-tools][11]。

Red Hat、IBM 和 Intel 的团队则专门为 linux 打造了独立工具： [SystemTap][12]。

Brendan D. Gregg 在《性能之巅》中提到说 SystemTap 在一些点上已经超越了 Dtrace，但是稳定性还是个问题（现状未知 2019-12-13 23:36:16）。

## bpftrace 使用入门

[bpftrace][14] 借鉴 awk/C/Dtrace/SystemTap 的语法，实现了一套脚本语言。bpftrace 在 [其它平台][15] 安装比较方便，在 CentOS 上安装比较折腾。这里使用的系统是 CentOS 7.6。

建议将内核升级到 4.1 以上（有些命令在 3.10 上也可用，有一些不可以）：

* [CentOS7/6内核升级的简单方法：借助ELRepo，用yum命令更新内核][13]

CentOS 7.6 可以使用 [snap][16]，snap 提供了 bpftrace 安装包，安装非常方便：

```sh
$ yum install -y epel-release
$ yum install -y snapd
$ systemctl enable --now snapd.socket
$ ln -s /var/lib/snapd/snap /snap
```

`退出当前用户重新登陆`，然后用 snap 安装：

```sh
$ exit <重新登陆>
$ snap install bpftrace
$ snap connect bpftrace:system-trace
```

执行第一个命令，验证 bpftrace：

```sh
$ bpftrace -e 'BEGIN { printf("hello world\n"); }'
Attaching 1 probe...
hello world
```

如果遇到下面的错误：

```sh
$ bpftrace -e 'BEGIN { printf("hello world\n"); }'
Error creating printf map: Operation not permitted
Creation of the required BPF maps has failed.
Make sure you have all the required permissions and are not confined (e.g. like
snapcraft does). `dmesg` will likely have useful output for further troubleshooting
```

解决方法见： 

* [bpftrace 执行失败 Operation not permitted，不是因为 kernel lockdown!][19]

如果遇到类似下面的错误：

```sh
$ bpftrace -e 'tracepoint:syscalls:sys_enter_* { @[probe] = count(); }'
/bpftrace/include/asm_goto_workaround.h:14:10: fatal error: 'linux/types.h' file not found
```

可能是因为没有安装 kernel-devel，或者 kernel 版本太低。对于 kernel 3.10，安装了 kernel-devel，该问题依旧存在。对于 kernel 5.4.3，安装 kernel-devel 后问题解决：

```sh
$ yum install -y kernel-devel
$ bpftrace -e 'tracepoint:syscalls:sys_enter_* { @[probe] = count(); }'
Attaching 331 probes...
^C

@[tracepoint:syscalls:sys_enter_inotify_add_watch]: 1
@[tracepoint:syscalls:sys_enter_poll]: 1
@[tracepoint:syscalls:sys_enter_rt_sigreturn]: 1
@[tracepoint:syscalls:sys_enter_write]: 2
@[tracepoint:syscalls:sys_enter_ppoll]: 5
@[tracepoint:syscalls:sys_enter_rt_sigprocmask]: 8
@[tracepoint:syscalls:sys_enter_select]: 8
@[tracepoint:syscalls:sys_enter_epoll_wait]: 38
@[tracepoint:syscalls:sys_enter_read]: 132
@[tracepoint:syscalls:sys_enter_perf_event_open]: 150
@[tracepoint:syscalls:sys_enter_dup]: 301
@[tracepoint:syscalls:sys_enter_openat]: 304
@[tracepoint:syscalls:sys_enter_bpf]: 321
@[tracepoint:syscalls:sys_enter_ioctl]: 549
@[tracepoint:syscalls:sys_enter_dup2]: 600
@[tracepoint:syscalls:sys_enter_close]: 968
```

另外还有一个在容器中使用 bpftrace 的方法，有兴趣的可以自己试一下：

* [How to: run BpfTrace from a small alpine image, with least privileges.][22]

### bpftrace 的采集点

Brendan D. Gregg 设计了 [12 个用例][20]，学习这 12 用例之前，先整体介绍一下 bpftrace。

bpftrace 能够在不影响系统运行的情况下，采集细致到源码级别的信息，例如系统调用情况、内核函数调用情况、函数的入参和返回值等。

bpftrace 把采集动作被称为 probe，采集动作的类型是 probe types。采集动作类型有很多种，总体上可以分为两大类：`静态点采集` 和 `动态点采集`。

静态点是在源码中植入的采集点，种类是固定的，在编码时就定义好了，每个采集点有哪些数据也都是定好的，一般不会因为内核版本的变化而变化。
动态点可以是内核的任意一个函数，内核版本不同，相应函数实现可能不同，能够采集的到数据不同。

bpftrace 对采集点的划分更细致，如下所示：

```sh
Alias    Type           Description
t        tracepoint     Kernel static instrumentation points
U        usdt           User-level statically defined tracing
k        kprobe         Kernel dynamic function instrumentation
kr       kretprobe      Kernel dynamic function return instrumentation
u        uprobe         User-level dynamic function instrumentation
ur       uretprobe      User-level dynamic function return instrumentation
s        software       Kernel software-based events
h        hardware       Hardware counter-based instrumentation
w        watchpoint     Memory watchpoint events
p        profile        Timed sampling across all CPUs
i        interval       Timed reporting (from one CPU)
         BEGIN          Start of bpftrace
         END            End of bpftrace
```

`bpftrace -l` 命令会列出支持的采集点（probes）：

```sh
$ bpftrace -l
software:alignment-faults:
software:bpf-output:
...
hardware:backend-stalls:
hardware:branch-instructions:
...
tracepoint:sunrpc:rpc_call_status
tracepoint:sunrpc:rpc_bind_status
...
kprobe:in_tx_show
kprobe:cmask_show
kprobe:inv_show
...
```

其中以 tracepoint 开头的就是静态点，每个静态点可以提供的数值，用下面的方式获知（-vl）：

```sh
$ bpftrace -vl tracepoint:sunrpc:rpc_task_wakeup
tracepoint:sunrpc:rpc_task_wakeup
    unsigned int task_id;
    unsigned int client_id;
    unsigned long timeout;
    unsigned long runstate;
    int status;
    unsigned short flags;
    __data_loc char[] q_name;
```

以 kprobe/kretprobe 开头的是动态的采集点，可以指向任意一个内核函数，kprobe 是进入目标函数时出发，kretprobe 是退出目标函数时触发。

bpftrace -l 没有列出的采集点，可能也是支持的，譬如 kretprobe:vfs_read 没有被列出，但是可用：

```sh
bpftrace -e 'kretprobe:vfs_read { @bytes = lhist(retval, 0, 2000, 200); }'
Attaching 1 probe...
^C

@bytes:
(..., 0)               2 |@                                                   |
[0, 200)              91 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
[200, 400)            10 |@@@@@                                               |
[400, 600)             5 |@@                                                  |
[600, 800)             0 |                                                    |
[800, 1000)           20 |@@@@@@@@@@@                                         |
[1000, 1200)           0 |                                                    |
[1200, 1400)           0 |                                                    |
[1400, 1600)           0 |                                                    |
[1600, 1800)           0 |                                                    |
[1800, 2000)           0 |                                                    |
[2000, ...)            5 |@@                                                  |
```

为什么没有被 bpftrace -l 列出，我不知道（2019-12-14 17:58:39）。

### 内置变量和动作函数

在后面的十二用例学习中，会用到这些变量和函数，更完整的列表位于 [bpftrace Reference Guide][21]。

内置变量名和数值含义：

```sh
 Variable         Description
pid             process ID
tid             thread ID
comm            Process or command name
curtask         Current task_struct as a u64
nsecs           Current time in nanoseconds
kstack          Kernel stack trace
ustack          User-level stack trace
arg0...argN     Function arguments
args            Tracepoint arguments
retval          Function return value
func            Function name
name            Full probe name
$1...$N         Positional parameters
```

内置函数：

```sh
  Function                                  Description
printf("...")                          Print formatted string
str(char *s [, int length])            Return string from x pointer
ksym(void *p)                          Resolve kernel address to symbol
kaddr(char *name)                      Resolve kernel symbol name to address
ntop([int af,]int|char[4:16] addr)     Convert IP address data to text
reg(char *name)                        Return register value
time("...")                            Print formatted time
system("...")                          Run shell command
cat(char *filename)                    Print file content
@ = count()                            Count events
@ = sum(x)                             Sum the value
@ = hist(x)                            Power-of-2 histogram for x
@ = lhist(x, min, max, step)           Linear histogram for x
@ = min(x)                             Record the minimum value seen
@ = max(x)                             Record the maximum value seen
@ = stats(x)                           Return the count, average, and total for this value
delete(@x[key])                        Delete the map element
clear(@x)                              Delete all keys from the map
```

变量类型：

```sh
  Variable       Description
@name          global
@name[key]     hash
@name[tid]     thread-local
$name          scratch
```

### bpftrace 十二用例学习

Brendan D. Gregg 设计的 [12 个用例][20] 非常赞，把这 12 用例掌握了，就能应对大多数场景。

bpftrace 的语法规则如下，-e 指定动作脚本，probe 是目标采集点，filter 是可选的过滤器，action 是处理动作：

```sh
bpftrace -e 'probe[,probe,...] /filter/ { action }'
```

### Lesson 1. Listing Probes

列出所有支持的采集点，-l 支持通配符：

```sh
$ bpftrace -l 'tracepoint:syscalls:sys_enter_*'
```

### Lesson 2. Hello World

BEGIN 是一个伪采集点，它在采集开启前触发，可以用来做一些采集前设置，或打印信息：

```sh
$ bpftrace -e 'BEGIN { printf("hello world\n"); }'
Attaching 1 probe...
hello world
^C
```

### Lesson 3. File Opens

这是一个比较复杂的采集了，采集所有的 openat() 系统调用，并将发起调用的进程名和参数打印出来：

```sh
$ bpftrace -e 'tracepoint:syscalls:sys_enter_openat { printf("%s %s\n", comm, str(args->filename)); }'
Attaching 1 probe...
snmp-pass /proc/cpuinfo
snmp-pass /proc/stat
snmpd /proc/net/dev
snmpd /proc/net/if_inet6
```

{} 是处理动作，将 comm 和 args->filename 打印了出来。comm 是 bpftrace 内置变量，存放的是当前进程的名称。args 是采集点支持的参数：

```sh
$ bpftrace -vl tracepoint:syscalls:sys_enter_openat
tracepoint:syscalls:sys_enter_openat
    int __syscall_nr;
    int dfd;
    const char * filename;
    int flags;
    umode_t mode;
```

### Lesson 4. Syscall Counts By Process

统计每个进程发起系统用的次数：

```sh
$ bpftrace -e 'tracepoint:raw_syscalls:sys_enter { @[comm] = count(); }'
Attaching 1 probe...
^C

@[bpftrace]: 6
@[systemd]: 24
@[snmp-pass]: 96
@[sshd]: 125
```

`@[comm]` 定义了以进程名为 key 的 map，count() 返回每个进程上的系统调用次数。

`@` 是定义数组或者字典变量的意思，后面的变量名可以省略。

### Lesson 5. Distribution of read() Bytes

统计进程 18644 每次 read() 调用读取的字节数，并用直方图的方式展示字节数分布情况：

```sh
$ bpftrace -e 'tracepoint:syscalls:sys_exit_read /pid == 18644/ { @bytes = hist(args->ret); }'
Attaching 1 probe...
^C

@bytes:
[0, 1]                12 |@@@@@@@@@@@@@@@@@@@@                                |
[2, 4)                18 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                     |
[4, 8)                 0 |                                                    |
[8, 16)                0 |                                                    |
[16, 32)               0 |                                                    |
[32, 64)              30 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
[64, 128)             19 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                    |
[128, 256)             1 |@
```

注意是 sys_exit_read，read() 调用结束时触发，只有结束时才知道读取了多少字节。

这里演示了 filter 的用法：/pid == 18644/，至今进程的 18644 发起的 read() 调用被采集。

`hist()` 是绘制直方图，参数是 read() 的返回值，hist() 绘制的直方图以 2 的次方为分割。

### Lesson 6. Kernel Dynamic Tracing of read() Bytes

前面的都是静态采集，这个是动态采集，采集内核函数 vfs_read() 退出时的返回值 retval，并用直方图的方式呈现：

```sh
$ bpftrace -e 'kretprobe:vfs_read { @bytes = lhist(retval, 0, 2000, 200); }'
Attaching 1 probe...
^C

@bytes:
(...,0]                0 |                                                    |
[0, 200)              66 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
[200, 400)             2 |@                                                   |
[400, 600)             3 |@@                                                  |
[600, 800)             0 |                                                    |
[800, 1000)            5 |@@@                                                 |
[1000, 1200)           0 |                                                    |
[1200, 1400)           0 |                                                    |
[1400, 1600)           0 |                                                    |
[1600, 1800)           0 |                                                    |
[1800, 2000)           0 |                                                    |
[2000,...)            39 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@                      |
```

`lhist()` 也是绘制直方图，但是区间长度是用参数指定的：0~2000，每 200 为一个区间。

### Lesson 7. Timing read()s

这是十二用例中最复杂的一个例子，这是动态采集，采集的是内核函数 vfs_read() 的`执行时间`。

注意是执行时间，也就是 vfs_read() 退出时的时间减去进入 vfs_read() 的时间。

首先通过 `kprobe:vfs_read { @start[tid] = nsecs; }`，将每个线程调用 vfs_read() 的时间保留到变量 @start[tid]；

然后通过 `kretprobe:vfs_read /@start[tid]/ { }`，采集 vfs_read() 退出的时间，并用 @start[tid] 过滤；

最后 `@ns[comm] = hist(nsecs - @start[tid]); delete(@start[tid]);`，用退出时间减去开始时间得到数值绘制直方图，并删除变量 @start[tid]。

```sh
$ bpftrace -e 'kprobe:vfs_read { @start[tid] = nsecs; } kretprobe:vfs_read /@start[tid]/ \
              { @ns[comm] = hist(nsecs - @start[tid]); delete(@start[tid]); }'
Attaching 2 probes...

[...]
@ns[snmp-pass]:
[0, 1]                 0 |                                                    |
[2, 4)                 0 |                                                    |
[4, 8)                 0 |                                                    |
[8, 16)                0 |                                                    |
[16, 32)               0 |                                                    |
[32, 64)               0 |                                                    |
[64, 128)              0 |                                                    |
[128, 256)             0 |                                                    |
[256, 512)            27 |@@@@@@@@@                                           |
[512, 1k)            125 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@       |
[1k, 2k)              22 |@@@@@@@                                             |
[2k, 4k)               1 |                                                    |
[4k, 8k)              10 |@@@                                                 |
[8k, 16k)              1 |                                                    |
[16k, 32k)             3 |@                                                   |
[32k, 64k)           144 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
[64k, 128k)            7 |@@                                                  |
[128k, 256k)          28 |@@@@@@@@@@                                          |
[256k, 512k)           2 |                                                    |
[512k, 1M)             3 |@                                                   |
[1M, 2M)               1 |                                                    |
```

### Lesson 8. Count Process-Level Events

这个例子是统计一段时间内发生的进程调度事件，注意同时指定了多个静态采集点 `sched*`，然后将结果按照 probe 分开：

```sh
$ bpftrace -e 'tracepoint:sched:sched* { @[probe] = count(); } interval:s:5 { exit(); }'
Attaching 25 probes...
@[tracepoint:sched:sched_wakeup_new]: 1
@[tracepoint:sched:sched_process_fork]: 1
@[tracepoint:sched:sched_process_exec]: 1
@[tracepoint:sched:sched_process_exit]: 1
@[tracepoint:sched:sched_process_free]: 2
@[tracepoint:sched:sched_process_wait]: 7
@[tracepoint:sched:sched_wake_idle_without_ipi]: 53
@[tracepoint:sched:sched_stat_runtime]: 212
@[tracepoint:sched:sched_wakeup]: 253
@[tracepoint:sched:sched_waking]: 253
@[tracepoint:sched:sched_switch]: 510
```

`interval:s:5` 是一个 5 秒后触发的 probe，它的动作是 { exit(); }，即结束采集。这个例子中有两个 action：{ @[probe] = count(); } 和 { exit(); }

### Lesson 9. Profile On-CPU Kernel Stacks

以 99hz 的频率采集内核调用栈，kstack 是当前的内核调用栈：

```sh
$ bpftrace -e 'profile:hz:99 { @[kstack] = count(); }'
Attaching 1 probe...
^C

[...]
@[
filemap_map_pages+181
__handle_mm_fault+2905
handle_mm_fault+250
__do_page_fault+599
async_page_fault+69
]: 12
[...]
@[
cpuidle_enter_state+164
do_idle+390
cpu_startup_entry+111
start_secondary+423
secondary_startup_64+165
]: 22122
```

这个采集结果可以用来绘制火焰图。

### Lesson 10. Scheduler Tracing

采集上下文切换（off-CPU）时的内核调用栈：

```sh
$ bpftrace -e 'tracepoint:sched:sched_switch { @[kstack] = count(); }'
^C
[...]

@[
__schedule+697
__schedule+697
schedule+50
schedule_timeout+365
xfsaild+274
kthread+248
ret_from_fork+53
]: 73
@[
__schedule+697
__schedule+697
schedule_idle+40
do_idle+356
cpu_startup_entry+111
start_secondary+423
secondary_startup_64+165
]: 305
```

### Lesson 11. Block I/O Tracing

采集每次 I/O 操作时的数据量，并用直方图的方式呈现：

```sh
$ bpftrace -e 'tracepoint:block:block_rq_issue { @ = hist(args->bytes); }'
Attaching 1 probe...
^C

@:
[0, 1]                 1 |@@                                                  |
[2, 4)                 0 |                                                    |
[4, 8)                 0 |                                                    |
[8, 16)                0 |                                                    |
[16, 32)               0 |                                                    |
[32, 64)               0 |                                                    |
[64, 128)              0 |                                                    |
[128, 256)             0 |                                                    |
[256, 512)             0 |                                                    |
[512, 1K)              0 |                                                    |
[1K, 2K)               0 |                                                    |
[2K, 4K)               0 |                                                    |
[4K, 8K)              24 |@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@|
[8K, 16K)              2 |@@@@                                                |
[16K, 32K)             6 |@@@@@@@@@@@@@                                       |
[32K, 64K)             5 |@@@@@@@@@@                                          |
[64K, 128K)            0 |                                                    |
[128K, 256K)           1 |@@                                                  |
```

### Lesson 12. Kernel Struct Tracing

最后一个例子，在动态采集中直接使用内核数据结构的方法。

```sh
$ cat path.bt
#include <linux/path.h>
#include <linux/dcache.h>

kprobe:vfs_open
{
    printf("open path: %s\n", str(((path *)arg0)->dentry->d_name.name));
}
```

用 bpftrace 加载执行：

```
$ bpftrace path.bt
Attaching 1 probe...
open path: dev
open path: if_inet6
open path: retrans_time_ms
[...]
```

## systemtap 使用入门

再说吧...官方文档：[systemtap][12]。

## 参考

1. [李佶澳的博客][1]
2. [DTrace 用户指南][2]
3. [Enable snaps on CentOS and install bpftrace][16]
4. [Brendan D. Gregg][4]
5. [The bpftrace One-Liner Tutorial][20]
6. [How to: run BpfTrace from a small alpine image, with least privileges.][22]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://docs.oracle.com/cd/E24847_01/html/E22192/gbwaz.html#scrolltoc "DTrace 用户指南"
[3]: http://www.brendangregg.com/dtrace.html "DTrace Tools"
[4]: http://www.brendangregg.com/ "Brendan D. Gregg"
[5]: https://github.com/dtrace4linux/linux "dtrace4linux"
[6]: http://www.brendangregg.com/ebpf#bcc "bcc"
[7]: http://www.brendangregg.com/ebpf.html#bpftrace "bpftrace"
[8]: http://www.brendangregg.com/dtracetoolkit.html "DTraceToolkit"
[9]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/25/ebpf-introduction-1.html "Linux内核功能eBPF入门学习（一）：BPF、eBPF、BCC等基本概念"
[10]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/26/ebpf-introduction-2-bcc-usage.html "Linux内核功能eBPF入门学习（二）：BCC中的eBPF应用与bpftrace等"
[11]: https://github.com/brendangregg/perf-tools "perf-tools"
[12]: https://sourceware.org/systemtap/documentation.html "systemtap"
[13]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/25/centos-kernel-upgrade.html "CentOS7/6内核升级的简单方法：借助ELRepo，用yum命令更新内核"
[14]: https://github.com/iovisor/bpftrace "github: bpftrace"
[15]: https://github.com/iovisor/bpftrace/blob/master/INSTALL.md "bpftrace Install"
[16]: https://snapcraft.io/install/bpftrace/centos "Enable snaps on CentOS and install bpftrace"
[17]: https://lwn.net/Articles/750730/ "Kernel lockdown in 4.17?"
[18]: https://bugzilla.redhat.com/show_bug.cgi?id=1599197#c9 "kernel lockdown breaks too much for me"
[19]: https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2019/12/14/bpftrace-no-permitted.html "bpftrace 执行失败 Operation not permitted，不是因为 kernel lockdown!"
[20]: https://github.com/iovisor/bpftrace/blob/v0.9.3/docs/tutorial_one_liners.md "The bpftrace One-Liner Tutorial"
[21]: https://github.com/iovisor/bpftrace/blob/master/docs/reference_guide.md "bpftrace Reference Guide"
[22]: https://itnext.io/how-to-run-bpftrace-from-a-small-alpine-image-and-with-least-privileges-379146fcfcf1 "How to: run BpfTrace from a small alpine image, with least privileges"
