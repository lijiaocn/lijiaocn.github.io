---
layout: default
title: "kubernetes ingress-nginx 启用 upstream 长连接，需要注意，否则容易 502"
author: 李佶澳
date: "2019-12-04 16:01:58 +0800"
last_modified_at: "2019-12-04 19:03:56 +0800"
categories: 问题
cover:
tags: nginx
keywords: nginx,502,104,keepalive,keepalive_timeout,keepalive_requests
description: nginx 中配置的连接断开条件比后端服务宽松，容易出现后端服务先断开连接的情况
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

之前踩过这个坑，在《[使用 nginx 作反向代理，启用 keepalive 时，遇到 502 错误的调查过程][2]》 中了记录调查过程，当时多个案例同时查，记录的比较乱，这里重新整理一下结论。

ingress-nginx 到 upstream 的长连接通过 configmap 中的 [upstream-keepalive-connections][6] 等参数设置，注意与 keep-alive 区分（见文末）。另外 ingress-nginx  0.20 之前的版本有 bug，即使配置了也不生效：[ingress-nginx upstream 的 keep-alive 不生效][7]。

## 三个结论

这里主要解释结论 3，这里的结论不仅适用于 ingress-nginx，也适用于其它使用 nginx 的场景。

**结论1**：nginx 的端口耗尽时，会返回 502 错误（和本文要讨论的内容无关）。

**结论2**：nginx 向已经被服务端主动断开的连接发送请求，会收到 RST，然后返回 502。

**结论3**：服务端先于 nginx 断开连接的情况有两种，

1）服务端的连接超时时间小于 nginx 中的配置；

2）服务端配置的单个连接的最大请求数小于 nginx 中配置。

## 为什么服务端有超时时间和最大请求数限制？

服务端应用可能是通过本地的 tomcat 或者其它 web 框架对外暴露的，这种情况非常普遍。
这些 Web 服务或者框架通常都有默认的长连接设置。

譬如 tomcat 的 [相关配置](https://tomcat.apache.org/tomcat-8.5-doc/config/http.html)

![tomcat 的 maxKeepAliveRequests](https://www.lijiaocn.com/img/article/nginx-104-reset-3.png)

![tomcat 的 connectionTimeout](https://www.lijiaocn.com/img/article/nginx-104-reset-4.png)

![tomcat 的 keepAliveTimeout](https://www.lijiaocn.com/img/article/nginx-104-reset-5.png)

另外曾经遇到过的 [Gunicorn](https://docs.gunicorn.org/en/latest/settings.html?highlight=keepalive#keepalive) 超时时间只有 2 秒：

![Gunicorn 的超时时间设置](https://www.lijiaocn.com/img/article/nginx-104-reset-9.png)

## nginx 的配置与后端服务的配置不一致时

如果做反向代理的 nginx 中配置的连接断开条件比后端服务设置的条件宽松，那么就容易出现后端服务先断开连接的情况，
这时候 nginx 转发请求到 upstream，upstream 会返回 RST，nginx 打印下面的错误日志，给客户端返回 502：

```sh
2019/06/13 04:57:54 [error] 3429#3429: *21983075 upstream prematurely closed connection while reading 
response header from upstream, client: 10.19.167.120, server: XXXX.com, request: "POST XXXX HTTP/1.0",
upstream: "http://11.0.29.4:8080/XXXXXX", host: "XXXX.com"

2019/06/13 04:58:34 [error] 3063#3063: *21989359 recv() failed (104: Connection reset by peer) while 
reading response header from upstream, client: 10.19.138.139, server: XXXX.com, request: 
"POST /api/v1/XXXX HTTP/1.1", upstream: "http://11.0.145.9:8080/api/v1/XXXX", host: "XXXX.com"
```

## 建议设置

可以调整 nginx 的 upstream 中 [keepalive_timeout](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_timeout) 和 [keepalive_requests](https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_requests)，确保 nginx 先于 upstream 断开连接。只有 nginx 与 upstream 之间使用长连接的时候需要考虑这种情况，并进行类似的设置。

```conf
upstream record_upstream {
    server  127.0.0.1:9091;
    keepalive 16;
    keepalive_timeout  58s;    # 默认 60 s，根据实际情况调整，建议小于 60s
    keepalive_requests 98;     # 默认 100 个，根据实际情况调整，建议小于 100
}

server {
    ...
    location /http/ {
        proxy_pass http://record_upstream;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        ...
    }
}
```

nginx 的 keepalive_timeout 和 keepalive_requests 参数各有两个：一组属于 [ngx_http_core_module][3]，在 http/server/location 中使用，限制的是 client 与 nginx 之间的连接；另一组是上面使用的，属于 [ngx_http_upstream_module][4]，限制的是 nginx 与 upstream 之间的连接。

## 默认行为

nginx 的 upstream 中没有明确配置 keepalive，那么无论 client 和 nginx 之间是否长连接，nginx 和 upstream 都是短连接。

用下面的配置观察：

```conf
upstream record_upstream {
    server  127.0.0.1:9091;

    #keepalive 3;
    #keepalive_timeout  58s;
    #keepalive_requests 98;
}

server {
    listen       9000;
    listen       [::]:9000;
    server_name  echo.example;
    keepalive_requests  2000;
    keepalive_timeout 60s;

    location / {
        proxy_pass  http://record_upstream;
        #proxy_http_version 1.1;
        #proxy_set_header Connection "";
    }
}
```

使用长连接访问 nginx ：

```sh
wrk -c 1 -t 1 -d 2s  http://127.0.0.1:9000
```

[http-record][5] 收到的请求是 "Connection: close"：

```sh
/go/src/Server/echo.go:46: {
    "RemoteAddr": "172.17.0.1:34522",
    "Method": "GET",
    "Host": "record_upstream",
    "RequestURI": "/",
    "Header": {
        "Connection": [
            "close"
        ]
    },
    "Body": ""
}
```

## 参考

1. [李佶澳的博客][1]
2. [使用Nginx作反向代理，启用keepalive时，遇到502错误的调查过程][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2019/06/13/nginx-104-reset.html "使用Nginx作反向代理，启用keepalive时，遇到502错误的调查过程"
[3]: https://nginx.org/en/docs/http/ngx_http_core_module.html#keepalive_requests "ngx_http_core_module"
[4]: https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive_requests "ngx_http_upstream_module"
[5]: https://www.lijiaocn.com/soft/tools/http.html#http-%E8%AF%B7%E6%B1%82%E8%AE%B0%E5%BD%95-http-record "HTTP 请求记录: http-record"
[6]: https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/configmap/#upstream-keepalive-connections "upstream-keepalive-connections"
[7]: https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2019/05/08/nginx-ingress-keep-alive-not-work.html "kubernetes的Nginx Ingress 0.20之前的版本，upstream的keep-alive不生效"
