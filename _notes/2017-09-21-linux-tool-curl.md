---
title:  "curl: 发起http(s)请求，查看http(s)通信过程"
tags: manual
permalink: "/技巧/2017/09/21/linux-tool-curl.html"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

curl是一个特别方便的用于http(s)客户端。

## 查看完整过程

	 curl -v http://www.baidu.com
	 curl -v http://www.baidu.com
	* Rebuilt URL to: http://www.baidu.com/
	*   Trying 103.235.46.39...
	* TCP_NODELAY set
	* Connected to www.baidu.com (103.235.46.39) port 80 (#0)
	> GET / HTTP/1.1
	> Host: www.baidu.com
	> User-Agent: curl/7.54.0
	> Accept: */*
	>
	< HTTP/1.1 200 OK
	< Server: bfe/1.0.8.18
	...

## https

	curl -k --cacert $ca_file  --key $key_file --cert $cert_file https://XXXX

## 参考

1. [curl详细用法][1]

[1]: https://blog.csdn.net/zl1zl2zl3/article/details/77112086 "curl详细用法" 
