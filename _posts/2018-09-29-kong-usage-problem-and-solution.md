---
layout: default
title: "API网关Kong学习笔记（零）: 使用过程中遇到的问题以及解决方法"
author: 李佶澳
createdate: "2018-10-15 11:50:58 +0800"
last_modified_at: "2019-05-20 14:47:45 +0800"
categories: 问题
tags: kong
keywords: kong,apigatway,问题解决,kong的使用
description: 这里记录使用Kong时遇到的问题，以及找到的解决方法
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这里记录使用Kong时遇到的问题，以及找到的解决方法。

{% include kong_pages_list.md %}

## ERROR:  module 'socket' not found:No LuaRocks module found for socket

启动的时候：

	# ./bin/kong start -c ./kong.conf
	...
	ERROR: ./kong/globalpatches.lua:63: module 'socket' not found:No LuaRocks module found for socket
	...

这是因为编译kong之后，重新编译了luarocks，并且将luarocks安装在了其它位置。重新编译kong之后解决。

## ERROR: function to_regclass(unknown) does not exist (8)

创建数据库的时候：

	# kong migrations up -c ./kong.conf
	...
	[postgres error] could not retrieve current migrations: [postgres error] ERROR: function to_regclass(unknown) does not exist (8)
	...

这是因为PostgreSQL的版本太低了，`to_regclass`在PostgreSQL 9.4及以上的版本中才存在。

	yum install https://download.postgresql.org/pub/repos/yum/9.6/redhat/rhel-7-x86_64/pgdg-centos96-9.6-3.noarch.rpm
	yum install postgresql96
	yum install postgresql96-server

## nginx: [emerg] unknown directive "real_ip_header" in /usr/local/kong/nginx-kong.conf:73

	nginx: [emerg] unknown directive "real_ip_header" in /usr/local/kong/nginx-kong.conf:73

这是因为编译的openresty的时候，没有指定`--with-http_realip_module`，重新编译安装：

	./configure --with-pcre-jit --with-http_ssl_module --with-http_realip_module --with-http_stub_status_module --with-http_v2_module
	make -j2
	make install     //默认安装在/usr/local/bin/openresty
	export PATH=/usr/local/openresty/bin:$PATH

## 用siege压测时，连接被reset：read error Connection reset by peer sock.c
 
siege压测时遇到一个问题：

```bash
[root@192.168.33.11 vagrant]# siege -q -c 10 -b -t 10s -H "host: echo.com"  192.168.33.12:7000
[error] socket: read error Connection reset by peer sock.c:539: Connection reset by peer
[error] socket: read error Connection reset by peer sock.c:539: Connection reset by peer
siege aborted due to excessive socket failure; you can change the failure threshold in $HOME/.siegerc
```

可以修改`$HOME/.siege/siege.conf`中的配置，增加容忍的失败数：

	failures =  1024         # 可以容忍的失败数

把failures调高，是治标不治本的做法，还要找到被reset的原因，但是在nginx日志和dmesg中都没有找到日志，access.log中的请求日志全部是成功的。

