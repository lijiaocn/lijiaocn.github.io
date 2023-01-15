---
layout: default
title: "重学 cgroups: 入门指引、基本概念和 cgroup v1 基础使用"
author: 李佶澳
date: "2023-01-14 14:30:06 +0800"
last_modified_at: "2023-01-15 21:56:16 +0800"
categories: 技巧
cover:
tags: cgroup linux
keywords: cgroups
description: 英文全称为 Control Groups，即分组的管理。将 tasks 分组主要是为了能够给不同的 task 设置不同的资源配额（至少 cgroups 被创造的初衷是这样的），比如为 task1 配置 2G 内存上限、为 task2 配置 3G 内存上限。

---

## 目录

* auto-gen TOC:
{:toc}

## cgroups 的作用

cgroups 是在 linux kernel 中运行的一种机制，它提供了一种将系统上运行的 tasks 进行分组的能力。英文全称为 Control Groups，即分组的管理。将 tasks 分组主要是为了能够给不同的 task 设置不同的资源配额（至少 cgroups 被创造的初衷是这样的），比如为 task1 配置 2G 内存上限、为 task2 配置 3G 内存上限。

面向内核开发，cgroups 定义了一套内核 API，具有接纳 subsystem 的能力。subsystem 通常是负责某一类资源的配额管理器，比如 CPU、内存、带宽、进程号等，也被称为 resource controller。接入 cgroups 后，subsystem 能够能够获悉 tasks 的分组情况，从而可以按分组限定 task 的资源使用上限。

面向系统用户，cgroups 将分组情况以虚拟文件系统的方式呈现，展示出一个树形的层级目录，通过修改目录中文件的内容来调整 task 分组，subsystem 的配置项也以文件的方式出现在目录中。

cgroups 有 v1 和 v2 两个版本，两个版本都有实际应用，本篇通过学习 cgroups v1 入门。

## cgroups v1 的虚拟文件系统

cgroups 是在 kernel 中运行的机制，对 cgroups 进行调整配置，需要先用 mount 命令挂载它的虚拟文件系统，把它的文件接口暴露出来。

cgroups v1 和 cgroup v2 的挂载方式略有不同，这里以 cgroups v1 为例：

```sh
# -t 指定 vfstype 为 cgroup
# xxx 是设备名，会在 /proc/mounts 出现，cgroups 自身不会用到设备名，可以根据自身的管理需要来定义设备名
$ mount -t cgroup xxx /sys/fs/cgroup
```

挂载动作只是将运行在内核中的 cgroups 的状态暴露出来，所以我们可以将 cgroups 的虚拟文件系统多次挂载到不同的目录中。linux 发行版通常已经默认将其挂载到 /sys/fs/cgroup 目录。

CentOS 是先挂载一个 tmpfs 类型的文件系统，然后在其中继续挂载 cgroups：

```sh
$ cat /proc/mounts  |grep cgroup
tmpfs /sys/fs/cgroup tmpfs ro,seclabel,nosuid,nodev,noexec,mode=755 0 0
cgroup /sys/fs/cgroup/systemd cgroup rw,seclabel,nosuid,nodev,noexec,relatime,xattr,release_agent=/usr/lib/systemd/systemd-cgroups-agent,name=systemd 0 0
cgroup /sys/fs/cgroup/hugetlb cgroup rw,seclabel,nosuid,nodev,noexec,relatime,hugetlb 0 0
cgroup /sys/fs/cgroup/freezer cgroup rw,seclabel,nosuid,nodev,noexec,relatime,freezer 0 0
cgroup /sys/fs/cgroup/cpu,cpuacct cgroup rw,seclabel,nosuid,nodev,noexec,relatime,cpuacct,cpu 0 0
cgroup /sys/fs/cgroup/memory cgroup rw,seclabel,nosuid,nodev,noexec,relatime,memory 0 0
cgroup /sys/fs/cgroup/pids cgroup rw,seclabel,nosuid,nodev,noexec,relatime,pids 0 0
cgroup /sys/fs/cgroup/perf_event cgroup rw,seclabel,nosuid,nodev,noexec,relatime,perf_event 0 0
cgroup /sys/fs/cgroup/cpuset cgroup rw,seclabel,nosuid,nodev,noexec,relatime,cpuset 0 0
cgroup /sys/fs/cgroup/blkio cgroup rw,seclabel,nosuid,nodev,noexec,relatime,blkio 0 0
cgroup /sys/fs/cgroup/devices cgroup rw,seclabel,nosuid,nodev,noexec,relatime,devices 0 0
cgroup /sys/fs/cgroup/net_cls,net_prio cgroup rw,seclabel,nosuid,nodev,noexec,relatime,net_prio,net_cls 0 0
```

