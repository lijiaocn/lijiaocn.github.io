---
layout: default
title: "Web开发平台OpenResty（四）：项目开发中常用的操作"
author: 李佶澳
createdate: "2018-11-09 17:57:24 +0800"
changedate: "2018-11-09 17:57:24 +0800"
categories: 编程
tags: openresty
keywords: openresty,nginx,lua,openresty开发
description: 基于OpenResty的项目开发中，经常用到的操作，譬如读取nginx内置变量、打印调试日志等
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这是[Web开发平台OpenResty系列文章](https://www.lijiaocn.com/tags/class.html)中的一篇。

这里记录一下基于OpenResty的项目开发时，经常用到的操作，譬如读取nginx内置变量、打印调试日志等

以下操作的很大一部分都是在使用[lua-nginx-module的lua api](https://github.com/openresty/lua-nginx-module#nginx-api-for-lua)

## 打印日志

[ngx.log](https://github.com/openresty/lua-nginx-module#ngxlog)用来打印各个级别的日志。

可以使用的[日志级别](https://github.com/openresty/lua-nginx-module#nginx-log-level-constants):

	ngx.STDERR
	ngx.EMERG
	ngx.ALERT
	ngx.CRIT
	ngx.ERR
	ngx.WARN
	ngx.NOTICE
	ngx.INFO
	ngx.DEBUG

显示的日志级别用nginx的[error_log](http://nginx.org/en/docs/ngx_core_module.html#error_log)指令设置，可以设置的级别有：

	debug, info, notice, warn, error, crit, alert,  emerg

使用方法：

	#study-OpenResty/example/06-nginx-lua-module-log
	worker_processes  1;              #nginx worker 数量
	error_log logs/error.log debug;   #指定错误日志文件路径
	events {
	  worker_connections 1024;
	}
	
	http {
	     server {
	         listen 6699;
	         location / {
	             content_by_lua_block {
	                ngx.log(ngx.DEBUG,"this is a DEBUG log");
	                ngx.log(ngx.INFO,"this is a INFO log");
	                ngx.log(ngx.NOTICE,"this is a NOTICE log");
	                ngx.log(ngx.WARN,"this is a WARN log");
	                ngx.log(ngx.ERR,"this is a ERR log");
	                ngx.log(ngx.CRIT,"this is a CRIT log");
	                ngx.log(ngx.ALERT,"this is a ALERT log");
	                ngx.log(ngx.EMERG,"this is a EMERG log");
	                ngx.log(ngx.STDERR,"this is a STDERR log");
	             }
	         }
	     }
	 }

发起访问：

	$ curl 127.0.0.1:6699

在logs/error.log中可以看到下面的日志：

	2018/11/09 18:52:22 [notice] 60535#2188182: using the "kqueue" event method
	2018/11/09 18:52:22 [notice] 60535#2188182: start worker processes
	2018/11/09 18:52:22 [notice] 60535#2188182: start worker process 60942
	2018/11/09 18:52:22 [notice] 60535#2188182: signal 23 (SIGIO) received
	2018/11/09 18:52:22 [notice] 60535#2188182: signal 23 (SIGIO) received
	2018/11/09 18:52:22 [notice] 60535#2188182: signal 20 (SIGCHLD) received from 60763
	2018/11/09 18:52:22 [notice] 60535#2188182: worker process 60763 exited with code 0
	2018/11/09 18:52:22 [notice] 60535#2188182: signal 23 (SIGIO) received
	2018/11/09 18:52:22 [notice] 60535#2188182: signal 23 (SIGIO) received from 60942
	2018/11/09 18:52:23 [debug] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):2: this is a DEBUG log
	2018/11/09 18:52:23 [info] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):3: this is a INFO log, client: 127.0.0.1, server: , request: "GET / HTTP/1.1", host: "127.0.0.1:6699"
	2018/11/09 18:52:23 [notice] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):4: this is a NOTICE log, client: 127.0.0.1, server: , request: "GET / HTTP/1.1", host: "127.0.0.1:6699"
	2018/11/09 18:52:23 [warn] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):5: this is a WARN log, client: 127.0.0.1, server: , request: "GET / HTTP/1.1", host: "127.0.0.1:6699"
	2018/11/09 18:52:23 [error] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):6: this is a ERR log, client: 127.0.0.1, server: , request: "GET / HTTP/1.1", host: "127.0.0.1:6699"
	2018/11/09 18:52:23 [crit] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):7: this is a CRIT log, client: 127.0.0.1, server: , request: "GET / HTTP/1.1", host: "127.0.0.1:6699"
	2018/11/09 18:52:23 [alert] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):8: this is a ALERT log, client: 127.0.0.1, server: , request: "GET / HTTP/1.1", host: "127.0.0.1:6699"
	2018/11/09 18:52:23 [emerg] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):9: this is a EMERG log, client: 127.0.0.1, server: , request: "GET / HTTP/1.1", host: "127.0.0.1:6699"
	2018/11/09 18:52:23 [] 60942#2206384: *4 [lua] content_by_lua(nginx.conf:22):10: this is a STDERR log, client: 127.0.0.1, server: , request: "GET / HTTP/1.1", host: "127.0.0.1:6699"
	2018/11/09 18:52:23 [info] 60942#2206384: *4 kevent() reported that client 127.0.0.1 closed keepalive connection

