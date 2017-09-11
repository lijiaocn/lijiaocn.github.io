---
layout: default
title: Glusterfs的架构
author: lijiaocn
createdate: 2017/05/27 10:20:13
changedate: 2017/09/11 16:21:39
categories: 项目
tags: glusterfs 存储
keywords: glusterfs，架构
description: glusterfs是redhat支持、维护的分布式存储系统。

---

* auto-gen TOC:
{:toc}

## overall 

GlusterFS的所有node都是同质的，每个node上都部署了一个glusterfs server。

	yum install glusterfs-server

每个node上可以有多个目录作为brick，为了管理使用方便，node可以约定brick的父目录使用相同的名字。

	mkfs.xfs -i size=512 /dev/sdb1
	mkdir -p /data/brick1
	echo '/dev/sdb1 /data/brick1 xfs defaults 1 2' >> /etc/fstab
	mount -a && mount

brick就是node上的一个目录，创建volumn的时候可以直接指定由哪个server上的哪个brick组成，譬如:

	gluster volume create gv0 replica 2 server1:/data/brick1/gv0 server2:/data/brick1/gv0

server1和server2的/data/brick1目录下都会创建gv0目录，里面存放gv0中的数据。

node启动后需要加入到TSP(Trusted Server Pool)中以后，才可以使用。

	#注意如果使用hostname访问主机名，那么第一个node需要在另一个node上添加到TSP。
	#其它node可以在第一个node上一次性添加完成。
	 gluster peer probe server1   
	 gluster peer probe server2
	 gluster peer probe server3

client挂载volume时，地址可以是volume使用的任意一个node的地址：

	#mount.glusterfs `<IP or hostname>`:`<volume_name>` `<mount_point>
	mount -t glusterfs server1:/gv0 /mnt

node上会为每个brick启动一个进程来维护brick，并在/var/lib/glusterd/vols目录中生成每个brick的配置文件以及client端进程需要的配置文件。

client端的操作请求通过VFS转到FUSE模块，最后经由多个translators转发到对应的node。

![architecture](https://cloud.githubusercontent.com/assets/10970993/7412664/a9aaaece-ef62-11e4-8c87-75d8e7157739.png)

## 参考

1. [overall-working-of-glusterfs][1]
2. [glusterfs-quickstart][2]
3. [glusterfs github][3]

[1]: http://gluster.readthedocs.io/en/latest/Quick-Start-Guide/Architecture/#overall-working-of-glusterfs  "overall-working-of-glusterfs" 
[2]: http://gluster.readthedocs.io/en/latest/Quick-Start-Guide/Quickstart/ "glusterfs-quickstart"
[3]: https://github.com/gluster "gluster github"
