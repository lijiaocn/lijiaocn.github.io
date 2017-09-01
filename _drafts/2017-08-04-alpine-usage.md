---
layout: default
title: alpine系统的使用
author: lijiaocn
createdate: 2017/08/04 11:22:58
changedate: 2017/08/29 18:29:16
categories: 项目
tags: alpine
keywords: alpine,usage
description: alpine系统的使用

---

* auto-gen TOC:
{:toc}

## 说明

alpine是一个轻量的基于musl libc和busybox的linux发行版。

alpine的体积小，纯净的alpine不到4MB，经常被用作docker的基础镜像。

## 软件包管理-apk

alpine的软件包用apk管理。

### 查看已经安装的package

apk info可以查看已经安装的package:

	apk info
	apk info -vv

## 设置时区

alpine默认没有时区文件，需要安装：

	apk update && apk add tzdata && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

## telnet

在alpine中用telnet判断网络时联通的时候需要特别注意。

连接一个无法联通服务的时候，键入ctrl+c，telnet会直接退出:

	/ # telnet 1.1.1.1 3343
	^C

连接一个可以联通的服务的时候，键入ctrl+c, 会提示选择命令:

	/ # telnet www.baidu.com 80
	^C
	Console escape. Commands are:
	
	 l  go to line mode
	 c  go to character mode
	 z  suspend telnet
	 e  exit telnet
	
	Entering character mode
	Escape character is '^]'.
	Connection closed by foreign host

键入c后，进入character mode。

## 参考

1. [alpine][1]

[1]: https://www.alpinelinux.org/ "alpine" 
