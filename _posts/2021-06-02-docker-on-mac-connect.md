---
layout: default
title: "在 Mac 上直接访问 Docker 容器的地址: 通过虚拟机内 vpn 接入"
author: 李佶澳
date: "2021-06-02 22:10:47 +0800"
last_modified_at: "2021-06-02 22:10:47 +0800"
categories: 技巧
cover:
tags: mac docker
keywords:
description: 一种通过 vpn 访问mac上docker容器的方法，启动使用 host 网络的 openvpn ，通过 vpn 接入
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

Docker for mac 启动的容器运行在一个 Mac 上的一个虚拟机中，无法从 Mac 上直接访问虚拟机内容器。通常可以通过端口映射的方式解决访问虚拟机内容器的问题，但有时候端口映射不能完全满足需要。

## 准备一个 docker 网段

```sh
docker network rm  docker_network
docker network create \
 --attachable \
 --driver=bridge \
 --subnet=192.168.88.0/24 \
 docker_network
```

## 启动 openvpn 服务

改良一下 [docker-mac-network][2]，用 docker-compose 启动，使用前面创建的 docker_network 网络：

```yaml
version: '3.8'
services:
  proxy:
    build: .
    ports:
      - "127.0.0.1:13194:13194"
        #- "127.0.0.1:13194:13194/udp"
        # UDP did not work, probably because the source port changes all the time
        #command: -v UDP4-RECVFROM:13194,fork UDP4-SENDTO:172.17.0.1:1194
        # 下面的目标IP需要是虚拟机的 eth0  地址
    command: TCP-LISTEN:13194,fork TCP:192.168.88.1:1194
    restart: always
    networks:
      - docker_net
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
    networks:
      - docker_net

# 引用外部网络
networks:
  docker_net:
    external: true
    name: docker_network
```

执行 `docker-compose up -d` ，本地生成 docker-for-mac.ovpn 文件和 config/ 目录。前者是 openvpn 客户端配置文件，后者是 openvpn 服务端配置文件。

## Mac 连接虚拟机内的 vpn 服务

检查前面生成的 docker-for-mac.ovpn，没有下面的路由设置，手动添加：

```sh
route 192.168.88.0 255.255.255.0   # 通过 vpn 代理的网段
```

安装 openvpn 客户端 tunnelblick：

```sh
brew install tunnelblick
```

配置 openvpn 客户端，直接打开 .ovpn 文件，按提示完成添加即可：

```sh
open docker-for-mac.ovpn
```

客户端完成 openvpn 连接，ping 容器网络的网关地址：

```sh
$ ping 192.168.88.1
PING 192.168.88.1 (192.168.88.1): 56 data bytes
64 bytes from 192.168.88.1: icmp_seq=0 ttl=64 time=4.253 ms
64 bytes from 192.168.88.1: icmp_seq=1 ttl=64 time=5.869 ms
64 bytes from 192.168.88.1: icmp_seq=2 ttl=64 time=5.509 ms
```

如果无法 ping 通需要查出原因，参考「遇到的问题」章节。

## 容器接入

如果用 docker 或者 docker-compse 直接启动容器，新启动的容器可能接入到其它网络，必须强制接入到 openvpn 所在的容器网络才能访问。

### 容器接入：docker 命令行的接入方法

启动任意一个容器作为待访问的容器，注意要接入容器网络 `--network docker_network`：

```sh
➜ $ docker run --rm -it --network docker_network  alpine:latest bin/sh
/ # ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
    inet 127.0.0.1/8 scope host lo
       valid_lft forever preferred_lft forever
2: tunl0@NONE: <NOARP> mtu 1480 qdisc noop state DOWN qlen 1000
    link/ipip 0.0.0.0 brd 0.0.0.0
3: ip6tnl0@NONE: <NOARP> mtu 1452 qdisc noop state DOWN qlen 1000
    link/tunnel6 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00 brd 00:00:00:00:00:00:00:00:00:00:00:00:00:00:00:00
42: eth0@if43: <BROADCAST,MULTICAST,UP,LOWER_UP,M-DOWN> mtu 1500 qdisc noqueue state UP
    link/ether 02:42:c0:a8:58:03 brd ff:ff:ff:ff:ff:ff
    inet 192.168.88.3/24 brd 192.168.88.255 scope global eth0
       valid_lft forever preferred_lft forever
```

在 Mac 上直接 ping 容器地址 192.168.88.3：
```sh
$ ping 192.168.88.3
PING 192.168.88.3 (192.168.88.3): 56 data bytes
64 bytes from 192.168.88.3: icmp_seq=0 ttl=63 time=2.662 ms
64 bytes from 192.168.88.3: icmp_seq=1 ttl=63 time=2.092 ms
```

### 容器接入：docker-compse 的接入方法

在 docker-compose.yml 的 networks 中填入引用的外部容器网络：

```yaml
version: "3.8"
services:
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    networks:
      - docker_net

networks:
  docker_net:
    external: true
    name: docker_network
```

## 遇到的问题

无法 ping 通，查看 openvpn 日志：

```sh
$ docker ps |grep kylemanna/openvpn
58cbf7c50afc        kylemanna/openvpn          "/local/helpers/run.…"    # openvpn 容器

$ docker logs -f  58cbf7c50afc     # 使用 openpvn 容器的 id
...省略...
```

错误日志如下：

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

受到 [解决Bad compression stub decompression header byte: 102][3] 的启发，在服务端和客户端都设置了压缩。

服务端配置文件 config/openvpn.conf 中配置：

```sh
comp-lzo yes
```

客户端配置文件 docker-for-mac.ovpn 中配置：

```sh
comp-lzo
```

重启后问题解决：

```sh
docker-compose down && docker-compse up -d
open  docker-for-mac.ovpn
```

## 参考

1. [李佶澳的博客][1]
2. [docker-mac-network][2]
3. [解决Bad compression stub decompression header byte: 102][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://github.com/wojas/docker-mac-network "docker-mac-network"
[3]: http://www.ttlsa.com/linux/bad-compression-stub-decompression-header-byte-102/ "解决Bad compression stub decompression header byte: 102"
