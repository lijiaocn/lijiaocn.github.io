---
createtime: "2024-04-30 11:19:10 +0800"
last_modified_at: "2024-04-30 15:24:47 +0800"
categories: "方法"
title: 使用 docker-compose 构造本地运行环境
tags: 软件工程
keywords: docker-compse
description: 用 docker-compose 在本地快速搭建一个微小但是完整的运行环境，高度仿真正式的运行环境。
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

docker-compose 能够本地快速搭建一个微小但是完整的运行环境，高度仿真正式的运行环境。

## 准备

确定本地已经安装有 docker 和 docker-compose。

```bash
$ docker-compose --version
Docker Compose version v2.24.5-desktop.1
```

## 打包成 docker 镜像

把目标服务打包成 docker 镜像，是使用 docker-compose 的前提。编译过程和打包过程可以用一个 Dockerfile 描述。下面是 go 语言开发服务的编译和打包过程。

* 在 golang:1.20.13-alpine3.18 中编译本地代码
* 将本地目录中的所有代码文件拷贝到容器的 go/src/web 目录中，web 是自定义的目录。
* 编译时在容器的 /go/pkg 目录挂载一个 cache volume，避免每次都要重新拉取依赖代码
* 打包镜像时用 --from 从 builder 中复制编译产物 

```bash
FROM golang:1.20.13-alpine3.18 as builder
COPY . /go/src/web
WORKDIR /go/src/web
RUN --mount=target=/go/pkg,type=cache  go build -o _output/server cmd/server/main.go

FROM alpine:3.18.6
RUN mkdir -p /app && chown -R nobody:nogroup /app && apk add mariadb-connector-c
COPY --from=builder /go/src/web/_output/server /app
USER nobody
WORKDIR /app

ENTRYPOINT ["/app/server"]
```

## docker-compose 

docker-compose 是一个本地命令，它按照 compose file 中的内容在本地启动 docker 容器。
最简单的 compose file 如下，启动一个 reids。compose file 的语法格式和支持的命令见：[compose file reference][2]。

```yaml
services:
  redis:
    image: redis:7.2.4
    ports:
      - "6379:6379"
```

运行 docker-compose 命令，如果没有用 -f 指定 compose 文件，它会自动使用所在目录中的 docker-compose.yml 文件：

```bash
docker-compose up     # 启动，在前台运行
docker-compose up -d  # 启动，在后台运行
docker-compose down   # 停止
```

## compose file 

compose file 中可用的指令基本是和 docker 的能力对应的，下面列举下经常用到的配置方式。

## 配置多个服务并设置依赖

下面的配置中有 mysql 和 web-server 两个服务:

* web-server 依赖 mysql，mysql 服务状态是 health 时，web-server 服务开始启动
* mysql 服务通过 volumes 将本地目录挂到容器内，避免删除容器时将数据一同删除
* web-server 中可以直接通过服务名 mysql 访问服务

```yaml
services:
  mysql:
    image: mysql:8.0
    cap_add:
      - SYS_NICE
    environment:
      - TZ=CST-8
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=web
      - MYSQL_USER=web
      - MYSQL_PASSWORD=web
    ports:
      - '13306:3306'
    volumes:
      - ./_local/conf/mysql/my.cnf:/etc/my.cnf
      - ./_local/conf/mysql/conf.d:/etc/mysql/conf.d
      - ./_local/data/mysql:/var/lib/mysql
      - ./_local/log/mysql:/var/log/mysql
      - ./store/sql:/docker-entrypoint-initdb.d
    healthcheck:
      test: [ "CMD", "mysqladmin" ,"ping", "-h", "localhost" ]
      start_period: 4s
      interval: 2s
      retries: 10
    restart: always
  web-server:
    depends_on:
      mysql:
        condition: service_healthy
        restart: true
    image: "web-server:dev"
    command: -stderrthreshold=INFO
    ports:
      - "16060:6060"
    environment:
      - WEB_LISTEN_ADDR=0.0.0.0:6060
      - WEB_DSN=web:web@(mysql:3306)/web
    restart: always
```

## 参考

1. [李佶澳的博客][1]
2. [compose file reference][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://docs.docker.com/compose/compose-file/ "compose file reference"
