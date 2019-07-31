---
layout: default
title: "Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍"
author: 李佶澳
createdate: "2019-01-28 15:52:58 +0800"
last_modified_at: "2019-03-08 11:07:22 +0800"
categories: 技巧
tags: linux cgroup
keywords: cgroup介绍文档,cgroup v1,cgroup v2,cgroup controller,linux资源隔离,linux资源控制器
description: "详细介绍cgroup v1和cgroup v2，cgroup v2从kernel 3.10开始存在，kernel 4.5.0时成为正式特性"
---

## 目录
* auto-gen TOC:
{:toc}

## cgroups - Linux control groups

之前简单学习过cgroup，当时了解地太浅了，遇到问题的时候，还是无法下手，于是深入学习下。
这篇笔记中的内容主要来自Linux手册：man 7 cgroups（奇怪的是centos7上没有该页），[cgroups - Linux control groups][2]。

cgroup相关的学习笔记：

1. [Linux的cgroup功能（一）：初级入门使用方法](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html)
2. [Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html)
3. [Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html)


### 术语

这篇笔记有可能是第一篇详细、全面介绍了cgroup v1和cgroup v2的中文资料，有必要约定术语、统一口径，可以减少交流障碍。

`process`是“**进程**”，`task`是“**线程**”。

`subsystem`或者`resource controllers`是cgroup中某一类资源的管理器，例如管理cpu的叫做cpu controller，管理内存的叫做memory controller，统一称呼为“**cgroup控制器**”。

controller要使用`mount -t cgroup`样式的命令挂载到一个目录中，这个操作称呼为“**挂载cgroup controller**”。

从linux kernel 4.14开始，cgroup v2 引入了`thread mode`（线程模式），controller被分为`domain controller`和`threaded controller`，前者称为“**cgroup进程控制器**”，后者称为“**cgroup线程控制器**”。

从使用的角度看，cgroup就是一个目录树，目录中可以创建子目录，这些目录称为“**cgroup 目录**”，在一些场景中为了体现层级关系，还会称为“**cgroup 子目录**”。

每个目录中有一些用来设置对应controller的文件，这些文件称呼为“**cgroup控制器的文件接口**”。

cgroup v2引入了thread mode（线程模式）之后，cgroup目录有了类型之分：只管理进程的cgroup目录是`domain cgroup`，称为“**进程(子)目录**”；新增的管理线程的cgroup目录是`threaded cgroup`，称为“**线程子目录**”。

**一句话介绍cgroup**：把一个cgroup目录中的资源划分给它的子目录，子目录可以把资源继续划分给它的子目录，为子目录分配的资源之和不能超过父目录，进程或者线程可以使用的资源受到它们委身的目录中的资源的限制。

### 版本

cgroup有v1和v2两个版本，这是一个**非常重要**的信息。

v1版本是最早的实现，当时resource controllers的开发各自为政，导致controller间存在不一致，并且controller的嵌套挂载使cgroup的管理非常复杂。

Linux kernel 3.10 开始提供v2版本cgroup（[Linux Control Group v2][3]）。开始是试验特性，隐藏在挂载参数`-o __DEVEL__sane_behavior`中，直到`Linuxe Kernel 4.5.0`的时候，cgroup v2才成为正式特性。

cgroup v2希望完全取代cgroup v1，但是为了兼容，cgroup v1没有被移除。

cgroup v2实现的controller是cgroup v1的子集，可以同时使用cgroup v1和cgroup v2，但一个controller不能既在cgroup v1中使用，又在cgroup v2中使用。

## cgroups version 1

cgroup v1中，controller可以独立挂载到一个cgroup目录中，也可以和其它controller联合挂载到同一个cgroup目录，cgroup v2也是采用挂载的方式，但是有一些不同（见后文）。

在cgroup v1中，task也就是线程可以被划分到不同的cgroup组中，在一些场景中，这样做是有问题的。

例如在memory controller中，所有task使用的都是同样的内存地址空间，为它们设置不同memory cgroup是没有意义的。（cgroup v2最初将task功能去掉了，后来引入了`thread mode`来限制线程占用的资源）

