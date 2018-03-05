---
layout: default
title: go中使用websocket
author: 李佶澳
createdate: 2017/11/03 10:24:16
changedate: 2017/11/06 09:57:28
categories: 编程
tags: golang
keywords: websocket,golang,编程,example
description: websocket协议提供了一种在客户端与浏览器之间建立双向连接的方法,rfc6455

---

* auto-gen TOC:
{:toc}

## 说明

websocket协议提供了一种在客户端与浏览器之间建立双向连接的方法：[RFC6455:  The WebSocket Protocol][1]。

[golang.org/x/net/websocket][2]是一个golang的websocket库。

## websocket协议了解

### 用途

在开发web应用时候，client与server之间有时候需要双向通信。Http协议是被动响应的，以前浏览器端只能通过轮询的
方式获得server端的状态变化。这种方式，有三个坏处：

	1. server端需要承受大量的tcp连接
	2. client的每次请求都带有http头，额外开销大
	3. client端需要维护、追踪轮询的情况

websocket是一个新的web协议，在一个tcp连接中完成双向通信。

### 协议格式

websocket协议由handshake和data transfer两部分组成。

client发送的handshake格式如下：

	GET /chat HTTP/1.1
	Host: server.example.com
	Upgrade: websocket
	Connection: Upgrade
	Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
	Origin: http://example.com
	Sec-WebSocket-Protocol: chat, superchat
	Sec-WebSocket-Version: 13

server回应的handshake格式如下：

	HTTP/1.1 101 Switching Protocols
	Upgrade: websocket
	Connection: Upgrade
	Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
	Sec-WebSocket-Protocol: chat

#### Closing Handshake

close通过发送control frame完成。

### 安全模型

Websocket使用`origin model`，通过依据`origin`判断某个网页是否具有访问websocket的权限。

如果是非浏览器客户端，origin model不起作用，client可以使用任意的origin。

### URI

websocket的uri格式如下：

	ws-URI = "ws:" "//" host [ ":" port ] path [ "?" query ]
	wss-URI = "wss:" "//" host [ ":" port ] path [ "?" query ]

`ws://`默认的端口是80，`wss://`默认的端口是443。

### Data Framing

websocket中使用frame传输数据，格式如下：

	0                   1                   2                   3
	0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
	+-+-+-+-+-------+-+-------------+-------------------------------+
	|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
	|I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
	|N|V|V|V|       |S|             |   (if payload len==126/127)   |
	| |1|2|3|       |K|             |                               |
	+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
	|     Extended payload length continued, if payload len == 127  |
	+ - - - - - - - - - - - - - - - +-------------------------------+
	|                               |Masking-key, if MASK set to 1  |
	+-------------------------------+-------------------------------+
	| Masking-key (continued)       |          Payload Data         |
	+-------------------------------- - - - - - - - - - - - - - - - +
	:                     Payload Data continued ...                :
	+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
	|                     Payload Data continued ...                |
	+---------------------------------------------------------------+

### Status Codes

	 |Status Code | Meaning         | Contact       | Reference |
	-+------------+-----------------+---------------+-----------|
	 | 1000       | Normal Closure  | hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1001       | Going Away      | hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1002       | Protocol error  | hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1003       | Unsupported Data| hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1004       | ---Reserved---- | hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1005       | No Status Rcvd  | hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1006       | Abnormal Closure| hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1007       | Invalid frame   | hybi@ietf.org | RFC 6455  |
	 |            | payload data    |               |           |
	-+------------+-----------------+---------------+-----------|
	 | 1008       | Policy Violation| hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1009       | Message Too Big | hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1010       | Mandatory Ext.  | hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|
	 | 1011       | Internal Server | hybi@ietf.org | RFC 6455  |
	 |            | Error           |               |           |
	-+------------+-----------------+---------------+-----------|
	 | 1015       | TLS handshake   | hybi@ietf.org | RFC 6455  |
	-+------------+-----------------+---------------+-----------|

## websocket的server端

建立websocket连接之后，server直接通过Read和Write方法接收、发送数据。

	package main
	
	import (
		"golang.org/x/net/websocket"
		"io"
		"net/http"
	)

	func EchoServer(ws *websocket.Conn) {
		io.Copy(ws, ws)
	}
	
	func main() {
		http.Handle("/echo", websocket.Handler(EchoServer))
		err := http.ListenAndServe(":12345", nil)
		if err != nil {
			panic("ListenAndServer: " + err.Error())
		}
	}

可以看到，server可以直接读取ws中的数据，写入则就是回应给客户端。

## websocket的client端

建立websocket连接之后，client直接通过Read和Write方法接收、发送数据。

	package main
	
	import (
		"fmt"
		"golang.org/x/net/websocket"
		"log"
	)
	
	func main() {
		origin := "http://localhost/"
		url := "ws://localhost:12345/echo"
		ws, err := websocket.Dial(url, "", origin)
		if err != nil {
			log.Fatal(err)
		}
		
		if _, err := ws.Write([]byte("hello world!")); err != nil {
			log.Fatal(err)
		}
		
		var msg = make([]byte, 512)
		var n int
		if n, err = ws.Read(msg); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("Received: %s.\n", msg[:n])
	}

## 参考

1. [RFC6455:  The WebSocket Protocol][1]
2. [golang.org/x/net/websocket][2]

[1]: https://tools.ietf.org/html/rfc6455  "websocket rfc6455" 
[2]: https://godoc.org/golang.org/x/net/websocket  "golang.org/x/net/websocket" 
