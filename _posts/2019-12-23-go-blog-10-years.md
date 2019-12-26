---
layout: default
title: "Go 语言官方 10 年博文阅读：重点内容摘录"
author: 李佶澳
date: "2019-12-23T14:37:13+0800"
last_modified_at: "2019-12-23T14:37:13+0800"
categories: 编程
cover:
tags: golang
keywords: golang,Go,go语言
description: "10 年里，Go 发布了几十篇博文，介绍了 Go 的方方面面，是获得 Go 语言最新进展的不二之选"
---

## 本篇目录

* auto-gen TOC:
{:toc}


## 说明

一个多月前，Go 的网站发了一篇博文[《Go Turns 10》][3]，心里一惊，一直把 go 当作一门比较新的语言看待，不经意间，它已经诞生 10 年了！
好多年前尝试找一门 C 之外第二语言的场景还记忆犹新。

岁月，真是一把杀猪刀，现在 10 年 go 语言使用经历的招聘要求，不再是笑话。

10 年里，Go 发布了几十篇博文，介绍了 Go 的方方面面，这些博文是获得 Go 语言最新进展和最新能力的不二之选。这里重新把这些文章走读一遍，对重点内容做了摘录。

还是有很多内容看不懂，程序语言设计的「高地」真高......but，也有一些以前看不懂的内容现在能看懂了。

## 重要内容摘录

**[Share Memory By Communicating][4] 介绍了 Go 语言一个设计思想：通过传递指针的方式使用共享内存。**

多线程编程时，经常通过共享内存实现线程间的通信，需要非常小心的处理加锁和解锁的时机。Go 语言提供了互斥锁、读写锁，但是更鼓励用 channel 传递指针的方式实现。 用 channel 保证同一时刻，只有一个协程在处理目标变量。

**[Defer, Panic, and Recover][5] 介绍了可以避免「遗忘」的 defer 的规则，以及 panic 和 recover。**

defer 规则：

1. A deferred function's arguments are evaluated when the defer statement is evaluated.（入参值是 defer 时的值）
2. Deferred function calls are executed in Last In First Out order after the surrounding function returns.（后进先出）
3. Deferred functions may read and assign to the returning function's named return values.（可以修改命名返回值，这个特性还是不用为好）

panic 规则：

1. 被调用时，终止所在函数 defer 以外指令的继续执行；
2. 所在函数的 defer 都执行完成后，返回上一级调用者；
3. 对上级调用来说，被 panic 的函数等同于 panic，按上面两条规则处理；
4. 逐级向上返回，直到所在的 gorouine 退出。

recover 规则：

1. recover 在 defer 中使用，终止 panic 的向上传递，当前函数正常退出。

**[Go Concurrency Patterns: Timing out, moving on][6] 提供了一种设置等待超时的方法**

在 select 中放一个定时 channel：

```go
select {
case <-ch:
    // a read from ch has occurred
case <-timeout:
    // the read from ch has timed out
}
```

**[Debugging Go code (a status report)][7] 介绍了 go 语言程序的最开始调试方法**

Go 开发的程序，最开始的调试方法只有日志和 gdb，并且是支持 DWARF 的 gdb 7+，并且不支持 channel、interface 等等。现在好很多了，可以用 [delve][9]，相关博客：

* [Debugging Go programs with the GNU Debugger][24]
* [Debugging what you deploy in Go 1.12][8]
* [Debugging Go Code with GDB][25]

**[Go Slices: usage and internals][10] 介绍了 go 的 slice，slice 不是数组。** 

slice 不是数组， slice 不是数组，slice 不是数组，重要的事情说三遍。

Go 语言中数组是有长度的，并且长度写到类型属性中，[3] int 和 [4] int 是不同的类型，另外：

* Go 的数组变量是「值」，不是指向数组的指针（不同于 C 语言）；
* Go 的数组变量是「值」，所以传递的时候，都是 copy 了一份！；

Slice 是一种依赖于数组的类型，它包含指定数组内成员指针：

* slice 的 cap 是底层数组的长度，slice 的 index 运算超出 cap 时会 panic；
* copy() 和 append () 是分别用来进行 slice 复制和追加的内置函数；
* slice 的使用极其富有技巧性，使用不当会严重降低运行效率和浪费内存，上文要认真读；

**[JSON and Go][11] 介绍了 json 序列化和反序列化，Reference Types 的处理值得关注。**

* 反序列化使用的字符串中没有 Reference Types 的对应值，那么 Reference Types 为 nil；
* 如果有，反序列化时会分配相应的内存空间；
* 上面两点意味着在 struct 中使用 Reference Types 可以减少开销。

**[C? Go? Cgo!][12] 介绍了在 Go 代码中引用 C 代码的方法**

**[Gobs of data][13] 介绍 Go 新开发的字描述的编码和使用方式**

>Gobs 的优势没怎么看懂，编码方面的知识需要恶补。

