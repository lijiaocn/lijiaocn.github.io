---
layout: default
title: OpenWrt初次使用
author: lijiaocn
createdate: 2014/04/25 19:06:24
changedate: 2017/05/25 21:55:41
categories: 项目
tags: openwrt
keywords: openwrt
description: Openwrt是开源的路由器系统，可以安装在多种硬件平台上。

---

* auto-gen TOC:
{:toc}

## 摘要

OpenWrt, 开源的无线路由系统。

## 编译

[OpenWrt Build System][1]中介绍了系统构建的方法。

[openwrt的代码库][2]中没有提供所有的代码，而是在编译时会从指定的位置下载源码，编译时需要处于联网状态。

编译时会建立一个build_dir目录, 在其中的host目录中存放着编译过程中下载的源码. 源码的压缩包位于dl目录下。

	git clone git://git.openwrt.org/openwrt.git

openwrt提供了一个脚本用于获取package的源码

	./scripts/feeds -h          //-h 帮助
	./scripts/feeds update -a   //更新所有的代码
	./scripts/feeds install -a   //更新所有的代码

编译配置

	make menuconfig    

编译

	make 

## 安装到虚拟机

从[OpenWrt download][4]页面下载指定版本的img文件，选择x86架构，例如:

	openwrt-15.05-x86-generic-combined-ext4.img.gz  

解压后得到img文件。

启动一个虚拟机，设置两个网卡，一块网卡用于LAN，一块用与WLAN，增加一块IDE硬盘。

新的硬盘类型选择IDE, 否则openwrt启动时会找不到对应驱动，从而无法加载文件系统

使用dd(linux)或者physdiskwrite(windows)，将下载的img写到新增加的硬盘上。

	dd if=./openwrt-15.05-x86-generic-combined-ext4.img  of=/dev/sdb

从新增加的硬盘启动虚拟机, 直接进入OpenWrt系统。

这里使用的虚拟机配置如下:

	eth0  host模式 192.168.33.0/24
	eth1  NAT模式

系统启动后，执行`ifconfig`可以看到eth0和eth1两块网卡，可以ping通外网。

### 网络设置

`/etc/config/network`是网络配置文件，

默认情况：

	eth0作为内网接口接入网桥br-lan，br-lan静态设置了内网IP。
	eth1作为外网接口动态获取IP，用于连接外网。

br-lan默认IP是`192.168.1.1`，这里将其修改为虚拟机host网段中的地址`192.168.33.2`，重启网络：

	/etc/init.d/network restart

这时候br-lan的地址应该变为192.168.33.2，从宿主机上可以ping通。

并且可以打开网址`http://192.168.33.2`，使用root账号登陆（默认没有密码）。

在页面`system->administration`中设置路由器账号密码，以及设置为否允许ssh登陆后，就可以ssh登陆到路由器了。

	ssh root@192.168.33.2
	root@192.168.33.2's password:
	
	
	BusyBox v1.23.2 (2015-07-25 07:32:21 CEST) built-in shell (ash)
	
	  _______                     ________        __
	 |       |.-----.-----.-----.|  |  |  |.----.|  |_
	 |   -   ||  _  |  -__|     ||  |  |  ||   _||   _|
	 |_______||   __|_____|__|__||________||__|  |____|
	          |__| W I R E L E S S   F R E E D O M
	 -----------------------------------------------------
	 CHAOS CALMER (15.05, r46767)

### 系统配置

doc/start#configuring.openwrt

配置文件位于/etc/config目录下:

	dhcp
	dropbear
	firewall    //防火墙配置
	network     //网卡配置, 一个网卡作为Lan口, 一个网卡作为Wan口, 配置网卡的IP等
	system

设置密码和开启ssh:

	openwrt默认开始telnet, root密码为空，设置root密码后，telnet自动关闭，开启ssh.

	也就是使用passwd设置了密码后，就可以通过ssh连接了.

### 软件安装

Openwrt的一大特点就是可以在其中安装各种软件包. Openwrt的软件管理工具是opkg, 软件包是后缀为.ipk的gzip压缩文件

opkg配置使用:

	配置文件: /etc/opkg.conf
	更新软件列表: opkg update
	升级软件包: opkg upgrade
	查看软件列表: opkg list
	查看已经安装的列表: opkg list-installed
	安装: optg install packagename

安装luci:

	//luci是openwrt的web管理界面
	//安装luci, 会安装依赖程序uhttp, uhttp的配置文件位于/etc/config
	//luci是用lua脚本开发的, lua的lib库位于/usr/lib/lua目录
		opkg install luci

	//启动uhttp:
		/etc/init.d/uhttpd start

	//关闭或配置防火墙:
		/etc/init.d/firewall stop

	这时候访问设备IP，就可以看到登陆界面了

安装sftp:

	//安装sftp后可以方便的进行文件传输
	opkg install openssh-sftp-server

## 参考

1. [OpenWrt Build System][1]
2. [OpenWrt Git Repos][2]
3. [OpenWrt Get Source][3]
4. [OpenWrt download][4]
5. [虚拟机安装OpenWrt-X86 trunk版][5]
6. [OpenWrt wiki][6]
7. [OpenWrt short manual][7]

[1]: http://wiki.openwrt.org/doc/howto/build "OpenWrt Build system"
[2]: http://git.openwrt.org/ "OpenWrt Git repos"
[3]: https://dev.openwrt.org/wiki/GetSource "OpenWrt get source"
[4]: http://downloads.openwrt.org/ "OpenWrt download"
[5]: http://blog.wifizoo.net/?post=230 "虚拟机安装OpenWrt-X86 trunk版"
[6]: http://wiki.openwrt.org/ "OpenWrt wiki"
[7]: http://downloads.openwrt.org/kamikaze/docs/openwrt.html "OpenWrt short manual"
