---
layout: default
title: docker的storage类型
author: 李佶澳
createdate: 2017/07/17 13:34:40
changedate: 2017/07/24 14:28:30
categories: 项目
tags: docker
keywords: docker,storage,btrfs,zfs,overlayfs,devicepmapper
description: 选择一个合适的存储，是docker的稳定运行的重要前提。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

docker的文档[Select a storage driver][1]中推荐按照下面的顺序选择storage driver:

	aufs
	btrfs,zfs
	overlay2
	overlay
	devicemapper
	
	docker还支持vfs，也就是直接存文件

storage driver的特点如下：

	Name           Type        Storage-opt 
	-----------------------------------------
	aufs           基于文件     不支持         
	btrfs          基于块       支持           
	zfs            基于块       支持           
	overlay2       基于文件     基于XFS时支持  
	overlay        基于文件     不支持         
	devicemapper   基于块       支持           

--storage-opt是`docker run`时可以使用的参数，可以指定容器的根文件系统的大小:

	docker run -it --storage-opt size=120G fedora /bin/bash

[docker run][8]中提示：

	This (size) will allow to set the container rootfs size to 120G at creation time.
	This option is only available for the devicemapper, btrfs, overlay2, windowsfilter
	and zfs graph drivers. For the devicemapper, btrfs, windowsfilter and zfs graph 
	drivers, user cannot pass a size less than the Default BaseFS Size. For the overlay2 
	storage driver, the size option is only available if the backing fs is xfs and 
	mounted with the pquota mount option. Under these conditions, user can pass any size
	less then the backing fs size.

不同于docker daemon中的[storage-driver-options][7]。

## 测试结果

注意事项:

	指定容器的size为0时，使用默认的大小，oveerlay2默认使用所有可用空间
	docker不会检查单个容器的大小是否超过可用空间
	docker不会检查多个容器的累计大小是否超过可用空间

device mapper:

	优势:  可以在容器的配置文件中指定每个容器的默认的大小
	       以块设备的形式挂载到容器中，遵循posix协议
	劣势:  容器大小不能小于默认的大小
	       node的用于容器的的空间接近100%时，两个版本的docker都不能正常工作
	       kernel日志中经常出现device mapper的thin删除失败日志
	       node上的存储耗尽时，容器内的程序感知不到，卡住

overlay2:

	优势:  在边界情况下，docker仍能很好的运行
	劣势:  必须明确指定容器的大小，否则就默认使用所有可用空间
	       以文件merge的方式的提供，不严格遵守posix中的read()定义，不支持posix中定义的rename()
	       kubernetes不支持指定容器的大小，需要修改kubelet或者修改docker

## 测试环境

	Node            OS                 Kernel         Docker     Driver     
	-----------------------------------------------------------------------
	10.39.0.111     CentOS7.2.1511     3.10.0         1.12.6     device mapper
	10.39.0.114     CentOS7.2.1511     3.10.0         1.12.6     device mapper
	10.39.0.115     CentOS7.2.1511     3.10.0         17.06      device mapper
	10.39.0.116     CentOS7.2.1511     3.10.0         1.12.6     device mapper
	10.39.0.117     CentOS7.2.1511     3.10.0         1.12.6     device mapper
	10.39.0.136     CentOS7.2.1511     3.10.0         1.12.6     device mapper
	10.39.0.137     CentOS7.2.1511     4.12.2         17.06      overlay2
	10.39.0.138     CentOS7.2.1511     4.12.2         17.06      overlay2

## 开发环境

	Node            OS                 Kernel         Docker     Driver     
	-----------------------------------------------------------------------
	10.39.0.107    CentOS7.2.1511      3.10.0         1.12.6     device mapper
	10.39.0.108    CentOS7.2.1511      3.10.0         1.12.6     device mapper
	10.39.0.109    CentOS7.2.1511      3.10.0         17.06      device mapper    
	10.39.0.110    CentOS7.2.1511      3.10.0         17.06      device mapper
	10.39.0.112    CentOS7.2.1511      4.12.2         17.06      overlay2
	10.39.0.140    CentOS7.2.1511      4.12.2         17.06      overlay2

