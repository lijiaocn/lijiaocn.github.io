---
layout: default
title:  配置文件动态生成工具confd的使用
author: 李佶澳
createdate: 2018/08/22 11:28:00
last_modified_at: 2018/08/28 11:51:49
categories: 项目
tags: confd
keywords: config,配置管理
description: confd是一个支持多种后端的配置文件动态生成工具

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[confd][1]是一个支持多种后端的配置文件动态生成工具，可以用来简化配置的管理、更新。

## 下载安装

	wget https://github.com/kelseyhightower/confd/releases/download/v0.16.0/confd-0.16.0-linux-amd64

下载得到的confd-0.16.0-linux-amd64就是可执行文件：

	chmod  +x confd-0.16.0-linux-amd64
	mv confd-0.16.0-linux-amd64 confd

## 对接consul

在consul中写入下面这些key:

	curl -X PUT --data "rules1" 127.0.0.1:8500/v1/kv/rules/1
	curl -X PUT --data "rules2" 127.0.0.1:8500/v1/kv/rules/2
	curl -X PUT --data "rules3" 127.0.0.1:8500/v1/kv/rules/3

consul中在rules路径下有3个key：

	$curl 127.0.0.1:8500/v1/kv/?keys
	[
	    "rules/1",
	    "rules/2",
	    "rules/3"
	]

confd的配置路径（-confdir指定的路径）中需要有conf.d和templates目录，分布存放confd的配置文件和等待渲染的配置文件模版：

	mkdir conf.d
	mkdir templates

创建confd的配置文件：

	$ cat conf.d/config.toml
	[template]
	src = "myconfig.conf.tmpl"
	dest = "myconfig.conf"
	keys = [
	    "/rules",
	    "/rules/1",
	]
	check_cmd = "touch /tmp/check"
	reload_cmd = "touch /tmp/reload"

注意check_cmd和reload_cmd分别是配置文件的检查命令，和检查通过后执行的命令，可以通过这两个参数通知目标进程重新加载配置。

其中`myconfig.conf.tmpl`是等待被渲染的配置文件模版，使用[go template][2]语法：

{% raw %}

	$ cat templates/myconfig.conf.tmpl
	[myconfig]
	
	readdirect: {{getv "/rules/1"}}
	readdirect: {{getv "/rules/2"}}
	
	{{range getvs "/rules/*"}}
	loop rule:  {{.}};
	{{end}}

{% endraw %}

启动：

	./confd -interval 10 -confdir ./ -config-file config.toml -backend consul -node 127.0.0.1:8500 &

其中`-interval`指定同步时间，单位是秒，默认是600秒，也就是说更新了consul中的数据之后，需要等待600秒才能更新配置文件。

在当前路径下将会得到`myconfig.conf`文件，修改consul中的key之后，配置文件会自动更新：

	curl -X PUT --data "new rules3" 127.0.0.1:8500/v1/kv/rules/3

注意写入到consul中的数据如果有换行，需要使用`--data-binary`，否则换行符会丢失:

	$ curl -X PUT --data-bianry @/tmp/rule3  127.0.0.1:8500/v1/kv/rules/3
	$ cat /tmp/rule3
	a
	b
	c

## 参考

1. [confd project][1]
2. [go template][2]

[1]: https://github.com/kelseyhightower/confd  "confd project" 
[2]: golang.org/pkg/text/template/#pkg-overview  "go template" 