从[Tuning NGINX for Performance](https://www.nginx.com/blog/tuning-nginx/)知道了[keepalive_requests](https://nginx.org/en/docs/http/ngx_http_core_module.html?&_ga=2.131946575.1318856059.1542940760-488530544.1533263950#keepalive_requests)，这个参数限制了一个keep-alive连接中可以发起的请求的数量，调大即可：

```bash
	server {
	    listen       7000 ;
	    listen       [::]:7000 ;
	    server_name  echo.com;                         # 在本地host配置域名
	    keepalive_requests  10000000;
	
	    location / {
	      proxy_pass http://172.16.128.20:8080;
	    }
	}
```

如果请求时持续时间很长，还可以修改[keepalive_timeout](https://nginx.org/en/docs/http/ngx_http_core_module.html?&_ga=2.57676906.1318856059.1542940760-488530544.1533263950#keepalive_timeout)，增加keep-alive长连接的保持时间。

## 用ab压测时收到：apr_socket_recv: Connection reset by peer (104)

ab用1万并发压测时，压测到一半出现错误：

```bash
Completed 10000 requests
Completed 20000 requests
Completed 30000 requests
Completed 40000 requests
Completed 50000 requests
Completed 60000 requests
Completed 70000 requests
apr_socket_recv: Connection reset by peer (104)
Total of 73057 requests completed

```

从[apache ab压力测试报错（apr_socket_recv: Connection reset by peer (104)）](https://www.cnblogs.com/felixzh/p/8295471.html)中得知，这是因为内核防护syn flood的功能导致。

关闭`tcp_syncookies`：

```
# vim /etc/sysctl.conf 
net.ipv4.tcp_syncookies = 0
net.ipv4.tcp_max_syn_backlog = 1000000
# sysctl -p
```

## kong: epoll_wait() reported that client prematurely closed connection

用ab压测的用kong代理的服务的时候，被reset:

```bash
➜   ✗ ab -k -n 10000 -c 10 -H "Host: echo.com" http://192.168.33.12:8000/
This is ApacheBench, Version 2.3 <$Revision: 1826891 $>
Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
Licensed to The Apache Software Foundation, http://www.apache.org/

Benchmarking 192.168.33.12 (be patient)
Completed 1000 requests
Completed 2000 requests
Completed 3000 requests
Completed 4000 requests
Completed 5000 requests
apr_socket_recv: Connection reset by peer (54)
Total of 5049 requests completed
```

kong的日志里有一条：

```bash
2018/11/22 17:54:31 [info] 30893#30893: *23735 epoll_wait() reported that client prematurely closed connection, so upstream connection is closed too while sending request to upstream, client: 192.168.33.1, server: kong, request: "GET / HTTP/1.0", upstream: "http://172.16.128.11:8080/", host: "echo.com"
```

ab命令是在mac上执行的，目标机器是Mac上的虚拟机，如果从另一台虚拟上用ab测试，不会出现这个问题。

比较奇怪的是，同样在mac上发起测试，测试目标是通一台机器上的nginx服务时，就没有这个问题，mac上的ab有一些不同的地方？

## 添加新插件后，启动失败: postgres database 'kong' is missing migration: (path-rewrite) 

开发了一个名为`path-rewrite`的插件，安装配置后，启动kong报错：

	2018/11/13 16:54:57 [warn] 28677#28677: [lua] log.lua:63: log(): postgres database 'kong' is missing migration: (path-rewrite) 2018-11-09_multiple_orgins
	2018/11/13 16:54:57 [error] 28677#28677: init_by_lua error: /usr/share/lua/5.1/kong/init.lua:200: [postgres error] the current database schema does not match this version of Kong. Please run `kong migrations up` to update/initialize the database schema. Be aware that Kong migrations should only run from a single node, and that nodes running migrations concurrently will conflict with each other and might corrupt your database schema!
	stack traceback:
			[C]: in function 'assert'
			/usr/share/lua/5.1/kong/init.lua:200: in function 'init'
			init_by_lua:3: in main chunk

在使用新插件之前，需要用`migrations`子命令更新一下数据库：

	$ bash ./resty.sh kong/bin/kong  migrations up -c kong.conf
	migrating path-rewrite for database kong
	path-rewrite migrated up to: 2018-11-09_multiple_orgins
	1 migrations ran

## [postgres error] could not retrieve server_version: timeout

数据库配置错误，kong连不上postgres，导致的错误：

	2018/11/13 16:16:37 [error] 25993#25993: init_by_lua error: /usr/share/lua/5.1/kong/init.lua:197: [postgres error] could not retrieve server_version: timeout
	stack traceback:
	        [C]: in function 'error'
	        /usr/share/lua/5.1/kong/init.lua:197: in function 'init'
	        init_by_lua:3: in main chunk

## nginx: [emerg] host not found in syslog server "kong-hf.mashape.com:61828"

kong不能启动，查看日志发现：

	systemd[1]: Starting kong-proxy...
	openresty[433]: nginx: [emerg] host not found in syslog server "kong-hf.mashape.com:61828" in /usr/local/kong-proxy/nginx-kong.conf:3
	systemd[1]: kong-proxy.service: main process exited, code=exited, status=1/FAILURE
	systemd[1]: Unit kong-proxy.service entered failed state.
	systemd[1]: kong-proxy.service failed.
	systemd[1]: kong-proxy.service holdoff time over, scheduling restart.
	systemd[1]: start request repeated too quickly for kong-proxy.service
	systemd[1]: Failed to start kong-proxy.
	systemd[1]: Unit kong-proxy.service entered failed state.
	systemd[1]: kong-proxy.service failed.

重点是第二行日志：

	openresty[433]: nginx: [emerg] host not found in syslog server "kong-hf.mashape.com:61828" in /usr/local/kong-proxy/nginx-kong.conf:3

`kong-hf.mashape.com:61828`这个syslog server连接不上，nginx-kong.conf中配置了这个syslog服务器：

	error_log syslog:server=kong-hf.mashape.com:61828 error;

搜索到这个解答：[nginx.conf points to mashape syslog server #1478](https://github.com/Kong/kong/issues/1478)

kong的配置中有一个匿名报告的配置项，默认是开启的，会把kong运行产生的错误信息上传到kong公司的日志服务器：

	#anonymous_reports = on          # Send anonymous usage data such as error
	                                 # stack traces to help improve Kong.

将这行配置去掉注释，并且修改为off：

	anonymous_reports = off          # Send anonymous usage data such as error
	                                 # stack traces to help improve Kong.

## kong prepare时，提示找不到kong模块： error loading module 'kong' 

	$ resty -I /usr/lib64/lua/5.1  kong/bin/kong prepare -c ./kong.conf
	nginx: the configuration file /usr/local/kong/nginx.conf syntax is ok
	nginx: [error] init_by_lua error: error loading module 'kong' from file '/usr/lib64/lua/5.1':
		cannot read /usr/lib64/lua/5.1: Is a directory
	stack traceback:
		[C]: at 0x7fbb4b8275b0
		[C]: in function 'require'
		init_by_lua:2: in main chunk
	nginx: configuration file /usr/local/kong/nginx.conf test failed

在根目录中查找，发现kong位于下面的目录中：

	# find . -name "kong"
	/usr/share/lua/5.1/kong
	/usr/lib64/luarocks/rocks/kong

在kong.conf中配置lua包的查找路径：

	lua_package_path =/usr/share/lua/5.1/?.lua;/usr/share/lua/5.1/?/init.lua;./?.lua;./?/init.lua;

增加了两个路径：

	/usr/share/lua/5.1/?.lua;
	/usr/share/lua/5.1/?/init.lua;

只增加这两个路径，可能还不够，可能还会提示找不到`luarocks.loader`：

	Error: could not prepare Kong prefix at /usr/local/kong: nginx configuration is invalid (exit code 1):
	nginx: the configuration file /usr/local/kong/nginx.conf syntax is ok
	nginx: [error] init_by_lua error: /usr/share/lua/5.1/kong/init.lua:27: module 'luarocks.loader' not found:

	# find . -type d -name "luarocks"
	/usr/lib64/luarocks
	/usr/lib64/lua/5.1/luarocks

`luarocks.loader`模块位于/usr/lib64/lua/5.1目录中，继续增加了两个路径：

	/usr/lib64/lua/5.1/?.lua;
	/usr/lib64/lua/5.1/?/init.lua;

最终配置如下：

	lua_package_path =/usr/lib64/lua/5.1/?.lua;/usr/lib64/lua/5.1/?/init.lua;/usr/share/lua/5.1/?.lua;/usr/share/lua/5.1/?/init.lua;./?.lua;./?/init.lua;

## ERROR: ./kong:3: module 'luarocks.loader' not found:

通过源代码安装的kong，执行bin/kong命令是报错：

	[root@localhost kong]# ./bin/kong -h
	ERROR: ./bin/kong:3: module 'luarocks.loader' not found:
		no field package.preload['luarocks.loader']
		no file '/usr/local/openresty/site/lualib/luarocks/loader.ljbc'
		no file '/usr/local/openresty/site/lualib/luarocks/loader/init.ljbc'
		no file '/usr/local/openresty/lualib/luarocks/loader.ljbc'
	    ...

提示找不到`luarocks.loader`，查看rpm安装信息，发现安装在/usr/lib64/lua/5.1目录中：

	# rpm -ql luarocks |grep loader
	/usr/lib64/lua/5.1/luarocks/loader.lua

但是package.path中是包含这个路径的：

	[root@localhost kong]# lua
	Lua 5.1.4  Copyright (C) 1994-2008 Lua.org, PUC-Rio
	> print(package.path)
	./?.lua;/usr/share/lua/5.1/?.lua;/usr/share/lua/5.1/?/init.lua;/usr/lib64/lua/5.1/?.lua;/usr/lib64/lua/5.1/?/init.lua
	>

在resty中打印package.path，发现没有包含/usr/lib64/路径：

	$ cat a.lua
	print(package.path)
	
	$ resty a.lua
	/usr/local/openresty/site/lualib/?.ljbc;
	/usr/local/openresty/site/lualib/?/init.ljbc;
	/usr/local/openresty/lualib/?.ljbc;
	/usr/local/openresty/lualib/?/init.ljbc;
	/usr/local/openresty/site/lualib/?.lua;
	/usr/local/openresty/site/lualib/?/init.lua;
	/usr/local/openresty/lualib/?.lua;
	/usr/local/openresty/lualib/?/init.lua;
	./?.lua;
	/usr/local/openresty/luajit/share/luajit-2.1.0-beta3/?.lua;
	/usr/local/share/lua/5.1/?.lua;
	/usr/local/share/lua/5.1/?/init.lua;
	/usr/local/openresty/luajit/share/lua/5.1/?.lua;
	/usr/local/openresty/luajit/share/lua/5.1/?/init.lua

用resty命令运行，用参数-I指定/usr/lib64/lua/5.1路径即可：

	resty -I /usr/lib64/lua/5.1  bin/kong  version

## Mac编译kong的代码时："Unknown number type, check LUA_NUMBER_* in luaconf.h"

在Mac上编译Kong的代码时报错：

	Do not use 'module' as a build type. Use 'builtin' instead.
	env MACOSX_DEPLOYMENT_TARGET=10.8 gcc -O2 -fPIC -I/usr/local/opt/lua/include/lua5.3 -c bit.c -o bit.o
	bit.c:79:2: error: "Unknown number type, check LUA_NUMBER_* in luaconf.h"
	#error "Unknown number type, check LUA_NUMBER_* in luaconf.h"

Wireshark的邮件组里[有同样的问题](https://www.wireshark.org/lists/wireshark-dev/201501/msg00211.html)，说是:

	macosx-setup.sh installs Lua 5.3 by default, and lua_bitop.c hasn't yet been ported to 5.3 yet.

用brew安装5.1版本的lua：

	brew install lua@5.1

然后修改kong的makefile，添加了`--lua-dir`，指定使用lua 5.1：

	install:
		@luarocks make OPENSSL_DIR=$(OPENSSL_DIR) CRYPTO_DIR=$(OPENSSL_DIR)   --lua-dir=/usr/local/opt/lua@5.1

## 在ingress中设置了key-auth plugin，kong-ingress-controller更新kong中的plugin失败

Kong-Ingress-Controller的版本是0.2.0，Kong的版本是0.14.1。

在Ingress中通过annotations关联了一个名为plugin-key-auth-user1的KongPlugin：

	metadata:
	  annotations:
	    plugins.konghq.com: plugin-key-auth-user1

plugin-key-auth-user1的定义：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: plugin-key-auth-user1
	  namespace: demo-webshell
	consumerRef: webshell-user1
	disabled: false  # optional
	config:
	  key_names: key
	plugin: key-auth

这个KongPlugin被同步到Kong中了，并且绑定到了Route，但是kong-ingress-controller不停的提示错误：

{% raw %}

	W1016 17:48:00.843560       5 kong.go:346] there is no custom Ingress configuration for rule demo-webshell/webshell-ingress
	W1016 17:48:00.856768       5 kong.go:739] there is no custom Ingress configuration for rule demo-webshell/webshell-ingress
	I1016 17:48:00.866336       5 kong.go:892] plugin plugin-key-auth-user1 configuration in kong is outdated. Updating...
	I1016 17:48:00.866363       5 kong.go:914] plugin key-auth configuration in kong is up to date.
	E1016 17:48:00.868987       5 controller.go:130] unexpected failure updating Kong configuration:
	updating a Kong plugin 
	{{{ } {      0 0001-01-01 00:00:00 +0000 UTC <nil> <nil> map[] map[] [] nil [] } 6d8c9e88-1211-4cfd-8410-c7d3a727f3e4 [] 0 0} key-auth map[key_names:key] false  8c81fdb6-4bff-4807-9e38-ab9c22c24a88 5433234c-d158-11e8-9da4-525400c042d5} in service d83a1539-3ce0-4bf2-9d44-4975a704c744: the server rejected our request for an unknown reason (patch plugins.meta.k8s.io)
	W1016 17:48:00.869003       5 queue.go:113] requeuing demo-webshell/plugin-key-auth-user1, err updating a Kong plugin 
	{{{ } {      0 0001-01-01 00:00:00 +0000 UTC <nil> <nil> map[] map[] [] nil [] } 6d8c9e88-1211-4cfd-8410-c7d3a727f3e4 [] 0 0} key-auth map[key_names:key] false  8c81fdb6-4bff-4807-9e38-ab9c22c24a88 5433234c-d158-11e8-9da4-525400c042d5} in service d83a1539-3ce0-4bf2-9d44-4975a704c744: the server rejected our request for an unknown reason (patch plugins.meta.k8s.io)

