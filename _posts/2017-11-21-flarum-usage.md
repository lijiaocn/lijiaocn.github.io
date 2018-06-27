---
layout: default
title: flarum轻论坛系统怎样搭建和使用?
author: 李佶澳
createdate: 2017/11/21 22:25:26
changedate: 2018/06/27 17:03:32
categories: 方法
tags: flarum
keywords: flarum,bbs,轻论坛,论坛系统
description: flarum是一个比较新兴的开源论坛，简洁友好，在国内已经有中文社区

---

* auto-gen TOC:
{:toc}

## 说明

flarum是一个比较新兴的开源论坛，脱胎于[esoTalk][4]，[为什么创建flarum][4]介绍了这个项目的缘由。

不过flarum目前还是beta版本，官方不建议在生产环境中使用。

下面的操作过程在[git: install-flarum][9]中有记录。

## 要求

	A web server: Apache (with mod_rewrite), Nginx, or Lighttpd
	PHP 5.6+ with the following extensions: mbstring, pdo_mysql, openssl, json, gd, dom, fileinfo
	MySQL 5.5+
	SSH (command-line) access

## 安装

flarum是用php开发的，用php的依赖管理工具[composer][6]来管理项目。

composer与node的npm、ruby的bunder类似，需要php5.3.2+。

### 安装php

考虑到php7发布的时候，不少phper惊呼“太强大了”，因此这里编译安装最新的[php7.2][7]。

	wget http://am1.php.net/get/php-7.2.0.tar.bz2/from/this/mirror
	mv mirror php-7.2.0.tar.gz2

编译之前需要准备编译环境：

	yum install -y gcc make libxml2-devel gd-devel libpng-devel openjpeg-devel curl-devel

解压后，进入进行编译：

	./configure -h 
	./configure --prefix=/opt/php-7.2.0 --with-openssl --with-zlib --enable-mbstring --with-pdo-mysql --with-gd --with-curl
	make install 

然后将php命令的路径添加PATH中:

	echo 'export PATH=$PATH:/opt/php-7.2.0/bin' >>~/.bashrc
	source ~/.bashrc

如果要开后自动设置路径：

	echo 'export PATH=$PATH:/opt/php-7.2.0/bin' >>/etc/profile

### 安装composer

composer要求php版本为5.3.2+。[composer][6]提供了一个安装[脚本][8]：

	wget https://getcomposer.org/installer

`installer`是一个php文件，可以直接用php运行：

	php ./installer --help

安装完成之后，先检查一下php运行环境是否满足要求：

	$ php ./installer --check
	All settings correct for using Composer

运行installer，将composer安装到指定路径，这里安装到php的bin目录中。

	php ./installer --install-dir=/opt/php-7.2.0/bin/ --filename=composer

安装完成之后，应当可以直接使用composer命令：

	[vagrant@10 1_composer]$ composer -h
	Usage:
	  help [options] [--] [<command_name>]
	
	Arguments:
	  command                        The command to execute
	  command_name                   The command name [default: "help"]
	
	Options:
	...

启动php-cgi

	php-cgi -b 127.0.0.1:9000

### 安装flarum

建立一个空目录，在空目录中，直接用composer安装：

	$ mkdir flarum && cd flarum
	$ composer create-project flarum/flarum . --stability=beta
	Installing flarum/flarum (v0.1.0-beta.7)
	  - Installing flarum/flarum (v0.1.0-beta.7): Downloading (100%)
	Created project in .
	Loading composer repositories with package information
	Updating dependencies (including require-dev)

### 安装nginx

	yum install -y nginx

在`/etc/nginx/conf.d/`中创建文件flarum.conf：

	server {
	        listen       80 ;
	        listen       [::]:80 ;
	        server_name  flarum.local;                         # 在本地host配置域名
	        root         /vagrant/flarum/2_flarum/project;     # 这里是composer安装的flarum项目目录
	
	        location / { try_files $uri $uri/ /index.php?$query_string; }
	        location /api { try_files $uri $uri/ /api.php?$query_string; }
	        location /admin { try_files $uri $uri/ /admin.php?$query_string; }
	
	        location /flarum {
	                deny all;
	                return 404;
	        }
	
	        location ~* \.php$ {
	                fastcgi_split_path_info ^(.+.php)(/.+)$;
	                fastcgi_pass 127.0.0.1:9000;
	                include fastcgi_params;
	                fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
	                fastcgi_param HTTP_PROXY ""; # Fix for https://httpoxy.org/ vulnerability
	                fastcgi_index index.php;
	        }
	
	        location ~* \.html$ {
	                expires -1;
	        }
	
	        location ~* \.(css|js|gif|jpe?g|png)$ {
	                expires 1M;
	                add_header Pragma public;
	                add_header Cache-Control "public, must-revalidate, proxy-revalidate";
	        }
	
	        gzip on;
	        gzip_http_version 1.1;
	        gzip_vary on;
	        gzip_comp_level 6;
	        gzip_proxied any;
	        gzip_types application/atom+xml
	                       application/javascript
	                       application/json
	                       application/vnd.ms-fontobject
	                       application/x-font-ttf
	                       application/x-web-app-manifest+json
	                       application/xhtml+xml
	                       application/xml
	                       font/opentype
	                       image/svg+xml
	                       image/x-icon
	                       text/css
	                       #text/html -- text/html is gzipped by default by nginx
	                       text/plain
	                       text/xml;
	        gzip_buffers 16 8k;
	        gzip_disable "MSIE [1-6]\.(?!.*SV1)";
	}

### 配置flarum

在本地的/etc/hosts中配置上flarum.local的IP，例如：

	127.0.0.1 flarum.local

然后访问`http://flarum.local/index.php`，按照界面提示完成安装。

## 参考

1. [flarum][1]
2. [flarum: installation][2]
3. [flarum中文社区][3]
4. [为什么创建flarum][4]
5. [esotalk][5]
6. [php composer][6]
7. [php官网][7]
8. [php composer installer][8]
9. [git: install-flarum][9]

[1]: http://flarum.org/  "flarum" 
[2]: http://flarum.org/docs/installation/ "flarum: installation"
[3]: http://discuss.flarum.org.cn/ "flarum中文社区"
[4]: http://discuss.flarum.org.cn/d/115 "为什么创建flarum"
[5]: https://esotalk.org/ "esotalk"
[6]: https://getcomposer.org/  "php composer"
[7]: http://php.net/  "php官网"
[8]: https://github.com/composer/getcomposer.org/blob/master/web/installer "php composer installer"
[9]: https://github.com/lijiaocn/install-flarum  "git: install-flarum"
