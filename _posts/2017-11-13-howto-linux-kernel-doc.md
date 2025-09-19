---
layout: default
title: "怎样获取Linux kernel相关的知识？Linux内核文档汇总"
author: 李佶澳
createdate: 2017/11/13 10:55:50
last_modified_at: 2017/11/14 15:29:48
categories: 方法
tags: linux
keywords: kernel,linux,获取知识,documention
description: 使用linux是躲不开的kernel，但kernel的内容又实在是太多了

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

使用linux是躲不开的kernel，但是kernel的内容实在是太多了，随便一个子系统，都可以出好几本书。

期望在遇到问题之前，将kernel的知识全部了解，是不实际，需要找到一种方法，能够快速地找到与问题相关的知识。

百度和google都是不靠谱的，因为通过搜索只能得到零碎、不一定正确的内容，构建起知识体系，加注第一手资料的索引才是王道。

Kernel源码中包含到文档很丰富、收集了kernel各个方面的内容： [Linux Kernel Documentation][1]，也可以到[Github: linux kernel][18]中查看，前者更适合在线阅读。

Redhat的产品文档是特别优秀的资料：[Product Documentation for Red Hat Enterprise Linux][5]。

Redhat的知识库也是很靠谱的：[redhat knowledgebase][6]。

## 00-INDEX

每个目录下通常都有一个名为`00_INDEX`的文件，对当前目录下的所有文件和和子目录做了说明，例如根目录下[Documentation 00-INDEX][3]。

## sysctl 

内核有非常多可调整参数，它们在/proc和/sys目录中以文件的形式暴露出来。

Kernnel的[Documentation/sysctl][12]目录汇聚了所有内核参数。

## memory

[Documentation/vm][10]

[Understanding the Linux Virtual Memory Manager][7]

[Overview of Linux Memory Management Concepts: Slabs][9]

[Linux slab 分配器剖析][4]

[Where is my memory?][11]

[LDD3，chapter8 Allocating Memory][13]

[LAB5: memory management][14]

[Kmalloc Internals: Exploring Linux Kernel Memory Allocation][15]

[lwn.net: Memory compaction][16]

[System-wide Memory Defragmenter Without Killing any application][17]

可以用命令`slabtop`查看kernel memory的使用情况，或者直接查看`/proc/slabinfo`。

## NUMA

文档:

	linux-3.2.12\Documentation\vm\numa
	linux-3.2.12\Documentation\vm\numa_memory_policy.txt
	linux-3.2.12\Documentation\vm\page_migration

NUMA和与硬件平台相关的. 简单讲就是有的硬件平台支持多个CPU, 多套内存。每一个这样的单位看作是一个cell, 每个cell有必须一个独立的处理器, cell可以有或者没有自己的内存.

cell内部的处理器可以访问cell本地的内存，也可以访问另一个cell的内存, 前者的访问速度比后者快。

NUMA使多个cell并行的运行，内存的带宽可以随着具有本地内存的cell数量增加而增长. 同时也带来了一些需要考虑的问题:

	1 cell上的执行进程申请内存的时候, 根据怎样的策略尽心内存分配?
	2 进程是否可以在cell间迁移, 进程的资源是否可以在cell间迁移, 迁移的策略是怎样的?
	3 应用程序要怎样利用numa获得较高的性能?

问题1和问题2在内核文档由详细介绍。

问题3则是程序员需要考虑的, 可以想到以下几点:

	1 考虑将进程绑定到特定cell, 消除迁移开销
	2 减少对其它cell的内存的访问
	3 精细控制进程使用的内存，例如明确指定某块内存需要从cell本地获取(在做设计的时候就要考虑这一点)

### 关于NUMA环境下的内存分配策略:

	linux-3.2.12\Documentation\vm\numa_memory_policy.txt

