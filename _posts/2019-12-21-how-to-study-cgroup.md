---
layout: default
title: "cgroups: 学习指引与概念辨析"
author: 李佶澳
date: "2019-12-21T19:28:29+0800"
last_modified_at: "2019-12-21T19:28:29+0800"
categories: 方法
cover:
tags: cgroup
keywords: cgroup,cgroup控制器,linux资源限制
description: 答案一点都不重要！因为事物是在发展变化的，记住一时的答案没有意义，重要的是答案在哪里
---

## 目录

>该文档已作废。
>
>初学时懵懵懂懂，有理解错误的地方，请见重新修订后的《重学cgroup: xxx》系列。

* auto-gen TOC:
{:toc}

## 说明

最近在豪赌，频频跑出去面试一圈下来，内心在悲鸣。相比工作亮点与各种细节，我更在意的是`常识`和`知识点索引`，前者表示有基本的沟通能力和正确的做事方法，后者说明有足够的扩展能力，两者结合意味着能够应对多变的环境、解决未知的问题。

以前学习 cgroup 的时候写过三篇笔记，因为没有频繁用到，学完后就折腾其它事情，然后像忘掉 [iptables][5] 一样把 cgroup 忘的一干二净。

* [cgroup（一）：初级入门使用方法][2]
* [cgroup（二）：资源限制 cgroup v1 和 cgroup v2 的详细介绍][3]
* [cgroup（三）：cgroup controller 汇总和控制器的参数（文件接口）][4]

把这三篇笔记重新翻阅了一下，发现还有很多没有完成的地方，譬如每个 controller 的详细用法。

那么要把每个 controller 的详细用法都补上吗？

想了想，暂时先做个梳理，把认知边界再拓展一下，做到以后可以随时随地捡起来用。有时候需要平衡一下，不可能也没必要读完图书馆里的每一本书，不可能也没必要看完所有的影视作品。只要具备了随时随地深入的能力，纲要的价值远远大于细节。

>好吧，我承认是懈怠了...

## cgroup 基本概念

[cgroup（二）][6] 梳理过 cgroup 的基本概念，其实核心概念只有一个 `cgroup controller`。

cgroup 可以限制很多类型的资源，譬如 cpu、内存、io、进程数等，每一类资源对应一个 controller。当我们问 cgroup 都可以限制哪些资源的时候，等同于问 cgroup 一共有几种 controller。

那么 cgroup 一共有几种 controller 呢？

这个问题的答案，一点都不重要！因为事物是在发展变化的，记住一时的答案一点意义都没有了。重要的是答案在哪里：

