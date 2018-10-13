---
layout: default
title: "API网关Kong的功能梳理和插件使用（测试与评估)"
author: 李佶澳
createdate: "2018-10-10 14:37:53 +0800"
changedate: "2018-10-10 14:37:53 +0800"
categories: 项目
tags: kong kubernetes
keywords: kubernetes,kong,api,api网关
description:
---

* auto-gen TOC:
{:toc}

## 说明

通过《[Nginx、OpenResty和Kong的基本概念与使用方法][1]》了解了Kong的工作原理，通过《[API网关Kong与Kubernetes的集成方法][2]》了解了与Kubernetes的集成方法。

这里主要学习下《[Kong的插件][3]》，并尽可能试验、测试一下感兴趣的插件。因为计划将Kong与Kubernetes集成，因此下面使用的是部署在Kubernetes中的Kong，有些配置是通过Kubernetes设置的(见《[API网关Kong与Kubernetes的集成方法][2]》)。

## Kong的Admin API

先了解下[Kong的Admin API][5]，后面的操作过程中，可以通过Kong的API查看数据变化。

Kong中定义的资源，可以用下面的方法查看（创建和修改的方法直接到[Kong的Admin API][5]查看，这里不列出了）：

	GET /routers/                                #列出所有路由
	GET /services/                               #列出所有服务
	GET /consumers/                              #列出所有用户
	GET /services/{service name or id}/routes    #列出服务关联的路由
	GET /plugins/                                #列出所有的插件配置
	GET /plugins/enabled                         #列出所有可以使用的插件
	GET /plugins/schema/{plugin name}            #获得插件的配置模版
	GET /certificates/                           #列出所有的证书
	GET /snis/                                   #列出所有域名与证书的对应
	GET /upstreams/                              #列出所有的upstream
	GET /upstreams/{name or id}/health/          #查看upstream的健康状态
	GET /upstreams/{name or id}/targets/all      #列出upstream中所有的target

例如：List Services

	$ curl 10.10.173.203:32441/services 2>/dev/null |python -m json.tool
	{
	    "data": [
	        {
	            "connect_timeout": 60000,
	            "created_at": 1539153249,
	            "host": "demo-webshell.webshell.80",
	            "id": "0df71804-3f99-4e00-af5c-0234eb155228",
	            "name": "demo-webshell.webshell.80",
	            "path": "/",
	            "port": 80,
	            "protocol": "http",
	            "read_timeout": 60000,
	            "retries": 5,
	            "updated_at": 1539153249,
	            "write_timeout": 60000
	        },
	       ...
	    ],
	    "next": null
	}

列出所有可以使用的插件：

	$ curl 10.10.173.203:32441/plugins/enabled 2>/dev/null |python -m json.tool
	{
	    "enabled_plugins": [
	        "response-transformer",
	        "oauth2",
	        "acl",
	        "correlation-id",
	        "pre-function",
	        "jwt",
	        "cors",
	        "ip-restriction",
	        "basic-auth",
	        "key-auth",
	        "rate-limiting",
	        "request-transformer",
	        "http-log",
	        "file-log",
	        "hmac-auth",
	        "ldap-auth",
	        "datadog",
	        "tcp-log",
	        "zipkin",
	        "post-function",
	        "request-size-limiting",
	        "bot-detection",
	        "syslog",
	        "loggly",
	        "azure-functions",
	        "udp-log",
	        "response-ratelimiting",
	        "aws-lambda",
	        "statsd",
	        "prometheus",
	        "request-termination"
	    ]
	}

## Kong定义的资源之间的关联关系

`Router`是客户端请求的转发规则，将客户端请求与`Service`关联。

`Services`是对多个`Upstream`的抽象，是`Router`的关联目标，Service中定义了接收请求的URL。

`Consumer`是`Service`的用户。

`Plugin`是插件的配置，plugin关联到Service，或者Consumer，或者同时关联。

`Certificate`是https证书。

`Sni`是域名与Certificate的关联关系，指定了一个域名对应的https证书。

`Upstream`是负载均衡策略，定义了客户端请求分配到后端的service和target的策略。

`Target`是backend服务，是客户端请求的最后执行者。

## 目标应用

Kubernetes中部署的应用和Ingress是：[webshell-all-in-one.yaml](https://github.com/introclass/kubernetes-yamls/blob/master/all-in-one/webshell-all-in-one.yaml)：

Kong的[数据平面][4]用NodePort的方式暴露，端口是31447，下面随意选用的Node是10.10.64.58。

先验证下没有做任何配置时候的访问：

	$ curl -H "Host: webshell.com" 10.10.64.58:31447
	<html>
	<head>
	<meta content="text/html; charset=utf-8">
	<title>WebShell</title>
	</head>
	
	<body>
	
	<form method="post" accept-charset="utf-8">
	    Command: <input type="text" name="command" width="40%" value="hostname">
	    Params : <input type="text" name="params" width="80%" value="">
	    <input type="submit" value="submit">
	</form>
	<pre>
	
	webshell-cc785f4f8-p4bds
	
	</pre>
	</body>
	</html>

## 认证插件试验

### Key-Auth认证

创建名为`websehll-user1`的KongConsumer，username为`user1`:

	apiVersion: configuration.konghq.com/v1
	kind: KongConsumer
	metadata:
	  namespace: demo-webshell
	  name: webshell-user1
	username: user1

创建之后，用下面命令查看：

	$ kubectl  -n demo-webshell get KongConsumer -o wide
	NAME             AGE
	webshell-user1   1m

创建user1的访问凭证，名为`credential-webshell-user1`:

	apiVersion: configuration.konghq.com/v1
	kind: KongCredential
	metadata:
	  namespace: demo-webshell
	  name: credential-webshell-user1
	consumerRef: user1
	type: key-auth
	config:
	  key: 62eb165c070a41d5c1b58d9d3d725ca1

创建之后，用下面命令查看：

	$ kubectl -n demo-webshell get KongCredential -o wide
	NAME                        AGE
	credential-webshell-user1   2m

配置key-auth插件：


## 参考

1. [Nginx、OpenResty和Kong的基本概念与使用方法][1]
2. [API网关Kong与Kubernetes的集成方法][2]
3. [Kong的插件][3]
4. [Kong的控制平面与数据平面][4]
5. [Kong Admin API][5]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html "Nginx、OpenResty和Kong的基本概念与使用方法"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html "API网关Kong与Kubernetes的集成方法"
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#kong%E7%9A%84%E6%8F%92%E4%BB%B6 "Kong的插件"
[4]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html#Kong的控制平面与数据平面 "Kong的控制平面与数据平面"
[5]: https://docs.konghq.com/0.14.x/admin-api/ "Kong Admin API"
