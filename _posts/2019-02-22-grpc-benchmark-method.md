---
layout: default
title: "grpc 性能压测方法: ghz"
author: 李佶澳
createdate: "2019-02-22 10:32:35 +0800"
last_modified_at: "2024-04-30 15:26:41 +0800"
categories: 技巧
tags: grpc
keywords: grpc性能压测,grpc benchmark,ghz
description: github中搜索“grpc benchmark”，ghz位置比较靠前，也有文章分享了用Locust进行grpc压测的方法
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

现在grpc的压测工具很少，比http的压测工具少太多了，好像还没有一个“公认”的压测工具，在github中搜索“grpc benchmark”，[bojand/ghz][1]排在比较靠前的位置，文档也比较齐全整洁：[Simple gRPC benchmarking and load testing tool ][2]。也有文章分享了用[Locust进行grpc压测][3]的方法。

**相关笔记**：

[Go语言实现grpc server和grpc client，用protobuf格式的消息通信（GRPC）](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/02/go-grpc-usage.html)

[Grpc性能压测方法：用ghz进行压测](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/22/grpc-benchmark-method.html)

## 下载

编译源代码遇到找不到包的问题，没时间进行折腾，对于工具还秉持“能用就行”的态度，遇到需要通过修改源码解决的问题，或者有闲暇，再深入研究学习一下它们的实现。

好在ghz的release页面提供了已经编译好的可执行文件，直接下载使用好了：[bojand/ghz release][4]。

## 使用

ghz的一个好处是直接传入.proto文件就可以压测了，不需要根据grpc的.proto文件生成单独的压测程序。

例如压测Grpc项目中的例子[helloworld](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/02/go-grpc-usage.html#grpc%E9%80%9A%E4%BF%A1%E7%A4%BA%E4%BE%8B)：

```
./ghz -insecure \
  -proto ./helloworld.proto \
  -call helloworld.Greeter.SayHello \
  -d '{"name":"Joe"}' \
  -c 10 \
  -n 100000 \
  10.10.64.58:50051
```

压测输出如下：

```
Summary:
  Count:	100000
  Total:	8.07 s
  Slowest:	41.88 ms
  Fastest:	0.54 ms
  Average:	7.87 ms
  Requests/sec:	12387.61

Response time histogram:
  0.538 [1]	|
  4.672 [22943]	|∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎
  8.806 [46907]	|∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎
  12.940 [19671]	|∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎
  17.074 [5965]	|∎∎∎∎∎
  21.208 [2077]	|∎∎
  25.342 [1094]	|∎
  29.476 [725]	|∎
  33.610 [381]	|
  37.743 [146]	|
  41.877 [90]	|

Latency distribution:
  10% in 3.70 ms
  25% in 4.81 ms
  50% in 6.65 ms
  75% in 9.58 ms
  90% in 13.15 ms
  95% in 16.56 ms
  99% in 27.01 ms
Status code distribution:
  [OK]   100000 responses
```

官网上有更多的例子[Examples](https://ghz.sh/docs/example_call)。

## 注意

参数`-c`指定并发请求数：

```
-c  Number of requests to run concurrently.
    Total number of requests cannot be smaller than the concurrency level. Default is 50.
```

压测时观察连接情况，发现无论-c指定的参数是多少，都只建立了一个tcp连接，-c所指的并发似乎是并发的往一个grpc连接中发请求，而不是模拟多个client。

## 参考

1. [bojand/ghz][1]
2. [Simple gRPC benchmarking and load testing tool ][2]
3. [压测工具Locust的使用][3]
4. [bojand/ghz release][4]

[1]: https://github.com/bojand/ghz "bojand/ghz"
[2]: https://ghz.sh/ "Simple gRPC benchmarking and load testing tool "
[3]: https://www.cnblogs.com/zhaoxd07/p/7467291.html "压测工具Locust的使用"
[4]: https://github.com/bojand/ghz/releases "bojand/ghz release"
