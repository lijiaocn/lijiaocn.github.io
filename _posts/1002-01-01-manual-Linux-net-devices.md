---
layout: default
title: Linux中的网络设备
author: lijiaocn
createdate: 2017/03/31 18:47:12
changedate: 2017/04/01 15:15:20
categories:
tags: 手册
keywords: tun设备,tap设备,tun/tap,veth,虚拟设备
description: 介绍了Linux中的网络设备，重点是tun、tap、veth等虚拟的网络设备。

---

* auto-gen TOC:
{:toc}

## 网络namespace

网络namespace是一个独立的网络协议栈，通过网络namespace，可以将网络设备分隔开，设置独立的路由规则、防火墙规则等。

>一个设备只能属于一个namespace。

	man ip-netns

可以通过`ip netns [NAMESPACE] [CMD...] `在指定的namespace中操作，例如：

	//查看名为AAA的ns中的网络设备
	ip netns AAA ip link

创建ns1:

	ip netns add ns1

查看ns1中的设备:

	ip netns exec ns1 ip link
	1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN mode DEFAULT qlen 1
	    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00

将网卡eth1添加到ns1中:

	$ip link set eth1 netns ns1

	$ip netns exec ns1 ip link
	1: lo: <LOOPBACK> mtu 65536 qdisc noop state DOWN mode DEFAULT qlen 1
	    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
	3: eth1: <BROADCAST,MULTICAST> mtu 1500 qdisc noop state DOWN mode DEFAULT qlen 1000
	    link/ether 08:00:27:b3:6c:38 brd ff:ff:ff:ff:ff:ff

将网卡eth1重新添加到默认的ns中:

	ip netns exec ns1 ip link set eth1 netns 1

>注意必须在ns1中设置，最后一个1表示，进程1所在的namespace。

删除netns：

	ip netns delete ns1

## TUN/TAP设备 

TUN/TAP是Linux系统里的虚拟网络设备，它们的原理和使用在[Kernel Doc][1]和[Wiki][2]做了比较清楚的说明。

TUN设备模拟网络层设备(network layer)，处理三层报文，IP报文等，用于将报文注入到网络协议栈。

TAP设备模拟链路层设备(link layer)，处理二层报文，以太网帧等。

### TUN设备

创建:

	int tun_alloc(char *dev)
	{
		struct ifreq ifr;
		int fd, err;

		if( (fd = open("/dev/net/tun", O_RDWR)) < 0 ){
			printf("open /dev/net/tun fail\n");
			return -1;
		}

		memset(&ifr, 0, sizeof(ifr));

		/* Flags: IFF_TUN   - TUN device (no Ethernet headers) 
		 *        IFF_TAP   - TAP device  
		 *
		 *        IFF_NO_PI - Do not provide packet information  
		 */ 
		ifr.ifr_flags = IFF_TUN; 
		if( *dev )
			strncpy(ifr.ifr_name, dev, IFNAMSIZ);

		if( (err = ioctl(fd, TUNSETIFF, (void *) &ifr)) < 0 ){
			close(fd);
			return err;
		}
		strcpy(dev, ifr.ifr_name);
		return fd;
	}              

	int fd = tun_alloc("tun-default");

	if (fd == -1) {
		printf("create error: %d\n", fd);
		return;
	}

	while(1){
		sleep(1000);
	}

创建之后，使用`ip addr`就会看见一个名为"tun-default"的虚拟网卡

>注意：如果程序退出，关闭了fd，虚拟网卡也会随之消失。

	$ip addr
	1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
	    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
	    inet 127.0.0.1/8 scope host lo
	       valid_lft forever preferred_lft forever
	    inet6 ::1/128 scope host
	       valid_lft forever preferred_lft forever
	2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
	    link/ether 52:54:00:bd:97:1e brd ff:ff:ff:ff:ff:ff
	    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic eth0
	       valid_lft 81917sec preferred_lft 81917sec
	    inet6 fe80::5054:ff:febd:971e/64 scope link
	       valid_lft forever preferred_lft forever
	4: tun-default: <POINTOPOINT,MULTICAST,NOARP> mtu 1500 qdisc noop state DOWN qlen 500
	    link/none

