---
layout: default
title: 使用petset创建的etcd集群在kubernetes中运行失败
author: 李佶澳
createdate: 2017/11/29 16:16:09
last_modified_at: 2017/11/29 23:21:50
categories: 问题
tags: kubernetes_problem etcd
keywords: kubernetes,etcd,etcdmain,validating,peerURLs,petset
description: 使用petset在kubernetes中创建的etcd集群，运行一段时间后一个成员异常

---

## 目录
* auto-gen TOC:
{:toc}

## 现象

使用petset启动的etcd集群，运行一端时间后，其中一个pod一直处于crash状态。

日志显示:

	2017-11-29 21:17:42.029570 I | etcdserver: starting server... [version: 3.2.4, cluster version: to_be_decided]
	2017-11-29 21:17:42.029827 I | rafthttp: started streaming with peer 884a01715a22a5b4 (stream Message reader)
	2017-11-29 21:17:42.036748 I | rafthttp: peer 884a01715a22a5b4 became active
	2017-11-29 21:17:42.036772 I | rafthttp: established a TCP streaming connection with peer 884a01715a22a5b4 (stream MsgApp v2 writer)
	2017-11-29 21:17:42.036779 I | rafthttp: peer 31b2a8e8060a1b5a became active
	2017-11-29 21:17:42.036784 I | rafthttp: established a TCP streaming connection with peer 31b2a8e8060a1b5a (stream Message writer)
	2017-11-29 21:17:42.036791 I | rafthttp: established a TCP streaming connection with peer 31b2a8e8060a1b5a (stream MsgApp v2 writer)
	2017-11-29 21:17:42.036944 I | rafthttp: established a TCP streaming connection with peer 884a01715a22a5b4 (stream Message writer)
	2017-11-29 21:17:42.097197 I | rafthttp: established a TCP streaming connection with peer 31b2a8e8060a1b5a (stream Message reader)
	2017-11-29 21:17:42.101341 I | rafthttp: established a TCP streaming connection with peer 31b2a8e8060a1b5a (stream MsgApp v2 reader)
	2017-11-29 21:17:42.101568 I | raft: b4514e3a7bba4b13 [term: 1] received a MsgHeartbeat message with higher term from 31b2a8e8060a1b5a [term: 2]
	2017-11-29 21:17:42.101582 I | raft: b4514e3a7bba4b13 became follower at term 2
	2017-11-29 21:17:42.101653 C | raft: tocommit(37) is out of range [lastIndex(0)]. Was the raft log corrupted, truncated, or lost?
	panic: tocommit(37) is out of range [lastIndex(0)]. Was the raft log corrupted, truncated, or lost?
	
	goroutine 106 [running]:
	github.com/coreos/etcd/cmd/vendor/github.com/coreos/pkg/capnslog.(*PackageLogger).Panicf(0xc4201a8120, 0xf44521, 0x5d, 0xc421b5c0a0, 0x2, 0x2)
	        /home/gyuho/go/src/github.com/coreos/etcd/release/etcd/gopath/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/pkg/capnslog/pkg_logger.go:75 +0x15c
	github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft.(*raftLog).commitTo(0xc4202a00e0, 0x25)
	        /home/gyuho/go/src/github.com/coreos/etcd/release/etcd/gopath/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft/log.go:191 +0x15c
	github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft.(*raft).handleHeartbeat(0xc420042000, 0x8, 0xb4514e3a7bba4b13, 0x31b2a8e8060a1b5a, 0x2, 0x0, 0x0, 0x0, 0x0, 0x0, ...)
	        /home/gyuho/go/src/github.com/coreos/etcd/release/etcd/gopath/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft/raft.go:1100 +0x54
	github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft.stepFollower(0xc420042000, 0x8, 0xb4514e3a7bba4b13, 0x31b2a8e8060a1b5a, 0x2, 0x0, 0x0, 0x0, 0x0, 0x0, ...)
	        /home/gyuho/go/src/github.com/coreos/etcd/release/etcd/gopath/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft/raft.go:1046 +0x2b3
	github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft.(*raft).Step(0xc420042000, 0x8, 0xb4514e3a7bba4b13, 0x31b2a8e8060a1b5a, 0x2, 0x0, 0x0, 0x0, 0x0, 0x0, ...)
	        /home/gyuho/go/src/github.com/coreos/etcd/release/etcd/gopath/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft/raft.go:778 +0x10f7
	github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft.(*node).run(0xc420172240, 0xc420042000)
	        /home/gyuho/go/src/github.com/coreos/etcd/release/etcd/gopath/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft/node.go:323 +0x67b
	created by github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft.StartNode
	        /home/gyuho/go/src/github.com/coreos/etcd/release/etcd/gopath/src/github.com/coreos/etcd/cmd/vendor/github.com/coreos/etcd/raft/node.go:210 +0x6b3

## 调查

调查过程比较繁琐，且依赖于具体的实现方法，因此这里直接给出结论。

petset中的三个etcd是按照这样的顺序启动的：

	1. 第一个pod启动，创建一个新的cluster，2379端口启动后，认为成功
	2. 第二个pod启动，加入已有的cluster，2379端口启动后，认为成功
	3. 第三个pod启动，加入已有的cluster，2379端口启动后，认为成功

所有pod使用云硬盘存放etcd数据。

可能是因为pod频繁地删除、迁移，petset重建pod的时候，因为使用了云硬盘，重建的pod还会使用之前的etcd数据。

重建的pod会根据保存的数据去连接原先的peer，但是原先的peer的IP已经变化，导致重建的etcd迟迟不能启动成功。

有时候，会有两个pod同时被重建，前一个pod会去连接尚未重建的下一个pod，而下一个pod又要等前一个pod创建成功。

因此，做了修改，每次重建pod都会清除已有的数据。

但是这样做，又引发了新的问题，当pod在原地快速重启时，还没有被从etcd中删除时，就重启完成。

这时候它会和其它的pod进行同步，但是却发现etcd数据丢失了，因此panic。

最后做了修改，只有迁移到其它node上，才会清除数据。

事实上，这和不用云硬盘是相同的效果。

需要一个更好的方式实现etcd集群。