下面创建一个新的目录，在这个目录来演示后续的 cgroups v1 操作：

```sh
$ mkdir -p /demo/cgroups/v1
$ mount -t tmpfs tmpfs_for_cgroups_v1 /demo/cgroups/v1
```

## cgroups v1 的资源管理理念

cgroups v1 的采用的资源管理理念是：为每类资源或者每种资源组合创建一个目录，在其中管理所有 tasks 的该类资源配额。
挂载 cgroups v1 的虚拟文件系统时，用 -o 指定该目录管理的资源或资源组合，

cgroups v1 将 -o 参数传递来的字符串，理解成挂载目录要关联的 subsystem 组合（即 resource controller 组合）。组合中可以只有一个 subsystem，也可以包含多个用 ",”间隔的 subsystem。

```sh
# 挂载只有包含一个 memory subsystem 的组合
$ mkdir -p /demo/cgroups/v1/memory
$ mount -t cgroup -o memory none /demo/cgroups/v1/memory

# 挂载包含 cpu 和 cpuacct 两个 subsystem 的组合
$ mkdir -p /demo/cgroups/v1/cpu,cpuacct
$ mount -t cgroup -o cpu,cpuacct none /demo/cgroups/v1/cpu,cpuacct
```

在 cgroups v1 中，会为每个 subsystem 组合创建对应的 `active hierarchy`。
挂载时 cgroups v1 先检查 -o 指定的 subsystem 组合是有已经有对应的 active hierarchy，如果已有，就直接复用。
从系统用户的角度看，就是一个 subsystem 组合可以多次挂载到不同的目录中，这些目录中的内容是完全相同的。

```sh
# 将 memory subsystem 再次挂载到一个新目录
$ mkdir -p /demo/cgroups/v1/memory2
$ mount -t cgroup -o memory none /demo/cgroups/v1/memory2

# 在 /demo/cgroups/v1/memory 创建子目录 example-mem
$ mkdir /demo/cgroups/v1/memory/example-mem
# 在 /demo/cgroups/v1/memory2 中同时出现 example-mem
$ ls /demo/cgroups/v1/memory2/ |grep example-mem
example-mem
```

每个 subsystem 只能在所有的 active hierarchy 中出现一次，比如 cpu 和 cpuacct 已经出现在 cpu,cpuacct 组合对应的 active hierarchy，不能再出现在别的组合中：

```sh
# cpu 不能出现的新的 subsystem 组合中，无论是单独成组还是和其它 subsystem 组合

# cpu 单独成组
$ mkdir -p /demo/cgroups/v1/cpu2
$ mount -t cgroup -o cpu none /demo/cgroups/v1/cpu2
mount: none already mounted or /demo/cgroups/v1/cpu2 busy

# cpu 和 memory 组合成组
$ mkdir -p /demo/cgroups/v1/cpu,memory
$ mount -t cgroup -o cpu,memory none /demo/cgroups/v1/cpu,memory
mount: none already mounted or /demo/cgroups/v1/cpu,memory busy
```

可以在 -o 中用 name 为 subsystem 组合命名，命名后可以直接通过名称重复挂载：