可以对tun-default设置IP:

	$sudo ip addr add 1.1.1.1 dev tun-default

	$ip addr
	1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1
	    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
	    inet 127.0.0.1/8 scope host lo
	       valid_lft forever preferred_lft forever
	    inet6 ::1/128 scope host
	       valid_lft forever preferred_lft forever
	2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc pfifo_fast state UP qlen 1000
	    link/ether 52:54:00:bd:97:1e brd ff:ff:ff:ff:ff:ff
	    inet 10.0.2.15/24 brd 10.0.2.255 scope global dynamic eth0
	       valid_lft 81806sec preferred_lft 81806sec
	    inet6 fe80::5054:ff:febd:971e/64 scope link
	       valid_lft forever preferred_lft forever
	4: tun-default: <POINTOPOINT,MULTICAST,NOARP> mtu 1500 qdisc noop state DOWN qlen 500
	    link/none
	    inet 1.1.1.1/32 scope global tun-default
	       valid_lft forever preferred_lft forever

使用open/write等文件操作函数从fd中进行读取操作，就是在收取报文，向fd中写入数据，就是在发送报文。

### TAP设备

TAP设备的创建过程和TUN类似，在ioctl设置的时候，将类型设置为IFF_TAP即可。

		/* Flags: IFF_TUN   - TUN device (no Ethernet headers) 
		 *        IFF_TAP   - TAP device  
		 *
		 *        IFF_NO_PI - Do not provide packet information  
		 */ 
		ifr.ifr_flags = IFF_TAP;     //<--- TAP设备
		if( *dev )
			strncpy(ifr.ifr_name, dev, IFNAMSIZ);

		if( (err = ioctl(fd, TUNSETIFF, (void *) &ifr)) < 0 ){
			close(fd);
			return err;
		}
		strcpy(dev, ifr.ifr_name);
		return fd;

TAP设备与TUN设备的区别在于:

	TAP虚拟的是一个二层设备，具有MAC地址，接收、发送的是二层包。
	TUN虚拟的是一个三层设备，没有MAC地址，接收、发送的是三层包。

## 通过ip link add添加的虚拟设备

命令`ip link add ...`可以创建多种类型的虚拟网络设备。

在手册：

	ip link help add

中可以看到，可以创建以下几种类型的device:

	TYPE := { vlan | veth | vcan | dummy | ifb | macvlan | macvtap |
	          bridge | bond | ipoib | ip6tnl | ipip | sit | vxlan |
	          gre | gretap | ip6gre | ip6gretap | vti | nlmon |
	          bond_slave | geneve | macsec }

可以通过`ip link help [TYPE]`的方式查看每种类型设备的使用，例如:

	$ip link help vlan
	Usage: ... vlan [ protocol VLANPROTO ] id VLANID                [ FLAG-LIST ]
	                [ ingress-qos-map QOS-MAP ] [ egress-qos-map QOS-MAP ]
	
	VLANPROTO: [ 802.1Q / 802.1ad ]
	VLANID := 0-4095
	FLAG-LIST := [ FLAG-LIST ] FLAG
	FLAG := [ reorder_hdr { on | off } ] [ gvrp { on | off } ] [ mvrp { on | off } ]
	        [ loose_binding { on | off } ]
	QOS-MAP := [ QOS-MAP ] QOS-MAPPING
	QOS-MAPPING := FROM:TO

### vlan

### veth





## 参考

1. [Kernel Doc tuntap.txt][1]
2. [Wiki TUN/TAP][2]

[1]: https://www.kernel.org/doc/Documentation/networking/tuntap.txt  "kernel doc tuntap.txt" 
[2]: https://en.wikipedia.org/wiki/TUN/TAP "wiki TUN/TAP"