### cgroups v1：controller 挂载

controller以`tmpfs`文件系统的样式挂载到任意目录，通常将其挂载到/sys/fs/cgroup目录。

linux系统通常已经将多个controller挂载在/sys/fs/cgroup目录中了，下面的例子用另一个目录演示。

将多个controller挂载到同一个目录，如下：

	mkdir -p /tmp/cgroup/cpu,cpuacct
	mount -t cgroup -o cpu,cpuacct none  /tmp/cgroup/cpu,cpuacct

`-t cgroup`指定挂载类型，`-o`指定挂载的controller（可以有多个，用“,”间隔）。

单独挂载cpu时，提示“已经挂载或者/tmp/cgroup/cpu is busy，暂时不清楚是怎么回事，可能是有一些controller不允许重复挂载。

	$ mkdir /tmp/cgroup/cpu
	$ mount -t cgroup -o cpu none /tmp/cgroup/cpu
	mount: none is already mounted or /tmp/cgroup/cpu busy

挂载后，可以在挂载目录中看到controller的文件接口： 

	$ ls -F /tmp/cgroup/cpu,cpuacct/
	cgroup.clone_children  cpuacct.stat          cpu.cfs_quota_us   cpu.stat   kube-proxy/        tasks
	cgroup.event_control   cpuacct.usage         cpu.rt_period_us   docker/    notify_on_release  user.slice/
	cgroup.procs           cpuacct.usage_percpu  cpu.rt_runtime_us  kubelet/   release_agent
	cgroup.sane_behavior   cpu.cfs_period_us     cpu.shares         kubepods/  system.slice/

可以一次挂载所有的controller：

	mount -t cgroup -o all cgroup /tmp/cgroup

还可以不挂载任何controller：

	mount -t cgroup -o none,name=somename none /some/mount/point

没有挂载controller的cgroup可以用来跟踪进程，例如在进程消失导致cgroup为空时，cgroup的通知回调会被触发。

### cgroups v1：controller 卸载

直接用umount卸载：

	umount /sys/fs/cgroup/pids

卸载的时候要注意，需要先将所有子目录卸载，否则，umount只会让挂载点不可见，而不是真正将其卸载。

### cgroups v1：支持的 controller

这个是重点，使用cgroup主要就是和各种controller打交道：

