---
layout: default
title:  "API网关Kong学习笔记（九）: Kong对WebSocket的支持"
author: 李佶澳
createdate: "2018-11-06 17:17:02 +0800"
last_modified_at: "2019-03-05 14:57:13 +0800"
categories: 项目
tags: kong 
keywords: kong,apigateway,websocket
description: nginx原生支持websocket，基于nginx的kong对websocket也支持
---

## 目录
* auto-gen TOC:
{:toc}

## 说明



Kong-Ingress-Controller的版本是0.2.0，Kong的版本是0.14.1，是用下面的方式部署的：

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/kong-all-in-one.yaml

{% include kong_pages_list.md %}

## 对websocket的支持

nginx原生支持websocket，基于nginx的kong对websocket也支持，见[kong proxy-websocket-traffic][2]

## 部署websocket应用

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/websocket-all-in-one.yaml

上面的操作部署一个为名为demo-webocket的容器，并设置了ingress，绑定域名为websocket.com。

用wscat可以通过kong，与websocket应用建立websocket连接（kong-proxy以NodePort的方式暴露服务，服务端端口为30198）:

	$ wscat  -c ws://192.168.33.11:30198/echo -H "Host: websocket.com"
	connected (press CTRL+C to quit)
	> hello
	< hello
	>

wscat的使用见： [wscat: 使用wscat连接websocket][1]

## 参考

1. [wscat: 使用wscat连接websocket][1]
2. [kong proxy-websocket-traffic][2]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2010/01/01/tool-box-wscat.html "wscat: 使用wscat连接websocket"
[2]: https://docs.konghq.com/0.14.x/proxy/#proxy-websocket-traffic "kong proxy-websocket-traffic"
