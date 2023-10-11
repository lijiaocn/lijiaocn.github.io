--- 
layout: default
title: Linux上的物理网卡与虚拟网络设备
author: 李佶澳
createdate: 2017/03/31 18:47:12
last_modified_at: 2018/08/17 18:16:49
categories: 技巧
tags: linux network
keywords: tun设备,tap设备,tun/tap,veth,虚拟设备
description: 介绍了Linux中的网络设备，重点是tun、tap、veth等虚拟的网络设备。

---

## 目录
* auto-gen TOC:
{:toc}

## 物理网卡

![物理网卡工作原理]({{ site.imglocal }}/net-devices/nic-work.png)

## link device type

通过`ip link add`可以创建多种类型的虚拟网络设备，在`man ip link`中可以得知有以下类型的device:

	bridge - Ethernet Bridge device
	can - Controller Area Network interface
	dummy - Dummy network interface
	ifb - Intermediate Functional Block device
	ipoib - IP over Infiniband device
	macvlan - Virtual interface base on link layer address (MAC)
	vcan - Virtual Local CAN interface
	veth - Virtual ethernet interface
	vlan - 802.1q tagged virtual LAN interface
	vxlan - Virtual eXtended LAN
	ip6tnl - Virtual tunnel interface IPv4|IPv6 over IPv6
	ipip - Virtual tunnel interface IPv4 over IPv4
	sit - Virtual tunnel interface IPv6 over IPv4

## VEPA

Virtual Ethernet Port Aggregator。它是HP在虚拟化支持领域对抗Cisco的VN-Tag的技术。

解决了虚拟机之间网络通信的问题，特别是位于同一个宿主机内的虚拟机之间的网络通信问题。

VN-Tag在标准的协议头中增加了一个全新的字段，VEPA则是通过修改网卡驱动和交换机，通过发夹弯技术回注报文。

![vepa工作原理]({{ site.imglocal }}/net-devices/vepa-work.jpeg)

## TUN

TUN是Linux系统里的虚拟网络设备，它的原理和使用在[Kernel Doc][1]和[Wiki][2]做了比较清楚的说明。

TUN设备模拟网络层设备(network layer)，处理三层报文，IP报文等，用于将报文注入到网络协议栈。

![TUN设备工作原理]({{ site.imglocal }}/net-devices/tun-work.png)

应用程序(app)可以从物理网卡上读写报文，经过处理后通过TUN回送，或者从TUN读取报文处理后经物理网卡送出。

![利用TUN实现VPN]({{ site.imglocal }}/net-devices/tun-app-work.png)

### TUN设备创建

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

## TAP

TAP是Linux系统里的虚拟网络设备，它的原理和使用在[Kernel Doc][1]和[Wiki][2]做了比较清楚的说明。

不同于TUN的是，TAP设备模拟链路层设备(link layer)，处理二层报文，以太网帧等。

### TAP设备创建

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

## macvlan

有时我们可能需要一块物理网卡绑定多个 IP 以及多个 MAC 地址，虽然绑定多个 IP 很容易，但是这些 IP 会共享物理网卡的 MAC 地址，可能无法满足我们的设计需求，所以有了 MACVLAN 设备，其工作方式如下：

![macvlan工作原理]({{ site.imglocal }}/net-devices/macvlan-work.png)

MACVLAN 会根据收到包的目的 MAC 地址判断这个包需要交给哪个虚拟网卡。单独使用 MACVLAN 好像毫无意义，但是配合之前介绍的 network namespace 使用，我们可以构建这样的网络：

![macvlan工作原理2]({{ site.imglocal }}/net-devices/macvlan-work2.png)

![macvlan的工作原理3]({{ site.imglocal }}/net-devices/macvlan-work3.jpeg)

[采摘][4]

### macvlan使用

创建一个基于eth0的名为macv1的macvlan网卡:

	ip link add link eth0 name macv1 type macvlan 

