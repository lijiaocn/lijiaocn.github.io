---
layout: default
title: lvm的使用
author: 李佶澳
createdate: 2017/07/05 11:30:18
changedate: 2017/09/21 19:28:47
categories: 技巧
tags: linuxtool
keywords: lvm,lvm-how-to
description: LVM是"Logical Volume Management"的简称，[lvm-howto][1]中做了详细介绍。

---

* auto-gen TOC:
{:toc}

## 说明 

LVM是"Logical Volume Management"的简称，[lvm-howto][1]中做了详细介绍。

可以通过命令lvm进行管理。

	$lvm
	lvm> vgs
	  VG         #PV #LV #SN Attr   VSize  VFree
	  VolGroup00   1   2   0 wz--n- 39.50g 320.00m
	  vg11         2   1   0 wz--n-  1.99g   1.50g
	lvm>

## 概念

volume group (VG):

	The Volume Group is the highest level abstraction used within the LVM.
	It gathers together a collection of Logical Volumes and Physical Volumes 
	into one administrative unit.

physical volume (PV):

	A physical volume is typically a hard disk, though it may well just be 
	a device that 'looks' like a hard disk (eg. a software raid device).

logical volume (LV):

	The equivalent of a disk partition in a non-LVM system. The LV is visible 
	as a standard block device; as such the LV can contain a file system (eg. /home).

physical extent (PE):

	Each physical volume is divided chunks of data, known as physical extents, 
	these extents have the same size as the logical extents for the volume group.

logical extent (LE):

	Each logical volume is split into chunks of data, known as logical extents. 
	The extent size is the same for all logical volumes in the volume group.

总之，VG由多个PV组成，每个PV被划分成大小相同的PE。LV在VG中创建，LV包含的同样大小的LE被映射到不同的PE。

	 +-- Volume Group --------------------------------+
	 |                                                |
	 |    +----------------------------------------+  |
	 | PV | PE |  PE | PE | PE | PE | PE | PE | PE |  |
	 |    +----------------------------------------+  |
	 |      .          .          .        .          |
	 |      .          .          .        .          |
	 |    +----------------------------------------+  |
	 | LV | LE |  LE | LE | LE | LE | LE | LE | LE |  |
	 |    +----------------------------------------+  |
	 |            .          .        .         .     |
	 |            .          .        .         .     |
	 |    +----------------------------------------+  |
	 | PV | PE |  PE | PE | PE | PE | PE | PE | PE |  |
	 |    +----------------------------------------+  |
	 |                                                |
	 +------------------------------------------------+

LE到PE之间的映射可以是线性(linear)分布或者条带(striped)分布。

可以对LV做snapshot，并且可以单独操作snapshot，例如在snapshot中写入，不影响origin。

## 创建PV

可以将整个磁盘做成PV:

	$pvcreate /dev/sdb
	Physical volume "/dev/sdb" successfully created.

也可以将磁盘分区做成PV:

	$pvcreate /dev/sdc1
	Physical volume "/dev/sdc1" successfully created.

如果将整个磁盘做成PV，磁盘头块中存储的是LVM的信息，一些操作系统可能不识别。

可以通过创建一个占满整个磁盘的分区，然后将该分区做成PV。

`pvs`可以查看所有的PV:

	 $pvs
	 PV         VG         Fmt  Attr PSize    PFree
	 /dev/sda3  VolGroup00 lvm2 a--    39.50g  320.00m
	 /dev/sdb              lvm2 ---     1.00g    1.00g
	 /dev/sdc1             lvm2 ---  1023.00m 1023.00m

## 创建VG

将已经初始化的PV，添加的VG中:

	$vgcreate vg11 /dev/sdb /dev/sdc1
	Volume group "vg11" successfully created

`vgs`可以查看所有的VG:

	$vgs
	VG         #PV #LV #SN Attr   VSize  VFree
	VolGroup00   1   2   0 wz--n- 39.50g 320.00m
	vg11         2   0   0 wz--n-  1.99g   1.99g

创建时可以通过`-s`指定PE的大小，具体情况查看`vgcreate -h`。

创建VG之后，需要通过重启或下面的命令激活:

	$vgchange -a y vg11
	0 logical volume(s) in volume group "vg11" now active

## 删除VG

	vgchange -a n my_volume_group
	vgremove my_volume_group

## 在VG中增/删PV

增加:

	vgextend my_volume_group /dev/hdc1

删除时，首先通过pvdisplay查看PV是否还在被使用:

	 $pvdisplay /dev/sdc1
	  --- Physical volume ---
	  PV Name               /dev/sdc1
	  VG Name               vg11
	  PV Size               1023.00 MiB / not usable 3.00 MiB
	  Allocatable           yes
	  PE Size               4.00 MiB
	  Total PE              255
	  Free PE               255
	  Allocated PE          0
	  PV UUID               QAAL6D-KUJl-SDPU-GYKt-DK5l-UpTc-aIWoVt

如果PV还在使用，通过`pvmove`迁移数据后，删除：

	pvmove /dev/hda1
	vgreduce my_volume_group /dev/hda1

详情见[remove disk][5]。

## 创建/删除LV

可以通过了解lvcreate的参数，指定更多的条件。

	lvcreate -L500 -nlv1  vg11

通过`lvs`，可以查看所有的lv:

	$lvs
	LV       VG         Attr       LSize   Pool Origin Data%  Meta%  Move Log Cpy%Sync Convert
	LogVol00 VolGroup00 -wi-ao----  37.69g
	LogVol01 VolGroup00 -wi-ao----   1.50g
	lv1      vg11       -wi-a----- 500.00m

创建之后，会在`/dev/mapper`中生成设备文件:

	$ls /dev/mapper/
	control  vg11-lv1  VolGroup00-LogVol00  VolGroup00-LogVol01

可以直接对vg11-lv1格式化，挂载:

	mkfs.ext4  /dev/mapper/vg11-lv1
	mount /dev/mapper/vg11-lv1 /mnt

将LV卸载之后，可以删除:

	umount /dev/mapper/vg11-lv1
	lvremove /dev/mapper/vg11-lv1

## 扩容/缩容LV

扩容:

	lvextend -L12G /dev/myvg/homevol

卸载后，缩容:

	lvreduce -L-1G /dev/myvg/homevol

对LV进行扩容/缩容操作之后，还需要调整LV上的文件系统。

[extend lv][3]和[reduce lv][4]中介绍了几种文件系统的设置方法。

## lv device file missing

lvs可以看到lv，当时/dev/mapper中没有对应的设备文件。

	lvm
	lvm> vgscan        ## scan for volume groups
	lvm> vgchange -a y ## activates the volume groups

## 参考

1. [lvm-howto][1]
2. [create lv][2]
3. [extend lv][3]
4. [reduce lv][4]
5. [remove disk][5]

[1]: http://tldp.org/HOWTO/LVM-HOWTO/  "lvm-howto" 
[2]: http://tldp.org/HOWTO/LVM-HOWTO/createlv.html "createlv"
[3]: http://tldp.org/HOWTO/LVM-HOWTO/extendlv.html "extendlv"
[4]: http://tldp.org/HOWTO/LVM-HOWTO/reducelv.html "reducelv"
[5]: http://tldp.org/HOWTO/LVM-HOWTO/removeadisk.html "remove disk"
