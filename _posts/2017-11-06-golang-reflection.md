---
layout: default
title: 理解go的反射机制reflection
author: 李佶澳
createdate: 2017/11/06 15:34:13
last_modified_at: 2017/11/08 21:19:49
categories: 编程
tags: golang
keywords: reflection,反射,go语言,go编程
description: go语言支持reflection，这里go语言的反射机制的学习笔记

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

不同语言的反射模式是不同的。

在golang的官网上有一篇文章很详细的介绍了go语言的反射机制: [The Laws of Reflection][1]。

## 反射实现的前提

反射是建立在类型之上:

	reflection builds on the type system

golang的变量类型是静态的，在创建变量的时候就已经确定，反射主要与golang的interface类型相关。

在golang的实现中，每个interface变量都有一个对应pair，pair中记录了实际变量的值和类型:

	(value, type)
	
	value是实际变量值，type是实际变量的类型

例如，创建类型为`*os.File`的变量，然后将其赋给一个接口变量`r`：

	tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
	
	var r io.Reader
	r = tty

接口变量r的pair中将记录如下信息：

	(tty, *os.File)

这个pair在接口变量的连续赋值过程中是不变的，将接口变量r赋给另一个接口变量w:

	var w io.Writer
	w = r.(io.Writer)

接口变量w的pair与r的pair相同，都是:

	(tty, *os.File)

即使w是空接口类型，pair也是不变的。

pair的存在，是golang中实现反射的前提，理解了pair，就更容易理解反射。

## 从接口变量中获取value和type信息

`reflect.TypeOf()`是获取pair中的type，`reflect.ValueOf()`获取pair中的value：

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

pair中的value和type用类型`reflect.Value`和`reflect.Type`描述。

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

## 从Value中获取接口信息

类型为"relfect.Value"变量，通过下面的方法可以获得接口变量：

	func (v Value) Interface() interface{}

当收到一个类型为reflect.Value类型的变量时，用下面方式将它转换对应的接口变量，然后进行类型判断：

	y := v.Interface().(float64)

之后就可以使用y的成员和方法。

## 通过reflect.Value设置实际变量的值

reflect.Value是通过reflect.ValueOf(X)获得的，只有当X是指针的时候，才可以通过reflec.Value修改实际变量X的值。

例如:

	var x float64 = 3.4
	p := reflect.ValueOf(&x)    // Note: take the address of x.
	v := p.Elem()
	fmt.Println("type of p:", v.Type())
	fmt.Println("settability of p:", v.CanSet())
	v.SetFloat(77)

传入的是`* float64`，需要用p.Elem()获取所指向的Value。v.CantSet()输出的是true，因此可以用`v.SetFloat()`修改x的值。

## 收到reflect.Value变量后

如果得到了一个类型为reflect.Value的变量，可以通过下面的方式，获得变量的信息。

如果知道v的真实类型，可先转换成interface{}，然后转化成对应的类型:

	r := v.Interface().(已知的类型)

除了interface{}，还可以转换成其它类型:

	func (v Value) Bool() bool
	func (v Value) Bytes() []byte
	func (v Value) Int() int64
	func (v Value) Uint() uint64
	...

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
