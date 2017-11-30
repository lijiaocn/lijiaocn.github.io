---
layout: default
title: flarum论坛的搭建使用
author: lijiaocn
createdate: 2017/11/21 22:25:26
changedate: 2017/11/30 23:34:48
categories: 项目
tags: flarum
keywords: flarum,bbs,清论坛
description: flarum是一个比较新兴的开源论坛，在国内已经有中文社区

---

* auto-gen TOC:
{:toc}

## 说明

flarum是一个比较新兴的开源论坛，脱胎于[esoTalk][4]，[为什么创建flarum][4]介绍了这个项目的缘由。

不过flarum目前还是beta版本，官方不建议在生产环境中使用。

## 系统要求

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

	yum install -y gcc make libxml2-devel

解压后，进入进行编译：

	./configure -h 
	./configure --prefix=/opt/php-7.2.0
	make install 

## 参考

1. [flarum][1]
2. [flarum: installation][2]
3. [flarum中文社区][3]
4. [为什么创建flarum][4]
5. [esotalk][5]
6. [php composer][6]
7. [php官网][7]

[1]: http://flarum.org/  "flarum" 
[2]: http://flarum.org/docs/installation/ "flarum: installation"
[3]: http://discuss.flarum.org.cn/ "flarum中文社区"
[4]: http://discuss.flarum.org.cn/d/115 "为什么创建flarum"
[5]: https://esotalk.org/ "esotalk"
[6]: https://getcomposer.org/  "php composer"
[7]: http://php.net/  "php官网"
