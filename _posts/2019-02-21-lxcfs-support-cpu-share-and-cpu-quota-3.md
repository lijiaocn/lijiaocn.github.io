---
layout: default
title: "Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（下）"
author: 李佶澳
createdate: "2019-02-21 10:38:48 +0800"
changedate: "2019-02-21 13:55:59 +0800"
categories: 技巧
tags: cgroup docker
keywords: cpuacct.usage_percpu,cpuacct.usage_all,lxcfs,cgroup,cpu-share,cpu-quota
description: 修改lxcfs，解决cpuacct.usage_all不存在导致cpu使用率不准，显示了host的cpu使用率的问题
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这篇笔记记录了[There is no cpuacct.usage_all file in CentOS 7.2，should use cpuacct.usage_percpu ?][1]的解决方法。这个问题最早在[Lxcfs是什么？怎样通过lxcfs在容器内显示容器的CPU、内存状态](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/09/kubernetes-lxcfs-docker-container.html#%E6%9F%A5%E7%9C%8B%E5%AE%B9%E5%99%A8cpu%E7%8A%B6%E6%80%81)中记录。

**相关笔记**：

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（上）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/11/lxcfs-support-cpu-share-and-cpu-quota-1.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（中）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/15/lxcfs-support-cpu-share-and-cpu-quota-2.html)

[Lxcfs根据cpu-share、cpu-quota等cgroup信息生成容器内的/proc文件（下）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/21/lxcfs-support-cpu-share-and-cpu-quota-3.html)

[Lxcfs是什么？怎样通过lxcfs在容器内显示容器的CPU、内存状态](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/09/kubernetes-lxcfs-docker-container.html)

[Linux的cgroup功能（三）：cgroup controller汇总和控制器的参数（文件接口）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html)

[Linux的cgroup功能（二）：资源限制cgroup v1和cgroup v2的详细介绍](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/28/linux-tool-cgroup-detail.html)

[Linux的cgroup功能（一）：初级入门使用方法](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-cgroup.html)

## 问题描述

