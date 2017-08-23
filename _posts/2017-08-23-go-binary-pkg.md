---
layout: default
title: golang使用二进制包，binary-only package
author: lijiaocn
createdate: 2017/08/23 15:17:53
changedate: 2017/08/23 16:05:58
categories: 编程
tags: golang
keywords: golang,binary-only,package
description: binary-only-package特性，使二进制的形式发布代码库成为可能。

---

* auto-gen TOC:
{:toc}

## 说明

[Binary-Only Packages][1]是golang1.7增加的特性:

	It is possible to distribute packages in binary form without including the source code 
	used for compiling the package. To do this, the package must be distributed with a 
	source file not excluded by build constraints and containing a "//go:binary-only-package"
	comment. Like a build constraint, this comment must appear near the top of the file, 
	preceded only by blank lines and other line comments and with a blank line following the 
	comment, to separate it from the package documentation. Unlike build constraints, this 
	comment is only recognized in non-test Go source files. 

## 例子

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

## 参考

1. [Binary-Only Packages][1]
2. [example code][2]

[1]: https://tip.golang.org/pkg/go/build/#hdr-Binary_Only_Packages  "Binary-Only Packages" 
[2]: https://github.com/lijiaocn/study-Golang/tree/master/study/binary-only-pkg  "example code"
