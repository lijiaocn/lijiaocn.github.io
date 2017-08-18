---
layout: default
title: haproxy返回的http头中没有keep-alive
author: lijiaocn
createdate: 2017/08/11 16:59:57
changedate: 2017/08/18 15:10:13
categories: 问题
tags: haproxy
keywords: haproxy,keep-alive
description: 同事反映得到的http响应头中没有keep-alive。

---

* auto-gen TOC:
{:toc}

## 现象

haproxy有两个规则，指向的是相同的backend，nginx服务器。

第一个规则如下:

	listen nginx-0-icome-prod.ipaas.enncloud.cn
		bind 10.39.1.67:20941
		mode tcp
		balance roundrobin
		server nginx-2853504753-u0git 192.168.60.131:80 maxconn 500
		server nginx-2853504753-ni62e 192.168.237.228:80 maxconn 500
		server nginx-2853504753-2ck44 192.168.239.75:80 maxconn 500
		server nginx-2853504753-e41uz 192.168.162.3:80 maxconn 500
		server nginx-2853504753-tqs7j 192.168.156.151:80 maxconn 500
		server nginx-2853504753-gqkcg 192.168.155.141:80 maxconn 500

通过`nginx-0-icome-prod.ipaas.enncloud.cn:20941`访问得到的http头中，有"keep-alive"

	$curl -I http://nginx-0-icome-prod.ipaas.enncloud.cn:20941
	HTTP/1.1 404 Not Found
	Server: nginx/1.13.1
	Date: Fri, 11 Aug 2017 09:03:55 GMT
	Content-Type: text/html
	Content-Length: 169
	Connection: keep-alive

第二个规则如下：

	listen defaulthttp
		bind 10.39.1.67:80
		mode http
		option forwardfor       except 127.0.0.0/8
		...
		acl icome-prod-nginx-nginx-0 hdr(host) -i  api-icome.enncloud.cn
		use_backend icome-prod-nginx-nginx-0 if icome-prod-nginx-nginx-0
	...
	backend icome-prod-nginx-nginx-0
		server nginx-2853504753-u0git 192.168.60.131:80 cookie nginx-2853504753-u0git check maxconn 500
		server nginx-2853504753-ni62e 192.168.237.228:80 cookie nginx-2853504753-ni62e check maxconn 500
		server nginx-2853504753-2ck44 192.168.239.75:80 cookie nginx-2853504753-2ck44 check maxconn 500
		server nginx-2853504753-e41uz 192.168.162.3:80 cookie nginx-2853504753-e41uz check maxconn 500
		server nginx-2853504753-tqs7j 192.168.156.151:80 cookie nginx-2853504753-tqs7j check maxconn 500
		server nginx-2853504753-gqkcg 192.168.155.141:80 cookie nginx-2853504753-gqkcg check maxconn 500

通过`api-icome.enncloud.cn`访问，得到的http头中，没有"keep-alive":

	curl -I http://api-icome.enncloud.cn

## 调查

haproxy中的[option http-keep-alive][1]是用来控制http连接是否keep-alive，默认是enabled的。

同时，在[haproxy-doesnt-keep-alive-http-connection][2]看到一个说法：

	It would appear that your assumption is that haproxy will add a:
	    Connection: keep-alive
	header. That is not the case. Instead, the keep-alive mode (KAL, default in 1.5.x) will just 
	refrain from closing connections or adding Connection: close headers.
	Your configuration is probably fine. You can test keepalive using nc for example, or ab -k.

意思是说，连接实际是保活的，但是haproxy不会在http响应头中添加"keep-alive"。

## 用ab进行测试

首先，使用非keep-alive的方式:

	ab -n 100000  http://api-icome.enncloud.cn/

在haproxy上，可以看到创建了非常多的连接, 10.4.110.62是client端的ip：

	/ # netstat -nt |grep 10.4.110.62
	tcp        0      0 10.39.1.67:80           10.4.110.62:58808       TIME_WAIT   -
	tcp        0      0 10.39.1.67:80           10.4.110.62:59174       TIME_WAIT   -
	tcp        0      0 10.39.1.67:80           10.4.110.62:60200       TIME_WAIT   -
	tcp        0      0 10.39.1.67:80           10.4.110.62:58870       TIME_WAIT   -
	...

然后，使用keep-alive的方式:

	ab -n 100000 -k http://api-icome.enncloud.cn/

在haproxy上，可以看到只建立了一个连接:

	/ # netstat -nt |grep 10.4.110.62
	tcp        0     36 10.39.1.67:22           10.4.110.62:57158       ESTABLISHED

可以看到默认就是支持keep-alive，但是支持不等于会在响应头中写入`Connection: keep-alive`。

但是为什么第一条规则添加`Connection: keep-alive`呢？怀疑是因为第一个规则是tcp，第二个是http的缘故。

## 验证tcp和http

直接访问后端:

	$curl -I nginx
	HTTP/1.1 200 OK
	Server: nginx/1.13.1
	Date: Fri, 11 Aug 2017 10:08:00 GMT
	Content-Type: text/html
	Content-Length: 612
	Last-Modified: Tue, 30 May 2017 17:15:54 GMT
	Connection: keep-alive
	ETag: "592da8ca-264"
	Accept-Ranges: bytes

haproxy配置:

	listen lb1
	    bind *:5001
	    mode http
	    balance roundrobin
	    server  lb1-1 nginx:80 maxconn 500
	
	listen lb2
	    bind *:5002
	    mode tcp
	    balance roundrobin
	    server  lb2-1 nginx:80 maxconn 500


	~ # curl -I 127.0.0.1:5001
	HTTP/1.1 200 OK
	Server: nginx/1.13.1
	Date: Fri, 11 Aug 2017 10:11:54 GMT
	Content-Type: text/html
	Content-Length: 612
	Last-Modified: Tue, 30 May 2017 17:15:54 GMT
	ETag: "592da8ca-264"
	Accept-Ranges: bytes

	~ # curl -I 127.0.0.1:5002
	HTTP/1.1 200 OK
	Server: nginx/1.13.1
	Date: Fri, 11 Aug 2017 10:11:56 GMT
	Content-Type: text/html
	Content-Length: 612
	Last-Modified: Tue, 30 May 2017 17:15:54 GMT
	Connection: keep-alive
	ETag: "592da8ca-264"
	Accept-Ranges: bytes


## 参考

1. [option http-keep-alive][1]
2. [haproxy-doesnt-keep-alive-http-connection][2]

[1]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#option%20http-keep-alive  "option http-keep-alive" 
[2]: https://serverfault.com/questions/655061/haproxy-doesnt-keep-alive-http-connection "haproxy-doesnt-keep-alive-http-connection"
