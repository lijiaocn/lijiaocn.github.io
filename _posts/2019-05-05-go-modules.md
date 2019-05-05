---
layout: default
title: "Go 1.11和1.12引入的新的依赖代码管理方法：Go Modules"
author: 李佶澳
createdate: "2019-05-05 15:42:04 +0800"
changedate: "2019-05-05 19:41:38 +0800"
categories: 编程
tags: golang
keywords: Go Modules,go.mod,go.sum,golang,go modules,Go代码依赖管理
description: "Go Modules是Go1.11和Go1.12引入的依赖代码管理方法，在Go 1.13中将成为默认的依赖管理方法。"
---

* auto-gen TOC:
{:toc}

## 说明

Go语言的依赖代码管理一直都不简洁，先后出现了godep、vendor、glide、dep等一系列依赖代码管理工具，每个项目都根据各自的喜好选择，没有一个统一的标准。

项目必须位于GOPATH指定的路径中也是一个小困扰，如果项目所在的路径和代码中import指定的路径不同，编译时会找不到对应的文件。
因此只将项目代码保存到git等源码管理工具中是不行的，还要提供项目的路径信息。

我见过的最极端的做法是一个项目就是一个完全自治的GOPATH目录，src/bin/pkg一应俱全，每次构建项目时重新设置GOPATH，这种做法会导致本地存放有大量冗余的代码。

Go Modules是Go1.11和Go1.12引入的依赖代码管理方法，在Go 1.13中将成为默认的依赖管理方法，似乎能够让Go的依赖代码管理更加简洁、统一，[Using Go Modules][1]中详细介绍。

主要功能就四个： 添加依赖、更新依赖、删除依赖，以及多版本依赖。

## 初始化

在$GOPATH目录之外创建一个目录，Go1.11和Go1.12只能在$GOPATH以外的目录中使用Go Modules方法，$GOPATH中的目录依旧使用原先的依赖管理以及代码引入方式，要等到Go1.13才会全部统一为Go Modules方式。 

Go Modules的初始化命令为`go mod init <ROOTPATH>`，如果在$GOPATH中执行会遇到下面的错误：

```sh
$ go mod init example.com/hello
go: modules disabled inside GOPATH/src by GO111MODULE=auto; see 'go help modules'
```

在$GOPATH外创建一个目录，然后初始化，项目的路径设置为`exampe.com/hello`，引用该项目中的pkg时要使用这个前缀：

```sh
$ mkdir go-modules-example && cd go-modules-example
$ go mod init example.com/hello
go: creating new go.mod: module example.com/hello
```

项目下生成一个go.mod文件，里面记录了module路径和go的版本，现在还没有依赖信息：

```sh
$ cat go.mod
module example.com/hello

go 1.12
```

## 添加依赖

在项目目录go-modules-example中创建一个main.go，简单写几行代码，依赖"github.com/lijiaocn/golib/version"：

```go
// Create: 2019/05/05 16:53:00 Change: 2019/05/05 16:56:53
// FileName: main.go
// Copyright (C) 2019 lijiaocn <lijiaocn@foxmail.com>
//
// Distributed under terms of the GPL license.

package main

import (
    "github.com/lijiaocn/golib/version"
)

func main() {
    version.Show()
}
```

为了方便创建一个Makefile：

```make
# Makefile
# lijiaocn, 2019-05-05 16:56
#

VERSION=1.0.0
COMPILE=$(shell date -u "+%Y-%m-%d/%H:%M:%S")

all: build
build:
	go build -ldflags "-X github.com/lijiaocn/golib/version.VERSION=${VERSION} -X github.com/lijiaocn/golib/version.COMPILE=${COMPILE}"
```

### 编译时自动设置依赖

编译或者go test运行测试代码时（如果有测试代码），会自动拉取依赖代码的最新版本：

```sh
$ make
go build -ldflags "-X github.com/lijiaocn/golib/version.VERSION=1.0.0 -X github.com/lijiaocn/golib/version.COMPILE=2019-05-05/09:55:04"
go: finding github.com/lijiaocn/golib v0.0.1
go: downloading github.com/lijiaocn/golib v0.0.1
go: extracting github.com/lijiaocn/golib v0.0.1
```

从上面的输出可以看出，本地没有依赖的代码的时候会自动下载`最新的代码`，依赖代码获取结束后，在go.mod中写入依赖关系，同时生成一个go.sum文件：

```sh
$ cat go.mod
module example.com/hello

go 1.12

require github.com/lijiaocn/golib v0.0.1
```

go.sum文件中记录依赖代码的校验码，用来确保其他人自动依赖代码时，取得的代码的内容是正确的（主要是为了防止引入被污染的依赖代码）：

```sh
$ cat go.sum
github.com/lijiaocn/golib v0.0.1 h1:bC8xWHei7xTa8x65ShiPBNjVYXoxt6EDmnSUaGgRUW8=
github.com/lijiaocn/golib v0.0.1/go.mod h1:BUO0RF2eDlol519GuXLQtlku8pdUim0h+f6wvX/AsNk=
```

