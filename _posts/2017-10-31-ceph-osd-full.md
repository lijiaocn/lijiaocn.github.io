---
layout: default
title: Ceph出现"1 full osd(s)"，整个集群不可用的问题调查
author: lijiaocn
createdate: 2017/10/31 19:53:40
changedate: 2017/10/31 20:49:41
categories: 问题
tags: ceph
keywords: osd is full, ceph,osd
description: 一个osd使用超过95%，导致整个ceph集群不可用。

---

* auto-gen TOC:
{:toc}

## 问题描述 

一个服务连接不上ceph的对象存储网关，重启ceph对象存储网关，也不生效。

ceph服务网关的日志如下:

	2017-10-31 19:51:21.158008 7f3b789b99c0  0 deferred set uid:gid to 167:167 (ceph:ceph)
	2017-10-31 19:51:21.158206 7f3b789b99c0  0 ceph version 10.2.7 (50e863e0f4bc8f4b9e31156de690d765af245185), process radosgw, pid 1321
	2017-10-31 19:51:21.244854 7f3b789b99c0  0 client.34193.objecter  FULL, paused modify 0x7f3b7a1388d0 tid 0
	2017-10-31 19:56:21.158388 7f3b5dc9b700 -1 Initialization timeout, failed to initialize
	2017-10-31 19:56:21.410096 7f918b9bb9c0  0 deferred set uid:gid to 167:167 (ceph:ceph)
	2017-10-31 19:56:21.410202 7f918b9bb9c0  0 ceph version 10.2.7 (50e863e0f4bc8f4b9e31156de690d765af245185), process radosgw, pid 1459
	2017-10-31 19:56:21.546455 7f918b9bb9c0  0 client.34214.objecter  FULL, paused modify 0x7f918d689c70 tid 0

使用`ceph health`查看发现：

	$ ceph health
	1 full osd(s); pool default.rgw.buckets.data has many more objects per pg than average (too few pgs?); full flag(s) set;

## 问题解决

[Ceph集群磁盘没有剩余空间的解决方法][1]提到:

	根据Ceph官方文档中的描述，当一个OSD full比例达到95%时，集群将不接受任何Ceph Client端的读写数据的请求。

通过命令`ceph osd df`，发现一个osd使用空间超过95:

	$ ceph osd df
	ID WEIGHT  REWEIGHT SIZE  USE    AVAIL  %USE  VAR  PGS
	 0 0.48799  1.00000  499G   295G   204G 59.17 1.32  47
	 5 0.97609  1.00000  999G 56253M   944G  5.50 0.12  84
	 1 0.48799  1.00000  499G   341G   158G 68.33 1.53  64
	 6 0.48318  1.00000  494G 42432k   494G  0.01    0  49
	 2 0.48799  1.00000  499G   474G 25533M 95.01 2.13  78
	 3 0.48799  1.00000  499G   204G   295G 40.92 0.92  68
	 4 0.48799  1.00000  499G   411G 89998M 82.41 1.85  74
				  TOTAL 3993G  1783G  2209G 44.66

虽然[ceph full或者nearfull的解决方法探究][2]也提到，可以先将full的比例提高到98%。但是执行时发现不可更改：

	$ ceph tell osd.* injectargs '--mon-osd-full-ratio 0.98'
	osd.0: mon_osd_full_ratio = '0.98' (unchangeable)
	osd.1: mon_osd_full_ratio = '0.98' (unchangeable)
	osd.2: mon_osd_full_ratio = '0.98' (unchangeable)
	osd.3: mon_osd_full_ratio = '0.98' (unchangeable)
	osd.4: mon_osd_full_ratio = '0.98' (unchangeable)

增加了两块OSD之后，经过了漫长的数据重新分布：

	$ ceph health
	HEALTH_ERR clock skew detected on mon.registry-ceph02, mon.registry-ceph03; 21 pgs backfill_wait; 2 pgs backfilling; 7 pgs degraded; 6 pgs recovery_wait; 7 pgs stuck degraded; 29 pgs stuck unclean; 1 pgs stuck undersized; 1 pgs undersized; recovery 41684/1371951 objects degraded (3.038%); recovery 694899/1371951 objects misplaced (50.650%); 1 full osd(s); pool default.rgw.buckets.data has many more objects per pg than average (too few pgs?); full flag(s) set; Monitor clock skew detected

当osd使用比例下降到95%以下后，集群恢复正常。

[OSD添加方法][3]

## 参考

1. [Ceph集群磁盘没有剩余空间的解决方法][1]
2. [ceph full或者nearfull的解决方法探究][2]
3. [Ceph集群添加OSD][3]

[1]: http://blog.csdn.net/xiaoquqi/article/details/45539847  "Ceph集群磁盘没有剩余空间的解决方法" 
[2]: https://www.itzhoulin.com/2016/04/20/deal_with_ceph_full/  "ceph full或者nearfull的解决方法探究" 
[3]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/06/01/ceph-deploy.html#%E6%B7%BB%E5%8A%A0osd "Ceph集群添加OSD"
