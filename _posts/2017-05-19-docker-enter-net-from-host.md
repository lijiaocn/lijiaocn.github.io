---
layout: default
title: 从宿主机直接进入docker容器的网络空间
author: 李佶澳
createdate: 2017/05/19 19:59:16
changedate: 2017/08/03 16:47:44
categories: 技巧
tags: docker
keywords: docker,netns
description: 排查容器的网络问题时，在宿主机上可以直接进入docker容器的netns。

---

* auto-gen TOC:
{:toc}

## 获得容器的进程号

[container-namespaces-deep-dive-container-networking/][1]中做了详细的介绍。

	$ pid = "$(docker inspect -f '{ {.State.Pid} }' "container_name | Uuid")"

## 方法1

### 创建netns

`ip netns`会到/var/run/netns目录下寻找network namespace，把容器进程中netns连接到这个目录中后，`ip netns`才会感知到。

	$ sudo mkdir -p /var/run/netns
	$ sudo ln -sf /proc/$pid/ns/net "/var/run/netns/container_name or uuid"

docker默认不会创建这个链接，需要手动创建。

这时候执行ip netns，就应当看到链接过来的network namespace，例如链接的名字为`pause`:

	$ip netns
	pause (id: 1)

### 在容器的netns中执行命令

	 sudo ip netns exec "container name | uuid" ip a

## 方法2

用nsenter到进程$pid的network namespace中执行命令。

	nsenter -t $pid -n /bin/sh

连接[nsenter][2]中对nsenter做了更多的说明。

## 参考

1. [container-namespaces-deep-dive-container-networking/][1]
2. [nsenter][2]

[1]: https://platform9.com/blog/container-namespaces-deep-dive-container-networking/  "container-namespaces-deep-dive-container-networking/" 
[2]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/14/linux-tool-nsenter.html "nsenter"
