---
layout: default
title: The Go Programming Language Specification
author: lijiaocn
createdate: 2017/04/28 18:01:57
changedate: 2017/04/29 00:33:45
categories:
tags: manual Go
keywords:  Specification,Go,golang
description: 查阅一个语言的Specification，其实是一个特别有效的方法。

---

## 到哪里找？

在[Go][1]的网站上可以找到，如果被墙了，可以`godoc -http=:8080`，在本地访问`http://127.0.0.1:8080`。

## 介绍（Introduction)

Go是用于系统编程的通用语言，强类型、有垃圾回收机制、对并发编程有良好的支持。

代码以`包（package)`的形式组织，可以有效进行依赖管理。

使用`编译-链接`的方式生成二进制程序。

## 注释

单行注释:

	以"//"开始的行。

通用注释:

	/*  xxxxx */

## 保留关键字

	break        default      func         interface    select
	case         defer        go           map          struct
	chan         else         goto         package      switch
	const        fallthrough  if           range        type
	continue     for          import       return       var

## 运算符和分隔符

	+    &     +=    &=     &&    ==    !=    (    )
	-    |     -=    |=     ||    <     <=    [    ]
	*    ^     \*=    ^=     <-    >     >=    {    }
	/    <<    /=    <<=    ++    =     :=    ,    ;
	%    >>    %=    >>=    --    !     ...   .    :
	     &^          &^=

## 整数

默认十进制，八进制以`0`开始，十六进制以`0x`或者`0X`开始。

## 浮点数

浮点数由整数部分、小数点、小数部分、指数部分组成。

	0.
	72.40
	072.40  // == 72.40
	2.71828
	1.e+0
	6.67428e-11
	1E6
	.25
	.12345E+5

## 复数

复数以`i`结尾

	0i
	011i  // == 11i
	0.i
	2.71828i
	1.e+0i
	6.67428e-11i
	1E6i
	.25i
	.12345E+5i

## 字符(rune)

### rune的定义

英文单词是rune，不清楚标准译法是什么，可以理解为单字或字符，包扩字母和使用数值表示的字符。

	A rune literal represents a rune constant, an integer value identifying a Unicode code point.

用单引号包裹的字符表示，单引号内可以有一个字符，也可以有多个字符，但都表示一个int32的数值，例如:

	'x'  -> 单引号内一个字符
	'\n' -> 单引号内两个字符

字符可以分为两类，一类是可以直接显示的，例如a,b,c,d等，另一类是不能显示的，例如换行符、退格符等。

