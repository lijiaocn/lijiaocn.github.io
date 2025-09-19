---
layout: default
title: "systemd: Linux 系统服务管理（待完善）"
author: 李佶澳
createdate: 2017/07/26 15:00:20
last_modified_at: 2018/07/22 14:27:28
categories: 技巧
tags: manual
keywords: systemd,cgroup
description: systemd的使用

---

## 目录
* auto-gen TOC:
{:toc}

## 介绍

systemd 是一个 linux 服务的管理程序。使用 systemd 进行 linux 服务管理的时候，将其作为系统的 1 号进程启动，按照配置依赖关系顺次启动需要的系统服务（手册 [man systemd][1])。

## systemd 要解决的问题以及设计思路

[Rethinking PID 1][6] 介绍了 systemd 要解决的问题以及设计思路。systemd 是为了加快系统启动时的初始化过程，并简化服务间的依赖关系管理。

初始化过程通过将串行过程改成并行来加快，服务间的依赖关系通过 listen socket、dbus 和 autofs 来简化。

* 传统的基于 socket 的 Unix daemons，在初始化完成之前先创建 listen socket（AF_UNIX/AF_INET），从而使依赖它的 client 无需等它初始化完成就可以连接 socket。（需要 socket 的响应的 client 被阻塞直到依赖的服务初始化完成）
* 新式的基于 D-Bus 的 Unix daemons，直接复用 D-Bus 的能力实现懒加载
* 被依赖的文件系统先用 autofs 模拟，挂载到目标位置，等真实文件系统初始化完成后再切换
* 通过为每个服务创建一个 cgroup 实现服务 fork 的所有进程的跟踪纳管
* 将用脚本编写的初始化过程用 C 语言重写并集成到 systemd
* 每个服务的运行环境都可以单独配置（环境变量、能使用的资源等）

Systemd 将系统初始化过程需要的操作都纳入管理，不仅定义了 Service，还定义了 Socket、Device、Mount、Automount、Timer、Swap、Path、Scope，以及用来表示分组的 Target 和 Slice。

## unit

#### unit 种类

Systemd 的管理目标用 unit 文件描述，unit 一种有11 种类型（手册[man systemd.unit][2]），对应 11 种目标：

```sh
1. Service units, which start and control daemons and the processes they consist of.
   For details, see systemd.service(5).
2. Socket units, which encapsulate local IPC or network sockets in the system, useful for socket-based activation. 
   For details about socket units, see systemd.socket(5)
   For details on socket-based activation and other forms of activation, see daemon(7).
3. Target units are useful to group units, or provide well-known synchronization points during boot-up.
   See systemd.target(5).
4. Device units expose kernel devices in systemd and may be used to implement device-based activation.
   For details, see systemd.device(5).
5. Mount units control mount points in the file system.
   For details see systemd.mount(5).
6. Automount units provide automount capabilities, for on-demand mounting of file systems as well as parallelized boot-up. 
   See systemd.automount(5).
7. Timer units are useful for triggering activation of other units based on timers. 
   See systemd.timer(5).
8. Swap units are very similar to mount units and encapsulate memory swap partitions or files of the operating system. 
   See systemd.swap(5).
9. Path units may be used to activate other services when file system objects change or are modified. 
   See systemd.path(5).
10. Slice units may be used to group units which manage system processes (such as service and scope units) in a hierarchical tree for resource management purposes. 
    See systemd.slice(5).
11. Scope units are similar to service units, but manage foreign processes instead of starting them as well. 
    See systemd.scope(5).
```

### unit 语法

unit 文件的格式语法见 [man systemd.syntax][9]，通用语法见 [man systemd.unit][7]。每一类 unit 文件的用法用 man unittype 查看，比如：[man systemd.service][8]。

### 系统上的 unit 文件

系统服务的 unit 文件默认存放在 /lib/systemd/system 目录：

```sh
$ pkg-config systemd --variable=systemdsystemunitdir
/lib/systemd/system

$ ls /lib/systemd/system
ModemManager.service    emergency.target   ...省略...
```

