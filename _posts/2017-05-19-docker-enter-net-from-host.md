---
layout: default
title: docker 深入：直接进入容器的网络空间
author: 李佶澳
createdate: 2017/05/19 19:59:16
last_modified_at: 2017/08/03 16:47:44
categories: 技巧
tags: docker
keywords: docker,netns
description: 排查容器的网络问题时，在宿主机上可以直接进入docker容器的netns。

---

## 目录
* auto-gen TOC:
{:toc}


[container-namespaces-deep-dive-container-networking/][1]中做了详细的介绍。

## 用 nsenter 进入容器的 network

用 [nsenter][2] 进入指定进程的的 network namespace：

```sh
pid = "$(docker inspect -f '{ {.State.Pid} }' "container_name | Uuid")"
nsenter -t $pid -n /bin/sh
```

## 创建 netns

`ip netns`会到 /var/run/netns 目录下寻找 network namespace，把容器进程中 netns 连接到这个目录中后，`ip netns`才会感知到。

	$ sudo mkdir -p /var/run/netns
	$ sudo ln -sf /proc/$pid/ns/net "/var/run/netns/container_name or uuid"

docker 默认不会创建这个链接，需要手动创建。

这时候执行ip netns，就应当看到链接过来的 network namespace，例如链接的名字为 `pause`:

	$ip netns
	pause (id: 1)

在容器的netns中执行命令

	 sudo ip netns exec "container name | uuid" ip a

## 参考

1. [container-namespaces-deep-dive-container-networking/][1]
2. [nsenter][2]

[1]: https://platform9.com/blog/container-namespaces-deep-dive-container-networking/  "container-namespaces-deep-dive-container-networking/" 
[2]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/14/linux-tool-nsenter.html "nsenter"