通过转义字符`\`可以将一些不能用ASCII文本描述的字符表达出来，例如:

	\a   U+0007 alert or bell
	\b   U+0008 backspace
	\f   U+000C form feed
	\n   U+000A line feed or newline
	\r   U+000D carriage return
	\t   U+0009 horizontal tab
	\v   U+000b vertical tab
	\\   U+005c backslash
	\'   U+0027 single quote  (valid escape only within rune literals)
	\"   U+0022 double quote  (valid escape only within string literals)

除了用转义字符，还可以直接用字符的实际数值的表达，有四种方式:

	\127        \后面必须是`三个`八进制数,0-7,可以与转义字符区分开, 9bit
	\xff        \x后面必须是`两个`十六进制数, 8bit, 1byte
	\u12e4      \u后面必须是`四个`十六进制数, 16bit, 2byte
	\U0010abcd  \U后面必须是`八个`十六进制数, 32bit, 4byte

注意最大只需要32bit，因此Go的pkg`buitlin`中对类型`rune`说明是：

	type rune rune
	rune is an alias for int32 and is equivalent to int32 in all ways. 
	It is used, by convention, to distinguish character values from integer values. 

例子，注意illegal的情况

	'a'
	'ä'
	'本'
	'\t'
	'\000'
	'\007'
	'\377'
	'\x07'
	'\xff'
	'\u12e4'
	'\U00101234'
	'\''         // rune literal containing single quote character
	'aa'         // illegal: too many characters
	'\xa'        // illegal: too few hexadecimal digits
	'\0'         // illegal: too few octal digits
	'\uDFFF'     // illegal: surrogate half
	'\U00110000' // illegal: invalid Unicode code point

### 特别注意-字符串是由`rune`组成的

相信有很多人都和我一样是从C语言开始学习编程的，形成了字符串是由字符(char)组成的的刻板印象！

这种说法不是不对, 但是要知道char(8bit)只能表达256字符，而世界上的符号远远不至于256个。

如果字符串中包含了这256个字符之外的字符，继续用`char`就不合适了，因为char无法表达256个字符之外的字符。

而rune可以，所以要牢记字符串是由`rune`组成的！

例如下面的程序，字符串str中是包含中文的，遍历这个字符串的时候，可以拿到中文字符，v就是一个rune变量。

程序源码:

	package main
	
	import (
	    "fmt"
	)
	
	func main() {
	    var str = "1234我们中国"
	    for i, v := range str {
	        fmt.Printf("%d %c\n", i, v)
	    }
	}

程序输出:

	0 1
	1 2
	2 3
	3 4
	4 我
	7 们
	10 中
	13 国
	
	Press ENTER or type command to continue

注意i的值是不连续，可以看出来一个中文字符占用3个字节。

## 字符串

字符串分两类，原始字符串和释义字符串

	There are two forms: 
	    raw string literals 
	    interpreted string literals

### 原始字符串

原始字符串是用`反引号`括起来的字符串，反引号内的所有非反引号字符都包含在字符串，所见即所得。

程序代码:

	package main
	
	import (
	    "fmt"
	)
	
	func main() {
	    var str = `This is a
	
	    raw string.`
	
	    fmt.Printf("%s\n", str)
	}

输出结果:

	This is a
	
	    raw string.
	
	Press ENTER or type command to continue

注意，所见即所得。

### 释义字符串

释义字符串是用`双引号`括起来的字符串，需要用转义字符来表示换行等特殊字符。

在Go中，一个释义字符串不能分布在多行，否则会提示语法错误。如果要多行分布，只能用字符串拼接的方式。

程序代码:

	package main
	
	import (
	    "fmt"
	)
	
	func main() {
	    var str = "This is a" +
	        " interpreted string"
	    fmt.Printf("%s\n", str)
	}

输出结果:

	This is a interpreted string
	
	Press ENTER or type command to continue

## 常量

常量的类型有六种:

	boolean constants
	rune constants
	integer constants
	floating-point constants
	complex constants
	string constants

## 变量

变量实际上是`量`的地址：

	A variable is a storage location for holding a value. 

能够对这个地址里存放的值进行哪些操作，取决与变量的类型。

变量的静态类型是定义变量时声明的。

接口类型(interface)的变量，额外有一个动态类型(dynamic type)。

因为一个变量只要实现了相应的接口，就可以作为接口变量，接口变量的动态类型就是这个同时是接口变量的变量的原始类型。

## 类型别名

可以用`type`定义类型别名：

	type T1 string
	type T2 T1
	type T3 []T1
	type T4 T3

## 成员函数

一个类型可以有成员函数(method)，成员函数可以绑定到这个类型的变量的值，或者这个类型的变量的地址。

程序代码:

	package main
	
	import (
	    "fmt"
	)
	
	type T1 string
	
	func (t T1) PrintVar() {
	    fmt.Println(t)
	}
	
	func (t *T1) PrintAddr() {
	    fmt.Println(t)
	}
	
	func main() {
	    var t T1 = "hello"
	    t.PrintVar()
	    t.PrintAddr()
	}

输出结果:

	hello
	0xc820074220
	
	Press ENTER or type command to continue

## 参考

1. [golang.org][1]

[1]: http://golang.org  "golang.org" 

