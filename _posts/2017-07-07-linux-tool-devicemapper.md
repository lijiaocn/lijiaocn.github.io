---
layout: default
title: linux的device mapper原理与使用
author: lijiaocn
createdate: 2017/07/07 14:02:42
changedate: 2017/07/07 17:31:44
categories: linuxtool
tags: devicemapper
keywords: linux,device mapper
description: device mapper是linux的内核用来将块设备映射到虚拟快设备的framework。

---

* auto-gen TOC:
{:toc}

## 说明

Device mapper是linux的内核用来将块设备映射到虚拟块设备的framework。

![Linux Storage Stack][https://upload.wikimedia.org/wikipedia/commons/3/30/IO_stack_of_the_Linux_kernel.svg]

在使用`lvm`命令管理逻辑卷的时候，最终是通过device mapper完成的。

`dmsetup`命令可以直接管理device mapper。

## table

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

## dmsetup

查看所有的虚拟块设备:

	$dmsetup ls
	vg11-lv1	(253:2)
	VolGroup00-LogVol01	(253:1)
	VolGroup00-LogVol00	(253:0)

## 参考

1. [device mapper wiki][1]
2. [kernel doc][2]

[1]: https://en.wikipedia.org/wiki/Device_mapper "device mapper wiki" 
[2]: https://www.kernel.org/doc/Documentation/device-mapper/ "kernel doc"
