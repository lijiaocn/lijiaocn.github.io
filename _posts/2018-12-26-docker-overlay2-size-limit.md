---
layout: default
title: "docker的storage-driver是overlay2时，限制单个容器可占用的磁盘空间"
author: 李佶澳
createdate: "2018-12-26 10:56:40 +0800"
changedate: "2018-12-26 10:56:40 +0800"
categories: 问题
tags:  docker
keywords: docker,storage-driver,overlay2,size limit
description: 使用overlay2时要限制单个容器的可占用空间，需要使用xfs文件系统
---

* auto-gen TOC:
{:toc}

## 说明

overlay2.size是在[17.07.0-ce](https://github.com/docker/docker-ce/releases?after=v17.09.0-ce-rc1)中引入的：[Add overlay2.size daemon storage-opt](https://github.com/moby/moby/pull/32977)。

这里使用的docker版本是18.03-ce:

```bash
$ docker info
Containers: 2
 Running: 2
 Paused: 0
 Stopped: 0
Images: 2
Server Version: 18.03.1-ce
Storage Driver: overlay2
 Backing Filesystem: xfs
 Supports d_type: true
 Native Overlay Diff: true
Logging Driver: json-file
Cgroup Driver: cgroupfs
...
```

## overlay2.size

[docker daemon配置项][1]中介绍了`overlay2.size`配置项，可以用来限制每个容器可以占用的磁盘空间。 

>overlay2.size
>
>Sets the default max size of the container. It is supported only when the backing fs is xfs and mounted with pquota mount option. 
>Under these conditions the user can pass any size less then the backing fs size.
> 
>Example
>
> $ sudo dockerd -s overlay2 --storage-opt overlay2.size=1G

如文档中所述，需要使用xfs文件系统，并且挂载时使用`pquota`。

## 开启xfs的quota特性

[How to Enable Disk Quotas on an XFS File System][2]中介绍了如何开启xfs的quota功能。

xfs支持三种类型的quota：`uquota`、`gquota`和`pquota`，在man xfs中可以看到：

```bash
uquota/usrquota/quota/uqnoenforce/qnoenforce
       User disk quota accounting enabled, and limits (optionally) enforced.  Refer to xfs_quota(8) for further details.

gquota/grpquota/gqnoenforce
       Group disk quota accounting enabled and limits (optionally) enforced.  Refer to xfs_quota(8) for further details.

pquota/prjquota/pqnoenforce
       Project disk quota accounting enabled and limits (optionally) enforced.  Refer to xfs_quota(8) for further details.
```

docker的overlay2需要的是`pquota`，在`/etc/fstab`中设置：

```bash
/dev/vdb /data xfs rw,pquota 0 0
```

将`/dev/vdb`卸载后重新挂载:

```bash
umount /dev/vdb
mount -a
```

可以在`/proc/mounts`中看到已经被挂载的目录和参数：

```bash
$ cat /proc/mounts  |grep vdb
/dev/vdb /data xfs rw,relatime,attr2,inode64,prjquota 0 0
```

## 配置docker daemon

`/etc/docker/daemon.json`配置文件如下，这里将每个容器可以使用的磁盘空间设置为1G：

```json
{
    "data-root": "/data/docker",
    "storage-driver": "overlay2",
    "storage-opts": [
      "overlay2.override_kernel_check=true",
      "overlay2.size=1G"
    ]
}
```

## 写入文件测试

重启docker后，启动一个容器，在容器中创建文件。

先创建一个1000M的文件：

```bash
/ # dd if=/dev/zero of=/a bs=100M count=10
10+0 records in
10+0 records out
```

然后创建第二个1000M的文件：

```bash
/ # dd if=/dev/zero of=/b bs=100M count=10
dd: writing '/b': No space left on device
2+0 records in
0+1 records out
```

可以看到第二个1000M文件因为空间不足创建失败，并且只写入了24M：

```bash
/ # ls -lh
total 1048572
-rw-r--r--    1 root     root     1000.0M Dec 26 03:38 a
-rw-r--r--    1 root     root       24.0M Dec 26 03:38 b
```

## 参考

1. [docker daemon配置项][1]
2. [How to Enable Disk Quotas on an XFS File System][2]

[1]: https://docs.docker.com/engine/reference/commandline/dockerd/#docker-runtime-execution-options "docker daemon cli (dockerd cli)"
[2]: https://www.thegeekdiary.com/how-to-enable-disk-quotas-on-an-xfs-file-system/ "How to Enable Disk Quotas on an XFS File System"
