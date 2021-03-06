---
layout: default
title: go的子命令与工具
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

## go的全部子命令

运行命令go，就可以看到go的子命令：

	$go
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

[Command go][1]中做了详细介绍。

出了这些子命令，go还有一些特殊用途的工具,`go tool`可以看到这些工具：

	$go tool
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

[Go's Tools][2]中介绍了这些工具。

## generate

generate用来执行代码注释指定的命令：

	//go:generate command argument...

command是任意指定的，通常用来对代码预先处理。`go generate`必须手动执行，`go build`等不会自动触发generate的运行。

## 参考

1. [Command go][1]

[1]: https://golang.org/cmd/go/  "Command go" 
[2]: https://golang.org/cmd/ "Go's Tools"
