---
layout: default
title: 在mac上部署redis服务
author: lijiaocn
createdate: 2017/11/06 10:14:25
changedate: 2017/11/06 10:37:35
categories: 技巧
tags: mac
keywords: mac,redis-server,brew,
description: 在mac上做开发，还是将一些常用的服务部署在mac上比较方便

---

* auto-gen TOC:
{:toc}

## 说明 

在mac上做开发，还是将一些常用的服务部署在mac上比较方便

## 使用brew安装

使用brew搜索、安装redis:

	brew search redis
	brew install redis@3.2

安装成功后，brew提示：

	If you need to have this software first in your PATH run:
	  echo 'export PATH="/usr/local/opt/redis@3.2/bin:$PATH"' >> ~/.bash_profile
	
	
	To have launchd start redis@3.2 now and restart at login:
	  brew services start redis@3.2
	Or, if you don't want/need a background service you can just run:
	  redis-server /usr/local/etc/redis.conf

按照提示设置环境变量：

	echo 'export PATH="/usr/local/opt/redis@3.2/bin:$PATH"' >> ~/.bash_profile
	srouce ~/.bash_profile

启动redis:

	  brew services start redis@3.2

通过`brew services list`查看服务的状态：

	$ brew services list
	Name       Status  User   Plist
	dbus       stopped
	dnsmasq    started root   /Library/LaunchDaemons/homebrew.mxcl.dnsmasq.plist
	mysql      started lijiao /Users/lijiao/Library/LaunchAgents/homebrew.mxcl.mysql.plist
	openvpn    stopped
	redis@3.2  started lijiao /Users/lijiao/Library/LaunchAgents/homebrew.mxcl.redis@3.2.plist
	supervisor stopped

连接到本地的redis:

	lijiaos-MacBook-Pro:Desktop lijiao$ redis-cli -h 127.0.0.1
	127.0.0.1:6379> set  a 1
	OK
	127.0.0.1:6379> get a
	"1"
	127.0.0.1:6379> set key value [EX seconds] [PX milliseconds] [NX|XX]
	lijiaos-MacBook-Pro:Desktop lijiao$ redis-cli -h 127.0.0.1
	127.0.0.1:6379> set a 1
	OK
	127.0.0.1:6379> get a
	"1"
	127.0.0.1:6379> set key value [EX seconds] [PX milliseconds] [NX|XX]

mac上的reids-cli会自动给出提示。

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
