---
layout: default
title: Openwrt系统编译构建
author: lijiaocn
createdate: 2017/06/03 17:32:28
changedate: 2017/06/04 22:22:47
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

## 安装OpenWrt feeds

[openwrt feeds][7]是一组可以编译到openwrt系统中的package。这些package的代码不在openwrt项目中，而是有各自的repo。

每个repo是一个feed，一个feed中可以多个package。

openwrt目录根目录下的`feeds.conf.default`文件中配置了默认的feeds，可以创建文件`feeds.conf`，在其中配置自己的feeds，例如添加luci：

	src-git luci https://github.com/openwrt/luci.git;for-15.05

首先需要使用`./scripts/feeds update`将feeds.conf中的feed下载到feeds目录中，然后才可以使用对应的feeds。

	./scripts/feeds update -a    下载feeds.conf中所有的feeds
	./scripts/feeds update luci  只下载feeds.conf中的luci

使用`./scripts/feeds list`查看都有哪些package可以用:

	./scripts/feeds list     查看所有的package
	./scripts/feeds -r luci  查看luci中的package

使用`./scripts/feeds install`安装package:

	./scripts/feeds install -a    安装所有的package

安装之后，在后面的`make menuconfig`时，会看到已经安装的package。

./scripts/feeds都以下面这些子命令，可以通过`./scripts/feeds -h`查看使用说明：

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

### 通过config diff文件保留配置

`./scripts/diffconfig.sh`可以一个config的diff文件，记录与默认配置的不同：

	./scripts/diffconfig.sh > diffconfig 

以后可以使用这个diffconfig文件恢复配置：

	cp diffconfig .config 
	或者:
	cat diffconfig >> .config
	
	make defconfig

将diffconfig复制为文件.config或者将其中的内容追加到.config文件中后，执行`make defconfig`会自动补齐其它的默认配置。

### 其他

#### Kernel configuration

还没搞清楚这个操作的意思：

	make kernel_menuconfig CONFIG_TARGET=subtarget

文档中原文说法:

	Note that make kernel_menuconfig modifies the Kernel configuration templates of the build tree and clearing the build_dir will not revert them. 
	CONFIG_TARGET allows you to select which config you want to edit. possible options: target, subtarget, env. 

## 参考

1. [openwrt git][1]
2. [openwrt build about][2]
3. [install build system on linux][3]
4. [install build system on mac][4]
5. [build system usage][5]
6. [support devices][6]
7. [openwrt feeds][7]
8. [openwrt patches][8]

[1]: https://github.com/openwrt/openwrt "openwrt git"
[2]: https://wiki.openwrt.org/about/toolchain "openwrt build about"
[3]: https://wiki.openwrt.org/doc/howto/buildroot.exigence "install build system on linux"
[4]: https://wiki.openwrt.org/doc/howto/buildroot.exigence.macosx "install build system on mac"
[5]: https://wiki.openwrt.org/doc/howto/build "build system usage"
[6]: https://wiki.openwrt.org/toh/start "support devices"
[7]: https://wiki.openwrt.org/doc/devel/feeds "openwrt feeds"
[8]: https://wiki.openwrt.org/doc/devel/patches "openwrt patches"
