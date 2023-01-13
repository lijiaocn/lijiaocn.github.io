---
layout: default
title: "curl: 用 Curl 命令访问 Unix Socket 接口的方法"
author: 李佶澳
date: "2019-09-16 14:55:27 +0800"
last_modified_at: "2023-01-13 16:48:37 +0800"
categories: 技巧
cover:
tags: manual
keywords: curl,unix socket,socket接口,访问方法
description: 监听地址不是 IP:Port 而是 unix socket 的程序的 unix socket 接口也可以用 curl 访问
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

经常遇到一些监听地址不是 IP:Port 而是 unix socket 的程序，这些程序如果使用的是 HTTP 协议，unix socket 接口也可以用 curl 访问。

例如 [ingress-nginx](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/07/16/kubernetes-ingress-nginx-code.html) 的监听地址为 unix:/tmp/nginx-status-server.sock：

```conf
server {
        listen unix:/tmp/nginx-status-server.sock;
        set $proxy_upstream_name "internal";

        keepalive_timeout 0;
        gzip off;

        access_log off;

        location /healthz {
                return 200;
        }

        location /nginx_status {
                stub_status on;
        }
        ... 省略...
}
```

用 curl 访问它的 unix socket 的方法如下：

```sh
$ curl --unix-socket /tmp/nginx-status-server.sock http://localhost/nginx_status
Active connections: 77
server accepts handled requests
 64273 64273 971368
Reading: 0 Writing: 12 Waiting: 65
```

`--unix-socket` 指定 unix socket 文件的地址， `http://localhost/nginx_status` 是要请求的路径。

注意 localhost 可以根据实际情况更改成其它数值但不可省略，如果省略后变成 http://nginx_status，那么 nginx_status 会被认作是 Host，Path 被认为是 /：

```sh
$ curl -v  --unix-socket /tmp/nginx-status-server.sock http://nginx_status
* Expire in 0 ms for 6 (transfer 0xe464ab3dd0)
*   Trying /tmp/nginx-status-server.sock...
* Expire in 200 ms for 4 (transfer 0xe464ab3dd0)
* Connected to nginx_status (/tmp/nginx-status-server.sock) port 80 (#0)
> GET / HTTP/1.1
> Host: nginx_status
> User-Agent: curl/7.64.0
> Accept: */*
```

## 参考

1. [李佶澳的博客][1]
2. [Can cURL send requests to sockets?][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://superuser.com/questions/834307/can-curl-send-requests-to-sockets "Can cURL send requests to sockets?"
