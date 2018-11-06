---
layout: default
title:  "编程语言Lua（三）：Lua的语法细节"
author: 李佶澳
createdate: "2018-11-02 18:40:59 +0800"
changedate: "2018-11-02 18:40:59 +0800"
categories: 编程
tags: lua 视频教程
keywords:  lua,编程语言,idea,luarocsk,lua语法细节
description: 这里记录Lua语言的一些语法细节，边学习边记录，随时补充
---

* auto-gen TOC:
{:toc}

## 说明

这是[编程语言Lua系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇。

这里记录一些Lua的语法细节，边学习边记录，随时补充，主要来自 [Lua 5.1 Reference Manual ][1]、[Programming in Lua, 4th Edition][2]。

## 操作符："."与":"

在下面的函数定义中，定义了一个函数，函数`被保存在`一个名为Account的table的名为`withdraw`的field中。

	Account = {balance = 0}
	function Account.withdraw (v)
	  Account.balance = Account.balance - v
	end

withdraw()函数中用到Account变量，只作用于Account变量，且Account变量不存在执行会出错。

如果要定义可以作用于所有变量的方法，要采用下面的定义：

	function Account.withdraw (self, v)
	    self.balance = self.balance - v
	end

这时候可以用":"操作符进行简化，省去self：

	function Account:withdraw (v)
	    self.balance = self.balance - v
	end

冒号操作符定义了一个self变量，指代调用函数的变量。

## 参考

1. [Lua 5.1 Reference Manual ][1]
2. [Programming in Lua, 4th Edition][2]

[1]: https://www.lua.org/manual/5.1/manual.html#pdf-_G "Lua 5.1 Reference Manual "
[2]: https://pan.baidu.com/s/1NOhdKjDbg18RQ_4DkGC8tg "Programming in Lua, 4th Edition"