**cpu**，
[CFS Scheduler](https://www.kernel.org/doc/Documentation/scheduler/sched-design-CFS.txt)、
[CFS Bandwidth Control](https://www.kernel.org/doc/Documentation/scheduler/sched-bwc.txt)
:

	since 2.6.24，限制CPU份额，只会在cpu忙碌的时候限制cpu使用，如果cpu空闲不做限制。
	since 3.2.0， 引入了`CON‐FIG_CFS_BANDWIDTH`编译选项，限制进程在每个调度周期占用的时间，无论CPU是否空闲。

**cpuacct**，[Documentation/cgroup-v1/cpuacct.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/cpuacct.txt):

	since 2.6.24，统计一组task的cpu使用情况。

**cpuset**，[Documentation/cgroup-v1/cpusets.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/cpusets.txt):

	since 2.6.24，绑定到特定的cpu

**memory**，[Documentation/cgroup-v1/memory.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt):

	since 2.6.25，报告和限制内存使用情况

**devices**，[Documentation/cgroup-v1/devices.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/devices.txt):

	since 2.6.26，限制设备文件的创建，和对设备文件的读写

**freezer**，[Documentation/cgroup-v1/freezer-subsystem.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/freezer-subsystem.txt):

	since 2.6.28，暂停、重载指定cgroup目录中的、以及它的子目录中的task

**net_cls**，[Documentation/cgroup-v1/net_cls.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/net_cls.txt):

	since 2.6.29，为该cgroup内的task产生的报文打上classid

**blkio**，[Documentation/cgroup-v1/blkio-controller.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/blkio-controller.txt):

	since 2.6.33，限制和控制对块设备的读写

**perf_event**，tools/perf/Documentation/perf-record.txt:

	since 2.6.39，允许perf观测cgroup中的task

**net_prio**，[Documentation/cgroup-v1/net_prio.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/net_prio.txt):

	since 3.3，设置net优先级

**hugetlb**，[Documentation/cgroup-v1/hugetlb.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/hugetlb.txt):

	since 3.5，限制huge page的使用

**pids**，[Documentation/cgroup-v1/pids.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/pids.txt):

	since 4.3，限制cgroup中可创建的进程数

**rdma**，[Documentation/cgroup-v1/rdma.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/rdma.txt):

	since 4.11，限制RDMA/IB 资源

### cgroups v1：cgroup的创建和进程绑定

cgroup是以目录的形式呈现的，`/`是cgroup的根目录，注意cgroup的根目录和挂载目录不是一回事，cgroup可能挂载在/sys/fs/cgroup或者/tmp/cgroup等任意目录，无论挂载在哪里，cgroup的根目录都是“`/`”。

假设cgroup的cpu controller的挂载点是/sys/fs/cgroup/cpu，那么目录`/sys/fs/cgroup/cpu/cg1`对应的cgroup的目录是`/cg1`。

为什么要强调这个，因为在调查一个kubelet的问题的时候，不确定`--runtime-cgroups`参数值中要不要包含挂载点路径，直到[用cadvisor查出所有cgroup][4]后，才确定不应该带有挂载路径。现在从Linux手册中找到支持了：

	A cgroup filesystem initially contains a single root cgroup, '/',
	which all processes belong to.  A new cgroup is created by creating a
	directory in the cgroup filesystem:
	
	      mkdir /sys/fs/cgroup/cpu/cg1

将进程的进程号直接写入到对应`cgroup.procs`文件中，就完成了进程与cgroup的绑定，例如：

	echo $$ > /sys/fs/cgroup/cpu/cg1/cgroup.procs

将进程绑定到cgroup之后，该进程创建的线程也一同被绑定到同一个cgroup。

每个进程只能绑定每个controller的一个cgroup目录，把进程的ID加到controller中的另一个cgroup目录的cgroup.procs文件中时，会自动将其从原先的cgroup.procs文件中移除。

每次只能向`cgroup.procs`中添加一个进程号，不能批量添加。

从cgroup.procs中读取的进程号的顺序是随意的，并且是可以重复的。

cgroup v1支持将线程（task）绑定到cgroup目录，只需将线程的线程ID写入目标cgroup目录的`tasks`文件中。

注意，`tasks`文件中是线程ID，`cgroup.procs`文件中是进程ID。

### cgroups v1：cgroup的删除

在cgroup子目录已经全部删除，并且没有绑定任何进程、线程的情况下，直接删除cgroup目录即可。

### cgroups v1：cgroup为空时，进行回调通知

每个cgroup中目录中都有下面两个文件：

	release_agent   notify_on_release

`notify_on_release`的内容是0或者1，指示kernel是否要在cgroup为空时（没有cgroup子目录、没有绑定任何进程）发出通知，0为不通知，1为通知。

`release_agent`是自行设置的、kernel通知时调用的命令， 它的命令行参数有且只有一个，就是当前为空的cgroup目录。

release_agent也可以在挂载cgroup的时候设置：

	mount -o release_agent=pathname ...

## cgroups version 2

[cgroups v2][5]支持的所有controller使用统一约定的、固定格式的cgroup目录，并且进程只能绑定到cgroup的“`/`”目录和目录树中的叶子节点，`不能绑定到中间目录`。变化还是比较大的，需要特别注意：

1. cgorup v2支持的controller默认自动挂载，并且挂载点中的目录结构是固定的
2. 进程只能绑定到cgroup的“`/`”目录和cgroup目录树中的`叶子节点`
3. 在cgroup.controllers和cgroup.subtree_control中设置cgroup目录中可用的controller
4. cgroup v1中的tasks文件被移除，cpuset controller中的cgroup.clone_children文件也被移除
5. cgroup目录为空时的通知机制得到改进，通过`cgroup.events`文件通知

内核文档[Documentation/cgroup-v2.txt][5]中有更详细的描述。

### cgroups v2：controller 挂载

类型为`cgroup2`：

	mount -t cgroup2 none /mnt/cgroup2

一个controller如果已经在cgroup v1中挂载了，那么在cgroup v2中就不可用。如果要在cgroup v2中使用，需要先将其从cgroup v1中卸载。

systemd用到了cgroup v1，会在系统启动时自动挂载controller，因此要在cgroup v2中使用的controller，最好通过内核启动参数`cgroup_no_v1=list`禁止cgroup v1使用：

	cgroup_no_v1=list     # list是用逗号间隔的多个controller
	cgroup_no_v1=all      # all 将所有的controller设置为对cgroup v1不可用

### cgroups v2：支持的controller

从Linux kernel 4.14开始，cgroup v2支持线程模式（thread mode），引入该特性后，controller开始分为两类：`domain controller`（以进程为管理目标的控制器）和 `threaded controller`（以线程为管理目标的控制器）。

#### domain controller

**io**

	since 4.5，cgroup v1 的 blkio 的继任者

**memory**

	since 4.5，cgroup v1 的 memory 的继任者

**pids**

	since 4.5，与 cgroup v1 中的 pids 是同一个

**perf_event**

	since 4.5，与 cgroup v1 中的 perf_event 是同一个

**rdma**

	since 4.11，与 cgroup v1 中的 rdma 是同一个

**cpu**

	since 4.15，cgroup v1 的 cpu、cpuacct 的继任者

#### threaded controller

	cpu
	perf_event
	pids

### cgroups v2：cgroup目录

#### controller的启用/禁止文件

cgroup v2的cgroup目录中有一个cgroup.controllers文件和cgroup.subtree_control文件。

`cgroup.controllers`文件是只读的，内容是`当前目录可用`的controller。

`cgroup.subtree_control`是当前目录中可用的controller的子集，规定了直接`子目录可用`的controller，即定义了直接子目录中的`cgroup.controllers`文件的内容。

cgroup.subtree_control的内容格式如下，列出的controller用空格间隔，前面用“+”表示启用，用“-”表示不启用：

```bash
echo '+pids -memory' > x/y/cgroup.subtree_control
```

如果向cgroup.subtree_control中写入cgroup.controllers中不存在的controller，会得到`ENOENT`错误。

#### 将进程绑定到叶子目录

在cgroup v2中，所有进程都只能绑定到cgroup的叶子目录中。假设cgroup的目录如下，这时候只能在CG1.1、CG1.2和CG2.1中绑定进程：

	                   /
	                 __ __       
	             ___/     \___   
	          __/             \__
	         CG1              CG2
	        __ __              __    
	    ___/     \___            \_  
	 __/             \__           \_
	CG1.1            CG1.2         CG2.1

[man 7 cgroups][2]建议在每个目录下都建立一个名为leaf的目录，这个目录没有任何子目录，专门用来绑定进程。

根据这个建议，上面的目录应该调整成：

	                         /
	                     _______          
	               _____/       \_____    
	           ___/                   \___
	         CG1                        CG2
	        __|__                       ____      
	    ___/  |  \___               ___/    \___  
	 __/      |      \__         __/            \__
	CG1.1    leaf    CG1.2      CG2.1            leaf
	  |                |          |
	 leaf            leaf       leaf

需要绑定cgroup进程的进程号都写在名为leaf的目录中。

进程只能绑定到目录树的叶子结点只是一个表面规则，本质规则是：

一个cgroup目录如果绑定了进程，那么它的`cgroup.subtree_control`必须为空，或者反过来必须不绑定进程，`cgroup.subtree_control`中才可以有内容。

>More precisely, the rule is that a (nonroot) cgroup can't both (1) have member processes, 
>and  (2) distribute resources into child cgroups—that is, have a nonempty cgroup.subtree_control file.

#### 回调通知设置文件

cgroup v1 中的release_agent和notify_on_release被移除了，cgroup v2 提供一个更通用的`cgroup.events`。

`cgroup.events`文件是`只读`的，每行一个key-value对，key和value之间用空格间隔。

现在（2019-01-29 17:39:09），cgroup.events文件中只存在一个名为`populated`的key，这个key对应的value是这个cgroup中包含的进程数。

如果使用cgroup v2，要用监控cgroup.events文件的方式感知cgroup的变化。

>When monitoring this file using inotify(7), transitions generate IN_MODIFY events 
>When monitoring the file using poll(2), transitions cause the bits POLLPRI and 
>POLLERR to be returned in the revents field.

#### cgroup目录中的其它文件

前面已经接触到文件有：

**cgroup.controllers**

	只读，当前目录中可用的controller

**cgroup.subtree_control**

	读写，子目录中可用的controller

**cgroup.events**

	只读，事件文件，每行一对key value，现在只有一个key
	populated：value是cgroup中包含的进程数


**除此之外还有**：

**cgroup.stat**

	只读，since 4.14，每行一对key value
	nr_descendants：        该cgroup中存活的子cgroup的数量
	nr_dying_descendants：  该cgroup中已经死亡的cgroup的数量

>一个cgroup目录被删除后，先进入dying状态，等待系统回收。

**cgroup.max.depth**

	since 4.14，当前目录的子目录的最大深度，0表示不能创建子目录，默认值"max"表示不限制
	            超过限制，返回EAGAIN

**cgroup.max.descendants**

	since 4.14，当前目录中可以创建的活跃cgroup目录的最大数量，默认值"max"表示不限制
	            超过限制，返回EAGAIN

**cgroup.type**

	since 4.14，位于"/"以外的cgroup目录，标记当前cgroup目录的类型，支持修改，支持以下类型：
	            domain:     进程子目录，控制进程资源的cgroup
	            threaded:   线程子目录，控制同一个进程下的线程资源
	            domain threaded:  线程子目录的根目录，threaded root
	            domain invalid:   线程子目录中处于无效状态的cgroup目录

>domain invalid是一个中间状态，对类型为domain invalid的cgroup目录，只能做一个操作：将其类型修改threaded。
>它存在的目的是为线程模式的扩展预留空间。

### cgroups v2：授予非特权用户管理权限

#### 授权方法：修改文件或目录的所有者

特权用户（root用户）可以授予非特权用户（普通用户）管理某个cgroup的权利。

授予方法很简单，直接将一些文件或目录的所有者改成被授权人就可以了，修改的文件或目录不同，被授权人拥有的权限不同。

按照[文档中][2]中例子，将cgroup目录`/dlgt_grp`的管理权授予普通用户时，可以有以下几种授权方式：

`/dlgt_grp`目录的所有者改为被授权人，被授权人拥有该目录下所有新建cgroup目录的管理权。

`/dlgt_grp/cgroup.procs`文件的所有者改为被授权人，被授权人拥有将进程绑定到该cgroup的权利。

`/dlgt_grp/cgroup.subtree_control`文件的所有者改为被授权人，被授权人可以决定在子目录中启用哪些出现在`/dlgt_grp/cgroup.controllers`中controller。

`/dlgt_grp/cgroup.threads`文件的所有者改为被授权人，线程模式下用到，授予将线程绑定到线程子目录的权利。

需要注意的是/dlgt_grp目录中controller的`接口文件的所有者`不应当被修改，这是上层cgroup目录授予当前目录的。

#### 授权边界：用挂载参数nsdelegate开启

在挂载cgroup v2的时候，使用参数`nsdelegate`开启授权边界，如果cgroup v2已经挂载，可以`remount`开启，如下：

	mount -t cgroup2 -o remount,nsdelegate none /sys/fs/cgroup/unified

使用该选项之后，cgroup namespace成为授权边界，会对cgroup中的进程进行下面的限制：

	1. cgroup中的进程不能对所属cgroup目录中的controller接口文件进行写操作，否则报错`EPERM`
	2. cgroup中的进程不能设置namespace边界外的cgroup中的绑定进程，否则报错`ENOENT`

>cgroup namespace是个什么鬼？？ 2019-01-30 14:28:27

引入cgroup namespace作为授权边界是为了应对下面的情况：

	1. 用户用cecilia得到了一个cgroup目录的管理权限，这个目录这里称为当前目录
	2. 普通用户cecilia，在当前目录下创建了一个cgroup子目录，并将这个子目录授权给另一个人

这种情况下，cecilia同时拥有当前目录和子目录的操作权限，子目录中的进程也是cecilia用户的进程，会出现下面两种非法的操作：

	1. 绑定到cecilia的cgroup子目录中的进程能够更改所属cgroup子目录中的controller接口文件
	2. 绑定到cecilia的cgroup子目录中的进程能够将进程移出所在cgroup子目录，绑定到cecilia的当前cgroup目录

文档中举的例子是，cecilia创建一个容器，容器内的进程绑定到cecilia创建的cgroup子目录。意思似乎是在说：

如果不以namespace为授权边界，那么容器内的进程就能够自己修改controller接口，并且具备脱离所属的cgroup目录、将自己绑定到上层cgroup目录的能力。

这样一来cecilia对容器内进程所做的cgroup限制就形同虚设。这样理解正好和授权边界引入的两个限制对应（或许正确 2019-01-30 14:36:38）。

`nsdelegate`只在最初挂载的mount namespace中有效，在其它mount namespace中默认忽略：

	The nsdelegate mount option only has an effect when performed in the
	initial mount namespace; in other mount namespaces, the option is
	silently ignored.

一个非特权进程只有下面的情况都满足时，才能向`cgroup.procs`中添加进程：

	1. 拥有cgroup.procs文件的写权限
	2. 拥有进程原先所属cgroup目录和将要加入的cgroup目录的共同上级目录中cgroup.procs文件的写权限
	3. 如果启用了授权边界（nsdelegate），执行操作的进程必须能够看到被操作的进程原先所属cgroup目录和将要加入的cgroup目录
	4. Linux kernel 4.11之前，执行操作的进程的UID和被操作进程的User ID或者Set-User-ID匹配

以上四条约束带来的直接结果是：被授权给非特权用户的cgroup绑定的第一个进程，只能是授权者设置的，不能由被授权者添加。因为被授权者不能对cgroup子目录中的第一个进程原先所在的cgroup中的cgroup.procs文件进行写操作。

### cgroups v2：线程模式（THREAD MODE）

Linux kernerl 4.14开始，cgroup v2支持线程模式。

线程模式是指：

1. 可以创建`线程子目录`（threaded subtrees），容纳绑定到该线程子目录的进程创建的所有线程，每个线程可以绑定线程子目录的cgroup子目录。
2. 通过线程控制器（threaded controllers）为线程子目录中的cgroup目录分配资源。
3. 在线程子目录中，`非叶子目录可以绑定线程`，注意，“只能绑定到叶子目录”的限制在这里放松了。

#### cgroups v2：线程controller

	cpu
	perf_event
	pids

在线程子目录中`不能使用`domain controllers。

#### cgroups v2：线程模式的使用

##### 创建线程子目录的方法

**方法1** 

1. 直接修改cgroup目录中的`cgroup.type`，写入`threaded`
2. 上层cgroup目录（`/`目录除外）的类型自动变为`domain threaded`
3. 当前目录的子目录和新建子目录的类型自动变成`domain invalid`，需要自行将其修改为`threaded`

**方法2** 

1. 在当前cgroup目录中启用一个或多个threaded controller，在当前目录中绑定一个进程
2. 当前目录的类型自动变成`domain threaded`
3. 当前目录的所有非`threaded`类型的子目录类型自动变成`domain invalid`，需要自行将其修改为`threaded`

注意如果上层目录的类型是`domain invalid`，当前目录的类型不能被修改。此外，将当前目录的类型修改为`threaded`时，需要满足两个条件：

1. 当前目录的子目录都是空的，没有绑定任何进程
2. 当前目录中的`cgroup.subtree_control`文件中没有启用domain controller配置，否则报错`ENOTSUP`。

即domain controllers不能在线程子目录中使用。

##### 绑定到线程子目录

将进程ID直接写入线程子目录的`cgroup.procs`文件中，该进程以及它的线程就都一同绑定到了线程子目录中。

然后可以将这个进程创建的多个线程ID，写入到它绑定的线程子目录的以及子目录的子目录中的`cgroup.threads`文件，实现线程的绑定。

线程只能绑定到创建它的`进程`所在的`线程`子目录树。

domain controller是不关心线程的，它看到的都是进程。

实行线程绑定操作时，需要满足以下条件：

1. 执行绑定操作的进程有目标目录中的`cgroup.threads`文件的写权限
2. 执行绑定操作的进程需要有源目录和目标目录的共同祖先目录中的`cgroup.procs`文件的写权限
3. 源目录和目标目录必须在同一个线程子目录中，即创建线程的进程所在的线程子目录中，即线程不能与进程分离，否则报错`EOPNOTSUPP`。

进程子目录中的根目录中`cgroup.procs`是可读写的，进程子目录中非根目录中的`cgroup.procs`文件是不可读写的。

`cgroup.threads`在每个cgroup目录中都存在，包括类型为domain的cgroup目录。

## cgroup的内核接口文件

**/proc/cgroups**（since 2.6.24）列出了内核支持的cgroup contoller，以及它们的使用情况：

```
#subsys_name    hierarchy      num_cgroups    enabled
cpuset          4              1              1
cpu             8              1              1
cpuacct         8              1              1
blkio           6              1              1
memory          3              1              1
devices         10             84             1
freezer         7              1              1
net_cls         9              1              1
perf_event      5              1              1
net_prio        9              1              1
hugetlb         0              1              0
pids            2              1              1
```

四列数据的含义分别是：controller名称、挂载位置ID（在cgroup v2中都为0）、使用该controller的cgroup数量、是否启用。

**/proc/[pid]/cgroup**（since 2.6.24）进程所属的cgroup，内容格式如下：

	hierarchy-ID:controller-list:cgroup-path

例如一个容器内进程的cgroup:

```
# cat /proc/1427/cgroup
11:blkio:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
10:freezer:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
9:net_prio,net_cls:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
8:devices:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
7:cpuset:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
6:memory:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
5:perf_event:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
4:pids:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
3:cpuacct,cpu:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
2:hugetlb:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
1:name=systemd:/kubepods/besteffort/pode4f8b737-1ad1-11e9-a3a2-5254003b4ace/3647f5a8960c6c003fda011ea26dedcb8d45ce3b4c03cbec31b4f2c9cab7d221
```

第一列`hierarchy-ID`与/proc/cgroups的第二列对应，在cgroups v2中hierarchy-ID都为0；第二列是`controller名称`；第三列是`cgroup目录路径`。

**/sys/kernel/cgroup/delegate**（since 4.15）：cgroups v2 中可以授权给其它用户的cgroup文件。

**/sys/kernel/cgroup/features**（since 4.15）：cgroups v2 支持的功能特性。

手上没有kernel 4.15的环境，下面是文档中的例子：

```
$ cat /sys/kernel/cgroup/delegate
cgroup.procs
cgroup.subtree_control
cgroup.threads

$ cat /sys/kernel/cgroup/features
nsdelegate
```

## 参考

1. [Linux中cgroup的初级使用方法][1]
2. [cgroups - Linux control groups][2]
3. [Linux Control Group v2][3]
4. [直接用cadvisor查询所有cgroup][4]
5. [Linux Control Group v2][5]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html "Linux中cgroup的使用方法"
[2]: http://man7.org/linux/man-pages/man7/cgroups.7.html "cgroups - Linux control groups"
[3]: https://www.kernel.org/doc/Documentation/cgroup-v2.txt "Linux Control Group v2"
[4]: https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2019/01/25/kubernetes-failed-to-get-cgroup-stats.html#%E7%9B%B4%E6%8E%A5%E7%94%A8cadvisor%E6%9F%A5%E8%AF%A2%E6%89%80%E6%9C%89cgroup "直接用cadvisor查询所有cgroup"
[5]: https://www.kernel.org/doc/Documentation/cgroup-v2.txt "Linux Control Group v2"
