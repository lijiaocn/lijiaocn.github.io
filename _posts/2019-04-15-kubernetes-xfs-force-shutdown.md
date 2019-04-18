---
layout: default
title: "xfs文件系统损坏，kubelet主动退出且重启失败，恢复后该node上无法创建pod"
author: 李佶澳
createdate: "2019-04-15 15:49:34 +0800"
changedate: "2019-04-18 14:29:42 +0800"
categories: 问题
tags: kubernetes
keywords: xfs,kubernetes,metadata I/O error,blk_update_request,xfs_log_force
description: "xfs文件系统元数据损坏metadata I/O error: block,xfs_log_force: error -5,input/output error"

---

* auto-gen TOC:
{:toc}

## 说明

Kubernetes集群的一个node突然NotReady，发现是kubelet进程退出，并且多次重启失败。
检查时重启Kubelet服务重启成功，但是随后接到反馈，该node上的容器无法创建：

```sh
$ kubectl -n  pro-xxxx logs xxxxx-webapp-xdae
container_linux.go:247: starting container process caused "process_linux.go:359: container init caused \"rootfs_linux.go:54:
mounting \\\"/data/docker_volumes/production/xxxx/xxxxwebapp/20190415104106\\\" to rootfs 
\\\"/var/lib/docker/overlay/138956ae6ba1117956839e900951bfd1643c763bfdb5624305045f8eb563c7c9/merged\\\" 
at \\\"/var/app/log\\\" caused \\\"stat /data/docker_volumes/production/xxxx/xxxxwebapp/20190415104106: input/output error\\\"\""
```

错误是`input/output error`，主机名和应用名称作了脱敏处理。

## 调查 

Kubelet重启失败日志显示，启动时读取文件/var/lib/kubelet/pki/kubelet.crt，IO错误：

```sh
# 日志是倒序的，第一行是最新的
Apr 14 23:53:09 k8s-node-xxx systemd[1]: Starting Kubernetes Kubelet Server...
Apr 14 23:53:09 k8s-node-xxx systemd[1]: Started Kubernetes Kubelet Server.
Apr 14 23:53:09 k8s-node-xxx systemd[1]: kubelet.service holdoff time over, scheduling restart.
Apr 14 23:53:09 k8s-node-xxx systemd[1]: kubelet.service failed.
Apr 14 23:53:09 k8s-node-xxx systemd[1]: Unit kubelet.service entered failed state.
Apr 14 23:53:09 k8s-node-xxx systemd[1]: kubelet.service: main process exited, code=exited, status=255/n/a
Apr 14 23:53:09 k8s-node-xxx kubelet[27036]: F0414 23:53:09.157669   27036 server.go:141] read /var/lib/kubelet/pki/kubelet.crt: input/output error
Apr 14 23:53:09 k8s-node-xxx kubelet[27036]: I0414 23:53:09.156431   27036 kubelet_node_status.go:273] Setting node annotation to enable volume controller attach/detach
```

Kubelet进程第一次退出时的日志显示，在写日志时遇到IO错误，进程主动退出：

```sh
# 日志是倒序的，第一行是最新的
Apr 14 23:53:08 k8s-node-xxx systemd[1]: Starting Kubernetes Kubelet Server...
Apr 14 23:53:08 k8s-node-xxx systemd[1]: Started Kubernetes Kubelet Server.
Apr 14 23:53:08 k8s-node-xxx systemd[1]: kubelet.service holdoff time over, scheduling restart.
Apr 14 23:53:08 k8s-node-xxx systemd[1]: kubelet.service failed.
Apr 14 23:53:08 k8s-node-xxx systemd[1]: Unit kubelet.service entered failed state.
Apr 14 23:53:08 k8s-node-xxx systemd[1]: kubelet.service: main process exited, code=exited, status=2/INVALIDARGUMENT
Apr 14 23:53:08 k8s-node-xxx kubelet[31732]: log: exiting because of error: write /data/log/kubernetes/kubelet.k8s-node-xxx.root.log.INFO.20190413-093251.31732: input/output error
```

两处日志都指向了文件系统，查看日志文件所在的目录中的内容时报错：

```sh
$ ls /data
ls: cannot access /data: Input/output error
```
/data目录挂载的是sdb，文件系统是xfs，截至调查时依然不可读取，上面的日志来自journalctl。

需要注意的是，kubelet重启时读取/var/lib/kubelet/pki/kubelet.crt失败，该文件位于根分区，挂载的是另一块磁盘。
诡异的是调查时，重启kubelet的时候又成功了，根分区磁盘莫名其妙的恢复正常了？

## 继续调查

两处日志都指向了IO，查看内核日志，发现文件系统报错，报错之前有一些内存分配的错误，和文件系统报错间隔时间较久，不确定是否相关：