可以通过linux的系统函数指定进程的某段地址空间的内存分配策略, 策略作用域如下图:

	  +------------------------------------------------------------------+ 
	  |    Default Policy                                                | 
	  |                                                                  | 
	  |    +--------------------------|   +--------------------------|   |
	  |    |  Task/Process Policy     |   |  Task/Process Policy     |   |
	  |    |                          |   |                          |   |
	  |    |    +-----------------+   |   |    +-----------------+   |   |
	  |    |    |  VMA  Policy    |   |   |    |  VMA  Policy    |   |   |
	  |    |    +-----------------+   |   |    +-----------------+   |   |
	  |    |                          |   |                          |   |
	  |    |    +-----------------+   |   |    +-----------------+   |   |
	  |    |    |  Shared Policy  |   |   |    |  Shared Policy  |   |   |   
	  |    |    +-----------------+   |   |    +-----------------+   |   |
	  |    |                          |   |                          |   |
	  |    +--------------------------+   +--------------------------+   |
	  |                                                                  |
	  +------------------------------------------------------------------+

	  1 Default Policy是 local allocation
	  2 中心的Policy掩盖外围的Policy
	  3 设置新Policy不影响设置之前已经使用旧Policy进行了实际内存分配的地址空间
	  4 Task/Process Policy作用于单独的进程整个地址空间, 子进程继承父进程的Task/Process Policy, 
	    子线程继承父线程的Task/Process，兄弟线程直接互不相干
	  5 VMA Policy只作用于anonymous pages
	    (栈、堆、使用MAP_ANONYMOUS标记并且没有MAP_SHARED标记的mmap空间)
	  6 共用同一个虚拟地址空间的Tasks(例如线程)在该虚拟地址空间上使用同样的VMA Policy
	  7 Shared Policy作用于进程间共享的内存, 共享此空间进程在这空间见到的同样的Shared Policy
	    (shmget、使用MAP_SHARED标记的mmap空间 )
	  8 Default Policy作用于整个系统
	    Task/Process Policy作用于整个进程地址空间
	    VMA Policy和Shared Policy作用于单独进程地址空间中的某段地址
	    VMA Policy和Shared Policy的作用的地址空间可以分割
	  9 /proc/XXX/numa_maps中可以看到整个进程Policy状态

>NUMA环境下的内存分配策略比较复杂，看中文描述时容易出现一字之差谬之千里的情况, 所以强烈建议阅读英文版的内核文档

Linux提供了三个系统调用用于控制NUMA的内存策略:

	man 2 set_mempolicy    //set default NUMA memory policy for a process and its children
	man 2 get_mempolicy    //Retrieve NUMA memory policy for a process
	man 2 mbind            //set memory policy for a memory range

在linux还可以使用numactl命令指定进程或者共享内存的分配策略

	man numactl

### 关于NUMA环境下的页面迁移:

	linux-3.2.12\Documentation\vm\page_migration

NUMA环境下，进程运行时，进程的虚拟地址空间没有发生变换，但对应的的物理内存可以在多个node之间迁移。

>node是linux-3.2.12\Documentation\vm\page_migration中提到的词, 指的应该是拥有独立内存的cell

当进程被调度到另一个node上执行时, 将该进程使用的物理页迁移到执行该进程的node上, 可以提高内存存取速率。

进程迁移函数:

	man 2 move_pages


## Hugepages

	linux-3.2.12\Documentation\vm\hugetlbpage.txt

使用hugepages的目的是减少内存页面总数, 提高TLB缓存的命中率。

《深入理解计算机系统结构》中对内存的地址转换有非常详细的说明。

进程见到的内存地址只是内存的虚拟地址，不是真正的物理内存的地址，因此在访问内存的
内容时，需要将内存的虚拟地址转换成实际的物理地址。而内存的虚拟地址和物理地址的对
应关系是通过页表结构管理的。

为了提高地址转换的效率, CPU中存在TLB页表项缓存，但是缓存的大小是非常小的。因此如
果减少页表项的数目, 可以延长TLB中缓存的页表项的刷新周期，从而提高命中率

### 使用前提:

kernel is build with option CONFIG_HUGETLBFS

查看内核编译选项:

	cat /boot/config-`uname -r`

