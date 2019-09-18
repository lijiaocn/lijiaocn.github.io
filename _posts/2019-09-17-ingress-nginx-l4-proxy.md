---
layout: default
title: "Kubernetes ingress-nginx 4 层 tcp 代理，无限重试不存在的地址，高达百万次"
author: 李佶澳
date: "2019-09-17 14:08:20 +0800"
last_modified_at: "2019-09-18 11:45:42 +0800"
categories: 问题
cover:
tags: kubernetes_problem
keywords: openresty,kubernetes,nginx,ingress-nginx
description: 使用 lua 脚本设置 tcp 转发规则，如果 peer 地址不存在会无限重试, 需配置 proxy_next_upstream_tries
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

在 kubernetes 集群中部署了 [ingress-nginx 0.25][2] ，并在名为 tcp-services 的 config-map 配置了 tcp 4 层代理：

```yaml
data:
  "55556": beta-xxxx/xxx-cloud-server:5555
```

但是 service "beta-xxxx/xxx-cloud-server" 对应的容器没有开启 5555 端口，访问 ingress-nginx 的 55556 端口时，ingress-nginx 持续打印错误日志：

```sh
2019/09/17 03:46:20 [error] 2454#2454: *3584946 connect() failed (111: Connection refused) while connecting to upstream, client: 10.10.122.117, server: 0.0.0.0:55556, upstream: "10.12.39.132:5555", bytes from/to client:0/0, bytes from/to upstream:0/0
2019/09/17 03:46:20 [error] 2454#2454: *3584946 connect() failed (111: Connection refused) while connecting to upstream, client: 10.10.122.117, server: 0.0.0.0:55556, upstream: "10.12.26.199:5555", bytes from/to client:0/0, bytes from/to upstream:0/0
2019/09/17 03:46:20 [error] 2454#2454: *3584946 connect() failed (111: Connection refused) while connecting to upstream, client: 10.10.122.117, server: 0.0.0.0:55556, upstream: "10.12.39.132:5555", bytes from/to client:0/0, bytes from/to upstream:0/0
```

从日志可以判断，nginx-inress 在重复的、无间歇地连接没有提供服务的端口。

## 调查

[ingress-nginx 0.25][2] 基于 openresty/1.15.8.1，对应的 tcp 4 层代理配置如下：

```conf
server {
        upstream upstream_balancer {
                server 0.0.0.1:1234; # placeholder

                balancer_by_lua_block {
                        tcp_udp_balancer.balance()
                }
        }

        preread_by_lua_block {
                ngx.var.proxy_upstream_name="xxxx-server-5555";
        }

        listen                  55555;

        proxy_timeout           600s;
        proxy_pass              upstream_balancer;
}
```

因为代理过程是用 lua 脚本控制的，需要界定`无限重试`的行为是 openresty/nginx 自身的行为，还是 lua 脚本导致的行为。

## 在 nginx 1.12.2 中试验

先用 nginx version: nginx/1.12.2 试验一下。

参照 [Module ngx_stream_proxy_module][3] 中的例子，在 nginx 中配置 4 层代理，指向一个没有被监听的端口：

```conf
stream{
        server {
                proxy_timeout           600s;
                listen                  127.0.0.1:12345;
                proxy_pass              127.0.0.1:8080;

        }
}
```

访问  127.0.0.1:12345


```sh
$ curl 127.0.0.1:12345
curl: (56) Recv failure: Connection reset by peer
```

只有一行错误日志，一次重试：

```sh
2019/09/17 14:32:07 [error] 25923#0: *2 connect() failed (111: Connection refused) while connecting to upstream, client: 127.0.0.1, server: 127.0.0.1:12345, upstream: "127.0.0.1:8080", bytes from/to c    lient:0/0, bytes from/to upstream:0/0
```

## 在 openresty 1.15.8.1 中试验（非 lua 方式）

先用非 lua 方式，在配置文件中添加下面配置：

```conf
stream{
        upstream upstream_balancer{
                server                  127.0.0.1:8080;
        }
        server {
                proxy_timeout           600s;
                listen                  127.0.0.1:12346;
                proxy_pass              upstream_balancer;
        }
}
```

结果和 nginx 相同，只有一次重试。

## 在 openresty 1.15.8.1 中试验（lua 方式）

参照 [tcp_udp_balancer.lua][4] 使用 lua 脚本实现转发，依旧转发到不存在的端口：

```conf
stream{
        upstream upstream_balancer{
                server 0.0.0.1:1234; # placeholder
                balancer_by_lua_block {
                   local ngx_balancer = require("ngx.balancer")
                   ngx_balancer.set_more_tries(1)
                   local ok, err = ngx_balancer.set_current_peer("127.0.0.1","8080")
                   if not ok then
                      ngx.log(ngx.ERR, string.format("error while setting current upstream : %s", err))
                   end
                }
        }
        server {
                proxy_timeout           600s;
                listen                  127.0.0.1:12346;
                proxy_pass              upstream_balancer;
        }
}
```

