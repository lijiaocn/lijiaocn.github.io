---
layout: default
title: "CentOS Local设置，消除告警：warning: Setting locale failed"
author: 李佶澳
createdate: "2018-11-07 11:39:36 +0800"
changedate: "2018-11-07 11:39:36 +0800"
categories: 问题
tags: centos
keywords: locale,centos
description: 经常遇到Setting locale failed.问题，虽然不影响命令运行，但是总是出现warning，比较烦：
---

* auto-gen TOC:
{:toc}


经常遇到这样的问题，虽然不影响命令运行，但是总是出现warning，很讨厌：

	perl: warning: Setting locale failed.
	perl: warning: Please check that your locale settings:
		LANGUAGE = (unset),
		LC_ALL = (unset),
		LC_CTYPE = "zh_US.UTF-8",
		LANG = "zh_CN.UTF-8"
		are supported and installed on your system.
	perl: warning: Falling back to the standard locale ("C").

出现这个告警是因为local设置的是`zh_CN.UTF-8`，但是系统上没有中文local。

根据[How to Set Up System Locale on CentOS 7](https://www.rosehosting.com/blog/how-to-set-up-system-locale-on-centos-7/)用`localectl list-locales`查看，发现全都是en_开头的：

	$ localectl list-locales
	en_AG
	en_AG.utf8
	en_AU
	en_AU.iso88591
	en_AU.utf8
	...

根据[Perl warning Setting locale failed in Debian](https://www.thomas-krenn.com/en/wiki/Perl_warning_Setting_locale_failed_in_Debian#Generating_locales)，可以下面的命令生成local：

	localedef -i zh_CN  -f UTF-8 zh_CN.UTF-8

这个命令在CentOS上也适用。
