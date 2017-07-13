---
layout: default
title: SSH同时登陆到多个Node
author: lijiaocn
createdate: 2017/07/11 15:57:31
changedate: 2017/07/11 19:25:39
categories:
tags:
keywords:
description: 

---

* auto-gen TOC:
{:toc}

# 

文献是这样引用的: [文献1][1]、[文献2][2]。

## omnitty

[omnitty][1]是一款特别好用的ssh终端管理工具,`SSH multiplexer`。

### 安装

首先安装[librote][2]:

	wget http://prdownloads.sourceforge.net/rote/rote-0.2.8.tar.gz
	tar -xvf rote-0.2.8.tar.gz
	cd rote-0.2.8
	yum install -y ncurses-devel
	./configure

将/usr/local/bin加到PATH变量中:

	export PATH=$PATH:/usr/local/bin

然后安装omnitty:

	wget http://prdownloads.sourceforge.net/omnitty/omnitty-0.3.0.tar.gz
	tar -xvf omnitty-0.3.0.tar.gz
	cd omnitty-0.3.0/
	./configure
	
	#在Makefile中，将:
	LIBS= -L/usr/local/lib -lrote
	修改为:
	LIBS= -L/usr/local/lib -lrote -lncurses
	
	make
	make install

添加动态库查找路径:

	echo "/usr/local/lib" >/etc/ld.so.conf.d/usr-local-lib.conf
	ldconfig

然后就可以直接执行:

	omnitty

### 使用

先在一个文件中写入主机IP，这里用的是/root/hosts:

	10.39.0.115
	10.39.0.116
	10.39.0.117
	10.39.0.136
	10.39.0.137
	10.39.0.138

也可以用IP+port的方式:

	192.168.1.61 –p 222

或者指定用户:

	root@192.168.1.61

启动omnitty, -W和-T分别指定窗:

	omnitty -W 20 -T 180  

键入F5，在`Add:`提示后添加:

	@/root/hosts

这时候会自动加载hosts文件中的主机，host文件可以使用相对路径。

然后可以，使用F2/F3上下移动光标，按F4为光标所在的机器加上或者取消tag。

打上tag的机器会显示为绿色，按F7进入广播模式后，操作就会被广播到所有选中的机器上。

F1键弹出可以使用的快捷键。

	OmNiTTY-R v0.3.0  F1:menu  F2/3:sel  F4:tag  F5:add  F6:del  F7:mcast

## 参考

1. [omnitty][1]
2. [rote][2]
3. [omnitty批量管理工具][3]
4. [

[1]: http://omnitty.sourceforge.net/  "omnitty" 
[2]: http://rote.sourceforge.net/ "rote"
[3]: http://blog.csdn.net/cnyyx/article/details/45077373 "omnitty批量管理工具"
[4]: http://www.cnblogs.com/lcj0703/p/6703970.html "轻量级批量Omnitty工具安装和简单使用"