### 导入未使用的依赖

必须要先写代码引用依赖，才能添加依赖代码吗？

不是的，直接用go get下载的代码也会被自动添加到依赖中，例如获取一套项目代码中没有用到的代码：

```sh
$ go get github.com/lijiaocn/codes-go/01-02-hello
go: finding github.com/lijiaocn/codes-go/01-02-hello latest
go: finding github.com/lijiaocn/codes-go latest
go: downloading github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e
go: extracting github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e
```

go.mod中同样会添加一个依赖，这个新增的依赖被标注为`indirect`，意思是没有被直接引用：

```sh
$ cat go.mod
module example.com/hello

go 1.12

require (
	github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e // indirect
	github.com/lijiaocn/golib v0.0.1
)
```

### 查看项目依赖

`go list`命令列出依赖的代码以及代码版本：

```sh
$ go list -m all
example.com/hello
github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e
github.com/lijiaocn/golib v0.0.1
```

### 依赖代码的存放位置

下载的依赖代码既不在GOPATH/src目录中，也不在vendor目录（Go Moduels不会创建vendor目录），而是在`$GOPATH/pkg/mod`目录里：

```sh
$ ls $GOPATH/pkg/mod/github.com/lijiaocn/
codes-go@v0.0.0-20180220071929-9290fe35de7e golib@v0.0.1

$ ls $GOPATH/pkg/mod/github.com/lijiaocn/golib@v0.0.1
config    container generator terminal  version   virtio
```

注意依赖代码所在的目录名中包含版本信息，这是能够同时依赖一套代码的多个版本的基础。

`$GOPATH/pkg/mod/cache/download/`缓存有下载的原始代码，用来避免重复下载：

```sh
$ ls $GOPATH/pkg/mod/cache/download/github.com/lijiaocn
codes-go golib

$ ls $GOPATH/pkg/mod/cache/download/github.com/lijiaocn/golib/@v
list           list.lock      v0.0.1.info    v0.0.1.lock    v0.0.1.mod     v0.0.1.zip     v0.0.1.ziphash
```

## 更新依赖

依赖的更新很简单，直接用go get获取指定版本的依赖代码即可，例如依赖代码lijiaocn/glib更新到了最新版本v0.0.2：

```sh
$ go get github.com/lijiaocn/glib@v0.0.2
go: finding github.com/lijiaocn/golib v0.0.2
go: downloading github.com/lijiaocn/golib v0.0.2
go: extracting github.com/lijiaocn/golib v0.0.2
```

```sh
$ go list -m all
example.com/hello
github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e
github.com/lijiaocn/golib v0.0.2
```

## 删除依赖

在编译的时候可以自动添加依赖，但不能自动删除不需要的依赖，不需要的依赖必须用单独的命令清除，执行`go mod tidy`： 

```sh
$ go mod tidy
```

前面引入的未使用的依赖被删除了：

```sh
$ go list -m all
example.com/hello
github.com/lijiaocn/golib v0.0.2
```

## 引用项目中的package

在项目中定义一个子package：

```sh
$ tree display
display
└── display.go
```

引用的时候使用初始化时定义的前缀example.com/hello： 

```sh
import (
	"example.com/hello/display"
	"github.com/lijiaocn/golib/version"
	)
```

无论项目在哪里，对display的引用都是成功，和项目所处的路径彻底解耦。

## 引入一个项目的多个主版本

[Using Go Modules][1]中有一节是`Adding a dependency on a new major version`，可以同时引入v1.5.2版本的rsc.io/quote，和v3.1.0版本的rsc.io/quote/v3。

试验了以下，引用rsc.io/quote是可以的：

```sh
$ go get rsc.io/quote@v1.5.2
  ...
$ go get rsc.io/quote/v3@v3.1.0
  ...
```

两个版本同时存在：

```sh
$ go list -m rsc.io/q...
rsc.io/quote v1.5.2
rsc.io/quote/v3 v3.1.0
```

但是引用自己定义的package的时候，譬如github.com/lijiaocn/golib/version/v1和github.com/lijiaocn/golib/version/v1，会被合并成一个依赖github.com/lijiaocn/golib。

将自己的package与rsc.io/quote对比了下，区别是rsc.io/quote和rsc.io/quote/v3本身是用Go Modules管理的，这个特性似乎只能在Go Modules引用Go Modules的情况下使用。时间关系，没有继续试验，有需求的时候再试验下。

## 参考


1. [Using Go Modules][1]
2. [Where is the module cache in golang?][2]

[1]: https://blog.golang.org/using-go-modules "Using Go Modules"
[2]: https://stackoverflow.com/questions/52126923/where-is-the-module-cache-in-golang "Where is the module cache in golang?"
