---
layout: default
title: 分布式kv存储etcd的使用
author: lijiaocn
createdate: 2017/09/21 18:44:21
changedate: 2017/09/21 18:58:17
categories: 项目
tags: etcd
keywords: etcd,分布式kv存储,服务发现,leader
description: etcd是一个可靠的分布式kv存储系统，可以用来做服务发现和leader选举

---

* auto-gen TOC:
{:toc}

## 说明

[etcd][1]是CoreOS的工程师开发的分布式kv存储，写入etcd的key可以被watch，类似于zookeeper。

## 参考

1. [etcd][1]
2. [etcd get start][2]

[1]: https://coreos.com/etcd/  "etcd" 
[2]: https://coreos.com/etcd/docs/latest/getting-started-with-etcd.html  "etcd get start" 
