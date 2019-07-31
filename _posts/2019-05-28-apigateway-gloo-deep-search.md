---
layout: default
title: "开源的api网关gloo的源代码粗略阅读"
author: 李佶澳
createdate: "2019-05-28 11:28:33 +0800"
last_modified_at: "2019-06-01 17:16:38 +0800"
categories: 项目
tags: apigateway
cover:
keywords: gloo,apigateway,网关,服务网格,service mesh
description: "gloo 的核心组件有四个：glooctl、gloo、discovery、gateway。glooctl 是命令行，gloo 是主体"
---

* auto-gen TOC:
{:toc}

## 说明

进一步学习 gloo。

![gloo网关]({{ site.imglocal }}/article/gloo_diagram.png)

## 编译

[BUILD.md][1]中介绍了编译方法：

```sh
go get github.com/solo-io/gloo
cd $GOPATH/src/github.com/solo-io/gloo
dep ensure -v
```

编译各个组件：

```sh
make gloo
make glooctl
make discovery
make gateway
make envoyinit
```

生成 gloo api 代码：

```sh
go get github.com/paulvollmer/2gobytes
go get github.com/lyft/protoc-gen-validate
go get github.com/gogo/protobuf/protoc-gen-gogo
go get golang.org/x/tools/cmd/goimports
make generated-code
```

## gloo 组件

[上一篇][2]部署的 gloo 系统有四个容器，其中的 gateway-proxy 是作了简单封装的 envoy：

```sh
$ kubectl -n gloo-system get pod -o wide
NAME                             READY   STATUS    RESTARTS   AGE   IP               NODE            NOMINATED NODE
discovery-898bd9cd48-fz79s       1/1     Running   2          14d   172.18.129.88    10.10.84.58     <none>
gateway-7f5fdb5858-2cmvf         1/1     Running   2          14d   172.18.128.137   10.10.173.203   <none>
gateway-proxy-5bf8b9cf59-xb7f9   1/1     Running   0          14d   172.18.128.138   10.10.173.203   <none>
gloo-7d75b48cc5-vwh5r            1/1     Running   2          14d   172.18.129.87    10.10.84.58     <none>
```

gloo 的核心组件有四个：glooctl、gloo、discovery、gateway。

1. **glooctl** 是命令行；
2. **gloo** 是整个系统的核心，是 envoy 对接的 xds，监听所有相关资源，生成 envoy 配置；
3. **discovery** 同步 upstream 和发现的 sdk；
4. **gateway** 维护 gloo 定义的 proxy，维护路由信息（绑定的端口、路由插件等）

还有一个名为**ingress** 的程序，在 ingress  或者 knative 模式的部署时用到，监听 kubernetes 集群的 ingress 和 service，用于 ingress  或者 knative 模式的部署。

## gloo 程序入口

每个组件的入口代码是 projects/[NAME]/cmd/main.go：

```sh
projects/gloo/cli/cmd/main.go
projects/gloo/cmd/main.go
projects/discovery/cmd/main.go
projects/gateway/cmd/main.go
projects/ingress/cmd/main.go
```

代码比较好懂，按照[源代码阅读方法][3]走读就可以了。

提别提一下 discovery，它调用的两个函数分别是 uds.Main() 和 fdssetup.Main()，uds 可能是 upstream discovery sync 的意思，fds 可能是 file discovery sync，fds 支持 swagger、aws、grpc。

## 参考

1. [gloo BUILD.md][1]
2. [基于Envoy的ApiGateway/Ingress Controller项目梳理（三）：Gloo][2]
3. [源代码阅读方法，Go语言项目的代码阅读技巧][3]

[1]: https://github.com/solo-io/gloo/blob/master/BUILD.md "gloo BUILD.md"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/05/21/apigateway-base-envoy-compare-gloo.html "基于Envoy的ApiGateway/Ingress Controller项目梳理（三）：Gloo"
[3]: https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2019/05/31/go-code-read-method.html "源代码阅读方法，Go语言项目的代码阅读技巧"
