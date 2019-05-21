---
layout: default
title: "Nginx学习笔记（一）：学习资料与配置文件格式"
author: 李佶澳
createdate: "2018-11-19 13:57:37 +0800"
changedate: "2018-11-19 13:57:37 +0800"
categories: 项目
tags: nginx  
keywords: nginx,学习笔记
description: 在学习kong的时候简单学习了nginx和openresty，大概搞清楚了kong和openresty的工作原理，还需要对nginx做深入了解
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

在学习kong的时候简单涉及了nginx和openresty([API网关Kong（一）：Nginx、OpenResty和Kong的基本概念与使用方法](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html))，大概搞清楚了kong和openresty的工作原理，也能模仿写一下插件([API网关Kong（十一）：自己动手写一个插件](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/09/kong-features-07-write-plugins.html))，但是总感觉掌握地不够透彻，还有一块不通畅的地方：nginx。

## 学习资料

[API网关Kong（一）：Nginx、OpenResty和Kong的基本概念与使用方法][1]中简单记录一些nginx的用法，更主要的收集了nginx的文档：

OpenResty作者章宜春有一个[agentzh 的 Nginx 教程（版本 2016.07.21）](https://openresty.org/download/agentzh-nginx-tutorials-zhcn.html)，不过这个教程没写完，
可以用来培养感性认识，中文阅读起来方便一些。OpenResty最佳实践中有一章[Nginx](https://moonbingbing.gitbooks.io/openresty-best-practices/content/ngx/nginx.html)，
相对比较适合用来入门，并且指出了一些坑。

最权威最完整的是nginx官方的文档，不过挺不适合入门的，适合作为查询手册使用：

**Nginx新手手册**：  [Nginx beginner's guide](https://nginx.org/en/docs/beginners_guide.html)

**Nginx的指令手册**：[Alphabetical index of directives](https://nginx.org/en/docs/dirindex.html)，列出了nginx的所有指令，按照字母顺序排序。

**Nginx的变量手册**：[Alphabetical index of variables](https://nginx.org/en/docs/varindex.html)，列出了nginx的所有变量，按照字母顺序。

**Nginx的全局手册**：[Nginx documentation](http://nginx.org/en/docs/)，nginx官方文档的首页，列出了nginx自带的所有module。

**Nginx的源代码**：  [Nginx source code](https://github.com/nginx/nginx)

## 一些重要摘要

提前了解这些，可以避免踩坑：

[Nginx 新手起步][2]中给出的一个数据比较重要： 

	一般的情况下，10000 个非活跃的 HTTP Keep-Alive 连接在 Nginx 中仅消耗 2.5MB 的内存

[if 是邪恶的][3]，慎用if，如果非要用，最好只在if中使用下面的命令：

	在 location 区块里 if 指令下唯一 100% 安全的指令应该只有:
	
	return …; rewrite … last;

## 配置文件格式

提前预览下配置文件格式，在nginx的源代码中有个配置文件[nginx.conf](https://github.com/nginx/nginx/blob/master/conf/nginx.conf)，但是在CentOS安装的ngxin自带的默认配置文件结构更好。

### CentOS中Nginx配置文件的组织方式

```bash
# For more information on configuration, see:
#   * Official English Documentation: http://nginx.org/en/docs/
#   * Official Russian Documentation: http://nginx.org/ru/docs/

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# 为每个要加载的nginx模块单独创建一个配置文件
# 例如/usr/share/ngxin/modules/mod-http-geoip.conf的内容如下：
#
#    load_module "/usr/lib64/nginx/modules/ngx_http_geoip_module.so";
#
# Load dynamic modules. See /usr/share/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf; 

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   65;
    types_hash_max_size 2048;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    # 将配置拆分到子配置文件中，可以以应用为单位进行拆分，每个应用一个配置文件
    # 比如说/etc/nginx/conf.d/flarum.conf中全都是flarum.local服务相关的配置：
    # server {
    #     listen       80 ;
    #     listen       [::]:80 ;
    #     server_name  flarum.local;                         # 在本地host配置域名
    #     root         /vagrant/flarum/2_flarum/project;     # 这里是composer安装的flarum项目目录
    # 
    #     location / { try_files $uri $uri/ /index.php?$query_string; }
    #     location /api { try_files $uri $uri/ /api.php?$query_string; }
    #     location /admin { try_files $uri $uri/ /admin.php?$query_string; }
    # 
    #     location /flarum {
    #             deny all;
    #             return 404;
    #     }
    # 
    #     location ~* \.php$ {
    #             fastcgi_split_path_info ^(.+.php)(/.+)$;
    #             fastcgi_pass 127.0.0.1:9000;
    #             include fastcgi_params;
    #             fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    #             fastcgi_param HTTP_PROXY ""; # Fix for https://httpoxy.org/ vulnerability
    #             fastcgi_index index.php;
    #     }
    #     #...省略部分内容...
    #     gzip on;
    #     gzip_http_version 1.1;
    #     gzip_vary on;
    # }
    # Load modular configuration files from the /etc/nginx/conf.d directory.
    # See http://nginx.org/en/docs/ngx_core_module.html#include
    # for more information.
    include /etc/nginx/conf.d/*.conf;

    # 默认的server
    server {
        listen       80 default_server;
        listen       [::]:80 default_server;
        server_name  _;
        root         /usr/share/nginx/html;

        # 默认server的配置也写到单独的配置文件中
        # Load configuration files for the default server block.
        include /etc/nginx/default.d/*.conf;

        location / {
        }

        error_page 404 /404.html;
            location = /40x.html {
        }

        error_page 500 502 503 504 /50x.html;
            location = /50x.html {
        }
    }

# TLS配置方法
# Settings for a TLS enabled server.
#
#    server {
#        listen       443 ssl http2 default_server;
#        listen       [::]:443 ssl http2 default_server;
#        server_name  _;
#        root         /usr/share/nginx/html;
#
#        ssl_certificate "/etc/pki/nginx/server.crt";
#        ssl_certificate_key "/etc/pki/nginx/private/server.key";
#        ssl_session_cache shared:SSL:1m;
#        ssl_session_timeout  10m;
#        ssl_ciphers HIGH:!aNULL:!MD5;
#        ssl_prefer_server_ciphers on;
#
#        # Load configuration files for the default server block.
#        include /etc/nginx/default.d/*.conf;
#
#        location / {
#        }
#
#        error_page 404 /404.html;
#            location = /40x.html {
#        }
#
#        error_page 500 502 503 504 /50x.html;
#            location = /50x.html {
#        }
#    }
}

```

### API网关kong的配置文件组织方式

可以用更大的粒度拆分配置，例如kong使用的nginx.conf：

```bash
worker_processes auto;
daemon off;

pid pids/nginx.pid;
error_log logs/error.log debug;

worker_rlimit_nofile 1024;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    # kong的配置单独写入到另一个配置文件中
    include 'nginx-kong.conf';
}
```

## 参考

1. [API网关Kong（一）：Nginx、OpenResty和Kong的基本概念与使用方法][1]
2. [Nginx 新手起步][2]
3. [if 是邪恶的][3]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html "API网关Kong（一）：Nginx、OpenResty和Kong的基本概念与使用方法"
[2]: https://moonbingbing.gitbooks.io/openresty-best-practices/content/ngx/nginx_brief.html "Nginx 新手起步"
[3]: https://moonbingbing.gitbooks.io/openresty-best-practices/content/ngx/if_is_evil.html "if 是邪恶的"
