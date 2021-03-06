---
layout: default
title: WordPress的安装部署
author: 李佶澳
createdate: 2017/01/14 15:04:23
last_modified_at: 2017/10/28 12:38:18
categories: 项目
tags:  wordpress
keywords: 
description: 

---

## 目录
* auto-gen TOC:
{:toc}

## 摘要

下列操作在CentOS7.2中完成, wordpress版本是4.7。

## 准备WordPress

[wordpress download](https://wordpress.org/download/)

[wordpress requirements](https://wordpress.org/about/requirements/)

从requirements中可以看到，4.7版本的wordpress建议：

	PHP version 7 or greater
	MySQL version 5.6 or greater OR MariaDB version 10.0 or greater
	HTTPS support


## 准备CentOS系统

首先升级一下系统：

	yum upgrade

## 通过 yum 安装php

前面试图使用自行编译的php7，make test未通过。使用yum 安装 php5，CentOS7 默认用的还是 php5：

	yum install -y php-fpm php-mysql  （这种方式安装的是 php5）

建议安装 [ius](https://ius.io/setup)：

```sh
yum install \
https://repo.ius.io/ius-release-el7.rpm \
https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
```

安装 ius 中的 php7.4：

```sh
yum install -y php74-cli php74-fpm php74-mysqlnd php74-json php74-gd
```

安装完成后，本地 php 命令：：

```sh
php --version
PHP 7.4.9 (cli) (built: Aug  7 2020 13:39:18) ( NTS )
Copyright (c) The PHP Group
Zend Engine v3.4.0, Copyright (c) Zend Technologies
```


在/etc/php-fpm.d/www.conf中修改php-fpm的运行时使用身份:

	; RPM: apache Choosed to be able to access some dir as httpd
	user = nginx
	; RPM: Keep a group allowed to write in log dir.
	group = nginx

nginx、php-fpm都使用nginx身份, wordpress目录的拥有者也设置为nginx, 这样在wordpress中安装插件的时候就不需要通过ftp了。

启动 php-fpm:

```sh
systemctl start php-fpm
```

检查 php-fpm 进程：
```sh
$ ps aux|grep php-fpm
root     20627  0.0  0.8 253268  8632 ?        Ss   16:45   0:00 php-fpm: master process (/etc/php-fpm.conf)
nginx    20628  0.0  0.4 255352  4220 ?        S    16:45   0:00 php-fpm: pool www
nginx    20629  0.0  0.4 255352  4220 ?        S    16:45   0:00 php-fpm: pool www
nginx    20630  0.0  0.4 255352  4220 ?        S    16:45   0:00 php-fpm: pool www
nginx    20631  0.0  0.4 255352  4220 ?        S    16:45   0:00 php-fpm: pool www
nginx    20632  0.0  0.4 255352  4224 ?        S    16:45   0:00 php-fpm: pool www
```

## 安装nginx

nginx直接使用yum源中的版本

	yum install -y nginx

在/etc/nginx/nginx.conf配置

	server {
	    listen       80 default_server;
	    listen       [::]:80 default_server;
	    server_name  _;
	    index        index.php;
	    root         /www/wordpress;  #wordpress的文件目录       
	
	    # Load configuration files for the default server block.
	    include /etc/nginx/default.d/*.conf;
	
	    location / {
	    }
	
	    location ~ \.php$ {
	            fastcgi_index   index.php;
	            fastcgi_pass    127.0.0.1:9000;
	            fastcgi_param   SCRIPT_FILENAME    $document_root$fastcgi_script_name;
	            fastcgi_param   SCRIPT_NAME        $fastcgi_script_name;
	            include         fastcgi_params;
	    }
	
	    error_page 404 /404.html;
	        location = /40x.html {
	    }
	
	    error_page 500 502 503 504 /50x.html;
	        location = /50x.html {
	    }
	}

启动nginx

	systemctl start nginx

查看nginx日志:

	ls /var/log/nginx

## 测试php

在/www/wordpress(nginx中配置的根目录)中创建文件index.php，输入:

	<?php phpinfo() ?>

访问服务器地址后，应当看到php信息

## 安装mariadb

CentOS7的maraidb版本是5.5.52, 需要添加10版本的yum源: [mariadb 10 rpm](https://downloads.mariadb.org/mariadb/repositories/#mirror=tuna&distro=CentOS&distro_release=centos7-amd64--centos7)

创建文件/etc/yum.repos.d/MariaDB.repo, 并输入下面的内容:

	# MariaDB 10.1 CentOS repository list - created 2017-01-14 09:27 UTC
	# http://downloads.mariadb.org/mariadb/repositories/
	[mariadb]
	name = MariaDB
	baseurl = http://yum.mariadb.org/10.1/centos7-amd64
	gpgkey=https://yum.mariadb.org/RPM-GPG-KEY-MariaDB
	gpgcheck=1

安装:

	yum install MariaDB-server MariaDB-client

启动:

	systemctl start mariadb

## 创建数据库

[Installing_wordpress](https://codex.wordpress.org/Installing_WordPress)

	$ mysql -u root
	Enter password:
	Welcome to the MySQL monitor.  Commands end with ; or \g.
	Your MySQL connection id is 5340 to server version: 3.23.54
	 
	Type 'help;' or '\h' for help. Type '\c' to clear the buffer.
	 
	mysql> CREATE DATABASE databasename;
	Query OK, 1 row affected (0.00 sec)
	 
	mysql> GRANT ALL PRIVILEGES ON databasename.* TO "wordpressusername"@"hostname"
	    -> IDENTIFIED BY "password";
	Query OK, 0 rows affected (0.00 sec)
	  
	mysql> FLUSH PRIVILEGES;
	Query OK, 0 rows affected (0.01 sec)
	
	mysql> EXIT
	Bye
	$ 

如果无法远程登陆，尝试：

```sql
update user set plugin='mysql_native_password' where User='USERNAME';
flush privileges;
```

## 安装WordPress

下载wordpress源码，解压到nginx.conf中配置的目录中, 并将所属用户修改nginx。

[wordpress download](https://wordpress.org/download/)

配置：

	cp wp-config-sample.php  wp-config.php

在wp-config.php中配置数据库用户名和密码：

	// ** MySQL settings - You can get this info from your web host ** //
	/** The name of the database for WordPress */
	define('DB_NAME', 'database_name_here');
	
	/** MySQL database username */
	define('DB_USER', 'username_here');
	
	/** MySQL database password */
	define('DB_PASSWORD', 'password_here');

访问网址 [https://api.wordpress.org/secret-key/1.1/salt/ ](https://api.wordpress.org/secret-key/1.1/salt/)，将得到的salt添加到wp-config.php中。

打开网址"http://服务器地址或域名/wp-admin/install.php"，按照提示完成安装。

## 安装WordPress插件

多语言支持:

	Polylang

广告管理：

	AdRotate

## 设置开机自启动

	systemctl enable php-fpm mariadb nginx

## 配置https

制作自签署证书, 在/etc/pki/nginx中执行下列操作：

	openssl genrsa -out server.key 1024
	openssl req -new -key server.key -out server.csr
	openssl x509 -req -days 3650 -in server.csr -signkey server.key -out server.crt

然后在/etc/nginx.conf中增加配置：

	server {
	    listen       443 ssl http2 default_server;
	    listen       [::]:443 ssl http2 default_server;
	    server_name  _;
	    root         /www/wordpress;   #wordpress文件目录
	    index        index.php;
	
	    ssl_certificate "/etc/pki/nginx/server.crt";
	    ssl_certificate_key "/etc/pki/nginx/server.key";
	    ssl_session_cache shared:SSL:1m;
	    ssl_session_timeout  10m;
	    ssl_ciphers HIGH:!aNULL:!MD5;
	    ssl_prefer_server_ciphers on;
	
	    # Load configuration files for the default server block.
	    include /etc/nginx/default.d/*.conf;
	
	    location / {
	    }
	
	    location ~ \.php$ {
	            fastcgi_index   index.php;
	            fastcgi_pass    127.0.0.1:9000;
	            fastcgi_param   SCRIPT_FILENAME    $document_root$fastcgi_script_name;
	            fastcgi_param   SCRIPT_NAME        $fastcgi_script_name;
	            include         fastcgi_params;
	    }
	
	    error_page 404 /404.html;
	        location = /40x.html {
	    }
	
	    error_page 500 502 503 504 /50x.html;
	        location = /50x.html {
	    }
	}

重启nginx后，通过https://访问


## 编译安装PHP7(未通过)

>在 make test的时候，测试用例未通过！暂停使用这种方法

centos7.2的yum源中的php版本为5.4。我们不使用yum源，而是自己编译安装php7

安装编译工具：

	yum install -y gcc make autoconf
	yum install -y libxml2-devel openssl-devel libcurl-devel libpng-devel libxslt-devel
	yum install -y libjpeg libjpeg-devel libpng libpng-devel freetype freetype-devel libxml2 libxml2-devel pcre-devel

准备php7的安装目录:

	mkdir /user/local/php7
	ln -s /user/local/php7 /user/local/php

下载php7源码：[php download](http://php.net/downloads.php)

解压：

	tar -xvf php-7.1.0.tar.xz

进入解压得到的目录php-7.1.0中:

	./configure --prefix=/usr/local/php \
	 --with-curl \
	 --with-freetype-dir \
	 --with-gd \
	 --with-gettext \
	 --with-iconv-dir \
	 --with-kerberos \
	 --with-libdir=lib64 \
	 --with-libxml-dir \
	 --with-mysqli \
	 --with-openssl \
	 --with-pcre-regex \
	 --with-pdo-mysql \
	 --with-pdo-sqlite \
	 --with-pear \
	 --with-png-dir \
	 --with-xmlrpc \
	 --with-xsl \
	 --with-zlib \
	 --enable-fpm \
	 --enable-bcmath \
	 --enable-libxml \
	 --enable-inline-optimization \
	 --enable-gd-native-ttf \
	 --enable-mbregex \
	 --enable-mbstring \
	 --enable-opcache \
	 --enable-pcntl \
	 --enable-shmop \
	 --enable-soap \
	 --enable-sockets \
	 --enable-sysvsem \
	 --enable-xml \
	 --enable-zip

编译安装:

	make && make install 

复制配置文件:

	cp php.ini-development /usr/local/php/lib/php.ini
	cp /usr/local/php7/etc/php-fpm.conf.default /usr/local/php/etc/php-fpm.conf
	cp /usr/local/php7/etc/php-fpm.d/www.conf.default /usr/local/php7/etc/php-fpm.d/www.conf
	cp -R ./sapi/fpm/php-fpm /etc/init.d/php-fpm
	touch /etc/sysconfig/php-fpm

添加php-fmp服务, 新建文件/lib/systemd/system/php-fpm.service, 并输入下面的内容:

	[Unit]
	Description=The PHP FastCGI Process Manager
	After=syslog.target network.target

	[Service]
	Type=simple
	PIDFile=/usr/local/php/var/run/php-fpm.pid
	EnvironmentFile=/etc/sysconfig/php-fpm
	ExecStart=/usr/local/php/sbin/php-fpm --nodaemonize
	ExecReload=/bin/kill -USR2 $MAINPID
	PrivateTmp=true

	[Install]
	WantedBy=multi-user.target

php-fpm监听本地的9000端口:

	[root@VM_14_216_centos php-7.1.0]# netstat -lntp
	Active Internet connections (only servers)
	Proto Recv-Q Send-Q Local Address     Foreign Address    State    PID/Program name    
	tcp        0      0 0.0.0.0:111       0.0.0.0:*          LISTEN   1/systemd           
	tcp        0      0 0.0.0.0:22        0.0.0.0:*          LISTEN   13601/sshd          
	tcp        0      0 127.0.0.1:9000    0.0.0.0:*          LISTEN   30327/php-fpm: mast 
	tcp6       0      0 :::111            :::*               LISTEN   11997/rpcbind       
	tcp6       0      0 :::22             :::*               LISTEN   13601/sshd  

查看log:

	cat /usr/local/php/var/log/php-fpm.log

## 编译安装php7扩展(未通过)

>在 make test的时候，测试用例未通过！暂停使用这种方法

以安装mysqli为例:

	cd php-7.1.0/ext/mysqli
	/usr/local/php/bin/phpize
	./configure  --with-php-config=/usr/local/php/bin/php-config
	make 
	make install



## 文献

1. [Linux环境PHP7.0安装](http://blog.csdn.net/21aspnet/article/details/47708763)