```sh
[Apr14 02:46] SLUB: Unable to allocate memory on node -1 (gfp=0x8020)
[  +0.000006]   cache: blkdev_ioc(480:73b7c7b6509ef942a880608bfbfc2c49060f994f595225b849aa610274c233ba), object size: 104, buffer size: 104, default order: 0, min order: 0
[  +0.000005]   node 0: slabs: 6, objs: 234, free: 0
[  +0.000950] SLUB: Unable to allocate memory on node -1 (gfp=0x8020)
[  +0.000005]   cache: blkdev_ioc(480:73b7c7b6509ef942a880608bfbfc2c49060f994f595225b849aa610274c233ba), object size: 104, buffer size: 104, default order: 0, min order: 0
[  +0.000002]   node 0: slabs: 6, objs: 234, free: 0
[ +42.975903] SLUB: Unable to allocate memory on node -1 (gfp=0x8020)
[  +0.000005]   cache: blkdev_ioc(480:73b7c7b6509ef942a880608bfbfc2c49060f994f595225b849aa610274c233ba), object size: 104, buffer size: 104, default order: 0, min order: 0
[  +0.000002]   node 0: slabs: 7, objs: 273, free: 0
[Apr14 02:47] SLUB: Unable to allocate memory on node -1 (gfp=0x8020)
[  +0.000015]   cache: blkdev_ioc(480:73b7c7b6509ef942a880608bfbfc2c49060f994f595225b849aa610274c233ba), object size: 104, buffer size: 104, default order: 0, min order: 0
[  +0.000002]   node 0: slabs: 7, objs: 273, free: 0
[Apr14 02:50] SLUB: Unable to allocate memory on node -1 (gfp=0x8020)
[  +0.000005]   cache: blkdev_ioc(480:73b7c7b6509ef942a880608bfbfc2c49060f994f595225b849aa610274c233ba), object size: 104, buffer size: 104, default order: 0, min order: 0
[  +0.000002]   node 0: slabs: 8, objs: 312, free: 0
```

20小时后，文件系统报错：

```sh
[Apr14 23:53] blk_update_request: I/O error, dev vdb, sector 1048930768
[  +0.109383] XFS (vdb): metadata I/O error: block 0x3e8569d0 ("xlog_iodone") error 5 numblks 64
[  +0.002884] XFS (vdb): xfs_do_force_shutdown(0x2) called from line 1180 of file fs/xfs/xfs_log.c.  Return address = 0xffffffffa0260d76
[  +0.000012] XFS (vdb): Log I/O Error Detected.  Shutting down filesystem
[  +0.002582] XFS (vdb): Please umount the filesystem and rectify the problem(s)
[  +0.217756] blk_update_request: I/O error, dev vda, sector 21597664
[  +0.006498] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.005268] blk_update_request: I/O error, dev vda, sector 21597664
[  +0.000997] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.156386] blk_update_request: I/O error, dev vda, sector 88008
[  +0.005757] blk_update_request: I/O error, dev vda, sector 88008
[  +0.028984] blk_update_request: I/O error, dev vda, sector 1570264
[  +0.005688] blk_update_request: I/O error, dev vda, sector 1570264
[  +0.026111] blk_update_request: I/O error, dev vda, sector 1570264
[  +0.020419] blk_update_request: I/O error, dev vda, sector 163456
[  +0.003275] blk_update_request: I/O error, dev vda, sector 163456
[  +0.231762] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.004023] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.496361] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.003411] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.497013] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.003510] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.495665] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[  +0.003914] XFS (vda1): metadata I/O error: block 0x14985e0 ("xfs_trans_read_buf_map") error 5 numblks 8
[ +15.640832] XFS (vdb): xfs_log_force: error -5 returned.
[ +30.079972] XFS (vdb): xfs_log_force: error -5 returned.
[Apr14 23:54] XFS (vdb): xfs_log_force: error -5 returned.
[ +30.079990] XFS (vdb): xfs_log_force: error -5 returned.
[Apr14 23:55] XFS (vdb): xfs_log_force: error -5 returned.
[ +30.080000] XFS (vdb): xfs_log_force: error -5 returned.
```

网上搜了一下，多年前就有人遇到过同样的内核日志，但是都没有给出结论。

