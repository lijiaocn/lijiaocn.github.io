---
layout: default
title: go语言语法实例
author: lijiaocn
createdate: 2017/11/15 10:49:40
changedate: 2017/11/15 11:22:23
categories: 编程
tags: go
keywords: go语法,语法实例
description: 这里简单记录go的一些常用语法

---

* auto-gen TOC:
{:toc}

## 说明

C语言是我的第一门编程语言，也是学的最认真、语法记得最牢靠的一门语言。之后接触的其它编程语言，几乎记不住它们的哪怕是最基本的语法。每次在脱离几个月后，就忘得干干净净，所以需要一个手册。

直接阅读[Go Language Specification][1]是痛苦的。不信，你就去看[The Go Programming Language Specification][3]。所以还是结合实际例子记录一下最好，好在最常用的语法、特性并不多。

注意，文中给出的Go Spec超链接是`连接到本地的`（127.0.0.1:8080）！要访问这些连接，你需要在你的本地运行:

	godoc -http=:8080 &

为什么要这样做？因为golang.org被墙了啊，亲。

## 指针－Pointer Type

Go是支持指针的，[Go Spec: Pointer Type][1]中指针类型这样定义：

	PointerType = "*" BaseType .
	BaseType    = Type .

支持指针，就要支持地址运算，[Go Spec: Address_operators][4]：

	&x
	&a[f(2)]
	&Point{2, 3}
	*p
	*pf(x)
	
	var x *int = nil
	*x   // causes a run-time panic
	&*x  // causes a run-time panic

`&`用来获取变量的地址，`*`用来获取指针指向的变量，对nil取变量会引发panic。

example code: 

	package main
	
	import (
		"fmt"
		"reflect"
	)
	
	func main() {
		str := "abc"
		strp := &str
	
		fmt.Printf("str type: %s\n", reflect.TypeOf(str))
		fmt.Printf("strp type: %s\n", reflect.TypeOf(strp))
		fmt.Printf("*str type: %s\n", reflect.TypeOf(*strp))
	}

execute output: 

	str type: string
	strp type: *string
	*str type: string

## 参考

1. [Go Language Specification][1]
2. [Go Spec: Pointer Type][2]
3. [The Go Programming Language Specification][3]
4. [Go Spec: Address_operators][4]

[1]: http://127.0.0.1:8080/ref/spec  "Go Language Specification"
[2]: http://127.0.0.1:8080/ref/spec#Pointer_types  "Go Spec: Pointer Type" 
[3]: http://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2017/04/28/golang-specification.html "The Go Programming Language Specification"
[4]: https://127.0.0.1:8080/ref/spec#Address_operators
