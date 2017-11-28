---
layout: default
title: 使用haproxy进行会话保持
author: lijiaocn
createdate: 2017/11/28 14:56:49
changedate: 2017/11/28 15:11:17
categories: 技巧
tags: haproxy
keywords: haproxy,会话保持,粘滞会话
description: http出口的负载均衡策略是roundrobin，部分业务系统将会话信息保存在backend server

---

* auto-gen TOC:
{:toc}

## 现象说明

http出口的负载均衡策略是roundrobin，部分业务系统将会话信息保存在backend server，backend server之间未做同步。

用户在访问、操作的时候，会出现会话不连贯的现象 。

## 方案说明

haproxy可以使用多种方式做到会话保持。

`source`的方式将同一个源IP的请求转发给同一个backend server，可以作用于tcp和http。但是当某个源IP的请求量较大，或者用户请求经过NAT后到达，会导致backend server的负载严重不均衡。不采用。

`url_param`的方式，需要业务在url中带有sessionid，适用于http。不采用。

`stick-tables`的方式，设置复杂，且需要维护记录表。不采用。

`cookie`的方式本身也有多种策略，例如`insert`，`prefix`，`rewrite`等，适用于http。

经过对比，决定采用以下方式：

	cookie cookie.XXXXX.cn insert indirect postonly

即：

	只有遇到post请求的时候，haproxy在响应中设置一个名为
	`cookie.XXXXX.cn`的cookie，后续带有该cookie的请求到达
	haproxy时，haproxy将该cookie去除后，转发给cookie指定的backen server。

## 过程说明

### 未发送post请求之前，依然采用roundrobin的方式

第一次get请求： 

![]( {{ site.imglocal }}/haproxy/first-get.png )

第二次get请求:

![]( {{ site.imglocal }}/haproxy/second-get.png )

### 发送了post请求后，被设置cookie

cookie的值为处理post请求的backend server的ID。

![]( {{ site.imglocal }}/haproxy/set-cookie.png )

### 后续请求被转发到同一个backend server

用户后续所有http请求，都会带上cookie，被转发到同一个backend server。

![]( {{ site.imglocal }}/haproxy/same-1.png )

![]( {{ site.imglocal }}/haproxy/same-2.png )

### 绑定的backend server宕机后，cookie失效

绑定的backend server宕机后，虽然后续发送的请求中依然会带有cookie，但是这时候会重新回到`roundrobin`的状态，直到用户再次发送POST请求，重新绑定backend server。

宕机后，再次发送POST的情形：

![]( {{ site.imglocal }}/haproxy/down.png )

## 参考

1. [HAProxy的基本使用与常见实践][1]

[1]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/06/26/haproxy-usage.html#%E4%BC%9A%E8%AF%9D%E4%BF%9D%E6%8C%81  "HAProxy的基本使用与常见实践" 
