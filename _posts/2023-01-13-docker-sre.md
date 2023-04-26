---
layout: default
title: "docker 问题排查: nslookup: clock_gettime(MONOTONIC) failed"
author: 李佶澳
date: "2023-01-13 11:05:01 +0800"
last_modified_at: "2023-04-26 14:38:21 +0800"
categories: 问题
cover:
tags:  docker
keywords:
description: "nslookup: clock_gettime(MONOTONIC) failed:该问题会在 x86、armv7、armhf，以及在 64位机器上运行的 32位 Docker 中出现。根源在 musl 升级到了 1.2 版本，这个版本修改了 32位系统上的 time_t 定义。"
---

## 目录

* auto-gen TOC:
{:toc}

## 现象

docker engine 版本 18.09.9：

```sh
Server: Docker Engine - Community
 Engine:
  Version:          18.09.9
  API version:      1.39 (minimum version 1.12)
  Go version:       go1.11.13
  Git commit:       039a7df
  Built:            Wed Sep  4 17:13:08 2019
  OS/Arch:          linux/arm
  Experimental:     false
```

在 alpine:3.13 中执行 dns 解析，会出现下面状况；

```sh
$ docker run --rm alpine:3.13 nslookup www.baidu.com 
nslookup: clock_gettime(MONOTONIC) failed
```

在 alpine:3.12 中 dns 解析正常：

```sh
$ docker run --rm alpine:3.12 nslookup www.baidu.com
Server:         8.8.8.8
Address:        8.8.8.8:53

Non-authoritative answer:
www.baidu.com   canonical name = www.a.shifen.com
Name:   www.a.shifen.com
Address: 110.242.68.3
Name:   www.a.shifen.com
Address: 110.242.68.4

Non-authoritative answer:
www.baidu.com   canonical name = www.a.shifen.com
```

## 调查

Google 搜索 "nslookup: clock_gettime(MONOTONIC) failed:"，有人在向 alpine 报告过该问题：[alpine 3.13, armv7 network-access seems to be broken #135][2]。Alpine 对问题做出了说明：[Release_Notes_for_Alpine_3.13.0#time64_requirements][3]。

>musl 1.2 uses new time64-compatible system calls. Due to runc issue 2151, these system calls incorrectly returned EPERM instead of ENOSYS when invoked under a Docker or libseccomp version predating their release.

该问题会在 x86、armv7、armhf，以及在 64位机器上运行的 32位 Docker 中出现。根源在 musl 升级到了 1.2 版本，这个版本修改了 32位系统上的 time_t 定义。

### 解决方法一：升级到 Docker 19.03.9

Docker 19.03.9 版本以及后续版本解决了这个问题。

如果不能升级到新版本，用下面的方法解决。

### 解决方法二：修改 dockerd 的启动参数，或容器启动时命令行参数

下载文件 [moby/profiles/seccomp/default.json][5]，将第二行：

```text
"defaultAction": "SCMP_ACT_ERRNO",
```

修改为：

```text
"defaultAction": "SCMP_ACT_TRACE",
```

启动 dockerd 时带上下面的参数：

```sh
$ dockerd --seccomp-profile=default.json ....其它参数...
```

或者启动容器时，为 docker run、docker create 指定下面的参数：

```sh
--security-opt=seccomp=default.json
```

经验证可行。


## 参考

1. [李佶澳的博客][1]
2. [alpine 3.13, armv7 network-access seems to be broken #135][2]
3. [Release_Notes_for_Alpine_3.13.0#time64_requirements][3]
4. [Docker Engine release notes][4]
5. [moby/profiles/seccomp/default.json][5]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://github.com/alpinelinux/docker-alpine/issues/135 "alpine 3.13, armv7 network-access seems to be broken #135"
[3]: https://wiki.alpinelinux.org/wiki/Release_Notes_for_Alpine_3.13.0#time64_requirements "Release_Notes_for_Alpine_3.13.0#time64_requirements"
[4]: https://docs.docker.com/engine/release-notes/ "Docker Engine release notes"
[5]: https://github.com/moby/moby/blob/master/profiles/seccomp/default.json "moby/profiles/seccomp/default.json" 
