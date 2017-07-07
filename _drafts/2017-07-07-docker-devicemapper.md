---
layout: default
title: docker error: Driver devicemapper failed to remove root filesystem
author: lijiaocn
createdate: 2017/07/07 13:43:43
changedate: 2017/07/07 14:03:20
categories: 问题
tags: docker devicemapper
keywords:
description: 

---

* auto-gen TOC:
{:toc}

## 现象 

容器已经停止运行，但无法删除:

Jul 07 13:39:11 slave-66 dockerd[22214]: time="2017-07-07T13:39:11.102765238+08:00" level=error msg="Handler for DELETE /containers/230b0b2828703f3ed4091633f42e5b6283da79d1b0f6bc4ca76b852e1be35518 returned error: Driver devicemapper failed to remove root filesystem 230b0b2828703f3ed4091633f42e5b6283da79d1b0f6bc4ca76b852e1be35518: remove /var/lib/docker/devicemapper/mnt/23f8b934ca05b0d873fd60f726f96b52e9647c8fca480d414420b6277eea09c6: device or resource busy"

`dmesg`中显示:

	[188234.512215] device-mapper: thin: Deletion of thin device 86 failed.

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
z
