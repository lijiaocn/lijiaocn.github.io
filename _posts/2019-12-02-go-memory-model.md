---
layout: default
title: "Go 语言的内存模型：并发编程时可能犯的最隐晦的错误！跨协程赋值乱序"
author: 李佶澳
date: "2019-12-02 10:47:30 +0800"
last_modified_at: "2019-12-02 17:46:07 +0800"
categories: 编程
cover:
tags: golang
keywords: golang,go,并发编程,go内存管理
description: 介绍了 Go 的内存并发读取设计，把这篇文章读透了，可以避开特别奇葩特别难查的坑
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

Go 的网站上有一篇 2014 年的文章 [The Go Memory Model][2]，题目是 Go 的内存模型，但讨论的不是内存分配和回收的管理问题，而是介绍了 Go 的内存并发读取设计，把这篇文章读透了，可以避开特别奇葩、特别难查的坑。 

这篇笔记不是对 [The Go Memory Model][2] 的直接翻译，而是核心思想的提炼解读，因此更易懂。
但有一个问题，文章中提到的错误用法的错误现象很难复现，因此我们只能认定这篇文章是最权威的，它所说的都是对的，并按照它的指示去做。

## 宗旨

宗旨就一句话：

如果多个协程对共用变量的赋值顺序敏感，要用并且只能用 Go 提供的 sync、sync/atomic，以及 channel 等方法控制。

我把这个问题称为：跨协程赋值乱序。

## 错误用法1

例如下面这段代码就有很严重的问题：

```go
// Create: 2019/12/02 11:14:00 Change: 2019/12/02 11:47:44
// FileName: wrong_done.go
// Copyright (C) 2019 lijiaocn <lijiaocn@foxmail.com wechat:lijiaocn> wechat:lijiaocn
//
// Distributed under terms of the GPL license.

package main

import (
    "sync"
    "time"
)

var a string
var done bool
var once sync.Once

func setup() {
    a = "hello, world"
    done = true
}

func doprint() {
    if !done {
        once.Do(setup)
    }
    println(a)   // 对协程二来说， a 的值可能是 "not hello, world"
}

func twoprint() {
    go doprint()
    go doprint()
}

func main() {
    done = false
    a = "not hello, world"
    twoprint()
    time.Sleep(1 * time.Second)
}
```

函数 setup() 中，先为变量 a 赋值，然后为变量 done 赋值。函数 doprint() 想在打印 a 的值之前，确保 setup() 函数已经执行。如果 doprint() 只在一个协程中运行没有问题，如果在多个协程中运行就有问题了。

setup() 函数在哪个协程中执行是不确定的，为方便讨论，这里假设在协程一中执行，

协程一执行 doprint() 时，done 为 false，这时候它会调用 setup()，先为 a 赋值，然后为 done 赋值，因此第一个协程执行 println(a) 时，变量的 a 的值一定是 "hello, world"。

协程二执行 doprint() 时就未必了。假设只执行一次的 setup() 函数是在协程一中执行的，协程一按照语句顺序先为变量 a 赋值，后为变量 done 赋值。 **但是，重点来了！协程二看到的赋值顺序是不一定的！** 

>Within a single goroutine, reads and writes must behave as if they executed in the order specified by the program. That is, compilers and processors may reorder the reads and writes executed within a single goroutine only when the reordering does not change the behavior within that goroutine as defined by the language specification. Because of this reordering, the execution order observed by one goroutine may differ from the order perceived by another. For example, if one goroutine executes a = 1; b = 2;, another might observe the updated value of b before the updated value of a.

Go 的编译器会在打乱内存的读取和写入顺序，当然了，是在不改变代码语义的情况下。协程内的内存操作顺序和代码语义是严格匹配的，但是对另外一个协程来说就不一定了。

协程二看到的赋值顺序可能是： 

```go
    done = true
    a = "hello, world"
```

因此协程二在执行 println(a) 时，变量 a 的值可能是 "not hello, world"。 

## 错误用法2

下面这段代码的问题和上一节的代码相同，在协程中变量 a 赋值在 done 之前，但是在 main 函数看来，变量 a 的赋值可能在变量 done 之后：

```go
var a string
var done bool

func setup() {
    a = "hello, world"
    done = true
}

func main() {
    go setup()
    for !done {
    }
    print(a)
}
```

## 错误用法3

下面这个代码错误原因相同，影响更大，在 main 看来，t.msg 的赋值可能在变量 g 的赋值之前，因此即使 g 不是 nil，pring(g.msg) 的结果也可能不是 "hello, world"：

```go
type T struct {
    msg string
}

var g *T

func setup() {
    t := new(T)
    t.msg = "hello, world"
    g = t
}

func main() {
    go setup()
    for g == nil {
    }
    print(g.msg)
}
```

## Go 提供的保证

