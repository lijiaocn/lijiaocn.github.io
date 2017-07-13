---
layout: default
title: k8s,rbd image is locked by other nodes
author: lijiaocn
createdate: 2017/07/13 15:03:27
changedate: 2017/07/13 15:53:09
categories: 问题
tags: k8s
keywords: k8s,rbd,ceph,locked
description: k8s中rbd image is locked by other nodes的问题排查

---

* auto-gen TOC:
{:toc}

## 现象 

	Events:
	FirstSeen  LastSeen   Count  From   SubobjectPath  Type     Reason          Message
	---------  --------   -----  ----   -------------  ------   ------          -------
	4h        1m        118    {kubelet slave-65}     Warning    FailedMount    Unable to mount volumes for pod "mi-es-pro-0_enngastest(3f56a3ee-676d-11e7-ad0b-5254171bf8db)": 
	                                                                            timeout expired waiting for volumes to attach/mount for pod "mi-es-pro-0"/"enngastest".
	                                                                            list of unattached/unmounted volumes=[datadir]
	4h        1m        118    {kubelet slave-65}     Warning    FailedSync     Error syncing pod, skipping: timeout expired waiting for volumes to attach/mount for 
	                                                                            pod "mi-es-pro-0"/"enngastest". list of unattached/unmounted volumes=[datadir]
	4h        26s        39    {kubelet slave-65}     Warning    FailedMount    MountVolume.SetUp failed for volume "kubernetes.io/rbd/3f56a3ee-676d-11e7-ad0b-5254171bf8db-enngastest.
	                                                                            datadir-mi-es-pro-1" (spec.Name: "enngastest.datadir-mi-es-pro-1") pod "3f56a3ee-676d-11e7-ad0b-5254171bf
	                                                                            8db" (UID: "3f56a3ee-676d-11e7-ad0b-5254171bf8db") with: 
	                                                                            rbd: image enngastest.CID-516874818ed4.datadir-mi-es-pro-1 is locked by other nodes

Message中提到enngastest.CID-516874818ed4.datadir-mi-es-pro-1已经被其它节点锁住了。

## 解决

登录到node上，用rbd查看:

	rbd -p [pool名称] status enngastest.CID-516874818ed4.datadir-mi-es-pro-1

找到锁住该image的node，然后登陆，通过showmapped找到image对应的设备文件:

	rbd showmapped

直接进行unmap:

	rbd unmap 找到的设备文件

如果unmap失败，提示`is busy`, 使用脚本`leak_rbd.sh`找到占用image的进程:

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
			echo $mnt
		fi
	done
 
可以看到占用了rbd的进程：

	$./leak_rbd.sh  /dev/rbd4
	4683	mnt:[4026531840]		/var/lib/kubelet/pods/d80b2eea-6771-11e7-ad0b-5254171bf8db/volumes/kubernetes.io~rbd/volume-0

找4683的父进程:

	$ps -ef | grep  4683
	root      4683  4658  0 09:21 ?        00:00:00 /bin/bash /run.sh
	root      4721  4683  0 09:21 ?        00:00:00 /opt/td-agent/embedded/bin/ruby /usr/sbin/td-agent -q
	
找4658进程:

	$ps -ef | grep  4658
	root      4658  1947  0 09:21 ?        00:00:00 docker-containerd-shim fd93380abd5c53031658054284343107d5fc4ba9e57b8443345721eb4b61eb05 /var/run/docker/libcontainerd/fd93380abd5c53031658054284343107d5fc4ba9e57b8443345721eb4b61eb05 docker-runc
	root      4683  4658  0 09:21 ?        00:00:00 /bin/bash /run.sh

docker-containerd-shim后面就是容器的id，通过`docker ps |grep fd93380`就可以看到。

将容器重启后，就可以进行成功将rbd image unmap。

## 分析

后来发现，在一个系统容器中将node的/var/lib/kubelet目录以hostpath的方式挂载到了容器中。

参考文献中描述的情况，可能和该问题有关。

## 参考

1. [docker rm device is busy][1]
2. [The RHEL docker package does not currently support --live-restore][2]
3. [github issue 27381][3]

[1]: http://www.lijiaocn.com/2017/07/11/2017-07-10-docker-rm-device-is-busy.html  "docker rm device is busy" 
[2]: https://access.redhat.com/articles/2938171 "The RHEL docker package does not currently support --live-restore"
[3]: https://github.com/moby/moby/issues/27381  "github issue 27381" 