{% endraw %}

问题应该出在Service的同步过程中：

	func (n *NGINXController) OnUpdate(ingressCfg *ingress.Configuration) error {
		...
		checkServices, err := n.syncServices(ingressCfg)
		if err != nil {
			return err
		}
		
		checkRoutes, err := n.syncRoutes(ingressCfg)
		if err != nil {
			return err
		}
		...

结合日志中的`updating a Kong plugin .... in service`定位到是service的同步过程中，更新service的plugin时失败。

查询admin-api的日志，更新kong-plugin时，400错误：

	127.0.0.1 - - [16/Oct/2018:18:21:27 +0000] "PATCH /plugins/6d8c9e88-1211-4cfd-8410-c7d3a727f3e4 HTTP/1.1" 400 60 "-" "Go-http-client/1.1"

从同事那里得知，把KongPlugin中的consumerRef去掉以后，就正常了：

	consumerRef: webshell-user1

一试验果然如此。

查代码发现，当KongPlugin中指定了consumerRef的时候，如果Kong中的plugins没有设置consumer_id，那么就要更新Kong中的plugin。然后更新Kong中的Plugin的ConsumerID时，报错。

可能是kong的bug，稍后追究（2018-10-17 17:45:34)

## 全局插件disable之后，重新enable不生效，需要重启kong-proxy

