---
layout: default
title: Openwrt系统编译构建
author: lijiaocn
createdate: 2017/06/03 17:32:28
changedate: 2017/09/23 22:43:47
categories: 项目
tags: openwrt
keywords: openwrt,code,build,构建
description: 从源代码开始编译自己的openwrt系统。

---

* auto-gen TOC:
{:toc}

## 安装编译系统(build system)

[openwrt build about][2]给出了相关的文档。

openwrt的[build system][3]可以安装在linux和mac上，这里使用的是mac。

编译系统支持跨平台编译，如果目标平台是x86，编译机需要有4G的内存，其他平台1～4G，磁盘空间需求如下：

	编译系统自身占用200MB的空间，如果加上OpenwWrt Feeds，需要300MB。
	从OpenWrt Feeds下载的源代码占用2.1G空间。
	编译过程中需要使用3～4G的空间。

### Linux (CentOS)

[install build system on linux][3]给出了详细安装的方法。

安装依赖工具:

	yum install -y epel-release
	yum install -y subversion binutils bzip2 gcc gcc-c++ gawk gettext flex ncurses-devel zlib-devel zlib-static make patch unzip perl-ExtUtils-MakeMaker glibc glibc-devel glibc-static quilt ncurses-libs sed sdcc intltool sharutils bison wget git-core openssl-devel xz

### Max OS X

[install build system on mac][4]

## 下载源码 

从github上下载[openwrt的源码][1]：

	git clone https://github.com/openwrt/openwrt.git

master分支是开发中的代码，已经发布的版本打上了对应的tag。

这里使用v15.05.1:

	git checkout -b v15.05.1 v15.05.1

## 安装feeds

[openwrt feeds][7]是一组可以编译到openwrt系统中的软件。这些软件的代码不在openwrt项目中，有各自的repo。

安装feeds中的package，就是在定制要编译的openwrt中包含的软件。

openwrt源码根目录下的`feeds.conf.default`文件中配置了默认的feeds，feeds.conf.default中默认有六个feeds，即对应六大组软件包:

	src-git packages https://github.com/openwrt/packages.git
	src-git luci https://github.com/openwrt/luci.git
	src-git routing https://github.com/openwrt-routing/packages.git
	src-git telephony https://github.com/openwrt/telephony.git
	src-git management https://github.com/openwrt-management/packages.git
	src-git targets https://github.com/openwrt/targets.git
	src-git luci https://github.com/openwrt/luci.git;for-15.05

可以创建文件`feeds.conf`，在其中配置自己的feeds。 `./scripts/feeds list -n`查看已经配置的feeds：

	./scripts/feeds list -n
	packages
	luci
	routing
	telephony
	management
	targets

每一个feed中都包含多个软件包，`./scripts/feeds list -r <feedname>`可以查看指定feed包含的软件：

	./scripts/feeds list -r packages
	...

使用feeds之前，需要先执行`./scripts/feeds update`将feeds.conf中配置的feeds下载到feeds目录中：

	./scripts/feeds update -a    下载feeds.conf中所有的feeds
	./scripts/feeds update luci  只下载feeds.conf中的luci

然后才可以使用`./scripts/feeds list`查看都有哪些package可以用:

	./scripts/feeds list     查看所有的package
	./scripts/feeds -r luci  查看luci中的package

以及使用`./scripts/feeds install`安装package:

	./scripts/feeds install -a                安装所有的package
	./scripts/feeds install -p packages tor   安装名为`packages`的feed中的tor软件

`./scripts/feeds -h`查看所有可用的命令:

	./scripts/feeds clean       删除下载的feeds
	./scripts/feeds update      下载可用的feeds，并生成一个索引文件，供list和search时使用
	./scripts/feeds install     安装package，安装以后在后面的`make menuconfig`时可以看到对应package。
	./scripts/feeds list
	./scripts/feeds search 
	./scripts/feeds uninstall

这里安装了feeds.conf.default中列出的feeds中的所有package：

	./scripts/feeds update -a
	./scripts/feeds install -a

### 制作自己的feed

[openwrt feeds][7]中的`Custom Feeds`中给出添加自己的feed的方法，可以将自己开发的程序打包到openwrt中。

## 编译配置

执行下面的命令进入到编译配置界面:

	make menuconfig

主要进行下面四个方面的配置:

	Target system            目标系统
	Package selection        选择pacakge
	Build system settings    编译设置
	Kernel modules           内核模块

### Target System

Openwrt能够在多种硬件平台上运行:

    Target System (x86)  --->
    Subtarget (Generic)  --->

其实可以`Target System`都是在源码目录`target/linux`中设置的，`Subtarget`是对应Target目录中的目录名。

如果要定制自己的硬件平台，可以了解一下target/linux目录中的文件是如何起作用的。

如果硬件平台是mips7621，可以配置为：

	Target System: Ralink RT288x/RT3xx
	Subtarget: MT7621 based boards

### 选择软件包

在下面的配置项中可以选择将哪些软件打包进固件，哪些编译成模块:

	 Base system  --->
	 Administration  --->
	 Boot Loaders  ----  
	 Development  --->   
	 Extra packages  ----
	 Firmware  --->      
	 Fonts  --->         
	 Kernel modules  --->
	 Languages  --->     
	 Libraries  --->     
	 LuCI  --->          
	 Mail  --->          
	 Multimedia  --->    
	 Network  --->       
	 Sound  --->         
	 Utilities  --->     
	 Xorg  --->

