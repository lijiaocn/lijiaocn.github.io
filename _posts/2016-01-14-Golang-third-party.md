---
layout: default
title: Golang的依赖包管理
author: lijiaocn
createdate: 2017/03/28 13:05:05
changedate: 2017/05/12 11:04:02
categories:
tags: 编程
keywords: Go编程,依赖包
description:  Golang依赖包管理，Golang可以自由地引用Git仓库中的代码，这样就带来了依赖包版本管理的问题。

---

* auto-gen TOC:
{:toc}

Golang可以自由地引用Git仓库中的代码，这样就带来了依赖包版本管理的问题。

## Godep

早期Golang本身没有提供依赖包管理的功能，可以通过一个独立的[Godep][2]工具进行管理。

通过以下命令，可以直接保存项目引用的第三方代码以及版本信息:

	godep save          #保存当前目录下的go文件(不遍历子目录)引用的第三方代码
	godep save ./...    #保存当前目录以及子目录下的go文件引用的第三方代码

在Golang 1.5之前，Godep将版本信息和第三方代码保存的Godeps目录下。

在Golang 1.5以后，Godep将版本信息保存在Godeps目录中,将第三方代码保存在vendor目录。

## vendor

vendor是1.5中的一个试验特性，在1.6版本中被正式引入。编译过程中，会先引用vendor目录中的代码。

对于同样的代码main.go:

	package main
	
	import (
	    "github.com/lijiaocn/GoPkgs/version"
	)
	
	func main() {
	    version.Show()
	}

没有vendor之前，项目vendor_test目录结构如下:

	▾ vendor_test/
	  ▾ main/
	      main.go

main.go中引用的是$GOPATH/github.com/lijiaocn/GoPkgs/version中的文件。

使用vendor之后，目录结构如下：

	▾ vendor_test/
	  ▸ Godeps/
	  ▾ main/
	      main.go
	  ▾ vendor/
	    ▾ github.com/
	      ▾ lijiaocn/
	        ▾ GoPkgs/
	          ▸ version/
	            LICENSE

main.go中引用的是vendor/github.com/lijiaocn/GoPkgs/version中的文件。

不需要对main.go做任何修改。

## 参考

1. [golang vendor directory][1]
2. [Godep][2]
3. [Go 1.5 Vendor Experiment][3]
4. [golang cmd][4]

[1]: https://golang.org/cmd/go/#hdr-Vendor_Directories  "golang vendor directory"
[2]: https://github.com/tools/godep "godep"
[3]: https://docs.google.com/document/d/1Bz5-UB7g2uPBdOx-rw5t9MxJwkfpx90cqG9AFL0JAYo/edit "Go 1.5 Vendor Experiment"
[4]: https://golang.org/cmd/go/ "golang cmds"
