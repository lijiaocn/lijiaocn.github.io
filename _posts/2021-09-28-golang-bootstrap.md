---
layout: default
title: "Go语言程序的运行前引导过程分析"
author: 李佶澳
date: "2021-09-28 18:44:58 +0800"
last_modified_at: "2021-09-28 18:44:58 +0800"
categories: 编程
cover:
tags: golang
keywords: golang,连接,引导,加载器,链接器
description: main 不是最早的执行入口，表面上呈现的效果是从 main 开始执行，实际前面还有一段复杂引导过程
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

简单探究下 Go 语言程序的引导过程，这里只进行粗略的分析，理清的大概的脉络。受到知识水平和可投入时间的限制，细节部分可能有偏差。

## 从编译链接过程推导

C/C++ 语言编译分为`编译`和`连接`两步，第一步是把单个代码文件翻译成二进制，第二步是将多个二进制组装成可执行文件。Go 语言程序的编译过程整体上也可以分为这两步（内部分为更多步骤）。

下面以一个空 main 函数为例，用这段代码编译得到的程序是一开始就从 main 开始执行的吗？

```go
// main_empty.go
package main

func main() {
}

```

答案是 No。表面上给编码人员呈现的效果是从 main 开始执行的，实际上前面还有一段复杂引导过程，main 不是最早的执行入口。需要逐步理解这个问题：

### 第一步：编译成.obj 文件

go 命令自带的 [compile][2] 编译器将输入的 .go 文件编译成 obj 文件：

```sh
$ go tool compile main_empty.go
$ file main_empty.o                  // 编译得到 .o 文件
main_empty.o: current ar archive
```

compile 编译时到 $GOROOT/pkg/$GOOS_$GOARCH 中查找代码中的 import 的代码对应的链接库。 go 默认提供的静态链接库都放置在这个目录下：

```sh
$ ls -F $GOROOT/pkg/darwin_amd64
archive/    database/   go/         internal/   mime.a      reflect.a   sync/       unicode.a
bufio.a     debug/      hash/       io/         net/        regexp/     sync.a      vendor/
bytes.a     encoding/   hash.a      io.a        net.a       regexp.a    syscall.a
compress/   encoding.a  html/       log/        os/         runtime/    testing/
container/  errors.a    html.a      log.a       os.a        runtime.a   testing.a
context.a   expvar.a    image/      math/       path/       sort.a      text/
crypto/     flag.a      image.a     math.a      path.a      strconv.a   time.a
crypto.a    fmt.a       index/      mime/       plugin.a    strings.a   unicode/
```

### 第二步：连接成可执行文件

go 命令自带的 [link][3] 链接器自动目标文件 obj 文件以及它依赖的 obj 文件组装成可执行文件：

```sh
$ go tool link -o main_empty.out main_empty.o
$ file main_fmt.out                              // 链接后得到可执行文件
main_fmt.out: Mach-O 64-bit executable x86_64
```

### go 编译链接时动的手脚

go 在编译和链接时，动了一些手脚。它编译出来的 obj 文件默认依赖 runtime.a，即使没有引用任何代码库，如同上面的空 main，编译得到的 obj 文件也会依赖一个 runtime.a 文件。

用 link 查看 obj 文件的依赖：

```sh
$ go tool link -dumpdep  main_empty.o 
_ -> _rt0_amd64_darwin
_rt0_amd64_darwin -> _rt0_amd64
_rt0_amd64 -> runtime.rt0_go
runtime.rt0_go -> runtime.g0
runtime.rt0_go -> runtime.isIntel
runtime.rt0_go -> runtime.lfenceBeforeRdtsc
runtime.rt0_go -> runtime.processorVersionInfo
runtime.rt0_go -> _cgo_init
runtime.rt0_go -> setg_gcc
...省略...

```

可以看到依赖的大量的 runtime.XX，runtime 中的隐藏着真正的执行入口。

### 查阅 runtime 代码

如果安装的带源代码的 go，runtime 代码在 go 的安装目录中（或者到 github 上查看 [runtime][4]：

```sh
$ ls $GOROOT/src/runtime/     
...省略大量代码...
```

runtime 中有很多个 .s 结尾的汇编代码，这些汇编代码才是真正的入口，它们分别对应不同 cpu 架构：

![runtime中的汇编代码]({{ site.article }}/go-bootstrap.png)


### 从汇编代码到 main

汇编代码的执行逻辑没有完全搞明白 asm_amdd64.s，结合从其它资料看到的内容，推测出这些汇编代码最终会触发 runtime/proc.go:main 的执行：

```go
//go:linkname main_main main.main
func main_main()

...省略...

// The main goroutine.
func main() {
	g := getg()
	
	...省略...
	
	fn := main_main // make an indirect call, as the linker doesn't know the address of the main package when laying down the runtime
	fn()
	
	...省略...
```

main_main 即 main.main，是 package main 中的 main 函数。

## 汇编引导代码详细分析

这部分涉及到操作系统的程序加载过程，需要熟读汇编代码和 CPU 指令，以后有时间再研究...

## 参考

1. [李佶澳的博客][1]
2. [go tool compile][2]
3. [go tool link][3]
4. [go src/runtime/][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://pkg.go.dev/cmd/compile "go tool compile"
[3]: https://pkg.go.dev/cmd/link "go tool link"
[4]: https://github.com/golang/go/tree/master/src/runtime/ "src/runtime/"