```sh
# 指定 active hierarchy 名称 devicesA
$ mount -t cgroup -o devices,name=devicesA none /demo/cgroups/v1/devicesA/

# 直接用 name=devicesA 重复挂载 devices subsystem
$ mount -t cgroup -o name=devicesA none /demo/cgroups/v1/devicesA-1

# devicesA 和 devicesA-1 内容相同
$ ls /demo/cgroups/v1/devicesA
cgroup.clone_children  cgroup.event_control  cgroup.procs  cgroup.sane_behavior  devices.allow  devices.deny  devices.list  notify_on_release  release_agent  tasks
$ ls /demo/cgroups/v1/devicesA-1
cgroup.clone_children  cgroup.event_control  cgroup.procs  cgroup.sane_behavior  devices.allow  devices.deny  devices.list  notify_on_release  release_agent  tasks
```

如果没有为 subsystem 组合命名，重复挂载时只能指定具体组合，排列顺序没有影响。

```sh
# cpuacct,cpu 和 cpu,capuacct 是同一个 active hierarchy
$ mkdir -p /demo/cgroups/v1/cpuacct,cpu/
$ mount -t cgroup -o cpuacct,cpu none /demo/cgroups/v1/cpuacct,cpu/
```

有命名的 subsytem 组合，重复挂载时依然可以指定具体组合。但是如果带有命名，name 必须正确。

```sh
# 已经有 name 的组合，不指定 name 挂载
$ mkdir -p /demo/cgroups/v1/devicesA-2/
$ mount -t cgroup -o devices none /demo/cgroups/v1/devicesA-2/

# 已经有 name 的组合，指定 name 挂载，但是 name 不正确
$ mkdir -p /demo/cgroups/v1/devicesA-3
$ mount -t cgroup -o devices,name=devicesB none /demo/cgroups/v1/devicesA-3/
mount: none already mounted or /demo/cgroups/v1/devicesA-3/ busy
```

## cgroups v1 的文件接口

### group 管理相关接口

cgroups v1 的虚拟文件系统中既包含用于管理 task 分组的文件接口，也有 subsystem 相关的的文件接口。
挂载的时候如果用 `-o none` 表明不关联任何 subsystem，虚拟文件系统中将只存在 group 管理相关的文件接口。

```sh
$ mkdir -p /demo/cgroups/v1/pure-cgroups
# 不关联 subsystem 时，必须用 name 命名
$ mount -t cgroup -o none,name=pure-cgroups pure-cgroups /demo/cgroups/v1/pure-cgroups/
```
注意：不关联 subsystem 时，必须用 name 命名，否则会出现下面的错误：

```sh
$ mount -t cgroup -o none pure-cgroups /demo/cgroups/v1/pure-cgroups/
mount: wrong fs type, bad option, bad superblock on none,
       missing codepage or helper program, or other error
       (for several filesystems (e.g. nfs, cifs) you might
       need a /sbin/mount.<type> helper program)
       In some cases useful info is found in syslog - try
       dmesg | tail  or so
```

cgroups v1 自身的提供文件接口如下：

```sh
$ ls -1 /demo/cgroups/v1/pure-cgroups/
cgroup.clone_children       # flag 0/1，子目录是否继承父目录的 cpuset 配置
cgroup.event_control        # 未找到用法说明 2023-01-15 12:41:35
cgroup.procs                # 可编辑文件，当前分组包含的 thread group IDs，thread group 包含的所有 thread 被一同纳入
cgroup.sane_behavior        # cgroups v2 开发过程中引入，当前保留是为了历史兼容，value 一直为0，详情见 man 7 cgroups
notify_on_release           # flag 0/1，当前分组包含的 task 变为空时，是否调用 release_agent
release_agent               # release_agent 所在的路径
tasks                       # 可编辑文件，当前分组包含的 PID
```

### group 的创建和 task 的增删

新分组创建方法非常简单，在 cgroups v1 的虚拟文件系统中直接用 mkdir 创建子目录即可。

```sh
$ mkdir /demo/cgroups/v1/pure-cgroups/group1
$ ls /demo/cgroups/v1/pure-cgroups/group1
cgroup.clone_children  cgroup.event_control  cgroup.procs  notify_on_release  tasks
```

子目录中会自动出现相应的文件接口，向新分组中添加任务，只需用文本编辑器将 thread group IDs 写入 cgroup.procs，或者将 pid 写入 tasks 文件。

