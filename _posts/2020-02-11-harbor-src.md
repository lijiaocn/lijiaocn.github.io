---
layout: default
title: "docker 镜像管理（四）: harbor 项目学习"
author: 李佶澳
date: "2020-02-11T18:10:55+0800"
last_modified_at: "2020-02-11T18:10:55+0800"
categories: 项目
cover:
tags: docker
keywords: docker,镜像,容器,容器文件,镜像目录
description: Harbor 源代码快速学习，简单了解，
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

[Architecture Overview of Harbor][2] 介绍了 harbor 每个组件的用途：

```sh
proxy: 反向代理，将请求代理到 harbor 的自服务
core:  harbor 的核心功能实现，操作页面上提供的绝大多数功能
       认证授权、配置管理、项目管理、配额管理、tag 管理、镜像扫描、webhook等
job:   任务队列
log:   日志收集
gc:    gc 管理
chart:     chart存放管理
registry:  docker镜像存放管理
notary:    内容鉴真
```

docker login 的过程：

1. proxy 收到请求，转发给 registry；
2. registry 配置了 token 认证，返回 401 告知 docker client 到 core 服务获取 token；
3. docker client 发送用户名密码到 core 获取 token；
4. core 解析用户密码完成认证。

## 编译构建

harbor 部署文件是一个 docker-compose.yml，各个组件被打包了镜像中，关键是找到 Docker 镜像的构建过程。

harbor v1.9.4 的编译构建过程：

```sh
$ docker pull golang:1.12.12
# NOTARYFLAG=true 和 CLAIRFLAG=true 可选
$ make install GOBUILDIMAGE=golang:1.12.12 COMPILETAG=compile_golangimage
```

查看 Makefile 可以知道镜像的构建文件位于 make/photon 目录中：

```sh
▾ make/
  ▸ kubernetes/
  ▸ migrations/
  ▾ photon/
    ▸ chartserver/
    ▸ clair/
    ▸ common/
    ▸ core/
    ▸ db/
    ▸ jobservice/
    ▸ log/
    ▸ nginx/
    ▸ notary/
    ▸ portal/
    ▸ prepare/
    ▸ redis/
    ▸ registry/
    ▸ registryctl/
      Makefile
    checkenv.sh*
    harbor.yml
    install.sh*
    prepare*
    pushimage.sh*
```

编译结束后，可以直接在 make 目录启动 harbor：

```sh
$ cd make
$ ./install.sh
```

## proxy 代理

部署 harbor 的时候，会生成一个 common 目录，这个目录中存放的是各个组件的配置文件：

```sh
▾ common/config/
  ▸ core/
  ▸ db/
  ▸ jobservice/
  ▸ log/
  ▾ nginx/
    ▸ conf.d/
      nginx.conf
  ▸ registry/
  ▸ registryctl/
```

nginx/conf.d/nginx.conf 就是 nginx 使用转发配置：

```conf
 location / {
   proxy_pass http://portal/;
   ...
 location /c/ {
   proxy_pass http://core/c/;
   ...
 location /api/ {
   proxy_pass http://core/api/;
   ...
 location /chartrepo/ {
   proxy_pass http://core/chartrepo/;
   ...
 location /v1/ {
   return 404;
   ...
 location /v2/ {
   proxy_pass http://core/v2/;
   ...
 location /service/ {
   proxy_pass http://core/service/;
   ...
 location /service/notifications {
   return 404;
```

## 参考

1. [李佶澳的博客][1]
2. [Architecture Overview of Harbor][2]
3. [harbor compile guide][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://github.com/goharbor/harbor/wiki/Architecture-Overview-of-Harbor "Architecture Overview of Harbor"
[3]: https://github.com/goharbor/harbor/blob/v1.9.4/docs/compile_guide.md "harbor compile guide"
