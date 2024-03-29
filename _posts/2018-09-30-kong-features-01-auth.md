---
layout: default
title: "API网关Kong学习笔记（四）: 功能梳理和插件使用-认证插件使用"
author: 李佶澳
createdate: 2018/10/18 11:14:00
last_modified_at: 2018/10/18 11:14:00
categories: 项目
tags: kong 
keywords: kong,apigateway,API网关
description: Kong的plugins中列出了Kong的社区版支持的一些插件，这里尝试使用一下其中的认证插件

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[Kong的plugins][1]中列出了Kong的社区版支持的一些插件，这里尝试使用一下其中的认证插件：

	Basic Auth
	HMAC Auth
	JWT Auth
	Key Auth
	LDAP Auth
	OAuth 2.0 Auth

完整插件名单和使用方法见：[Kong Plugins Website][2]

[API网关Kong的功能梳理和插件使用（一)：基本使用过程][3]已经介绍了基本使用方法，这里不再赘述。

Kong-Ingress-Controller的版本是0.2.0，Kong的版本是0.14.1，是用下面的方式部署的：

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/kong-all-in-one.yaml

{% include kong_pages_list.md %}

## 部署一个echo应用

为了方便后面的测试，这里部署一个[echo应用][4]

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/echo-all-in-one.yaml

创建了一个名为demo-echo的namespace，服务以NodePort的方式暴露出来：

	./kubectl.sh -n demo-echo get svc
	NAME      TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                     AGE
	echo      NodePort   172.16.57.150   <none>        80:31512/TCP,22:31608/TCP   1d

echo服务返回接收到的数据：

	$ curl 192.168.33.12:31512
	Hostname: echo-676ff9c67f-jlr8v
	
	Pod Information:
	    -no pod information available-
	
	Server values:
	    server_version=nginx: 1.13.3 - lua: 10008
	
	Request Information:
	    client_address=192.168.33.12
	    method=GET
	    real path=/
	    query=
	    request_version=1.1
	    request_uri=http://192.168.33.12:8080/
	
	Request Headers:
	    accept=*/*
	    host=192.168.33.12:31512
	    user-agent=curl/7.54.0
	
	Request Body:
	    -no body in request-

确保通过Kong的数据平面也可以访问：

	curl 192.168.33.11:31512 -H "host:echo.com"
	Hostname: echo-676ff9c67f-jlr8v
	
	Pod Information:
	    -no pod information available-
	
	Server values:
	    server_version=nginx: 1.13.3 - lua: 10008
	
	Request Information:
	    client_address=192.168.33.11
	    method=GET
	    real path=/
	    query=
	    request_version=1.1
	    request_uri=http://echo.com:8080/
	
	Request Headers:
	    accept=*/*
	    host=echo.com
	    user-agent=curl/7.54.0
	
	Request Body:
	    -no body in request-

## Basic Auth

[Kong Plugin: Basic Authentication][5]可以为Route或者Service添加简单的用户名密码认证，插件类型为`basic-auth`。

创建用户user1，设置user1用户的basic-auth：

	apiVersion: configuration.konghq.com/v1
	kind: KongConsumer
	metadata:
	  name: user1
	  namespace: demo-echo
	username: echo-user1
	
	---
	
	apiVersion: configuration.konghq.com/v1
	kind: KongCredential
	metadata:
	  name: user1-basic-auth
	  namespace: demo-echo
	consumerRef: user1
	type: basic-auth
	config:
	  username: user1
	  password: 123456

创建之后可以在Kong-Dashboard中看到新建的Consumer，以及设置的basic-auth信息。

Dashboard中看到的是密码的哈希，不是密码原文：

	14049af5b1854d7e7e21cd4bef60d8e1d9f9ff0d

创建KongPlugin：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: user1-basic-auth
	  namespace: kong
	disabled: false  # optional
	plugin: basic-auth

编辑ingress-echo：

	 ./kubectl.sh -n demo-echo edit ingress ingress-echo

在ingress-echo中添加annotations：

	metadata:
	  annotations:
	    plugins.konghq.com: user1-basic-auth

验证1，直接访问提示未授权（如果是用浏览器访问，弹出输入账号密码的对话框）:

	$ curl  192.168.33.11:30939/ -H "host:echo.com"
	{"message":"Unauthorized"}

