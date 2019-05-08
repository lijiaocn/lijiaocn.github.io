---
layout: default
title: "Nginx-ingress-controller的nginx配置因支持websocket，使upstream的keep-alive不生效"
author: 李佶澳
createdate: "2019-05-08 15:05:39 +0800"
changedate: "2019-05-08 20:10:03 +0800"
categories: 问题
tags: nginx
cover:
keywords: nginx,upstream,keep-alive
description: "抓包发现nginx发起的到upstream连接中只有一个请求，http头中connection字段是close，连接是被upstream主动断开的"
---

* auto-gen TOC:
{:toc}

## 说明

Kubernetes使用[nginx-ingress-controller][2]代理到集群内服务的请求，nginx所在的机器上上有大量的time-wait连接。

抓包发现nginx发起的到upstream连接中只有一个请求，http头中connection字段是close，连接是被upstream主动断开的：

![http连接关闭]({{ site.imglocal }}/article/http-close.png)

但是明明在配置中为upstream配置了keep-alive，并指定最大数量32。

## 调查

先在测试环境做个试验，摸清nginx的转发行为。

[Nginx keep-alive][1]强调需要设置http版本1.1，并且要清除Connection请求头，按要求正确配置确定keep-alive是有效的，这里不展示了。

下面主要试验一下特殊情况。（问题环境中，nginx配置文件因为别的原因没有清除Connection，upstream收到的请求头是`Connection: close`，所以主要关心特殊情况下的行为）

### 不配置http1.1，不清除Connection：请求端发起“Connection: close”请求

先测试一下在不配置http 1.1和不清除Connection请求头的情况下，请求端在请求头里带上“Connection: close”会怎样。

使用下面的配置文件：

```sh
$ cat /etc/nginx/conf.d/echo.com.conf
upstream echo_upstream{
    server  172.16.128.126:8080;
    keepalive 10;
}

server {
    listen       7000 ;
    listen       [::]:7000 ;
    server_name  echo.com;                         # 在本地host配置域名
    keepalive_requests  2000;
    keepalive_timeout  60s;

    location / {
        proxy_pass  http://echo_upstream;
#        proxy_http_version 1.1;                  # 故意注释这两行配置，观察下行为
#        proxy_set_header Connection "";          # 
    }
}
```

使用下面的压测命令：

```sh
./wrk -d 2m  -c 20 -H "host: echo.com" -H "Connection: close"  http://10.10.64.58:7000
```

在upstream端抓包，发现除了少部分报文抓取不连续的连接，其它所有连接中都只包含一次http请求：

![所有连接里都只要一次http请求]({{ site.imglocal }}/article/one-http.png)

### 不配置http1.1，不清除Connection：请求端发起不带“Connection”请求

请求端发起的请求不设置Connection，nginx将使用默认的close值。使用下面的压测命令：

```sh
./wrk -d 2m  -c 20 -H "host: echo.com"  http://10.10.64.58:7000
```

压测端发出的请求是这样的：

```http
GET / HTTP/1.1
host: echo.com
Host: 10.10.64.58:7000

HTTP/1.1 200 OK
Server: nginx/1.12.2
Date: Wed, 08 May 2019 09:01:26 GMT
Content-Type: text/plain
Content-Length: 379
Connection: keep-alive
...
```

而upstream端收到请求是带有close的，一个连接中只有一个请求：

```http
GET / HTTP/1.0
Host: echo_upstream
Connection: close

HTTP/1.1 200 OK
Date: Wed, 08 May 2019 09:08:08 GMT
Content-Type: text/plain
Content-Length: 379
Connection: close
Server: echoserver
```

### 不配置http1.1，不清除Connection：请求端发起“Connection: keep-alive”请求

即使请求端设置了keep-alive，nginx转发给upstream的依然是`Connection: close`：

```sh
GET / HTTP/1.0
Host: echo_upstream
Connection: close

HTTP/1.1 200 OK
Date: Wed, 08 May 2019 11:37:58 GMT
Content-Type: text/plain
Content-Length: 379
Connection: close
Server: echoserver
```

### 小结

由此得出结论，如果不进行下面设置，无论请求端如何调整，nginx转发给upstream时都不会使用keep-alive：