**[Go at Heroku][14] 介绍了使用 Go 实现 Paxos 协议的经历**

**[Spotlight on external Go libraries][15] 介绍了几个比较实用的外部库**

**[Profiling Go Programs][16] 非常重要，介绍了 go 的性能诊断工具 pprof**

* 堆栈采样，发现占用 CPU 最多的函数；
* 360 曾经分享他们的 [经验][19]，做了一个在线运行的 go 程序的状态采集和展示，挺有意义；
* [Qihoo 360 and Go][19] 中对垃圾回收的规避经验特别重要，简单说就是避免短时协程；
 
**[Error handling and Go][17] 介绍了 go 的 error 处理**

* go 1.13 提供了语法糖: [Working with Errors in Go 1.13][18]

**[The Laws of Reflection][20] 介绍了反射的设计思想**

Go 提供了几个图片处理的库，挺有意思，找时间仔细学习：

* [A GIF decoder: an exercise in Go interfaces][21]
* [The Go image package][22]
* [The Go image/draw package][23]

**[Building StatHat with Go][26] 介绍使用 go 开发的 stathat**

* [stathat][27] 是一个收集时间序列的在线服务，有 1.6 万个用户！商业上的启发更大！

**[Organizing Go code][28] 算是 package 组织方式的官方建议**

**[Concurrency is not parallelism][29]，并发不等于并行，一段 30 分钟的视频**

**[Advanced Go Concurrency Patterns][31] 更深入了介绍了并发的问题，又一段 30 分钟视频**

>这两段视频，抽时间看一下。。。

**[Go maps in action][30] 介绍了 map（哈希表）的方方面面，譬如非并发安全**

**[Introducing the Go Race Detector][32] 介绍了用 -race 检测竞争的方法**

**[Arrays, slices (and strings): The mechanics of append][33]**

* 数组最常用的功能是作为 slice 的底层数组
* slice 的 index 操作是“左开右闭”
* slice 作为参数按值传递时，复制的值是 slice header，底层数组不复制

未完待续......

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://golang.google.cn/ "golang 中国"
[3]: https://blog.golang.org/10years "Go Turns 10"
[4]: https://blog.golang.org/share-memory-by-communicating  "Share Memory By Communicating"
[5]: https://blog.golang.org/defer-panic-and-recover "Defer, Panic, and Recover"
[6]: https://blog.golang.org/go-concurrency-patterns-timing-out-and "Go Concurrency Patterns: Timing out, moving on"
[7]: https://blog.golang.org/debugging-go-code-status-report "Debugging Go code (a status report)"
[8]: https://blog.golang.org/debugging-what-you-deploy  "Debugging what you deploy in Go 1.12"
[9]: https://github.com/go-delve/delve "delve"
[10]: https://blog.golang.org/go-slices-usage-and-internals "Go Slices: usage and internals"
[11]: https://blog.golang.org/json-and-go "JSON and Go"
[12]: https://blog.golang.org/c-go-cgo "C? Go? Cgo!"
[13]: https://blog.golang.org/gobs-of-data "Gobs of data"
[14]: https://blog.golang.org/go-at-heroku "Go at Heroku"
[15]: https://blog.golang.org/spotlight-on-external-go-libraries "Spotlight on external Go libraries"
[16]: https://blog.golang.org/profiling-go-programs "Profiling Go Programs"
[17]: https://blog.golang.org/error-handling-and-go "Error handling and Go"
[18]: https://blog.golang.org/go1.13-errors "Working with Errors in Go 1.13"
[19]: https://blog.golang.org/qihoo "Qihoo 360 and Go"
[20]: https://blog.golang.org/laws-of-reflection "The Laws of Reflection"
[21]: https://blog.golang.org/gif-decoder-exercise-in-go-interfaces "A GIF decoder: an exercise in Go interfaces"
[22]: https://blog.golang.org/go-image-package "The Go image package"
[23]: https://blog.golang.org/go-imagedraw-package "The Go image/draw package"
[24]: https://blog.golang.org/debugging-go-programs-with-gnu-debugger "Debugging Go programs with the GNU Debugger"
[25]: https://golang.org/doc/gdb "Debugging Go Code with GDB"
[26]: https://blog.golang.org/building-stathat-with-go "Building StatHat with Go"
[27]: http://www.stathat.com/ "stathat"
[28]: https://blog.golang.org/organizing-go-code "Organizing Go code"
[29]: https://blog.golang.org/concurrency-is-not-parallelism  "Concurrency is not parallelism"
[30]: https://blog.golang.org/go-maps-in-action  "Go maps in action"
[31]: https://blog.golang.org/advanced-go-concurrency-patterns "Advanced Go Concurrency Patterns"
[32]: https://blog.golang.org/race-detector "Introducing the Go Race Detector"
[33]: https://blog.golang.org/slices "Arrays, slices (and strings): The mechanics of append"
