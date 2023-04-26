---
layout: default
title: "docker 深入: storage driver 与容器的可用存储空间限制"
author: 李佶澳
createdate: 2017/07/17 13:34:40
last_modified_at: 2017/07/24 14:28:30
categories: 项目
tags: docker
keywords: docker,storage,btrfs,zfs,overlayfs,devicepmapper
description: 选择一个合适的存储，是docker的稳定运行的重要前提。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

docker 文档 [Select a storage driver][1] 中推荐按照下面的顺序选择 storage driver:

	aufs
	btrfs,zfs
	overlay2
	overlay
	devicemapper

docker还支持vfs，也就是直接存文件。各种 storage driver 的特点如下：

	Name           Type        Storage-opt 
	-----------------------------------------
	aufs           基于文件     不支持         
	btrfs          基于块       支持           
	zfs            基于块       支持           
	overlay2       基于文件     基于 XFS 时支持  
	overlay        基于文件     不支持         
	devicemapper   基于块       支持           

--storage-opt 是 `docker run` 时的参数，支持设定容器的根文件系统的大小，注意和 docker daemon 的[storage-driver-options][7] 参数区分。

	docker run -it --storage-opt size=120G fedora /bin/bash

[docker run][8] 中提示：

	This (size) will allow to set the container rootfs size to 120G at creation time.
	This option is only available for the devicemapper, btrfs, overlay2, windowsfilter
	and zfs graph drivers. For the devicemapper, btrfs, windowsfilter and zfs graph 
	drivers, user cannot pass a size less than the Default BaseFS Size. For the overlay2 
	storage driver, the size option is only available if the backing fs is xfs and 
	mounted with the pquota mount option. Under these conditions, user can pass any size
	less then the backing fs size.


## 各种 storage driver 的配置方法

### docker 版本更新

卸载已有的 docker 并清理残余文件:

```sh
systemctl stop docker 
for i in `rpm -qa |grep docker`;do yum erase $i;done
rm -rf /var/lib/docker
```

如果是 device mapper，重建lvs:

```sh
lvremove /dev/mapper/docker-thinpool
lvcreate -T -L 95g -n thinpool docker
```

