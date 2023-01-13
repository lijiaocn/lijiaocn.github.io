---
layout: default
title: "Linux的cgroup功能（一）: 初级入门使用方法"
author: 李佶澳
createdate: 2017/07/26 10:29:51
last_modified_at: "2019-02-28 19:06:10 +0800"
categories: 技巧
tags:  linux cgroup
keywords: cgroup使用,cgroup.procs,cgroup v1,cgroup v2,cgroup controller,linux资源控制器,资源隔离
description: linux的cgroup功能的初级入门使用，在每个subsystem目录下建立多个目录，每个目录就是一个cgroup，可以分别设置每个cgroup，cgroup中可以继续创建cgroup。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这篇笔记记录时间较早，当时对cgroup了解十分有限，笔记中存在有一些表述不对的地方，譬如`进程的关联与解除`一节中，写入task文件的应该是线程号（cgroup v1支持task文件），绑定进程应该使用接口文件`cgroup.procsi`，见[Linux的资源限制功能cgroup v1和cgroup v2的详细介绍](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html#cgroups-v1cgroup%E7%9A%84%E5%88%9B%E5%BB%BA%E5%92%8C%E8%BF%9B%E7%A8%8B%E7%BB%91%E5%AE%9A)。

cgroup相关的学习笔记：

1. [Linux的cgroup功能（一）：初级入门使用方法](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html)
2. [Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html)
3. [Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html)

## 介绍

[cgroup-v1][1]和[cgroup-v2][2]中做了很详细的介绍。

To mount a cgroup hierarchy with all available subsystems

cgroup有多个subsystem，通过下面的命令可以挂载所有的subsystem:

	mount -t cgroup xxx /sys/fs/cgroup

xxx可以是任意字符，CentOS默认为tmpfs，例如:

	$df |grep cgroup
	tmpfs             1940928         0   1940928   0% /sys/fs/cgroup

/sys/fs/cgroup/目录下就是所有可用的subsystem:

	$ls /sys/fs/cgroup/
	blkio  cpu  cpuacct  cpu,cpuacct  cpuset  devices  freezer  hugetlb  
	memory  net_cls  net_cls,net_prio  net_prio  perf_event  pids  systemd

不同的subsystem有不同的用法。

## 进程的关联与解除

可以在每个subsystem目录下建立多个目录，每个目录就是一个cgroup，可以分别设置每个cgroup。

cgroup中可以继续创建cgroup。

将进程号写入对应的一个cgroup目录的task文件中，即将进程纳入了对应的cgroup。

**纠错**：写入task文件的是线程号，并且只有cgroup v1支持task文件，进程号应该写入接口文件`cgroup.procs`，见[cgroups v1：cgroup的创建和进程绑定](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html#cgroups-v1cgroup%E7%9A%84%E5%88%9B%E5%BB%BA%E5%92%8C%E8%BF%9B%E7%A8%8B%E7%BB%91%E5%AE%9A)。@2019-02-18 11:45:26

将进程号写入另一个cgroup的task或者cgroup.procs文件后，自动将其从原先的cgroup的移除。

cgroup.procs会将同一个threadgroup中所有的进程都关联到cgroup。

## pids

pids用来限制一个进程可以派生出的进程数量。

如果系统中没有挂载pids，先挂载:

	mkdir -p /sys/fs/cgroup/pids
	mount -t cgroup -o pids none /sys/fs/cgroup/pids

然后创建一个名为parent的目录，也就是一个cgroup：

	mkdir -p /sys/fs/cgroup/pids/parent

设置最大进程数为3:

	echo 3 > /sys/fs/cgroup/pids/parent/pids.max

将当前的shell进程关联到cgroup:

	echo $$ > /sys/fs/cgroup/pids/parent/cgroup.procs

## 参考

1. [kernel documentation: cgroup-v1][1]
2. [kernel documentation: cgroup-v2][2]
3. [linux manual: systemd.cgroup][3]
4. [how-to-manage-processes-with-cgroup-on-systemd][4]
5. [The New Control Group Interfaces][5]
6. [美团技术团队：Linux资源管理之cgroups简介][6]

[1]: https://www.kernel.org/doc/Documentation/cgroup-v1/  "cgroup-v1" 
[2]: https://www.kernel.org/doc/Documentation/cgroup-v2.txt  "cgroup-v2"
[3]: http://man7.org/linux/man-pages/man5/systemd.cgroup.5.html  "systemd.cgroup"
[4]: https://linuxaria.com/article/how-to-manage-processes-with-cgroup-on-systemd  "how-to-manage-processes-with-cgroup-on-systemd"
[5]: https://www.freedesktop.org/wiki/Software/systemd/ControlGroupInterface/ "The New Control Group Interfaces"
[6]: https://tech.meituan.com/2015/03/31/cgroups.html "美团技术团队：Linux资源管理之cgroups简介"