[Disk failure, XFS shutting down, trying to recover as much as possible][1]中是同样的情况，[几次邮件来往](https://lists.debian.org/debian-user/2015/06/thrd2.html#00557)没有确定最终原因。
[Ubuntu16.04:KVM - xfs_log_force: error -5 returned after stress test running after a day #345 ][2]中在ubuntu 16.04上、使用kernerl 4.4.0-36-generic，连续两次引发同样的问题，但是该问题最后不了了之。

## 检查磁盘

故障盘的挂载点正在被使用，无法卸载：


```sh
$ umount  /data
$ xfs_repair -n /dev/vdb
xfs_repair: /dev/vdb contains a mounted and writable filesystem
fatal error -- couldn't initialize XFS library
```

在/etc/fstab中去掉挂载，重启机器，用xfs_repair查看文件系统状态，发现文件系统有错，`bad nblocks 56158 for inode 2149532128, would reset to 56222`：

```
$ xfs_repair -n /dev/vdb
Phase 1 - find and verify superblock...
Phase 2 - using internal log
        - scan filesystem freespace and inode maps...
agf_freeblks 58447576, counted 58447962 in ag 2
sb_icount 1728, counted 2368
sb_ifree 120, counted 127
sb_fdblocks 249095733, counted 246415105
        - found root inode chunk
Phase 3 - for each AG...
        - scan (but don't clear) agi unlinked lists...
        - process known inodes and perform inode discovery...
        - agno = 0
        - agno = 1
        - agno = 2
data fork in ino 2149532128 claims free block 201351977
data fork in ino 2149532128 claims free block 201351978
bad nblocks 56158 for inode 2149532128, would reset to 56222
data fork in ino 2149532180 claims free block 138585846
data fork in ino 2149532182 claims free block 135500463
        - agno = 3
        - process newly discovered inodes...
Phase 4 - check for duplicate blocks...
        - setting up duplicate extent list...
        - check for inodes claiming duplicate blocks...
        - agno = 0
        - agno = 1
        - agno = 2
        - agno = 3
bad nblocks 56158 for inode 2149532128, would reset to 56222
No modify flag set, skipping phase 5
Phase 6 - check inode connectivity...
        - traversing filesystem ...
        - traversal finished ...
        - moving disconnected inodes to lost+found ...
Phase 7 - verify link counts...
No modify flag set, skipping filesystem flush and exiting.
```

## 尝试修复文件系统

尝试修复xfs文件系统：

```
$ xfs_repair  /dev/vdb
Phase 1 - find and verify superblock...
Phase 2 - using internal log
        - zero log...
ERROR: The filesystem has valuable metadata changes in a log which needs to
be replayed.  Mount the filesystem to replay the log, and unmount it before
re-running xfs_repair.  If you are unable to mount the filesystem, then use
the -L option to destroy the log and attempt a repair.
Note that destroying the log may cause corruption -- please attempt a mount
of the filesystem before doing this.
```

提示需要回放日志，于是重新挂载。

诡异的是，重新挂载之后，该磁盘上的数据可以访问了，之前重新挂载过几次，读取数据时都在报I/O错误的。

这期间重启了一次系统，执行了几次没有成功的`xfs_repair /dev/vdb`，随后发现，kubelet使用了一个新的日志文件，报I/O错误时，使用的是另一个日志文件：

	-rw-r--r-- 1 root root 687M Apr 14 23:52 kubelet.k8s-node-xxx.root.log.INFO.20190413-093251.31732

尝试打开当时的日志，读取了部分数据以后，再次报出IO错误，同时所在磁盘上的数据也都无法读取：

	$ ls -lh
	ls: cannot open directory .: Input/output error

现在能断定在写日志的时候，因为某种原因，导致xfs文件系统错误，触发保护机制，xfs文件系统被强制关闭（内核日志）:

```sh
[Apr14 23:53] blk_update_request: I/O error, dev vdb, sector 1048930768
[  +0.109383] XFS (vdb): metadata I/O error: block 0x3e8569d0 ("xlog_iodone") error 5 numblks 64
[  +0.002884] XFS (vdb): xfs_do_force_shutdown(0x2) called from line 1180 of file fs/xfs/xfs_log.c.  Return address = 0xffffffffa0260d76
```

## 问题根源未能确定

关键是：为什么会突然出错？是内核或者文件系统有Bug，还是磁盘故障？问题机器是一台云主机，问题磁盘是云主机的本地数据盘。

因为操作失误，导致问题磁盘被删除重建，现场丢失，未能确定问题根源。先去恶补linux内存管理、vfs，xfs文件系统以及磁盘诊断方面的知识了...

## 参考

1. [Disk failure, XFS shutting down, trying to recover as much as possible][1]
2. [Ubuntu16.04:KVM - xfs_log_force: error -5 returned after stress test running after a day #345 ][2]
3. [AHCI XFS (sda3): metadata I/O error: block 0x941ce20 ("xlog_iodone") error 5 numblks 64][3]

[1]: https://lists.debian.org/debian-user/2015/06/msg00557.html "Disk failure, XFS shutting down, trying to recover as much as possible"
[2]: https://bugs.launchpad.net/ubuntu/+source/linux/+bug/1775527 "Ubuntu16.04:KVM - xfs_log_force: error -5 returned after stress test running after a day #345 "
[3]: https://lkml.org/lkml/2014/11/3/1049 "[AHCI] XFS (sda3): metadata I/O error: block 0x941ce20 (xlog_iodone) error 5 numblks 64" 
