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

比较尴尬的是，还是有很多内容看不懂，程序语言设计的「高地」真高......but，还有很多以前看不懂的内容现在能看懂了，我还是有进步的~ 😊。

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

Go 开发的程序，最开始的调试方法只有日志和 gdb，并且是支持 DWARF 的 gdb 7+，并且不支持 channel、interface 等等。现在好很多了，可以用 [delve][9]，[《Debugging what you deploy in Go 1.12》][8]对此有详细介绍。

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
