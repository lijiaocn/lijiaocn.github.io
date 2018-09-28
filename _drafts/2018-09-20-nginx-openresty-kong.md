---
layout: default
title: "Nginx、OpenResty、Kong的基本概念与使用方法"
author: 李佶澳
createdate: "2018-09-20 15:41:50 +0800"
changedate: "2018-09-20 15:41:50 +0800"
categories: 项目
tags: nginx OpenResty Kong
keywords: kong,openresty,nginx
description: Nginx、OpenRestry、Kong这三个项目紧密相连，OpenResty是围绕Nginx做的Web平台，Kong是一个OpenResty应用。
---

* auto-gen TOC:
{:toc}

## 说明

[Nginx][1]、[OpenRestry][2]、[Kong][3]这三个项目紧密相连，OpenResty是围绕Nginx做的Web平台，Kong是一个OpenResty应用。

## Nginx

Nginx是HTTP Server、反向代理服务器、邮件代理服务器、通用的TCP/UDP代理服务器。[nginx features][5]详细列出了nginx的功能特性。

### Nginx配置文件，指令与变量

Nginx的配置文件由`单指令(simple directive)`和`块指令(block directive)`组成，单指令只有一行，以“;”结尾，块指令后面是用“{ }”包裹的多行内容。

有些块指令后的花括号中可以继续包含单指令，这样的块指令被成为`配置上下文(context)`，这样的指令有：events、http、server、location等。

context是嵌套的，最外层的context是`main context`，配置文件中不在`{}`的中指令都是位于`main context`中。

events和http指令位于main context，server位于http context，location位于server context：

	main context
	- events 
	- http
	  - server
	    - location

配置文件示例见： [Beginner’s Guide][10]，例如：

	http {
	    server {
	        listen 8080;           # server监听端口，不指定默认80
	        root /data/up1;        # 默认文件查找根目录
	
	        # 将请求按照uri进行分组处理
	        location / {           # 选择最常匹配的location，如果不匹配任何location，返回404
	            root /data/www;    # 文件查找根目录，覆盖server中的root配置 
	        }
	    
	        # uri路径匹配，优先级低于下面的正则匹配!
	        location /images/ {
	            root /data;
	        }
	
	        # 使用正则表达式匹配(必须带有"~ "前缀)：匹配文件后缀名
	        location ~ \.(gif|jpg|png)$ {        # 优先级高于uri路径匹配
	            root /data/images;
	        }
	
	        # 作为代理服务器的配置方法
	        location /proxy/ {                   # 将uri匹配的请求转发到proxy_pass指定的地址 
	            proxy_pass http://IP地址:8080;
	        }
	
	        # 将请求代理到FastCGI
	        # fastcgi_param是按照FastCGI的要求传递的参数，可以有多个，后面的`$XXX`是Nginx变量，拼成了参数的值
	        location /fastcgi/ {
	            fastcgi_pass  localhost:9000;                                       # fastCGI服务的地址   
	            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;   # 传给fastCGI服务的参数: SCRIPT_FILENAME
	            fastcgi_param QUERY_STRING    $query_string;                        # 传给fastCGI服务的参数: QUERY_STRING
	        }
	    }
	}

上面的例子中的`proxy_pass`和`factcgi_pass`分别是nginx的[http proxy module][12]和[http fastcgi moudle][11]中指令。

Nginx有很多的module，在[Nginx Documents][13]中可以查看每个modules的用法。

[Nginx: Alphabetical index of directives][8]中列出了Nginx的所有指令。

[Nginx: Alphabetical index of variables][9]中列出了可以在配置文件中使用的所有变量。

在查看Nginx指令用法的时候，注意指令的context：

	Syntax:     gzip on | off;
	Default:    gzip off;
	Context:    http, server, location, if in location   # 可以使用gzip指令的地方

### Nginx作为TCP/UDP负载均衡器

Nginx原本只能做7层(http)代理，在1.9.0版本中增加了4层(TCP/UDP)代理功能。

4层代理功能在Nginx的[ngx_stream_core_module][14]模块中实现，但默认没有编译，需要在编译时指定： --with-stream。

