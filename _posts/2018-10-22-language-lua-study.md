---
layout: default
title:  "编程语言Lua（一）：入门介绍、学习资料、项目管理与调试方法"
author: 李佶澳
createdate: 2018/10/22 17:10:00
changedate: 2018/10/22 17:10:00
categories: 编程
tags: lua 视频教程
keywords:  lua,编程语言,idea,luarocsk,lua代码调试
description: 最近研究kong，它的数据平面使用的语言是Lua，学习一下Lua的基本语法、项目组织方式、在Idea中开发调试Lua项目的方法，和其它配套工具

---

* auto-gen TOC:
{:toc}

## 说明

这是[编程语言Lua系列文章](https://www.lijiaocn.com/tags/class.html)中的一篇。

最近在学习[API网关Kong（六）：Kong数据平面的实现分析][1]，Kong的数据平面使用的语言是[Lua][2]，需要学习一下Lua这门语言的使用方法、项目组织方式以及配套的开发调试工具等。

## Lua简介

[Lua网站][2]上说这门语言已经有`25年`的历史了，维基百科上的[Lua (programming language)][3]页面上给出了具体的时间：

>Lua was created in 1993 by Roberto Ierusalimschy, Luiz Henrique de Figueiredo, and Waldemar Celes, members of the Computer Graphics Technology Group (Tecgraf) at the Pontifical Catholic University of Rio de Janeiro, in Brazil.

有点吃惊，Lua是一门挺古老的语言，而且是巴西的大学开发的，顺便查了一下其它几种常见语言的诞生时间：

[C](https://zh.wikipedia.org/wiki/C%E8%AF%AD%E8%A8%80)，1969年至1973年间，贝尔实验室的丹尼斯·里奇与肯·汤普逊，为了移植与开发UNIX操作系统，以B语言为基础设计、开发出来。 

[C++](https://zh.wikipedia.org/wiki/C%2B%2B)，1979年，Bjarne Stroustrup（比雅尼·斯特劳斯特鲁普）决定为C语言增强一些类似Simula的特点，1985年10月出现了第一个商业化发布。

[Python](https://zh.wikipedia.org/wiki/Python)，1989年的圣诞节期间，吉多·范罗苏姆为了`打发时间`，在荷兰的阿姆斯特丹的开发的脚本解释程序，第一版发布于1991年。（他得有多闲？...）

[Java](https://zh.wikipedia.org/wiki/Java)，1990年Sun公司的一个内部项目研究的技术，最开始的名称是`Oak`，1993年夏天能够使用，1994年决定将该技术用于互联网，1994年Java 1.0a提供下载。1996年Sun公司成立Java业务集团，专门开发Java技术，因为Oak商标已经被注册，从Oak改名为Java。

[Lua](https://en.wikipedia.org/wiki/Lua_(programming_language))，1977~1992年，巴西在计算机软件和硬件上设置了贸易壁垒，位于巴西的Tecgraf公司不能从国外购买软件，于是从零开始开发基础软件，lua是葡萄牙语，意思是月亮。

[Brainfuck](https://en.wikipedia.org/wiki/Brainfuck)，1993年，Urban Müller创建的奇葩语言，一共只有8个命令和1个结构指针，它的代码是这个样子的：

	++++++++[>++++[>++>+++>+++>+<<<<-]>+>+>->>+[<]<-]>>.>---.+++++++..+++.>>.<-.<.+++.------.--------.>>+.>++.

你没看错，上面的++++等就是用Brainfuck语言写的代码。

## Lua的学习资料

[Programming in Lua](https://www.lua.org/pil/)，Lua的设计者`Roberto Ierusalimschy`写的Lua语言教程，2016年出版了第4版，覆盖了Lua 5.3。百度云下载地址：[Download：Programming in Lua, 4th Edition][12]。

[Lua 5.3 Reference Manual][4]，Lua语言的概念、语法定义和标准库函数列表。

[Lua Directory](http://lua-users.org/wiki/LuaDirectory)，收集了大量的Lua资料。

[Lua wiki][7]，Lua的wiki。

另外还有邮件列表、IRC、StackOverFlow主页等，这里不列出了，在[Lua Getting Started][5]中可以找到。

## Lua的第三方库和配套工具

Lua的[标准库][4]很小，只有11个文件，[Lua Addons][6]中收录了大量拓展Lua功能的资源：

[Lua在多个平台上的发行方式](http://lua-users.org/wiki/LuaDistributions)

[Lua的解释器，以及其它语言解释器对Lua的支持](http://lua-users.org/wiki/LuaImplementations)

[Lua可以调用的Library，包括用其它语言实现的、提供了Lua接口的Library](http://lua-users.org/wiki/LibrariesAndBindings)

[Lua与其它编程语言的相互调用](http://lua-users.org/wiki/BindingCodeToLua)

[Lua的功能增强补丁(code patch)](http://lua-users.org/wiki/LuaPowerPatches)

[Lua的项目开发工具，包括开发调试、编译打包、性能分析等](http://lua-users.org/wiki/LuaTools)

[Lua的集成开发环境(IDE)](http://lua-users.org/wiki/LuaIntegratedDevelopmentEnvironments)

[Lua的文档汇总](http://lua-users.org/wiki/LuaDocumentation)

此外还有：

[awesome-lua][9]，一组精选的、高质量的Lua Package。

[LuaRocks][8]，一个Lua Package管理工具，收录了大量以`rocks`方式发布的Lua Package。

[luadist][10]，一个跨平台的Lua Package管理工具。

[zerobrane](https://studio.zerobrane.com/)，一个纯粹的Lua IDE 。（装起来看了一下，功能很少，不支持安装插件，感觉没有Idea+EmmyLua好用）

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
[LuaJIT](http://luajit.org/)的关系和区别：

>LuaJIT 就是一个为了再榨出一些速度的尝试，它利用即时编译（Just-in Time）技术把 Lua 代码编译成本地机器码后交由 CPU 直接执行。LuaJIT 2 的测评报告表明，在数值运算、循环与函数调用、协程切换、字符串操作等许多方面它的加速效果都很显著。

对性能要求更高，可以使用luaJIT，下面是mac上的安装方法：

	brew install luajit

后面用到`lua`命令的地方，用`luajit`命令替代，执行效率会更高。

## Lua代码的运行

安装lua之后，直接执行`lua`，进入lua的命令行后，可以直接输入代码，回车执行：

	➜  ~ lua
	Lua 5.3.5  Copyright (C) 1994-2018 Lua.org, PUC-Rio
	> print("hello world!")
	hello world!
	>

也可以将代码写到.lua文件中，lua中注释符号是`--`：

	$ cat 01-hello-world.lua
	#! /usr/bin/env lua
	--
	-- 01-hello-world.lua
	-- Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
	--
	-- Distributed under terms of the GPL license.
	--
	
	print("Hello World")

用lua命令加载执行.lua文件：

	$ lua 01-hello-world.lua
	Hello World

## Lua的语法

这块的内容比较多，单独开一篇笔记记录。

建议直接学习[Programming in Lua, 4th Edition][12]。

百度网盘下载地址：[Download：Programming in Lua, 4th Edition][12]

## Lua代码组织方式

Lua5.1版本开始，定义了Module和Package，`Module`是可复用的Lua代码文件，`Package`是一组平铺的或有树状包含关系的Module。

### Lua Module

Module是一个返回一个Table变量的.lua文件，使用函数`require`引入：

	-- 引入math.lua
	local m = require "math"
	print(m.sin(3.14)) 

模块名称也可以用变量，动态加载模块：

	local cmd = require("kong.cmd." .. cmd_name)

Lua的`标准模块`会被用下面的方式加载默认加载：

	math = require "math"
	string = require "string"
	...

因此标准模块可以直接用模块名引用：

	math.sin(3.14)

Lua特别小巧，[标准库][4]数量只有一下几个，可以到[Lua的手册][4]中查看标准库中函数和用法：

	coroutine.lua
	debug.lua
	global.lua
	io.lua
	math.lua
	os.lua
	package.lua
	stdfuncs.lua
	stdlibrary.doclua string.lua
	table.lua

除了直接用操作`.`调用modules中的函数，还可以将函数复制给其它变量，通过其它变量调用：

	local m = require "mod"
	local f = m.foo
	f()

还可以只导入module中的一个函数：

	local f = require "mod".foo

#### require函数加载Module的过程

require函数的内部流程如下：

1 require首先检查`package.loaded`，查看目标module是否已经加载过，如果加载过，直接返回上次加载得到的table；

2 如果没有，用`package.path`中的目录模版中查找module对应的lua文件，找到之后用`loadfile`函数加载，生成一个loader变量；

3 如果`package.path`指定的目录模版中没有对应的lua文件，require转为到`package.cpath`指定的目录模板中查找`与module同名的C Library`。找到同名的C library之后，使用函数`package.loadlib`加载，生成一个loader变量。这个loader变量指向的是C library中的`luaopen_modname`函数；

4 调用loader变量指向的函数，传入两个参数：module名称和包含loader的文件名；

5 loader执行返回的数值被存入`package.loaded`，如果没有返回数值，`package.loaded`保持原状。

如果要强制重新加载Module，可以将`package.loaded`中对应Module的记录清除，清除后，遇到require加载时，会重新加载：

	package.loaded.modname = nil

require函数没有传入参数，这是为了防止同一个module被使用不同的参数多次加载。如果要为module设置参数，可以在module中创建一个设置函数的方式实现：

	local mod = require "mod"
	mod.init(0, 0)

需要注意的是如果引入的Module是一个目录，加载目录的下的`init.lua`文件，这是由`package.path`的值决定的：

	> print("%s",package.path)
	%s	./?.lua;/usr/local/share/lua/5.1/?.lua;/usr/local/share/lua/5.1/?/init.lua;/usr/local/lib/lua/5.1/?.lua;/usr/local/lib/lua/5.1/?/init.lua

#### require函数查找Module的路径

另外需要特别注意的是，和其它语言非常不同，Lua加载模块时不是按照指定的顺序到几个目录中查找，而是使用路径匹配的方式查找
（这样做的根源是ISO C中没有目录的概念，ISO C是lua的抽象运行平台，abstract platform）。

`package.path`和`package.cpath`中，记录的不是具体的目录，而是目录的模版，多个模版用";"分隔，例如：

	?;?.lua;c:\windows\?;/usr/local/lua/?/?.lua

require在查找Module时，将`?`替换为Module的名字，对于`require "sql"`，上面的模版对应的文件分别是：

	sql
	sql.lua
	c:\windows\sql
	/usr/local/luc/sql/sql.lua

`package.path`是查找用Lua写的Module的路径，值`依次`来自于（如果第一个没有值就找第二个)：

	环境变量： LUA_PATH_5_3   （或者其它版本）
	环境变量： LUA_PATH
	编译在Lua命令中的默认路径

`package.cpath`是查找C写的链接库的路径，值`依次`来自于（如果第一个没有值就找第二个)：

	环境变量：LUA_CPATH_5_3
	环境变量：LUA_CPATH
	编译在Lua命令中的默认路径

Lua5.2开始，可以加上`-E`参数强制使用编译在Lua命令中的默认路径。

可以用`package.searchpath()`函数按照同样的加载规则，查找Module：

	> path = ".\\?.dll;C:\\Program Files\\Lua502\\dll\\?.dll"
	> print(package.searchpath("X", path))
	nil
	        no file '.\X.dll'
	        no file 'C:\Program Files\Lua502\dll\X.dll'

#### module的版本管理

module名称中可以带有`-版本号`后缀，例如：

	m1 = require "mod-v1"

这主要是针对C library中，对于用Lua写的Module，如果有多个版本直接用不同的文件名就可以了，但是对于C library就不行了。

加载C library的时候，Module的名称不仅对应到C library的文件名，还对应到其中的函数名，仅仅修改C library的文件名是不行的，但是如果函数名中带版本号，显然也是非常不好的。

因此Lua规定对于命名为`模块名-版本号`样式Module，从C library查找名称格式为`luaopen_XXX`的函数的时候，忽略Module名称中的版本后缀。

对于mod-v1，在对应的C Library中查找的函数是`luaopen_mod`，这样每个版本的C library中都可以用同样的函数名。

### package

module支持层级，多个module可以呈树形结构组织，层级关系用`.`标记，例如：

	a.b
	a.b.c

package就是一个module目录树，是比module更高一层的概念，Lua的代码发布以package为单位。

## Lua的项目管理工具

先介绍用于lua项目的包管理工具luarocks的基本用法，然后介绍怎样在IDE中管理、操作lua项目。

### 依赖管理与发布打包：luarocks

[LuaRocks][8]既可以管理lua项目依赖的package，也可以将lua项目发布、安装，以及推送到luarocks中共享，类似于nodejs的npm，可以参考[luarocks documents][13]。

luarocks支持不同版本的lua，用`--lua-dir`指定lua路径，例如在lua@5.1中安装say：

	luarocks --lua-dir=/usr/local/opt/lua@5.1 install say

#### luarocks初始化项目

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

其中`lua`和`luarocks`是两个可执行脚本，使用项目中的`./lua`和`./luarocks`，可以将依赖的文件安装到项目本地目录中，不干扰系统上的Lua安装目录。`luarocks-dev-1.rockspec`是自动生成的rockspec文件，记录了依赖的lua包。

#### luarocks安装依赖包

初始化时，用项目本地的`./luarocks`命令执行`search`操作查找可以安装的依赖包，例如查找名为`mobdebug`的Lua Package：

	$ ./luarocks search mobdebug
	mobdebug - Search results for Lua 5.1:
	======================================
	
	Rockspecs and source rocks:
	---------------------------
	
	mobdebug
	   0.70-1 (rockspec) - https://luarocks.org
	   0.64-1 (rockspec) - https://luarocks.org
	   0.63-1 (rockspec) - https://luarocks.org
	   0.55-1 (rockspec) - https://luarocks.org
	   0.55-1 (src) - https://luarocks.org
	   0.51-1 (rockspec) - https://luarocks.org
	   0.51-1 (src) - https://luarocks.org
	   0.50-1 (rockspec) - https://luarocks.org
	   0.50-1 (src) - https://luarocks.org
	   0.49-1 (rockspec) - https://luarocks.org
	   0.49-1 (src) - https://luarocks.org
	   0.48-1 (rockspec) - https://luarocks.org
	   0.48-1 (src) - https://luarocks.org

用`install`子命令安装指定的版本：

	./luarocks install mobdebug 0.70-1

>注意rockspec文件不会自动更新，现在好像没有自动更新项目的rockspec文件的命令 2018-10-27 16:10:36

用`list`子命令可以查看已经安装的Lua Package：

	$ ./luarocks list
	
	Rocks installed for Lua 5.1
	---------------------------
	
	luarocks
	   3.0.3-1 (installed) - /usr/local/lib/luarocks/rocks-5.1
	
	luasocket
	   3.0rc1-2 (installed) - /Users/lijiao/Work-Finup/workspace/studys/study-Lua/first-demo/lua_modules/lib/luarocks/rocks-5.1
	
	mobdebug
	   0.70-1 (installed) - /Users/lijiao/Work-Finup/workspace/studys/study-Lua/first-demo/lua_modules/lib/luarocks/rocks-5.1

依赖的Lua Package安装在本地的lua_modules目录中：

	$ ls lua_modules/share/lua/5.1
	ltn12.lua        mime.lua        mobdebug.lua       socket       socket.lua

在安装了EmmyLua插件的IntelliJ Idea中，代码跳转的时候，先从lua_modules中寻找代码，优先使用最新的版本的代码。

**注意**：如果使用的不是本地的`./luarocks`命令而是系统的`luarocks`命令，那么Lua Package被安装到系统目录中，而非项目本地，不建议使用系统上的luarocks命令。

#### 记录依赖的rockspec文件

rockspec文件不仅记录Lua项目依赖的package，还设置了Lua项目的发布方式，以[kong的rockspec文件](https://github.com/Kong/kong/blob/master/kong-0.14.1-0.rockspec)为例：

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

`dependencies`中记录了项目依赖，`build`中记录项目代码的发布方式，即lua文件与module的对应关系。

>还没有找到自动更新rockspec文件的方法，需要手工在rockspec中输入依赖的package，这样太麻烦了。最好有一个工具能够自动将依赖的package更新到rockspec文件。2018-10-27 16:22:44

#### lua项目的安装

`build`子命令安装当前目录中的lua代码，安装时自动下载rockspec文件中指定的lua package：

	$ ./luarocks build
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

使用项目中的`./luarocks`命令，依赖包将会安装到项目本地的lua_modules中，使用系统的`luarocks`命令，将会安装到系统的目录中。还有一个`make`子命令，make子命令只安装当前项目，不下载依赖代码。

### IntelliJ Idea

IntelliJ Idea中有两个Lua插件，一个是`Lua`，一个是`EmmyLua`。实测结果是[EmmyLua](https://github.com/EmmyLua)对代码跳转的支持更好一些，这个插件是国人开发的，也比较活跃。安装EmmyLua插件后，用luarocks初始化一个lua项目，然后在Idea中直接将项目目录导入。

初始化一个lua项目：

	$ luarocks init --lua-dir=/usr/local/opt/lua@5.1
	$ tree .
	.
	├── lua
	├── lua_modules
	│   └── lib
	│       └── luarocks
	│           └── rocks-5.3
	├── luarocks
	└── luarocks-dev-1.rockspec

对于已经存在的lua项目，也用luarocks进行初始化，以kong为例：

	git clone https://github.com/Kong/kong.git
	cd kong
	luarocks init --lua-dir=/usr/local/opt/lua@5.1

用luarocks完成项目初始化后，目录下多出两个可执行文件`lua`和`luarocks`，以及`lua_modules`目录。后续操作都用当前目录中的./lua和./luarocks文件，这样该项目依赖的文件都存放在当前目录，管理方便且不易出错。

Kong已经是一个luarocks项目，代码中已经有.rockspec文件了，需要多一步操作，用`luarocks build`安装依赖文件：

	./luarocks build

在Mac上执行这个命令可能会遇到下面错误： 

```
Error: Failed installing dependency: https://luarocks.org/luasec-0.7-1.src.rock - Could not find header file for OPENSSL
  No file openssl/ssl.h in /usr/local/include
  No file openssl/ssl.h in /usr/include
  No file openssl/ssl.h in /include
You may have to install OPENSSL in your system and/or pass OPENSSL_DIR or OPENSSL_INCDIR to the luarocks command.
```

这是因为没有安装openssl或者openssl文件位于其它目录中，如果是用brew命令安装的openssl，可以用`brew info openssl`找到openssl文件路径：

```
$ brew info openssl
openssl: stable 1.0.2q (bottled) [keg-only]
SSL/TLS cryptography library
...省略...
For compilers to find openssl you may need to set:
  export LDFLAGS="-L/usr/local/opt/openssl/lib"
  export CPPFLAGS="-I/usr/local/opt/openssl/include"
```

用`OPENSSL_DIR`明确指定OPENSSL目录就可以了，如下：

	$ ./luarocks build OPENSSL_DIR=/usr/local/opt/openssl   CRYPTO_DIR=/usr/local/opt/openssl
	...
	kong 1.0.3-0 is now installed in ... / (license: Apache 2.0)

EmmyLua插件在执行代码跳转时，先从项目源代码中查找，然后从`lua_modules/lib/luarocks`中`最新`版本的Lua目录中查找，最后从SDK的ClassPath/SourcePath目录中查找。

`SDK的ClassPath/SourcePath`设置面板：

	File -> Project Structure->SDKs

在SDK窗口中选择当前使用的SDK，譬如LuaJ，在它的`ClassPath`、`SourcePath`中添加项目目录外的代码路径，点击界面下方的“+”添加。至少要把本地安装的Lua模块目录添加到SDK的ClassPath/SourcePath中，例如在Mac上，lua代码被安装在：

	/usr/local/share/lua/5.1/

在Mac上为Idea的SDK添加代码目录时，在“+”弹出的对话框中可能找不到/usr目录，可以做一个符号连接，将符号连接添加到SDK中，例如：

	ln -s /usr/local/share/lua/5.1 ~/Bin/lua-5.1-sdk

如果项目用到了OpenResty，将OpenResty的模块路径添加到SDK的ClassPath/SourcePath中，Mac上用brew安装的OpenResty的package目录是：

	/usr/local/Cellar/openresty/1.13.6.2/lualib/

可能也需要做符号连接：

	ln -s /usr/local/Cellar/openresty/1.13.6.2/lualib ~/Bin/openresty-1.13.6.2-lualib

## Lua代码的运行和调试

依赖管理使用前面提到的luarocks，开发环境用`Intelli Idea + EmmyLua插件`，代码的运行用`lua`或`luajit`等解释器，剩下的一个比较关键的问题就是lua代码的调试方法。

### 在IntelliJ IDEA中运行Lua代码

在IntelliJ IDEA中运行Lua代码比较简单。在`Run`菜单中选择Run，会弹出一个运行配置对话框，在`0 Edit Configuration`中，设置Lua代码的运行环境。最主要的配置是lua代码解释器的路径：

	Program: /usr/local/bin/lua-5.1    执行lua代码的lua命令

用快捷键`ctrl+alt+r`调出运行窗口。

#### 使用IntelliJ IDEA的Remote Debugger

用快捷键`ctrl+alt+d`调出Debug窗口，在`0 Edit Configuration`中选择Debugger：

	Remote Debugger(MobDebug)

Apply之后选择Debug运行，这时候Idea窗口下方会弹出Debugger对话框。`alt+command+r`开始执行到下一个断点，`F8`单步执行不进入函数，`F7`单步执行进入函数，`command+r`重新执行。

可能需要引用mobdebug模块，[EmmyLua的文档](https://emmylua.github.io/run/remote.html)中说设置Remote Debug远程调试，需要在lua代码中引入mobdebug模块：

	require("mobdebug").start()
	-- 或者
	require("mobdebug").start("host-ip", port) --默认值为 "localhost", 8172

不过我在Idea中试验了下，不安装mobdebug也可以进行调试，或许还有我不知道的内容，这里先记录下这件事。2018-10-27 17:03:13

用项目本地生成的`./luarocks`执行`search`子命令，查看可以安装的版本：

	$ ./luarocks search mobdebug
	mobdebug - Search results for Lua 5.1:
	======================================
	
	Rockspecs and source rocks:
	---------------------------
	
	mobdebug
	   0.70-1 (rockspec) - https://luarocks.org
	   0.64-1 (rockspec) - https://luarocks.org
	   0.63-1 (rockspec) - https://luarocks.org
	   0.55-1 (rockspec) - https://luarocks.org
	   0.55-1 (src) - https://luarocks.org
	   0.51-1 (rockspec) - https://luarocks.org
	   0.51-1 (src) - https://luarocks.org
	   0.50-1 (rockspec) - https://luarocks.org
	   0.50-1 (src) - https://luarocks.org
	   0.49-1 (rockspec) - https://luarocks.org
	   0.49-1 (src) - https://luarocks.org
	   0.48-1 (rockspec) - https://luarocks.org
	   0.48-1 (src) - https://luarocks.org

用`install`子命令安装：

	./luarocks install mobdebug 0.70-1

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
14. [Lua Remote Debug调试][14]
15. [EmmyLua Document][15]

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
[14]: https://emmylua.github.io/run/remote.html "Lua Remote Debug调试"
[15]: https://emmylua.github.io/ "EmmyLua Document"
