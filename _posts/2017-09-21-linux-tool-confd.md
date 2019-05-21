---
layout: default
title: "confd：本地配置文件的管理工具confd"
author: 李佶澳
createdate: 2017/09/21 16:00:08
changedate: 2018/07/22 14:28:29
categories: 技巧
tags: linuxtool confd
keywords: confd,配置管理
description: confd从etcd或者consul等获取数据更新，更新本地的配置文件后，重新加载目标应用。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[confd][1]从etcd或者consul等获取数据更新，更新本地的配置文件后，重新加载目标应用。

confd支持一下backends:

	etcd
	consul
	vault
	environment variables
	redis
	zookeeper
	dynamodb
	rancher
	ssm (AWS Simple Systems Manager Parameter Store)

## 使用

在backends中写入配置项的值，以etcd为例:

	etcdctl set /myapp/subdomain myapp
	etcdctl set /myapp/upstream/app2 "10.0.1.100:80"
	etcdctl set /myapp/upstream/app1 "10.0.1.101:80"
	etcdctl set /yourapp/subdomain yourapp
	etcdctl set /yourapp/upstream/app2 "10.0.1.102:80"
	etcdctl set /yourapp/upstream/app1 "10.0.1.103:80"

在/etc/confd/conf.d/中创建`应用模版`：

{% raw %}
	[template]
	prefix = "/myapp"
	src = "nginx.tmpl"
	dest = "/tmp/myapp.conf"
	owner = "nginx"
	mode = "0644"
	keys = [
	  "/subdomain",
	  "/upstream",
	]
	check_cmd = "/usr/sbin/nginx -t -c {{.src }}"
	reload_cmd = "/usr/sbin/service nginx reload"
{% endraw %}

在/etc/confd/templates中创建`配置模版`：

{% raw %}
	upstream {{getv "/subdomain"}} {
	{{range getvs "/upstream/*"}}
	    server {{.}};
	{{end}}
	}
	
	server {
	    server_name  {{getv "/subdomain"}}.example.com;
	    location / {
	        proxy_pass        http://{{getv "/subdomain"}};
	        proxy_redirect    off;
	        proxy_set_header  Host             $host;
	        proxy_set_header  X-Real-IP        $remote_addr;
	        proxy_set_header  X-Forwarded-For  $proxy_add_x_forwarded_for;
	   }
	}
{% endraw %}

启动confd之后，confd就会监听etcd中的key，根据`应用模版`中的内容，从`配置模版`生成`配置文件`。

	confd -onetime -backend etcd -node http://127.0.0.1:2379
	confd -backend etcd -node http://127.0.0.1:2379

配置文件生成后，confd执行应用模版中指定命令进行配置文件的重新加载。

如果使用`-onetime`，则只生成一次，不持续监听、动态更新。

## 参考

1. [confd][1]
2. [confd quick start][2]

[1]: http://www.confd.io/  "confd" 
[2]: https://github.com/kelseyhightower/confd/blob/master/docs/quick-start-guide.md  "confd quick start"