```conf
server {
    ...

    location /http/ {
        proxy_pass http://http_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        ...
    }
}
```

## 检查问题环境

先看一下问题环境upstream收到的报文，是`HTTP/1.1`，带有`Connection: close`，这个组合有点奇怪，是前面试验中没遇到的：

```sh
GET /js/manifest.988fecf548c158ad4ab7.js HTTP/1.1
Host: ********
Connection: close
X-Real-IP: ********
....
```

检查配置文件发现了问题：

```
...
# Retain the default nginx handling of requests without a "Connection" header
map $http_upgrade $connection_upgrade {
    default          upgrade;
    ''               close;
}
...

# Allow websocket connections
proxy_set_header                        Upgrade           $http_upgrade;
proxy_set_header                        Connection        $connection_upgrade;
...
```

在配置模板文件/etc/nginx/template/nginx.tmpl中找到了这段配置的说明，这是nginx 1.3开始提供的[WebSocket proxying][3]代理功能：

```
{{/* Whenever nginx proxies a request without a "Connection" header, the "Connection" header is set to "close" */}}
{{/* when making the target request.  This means that you cannot simply use */}}
{{/* "proxy_set_header Connection $http_connection" for WebSocket support because in this case, the */}}
{{/* "Connection" header would be set to "" whenever the original request did not have a "Connection" header, */}}
{{/* which would mean no "Connection" header would be in the target request.  Since this would deviate from */}}
{{/* normal nginx behavior we have to use this approach. */}}
# Retain the default nginx handling of requests without a "Connection" header
map $http_upgrade $connection_upgrade {
    default          upgrade;
    ''               close;
}
```

上面配置的影响是：当http请求头中没有Upgrade字段时，转发给upstream的请求被设置为“Connection: close”（nginx的默认行为）。keepalive因此而无效，之所以是HTTP/1.1，是因为配置文件有这样一样配置：

```conf
proxy_http_version          1.1;
```

## 修改验证

在测试环境更新nginx配置，将默认行为设置为“Connection: ""”，看一下能否解决问题。更新后的配置如下：

```conf
upstream echo_upstream{
    server  172.16.128.126:8080;
    keepalive 1;
}

map $http_upgrade $connection_upgrade {
    default          upgrade;
    ''               "";
}

server {
    listen       7000 ;
    listen       [::]:7000 ;
    server_name  echo.com;                         # 在本地host配置域名
    keepalive_requests  2000;
    keepalive_timeout  60s;

    location / {
        proxy_pass  http://echo_upstream;
        proxy_set_header                        Upgrade           $http_upgrade;
        proxy_set_header                        Connection        $connection_upgrade;
        proxy_http_version 1.1;
#        proxy_set_header Connection "";
    }
}
```

再次测试，请求端不使用keep-alive：

```sh
./wrk -d 2m  -c 20 -H "host: echo.com" -H "Connection: close"  http://10.10.64.58:7000
```

在upstream端抓包，即使请求端不使用keep-alive，nginx转发upstream的时候还是会使用keep-alive:

```sh
GET / HTTP/1.1
Host: echo_upstream

HTTP/1.1 200 OK
Date: Wed, 08 May 2019 11:54:00 GMT
Content-Type: text/plain
Transfer-Encoding: chunked
Connection: keep-alive
Server: echoserver
...


GET / HTTP/1.1
Host: echo_upstream

HTTP/1.1 200 OK
Date: Wed, 08 May 2019 11:54:00 GMT
Content-Type: text/plain
Transfer-Encoding: chunked
Connection: keep-alive
Server: echoserver
```

把`keepalive_timeout 60s;`中的时间调大，会看到请求端停止请求之后，nginx与upstream还有连接。

## 参考

1. [nginx keep-alive][1]
2. [NGINX Ingress Controller][2]
3. [WebSocket proxying][3]

[1]: https://nginx.org/en/docs/http/ngx_http_upstream_module.html#keepalive "nginx keep-alive"
[2]: https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/ "NGINX Ingress Controller"
[3]: http://nginx.org/en/docs/http/websocket.html "WebSocket proxying"
