---
layout: default
title: "etcd 的 go sdk 的使用方法：etcd/clientv3，选举 leader 的方法"
author: 李佶澳
createdate: "2019-06-19 18:33:30 +0800"
changedate: "2019-07-10 17:14:10 +0800"
categories: 编程
tags: etcd
cover: 
keywords: etcd,clientv3,etcd sdk
description: "etcd的go sdk的使用方法，clientv3使用grpc与etcd通信，效率更高"
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

学习一下 etcd 的 sdk：[etcd clientv3][2]，目录 `etcd/clientv3/` 中有一些示例代码：

```
$ ls clientv3/example_*
clientv3/example_auth_test.go        clientv3/example_maintenence_test.go
clientv3/example_cluster_test.go     clientv3/example_metrics_test.go
clientv3/example_kv_test.go          clientv3/example_test.go
clientv3/example_lease_test.go       clientv3/example_watch_test.go
```

可以用在线文档查看：[package clientv3](https://godoc.org/github.com/etcd-io/etcd/clientv3#pkg-examples)。

## 本地部署 etcd 集群

准备一个 etcd 集群。

### etcd 源码编译

下载源代码编译，这里使用当前最新的稳定版 v3.3.13:

```sh
git clone https://github.com/etcd-io/etcd.git 
cd etcd
git checkout v3.3.13
make build
```

### 本地启动集群

用 [goreman](https://github.com/mattn/goreman) 在本地启动一个 etcd 集群。

```
cd etcd
goreman start
```

goreman 按照 etcd 目录中 Procfile 文件的指示启动三个 etcd 进程模拟一个集群：

```sh
# Use goreman to run `go get github.com/mattn/goreman`
etcd1: bin/etcd --name infra1 --listen-client-urls http://127.0.0.1:2379 --advertise-client-urls http://127.0.0.1:2379 --listen-peer-urls http://127.0.0.1:12380 --initial-advertise-peer-urls http://127.0.0.1:12380 --initial-cluster-token etcd-cluster-1 --initial-cluster 'infra1=http://127.0.0.1:12380,infra2=http://127.0.0.1:22380,infra3=http://127.0.0.1:32380' --initial-cluster-state new --enable-pprof
etcd2: bin/etcd --name infra2 --listen-client-urls http://127.0.0.1:22379 --advertise-client-urls http://127.0.0.1:22379 --listen-peer-urls http://127.0.0.1:22380 --initial-advertise-peer-urls http://127.0.0.1:22380 --initial-cluster-token etcd-cluster-1 --initial-cluster 'infra1=http://127.0.0.1:12380,infra2=http://127.0.0.1:22380,infra3=http://127.0.0.1:32380' --initial-cluster-state new --enable-pprof
etcd3: bin/etcd --name infra3 --listen-client-urls http://127.0.0.1:32379 --advertise-client-urls http://127.0.0.1:32379 --listen-peer-urls http://127.0.0.1:32380 --initial-advertise-peer-urls http://127.0.0.1:32380 --initial-cluster-token etcd-cluster-1 --initial-cluster 'infra1=http://127.0.0.1:12380,infra2=http://127.0.0.1:22380,infra3=http://127.0.0.1:32380' --initial-cluster-state new --enable-pprof
#proxy: bin/etcd grpc-proxy start --endpoints=127.0.0.1:2379,127.0.0.1:22379,127.0.0.1:32379 --listen-addr=127.0.0.1:23790 --advertise-client-url=127.0.0.1:23790 --enable-pprof
```

三个 etcd 的服务地址分别是：

```sh
127.0.0.1:2379   127.0.0.1:12380
127.0.0.1:22379  127.0.0.1:22380
127.0.0.3:32379  127.0.0.2:32380
```

## 项目中添加 clientv3

创建一个 go mod 项目，添加 clientv3 依赖：

```sh
mkdir etcdclientv3
cd etcdclientv3
go mod init lijiaocn.com/gocode/etcdclientv3
go get go.etcd.io/etcd/clientv3@v3.3.13
```

## 增删改查操作

### SDK: 写入和查询

```go
// Copyright (C) 2019 lijiaocn <lijiaocn@foxmail.com> wechat: lijiaocn
//
// Distributed under terms of the GPL license.

package main

import (
    "context"
    "encoding/json"
    "fmt"
    "time"

    "github.com/golang/glog"
    "go.etcd.io/etcd/clientv3"
)

func toString(obj interface{}) (string, error) {
    bytes, err := json.Marshal(obj)
    if err != nil {
        return "", err
    }
    return string(bytes), nil
}

// 写入ETCD
func PUT(cli *clientv3.Client, key, val string) (string, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    resp, err := cli.Put(ctx, key, val)
    cancel()
    if err != nil {
        return "", err
    }
    return toString(resp)
}

// 查询ETCD
func GET(cli *clientv3.Client, key string, opts ...clientv3.OpOption) (string, error) {
    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    resp, err := cli.Get(ctx, key, opts...)
    cancel()
    if err != nil {
        return "", err
    }
    return toString(resp)
}

func main() {

    config := clientv3.Config{
        Endpoints:   []string{"localhost:2379", "localhost:22379", "localhost:32379"},
        DialTimeout: 5 * time.Second,
    }

    cli, err := clientv3.New(config)
    if err != nil {
        glog.Fatal(err.Error())
    }

    defer func() {
        if err := cli.Close(); err != nil {
            glog.Error(err.Error())
        }
    }()

    if v, err := PUT(cli, "sample_key", "sample_value123"); err != nil {
        glog.Errorf(err.Error())
    } else {
        fmt.Printf("PUT RESULT: %s\n", v)
    }

    if v, err := GET(cli, "sample_key"); err != nil {
        glog.Errorf(err.Error())
    } else {
        fmt.Printf("GET RESULT: %s\n", v)
    }
}
```

client 的创建没有什么好说，直接阅读 clientv3.New() 的代码即可，需要注意的是 client 的使用。client 可以使用的方法有 Get、Put、Delete 等，它们都需要一个 context.Context 类型的参数用来控制超时时间，典型使用方法如下：

```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
resp, err := cli.Get(ctx, key, opts...)
cancel()
if err != nil {
    return "", err
}
```

[context](https://golang.org/pkg/context/) 的用法见 [Go Concurrency Patterns: Context](https://blog.golang.org/context)。

### SDK: Watch

对接 etcd 大部分时间都是为了 watch 变化，所以更关注 Watch  接口的使用方法。

Watch 接口定义如下：

```go
// etcd/clientv3/watch.go
type Watcher interface {
    // Watch watches on a key or prefix. The watched events will be returned
    // through the returned channel. If revisions waiting to be sent over the
    // watch are compacted, then the watch will be canceled by the server, the
    // client will post a compacted error watch response, and the channel will close.
    Watch(ctx context.Context, key string, opts ...OpOption) WatchChan

    // Close closes the watcher and cancels all watch requests.
    Close() error
}
```

调用 Watch() 方法返回一个 Channel，变化通过 Channel 传送，channel 的类型是 `<-chan WatchResponse`，`cli.Watch()` 的第一个参数是 context ，不需要设置超时时间：

```go
func WATCH(cli *clientv3.Client, key string, opts ...clientv3.OpOption) (clientv3.WatchChan, error) {
    watchChan := cli.Watch(context.Background(), key, opts...)
    return watchChan, nil
}

func main() {

    config := clientv3.Config{
        Endpoints:   []string{"localhost:2379", "localhost:22379", "localhost:32379"},
        DialTimeout: 5 * time.Second,
    }

    cli, err := clientv3.New(config)
    if err != nil {
        glog.Fatal(err.Error())
    }

    defer func() {
        if err := cli.Close(); err != nil {
            glog.Error(err.Error())
        }
    }()

    if watchChan, err := WATCH(cli, "sample_key"); err != nil {
        glog.Errorf(err.Error())
    } else {
        for {
            wr := <-watchChan
            if str, err := toString(wr); err == nil {
                fmt.Printf("%s\n", str)
            } else {
                glog.Error(err.Error())
            }
        }
    }
}
```

### 返回的数据的格式

PUT 请求返回的数据格式：

```go
type PutResponse struct {
    Header *ResponseHeader `protobuf:"bytes,1,opt,name=header" json:"header,omitempty"`
    // if prev_kv is set in the request, the previous key-value pair will be returned.
    PrevKv *mvccpb.KeyValue `protobuf:"bytes,2,opt,name=prev_kv,json=prevKv" json:"prev_kv,omitempty"`
}
```

GET 请求返回的数据格式：

```go
type RangeResponse struct {
    Header *ResponseHeader `protobuf:"bytes,1,opt,name=header" json:"header,omitempty"`
    // kvs is the list of key-value pairs matched by the range request.
    // kvs is empty when count is requested.
    Kvs []*mvccpb.KeyValue `protobuf:"bytes,2,rep,name=kvs" json:"kvs,omitempty"`
    // more indicates if there are more keys to return in the requested range.
    More bool `protobuf:"varint,3,opt,name=more,proto3" json:"more,omitempty"`
    // count is set to the number of keys within the range when requested.
    Count int64 `protobuf:"varint,4,opt,name=count,proto3" json:"count,omitempty"`
}
```

Watch 请求返回的数据格式：

```go
type WatchResponse struct {
    Header pb.ResponseHeader
    Events []*Event

    // CompactRevision is the minimum revision the watcher may receive.
    CompactRevision int64

    // Canceled is used to indicate watch failure.
    // If the watch failed and the stream was about to close, before the channel is closed,
    // the channel sends a final response that has Canceled set to true with a non-nil Err().
    Canceled bool

    // Created is used to indicate the creation of the watcher.
    Created bool

    closeErr error

    // cancelReason is a reason of canceling watch
    cancelReason string
}
```

## 用 etcd 选举 leader

[go.etcd.io/etcd/clientv3/concurrency/election.go](https://github.com/etcd-io/etcd/blob/master/clientv3/concurrency/election.go) 提供了用于选举 Leader 的 API，用法很简单。

先创建 client ：

```go
    config := clientv3.Config{
        Endpoints:   []string{"localhost:2379", "localhost:22379", "localhost:32379"},
        DialTimeout: 5 * time.Second,
    }

    cli, err := clientv3.New(config)
    if err != nil {
        glog.Fatal(err.Error())
    }
```

创建 session，`s, err = concurrency.NewSession(cli, concurrency.WithTTL(1))` 中的 concurrency.WithTTL(1) 指定存活时间为 1 秒，默认是 60 秒，这个是用于选举的 key 在 etcd 中的存活时间，等于 leader 失联后开始下一次选举的时间（ leader 断开 1 秒后，对应的 key 超时被删，重新开始选举）：

```go
    var s *concurrency.Session
    s, err = concurrency.NewSession(cli, concurrency.WithTTL(1))
    if err != nil {
        log.Fatal(err)
    }
```

竞选，直到成为 leader 才继续向下执行，NewElection 执行用于竞选的 key 的前缀：

```go
    e := concurrency.NewElection(s, "/testelection")
    //竞选 Leader，直到成为 Leader 函数才返回
    if err = e.Campaign(context.Background(), node); err != nil {
        glog.Fatalf("Campaign() returned non nil err: %s", err)
    }
    fmt.Printf("I'm leader")
```

在 etcd 中可以看到用于选举的 key：

```sh
/testelection/32696bd0d159d067
node1
/testelection/e486bd0d159cf98
node2
```

## 参考

1. [李佶澳的博客笔记][1]
2. [etcd clientv3][2]

[1]: https://www.lijiaocn.com "李佶澳的博客笔记"
[2]:https://github.com/etcd-io/etcd/tree/master/clientv3 "etcd clientv3"
