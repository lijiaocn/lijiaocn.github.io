---
layout: default
title: MAC上使用GNU命令行程序
author: lijiaocn
createdate: 2017/05/15 16:18:40
changedate: 2017/05/15 16:22:14
categories:
tags: 技巧
keywords: MAC,GNU,命令行
description: MAC默认的命令行工具是BSD风格，没有GNU风格的强大, 有时候会带来诸多不便。

---

* auto-gen TOC:
{:toc}

## 使用brew安装 

核心工具:

	brew install coreutils

其它常用:

	brew install binutils
	brew install diffutils
	brew install ed --with-default-names
	brew install findutils --with-default-names
	brew install gawk
	brew install gnu-indent --with-default-names
	brew install gnu-sed --with-default-names
	brew install gnu-tar --with-default-names
	brew install gnu-which --with-default-names
	brew install gnutls
	brew install grep --with-default-names
	brew install gzip
	brew install screen
	brew install watch
	brew install wdiff --with-gettext
	brew install wget

## 参考

1. [Install and Use GNU Command Line Tools on macOS/OS X][1] 

[1]: https://www.topbug.net/blog/2013/04/14/install-and-use-gnu-command-line-tools-in-mac-os-x/ "Install and Use GNU Command Line Tools on macOS/OS X"