验证2，用Basic Auth访问，需要将用户名和密码用base64编码：

	$ KEY=`echo "user1:123456" |base64`
	$ curl 192.168.33.11:30939/ -H "host:echo.com"  -H "Authorization: Basic $KEY"
	Hostname: echo-676ff9c67f-jlr8v
	
	Pod Information:
	    -no pod information available-
	
	Server values:
	    server_version=nginx: 1.13.3 - lua: 10008
	
	Request Information:
	    client_address=172.16.128.17
	    method=GET
	    real path=/
	    query=
	    request_version=1.1
	    request_uri=http://172.16.128.16:8080/
	
	Request Headers:
	    accept=*/*
	    connection=keep-alive
	    host=172.16.128.16:8080
	    user-agent=curl/7.54.0
	    x-consumer-custom-id=echo-user1
	    x-consumer-id=e7cd11ac-d1b1-11e8-9da4-525400c042d5
	    x-consumer-username=echo-user1
	    x-credential-username=user1
	    x-forwarded-for=192.168.33.11
	    x-forwarded-host=echo.com
	    x-forwarded-port=8000
	    x-forwarded-proto=http
	    x-real-ip=192.168.33.11
	
	Request Body:
	    -no body in request-

## Key Auth

[Kong Plugin: Key Auth][6]用来为Route和Service设置key，只有带有正确的key才能访问服务，插件类型为`key-auth`。

在前面的基础上，为Consumser设置key-auth信息，创建相应的KongPlugin：

	apiVersion: configuration.konghq.com/v1
	kind: KongCredential
	metadata:
	  name: user1-key-auth
	  namespace: demo-echo
	consumerRef: user1
	type: key-auth
	config:
	  key: "123456"
	
	---
	
	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: user1-key-auth
	  namespace: demo-echo
	disabled: false  # optional
	plugin: key-auth
	config:
	  hide_credentials: true

将ingress-echo annotation中的plugins修改为新建的KongPlugin：

	metadata:
	  annotations:
	    plugins.konghq.com: user1-key-auth

验证，带有apikey时访问成功：

	$curl  192.168.33.11:30939/ -H "host:echo.com" -H "apikey: 123456"
	Hostname: echo-676ff9c67f-jlr8v
	
	Pod Information:
	    -no pod information available-
	
	Server values:
	    server_version=nginx: 1.13.3 - lua: 10008
	
	Request Information:
	    client_address=172.16.128.17
	    method=GET
	    real path=/
	    query=
	    request_version=1.1
	    request_uri=http://172.16.128.16:8080/
	
	Request Headers:
	    accept=*/*
	    connection=keep-alive
	    host=172.16.128.16:8080
	    user-agent=curl/7.54.0
	    x-consumer-custom-id=echo-user1
	    x-consumer-id=e7cd11ac-d1b1-11e8-9da4-525400c042d5
	    x-consumer-username=echo-user1
	    x-forwarded-for=192.168.33.11
	    x-forwarded-host=echo.com
	    x-forwarded-port=8000
	    x-forwarded-proto=http
	    x-real-ip=192.168.33.11
	
	Request Body:
	    -no body in request-

## JWT Auth

[Kong Plugin: JWT Auth][7]插件为Service或者Route设置`Json Web Token`认证，插件类型为`jwt`。

[RFC7519：JSON Web Token (JWT)][8]规定了JWT的格式和用法。

在前面的基础上，配置Consumer的jwt信息，并创建KongPlugin：


将Rout到绑定到插件修改为刚创建的KongPlugin：

	metadata:
	  annotations:
	    plugins.konghq.com: user1-jwt-auth

到网页[jwt.io][9]上，签署一个Json Web Token：

	HEADER：
	{
	  "alg": "HS256",      # Consumer的jwt中设置的算法
	  "typ": "JWT"
	}
	
	PAYLOAD:
	{
	  "iss": "a36c3049b36249a3c9f8891cb127243c"   # Consumer的jwt中设置的key
	}

得到Json Web Token：

	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhMzZjMzA0OWIzNjI0OWEzYzlmODg5MWNiMTI3MjQzYyJ9.oqJY4wM3X2DFs8U93w2aeA6MRf4oRwKOv_8wXMtykCU

验证，直接访问：

	$ curl  192.168.33.11:30939/ -H "host:echo.com"
	{"message":"Unauthorized"}

