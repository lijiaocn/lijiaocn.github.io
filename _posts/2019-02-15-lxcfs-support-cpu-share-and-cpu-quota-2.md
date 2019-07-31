---
layout: default
title: "Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（中）"
author: 李佶澳
createdate: "2019-02-15 10:33:52 +0800"
last_modified_at: "2019-02-21 13:46:41 +0800"
categories: 技巧
tags: cgroup docker
keywords: lxcfs,cgroup,cpu-share,cpu-quota,
description: lxcfs怎样用cgroup中的信息生成容器内看到的/proc文件，proc文件内容格式与cgroup文件接口含义
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

接[上篇][3]，上篇分析的主要侧重libfuse是如何被使用，这篇分析proc文件的内容是怎样生成的。
 
同时学习一下aither64的做法，[aither64][2]实现了根据容器的cpu配额生成/proc/cpu文件的方法：[Merge pull request #260 from aither64/cpu-views ][1]。

```bash
git clone https://github.com/aither64/lxcfs.git
cd lxcfs
git  branch  cpu-views -t  origin/cpu-views
git checkout   cpu-views
```

在`man proc`中可以找到所有proc文件的内容格式和说明。

**相关笔记**：

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（上）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/11/lxcfs-support-cpu-share-and-cpu-quota-1.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（中）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/15/lxcfs-support-cpu-share-and-cpu-quota-2.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（下）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/21/lxcfs-support-cpu-share-and-cpu-quota-3.html)

[Lxcfs是什么？怎样通过lxcfs在容器内显示容器的CPU、内存状态](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/09/kubernetes-lxcfs-docker-container.html)

[Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html)

[Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html)

[Linux的cgroup功能（一）：初级入门使用方法](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html)

## /proc/cpuinfo文件内容的生成

cgroup的cpuset controller的文件接口：

```
cgroup.clone_children  cpuset.cpus            cpuset.memory_pressure     cpuset.sched_load_balance
cgroup.event_control   cpuset.mem_exclusive   cpuset.memory_spread_page  cpuset.sched_relax_domain_level
cgroup.procs           cpuset.mem_hardwall    cpuset.memory_spread_slab  notify_on_release
cpuset.cpu_exclusive   cpuset.memory_migrate  cpuset.mems                tasks
```

lxcfs将`cpuset.cpus`中指定的cpu（例如0-2）的信息组合成/proc/cpuinfo，每个cpu的信息来自host的/proc/cpuinfo文件。

在上一篇中有详细分析，见[xcfs根据cpu-share和cpu-quota等cgroup信息生成容器内的/proc文件（一）：从cgroup中读取cpuinfo][4]。

### aither64对/proc/cpuinfo的修正

aither64在计算生成的容器的cpu视图时，依据的下面的cgroup参数计算出应当呈现的cpu数，它们的含义见[cgroup cpu controller：CPU带宽控制CFS的相关参数][7]：

	cpu.cfs_quota_us
	cpu.cfs_period_us

容器内cpu个数的计算方法是：cpu.cfs_quota_us/cpu.cfs_period_us向上取整。

```c
int max_cpu_count(const char *cg)
{
	...
	rv = cfs_quota / cfs_period;
	if ((cfs_quota % cfs_period) > 0)
	    rv += 1;
	...
}
```

## /proc/stat文件内容的生成

在host上看到的`/proc/stat`文件：

```
 cat /proc/stat
cpu  27342995 37984 12363147 2702613541 214034 0 2148297 906148 0 0
cpu0 5646549 8330 2772710 677553049 52358 0 391408 214713 0 0
cpu1 7467113 8682 3269935 674623853 54243 0 666477 233736 0 0
cpu2 7014447 10816 3154326 674959733 56337 0 624994 242532 0 0
cpu3 7214885 10154 3166175 675476904 51093 0 465416 215164 0 0
intr 7205758905 153 10 0 0 0 0 3 0 0 0 0 38 15 0 0 0 0 0 0 0 0 0 0 0 0 2196063 0 525227905 10640 0 19 0 1706137 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
ctxt 8831068106
btime 1543312071
processes 4328224
procs_running 1
procs_blocked 0
softirq 4429444472 3 1334970939 157132 1834767679 0 0 336 652016670 0 607531713
```

