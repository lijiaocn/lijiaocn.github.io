---
layout: default
title: "API网关Kong（十四）：Kong的Admin API概览和使用"
author: 李佶澳
createdate: "2018-11-19 17:16:07 +0800"
changedate: "2018-11-19 17:16:07 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关
description: 了解了kong的工作原理，对代码结构也熟悉了，接下来需要了解kong的api，掌握了api才能更熟练的应用kong，比如开发一套图形界面的管理系统，调用kong的api下发相关的配置。
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

了解了kong的工作原理，对代码结构也熟悉了，接下来需要了解kong的api，掌握了api才能更熟练的应用kong，比如开发自己的管理系统，调用kong的api下发相关的配置。[Kong Admin API][1]中列出了Kong的所有API，这里使用的kong的版本是0.14.1。

## admin api的开启

kong的admin api和kong的数据平面代码是在一起的，admin不是一个单独程序， 通过kong的配置文件开启admin api：

	admin_listen = 192.168.33.12:8001, 192.168.33.12:8444 ssl

特别要注意admin api的暴露范围，不要暴露到公网，或者其他不应当有访问权限的人或机器。

## admin api风格

kong的admin api是REST风格，可以部署多个开启了admin api的kong，通过任意一个admin api做出的操作，都会被同步到所有的kong实例。支持`application/x-www-form-urlencoded`和`application/json`两种格式。

application/x-www-form-urlencoded格式如下：

	config.limit=10&config.period=seconds

application/json格式如下：

	{
	    "config": {
	        "limit": 10,
	        "period": "seconds"
	    }
	}

## 状态查询

用GET方法请求`/`和`/status`分别返回node的静止状态和动态状态，可以直接在浏览器中打开。

`/`返回的内容如下（json字符串被浏览器折叠后的样式）：

	plugins	{…}
	tagline	"Welcome to kong"
	configuration	{…}
	version	"0.14.1"
	node_id	"08368c36-ad19-4d7b-81bf-41f339564674"
	lua_version	"LuaJIT 2.1.0-beta3"
	prng_seeds	{…}
	timers	{…}
	hostname	"localhost.localdomain"

`/status`返回的内容如下（json字符串被浏览器折叠后的样式）：

	database	{…}
	server	{…}

## REST对象

admin api一共可以操作以下几种REST对象：

	Service 
	Route 
	Consumer 
	Plugin 
	Certificate 
	SNI
	Upstream
	Target 

创建用`POST`方法，更新用`PATCH`方法，查看用`GET`方法，删除用`DELETE`方法。

## Plugin Object

这里以[Plugin Object](https://docs.konghq.com/0.14.x/admin-api/#plugin-object)为例，展示一下admin api的用法。

Plugin Object的格式如下，注意config部分因插件而异：

```json
{
    "id": "4d924084-1adb-40a5-c042-63b19db421d1",
    "service_id": "5fd1z584-1adb-40a5-c042-63b19db49x21",
    "consumer_id": "a3dX2dh2-1adb-40a5-c042-63b19dbx83hF4",
    "name": "rate-limiting",
    "config": {
        "minute": 20,
        "hour": 500
    },
    "enabled": true,
    "created_at": 1422386534
}
```

可以使用的API有：

| 请求方法&nbsp;&nbsp;&nbsp;&nbsp; | 路径 | 作用 |
|------------------------------------------------|
|POST   |/plugins         | 创建
|GET    |/plugins/{id}    | 读取指定的plugin
|GET    |/plugins/        | 列出所有的plugin
|PATCH  |/plugins/{id}    | 更新plugin
|PUT    |/plugins/        | 创建或更新plugin
|DELETE |/plugins/{id}    | 删除plugin
|GET    |/plugins/enabled | 列出所有开启的插件
|GET    |/plugins/schema/{plugin name} &nbsp;&nbsp; | 获得插件的配置模板

获取可用插件：

```bash
➜  adminapi git:(master) ✗ curl 192.168.33.12:8001/plugins/enabled 2>/dev/null |jq
{
  "enabled_plugins": [
    "response-transformer",
    "http-rewrite",
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
```

获取插件配置模板，注意schema给出是可以在插件的`config`中使用的配置项，以及它们的类型：

```bash
➜  adminapi git:(master) ✗ curl 192.168.33.12:8001/plugins/schema/bot-detection 2>/dev/null |jq
{
  "no_consumer": true,
  "fields": {
    "whitelist": {
      "func": "function",
      "type": "array"
    },
    "blacklist": {
      "func": "function",
      "type": "array"
    }
  }
}
```

准备一个json格式的插件配置文件，内容如下，为了方便没有设置任何ID，这样的插件将成为优先级最低的全局插件：

```bash
➜  adminapi git:(master) ✗ cat bot-detection.json
{
    "name": "bot-detection",
    "config": {
        "blacklist": [ "curl/7.54.0", "curl/7.55.0"]
    },
    "enabled": true,
    "created_at": 1422386534
}
```


创建插件，注意要指定类型`Content-Type: application/json`：

```bash
➜  adminapi git:(master) ✗ curl -v  -X POST -H "Content-Type: application/json" 192.168.33.12:8001/plugins -d @bot-detection.json |jq
{
  "created_at": 1422386534,
  "config": {
    "blacklist": [
      "curl/7.54.0",
      "curl/7.55.0"
    ]
  },
  "id": "7a1a21e7-c6d2-4e1b-98a5-4c4e285f5f17",
  "enabled": true,
  "name": "bot-detection"
}
```

创建成功之后返回插件的ID，在插件列表中也可以看到：

```bash
➜  adminapi git:(master) ✗ curl 192.168.33.12:8001/plugins |jq
{
  "total": 3,
  "data": [
    {
      "created_at": 1422386534,
      "config": {
        "blacklist": [
          "curl/7.54.0",
          "curl/7.55.0"
        ]
      },
      "id": "7a1a21e7-c6d2-4e1b-98a5-4c4e285f5f17",
      "enabled": true,
      "name": "bot-detection"
    },
...
}
```

可以通过插件ID读取特定插件的内容：

```bash
➜  adminapi git:(master) ✗ curl 192.168.33.12:8001/plugins/7a1a21e7-c6d2-4e1b-98a5-4c4e285f5f17
```

## 其它Object

其它Object的API使用方法类似，[Kong Admin API][1]中有详细介绍。

## 参考

1. [Kong Admin API][1]

[1]: https://docs.konghq.com/0.14.x/admin-api/ "Kong Admin API"