验证，使用JWT访问:

	$ curl 192.168.33.11:31512/ -H "host:echo.com" -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhMzZjMzA0OWIzNjI0OWEzYzlmODg5MWNiMTI3MjQzYyJ9.oqJY4wM3X2DFs8U93w2aeA6MRf4oRwKOv_8wXMtykCU"
	
	Hostname: echo-676ff9c67f-jlr8v
	
	Pod Information:
	    -no pod information available-
	
	Server values:
	    server_version=nginx: 1.13.3 - lua: 10008
	
	Request Information:
	    client_address=192.168.33.11
	    method=GET
	    real path=/
	    query=
	    request_version=1.1
	    request_uri=http://echo.com:8080/
	
	Request Headers:
	    accept=*/*
	    authorization=Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJhMzZjMzA0OWIzNjI0OWEzYzlmODg5MWNiMTI3MjQzYyJ9.oqJY4wM3X2DFs8U93w2aeA6MRf4oRwKOv_8wXMtykCU
	    host=echo.com
	    user-agent=curl/7.54.0
	
	Request Body:
	    -no body in request-

## OAuth 2.0 Auth

[Kong Plugin: OAuth 2.0][10]的用来对接OAuth 2.0授权系统，插件类型为`oauth2`。

OAuth 2.0认证过程中，一共有三个角色：

	用户
	第三方服务
	应用

目标是：用户允许第三方服务直接从应用中查询自己的数据。

启用OAuth2.0插件以后，Kong本身成为OAuth 2.0中的认证服务器。

第三方服务将用户重定向到应用授权页面。用户授权之后，应用调用Kong的接口获得第三方服务的授权码（Code）、重定向URI。应用将用户重定向到第三方服务的URI，并且在重定向URI中带上授权码。第三方服务从URI汇总获得授权码，用授权码从Kong中获得Access Token。第三方服务用Access Token直接调用应用的接口，查询用户的数据。

要使用Kong的OAuth 2.0，需要做以下几件事情：

	1. 应用开发一个授权页面，第三方可以访问
	2. 应用将为自己在Kong中的Service或者Route，配置OAuth 2.0，设置scope等
	3. 第三方在kong中注册一个Consumer
	4. 第三方为自己的Consumer配置OAuth 2.0，设置client_id、client_secret、redirect_uri
	5. 第三方开发申请授权的页面

授权过程如下：

	1. 第三方将用户重定向到应用的授权页面，并带上自己的client_id、request scope等
	2. 用户在应用的授权页面确认授权，应用将授权信息发送给Kong（允许某个client_id访问XXX）
	3. 应用收到Kong返回的授权码和第三方在Kong中配置的redirect_uri
	4. 应用将用户重定向到第三方设置的uri，并在重定向uri中带上了授权码
	5. 第三方从uri中获得授权码，用它从Kong中获取Access Token
	6. 第三方使用Access Token访问应用、查询数据

这个过程与[RFC 6749: The OAuth 2.0 Authorization Framework][11]、[OAuth 认证流程详解][12]中的介绍不同地方在于，第三方的redirect_uri是注册在Kong中的，不是访问应用的授权页面时带过去的。

(不是很确定，需要继续核实)Kong能够做到的是允许获取到Access Token的第三方访问Route或Service。第三方服务能够获取的数据，在应用内进行限制。譬如说，用户A授权第三方从应用中获取自己的信息，第三方就可以访问应用的相应接口。但Kong并不知道第三方正在查询的是哪个用户的信息，如果第三方试图查询用户B的信息，这时候需要应用拒绝请求。

上面是标准的授权码方式，对更简单的password的方式，kong也支持。

要验证OAuth 2.0，有开发个简单的应用，这里暂时不试验，先过比较容易试验的插件。2018-10-19 18:40:49

## 参考

1. [Kong的plugins][1]
2. [Kong Plugins Website][2]
3. [API网关Kong的功能梳理和插件使用（一)：基本使用过程][3]
4. [google echo service][4]
5. [Kong Plugin: Basic Authentication][5]
6. [Kong Plugin: Key Auth][6]
7. [Kong Plugin: JWT Auth][7]
8. [RFC7519：JSON Web Token (JWT)][8]
9. [JSON Web Tokens][9]
10. [Kong Plugin: OAuth 2.0][10]
11. [RFC 6749: The OAuth 2.0 Authorization Framework][11]
12. [OAuth 认证流程详解][12]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#kong%E7%9A%84%E6%8F%92%E4%BB%B6 "Kong的Plugin"
[2]: https://docs.konghq.com/hub/ "Kong Plugins" 
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-00-basic.html "API网关Kong的功能梳理和插件使用（一)：基本使用过程"
[4]: https://github.com/introclass/kubernetes-yamls/blob/master/all-in-one/echo-all-in-one.yaml "google echo service"
[5]: https://docs.konghq.com/hub/kong-inc/basic-auth/ "Kong Plugin: Basic Authentication"
[6]: https://docs.konghq.com/hub/kong-inc/key-auth/ "Kong Plugin: Key Auth"
[7]: https://docs.konghq.com/hub/kong-inc/jwt/ "Kong Plugin: JWT Auth"
[8]: https://tools.ietf.org/html/rfc7519 "RFC7519：JSON Web Token (JWT)"
[9]: https://jwt.io/ "JSON Web Tokens"
[10]: https://docs.konghq.com/hub/kong-inc/oauth2/ "Kong Plugin: OAuth 2.0"
[11]: https://tools.ietf.org/html/rfc6749#section-4.1 "RFC 6749: The OAuth 2.0 Authorization Framework"
[12]: https://www.jianshu.com/p/0db71eb445c8 "OAuth 认证流程详解"