### 节点更新前下线过程

1. 在管理员页面上，将要更新的节点关闭调度。

2. 排空node:

	kubectl drain 节点名称
	
	DaemonSet-mananged pod: --ignore-daemonsets
	pods with local data:   --delete-local-data

3. 核实、删除剩余的pod:

	kubectl get pod --all-namespaces -o wide 2>/dev/null |grep 节点名称 |awk '{print "kubectl -n "$1" delete pod "$2}' >/tmp/delete.sh;bash /tmp/delete.sh; rm /tmp/delete.sh

4. 在管理员界面上，删除节点。

### docker update

从[docker download](https://download.docker.com/linux/centos/7/x86_64/stable/Packages/)中下载最新的rpm。

根据实际情况选择卸载/更新已有的docker，并清理残余文件。

卸载:

	systemctl stop docker 
	for i in `rpm -qa |grep docker`;do yum erase $i;done
	rm -rf /var/lib/docker

如果是device mapper，重建lvs:

	lvremove /dev/mapper/docker-thinpool
	lvcreate -T -L 95g -n thinpool docker

安装:

	yum install -y ./XXX.rpm

docker的配置核实无错后:

	systemctl start docker
	chkconfig docker on

在管理员界面上重新添加主机节点。
                   
### device mapper 

创建一个名为docker的VG，在创建一个名为thinpool的thin。

	pvcreate /dev/vdc1
	vgcreate docker /dev/vdc1
	lvcreate -T -L 95g -n thinpool docker

在/etc/docker/daemon.json中：

	{
	  "hosts": ["unix:///var/run/docker.sock"],
	  "storage-driver": "devicemapper",
	  "storage-opts": ["dm.basesize=10G",
	     "dm.thinpooldev=/dev/mapper/docker-thinpool",
	     "dm.use_deferred_removal=true",
	     "dm.use_deferred_deletion=true"
	],
	  "log-driver": "json-file",
	  "log-opts": {
	    "max-size": "20m",
	    "max-file": "10"
	  }
	}

### btrfs

[docker btrfs][10]推荐在ubuntu和debian上使用btrfs:

	Docker CE: For Docker CE, btrfs is only recommended on Ubuntu or Debian.
	Docker EE: For Docker EE and CS-Engine, btrfs is only supported on SLES. 

### overlayfs

升级内核:

	rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
	rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm 
	yum -y --enablerepo=elrepo-kernel install kernel-ml

修改/etc/default/grub:

	GRUB_DEFAULT=0

更新grub2配置:

	grub2-mkconfig -o /boot/grub2/grub.cfg

准备docker运行使用的磁盘:

	pvcreate /dev/vdc1
	vgcreate docker /dev/vdc1
	lvcreate -L 95g -n graph docker
	mkfs.xfs -f -n ftype=1 /dev/mapper/docker-graph
	mount -o pquota /dev/mapper/docker-graph /var/lib/docker/

注意格式化时必须指定ftype=1，挂载时必须使用pquota。

在/etc/fstab中添加:

	/dev/mapper/docker-graph /var/lib/docker/ xfs defaults,pquota 1 1

在/etc/sysctl.conf中添加:

	net.bridge.bridge-nf-call-ip6tables = 1
	net.bridge.bridge-nf-call-iptables = 1
	net.bridge.bridge-nf-call-arptables = 1

编辑/etc/docker/daemon.json:

	{
	  "storage-driver": "overlay2",
	  "storage-opts": [
	    "overlay2.override_kernel_check=true"
	  ]
	}

在CentOS上使用overlay2，必须添加opts:

	    "overlay2.override_kernel_check=true"

[docker overlayfs][11]影响了两个系统调用，在部署一些会用到这两个系统调用的应用时需要特别小心:

open(2):

	fd1=open("foo", O_RDONLY)    //修改foo之前
	fd2=open("foo", O_RDONLY)    //修改foo之后
	
	fd1和fd2将指向两个不同的文件。
	fd1指定的lower layer中的foo文件，fd2指向的复制到upperdir中的foo文件。

rename(2):

	overlayfs不支持rename系统调用。

## 条件测试

### 不指定容器根分区大小，查看容器的根分区可用空间

	docker run --name=test-default -idt  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker exec -it test-default /bin/sh
	df
	
	Node           Result 
	---------------------------------------------
	10.39.0.114    dockerd配置的默认大小10G
	10.39.0.115    dockerd配置的默认大小10G
	10.39.0.137    /var/lib/docker中剩余可用空间

### --storage-opt size=0M

	docker run --name=test-default -idt --storage-opt size=0M  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker exec -it test-default /bin/sh
	df
	
	Node           Result 
	---------------------------------------------
	10.39.0.114    dockerd配置的默认大小10G
	10.39.0.115    dockerd配置的默认大小10G
	10.39.0.137    /var/lib/docker中剩余可用空间

### --storage-opt size=1M

	docker run --name=test-default -idt --storage-opt size=1M  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker exec -it test-default /bin/sh
	df
	
	Node           Result 
	---------------------------------------------
	10.39.0.114    创建失败，不能小于dockerd指定的默认大小
	10.39.0.115    创建失败，不能小于dockerd指定的默认大小
	10.39.0.137    1M

### --storage-opt  size=11G, 写入超过11G

	docker run --name=test-default -idt --storage-opt size=11G  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker exec -it test-default /bin/sh
	df
	dd if=/dev/zero of=/test.dat bs=1G count=200

	Node           Result    
	---------------------------------------------
	10.39.0.114    超过11G后，dd程序退出
	10.39.0.115    超过11G后，dd程序退出
	10.39.0.137    超过11G后，dd程序退出

### --storage-opt  size=200G, 写入超过node的存储空间

	docker run --name=test-default -idt --storage-opt size=200G  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker exec -it test-default /bin/sh
	df
	dd if=/dev/zero of=/test.dat bs=1G count=200
	
	Node           Result    
	---------------------------------------------
	10.39.0.114    显示可用200G，dd命令写满真实可用空间后，卡住
	10.39.0.115    显示可用200G，dd命令写满真实可用空间后，卡住
	10.39.0.137    /var/lib/docker中剩余可用空间，dd命令写满空间后退出

### 实际存储空间写满时，继续创建容器

	docker run --name=test-default -idt --storage-opt size=15G  harbor.enncloud.cn/lijiaob/sshproxy:master
	
	Node           Result    
	---------------------------------------------
	10.39.0.114    创建失败，提示空间不足
	10.39.0.115    创建失败，提示空间不足
	10.39.0.137    可以创建，显示设置的可用空间，但实际无法继续写入

### 多个容器的根分区设置的Size累加超过node的存储空间，实际占用空间不超过node存储空间

	docker run --name=test-default-1 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker run --name=test-default-2 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker run --name=test-default-3 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker run --name=test-default-4 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
	
	Node           Result    
	---------------------------------------------
	10.39.0.114    创建成功，均显示设置的可用空间
	10.39.0.115    创建成功，均显示设置的可用空间
	10.39.0.137    创建成功，均显示设置的可用空间

### 多个容器的根分区设置的Size累加超过node的存储空间，多个容器均写入自身的根分区

	docker run --name=test-default-1 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker run --name=test-default-2 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker run --name=test-default-3 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
	docker run --name=test-default-4 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master

	docker exec -idt test-default-1 bash -c "sleep 10; dd if=/dev/zero of=/test.dat bs=1G count=40"
	docker exec -idt test-default-2 bash -c "sleep 10; dd if=/dev/zero of=/test.dat bs=1G count=40"
	docker exec -idt test-default-3 bash -c "sleep 10; dd if=/dev/zero of=/test.dat bs=1G count=40"
	docker exec -idt test-default-4 bash -c "sleep 10; dd if=/dev/zero of=/test.dat bs=1G count=40"
	
	docker exec -it test-default-1 ls -lh /test.dat
	docker exec -it test-default-2 ls -lh /test.dat
	docker exec -it test-default-3 ls -lh /test.dat
	docker exec -it test-default-4 ls -lh /test.dat
	
	Node           Result    
	---------------------------------------------
	10.39.0.114    状态异常，node空间接近饱和后，容器内的写入几乎不再增长，响应迟钝，docker重启失败
	10.39.0.115    状态异常，node空间接近饱和后，容器内的写入几乎不再增长，响应迟钝，docker重启卡住
	10.39.0.137    node空间写满后，每个容器显示还有空余空间，但无法再写入

## 稳定性测试

在控制台上创建下面的应用，观察运行情况。

### Pod频繁失败、重启

	panic-k3-1-12-6-dm
	panic-k3-17-06-dm
	panic-k4-17-06-lay2

### Pod持续申请内存直到OOM

容器内存设置为500MB，持续申请，每次申请5MB。

	oom-k3-1-12-6-dm      
	oom-k3-17-06-dm
	oom-k4-17-06-lay2

### Pod持续的写入根分区

	disk-k3-1-12-6-dm      写满容器的根分区后停止
	disk-k3-17-06-dm       写满容器的根分区后停止
	disk-k4-17-06-lay2     写满Node的存储空间后停止

# 参考

1. [Select a storage driver][1]
2. [Docker存储驱动之OverlayFS简介][2]
3. [Docker存储方式选型建议][3]
4. [btrfs][4]
5. [zfs][5]
6. [overlayfs][6]
7. [storage-driver-options][7]
8. [docker run][8]
9. [docker device mapper][9]
10. [docker btrfs][10]
11. [docker overlayfs][11]
12. [centos 7 yum 方式升级内核][12]

[1]: https://docs.docker.com/engine/userguide/storagedriver/selectadriver/ "Select a storage driver"
[2]: http://www.cnblogs.com/styshoo/p/6503953.html "Docker存储驱动之OverlayFS简介"
[3]: https://segmentfault.com/a/1190000007168476 "Docker存储方式选型建议"
[4]: https://www.kernel.org/doc/Documentation/filesystems/btrfs.txt  "btrfs"
[5]: http://zfsonlinux.org/  "zfs"
[6]: https://www.kernel.org/doc/Documentation/filesystems/overlayfs.txt  "overlayfs" 
[7]: https://docs.docker.com/engine/reference/commandline/dockerd/#storage-driver-options  "storage-driver-options"
[8]: https://docs.docker.com/edge/engine/reference/commandline/run/ "docker run"
[9]: https://docs.docker.com/engine/userguide/storagedriver/device-mapper-driver/ "docker device mapper"
[10]: https://docs.docker.com/engine/userguide/storagedriver/btrfs-driver/ "docker btrfs"
[11]: https://docs.docker.com/engine/userguide/storagedriver/overlayfs-driver/ "docker overlayfs"
[12]: https://mp.weixin.qq.com/s?__biz=MzAwMTY4ODA5NA==&mid=2247483689&idx=1&sn=0df56a527b89c3cf85d12c1f64ccc689&chksm=9ad49658ada31f4e620610e36c2e2792ea9dd342cc1ae25600e0e9d7f4ff848c69e22d156e44&mpshare=1&scene=1&srcid=0718hcCFxhVmXkGhA1t75UYy&key=e57780a9dd53e6fc79c3e62e07f97037a0dd895f61aae470a3d8d138e256f13dabe9c15cac84b1f8f99ae35f912910b5f20fd9e04305c069d3e7b3379403a00a084499bc052137a86ddb7de1a44eac9f&ascene=0&uin=MjcxNTQ5MTM0MA%3D%3D&devicetype=iMac+MacBookPro11%2C5+OSX+OSX+10.11.6+build(15G1510)&version=12020810&nettype=WIFI&fontScale=100&pass_ticket=UneAzrJ%2BHX23EF5RsVvv2cJOrgYH9bbbI%2BWiyyOsM2StQqNX%2BiQoTg5%2BzJKP9Zht "centos 7 yum 方式升级内核"
