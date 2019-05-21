---
layout: default
title: go的编译过程、选项、以及二进制包
author: 李佶澳
createdate: 2017/08/23 15:17:53
changedate: 2018/08/13 10:56:16
categories: 编程
tags: golang
keywords: golang,binary-only,package
description: binary-only-package特性，使二进制的形式发布代码库成为可能。

---

## 目录
* auto-gen TOC:
{:toc}

## binary-only-package

[Binary-Only Packages][1]是golang1.7增加的特性:

	It is possible to distribute packages in binary form without including the source code 
	used for compiling the package. To do this, the package must be distributed with a 
	source file not excluded by build constraints and containing a "//go:binary-only-package"
	comment. Like a build constraint, this comment must appear near the top of the file, 
	preceded only by blank lines and other line comments and with a blank line following the 
	comment, to separate it from the package documentation. Unlike build constraints, this 
	comment is only recognized in non-test Go source files. 

### 例子

[example code][2]:

	▾ binary-only-pkg/
	  ▸ p/
	  ▸ p_bin/
	  ▸ p_src/
	    main.go
	    Makefile

main.go中引用了p:

	import (
		"github.com/lijiaocn/study-Golang/study/binary-only-pkg/p"
	)

首先用p_src中的源码编译得到.a文件:

	WORKDIR=github.com/lijiaocn/study-Golang/study/binary-only-pkg
	
	install: 
		rm -rf p; cp -rf p_src p
		go build -o ${GOPATH}/pkg/${WORKDIR}/p.a -i ${WORKDIR}/p

然后用p_bin中的文件编译:

	build: 
		rm -rf p; cp -rf p_bin p
		go build

可以看到在p_bin/package.go是一个空的package的情况，就可以完成编译：

	$cat p_bin/package.go
	//go:binary-only-package
	
	package p

注意，中间的空行必须存在，否则报错。

## 禁用CGO

Golang实现了自己的runtime，也支持调用C的runtime，默认启动CGO：

	CGO_ENABLED=1

启动用CGO后，编译的程序可能需要连接外部的.so，可以将CGO禁用以得到静态连接的程序:

	CGO_ENABLED=0 go build

[也谈Go的可移值性][2]中做了很好的介绍。

## 跨平台编译

Golang适应的平台非常广泛，可以通过`go tool dist list`查看支持的平台:

	$ go tool dist list
	android/386
	android/amd64
	android/arm
	android/arm64
	darwin/386
	darwin/amd64
	darwin/arm
	darwin/arm64
	dragonfly/amd64
	freebsd/386
	freebsd/amd64
	freebsd/arm
	linux/386
	linux/amd64
	linux/arm
	linux/arm64
	linux/mips
	linux/mips64
	linux/mips64le
	linux/mipsle
	linux/ppc64
	linux/ppc64le
	linux/s390x
	nacl/386
	nacl/amd64p32
	nacl/arm
	netbsd/386
	netbsd/amd64
	netbsd/arm
	openbsd/386
	openbsd/amd64
	openbsd/arm
	plan9/386
	plan9/amd64
	plan9/arm
	solaris/amd64
	windows/386
	windows/amd64

编译的时候通过环境变量`GOARCH`和`GOOS`指定目标平台，例如:

	GOARCH=amd64 GOOS=linux go build

## 参考

1. [Binary-Only Packages][1]
2. [example code][2]
3. [也谈Go的可移植性][3]
4. [golang enviroment var][4]

[1]: https://tip.golang.org/pkg/go/build/#hdr-Binary_Only_Packages  "Binary-Only Packages" 
[2]: https://github.com/lijiaocn/study-Golang/tree/master/study/binary-only-pkg  "example code"
[3]: http://tonybai.com/2017/06/27/an-intro-about-go-portability/ "也谈Go的可移植性"
[4]: https://golang.org/cmd/go/#hdr-Environment_variables "golang enviroment var"
