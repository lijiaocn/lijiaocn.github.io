---
layout: default
title: "Nginx学习笔记（二）：Nginx配置文件细节"
author: 李佶澳
createdate: "2018-11-22 18:17:36 +0800"
changedate: "2018-11-22 18:17:36 +0800"
categories: 项目
tags: nginx  
keywords: nginx,学习笔记
description: 研究一下nginx的配置项，这是一项持续性的工作，力求全面覆盖
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

nginx的配置是相当多，一次性学完不太现实，边学习边记录，遇到就记录。

## 配置上下文

nginx中的配置指令是有上下文的，它们只能在特定上下文中使用。

## main context 

`main context`是最顶层的上下文，它就是nginx.conf文件本身，在nginx.conf中直接出现的命令就是位于main context中。

```bash
# 直接出现在nginx.conf中的指令
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

# Load dynamic modules. See /usr/share/nginx/README.dynamic.
include /usr/share/nginx/modules/*.conf;
#### 省略后续内容 ### 
```

[worker_rlimit_nofile](http://nginx.org/en/docs/ngx_core_module.html#worker_rlimit_nofile)：可以打开的文件数量上限。

## event context

[events context](http://nginx.org/en/docs/ngx_core_module.html#events)包含的是和连接相关的配置，例如：

```bash
events {
    accept_mutex on
    use  epoll;                # 一般不用设置，nginx会自己选择
    worker_connections 1024;   # 每个worker可以建立的连接数
    ...
}
```

### 连接处理相关配置

nginx支持多种连接处理方式([Connection processing methods](http://nginx.org/en/docs/events.html)) ，例如`select`、`poll`、`kqueue`、`epoll`、`/dev/poll`、`eventport`，nginx默认会选择最合适的处理方式，可以用[use指令](http://nginx.org/en/docs/ngx_core_module.html#use)更改。

连接相关的配置在[event context][2]上下文中配置。

[accept_mutex](http://nginx.org/en/docs/ngx_core_module.html#accept_mutex)：如果开启，工作进程轮流接受请求，可以节省系统资源。

[accept_mutex_delay](http://nginx.org/en/docs/ngx_core_module.html#accept_mutex_delay)：accept_mutex开启的前提下，重新开始接受请求的等待时间。

[debug_connection](http://nginx.org/en/docs/ngx_core_module.html#debug_connection)：开启连接调试日志，nginx需要在编译时指定了`--with-debug`。

[multi_accept](http://nginx.org/en/docs/ngx_core_module.html#multi_accept)：每次只接收一个新建连接，或者可以同时接受多个新建连接。

[use](http://nginx.org/en/docs/ngx_core_module.html#use)：设置连接的处理方法。

[worker_connections](http://nginx.org/en/docs/ngx_core_module.html#worker_connections)：一个nginx工作进程可以同时处理的最大连接数。

[worker_aio_requests](http://nginx.org/en/docs/ngx_core_module.html#worker_aio_requests)：开启[异步io](http://nginx.org/en/docs/http/ngx_http_core_module.html#aio)的情况下，单个工作进程的异步io操作数量上限。

## http context

### server context

摘录自[How nginx processes a request](http://nginx.org/en/docs/http/request_processing.html)。

#### server context配置

server context可以有多个，每个server设置一个监听端口，多个server可以复用同一个监听端口，通过server_name进行区分：

	server {
	    listen      80;
	    server_name example.org www.example.org;
	    ...
	}
	
	server {
	    listen      80;
	    server_name example.net www.example.net;
	    ...
	}
	
	server {
	    listen      80;
	    server_name example.com www.example.com;
	    ...
	}

`server_name`就是http请求头中的`Host`字段的值，可以设置一个`default_server`，处理没有对应server的请求：

	server {
	    listen      80 default_server;
	    server_name example.net www.example.net;
	    ...
	}

server的IP地址可以不同，default_server相对于IP:Port的：

	server {
	    listen      192.168.1.1:80 default_server;
	    server_name example.net www.example.net;
	    ...
	}
	
	server {
	    listen      192.168.1.2:80 default_server;
	    server_name example.com www.example.com;
	    ...
	}

如果要禁止请求头中不带`Host`字段的请求，可以设置这样一个server：

	server {
	    listen      80;
	    server_name "";
	    return      444;
	}

##### server_name的样式

`server_name`可以是[通配符形式](http://nginx.org/en/docs/http/server_names.html#wildcard_names)，通配符只能出现在`开头或者结尾`：

	*.example.org
	abc.*
	abc.*.org        # 错误
	.example.org     # 等同于 example.org + *. example.org

`server_name`的[正则形式](http://nginx.org/en/docs/http/server_names.html#regex_names)表达能力更强，正则形式必须用`~`开头：

	server_name  ~^www\d+\.example\.net$;                     # `.`需要用`\`进行转义
	server_name  "~^(?<name>\w\d{1,3}+)\.example\.net$";      # 如果含有{ }，整个表达式需要用加引号
	                                                          # 否则会出错： directive "server_name" is not terminated by ";" in ...

正则表达式采用[PCRE](http://www.pcre.org/)，支持捕获：

```bash
server {
    server_name   ~^(www\.)?(?<domain>.+)$;

    location / {
        root   /sites/$domain;
    }
}
```

注意location中的`$domain`即使从正则中捕获的值，PCRE的命名捕获语法如下：

	?<name> 	Perl 5.10 compatible syntax, supported since PCRE-7.0
	?'name' 	Perl 5.10 compatible syntax, supported since PCRE-7.0
	?P<name> 	Python compatible syntax, supported since PCRE-4.0

如果遇到下面的错误：

    pcre_compile() failed: unrecognized character after (?< in ...

是因为PCRE版本比较旧，不支持命名捕获，需要使用数字的形式，注意下面的`$2`：

```bash
server {
    server_name   ~^(www\.)?(.+)$;

    location / {
        root   /sites/$2;
    }
}
```

##### 一些特殊的server_name

`空`的server_name，表示接受没有`Host`字段的请求，注意下面的`""`：

```bash
server {
    listen       80;
    server_name  example.org  www.example.org  "";
    ...
}
```

如果没有server_name，默认是使用`空`的server_name：

```bash
server {
    listen       80;
    ...
}
```

server_name可以是IP地址，请求头中的`Host`字段的值依旧需要且是IP地址。

如果要匹配所有的server_name，设置为default_server，server_name设置为一个无效值：

```bash
server {
    listen       80  default_server;
    server_name  _;     
    return       444;
}
```

非英文的域名需要用ASCII码表示，例如`пример.испытание`：

```bash
server {
    listen       80;
    server_name  xn--e1afmkfd.xn--80akhbyknj4f;  # пример.испытание
    ...
}
```

##### server_name优化

直接的server_name、用通配符开头的server_name和用通配符结束的server_name，分别被存放在三个[哈希表](http://nginx.org/en/docs/hash.html)中。

查找的时候，首先从直接的server_name中查找，然后从以通配符开头的server_name中查找，再从以通配符结尾的server_name中查找，最后是按照正则形式的server_name的出现顺序进行正则匹配。

从直接的server_name中查找速度是最快的，应当尽可能多的使用直接的server_name。

下面这种形式，比直接使用`.example.org`效率高，（以`.`开头server_name存放在以通配符开头的server_name哈希表中）：

```bash
server {
    listen       80;
    server_name  example.org  www.example.org  *.example.org;
    ...
}
```

哈希桶的数量可以调整，哈希桶数量的翻倍增加(2的指数)。

[server_names_hash_max_size](http://nginx.org/en/docs/http/ngx_http_core_module.html#server_names_hash_max_size)设置的是server_name的最大长度，[server_names_hash_bucket_size ](http://nginx.org/en/docs/http/ngx_http_core_module.html#server_names_hash_bucket_size)设置的是哈希桶的数量。

#### location context

摘录自[How nginx processes a request](http://nginx.org/en/docs/http/request_processing.html)。

location是server context中的context，匹配url：

	server {
	    listen      80;
	    server_name example.org www.example.org;
	    root        /data/www;
	
	    location / {
	        index   index.html index.php;
	    }
	
	    location ~* \.(gif|jpg|png)$ {
	        expires 30d;
	    }
	
	    location ~ \.php$ {
	        fastcgi_pass  localhost:9000;
	        fastcgi_param SCRIPT_FILENAME
	                      $document_root$fastcgi_script_name;
	        include       fastcgi_params;
	    }
	}

url分为`前缀形式`和`正则形式`两种，查找请求对应的location时，先进行前缀匹配，选择最长匹配的location。

如果通过前缀匹配没有找到对应的location，在通过正则匹配查找，按照正则形式的url在配置文件中出现的顺序查找，一旦匹配就停止查找。

查找请求对应的location时，只考虑uri，不考虑参数。

### upstream context

upstream中上下文位于http context中，是用来设置多个后端服务地址，以及负载均衡策略的，[Using nginx as HTTP load balancer](http://nginx.org/en/docs/http/load_balancing.html)。

```bash
http {
    upstream myapp1 {
        server srv1.example.com;
        server srv2.example.com;
        server srv3.example.com;
    }

    server {
        listen 80;

        location / {
            proxy_pass http://myapp1;
        }
    }
}
```

反向代理支持`http`、`https`、`FastCGI`、`uwsgi`、`SCGI`、`memcached`和`gRPC`，http和https直接在[proxy_pass](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)中使用即可，其它的需要使用对应的指令：
[fastcgi_pass](http://nginx.org/en/docs/http/ngx_http_fastcgi_module.html#fastcgi_pass)，
[uwsgi_pass](http://nginx.org/en/docs/http/ngx_http_uwsgi_module.html#uwsgi_pass)，
[scgi_pass](http://nginx.org/en/docs/http/ngx_http_scgi_module.html#scgi_pass)，
[memcached_pass](http://nginx.org/en/docs/http/ngx_http_memcached_module.html#memcached_pass)，
[grpc_pass](http://nginx.org/en/docs/http/ngx_http_grpc_module.html#grpc_pass)。

支持的负载均衡算法有：[least_conn](http://nginx.org/en/docs/http/ngx_http_upstream_module.html#least_conn)，[ip_hash](http://nginx.org/en/docs/http/ngx_http_upstream_module.html#ip_hash)，
[weight](http://nginx.org/en/docs/http/ngx_http_upstream_module.html#server)

```bash

# least_conn方式
upstream myapp1 {
    least_conn;
    server srv1.example.com;
    server srv2.example.com;
    server srv3.example.com;
}

# ip_hash方式
upstream myapp1 {
    ip_hash;
    server srv1.example.com;
    server srv2.example.com;
    server srv3.example.com;
}

# weight的方式：
upstream myapp1 {
    server srv1.example.com weight=3;
    server srv2.example.com;
    server srv3.example.com;
}
```

还有可以设置健康检查、keep-alive等，见[Health checks](http://nginx.org/en/docs/http/load_balancing.html#nginx_load_balancing_health_checks)

## 参考

1. [nginx documentation][1]
2. [events context][2]
3. [Tuning NGINX for Performance][3]

[1]: http://nginx.org/en/docs/ "nginx documentation"
[2]: http://nginx.org/en/docs/ngx_core_module.html#events  "events context"
[3]: https://www.nginx.com/blog/tuning-nginx/ "Tuning NGINX for Performance"
