---
layout: default
title: "docker: unable to remove filesystem for 593d8..."
author: lijiaocn
createdate: 2017/07/14 15:19:14
changedate: 2017/07/14 17:28:36
categories: 问题
tags: docker
keywords: docker,recyle,remove
description: "docker: unable to remove filesystem for 593d8..."

---

* auto-gen TOC:
{:toc}

## 说明

根本原因是在容器B以hostpath的方式将/var/lib/docker和/var/lib/kubelet目录挂载到了容器B中。

容器B在挂载时，容器A在/var/lig/docker和/var/lib/kubelet中挂载的shm和rootf目录也被挂载到了容器B中。

在删除容器A的时候，在当前的mount ns中卸载挂载点，但因为容器B在一个独立的mount ns中依然挂载了目录。

所以删除A的容器文件时失败。

## 现象

在docker的日志中发现大量的删除失败记录:

	Jul 14 15:22:06 slave-97 dockerd: time="2017-07-14T15:22:06.567346680+08:00" level=error msg="Handler for DELETE /containers/593d8a89ee37580673159eb34937654338786d1de8ea6e09cf794f5a4c9f410c returned error: Unable to remove filesystem for 593d8a89ee37580673159eb34937654338786d1de8ea6e09cf794f5a4c9f410c: remove /var/lib/docker/containers/593d8a89ee37580673159eb34937654338786d1de8ea6e09cf794f5a4c9f410c/shm: device or resource busy"
	Jul 14 15:22:06 slave-97 dockerd: time="2017-07-14T15:22:06.569694133+08:00" level=error msg="Handler for DELETE /containers/3a2739cb382df62d46fe8ab9f8955c492838ef65f239d41d6a8dff0f87757b69 returned error: Unable to remove filesystem for 3a2739cb382df62d46fe8ab9f8955c492838ef65f239d41d6a8dff0f87757b69: remove /var/lib/docker/containers/3a2739cb382df62d46fe8ab9f8955c492838ef65f239d41d6a8dff0f87757b69/shm: device or resource busy"
	Jul 14 15:22:06 slave-97 kernel: device-mapper: thin: Deletion of thin device 65 failed.
	Jul 14 15:22:06 slave-97 dockerd: time="2017-07-14T15:22:06.580657644+08:00" level=error msg="Error removing mounted layer c8d3ee5070ba7f5d4963f18b9c6f2d7c719d2e0bb519b11829dbf9d44f2b6904: remove /var/lib/docker/devicemapper/mnt/353abb03acd5a934943ff11ba8f2bacb9c0a342ac86b6586c0cb7f3f1e98ba91: device or resource busy"

删除状态是`Dead`的容器的时候会出现这个问题:

	$docker ps -a |grep Dead |awk '{print $1}' |xargs docker rm
	Error response from daemon: Driver devicemapper failed to remove root filesystem a5144c558eabbe647ee9a25072746935e03bb797f4dcaf44c275e0ea4ada463a: remove /var/lib/docker/devicemapper/mnt/25cb26493fd3c804d96e802a95d6c74d7cae68032bf50fc640f40ffe40cc4188: device or resource busy
	Error response from daemon: Driver devicemapper failed to remove root filesystem bdd60d5104076351611efb4cdb34c50c9d3f2136fdaea74c9752e2df9fd6f40f: remove /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7: device or resource busy
	Error response from daemon: Driver devicemapper failed to remove root filesystem 847b5bb74762a7356457cc331d948e5c47335bbd2e0d9d3847361c6f69e9c369: remove /var/lib/docker/devicemapper/mnt/71e7b20dca8fd9e163c3dfe90a3b31577ee202a03cd1bd5620786ebabdc4e52a: device or resource busy
	Error response from daemon: Driver devicemapper failed to remove root filesystem a85e44dfa07c060244163e19a545c76fd25282f2474faa205d462712866aac51: remove /var/lib/docker/devicemapper/mnt/8bcd524cc8bfb1b36506bf100090c52d7fbbf48ea00b87a53d69f32e537737b7: device or resource busy

## 解决方式

