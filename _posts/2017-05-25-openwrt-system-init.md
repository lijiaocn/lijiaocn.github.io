---
layout: default
title: Openwrt的系统启动、初始化过程
author: 李佶澳
createdate: 2017/05/25 21:53:47
changedate: 2017/09/11 16:17:55
categories: 项目
tags: openwrt
keywords: openwrt,系统启动,初始化
description: openwrt是一个linux系统，系统的启动初始化过程与其他linux系统类似。

---

* auto-gen TOC:
{:toc}

这里使用的版本是: openwrt-15.05-x86-generic-combined-ext4.img.gz，运行在虚拟机中。

## 系统概况

查看系统版本:

	uname -a
	Linux OpenWrt 3.18.20 #1 Fri Sep 4 20:23:40 CEST 2015 i686 GNU/Linux

磁盘sda分区有两个分区，openwrt中没有fdisk命令，可以用mount直接挂载:

	mkdir -p /mnt/sda1  /mnt/sda2
	mount /mnt/sda1 /dev/sda1
	mount /mnt/sda2 /dev/sda2

### /dev/sda1 启动分区

	$ls -R sda1/
	sda1/:
	boot        lost+found
	
	sda1/boot:
	grub     vmlinuz
	
	sda1/boot/grub:
	grub.cfg
	
	sda1/lost+found:

可以看到openwrt是使用grub引导启动的。

grub配置文件grub.cfg:

	serial --unit=0 --speed=38400 --word=8 --parity=no --stop=1
	terminal_input console serial; terminal_output console serial

	set default="0"
	set timeout="5"
	set root='(hd0,msdos1)'

	menuentry "OpenWrt" {
			linux /boot/vmlinuz root=/dev/sda2 rootfstype=ext4 rootwait console=tty0 console=ttyS0,38400n8 noinitrd
	}
	menuentry "OpenWrt (failsafe)" {
			linux /boot/vmlinuz failsafe=true root=/dev/sda2 rootfstype=ext4 rootwait console=tty0 console=ttyS0,38400n8 noinitrd
	}

从grub.cfg中看到，根文件系统是/dev/sda2。

### /dev/sda2 根文件系统

	bin
	dev
	etc
	lib
	lost+found 
	mnt
	overlay
	proc
	rom
	root
	sbin
	sys
	tmp
	usr
	var
	www

### 系统进程

	 PID USER       VSZ STAT COMMAND
	  1 root       876 S    /sbin/procd        //注意1号进程是procd!
	  2 root         0 SW   [kthreadd]
	  3 root         0 SW   [ksoftirqd/0]
	  5 root         0 SW<  [kworker/0:0H]
	  6 root         0 SW   [kworker/u2:0]
	  7 root         0 SW<  [khelper]
	  8 root         0 SW   [kworker/u2:1]
	  155 root         0 SW<  [writeback]
	  157 root         0 SW<  [bioset]
	  159 root         0 SW<  [kblockd]
	  321 root         0 SW<  [ata_sff]
	  328 root         0 SW   [khubd]
	  339 root         0 SW   [kworker/0:1]
	  446 root         0 SW   [kswapd0]
	  508 root         0 SW   [fsnotify_mark]
	  584 root         0 SW   [scsi_eh_0]
	  587 root         0 SW   [scsi_eh_1]
	  622 root         0 SW<  [kpsmoused]
	  624 root         0 SW   [kworker/0:2]
	  638 root         0 SW<  [deferwq]
	  655 root         0 SW<  [ext4-dio-unwrit]
	  831 root       668 S    /sbin/ubusd
	  832 root       612 S    /sbin/askfirst ttyS0 /bin/ash --login
	  833 root      1136 S    /bin/ash --login
	 1096 root       844 S    /sbin/logd -S 16
	 1126 root       980 S    /sbin/netifd
	 1140 root       832 S    /usr/sbin/odhcpd
	 1175 root       872 S    /usr/sbin/dropbear -F -P /var/run/dropbear.1.pid -p 22 -K 300
	 1230 root      1132 S    /usr/sbin/ntpd -n -p 0.openwrt.pool.ntp.org -p 1.openwrt.pool.ntp.org -p 2.openwrt.pool.ntp.org -p 3.openwrt.pool.ntp.org
	 1283 nobody     784 S    /usr/sbin/dnsmasq -C /var/etc/dnsmasq.conf -k
	 1410 root       960 S    /usr/sbin/uhttpd -f -h /www -r OpenWrt -x /cgi-bin -u /ubus -t 60 -T 30 -k 20 -A 1 -n 3 -N 100 -R -p 0.0.0.0:80
	 1429 root      1124 S    less
	 1431 root       936 S    /usr/sbin/dropbear -F -P /var/run/dropbear.1.pid -p 22 -K 300
	 1432 root      1136 S    -ash
	 1439 root      1128 R    ps

### 系统配置

OpenWRT的系统配置使用的是System V风格. 配置默认存放在/etc/config目录下. 

	dhcp     dropbear  firewall  luci      network   rpcd      system    ucitrack  uhttpd

通过/etc/init.d目录下的脚本启动服务:

	$ls /etc/init.d/
	boot        done        led         odhcpd      sysfixtime  telnet      umount
	cron        dropbear    log         rpcd        sysntpd     tor
	dnsmasq     firewall    network     sysctl      system      uhttpd

## 启动过程

