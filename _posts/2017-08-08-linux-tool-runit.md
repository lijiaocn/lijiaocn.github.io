---
layout: default
title: 进程管理工具runit
author: lijiaocn
createdate: 2017/08/24 10:58:48
changedate: 2017/09/21 18:42:01
categories: 技巧
tags: linuxtool
keywords: runit,runsvdir,进程管理
description: runit是一个跨Unix平台的系统启动、服务监督工具，可以替代sysvinit。

---

* auto-gen TOC:
{:toc}

## 说明

[runit][1]是一组程序，可以用来引导系统、启动监督服务、记录服务日志等。

使用了runit的操作系统：

	Debian GNU/Linux (as alternative init scheme)
	FreeBSD
	OpenBSD
	NetBSD
	Ubuntu (as alternative init scheme)
	Gentoo
	Linux from Scratch
	Finnix
	SME server
	Linux-VServer
	T2
	GoboLinux
	Dragora GNU/Linux (as default init scheme)
	ArchLinux
	OpenSDE
	Zinux Linux (as default init scheme)
	deepOfix Mail Server (as default init scheme)
	Void Linux (as default init scheme) 

## runsvdir

[runsvdir][2]是runit中一个程序，用来启动监督服务。

	runsvdir [-P] dir [ log ] 

runsvdir加载指定目录的子目录中的服务文件，并调用[runsv][3]将服务启动。

## runsv

[runsv][3]命令用来启动并监督服务。

	runsv service

service必须是一个目录，runsv进入目录中，执行`./run`。

./run退出后，如果存在./finish，执行`./finish`，然后重新执行./run，否则直接执行./run。

如果./run和./finish立即退出，runsv等待1秒后，再启动./finish ./run。

runsv会向./finish传入两个参数：

	参数1，./run的exit code，-1，非正常退出，0，正常退出
	参数2，waitpid获取的退出状态，

如果目录中有`down`文件，runsv不重新启动./run。

如果目录中有`log`目录，runsv创建一个pipe，./run和./finish的标准输出重定向到pipe，然后启动`log/run`，log/run将pipe作为标准输入。

runsv将服务的状态保存在`supervise`目录中，其中status文件是二进制格式的，其它文件是文本格式的。

## svlogd

svslogd持续的从标准输入读取数据，然后将读取的数据写入到指定的目录中。

	svlogd [-tttv] [-r c] [-R xyz] [-l len] [-b buflen] logs

## 参考

1. [runit][1]
2. [runsvdir][2]
3. [runsv][3]
4. [svlogd][4]

[1]: http://smarden.org/runit/ "runit" 
[2]: http://smarden.org/runit/runsvdir.8.html "runsvdir"
[3]: http://smarden.org/runit/runsv.8.html  "runsv"
[4]: http://smarden.org/runit/svlogd.8.html "svlogd"