## 读取nginx的内置变量

[Nginx: Alphabetical index of variables][4]中列出了nginx内置的变量，这些变量可以在nginx的配置文件中直接使用。如果要在OpenResty中使用，用lua-nginx-module的[ngx.var.VARIABLE](https://github.com/openresty/lua-nginx-module#ngxvarvariable)获取。

例如要读取变量[$request_uri](http://nginx.org/en/docs/http/ngx_http_core_module.html#var_request_uri)，可以用下面的方式：

	#study-OpenResty/example/05-nginx-lua-module-readvar
	worker_processes  1;        #nginx worker 数量
	error_log logs/error.log;   #指定错误日志文件路径
	events {
	  worker_connections 1024;
	}
	
	http {
	     server {
	         listen 6699;
	         location / {
	             set $my_var 'my_var';
	             content_by_lua_block {
	                 local response = {}
	                 response[1]= ngx.var.request_uri;
	                 response[2]=";"
	                 response[3] = ngx.var.my_var;
	                 ngx.say(response);
	             }
	         }
	     }
	 }

返回结果如下：

	$ curl 127.0.0.1:6699/
	/;my_var

如果使用其它的uri，返回结果一同变化：

	$ curl "127.0.0.1:6699/abcdef?a=1&b=2"
	/abcdef?a=1&b=2;my_var

## 创建并使用共享内存

[ngx.shared](https://github.com/openresty/lua-nginx-module#ngxshareddict)是一个table，
记录在nginx.conf中用指令[lua_shared_dict](https://github.com/openresty/lua-nginx-module#lua_shared_dict)创建的共享内存。

譬如在nginx.conf中用`lua_shared_dict`指定创建一个5兆大小的共享内存：

	...
	lua_shared_dict kong                5m;

然后就可以在lua代码中，用`ngx.shared`读取这块共享内存，有两种语法格式：

	dict = ngx.shared.kong
	dict = ngx.shared[kong]

共享内存的操作方法有多个，详细用法参考[ngx.shared](https://github.com/openresty/lua-nginx-module#ngxshareddict)：

	get
	get_stale
	set
	safe_set
	add
	safe_add
	replace
	delete
	incr
	lpush
	rpush
	lpop
	rpop
	llen
	ttl
	expire
	flush_all
	flush_expired
	get_keys
	capacity
	free_space

这些方法都是原子操作，可以在多个nginx worker中并发调用。

使用方法如下，创建了一个大小为10M，名为dogs的共享内存，请求/set时，在共享内存中写入数据，请求/get时，从共享内存中读取数据：

	#study-OpenResty/example/04-nginx-lua-module-shared-mem
	worker_processes  1;        #nginx worker 数量
	error_log logs/error.log;   #指定错误日志文件路径
	events {
	  worker_connections 1024;
	}
	
	 http {
	     lua_shared_dict dogs 10m;
	     server {
	         listen 6699;
	         location /set {
	             content_by_lua_block {
	                 local dogs = ngx.shared.dogs
	                 dogs:set("Jim", 8)
	                 ngx.say("STORED")
	             }
	         }
	         location /get {
	             content_by_lua_block {
	                 local dogs = ngx.shared.dogs
	                 ngx.say(dogs:get("Jim"))
	             }
	         }
	     }
	 }

请求/set时： 

	$ curl 127.0.0.1:6699/set
	STORED

请求/get时： 

	$ curl 127.0.0.1:6699/get
	8

## 参考

1. [GitHub: openresty/lua-nginx-module][1]
2. [stream-lua-nginx-module][2]
3. [lua-nginx-module directives][3]
4. [Nginx: Alphabetical index of variables][4]

[1]: https://github.com/openresty/lua-nginx-module  "GitHub: openresty/lua-nginx-module"
[2]: https://github.com/openresty/stream-lua-nginx-module#readme  "stream-lua-nginx-module" 
[3]: https://github.com/openresty/lua-nginx-module#directives  "lua-nginx-module directives"
[4]: http://nginx.org/en/docs/varindex.html "Nginx: Alphabetical index of variables"
