---
layout: default
title: "Go Modules：Go 1.11和1.12引入的新的依赖代码管理方法"
author: 李佶澳
createdate: "2019-05-05 15:42:04 +0800"
changedate: "2019-06-05 14:52:49 +0800"
categories: 编程
tags: golang
keywords: Go Modules,go.mod,go.sum,golang,go modules,Go代码依赖管理
description: "Go Modules是Go1.11和Go1.12引入的依赖代码管理方法，在Go 1.13中将成为默认的依赖管理方法。"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

Go 的依赖代码管理一直是个问题，先后出现了 godep、vendor、glide、dep 等一系列依赖代码管理工具，不同的项目根据各自的喜好选择了不同的方法，没有统一的标准。
除此之外，Go 的项目代码必须位于 $GOPATH 指定的路径中（或者建立符号链接）， 否则import 找不到当前项目中的 package。

>为了让项目代码可以位于任意目录：一种做法是准备一个用于编译的 docker 镜像，将当前目录代码挂载到 docker 容器的固定路径中，在容器中编译；另一种做法比较浪费，为每个项目准备一套 GOPATH 环境。

Go1.11 和 Go1.12 引入的 Go Modules 机制，同时解决了依赖代码管理和路径依赖的问题，在 Go 1.11 和 Go 1.12 中， Go Modules 不是默认设置，只能在 $GOPATH 外部使用。
Go 1.13 中 Go Modules 将成为默认的依赖管理方法，[Using Go Modules][1] 中有详细介绍。

Go Modules 的主要功能就四个： 添加依赖、更新依赖、删除依赖，以及多版本依赖。

## 初始化

Go Modules 的初始化命令为 `go mod init <ROOTPATH>`，在 $GOPATH 外部创建一个目录，然后初始化，项目的路径设置为 `exampe.com/hello`，引用该项目中的代码时使用这个前缀：

```sh
$ mkdir go-modules-example 
$ cd go-modules-example
$ go mod init example.com/hello        # 该项目代码的引用路径是 example.com/hello
go: creating new go.mod: module example.com/hello
```

项目下将生成一个 go.mod 文件，里面记录了 module 路径和 go 的版本，刚创建时没有依赖信息：

```sh
$ cat go.mod
module example.com/hello

go 1.12
```

对于 Go 1.11 和 Go 1.12，如果在 $GOPATH 中执行会遇到下面的错误：

```sh
$ go mod init example.com/hello
go: modules disabled inside GOPATH/src by GO111MODULE=auto; see 'go help modules'
```

## 自动加载依赖

在 go-modules-example 中创建一个 main.go，简单写几行代码，引入 "github.com/lijiaocn/golib/version"：

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

为了方便操作，创建一个Makefile：

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

编译或者 go test 运行测试代码时，默认拉取依赖代码的`最新版本`：

```sh
$ make
go build -ldflags "-X github.com/lijiaocn/golib/version.VERSION=1.0.0 -X github.com/lijiaocn/golib/version.COMPILE=2019-05-05/09:55:04"
go: finding github.com/lijiaocn/golib v0.0.1
go: downloading github.com/lijiaocn/golib v0.0.1
go: extracting github.com/lijiaocn/golib v0.0.1
```

依赖代码获取结束后，在 go.mod 中写入依赖关系，同时生成一个 go.sum 文件：

```sh
$ cat go.mod
module example.com/hello

go 1.12

require github.com/lijiaocn/golib v0.0.1
```

go.sum 中记录依赖代码的校验码，防止引入被污染的代码：

```sh
$ cat go.sum
github.com/lijiaocn/golib v0.0.1 h1:bC8xWHei7xTa8x65ShiPBNjVYXoxt6EDmnSUaGgRUW8=
github.com/lijiaocn/golib v0.0.1/go.mod h1:BUO0RF2eDlol519GuXLQtlku8pdUim0h+f6wvX/AsNk=
```

## 主动导入依赖

在使用 go modules 的项目目录中，用 go get 下载代码时，下载的代码自动添加到依赖中，例如：

```sh
$ go get github.com/lijiaocn/codes-go/01-02-hello
go: finding github.com/lijiaocn/codes-go/01-02-hello latest
go: finding github.com/lijiaocn/codes-go latest
go: downloading github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e
go: extracting github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e
```

go.mod 中增加了一行记录，新增的依赖被标注为 `indirect`，意思是在项目中还没有用到：

```sh
$ cat go.mod
module example.com/hello

go 1.12

require (
	github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e // indirect
	github.com/lijiaocn/golib v0.0.1
)
```

## 查看已添加依赖

`go list` 命令列出当前项目依赖的代码以及代码版本：

