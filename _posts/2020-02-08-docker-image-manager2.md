---
layout: default
title:  "Docker 镜像管理（二）: 镜像文件格式与镜像仓库"
author: 李佶澳
date: "2020-02-08T17:35:36+0800"
last_modified_at: "2020-02-08T17:35:36+0800"
categories: 项目
cover:
tags: docker
keywords: docker,镜像,容器,容器文件,镜像目录
description: 把 docker 镜像导出后解压，查看它的组成，镜像仓库存储 docker 镜像，其它的镜像仓库项目
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

把 docker 镜像导出后解压，查看它的组成，了解镜像仓库如何存储 docker 镜像的，以及 harbor 之外还有没有其它的镜像仓库项目。

## 镜像文件组成

用 docker save 命令导出一个镜像文件：

```sh
$ docker save test:latest >test.tar
```

解压后文件目录如下：

```sh
60471b02f604b96598689e20d281433d2d078d76c29c83905c1a2f120e6770c8       manifest.json
77dabbad4eee8763fcde9972fbc0e7fdddfc8690905bfbc0eb0cd6a01226c3b1       repositories
da178ea381f45f60ce886b7eb9202014adab41d6186e673490de2443b453f88f.json  
e93db929cd8010b6f8aeb813e0799e2332ff933888656ea617d15b3f7f961f6e
```

repositories 是镜像的 label 对应的 layer id：

```sh
$ cat repositories |jq
{
  "test": {
    "latest": "e93db929cd8010b6f8aeb813e0799e2332ff933888656ea617d15b3f7f961f6e"
  }
}
```

manifest.json 记录构成该镜像的层

```sh
$ cat manifest.json |jq
[
  {
    "Config": "da178ea381f45f60ce886b7eb9202014adab41d6186e673490de2443b453f88f.json",
    "RepoTags": [
      "test:latest"
    ],
    "Layers": [
      "77dabbad4eee8763fcde9972fbc0e7fdddfc8690905bfbc0eb0cd6a01226c3b1/layer.tar",
      "60471b02f604b96598689e20d281433d2d078d76c29c83905c1a2f120e6770c8/layer.tar",
      "e93db929cd8010b6f8aeb813e0799e2332ff933888656ea617d15b3f7f961f6e/layer.tar"
    ]
  }
]
```

da178...json 是镜像的配置文件，另外三个目录 77..、60..、e93.. 是每一层的内容：

```sh
$ tree *
60471b02f604b96598689e20d281433d2d078d76c29c83905c1a2f120e6770c8
|-- json
|-- layer.tar
`-- VERSION
77dabbad4eee8763fcde9972fbc0e7fdddfc8690905bfbc0eb0cd6a01226c3b1
|-- json
|-- layer.tar
`-- VERSION
```

每一层的 layer.tar 文件可以用 tar 解压。

通过分析 docker 镜像的组成，我们基本可以判定，镜像仓库的用途就是记录层与层间的关系，同时存放每一层的内容。

## 镜像仓库项目

### Vmware 开源的 Harbor

[Harbor][3] 是 Vmware 开源的镜像管理项目。

```sh
wget  --no-check-certificate    https://github.com/goharbor/harbor/releases/download/v1.10.0/harbor-online-installer-v1.10.0.tgz
```

解压后是一个 docker-compose 文件和几个辅助脚本：

```sh
$ tree harbor
harbor
├── LICENSE
├── common.sh
├── harbor.yml
├── install.sh
└── prepare
```

在 harbor.yml 进行配置，用 install.sh 启动：

```sh
./install.sh
```

install.sh 脚本在执行的时候会调用 prepare 释放 docker-compose.yml 等文件：

```sh
$ ls
LICENSE            common.sh          docker-compose.yml install.sh
common             data               harbor.yml         prepare
```

harbor 由以下几个服务组成：

```sh
log
registry
registryctl
postgresql
core
portal
jobservice
redis
proxy
```

### RedHat 开源的 Quay

[Quay][2] 是 RedHat 在2019年12月开源的镜像管理项目，现在还没有正式的 release 版本（2020-02-08 19:39:44）。

## 参考

1. [李佶澳的博客][1]
2. [quay][2]
3. [harbor][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://github.com/quay/quay "quay"
[3]: https://github.com/goharbor/harbor "harbor"