### 信息查看:

整体信息:

	cat /proc/meminfo

	HugePages_Total: vvv
	HugePages_Free:  www
	HugePages_Rsvd:  xxx
	HugePages_Surp:  yyy
	Hugepagesize:    zzz kB

	where:
	HugePages_Total is the size of the pool of huge pages.
	HugePages_Free  is the number of huge pages in the pool that are not yet
					allocated.
	HugePages_Rsvd  is short for "reserved," and is the number of huge pages for
					which a commitment to allocate from the pool has been made,
					but no allocation has yet been made.  Reserved huge pages
					guarantee that an application will be able to allocate a
					huge page from the pool of huge pages at fault time.
	HugePages_Surp  is short for "surplus," and is the number of huge pages in
					the pool above the value in /proc/sys/vm/nr_hugepages. The
					maximum number of surplus huge pages is controlled by
					/proc/sys/vm/nr_overcommit_hugepages.

不同size大小hugepage的信息:

	/sys/kernel/mm/hugepages/hugepages-2048kB

NUMA环境单个node的内存状态:

	/sys/devices/system/node/nodeX/meminfo

### 配置参数:

	/proc/sys/vm/nr_hugepages   //persistent huge pages number

### hugepage申请

hugepage申请其实就是将物理内存中一块单独的划分出来，对这部分内存使用大内存页.

对于2M的内存页可以在系统运行时直接修改/proc中参数分配，1G的内存页必须在系统启动时分配。

在系统运行时分配页面大小为2M的内存:

	//分配1024个2M的内存页 
	echo 1024 > /sys/kernel/mm/hugepages/hugepages-2048kB/nr_hugepages

	//如果是NUMA机器, 需要在每个node上单独分配
	echo 1024 > /sys/devices/system/node/node0/hugepages/hugepages-2048kB/nr_hugepages
	echo 1024 > /sys/devices/system/node/node1/hugepages/hugepages-2048kB/nr_hugepages

在系统启动时,通过内核参数指定要分配的内存:

	hugepages=XXX                  //hugepages页面数目 
	hugepagessz=XXX                //hugepages页面的大小
	default_hugepagesz=XXX         //hugepages默认页面大小

通过/proc申请:

	/proc/sys/vm/nr_hugepages      //已经分配的hugepages的页面数目(with default hugepage size)
	                               //可以通过修改里面的数值 增加/删除 页面

>注意: hugepages分配后, 使用的内存不能在做其它用途, 也不能被swap out.

>注意: 申请hugepages不等于使用hugepages, 申请是系统预留了这部分空间，如何使用见下一节

>在NUMA环境中, 会从每个node上尝试申请内存，如果某个node缺少足够的连续内存, 这些页面被其它的node分担.

>这也意味着hugepages应当尽可能早的分配, 在内存有足够连续的空闲的时候，例如启动时

### hugepages使用

linux-3.2.12\Documentation\vm\中给出了两个使用示例: 

	hugepage-mmap.c  hugepage-shm.c

>在使用下面的方式的时候, 注意关闭selinux, 否则会发现无法对hugepage进行操作，并会看到内核日志

#### 使用mmap的方式

在系统中挂载一个类型为hugetlbfs的虚拟文件系统，在其中写入的任何数据都保存在hugetlbfs中

	mount -t hugetlbfs nodev /mnt/huge

#### 使用shm的方式

直接使用shmget申请SHM_HUGETLB, 见man shmget

### 应用

已经有一些应用程序支持hugetlbfs, 例如mysql、oracle、dpdk等。在使用某个应用程序时要注意查阅手册中有没有相关内容

