---
layout: default
title: "device mapper：linux的device mapper原理与使用"
author: 李佶澳
createdate: 2017/07/07 14:02:42
last_modified_at: 2018/07/22 14:26:57
categories: 技巧
tags: linuxtool
keywords: linux,device mapper
description: device mapper是linux的内核用来将块设备映射到虚拟快设备的framework。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

Device mapper是linux的内核用来将块设备映射到虚拟块设备的framework。

![Linux Storage Stack](https://upload.wikimedia.org/wikipedia/commons/3/30/IO_stack_of_the_Linux_kernel.svg)

在使用`lvm`命令管理逻辑卷的时候，最终是通过device mapper完成的。

`dmsetup`命令可以直接管理device mapper。

## 虚拟块设备的table

每个虚拟的块设备有一个table，记录了映射的情况，`dmsetup table`可以查看。

	$dmsetup table
	vg11-lv1: 0 1024000 linear 8:16 2048
	VolGroup00-LogVol01: 0 3145728 linear 8:3 79038464
	VolGroup00-LogVol00: 0 79036416 linear 8:3 2048

`man dmsetup`中介绍了table的格式:

	logical_start_sector num_sectors target_type target_args
	开始扇区             扇区数      设备类型    设备参数

device mapper提供了多种target_type:

	linear destination_device start_sector
	    The traditional linear mapping.
	striped num_stripes chunk_size [destination start_sector]...
	    Creates a striped area.
	    e.g. striped 2 32 /dev/hda1 0 /dev/hdb1 0 will map the first chunk (16k) as follows:
	    LV chunk 1 -> hda1, chunk 1
	    LV chunk 2 -> hdb1, chunk 1
	    LV chunk 3 -> hda1, chunk 2
	    LV chunk 4 -> hdb1, chunk 2
	error     Errors any I/O that goes to this area.  Useful for testing or for creating devices with holes in them.
	zero      Returns blocks of zeroes on reads.  Any data written is discarded silently.  
	          This is a block-device equivalent of the /dev/zero character-device data sink described in null(4).
	cache     Improves performance of a block device (eg, a spindle) by dynamically migrating some of its data to a faster smaller device (eg, an SSD).
	crypt     Transparent encryption of block devices using the kernel crypto API.
	delay     Delays reads and/or writes to different devices.  Useful for testing.
	flakey    Creates a similar mapping to the linear target but exhibits unreliable behaviour periodically.  
	          Useful for simulating failing devices when testing.
	mirror    Mirrors data across two or more devices.
	multipath
	Mediates  access through multiple paths to the same device.
	raid      Offers an interface to the kernel's software raid driver, md.
	snapshot  Supports  snapshots of devices.
	thin, thin-pool
	    Supports thin provisioning of devices and also provides a better snapshot support.

在kernel源码目录[Documentation/device-mapper][2]中介绍了每一类target。

## 查看虚拟块设备

	$dmsetup ls
	vg11-lv1	(253:2)
	VolGroup00-LogVol01	(253:1)
	VolGroup00-LogVol00	(253:0)

## 创建虚拟块设备

`dmsetup create`可以用来创建虚拟块设备:

	create <dev_name>
	          [-j|--major <major> -m|--minor <minor>]
	          [-U|--uid <uid>] [-G|--gid <gid>] [-M|--mode <octal_mode>]
	          [-u|uuid <uuid>] [--addnodeonresume|--addnodeoncreate]
	          [--readahead {[+]<sectors>|auto|none}]
	          [-n|--notable|--table {<table>|<table_file>}]

--table是关键的配置参数，指定了块设备的类型，并根据类型传递了不同的参数。

### thin,thin-pool

[thin-provisioning][3]是device mapper提供的一种存储类型。

可以将多个虚拟设备存放在同一个数据卷上，简化了管理，并且通过共享数据减少了存储开销。

并且支持快照、递归快照。

在kernel文件[Documentation/device-mapper/thin-provisioning.txt][3]中介绍了thin-provisioning。

thin-provisioning将元数据(metadata)和数据(data block)分开存储，metadata设备的推荐容量：

	48 * $data_dev_size / $data_block_size,  rount up to 2MB.

如果需要大量快照，并且对快照做了大量修改，需要增加metadata设备的容量，最大可以为16GB。

#### 创建thin-pool

thin就是在thin-pool中创建的虚拟设备。

准备一个metadata设备，这里用一个文件代替:

	dd if=/dev/zero of=metadata bs=512 count=100000
	losetup /dev/loop0  ./metadata

准备一个data设备，这里用一个文件代替:

	dd if=/dev/zero of=data bs=512 count=1000000
	losetup /dev/loop1  ./data

创建pool:

	dmsetup create pool --table "0 1000000 thin-pool /dev/loop0 /dev/loop1 512 1000"

参数含义如下:

	dmsetup create pool \
		--table "0 20971520 thin-pool $metadata_dev $data_dev \
		 $data_block_size $low_water_mark"
	
	pool:              自定义的名字
	0:                 开始扇区
	20971520:          结束扇区
	thin-pool:         设备类型
	$metadata_dev:     存放元数据的设备
	$data_dev:         存放数据的设备
	$data_block_size:  数据块大小
	$low_water_mark:   空闲的数据块少于该数值时，发送通知

创建后可以看到:

	$dmsetup ls
	pool    (253:3)
	
	$dmsetup table pool
	0 1000000 thin-pool 7:0 7:1 512 1000 0

	$ls /dev/mapper/pool
	/dev/mapper/pool

#### 创建thin

创建:

	dmsetup message /dev/mapper/pool 0 "create_thin 0"

0是为要创建的thin指定的标记号(identifier)，不能重复，由用户管理。

激活:

	dmsetup create thin --table "0 1000 thin /dev/mapper/pool 0"

thin是自定义的名字。

查看:

	$dmsetup ls
	thin	(253:4)
	
	$ls /dev/mapper/thin
	/dev/mapper/thin
	
	$ls -lh thin
	lrwxrwxrwx. 1 root root 7 Jul 10 05:22 thin -> ../dm-4

这时候就可以对设备/dev/mapper/thin进行格式化、挂载。

#### 删除thin

	dmsetup message /dev/mapper/pool 0 "delete 0"
	dmsetup remove thin

## 参考

1. [device mapper wiki][1]
2. [kernel doc][2]
3. [thin-provisioning][3]

[1]: https://en.wikipedia.org/wiki/Device_mapper "device mapper wiki" 
[2]: https://www.kernel.org/doc/Documentation/device-mapper/ "kernel doc"
[3]: https://www.kernel.org/doc/Documentation/device-mapper/thin-provisioning.txt "thin-provisioning"