## subsystem 的文件接口

不同 subsystem 的文件接口不同，挂载时用 -o 指定的 subsystem 的文件接口会出现在虚拟文件系统中。

```sh
$ ls /demo/cgroups/v1/memory/memory.*
/demo/cgroups/v1/memory/memory.failcnt                      /demo/cgroups/v1/memory/memory.limit_in_bytes
/demo/cgroups/v1/memory/memory.force_empty                  /demo/cgroups/v1/memory/memory.max_usage_in_bytes
/demo/cgroups/v1/memory/memory.kmem.failcnt                 /demo/cgroups/v1/memory/memory.move_charge_at_immigrate
/demo/cgroups/v1/memory/memory.kmem.limit_in_bytes          /demo/cgroups/v1/memory/memory.numa_stat
/demo/cgroups/v1/memory/memory.kmem.max_usage_in_bytes      /demo/cgroups/v1/memory/memory.oom_control
/demo/cgroups/v1/memory/memory.kmem.slabinfo                /demo/cgroups/v1/memory/memory.pressure_level
/demo/cgroups/v1/memory/memory.kmem.tcp.failcnt             /demo/cgroups/v1/memory/memory.soft_limit_in_bytes
/demo/cgroups/v1/memory/memory.kmem.tcp.limit_in_bytes      /demo/cgroups/v1/memory/memory.stat
/demo/cgroups/v1/memory/memory.kmem.tcp.max_usage_in_bytes  /demo/cgroups/v1/memory/memory.swappiness
/demo/cgroups/v1/memory/memory.kmem.tcp.usage_in_bytes      /demo/cgroups/v1/memory/memory.usage_in_bytes
/demo/cgroups/v1/memory/memory.kmem.usage_in_bytes          /demo/cgroups/v1/memory/memory.use_hierarchy
```

subsystem 种类和参数比较多，而且要理解每类资源具体细节，需要花较多时间逐个学习。

[cgroup-v1][3] 给出了部分 subsystem 的介绍：

* [cpusets](https://www.kernel.org/doc/Documentation/cgroup-v1/cpusets.txt)
* [cpuacct](https://www.kernel.org/doc/Documentation/cgroup-v1/cpuacct.txt)
* [memory](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt)
* [memcg_test](https://www.kernel.org/doc/Documentation/cgroup-v1/memcg_test.txt)
* [hugetlb](https://www.kernel.org/doc/Documentation/cgroup-v1/hugetlb.txt)
* [net_cls](https://www.kernel.org/doc/Documentation/cgroup-v1/net_cls.txt)
* [net_prio](https://www.kernel.org/doc/Documentation/cgroup-v1/net_prio.txt)
* [devices](https://www.kernel.org/doc/Documentation/cgroup-v1/devices.txt)
* [blkio-controller](https://www.kernel.org/doc/Documentation/cgroup-v1/blkio-controller.txt)
* [freezer-subsystem](https://www.kernel.org/doc/Documentation/cgroup-v1/freezer-subsystem.txt)
* [pids](https://www.kernel.org/doc/Documentation/cgroup-v1/pids.txt)
* [rdma](https://www.kernel.org/doc/Documentation/cgroup-v1/rdma.txt)

## 参考

1. [李佶澳的博客][1]
2. [Linux Programmer's Manual: CGROUPS(7)][2]
3. [doc/Documentation/cgroup-v1/][3]
4. [doc/Documentation/cgroup-v1/cgroups.txt][4]
5. [doc/Documentation/cgroup-v2.txt][5]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://man7.org/linux/man-pages/man7/cgroups.7.html "Linux Programmer's Manual: CGROUPS(7)"
[3]: https://www.kernel.org/doc/Documentation/cgroup-v1/ "doc/Documentation/cgroup-v1/"
[4]: https://www.kernel.org/doc/Documentation/cgroup-v1/cgroups.txt "doc/Documentation/cgroup-v1/cgroups.txt"
[5]: https://www.kernel.org/doc/Documentation/cgroup-v2.txt "doc/Documentation/cgroup-v2.txt"
