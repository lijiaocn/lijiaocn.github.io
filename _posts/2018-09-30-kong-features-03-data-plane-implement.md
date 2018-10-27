---
layout: default
title:  API网关Kong（六）：Kong数据平面的实现分析
author: 李佶澳
createdate: 2018/10/22 15:07:00
changedate: 2018/10/22 15:07:00
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关
description:  在试验Kong的安全插件时，发现不起作用，需要分析一下Kong的数据平面的实现

---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

在试验Kong的安全插件时，需要了解一下Kong的数据平面的实现。

Kong-Ingress-Controller的版本是0.2.0，Kong的版本是0.14.1，是用下面的方式部署的：

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/kong-all-in-one.yaml

## kong-proxy容器的启动

### nginx启动前

数据平面的kong-proxy使用的镜像是`kong:0.14.1-centos`，镜像的Cmd是`kong docker-start`：

	$ docker inspect kong:0.14.1-centos
	...
	        "Cmd": [
	            "/bin/sh",
	            "-c",
	            "#(nop) ",
	            "CMD [\"kong\" \"docker-start\"]"
	...

entrypoint是：

	        "Entrypoint": [
	            "/docker-entrypoint.sh"
	        ],

在容器内找到`docker-entrypoint.sh`：

	sh-4.2# cat docker-entrypoint.sh
	#!/bin/sh
	set -e
	
	export KONG_NGINX_DAEMON=off
	
	if [[ "$1" == "kong" ]]; then
	  PREFIX=${KONG_PREFIX:=/usr/local/kong}
	  mkdir -p $PREFIX
	
	  if [[ "$2" == "docker-start" ]]; then
	    kong prepare -p $PREFIX
	
	    exec /usr/local/openresty/nginx/sbin/nginx \
	      -p $PREFIX \
	      -c nginx.conf
	  fi
	fi
	
	exec "$@"

docker-entrypoint.sh中的`kong prepare -p /usr/local/kong`命令，会在/usr/local/kong目录中创建nginx.conf等nginx配置文件：

	$ kong prepare -h
	Usage: kong prepare [OPTIONS]

	Prepare the Kong prefix in the configured prefix directory. This command can
	be used to start Kong from the nginx binary without using the 'kong start'
	command.

然后直接启动nginx，使用`kong prepare`创建的nginx.conf：

	    exec /usr/local/openresty/nginx/sbin/nginx \
	      -p $PREFIX \
	      -c nginx.conf

`-p`是指定路径前缀：

	-p prefix     : set prefix path (default: /usr/local/openresty/nginx/)

替换掉变量后，命令如下：

	/usr/local/openresty/nginx/sbin/nginx -p /usr/local/kong -c nginx.conf

### nginx启动

nginx启动时加载的配置文件是`/usr/local/kong/nginx.conf`：

	$ cat nginx.conf
	worker_processes auto;
	daemon off;
	
	pid pids/nginx.pid;
	error_log /dev/stderr notice;
	
	worker_rlimit_nofile 65536;
	
	events {
	    worker_connections 16384;
	    multi_accept on;
	}
	
	http {
	    include 'nginx-kong.conf';
	}

可以看到nginx.conf会继续加载配置文件`nginx-kong.conf`。

nginx-kong.conf包含多个_lua_block，加载了名为kong的lua模块：

	...
	init_by_lua_block {
	    Kong = require 'kong'
	    Kong.init()
	}
	init_worker_by_lua_block {
	    Kong.init_worker()
	}

并且在upstream、server、location等配置中直接调用kong模块中的方法：

	upstream kong_upstream {
	    server 0.0.0.1;
	    balancer_by_lua_block {
	        Kong.balancer()
	    }
	    ...
	}
	server {
	...
	    ssl_certificate_by_lua_block {
	        Kong.ssl_certificate()
	    }
	    ...
	    location / {
	        ...
	        rewrite_by_lua_block {
	            Kong.rewrite()
	        }
	
	        access_by_lua_block {
	            Kong.access()
	        }
	        ...
	        header_filter_by_lua_block {
	            Kong.header_filter()
	        }
	
	        body_filter_by_lua_block {
	            Kong.body_filter()
	        }
	
	        log_by_lua_block {
	            Kong.log()
	        }
	    }
	    location = /kong_error_handler {
	        ...
	        content_by_lua_block {
	            Kong.handle_error()
	        }
	        header_filter_by_lua_block {
	            Kong.header_filter()
	        }
	        body_filter_by_lua_block {
	            Kong.body_filter()
	        }
	        log_by_lua_block {
	            Kong.log()
	        }
	    }
	}

## Kong的实现

要了解nginx-kong.conf中名为kong的lua模块的实现，必须先了解OpenResty：

	...
	init_by_lua_block {
	    Kong = require 'kong'
	    Kong.init()
	}
	init_worker_by_lua_block {
	    Kong.init_worker()
	}

OpenResty是一个Web应用开发平台，Kong是一个OpenResty应用，OpenResty的内容参考：[Web开发平台OpenResty（一)：学习资料与基本结构][2]

OpenResty的应用开发使用的语言是Lua，因此还需要了解一下Lua，Lua的内容参考：[编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具][1]。

## 参考

1. [编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具][1]
2. [Web开发平台OpenResty（一)：学习资料与基本结构][2]

[1]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/22/language-lua-study.html "编程语言（一）：Lua介绍、入门学习资料、基本语法与项目管理工具"
[2]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/10/25/platform-openresty-study.html "Web开发平台OpenResty（一)：学习资料与基本结构"
