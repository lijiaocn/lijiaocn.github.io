---
layout: default
title: "API网关Kong（零）：使用过程中遇到的问题以及解决方法"
author: 李佶澳
createdate: "2018-10-15 11:50:58 +0800"
changedate: "2018-10-15 11:50:58 +0800"
categories: 问题
tags: kong 视频教程
keywords: kong,apigatway,问题解决,kong的使用
description: 这里记录使用Kong时遇到的问题，以及找到的解决方法
---

* auto-gen TOC:
{:toc}

## 说明

Kong的介绍和使用方法参考：[Nginx、OpenResty和Kong的基本概念与使用方法][1]、[API网关Kong与Kubernetes集成的方法][2]、[API网关Kong的功能梳理和插件使用（测试与评估)][3]。

这里记录使用Kong时遇到的问题，以及找到的解决方法。

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

在resty中答应package.path，发现没有包含/usr/lib64/路径：

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
