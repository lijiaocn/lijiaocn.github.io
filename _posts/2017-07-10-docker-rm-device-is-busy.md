---
layout: default
title: docker unable to remove filesystem for 526c82...
author: lijiaocn
createdate: 2017/07/10 15:43:46
changedate: 2017/07/11 09:44:06
categories: 问题
tags: docker
keywords: docker,删除容器,失败,device
description: Unable to remove filesystem for 526c82...shm: device or resource busy

---

## 现象

os:

	CentOS Linux release 7.2.1511 (Core)

docker版本v1.12.6:

	Jul 05 14:34:18 slave-66 dockerd[22214]: time="2017-07-05T14:34:18.546759617+08:00" 
	level=error msg="Handler for DELETE /containers/526c823031c2065c6fb3b92f9aaded4477eccceb65f245391a1d8a6acae13d0e
	returned error: Unable to remove filesystem for 526c823031c2065c6fb3b92f9aaded4477eccceb65f245391a1d8a6acae13d0e:
	remove /var/lib/docker/containers/526c823031c2065c6fb3b92f9aaded4477eccceb65f245391
	a1d8a6acae13d0e/shm: device or resource busy"

同时dmesg中频繁报错:

	[449954.516381] device-mapper: thin: Deletion of thin device 86 failed.
	[449984.512225] device-mapper: thin: Deletion of thin device 86 failed.
	[449987.602973] device-mapper: thin: Deletion of thin device 86 failed.
	[450014.512324] device-mapper: thin: Deletion of thin device 86 failed.
	[450044.512331] device-mapper: thin: Deletion of thin device 86 failed.
	[450047.683927] device-mapper: thin: Deletion of thin device 86 failed.
	[450074.512932] device-mapper: thin: Deletion of thin device 86 failed.
	[450104.512541] device-mapper: thin: Deletion of thin device 86 failed.

## 解决

在[github issue 27381][1]中深入讨论了该问题。

执行下面的命令，找到了还在挂载着目录的进程:

	$find /proc/*/mounts | xargs grep -E "526c823"
	/proc/27837/mounts:shm /var/lib/docker/containers/526c823031c2065c6fb3b92f9aaded4477eccceb65f245391a1d8a6acae13d0e/shm tmpfs rw,nosuid,nodev,noexec,relatime,size=65536k 0 0
	
	$ps aux|grep 27837
	root     27837  0.0  0.3  81496 49704 ?        Ssl  Jul05   5:24 /assist --v=6

或者直接使用脚本：

	$wget https://raw.githubusercontent.com/rhvgoyal/misc/master/find-busy-mnt.sh
	$bash ./find-busy-mnt.sh 526c823031c2065c6fb3b92f9aaded4477eccceb65f245391a1d8a6acae13d0e
	PID      NAME          MNTNS
	27837    assist        mnt:[4026532570]

dockerd的mount ns:
	
	$ls /proc/22214/ns/mnt  -l
	lrwxrwxrwx 1 root root 0 Jul 10 16:07 /proc/22214/ns/mnt -> mnt:[4026531840]

从[github issue 27381][1]的讨论中可以得知，容器的mount ns存在泄漏。

容器已经被删除，但是shm在另一个mount ns中仍然被挂载，导致dockerd无法将其删除。

针对这种情况，一种解决方法是，在docker.service中设置MountFlags, 添加一行:

	MountFlags=slave

这样之后dockerd会独自占用一个mount ns，而不会共用host的mount ns，但这样会导致无法使用`--live-restore`特性。

[The RHEL docker package does not currently support --live-restore][2]中做了解释。

目前(2017-07-10 18:42)要么忍受无法删除的情况出现，要么就牺牲docker的一些特性。

否则要么等修复了跨mount ns挂载问题的centos7.4，或者mount ns泄漏的原因被查明并得到修复。

## 参考

1. [github issue 27381][1]
2. [The RHEL docker package does not currently support --live-restore][2]

[1]: https://github.com/moby/moby/issues/27381  "github issue 27381" 
[2]: https://access.redhat.com/articles/2938171 "The RHEL docker package does not currently support --live-restore"
