---
layout: default
title: "MacOS上的常用操作"
author: 李佶澳
date: "2021-05-19 22:09:16 +0800"
last_modified_at: "2021-05-19 22:09:16 +0800"
categories: 技巧
cover:
tags: mac
keywords: mac,route,苹果电脑,设置路由
description: macOS上的常用操作
---

## 本篇目录

* auto-gen TOC:
{:toc}


## 添加 vpn 路由 

netstat命令可以查看本地所有路由：

	$ netstat -nr
	Routing tables
	
	Internet:
	Destination        Gateway            Flags        Refs      Use   Netif Expire
	default            link#18            UCS           130        0   utun2
	default            172.16.111.254     UGScI           7        0     en0
	8.8.8.8            link#18            UHWIi           2      280   utun2
	10.7.1.181         10.7.1.181         UH              0       11   utun2
	...

这里第一条默认路由，就是ipsec vpn 的网卡地址，可以看到代理了所有默认流量。

vpn使用的地址10.7.1.181，幸好和内网机器网段不重复，添加内网机器的路由：

	route -n add -net 10.10.0.0 -netmask 255.255.0.0  172.16.111.254

172.16.111.254是本地物理网卡(en0)的IP。

## 查看监听的端口和连接

查看 tcp 监听端口，在 linux 上是 netstat -lnt，在 macOS 中是：

```sh
$ netstat -n -a -p tcp |grep "LISTEN"

# -n:     含义与 linux 相同，显示数字
# -a:     显示所有 socket，带有这个参数，才能显示监听端口
# -p tcp: 指定 tcp 协议
#
# 最后用 grep 将监听状态的 socket 过滤出来
```

如下：

```sh
$ netstat -n -a -p tcp  |grep "LISTEN"
tcp46      0      0  *.5002                 *.*                    LISTEN
tcp4       0      0  127.0.0.1.51526        *.*                    LISTEN
tcp4       0      0  127.0.0.1.63886        *.*                    LISTEN
tcp46      0      0  *.80                   *.*                    LISTEN
...
```

## 查找监听端口的进程

在 linux 上 netstat 的 -p 参数会显示连接或者 socket 所属的进程号和程序名称，macOS 的 netstat 没有类似的选项，需要用其它方法找到监听端口的进程。 **lsof** 是最好的选择之一，在 macOS 上的用法和在 linux 中的用法相同：

```sh
# 查找监听 80 端口的进程
$ lsof -n -i :80 |grep LISTEN
com.docke  6777 lijiao   35u  IPv6 0x65955d0d6aba74bb      0t0  TCP *:http (LISTEN)

# -i，指定网络地址
```

[使用 lsof 代替 Mac OS X 中的 netstat 查看占用端口的程序](https://tonydeng.github.io/2016/07/07/use-lsof-to-replace-netstat/)

## 关闭键盘提示音

Mac的键盘提示音“咚咚咚” 的真的很烦人，特别是带着耳机工作的时候，不停地响。

点击右上角的“`系统偏好设置`”，选择“`辅助功能`”，图标是小人形状的那个，然后在左侧选择“`音频`”。

在音频面板的下方有一个按钮“`打开声音偏好设置`”，点击后进入系统提示音设置页面，把“`播放用户界面声音效果`”关掉：

![关闭系统提示音]({{ site.imglocal }}/mac/mac-sys-voice.png)

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"