从 [docker download](https://download.docker.com/linux/centos/7/x86_64/stable/Packages/) 中下载最新的 rpm，安装最新的 docker:

```sh
yum install -y ./XXX.rpm
```

docker 的配置核实无错后启动:

```sh
systemctl start docker
chkconfig docker on
```

### device mapper 

创建一个名为 docker 的 vg、一个名为 thinpool 的 thin。

```sh
pvcreate /dev/vdc1
vgcreate docker /dev/vdc1
lvcreate -T -L 95g -n thinpool docker
```

在 /etc/docker/daemon.json 中配置 storage-driver 和 storage-opts：

```json
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
```

### overlayfs

升级内核:

```sh
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org
rpm -Uvh http://www.elrepo.org/elrepo-release-7.0-2.el7.elrepo.noarch.rpm 
yum -y --enablerepo=elrepo-kernel install kernel-ml
```

修改 /etc/default/grub:

	GRUB_DEFAULT=0

执行命令更新 grub2 配置:

	grub2-mkconfig -o /boot/grub2/grub.cfg

格式化并挂载用于 docker 的磁盘，格式化时必须指定 ftype=1，挂载时必须使用 pquota：

```sh
pvcreate /dev/vdc1
vgcreate docker /dev/vdc1
lvcreate -L 95g -n graph docker
mkfs.xfs -f -n ftype=1 /dev/mapper/docker-graph
mount -o pquota /dev/mapper/docker-graph /var/lib/docker/
```

在 /etc/fstab 中添加配置，保证开机时自动挂载:

```sh
/dev/mapper/docker-graph /var/lib/docker/ xfs defaults,pquota 1 1
```

编辑 /etc/docker/daemon.json，指定 storage-driver 和 storage-opts。在CentOS上使用 overlay2，必须添加 opts  "overlay2.override_kernel_check=true"：

```json
{
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ]
}
```

[docker overlayfs][11] 会改变两个系统调用的行为，如果应用用到这两个系统调用需要注意：

open(2): 同一个文件修改之后的再次 open 得到文件句柄指向的是另一个文件。下面的 fd1和fd2将指向两个不同的文件，fd1指定的 lower layer 中的foo 文件，fd2 指向的复制到 upperdir 中的 foo 文件。

	fd1=open("foo", O_RDONLY)    //修改foo之前
	fd2=open("foo", O_RDONLY)    //修改foo之后

rename(2): overlayfs 不支持 rename 系统调用。

### btrfs

[docker btrfs][10] 中建议在 ubuntu 和 debian 上使用 btrfs:

	Docker CE: For Docker CE, btrfs is only recommended on Ubuntu or Debian.
	Docker EE: For Docker EE and CS-Engine, btrfs is only supported on SLES. 

## storage-driver 对比

测试机器如下：

```sh
Node            OS                 Kernel         Docker     Driver     
-----------------------------------------------------------------------
10.39.0.114     CentOS7.2.1511     3.10.0         1.12.6     device mapper
10.39.0.115     CentOS7.2.1511     3.10.0         17.06      device mapper
10.39.0.137     CentOS7.2.1511     4.12.2         17.06      overlay2
```

### 容器根分区显示可用容量：默认

```sh
docker run --name=test-default -idt  harbor.enncloud.cn/lijiaob/sshproxy:master
docker exec -it test-default /bin/sh
df
```

```sh
Node           Result 
---------------------------------------------
10.39.0.114(device mapper)    dockerd 配置的默认大小，10G
10.39.0.115(device mapper)    dockerd 配置的默认大小，10G
10.39.0.137(overlay2)         /var/lib/docker中剩余可用空间
```

### 容器根分区显示可用容量：--storage-opt size=0M 

```sh
docker run --name=test-default -idt --storage-opt size=0M  harbor.enncloud.cn/lijiaob/sshproxy:master
docker exec -it test-default /bin/sh
df
```

```sh
Node           Result 
---------------------------------------------
10.39.0.114(device mapper)    dockerd 配置的默认大小，10G
10.39.0.115(device mapper)    dockerd 配置的默认大小，10G
10.39.0.137(overlay2)         /var/lib/docker中剩余可用空间
```

### 容器根分区显示可用容量：--storage-opt size=1M

```sh
docker run --name=test-default -idt --storage-opt size=1M  harbor.enncloud.cn/lijiaob/sshproxy:master
docker exec -it test-default /bin/sh
df
```

```sh
Node           Result 
---------------------------------------------
10.39.0.114(device mapper)     创建失败，不能小于dockerd指定的默认大小
10.39.0.115(device mapper)     创建失败，不能小于dockerd指定的默认大小
10.39.0.137(overlay2)          1M
```

### 容器根分区指定 size 超出 node 存储空间：--storage-opt size=200G

```sh
docker run --name=test-default -idt --storage-opt size=200G  harbor.enncloud.cn/lijiaob/sshproxy:master
docker exec -it test-default /bin/sh
df
dd if=/dev/zero of=/test.dat bs=1G count=200
```

```sh
Node           Result    
---------------------------------------------
10.39.0.114(device mapper)   显示可用200G，dd命令写满真实可用空间后，卡住
10.39.0.115(device mapper)   显示可用200G，dd命令写满真实可用空间后，卡住
10.39.0.137(overlay2)        现实/var/lib/docker中剩余可用空间，dd命令写满后退出
```

### 容器根分区指定 size 累计超出 node 的存储空间

```sh
docker run --name=test-default-1 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
docker run --name=test-default-2 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
docker run --name=test-default-3 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
docker run --name=test-default-4 -idt --storage-opt size=50G  harbor.enncloud.cn/lijiaob/sshproxy:master
```

```sh
Node           Result    
---------------------------------------------
10.39.0.114(device mapper)    创建成功，均显示设置的可用空间
10.39.0.115(device mapper)    创建成功，均显示设置的可用空间
10.39.0.137(overlay2)         创建成功，均显示设置的可用空间
```

容器执行执行真实写入：

```sh
docker exec -idt test-default-1 bash -c "sleep 10; dd if=/dev/zero of=/test.dat bs=1G count=40"
docker exec -idt test-default-2 bash -c "sleep 10; dd if=/dev/zero of=/test.dat bs=1G count=40"
docker exec -idt test-default-3 bash -c "sleep 10; dd if=/dev/zero of=/test.dat bs=1G count=40"
docker exec -idt test-default-4 bash -c "sleep 10; dd if=/dev/zero of=/test.dat bs=1G count=40"

docker exec -it test-default-1 ls -lh /test.dat
docker exec -it test-default-2 ls -lh /test.dat
docker exec -it test-default-3 ls -lh /test.dat
docker exec -it test-default-4 ls -lh /test.dat
```

```sh
Node           Result    
---------------------------------------------
10.39.0.114(device mapper)   状态异常，node 空间接近饱和后，容器内的写入几乎不再增长，响应迟钝，docker 重启失败
10.39.0.115(device mapper)   状态异常，node 空间接近饱和后，容器内的写入几乎不再增长，响应迟钝，docker 重启卡住
10.39.0.137(overlay2)        node 空间写满后，每个容器显示还有空余空间，但无法再写入
```

### node 存储空间不足时，继续创建容器

```sh
docker run --name=test-default -idt --storage-opt size=15G  harbor.enncloud.cn/lijiaob/sshproxy:master
```

```sh
Node           Result    
---------------------------------------------
10.39.0.114(device mapper)   创建失败，提示空间不足
10.39.0.115(device mapper)   创建失败，提示空间不足
10.39.0.137(overlay2)        可以创建，显示设置的可用空间，但实际无法继续写入
```

### 容器根分区写满：--storage-opt  size=11G, 写入超过11G

```sh
docker run --name=test-default -idt --storage-opt size=11G  harbor.enncloud.cn/lijiaob/sshproxy:master
docker exec -it test-default /bin/sh
df
dd if=/dev/zero of=/test.dat bs=1G count=200
```

```sh
Node           Result    
---------------------------------------------
10.39.0.114(device mapper)     超过11G后，dd程序退出
10.39.0.115(device mapper)     超过11G后，dd程序退出
10.39.0.137(overlay2)          超过11G后，dd程序退出
```

## 总结

* 指定容器的 size 为 0 时，devicemapper 默认限定为 basesize，overlay2 默认使用所有可用空间
* docker 不会检查单个容器声明的存储空间大小是否超过可用空间
* docker 不会检查多个容器累计声明的存储空间大小是否超过可用空间

device mapper:

	优势:  可以在容器的配置文件中指定每个容器的默认的大小
	       以块设备的形式挂载到容器中，遵循 posix 协议
	劣势:  容器大小不能小于默认的大小
	       node 的实际存储空间接近 100% 时，docker 不能正常工作
	       kernel 日志中经常出现 device mapper 的 thin 删除失败日志
	       node 上的存储耗尽时，容器内的程序感知不到，会卡住

overlay2:

	优势:  在存储空间 100% 的情况下，docker 仍能很好的运行
	劣势:  必须明确指定容器的大小，否则就默认使用所有可用空间
	       以文件merge的方式的提供，不严格遵守posix中的read()定义，不支持posix中定义的rename()
	       kubernetes 不支持指定容器的大小，需要修改 kubelet 或者修改 docker

## 参考

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