例如，在Network中，选择将tor编译：

	-*- tor........................... An anonymous Internet communication system
	<*> tor-gencert................................... Tor certificate generation
	<*> tor-geoip............................................... GeoIP db for tor
	<*> tor-resolve......................................... tor hostname resolve

### 通过config diff文件保留配置

`./scripts/diffconfig.sh`可以生成config的diff文件，记录与默认配置的不同配置：

	./scripts/diffconfig.sh > diffconfig 

以后可以使用这个diffconfig文件恢复配置：

	cp diffconfig .config 
	make defconfig

将diffconfig复制为文件.config或者将其中的内容追加到.config文件中后，执行`make defconfig`自动补齐其它的配置项。

## 开始编译

需要的源码包会在编译过程中下载dl目录，dl目录中已经存在的源码文件，不会重新下载。

编译固件:

	make -j1 V=s

编译得到固件位于:

	./bin/XXX

编译指定的package:

	make package/cups/compile V=s

编译得到package位于:

	./bin/XXX/packages

### 其他

#### Kernel configuration

还没搞清楚这个操作的意思：

	make kernel_menuconfig CONFIG_TARGET=subtarget

文档中原文说法:

	Note that make kernel_menuconfig modifies the Kernel configuration templates 
	of the build tree and clearing the build_dir will not revert them. CONFIG_TARGET
	allows you to select which config you want to edit. possible options: target, 
	subtarget, env. 

## 升级固件

将生成在bin/XXX目录的XXX-sysupdate.bin文件上传的openwrt系统。

使用命令[sysupgrade][12]进行系统升级。

	sysupgrade -b backup.tar.gz     //备份配置文件
	sysupgrade --test openwrt-ramips-mt7621-mt7621-squashfs-sysupgrade.bin   //检查bin文件
	sysupgrade -d 10 openwrt-ramips-mt7621-mt7621-squashfs-sysupgrade.bin    //开始升级

升级过程中需要保留的文件，在`/etc/sysupgrade.conf`中指定，例如:

	/etc/openvpn/
	/etc/tor/

升级完成后会自动重启。

## 单独编译package

可以通过[openwrt sdk][9]单独编译指定的package。

可以在[openwrt download][10]中下载对应版本和架构的SDK压缩包，例如：

	OpenWrt-SDK-15.05-ramips-mt7621_gcc-4.8-linaro_uClibc-0.9.33.2.Linux-x86_64.tar.bz2

或者自己在openwrt中编译，在make menuconfig时勾选SDK:

	[*]Build the OpenWrt SDK

勾选后，编译结束后，会在/bin/XXX/目录下生成SDK压缩包`OpenWrt-SDK......tar.bz2`。

将SDK压缩包解压以后，在feeds.conf中配置feed源，然后更新feeds:

	./scripts/feeds update -a
	./scripts/feeds install -a   //或者安装需要的报文

编译过程分为四步，这里以编译名为tor的package为例:

	./scripts/feeds install -p packages tor
	make -j1 V=s package/tor/download
	make -j1 V=s package/tor/prepare
	make -j1 V=s package/tor/compile

编译过程中使用的Makefile是`package/feeds/packages/tor/Makefile`。

ipk文件在`bin/package`目录中生成，通过file命令可以看到ipk文件就是gzip格式的压缩文件：

	$ file tor_0.2.7.6-1_ramips.ipk
	tor_0.2.7.6-1_ramips.ipk: gzip compressed data, from Unix

可以通过下面的命令，将package目录做成本地源：

	make package/index

清理编译中产生的文件:

	make -j1 V=s package/tor/clean

## 参考

1. [openwrt git][1]
2. [openwrt build about][2]
3. [install build system on linux][3]
4. [install build system on mac][4]
5. [build system usage][5]
6. [support devices][6]
7. [openwrt feeds][7]
8. [openwrt patches][8]
9. [openwrt sdk][9]
10. [openwrt download][10]
11. [ash file not found][11]
12. [sysupgrade][12]

[1]: https://github.com/openwrt/openwrt "openwrt git"
[2]: https://wiki.openwrt.org/about/toolchain "openwrt build about"
[3]: https://wiki.openwrt.org/doc/howto/buildroot.exigence "install build system on linux"
[4]: https://wiki.openwrt.org/doc/howto/buildroot.exigence.macosx "install build system on mac"
[5]: https://wiki.openwrt.org/doc/howto/build "build system usage"
[6]: https://wiki.openwrt.org/toh/start "support devices"
[7]: https://wiki.openwrt.org/doc/devel/feeds "openwrt feeds"
[8]: https://wiki.openwrt.org/doc/devel/patches "openwrt patches"
[9]: https://wiki.openwrt.org/doc/howto/obtain.firmware.sdk "openwrt sdk"
[10]: https://downloads.openwrt.org "openwrt download"
[11]: https://stackoverflow.com/questions/31385121/elf-file-exists-in-usr-bin-but-turns-out-ash-file-not-found "elf-file-exists-in-usr-bin-but-turns-out-ash-file-not-found"
[12]: https://wiki.openwrt.org/doc/techref/sysupgrade "sysupgrade"
