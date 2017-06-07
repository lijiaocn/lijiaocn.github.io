---
layout: default
title: ntpd同步系统时间
author: lijiaocn
createdate: 2017/06/05 15:27:55
changedate: 2017/06/06 15:29:45
categories: 技巧
tags: linuxtool
keywords: ntpd, ntpupdate
description: 分布式系统对时间敏感，通常需要所有node上的时间保持同步，可以用ntp来保证。

---

* auto-gen TOC:
{:toc}

## 安装ntp

	yum install ntp ntpdate ntp-doc
	chkconfig ntpd on

## 手动同步一次时间

	ntpdate pool.ntp.org

## 启动ntpd

	systemctl start ntpd

ntpd服务会自动与/etc/ntp.conf中配置的ntp server通信，保证系统时间与ntp server的时间一致。

## 参考

1. [install ntp to synchroize server clock][1]

[1]: https://www.cyberciti.biz/faq/howto-install-ntp-to-synchronize-server-clock/  "howto-install-ntp-to-synchronize-server-clock" 