使用配置如下：

	worker_processes auto;
	
	error_log /var/log/nginx/error.log info;
	
	events {
	    worker_connections  1024;
	}
	
	stream {
	    upstream backend {
	        hash $remote_addr consistent;
	
	        server backend1.example.com:12345 weight=5;
	        server 127.0.0.1:12345            max_fails=3 fail_timeout=30s;
	        server unix:/tmp/backend3;
	    }
	
	    upstream dns {
	       server 192.168.0.1:53535;
	       server dns.example.com:53;
	    }
	
	    server {
	        listen 12345;
	        proxy_connect_timeout 1s;
	        proxy_timeout 3s;
	        proxy_pass backend;
	    }
	
	    server {
	        listen 127.0.0.1:53 udp reuseport;
	        proxy_timeout 20s;
	        proxy_pass dns;
	    }
	
	    server {
	        listen [::1]:12345;
	        proxy_pass unix:/tmp/stream.socket;
	    }
	}

### Nginx模块

理解Nginx Module很重要，因为后面的OpenResty就是标准的Nginx加上很多Nginx Module。

Nginx是用C语言开发软件，采用模块化设计，可以通过开发模块扩展Nginx的功能。

[Nginx Development guide][18]中介绍了Nginx模块开发的方法[Nginx Module develop][19]。

插件可以编译成.so以后动态加载，也可以直接编译到nginx中，编译是通过`--add-module`指定要集成的模块。

