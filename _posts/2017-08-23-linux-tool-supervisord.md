---
layout: default
title: "supervisord：进程管理工具supervisord"
author: 李佶澳
createdate: 2017/08/23 13:48:02
last_modified_at: 2018/07/22 14:28:06
categories: 技巧
tags: linuxtool
keywords: supervisord,进程管理
description: supervisord是一个工作在"Unix-like OS"上的进程管理工具。

---

## 目录
* auto-gen TOC:
{:toc}

## 介绍 

[supervisord][1]是一个工作在"Unix-like OS"上的进程管理工具。

supervisord是client/server架构，supervisorctl是client端用来操作后台服务supervisord。

## 启动

直接运行程序supervisord即可，默认会自动转入后台运行。

## supervisord.conf

supervisord.conf是supervisord启动的时候传入的配置文件，section settings组成:

	[unix_http_server]
	...
	[inet_http_server]
	...
	[supervisord]
	...
	[supervisorctl]
	...
	[include]
	...
	[program:x]
	...
	[group:x]
	...
	[fcgi-program:x]
	...
	[eventlistener:x]
	...
	[rpcinterface:x]
	...

其中[program:x]配置的是由supervisord管理的子进程，[program-x-section-settings][2]：

	command
	startretries
	exitcodes
	redirect_stderr
	stdout_logfile_maxbytes
	stderr_logfile_backups
	stdout_logfile

## 参考

1. [supervisord][1]
2. [program-x-section-settings][2]

[1]: http://supervisord.org/  "supervisord" 
[2]: http://supervisord.org/configuration.html#program-x-section-settings  "program-x-section-settings" 