在容器中通过lxcfs看到的proc/stat文件内容：

```
sh-4.2# cat /proc/stat
cpu  13113538 17012 6042607 1352154304 106601 0 1057884 448446 0 0
cpu0 5646486 8330 2772697 677541736 52358 0 391407 214712 0 0
cpu1 7467052 8682 3269910 674612568 54243 0 666477 233734 0 0
intr 7205702049 153 10 0 0 0 0 3 0 0 0 0 38 15 0 0 0 0 0 0 0 0 0 0 0 0 2196042 0 525226982 10640 0 19 0 1706122 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
ctxt 8830978881
btime 1543312071
processes 4328178
procs_running 2
procs_blocked 0
softirq 4429413658 3 1334956474 157132 1834765030 0 0 336 652007038 0 607527645
```

lxcfs只重新加工了host的/proc/stat文件中以`cpu`开头的行，只包含了cgroup的`cpuset.cpus`中设置的cpu，并且重新计算了它们的累加值（第一行）。 

### aither64对/proc/stat的修正

`/proc/stat`中以cpu开头的行的后面数字的含义分别是：

```
user   (1) Time spent in user mode.

nice   (2) Time spent in user mode with low priority (nice).

system (3) Time spent in system mode.

idle   (4) Time spent in the idle task.  This value should be USER_HZ times the second entry in the /proc/uptime pseudo-file.

iowait (since Linux 2.5.41)
       (5) Time waiting for I/O to complete.

irq (since Linux 2.6.0-test4)
       (6) Time servicing interrupts.

softirq (since Linux 2.6.0-test4)
       (7) Time servicing softirqs.

steal (since Linux 2.6.11)
       (8) Stolen time, which is the time spent in other operating systems when running in a virtualized environment

guest (since Linux 2.6.24)
       (9) Time spent running a virtual CPU for guest operating systems under the control of the Linux kernel.

guest_nice (since Linux 2.6.33)
       (10) Time spent running a niced guest (virtual CPU for guest operating systems under the control of the Linux kernel).
```

aither64根据[cgroup cpuacct controller][8]中的信息调整文件内容，cpuacct提供了以下文件：

	cpuacct.usage: cgroup实际获得的cpu时间，单位纳秒
	cpuacct.stat:  cgroup获得的时间按照user time和system time分开呈现，单位是`USER_HZ`
	               user 24
	               system 9
	cpuacct.usage_percpu：cgroup在每个cpu上占用的时间，纳秒

这里有一个问题，aither64代码中读取了`cpuacct.usage_all`文件，但是我在CentOS 7.2中没有找到这个文件。@2019-02-20 10:55:47

```c
static int proc_stat_read(char *buf, size_t size, off_t offset,
        struct fuse_file_info *fi)
{
    ...
    /*
     * Read cpuacct.usage_all for all CPUs.
     * If the cpuacct cgroup is present, it is used to calculate the container's
     * CPU usage. If not, values from the host's /proc/stat are used.
     */
    if (read_cpuacct_usage_all(cg, cpuset, &cg_cpu_usage, &cg_cpu_usage_size) != 0) {
        lxcfs_debug("%s\n", "proc_stat_read failed to read from cpuacct, "
                "falling back to the host's /proc/stat");
    }
    ...
}

static int read_cpuacct_usage_all(char *cg, char *cpuset, struct cpuacct_usage **return_usage, int *size)
{
    ...
    if (!cgfs_get_value("cpuacct", cg, "cpuacct.usage_all", &usage_str)) {
        rv = -1;
        goto err;
    }
    ...
}
```

从代码中看是通过cpuacct.usage_all获得了每个cpu的上的user time 和 system time。

以cgroup路径为key，为每个cgroup生成一个proc_stat结构体（存放在哈希表中），保存上次查询到的cgroup的的cpu的使用情况，如果没有则新建。：

