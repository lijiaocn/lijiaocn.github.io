---
layout: default
title: "RFC保留的顶级域名，不会被其它主体注册使用的域名"
author: 李佶澳
createdate: "2019-05-28 17:08:49 +0800"
changedate: "2019-05-28 19:41:37 +0800"
categories:  方法
tags: RFC
cover:
keywords: RFC,保留域名,内网域名
description: RFC规定中预留了不会被其它主体注册使用的域名，.test、.example、.invalid、.localhost
---

* auto-gen TOC:
{:toc}

## 说明

[RFC 2606][1]（Reserved Top Level DNS Names）和 [RFC 6761][2]（Special-Use Domain Names）规定中预留了不会被其它主体注册使用的域名。

[![rfc6761特殊用途的预留域名]({{ site.imglocal }}/article/rfc6761.png)][2]

## 用于私有IP地址的保留域名

[RFC 1918](https://tools.ietf.org/html/rfc1918)定义三个私有IP网段：

```sh
10.0.0.0        -   10.255.255.255  (10/8 prefix)
172.16.0.0      -   172.31.255.255  (172.16/12 prefix)
192.168.0.0     -   192.168.255.255 (192.168/16 prefix)
```

[RFC 6761][2]为这些网段的IP保留了以下的域名，注意域名中的IP顺序是反的：

```sh
10.in-addr.arpa.      21.172.in-addr.arpa.  26.172.in-addr.arpa.
16.172.in-addr.arpa.  22.172.in-addr.arpa.  27.172.in-addr.arpa.
17.172.in-addr.arpa.  30.172.in-addr.arpa.  28.172.in-addr.arpa.
18.172.in-addr.arpa.  23.172.in-addr.arpa.  29.172.in-addr.arpa.
19.172.in-addr.arpa.  24.172.in-addr.arpa.  31.172.in-addr.arpa.
20.172.in-addr.arpa.  25.172.in-addr.arpa.  168.192.in-addr.arpa.
```

## .test、.example、.invalid、.localhost

[RFC 1918](https://tools.ietf.org/html/rfc1918)预留的四个顶级域名和三个二级域名，在[RFC 6761][2]中依旧被保留。

四个预留的顶级域名：

```sh
.test           建议在用于被测试的系统
.example        建议在文档中使用，用于演示
.invalid        建议用于无效域名
.localhost      已经被习惯性用于本地静态配置的host
```

三个预留的二级域名：

```sh
.example.com
.example.net
.example.org
```

## 参考

1. [RFC 2606: Reserved Top Level DNS Names][1]
2. [RFC 6761: Special-Use Domain Names][2]

[1]: https://tools.ietf.org/html/rfc2606 "RFC 2606: Reserved Top Level DNS Names"
[2]: https://tools.ietf.org/html/rfc6761 "RFC 6761: Special-Use Domain Names"
