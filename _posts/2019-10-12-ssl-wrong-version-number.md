---
layout: default
title: "https 协议访问，误用 http 端口，CONNECT_CR_SRVR_HELLO: wrong version number"
author: 李佶澳
date: "2019-10-12 10:29:46 +0800"
last_modified_at: "2019-10-12 14:37:40 +0800"
categories: 问题
cover:
tags: kubernetes_problem
keywords:  kubernetes,ssl,ingress-nginx
description: 测试 ingress-nginx 的 client cert 认证功能遇到的问题，使用 curl 访问时，提示 routines:CONNECT_CR_SRVR_HELLO:wrong version number
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

在执行 [ingress-nginx 的认证功能使用示例][3] 中的操作时遇到的问题。

## 现象

测试 ingress-nginx 的 client cert 认证功能遇到的问题，提交了认证 ca 和 tls 证书后，使用 curl 访问时，提示 routines:CONNECT_CR_SRVR_HELLO:wrong version number。

ingres-nginx 使用 nodeport 的方式暴露，所以下面用到地址是 `xxxxx:30933`：

```sh
$ curl -v  --cacert ca.crt -H "Host: auth-cert.echo.example" https://192.168.99.100:30933
* Rebuilt URL to: https://192.168.99.100:30933/
*   Trying 192.168.99.100...
* TCP_NODELAY set
* Connected to 192.168.99.100 (192.168.99.100) port 30933 (#0)
* ALPN, offering h2
* ALPN, offering http/1.1
* Cipher selection: ALL:!EXPORT:!EXPORT40:!EXPORT56:!aNULL:!LOW:!RC4:@STRENGTH
* successfully set certificate verify locations:
*   CAfile: ca.crt
  CApath: none
* TLSv1.2 (OUT), TLS handshake, Client hello (1):
* error:1400410B:SSL routines:CONNECT_CR_SRVR_HELLO:wrong version number
* stopped the pause stream!
* Closing connection 0
curl: (35) error:1400410B:SSL routines:CONNECT_CR_SRVR_HELLO:wrong version number
```

用 chrome 浏览器打开时，提示网站无法提供安全的连接：

![SSL wrong version number]({{ site.imglocal }}/article/ssl-wrong-version.png)

## 调查

在网上搜了好久没找到答案，一头雾水，直到突然看到下面的内容：

![SSL wrong version number]({{ site.imglocal }}/article/ssl-wrong-version-1.png)

难道是用错了端口？？？用了 80 端口？

赶紧查看一些，果然！30933 是 80 端口的映射端口：

```sh
$ kubectl -n ingress-nginx get svc -o wide
NAME            TYPE       CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE   SELECTOR
ingress-nginx   NodePort   10.106.78.115   <none>        80:30933/TCP,443:30358/TCP   19h   app.kubernetes.io/name=ingress-nginx,app.kubernetes.io/part-of=ingress-nginx
```

## 解决

换成 443 端口映射的端口后，wrong version number 问题消失：

```sh
$ curl  --cacert ca.crt -H "Host: auth-cert.echo.example" https://192.168.99.100:30358/
curl: (60) SSL certificate problem: unable to get local issuer certificate
More details here: https://curl.haxx.se/docs/sslcerts.html

curl performs SSL certificate verification by default, using a "bundle"
 of Certificate Authority (CA) public keys (CA certs). If the default
 bundle file isn't adequate, you can specify an alternate file
 using the --cacert option.
```

但这时候出现了另一个问题，明明用 cacert 指定了证书，但是不生效，这和 mac 上的 curl 有关。


## 参考

1. [李佶澳的博客][1]
2. [error:14094410:SSL routines:SSL3_READ_BYTES:sslv3 alert handshake failure(35)][2]
3. [ingress-nginx 的认证功能使用示例][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://serverfault.com/questions/229972/error14094410ssl-routinesssl3-read-bytessslv3-alert-handshake-failure35 "error:14094410:SSL routines:SSL3_READ_BYTES:sslv3 alert handshake failure(35)"
[3]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/auth.html#client-certificate-authentication%EF%BC%88%E5%AE%A2%E6%88%B7%E7%AB%AF%E8%AF%81%E4%B9%A6%E8%AE%A4%E8%AF%81%EF%BC%89 "ingress-nginx 的认证功能使用示例"
