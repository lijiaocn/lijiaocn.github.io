---
layout: default
title: "udev：udev的使用说明"
author: 李佶澳
createdate: 2017/07/07 09:22:42
changedate: 2018/07/22 14:27:06
categories: 技巧
tags: linuxtool
keywords: udev,device manager
description: udev基于linux2.6.13的uevent接口,动态的管理设备文件。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明 

udev是在用户空间运行的守护进程，它会监听内核的uevent事件，根据事件和配置的udev规则，添加或者删除设备文件。

## udev规则

udev规则在/etc/udev/rules.d目录中，所有的规则文件必须以".rules"为后缀名。

## 设备信息

通过udevadm可以读取设备信息，例如:

	$udevadm info /dev/sda
	P: /devices/pci0000:00/0000:00:01.1/ata1/host0/target0:0:0/0:0:0:0/block/sda
	N: sda
	S: disk/by-id/ata-VBOX_HARDDISK_VB0e44d14f-0256c867
	S: disk/by-path/pci-0000:00:01.1-ata-1.0
	E: DEVLINKS=/dev/disk/by-id/ata-VBOX_HARDDISK_VB0e44d14f-0256c867 /dev/disk/by-path/pci-0000:00:01.1-ata-1.0
	E: DEVNAME=/dev/sda
	E: DEVPATH=/devices/pci0000:00/0000:00:01.1/ata1/host0/target0:0:0/0:0:0:0/block/sda
	E: DEVTYPE=disk
	E: ID_ATA=1
	E: ID_ATA_FEATURE_SET_PM=1
	E: ID_ATA_FEATURE_SET_PM_ENABLED=1
	E: ID_ATA_WRITE_CACHE=1
	E: ID_ATA_WRITE_CACHE_ENABLED=1
	E: ID_BUS=ata
	E: ID_MODEL=VBOX_HARDDISK
	E: ID_MODEL_ENC=VBOX\x20HARDDISK\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20\x20
	E: ID_PART_TABLE_TYPE=dos
	E: ID_PATH=pci-0000:00:01.1-ata-1.0
	E: ID_PATH_TAG=pci-0000_00_01_1-ata-1_0
	E: ID_REVISION=1.0
	E: ID_SERIAL=VBOX_HARDDISK_VB0e44d14f-0256c867
	E: ID_SERIAL_SHORT=VB0e44d14f-0256c867
	E: ID_TYPE=disk
	E: MAJOR=8
	E: MINOR=0
	E: SUBSYSTEM=block
	E: TAGS=:systemd:
	E: USEC_INITIALIZED=27143

## 参考

1. [udev wiki][1]
2. [使用udev高效、动态地管理Linux设备文件][2]
3. [udev operation][3]

[1]: https://zh.wikipedia.org/wiki/Udev  "udev wiki" 
[2]: https://www.ibm.com/developerworks/cn/linux/l-cn-udev/ "使用udev高效、动态地管理Linux设备文件"
[3]: https://wiki.archlinux.org/index.php/Udev_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87)  "udev operation"
