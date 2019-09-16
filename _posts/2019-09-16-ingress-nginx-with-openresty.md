---
layout: default
title: "Kubernetes 基于 openresty 的 ingress-nginx 的状态和配置查询"
author: 李佶澳
date: "2019-09-16 11:54:29 +0800"
last_modified_at: "2019-09-16 17:22:31 +0800"
categories: 项目
cover:
tags: kubernetes
keywords: kubernetes,ingress-nginx,openresty
description: ingress-nginx 的管理接口使用的是 unix socket，可以查询状态、查询配置、下发配置
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

之前很粗略地扫过代码《 [Kubernetes ingress-nginx 0.25 源代码走读笔记][2] 》，这里再补充一些一些细节。

## 管理接口

管理接口使用的是 unix socket，可以查询状态、查询配置、下发配置。

状态查询：

```sh
$ curl --unix-socket /tmp/nginx-status-server.sock http://localhost/nginx_status
Active connections: 72
server accepts handled requests
 189907 189907 1662365
Reading: 0 Writing: 9 Waiting: 63
```

查询常规配置：

```sh
$ curl --unix-socket /tmp/nginx-status-server.sock http://localhost/configuration/general
```

查询所有 backends：

```sh
$ curl --unix-socket /tmp/nginx-status-server.sock http://localhost/configuration/backends
```

backend 记录格式如下：

```json
{
    "endpoints": [
        {
            "address": "10.12.4.133",
            "port": "8080"
        }
    ],
    "name": "test-paastest-v2-webshell-80",
    "noServer": false,
    "port": 80,
    "secureCACert": {
        "caFilename": "",
        "pemSha": "",
        "secret": ""
    },
    "service": {
        "metadata": {
            "creationTimestamp": null
        },
        "spec": {
            "clusterIP": "10.11.60.178",
            "ports": [
                {
                    "name": "http",
                    "port": 80,
                    "protocol": "TCP",
                    "targetPort": 8080
                }
            ],
            "selector": {
                "servicename": "v2-webshell"
            },
            "sessionAffinity": "None",
            "type": "ClusterIP"
        },
        "status": {
            "loadBalancer": {}
        }
    },
    "sessionAffinityConfig": {
        "cookieSessionAffinity": {
            "name": ""
        },
        "name": ""
    },
    "sslPassthrough": false,
    "trafficShapingPolicy": {
        "cookie": "",
        "header": "",
        "headerValue": "",
        "weight": 0
    },
    "upstreamHashByConfig": {
        "upstream-hash-by-subset-size": 3
    }
}
```

在 nginx 中的对应配置：

```conf
# default server, used for NGINX healthcheck and access to nginx stats
server {
    listen unix:/tmp/nginx-status-server.sock;
    set $proxy_upstream_name "internal";

    keepalive_timeout 0;
    gzip off;

    access_log off;

    location /healthz {
        return 200;
    }

    location /is-dynamic-lb-initialized {
        content_by_lua_block {
            local configuration = require("configuration")
            local backend_data = configuration.get_backends_data()
            if not backend_data then
            ngx.exit(ngx.HTTP_INTERNAL_SERVER_ERROR)
            return
            end

            ngx.say("OK")
            ngx.exit(ngx.HTTP_OK)
        }
    }

    location /nginx_status {
        stub_status on;
    }

    location /configuration {
        # this should be equals to configuration_data dict
        client_max_body_size            10m;
        client_body_buffer_size         10m;
        proxy_buffering             off;

        content_by_lua_block {
            configuration.call()
        }
    }

    location / {
        content_by_lua_block {
            ngx.exit(ngx.HTTP_NOT_FOUND)
        }
    }
}
```

## 管理接口实现

管理接口使用 openresty 中的 lua 脚本实现，用 go 语言实现的 ingress-nginx-controller 监听 kubernetes 中的变化，通过管理接口下发配置。

实现 configuration 接口的 lua 文件：[rootfs/etc/nginx/lua/configuration.lua][3]。

```lua
...
local configuration_data = ngx.shared.configuration_data
...
function _M.get_backends_data()
  return configuration_data:get("backends")
end

function _M.get_general_data()
  return configuration_data:get("general")
end
...
function _M.call()
  ...
  if ngx.var.request_method == "GET" then
    ngx.status = ngx.HTTP_OK
    ngx.print(_M.get_backends_data())
    return
  end
  ...
  local backends = fetch_request_body()
  if not backends then
    ngx.log(ngx.ERR, "dynamic-configuration: unable to read valid request body")
    ngx.status = ngx.HTTP_BAD_REQUEST
    return
  end

  local success, err = configuration_data:set("backends", backends)
```

## 参考

1. [李佶澳的博客][1]
2. [Kubernetes ingress-nginx 0.25 源代码走读笔记][2]
3. [rootfs/etc/nginx/lua/configuration.lua][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/07/16/kubernetes-ingress-nginx-code.html "Kubernetes ingress-nginx 0.25 源代码走读笔记" 
[3]: https://github.com/kubernetes/ingress-nginx/blob/master/rootfs/etc/nginx/lua/configuration.lua  "rootfs/etc/nginx/lua/configuration.lua"
