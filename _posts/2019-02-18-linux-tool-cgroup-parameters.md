---
layout: default
title: "Linux的cgroup功能（三）: cgroup controller汇总和控制器的参数（文件接口）"
author: 李佶澳
createdate: "2019-02-18 13:49:30 +0800"
last_modified_at: "2019-02-28 19:06:51 +0800"
categories: 技巧
tags: linux  cgroup
keywords: cgroup参数,cgroup v1,cgroup v2,cgroup controller,linux资源隔离,linux资源控制器
description: "多个cgroup controller的用途和配置参数：blkio、cpu、cpuacct、cpuset、devices、freezer、memory、net_cls、perf_event、hugetlb、pids、net_prio、rdma controller"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这里将罗列cgroup支持的controllers，每个controller的文件接口或者说是配置参数，以及它们的含义。这是一项持续性工作，这篇笔记不会一次性完成，而是逐渐补充丰富。@2019-02-18 15:55:04

cgroup相关笔记汇总：

1. [Linux的cgroup功能（一）：初级入门使用方法](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html)
2. [Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html)
3. [Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html)

又找到一些关于cgroup的好资料，感谢google：

1. [Managing system resources on Red Hat Enterprise Linux 7][1]
2. [Namespace and cgroups, the Building Blocks of Linux containers][2]

这两篇文档都对cgroup进行了全景式介绍，第一篇侧重cgroup在Red Hat中的应用，从Red Hat用户的角度讲述，第二篇侧重cgroup的内核实现，从内核开发者的角度讲述。

## cgroup controller列表

Linux kernel 4.4 支持的cgroup controller，cgroup v1，总计12个controller @2019-02-18 16:25:41：

	Name           Kernel Object name                   Module 
	-------------------------------------------------------------------------------
	blkio          io_cgrp_subsys                       block/blk-cgroup.c
	cpu            cpu_cgrp_subsys                      kernel/sched/core.c
	cpuacct        cpuacct_cgrp_subsys                  kernel/sched/cpuacct.c
	cpuset         cpuset_cgrp_subsys                   kernel/cpuset.c
	devices        devices_cgrp_subsys                  security/device_cgroup.c
	freezer        freezer_cgrp_subsys                  kernel/cgroup_freezer.c
	memory         memory_cgrp_subsys                   mm/memcontrol.c
	net_cls        net_cls_cgrp_subsys                  net/core/netclassid_cgroup.c
	perf_event     perf_event_cgrp_subsys               kernel/events/core.c
	hugetlb        hugetlb_cgrp_subsys                  mm/hugetlb_cgroup.c
	pids           pids_cgrp_subsys                     kernel/cgroup_pids.c
	net_prio       net_prio_cgrp_subsys                 net/core/netprio_cgroup.c

Red Hat Enterprise Linux 7中可用cgroup controllers，总计10个 @2019-02-18 15:50:06:

	blkio、cpu、cpuacct、cpuset、devices、freezer、memory、net_cls、perf_event、hugetlb、

Kernel 4.4支持、Red Hat Enterprise Linux 7还没有支持的cgroup controllers，总计2个 @2019-02-18 15:50:16：

	pids、net_prio

cgroup v2 支持的controller，总计6个（2019-02-18 15:49:51）：

	cpu、memory、io、pid、rdma、perf_event

## cgroup v1 支持的controller

### blkio

>sets limits on input/output access to and from block devices;

内核文档：[Block IO Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/blkio-controller.txt)

### cpu

>uses the CPU scheduler to provide cgroup tasks access to the CPU. It is mounted together with the cpuacct controller on the same mount;

内核文档：[Real-Time group scheduling][7]、[CFS Bandwidth Control][6]。

#### cpu：实时任务调度相关参数

`cpu.rt_period_us`和`cpu.rt_runtime_us`是Real-Time group调度的参数。

**cpu.rt_period_us**： 含义与sched_rt_period_us相同。

**cpu.rt_runtime_us**：含义与sched_rt_runtime_us相同。

Real-Time group是一些需要`间歇性实时运行`的任务（后面简称实时任务），这些任务不是一直运行的，而是周期性运行，但是运行周期到来以后，它们必须在运行，不能因为其它进程正在使用CPU而被延迟运行。

有两个内核参数用来调节实时任务占用的CPU资源：

**/proc/sys/kernel/sched_rt_period_us**：定义100% CPU对应的时间，可以理解为计算CPU使用率时使用的基准时间段，单位是微秒，默认是1000000（1s）。

