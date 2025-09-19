---
layout: default
title: "Go 语言官方 10 年博文: 深度阅读指引与重点内容摘录"
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

一个多月前，Go 的网站发了一篇博文[《Go Turns 10》][3]，心里一惊，它已经诞生 10 年了！

10 年里，Go 发布的几十篇博文介绍了 Go 的方方面面，是获得 Go 语言最新进展和能力的不二之选。

## Go 2 进展

**[Toward Go 2][49]：Go 2 启动，5 年实际应用后，Go 语言从推广转向进化**

**[Go 2, here we come!][52]：Go 2 的进展**

**[Next steps toward Go 2][56]：Go 2 的进展**

**[Why Generics?][57]：正在进行中的范型设计**

## 代码管理

**[Godoc: documenting Go code][68]：注释文档**

**[Organizing Go code][28]：package 组织方式的官方建议**

**[Go Modules in 2019][53]：go modules 全面替换 GOPATH**

**[Using Go Modules][55]：go module 的使用方法**

**[Migrating to Go Modules][58]：怎样迁移到 go module**

**[Publishing Go Modules][60]：go module 发布与版本规范**

**[Go Modules: v2 and Beyond][62]：主版本发生变换时的操作**

**[Module Mirror and Checksum Database Launched][59]：go module 背后的机制**

* 切换为 go module 后，import 使用的是 go module 的别名（不再是路径）
* 如果引用主版本，必须使用版本后缀，例如 /v2
* 测试代码等不能使用依赖 GOPATH 的文件

**[A Proposal for Package Versioning in Go][63]：详细介绍了 go module 的设计过程**

## 测试用例

**[The cover story][36]：go 的测试覆盖率工具 -cover**

* go test -cover

**[Testable Examples in Go][42]：怎样写和文档融合在一起的示例**

**[Using Subtests and Sub-benchmarks][46]：测试用例和基准测试的增强功能**

## 调试调优

**[Debugging Go code (a status report)][7]：go 语言程序的最开始调试方法**


**[Debugging what you deploy in Go 1.12][8]：go 1.12 进一步优化了调试工具，使用 delve**

Go 开发的程序，最开始的调试方法只有日志和 gdb，并且是支持 DWARF 的 gdb 7+，并且不支持 channel、interface 等等。现在好很多了，可以用 [delve][9]，另外对 gdb 继续支持（不好用）：

* [Debugging Go programs with the GNU Debugger][24]
* [Debugging Go Code with GDB][25]

**[Profiling Go Programs][16]：非常重要，go 的性能诊断工具 pprof**

* 堆栈采样，发现占用 CPU 最多的函数；
* 360 曾经分享他们的 [经验][19]，做了一个在线运行的 go 程序的状态采集和展示，挺有意义；
* [Qihoo 360 and Go][19] 中对垃圾回收的规避经验特别重要，简单说就是避免短时协程；

**[Smaller Go 1.7 binaries][45]：可执行文件体积压缩了 30% 以上**

* We could take more radical steps to reduce binary size: the upx tool for compressing executables shrinks binaries by another 50% at the cost of increased startup time and potentially increased memory use.

## 错误处理

**[Defer, Panic, and Recover][5] ：defer 的规则，以及 panic 和 recover**

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

**[Error handling and Go][17]：go 的 error 处理**

**[Working with Errors in Go 1.13][61]： go 1.13 引入的 error 语法糖**

## 内存管理

**[Go GC: Prioritizing low latency and simplicity][43]：go1.5 引入的新的 gc 方法**

* If you want to lower the total time spent in GC, increase GOGC. If you want to trade more GC time for less memory, lower GOGC.

