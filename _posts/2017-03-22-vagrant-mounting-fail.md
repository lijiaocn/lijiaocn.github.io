---
layout: default
title: vagrant /sbin/mount.vboxsf, mounting failed with the error, No such device
author: lijiaocn
createdate: 2017/03/27 16:56:41
changedate: 2017/03/27 18:57:54
categories:
tags: 问题
keywords : vagrant
description: vagrant /sbin/mount.vboxsf: mounting failed with the error: No such device

---

* auto-gen TOC:
{:toc}

### vagrant /sbin/mount.vboxsf: mounting failed with the error: No such device

通常是由于虚拟机的系统升级以后，导致之前安装的Guest Additions的不再可用，需要重新安装一下。

在虚拟机的窗口，选择"Devices->Insert Guest Additions CD image"，然后在虚拟机中挂载：

	mount /dev/cdrom /media

进入media执行:

	./VBoxLinuxAdditions.run
