---
layout: default
title:  "编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具"
author: 李佶澳
createdate: 2018/10/22 17:10:00
changedate: 2018/10/22 17:10:00
categories: 编程
tags: lua 视频教程
keywords:  lua,编程语言
description: 最近研究kong，它的数据平面使用的语言是Lua，学习一下Lua的基本语法、代码组织方式以及配套工具等

---

* auto-gen TOC:
{:toc}

## 说明

最近在学习[API网关Kong（六）：Kong数据平面的实现分析][1]，Kong的数据平面使用的语言是[Lua][2]，需要学习一下Lua这门语言的基本语法、代码组织方式以及配套工具等。

## Lua简介

[Lua网站][2]上说这门语言已经有`25年`的历史了，维基百科上的[Lua (programming language)][3]页面上给出了具体的时间：

>Lua was created in 1993 by Roberto Ierusalimschy, Luiz Henrique de Figueiredo, and Waldemar Celes, members of the Computer Graphics Technology Group (Tecgraf) at the Pontifical Catholic University of Rio de Janeiro, in Brazil.

有点吃惊，Lua是一门挺古老的语言，顺便查了一下其它几种常见语言的诞生时间：

[C](https://zh.wikipedia.org/wiki/C%E8%AF%AD%E8%A8%80)，1969年至1973年间，贝尔实验室的丹尼斯·里奇与肯·汤普逊，为了移植与开发UNIX操作系统，以B语言为基础设计、开发出来。 

[C++](https://zh.wikipedia.org/wiki/C%2B%2B)，1979年，Bjarne Stroustrup（比雅尼·斯特劳斯特鲁普）决定为C语言增强一些类似Simula的特点，1985年10月出现了第一个商业化发布。

[Python](https://zh.wikipedia.org/wiki/Python)，1989年的圣诞节期间，吉多·范罗苏姆为了`打发时间`，在荷兰的阿姆斯特丹的开发的脚本解释程序，第一版发布于1991年。（他是有多闲？...）

[Java](https://zh.wikipedia.org/wiki/Java)，1990年Sun公司的一个内部项目研究的技术，最开始的名称是`Oak`，1993年夏天能够使用，1994年决定将该技术用于互联网，1994年Java 1.0a提供下载。1996年Sun公司成立Java业务集团，专门开发Java技术，因为Oak商标已经被注册，从Oak改名为Java。

[Lua](https://en.wikipedia.org/wiki/Lua_(programming_language))，1977~1992年，巴西在计算机软件和硬件上设置了贸易壁垒，位于巴西的Tecgraf公司不能从国外购买软件，于是从零开始开发基础软件，lua是葡萄牙语，意思是月亮。

[Brainfuck](https://en.wikipedia.org/wiki/Brainfuck)，1993年，Urban Müller创建的奇葩语言，一共只有8个命令和1个结构指针，它的代码是个这个样子：

	++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.

## Lua的学习资料

[Programming in Lua](https://www.lua.org/pil/)，Lua的设计者`Roberto Ierusalimschy`写的Lua语言教程，2016年出版了第4版，覆盖了Lua 5.3。百度云下载地址：[Download：Programming in Lua, 4th Edition][12]。

[Lua 5.3 Reference Manual][4]，Lua语言的概念、语法定义和标准库函数列表。

[Lua Directory](http://lua-users.org/wiki/LuaDirectory)，收集了大量的Lua资料。

[Lua wiki][7]，Lua的wiki。

另外还有邮件列表、IRC、StackOverFlow主页等，这里不列出了，在[Lua Getting started][5]中可以找到。

## Lua的第三方库和配套工具

Lua的[标准库][4]很小，只有11个文件，[Lua Addons][6]中收录了大量拓展Lua功能的资源：

[Lua在多个平台上的发行方式](http://lua-users.org/wiki/LuaDistributions)

[Lua的解释器，以及其它语言解释器对Lua的支持](http://lua-users.org/wiki/LuaImplementations)

[Lua可以调用的Library，包括用其它语言实现的、提供了Lua接口的Library](http://lua-users.org/wiki/LibrariesAndBindings)

[Lua与其它编程语言的相互调用](http://lua-users.org/wiki/BindingCodeToLua)

[Lua的功能增强补丁(code patch)](http://lua-users.org/wiki/LuaPowerPatches)

[Lua的项目开发工具，开发调试、编译打包、性能分析等](http://lua-users.org/wiki/LuaTools)

[Lua的集成开发环境(IDE)](http://lua-users.org/wiki/LuaIntegratedDevelopmentEnvironments)

[Lua的文档汇总](http://lua-users.org/wiki/LuaDocumentation)

此外还有：

[awesome-lua][9]，一系列精选的、高质量的Lua代码库和资源。

[LuaRocks][8]，一个Lua代码库管理工具，收录了大量以`rocks`方式发布的Lua代码库。

[luadist][10]，一个跨平台的Lua代码库管理工具。

[zerobrane](https://studio.zerobrane.com/)，一个纯粹的Lua IDE 。

如果使用Idea，可以用[EmmyLua插件](https://www.cnblogs.com/xiohao/p/9391411.html)。

## Lua的安装

在windows上可以使用[luadist][10]安装，在Linux和Mac上，可以直接使用对应的包管理工具安装:

	yum install -y lua     # for centos
	brew install lua       # for mac

也可以自己编译安装，[lua download](https://www.lua.org/download.html)：

	curl -R -O http://www.lua.org/ftp/lua-5.3.5.tar.gz
	tar zxf lua-5.3.5.tar.gz
	cd lua-5.3.5
	make linux test    # for linux
	make macosx test   # for mac

从[OpenResty最佳实践](https://moonbingbing.gitbooks.io/openresty-best-practices/content/)
的[lua介绍](https://moonbingbing.gitbooks.io/openresty-best-practices/content/lua/brief.html)中了解到Lua和
[LuaJIT](http://luajit.org/)的关系和区别。

>LuaJIT 就是一个为了再榨出一些速度的尝试，它利用即时编译（Just-in Time）技术把 Lua 代码编译成本地机器码后交由 CPU 直接执行。LuaJIT 2 的测评报告表明，在数值运算、循环与函数调用、协程切换、字符串操作等许多方面它的加速效果都很显著。

对性能要求更改，可以使用luaJIT，下面是mac上的安装方法：

	brew install luajit

后面用到`lua`命令的地方，可以用`luajit`命令替代。

## Lua代码的执行

安装之后，直接执行`lua`，进入lua的命令行执行代码：

	➜  ~ lua
	Lua 5.3.5  Copyright (C) 1994-2018 Lua.org, PUC-Rio
	> print("hello world!")
	hello world!
	>

或者将代码写到.lua文件中：

	$ cat 01-hello-world.lua
	#! /usr/bin/env lua
	--
	-- 01-hello-world.lua
	-- Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
	--
	-- Distributed under terms of the GPL license.
	--
	
	print("Hello World")

执行：

	$ lua 01-hello-world.lua
	Hello World

详细用法可以参考[Download：Programming in Lua, 4th Edition][12]

## Lua的语法

与学习使用过程同步更新，2018-10-24 11:13:47

建议直接学习[Programming in Lua, 4th Edition][12]。

## Lua代码组织方式

Lua5.1版本开始，定义了Module和Package，`Module`是一组可复用的代码，`Package`是一组Module。

### Lua Module

Module是一个返回一个Table变量的.lua文件，使用函数`require`引入：

	-- 引入math.lua
	local m = require "math"
	print(m.sin(3.14)) 

Lua的标准模块默认用下面的方式预先加载：

	math = require "math"
	string = require "string"
	...

因此标准模块可以直接用模块名引用：

	math.sin(3.14)

除了直接用操作`.`调用modules中的函数，还可以将函数复制给其它变量，通过其它变量调用：

	local m = require "mod"
	local f = m.foo
	f()

还可以只导入module中的一个函数：

	local f = require "mod".foo

#### require函数

require函数的内部流程如下：

1 require首先检查`package.loaded`，查看目标module是否已经加载过，如果加载过，直接返回上次加载得到的变量。

2 如果没有，用`package.path`中的目录模版中查找module对应的lua文件，找到之后用`loadfile`函数加载，生成一个loader变量。

3 如果`package.path`指定的目录模版中没有对应的lua文件，require转为到`package.cpath`指定的目录模板中查找`与module同名的C Library`。找到同名的C library之后，使用函数`package.loadlib`加载，生成一个loader变量。这个laoder变量指向的是C library中的`luaopen_modname`函数，

4 调用得到的loader变量指向的函数，传入两个参数：module名称和包含loader的文件名。

5 loader执行返回的数值被存入`package.loaded`，如果没有返回数值，`package.loaded`保持原状。

可以将`package.loaded`中module的数值情况，从而使随后的第一个require重新加载module：

	package.loaded.modname = nil

require函数没有传入参数，这是为了防止同一个module被使用不同的参数多次加载。如果要为module设置参数，可以在module中创建一个设置函数的方式实现：

	local mod = require "mod"
	mod.init(0, 0)

#### module的版本管理

module名称中可以带有`-版本号`后缀，例如：

	m1 = require "mod-v1"

这主要是针对C library中，从C library找名称格式为`luaopen_XXX`函数的时候，忽略module名称中的版本后缀，对于mod-v1，查找的函数是`luaopen_mod`，这样每个版本的C libraray中都可以用同样的函数名。

### package

module支持层级，多个module可以呈树形结构组织，层级关系用`.`标记，例如：

	a.b
	a.b.c

package就是一个module目录树，发布代码的时候以package为单位发布。

## Lua的项目管理工具

与学习使用过程同步更新，2018-10-24 11:13:47

### 依赖管理与发布打包：luarocks

[LuaRocks][8]既可以管理lua项目依赖的package，也可以将lua项目代码打包、发布、安装，以及推送到luarocks，类似于nodejs的npm，可以参考[luarocks documents][13]。

luarocks支持多个版本的lua，默认是5.3，可以用`--lua-dir`指定另一个版本的lua，例如在lua@5.1中安装say：

	luarocks --lua-dir=/usr/local/opt/lua@5.1 install say

`init`子命令初始化一个lua项目：

	luarocks init

生成以下文件：

	$ tree .
	.
	├── lua
	├── lua_modules
	│   └── lib
	│       └── luarocks
	│           └── rocks-5.3
	├── luarocks
	└── luarocks-dev-1.rockspec

其中`lua`和`luarocks`是两个可执行脚本，在当前项目中执行`./lua`和`./luarocks`命令，可以将依赖的文件都安装到当前项目目录中，不干扰系统上的lua。

依赖的package被安装在lua_modules/share中：

	$ ls lua_modules/share/lua/5.1
	ansicolors.lua date.lua       json2lua.lua   loadkit.lua    ltn12.lua ...

在IntelliJ Idea的EmmyLua插件在代码跳转的时候，从lua_modules中找最新版本的代码。

Lua项目依赖的package和打包发布方式放在记录在rockspec文件中，下面是[kong的rockspec文件](https://github.com/Kong/kong/blob/master/kong-0.14.1-0.rockspec)：

	package = "kong"
	version = "0.14.1-0"
	supported_platforms = {"linux", "macosx"}
	source = {
	  url = "git://github.com/Kong/kong",
	  tag = "0.14.1"
	}
	description = {
	  summary = "Kong is a scalable and customizable API Management Layer built on top of Nginx.",
	  homepage = "http://getkong.org",
	  license = "MIT"
	}
	dependencies = {
	  "inspect == 3.1.1",
	  "luasec == 0.6",
	  "luasocket == 3.0-rc1",
	  ...省略...
	}
	build = {
	  type = "builtin",
	  modules = {
	    ["kong"] = "kong/init.lua",
	    ["kong.meta"] = "kong/meta.lua",
	    ["kong.cache"] = "kong/cache.lua",
	  ...省略...
	  }
	}

`build`子命令编译当前目录中的lua代码，自动下载项目的rockspec文件中指定的lua package：

	$ luarocks build
	Missing dependencies for kong 0.14.1-0:
	   inspect 3.1.1 (not installed)
	   luasec 0.6 (not installed)
	   luasocket 3.0-rc1 (not installed)
	   penlight 1.5.4 (not installed)
	   lua-resty-http 0.12 (not installed)
	   lua-resty-jit-uuid 0.0.7 (not instal
	   ...
	   kong 0.14.1-0 depends on inspect 3.1.1 (not installed)
	     Installing https://luarocks.org/inspect-3.1.1-0.src.rock
	   ...

`list`子命令，查看已经安装的lua package：

	Rocks installed for Lua 5.3
	---------------------------
	
	inspect
	   3.1.1-0 (installed) - /usr/local/lib/luarocks/rocks-5.3

## 参考

1. [API网关Kong（六）：Kong数据平面的实现分析][1]
2. [Lua Website][2]
3. [Wiki: Lua (programming language)][3]
4. [Lua 5.3 Reference Manual][4]
5. [Lua Getting started][5]
6. [Lua Addons][6]
7. [Lua wiki][7]
8. [LuaRocks][8]
9. [awesome-lua][9]
10. [luadist][10]
11. [lua download][11]
12. [Download：Programming in Lua, 4th Edition][12]
13. [luarocks documents][13]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/22/kong-data-plane-implement.html  "API网关Kong（六）：Kong数据平面的实现分析"
[2]: https://www.lua.org/  "Lua Website" 
[3]: https://en.wikipedia.org/wiki/Lua_(programming_language) "Wiki: Lua (programming language)"
[4]: https://www.lua.org/manual/5.3/ "Lua 5.3 Reference Manual "
[5]: https://www.lua.org/start.html "Lua Getting started"
[6]: http://lua-users.org/wiki/LuaAddons "Lua Addons"
[7]: http://lua-users.org/wiki/ "Lua wiki"
[8]: https://luarocks.org/ "LuaRocks"
[9]: https://github.com/LewisJEllis/awesome-lua "awesome-lua"
[10]: http://luadist.org/ "luadist"
[11]: https://www.lua.org/download.html "lua download"
[12]: https://pan.baidu.com/s/1NOhdKjDbg18RQ_4DkGC8tg "Download：Programming in Lua, 4th Edition"
[13]: https://github.com/luarocks/luarocks/wiki/Documentation "luarocks documents"
