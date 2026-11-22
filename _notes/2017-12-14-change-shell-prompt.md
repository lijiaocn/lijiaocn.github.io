---
title: Shell提示符中显示完整主机名
tags: shell
permalink: "/技巧/2017/12/14/change-shell-prompt.html"
---

## 目录
* auto-gen TOC:
{:toc}


在~/.bashrc中修改PS1定义：

	export PS1="[\u@\H \W]\$ "

其中`\H`，表示完整的主机名，如果是`\h`，只显示主机名中第一个点号前面的内容。

参考[Shell基本转义字符](https://www.cnblogs.com/lienhua34/p/5018119.html)