```c
/* Data for CPU view */
struct cg_proc_stat {
    char *cg;
    struct cpuacct_usage *usage; // Real usage as read from the host's /proc/stat
    struct cpuacct_usage *view; // Usage stats reported to the container
    int cpu_count;
    pthread_mutex_t lock; // For node manipulation
    struct cg_proc_stat *next;
};

```

从容器中下一次读取/proc/stat文件时，会再次读取当前时间cgroup中的cpu数据，新计算出的时间一定是比保存在哈希表中的上一次结果的数值大，如果小了，说明cgroup的配置变化了，就直接用新的结果替换就的结果。

首先是只有`cpu.cfs_quota_us/cpu.cfs_period_us向上取整`个cpu记录，和对/proc/cpuinfo的修正方法一致。

然后是数值上修正，只呈现了user、system、idle时间，其它都是0，对前三者的数值。user、system、idle时间还要进一步修正。

如果没有指定cpuset，只是设置了cpu quota，计算出容器实际拥有的CPU个数是2，但是系统上有4个CPU，容器是在每个CPU上都有运行的，需要把容器对4个CPU的使用时间重新分布到2个CPU上。

cg_proc_stat的view字段中存放的就是修正后2个CPU的使用时间，usage是原始的4个CPU的使用时间，过程如下：

```c
static int cpuview_proc_stat(const char *cg, const char *cpuset, struct cpuacct_usage *cg_cpu_usage, int cg_cpu_usage_size, FILE *f, char *buf, size_t buf_size)
    ...
    for (curcpu = 0, i = -1; curcpu < nprocs; curcpu++) {
        stat_node->usage[curcpu].online = cg_cpu_usage[curcpu].online;

        if (!stat_node->usage[curcpu].online)
            continue;

        i++;

        stat_node->usage[curcpu].user += diff[curcpu].user;
        stat_node->usage[curcpu].system += diff[curcpu].system;
        stat_node->usage[curcpu].idle += diff[curcpu].idle;

        //max_cpus是计算出的分配个容器的cpu个数，将容器对另外的cpu的使用时间汇总到`xxx_surplus`中，后面再将它们分配容器的cpu视图中。
        if (max_cpus > 0 && i >= max_cpus) {
            user_surplus += diff[curcpu].user;
            system_surplus += diff[curcpu].system;
        }
    }

    /* Calculate usage counters of visible CPUs */
    if (max_cpus > 0) {
        /* threshold = maximum usage per cpu, including idle */
        threshold = total_sum / cpu_cnt * max_cpus;
        for (curcpu = 0, i = -1; curcpu < nprocs; curcpu++) {
            if (i == max_cpus)
                break;

            if (!stat_node->usage[curcpu].online)
                continue;

            i++;

            if (diff[curcpu].user + diff[curcpu].system >= threshold)
                continue;

            /* Add user */
            // 加上对另外的cpu的使用时间
            add_cpu_usage(
                    &user_surplus,
                    &diff[curcpu],
                    &diff[curcpu].user,
                    threshold);

            if (diff[curcpu].user + diff[curcpu].system >= threshold)
                continue;

            /* If there is still room, add system */
            add_cpu_usage(
                    &system_surplus,
                    &diff[curcpu],
                    &diff[curcpu].system,
                    threshold);
        }

        if (user_surplus > 0)
            lxcfs_debug("leftover user: %lu for %s\n", user_surplus, cg);
        if (system_surplus > 0)
            lxcfs_debug("leftover system: %lu for %s\n", system_surplus, cg);
    ...
```

