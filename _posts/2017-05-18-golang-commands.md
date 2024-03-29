---
layout: default
title: Golang 的子命令
author: 李佶澳
createdate: 2017/05/18 16:00:04
last_modified_at: 2017/05/18 19:47:04
categories: 编程
tags: golang
keywords: golang,编译
description: golang有多个子命令，其中一些子命令有比较有趣的用途。

---

## 目录
* auto-gen TOC:
{:toc}

## Go 的全部子命令

运行 go，就可以看到 go 的所有子命令：

```sh
$ go
Go is a tool for managing Go source code.

Usage:
    
    go command [arguments]
    
The commands are:
    
    build       compile packages and dependencies
    clean       remove object files
    doc         show documentation for package or symbol
    env         print Go environment information
    fix         run go tool fix on packages
    fmt         run gofmt on package sources
    generate    generate Go files by processing source
    get         download and install packages and dependencies
    install     compile and install packages and dependencies
    list        list packages
    run         compile and run Go program
    test        test packages
    tool        run specified go tool
    version     print Go version
    vet         run go tool vet on packages
    
Use "go help [command]" for more information about a command.
```

其中`go tool` 进一步包含了其它子命令：

```sh
$ go tool
addr2line
api
asm
cgo
compile
cover
dist
doc
fix
link
nm
objdump
pack
pprof
trace
vet
yacc
```

[Go's Tools][2]、[Command go][1] 中介绍了这些子命令的用法。

## go tool compile：编译器


## generate

generate用来执行代码注释指定的命令：

```go
//go:generate command argument...
```

command是任意指定的，通常用来对代码预先处理。`go generate`必须手动执行，`go build`等不会自动触发generate的运行。


## 查看依赖包引入原因：go mod why 

用 `go mod why` 查看为什么会依赖 github.com/shirou/gopsutil：

```sh
 go mod why github.com/shirou/gopsutil 
XXX.XXX.XXX/x/xx/dal/db imports
        XXX.XXX.XXX/aweme-go/ktest/mock imports
        XXX.XXX.XXX/edu/memongo imports
        XXX.XXX.XXX/edu/memongo/mongobin imports
        github.com/spf13/afero imports
        io/fs: package io/fs is not in GOROOT (/Users/xx/Work/Bin/go-1.14.2/go/src/io/fs)
XXX.XXX.XXX/x/xx/dal/db imports
        XXX.XXX.XXX/aweme-go/ktest/mock imports
        XXX.XXX.XXX/edu/memongo imports
        XXX.XXX.XXX/edu/memongo/mongobin imports
        github.com/spf13/afero tested by
        github.com/spf13/afero.test imports
        testing/fstest: package testing/fstest is not in GOROOT (/Users/xx/Work/Bin/go-1.14.2/go/src/testing/fstest)
```

## 参考

1. [Command go][1]

[1]: https://pkg.go.dev/cmd/go  "Command go" 
[2]: https://pkg.go.dev/cmd  "Go's Tools"
