---
layout: default
title: go程序的调试方法
author: 李佶澳
createdate: 2017/05/18 16:24:37
changedate: 2017/08/28 15:09:13
categories: 编程
tags: golang
keywords: golang,编程,debug,调试
description: gdb不能完全的理解golang程序, 只能够用来解决部分问题，如果程序是并发的

---

## 目录
* auto-gen TOC:
{:toc}

## gdb 

[Debugging Go Code with GDB][1]介绍了如何使用gdb调试go开发的程序。

gdb不能完全的理解golang程序, 只能够用来解决部分问题，如果程序是并发的，gdb能够发挥的作用就更小了。

使用golang的gc工具链编译的程序默认包含DWARF3调试信息，gdb能够使用这些信息去调试一个运行的进程或者core dump。

如果要去掉DWARF3信息：

	go build -ldflags "-w" prog.go

gc会默认对inline函数等进行优化，从而增加了使用gdb调试的困难，可以在编译时禁止这些优化：

	go build -gcflags "-N -l"  prog.go

## 参考

1. [Debugging Go Code with GDB][1]

[1]: https://golang.org/doc/gdb  "Debugging Go Code with GDB" 
