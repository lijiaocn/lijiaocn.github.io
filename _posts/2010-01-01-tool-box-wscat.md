---
layout: default
title:  "wscat: 使用wscat连接websocket"
author: 李佶澳
createdate: 2018/07/22 14:13:00
changedate: 2018/07/22 14:20:17
categories: 技巧
tags: toolsbox
keywords: wscat,websocket,websocket连接
description: wscat是一个用来连接websocket的命令行工具，nodejs开发的

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
