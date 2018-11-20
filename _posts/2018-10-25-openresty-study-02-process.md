---
layout: default
title: "Web开发平台OpenResty（二）：组成、工作过程与原理"
author: 李佶澳
createdate: 2018/10/28 21:54:00
changedate: 2018/10/28 21:54:00
categories: 编程
tags: openresty 视频教程
keywords: openresty,nginx,lua,openresty开发
description: 组成OpenResty的各个模块的用途和工作过程，Nginx、NginxLuaModule等模块以及引入的lua package的用途和用法

---

* auto-gen TOC:
{:toc}

## 说明

这是[Web开发平台OpenResty系列文章](https://www.lijiaocn.com/tags/class.html)中的一篇。

[OpenResty的网站](https://openresty.org)给出了几本[关于Lua、Nginx、OpenResty的电子书](https://openresty.org/en/ebooks.html)：

1  OpenResty的主要作者章宜春写的[Programming OpenResty](https://openresty.gitbooks.io/programming-openresty/content/)，好像是刚开始写...

2  章宜春写的[Nginx Tutorials (version 2016.07.21)](https://openresty.org/download/agentzh-nginx-tutorials-en.html)，这本书有[中文版](https://openresty.org/download/agentzh-nginx-tutorials-zhcn.html)

3  360公司的[moonbingbing](https://github.com/moonbingbing)（真名不知道）组织编写的[OpenResty 最佳实践][4]，其中对Lua和Nginx也做了不错的介绍。

其中章宜春写的两本都没有完成，不成系统，360公司的那本相对好一些。

后面的内容只是记录OpenResty的大概框架，具体的使用参考[Web开发平台OpenResty（四）：项目开发中常用的操作](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/11/09/openresty-study-04-development.html)。

## Nginx部分

OpenResty首先是nginx，然后才是OpenResty，因此Nginx的知识依旧适用。

## NginxLuaModule

[lua-nginx-module][1]是最重要的模块，它赋予了nginx执行lua脚本的功能。这个模块作用于Nginx的Http子系统，因此只能用来处理HTTP协议族（HTTP 0.9/1.0/1.1/2.0, WebSockets）。对于TCP，引入的模块是[stream-lua-nginx-module][2]。

### 实现的指令与作用位置

lua-nginx-moudle实现了多个`XXX_by_lua`样式的[配置指令][3]，指令中包含的是要被执行的Lua代码。

这些指令分别作用于一次Http请求处理过程的不同阶段，如下图所示：

![lua-nginx-module指令作用阶段](https://cloud.githubusercontent.com/assets/2137369/15272097/77d1c09e-1a37-11e6-97ef-d9767035fc3e.png)

例如可以在Location中做如下配置：

	location /mixed {
	    set_by_lua_block $a {
	        ngx.log(ngx.ERR, "set_by_lua*")
	    }
	    rewrite_by_lua_block {
	        ngx.log(ngx.ERR, "rewrite_by_lua*")
	    }
	    access_by_lua_block {
	        ngx.log(ngx.ERR, "access_by_lua*")
	    }
	    content_by_lua_block {
	        ngx.log(ngx.ERR, "content_by_lua*")
	    }
	    header_filter_by_lua_block {
	        ngx.log(ngx.ERR, "header_filter_by_lua*")
	    }
	    body_filter_by_lua_block {
	        ngx.log(ngx.ERR, "body_filter_by_lua*")
	    }
	    log_by_lua_block {
	        ngx.log(ngx.ERR, "log_by_lua*")
	    }
	}

使用OpenResty启动后，访问时，会在nginx的log中看到如下日志：

	2018/10/29 11:24:55 [error] 61573#4416285: *2 [lua] set_by_lua:2: set_by_lua*, client: 127.0.0.1, server: , request: "GET /trick HTTP/1.1", host: "127.0.0.1:6699"
	2018/10/29 11:24:55 [error] 61573#4416285: *2 [lua] rewrite_by_lua(nginx.conf:17):2: rewrite_by_lua*, client: 127.0.0.1, server: , request: "GET /trick HTTP/1.1", host: "127.0.0.1:6699"
	2018/10/29 11:24:55 [error] 61573#4416285: *2 [lua] access_by_lua(nginx.conf:20):2: access_by_lua*, client: 127.0.0.1, server: , request: "GET /trick HTTP/1.1", host: "127.0.0.1:6699"
	2018/10/29 11:24:55 [error] 61573#4416285: *2 [lua] content_by_lua(nginx.conf:23):2: content_by_lua*, client: 127.0.0.1, server: , request: "GET /trick HTTP/1.1", host: "127.0.0.1:6699"
	2018/10/29 11:24:55 [error] 61573#4416285: *2 [lua] header_filter_by_lua:2: header_filter_by_lua*, client: 127.0.0.1, server: , request: "GET /trick HTTP/1.1", host: "127.0.0.1:6699"
	2018/10/29 11:24:55 [error] 61573#4416285: *2 [lua] body_filter_by_lua:2: body_filter_by_lua*, client: 127.0.0.1, server: , request: "GET /trick HTTP/1.1", host: "127.0.0.1:6699"
	2018/10/29 11:24:55 [error] 61573#4416285: *2 [lua] log_by_lua(nginx.conf:32):2: log_by_lua* while logging request, client: 127.0.0.1, server: , request: "GET /trick HTTP/1.1", host: "127.0.0.1:6699"

### 常用指令和变量

[lua-nginx-module/nginx-api-for-lua](https://github.com/openresty/lua-nginx-module#nginx-api-for-lua)收录的指令和变量最全。

### ngx.ctx

[ngx.ctx](https://github.com/openresty/lua-nginx-module#ngxctx)，当前请求的lua上下文，类型是`table`，请求结束随之销毁。

ngx.ctx的类型是table，可以在其中记录状态，并且将记录的状态带到后续的阶段，例如：

	 location /test {
	     rewrite_by_lua_block {
	         ngx.ctx.foo = 76
	     }
	     access_by_lua_block {
	         ngx.ctx.foo = ngx.ctx.foo + 3
	     }
	     content_by_lua_block {
	         ngx.say(ngx.ctx.foo)
	     }
	 }

`rewrite`阶段，在上下文中添加变量`foo`，然后在`access`阶段进行了修改，最后在`content`阶段被用于生成返回的内容。

`GET /test`返回的结果将是79（76+3）。

ngx.ctx可以在以下处理阶段中使用，ngx.timer.*是全局的定时器：

	 init_worker_by_lua*
	 set_by_lua*
	 rewrite_by_lua*
	 access_by_lua*
	 content_by_lua*
	 header_filter_by_lua*
	 body_filter_by_lua*
	 log_by_lua*
	 ngx.timer.*
	 balancer_by_lua*

## 参考

1. [GitHub: openresty/lua-nginx-module][1]
2. [stream-lua-nginx-module][2]
3. [lua-nginx-module directives][3]
4. [Nginx: Alphabetical index of variables][4]

[1]: https://github.com/openresty/lua-nginx-module  "GitHub: openresty/lua-nginx-module"
[2]: https://github.com/openresty/stream-lua-nginx-module#readme  "stream-lua-nginx-module" 
[3]: https://github.com/openresty/lua-nginx-module#directives  "lua-nginx-module directives"
[4]: http://nginx.org/en/docs/varindex.html "Nginx: Alphabetical index of variables"
