---
layout: default
title: OpenWrt安装到TP-Link的WR703N路由器
author: lijiaocn
createdate: 2017/05/20 16:25:19
changedate: 2017/09/11 16:17:47
categories: 技巧
tags: openwrt
keywords: openwrt,tp-link,安装,TL-WR703N
description: 在TL-WR703N中安装OpenWrt的方法。

---

* auto-gen TOC:
{:toc}

## 下载固件 

到[openwrt dowload][1]中下载对应的固件。TL-WR703N的硬件架构是`ar71xx`。

在`ar71xx/geneirc`目录下，有用于wr703n的路由器固件：

	openwrt-15.05-ar71xx-generic-tl-wr703n-v1-squashfs-factory.bin
	openwrt-15.05-ar71xx-generic-tl-wr703n-v1-squashfs-sysupgrade.bin

## 升级固件

在路由器的管理页面中进行固件升级，升级为下载的openwrt固件。

升级过程很慢，不要掉电。

## 变砖处理

网上有大神通过[接入串口线的方式][4]方式救砖成功了，其实不用这么麻烦。

准备一根网线，将路由器和电脑直联，普通网线即可。

将电脑上的接入了网线的网卡地址设置为192.168.1.2。

然后安装reset，直到指示灯变成狂闪，这时候可以在电脑上用telnet访问192.168.1.1。

>悲剧！无论怎样按reset，都进不去安全模式啊。。。。

## 参考

1. [openwrt dowload][1]
2. [openwrt for wr703n][2]
3. [tp-link wr703n openwrt刷机][3]
4. [tp-link wr703N完帐救砖过程][4]
5. [openwrt on pi][5]
6. [openwrt 安全模式][6]

[1]: https://downloads.openwrt.org/ "openwrt download"
[2]: https://downloads.openwrt.org/chaos_calmer/15.05/ar71xx/generic/ "openwrt for wr703n"
[3]: http://www.jb51.net/network/113081.html "tp-link wr703n openwrt刷机教程"
[4]: http://www.92ez.com/?action=show&id=3 "tp-link wr703N完整救砖过程"
[5]: http://shumeipai.nxez.com/2015/07/28/install-openwrt-will-be-transformed-into-a-versatile-router-raspberry-pi.html "openwrt on pi"
[6]: http://www.hiadmin.org/2013/07/23/wr703-openwrt/ "openwrt安全模式"
