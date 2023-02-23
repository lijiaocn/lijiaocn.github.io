---
layout: default
title: "cgroups: 入门指引和 cgroup v1 的基础使用"
author: 李佶澳
date: "2023-01-14 14:30:06 +0800"
last_modified_at: "2023-02-22 13:18:39 +0800"
categories: 技巧
cover:
tags: cgroup
keywords: cgroups
description: cgroups 是在 linux kernel 中运行的一种机制，它提供了一种将系统上的资源和 task 进行分组管理的方法。cgroups 的英文全称为 Control Groups，即控制分组。
---

## 目录

* auto-gen TOC:
{:toc}

## cgroups 的作用

cgroups 是在 linux kernel 中运行的一种机制，它提供了一种将系统上的 task 进行分组管理的方法。
cgroups 的英文全称为 Control Groups，即控制组。控制组支持层级结构，用目录树的方式描述，每个目录对应一个分组。

面向系统用户，cgroups 将控制组以虚拟文件系统的方式呈现，展示出一个树形的文件目录，通过目录中文件接口来调整控制组以及涉及的 subsystem。
面向内核开发，cgroups 定义了一套内核 API，支持各种 subsystem  的接入。

subsystem 从 cgroups 中获悉每个控制组中的 task，进而对 task 进行管控。
一个 subsystem 通常负责管控某一类资源的使用配额，比如 CPU、内存、带宽、进程号等，也被称为 resource controller。

cgroups 有 v1 和 v2 两个版本，两个版本都有实际应用，这里先学习 cgroups v1。

## cgroups v1 的虚拟文件系统

cgroups 是在 kernel 中运行的机制，需要先用 mount 命令挂载它的虚拟文件系统，把它的文件接口暴露出来。

cgroups v1 和 cgroup v2 的挂载方式略有不同，这里以 cgroups v1 为例：

```sh
# -t 指定 vfstype 为 cgroup
# xxx 是设备名，会在 /proc/mounts 出现，cgroups 自身不会用到设备名，可以根据自身的管理需要来定义设备名
$ mount -t cgroup xxx /sys/fs/cgroup
```

挂载操作只是将运行在内核中的 cgroups 的状态暴露出来，可以多次挂载到不同的目录中（每个挂载目录中的内容都相同）。linux 发行版通常已经默认挂载到 /sys/fs/cgroup 。

CentOS 是先挂载一个 tmpfs 类型的文件系统，然后作为 cgroup 的挂载点：

```sh
$ cat /proc/mounts  |grep cgroup
# /sys/fs/cgroup 是一个 tmpfs
tmpfs /sys/fs/cgroup tmpfs ro,seclabel,nosuid,nodev,noexec,mode=755 0 0      
# /sys/fs/cgroup/* cgroup v1 每类资源的挂载点
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

创建一个新目录，在这个目录来演示后续的 cgroups v1 操作：

```sh
$ mkdir -p /demo/cgroups/v1
$ mount -t tmpfs tmpfs_for_cgroups_v1 /demo/cgroups/v1
```

## cgroups v1 的资源管理理念

cgroups v1 的资源管理理念：每类资源或资源组合单独一个目录，在其中管理所有 task 对该类资源的使用。

挂载 cgroups v1 的虚拟文件系统时，要用 -o 指定目标目录要关联的 subsystem（即 resource controller），多个 subsystem 之间用“,”间隔。

```sh
# 在目标目录中挂载一个 subsystem： memory
$ mkdir -p /demo/cgroups/v1/memory
$ mount -t cgroup -o memory none /demo/cgroups/v1/memory

