---
layout: default
title: Linux中的网络设备
author: lijiaocn
createdate: 2017/03/31 18:47:12
changedate: 2017/05/15 18:35:05
categories: 手册
tags: linux
keywords: tun设备,tap设备,tun/tap,veth,虚拟设备
description: 介绍了Linux中的网络设备，重点是tun、tap、veth等虚拟的网络设备。

---

* auto-gen TOC:
{:toc}

## namespace

namespace是一个独立的网络协议栈，通过namespace，可以将网络设备分隔开，设置独立的路由规则、防火墙规则等。

一个设备只能属于一个namespace。

	man ip-netns

可以通过`ip netns [NAMESPACE] [CMD...] `在指定的namespace中操作，例如：

	//查看名为AAA的ns中的网络设备
	ip netns AAA ip link

### 基本操作

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

注意必须在ns1中设置，最后一个1表示，进程1所在的namespace。

删除netns：

	ip netns delete ns1

[文献3][3]中给出了一个利用veth连接两个namespace的例子。

### 利用veth连接两个namespace

	ip netns add net0
	ip netns add net1
	ip link add type veth

	ip link set veth0 netns net0
	ip link set veth1 netns net1

	ip netns exec net0 ip link set veth0 up
	ip netns exec net0 ip address add 10.0.1.1/24 dev veth0

	ip netns exec net1 ip link set veth1 up
	ip netns exec net1 ip address add 10.0.1.2/24 dev veth1

	ip netns exec net1 ping 10.0.1.1
	PING 10.0.1.1 (10.0.1.1) 56(84) bytes of data.
	64 bytes from 10.0.1.1: icmp_seq=1 ttl=64 time=0.036 ms
	64 bytes from 10.0.1.1: icmp_seq=2 ttl=64 time=0.066 ms

### 两个namespace连接到bridge

![ns连接到网桥]({{ site.imglocal }}/ns-bridge.png)

创建三个ns，并利用veth连接:

	ip netns add net0
	ip netns add net1
	ip netns add bridge
	ip link add type veth
	ip link set dev veth0 name net0-bridge netns net0       //重新命名
	ip link set dev veth1 name bridge-net0 netns bridge
	ip link add type veth
	ip link set dev veth0 name net1-bridge netns net1
	ip link set dev veth1 name bridge-net1 netns bridge

配置bridge，将另外两个ns的对端veth设备接入bridge:

	ip netns exec bridge brctl addbr br
	ip netns exec bridge ip link set dev br up
	ip netns exec bridge ip link set dev bridge-net0 up
	ip netns exec bridge ip link set dev bridge-net1 up
	ip netns exec bridge brctl addif br bridge-net0
	ip netns exec bridge brctl addif br bridge-net1

配置两个ns中的veth设备:

	ip netns exec net0 ip link set dev net0-bridge up
	ip netns exec net0 ip address add 10.0.1.1/24 dev net0-bridge

	ip netns exec net1 ip link set dev net1-bridge up
	ip netns exec net1 ip address add 10.0.1.2/24 dev net1-bridge


## VEPA技术

Virtual Ethernet Port Aggregator。它是HP在虚拟化支持领域对抗Cisco的VN-Tag的技术。解决了虚拟机之间网络通信的问题，特别是位于同一个宿主机内的虚拟机之间的网络通信问题。

VN-Tag在标准的协议头中增加了一个全新的字段，VEPA则是通过修改网卡驱动和交换机，通过发夹弯技术回注报文。

![vepa工作原理]({{ site.imglocal }}/vepa-work.jpeg)

## 物理网卡

![物理网卡工作原理]({{ site.imglocal }}/nic-work.png)


## TUN设备

TUN是Linux系统里的虚拟网络设备，它的原理和使用在[Kernel Doc][1]和[Wiki][2]做了比较清楚的说明。

TUN设备模拟网络层设备(network layer)，处理三层报文，IP报文等，用于将报文注入到网络协议栈。

![TUN设备工作原理]({{ site.imglocal }}/tun-work.png)

应用程序(app)可以从物理网卡上读写报文，经过处理后通过TUN回送，或者从TUN读取报文处理后经物理网卡送出。

![利用TUN实现VPN]({{ site.imglocal }}/tun-app-work.png)

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

## TAP设备

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

![macvlan工作原理]({{ site.imglocal }}/macvlan-work.png)

MACVLAN 会根据收到包的目的 MAC 地址判断这个包需要交给哪个虚拟网卡。单独使用 MACVLAN 好像毫无意义，但是配合之前介绍的 network namespace 使用，我们可以构建这样的网络：

![macvlan工作原理2]({{ site.imglocal }}/macvlan-work2.png)

![macvlan的工作原理3]({{ site.imglocal }}/macvlan-work3.jpeg)

[采摘][4]

### macvlan使用

创建一个基于eth0的名为macv1的macvlan网卡:

	ip link add link eth0 name macv1 type macvlan 

macvlan支持三种模式，bridge、vepa、private，在创建的时候设置“mode XXX”:

![macvlan brige模式]({{ site.imglocal }}/macvlan-bridge.jpeg)

bridge模式，macvlan网卡和物理网卡直接可以互通，类似于接入到同一个bridge。

![macvlan vepa模式]({{ site.imglocal }}/macvlan-vepa.jpeg)

vepa模式下，两个macvlan网卡直接不能直接通信，必须通过外部的支持“发夹弯”交换机才能通信。

![macvlan vepa模式]({{ site.imglocal }}/macvlan-private.jpeg)

private模式下，macvlan发出的广播包（arp等）被丢弃，即使接入了支持“发夹弯”的交换机也不能发现其它macvlan网卡，除非手动设置mac。

## macvtap

MACVTAP 是对 MACVLAN的改进，把 MACVLAN 与 TAP 设备的特点综合一下，使用 MACVLAN 的方式收发数据包，但是收到的包不交给 network stack 处理，而是生成一个 /dev/tapX 文件，交给这个文件：

![macvtap工作原理]({{ site.imglocal }}/macvtap-work.png)

由于 MACVLAN 是工作在 MAC 层的，所以 MACVTAP 也只能工作在 MAC 层，不会有 MACVTUN 这样的设备。

[采摘][4]

## ipvlan

ipvlan和macvlan的区别在于它在ip层进行流量分离而不是基于mac地址，同属于一块宿主以太网卡的所有ipvlan虚拟网卡的mac地址都是一样的。

![ipvlan工作原理]({{ site.imglocal }}/ipvlan-work.png)

	ip link add link <master-dev> <slave-dev> type ipvlan mode { l2 | L3 }

## veth

![veth工作原理]({{ site.imglocal }}/veth-work.jpeg)

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


## 参考

1. [Kernel Doc tuntap.txt][1]
2. [Wiki TUN/TAP][2]
3. [Linux网络虚拟化][3]
4. [TUN/TAP MACVLAN MACVTAP][4]
5. [图解几个与Linux网络虚拟化相关的虚拟网卡][5]

[1]: https://www.kernel.org/doc/Documentation/networking/tuntap.txt  "kernel doc tuntap.txt" 
[2]: https://en.wikipedia.org/wiki/TUN/TAP "wiki TUN/TAP"
[3]: https://blog.kghost.info/2013/03/01/linux-network-emulator "Linux网络虚拟化"
[4]: https://blog.kghost.info/2013/03/27/linux-network-tun/ "TUN/TAP MACVLAN MACVTAP"
[5]: http://blog.csdn.net/dog250/article/details/45788279 "图解几个与Linux网络虚拟化相关的虚拟网卡"