```sh
$ go list -m all
example.com/hello
github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e
github.com/lijiaocn/golib v0.0.1
```

## 依赖代码的存放

依赖代码既不在 GOPATH/src 目录中，也不在 vendor 目录（Go Moduels 不会创建 vendor 目录），而是在 `$GOPATH/pkg/mod` 目录中：

```sh
$ ls $GOPATH/pkg/mod/github.com/lijiaocn/
codes-go@v0.0.0-20180220071929-9290fe35de7e golib@v0.0.1

$ ls $GOPATH/pkg/mod/github.com/lijiaocn/golib@v0.0.1
config container generator terminal version virtio
```

如上所示，目录名中包含版本信息，例如 golib@v0.0.1。原始代码缓存在 `$GOPATH/pkg/mod/cache/download/` 目录中，用于避免重复下载：

```sh
$ ls $GOPATH/pkg/mod/cache/download/github.com/lijiaocn
codes-go golib

$ ls $GOPATH/pkg/mod/cache/download/github.com/lijiaocn/golib/@v
list           list.lock      v0.0.1.info    v0.0.1.lock    v0.0.1.mod     v0.0.1.zip     v0.0.1.ziphash
```

## 更换依赖的版本

依赖代码的版本更新很简单，直接用 go get 获取指定版本的依赖代码即可，例如将 lijiaocn/glib 更新到 v0.0.2：

```sh
$ go get github.com/lijiaocn/glib@v0.0.2
go: finding github.com/lijiaocn/golib v0.0.2
go: downloading github.com/lijiaocn/golib v0.0.2
go: extracting github.com/lijiaocn/golib v0.0.2
```

可以看到依赖的代码版本发生了变化：

```sh
$ go list -m all
example.com/hello
github.com/lijiaocn/codes-go v0.0.0-20180220071929-9290fe35de7e
github.com/lijiaocn/golib v0.0.2
```

## 删除未使用依赖

不再需要的依赖必须手动清除，执行 `go mod tidy`，清除所有未使用的依赖：

```sh
$ go mod tidy
```

```sh
$ go list -m all
example.com/hello
github.com/lijiaocn/golib v0.0.2
```

## 引用项目中的代码

在项目中创建一个 package：

```sh
$ tree display
display
└── display.go
```

使用初始化时定义的前缀，example.com/hello/display： 

```sh
import (
    "example.com/hello/display"
    "github.com/lijiaocn/golib/version"
    )
```

使用 Go Modules 后，无论项目位于哪个路径，都能找到 example.com/hello/display，import 使用的路径和项目所在的路径彻底解耦。

## 父子目录使用不同版本

[Using Go Modules][1] 中有一节是 `Adding a dependency on a new major version`，示例中引入了 v1.5.2 版本的 rsc.io/quote，和 v3.1.0 版本的 rsc.io/quote/v3：

```go
package hello

import (
    "rsc.io/quote"
    quoteV3 "rsc.io/quote/v3"
)

func Hello() string {
    return quote.Hello()
}

func Proverb() string {
    return quoteV3.Concurrency()
}
```

```sh
➜  rsc.io tree quote
quote
├── LICENSE
├── README.md
├── buggy
│   └── buggy_test.go
├── go.mod
├── go.sum
├── quote.go
├── quote_test.go
└── v3
    ├── go.mod
    ├── go.sum
    └── quote.go

2 directories, 10 files
```

特别注意，v3 是一个真实存在的子目录，且`必须是用 go modules 管理的`。

引用 1.5.2 版本的 rsc.io/quote 和 v3.1.0 版本的 rsc.io/quote/v3 ：

```sh
$ go get rsc.io/quote@v1.5.2
  ...
$ go get rsc.io/quote/v3@v3.1.0
  ...
```

可以看到两个版本同时存在：

```sh
$ go list -m rsc.io/q...
rsc.io/quote v1.5.2
rsc.io/quote/v3 v3.1.0
```

### 实例演示