在当前shell中执行:

	for i in `docker ps -a |grep Dead |awk '{print $1}' |xargs docker rm 2>&1 | grep devicemapper | awk '{print $14}'| sed -e "s/://"`;do umount $i;done
	for i in `docker ps -a |grep Dead |awk '{print $1}' |xargs docker rm 2>&1 | grep shm | awk '{print $12}'| sed -e "s/://"`;do umount $i;done

进入dockerd的mnt ns中再执行一次:

	nsenter -t 26500 -m /bin/sh
	for i in `docker ps -a |grep Dead |awk '{print $1}' |xargs docker rm 2>&1 | grep devicemapper | awk '{print $14}'| sed -e "s/://"`;do umount $i;done
	for i in `docker ps -a |grep Dead |awk '{print $1}' |xargs docker rm 2>&1 | grep shm | awk '{print $12}'| sed -e "s/://"`;do umount $i;done

再次rm：

	docker ps -a |grep Dead |awk '{print $1}' |xargs docker rm 

如果依然删除失败，使用`lead_rbd.sh`找到泄漏容器，并将其重启。

## 解决过程1

这里以目录/var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7为例:

查看内容，发现内容是空的，也就是文件已经被删除：

	$ls /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7

目录被挂载:

	df |grep /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7
	/dev/dm-37      10467328    33328  10434000   1% /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7

手动umount:

	umount /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7

有可能在docker-containerd-shim的mount空间中也有挂载，进入它的mount ns再卸载一次:

	# docker-containnerd-shim的进程号是32264
	nsenter -t 32264 -m /bin/sh
	umount /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7

## 解决过程2

删除容器的时候还是失败，可能存在mount泄漏，使用脚本`leak_rbd.sh`调查。

脚本内容:

	#!/bin/bash
	declare -A map
	for i in `find /proc/*/mounts -exec grep $1 {} + 2>/dev/null | awk '{print $1"#"$2}'`
	do
	        pid=`echo $i | awk -F "[/]" '{print $3}'`
	        point=`echo $i | awk -F "[#]" '{print $2}'`
	        mnt=`ls -l /proc/$pid/ns/mnt |awk '{print $11}'`
	        map["$mnt"]="exist"
	        cmd=`cat /proc/$pid/cmdline`
	        echo -e "$pid\t$mnt\t$cmd\t$point"
	done
	
	for i in `ps aux|grep docker-containerd-shim |grep -v "grep" |awk '{print $2}'`
	do
	        mnt=`ls -l /proc/$i/ns/mnt  2>/dev/null | awk '{print $11}'`
	        if [[ "${map[$mnt]}" == "exist" ]];then
	                ps aux |grep $i |grep -v "grep" |awk '{print $11" "$12}'
	        fi
	done

执行:

	$./leak_rbd.sh /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7
	15123  mnt:[4026533029]  /assist--v=6  /var/lib/docker/devicemapper/mnt/d2b5b784495ece1c9365bdea78b95076f035426356e6654c65ee1db87d8c03e7

是另一个容器中占用了mount:

	$ps -ef |grep 15123
	root     15123 15100  0 15:13 ?        00:00:02 /assist --v=6
	root     24682  2425  0 15:40 pts/6    00:00:00 grep 15123
	$ps -ef |grep 15100
	root     15100 26526  0 15:13 ?        00:00:00 docker-containerd-shim 648fcdd4547a2760eb44f8e3d32bd832dd0a48d92ffd0e5fcf23eeca041e861b /var/run/docker/libcontainerd/648fcdd4547a2760eb44f8e3d32bd832dd0a48d92ffd0e5fcf23eeca041e861b docker-runc
	root     15123 15100  0 15:13 ?        00:00:02 /assist --v=6
	root     24990  2425  0 15:40 pts/6    00:00:00 grep 15100

发现是容器648fcdd45，将其重启后，在删除容器，成功。

## 参考

1. [The RHEL docker package does not currently support --live-restore][1]

[1]: https://access.redhat.com/articles/2938171 "The RHEL docker package does not currently support --live-restore"
