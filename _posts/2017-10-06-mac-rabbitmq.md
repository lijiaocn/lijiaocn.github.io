---
layout: default
title: 在mac上部署rabbitmq
author: 李佶澳
createdate: 2017/11/06 10:54:40
last_modified_at: 2017/11/06 12:40:47
categories: 技巧
tags: mac
keywords: mac,rabbitmq,开发环境,软件开发
description: 可以直接在mac上部署rabbitmq，方便开发调试

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

可以直接在mac上安装rabbitmq，方便开发调试。

## 用brew安装

直接用brew安装：

	brew search  rabbitmq
	brew install rabbitmq

安装成功后提示：

	Man pages can be found in:
	  /usr/local/opt/erlang@19/lib/erlang/man
	Access them with `erl -man`, or add this directory to MANPATH.
	
	This formula is keg-only, which means it was not symlinked into /usr/local,
	because this is an alternate version of another formula.
	
	If you need to have this software first in your PATH run:
	  echo 'export PATH="/usr/local/opt/erlang@19/bin:$PATH"' >> ~/.bash_profile
	
	For compilers to find this software you may need to set:
	    LDFLAGS:  -L/usr/local/opt/erlang@19/lib
	...
	
	Bash completion has been installed to:
	  /usr/local/etc/bash_completion.d
	
	To have launchd start rabbitmq now and restart at login:
	  brew services start rabbitmq
	Or, if you don't want/need a background service you can just run:
	  rabbitmq-server

设置环境变量后启动:

	echo 'export PATH="/usr/local/opt/erlang@19/bin:$PATH"' >> ~/.bash_profile
	echo  'export PATH="/usr/local/opt/rabbitmq/sbin/:$PATH"' >> ~/.bash_profile
	soruce ~/.bash_profile
	brew services start rabbitmq

访问：

	$ rabbitmqctl   list_vhosts
	Listing vhosts
	/

## 参考

1. [百度经验：怎样在mac上部署rabbitmq服务][1]

[1]:   "百度经验：怎样在mac上部署rabbitmq服务" 
