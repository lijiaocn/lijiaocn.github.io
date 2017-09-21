---
layout: default
title: netcat的使用
author: lijiaocn
createdate: 2017/09/04 16:32:45
changedate: 2017/09/21 19:25:37
categories: 技巧
tags: linuxtool
keywords: netcat,usage,linux
description: netcat在两台电脑之间建立连接并传递数据流，可以做一些很“巧妙”的事情

---

* auto-gen TOC:
{:toc}

## 说明 

[linux-netcat-command][1]中做了很详细的介绍，以及很多巧妙的用法。

## 安装

	yum install -y nmap-ncat

## 端口扫描

用nc进行端口扫描，就是用于nc去尝试连接端口，连接成功立即关闭，发送数据:

	nc -z -v -n 172.31.100.7 21-25
	
	可以运行在TCP或者UDP模式，默认是TCP，-u参数调整为udp.
	z 参数告诉netcat使用0 IO,连接成功后立即关闭连接， 不进行数据交换(谢谢@jxing 指点)
	v 参数指使用冗余选项（译者注：即详细输出）
	n 参数告诉netcat 不要使用DNS反向查询IP地址的域名 

## 同步显示

Server:

	nc -v l 1567

Client使用nc连接上Server后，在Client端的任何输入都会在Server端同步显示。

	nc 127.0.0.1 1567

## 参考

1. [linux-netcat-command][1]

[1]: https://www.oschina.net/translate/linux-netcat-command "linux-netcat-command" 
