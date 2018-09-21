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

## OpenResty

[OpenResty][15]是一个集成了Nginx、LuaJIT和其它很多moudels的平台，web应用可以完全在OpenResty中运行:

	OpenResty® aims to run your server-side web app completely in the Nginx server, 
	leveraging Nginx's event model to do non-blocking I/O not only with the HTTP 
	clients, but also with remote backends like MySQL, PostgreSQL, Memcached, and Redis.

[OpenResty Components][16]中列出了OpenResty集成的组件。

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
