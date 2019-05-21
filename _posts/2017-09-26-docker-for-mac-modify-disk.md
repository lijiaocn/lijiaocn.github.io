---
layout: default
title: 调整docker for mac的磁盘大小
author: 李佶澳
createdate: 2017/09/26 16:01:04
changedate: 2017/09/26 16:45:34
categories: 技巧
tags: docker
keywords: docker,docker for mac
description: mac上运行的docker提示No space left on device

---

## 目录
* auto-gen TOC:
{:toc}

## 现象描述 

docker现在有mac版本，而不是只有一个docker client。

它会自动启动一个虚拟机，作为docker daemon，所以实际上容器还是在一个linux上运行的。

使用了一段时间以后，虚拟机的磁盘空间耗尽，提示：

	No space left on device

需要调整虚拟机的磁盘。

## 操作过程

点击mac的右上角的docker图标，选择`Preferences->Advanced`，在`Open in Finder`中可以找到虚拟机的qcow2文件。

需要在mac上安装qemu工具:

	brew install qemu

查看状态:

	$ qemu-img info  ~/VirtualBox\ VMs/Docker.qcow2
	image: /Users/lijiao/VirtualBox VMs/Docker.qcow2
	file format: qcow2
	virtual size: 64G (68719476736 bytes)
	disk size: 59G
	cluster_size: 65536
	Format specific information:
	    compat: 1.1
	    lazy refcounts: true
	    refcount bits: 16
	    corrupt: false

将docker关闭后，增加10G:

	$ qemu-img resize Docker.qcow2 +10G

## 参考

1. [Set the default size for new Docker for Mac disk images][1]

[1]: https://gist.github.com/stefanfoulis/5bd226b25fa0d4baedc4803fc002829e "Set the default size for new Docker for Mac disk images" 