容器在一个CPU上的idle时间的计算方式：

	1. 从宿主机的/proc/stat中获取这个CPU的所有时间all_used：
	
	   all_used = user + nice + system + iowait + irq + softirq + steal + guest + guest_nice;
	
	2. 从容器的cgroup目录中读取所在cgroup使用这个cpu的时间：
	
	    aither64是从cpuacct.usage_all中读取的，将user时间和system时间相加作为使用时间：
	
	        cg_used = cg_cpu_usage[curcpu].user + cg_cpu_usage[curcpu].system;
	
	    centos7.2中，cpuacct.usage_all这个文件接口现在没了，需要改成从cpuacct.usage_percpu中直接读取。
	
	        //系统上一共有4个CPU，为容器指定cpuset 0,1，--cpuset-cpus "1,2"
	        325517080 54277298 0 0
	        //系统上一共有4个CPU，为容器指定cpuset 1,2，--cpuset-cpus "1,2"
	        0 21977223 28985453 0
	
	3. /proc/stat中的idle时间，加上all_used时间减去cg_used，就是容器在这个CPU上的idle时间，
	   如果all_used小于cg_used，直接使用/proc/stat中的idle时间。
	
	        cg_cpu_usage[curcpu].idle = idle + (all_used - cg_used);


## /proc/meminfo文件内容的生成

```sh
     容器中看到内容                        宿主机上看到的内容               replace by (/1024)
sh-4.2# cat /proc/meminfo              [root@~]# cat /proc/meminfo 
MemTotal:         262144 kB            MemTotal:        8010244 kB      memory.limit_in_bytes
MemFree:          260576 kB            MemFree:         2638016 kB      memlimit - memusage
MemAvailable:     260576 kB            MemAvailable:    7077116 kB      memlimit - memusage + cache
Buffers:               0 kB            Buffers:               0 kB      0
Cached:                0 kB            Cached:          4322404 kB      0
SwapCached:            0 kB            SwapCached:            0 kB      0
Active:              480 kB            Active:          2775260 kB      active_anon + active_file (in memory.stat)
Inactive:              0 kB            Inactive:        1740296 kB      inactive_anon + inactive_file (in memory.stat)
Active(anon):        480 kB            Active(anon):     168704 kB      active_anon (in memory.stat)
Inactive(anon):        0 kB            Inactive(anon):    42808 kB      inactive_anon (in memory.stat)
Active(file):          0 kB            Active(file):    2606556 kB      active_file (in memory.stat)
Inactive(file):        0 kB            Inactive(file):  1697488 kB      inactive_file (in memory.stat)
Unevictable:           0 kB            Unevictable:           0 kB      unevictable  (in memory.stat)
Mlocked:               0 kB            Mlocked:               0 kB
SwapTotal:             0 kB            SwapTotal:             0 kB      memory.memsw.limit_in_bytes
SwapFree:              0 kB            SwapFree:              0 kB      memory.memsw.limit_in_bytes - (memory.memsw.usage_in_bytes - memory.usage_in_bytes)
Dirty:               256 kB            Dirty:                24 kB
Writeback:             0 kB            Writeback:             0 kB
AnonPages:        194228 kB            AnonPages:        193152 kB
Mapped:           142404 kB            Mapped:           142344 kB
Shmem:                 0 kB            Shmem:             18360 kB      0 | total_shmem (in memory.stat)
Slab:               0 kB               Slab:             649156 kB      0
SReclaimable:          0 kB            SReclaimable:     441024 kB      0
SUnreclaim:            0 kB            SUnreclaim:       208132 kB      0
KernelStack:        4624 kB            KernelStack:        4480 kB
PageTables:         8132 kB            PageTables:         7412 kB
NFS_Unstable:          0 kB            NFS_Unstable:          0 kB
Bounce:                0 kB            Bounce:                0 kB
WritebackTmp:          0 kB            WritebackTmp:          0 kB
CommitLimit:     4005120 kB            CommitLimit:     4005120 kB
Committed_AS:    1270196 kB            Committed_AS:    1264104 kB
VmallocTotal:   34359738367 kB         VmallocTotal:   34359738367 kB
VmallocUsed:       29888 kB            VmallocUsed:       29888 kB
VmallocChunk:   34358800208 kB         VmallocChunk:   34358800208 kB
HardwareCorrupted:     0 kB            HardwareCorrupted:     0 kB
AnonHugePages:     14336 kB            AnonHugePages:     14336 kB
HugePages_Total:       0               HugePages_Total:       0
HugePages_Free:        0               HugePages_Free:        0
HugePages_Rsvd:        0               HugePages_Rsvd:        0
HugePages_Surp:        0               HugePages_Surp:        0
Hugepagesize:       2048 kB            Hugepagesize:       2048 kB
DirectMap4k:     1023992 kB            DirectMap4k:     1023992 kB
DirectMap2M:     7364608 kB            DirectMap2M:     7364608 kB
```

