---
layout: default
title: "nginx 带有时效的 Secure Url（加密链接）的配置方法"
author: 李佶澳
date: "2020-04-07T13:10:12+0800"
last_modified_at: "2020-04-07T13:10:12+0800"
categories: 技巧
cover:
tags: nginx
keywords: nginx,secure url,加密链接,临时链接
description: 用nginx的secure_link_secret、secure_link、secure_link_md5 指令生成加密链接，超过有效时间后失效
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

nginx 的 secure_link_secret、secure_link、secure_link_md5 指令用于生成加密链接，并且可以设置链接的有效时间，超时后，链接失效无法打开。

## 基本方式，不带时效

```conf
upstream echo_upstream{
    server  127.0.0.1:9090;
    keepalive 1;
}

upstream record_upstream {
    server  127.0.0.1:9091;
}

server {
    listen       9000;
    listen       [::]:9000;
    server_name  echo.example;
    keepalive_requests  2000;
    keepalive_timeout 60s;

    location / {
        proxy_pass  http://echo_upstream;
    }

    location /basic/ {
        secure_link_secret 12345;
        if ($secure_link = "") { return 403; }
        rewrite ^ /$secure_link;
    }
}
```

`secure_link_secret` 是 12345，假设要访问的资源是 /hls/bunny.m3u8，将它与 secure_link_secret 拼接后进行 md5 计算：

```sh
$ echo -n 'hls/bunny.m3u812345' | openssl md5 -hex = 5d626a1fb79396e46a65333e89b3bf04
(stdin)= 5d626a1fb79396e46a65333e89b3bf04
```

然后带着 md5 校验码访问 /hls/bunny.m3u8：

```sh
$ curl 127.0.0.1:9000/basic/5d626a1fb79396e46a65333e89b3bf04/hls/bunny.m3u8
```

## 带有超时时间的 secure url

```conf
    location /tmp/ {
        secure_link $arg_md5,$arg_expires;
        secure_link_md5 "$secure_link_expires$uri 12345";
        if ($secure_link = "") { return 403; }
        if ($secure_link = "0") { return 410; }

        rewrite ^/tmp/(.*)$  /$1 last;
    }
```


假设要访问 /tmp/files/pricelist.html，超时时间为 300 秒，根据 secure_link_md5 指定格式计算 md5

```sh
$ expires=$((`date +%s` + 300))
$ md5=`echo -n "$expires/tmp/files/pricelist.html 12345" |openssl md5 -binary | openssl base64 | tr +/ -_ | tr -d = `
$ curl "127.0.0.1:9000/tmp/files/pricelist.html?md5=$md5&expires=$expires"
```

## 参考

1. [李佶澳的博客][1]
2. [ngx_http_secure_link_module.html#secure_link_secret][2]
3. [Securing URLs with the Secure Link Module in NGINX and NGINX Plus][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: http://nginx.org/en/docs/http/ngx_http_secure_link_module.html#secure_link_secret "ngx_http_secure_link_module.html#secure_link_secret"
[3]: https://www.nginx.com/blog/securing-urls-secure-link-module-nginx-plus/ "Securing URLs with the Secure Link Module in NGINX and NGINX Plus"
