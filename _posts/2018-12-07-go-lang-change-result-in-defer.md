---
layout: default
title: "Go：在defer指定的函数中修改返回值会出现的几种情况"
author: 李佶澳
createdate: "2018-12-07 10:54:23 +0800"
last_modified_at: "2018-12-07 10:54:23 +0800"
categories: 编程
tags: golang
keywords: go,返回值,defer函数
description: "Go语言的手册中明确说了可以在defer中修改`命名的返回的变量（named result parameters ）"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

Go语言的手册中[Defer statements](https://golang.org/ref/spec#Defer_statements) 明确说了可以在defer中修改`命名的返回的变量（named result parameters ）`：

>For instance, if the deferred function is a function literal and the surrounding function has named result parameters that are in scope within the literal, the deferred function may access and modify the result parameters before they are returned. If the deferred function has any return values, they are discarded when the function completes. (See also the section on handling panics.)

但是对修改非命名的返回变量，却没有明确的说法。

## 试验

```go
// Create: 2018/12/07 10:03:00 Change: 2018/12/07 10:03:00
// FileName: a.go
// Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
//
// Distributed under terms of the GPL license.

package main

//change in defer，result is 2
func det1() int {
	result := 2
	defer func() {
		println("det1")
		result = 1
	}()
	return result
}

//change pointer in defer， result is 2
func det2() int {
	result := 2
	defer func(result *int) {
		println("det2")
		*result = 1
	}(&result)
	return result
}

//use name result and change in defer， result is 1
func det3() (result int) {
	result = 2
	defer func() {
		println("det3")
		result = 1
	}()
	return result
}

//return is pointer，result is 1
func det4() *int {
	result := 2
	defer func() {
		println("det4")
		result = 1
	}()
	return &result
}

func main() {
	a := det1()
	b := det2()
	c := det3()
	d := det4()
	println(a)
	println(b)
	println(c)
	println(*d)
}
```

输出结果如下：

```bash
det1
det2
det3
det4
2
2
1
1
```

其中最让人不能理解的是`det2()`，defer中修改的是指针指向的内容，但是返回的结果没有变化：

```go
//change pointer in defer， result is 2
func det2() int {
	result := 2
	defer func(result *int) {
		println("det2")
		*result = 1
	}(&result)
	return result
}
```

出现这种情况，只有一个解释，在defer指定的函数执行之前，函数的返回值就已经确定了，defer中的更改是不生效的。

但是`det4()`中的修改又是有效的：

```go
//return is pointer，result is 1
func det4() *int {
	result := 2
	defer func() {
		println("det4")
		result = 1
	}()
	return &result
}
```

结合`det2()`的结果推断，return的返回值不仅是在defer指定函数执行之前确定的，而且是拷贝了一份。

`det3()`又怎样解释呢？return的返回值是命名变量的时候，不做拷贝？

```go
//use name result and change in defer， result is 1
func det3() (result int) {
	result = 2
	defer func() {
		println("det3")
		result = 1
	}()
	return result
}
```

## 分析一下汇编代码

用下面的命令编译：

	GOARCH=amd64 GOOS=linux go build

然后将得到的二进制程序反汇编：

	go tool objdump -S defer >defer.asm    //用go tool反汇编
	
	objdump -d -t defer  >defer.asm        //linux上用objdump反汇编

有空继续分析..(2018-12-07 14:04:14)

## 参考

1. [X86 Assembly/GAS Syntax][1]
2. [Intel® 64 and IA-32 Architectures Software Developer’s Manual：Volume 2 (2A, 2B, 2C & 2D): Instruction Set Reference, A-Z][2]
3. [CPU的相关知识][3]
4. [Using as][4]


[1]: https://en.wikibooks.org/wiki/X86_Assembly/GAS_Syntax "X86 Assembly/GAS Syntax"
[2]: https://www.intel.com/content/dam/www/public/us/en/documents/manuals/64-ia-32-architectures-software-developer-instruction-set-reference-manual-325383.pdf "Intel® 64 and IA-32 Architectures Software Developer’s Manual：Volume 2 (2A, 2B, 2C & 2D): Instruction Set Reference, A-Z"
[3]: https://www.lijiaocn.com/编程/2013/11/12/CPU.html "CPU的相关知识"
[4]: https://sourceware.org/binutils/docs/as/ "Using as"