cgroup的memory controller包含下面的文件接口：

```
cgroup.clone_children           memory.kmem.tcp.max_usage_in_bytes  memory.oom_control
cgroup.event_control            memory.kmem.tcp.usage_in_bytes      memory.pressure_level
cgroup.procs                    memory.kmem.usage_in_bytes          memory.soft_limit_in_bytes
memory.failcnt                  memory.limit_in_bytes               memory.stat
memory.force_empty              memory.max_usage_in_bytes           memory.swappiness
memory.kmem.failcnt             memory.memsw.failcnt                memory.usage_in_bytes
memory.kmem.limit_in_bytes      memory.memsw.limit_in_bytes         memory.use_hierarchy
memory.kmem.max_usage_in_bytes  memory.memsw.max_usage_in_bytes     notify_on_release
memory.kmem.slabinfo            memory.memsw.usage_in_bytes         tasks
memory.kmem.tcp.failcnt         memory.move_charge_at_immigrate
memory.kmem.tcp.limit_in_bytes  memory.numa_stat
```

其中`memory.stat`中又包含多个key-value值：

```
cache 0
rss 344064
rss_huge 0
mapped_file 0
swap 0
pgpgin 589
pgpgout 505
pgfault 1729
pgmajfault 0
inactive_anon 0
active_anon 344064
inactive_file 0
active_file 0
unevictable 0
hierarchical_memory_limit 268435456
hierarchical_memsw_limit 536870912
total_cache 0
total_rss 344064
total_rss_huge 0
total_mapped_file 0
total_swap 0
total_pgpgin 589
total_pgpgout 505
total_pgfault 1729
total_pgmajfault 0
total_inactive_anon 0
total_active_anon 344064
total_inactive_file 0
total_active_file 0
total_unevictable 0
```

## /proc/uptime文件内容的生成

`/proc/uptime`文件内容是系统运行的时间和系统空闲的时间：

	This file contains two numbers: the uptime of the system (seconds), and the amount of time spent in idle process (seconds).

`系统运行时间`，lxcfs取的是容器中1号进程的运行时间，获取方法如下：

	当前相对系统启动的时间  - （/proc/pid/stat的第22个字段（时钟嘀嗒次数） / 系统的时钟嘀嗒频率）

具体做法见[获取指定进程的启动时间和运行时长][5]。

`系统空闲时间`的获取方法：

	系统运行时间  -  容器中1号进程所在的cgroup的CPU使用时间

容器中1号进程的CPU使用时间是从cgroup中读取的，cgroup的cpu controller和cpuacct controller的文件接口如下（这两个controller挂载到了同一个目录）：

```
cgroup.clone_children  cpuacct.stat          cpu.cfs_quota_us   cpu.stat  kube-proxy         tasks
cgroup.event_control   cpuacct.usage         cpu.rt_period_us   docker    notify_on_release  user.slice
cgroup.procs           cpuacct.usage_percpu  cpu.rt_runtime_us  kubelet   release_agent
cgroup.sane_behavior   cpu.cfs_period_us     cpu.shares         kubepods  system.slice
```

`cpuacct.usage/1000000000`就是该cgroup目录使用的cpu时间，cpuacct.usage的单位是纳秒（10的负9次方）。

/proc/uptime、/proc/[pid]/stat等文件的内容和含义，在`man proc`中都可以找到。

## /proc/diskstats文件内容的生成

使用cgroup blkio controller中的信息生成容器的/proc/diskstats文件。

cgroup blkio controller的文件接口如下：

