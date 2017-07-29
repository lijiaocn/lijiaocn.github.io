---
layout: default
title: Linux中进程的虚拟内存与docker的内存限制
author: lijiaocn
createdate: 2017/07/21 12:18:10
changedate: 2017/07/21 15:27:04
categories: 问题
tags: memory docker
keywords: 虚拟内存,virt
description: 在试图用malloc耗尽内存的时候，发现这个情况。

---

* auto-gen TOC:
{:toc}

## 现象

在测试docker的内存限制效果的时候，写了下面这个小程序。

	#include <unistd.h>
	#include <stdlib.h>
	#include <stdio.h>
	
	int main(int argc, const char *argv[])
	{
	    void *ptr;
	    int i = 0;
	    while(1){
	        printf("alloc %d * 5MB\n", i);
	        ptr = malloc(5*1024*1024);
	        if(ptr==NULL){
	            printf("alloc fail!\n");
	            break;
	        }else{
	            i++;
	        }
	    }
	    return 0;
	}

在容器内编译运行:

	gcc -o oom oom.c

容器的内存设置的是500MB，swap默认没有设置，默认为内存的2倍。

然后运行后发现，循环了几十万次后，才被操作系统杀死:

	$./oom
	...
	alloc 128591 * 5MB
	alloc 128592 * 5MB
	alloc 128593 * 5MB
	Killed

百思不得其解，直到看到了进程状态，才恍然大悟:

	  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
	12591 root      20   0  0.600t 502284      0 R  40.7  6.3   0:02.19 oom

可以看到在malloc的过程中，进程的VIRT不断的增加，远超过了物理内存的空间，而RES一直停留在比较低的水平。

## 修改之后

因此，对程序做了修改，不仅申请内存，而且实际的使用内存:

	#include <unistd.h>
	#include <stdlib.h>
	#include <stdio.h>
	#include <string.h>
	
	int main(int argc, const char *argv[])
	{
	    void *ptr;
	    int i = 0;
	    int size = 5*1024*1024;
	    while(1){
	        printf("alloc %d * 5MB\n", i);
	        ptr = malloc(size);
	        if(ptr==NULL){
	            printf("alloc fail!\n");
	            break;
	        }else{
	            i++;
	            memset(ptr,0,size);
	        }
	        sleep(1);
	    }
	    return 0;
	}

继续观察进程的状态，开始时候VIRT和RES同步增长：

	  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
	11588 root      20   0 1297744 1.197g   8928 S  50.5 15.7 770:40.13 prometheus
	30866 root      20   0  342344 338656    400 S   0.0  4.2   0:00.14 oom

在VIRT持续增加，RES则增长到接近500MB的时候停止增加:

	  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
	11588 root      20   0 1297744 1.197g   8928 S  43.9 15.7 771:15.08 prometheus
	30866 root      20   0  675404 443208      8 R   0.3  5.5   0:00.57 oom

循环了232~234次，也就是一共使用了1160MB~1170MB的VIRT后，进程被操作系统杀死，而不是主动退出。

在dmesg中可以看到:

	[4983682.777772] Task in /docker/d9e6ba6b7a1e21347cbf9feebd2a6a1251349525a2ad2320679223848f28ae18 killed as a result of limit of /docker/d9e6ba6b7a1e21347cbf9feebd2a6a1251349525a2ad2320679223848f28ae18
	[4983682.777774] memory: usage 511928kB, limit 512000kB, failcnt 788433
	[4983682.777776] memory+swap: usage 1197316kB, limit 9007199254740988kB, failcnt 0
	[4983682.777777] kmem: usage 4168kB, limit 9007199254740988kB, failcnt 0
	[4983682.777778] Memory cgroup stats for /docker/d9e6ba6b7a1e21347cbf9feebd2a6a1251349525a2ad2320679223848f28ae18: cache:32KB rss:507732KB rss_huge:0KB mapped_file:8KB swap:685388KB inactive_anon:253968KB active_anon:253756KB inactive_file:4KB active_file:0KB unevictable:0KB
	[4983682.777786] [ pid ]   uid  tgid total_vm      rss nr_ptes swapents oom_score_adj name
	[4983682.777860] [ 7468]     0  7468     2908       23      11       36          -998 sh
	[4983682.777863] [22762]     0 22762     2907        0      11       56          -998 sh
	[4983682.777864] [28879]     0 28879     2942        0      12      105          -998 sh
	[4983682.777868] [30494]     0 30494     2941        0      11       97          -998 sh
	[4983682.777871] [30866]     0 30866   299513   115900     590   182063          -998 oom
	[4983682.777873] Memory cgroup out of memory: Kill process 30866 (oom) score 0 or sacrifice child
	[4983682.778613] Killed process 30866 (oom) total-vm:1198052kB, anon-rss:463592kB, file-rss:8kB, shmem-rss:0kB

## 参考

1. [limit a container's resources][1]
2. [Out Of Memory Management][2]
3. [docker --memory-swap-details][3]
4. [Understanding the Linux Virtual Memory Manager][4]
5. [Docker 资源限制之内存][5]

[1]: https://docs.docker.com/engine/admin/resource_constraints/  "limit a container's resources" 
[2]: https://www.kernel.org/doc/gorman/html/understand/understand016.html  "Out Of Memory Management"
[3]: https://docs.docker.com/engine/admin/resource_constraints/#--memory-swap-details  "docker --memory-swap-details"
[4]: https://www.kernel.org/doc/gorman "Understanding the Linux Virtual Memory Manager"
[5]: http://blog.opskumu.com/docker-memory-limit.html "Docker 资源限制之内存"