[3.12. Real Time Throttling][5]中对这个参数介绍是最可理解的，并且能和sched_rt_runtime_us互相印证的，原句是`Defines the period in μs (microseconds) to be considered as 100% of CPU bandwidth.`，重点是`to be considered`，一些中文翻译感觉翻译的走样了。

**/proc/sys/kernel/sched_rt_runtime_us**：实时任务最高占据的CPU带宽，单位是微秒，默认值950000（0.95s）表示95%的CPU（注意的sched_rt_period_us的数值1s对上了）。如果值为`-1`，实时任务将占用100%的CPU，会存在非实时任务完全得不到执行的风险，设置时需要高度谨慎。

内核文档[Real-Time group scheduling][6]中举了两个例子，让人不太理解：

第一个例子是每秒钟要渲染25帧画面的任务，每一帧的渲染周期是0.04秒，如果分配给它80%的CPU时间，运行时间是`0.04 * 0.8=0.32s`，这个让人有点不理解。

假设把80%的cpu分配给该实时任务，那么为了保证每秒依旧产出25帧，`0.04 * 0.8 = 0.32`的意思说应该是，渲染周期需要被压缩到0.32s，但是kernerl中说这个时间是运行时间。

>This way the graphics group will have a 0.04s period with a 0.032s run time limit”

揣测一下，原意应该是说：每间隔0.04秒渲染一帧，这0.04s中只有80%的时间用于渲染帧，所以实时任务的运行时间是0.32s。

这样理解是否正确只能通过扒内核源码验证了，现在无力验证..丧...（2019-02-19 11:14:08），第二个例子类似，这里不罗列了。

注意`sched_rt_runtime_us`是实时任务的保证时间和最高占用时间，如果实时任务没有使用，可以分配给非实时任务，并且实时任务最终占用的时间不能超过这个数值，参考[Linux-85 关于sched_rt_runtime_us 和 sched_rt_period_us][6]。

对`cpu.rt_period_us`参数的限制是必须小于父目录中的同名参数值。

对`cpu.rt_runtime_us`的限制是：

	\Sum_{i} runtime_{i} / global_period <= global_runtime / global_period

即：

	\Sum_{i} runtime_{i} <= global_runtime

当前的实时进程调度算法可能导致部分实时进程被饿死，如下A和B是并列的，A的运行时时长正好覆盖了B的运行时间：

	* group A: period=100000us, runtime=50000us
	    - this runs for 0.05s once every 0.1s
	
	* group B: period= 50000us, runtime=25000us
	    - this runs for 0.025s twice every 0.1s (or once every 0.05 sec).

[Real-Time group scheduling][7]中提出正在开发`SCHED_EDF` (Earliest Deadline First scheduling)，优先调度最先结束的实时进程。

#### cpu：CPU带宽控制CFS的相关参数

[CFS Bandwidth Control][6]控制一组进程可以使用的cpu时间，它针对的非实时的进程，约定了一组进程在一个时间周期中可以使用的CPU的时长，如果使用时间超了，该组进程会被限制运行，直到进入下一个周期，重新获得CPU时间。 

**cpu.cfs_period_us**：一个周期的时长，单位微秒，默认值100毫秒，最大值1s，最小1ms。

**cpu.cfs_quota_us**：在一个周期内的可以使用的cpu时间，单位微秒，最小1ms，默认值-1表示CPU使用没有限制。

**cpu.stat**：限流统计，包含三个值：

	- nr_periods: Number of enforcement intervals that have elapsed.
	- nr_throttled: Number of times the group has been throttled/limited.
	- throttled_time: The total time duration (in nanoseconds) for which entities
	  of the group have been throttled.

内核参数/proc/sys/kernel/sched_cfs_bandwidth_slice_us（默认值5秒）的用途没明白，摘录原文：

	For efficiency run-time is transferred between the global pool and CPU local
	"silos" in a batch fashion.  This greatly reduces global accounting pressure
	on large systems.  The amount transferred each time such an update is required
	is described as the "slice".

如果父目录中分配的CPU时间用尽了，子目录即使还有CPU运行时间，也会被限制。 

以250ms为周期，占用1个CPU：

	# echo 250000 > cpu.cfs_quota_us /* quota = 250ms */
	# echo 250000 > cpu.cfs_period_us /* period = 250ms */

以500ms为周期，占用2个CPU，quota > period：

	# echo 1000000 > cpu.cfs_quota_us /* quota = 1000ms */
	# echo 500000 > cpu.cfs_period_us /* period = 500ms */