[The Go Memory Model][2] 中还给出了其它例子，核心都是两个协程看到的内存操作顺序可能是不同的。Go 提供的 init、channel、sync.Mutex、sync.RWMutex、sync.Once 面对多个协程时的行为，是严格不变的。因此不要试图用其它自创的方法进行并发协调。

内存并发操作的问题，要么彻底理解，要么干脆不理解，一知半解最可怕。好消息是，只要采用最常规的方法，就不会踩到坑。[The Go Memory Model][2] 中给出了下面这些设计规则，如果记不住干脆就别记：

### 初始化保证

Go 初始化，即 init() 函数的执行，是在一个协程中完成的，没有并发，且最深的 init() 最先执行。

### 协程创建前保证 

如下所示，对变量 a 的赋值一定在 go f() 协程创建之前完成，即新协程看到的变量 a 的值一定是 "hello,world"：

>The go statement that starts a new goroutine happens before the goroutine's execution begins. 

```go
var a string

func f() {
    print(a)
}

func hello() {
    a = "hello, world"
    go f()
}
```

### 协程销毁时机不定

如下所示，协程的退出时机不一定，变量 a 在协程中赋值可能在 print(a) 之前，也可能在之后，因此 print(a) 打印的值是不确定的 ：

>The exit of a goroutine is not guaranteed to happen before any event in the program


```sh
var a string

func hello() {
    go func() { a = "hello" }()
    print(a)
}
```

### channel 接收前的保证

**向 channel 写入或关闭之前的内存写入结果，在读取 channel 时可以看到。**

>A send on a channel happens before the corresponding receive from that channel completes. 
>The closing of a channel happens before a receive that returns a zero value because the channel is closed. 

如下所示，Go 保证 a 的赋值在 c<-0 之前、c<-0 在 <-c 之前，所以虽然 a 的值在另一个协程中设置，print(a) 时，变量的 a 的值一定是 "hello，world"：


```go
var c = make(chan int, 10)
var a string

func f() {
    a = "hello, world"
    c <- 0  //  如果是 close(c)，a 的赋值也一定在 <-c 之前发生
}

func main() {
    go f()
    <-c
    print(a)
}
```

**没有缓冲区的 channel，读取 channel 之前的内存写入结构，在写入 channel 时可见。**

>A receive from an unbuffered channel happens before the send on that channel completes. 

如下所示，没有缓冲区的 channel，读取 channel 之前为变量 a 赋值，在 c<-0 时可见，注意如果有缓冲区的 channel 就不一定了， print(a) 看到的 a 的值可能不是 "hello world"：

```go
var c = make(chan int)
var a string

func f() {
    a = "hello, world"
    <-c
}

func main() {
    go f()
    c <- 0
    print(a)
}
```

**缓冲区大小为 C 的 channel，第 k 次读取之前设置的内存，在第 k+C 写入时可见。**

>The kth receive on a channel with capacity C happens before the k+Cth send from that channel completes. 

下面这个例子有点不好理解。

首先 for 语句每次循环从 work 中取值赋给变量 w，然后在协程中执行。首先 w 的值是在协程创建之前设置的，所以协程中看到的一定是有效值。

其次 channel 的第 1 次读取一定在第 4（1+3）次写入之前，所以第一次读取没完成时，不会有第四次写入，同一时刻最多有三个协程在运行。。

```go
var limit = make(chan int, 3)

func main() {
    for _, w := range work {
        go func(w func()) {
            limit <- 1
            w()
            <-limit
        }(w)
    }
    select{}
}
```

### 加解锁保证

n < m，第 n 次 Unlock()  一定在第 m 次 Lock() 之前，因此第 n 次 Unlock() 时设置的内存在第 m 次 Lock() 时一定可见。

>For any sync.Mutex or sync.RWMutex variable l and n < m, call n of l.Unlock() happens before call m of l.Lock() returns. 

如下例所示，第二次 l.Lock() 时，第一次 l.Unlock() 一定已经执行了，变量 a 的值一定是 "hello, world"：

```go
var l sync.Mutex
var a string

func f() {
    a = "hello, world"
    l.Unlock()
}

func main() {
    l.Lock()
    go f()
    l.Lock()
    print(a)
}
```

### Once 保证

once.Do() 调用的函数设置的内存，在其它协程中的统一而 once.Do() 之前可见。

>A single call of f() from once.Do(f) happens (returns) before any call of once.Do(f) returns. 

如下所示，假设 setup() 在第一个协程中执行，那么第二个协程中的 once.Do(setup) 执行时，变量 a 的值一定是 "hello，world"：

```go
var a string
var once sync.Once

func setup() {
    a = "hello, world"
}

func doprint() {
    once.Do(setup)
    print(a)
}

func twoprint() {
    go doprint()
    go doprint()
}
```

## 如果记不住这么多规则

那就用常规方法，别创新~~~

## 参考

1. [李佶澳的博客][1]
2. [The Go Memory Model][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://golang.org/ref/mem "The Go Memory Model"