这时候访问，curl 会一直等待：

```sh
$ curl 127.0.0.1:12346

^C
```

同时 error 日志中有大量日志，多达百万条：

![openresty-1.15.8.1无限重试]({{ site.imglocal }}/page/openresty-1.15.8.1.png)

将 ngx_balancer.set_more_tries(1) 修改为 ngx_balancer.set_more_tries(0) 则没有问题，但是 [set_more_tries][5] 接口的参数是 count 的意思，指定的重试次数而不是设置无限重试。

确定这是 openresty-1.15.8.1 的 bug：

	使用 lua 脚本设置 tcp 转发规则时，如果 peer 地址不存在，会无限重试。

## 解决方法

[openresty/lua-nginx-module #1545][6] 和 [openresty/lua-nginx-module #1546][7] 中提到这个问题，讨论的结果是不认为这是 bug，可以用 [proxy_next_upstream_tries][8] 参数解决这个问题：

{% raw %}
```sh
stream {
        upstream upstream_balancer{
                server 0.0.0.1:1234; # placeholder
                balancer_by_lua_block {
                   local ngx_balancer = require("ngx.balancer")
                   ngx_balancer.set_more_tries(1)
                   local ok, err = ngx_balancer.set_current_peer("127.0.0.1","8080")
                   if not ok then
                      ngx.log(ngx.ERR, string.format("error while setting current upstream : %s", err))
                   end
                }
        }
        server {
                proxy_timeout              600s;
                listen                     127.0.0.1:12346;
                proxy_pass                 upstream_balancer;
                proxy_next_upstream_tries  3;                  # 最多重试三次
        }
}
```
{% endraw %}

查看 [ingress-nginx 0.25][2] 模板文件发现这应该是 ingress-nginx 的 bug，tcp services 和 udp services 中需要配置 proxy_next_upstream_tries：

{% raw %}
```conf
    # TCP services
    {{ range $tcpServer := .TCPBackends }}
    server {
        preread_by_lua_block {
            ngx.var.proxy_upstream_name="tcp-{{ $tcpServer.Backend.Namespace }}-{{ $tcpServer.Backend.Name }}-{{ $tcpServer.Backend.Port }}";
        }

        ... 省略 ...
        # In case of errors try the next upstream server before returning an error
        proxy_next_upstream_timeout             0;
        proxy_next_upstream_tries               3;
    }
    {{ end }}
```
{% endraw %}

镜像制作方法: [编译与镜像制作](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/07/16/kubernetes-ingress-nginx-code.html#%E7%BC%96%E8%AF%91%E4%B8%8E%E9%95%9C%E5%83%8F%E5%88%B6%E4%BD%9C)。

## 参考

1. [李佶澳的博客][1]
2. [Kubernetes 基于 openresty 的 ingress-nginx 的状态和配置查询][2]
3. [Module ngx_stream_proxy_module][3]
4. [ingress-nginx/rootfs/etc/nginx/lua/tcp_udp_balancer.lua][4]
5. [set_more_tries][5]
6. [Bug set_more_tries cause infinite retrying when no valid servers and proxy_next_proxy_tries=0][6]
7. [fix(set_more_tries): fix infinite retry when no available servers and...][7]
8. [proxy_next_upstream_tries][8]
9. [balancer.set_more_tries(count) not work in openresty 1.15.8.2][9]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/09/16/ingress-nginx-with-openresty.html "Kubernetes 基于 openresty 的 ingress-nginx 的状态和配置查询"
[3]: http://nginx.org/en/docs/stream/ngx_stream_proxy_module.html#example "Module ngx_stream_proxy_module"
[4]: https://github.com/kubernetes/ingress-nginx/blob/master/rootfs/etc/nginx/lua/tcp_udp_balancer.lua#L139 " ingress-nginx/rootfs/etc/nginx/lua/tcp_udp_balancer.lua "
[5]: https://github.com/openresty/lua-resty-core/blob/master/lib/ngx/balancer.md#set_more_tries "set_more_tries"
[6]: https://github.com/openresty/lua-nginx-module/issues/1545 "Bug set_more_tries cause infinite retrying when no valid servers and proxy_next_proxy_tries=0"
[7]: https://github.com/openresty/lua-nginx-module/pull/1546 "fix(set_more_tries): fix infinite retry when no available servers and..."
[8]: http://nginx.org/en/docs/stream/ngx_stream_proxy_module.html#proxy_next_upstream_tries "proxy_next_upstream_tries"
[9]: https://github.com/openresty/openresty/issues/531 "balancer.set_more_tries(count) not work in openresty 1.15.8.2"
