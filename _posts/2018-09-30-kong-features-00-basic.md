---
layout: default
title: "API网关Kong的功能梳理和插件使用（一)：基本使用过程"
author: 李佶澳
createdate: "2018-10-10 14:37:53 +0800"
changedate: "2018-10-10 14:37:53 +0800"
categories: 项目
tags: kong kubernetes 视频教程
keywords: kubernetes,kong,api,api网关
description: 先通过部署一个webshell应用和为它设置key-auth插件的过程，了解整个使用过程。学习试用下Kong的插件，计划将Kong与Kubernetes集成，因此下面使用的是部署在Kubernetes中的Kong。
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

通过[Nginx、OpenResty和Kong的基本概念与使用方法][1]了解了Kong的工作原理，通过[API网关Kong与Kubernetes的集成方法][2]了解了与Kubernetes的集成方法。这里学习下[Kong的插件][3]，并尽可能压测一下感兴趣的插件。

因为计划将Kong与Kubernetes集成，因此下面使用的是部署在Kubernetes中的Kong，配置是通过Kubernetes的cRD设置的，参考[API网关Kong与Kubernetes的集成方法][2]。

Kong-Ingress-Controller的版本是0.2.0，Kong的版本是0.14.1，是用下面的方式部署的：

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/kong-all-in-one.yaml

## Kong的Admin API

先了解下[Kong的Admin API][5]，后面的操作过程中，可以通过Kong的API查看数据变化。

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

	$ curl 192.168.33.12:32685/services 2>/dev/null |python -m json.tool
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

	$ curl 192.168.33.12:32685/plugins/enabled 2>/dev/null |python -m json.tool
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

`Route`是请求的转发规则，按照Hostname和PATH，将请求转发给`Service`，Kubernetes的Ingress中每个`path`对应一个Route。

`Services`是多个`Upstream`的集合，是`Route`的转发目标。

`Consumer`是API的用户，里面记录用户的一些信息。

`Plugin`是插件，plugin可以是全局的，绑定到Service，绑定到Router，绑定到Consumer。

`Certificate`是https证书。

`Sni`是域名与Certificate的绑定，指定了一个域名对应的https证书。

`Upstream`是负载均衡策略。

`Target`是最终处理请求的Backend服务。

## 使用过程了解

先通过部署一个webshell应用和为它设置key-auth插件的过程，了解整个使用过程。

### 先了解下插件的作用范围和设置方法

[Kong Add Plugin][6]通过consumer_id、route_id、service_id限定插件的作用范围：

	作用于所有的Service、Router、Consumer：       创建时不指定consumer_id、service_id、route_id
	作用于所有的Service、Router和指定的Consumer： 创建时只指定consumer_id
	作用于所有的Consumer和指定的Service：         创建时只指定service_id，有些插件还需要指定route_id
	作用于所有的Consumer和指定的Router：          创建时只指定route_id，有些插件还需要指定service_id
	作用于特定的Service、Router、Consumer：       创建时不指定consumer_id、service_id、route_id

没有绑定任何service、route、consumer的插件，称为`global`插件：

	All plugins can be configured using the http://kong:8001/plugins/ endpoint. 
	A plugin which is not associated to any Service, Route or Consumer (or API, if you are using an older version of Kong) is considered "global", 
	and will be run on every request. Read the Plugin Reference and the Plugin Precedence sections for more information

### 在Kubernetes中部署目标应用和对应的Ingress