* [Kernel Documents: Control Group v1][7]
* [Kernel Documents: Control Group v2][8]
* [Linux Programmer's Manual: Cgroups][9]

## cgroup 启用方法

另外一个关键问题是 cgroup 怎么用？很简单，用 mount 挂载，然后创建目录、修改文件内容就可以了。

cgroup v1 指定挂载类型 cgroup，-o 指定要使用的 controller，例如：

```sh
mount -t cgroup -o cpu,cpuacct none  /tmp/cgroup/cpu,cpuacct
```

CentOS 7 默认在 /sys/fs/cgroup 中挂载了所有的 controller，每个 controller 一个目录：

```sh
$ ls -p /sys/fs/cgroup
blkio/        cpuacct   freezer/  net_cls            perf_event/  systemd/
cpu           cpuset/   hugetlb/  net_cls,net_prio/  pids/
cpu,cpuacct/  devices/  memory/   net_prio           rdma/
```

cgroup v2（kernel 4.5.0 开始成为正式特性）更简单，直接挂载，controller 无需指定：

```sh
mount -t cgroup2 none /tmp/cgroup2
```

使用 cgroup v2 需要禁用 cgroup v1，因为一个 controller 不能同时用于 v1 和 v2，禁用方法是在内核启动参数中添加 `cgroup_no_v1=all`（all 表示全部禁用）：

```sh
linux16 /boot/vmlinuz-5.4.3-1.el7.elrepo.x86_64 root=UUID=8ac075e3-1124-4bb6-bef7-a6811bf8b870 \
    ro no_timer_check console=tty0 console=ttyS0,115200n8 net.ifnames=0 biosdevname=0 \
    elevator=noop  crashkernel=auto cgroup_no_v1=all
```

禁用之后，cgroup v1 中的 controller 目录都变成空的了：

```sh
$ ls /sys/fs/cgroup/blkio/
<空>
```

而 cgroup v2 的 cgroup.controllers 中列出了可用的 controller：

```sh
$ cat /tmp/cgroup2/cgroup.controllers
cpuset cpu io memory pids rdma
```

可以看到，cgroup v2 现在（2019-12-21 21:12:31）只支持 6 个 controller，数量少于 cgroup v1。

因此启用 cgroup v2 时，只需要禁止 cgroup v1 挂载 cgroup v2 支持的 controller，v2 暂时不支持的 controller 可以在 cgroup v1 中继续使用：

```sh
linux16 /boot/vmlinuz-5.4.3-1.el7.elrepo.x86_64 root=UUID=8ac075e3-1124-4bb6-bef7-a6811bf8b870 \
    ro no_timer_check console=tty0 console=ttyS0,115200n8 net.ifnames=0 biosdevname=0 \
    elevator=noop crashkernel=auto cgroup_no_v1=cpuset,cpu,io,memory,pids,rdma  # 禁用的controller
```

## cgroup controller 启用方法

cgroup v1 和 cgroup v2 启用 controller 的方法大不相同。

cgroup v1 的 controller 挂载非常灵活，为了不混乱，通常使用 CentOS 约定的方法，每个 controller 一个目录，然后在 controller 目录中创建子目录分割资源。

例如 controller hugetlb 的根目录为 /sys/fs/cgroup/hugetlb/，目录中的文件是 hugetlb controller 的文件接口，用来设置资源限额和受限进程：

```sh
$ ls -p /sys/fs/cgroup/hugetlb/
cgroup.clone_children  hugetlb.2MB.limit_in_bytes      release_agent
cgroup.procs           hugetlb.2MB.max_usage_in_bytes  tasks
cgroup.sane_behavior   hugetlb.2MB.usage_in_bytes
hugetlb.2MB.failcnt    notify_on_release
```

在 /sys/fs/cgroup/hugetlb/ 中创建一个子目录，这个子目录也会包含同样的文件接口：

```sh
$ mkdir /sys/fs/cgroup/hugetlb/1
$ ls -p  /sys/fs/cgroup/hugetlb/1
cgroup.clone_children  hugetlb.2MB.limit_in_bytes      notify_on_release
cgroup.procs           hugetlb.2MB.max_usage_in_bytes  tasks
hugetlb.2MB.failcnt    hugetlb.2MB.usage_in_bytes
```

在子目录的文件接口中配置的限额只作用子目录的 tasks 文件中写入的进程。

cgroup v1 的 controller 通过这种目录分割的方式将资源切分。

cgroup v2 的使用方法完全不同，controller 是统一挂载的，不支持独立挂载，文件接口如下：

```sh
$ ls -p
cgroup.controllers      cgroup.stat             cpuset.cpus.effective
cgroup.max.depth        cgroup.subtree_control  cpuset.mems.effective
cgroup.max.descendants  cgroup.threads          io.pressure
cgroup.procs            cpu.pressure            memory.pressure
```

cgroup v2 也用子目录的方式进行资源的分割限制，子目录 1 中也出现同样的文件接口:

```sh
$ mkdir 1
$ ls -p 1
cgroup.controllers  cgroup.max.descendants  cgroup.threads  io.pressure
cgroup.events       cgroup.procs            cgroup.type     memory.pressure
cgroup.freeze       cgroup.stat             cpu.pressure
cgroup.max.depth    cgroup.subtree_control  cpu.stat
```

但是子目录 1 中的文件接口好少，这是怎么回事？如果我们要限制进程数，要修改那个文件接口？

答案在 cgroup.controllers 和 cgroup.subtree_control 中，前者列出了当前目录中可以使用的 controller，后者列出了当前目录的子目录中可以使用的 controller。

查看子目录 1 中的 cgroup.controllers，会发现内容为空：

```s
$ cat 1/cgroup.controllers
<空>
```

修改上级目录中的 cgroup.subtree_control，为子目录 1 启用 pids controller：

```sh
$ cat cgroup.controllers                  # 上级目录可以使用的 controller
cpuset cpu io memory pids rdma            
$ echo "+pids" > cgroup.subtree_control   # 为下级目录启动 pids，注意必须用 + 表示增加，用 - 表示删减
```

查看子目录 1 会发现明显的变化，仔细观察，多了几个 pids 开头的文件接口：

```sh
$ ls -p 1
cgroup.controllers      cgroup.procs            cpu.pressure     pids.events
cgroup.events           cgroup.stat             cpu.stat         pids.max
cgroup.freeze           cgroup.subtree_control  io.pressure
cgroup.max.depth        cgroup.threads          memory.pressure
cgroup.max.descendants  cgroup.type             pids.current
```

子目录 1 中的 cgroup.controllers 内容也发生了变化：

```sh
$ cat 1/cgroup.controllers
pids
```

cgroup v2 采用这种方式控制 controller 的启用，继而进行资源的分割限制。

另外 cgroup.procs 绑定进程，cgroup.threads 绑定线程，旧笔记 [cgroup（二）][2]中有更多细节。

## cgroup controller 列表用途

cgroup v2 支持的 controller（2019-12-21 22:16:03）:

```sh
CPU
Memory
IO
Device
RDMA
Misc
```

cgroup v1 支持 controller（2019-12-21 22:18:45）：

```sh
cpuacct
cpusets
devices
freezer
hugetlb
memcg
memory
net_cls
net_prio
pids
rdma
```

每个 cgroup controller 都有很多参数，掌握起来比较费劲，等用到的时候再说吧，毫无头绪、无法通过堆时间解决的过程，更让人着迷......

* [Kernel Documents: Control Group v1][7]
* [Kernel Documents: Control Group v2][8]
* [Linux Programmer's Manual: Cgroups][9]

## 参考

1. [李佶澳的博客][1]
2. [cgroup（一）：初级入门使用方法][2]
3. [cgroup（二）：资源限制 cgroup v1 和 cgroup v2 的详细介绍][3]
4. [cgroup（三）：cgroup controller 汇总和控制器的参数（文件接口）][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html "Linux的cgroup功能（一）：初级入门使用方法"
[3]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html "Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍"
[4]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html "Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）"
[5]: https://www.lijiaocn.com/soft/linuxsys/iptables.html "iptables 的使用方法"
[6]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html#%E6%9C%AF%E8%AF%AD "术语"
[7]: https://www.kernel.org/doc/Documentation/cgroup-v1/ "kernel document: Control Group v1"
[8]: https://www.kernel.org/doc/Documentation/cgroup-v2.txt "kernel document: Control Group v2"
[9]: http://man7.org/linux/man-pages/man7/cgroups.7.html "Linux Programmer's Manual: Cgroups"
