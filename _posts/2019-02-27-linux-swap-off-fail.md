---
layout: default
title: "Linux关闭swap失败，swapoff failed: cannot allocate memory"
author: 李佶澳
createdate: "2019-02-27 10:26:42 +0800"
changedate: "2019-02-27 11:52:41 +0800"
categories: 问题
tags: linux
keywords: swapoff,linux
description: "执行swapoff -a关闭swap的时候，报不能分配内存的错误：swapoff failed: Cannot allocate memory"
---

## 目录
* auto-gen TOC:
{:toc}

## 现象

有几台服务器内存充足，可用内存还有几十个G，swap分区被少量使用，执行`swapoff -a`的时候，报错：

```sh
$ swapoff -a -v
swapoff /swapfile
swapoff: /swapfile: swapoff failed: Cannot allocate memory
```

## 调查

Google了一番，网上主要给出了两种解决方法，分别是1)释放内存缓存，2)允许内存overcommit。

### 方法1：释放内存缓存后，重新执行swapoff -a

[Unable to swapoff but enough physical memory is available][1]中提出了这种解决方法：

```sh
sync ; echo 3 > /proc/sys/vm/drop_caches
```

[How to Clear RAM Memory Cache, Buffer and Swap Space on Linux][2]对此作做了更详细的说明，`drop_caches`接受的参数是`1`、`2`、`3`，分别清空pagecache、slab对象、pagecahce和slab对象。在[Documentation/sysctl/vm.txt][3]中可以找到说明：

```
To free pagecache:
    echo 1 > /proc/sys/vm/drop_caches

To free reclaimable slab objects (includes dentries and inodes):
    echo 2 > /proc/sys/vm/drop_caches

To free slab objects and pagecache:
    echo 3 > /proc/sys/vm/drop_caches
```
 
`dirty`状态的内存缓存不会被释放，如果要释放尽可能多的内存缓存，先执行命令`sync`，减少dirty状态的内存缓存。如果要disable，输入参数`4`，注意`0`不被接受：

```sh
echo 4 > /proc/sys/vm/drop_caches
```

释放了部分内存缓存之后，部分机器`等待一段时间`，swapoff -a执行成功，有的机器还是不能成功，关停了几个服务之后，swapoff -a执行成功。

### 方法2：允许内存overcommit

这是后来看到的方法，没有试验，仅做记录。

[当overcommit_memory == 2时，swapoff失败][4]和[swap无法卸载][5]中使用的是这种方法：在`/etc/sysctl.conf`中设置`vm.overcommit_memory=0`，执行sysctl -p更新内核参数。

[Documentation/sysctl/vm.txt][3]中介绍了内核参数`overcommit_memory`的用途，它用来控制“用户空间申请内存时，是否进行内存容量判断(overcommit判断）以及是否批准：

```
When this flag is 0, the kernel attempts to estimate the amount
of free memory left when userspace requests more memory.

When this flag is 1, the kernel pretends there is always enough
memory until it actually runs out.

When this flag is 2, the kernel uses a "never overcommit"
policy that attempts to prevent any overcommit of memory.
Note that user_reserve_kbytes affects this policy.
```

设置的值为`2`表示不允许overcommit，这时候如果停掉swap，那么可用内存减少，用户空间的内存申请就可能触发overcommit被拒绝。但是事后查了一下我们集群中的机器，overcommit_memory的参数值本来就是0或1了，似乎和swapoff失败没啥关系。不过掌握了一组内核参数，也值了。

## 参考

1. [Unable to swapoff but enough physical memory is available][1]
2. [How to Clear RAM Memory Cache, Buffer and Swap Space on Linux][2]
3. [Documentation/sysctl/vm.txt][3]
4. [当overcommit_memory == 2时，swapoff失败][4]
5. [swap无法卸载][5]

[1]: https://unix.stackexchange.com/questions/321675/unable-to-swapoff-but-enough-physical-memory-is-available "Unable to swapoff but enough physical memory is available"
[2]: https://www.tecmint.com/clear-ram-memory-cache-buffer-and-swap-space-on-linux/ "How to Clear RAM Memory Cache, Buffer and Swap Space on Linux"
[3]: https://github.com/torvalds/linux/blob/master/Documentation/sysctl/vm.txt "Documentation/sysctl/vm.txt"
[4]: http://www.kbase101.com/question/27169.html "当overcommit_memory == 2时，swapoff失败"
[5]: https://blog.51cto.com/wwdhks/1424507 "swap无法卸载"
