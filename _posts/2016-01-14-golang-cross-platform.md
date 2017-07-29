---
layout: default
title: Golang的跨平台编译
author: lijiaocn
createdate: 2017/03/28 16:17:36
changedate: 2017/06/18 11:34:11
categories: 编程
tags: golang
keywords: golang编译
description:  可以在一台机器上同时编译能够在其它系统、其它类型CPU上运行的二进制程序。

---

* auto-gen TOC:
{:toc}


可以在一台机器上同时编译能够在其它系统、其它类型CPU上运行的二进制程序。

通过环境变量设置：

	GOARCH:    目标CPU结构，amd64, 386, arm, ppc64, mips, mipsle, mips64, mpis64le
	GOOS:      目标操作系统，linux, darwin, windows, netbsd

编译在linux上运行amd64程序：

	GOARCH=amd64 GOOS=linux  go build

可以查看所有支持的架构：

	go tool dist list

## 参考

1. [golang enviroment var][1]

[1]: https://golang.org/cmd/go/#hdr-Environment_variables "golang enviroment var"
