---
layout: default
title: OpenWrt的使用和管理
author: lijiaocn
createdate: 2014/04/25 19:06:24
changedate: 2017/09/11 16:18:05
categories: 技巧
tags: openwrt
keywords: openwrt
description: Openwrt是开源的路由器系统，可以安装在多种硬件平台上。

---

* auto-gen TOC:
{:toc}

## 摘要

OpenWrt, 开源的无线路由系统。

## ssh登陆

Openwrt默认的地址192.168.1.1，接入无线后，可以通过`ssh root@192.168.1.1`进入。

	$ssh root@192.168.1.1
	root@192.168.1.1's password:
	
	
	BusyBox v1.22.1 (2015-11-20 13:18:32 CST) built-in shell (ash)
	Enter 'help' for a list of built-in commands.
	
	  _______                     ________        __
	 |       |.-----.-----.-----.|  |  |  |.----.|  |_
	 |   -   ||  _  |  -__|     ||  |  |  ||   _||   _|
	 |_______||   __|_____|__|__||________||__|  |____|
	          |__| W I R E L E S S   F R E E D O M
	 -----------------------------------------------------
	 BARRIER BREAKER (Barrier Breaker, unknown)
	 -----------------------------------------------------
	  * 1/2 oz Galliano         Pour all ingredients into
	  * 4 oz cold Coffee        an irish coffee mug filled
	  * 1 1/2 oz Dark Rum       with crushed ice. Stir.
	  * 2 tsp. Creme de Cacao
	 -----------------------------------------------------
	root@OpenWrt:~#

默认没有密码，可以通过网址`http://192.168.1.1`设置密码。

在没有密码的时候，可以通过telnet登陆，设置密码之后可以使用ssh登陆。

## 网络设置

`/etc/config/network`是网络配置文件，

默认情况：

	lan或者br-lan，用于内网接入，IP地址是静态配置的，为192.168.1.1
	wan用于连接外网，IP地址是通过dhcp获得的。

br-lan默认IP是`192.168.1.1`，可以更具需要将其修改，然后重启网络：

	/etc/init.d/network restart

## 系统配置

配置文件位于/etc/config目录下:

	dhcp
	dropbear
	firewall    //防火墙配置
	network     //网卡配置, 一个网卡作为Lan口, 一个网卡作为Wan口, 配置网卡的IP等
	system

## 软件安装

Openwrt的一大特点就是可以在其中安装各种软件包. Openwrt的软件管理工具是opkg, 软件包是后缀为.ipk的gzip压缩文件。

配置文件/etc/opkg.conf中配置了package的源:

	dest root /
	dest ram /tmp
	lists_dir ext /var/opkg-lists
	option overlay_root /overlay
	src/gz chaos_calmer_base http://downloads.openwrt.org/chaos_calmer/15.05/x86/generic/packages/base
	src/gz chaos_calmer_luci http://downloads.openwrt.org/chaos_calmer/15.05/x86/generic/packages/luci
	src/gz chaos_calmer_packages http://downloads.openwrt.org/chaos_calmer/15.05/x86/generic/packages/packages
	src/gz chaos_calmer_routing http://downloads.openwrt.org/chaos_calmer/15.05/x86/generic/packages/routing
	src/gz chaos_calmer_telephony http://downloads.openwrt.org/chaos_calmer/15.05/x86/generic/packages/telephony
	src/gz chaos_calmer_management http://downloads.openwrt.org/chaos_calmer/15.05/x86/generic/packages/management
	option check_signature 1

更新可以安装的软件列表，很多软件需要执行这个操作以后才可以看到: 

	opkg update

升级软件包:

	opkg upgrade

查看可用的软件列表:

	opkg list

查看已经安装的列表: 

	opkg list-installed

安装package:

 opkg install packagename

### 安装luci

luci是openwrt的web管理界面
安装luci, 会安装依赖程序uhttp, uhttp的配置文件位于/etc/config
luci是用lua脚本开发的, lua的lib库位于/usr/lib/lua目录

	opkg install luci

启动uhttp:

	/etc/init.d/uhttpd start

关闭或配置防火墙:

	/etc/init.d/firewall stop

这时候访问设备IP，就可以看到登陆界面了

### 安装sftp

安装sftp后可以方便的进行文件传输

	opkg install openssh-sftp-server

### 安装tor

	tor - 0.2.5.12-1 - 
	Tor is a toolset for a wide range of organizations and people that want to improve their safety and security on the Internet. 
	Using Tor can help you anonymiz e web browsing and publishing, instant messaging, IRC, SSH, and more. 
	Tor also provides a platform on which software developers can build new applications with built-in anonymi ty, safety, and privacy features. 
	This package contains the tor daemon.

## 参考

1. [OpenWrt Build System][1]
2. [OpenWrt Git Repos][2]
3. [OpenWrt Get Source][3]
4. [OpenWrt download][4]
5. [虚拟机安装OpenWrt-X86 trunk版][5]
6. [OpenWrt wiki][6]
7. [OpenWrt short manual][7]
8. [OPKG][8]

[1]: http://wiki.openwrt.org/doc/howto/build "OpenWrt Build system"
[2]: http://git.openwrt.org/ "OpenWrt Git repos"
[3]: https://dev.openwrt.org/wiki/GetSource "OpenWrt get source"
[4]: http://downloads.openwrt.org/ "OpenWrt download"
[5]: http://blog.wifizoo.net/?post=230 "虚拟机安装OpenWrt-X86 trunk版"
[6]: http://wiki.openwrt.org/ "OpenWrt wiki"
[7]: http://downloads.openwrt.org/kamikaze/docs/openwrt.html "OpenWrt short manual"
[8]: https://wiki.openwrt.org/doc/techref/opkg "OPKG"
