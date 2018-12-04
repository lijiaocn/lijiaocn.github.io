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

## 情况1

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

## 情况2

在另一台机器上又遇到了类似问题，ssh登录时提示：

	-bash: warning: setlocale: LC_CTYPE: cannot change locale (UTF-8): No such file or directory

执行一些命令时（主要是perl脚本），也会出现和上面类似的情况。

变量`LC_CTYPE`的值为`UTF-8`:

	$ echo $LC_CTYPE
	UTF-8

根据[warning: setlocale: LC_CTYPE: cannot change locale](https://blog.csdn.net/aca_jingru/article/details/45557027)中的说法，这个`LC_CTYPE`是从登录的MAC上上传的参数，MAC上的这个变量值确实也是`UTF-8`，在目标机器上，用`locale`命令看到LC_CTYPE变量值也明显不同：

```bash
$ locale
locale: Cannot set LC_CTYPE to default locale: No such file or directory
locale: Cannot set LC_ALL to default locale: No such file or directory
LANG=en_US.UTF-8
LC_CTYPE=UTF-8
LC_NUMERIC="en_US.UTF-8"
LC_TIME="en_US.UTF-8"
LC_COLLATE="en_US.UTF-8"
LC_MONETARY="en_US.UTF-8"
LC_MESSAGES="en_US.UTF-8"
LC_PAPER="en_US.UTF-8"
LC_NAME="en_US.UTF-8"
LC_ADDRESS="en_US.UTF-8"
LC_TELEPHONE="en_US.UTF-8"
LC_MEASUREMENT="en_US.UTF-8"
LC_IDENTIFICATION="en_US.UTF-8"
LC_ALL=
```

在目标机器的`/etc/locale.conf`中明确设置LC_CTYPE：

```bash
$ cat /etc/locale.conf
LANG="en_US.UTF-8"
LC_CTYPE="en_US.UTF-8"
```

重新登录，问题消失。
