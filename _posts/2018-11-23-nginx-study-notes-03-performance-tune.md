---
layout: default
title: "Nginx学习笔记（三）：Nginx性能调优"
author: 李佶澳
createdate: "2018-11-23 19:07:38 +0800"
last_modified_at: "2018-11-23 19:07:38 +0800"
categories: 项目
tags: nginx  
keywords: nginx,学习笔记
description: 发现一份非常好的nginx性能调优文档，讲的很细致
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[Tuning NGINX for Performance][3]中给出了一些调优建议，调整的不只是nginx参数，还是有系统参数。

### 系统参数

`net.core.somaxconn`：内核参数，等待建立的连接的数量，如果连接增长非常快，存在连接无法建立的情况，可以考虑将这个数值增大。如果设置的数值超过512，需要在nginx的listen指令后面添加[backlog](https://nginx.org/en/docs/http/ngx_http_core_module.html?&_ga=2.97361375.1318856059.1542940760-488530544.1533263950#listen)配置，并设置为相同的值。

	 backlog=number
	 sets the backlog parameter in the listen() call that limits the maximum length for the queue of pending connections. 
	 By default, backlog is set to -1 on FreeBSD, DragonFly BSD, and macOS, and to 511 on other platforms. 

`net.core.netdev_max_backlog`：内核参数，网卡缓存报文的速度，调大可以提高报文吞吐。

`sys.fs.file-max`：内核参数，整个系统可以打开的文件数。

`nofile`：系统配置， `/etc/security/limits.conf`中设置的用户可打开的文件数。

`net.ipv4.ip_local_port_range`：内核参数，临时端口范围，如果port数量不足，可以调大，通常设置为1024~65000。

### nginx参数

[worker_processes](https://nginx.org/en/docs/ngx_core_module.html?&_ga=2.52318569.1318856059.1542940760-488530544.1533263950#worker_processes)：工作进程的数量

[worker_connections](https://nginx.org/en/docs/ngx_core_module.html?&_ga=2.52318569.1318856059.1542940760-488530544.1533263950#worker_connections)：每个worker的最高并发

[keepalive_requests](https://nginx.org/en/docs/http/ngx_http_core_module.html?&_ga=2.131946575.1318856059.1542940760-488530544.1533263950#keepalive_requests)：一个keep-alive连接中可以包含请求数。 

[keepalive_timeout](https://nginx.org/en/docs/http/ngx_http_core_module.html?&_ga=2.57676906.1318856059.1542940760-488530544.1533263950#keepalive_timeout)：keep-alive长连接的保持时间。

[keepalive](https://nginx.org/en/docs/http/ngx_http_upstream_module.html?&_ga=2.94318941.1318856059.1542940760-488530544.1533263950#keepalive)：与upstream之间缓存的空闲keep-alive连接数量。

[proxy_http_version](https://nginx.org/en/docs/http/ngx_http_proxy_module.html?&_ga=2.132619470.1318856059.1542940760-488530544.1533263950#proxy_http_version)：代理时使用的http协议，默认是1.0，如果使用keep-alive，需要修改成1.1。

[proxy_set_header](https://nginx.org/en/docs/http/ngx_http_proxy_module.html?&_ga=2.123025611.1318856059.1542940760-488530544.1533263950#proxy_set_header)：转发到upstream时，添加的header，如果使用keep-alive，需要设置下面的header：

	proxy_set_header Connection "";

[access_log](https://nginx.org/en/docs/http/ngx_http_log_module.html?&_ga=2.60249197.1318856059.1542940760-488530544.1533263950#access_log)：开启访问日志缓存，添加`buffer=size`，`flush=time`设置日志刷新时间，或者干脆关闭访问日志`off`。

[send_file](https://nginx.org/en/docs/http/ngx_http_core_module.html?&_ga=2.101555649.1318856059.1542940760-488530544.1533263950#sendfile)：使用send_file指令加速文件读取发送速度，send_file直接在内核态，将文件内容写入socket，不拷贝到用户空间。

[limit_conn_zone](https://nginx.org/en/docs/http/ngx_http_limit_conn_module.html?&_ga=2.103103168.1318856059.1542940760-488530544.1533263950#limit_conn_zone)和[limit_conn](https://nginx.org/en/docs/http/ngx_http_limit_conn_module.html?&_ga=2.88971611.1318856059.1542940760-488530544.1533263950#limit_conn)：限制满足特定条件的连接数量。

[limit_rate](https://nginx.org/en/docs/http/ngx_http_core_module.html?&_ga=2.169179233.1318856059.1542940760-488530544.1533263950#limit_rate)：限制向每个客户端的传输速率。

[limit_req_zone](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html?&_ga=2.123032907.1318856059.1542940760-488530544.1533263950#limit_req_zone)和[limit_req](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html?&_ga=2.123106763.1318856059.1542940760-488530544.1533263950#limit_req)：限制请求的速率。

[max_conns](https://nginx.org/en/docs/http/ngx_http_upstream_module.html?&_ga=2.153097592.1318856059.1542940760-488530544.1533263950#max_conns)：到backend的最大连接数。

[queue](https://nginx.org/en/docs/http/ngx_http_upstream_module.html?&_ga=2.102069697.1318856059.1542940760-488530544.1533263950#queue)：存放等待被转发的请求的队列长度

使用[Cache](https://docs.nginx.com/nginx/admin-guide/content-cache/?_ga=2.128415180.1318856059.1542940760-488530544.1533263950)和[Compression](https://docs.nginx.com/nginx/admin-guide/web-server/compression/?_ga=2.122968267.1318856059.1542940760-488530544.1533263950)。

## 参考

1. [nginx documentation][1]
2. [events context][2]
3. [Tuning NGINX for Performance][3]

[1]: http://nginx.org/en/docs/ "nginx documentation"
[2]: http://nginx.org/en/docs/ngx_core_module.html#events  "events context"
[3]: https://www.nginx.com/blog/tuning-nginx/ "Tuning NGINX for Performance"