创建了一个全局的key-auth插件，开始不生效，重启kong-proxy以后生效。

后来，将全局的key-auth disable之后，插件正常关闭了。

但是重新将key-auth enable之后，插件还是不工作状态。

怀疑kong-proxy的数据同步有问题。

## Kong Ingress Controller 查询不到Kong的资源

Ingress Controller日志如下：

	Failed to list *v1.KongIngress: the server could not find the requested resource (get kongingresses.configuration.konghq.com)

这是没有在Kubernetes中创建CRD的缘故。

## KongPlugin没有被同步到Kong中：unexpected failure updating Kong configuration

Kong-Ingress-Controller的版本是2.0.0，CommitID：34e9b4165ab64318d00028f42b797e77dac65e24。

KongPlugin如下：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  labels:
	    global: "true"
	  name: test-key-auth-plu
	  namespace: kong-test
	consumerRef: test-key-auth-consum
	config:
	  enabled: "true"
	  name: key-auth
	plugin: key-auth


ingress-controller报错，日志如下：

{% raw %}

	E1015 10:34:12.964487       6 controller.go:130] unexpected failure updating Kong configuration:
		creating a global Kong plugin 
		&{{{ } { 0 0001-01-01 00:00:00 +0000 UTC <nil> <nil> map[] map[] [] nil [] }  [] 0 0} key-auth map[enabled:true name:key-auth route_id:11294ad6-8ec4-4654-bc5a-2bed77104042 service_id:5fc16f76-f3c5-480d-a3db-280236f728e8] false }: 
		the server rejected our request for an unknown reason (post plugins.meta.k8s.io)
	W1015 10:34:12.964514       6 queue.go:113] requeuing , err creating a global Kong plugin 
		&{{{ } {      0 0001-01-01 00:00:00 +0000 UTC <nil> <nil> map[] map[] [] nil [] }  [] 0 0} key-auth map[enabled:true name:key-auth route_id:11294ad6-8ec4-4654-bc5a-2bed77104042 service_id:5fc16f76-f3c5-480d-a3db-280236f728e8] false   }: 
		the server rejected our request for an unknown reason (post plugins.meta.k8s.io)
{% endraw %}

