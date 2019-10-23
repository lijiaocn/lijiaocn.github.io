---
layout: default
title: "kubernetes ingress-nginx http 请求复制功能与 nginx mirror 的行为差异"
author: 李佶澳
date: "2019-10-21 16:41:31 +0800"
last_modified_at: "2019-10-23 11:35:17 +0800"
categories: 问题
cover:
tags: kubernetes apigateway
keywords: ingress-nginx,请求复制,流量复制
description: ingress-nginx 的请求复制行为不是预期的行为，不方便应用，想办法让它与 nginx mirror 相同
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

Kubernetes 以及 ingress-nginx 的用法已经整理到 [小鸟笔记][2] 中，大量的操作方法和操作细节，以及用到的素材都在笔记中。对某一具体问题或功能的分析用这里的单篇文章记录。

Nginx 从 1.13.4 开始提供了 [ http 请求复制功能][3]，Ingress-nginx 也及时跟进提供了同样的功能，[Nginx 请求复制功能][3]。但是实际测试发现两者的行为不一致。

## Nginx 与 Ingress-Ningx 请求复制的差异

采用 [Nginx 的请求复制][3] 中的配置，请求是`原封不动`复制，接收端收到的请求从 uri 到 body 完全相同。

采用 [Ingress-nginx 的请求复制功能][4] 中的配置，请求 `不是` 原封不动地转发过去的，uri 被改变，原始的 uri 记录在 header 头中。

例如，发起下面的请求：

```sh
$ curl -X POST -d "111111" -H "Host: mirror.echo.example" "192.168.99.100:30933/aaaaaa/bbbb?c=a"
```

复制后的请求如下，request uri 变成 `/echo?c=a`：

```json
{
    "RemoteAddr": "172.17.0.11:59784",
    "Method": "POST",
    "Host": "mirror.echo.example",
    "RequestURI": "/echo?c=a",
    "Header": {
        "Accept": [
            "*/*"
        ],
        "Content-Length": [
            "6"
        ],
        "Content-Type": [
            "application/x-www-form-urlencoded"
        ],
        "User-Agent": [
            "curl/7.54.0"
        ],
        "X-Forwarded-For": [
            "172.17.0.1"
        ],
        "X-Forwarded-Host": [
            "mirror.echo.example"
        ],
        "X-Forwarded-Port": [
            "80"
        ],
        "X-Forwarded-Proto": [
            "http"
        ],
        "X-Original-Uri": [
            "/aaaaaa/bbbb?c=a"
        ],
        "X-Real-Ip": [
            "172.17.0.1"
        ],
        "X-Request-Id": [
            "86e25adfcd7f2a673925d9a17769272a"
        ],
        "X-Scheme": [
            "http"
        ]
    },
    "Body": "1111"
```

ingress-nginx 的请求复制行为不是我们预期的行为，也不方便应用，需要想办法让它的行为与 nginx 相同。

## 参考

1. [李佶澳的博客][1]
2. [ingress-nginx 的使用方法][2]
3. [Nginx 请求复制功能][3]
4. [Ingress-nginx 的请求复制功能][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/ "ingress-nginx 的使用方法"
[3]: https://www.lijiaocn.com/soft/nginx/mirror.html "Nginx 请求复制功能"
[4]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/mirror.html "Ingress-nginx 的请求复制功能"
