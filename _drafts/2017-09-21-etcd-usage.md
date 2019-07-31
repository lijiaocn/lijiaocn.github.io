---
layout: default
title: 分布式kv存储etcd的使用
author: lijiaocn
createdate: 2017/09/21 18:44:21
last_modified_at: 2018/08/12 17:12:13
categories: 项目
tags: etcd
keywords: etcd,分布式kv存储,服务发现,leader
description: etcd是一个可靠的分布式kv存储系统，可以用来做服务发现和leader选举

---

* auto-gen TOC:
{:toc}

## 说明

[etcd][1]是CoreOS的工程师开发的分布式kv存储，写入etcd的key可以被watch，类似于zookeeper。

[github etcd][3]中有详细的使用说明。

## 部署

### staitc

etcd使用两个端口，`2379`用于处理client请求，`2380`用etcd peer之间通信。



## 参考

1. [etcd][1]
2. [etcd get start][2]
3. [github etcd][3]

[1]: https://coreos.com/etcd/  "etcd" 
[2]: https://coreos.com/etcd/docs/latest/getting-started-with-etcd.html  "etcd get start" 
[3]: https://github.com/coreos/etcd/ "github etcd"
