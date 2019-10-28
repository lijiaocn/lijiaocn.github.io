---
layout: default
title: "kubernetes ingress-nginx 的测试代码（单元测试+e2e测试）"
author: 李佶澳
date: "2019-10-28 15:58:24 +0800"
last_modified_at: "2019-10-28 16:13:14 +0800"
categories: 项目
cover:
tags: kubernetes
keywords: kubernetes,ingress-nginx,测试代码
description: ingress-nginx 的代码分为 go 和 lua 两部分，单元测试再加上 e2e 测试，一共有三套测试代码
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

这是 [ingress-nginx 的使用方法][2] 手册的配套笔记。

如果要修改代码并贡献到社区，ingress-nginx 测试代码的组织方式是必须了解的。ingress-nginx 的代码分为 go 和 lua 两部分，单元测试再加上 e2e 测试，一共有三套测试代码。

## 测试方法

在 Makefile 中可以看到测试方法：

```make
.PHONY: test
test:
	@build/test.sh

.PHONY: lua-test
lua-test:
	@build/test-lua.sh

.PHONY: e2e-test
e2e-test:
	@build/run-e2e-suite.sh
```

`make test` 调用 go test 执行单元测试代码，在 build/test.sh 中可以看到：

```sh
go test -v -race -tags "cgo" ...（省略）...
```

`make lua-test` 执行 lua 的单元测试代码，测试代码也是 lua 编写的，在 build/test-lua.sh 中可以看到：

```sh
resty \
  -I ./rootfs/etc/nginx/lua \
  --shdict "configuration_data 5M" \
  --shdict "certificate_data 16M" \
  --shdict "balancer_ewma 1M" \
  --shdict "balancer_ewma_last_touched_at 1M" \
  ./rootfs/etc/nginx/lua/test/run.lua ${BUSTED_ARGS} ./rootfs/etc/nginx/lua/test/
```

`make e2e-test` 执行 e2e 测试代码，使用的测试框架是 GinkGo，GinkGo 的用法见 [Go 语言测试框架 GinkGo 的使用方法][3]。

## go 和 lua 单元测试

Go 代码的单元测试就是和被测文件位于同一目录中的 `*_test.go` 文件，例如：

```sh
$ ls internal/net/ipnet*
internal/net/ipnet.go      internal/net/ipnet_test.go
```

Lua 代码的测试文件位于 rootfs/etc/nginx/lua/test/：

```sh
$ ls -F rootfs/etc/nginx/lua/test/
balancer/               fixtures/               run.lua
balancer_test.lua       helpers.lua             util/
certificate_test.lua    lua_ingress_test.lua    util_test.lua
configuration_test.lua  monitor_test.lua
```

## e2e 测试代码

GinkGo 支持将 e2e 测试代码编译成能够独立运行的二进制文件，ingress-nginx 的 ginkgo 测试代码位于 test/e2e 目录中，使用过程如下：

* `make e2e-test-binary` 将 e2e 测试代码编译成可执行文件
* `make e2e-test-image` 将可执行文件打包成 docker 镜像
* `make e2e-test` 在 kubernetes 集群中启动使用该镜像的容器，开始 e2e 测试

e2e 镜像的测试过程就是调用 kubernetes 的接口，创建 service 以及 ingress 等，然后检查结果。

直接阅读代码即可，代码很好懂：

```sh
$ ls -F
annotations/       e2e.test*          leaks/             settings/
dbg/               e2e_test.go        loadbalance/       ssl/
defaultbackend/    framework/         lua/               status/
down.sh*           gracefulshutdown/  run.sh*            tcpudp/
e2e.go             kind.yaml          servicebackend/    wait-for-nginx.sh*
```


## 参考

1. [李佶澳的博客][1]
2. [ingress-nginx 的使用方法][2]
3. [Go 语言测试框架 GinkGo 的使用方法][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/ "ingress-nginx 的使用方法"
[3]: https://www.lijiaocn.com/prog/testframe/ginkgo.html  "Go 语言测试框架 GinkGo 的使用方法"
