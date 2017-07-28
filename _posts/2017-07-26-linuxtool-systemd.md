---
layout: default
title: systemd的使用
author: lijiaocn
createdate: 2017/07/26 15:00:20
changedate: 2017/07/28 16:33:06
categories: linuxtool
tags: linuxtool systemd cgroup
keywords: systemd,cgroup
description: systemd的使用

---

* auto-gen TOC:
{:toc}

## 介绍

[systemd][1]和[systemd.unit][1]中对systemd做了概括介绍。

systemd是系统的1号进程，负责加载和管理其它的服务，它所管理的内容称为`unit`。

unit有11类型，有的是通过unit文件描述，有的则是动态、运行时产生。

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

## systemd的cgroup设置

[The New Control Group Interfaces][4]中介绍了systemd和cgroup的关系，以及如何systemd管理的进程的cgroup。

systemd将进程按照service、scope和slice分组:

	service: 由systemd通过.service文件启动创建的进程
	scopes:  任意一个进程创建的进程，被通过dbus接口注册到了PID1
	slices:  slices中包含service、scopes或者继续包含slices

每个进程组在/sys/fs/cgroup有对应的cgroup目录，可以通过`systemd-cgls`查看。

可以在unit的文件中设置unit可以用的资源，[systemd.resource-control][3]给出了可以设置的项目。

已经存在的进程组，可以通过set-property设置:

	systemctl set-property httpd.service CPUShares=500 MemoryLimit=500M

## 参考

1. [man systemd][1]
2. [man systemd.unit][2]
3. [man systemd.resource-control][3]
4. [The New Control Group Interfaces][4]
5. [man systemd.service][5]
6. [man systemd.socket][6]
7. [man daemon][7]
8. [man systemd.target][8]
9. [man systemd.device][9]
10. [man systemd.mount][10]
11. [man systemd.automount][11]
12. [man systemd.timer][12]
13. [man systemd.swap][13]
14. [man systemd.path][14]
15. [man systemd.slice][15]
16. [man systemd.scope][16]
17. [man systemd.special][17]

[1]: https://www.freedesktop.org/software/systemd/man/systemd.html#  "man systemd"
[2]: https://www.freedesktop.org/software/systemd/man/systemd.unit.html  "man systemd.unit" 
[3]: https://www.freedesktop.org/software/systemd/man/systemd.resource-control.html "man systemd.resource-control"
[4]: https://www.freedesktop.org/wiki/Software/systemd/ControlGroupInterface/  "The New Control Group Interfaces"
[5]: https://www.freedesktop.org/software/systemd/man/systemd.service.html#  "man systemd.service"
[6]: https://www.freedesktop.org/software/systemd/man/systemd.socket.html#  "man systemd.socket"
[7]: https://www.freedesktop.org/software/systemd/man/daemon.html# "man daemon"
[8]: https://www.freedesktop.org/software/systemd/man/systemd.target.html# "man systemd.target"
[9]: https://www.freedesktop.org/software/systemd/man/systemd.device.html#  "man systemd.device"
[10]: https://www.freedesktop.org/software/systemd/man/systemd.mount.html# "man systemd.mount"
[11]: https://www.freedesktop.org/software/systemd/man/systemd.automount.html# "man systemd.automount"
[12]: https://www.freedesktop.org/software/systemd/man/systemd.timer.html#  "man systemd.timer"
[13]: https://www.freedesktop.org/software/systemd/man/systemd.swap.html# "man systemd.swap"
[14]: https://www.freedesktop.org/software/systemd/man/systemd.path.html# "man systemd.path"
[15]: https://www.freedesktop.org/software/systemd/man/systemd.slice.html# "man systemd.slice"
[16]: https://www.freedesktop.org/software/systemd/man/systemd.scope.html# "man systemd.scope"
[17]: https://www.freedesktop.org/software/systemd/man/systemd.special.html# "man systemd.special"