Kubernetes中部署的应用和Ingress是[webshell-all-in-one.yaml](https://github.com/introclass/kubernetes-yamls/blob/master/all-in-one/webshell-all-in-one.yaml)：

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/webshell-all-in-one.yaml

Kong的[数据平面][4]用NodePort的方式暴露，端口是30939，下面随意选用的Node是192.168.33.12，所以请求地址都是`192.168.33.12:30939`。

先验证下没有做任何配置时候的访问：

	$ curl -H "Host: webshell.com" 192.168.33.12:30939
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

可以访问。

### 创建KongConsumer，并设置该用户key-auth插件的key

创建名为`websehll-user1`的KongConsumer：

	apiVersion: configuration.konghq.com/v1
	kind: KongConsumer
	metadata:
	  name: webshell-user1
	  namespace: demo-webshell
	username: user1
	custom_id: demo-webshell-user1

从kubernetes中查看：

	$ kubectl  -n demo-webshell get KongConsumer -o wide
	NAME             AGE
	webshell-user1   1m

从Kong中查看Consumer：

	curl 192.168.33.12:32685/consumers

配置webshell-user1的key-auth的key，创建一个`KongCredential`，配置它关联到上面创建的KongConsumer，(consumerRef:  webshell-user1):

	apiVersion: configuration.konghq.com/v1
	kind: KongCredential
	metadata:
	  namespace: demo-webshell
	  name: credential-webshell-user1
	consumerRef:  webshell-user1
	type: key-auth
	config:
	  key: 62eb165c070a41d5c1b58d9d3d725ca1

从kubernetes查看：

	$ kubectl -n demo-webshell get KongCredential -o wide
	NAME                        AGE
	credential-webshell-user1   2m

从Kong中查询Consumer的key-auth信息，ID是Kubernetes中KongConsumer的uid： 

	curl 192.168.33.12:32685/consumers/5433234c-d158-11e8-9da4-525400c042d5/key-auth/

这时候可以在kong-dashboard中看到名为user1的consumer，key为`62eb165c070a41d5c1b58d9d3d725ca1`。

### 配置全局的key-auth插件

在kubernetes中创建下面的global插件：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: global-plugin-key-auth
	  namespace: kong
	  labels:
	    global: "true" # optional, please note the quotes around true
	disabled: false  # optional
	config:
	plugin: key-auth

全局的插件不能重名。kong-ingress-controller（0.2.0）版本不关心全局插件所在的namespace，在任何一个namespace中都可以创建global plugin，实践中需要注意进行限制。

这时候直接访问Service，会提示缺少API key：

	curl -H "Host: webshell.com" 192.168.33.12:30939
	{"message":"No API key found in request"}

需要用下面的方式访问：

	curl -H "Host: webshell.com" -H "apikey: 62eb165c070a41d5c1b58d9d3d725ca1" 192.168.33.12:30939

### 配置关联到Route的key-auth插件

Kong的Route对应Kubernetes的Ingress中的一个PATH。在Ingress中通过[Kong Ingress Controller annotations][7]绑定插件配置：

	plugins.konghq.com: high-rate-limit, docs-site-cors

在demo-webshell空间中创建一个`KongPlugin`：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: plugin-key-auth-user1
	  namespace: demo-webshell
	#consumerRef: webshell-user1， 0.14.1存在一个Bug，这里设置Consumer后，会导致kong-ingress-controller更新失败
	disabled: false  # optional
	config:
	  key_names: key
	plugin: key-auth

Config中是[key-auth插件的配置参数][8]，前面的global plugin中没有设置config，使用的是默认配置。

`key_names`设置用来认证的key的名称，默认是apikey，这里修改成了key，后面访问的时候需要在header中添加的是`key`字段。

在同一个namespace的Ingress上添加annotations，指定使用刚创建的名为plugin-key-auth-user1的KongPlugin:

	metadata:
	  annotations:
	    plugins.konghq.com: plugin-key-auth-user1

这时候在kong-dashboard中，可以看到新建了一个绑定到Router的key-auth插件。

直接访问，提示缺少key：

	$ curl -H "Host: webshell.com" 192.168.33.12:30939
	{"message":"No API key found in request"}%

用global插件的apikey，也提示缺少key：

	$ curl -H "Host: webshell.com" -H "apikey: 62eb165c070a41d5c1b58d9d3d725ca1" 192.168.33.12:30939
	{"message":"No API key found in request"}%

使用绑定的插件的中设置的`key`才可以：

	curl -H "Host: webshell.com" -H "key: 62eb165c070a41d5c1b58d9d3d725ca1" 192.168.33.12:30939

由此可见绑定到Route的插件优先级高于global插件。

在kong中查看绑定到Route的plugin：

	$ curl 192.168.33.12:32685/routes/8c81fdb6-4bff-4807-9e38-ab9c22c24a88/plugins
	 "total":1,"data":[{"created_at":1539711481000,"config":{"key_names":["key"],"key_in_body":false,"anonymous":"","run_on_preflight":true,"hide_credentials":false},"id":"6d8c9e88-1211-4cfd-8410-c7d3a727f3e4","name":"key-auth","enabled":true,"route_id":"8c81fdb6-4bff-4807-9e38-ab9c22c24a88"}]}