**[Getting to Go: The Journey of Go's Garbage Collector][50]： go 垃圾回收机制的演变**

## 常规细节

**[Go Slices: usage and internals][10]：go 的 slice 不是数组。** 

* slice 不是数组， slice 不是数组，slice 不是数组，重要的事情说三遍。
* Go 语言中数组是有长度的，并且长度写到类型属性中，`[3] int` 和 `[4] int` 是不同的类型
* Go 的数组变量是「值」，不是指向数组的指针（不同于 C 语言）
* Go 的数组变量是「值」，所以传递的时候，都是 copy 了一份！
* Slice 是一种依赖于数组的类型，它包含指定数组内成员指针
* Slice 的 cap 是底层数组的长度，slice 的 index 运算超出 cap 时会 panic
* copy() 和 append () 是分别用来进行 slice 复制和追加的内置函数
* Slice 的使用极其富有技巧性，使用不当会严重降低运行效率和浪费内存，上文要认真读

**[JSON and Go][11]：json 序列化和反序列化，Reference Types 的处理值得关注**

* 反序列化使用的字符串中没有 Reference Types 的对应值，那么 Reference Types 为 nil
* 如果有，反序列化时会分配相应的内存空间
* 上面两点意味着在 struct 中使用 Reference Types 可以减少开销

**[Go maps in action][30]：map（哈希表）的方方面面，非并发安全**

**[Arrays, slices (and strings): The mechanics of append][33]：append 的实现方法，复制时机**

* 数组最常用的功能是作为 slice 的底层数组
* slice 的 index 操作是“左开右闭”
* slice 作为参数按值传递时，复制的值是 slice header，底层数组不复制
* 搞清楚要修改的是 slice header 还是 slice 指向的数组
* 使用 make 创建 slice 时，cap 默认等于 len
* append 的时候，如果超出了 cap，会引发扩容、复制
* string 是只读的 slice，底层是 byte 数组

```go
// Insert inserts the value into the slice at the specified index,
// which must be in range.
// The slice must have room for the new element.
func Insert(slice []int, index, value int) []int {
    // Grow the slice by one element.
    slice = slice[0 : len(slice)+1]
    // Use copy to move the upper part of the slice out of the way and open a hole.
    copy(slice[index+1:], slice[index:])
    // Store the new value.
    slice[index] = value
    // Return the result.
    return slice
}
```

**[Constants][40]：constant 与变量的区别，const 不需要类型转换** 

* 有类型常量和无类型常量是完全不同的
* 这一篇相当烧脑，特别是 constant 的默认类型

## 并发编程

**[Share Memory By Communicating][4]： Go 语言设计思想，通过传递指针的方式使用共享内存**

多线程编程时，经常通过共享内存实现线程间的通信，需要非常小心的处理加锁和解锁的时机。
Go 语言提供了互斥锁、读写锁，但是更鼓励用 channel 传递指针的方式实现。用 channel 保证同一时刻，只有一个协程在处理目标变量。

**[Go Concurrency Patterns: Timing out, moving on][6]：一种设置等待超时的方法**

在 select 中放一个定时 channel：

```go
select {
case <-ch:
    // a read from ch has occurred
case <-timeout:
    // the read from ch has timed out
}
```

**[Concurrency is not parallelism][29]：并发不等于并行，一段 30 分钟的视频**

**[Advanced Go Concurrency Patterns][31]：更深入了介绍了并发的问题，又一段 30 分钟视频**

这两段视频，抽时间看一下。。。

**[Introducing the Go Race Detector][32]：竞争检测工具 -race**

* 怎样通过一个 channel 同时关闭所有 goroutine？（用 close 关闭 channel）

**[Go Concurrency Patterns: Context][39]：用 context 串联相关的 goroutine**

* At Google, we require that Go programmers pass a Context parameter as the first argument to every function on the call path between incoming and outgoing requests. 

**[Go Concurrency Patterns: Pipelines and cancellation][38]：go channel 的经典用法**

## 多语言处理

**[Strings, bytes, runes and characters in Go][34]：byte、character 和 rune 的区别**

* unicode/utf8 处理 utf8 字符的库

下面这段代码的 index 的值，很有意思：

```go
const nihongo = "日本語"
for index, runeValue := range nihongo {
    fmt.Printf("%#U starts at byte position %d\n", runeValue, index)
}
```

**[Text normalization in Go][35]： 处理 utf8 字符时应该注意的问题**

* 关键：一个字符可能由多个 rune 组成
* utf8 编码有两种方式，看的头大...

**[Language and Locale Matching in Go][44]：用户语言与应用支持的语言的搭配策略**

## 扩展能力

**[C? Go? Cgo!][12]：在 Go 代码中引用 C 代码的方法**

**[Gobs of data][13]：Go 新开发的编码和使用方式**

>Gobs 的优势没看懂，编码方面的知识需要恶补

**[Spotlight on external Go libraries][15]：几个比较实用的外部库**

**[The Laws of Reflection][20]：反射的设计和用法**

**Go 提供了几个图片处理的库，挺有意思，找时间学习：**

* [A GIF decoder: an exercise in Go interfaces][21]
* [The Go image package][22]
* [The Go image/draw package][23]

**[Generating code][41]：代码自动生成 go:generate**

**[Introducing HTTP Tracing][47]：跟踪 http 请求调用过程的方法**

**[HTTP/2 Server Push][48]：http/2 的主要特点、使用方法和注意事项**

**[Portable Cloud Programming with Go Cloud][75]：go 的`跨云`运行方案**

**[What's new in the Go Cloud Development Kit][74]：**

**[Compile-time Dependency Injection With Go Cloud's Wire][51]：依赖注入工具 wire** 

## 使用经验

**[Real Go Projects: SmartTwitter and web.go][67]：Smart Twitter**

**[Go at Heroku][14]：使用 Go 实现 Paxos 协议的经历**

**[From zero to Go: launching on the Google homepage in 24 hours][70]：用 go 实现 google 主页**

**[Building StatHat with Go][26]：使用 go 开发的 stathat**

* [stathat][27] 是一个收集时间序列的在线服务，有 1.6 万个用户！商业上的启发更大！


**[Inside the Go Playground][37]：go Playground 的实现**

## 社区资源

**[Introducing the Go Playground][66]：go 在线运行**

**[Go for App Engine is now generally available][69]：gae 支持 go runtime**

**[Go and the Google Cloud Platform][71]**

**[Go on App Engine: tools, tests, and concurrency][72]**

**[Announcing App Engine’s New Go 1.11 Runtime][73]**

**[The New Go Developer Network][54]：分布在全球各地的 go 小组**

**[Go.dev: a new hub for Go developers][64]：Go 代码仓库**

**[Hello, 中国!][65]：中国镜像站 [https://golang.google.cn](https://golang.google.cn)**

## Release 记录

**20120328 [Go version 1 is released][76]**

**20131201 [Go 1.2 is released][77]**

* scheduler 会被不定时唤起，解决了单线程时，go routine 霸占线程的问题。

**20140618 [Go 1.3 is released][78]**

**20141110 [Go 1.4 is released][79]**

* 支持 android，可以用 go 开发 android app， golang.org/x/mobile 
* go generate

**20150819 [Go 1.5 is released][80]**

* 编译器完全用 go 实现，完成自举
* 垃圾回收机制重新设计，gc pause 时间大幅缩短

**20160217 [Go 1.6 is released][81]**

* 支持 http2
* gc pause 时间进一步缩短

**20160815 [Go 1.7 is released][82]**

* 引入 context
* gc pause 时间进一步缩短

**20170216 [Go 1.8 is released][83]**

* gc pause 时间缩短到10毫秒级

**20170824 [Go 1.9 is released][84]**

* 支持 type aliases 
* sync 提供了并发安全的 map 

**20180216 [Go 1.10 is released][85]**

**20180824 [Go 1.11 is released][86]**

* 支持 go module
* 支持 WebAssembly（在浏览器中运行）

**20190225 [Go 1.12 is released][87]**

**20190903 [Go 1.13 is released][88]** 
 
* go module 成为默认设置

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
[34]: https://blog.golang.org/strings  "Strings, bytes, runes and characters in Go"
[35]: https://blog.golang.org/normalization "Text normalization in Go"
[36]: https://blog.golang.org/cover "The cover story"
[37]: https://blog.golang.org/playground  "Inside the Go Playground"
[38]: https://blog.golang.org/pipelines "Go Concurrency Patterns: Pipelines and cancellation"
[39]: https://blog.golang.org/context "Go Concurrency Patterns: Context"
[40]: https://blog.golang.org/constants "Constants"
[41]: https://blog.golang.org/generate "Generating code"
[42]: https://blog.golang.org/examples "Testable Examples in Go"
[43]: https://blog.golang.org/go15gc "Go GC: Prioritizing low latency and simplicity"
[44]: https://blog.golang.org/matchlang "Language and Locale Matching in Go"
[45]: https://blog.golang.org/go1.7-binary-size "Smaller Go 1.7 binaries"
[46]: https://blog.golang.org/subtests "Using Subtests and Sub-benchmarks"
[47]: https://blog.golang.org/http-tracing "Introducing HTTP Tracing"
[48]: https://blog.golang.org/h2push "HTTP/2 Server Push"
[49]: https://blog.golang.org/toward-go2 "Toward Go 2"
[50]: https://blog.golang.org/ismmkeynote "Getting to Go: The Journey of Go's Garbage Collector"
[51]: https://blog.golang.org/wire "Compile-time Dependency Injection With Go Cloud's Wire"
[52]: https://blog.golang.org/go2-here-we-come "Go 2, here we come!"
[53]: https://blog.golang.org/modules2019 "Go Modules in 2019"
[54]: https://blog.golang.org/go-developer-network "The New Go Developer Network"
[55]: https://blog.golang.org/using-go-modules "Using Go Modules"
[56]: https://blog.golang.org/go2-next-steps "Next steps toward Go 2"
[57]: https://blog.golang.org/why-generics "Why Generics?"
[58]: https://blog.golang.org/migrating-to-go-modules "Migrating to Go Modules"
[59]: https://blog.golang.org/module-mirror-launch "Module Mirror and Checksum Database Launched"
[60]: https://blog.golang.org/publishing-go-modules "Publishing Go Modules"
[61]: https://blog.golang.org/go1.13-errors "Working with Errors in Go 1.13"
[62]: https://blog.golang.org/v2-go-modules "Go Modules: v2 and Beyond"
[63]: https://blog.golang.org/versioning-proposal "A Proposal for Package Versioning in Go"
[64]: https://blog.golang.org/go.dev "Go.dev: a new hub for Go developers"
[65]: https://blog.golang.org/hello-china "Hello, 中国!"
[66]: https://blog.golang.org/introducing-go-playground "Introducing the Go Playground"
[67]: https://blog.golang.org/real-go-projects-smarttwitter-and-webgo "Real Go Projects: SmartTwitter and web.go"
[68]: https://blog.golang.org/godoc-documenting-go-code  "Godoc: documenting Go code"
[69]: https://blog.golang.org/go-for-app-engine-is-now-generally "Go for App Engine is now generally available"
[70]: https://blog.golang.org/from-zero-to-go-launching-on-google "From zero to Go: launching on the Google homepage in 24 hours"
[71]: https://blog.golang.org/go-and-google-cloud-platform "Go and the Google Cloud Platform"
[72]: https://blog.golang.org/appengine-dec2013 "Go on App Engine: tools, tests, and concurrency"
[73]: https://blog.golang.org/appengine-go111 "Announcing App Engine’s New Go 1.11 Runtime"
[74]: https://blog.golang.org/gcdk-whats-new-in-march-2019  "What's new in the Go Cloud Development Kit"
[75]: https://blog.golang.org/go-cloud "Portable Cloud Programming with Go Cloud"
[76]: https://blog.golang.org/go-version-1-is-released "Go version 1 is released"
[77]: https://blog.golang.org/go-version-1-is-released "Go 1.2 is released"
[78]: https://blog.golang.org/go1.3 "Go 1.3 is released"
[79]: https://blog.golang.org/go1.4 "Go 1.4 is released"
[80]: https://blog.golang.org/go1.5 "Go 1.5 is released"
[81]: https://blog.golang.org/go1.6 "Go 1.6 is released"
[82]: https://blog.golang.org/go1.7 "Go 1.7 is released"
[83]: https://blog.golang.org/go1.8 "Go 1.8 is released"
[84]: https://blog.golang.org/go1.9 "Go 1.9 is released"
[85]: https://blog.golang.org/go1.10 "Go 1.10 is released"
[86]: https://blog.golang.org/go1.11 "Go 1.11 is released"
[87]: https://blog.golang.org/go1.12 "Go 1.12 is released"
[88]: https://blog.golang.org/go1.13 "Go 1.13 is released"
