---
layout: default
title: "开源ServiceMesh项目istio源代码粗略阅读"
author: 李佶澳
createdate: "2019-05-31 18:36:09 +0800"
changedate: "2019-06-04 11:38:57 +0800"
categories: 项目
tags: istio
cover:
keywords: istio,servicemesh,服务网格,网关,envoy
description: 简单了解一下istio的项目源码，不做深入解读，有需要的时候再详细了解
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

galley：istio 配置的验证、处理、下发，是 istio 的对外接口。

mixer: 进行访问控制管理、验证请求信息、收集 envoy 状态数据，分为 mixc 和 mixs 两个命令。

pilot: 将控制规则转换成 envoy 配置，是 envoy 对接的 xds。

citadel：管理服务与服务之间、终端用户与服务之间的认证。

istioctl: istio 的管理命令行

![istio的架构]({{ site.imglocal }}/article/istio-arch.svg)


## 代码编译

istio给出一份开发环境设置文档[Preparing for Development][1]，但是太不详细了，没什么用处。

最新的istio（2019-05-31 18:50:34）使用 [go module](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2019/05/05/go-modules.html) 管理依赖代码，直接用 make 开始目标组件的构建即可：

```sh
make galley
make mixs
make mixc
make citadel
make pilot
make istioctl
```

编译后的文件位于 $ISTIO_OUT 目录中：

```
export ISTIO_OUT:=$(GO_TOP)/out/$(GOOS)_$(GOARCH)/$(BUILDTYPE_DIR)
```

```
$ ls $GOPATH/out/darwin_amd64/release
galley        istio_ca        istioctl        mixc       mixs    pilot-discovery
```

## 目录结构

代码目录比较清晰，每个组件一个目录，都是 `cmd` 目录 + `pkg` 目录的方式，[按部就班](https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2019/05/31/go-code-read-method.html)的读就是了。

## 参考

1. [istio: Preparing for Development][1]

[1]: https://github.com/istio/istio/wiki/Preparing-for-Development "istio: Preparing for Development"