# 在目标目录中挂载两个 subsystem： cpu 和 cpuacct 
$ mkdir -p /demo/cgroups/v1/cpu,cpuacct
$ mount -t cgroup -o cpu,cpuacct none /demo/cgroups/v1/cpu,cpuacct
```

cgroups v1 会为每个 subsystem 组合创建一个 `active hierarchy`。挂载时先检查 -o 指定的 subsystem 组合是否已经有对应的 active hierarchy，如果已有，就直接复用。
从用户的角度看，就是一个 subsystem 组合可以多次挂载到不同的目录中，但是这些目录中的内容是完全相同的，因为关联的是同一个 active hierarchy。

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

一个 subsystem 只能在所有的 active hierarchy 中出现一次，比如 cpu 和 cpuacct 已经出现在 cpu,cpuacct 组合对应的 active hierarchy，不能再出现在别的组合中：

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

可以在 -o 中用 "name=xxx" 为 subsystem 组合命名，命名后可以直接通过名称重复挂载：

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

如果没有为 subsystem 组合命名，重复挂载时只能指定具体组合，排列顺序可以不同。

```sh
# cpuacct,cpu 和 cpu,capuacct 是同一个 active hierarchy
$ mkdir -p /demo/cgroups/v1/cpuacct,cpu/
$ mount -t cgroup -o cpuacct,cpu none /demo/cgroups/v1/cpuacct,cpu/
```

有命名的 subsystem 组合，重复挂载时依然可以指定具体组合。但是如果带有命名，name 必须正确。

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

cgroups v1 的虚拟文件系统中默认包含控制组的文件接口，如果绑定了 subsystem，还会包含对应 subsystem 的文件接口。
挂载的时候用 `-o none` 表明不关联任何 subsystem，目录中将只存在控制组的文件接口。

```sh
$ mkdir -p /demo/cgroups/v1/pure-cgroups
# 不关联 subsystem 时，必须用 name 命名
$ mount -t cgroup -o none,name=pure-cgroups pure-cgroups /demo/cgroups/v1/pure-cgroups/
```

不关联 subsystem 时，必须用 name 命名，否则会出现下面的错误：

```sh
$ mount -t cgroup -o none pure-cgroups /demo/cgroups/v1/pure-cgroups/
mount: wrong fs type, bad option, bad superblock on none,
       missing codepage or helper program, or other error
       (for several filesystems (e.g. nfs, cifs) you might
       need a /sbin/mount.<type> helper program)
       In some cases useful info is found in syslog - try
       dmesg | tail  or so
```

cgroups v1 控制组的文件接口如下：

```sh
$ ls -1 /demo/cgroups/v1/pure-cgroups/
cgroup.clone_children       # flag 0/1，子目录是否继承父目录的 cpuset 配置
cgroup.event_control        # 未找到用法说明 2023-01-15 12:41:35
cgroup.procs                # 可编辑文件，当前分组包含的 thread group IDs，thread group 包含的所有 thread 被一同纳入
cgroup.sane_behavior        # cgroups v2 开发过程中引入，当前保留是为了历史兼容，value 一直为0，详情见 man 7 cgroups
notify_on_release           # flag 0/1，当前分组包含的 task 变为空时，是否调用 release_agent
release_agent               # release_agent 所在的路径，只存在于 cgroup 的顶层目录
tasks                       # 可编辑文件，当前分组包含的 PID
```

### 控制组创建和包含的 task 管理

新控制组的创建方法非常简单，在 cgroups v1 的虚拟文件系统中直接用 mkdir 创建子目录即可。

```sh
$ mkdir /demo/cgroups/v1/pure-cgroups/group1
$ ls /demo/cgroups/v1/pure-cgroups/group1
cgroup.clone_children  cgroup.event_control  cgroup.procs  notify_on_release  tasks
```

子目录中会自动出现相应的文件接口。

cgroup.procs 和 tasks 用来管理控制组包含的 task，cgroup.procs 管理的是 thread group ID，tasks 管理的是 pid。通过编辑文件内容来进行 task 的增删。

### notify_on_release

notify_on_release 设置为 1 时，所在分组中的 tasks 变为空时，会调用 release_agent 中指定的命令，入参为对应的 cgroups 目录路径。

准备文件 /root/agent.sh ，内容如下: 

```bash
#!/bin/bash
echo $* >>/tmp/cgroup_release_note.log
```

给予执行权限: 

```sh
chmod +x /root/agent.sh
```

为 /demo/cgroups/v1/pure-cgroups/ 配置 release_agent（release_agent 只在顶层目录中存在）:

```sh
$ echo "/root/agent.sh" > /demo/cgroups/v1/pure-cgroups/release_agent
```

触发 release_agent 执行：

```sh
# 创建新的分组 group2
$ mkdir -p /demo/cgroups/v1/pure-cgroups/group2
# 启动 group2 的 notify_on_release
$ echo 1 >/demo/cgroups/v1/pure-cgroups/group2/notify_on_release
# 向 group2 添加 task：将当前 sh 加入 group2
echo $$ >/demo/cgroups/v1/pure-cgroups/group2/tasks
# 从 group2 移除 task：将当前 sh 移动到 group2 的父目录，移动后 group2 中的 task 为空
echo $$ >/demo/cgroups/v1/pure-cgroups/tasks
```

/root/agent.sh 被执行，结果如下：

```sh
$ cat /tmp/cgroup_release_note.log
/group2
```

## subsystem 的文件接口

挂载时用 -o 指定的 subsystem 的文件接口会出现在虚拟文件系统中，subsystem 的文件接口各不相同。

memory subsystem 的文件接口：

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

subsystem 的文件接口和管理的资源类型相关，需要花较多时间逐个学习。

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

### net_cls: 为报文标记 classid



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
