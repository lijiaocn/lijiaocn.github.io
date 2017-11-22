---
layout: default
title: go语言语法实例
author: lijiaocn
createdate: 2017/11/15 10:49:40
changedate: 2017/11/21 16:16:56
categories: 编程
tags: go
keywords: go语法,语法实例
description: 这里简单记录go的一些常用语法

---

* auto-gen TOC:
{:toc}

## 说明

C语言是我的第一门编程语言，也是学的最认真、语法记得最牢靠的一门语言。之后接触的其它编程语言，几乎记不住它们的哪怕是最基本的语法。脱离几个月后，就忘得干干净净，所以需要一个手册。

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

## 结构体 －struct

go不是面向对象的，它使结构体，不使用类，[Go Spec: Struct Type][5]。

	// An empty struct.
	struct {}
	
	// A struct with 6 fields.
	struct {
	    x, y int
	    u float32
	    _ float32  // padding，注意这个padding
	    A *[]int
	    F func()
	}

struct没有名字，为方便使用，需要用[type][6]为它赋予一个名字：

	type A struct {}    // name is A

注意，是“Type  + 名字  + struct”的结构，不要与C语言中的混淆了，C语言中是“struct A {}"

go的struct与C的struct不同，它吸收了“类（class）”的一些概念。

### 匿名成员 － anonymous field

struct中只有类型、没有名字的成员（field）被称为：anonymous field、embedded field。

例如：

	// A struct with four anonymous fields of type T1, *T2, P.T3 and *P.T4
	struct {
	    T1        // field name is T1
	    *T2       // field name is T2
	    P.T3      // field name is T3
	    *P.T4     // field name is T4
	}

只有用`type`命名的stuct和指向它的指针可以作为匿名成员。

需要通过类型名读取匿名成员，因此匿名成员的类型不能相同，例如下面的定义就是错误的;

	struct {
	    T     // conflicts with anonymous field *T and *P.T
	    *T    // conflicts with anonymous field T and *P.T
	    *P.T  // conflicts with anonymous field T and *T
	}

匿名成员的成员是需要特别注意的，因为很容易引起较乱：

	如果一个结构体中没有与它的匿名成员的成员冲突的成员，那么可以直接引用匿名成员的成员。

这句话比较拗口，直接看例子：

	type A struct {
	    B
	}
	
	type B struct {
	    b string
	}
	
	func (*B) sayHello() {
	    fmt.Printf("Hi, i'm B, i'm say hello to you.\n")
	}

结构体A有一个匿名成员B，B有`b`和`SayHello()`两个成员，A中没有与之其同名的成员，因此可以直接引用。

	a := A{
	    B: B{
	        b: "i'm  b in B",
	    },
	}
	
	fmt.Printf("a.b=%s\n", a.b)
	a.sayHello()

输出的结果是：

	a.b = i'm  b in B
	Hi, i'm B, i'm say hello to you.

[Go Spec: Struct Type][5]将这称为`promoted`，即匿名成员的field被提升了，其实就是相当于调用了父类的方法。

原话是这么讲的：

	If S contains an anonymous field T, the method sets of S and *S both include promoted methods with receiver T. 
	   The method set of *S also includes promoted methods with receiver *T.
	
	If S contains an anonymous field *T, the method sets of S and *S both include promoted methods with receiver T or *T.

实验发现，对于第一种情况，S的method set中不仅包含了receiver是T的方法，也包括了receiver是`*T`方法。

如果A中定义了同名的成员，那么默认引用的就是A自己的成员，如果要引用B成员，必须指定B的默认名字：

	fmt.Printf("a.B.b=%s\n", a.B.b)

这其实就是实现了面向对象中的继承，或许是go的发明人想引入继承，但又不想引入面对对象中的太多内容，所以用了这么一种曲折的方式。

## 遍历 － For statements

go语言的for语句有三种形态，[Go Spec: For statements][7]:

	ForStmt = "for" [ Condition | ForClause | RangeClause ] Block .
	Condition = Expression .

`Condition`是表达式，表达式结果为true，就执行Block中的代码，例如:

	for a < b {
	    a *= 2
	}

`ForClause`类似C中的for的写法:

	ForClause = [ InitStmt ] ";" [ Condition ] ";" [ PostStmt ] .
	InitStmt = SimpleStmt .
	PostStmt = SimpleStmt .

例如:

	for i := 0; i < 10; i++ {
		f(i)
	}

`RangeClause`中引入了关键字`range`：

	RangeClause = [ ExpressionList "=" | IdentifierList ":=" ] "range" Expression .

用于遍历数组（array）、切片（slice）、字符串（string）、字典（map）、管道（channel），每次循环range会返回两个值，目标类型不同，返回的值的类型不同：

	Range expression   (example)               |   1st value         |  2nd value
	-------------------------------------------------------------------------------
	array or slice     a  [n]E, *[n]E, or []E  |   index    i  int   |  a[i]      E
	string             s  string type          |   index    i  int   |  see below rune
	map                m  map[K]V              |   key      k  K     |  m[k]      V
	channel            c  chan E, <-chan E     |   element  e  E     |

对于array、slice、string，range返回的第一个值是index，类型为int，第二个值为index对应的值。

对于map，range返回的第一个值是key，第二个值是对应的value。

对于channel，只返回一个值，就是从channel中读取到的变量。

## 字典 － map

go语言支持map，[Go Spec: Map types][8]。

	MapType     = "map" "[" KeyType "]" ElementType .
	KeyType     = Type .

map类型的变量必须用`make`创建：

	make(map[string]int)         <-- 不设置map容量
	make(map[string]int, 100)    <-- map容量为100

从map中取value的语句，叫做`index表达式`，[Go Spec: Index expressions][9]，语法格式如下：

	a[x]

a可以是`array`,`pointer to array`,`slice`, `string`和`map`。

如果a是map，x的类型必须与a的key的类型相同，表达返回两个值，第一个是key对应的value，第二个是是bool变量，表示key是否存在。

	var v, ok = a[x]

## 参考

1. [Go Language Specification][1]
2. [Go Spec: Pointer Type][2]
3. [The Go Programming Language Specification][3]
4. [Go Spec: Address_operators][4]
5. [Go Spec: Struct Type][5]
6. [Go Spec: Types][6]
7. [Go Spec: For statements][7]
8. [Go Spec: Map types][8]
9. [Go Spec: Index expressions][9]

[1]: http://127.0.0.1:8080/ref/spec  "Go Language Specification"
[2]: http://127.0.0.1:8080/ref/spec#Pointer_types  "Go Spec: Pointer Type" 
[3]: http://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2017/04/28/golang-specification.html "The Go Programming Language Specification"
[4]: https://127.0.0.1:8080/ref/spec#Address_operators "Go Spec: Address operators"
[5]: http://127.0.0.1:8080/ref/spec#Struct_types "Go Spec: Struct Type"
[6]: http://127.0.0.1:8080/ref/spec#Types "Go Spec: Types"
[7]: http://127.0.0.1:8080/ref/spec#For_statements "Go Spec: For statements"
[8]: http://127.0.0.1:8080/ref/spec#Map_types  "Go Spec: Map types"
[9]: http://127.0.0.1:8080/ref/spec#Index_expressions  "Go Spec: Index expressions"
