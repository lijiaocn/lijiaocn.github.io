---
layout: default
title: 理解golang的反射reflection
author: lijiaocn
createdate: 2017/11/06 15:34:13
changedate: 2017/11/06 19:36:19
categories: 编程
tags: golang
keywords: reflection,反射,go语言,go编程
description: go语言支持reflection，这里go语言的反射机制的学习笔记

---

* auto-gen TOC:
{:toc}

## 说明

不同语言的反射模式是不同的。

在golang的官网上有一篇文章很详细的介绍了go语言的反射机制: [The Laws of Reflection][1]。

## 反射实现的前提

反射是建立在类型之上:

	reflection builds on the type system

golang的变量类型是静态的，在创建变量的时候就已经确定，反射主要与golang的interface类型相关。

在golang的实现中，每个interface变量都有一个对应pair，pair中记录了这个变量的值和类型:

	 (value, type)

value是具体的值，type是value的static type，注意这个type不是intreface。

创建一个变量tty，类型为`*os.File`：

	tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)

将tty赋给接口变量r:

	var r io.Reader
	r = tty

这时候，接口变量r的pair中记录的是:

	(tty, *os.File)

将r赋给另一个接口变量w:

	var w io.Writer
	w = r.(io.Writer)

这时候，接口变量w的pair中记录的也是:

	(tty, *os.File)

即使将r赋给一个空接口变量，内部的pair也是:

	(tty, *os.File)

这个pair的存在，是golang中实现反射的前提。

## package: reflect

reflect是golang中进行反射操作的package。

### 从接口变量中获取value和type信息

`reflect.TypeOf()`就是获取pair中的type，`reflect.ValueOf()`获取pair中的value，例如：

	package main
	import (
		"fmt"
		"reflect"
	)
	func main() {
		var x float64 = 3.4
		fmt.Println("type: ", reflect.TypeOf(x))
		fmt.Println("type: ", reflect.ValueOf(x))
	}

运行时输出的结果是:

	type:  float64
	type:  3.4

pair中的value和type在reflect中对应的类型是: reflect.Value和reflect.Type。

[package: reflect][2]中有很详细的信息，例如Kind()返回的类型：

	const (
		Invalid Kind = iota
		Bool
		Int
		Int8
		Int16
		Int32
		Int64
		Uint
		Uint8
		Uint16
		Uint32
		Uint64
		Uintptr
		Float32
		Float64
		Complex64
		Complex128
		Array
		Chan
		Func
		Interface
		Map
		Ptr
		Slice
		String
		Struct
		UnsafePointer
	)

## 从变量的值中获取接口信息

这里变量的值对应的是reflect中的"relfect.Value"，通过下面的方法可以获得接口变量：

	func (v Value) Interface() interface{}

当收到一个类型为reflect.Value类型的变量时，首先将它转换对应的接口变量:

	y := v.Interface().(float64)

## 通过reflect.Value直接设置变量的值

reflect.Value都是通过reflect.ValueOf(X)获得的，只有X是指针的时候，才可以通过返回的reflec.Value修改X中值。

例如:

	var x float64 = 3.4
	p := reflect.ValueOf(&x)    // Note: take the address of x.
	v := p.Elem()
	fmt.Println("type of p:", v.Type())
	fmt.Println("settability of p:", v.CanSet())
	v.SetFloat(77)

传入的是`* float64`，需要用p.Elem()获取所指向的Value。v.CantSet()输出的是true，因此可以用`v.SetFloat()`修改x的值。

## 如果是结构体

如果得到了一个类型为reflect.Value的变量，可以通过下面的方式，获得变量的信息。

如果知道v的真实类型，直接转化成对应的类型:

	r := v.Interface().(已知的类型)

如果不知道v的真实类型，获取它的Type，然后遍历Type的Field，和v的Field:

	t := v.Type()
	for i := 0; i < v.NumField(); i++ {
		f := v.Field(i)
		fmt.Printf("%d: %s %s = %v\n", i, t.Field(i).Name, f.Type(), f.Interface())
	}

## 参考

1. [The Laws of Reflection][1]
2. [package: reflect][2]

[1]: https://blog.golang.org/laws-of-reflection  "The Laws of Reflection" 
[2]: https://golang.org/pkg/reflect/#Kind "package: reflect"
