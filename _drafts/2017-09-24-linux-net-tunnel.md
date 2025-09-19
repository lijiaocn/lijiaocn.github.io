---
layout: default
title: linux上的隧道、翻墙技术
author: lijiaocn
createdate: 2017/09/24 10:29:45
last_modified_at: 2017/09/24 13:27:23
categories: 技巧
tags: linuxnet
keywords: tunnel,隧道技术,翻墙
description: 

---

* auto-gen TOC:
{:toc}

## 说明 

## ssh隧道

[SSH隧道翻墙的原理和实现][2]

## ipip、gre、sit

[搭建网关系列 —— 隧道篇][1]中做了详细的介绍。

ip隧道，就是将普通的ip包封装到另外一个ip包里。

需要两端都有公网IP。

A端建立ipip tunnel，B端公网ip是`1.2.3.4`，A端隧道的虚拟ip是`192.168.0.1`。

	ip tunnel add tun0 mode ipip remote 1.2.3.4 ttl 255
	ip addr add 192.168.0.1/32 dev tun0
	ip link set tun0 up
	ip route add 192.168.0.2/32 dev tun0 scope link src 192.168.0.1

在B端用类似的方式建立ipip tunnel。

在A端设置路由，比如:

	ip route add 8.8.8.8 dev tun0

在B端设置转发，`remotevip`是B端隧道的虚拟IP:

	sysctl -w net.ipv4.ip_forward=1
	iptables -t nat -A POSTROUTING -s $remotevip/32 -j MASQUERADE

## openvpn

[Debian wiki: OpenVPN][4]中有详细的介绍，安装:

	apt-get install openvpn

### Static-Key VPN

vpn虚拟网段是10.9.8.X，服务端虚拟地址是10.9.8.1，客户端虚拟地址是10.9.8.2。

生成key，`在服务端和客户端都放置一份`:

	openvpn --genkey --secret /etc/openvpn/static.key

服务端创建配置文件`/etc/openvpn/tun0.conf`:

	dev tun0
	ifconfig 10.9.8.1 10.9.8.2
	secret /etc/openvpn/static.key

服务端启动:

	/etc/init.d/openvpn start

服务端启动后，可以看到:

	3: tun0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UNKNOWN qlen 100
		link/none
		inet 10.9.8.1 peer 10.9.8.2/32 scope global tun0
	
	$ps aux|grep openvpn
	root      2307  0.0  0.1  22028  1496 ?        Ss   03:22   0:00 /usr/sbin/openvpn --writepid /var/run/openvpn.tun0.pid --daemon ovpn-tun0 --status /var/run/openvpn.tun0.status 10 --cd /etc/openvpn --config /etc/openvpn/tun0.conf

服务端默认监听端口是`udp 1194`

	# netstat -lnup |grep 1194
	udp        0      0 0.0.0.0:1194         0.0.0.0:*        2307/openvpn

客户端创建配置文件`/etc/openvpn/tun0.conf`:

	remote <服务端的公网IP>
	dev tun0
	ifconfig 10.9.8.2 10.9.8.1
	secret /etc/openvpn/static.key

客户端启动:

	/etc/init.d/openvpn start

客户端启动后可以看到:

	19: tun0: <POINTOPOINT,MULTICAST,NOARP,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UNKNOWN group default qlen 100
		link/none
		inet 10.9.8.2 peer 10.9.8.1/32 scope global tun0
		   valid_lft forever preferred_lft forever
	
	$ps |grep openvpn
	30196 root      3164 S    /usr/sbin/openvpn --syslog openvpn(tun0) --status /var/run/openvpn.tun0.status --cd /etc/openvpn --config /etc/openvpn/tun0.conf

在客户端可以访问到服务端地址:

	$ping 10.9.8.1
	PING 10.9.8.1 (10.9.8.1): 56 data bytes
	64 bytes from 10.9.8.1: seq=0 ttl=64 time=176.255 ms
	64 bytes from 10.9.8.1: seq=1 ttl=64 time=176.993 ms

### 代理访问

如果要通过openvpn进行代理访问，需要在openvpn的服务端进行设置。

开启服务端转发功能:

	echo "net.ipv4.ip_forward = 1" >>/etc/sysctl.conf
	sysctl -p 

设置服务端代理规则:

	iptables -A FORWARD -i eth0 -o tun0 -m state --state ESTABLISHED,RELATED -j ACCEPT
	iptables -A FORWARD -s 10.9.8.0/24 -o eth0 -j ACCEPT
	iptables -t nat -A POSTROUTING -s 10.9.8.0/24 -o eth0 -j MASQUERADE

在client端设置要代理的流量，client的虚拟IP是`10.9.8.2`:

	ip route add VPNSERVER_IP via LOCALGATEWAY_IP dev eth0  proto static
	ip route change default via 10.9.8.2 dev tun0  proto static   

## 参考

1. [搭建网关系列 —— 隧道篇][1]
2. [SSH隧道翻墙的原理和实现][2]
3. [how-to-set-up-an-openvpn-server-on-debian-8][3]
4. [Debian wiki: OpenVPN][4]

[1]: https://onebitbug.me/2014/06/03/building-a-gateway-tunnel/ "搭建网关系列 —— 隧道篇" 
[2]: http://www.pchou.info/linux/2015/11/01/ssh-tunnel.html  "SSH隧道翻墙的原理和实现"
[3]: https://www.digitalocean.com/community/tutorials/how-to-set-up-an-openvpn-server-on-debian-8 "how-to-set-up-an-openvpn-server-on-debian-8"
[4]: https://wiki.debian.org/OpenVPN  "Debian wiki: OpenVPN"
