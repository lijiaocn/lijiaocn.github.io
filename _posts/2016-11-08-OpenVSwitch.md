---
layout: default
title: ovs: OpenVSwitch的使用
author: 李佶澳
createdate: 2016/11/08 11:33:15
last_modified_at: 2017/10/28 12:38:10
categories: 项目
tags: manual
keywords:
description: 

---

## 目录
* auto-gen TOC:
{:toc}

## 摘要

[openvswitch](http://openvswitch.org/)

## 抓包 ovs-tcpdump

安装ovs python库:

	cd openvswitch-2.6.1/python
	python ./setup.py install

安装依赖: 

	yum install -y python-netifaces

手册：

	man ovs-tcpdump
	
	ovs-tcpdump -i port tcpdump options...

原理：

	ovs-tcpdump creates switch mirror ports in the ovs-vswitchd daemon and executes tcpdump to listen against those ports. 
	When the tcpdump instance exits, it then cleans up the mirror port it created

在ovs的指定port上抓包:

	ovs-tcpdump -i br-int -w br-int.pcap

## 流表 ovs-ofctl

手册：

	man ovs-ofctl

查看流表:

	ovs-ofctl dump-flows br-tun

查看port收发包情况:

	ovs-ofctl dump-ports br-tun

## 文献