```
blkio.io_merged                   blkio.io_wait_time_recursive     blkio.throttle.write_iops_device
blkio.io_merged_recursive         blkio.leaf_weight                blkio.time
blkio.io_queued                   blkio.leaf_weight_device         blkio.time_recursive
blkio.io_queued_recursive         blkio.reset_stats                blkio.weight
blkio.io_service_bytes            blkio.sectors                    blkio.weight_device
blkio.io_service_bytes_recursive  blkio.sectors_recursive          cgroup.clone_children
blkio.io_serviced                 blkio.throttle.io_service_bytes  cgroup.event_control
blkio.io_serviced_recursive       blkio.throttle.io_serviced       cgroup.procs
blkio.io_service_time             blkio.throttle.read_bps_device   notify_on_release
blkio.io_service_time_recursive   blkio.throttle.read_iops_device  tasks
blkio.io_wait_time                blkio.throttle.write_bps_device
```

lxcfs用下面5个接口文件中的内容覆盖host的/proc/diskstats形成容器的/proc/diskstats：

```
blkio.io_serviced_recursive
blkio.io_merged_recursive
blkio.io_service_bytes_recursive
blkio.io_wait_time_recursive
blkio.io_service_time_recursive
```

奇怪的是的环境中这个文件内容都是`Total 0`，在磁盘io方面有盲区，暂时搞不懂这些参数含义 2019-02-15 18:13:44。

## /proc/swaps文件内容的生成

参考`/proc/meminfo文件内容的生成`，swaps中的信息是meminfo信息的子集，swap_total和swap_free的获取方式相同。

## 小结

事实上需要掌握的内容只有一样： `所有/proc文件的内容格式和含义、所有cgroup文件接口的内容格式和含义`。嗯..这个任务..很艰巨...收录在[Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html)

## 参考

1. [Merge pull request #260 from aither64/cpu-views ][1]
2. [aither64/lxcfs][2]
3. [lxcfs根据cpu-share和cpu-quota等cgroup信息生成容器内的/proc文件（一）][3]
4. [lxcfs根据cpu-share和cpu-quota等cgroup信息生成容器内的/proc文件（一）：从cgroup中读取cpuinfo][4]
5. [获取指定进程的启动时间和运行时长][5]
6. [Real-Time group scheduling][6]
7. [cgroup cpu controller：CPU带宽控制CFS的相关参数][7]
8. [cgroup cpuacct controller][8]

[1]: https://github.com/lxc/lxcfs/commit/ea1e6b3776221917464c7dd70d179409719dc41c  "Merge pull request #260 from aither64/cpu-views "
[2]: https://github.com/aither64/lxcfs  "aither64/lxcfs"
[3]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/11/lxcfs-support-cpu-share-and-cpu-quota-1.html "lxcfs根据cpu-share和cpu-quota等cgroup信息生成容器内的/proc文件（一）"
[4]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/11/lxcfs-support-cpu-share-and-cpu-quota-1.html#%E4%BB%8Ecgroup%E4%B8%AD%E8%AF%BB%E5%8F%96cpuinfo "从cgroup中读取cpuinfo"
[5]: https://www.lijiaocn.com/chapter-c/time.html#%E8%8E%B7%E5%8F%96%E6%8C%87%E5%AE%9A%E8%BF%9B%E7%A8%8B%E7%9A%84%E5%90%AF%E5%8A%A8%E6%97%B6%E9%97%B4%E5%92%8C%E8%BF%90%E8%A1%8C%E6%97%B6%E9%95%BF "获取指定进程的启动时间和运行时长"
[6]: https://www.kernel.org/doc/Documentation/scheduler/sched-rt-group.txt "Real-Time group scheduling"
[7]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html#cpu-controllercpu%E5%B8%A6%E5%AE%BD%E6%8E%A7%E5%88%B6cfs%E7%9A%84%E7%9B%B8%E5%85%B3%E5%8F%82%E6%95%B0 "cgroup cpu controller：CPU带宽控制CFS的相关参数"
[8]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html#cpuacct-controller "cgroup cpuacct controller"
