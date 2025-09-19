---
layout: default
title:  "编程语言Lua（三）: Lua的语法细节"
author: 李佶澳
createdate: "2018-11-02 18:40:59 +0800"
last_modified_at: "2019-03-12 20:39:19 +0800"
categories: 编程
tags: lua
keywords:  lua,编程语言,idea,luarocsk,lua语法细节
description: 这里记录Lua语言的一些语法细节，边学习边记录，随时补充
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这是[编程语言Lua系列文章](https://www.lijiaocn.com/tags/class.html)中的一篇，建议阅读：[Lua语言速查手册](https://www.lijiaocn.com/programming/chapter-lua/)。

这里记录一些Lua的语法细节，边学习边记录，随时补充，主要来自 [Programming in Lua, 4th Edition][2]、[Lua 5.3 Reference Manual ][3]、[Lua 5.1 Reference Manual ][1]。

## 操作符：“.”与“:”

模块Account中实现了一个函数withdraw：

	Account = {balance = 0}
	function Account.withdraw (v)
	  Account.balance = Account.balance - v
	end

这个withdraw()函数中操作的是Account.balance，绑死了Account，这个方法只有Account能用。

实现一个能够操作任意调用者中的balance变量的方法，可以用下面的方法：

	function Account.withdraw (self, v)
	    self.balance = self.balance - v
	end

可以用":"操作符进行简化，省去self：

	function Account:withdraw (v)
	    self.balance = self.balance - v
	end

冒号操作符自动添加一个self行参，指向当前调用者。

## 参考

1. [Lua 5.1 Reference Manual ][1]
2. [Programming in Lua, 4th Edition][2]
3. [Lua 5.3 Reference Manual ][3]

[1]: https://www.lua.org/manual/5.1/ "Lua 5.1 Reference Manual "
[2]: https://pan.baidu.com/s/1NOhdKjDbg18RQ_4DkGC8tg "Programming in Lua, 4th Edition"
[3]: https://www.lua.org/manual/5.3/ "Lua 5.3 Reference Manual "
