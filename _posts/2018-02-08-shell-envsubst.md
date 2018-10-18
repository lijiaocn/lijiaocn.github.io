---
layout: default
title:  用envsubst命令将输出内容中的Shell变量替换成变量值
author: 李佶澳
createdate: 2018/10/18 14:31:00
changedate: 2018/10/18 14:31:00
categories: 技巧
tags: shell
keywords: envsubst,变量替换,变量替换,shell
description: envsubst命令可以在管道中读取文本，将其中的Shell变量解析后输出：

---

* auto-gen TOC:
{:toc}

## 说明

envsubst命令可以在管道中读取文本，将其中的Shell变量解析后输出：

例如，下面的命令输出的`$aa`:

	# export aa=12345
	# echo '$aa' 
	$aa

使用envsubst转换后，输出的是变量值:

	# export aa=12345
	# echo '$aa' |envsubst
	12345

## 注意

如果在mac上，需要安装`gettext`：

	brew install gettext

并且按照提示在~/.bashrc或者.zshrc中，将gettext的命令路径添加到环境变量PATH中：

	export PATH="/usr/local/opt/gettext/bin:$PATH"

## 参考

1. [How to expand shell variables in a text file?][1]

[1]: https://stackoverflow.com/questions/14434549/how-to-expand-shell-variables-in-a-text-file  "How to expand shell variables in a text file?" 
