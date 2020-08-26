---
layout: default
title: "Nginx 指令学习"
author: 李佶澳
date: "2020-03-04T22:43:31+0800"
last_modified_at: "2020-03-04T22:43:31+0800"
categories:
cover:
tags:
keywords:
description:
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

user 运行用户

```sh
user root root;   # user user [group];
```

worker_processes 运行进程数

```sh
worker_processes  auto;
```

worker_cpu_affinity 进行 cpu 绑定

```sh
worker_cpu_affinity 00000001 00000010 00000100 00001000 00010000 00100000 01000000 10000000;
```

error_log 错误日志文件

```sh
error_log   "/home/homework/webserver/error.log"   notice;
```

pid 进程文件

```sh
pid         "/home/homework/var/nginx.pid";
```

client_body_temp_path 存放客户端临时请求数据的目录：

```sh
client_body_temp_path path [level1 [level2 [level3]]];
```

fastcgi_temp_path 存放 fastCGI 返回的数据的目录：

```sh
fastcgi_temp_path path [level1 [level2 [level3]]];
```

proxy_temp_path 存放过从 proxy server 收到的文件：

```sh
proxy_temp_path path [level1 [level2 [level3]]];
```

uwsgi_temp_path 存放从 uwsgi 收到的文件：

```sh
uwsgi_temp_path path [level1 [level2 [level3]]];
```

scgi_temp_path 存放从 scgi 收到的文件：

```sh
scgi_temp_path path [level1 [level2 [level3]]];
```

server_names_hash_bucket_size 设置 servie name 哈希桶的数量：

```sh
server_names_hash_bucket_size size;
```

变量哈希表的大小：

```sh
variables_hash_max_size 1024;
```

请求端 header 的缓存大小：

```sh
client_header_buffer_size 1k;
```

存放客户端请求大 header 的 buffer 数量：

```sh
large_client_header_buffers 4 8k;
```

客户端请求 body 的 Content-Length 的最大值，超过返回 413：

```sh
client_max_body_size 1m;
```

客户端请求 body 缓存大小：

```sh
client_body_buffer_size 8k|16k;
```

```sh
port_in_redirect on;
```

```sh
sendfile off;
```

```sh
tcp_nopush off;
```

```sh
tcp_nodelay on;
```

```sh
server_tokens on;
```

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