openwrt的linux内核启动时会按照下面的顺序寻找初始化程序。

	rdinit=
	init=
	/sbin/init
	/etc/init
	/bin/init
	/bin/sh

openwrt中启动的第一个程序是/sbin/init，在/sbin/init中又启动了procd。procd成为1号进程。

### 系统启动

需要特别注意，Openwrt当前的初始化过程使用的不是初始化脚本, 而是在名为procd的Pacakage中实现了自己的init程序(/sbin/init)

	Pacakage路径: openwrt_trunk/openwrt/package/system/procd/
	源码地址:     git://nbd.name/luci2/procd.git

在init程序中完成了一系列的初始化工作, init程序读取的文件依然按照System V风格进行组织, 所以虽然调度者不同,但初始化服务的设置方式依然是System V风格的

procd的具体工内容在后面分析.

### 系统脚本

和其他的Linux发行版一样, Openwrt中存在大量的脚本文件, 这些脚本文件将不同程序黏合起来。

Openwrt的脚本分散在一下几个位置:

	/lib/config/uci.sh
	/lib/functions/*.sh
	/lib/functions.sh
	/etc/

### 系统工具

Openwrt中存在一些自有的工具.

#### procd 

procd在OpenWRT中占据核心位置，统一管理了整个系统, 生成的文件有init、procd等核心程序.

	Pacakage路径: openwrt_trunk/openwrt/package/system/procd/
	源码地址:     git://nbd.name/luci2/procd.git
	http://wiki.openwrt.org/doc/techref/procd

分析的版本:

	Author: Felix Fietkau <nbd@openwrt.org>  2014-03-20 23:05:47
	Committer: Felix Fietkau <nbd@openwrt.org>  2014-03-20 23:05:49
	Parent: 7a9cbcd88b6cf3c0cbee6d4f76c2adaedc54058d (rcS: fix a format string bug)

生成的程序:

	//查看源码中的CMakeLists.txt, procd包生成了一下几个程序:
	//CMakeLists.txt是OpenWRT的工程文件，对Makefile的封装.

	/sbin/procd
	/sbin/init
	/sbin/udevtrigger
	/sbin/askfirst

procd源码文件:

	procd.c
	signal.c
	watchdog.c
	state.c
	inittab.c
	rcS.c
	ubus.c
	system.c
	service/service.c
	service/instance.c
	service/validate.c
	service/trigger.c
	plug/coldplug.c
	plug/hotplug.c
	utils/utils.c

procd作用:

procd原理:

init源码文件:

	initd/init.c
	initd/early.c
	initd/preinit.c
	initd/mkdev.c
	watchdog.c

init作用:

	第一步: initd/early.c
	挂载必需的文件系统,例如proc、sysfs等. 
	创建必需的设备文件,例如/dev/null
	设置必需的环境变量,例如PATH
	打开控制台 concole
	第二步: init.c
	读取/proc/cmdline, 根据init_debug=XX, 设置调试级别
	第三步: watchdog.c
	设置看门狗
	第四步:
	子进程1执行: /sbin/kmodloader /etc/modules-boot.d
	子进程2执行: /sbin/procd -h /etc/hotplug-preinit.json
	子进程3执行: /bin/sh  /etc/preinit

	
#### uci -- 配置文件管理

/sbin/uci用于读取、增加、修改配置文件中的内容

	root@OpenWrt:/# uci  
	Usage: uci [<options>] <command> [<arguments>]

	Commands:
			batch
			export     [<config>]
			import     [<config>]
			changes    [<config>]
			commit     [<config>]
			add        <config> <section-type>
			add_list   <config>.<section>.<option>=<string>
			del_list   <config>.<section>.<option>=<string>
			show       [<config>[.<section>[.<option>]]]
			get        <config>.<section>[.<option>]
			set        <config>.<section>[.<option>]=<value>
			delete     <config>[.<section>[[.<option>][=<id>]]]
			rename     <config>.<section>[.<option>]=<name>
			revert     <config>[.<section>[.<option>]]
			reorder    <config>.<section>=<position>

	Options:
			-c <path>  set the search path for config files (default: /etc/config)
			-d <str>   set the delimiter for list values in uci show
			-f <file>  use <file> as input instead of stdin
			-m         when importing, merge data into an existing package
			-n         name unnamed sections on export (default)
			-N         don't name unnamed sections
			-p <path>  add a search path for config change files
			-P <path>  add a search path for config change files and use as default
			-q         quiet mode (don't print error messages)
			-s         force strict mode (stop on parser errors, default)
			-S         disable strict mode
			-X         do not use extended syntax on 'show'

示例:

/lib/config/uci.sh封装了对uci的调用。


#### opkg

opkg是OpenWRT的软件包管理工具.软件包后缀是.ipk, 是使用gzip压缩的程序包.

	//使用file命令得到的文件信息
	luci_svn-r10180-1_x86.ipk: gzip compressed data, from Unix, last modified: Wed Apr 30 03:54:56 2014

将后缀名修改为ipk.tar.gz后, 可以使用tar -xvf解开:

	mv luci_svn-r10180-1_x86.ipk luci_svn-r10180-1_x86.ipk.tar.gz
	tar -xvf luci_svn-r10180-1_x86.ipk.tar.gz 

ipk内部文件组织格式如下:

	./debian-binary     //版本信息
	./data.tar.gz       //二进制程序
	./control.tar.gz    //描述信息，以及依赖的其他程序


