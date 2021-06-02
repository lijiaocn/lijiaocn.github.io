---
layout: default
title: "在 Mac 上直接访问 Docker 容器的地址：vpn 方式"
author: 李佶澳
date: "2021-06-02 22:10:47 +0800"
last_modified_at: "2021-06-02 22:10:47 +0800"
categories: 技巧
cover:
tags: mac docker
keywords:
description: 一种通过 vpn 访问虚拟机内容器的方法
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

Docker for mac 启动的容器运行在一个 Mac 上的一个虚拟机中，无法从 Mac 上直接访问虚拟机内容器。通常可以通过端口映射的方式解决访问虚拟机内容器的问题，但有时候端口映射不能完全满足需要。

## 通过 vpn 访问虚拟机内容器

[docker-mac-network][2] 提供了一种通过 vpn 访问虚拟机内容器的方法。在虚拟机上启动了使用 host 网络的 openvpn 服务，在 mac 上通过 vpn 接入虚拟内部。

启动任意一个容器作为待访问的容器：

```sh
➜ $ docker run --rm -it  alpine:latest bin/sh
/ # ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: tunl0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN qlen 1000
    link/ipip 0.0.0.0 brd 0.0.0.0
3: ip6tnl0@NONE: <NOARP> mtu 1452 qdisc noop state DOWN qlen 1000
    link/tunnel6 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00 brd 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
98: eth0@if99: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:ac:11:00:02 brd ff:ff:ff:ff:ff:ff
    inet 172.17.0.2/16 brd 172.17.255.255 scope global eth0
       valid_lft forever preferred_lft forever
```

待访问容器地址为 172.17.0.2/16。

下载 openvpn 的 docker-compse 文件：

```sh
git clone https://github.com/wojas/docker-mac-network.git
cd docker-mac-network
```

docker-compose.yml 文件内容如下，根据实际情况调整：

```yaml
version: '2'
services:
    # mac 本地代理，本地的 openvpn 客户端链接本地端口 13194，被转发到虚拟机的 1194 端口
    proxy:
        build: .
        ports:
            - "127.0.0.1:13194:13194"
            #- "127.0.0.1:13194:13194/udp"
        # UDP did not work, probably because the source port changes all the time
        #command: -v UDP4-RECVFROM:13194,fork UDP4-SENDTO:172.17.0.1:1194
        # 下面的目标IP需要是虚拟机的 eth0  地址
        command: TCP-LISTEN:13194,fork TCP:192.168.65.3:1194
        restart: always
    openvpn:
        image: kylemanna/openvpn
        volumes:
            - .:/local
            - ./config:/etc/openvpn
        network_mode: host
        cap_add:
            - NET_ADMIN
        environment:
            dest: docker-for-mac.ovpn
            DEBUG: '1'
        command: /local/helpers/run.sh
        restart: always
    redis:
      image: redis:alpine
```

执行 `docker-compose up -d` 启动，这时候会发现生成了 docker-for-mac.ovpn 文件和 config/目录中的文件，前者是 openvpn 客户端配置文件，后者是 openvpn 服务端配置文件。

安装 openvpn 客户端 tunnelblick：

```sh
brew install tunnelblick
```

执行下面的命令，按提示加载并接入 openvpn：

```sh
open docker-for-mac.ovpn
```

在 mac 上直接访问容器地址 172.17.0.2：

```sh
ping 172.17.0.2
```

如果能 ping 通 172.17.0.2 就成功了。如果不能 ping 通，查看 openvpn 容器的日志：

```sh
$ docker ps |grep kylemanna/openvpn
58cbf7c50afc        kylemanna/openvpn          "/local/helpers/run.…"    # openvpn 容器

$ docker logs -f  58cbf7c50afc     # 使用 openpvn 容器的 id
....

```

我遇到的问题是：

```sh
Wed Jun  2 15:07:12 2021 host/192.168.96.2:39020 Outgoing Data Channel: Cipher 'AES-256-GCM' initialized with 256 bit key
Wed Jun  2 15:07:12 2021 host/192.168.96.2:39020 Incoming Data Channel: Cipher 'AES-256-GCM' initialized with 256 bit key
Wed Jun  2 15:07:24 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:07:34 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:07:44 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:07:54 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:08:05 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:08:15 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:08:25 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:08:35 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:08:45 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:08:55 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42
Wed Jun  2 15:09:05 2021 host/192.168.96.2:39020 Bad compression stub decompression header byte: 42

```

受到 [解决Bad compression stub decompression header byte: 102][3] 的启发，在服务端和客户端都设置了压缩：

```sh
服务端配置文件 config/openvpn.conf 中配置：

comp-lzo yes

客户端配置文件  docker-for-mac.ovpn 中配置：

comp-lzo
```

然后重启：

```sh
docker-compose down && docker-compse up -d
open  docker-for-mac.ovpn。
```

## 参考

1. [李佶澳的博客][1]
2. [docker-mac-network][2]
3. [解决Bad compression stub decompression header byte: 102][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://github.com/wojas/docker-mac-network "docker-mac-network"
[3]: http://www.ttlsa.com/linux/bad-compression-stub-decompression-header-byte-102/ "解决Bad compression stub decompression header byte: 102"