### 配置关联到Service的key-auth插件

Service也通过[Kong Ingress Controller annotations][7]绑定插件，在名为`webshell`的Service中设置annotation：

	kind: Service
	metadata:
	  annotations:
	    plugins.konghq.com: plugin-key-auth-user1

这时候，在kong-dashboard中可以看到一个绑定到service的plugin。

尝试绑定到另一个key-auth插件，试验一下优先级。创建一个新的KongPlugin，key_names是`key2`：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: plugin-key-auth-user2
	  namespace: demo-webshell
	consumerRef: webshell-user1
	disabled: false  # optional
	config:
	  key_names: key2
	plugin: key-auth

然后修改service的annotations，绑定新建的KongPlugin，plugin-key-auth-user2:

	kind: Service
	metadata:
	  annotations:
	    plugins.konghq.com: plugin-key-auth-user2

使用Route的key能够通过验证：

	curl -H "Host: webshell.com" -H "key: 62eb165c070a41d5c1b58d9d3d725ca1" 192.168.33.12:30939

使用Service的key2不行：

	$ curl -H "Host: webshell.com" -H "key2: 62eb165c070a41d5c1b58d9d3d725ca1" 192.168.33.12:30939
	{"message":"No API key found in request"}

将Route的key-auth停止后，用key2就可以访问了。

通过结果可以判断Route绑定的插件是优先于Service绑定的插件的，而Service绑定的插件又优于Global插件。

### 通过KongIngress增强配置

Ingress默认关联同一个namespace中同名的KongIngress。如果不想使用默认的关联，可以在annotation中用`configuration.konghq.com`指定`同一个namespace中`的另一个KongIngress。

下面创建一个与ingress同名的KongIngress

	apiVersion: configuration.konghq.com/v1
	kind: KongIngress
	metadata:
	  name: webshell-kong-ingress
	  namespace: demo-webshell
	upstream:
	  hash_on: none
	  hash_fallback: none
	  healthchecks:
	    active:
	      concurrency: 10
	      healthy:
	        http_statuses:
	        - 200
	        - 302
	        interval: 0
	        successes: 0
	      http_path: "/"
	      timeout: 1
	      unhealthy:
	        http_failures: 0
	        http_statuses:
	        - 429
	        interval: 0
	        tcp_failures: 0
	        timeouts: 0
	    passive:
	      healthy:
	        http_statuses:
	        - 200
	        successes: 0
	      unhealthy:
	        http_failures: 0
	        http_statuses:
	        - 429
	        - 503
	        tcp_failures: 0
	        timeouts: 0
	    slots: 10
	proxy:
	  protocol: http
	  path: /
	  connect_timeout: 10000
	  retries: 10
	  read_timeout: 10000
	  write_timeout: 10000
	route:
	  methods:
	  - POST
	  - GET
	  regex_priority: 0
	  strip_path: false
	  preserve_host: true
	  protocols:
	  - http
	  - https

可以在kong-dashboard中看到，KongIngress中的设置被应用到route、upstream、proxy中。

## 参考

1. [Nginx、OpenResty和Kong的基本概念与使用方法][1]
2. [API网关Kong与Kubernetes的集成方法][2]
3. [Kong的插件][3]
4. [Kong的控制平面与数据平面][4]
5. [Kong Admin API][5]
6. [Kong Add Plugin][6]
7. [Kong Ingress Controller annotations][7]
8. [Kong key-auth Parameters][8]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html "Nginx、OpenResty和Kong的基本概念与使用方法"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html "API网关Kong与Kubernetes的集成方法"
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#kong%E7%9A%84%E6%8F%92%E4%BB%B6 "Kong的插件"
[4]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html#Kong的控制平面与数据平面 "Kong的控制平面与数据平面"
[5]: https://docs.konghq.com/0.14.x/admin-api/ "Kong Admin API"
[6]: https://docs.konghq.com/0.14.x/admin-api/#add-plugin "Kong Add Plugin"
[7]: https://github.com/Kong/kubernetes-ingress-controller/blob/master/docs/annotations.md#pluginskonghqcom "Kong Ingress Controller annotations"
[8]: https://docs.konghq.com/hub/kong-inc/key-auth/ "Kong key-auth Parameters"