例如[lua-nginx-module](https://github.com/openresty/lua-nginx-module#readme)：

	./configure --prefix=/opt/nginx \
		 --with-ld-opt="-Wl,-rpath,/path/to/luajit-or-lua/lib" \
		 --add-module=/path/to/ngx_devel_kit \
		 --add-module=/path/to/lua-nginx-module

## OpenResty

[OpenResty][15]是一个集成了Nginx、LuaJIT和其它很多moudels的平台，用来托管完整的web应用——包含业务逻辑，而不单纯是静态文件服务器:

	OpenResty® aims to run your server-side web app completely in the Nginx server, 
	leveraging Nginx's event model to do non-blocking I/O not only with the HTTP 
	clients, but also with remote backends like MySQL, PostgreSQL, Memcached, and Redis.

[OpenResty Components][16]中列出了OpenResty集成的组件，数量不少，这里就不列出来了。

先通过[OpenResty Getting Started][17]感受一下OpenResty是咋回事。

### OpenResty安装

Centos安装方式：

	sudo yum install yum-utils
	sudo yum-config-manager --add-repo https://openresty.org/package/centos/openresty.repo
	sudo yum install openresty
	sudo yum install openresty-resty

通过源代码编译：

	wget https://openresty.org/download/openresty-1.13.6.2.tar.gz
	tar -xvf openresty-1.13.6.2.tar.gz
	cd openresty-1.13.6.2/
	./configure -j2
	make -j2
	make install     //默认安装在/usr/local/bin/openresty
	export PATH=/usr/local/openresty/bin:$PATH

都包含以下文件：

	$ tree -L 2 /usr/local/openresty/
	/usr/local/openresty/
	|-- bin
	|   |-- md2pod.pl
	|   |-- nginx-xml2pod
	|   |-- openresty -> /usr/local/openresty/nginx/sbin/nginx
	|   |-- opm
	|   |-- resty
	|   |-- restydoc
	|   `-- restydoc-index
	|-- COPYRIGHT
	|-- luajit
	|   |-- bin
	|   |-- include
	|   |-- lib
	|   `-- share
	...

注意openresty命令就是nginx命令，OpenResty可以理解为一个集成了很多模块的定制版nginx：

	$ openresty -h
	nginx version: openresty/1.13.6.2
	Usage: nginx [-?hvVtTq] [-s signal] [-c filename] [-p prefix] [-g directives]
	
	Options:
	  -?,-h         : this help
	  -v            : show version and exit
	  -V            : show version and configure options then exit
	  -t            : test configuration and exit
	  -T            : test configuration, dump it and exit
	  -q            : suppress non-error messages during configuration testing
	  -s signal     : send signal to a master process: stop, quit, reopen, reload
	  -p prefix     : set prefix path (default: /usr/local/openresty/nginx/)
	  -c filename   : set configuration file (default: conf/nginx.conf)
	  -g directives : set global directives out of configuration file


可以在openresty的配置文件中写入lua代码：

	$ cat nginx.conf
	worker_processes  1;
	error_log logs/error.log;
	events {
	    worker_connections 1024;
	}
	http {
	    server {
	        listen 8080;
	        location / {
	            default_type text/html;
	            content_by_lua '
	                ngx.say("<p>hello, world</p>")
	            ';
	        }
	    }
	}

启动：

	openresty -p `pwd` -c nginx.conf

然后访问"127.0.0.1:8080"，可以看到输出：

	$ curl 127.0.0.1:8080
	<p>hello, world</p>

## Kong

[Kong][3]是一个OpenResty应用，用来管理api。

## Kong编译安装

Kong[编译安装](https://docs.konghq.com/install/source/?_ga=2.8480690.66649192.1538042077-515173955.1536914658)时需要先安装有OpenResty。

还需要lua包管理工具[luarocks](https://luarocks.org/):

	git clone git://github.com/luarocks/luarocks.git
	./configure --lua-suffix=jit --with-lua=/usr/local/openresty/luajit --with-lua-include=/usr/local/openresty/luajit/include/luajit-2.1
	make install

下载kong代码编译：

	git clone https://github.com/Kong/kong.git
	cd kong
	make install

编译完成之后会在当前目录生成一个bin目录：

	$ ls bin/
	busted  kong

查看bin/kong的内容，可以发现这是一个用resty执行的脚本文件：

	$ cat bin/kong
	#!/usr/bin/env resty

	require "luarocks.loader"

	package.path = "./?.lua;./?/init.lua;" .. package.path

	require("kong.cmd.init")(arg)

准备数据库，kong支持PostgreSQL和Cassandra 3.x.x，这里使用PostgreSQL:

	yum install -y  postgresql-server
	postgresql-setup initdb
	systemctl start postgresql
	su - postgres 
	psql
	CREATE USER kong; CREATE DATABASE kong OWNER kong;
	alter user kong with encrypted password '';
	cp kong.conf.default kong.conf
	./bin/kong start -c ./kong.conf

## ERROR: ./kong/globalpatches.lua:63: module 'socket' not found:No LuaRocks module found for socket

这是因为编译kong之后，重新编译了luarocks，并且将luarocks安装在了其它位置。重新编译kong之后解决。

## 

## 参考

1. [nginx website][1]
2. [OpenResty website][2]
3. [Kong website][3]
4. [Kong Compile Source][4]
5. [nginx features][5]
6. [nginx documentation][6]
7. [Nginx Example Configuration & Directives][7]
8. [Nginx: Alphabetical index of directives][8]
9. [Nginx: Alphabetical index of variables][9]
10. [Beginner’s Guide][10]
11. [Nginx: ngx_http_fastcgi_module][11]
12. [Nginx: ngx_http_proxy_module][12]
13. [Nginx Documents][13]
14. [Nginx: Module ngx_stream_core_module][14]
15. [OpenResty website][15]
16. [OpenResty Components][16]
17. [OpenResty Getting Started][17]
18. [Nginx Development guide][18]
19. [Nginx Module develop][19]

[1]: http://nginx.org/ "nginx website"
[2]: https://openresty.org/en/ "OpenResty website" 
[3]: https://konghq.com/kong-community-edition/ "kong website"
[4]: https://docs.konghq.com/install/source/?_ga=2.162015675.622429763.1537429223-515173955.1536914658 "Kong: Compile Source"
[5]: http://nginx.org/en/ "nginx features"
[6]: http://nginx.org/en/docs/ "nginx documentation"
[7]: http://nginx.org/en/docs/ngx_core_module.html#example "Nginx Example Configuration & Directives"
[8]: http://nginx.org/en/docs/dirindex.html "Nginx: Alphabetical index of directives"
[9]: http://nginx.org/en/docs/varindex.html "Nginx: Alphabetical index of variables"
[10]: http://nginx.org/en/docs/beginners_guide.html "Nginx: Beginner’s Guide"
[11]: http://nginx.org/en/docs/http/ngx_http_fastcgi_module.html "Nginx: ngx_http_fastcgi_module"
[12]: http://nginx.org/en/docs/http/ngx_http_proxy_module.html "Nginx: ngx_http_proxy_module"
[13]: http://nginx.org/en/docs/ "Nginx Documents"
[14]: http://nginx.org/en/docs/stream/ngx_stream_core_module.html "Nginx: Module ngx_stream_core_module"
[15]: https://openresty.org/en/ "OpenResty website"
[16]: https://openresty.org/en/components.html "OpenResty Components"
[17]: https://openresty.org/en/getting-started.html "OpenResty Getting Started"
[18]: http://nginx.org/en/docs/dev/development_guide.html "Nginx Development guide"
[19]: http://nginx.org/en/docs/dev/development_guide.html#Modules "Nginx Module develop"
