---
layout: default
title: 在OpenWRT上使用tor
author: lijiaocn
createdate: 2017/06/12 21:57:40
changedate: 2017/06/17 10:32:33
categories: 项目
tags: openwrt tor
keywords: openwrt,tor,匿名网络,暗网
description: 将tor内置在Openwrt中，Wi-Fi连接后直接进入tor网络。

---

* auto-gen TOC:
{:toc}

## 安装tor 

可以自己编译openwrt的时候，将tor写在固件里，也可以用opkg安装:

	opkg install tor

## 启动tor

	/etc/init.d/tor enable
	/etc/init.d/tor start

tor的配置文件是/etc/tor/torrc，一般不需要更改，使用默认配置即刻。

默认情况下tor启动后，会在本地创建一个代理:

	127.0.0.1:9050

目标就是将流量从这个代理发出去。

## 创建or的无线热点

### 创建bridge

在/etc/config/network中添加：

	config interface 'tor'
		option type 'bridge'             #要使用bridge类型
		option ifname 'eth0.3'           #注意对命名格式有要求
		option proto 'static'
		option ipaddr '192.168.10.1'
		option netmask '255.255.255.0'

eth0.3表示是eth0网卡虚拟出的第三个网卡，执行`/etc/init.d/network reload`之后可以看到:

	23: eth0.3@eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP qlen 1000
	link/ether 78:a3:51:2b:69:06 brd ff:ff:ff:ff:ff:ff
	inet 192.168.10.1/24 brd 192.168.10.255 scope global eth0.3
	   valid_lft forever preferred_lft forever
	inet6 fe80::7aa3:51ff:fe2b:6906/64 scope link
	   valid_lft forever preferred_lft forever

注意要使用bridge模式，否则热点无法连接, [openwrt network config][4]中给出相关的说明。

### 配置dhcp

在/etc/config/dhcp中添加:

	config dhcp 'tor'
	    option interface    'tor'
	    option start        '100'
	    option limit        '150'
	    option leasetime    '1h'

### 添加热点

在/etc/config/wirelss中添加:
	
	config wifi-iface
	        option device 'radio1'      #无线网卡
	        option network 'tor'
	        option mode 'ap'
	        option ssid 'tor'
	        option encryption 'psk-mixed'
	        option key 'goodlife1'

这时候重启启动网络`/etc/init.d/network restart`，就会发现tor热点，可以连接。

### 配置防火墙，只允许tor网络访问tor代理

在/etc/config/firewall中添加:

	config zone
	    option name 'tor'
	    option input 'REJECT'
	    option output 'ACCEPT'
	    option forward 'REJECT'
	    option syn_flood 1
	    option conntrack '1'
	
	config rule
	    option name 'Allow-Tor-SOCKS'
	    option src 'tor'
	    option proto 'tcp'
	    option dest_port '9050'
	    option target 'ACCEPT'

### 设置转发规则

在/etc/firewall.user中添加:

	enable_transparent_tor() {
		iptables -t nat -A PREROUTING -i br-tor -p tcp --syn -j REDIRECT --to-ports 9050
	}
	enable_transparent_tor

## 参考

1. [Here is the Tor firmware][1]
2. [HOWTO: Transparent TOR proxy][2]
3. [tor manual][3]
4. [openwrt network config][4]

[1]: http://www.gl-inet.com/here-is-the-tor-firmware/?lang=en  "Here is the Tor firmware" 
[2]: https://forum.openwrt.org/viewtopic.php?id=27354 "HOWTO: Transparent TOR proxy" 
[3]: https://wiki.archlinux.org/index.php/Tor_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87) "tor"
[4]: https://wiki.openwrt.org/doc/uci/network "openwrt network config"