Kong的API日志中报错：

	127.0.0.1 - - [15/Oct/2018:10:47:29 +0000] "POST /plugins HTTP/1.1" 400 90 "-" "Go-http-client/1.1"

日志显示是创建


## KongConsumer、KongPlugin等信息没有被同步到Kong中

Kong-Ingress-Controller的版本是2.0.0，CommitID：34e9b4165ab64318d00028f42b797e77dac65e24。

在Kubernetes中创建了[kong-ingress-controller][4]定义的名为KongConsumer的CRD，在Kong中发现了Consumer，但是设置的KongPlugin信息没有被同步到Kong中。

阅读kong-ingress-controller代码，kong默认监听所有namespace中与kong相关的资源，排除“没有被监听”的原因。

用下面的命令查看kong-ingress-controller的容器日志：

	kubectl -n kong logs  kong-ingress-controller-b9796b9fb-rldk8 -c  ingress-controller

发现kong-ingress-controller将consumer同步到kong中时，报错:

	I1013 02:36:44.996477       6 controller.go:127] syncing Ingress configuration...
	I1013 02:36:45.543560       6 kong.go:592] checking if Kong consumer webshell-user1 exists
	I1013 02:36:45.543628       6 kong.go:592] checking if Kong consumer lendapp exists
	I1013 02:36:45.543649       6 kong.go:598] Creating Kong consumer fb933c81-cd2d-11e8-9cc4-525400160f15
	E1013 02:36:45.544693       6 controller.go:130] unexpected failure updating Kong configuration:
	creating a Kong consumer: the server rejected our request for an unknown reason (put consumers.meta.k8s.io fb933c81-cd2d-11e8-9cc4-525400160f15)
	W1013 02:36:45.544716       6 queue.go:113] requeuing demo-webshell/webshell-user1, err creating a Kong consumer: the server rejected our request for an unknown reason (put consumers.meta.k8s.io fb933c81-cd2d-11e8-9cc4-525400160f15)

