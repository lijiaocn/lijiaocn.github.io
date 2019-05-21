---
layout: default
title: "curl能访问的url，通过blackbox-expoeter进行探测时，返回404"
author: 李佶澳
createdate: "2018-12-03 16:08:22 +0800"
changedate: "2018-12-03 16:08:22 +0800"
categories: 问题
tags: prometheus
keywords: prometheus,监控
description: 有一个url，直接用curl进行访问，返回200 OK，但是通过blackbox访问时，返回404
---

## 目录
* auto-gen TOC:
{:toc}

## 现象

有一个url，直接用curl进行访问，返回200 OK，但是通过blackbox访问时，返回404。

下面是用通过blackbox探测时，返回的结果，blackbox_exporter版本是0.12.0，URL已经脱敏：

```bash
$ curl "10.10.199.154:9115/probe?module=http_2xx&target=<URL>"
...(省略)...
# HELP probe_dns_lookup_time_seconds Returns the time taken for p
# HELP probe_http_status_code Response HTTP status code
# TYPE probe_http_status_code gauge
probe_http_status_code 404
# HELP probe_http_version Returns the version of HTTP of the probe response
# TYPE probe_http_version gauge
probe_http_version 1.1
# HELP probe_ip_protocol Specifies whether probe ip protocol is IP4 or IP6
# TYPE probe_ip_protocol gauge
probe_ip_protocol 4
# HELP probe_success Displays whether or not the probe was a success
# TYPE probe_success gauge
probe_success 0
```

## 调查

将日志设置为Debug，得到下面的日志：

```bash
ts=2018-12-03T08:16:01.128581572Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Beginning probe" probe=http timeout_seconds=9.5
ts=2018-12-03T08:16:01.12882122Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Resolving target address" preferred_ip_protocol=ip6
ts=2018-12-03T08:16:01.129681215Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Resolution with preferred IP protocol failed, attempting fallback protocol" fallback_protocol=ip4 err="address activity.finupfriends.com: no suitable address found"
ts=2018-12-03T08:16:01.130575059Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Resolved target address" ip=106.75.95.72
ts=2018-12-03T08:16:01.130691517Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Making HTTP request" url=http://[10<IP地址>72]/<URL> host=<域名>
ts=2018-12-03T08:16:01.136034061Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Received HTTP response" status_code=404
ts=2018-12-03T08:16:01.136115289Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Invalid HTTP response status code, wanted 2xx" status_code=404
ts=2018-12-03T08:16:01.136291446Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Response timings for roundtrip" roundtrip=0 start=2018-12-03T16:16:01.130830436+08:00 dnsDone=2018-12-03T16:16:01.130830436+08:00 connectDone=2018-12-03T16:16:01.132190408+08:00 gotConn=2018-12-03T16:16:01.132217722+08:00 responseStart=2018-12-03T16:16:01.135956713+08:00 end=2018-12-03T16:16:01.135991688+08:00
ts=2018-12-03T08:16:01.13647518Z caller=main.go:174 module=http_2xx target=<URL>/ level=debug msg="Probe failed" duration_seconds=0.007791544
```

按照`Making HTTP request`中的信息，用curl模拟，返回的是200，这就比较奇怪了。

## 继续调查

会不会通过curl访问时的请求头和blackbox-exporter探测时的请求头不同？

用tcpdump抓包，通过blackbox-exporter探测时，请求头内容如下：

```bash
GET /credit*****42e8 HTTP/1.1
Host: activity.finupfriends.com
User-Agent: Go-http-client/1.1
Accept-Encoding: gzip
Connection: close

HTTP/1.1 404 Not Found
Server: nginx/1.13.7
Date: Mon, 03 Dec 2018 07:59:26 GMT
Content-Type: text/plain; charset=utf-8
Content-Length: 9
Connection: close
Vary: Accept-Encoding

Not Found
```

用curl访问：

```bash
curl -v "10***e8" -H "Host: ac****ds.com" -H "User-Agent: Go-http-client/1.1" -H "Accept-Encoding: gzip" -H "Connection: close" 
```

结果还是200，对比curl的请求头，发现其中多了一个“Accept: */*”，

```bash
$ ./curl.sh
* About to connect() to 10***.72 port 80 (#0)
*   Trying 106***.72...
* Connected to 10***72 (10***72) port 80 (#0)
> GET /****42e8 HTTP/1.1
> Accept: */*
> Host: activity.finupfriends.com
> User-Agent: Go-http-client/1.1
> Accept-Encoding: gzip
> Connection: close
```

将curl中的`Accept`置为空，再次模拟请求：

```bash
curl -v "10***e8" -H "Host: ac****ds.com" -H "User-Agent: Go-http-client/1.1" -H "Accept-Encoding: gzip" -H "Connection: close" -H "Accept: "
```

结果返回404。

问题确定，因为通过blackbox-exporter请求时，请求头中没有`Accept: */*`，服务端返回了404。

## 修复

查看blackbox_exporter代码发现，可以在blackbox_exporter的配置文件中添加请求头：

```yaml
modules:
  http_2xx:
    prober: http
    http:
      headers:
        Accept: "*/*"
### 省略后续内容 ####
```

在不动服务端的情况下，问题解决。
