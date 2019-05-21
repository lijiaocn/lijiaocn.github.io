---
layout: default
title: "API网关Kong学习笔记（二十一）：Kong的开发环境设置（IntelliJ Idea）"
author: 李佶澳
createdate: "2019-03-11 14:54:29 +0800"
changedate: "2019-05-20 14:49:36 +0800"
categories: 项目
tags: kong
keywords: kong,IntelliJ Idea,开发环境,代码阅读
description: 使用IntelliJ Idea查看编写kong的代码，安装EmmyLua插件，支持lua代码跳转和debug，luarocs安装依赖
---

* auto-gen TOC:
{:toc}

## 说明

一段时间没有折腾kong，简直忘得干干净净，连开发环境怎么设置的都忘了....还好[Lua的项目管理工具][1]中有过记录，这里将其中与kong相关的部分抽出来单独成篇，方便有需要的同学也方便我自己查阅。

{% include kong_pages_list.md %}

## 安装IntelliJ Idea插件：EmmyLua

IntelliJ Idea中有两个Lua插件，一个是`Lua`，一个是`EmmyLua`。实测结果是[EmmyLua](https://github.com/EmmyLua)对代码跳转的支持更好一些，这个插件是国人开发的，也比较活跃。安装EmmyLua插件后，用luarocks初始化一个lua项目，然后在Idea中直接将项目目录导入。

## 下载kong代码，完成初始化

这里使用的是lua5.1，提前在系统上安装luarocks，在mac上可以用brew安装：

	git clone https://github.com/Kong/kong.git
	cd kong
	luarocks init --lua-dir=/usr/local/opt/lua@5.1

下载kong依赖的lua包:

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

## 在IntelliJ Idea中设置SDK，添加lua代码路径

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

## 运行与调试

见[Lua代码的运行和调试][2]，快捷键`ctrl+alt+r`调出运行窗口，快捷键`ctrl+alt+d`调出Debug窗口。

>我习惯打印日志，远程运行时调试还没试过 2019-03-11 15:14:56

## 参考

1. [Lua的项目管理工具][1]
2. [Lua代码的运行和调试][2]

[1]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html#lua%E7%9A%84%E9%A1%B9%E7%9B%AE%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7 "Lua的项目管理工具"
[2]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html#lua%E4%BB%A3%E7%A0%81%E7%9A%84%E8%B0%83%E8%AF%95%E6%96%B9%E6%B3%95 "Lua代码的运行和调试"