查看admin-api日志，发现创建consumer时400错误：

	127.0.0.1 - - [15/Oct/2018:05:58:28 +0000] "PUT /consumers/fb933c81-cd2d-11e8-9cc4-525400160f15 HTTP/1.1" 400 259 "-" "Go-http-client/1.1"

用下面的命令找出了所有的KongConsumer：

	kubectl get kc --all-namespaces

发现ID为`fb933c81-cd2d-11e8-9cc4-525400160f15`的KongConsumer配置错误。

查看代码`internal/ingress/controller/kong.go`，继而发现同步Consumer的时候，如果一个Consumer处理出错，会退出整个循环:

	func (n *NGINXController) syncConsumers() error {
		...
		for _, consumer := range n.store.ListKongConsumers() {
			glog.Infof("checking if Kong consumer %v exists", consumer.Name)
			consumerID := fmt.Sprintf("%v", consumer.GetUID())
			...
			if res.StatusCode != http.StatusCreated {
				return errors.Wrap(res.Error(), "creating a Kong consumer")
			}
		...

并且，这个问题会导致后续证书同步、Plugin同步都得不到执行。。。

	func (n *NGINXController) OnUpdate(ingressCfg *ingress.Configuration) error {
		...
		err := n.syncConsumers()
		if err != nil {
			return err
		}
		
		err = n.syncCredentials()
		if err != nil {
			return err
		}
		
		err = n.syncGlobalPlugins()
		if err != nil {
			return err
		}

将导致卡壳的KongConsumer被删除。


## 参考

1. [Nginx、OpenResty和Kong的基本概念与使用方法][1]
2. [API网关Kong与Kubernetes集成的方法][2]
3. [API网关Kong的功能梳理和插件使用（测试与评估)][3]
4. [Kubernetes Ingress Controller for Kong][4]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html "Nginx、OpenResty和Kong的基本概念与使用方法"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html "API网关Kong与Kubernetes集成的方法"
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features.html "API网关Kong的功能梳理和插件使用（测试与评估)"
[4]: https://github.com/Kong/kubernetes-ingress-controller "Kubernetes Ingress Controller for Kong"
