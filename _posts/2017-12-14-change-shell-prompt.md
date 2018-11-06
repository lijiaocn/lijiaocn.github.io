---
layout: default
title: Shell提示符中显示完整主机名
author: 李佶澳
createdate: 2017/12/14 16:55:57
changedate: 2017/12/14 18:21:16
categories: 技巧
tags: shell
keywords: bash,xterm,terminal
description: '其中\H，表示完整的主机名，如果是\h，只显示主机名中第一个点号前面的内容'

---

* auto-gen TOC:
{:toc}


在~/.bashrc中修改PS1定义：

	export PS1="[\u@\H \W]\$ "

其中`\H`，表示完整的主机名，如果是`\h`，只显示主机名中第一个点号前面的内容。

参考[Shell基本转义字符](https://www.cnblogs.com/lienhua34/p/5018119.html)