macvlan支持三种模式，bridge、vepa、private，在创建的时候设置“mode XXX”:

![macvlan brige模式]({{ site.imglocal }}/net-devices/macvlan-bridge.jpeg)

bridge模式，macvlan网卡和物理网卡直接可以互通，类似于接入到同一个bridge。

![macvlan vepa模式]({{ site.imglocal }}/net-devices/macvlan-vepa.jpeg)

vepa模式下，两个macvlan网卡直接不能直接通信，必须通过外部的支持“发夹弯”交换机才能通信。

![macvlan vepa模式]({{ site.imglocal }}/net-devices/macvlan-private.jpeg)

private模式下，macvlan发出的广播包（arp等）被丢弃，即使接入了支持“发夹弯”的交换机也不能发现其它macvlan网卡，除非手动设置mac。

## macvtap

MACVTAP 是对 MACVLAN的改进，把 MACVLAN 与 TAP 设备的特点综合一下，使用 MACVLAN 的方式收发数据包，但是收到的包不交给 network stack 处理，而是生成一个 /dev/tapX 文件，交给这个文件：

![macvtap工作原理]({{ site.imglocal }}/net-devices/macvtap-work.png)

由于 MACVLAN 是工作在 MAC 层的，所以 MACVTAP 也只能工作在 MAC 层，不会有 MACVTUN 这样的设备。

## ipvlan

ipvlan和macvlan的区别在于它在ip层进行流量分离而不是基于mac地址，同属于一块宿主以太网卡的所有ipvlan虚拟网卡的mac地址都是一样的。

![ipvlan工作原理]({{ site.imglocal }}/net-devices/ipvlan-work.jpeg)

	ip link add link <master-dev> <slave-dev> type ipvlan mode { l2 | L3 }

## veth

![veth工作原理]({{ site.imglocal }}/net-devices/veth-work.jpeg)

veth设备是成对创建的：

	$ip link add vethA type veth peer name vethB

创建之后，执行`ip link`就可以看到新创建的veth设备：

	58: vethB@vethA: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN mode DEFAULT qlen 1000
	link/ether ee:1b:b0:11:38:eb brd ff:ff:ff:ff:ff:ff
	59: vethA@vethB: <BROADCAST,MULTICAST,M-DOWN> mtu 1500 qdisc noop state DOWN mode DEFAULT qlen 1000
	link/ether a6:f8:50:36:2d:1e brd ff:ff:ff:ff:ff:ff

注意veth设备前面的ID，`58:`和`59:`，一对veth设备的ID是相差1的，并且系统内全局唯一。可以通过ID找到一个veth设备的对端。

[veth设备理解][6]

## ifb

Intermediate Functional Block device，连接[ifb][7]中做了很详细的介绍。

## 参考

1. [Kernel Doc tuntap.txt][1]
2. [Wiki TUN/TAP][2]
3. [Linux网络虚拟化][3]
4. [TUN/TAP MACVLAN MACVTAP][4]
5. [图解几个与Linux网络虚拟化相关的虚拟网卡][5]
6. [veth设备理解][6]
7. [ifb][7]

[1]: https://www.kernel.org/doc/Documentation/networking/tuntap.txt  "kernel doc tuntap.txt" 
[2]: https://en.wikipedia.org/wiki/TUN/TAP "wiki TUN/TAP"
[3]: https://blog.kghost.info/2013/03/01/linux-network-emulator "Linux网络虚拟化"
[4]: https://blog.kghost.info/2013/03/27/linux-network-tun/ "TUN/TAP MACVLAN MACVTAP"
[5]: http://blog.csdn.net/dog250/article/details/45788279 "图解几个与Linux网络虚拟化相关的虚拟网卡"
[6]: https://segmentfault.com/a/1190000009251098 "veth设备理解"
[7]: https://wiki.linuxfoundation.org/networking/ifb "ifb"
