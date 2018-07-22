---
layout: default
title: "man：linux的man手册使用"
author: 李佶澳
createdate: 2017/06/17 10:50:21
changedate: 2018/07/22 14:26:43
categories: 技巧
tags:  linuxtool
keywords: linuxtool,man,手册使用
description:  man手册中包含很多的资料。

---

* auto-gen TOC:
{:toc}

## 修改man手册配色

在~/.bashrc中添加：

	export LESS_TERMCAP_mb=$(printf '\e[01;31m') # enter blinking mode - red
	export LESS_TERMCAP_md=$(printf '\e[01;35m') # enter double-bright mode - bold, magenta
	export LESS_TERMCAP_me=$(printf '\e[0m') # turn off all appearance modes (mb, md, so, us)
	export LESS_TERMCAP_se=$(printf '\e[0m') # leave standout mode    
	export LESS_TERMCAP_so=$(printf '\e[01;33m') # enter standout mode - yellow
	export LESS_TERMCAP_ue=$(printf '\e[0m') # leave underline mode
	export LESS_TERMCAP_us=$(printf '\e[04;36m') # enter underline mode - cyan

[修改man手册配色][1]有详细的介绍:

The color codes are as follows:

	30 – black
	31 – red
	32 – green
	33 – orange
	34 – blue
	35 – magenta
	36 – cyan
	37 – white

Some other escape codes which you could use include:

	0 – reset/normal
	1 – bold
	3 – italic/reversed
	4 – underlined
	5 – blink

You can check this by typing in a terminal something like:

	printf '\e[31m'
	printf '\e[32m'
	printf '\e[37m'

So, if we have something like

	 printf '\e[01;33m'

it means enter bold and color yellow, according to the listing above.

## 参考

1. [修改man手册配色][1]

[1]: http://www.tuxarena.com/2012/04/tutorial-colored-man-pages-how-it-works/ "修改man手册配色" 
