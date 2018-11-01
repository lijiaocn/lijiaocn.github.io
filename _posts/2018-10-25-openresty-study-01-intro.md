---
layout: default
title: "Web开发平台OpenResty（一)：学习资料、基本组成与使用方法"
author: 李佶澳
createdate: "2018-10-25 10:12:32 +0800"
changedate: "2018-10-25 10:12:32 +0800"
categories: 编程
tags: openresty 视频教程
keywords: openresty,nginx,lua,openresty开发
description: OpenResty是什么？被扩展的Nginx，扩展到可以直接执行Lua代码，处理业务逻辑，访问缓存和数据库等，已经成为一个Web应用开发平台
---

* auto-gen TOC:
{:toc}

## 说明

[OpenResty][2]是什么？被扩展的Nginx，扩展到可以直接执行Lua代码，处理业务逻辑，访问缓存和数据库等。

可以先看一下[Nginx、OpenResty和Kong的基本概念与使用方法][1]，对OpenResty有一个整体感知。

## 学习资料

使用OpenResty，需要对Nginx和Lua比较熟悉。

Nginx是OpenResty的执行引擎，Lua是OpenResty平台上使用的开发语言。

[OpenResty的网站](https://openresty.org)给出了几本[关于Lua、Nginx、OpenResty的电子书](https://openresty.org/en/ebooks.html)：

1  OpenResty的主要作者章宜春写的[Programming OpenResty](https://openresty.gitbooks.io/programming-openresty/content/)，好像是刚开始写...

2  章宜春写的[Nginx Tutorials (version 2016.07.21)](https://openresty.org/download/agentzh-nginx-tutorials-en.html)，这本书有[中文版](https://openresty.org/download/agentzh-nginx-tutorials-zhcn.html)

3  360公司的[moonbingbing](https://github.com/moonbingbing)（真名不知道）组织编写的[OpenResty 最佳实践][4]，其中对Lua和Nginx也做了不错的介绍。

[编程语言Lua（一）：入门学习资料、基本语法与项目管理工具][3]中收集了更多关于Lua的内容。

## 开发环境搭建

在mac上可以直接安装：

	brew untap homebrew/nginx
	brew install openresty/brew/openresty

在CentOS上的安装以及源代码编译安装，参考[OpenResty编译安装][5]。

需要安装lua5.1：

	brew install lua@5.1

需要安装luarocks，这里`不使用brew安装luarocks`，直接下载源代码安装：

>brew中的luarocks使用的是lua5.3，openresty使用的是lua5.1，系统上同时存在lua5.3和lua5.1，后续用luarocks管理依赖的package、运行openresty应用时可能会遇到麻烦。

	wget https://luarocks.org/releases/luarocks-3.0.3.tar.gz
	tar zxpf luarocks-3.0.3.tar.gz
	cd luarocks-3.0.3
	$ ./configure
	$ sudo make bootstrap

## 第一个OpenResty项目

OpenResty应用可以用openresty定制的nginx（命令openresty）运行，也可以用resty命令运行（本质上是一样的，resty是一个perl脚本，最终使用的还是openresty定制的nginx）。

### 用resty命令运行

[用resty命令直接执行Lua代码](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#%E7%94%A8resty%E7%9B%B4%E6%8E%A5%E6%89%A7%E8%A1%8Clua%E4%BB%A3%E7%A0%81)，

例如在直接写一个Lua文件

	$cat hello.lua
	ngx.say("hello world")

然后用OpenResty的Resty命令执行：

	$ resty hello.lua
	hello world

### 用openresty运行

可以写一个包含lua代码的nginx.conf，[用openresty命令或者openresty带的nginx启动](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#%E5%9C%A8%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E4%B8%AD%E5%86%99%E5%85%A5lua%E4%BB%A3%E7%A0%81)

	mkdir -p  hello-world/logs
	cd hello-world

创建`hello-world/nginx.conf`：

	worker_processes  1;        #nginx worker 数量
	error_log logs/error.log;   #指定错误日志文件路径
	events {
	    worker_connections 1024;
	}
	
	http {
	    server {
	        #监听端口，若你的6699端口已经被占用，则需要修改
	        listen 6699;
	        location / {
	            default_type text/html;
	
	            content_by_lua_block {
	                ngx.say("HelloWorld")
	            }
	        }
	    }
	}

在hello-world目录中启动：

	openresty -p `pwd` -c nginx.conf

这时候用ps命令可以看到nginx进程（openresty命令是连接到nginx命令的符号连接）：

	$ ps aux|grep nginx
	nginx: worker process
	nginx: master process openresty -p /Users/lijiao/study-OpenResty/example/01-hello-world -c nginx.conf

访问应用：

	$ curl 127.0.0.1:6699
	HelloWorld

## OpenResty与Lua的关系

OpenResty和Lua不是一回事。

Lua是一个小巧精炼编程语言，Lua的解释器有很多种，可以到[编程语言Lua（一）：介绍、入门学习资料、基本语法与项目管理][3]中了解。

OpenResty是一个高度定制的Nginx，集成了NginxLua模块，支持Lua语言。

同样一段Lua代码，用OpenResty可以执行，直接用Lua命令可能不能执行：

例如下面的代码：

	$ cat hello.lua
	#! /usr/bin/env lua
	--
	-- hello.lua
	-- Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
	--
	-- Distributed under terms of the GPL license.
	--
	
	ngx.say("hello world")

用OpenResty可以执行：

	$ resty hello.lua
	hello world

用Lua不可以：

	$ lua-5.1 ./hello.lua
	lua-5.1: ./hello.lua:9: attempt to index global 'ngx' (a nil value)
	stack traceback:
		./hello.lua:9: in main chunk
		[C]: ?

用Lua命令执行的时候，提示找不到ngx。

这是因为OpenResty包含的一些Lua Package不在Lua的安装目录中，而是在OpenResty自己的安装目录中。

以Mac为例，用`brew install openresty/brew/openresty`安装的openresty，它的Package目录是：

	$ ls /usr/local/Cellar/openresty/1.13.6.2/
	COPYRIGHT                     homebrew.mxcl.openresty.plist pod
	INSTALL_RECEIPT.json          luajit                        resty.index
	README.markdown               lualib                        site
	bin                           nginx
	$ ls /usr/local/Cellar/openresty/1.13.6.2/lualib
	cjson.so ngx      redis    resty

因此你会发现，使用openresty的项目代码中引用`require "resty.core"`，在lua的package目录中却怎么也找不到。

因为它是openresty中的模块，位于openresty的安装目录中：

	$ ls /usr/local/Cellar/openresty/1.13.6.2/lualib/resty/core
	base.lua     base64.lua   ctx.lua      exit.lua  ....

在使用IDE开发代码时，为了能够跳转到OpenResty的模块中，需要将OpenResty的模块目录加入到SDK的ClassPath/SourcePath中。

## OpenResty项目示例：Kong

[Kong](https://github.com/Kong/kong)是一个在OpenResty上实现的API网关应用，这里通过kong来了解OpenResty应用的源码的组织方式。

下载Kong的代码：

	git clone https://github.com/Kong/kong
	cd kong

kong使用luarocks管理依赖，依赖的package记录在`kong-0.14.1-0.rockspec`文件中：

	$ cat kong-0.14.1-0.rockspec
	...
	dependencies = {
	  "inspect == 3.1.1",
	  "luasec == 0.6",
	  "luasocket == 3.0-rc1",
	  "penlight == 1.5.4",
	  "lua-resty-http == 0.12",
	  "lua-resty-jit-uuid == 0.0.7",
	  "multipart == 0.5.5",
	...

kong项目的发布方式也记录在`kong-0.14.1-0.rockspec`文件中，记录了模块与代码文件的对应关系：

	kong-0.14.1-0.rockspec

	build = {
	  type = "builtin",
	  modules = {
	    ["kong"] = "kong/init.lua",
	    ["kong.meta"] = "kong/meta.lua",
	    ["kong.cache"] = "kong/cache.lua",
	    ["kong.global"] = "kong/global.lua",
	    ["kong.router"] = "kong/router.lua",
	    ...

`make`的时候，是直接用luarocks命令将kong安装到系统中：

	install:
	   @luarocks make OPENSSL_DIR=$(OPENSSL_DIR) CRYPTO_DIR=$(OPENSSL_DIR)

安装之后，在通过OpenResty执行的lua脚本中就可以引用kong了，例如文件`bin/kong`中引用kong的模块`kong.cmd.init`：

	$ cat bin/kong
	#!/usr/bin/env resty
	
	require "luarocks.loader"
	
	package.path = "./?.lua;./?/init.lua;" .. package.path
	
	require("kong.cmd.init")(arg)

## OpenResty项目IDE设置

使用OpenResty的项目可以使用Lua的IDE，OpenResty虽然和Lua不是一回事，但它可以复用[Lua的项目工具][10]，使用的时候别忘了将OpenResty的模块导入到SDK中。

在IntelliJ Idea中的设置方法参考：[Lua的项目管理工具-IntelliJ Idea](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html#intellij-idea)

## OpenResty对Nginx的扩展

在前面的例子中，nginx.conf中有一段配置是这样的：

	            content_by_lua_block {
	                ngx.say("HelloWorld")
	            }

这里的`content_by_lua_block`指令不是原生的nginx指令，是OpenResty为Nginx增加的指令。

Nginx使用[模块化设计](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#nginx%E6%A8%A1%E5%9D%97)，支持接入第三方的模块，第三方模块可以为nginx添加新的配置指令。

OpenResty为标准的Nginx添加了[很多模块](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#openresty)，大大增强了Nginx的能力。

### OpenResty收录的Nginx模块

OpenResty的应用开发过程，主要就是与OpenResty添加的Nginx模块，以及各种Lua的Package打交道的过程。

熟悉OpenResty为Nginx添加的每个模块的用途是必须的，下面是[OpenResty的网站][11]上列出的Nginx模块：

[array-var-nginx-module](https://github.com/openresty/array-var-nginx-module)，为nginx.conf增加数组类型的变量

[ngx_http_auth_request_module](http://mdounin.ru/hg/ngx_http_auth_request_module/file/tip/README)，为nginx.conf增加了授权指令

[ngx_coolkit](https://github.com/FRiCKLE/ngx_coolkit/)，收集了一些比较小巧有用的插件

[drizzle-nginx-module](https://github.com/openresty/drizzle-nginx-module#synopsis)，增加了访问mysql的功能

[echo-nginx-module](https://github.com/openresty/echo-nginx-module#synopsis)，增加了echo系列响应指令

[encrypted-session-nginx-module](https://github.com/openresty/encrypted-session-nginx-module#synopsis)，增加了加解密功能

[form-input-nginx-module](https://github.com/calio/form-input-nginx-module)，读取解析POST和PUT请求的body

[headers-more-nginx-module](https://github.com/openresty/headers-more-nginx-module#synopsis)，修改响应头

[iconv-nginx-module](https://github.com/calio/iconv-nginx-module#usage)，编码转换

[memc-nginx-module](https://github.com/openresty/memc-nginx-module#synopsis)，对接memcache

[lua-nginx-module](https://github.com/openresty/lua-nginx-module#synopsis)，使nginx能够识别执行lua代码

[lua-upstream-nginx-module](https://github.com/openresty/lua-upstream-nginx-module#synopsis)，将lua-nginx-module模块中的lua api导入到upstreams配置中。

[ngx_postgres](https://github.com/FRiCKLE/ngx_postgres)，增加了访问postgre数据库的功能

[rds-csv-nginx-module](https://github.com/openresty/rds-csv-nginx-module)，将RDS格式数据转换成CSV格式

[rds-json-nginx-module](https://github.com/openresty/rds-json-nginx-module#synopsis)，将RDS格式数据转换成JSON格式

[HttpRedisModule](https://openresty.org/en/redis-nginx-module.html)，增加了访问redis的功能

[redis2-nginx-module](https://github.com/openresty/redis2-nginx-module#synopsis)，支持redis 2.0协议

[set-misc-nginx-module](https://github.com/openresty/set-misc-nginx-module)，为ngxin的rewrite模块增加的set_XX指令

[srcache-nginx-module](https://github.com/openresty/srcache-nginx-module)，增加了缓存功能

[ngx_stream_lua_module](https://github.com/openresty/stream-lua-nginx-module#readme)，为Nginx的stream/tcp增加lua支持

[xss-nginx-module](https://github.com/openresty/xss-nginx-module)，添加跨站支持

#### 模块示例：LuaNginxModule

每个模块都定义了自己的指令，可以到它们各自的项目中查看，[OpenResty Componentes](https://openresty.org/en/components.html)

以[LuaNginxModule][7]为例，增加了下面的[Nginx指令(directives)][8]：

	lua_capture_error_log
	lua_use_default_type
	lua_malloc_trim
	lua_code_cache
	lua_regex_cache_max_entries
	lua_regex_match_limit
	...
	content_by_lua
	content_by_lua_block
	content_by_lua_file
	rewrite_by_lua
	rewrite_by_lua_block
	rewrite_by_lua_file
	...

其中[content_by_lua_block](https://github.com/openresty/lua-nginx-module#content_by_lua_block)等指令，支持lua代码：

	content_by_lua_block {
	     ngx.say("I need no extra escaping here, for example: \r\nblah")
	 }

[LuaNginxModule][7]还实现了[Nginx的lua接口][9]，可以在`**_lua_block样式`的指令中直接调用，例如上面的`ngx.say`。

[Nginx的lua接口][9]比较多，下面只列出了一部分，可以到[链接][9]中查看全部：
	...
	ngx.ctx
	ngx.location.capture
	ngx.location.capture_multi
	ngx.status
	ngx.header.HEADER
	ngx.resp.get_headers
	ngx.req.is_internal
	...

### OpenResty收录的Lua Package

除了Nginx模块，OpenResty还收录了一些[Lua Package](https://openresty.org/en/components.html)，这些Lua Package有一些是`用C语言`开发的，可以用Lua调用，但在IDE中无法跳转到它们的实现。

OpenResty收录的这些Lua Package，被安装到了OpenResty的安装目录中：

	$ ls /usr/local/Cellar/openresty/1.13.6.2/lualib/resty/
	aes.lua       core.lua      limit         lrucache      md5.lua       mysql.lua
	...

下面是OpenResty网站列出的[收录的Package][11]，有的项目中有多个Lua模块，导入一栏中只列出了其中一个，可以它们的源码中查看：

| 语言&nbsp;&nbsp;&nbsp;| 导入 | 源码             |
|----------------|:-----------------|:-----------------|
|      C         | require "cjson"        |  [LuaCjsonLibrary](https://github.com/openresty/lua-cjson/) |
|      C         | require "rds.parser"   |  [LuaRdsParserLibrary](https://github.com/openresty/lua-rds-parser) |
|      C         | require "redis.parser" |  [LuaRedisParserLibrary](https://github.com/openresty/lua-redis-parser) |
|     Lua        | require "resty.core"   |  [LuaRestyCoreLibrary](https://github.com/openresty/lua-resty-core) |
|     Lua        | require "resty.dns.resolver" | [LuaRestyDNSLibrary](https://github.com/openresty/lua-resty-dns) |
|     Lua        | require "resty.lock"         | [LuaRestyLockLibrary](https://github.com/openresty/lua-resty-lock) |
|     Lua        | require "resty.lrucache"     | [LuaRestyLrucacheLibrary](https://github.com/openresty/lua-resty-lrucache) |
|     Lua        | require "resty.memcached"  | [LuaRestyMemcachedLibrary](https://github.com/openresty/lua-resty-memcached) |
|     Lua        | require "resty.mysql"      | [LuaRestyMySQLLibrary](https://github.com/openresty/lua-resty-mysql) |
|     Lua        | require "resty.redis"      | [LuaRestyRedisLibrary](https://github.com/openresty/lua-resty-redis) | 
|     Lua        | require "resty.sha1"       | [LuaRestyStringLibrary](https://github.com/openresty/lua-resty-string) |
|     Lua        | require "resty.upload"     | [LuaRestyUploadLibrary](https://github.com/openresty/lua-resty-upload) |
|     Lua        | require "resty.upstream.healthcheck"&nbsp;&nbsp;| [LuaRestyUpstreamHealthcheckLibrary](https://github.com/openresty/lua-resty-upstream-healthcheck) |
|     Lua        | require "resty.websocket.server"                | [LuaRestyWebSocketLibrary](https://github.com/openresty/lua-resty-websocket)  |
|     Lua        | require "resty.limit.conn"                      | [LuaRestyLimitTrafficLibrary](https://github.com/openresty/lua-resty-limit-traffic) |



还有处于试验状态的[opm](https://github.com/openresty/opm#readme)命令，用来管理在OpenResty中使用的Lua Package。

## OpenResty的接口调用

OpenResty自身的接口有两部分，一部分是集成的Nginx模块实现的Lua接口，另一部分是收录的Lua Package，它们都位于lualib目录中：

	$ ls -F  /usr/local/Cellar/openresty/1.13.6.2/lualib
	cjson.so* ngx/      redis/    resty/

如果集成的Nginx的模块实现的Lua接口，可以直接在Lua代码中调用。（不是十分确定，下文的ngx.say()是不需要明确引入package就可以执行的 2018-10-27 14:40:34）

例如“第一个OpenResty项目”的例子中，直接调用LuaNginxModule实现的[Nginx的Lua接口][9]`ngx.say`，不需要引入lua的package。

	$ cat hello.lua
	ngx.say("hello world")

Lua Package用require引用，例如：

	require "resty.core"

需要注意的是[lua-nginx-module][7]的部分接口不在lua代码中，见[nginx api for lua](https://github.com/openresty/lua-nginx-module#nginx-api-for-lua)：

	ngx.arg
	ngx.var.VARIABLE
	Core constants
	HTTP method constants
	HTTP status constants
	Nginx log level constants
	print
	ngx.ctx
	ngx.location.capture
	ngx.location.capture_multi
	ngx.status
	ngx.header.HEADER
	ngx.resp.get_headers
	ngx.req.is_internal
	...

## 参考

1. [Nginx、OpenResty和Kong的基本概念与使用方法][1]
2. [OpenResty Website][2]
3. [编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具][3]
4. [OpenResty 最佳实践][4]
5. [OpenResty编译安装][5]
6. [OpenResty Reference][6]
7. [Project：lua-nginx-module][7]
8. [lua-nginx-module directives][8]
9. [lua-nginx-module: nginx lua api][9]
10. [Lua的项目管理工具][10]
11. [OpenResty Components][11]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html "Nginx、OpenResty和Kong的基本概念与使用方法"
[2]: https://openresty.org "openresty website"
[3]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html "编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具"
[4]: https://moonbingbing.gitbooks.io/openresty-best-practices/content/ "OpenResty 最佳实践"
[5]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#openresty%E5%AE%89%E8%A3%85 "OpenResty安装"
[6]: https://openresty-reference.readthedocs.io/en/latest/ "OpenResty Reference"
[7]: https://github.com/openresty/lua-nginx-module "Project：lua-nginx-module"
[8]: https://github.com/openresty/lua-nginx-module#directives  "lua-nginx-module: nginx directives"
[9]: https://github.com/openresty/lua-nginx-module#nginx-api-for-lua  "lua-nginx-module: nginx lua api"
[10]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html#lua%E7%9A%84%E9%A1%B9%E7%9B%AE%E7%AE%A1%E7%90%86%E5%B7%A5%E5%85%B7
[11]: http://openresty.org/en/components.html "OpenResty Components"