[linux-hugetlbfs-and-mysql-performance](http://www.cyberciti.biz/tips/linux-hugetlbfs-and-mysql-performance.html)

[configuring-huge-pages-for-oracle-on-linux-64](http://www.oracle-base.com/articles/linux/configuring-huge-pages-for-oracle-on-linux-64.php)

## networking

网络相关的文档位于[Documentation/networking][2]中。

## cgroup

[cgroup](https://www.kernel.org/doc/Documentation/cgroups/)

通过cgroup(Control Group)可以限制Tasks可以占用的资源, 总共包含8类资源:

	1. Block IO Controller
	2. CPU Accounting Controller
	3. Device Whitelist Controller
	4. HugeTLB Controller
	5. Memory Resource Controller
	6. Network Classifier
	7. Network Priority
	8. Cpusets
	9. Freezer

通过mount和文件操作就可以使用cgroup(内核文档中有示例)。

[libcgroups](http://libcg.sourceforge.net/html/index.html)是一套操作cgroup的C Library。

cgroup的每个Controller都有一套不同的虚拟文件, 有的用于显示状态信息和统计数据、有的用于设置cgroup参数。

## UIO - User-space drivers

[uio](https://www.kernel.org/doc/htmldocs/uio-howto/preface.html)

[uio-howto](https://www.kernel.org/doc/htmldocs/uio-howto/)

[about uio](https://www.kernel.org/doc/htmldocs/uio-howto/about.html)

UIO技术是指将Linux Device Driver拆分成两部分, 一部分是非常小的内核模块, 只包含必须在内核中实现的部分, 另一个部分则是在用户空间的实现的具体操作。

通过这种方式, 可以将驱动开发的大部分任务由内核空间移动到用户空间, 简化了开发过程, 并且降低了在内核模块引入严重BUG的风险。

UIO设备的信息可以在用户空间从设备或者sysfs中获得。UIO设备的设备文件依次命名为/dev/uio0、/dev/uio1、/dev/uio2...

对UIO设备文件进行read()、select()时，阻塞获得产生的中断号。

对UIO设备文件进行write()时, 根据写入的32bit的值，disable/enable对应的中断。

UIO设备的属性文件位于/sys/class/uio/uioX目录中, 可以从用户空间读取数值

UIO设备可以有1个或多个可以被mmap的内存区域，对应信息存放在/sys/class/uio/uioX/maps/mapX/中:

	name: A string identifier for this mapping. 
		  This is optional, the string can be empty. 
		  Drivers can set this to make it easier for userspace to find the correct mapping.

	addr: The address of memory that can be mapped. 可以被映射的地址

	size: The size, in bytes, of the memory pointed to by addr. 空间的大小

	offset: The offset, in bytes, that has to be added to the pointer returned by mmap() to 
			get to the actual device memory. This is important if the device's memory is not
			page aligned. Remember that pointers returned by mmap() are always page aligned,
			so it is good style to always add this offset.

x86平台上, UIO设备的ioport信息位于/sys/class/uio/uioX/portio目录中, 可以在用户空间使用ioperm()、iopl()、inb()、outb()等进行操作。

	name: A string identifier for this port region. The string is optional and can be empty. 
		  Drivers can set it to make it easier for userspace to find a certain port region.

	start: The first port of this region.

	size: The number of ports in this region.

	porttype: A string describing the type of port.

对于需要被poll, 但是自身不产生中断的设备, 可以通过在定时器的事件处理中调用uio_event_notify()模拟中断。

[Write Device's UIO Kernel Module](https://www.kernel.org/doc/htmldocs/uio-howto/custom_kernel_module.html)

[Write User-sapce Driver](https://www.kernel.org/doc/htmldocs/uio-howto/userspace_driver.html)

[Generic PCI UIO driver](https://www.kernel.org/doc/htmldocs/uio-howto/uio_pci_generic.html)


## namespace

[namespace](https://www.kernel.org/doc/Documentation/namespaces/)

[namespaces overview](http://lwn.net/Articles/531114/)

类别:

	Mount namespaces (CLONE_NEWNS,2.4.19): 文件系统挂载隔离
	UTS namespaces (CLONE_NEWUTS,2.6.19): hostname、NIS domain name隔离
	IPC namespaces (CLONE_NEWIPC,2.6.19): IPC资源隔离
	PID namespaces (CLONE_NEWPID,2.6.24): 进程号隔离
	Network namespaces (CLONE_NEWNT,2.6.24,2.6.29): 网络隔离 
	User namespaces (CLONE_NEWUSER,2.6.23,3.8): 用户和组的隔离

>with Linux3.8, unprivileged processes can create user namespaces in which they
 have full privileges.


[namespaces API](http://lwn.net/Articles/531381/)

	clone():    创建namespace
	setns():    将调用进程从当前namespace移动到另一个namespace
	unshare():  创建namespace, 并将调用进程加入到新建的namespace

## AppArmor

AppArmor用于控制Linux程序的操作权限。内核从2.6.36开始整合了AppArmor。

## SELinux

SELinux是flask体系在linux上的实现，旨在提供强制的访问控制, 提高系统的安全性。

[SELinux Background](http://www.nsa.gov/research/selinux/background.shtml)介绍了SELinux的产生过程。

NSA的"National Information Assurance Research Laboratory"的研究员与"Secure Computing Corporation (SCC)"
合作开发一种基于类型强制(Type Enforcement)高强度的、灵活的强制访问控制架构。最早在"LOCK"系统上实现了该
架构，随后NSA和SCC开发了该架构的两个"Mach-based"的原型: DTMach和DTOS。然后NSA、SCC与犹他大学(Utah)的"FLUK"
研究组将该架构迁移到"Fluke"的研制工作中, 在这个过程中这套架构得到了强化, 能更好地支持动态策略, 被命名为"Flask"。
最后NSA将"Flask"架构集成到了Linux系统中，NSA的工作被Linux接收, 并被"Solaris"、"FreeBSD"、"Darwin" kernel等引入。

[The Inevitability of Failure: The Flawed Assumption of Security in Modern Computing Environments](https://www.nsa.gov/research/_files/selinux/papers/inevitability.pdf)
中阐述了操作系统需要"mandatory access controls"的原因。


[The Flask Security Architecture: System Support for Diverse Security Polices](https://www.nsa.gov/research/_files/selinux/papers/flask.pdf)中介绍Flask架构。

[SELinux Notebook-4th](http://freecomputerbooks.com/books/The_SELinux_Notebook-4th_Edition.pdf)

[Security-Enhanced Linux](http://www.nsa.gov/research/selinux/index.shtml)

[Selinux Coloring Book](https://people.redhat.com/duffy/selinux/selinux-coloring-book_A4-Stapled.pdf)

[flask](http://www.cs.utah.edu/flux/fluke/html/flask.html)

[CentOS上SELinux的使用方法](http://wiki.centos.org/HowTos/SELinux#head-278c8563bd7ad5d47c7867355b89a697fe9ad1da)


### 原理

SELinux工作原理是进行强制访问控制(MAC, mandatory access control), 每个文件和每个进程都有一个上下文(context), 进程对文件进行操作时，SELinux检查该进程是否具有操作文件的权限。

SELinux提供了细致到进程的细粒度的权限控制.可以通过-Z选项查看文件或者进程的SELinux上下文:

	//查看文件的SELinux上下文:
	[root@localhost targeted]# ls -Z

	drwxr-xr-x. root root system_u:object_r:default_context_t:s0 contexts
	drwxr-xr-x. root root system_u:object_r:selinux_login_config_t:s0 logins
	drwxr-xr-x. root root system_u:object_r:selinux_config_t:s0 modules
	drwxr-xr-x. root root system_u:object_r:semanage_store_t:s0 policy
	-rw-r--r--. root root system_u:object_r:selinux_config_t:s0 setrans.conf
	-rw-r--r--. root root unconfined_u:object_r:selinux_config_t:s0 seusers

	//查看进程的SELinux上下文:
	[root@localhost targeted]# ps auZ|grep ssh

	unconfined_u:unconfined_r:unconfined_t:s0-s0:c0.c1023 root 9820 0.0  0.0 103244 820 pts/1 S+ 00:39   0:00 grep ssh

上面 XX_u:XX_r:XX_t:XX样式的内容就是SELinux上下文, 各自字段含义如下:

	user:role:type:mls

	user: SELinux users
	role: 
	type: 
	mls:  Multi-Level Security

### 策略文件

在linux目录/usr/share/selinux/devel/中包含策略文件格式规范 (需要安装有selinux-policy-3.7.19-195.el6.noarch)

	[root@localhost devel]# pwd
	/usr/share/selinux/devel
	[root@localhost devel]# ls -l example.*
	-rw-r--r--. 1 root root  185 Feb 22  2013 example.fc
	-rw-r--r--. 1 root root 1033 Feb 22  2013 example.if
	-rw-r--r--. 1 root root  516 Feb 22  2013 example.te

>关于策略文件没有找到详细的介绍。。。

### 管理工具

linux提供了SELinux的管理工具

修改文件或目录的SELinux Context:

	man chcon           

策略管理:

	man semanage          //SELinux策略管理

>需要安装 policycoreutils-python-2.0.83-19.30.el6.x86_64

## 参考

1. [linux kernel documentation][1]
2. [Documentation/networking][2]
3. [Documentation 00-INDEX][3]
4. [Linux slab 分配器剖析][4]
5. [Product Documentation for Red Hat Enterprise Linux][5]
6. [redhat knowledgebase][6]
7. [Understanding the Linux Virtual Memory Manager][7]
8. [kernel docs][8]
9. [Overview of Linux Memory Management Concepts: Slabs][9]
10. [Documentation/vm][10]
11. [Where is my memory?][11]
12. [Documentation/sysctl][12]
13. [LDD3，chapter8 Allocating Memory][13]
14. [lab: memory management][14]
15. [Kmalloc Internals: Exploring Linux Kernel Memory Allocation][15]
16. [lwn.net: Memory compaction][16]
17. [System-wide Memory Defragmenter Without Killing any application][17]
18. [Github: linux kernel][18]
19. [The Linux Kernel documentation][19]

[1]: https://www.kernel.org/doc/Documentation/  "linux kernel documentation" 
[2]: https://www.kernel.org/doc/Documentation/networking/ "Documentation/networking"
[3]: https://www.kernel.org/doc/Documentation/00-INDEX "Documentation 00-INDEX"
[4]: https://www.ibm.com/developerworks/cn/linux/l-linux-slab-allocator/index.html "Linux slab 分配器剖析"
[5]: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/ "Product Documentation for Red Hat Enterprise Linux"
[6]: https://access.redhat.com/search/#/knowledgebase  "redhat knowledgebase"
[7]: https://www.kernel.org/doc/gorman/html/understand/  "Understanding the Linux Virtual Memory Manager"
[8]: https://www.kernel.org/doc/  "kernel docs"
[9]: http://www.secretmango.com/jimb/Whitepapers/slabs/slab.html "Overview of Linux Memory Management Concepts: Slabs"
[10]: https://www.kernel.org/doc/Documentation/vm/  "Documentation/vm"
[11]: https://www.dedoimedo.com/computers/slabinfo.html  "Where is my memory?"
[12]: https://www.kernel.org/doc/Documentation/sysctl/  "Documentation/sysctl"
[13]: https://static.lwn.net/images/pdf/LDD3/ch08.pdf "LDD3，chapter8 Allocating Memory"
[14]: http://www.cs.otago.ac.nz/cosc440/labs/lab05.pdf "lab: memory management"
[15]: http://www.jikos.cz/jikos/Kmalloc_Internals.html "Kmalloc Internals: Exploring Linux Kernel Memory Allocation"
[16]: https://lwn.net/Articles/368869/  "lwn.net: Memory compaction"
[17]: http://events.linuxfoundation.org/sites/events/files/slides/%5BELC-2015%5D-System-wide-Memory-Defragmenter.pdf  "System-wide Memory Defragmenter Without Killing any application"
[18]: https://github.com/torvalds/linux "Github: linux kernel"
[19]: https://www.kernel.org/doc/html/latest/ "The Linux Kernel documentation"
