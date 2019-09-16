---
layout: default
title: "Kubernetes ingress-nginx 0.25 源代码走读笔记"
author: 李佶澳
createdate: "2019-07-16 14:27:19 +0800"
last_modified_at: "2019-09-16 15:21:16 +0800"
categories: 项目
tags: kubernetes
cover:
keywords: kubernetes,ingress-nginx
description: "OpenResty替换了原生的nginx，nginx.conf中不直接包含Pod的IP地址，用一段lua 脚本处理转发"
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

猛然发现还没有看过 ingress-nginx 的代码，调查问题的时候都是直接阅读最终生成的 nginx.conf 文件。

使用较新版本的[金丝雀发布][2]功能时，发现 openresty 替换了原生的 nginx， nginx.conf 文件也发生了变化，文件中不直接包含 Pod 的 IP 地址，用一段 lua 脚本处理转发，需要阅读代码理清配置生成、Pod IP 的下发过程。

拓展：[Kubernetes 基于 openresty 的 ingress-nginx 的实现分析和使用][3]。

## Go 部分

Nginx-ingress-controller 是用 Go 语言实现的，负责发现 Ingress 以及 Pod 的 IP 等，入口是：

![ingress-nginx入口]({{ site.imglocal }}/article/ingress-nginx-1.png)

核心操作在 `NGINXController` 中：

```go
ngx := controller.NewNGINXController(conf, mc, fs)
go handleSigterm(ngx, func(code int) {
    os.Exit(code)
})
```

![nginx controller]({{ site.imglocal }}/article/ingress-nginx-2.png)

创建 nginx controller 时，传入 syncQueue 的方法 `n.syncIngress` 负责生成并下发最新的配置：

```go
// internal/ingress/controller/controller.go: 113
func NewNGINXController(config *Configuration, mc metric.Collector, fs file.Filesystem) *NGINXController {
...
    n.syncQueue = task.NewTaskQueue(n.syncIngress)
...
```

阅读代码可知，配置变化分为可以动态加载和不可以动态加载的，只有配置变化不可以动态加载时，重新生成配置文件，并执行 reload 操作，代码中的`!n.IsDynamicConfigurationEnough(pcfg)`部分，pcfg 是最新的相关配置：

![ingress-nginx入口]({{ site.imglocal }}/article/ingress-nginx-3.png)

动态加载的配置在函数 configureDynamically(pcfg) 中下发，调用了 openresty 的 /configuration 地址：

```go
func configureDynamically(pcfg *ingress.Configuration) error {
...
    statusCode, _, err := nginx.NewPostStatusRequest("/configuration/backends", "application/json", backends)
...
    statusCode, _, err = nginx.NewPostStatusRequest("/configuration/general", "application/json", ingress.GeneralConfig{
...
```

在最终生成的 nginx.conf 可以找到 /configuration 接口的实现：

```conf
server {
    listen unix:/tmp/nginx-status-server.sock;
    set $proxy_upstream_name "internal";

    ...

    location /configuration {
        # this should be equals to configuration_data dict
        client_max_body_size                    10m;
        client_body_buffer_size                 10m;
        proxy_buffering                         off;

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

## Lua 部分

Lua 代码位于 rootfs/etc/ngxin/lua 目录中，在制作镜像的时候被一同打包到镜像中：

![ingress-nginx lua 代码]({{ site.imglocal }}/article/ingress-nginx-4.png)

Lua 部分就是标准的 openresty 应用，openresty 的应用开发见 [Web开发平台OpenResty](https://www.lijiaocn.com/tags/all.html#openresty)。

## 编译与镜像制作

编译： 

```sh
make build
```

编译后得到的文件位于：

```sh
$ tree bin
bin
└── amd64
    ├── dbg
    └── nginx-ingress-controller
```

制作镜像：

```sh
make container
```

制作镜像需要的文件位于 rootfs 中，制作镜像是准备一个临时目录，将 bin 目录中的文件和 rootfs 中的文件复制到临时目录中，并且替换 Dockerfile 中的 BASEIMAGE 等字符串，生成最终的 Dockerfile。

rootfs 目录中的所有文件都会被打包到容器中，所有如果要增减镜像中的文件，直接在 rootfs 目录中操作即可。

## 参考

1. [李佶澳的博客笔记][1]
2. [kubernetes ingress-nginx 的金丝雀（canary）/灰度发布功能的使用方法][2]
3. [Kubernetes 基于 openresty 的 ingress-nginx 的实现分析和使用][3]

[1]: https://www.lijiaocn.com "李佶澳的博客笔记"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/07/12/ingress-nginx-canary.html "kubernetes ingress-nginx 的金丝雀（canary）/灰度发布功能的使用方法"
[3]: https://www.lijiaocn.com/2019/09/16/ingress-nginx-with-openresty.html "Kubernetes 基于 openresty 的 ingress-nginx 的实现分析和使用"
