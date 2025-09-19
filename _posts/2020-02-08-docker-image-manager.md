---
layout: default
title: "docker 分析 ：本地镜像、本地容器的文件存储方式"
author: 李佶澳
date: "2020-02-08T10:18:12+0800"
last_modified_at: "2020-02-08T10:18:12+0800"
categories: 项目
cover:
tags: docker
keywords: docker,镜像,容器,容器文件,镜像目录
description: 用 Docker 下载到本地的镜像存放在哪里？怎样不通过 docker 直接查看、修改运行中的容器的文件？
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

用 Docker 下载到本地的镜像存放在哪里？怎样不通过 docker 直接查看、修改运行中的容器的文件？

## docker 的存储目录

这里的 docker 版本是 1.13.1（比较老的版本），Storage Driver 是 overlay2：

```sh
$ docker --version
Docker version 1.13.1, build 4ef4b30/1.13.1

$ docker info |grep Storage
Storage Driver: overlay2
```

docker 的文件存储目录默认是 `/var/lib/docker`

```sh
$ ls -F /var/lib/docker/
containers/  image/  network/  overlay2/  plugins/  swarm/  tmp/  trust/  volumes/
```

## 本地镜像文件

image/overlay2/repositories.json 是本地镜像的索引：

```sh
$ cat image/overlay2/repositories.json |jq
{
  "Repositories": {
    "docker.io/alpine": {
      "docker.io/alpine:latest": "sha256:e7d92cdc71feacf90708cb59182d0df1b911f8ae022d29e8e95d75ca6a99776a",
      "docker.io/alpine@sha256:ab00606a42621fb68f2ed6ad3c88be54397f981a7b70a79db3d1172b11c4367d": "sha256:e7d92cdc71feacf90708cb59182d0df1b911f8ae022d29e8e95d75ca6a99776a"
    }
  }
}
```

镜像名称之后的 `sha256:e7d92...` 就是镜像的 id：

```sh
$ docker images
REPOSITORY          TAG                 IMAGE ID            CREATED             SIZE
docker.io/alpine    latest              e7d92cdc71fe        3 weeks ago         5.59 MB
```

image/overlay2/imagedb/content/sha256/{镜像ID} 中记录每个镜像的详细信息：

```sh
$ cat  imagedb/content/sha256/e7d92c
  ...
  "os": "linux",
  "rootfs": {
    "type": "layers",
    "diff_ids": [
      "sha256:5216338b40a7b96416b8b9858974bbe4acc3096ee60acbc4dfb1ee02aecceb10"
    ]
  }
  ...
```

镜像详情中的 diff_ids 索引的是目录 image/overlay2/layerdb/sha256/{ID} ：

```sh
$ ls image/overlay2/layerdb/sha256/5216338...
cache-id  diff  size  tar-split.json.gz
```

文件 cache-id 中记录的 id 索引的时目录 /var/lib/docker/overlay2/{ID}：

```sh
$ ls -F overlay2/fa30ac31a3*
diff/  link
```

/var/lib/docker/overlay2/{ID}/diff 目录中就是这一层镜像的内容：

```sh
$ ls -F overlay2/fa30ac31a3(省略..)/diff/
bin/  dev/  etc/  home/  lib/  media/  mnt/  opt/  proc/  root/  run/  sbin/  srv/  sys/  tmp/  usr/  var/
```

目录关系总结如下：

![Docker镜像目录说明]({{ site.imglocal}}/article/dockerimage.png)

### 包含多层的镜像

用下面的 dockerfile 制作一个包含三层的镜像：

```Dockerfile
FROM docker.io/alpine
ADD / ./text
RUN mkdir /xxx
```

在 imagedb/content/sha256/{镜像ID} 中可以看到镜像有三个 diff_ids：

```json
  "os": "linux",
  "rootfs": {
    "type": "layers",
    "diff_ids": [
      "sha256:5216338b40a7b96416b8b9858974bbe4acc3096ee60acbc4dfb1ee02aecceb10",
      "sha256:7009188e8e51dd5ba4d8421a3e9a291f9792bd17669f107b93502aa1d6718f94",
      "sha256:4abb74580e5ceb21684e32c92674589b04dfa5453f4dde91a24d00926c2c2cba"
    ]
```


## 容器的文件目录

启动一个容器，ID 为 548574d0924a：

```sh
$ docker ps
CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS              PORTS               NAMES
548574d0924a        docker.io/alpine    "sleep 10000000"    22 minutes ago      Up 22 minutes                           tender_noether
```

/var/lib/docker/containers/{容器ID} 存放容器的配置文件：

```sh
$ ls /var/lib/docker/containers/548574d0924ae172f6bdccdebdbbaa5cd151c2d8ab2bf45720e4070e95db082a/
checkpoints  config.v2.json  hostconfig.json  hostname  hosts  resolv.conf  resolv.conf.hash  secrets  shm
```

`docker inspect` 显示的  GraphDriver 索引了容器使用的目录：

```sh
$ docker inspect 548574d0924a
...
  "GraphDriver": {
      "Name": "overlay2",
      "Data": {
          "LowerDir": "/var/lib/docker/overlay2/122e9bb920939ca5df8b38e6c3bff4d6832d7213ecc4dbfbed9b88751ba6921e-init/diff:/var/lib/docker/overlay2/fa30ac31a37f1a31b9e86854cd3de41ef2d5bb5b0a2f227d069dc495914ea0e4/diff",
          "MergedDir": "/var/lib/docker/overlay2/122e9bb920939ca5df8b38e6c3bff4d6832d7213ecc4dbfbed9b88751ba6921e/merged",
          "UpperDir": "/var/lib/docker/overlay2/122e9bb920939ca5df8b38e6c3bff4d6832d7213ecc4dbfbed9b88751ba6921e/diff",
          "WorkDir": "/var/lib/docker/overlay2/122e9bb920939ca5df8b38e6c3bff4d6832d7213ecc4dbfbed9b88751ba6921e/work"
      }
  },
...
```

其中 LowerDir 是容器使用镜像的各层文件，带有 `-init` 后缀的目录是第一层容器自身的目录。diff 记录容器产生的改动，merged 时所有层叠加后的结果。

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://zhuanlan.zhihu.com/p/26797540 "深入分析 Docker 镜像原理"