用户服务的 unit 文件默认存放在 /lib/systemd/user 目录，但是在 /etc/systemd/user 中创建符号连接（手册中解释是为了遵守 [XDG Base Directory specification][5]）：

```sh
$ pkg-config systemd --variable=systemduserconfdir
/etc/systemd/user

$ ls /etc/systemd/user
sockets.target.wants
```

systemd 按需加载 unit 文件，列出所有已经加载的 unit：

```sh
systemctl list-units --all
```

## systemd 和 cgroups 关系

systemd 挂载一个没有任何 subsystem 的 cgroups 目录来进行 daemon 进程的跟踪，命名为 systemd：

```sh
$ cat /proc/mounts | grep name=systemd
cgroup /sys/fs/cgroup/systemd cgroup rw,nosuid,nodev,noexec,relatime,xattr,name=systemd 0 0
```

启动的 service 都有一个对应的同名目录，比如 ssh.service：

```sh
$ ls /sys/fs/cgroup/systemd/system.slice/ssh.service/
cgroup.clone_children  cgroup.procs  notify_on_release  tasks
```

从 “/proc/进程号/cgroup” 中也可看到进程隶属的 cgroup：

```sh
$ cat /proc/671/cgroup
12:freezer:/
11:hugetlb:/
10:pids:/system.slice/ssh.service
9:blkio:/system.slice/ssh.service
8:cpuset:/
7:net_cls,net_prio:/
6:rdma:/
5:memory:/system.slice/ssh.service
4:perf_event:/
3:devices:/system.slice/ssh.service
2:cpu,cpuacct:/system.slice/ssh.service
1:name=systemd:/system.slice/ssh.service
0::/system.slice/ssh.service
```

[The New Control Group Interfaces][4] 中介绍了 systemd 和 cgroup 的关系，以及如何设置 systemd 管理的进程的 cgroup。

systemd 将纳管的服务进程按照 service、scope 和 slice 分类:

```sh
service: 由 systemd 通过.service文件启动创建的进程
scopes:  任意一个进程创建的进程，被通过 dbus 接口注册到了 PID1
slices:  slices 中包含 service、scopes 或者继续包含 slices
```

每个进程组在 /sys/fs/cgroup 有一个对应的 cgroup 目录，可以通过 `systemd-cgls` 查看。

可以在 unit 的文件中设置 unit 可以用的资源，[systemd.resource-control][3] 给出了可以设置的项目。

已经存在的进程组，可以通过 set-property 设置:

```sh
systemctl set-property httpd.service CPUShares=500 MemoryLimit=500M
```

## 参考

1. [man systemd][1]
2. [man systemd.unit][2]
3. [man systemd.resource-control][3]
4. [The New Control Group Interfaces][4]
5. [XDG Base Directory specification][5]
6. [Rethinking PID 1][6]
7. [man systemd.unit][7]
8. [man systemd.service][8]
9. [man systemd.syntax][9]

[1]: https://man7.org/linux/man-pages/man1/init.1.html "man systemd"
[2]: https://man7.org/linux/man-pages/man5/systemd.unit.5.html "man systemd.unit" 
[3]: https://man7.org/linux/man-pages/man5/systemd.resource-control.5.html "man systemd.resource-control"
[4]: https://www.freedesktop.org/wiki/Software/systemd/ControlGroupInterface/  "The New Control Group Interfaces"
[5]: http://standards.freedesktop.org/basedir-spec/basedir-spec-latest.html "XDG Base Directory specification"
[6]: http://0pointer.de/blog/projects/systemd.html  "Rethinking PID 1"
[7]: https://man7.org/linux/man-pages/man5/systemd.unit.5.html  "man systemd.unit"
[8]: https://man7.org/linux/man-pages/man5/systemd.service.5.html "man systemd.service"
[9]: https://man7.org/linux/man-pages/man7/systemd.syntax.7.html "man systemd.syntax"
