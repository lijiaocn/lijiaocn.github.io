---
title:  "wscat: 使用wscat连接websocket"
tags: manual
permalink: "/技巧/2010/01/01/tool-box-wscat.html"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[wscat][1]是一个用来连接websocket的命令行工具，nodejs开发的

## 安装

	npm config set registry http://registry.npm.taobao.org/
	npm install -g wscat  --registry https://registry.npm.taobao.org 

## 使用

	$ wscat -c ws://echo.websocket.org 
	connected (press CTRL+C to quit)
	> hi there
	< hi there
	> are you a happy parrot?
	< are you a happy parrot?

## 参考

1. [WebSocket cat: wscat][1]

[1]: https://www.npmjs.com/package/wscat "WebSocket cat: wscat" 
