---
layout: default
title: Linux中的网络设备
author: lijiaocn
createdate: 2017/03/31 18:47:12
changedate: 2017/04/01 10:38:31
categories:
tags: 手册
keywords: tun设备,tap设备,tun/tap,veth,虚拟设备
description: 介绍了Linux中的网络设备，重点是tun、tap、veth等虚拟的网络设备。

---

* auto-gen TOC:
{:toc}

## TUN/TAP设备 

TUN/TAP是Linux系统里的虚拟网络设备，它们的原理和使用在[Kernel Doc][1]和[Wiki][2]做了比较清楚的说明。

TUN设备模拟网络层设备(network layer)，处理三层报文，IP报文等，用于将报文注入到网络协议栈。

TAP设备模拟链路层设备(link layer)，处理二层报文，以太网帧等。

### TUN设备

创建:



### TAP设备


## veth

## 参考

1. [Kernel Doc tuntap.txt][1]
2. [Wiki TUN/TAP][2]

[1]: https://www.kernel.org/doc/Documentation/networking/tuntap.txt  "kernel doc tuntap.txt" 
[2]: https://en.wikipedia.org/wiki/TUN/TAP "wiki TUN/TAP"