以50ms为周期，占用20%CPU：

	# echo 10000 > cpu.cfs_quota_us /* quota = 10ms */
	# echo 50000 > cpu.cfs_period_us /* period = 50ms */

### cpuacct

>creates automatic reports on CPU resources used by tasks in a cgroup. It is mounted together with the cpu controller on the same mount;

内核文档：[CPU Accounting Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/cpuacct.txt)

**cpuacct.usage**：该cgroup实际获得的cpu时间，单位是纳秒，`/sys/fs/cgroup/cpuacct/cpuacct.usage`是系统上所有进程获得的cpu时间。

**cpuacct.stat**：将该cgroup获得的时间按照user time和system time分开呈现，单位是`USER_HZ`：

	user 24
	system 9


**cpuacct.usage_percpu**：该cgroup在每个cpu上占用的时间，单位是纳秒，累加值等于 **cpuacct.usage**：

	//系统上一共有4个CPU，为容器指定cpuset 0,1，--cpuset-cpus "1,2"
	325517080 54277298 0 0
	
	//系统上一共有4个CPU，为容器指定cpuset 1,2，--cpuset-cpus "1,2"
	0 21977223 28985453 0

### cpuset

>assigns individual CPUs (on a multicore system) and memory nodes to tasks in a cgroup;

内核文档：[CPUSETS](https://www.kernel.org/doc/Documentation/cgroup-v1/cpusets.txt)

### devices

>allows or denies access to devices for tasks in a cgroup;

内核文档：[Device Whitelist Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/devices.txt)

### freezer

>suspends or resumes tasks in a cgroup;

内核文档：[freezer-subsystem](https://www.kernel.org/doc/Documentation/cgroup-v1/freezer-subsystem.txt)

### memory

>sets limits on memory use by tasks in a cgroup and generates automatic reports on memory resources used by those tasks;

内核文档：[Memory Resource Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/memory.txt)、[memcg_test.txt](https://www.kernel.org/doc/Documentation/cgroup-v1/memcg_test.txt)

### net_cls

>tags network packets with a class identifier (classid) that allows the Linux traffic controller (the tc command) to identify packets originating from a particular cgroup task. A subsystem of net_cls, the net_filter (iptables) can also use this tag to perform actions on such packets. The net_filter tags network sockets with a firewall identifier (fwid) that allows the Linux firewall (the iptables command) to identify packets (skb->sk) originating from a particular cgroup task;

内核文档：[Network classifier cgroup](https://www.kernel.org/doc/Documentation/cgroup-v1/net_cls.txt)

### perf_event 

>enables monitoring cgroups with the perf tool;

### hugetlb

>allows to use virtual memory pages of large sizes and to enforce resource limits on these pages. 

### pids

内核文档：[Process Number Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/pids.txt)

### net_prio

内核文档：[Network priority cgroup](https://www.kernel.org/doc/Documentation/cgroup-v1/net_prio.txt)

### rdma

内核文档：[RDMA Controller](https://www.kernel.org/doc/Documentation/cgroup-v1/rdma.txt)

## cgroup v2 支持的controller

内核文档：[Control Group v2][3]。

### cpu

### memory

### io

### pid

### rdma

### perf_event

## 参考

1. [Managing system resources on Red Hat Enterprise Linux 7][1]
2. [Namespace and cgroups, the Building Blocks of Linux containers][2]
3. [Control Group v2][3]
4. [Linux-85 关于sched_rt_runtime_us 和 sched_rt_period_us][4]
5. [3.12. Real Time Throttling][5]
6. [CFS Bandwidth Control][6]
7. [Real-Time group scheduling][7]

[1]: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html-single/resource_management_guide/ "Managing system resources on Red Hat Enterprise Linux 7"
[2]: https://events.static.linuxfound.org/sites/events/files/slides/cgroup_and_namespaces.pdf "Namespace and cgroups, the Building Blocks of Linux containers"
[3]: https://www.kernel.org/doc/Documentation/cgroup-v2.txt "Control Group v2"
[4]: https://focusvirtualization.blogspot.com/2016/12/linux-85-schedrtruntimeus.html "[Linux-85] 关于sched_rt_runtime_us 和 sched_rt_period_us"
[5]: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux_for_real_time/7/html/tuning_guide/real_time_throttling "3.12. Real Time Throttling"
[6]: https://www.kernel.org/doc/Documentation/scheduler/sched-bwc.txt "CFS Bandwidth Control"
[7]: https://www.kernel.org/doc/Documentation/scheduler/sched-rt-group.txt "Real-Time group scheduling"