[aither64对/proc/stat的修正](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/15/lxcfs-support-cpu-share-and-cpu-quota-2.html#aither64%E5%AF%B9procstat%E7%9A%84%E4%BF%AE%E6%AD%A3)中使用的cgroup文件接口是`cpuacct.usage_all`，但是CentOS7.2中没有这个接口文件，因此没正确生成`容器的CPU资源使用情况`，而是直接返回了host的`/proc/stat`中的数据，导致在容器内看到的cpu使用率还是host的cpu使用率。

启动一个容器，只运行一个sh：

```
docker run -it --rm -m 256m  --cpus 2 --cpuset-cpus "1,2" \
      -v /var/lib/lxcfs/proc/cpuinfo:/proc/cpuinfo:rw \
      -v /var/lib/lxcfs/proc/meminfo:/proc/meminfo:rw \
      -v /var/lib/lxcfs/proc/stat:/proc/stat:rw \
      -v /var/lib/lxcfs/proc/swaps:/proc/swaps:rw \
      -v /var/lib/lxcfs/proc/uptime:/proc/uptime:rw \
      centos:latest /bin/sh
```

什么都没做，用top命令看到的cpu使用率：

```
top - 04:09:52 up 0 min,  0 users,  load average: 2.26, 2.65, 2.12
Tasks:   2 total,   1 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu0  :  0.0 us,  0.0 sy,  0.0 ni, 99.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.3 st
%Cpu1  : 39.0 us, 61.0 sy,  0.0 ni,  0.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem :   262144 total,   260032 free,     2112 used,        0 buff/cache
KiB Swap:        0 total,        0 free,        0 used.   260032 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
    1 root      20   0   11816   1684   1348 S   0.0  0.6   0:00.04 sh
    6 root      20   0   56204   2036   1468 R   0.0  0.8   0:00.00 top
```

## 解决方法

找不到`cpuacct.usage_all`的时候用`cpuacct.usage_percpu`中的信息替代，这个文件的内容格式和含义见[cpuacct](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/18/linux-tool-cgroup-parameters.html#cpuacct)。[实现代码](https://github.com/lijiaocn/lxcfs/commit/8d74a7511f442a2fd6e4bb41feaa2d3b77a5a3c8)，`git diff d8addb023a0e bindings.c`结果如下：

```diff
diff --git a/bindings.c b/bindings.c
index 049418c..9802eb6 100644
--- a/bindings.c
+++ b/bindings.c
@@ -4046,6 +4046,47 @@ static uint64_t get_reaper_age(pid_t pid)
        return procage;
 }

+/*
+ * Returns 0 on success.
+ * Just an implement of read_cpuacct_usage_all.
+ */
+static inline int read_cpuacct_usage_all_percpu(char *cg, char *cpuset, struct cpuacct_usage *cpu_usage, int cpucount, long ticks_per_sec)
+{
+       char *usage_str = NULL;
+       char *delim = " ";
+       char *token = NULL;
+       int j = 0;
+       uint64_t usage;
+       int rv;
+
+       if (!cpu_usage) {
+               return -1;
+       }
+
+       if (!cgfs_get_value("cpuacct", cg, "cpuacct.usage_percpu", &usage_str)) {
+               rv = -1;
+               goto err;
+       }
+
+       // usage_str formt: 120190269376599 151483821809073 145465919648605 14450503259981
+       token = strtok(usage_str, delim);
+       while (NULL != token && j < cpucount)  {
+               sscanf(token,"%lu", &usage);
+               cpu_usage[j].user = usage / 1000.0 / 1000 / 1000 * ticks_per_sec;
+               cpu_usage[j].system = 0;
+               token = strtok(NULL, delim);
+               j++;
+       }
+
+       rv = 0;
+
+err:
+       if (usage_str)
+               free(usage_str);
+
+       return rv;
+}
+ /*
  * Returns 0 on success.
  * It is the caller's responsibility to free `return_usage`, unless this
@@ -4072,12 +4113,17 @@ static int read_cpuacct_usage_all(char *cg, char *cpuset, struct cpuacct_usage *
        }

        cpu_usage = malloc(sizeof(struct cpuacct_usage) * cpucount);
+       bzero(cpu_usage,sizeof(struct cpuacct_usage) * cpucount);
        if (!cpu_usage)
                return -ENOMEM;

        if (!cgfs_get_value("cpuacct", cg, "cpuacct.usage_all", &usage_str)) {
-               rv = -1;
-               goto err;
+               if (read_cpuacct_usage_all_percpu(cg, cpuset, cpu_usage, cpucount, ticks_per_sec) != 0 ){
+                       rv = -1;
+                       goto err;
+               }else{
+                       goto suc;
+               }
        }

        if (sscanf(usage_str, "cpu user system\n%n", &read_cnt) != 0) {
@@ -4111,6 +4157,7 @@ static int read_cpuacct_usage_all(char *cg, char *cpuset, struct cpuacct_usage *
                j++;
        }

+suc:
        rv = 0;
        *return_usage = cpu_usage;
        *size = cpucount;
```

**注意**：因为cpuacct.usage_percpu中的时间没有按照user和system分开，所以全算作user时间了，在容器中会看到system占比为0。

## 验证

在容器内只运行了sh和top的时候：

```sh
top - 04:05:08 up 0 min,  0 users,  load average: 2.99, 2.68, 1.90
Tasks:   2 total,   1 running,   1 sleeping,   0 stopped,   0 zombie
%Cpu0  :  0.3 us,  0.0 sy,  0.0 ni, 99.7 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu1  :  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem :   262144 total,   260208 free,     1936 used,        0 buff/cache
KiB Swap:        0 total,        0 free,        0 used.   260208 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
    1 root      20   0   11816   1684   1348 S   0.0  0.6   0:00.03 sh
    6 root      20   0   56204   2036   1468 R   0.0  0.8   0:00.06 top
```

在容器内运行`dd if=/dev/zero of=/dev/null`，将一个CPU占满后：

```sh
top - 04:07:24 up 2 min,  0 users,  load average: 3.06, 2.81, 2.06
Tasks:   4 total,   2 running,   2 sleeping,   0 stopped,   0 zombie
%Cpu0  :  0.0 us,  0.0 sy,  0.0 ni,100.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
%Cpu1  :100.0 us,  0.0 sy,  0.0 ni,  0.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.0 st
KiB Mem :   262144 total,   259596 free,     2548 used,        0 buff/cache
KiB Swap:        0 total,        0 free,        0 used.   259596 avail Mem

  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
   12 root      20   0    4404    356    284 R 100.0  0.1   1:29.65 dd
    1 root      20   0   11816   1684   1348 S   0.0  0.6   0:00.03 sh
    6 root      20   0   56204   2036   1468 R   0.0  0.8   0:00.04 top
    7 root      20   0   11816   1680   1348 S   0.0  0.6   0:00.02 sh
```

## 参考

1. [There is no cpuacct.usage_all file in CentOS 7.2，should use cpuacct.usage_percpu ?][1]

[1]: https://github.com/lxc/lxcfs/issues/273 "There is no cpuacct.usage_all file in CentOS 7.2，should use cpuacct.usage_percpu ?"