实现一个用 go modules 管理的 package: [github.com/introclass/go_mod_example_pkg](https://github.com/introclass/go_mod_example_pkg)

在另一个使用 go modules 的项目中引用它：[github.com/introclass/go-mod-example](https://github.com/introclass/go-mod-example)

```sh
$ go get github.com/introclass/go_mod_example_pkg@v1.0.1
go: finding golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
go: finding github.com/introclass/go_mod_example_pkg v1.0.1
go: downloading github.com/introclass/go_mod_example_pkg v1.0.1
go: extracting github.com/introclass/go_mod_example_pkg v1.0.1
```

查看依赖的代码：

```sh
$ go list  -m all
example.com/hello
github.com/introclass/go_mod_example_pkg v1.0.1
github.com/lijiaocn/golib v2.0.1+incompatible
golang.org/x/text v0.0.0-20170915032832-14c0d48ead0c
rsc.io/quote v1.5.2
rsc.io/sampler v1.3.0
```

main 函数实现：

```sh
package main

import (
    "example.com/hello/display"
    pkg "github.com/introclass/go_mod_example_pkg"
    "github.com/lijiaocn/golib/version"
)

func main() {
    version.Show()
    display.Display("display print\n")
    pkg.Vesrion()
}
```

编译执行，输出的v1.0.1：

```sh
$ ./hello
version:    compile at:   golib v2
display print
v1.0.1
```

切换到版本2.0.1：

```sh
$ go get github.com/introclass/go_mod_example_pkg@v2.0.1
go: finding github.com/introclass/go_mod_example_pkg v2.0.1
```

重新编译执行，输出的版本是 v2.0.1：

```sh
$ ./hello
version:    compile at:   golib v2
display print
v2.0.1
```

引用 v3.0.1 版本的 v3子目录：

```sh
$ go get github.com/introclass/go_mod_example_pkg/v3@v3.0.1
go: finding github.com/introclass/go_mod_example_pkg/v3 v3.0.1
go: downloading github.com/introclass/go_mod_example_pkg/v3 v3.0.1
go: extracting github.com/introclass/go_mod_example_pkg/v3 v3.0.1
```

修改 main 函数，引用 v3：

```sh
package main

import (
    "example.com/hello/display"
    pkg "github.com/introclass/go_mod_example_pkg"
    pkgv3 "github.com/introclass/go_mod_example_pkg/v3"
    "github.com/lijiaocn/golib/version"
)

func main() {
    version.Show()
    display.Display("display print\n")
    pkg.Vesrion()
    pkgv3.Vesrion()
}
```

重新编译执行，分别输出 v2.0.1 和 v3.0.1 ：

```sh
$ ./hello
version:    compile at:   golib v2
display print
v2.0.1
v3.0.1 in v3
```

## 需要注意的坑

1、如果要引用不同版本的父子目录，被引用的父子目录必须是用 go mod 管理的；

2、go mod 会在本地缓存代码，如果被引用的代码的版本号不变，但是代码变了，需要清除本地缓存（ $GOPATH/pkg/mod/cache 和 $GOPATH/pkg/mod/ 依赖代码 ）才能获取更新后代码；

3、go.mod 中设置的 package 路径与代码的获取地址相同，才能被其它项目引用（当前项目不受限制），[github.com/introclass/go-mod-example](https://github.com/introclass/go-mod-example) 的 go.mod 中标注的是 example.com/hello，代码实际存放在 github 上，在另一个项目中加载它的 github 地址会失败：

```sh
$ go get github.com/introclass/go-mod-example
go: finding github.com/introclass/go-mod-example latest
go: github.com/introclass/go-mod-example@v0.0.0-20190605063729-4a841a8278e3: parsing go.mod: unexpected module path "example.com/hello"
go: error loading module requirements
```

## 与IDE的结合

### IntelliJ IDEA/Goland

在 IntelliJ IDEA 或者 Goland 中（`需要是最新的2019.1版本`）导入使用 Go Module 的项目的时候，要选择 `Go Module（vgo）`，否则 IDE 找不到 import 导入的代码，[create-a-project-with-vgo-integration][3] 有更多介绍：

![IntelliJ IDEA/Goland 中创建 Go Module 项目]({{ site.imglocal }}/article/goland_create_vgo_project.png)

在 IntelliJ IDEA/Goland 显示的依赖代码，带有版本号或者 commit id：

![IntelliJ IDEA/Goland中的显示的依赖代码]({{ site.imglocal }}/article/goland_import_pkg.png)

### vim

vim插件 [vim-go](https://github.com/fatih/vim-go/issues/1906) 从 v1.19 开始支持 go.mod，但是代码跳转等还不支持。

所有使用 GOPATH 进行代码跳转的工具都需要被更新，[cmd/go: track tools/tooling updates to support modules][4] 列出了它们对 go module 的支持情况。

## 参考

1. [Using Go Modules][1]
2. [Where is the module cache in golang?][2]
3. [create-a-project-with-vgo-integration][3]
4. [cmd/go: track tools/tooling updates to support modules][4]

[1]: https://blog.golang.org/using-go-modules "Using Go Modules"
[2]: https://stackoverflow.com/questions/52126923/where-is-the-module-cache-in-golang "Where is the module cache in golang?"
[3]: https://www.jetbrains.com/help/go/create-a-project-with-vgo-integration.html "create-a-project-with-vgo-integration"
[4]: https://github.com/golang/go/issues/24661 "cmd/go: track tools/tooling updates to support modules"
