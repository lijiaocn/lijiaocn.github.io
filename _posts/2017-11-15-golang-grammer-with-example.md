---
layout: default
title: "Go 语言语法一站式手册"
author: 李佶澳
createdate: 2017/11/15 10:49:40
last_modified_at: 2017/12/01 18:07:59
categories: 编程
tags: 语法手册 golang 
keywords: go语法,语法实例
description: 这里简单记录go的一些常用语法

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

C语言是我的第一门编程语言，也是学的最认真、语法记得最牢靠的一门语言。之后接触的其它编程语言，几乎记不住它们的哪怕是最基本的语法。脱离几个月后，就忘得干干净净，所以需要一个手册。阅读 [Go Language Specification][1] 是痛苦的，比如 [The Go Programming Language Specification][3]。所以还是结合实际例子记录一下比较好。

## 词法规则

英语有单词，汉语有词语，编程语言也有自己的词汇。Go 语言使用的编码是utf-8，用 Go 语言写的源代码首先是 utf-8 编码的文本文件。文本内容首先按照词法规则进行解析：[Go Lexical elements][10]。

Go 代码源文件以下四类 Unicode 字符组成：

	newline        = /* the Unicode code point U+000A */ .
	unicode_char   = /* an arbitrary Unicode code point except newline */ .
	unicode_letter = /* a Unicode code point classified as "Letter" */ .
	unicode_digit  = /* a Unicode code point classified as "Number, decimal digit" */ .

其中 letter 和 digit 的定义如下：

	letter        = unicode_letter | "_" .
	decimal_digit = "0" … "9" .
	binary_digit  = "0" | "1" .
	octal_digit   = "0" … "7" .
	hex_digit     = "0" … "9" | "A" … "F" | "a" … "f" .

### 注释 Comments

注释有`单行注释`(line comments)和`通用注释`(general comments)两种形式。

* 单行注释以`//`开始，到行尾结束。
* 通用注释以`/*`开始，到`*/`结束。

注释不能位于字符(rune)、字符串(string literal)和另一个注释当中。

### 词汇 Tokens

Tokens 就是 Go 语言的词汇表，分为四类：

* 标识符/identifiers
* 关键字/keywords
* 操作符和标点/operators and punctuation
* 文本/literals

空白字符被忽略，空格(spaces, U+0020)、TAB(horizontal tabs, U+0009)、回车(carriage returns, U+000D)、换行(newlines, U+000A)。

Tokens 是编译原理中一个常用的术语。编译器在进行词法分析的时候，会连续的读取源码文件中的内容，它从第一个非空白的符号开始记录，遇到下一个空白的符号后记录一个 token。

### 分号 Semicolons

很多编程语言都用“;”作为结束符号，标记一行代码的结束。Go语言也用分号做结束符，但是在源码中可以不写出分号，Go 能自主推断出是否结束。

当一行代码的最后一个Token是下面的类型时，Go 会自动在行尾补上分号：

	标识符(identifier)
	整数、浮点数、虚数、字(rune)、字符串
	关键字：break、continue、fallthrough、return
	运算符和分隔符：++、--、)、]、}

### 标识符 Identifiers

标识符用来命名代码中自定义的对象实体/entities)，比如变量、常量、函数等。代码中自定义的 entity 需要有一个名字，这个名字就是它们的标识符。

Go 的标识符语法格式如下：

	identifier = letter { letter | unicode_digit } .

即由字母和数字组成，但必须以字母开头且不能是关键字。

### 关键字 Keywords

关键字是 Go 语言保留的一些单词，它们都是由特定功能的，不用用来做标识符。关键字的数量是有限的，下面是 Go 的全部关键字：

	break        default      func         interface    select
	case         defer        go           map          struct
	chan         else         goto         package      switch
	const        fallthrough  if           range        type
	continue     for          import       return       var

### 运算符和分隔符 Operators and Delimiters

运算符和分隔符是一类有特殊的意义的非字母符号。它们的数量也是有限的，下面是 Go 的全部运算符和分隔符：

	+    &     +=    &=     &&    ==    !=    (    )
	-    |     -=    |=     ||    <     <=    [    ]
	*    ^     \*=    ^=     <-    >     >=    {    }
	/    <<    /=    <<=    ++    =     :=    ,    ;
	%    >>    %=    >>=    --    !     ...   .    :
	     &^          &^=

### 整数 Integer literals

整数就是数学意义上的整数，在 Go 中有十进制、二进制、八进制、十六进制四种表示方式。

	int_lit     = decimal_lit | octal_lit | hex_lit .
	decimal_lit = ( "1" … "9" ) { decimal_digit } .
	binary_lit     = "0" ( "b" | "B" ) [ "_" ] binary_digits .
	octal_lit   = "0" { octal_digit } .
	hex_lit     = "0" ( "x" | "X" ) hex_digit { hex_digit } .

在十六进制表示方式中，大写字母与小写字母的含义是相同的。

	42            //十进制
	0600          //八进制，以0开头
	0xBadFace     //十六进制，以0x开头，忽略大小写

### 浮点数 Floating-point literals

浮点数就是数学上的浮点数，带有小数点的数，Go 支持用科学计数表示浮点数。

	float_lit = decimals "." [ decimals ] [ exponent ] |
	            decimals exponent |
	            "." decimals [ exponent ] .
	decimals  = decimal_digit { decimal_digit } .
	exponent  = ( "e" | "E" ) [ "+" | "-" ] decimals .

浮点数可以有以下几种样式：

	0.
	72.40
	072.40          //== 72.40
	2.71828
	1.e+0
	6.67428e-11
	1E6
	.25
	.12345E+5

浮点数全是十进制，没有其它进制，`0720.40` 是十进制的 `720.40`。

### 虚数 Imaginary literals

虚数是复数的组成部分，在样式上，它就是在整数或者浮点数后面加上“i”。

	imaginary_lit = (decimals | float_lit) "i" .

虚数也只能用十进制表示。

	0i
	011i  // == 11i
	0.i
	2.71828i
	1.e+0i
	6.67428e-11i
	1E6i
	.25i
	.12345E+5i

### 单字符 Rune literals

C 语言中单字符用 char 来称呼，但是 char 通常默认是占用了 1 byte 存储空间的单字符。 Go 语言使用 utf8 编码，处理的字符串也是 utf8 编码，而 utf8 是一种变长的编码，用1～4个字节表示一个符号。Go 语言中的单字符需要有一个新名字，和固定占用 1 byte 的 char 区分开。
这个名字是`rune`，表示一个 utf8 单字符，占用的空间是 1~4 bytes。

rune 的语法如下：

	rune_lit         = "'" ( unicode_value | byte_value ) "'" .
	unicode_value    = unicode_char | little_u_value | big_u_value | escaped_char .
	byte_value       = octal_byte_value | hex_byte_value .
	octal_byte_value = `\` octal_digit octal_digit octal_digit .
	hex_byte_value   = `\` "x" hex_digit hex_digit .
	little_u_value   = `\` "u" hex_digit hex_digit hex_digit hex_digit .
	big_u_value      = `\` "U" hex_digit hex_digit hex_digit hex_digit
	                           hex_digit hex_digit hex_digit hex_digit .
	escaped_char     = `\` ( "a" | "b" | "f" | "n" | "r" | "t" | "v" | `\` | "'" | `"` ) .

* 用单引号包裹的
* 单引号中包裹的可以是 byte value，也可以是 unicode value

byte value 有八进制和十六进制两种表达方式：

* 八进制以`\`开始，后面跟随三个数字
* 十六进度以`\x`开始，后面跟随两个十六进制数字

unicode value 有四种形式：

* 第一种是单字符，比如 'a' 'b' 
* 第二种是以`\u`开头后面跟随4个十六进制数字
* 第三种是以`\U`开头后面跟随8个十六进制数字
* 第四种是以`\`开头的转义字符

转义字符的数量是有限的，只有下面这些：

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

godoc 中给出的 rune 示意，这些都是单字符，占用的空间是 1~4 bytes：

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

### 字符串 String literals

字符串就是连续的 rune，有两种形式：

* 原始型/raw string literals
* 解释型/interpreted string literals。

	string_lit             = raw_string_lit | interpreted_string_lit .
	raw_string_lit         = "`" { unicode_char | newline } "`" .
	interpreted_string_lit = `"` { unicode_value | byte_value } `"` .

原始型字符串用反引号包裹，反引号中的内容都是字符串的一部分，反斜杠就是反斜杠，还包括看不到换行回车等。简而言之，原始型字符串就是它看起来的样子。

	`\n
	\n`                  // same as "\\n\n\\n"

解释型字符串用双引号包裹，可以使用反斜杠进行转义。

	"Hello, world!\n"
	"日本語"
	"\u65e5本\U00008a9e"
	"\xff\u00FF"
	"\uD800"             // illegal: surrogate half
	"\U00110000"         // illegal: invalid Unicode code point

解释型字符串可以用多种形式描述相同的内容，这个特点有时候是特别有用的。下面的五个解释型字符串，样式不同，但内容完全一致：

	"日本語"                                 // UTF-8 input text
	`日本語`                                 // UTF-8 input text as a raw literal
	"\u65e5\u672c\u8a9e"                    // the explicit Unicode code points
	"\U000065e5\U0000672c\U00008a9e"        // the explicit Unicode code points
	"\xe6\x97\xa5\xe6\x9c\xac\xe8\xaa\x9e"  // the explicit UTF-8 bytes


## 语法规则

### 常量

常量支持以下类型，其中字符/rune、整数/intrger、浮点数/floating-point、复数/complex型常量，又被称为数值常量/numeric constants。

	布尔，boolean
	字符，rune
	整数，integer
	浮点数，floating-point
	复数，complex
	字符串，string

常量的值有下面几种描述方式：

	字符，rune
	整数，integer
	浮点数，floating-point
	虚数，imaginary
	字符串，string
	指向常量的标记符，identifier denoting a constant
	常量表达式，constant expression
	结果为常量的类型转化， a conversion with a result that is a constant
	内置函数的返回结果
	内置的常量true和false
	内置的常量标识符iota

常量的类型推断，未明确声明类型的常量默认类型如下：

	value_type       default_type
	------------------------------
	boolean          bool
	rune             rune
	integer          int
	floating-point   float64
	complex          complex128
	string           string


例如：

	i := 3       // "3"是一个untyped的常量，因为3是一个整数，它的默认类型就是int。
	j := 3.0     // "3.0"是一个浮点数，它的默认类型是float64。

数值型常量的溢出问题：

编译器支持的最大数值是有上限的，在代码中可以写入的数字确实无限的。可以在代码中写出任意大小的数值，但是代码中写出数未必能被编译器支持。Go 的编译器做了以下承诺：

	至少支持256个比特长度的整数
	至少支持256个比特长度的小数
	如果整数数值超过支持的范围，编译器报错
	如果浮点数和复数溢出，编译器报错
	如果浮点数和复数超出了支持的精度，使用最接近的数值

所以只要能编译通过，数值型常量的值与所显示值一致，不会出现`溢出`。例如下面的代码编译时会报错：

```go
package main

func main() {
    i := 115792089237316195423570985008687907853269984665640564039457584007913129639936
}
```

Error:

	./main.go:6: constant 115792089237316195423570985008687907853269984665640564039457584007913129639936 overflows int

>2^256=115792089237316195423570985008687907853269984665640564039457584007913129639936


IEEE-754中的“-0”(negative zero)、“无穷大”(infinity)、“非数”(not-a-number)没有对应的常量。

### 变量

变量有静态类型和动态类型。

* 声明变量时，指定的类型是变量的静态类型
* 变量的静态类型是接口/interface type 时，它还会有一个动态类型，动态类型就是被赋予的值的类型

	var x interface{}  // x is nil and has static type interface{}
	x = 42             // x has value 42 and dynamic type int
	x = v              // x has value (*T)(nil) and dynamic type *T

如果声明变量时没有设置变量值，它的值就是对应类型的零值（zero value)。

### 类型

Go 语言的内置类型/predeclared：

	bool byte complex64 complex128 error float32 float64
	int int8 int16 int32 int64 rune string
	uint uint8 uint16 uint32 uint64 uintptr

自定义的类型可以是命名的/named，也可以是未命名的/unnamed，

#### 命名类型与无命名类型

命名类型语法：

	Type      = TypeName | TypeLit | "(" Type ")" .
	TypeName  = identifier | QualifiedIdent .
	TypeLit   = ArrayType | StructType | PointerType | FunctionType | InterfaceType |
	            SliceType | MapType | ChannelType .

使用 `type` 指定了名字的类型是命名的，例如下面的类型的名字为 Student：

```go
type Student struct {
    Name string
    age int
}
```

类型也可以不被命名，例如下面的类型是没有名字的：

```go
[] string
[] int
```

无类型的名字，通用用于定义其它类型:

```go
type Array []int
```

或者在函数中直接使用：

```go
func Display(s struct {
    name string
    age  int
}) {
    println(s.name)
    println(s.age)
}
```

#### 实际类型 underlying type

类型是可以用来定义其它类型的，例如定义了一个类型T1，然后又用T1定义了类型T2：

```go
type T1 string 
type T2 T1
```

T1的实际类型(underlying type)是string，T2的实际类型不是T1，而是T1的实际类型string。

实际类型必须是go的内置类型或者类型的组合。例如，string、T1、T2的实际类型是string。

	type T1 string
	type T2 T1

[]T1、T3、T4的实际类型是[]T1。

	type T3 []T1
	type T4 T3

#### 类型的方法 method sets

类型可以有自己的方法(Method)，也就是其它语言中的函数。

一个非接口类型的方法集就所有接受者(receiver)为该类型的方法，接口类型的方法集就是接口定义中包含的方法。

需要注意的是指针类型类型（例如 * T)，它的方法集是所有接受者为所指类型(T)和指针类型( * T)的方法集。

例如下面的代码中，方法的Show的Receiver是Str，但是类型为 * Str的pstr也可以调用。

```go
package main

type Str string

func (s Str) Show() {
    println(s)
}

func main() {
    str := Str("Hello World!")
    pstr := &str
    pstr.Show()
}
```

方法集中的方法不能重名、且必须有名字。


#### 类型的等同性(identical)

命名语句不同的两个命名类型，是不等同的。例如下面的T1和T2，虽然实际类型都是string，但它们是两个类型。

	type T1 string
	type T2 string

命名类型与未命名类型是不等同的，例如下面的T1与[]string是两个类型。

	type T1 []string
	[]string

命名语句和定义语句`完全相同`的两个命名类型是才等同的，例如下面的T1。

	type T1 string
	type T1 string

定义语句`完全相同`的两个未命名类型才是等同的，例如下面的[]string。

	[5]string
	[5]string

在编程时，同一个类型只会定义一次。

在代码中定义`两个`等同的类型其是做不到的，因为它们如果等同，那么其实就是一个。例如下面的代码。

	package main
	
	type T string
	type T string
	
	func main() {
	}

编译时会报错。

	./main.go:5: T redeclared in this block
	    previous declaration at ./main.go:4

两个类型等同是一个用来解释类型不等同的规则，即如果不符合遵守等同的规则，那么就是不等同的。

对于未命名类型需要特别注意，只要不满足下面的条件，那么就是两个不同的类型：

	两个数组类型要等同，不仅数组中成员的类型要相同，而且数组的长度也要相同。
	两个分片类型等同，只需要分片的成员类型相同。
	两个结构体等同，结构体成员的顺序、名称、标签(tag)都必须相同。
	两个指针类型，所指向的类型相同。
	两个函数类型，要有相同的数量的参数和返回值，参数和返回值的类型要相同，参数名和返回值的名字可以不同。
	两个接口类型，要有相同的方法，方法的顺序可以不同。
	两个字典类型，key的类型和value的类型必须相同。
	两个通道(channel)类型，通道的方向和传递的类型必须相同。

例如下面两个函数类型符合上面的条件，所以是相同的：

	func(x int, y float64) *[]string
	func(int, float64) (result *[]string)

#### 类型的赋值 Assignability

一个值(value)只有在满足下面的条件时，才可以被赋给对应的类型的变量(variable)。

	值的类型与变量的类型相同
	值的类型与变量的实际类型相同，且其中一个的类型是未命名的类型
	变量的类型是一个接口，值实现了接口中方法
	值是一个双向的通道(channel)，变量类型也是通道，传递的数据类型相同，并且其中一个的类型是未命名的。
	值是内置的数值nil，变量的类型是指针(pointer)、函数(function)、分片(slice)、字典(map)、通道(channel)、接口(interface)
	值是一个符合变量的类型要求的常量。

#### 布尔(Boolean types)

布尔类型是内置的类型`bool`，它的value只能是两个内置的常量：

	true
	false

#### 数值(Numeric types)

数值类型都是内置的类型，一共有以下几种。

	uint8       the set of all unsigned  8-bit integers (0 to 255)
	uint16      the set of all unsigned 16-bit integers (0 to 65535)
	uint32      the set of all unsigned 32-bit integers (0 to 4294967295)
	uint64      the set of all unsigned 64-bit integers (0 to 18446744073709551615)
	
	int8        the set of all signed  8-bit integers (-128 to 127)
	int16       the set of all signed 16-bit integers (-32768 to 32767)
	int32       the set of all signed 32-bit integers (-2147483648 to 2147483647)
	int64       the set of all signed 64-bit integers (-9223372036854775808 to 9223372036854775807)
	
	float32     the set of all IEEE-754 32-bit floating-point numbers
	float64     the set of all IEEE-754 64-bit floating-point numbers
	
	complex64   the set of all complex numbers with float32 real and imaginary parts
	complex128  the set of all complex numbers with float64 real and imaginary parts
	
	byte        alias for uint8
	rune        alias for int32

另外还有三个数值类型，它们占用的空间取决于实现：

	uint     either 32 or 64 bits
	int      same size as uint
	uintptr  an unsigned integer large enough to store the uninterpreted bits of a pointer value

#### 字符串(String types)

字符串是内置的类型`string`，字符串的值是连续的字节，这些字节是不可更改的。

可以通过内置函数`len`获取字符串的长度，可以用通过[i]读取字符串的第i个(从0开始)字节。

字符串的字节只能读取，不能更改，也不能取址。

	package main
	
	import (
	    "fmt"
	)
	
	func main() {
	    str := "Hello World!"
	    fmt.Printf("%c\n", str[6])
	
	    //not allow
	    //ptr := &str[6]
	
	    //not allow
	    //str[6] = 'w'
	}

#### 数组(Array types)

数组是多个相同类型的值，在go中，数组必须有长度，长度是数组类型的一部分。

	ArrayType   = "[" ArrayLength "]" ElementType .
	ArrayLength = Expression .
	ElementType = Type .

数组是单维的，可以累进成多维数组：

	[32]byte
	[2*N] struct { x, y int32 }
	[1000]*float64
	[3][5]int
	[2][2][2]float64  // same as [2]([2]([2]float64))

要注意长度是数组类型的一部分，长度不同的数组是不同的类型，例如：

	package main
	
	func main() {
	    var array1 [32]byte
	    var array2 [24]byte
	
	    array1[0] = 'a'
	    array2[0] = 'b'
	
	    //not allow
	    //array2 = array1
	}

数组成员可以用从0开始的坐标索引，长度可以用内置的函数`len`获取。

#### 分片(Slice types)

分片(Slice)是用来索引数组(Array)中的一段连续的成员的。

	SliceType = "[" "]" ElementType .

分片初始化后就绑定到了一个数组，多个分片可以绑定到同一个数组。

与数组不同的是，分片有长度(length)和容量(capacity)两个属性。

长度是分片所索引的数组成员的数量，可以用内置的函数`len`获取。

容量是分片能够索引的数组成员的最大数量，等于数组的长度减去分片索引的第一个数组成员在数组中位置。

例如在下面的代码中，分片slice1的长度是5，容量是20(=30-10)

	package main
	
	func main() {
	    var array1 [30]int
	    for i := 0; i < len(array1); i++ {
	        array1[i] = i
	    }
	
	    slice1 := array1[10:15]
	
	    println("array's length: ", len(array1))
	    println("slice1's length: ", len(slice1))
	    println("slice1's capacity: ", cap(slice1))
	
	    for i := 0; i < len(slice1); i++ {
	        println(slice1[i])
	    }
	}

分片可以通过两种方式创建，第一种方式就是上面的代码中使用的方式：

	    slice1 := array1[10:15]

这样创建的slice1索引的是数组的从0开始编号的第10个、第11个、第12个、第13个、第14个个成员，总计5个。

	10
	11
	12
	13
	14

>注意[10:15]是一个前闭后开的集合，即包括10，不包括15。

第二种方式是使用内置的`make`函数创建。

	make([]T, length, capacity)

使用make创建的时候，至少需要指定分片的长度，make会为分片创建一个隐藏的数组。

如果指定了capacity，数组的长度就是capacity，如果没有指定，数组的长度等于分片的长度。

例如下面的代码中slice2的长度和容量都是10，slice3的长度是10，容量是20。

```go
package main

func main() {
    //not allow
    //slice1 := make([]int)
    //println("slice1， len is ", len(slice1), "capacity is ", cap(slice1))

    slice2 := make([]int, 10)
    println("slice2， len is ", len(slice2), "capacity is ", cap(slice2))

    slice3 := make([]int, 10, 20)
    println("slice3， len is ", len(slice3), "capacity is ", cap(slice3))
}
```

通过make创建分片，相当与新建一个数组，然后取它的[0:length]。

	make([]int, 50, 100)

等同于：

	new([100]int)[0:50]

#### 结构体(Struct types)

结构体(Struct)是比较复杂的类型，它是由多个 Field 组成。

	StructType     = "struct" "{" { FieldDecl ";" } "}" .
	FieldDecl      = (IdentifierList Type | AnonymousField) [ Tag ] .
	AnonymousField = [ "*" ] TypeName .
	Tag            = string_lit .

Go 语言的 struct 关键字和 C 语言的不同。C语言是“struct 结构体名{ 结构体成员...}”。如果要给go的结构体命名，需要使用关键type：

	type 结构体名 struct{
		结构体成员
	}

结构体成员的名称可以显示声明(IdentifierList Type)，也可以隐式声明(AnonymousField，后来改成 embeded field)。
隐式声明指的是不给 field 设置标识符，默认为用类型的名字。例如：

	struct {
	    T1        // field name is T1
	    *T2       // field name is T2
	    P.T3      // field name is T3
	    *P.T4     // field name is T4
	    x, y int  // field names are x and y
	}

Go 语言中的隐式声明的 field 有一点C++中的继承的意思，embedded field 的 field 和 method 可以被直接使用。

```go
package main

import (
    "fmt"
)

type A struct {
    A1 string
    A2 string
}

type B struct {
    A
    B1 string
    B2 string
}

func main() {
    b := B{
        A: A{
            A1: "a1",
            A2: "a2",
        },
        B1: "b1",
        B2: "b2",
    }
    fmt.Println(b.A)
    fmt.Println(b.A.A1)
    fmt.Println(b.A1)
}
```

`b.A1`索引的是 B 的隐式 field  A 的 A1。

如果 B 有一个名为 A1 的 filed ，那么只能通过`b.A.A1`的方式索引 A 的 field A1。
例如下面代码中，最后一行打印的是`b1's a1`。

```go
package main

import (
    "fmt"
)

type A struct {
    A1 string
    A2 string
}

type B struct {
    A
    A1 string
    B1 string
    B2 string
}

func main() {
    b := B{
        A: A{
            A1: "a1",
            A2: "a2",
        },
        A1: "b's a1",
        B1: "b1",
        B2: "b2",
    }
    fmt.Println(b.A)
    fmt.Println(b.A.A1)
    fmt.Println(b.A1)
}
```

同一个结构体内的成员不能重名。在使用隐式声明的时候要特别注意，因为一个类型与它的指针类型会是同样的名字。
例如下面的结构体的三个成员的名字都是`T`，这是不允许的。

```go
struct {
    T     // conflicts with anonymous field *T and *P.T
    *T    // conflicts with anonymous field T and *P.T
    *P.T  // conflicts with anonymous field T and *T
}
```

Go spec 中解释隐式声明的 `T` 和隐式声明的 `*T` 的区别（但是我一直没有试验出来...）：

    If S contains an embedded field T, the method sets of S and *S both include promoted methods with receiver T. The method set of *S also includes promoted methods with receiver *T.
    If S contains an embedded field *T, the method sets of S and *S both include promoted methods with receiver T or *T.

在每个结构体成员后面可以设置标签(tag)，标签用来注明成员的属性。标签可以是解释型字符串，也可以是原始型字符串。

	Tag            = string_lit .
	string_lit     = raw_string_lit | interpreted_string_lit .

在结构体中还可以添加只起到填充(padding)作用的成员：

```go
// A struct with 6 fields.
struct {
    x, y int
    u float32
    _ float32  // padding
    A *[]int
    F func()
}
```

#### 指针(Pointer types)

指针类型比较简单：

	PointerType = "*" BaseType .
	BaseType    = Type .

支持多重指针：

```go
package main

func main() {
    i := 8
    pi := &i
    ppi := &pi

    println(*ppi, pi)
    println(*pi, i)
}
```

支持地址运算 [Go Spec: Address_operators][4]：

	&x
	&a[f(2)]
	&Point{2, 3}
	*p
	*pf(x)
	
	var x *int = nil
	*x   // causes a run-time panic
	&*x  // causes a run-time panic

`&`用来获取变量的地址，`*`用来获取指针指向的变量，对 nil 取变量会引发 panic。


```go
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
```

执行结果：

	str type: string
	strp type: *string
	*str type: string


#### 函数(Function types)

go语言的函数的声明格式与其它语言也有所不同。

	FunctionType   = "func" Signature .
	Signature      = Parameters [ Result ] .
	Result         = Parameters | Type .
	Parameters     = "(" [ ParameterList [ "," ] ] ")" .
	ParameterList  = ParameterDecl { "," ParameterDecl } .
	ParameterDecl  = [ IdentifierList ] [ "..." ] Type .

可以由以下几种样式的函数：

```go
func()
func(x int) int
func(a, _ int, z float32) bool
func(a, b int, z float32) (bool)
func(prefix string, values ...int)
func(a, b int, z float64, opt ...interface{}) (success bool)
func(int, int, float64) (float64, *[]int)
func(n int) func(p *T)
```

最显著的不同是，参数的类型是在参数名之后的，如果两个参数类型相同且位置相临，可以省略前一个参数的类型，例如：

	func(a, b int, z float32) (bool)

函数的最后一个参数可以是变长参数(variadic)，可以对应0个到多个输入参数：

	func(prefix string, values ...int)

函数可以有多个返回值：

	func(int, int, float64) (float64, *[]int)

也可以返回函数：

	func(n int) func(p *T)

注意，这里给出的是函数类型，函数类型不等于函数的声明与实现，函数的声明与实现在后面章节中。

#### 接口(Interface types)

接口类型的格式如下：

	InterfaceType      = "interface" "{" { MethodSpec ";" } "}" .
	MethodSpec         = MethodName Signature | InterfaceTypeName .
	MethodName         = identifier .
	InterfaceTypeName  = TypeName .

例如：

```go
interface {
    Read(b Buffer) bool
    Write(b Buffer) bool
    Close()
}
```

接口的成员是方法(method)，一个类型只要实现一个接口中的所有方法的类型，可以作为类型为该接口的变量的的动态类型。

例如下面的T就实现了上面的接口：

	func (p T) Read(b Buffer) bool { return … }
	func (p T) Write(b Buffer) bool { return … }
	func (p T) Close() { … }

一个类型可以实现多个接口的方法，也可以是空的，不包含任何的方法：

	interface{}

接口可以包含其它的接口，但是不能包含它自身，或者通过其它接口形成了重复包含：

```go
// illegal: Bad cannot embed itself
type Bad interface {
    Bad
}

// illegal: Bad1 cannot embed itself using Bad2
type Bad1 interface {
    Bad2
}
type Bad2 interface {
    Bad1
}
```

#### 字典(Map types)

go语言原生支持字典(map)。

	MapType     = "map" "[" KeyType "]" ElementType .
	KeyType     = Type .

* Key的类型不能是函数(function)、字典(map)、分片(slice)
* 如果Key的类型是接口，可以作为该接口变量的动态类型的类型必须是可比较的，否则会panic
* 字典中的成员数量成为字典的长度(length)，可以通过内置函数len()获取
* 字典的成员可以通过赋值操作增加，用Key作为index读取
* 如果要删除字典中的成员，需要使用内置的delete()函数。


map 需要使用内置函数make创建，创建时指定length意思是预先分配出这么多空间，而不是只能容纳这么多：

	make(map[string]int)
	make(map[string]int, 100)

map的长度不受创建时指定的length的限制，可以无限增加成员。

```go
package main

import (
    "fmt"
)

func main() {
    m := make(map[int]int, 10)
    for i := 0; i < 10; i++ {
        m[i] = i
    }
    println(len(m))
    fmt.Println(m)
    m[11] = 11
    println(len(m))
    fmt.Println(m)
}
```

从map中取value的语句，叫做`index表达式`，[Go Spec: Index expressions][9]，语法格式如下：

	a[x]

Index 表达式还可以用于`array`,`pointer to array`,`slice`, `string`和`map`。如果a是map，x的类型必须与a的key的类型相同，表达返回两个值，第一个是key对应的value，第二个是是bool变量，表示key是否存在。

	var v, ok = a[x]

#### 通道(Channel types)

通道是用来在并发编程中传递value的。

	ChannelType = ( "chan" | "chan" "<-" | "<-" "chan" ) ElementType .

它可以是可读、可写、既可读又可写的，例如：

	chan T          // can be used to send and receive values of type T
	chan<- float64  // can only be used to send float64s
	<-chan int      // can only be used to receive ints

`<-` 是靠左临近的，通道类型本身也开始被传递：

```go
chan<- chan int    // same as chan<- (chan int)
chan<- <-chan int  // same as chan<- (<-chan int)
<-chan <-chan int  // same as <-chan (<-chan int)
chan (<-chan int)
```

通道类型的变量必须用内置的make函数创建：

	make(chan int, 100)

第二参数是指定通道中可以缓存的成员的数量，如果没有第二个参数或者第二个参数为0，那么该通道是不做缓存的，必须等对方接收或者写入完成后，才可以完成写入或接收。

通道需要由写入方使用内置的close函数关闭，接收方收取了最后一个数据后，再从通道中试图读取的时候，会立即返回失败。

例如，如果通道c被关闭，且通道中没有数据了，下面的语句将会立即返回，且ok是false。

	x, ok := <-c

通道是并发安全的，使用内置函数len读取通道中缓存的数据个数，或者用cap读取通道容量，不需要考虑并发的影响。

另外通道中的数据遵循先入先出的规则。

### 声明

声明的影响是有范围的，它的影响范围叫做作用域，作用域对应的是代码区块。

#### 代码区块(blocks) 

	Block = "{" StatementList "}" .
	StatementList = { Statement ";" } .

在go中有这样几种代码区块：

	所有的代码组成一个终极区块(universe block)
	隶属于同一个package的代码，组成对应的包区块(package block)
	同一个文件中的代码，组成一个文件区块(file block)
	if、for、switch语句包裹的代码，组成了独立的隐式区块(implicit block)
	switch、select的条件(clause)语句中的代码，组成了独立的隐式区块
	"{"和"}"包裹的代码，组成一个隐式区块

#### 声明的作用域(Declarations and scope)

声明就是设置标记符(identifier)的过程，实现标记符以下内容的绑定：

	constant，常量
	type，类型
	variable，变量
	function，函数
	label，标记
	package，包

声明的语法格式：

	Declaration   = ConstDecl | TypeDecl | VarDecl .
	TopLevelDecl  = Declaration | FunctionDecl | MethodDecl .

在包区块中，`init`只能用于声明init函数。

声明的效果是限定在区块中的。

	go内置的标记符在终极区块(universe block)中有效
	在函数之外声明的常量、类型、变量、函数在包区块(package block)中有效，注意不包括方法(method)。
	通过import导入的包(package)的名字，在文件区块(file block)中有效
	声明的方法的接收者(receiver)、函数参数、函数返回值，在函数的代码区块中有效
	在函数的代码区块中声明的常量、变量、类型，在声明位置和所在的最内层区块的末尾之间有效

代码区块是可以嵌套的，内层代码区块中的声明在内存代码区块中覆盖外层代码区块中的声明。

#### 标记作用域(Label scopes)

标记(Label)的作用域与其它的标记符不同，它被用于`break`、`continue`、`goto`。

标记一旦声明，必须使用，否则编译报错。

标记在函数内声明，它在整个函数区块以及函数区块的嵌入区块中有效，并且可以与其它标识符同名，

#### 内置的标记符

go内置了空白标记符(Blank identifier)和预声明的标记服(Predeclared identifiers)。

空白标记符就是一个下划线`_`，表示对应的目标不被声明。

预声明的标记符有以下这些:

	Types:
	    bool byte complex64 complex128 error float32 float64
	    int int8 int16 int32 int64 rune string
	    uint uint8 uint16 uint32 uint64 uintptr
	
	Constants:
	    true false iota
	
	Zero value:
	    nil
	
	Functions:
	    append cap close complex copy delete imag len
	    make new panic print println real recover

#### 标识符的导出(Exported identifiers)

可以将包区块(package block)中的满足条件的标记符导出到其它包区块中。

	标记符必须以大写字母开头(Unicode upper case letter)
	标记符是在包区块中声明的，或者是结构的成语名（filed name)、方法名(method name)

不符合这两点的标记符不能导出。

#### 标记符的唯一性(Uniqueness of identifiers)

不同名的两个标记符是不同的，在不同的包中同名的两个标记符也不同的。

#### 常量的声明(Constant declarations)

常量的声明是将常量、常量表达式绑定到指定的标记符，之后可用标记符读取常量。

	ConstDecl      = "const" ( ConstSpec | "(" { ConstSpec ";" } ")" ) .
	ConstSpec      = IdentifierList [ [ Type ] "=" ExpressionList ] .
	
	IdentifierList = identifier { "," identifier } .
	ExpressionList = Expression { "," Expression } .

有以下几种声明样式：

	const Pi float64 = 3.14159265358979323846
	const zero = 0.0         // untyped floating-point constant
	const (
	    size int64 = 1024
	    eof        = -1  // untyped integer constant
	)
	const a, b, c = 3, 4, "foo"  // a = 3, b = 4, c = "foo", untyped integer and string constants
	const u, v float32 = 0, 3    // u = 0.0, v = 3.0

在使用小括号样式时，如果后续声明的常量表达式是相同的，那么可以省略这些常量表达样式。

下面的声明:

	const (
	    Sunday = iota
	    Monday
	    Tuesday
	)

等同于：

	const (
	    Sunday = iota
	    Monday = iota
	    Tuesday = iota
	)

go内置常量iota是一个特殊的常量表达式，它在`const`关键字之后第一次出现是value是0，在后续的每次声明中，value增加1，直到遇到下一个const后，重新归零。

	const ( // iota is reset to 0
	    c0 = iota  // c0 == 0
	    c1 = iota  // c1 == 1
	    c2 = iota  // c2 == 2
	)
	
	const ( // iota is reset to 0
	    a = 1 << iota  // a == 1
	    b = 1 << iota  // b == 2
	    c = 3          // c == 3  (iota is not used but still incremented)
	    d = 1 << iota  // d == 8
	)
	
	const ( // iota is reset to 0
	    u         = iota * 42  // u == 0     (untyped integer constant)
	    v float64 = iota * 42  // v == 42.0  (float64 constant)
	    w         = iota * 42  // w == 84    (untyped integer constant)
	)
	
	const x = iota  // x == 0  (iota has been reset)
	const y = iota  // y == 0  (iota has been reset)

注意，在同一个声明中出现的多个itoa的value是相同的：

	const (
	    bit0, mask0 = 1 << iota, 1<<iota - 1  // bit0 == 1, mask0 == 0
	    bit1, mask1                           // bit1 == 2, mask1 == 1
	    _, _                                  // skips iota == 2
	    bit3, mask3                           // bit3 == 8, mask3 == 7
	)

#### 类型声明

类型用关键字type进行声明。

	TypeDecl     = "type" ( TypeSpec | "(" { TypeSpec ";" } ")" ) .
	TypeSpec     = identifier Type .

类型声明也有几种样式:

	type IntArray [16]int
	
	type (
	    Point struct{ x, y float64 }
	    Polar Point
	)
	
	type TreeNode struct {
	    left, right *TreeNode
	    value *Comparable
	}
	
	type Block interface {
	    BlockSize() int
	    Encrypt(src, dst []byte)
	    Decrypt(src, dst []byte)
	}

需要注意，为一个类型声明了另一个标记符之后，这个标记符对应的类型不会得到被声明的类型的方法。

	// A Mutex is a data type with two methods, Lock and Unlock.
	type Mutex struct         { /* Mutex fields */ }
	func (m *Mutex) Lock()    { /* Lock implementation */ }
	func (m *Mutex) Unlock()  { /* Unlock implementation */ }
	
	// NewMutex has the same composition as Mutex but its method set is empty.
	type NewMutex Mutex
	
	// The method set of the base type of PtrMutex remains unchanged,
	// but the method set of PtrMutex is empty.
	type PtrMutex *Mutex

#### 变量的声明(Variable declarations)

	VarDecl     = "var" ( VarSpec | "(" { VarSpec ";" } ")" ) .
	VarSpec     = IdentifierList ( Type [ "=" ExpressionList ] | "=" ExpressionList ) .

变量有以下几种声明格式:

	var i int
	var U, V, W float64
	var k = 0
	var x, y float32 = -1, -2
	var (
	    i       int
	    u, v, s = 2.0, 3.0, "bar"
	)
	var re, im = complexSqrt(-1)
	var _, found = entries[name]  // map lookup; only interested in "found"

如果声明时没有赋值，变量的值为对应的类型的零值(zero value)。

如果声明时没有指定类型，变量的类型根据赋的值推导出来：

	var d = math.Sin(0.5)  // d is float64
	var i = 42             // i is int
	var t, ok = x.(T)      // t is T, ok is bool

特别注意，如果没有指定类型，赋值时不能使用nil：

	var n = nil            // illegal

#### 变量的简单声明(Short variable declarations)

变量还可以使用简短的方式声明。

	ShortVarDecl = IdentifierList ":=" ExpressionList .

例如：

	i, j := 0, 10
	f := func() int { return 7 }
	ch := make(chan int)
	r, w := os.Pipe(fd)  // os.Pipe() returns two values
	_, y, _ := coord(p)  // coord() returns three values; only interested in y coordinate

使用简短方式时必须注意，":="右边必须有新的标记符：

	field1, offset := nextField(str, 0)
	field2, offset := nextField(str, offset)  // redeclares offset
	a, a := 1, 2                              // illegal: double declaration of a or no new variable 
	                                          // if a was declared elsewhere

简单方式比较适合在"if"、"for"、"switch"语句声明只会在本区块中使用的变量。

#### 函数的声明(Function declarations)

函数使用关键字`func`声明。

	FunctionDecl = "func" FunctionName ( Function | Signature ) .
	FunctionName = identifier .
	Function     = Signature FunctionBody .
	FunctionBody = Block .

如果函数类型中有返回值，函数声明中必须在每个路径的最后进行return。

	func IndexRune(s string, r rune) int {
	    for i, c := range s {
	        if c == r {
	            return i
	        }
	    }
	    // invalid: missing return statement
	}

可以声明一个不是用go实现的函数，在声明中省略函数体即可。

	func flushICache(begin, end uintptr)  // implemented externally

#### 方法的声明(Method declarations)

方法也用关键字`func`声明，但是格式不同，比函数声明多了一个Receiver。

	MethodDecl   = "func" Receiver MethodName ( Function | Signature ) .
	Receiver     = Parameters .

Receiver的类型是`T`或者`*T`，T的类型不能是指针和接口，并且必须是在同一个包中定义的。

Receiver可以设置标记符，标记符在方法的区块中有效，且不能与方法中的其它标记符重名。

	func (p *Point) Length() float64 {
	   return math.Sqrt(p.x * p.x + p.y * p.y)
	}
	
	func (p *Point) Scale(factor float64) {
	   p.x *= factor
	   p.y *= factor
	}

方法的类型是函数，例如上面声明的方法Scale，它的类型是：

	func(p *Point, factor float64)

### 表达式

表达式是用运算符和函数的描述的一个计算过程。

#### 常量表达式(Constant expressions)

常量表达式在编译时执行，常量表达式中只能使用常量。

使用常量表达式时，需要特别注意未明确声明类型的常量的类型。

	const a = 2 + 3.0             // a == 5.0   (untyped floating-point constant)
	const b = 15 / 4              // b == 3     (untyped integer constant)
	const c = 15 / 4.0            // c == 3.75  (untyped floating-point constant)
	const Θ float64 = 3/2         // Θ == 1.0   (type float64, 3/2 is integer division)
	const Π float64 = 3/2.        // Π == 1.5   (type float64, 3/2. is float division)
	const d = 1 << 3.0            // d == 8     (untyped integer constant)
	const e = 1.0 << 3            // e == 8     (untyped integer constant)
	const f = int32(1) << 33      // illegal    (constant 8589934592 overflows int32)
	const g = float64(2) >> 1     // illegal    (float64(2) is a typed floating-point constant)
	const h = "foo" > "bar"       // h == true  (untyped boolean constant)
	const j = true                // j == true  (untyped boolean constant)
	const k = 'w' + 1             // k == 'x'   (untyped rune constant)
	const l = "hi"                // l == "hi"  (untyped string constant)
	const m = string(k)           // m == "x"   (type string)
	const Σ = 1 - 0.707i          //            (untyped complex constant)
	const Δ = Σ + 2.0e-4          //            (untyped complex constant)
	const Φ = iota*1i - 1/1i      //            (untyped complex constant)
	
complex是内置的函数，返回常量：

	const ic = complex(0, c)      // ic == 3.75i  (untyped complex constant)
	const iΘ = complex(0, Θ)      // iΘ == 1i     (type complex128)
	
如果常量的值超过了能够表达的范围，这个常量可以作为中间值使用：

	const Huge = 1 << 100         // Huge == 1267650600228229401496703205376  (untyped integer constant)
	const Four int8 = Huge >> 98  // Four == 4                                (type int8)

除数不能为0：

	const n = 3.14 / 0.0          // illegal: division by zero

不可以将常量转换为不匹配的类型：

	uint(-1)     // -1 cannot be represented as a uint
	int(3.14)    // 3.14 cannot be represented as an int
	int64(Huge)  // 1267650600228229401496703205376 cannot be represented as an int64
	Four * 300   // operand 300 cannot be represented as an int8 (type of Four)
	Four * 100   // product 400 cannot be represented as an int8 (type of Four)

#### 选择表达式(Selector)

选择表达式的格式如下:

	x.f

其中f是选择器(selector)，类型为f，它不能是空白标记符`_`。

如果x是包名，那么选择的是包中的标记符。

f可以是x的成员、方法、匿名成员、匿名成员的方法，到达f时经过的选择次数是f的深度(depth)。

如果f是x的直接成员，深度为0，f是x的直接匿名成员的成员，深度为f在匿名成员中的深度+1。

选择表达式遵循下面的规则：

	x的类型为T或者*T，并且T不是指针和接口，x.f是T中深度最小的名为f的成员。
	x的类型为T，T是接口, x.f是x的动态类型的名为f的方法。
	如果x是指针，x.f是(*x).f的简写，两者等同

如果按照上面的规则，找不到f，编译或运行时报错。

对于下面的代码：

	type T0 struct {
		x int
	}
	
	func (*T0) M0()
	
	type T1 struct {
		y int
	}
	
	func (T1) M1()
	
	type T2 struct {
		z int
		T1
		*T0
	}
	
	func (*T2) M2()
	
	type Q *T2
	
	var t T2     // with t.T0 != nil
	var p *T2    // with p != nil and (*p).T0 != nil
	var q Q = p

可以有这么些选择方法：

	t.z          // t.z
	t.y          // t.T1.y
	t.x          // (*t.T0).x
	
	p.z          // (*p).z
	p.y          // (*p).T1.y
	p.x          // (*(*p).T0).x
	
	q.x          // (*(*q).T0).x        (*q).x is a valid field selector
	
	p.M0()       // ((*p).T0).M0()      M0 expects *T0 receiver
	p.M1()       // ((*p).T1).M1()      M1 expects T1 receiver
	p.M2()       // p.M2()              M2 expects *T2 receiver
	t.M2()       // (&t).M2()           M2 expects *T2 receiver, see section on Calls

注意q没有选择`M0()`，因为M0()的Reciver类型是`*T1`，类型Q中不能继承T1的方法。

#### 方法表达式(Method expressions)

方法(method)表达式就是方法的实现语句。

	MethodExpr    = ReceiverType "." MethodName .
	ReceiverType  = TypeName | "(" "*" TypeName ")" | "(" ReceiverType ")" .

与函数的不同的是，方法是有接收者(Receiver)的，如下：

	type T struct {
	        a int
	}
	func (tv  T) Mv(a int) int         { return 0 }  // value receiver
	func (tp *T) Mp(f float32) float32 { return 1 }  // pointer receiver
	
	var t T

方法是属于类型的，类型的方法和类型的指针的方法是不同的。

类型的方法是一个将接收者作为参数传入的函数，例如在上面例子中:

	T.Mv 的类型为 func(tv T, a int) int
	T.Mp 的类型为 func(tv *T, a int) int

类型的方法可以直接通过类型名调用：

	T.Mv(t, 7)             //注意要传入接收者
	(T).Mv(t, 7)
	(*T).Mp(&t, 7)         //注意传入的是接收者是指针

类型不能调用类型指针的方法，类型指针可以调用类型的方法：

	T.Mp(&t,7)       //Mp是(*T)的方法，不允许T调用
	(*T).Mv(t,7)     //Mv是T的方法，*T可以调用

也可以把方法赋值给变量，然后通过变量调用:

	f1 := T.Mv; f1(t, 7)         //要传入接受者t
	f2 := (T).Mv; f2(t, 7)       //要传入接受者t
	
	f3 := T.Mp; f3(&t, 7)         //要传入接受者&t
	f4 := (T).Mp; f4(&t, 7)       //要传入接受者&t

也可以通过该类型的变量调用，这时候不需要传入接收者。

	t.Mv(7)
	t.Mp(7)

因为变量的方法和类型的方法是不同的，所以不需要传入接收者。

	t.Mv 的类型为 func(a int) int
	t.Mp 的类型为 func(a int) int

无论一个变量(t)是不是指针(类型为`*T`的变量），它都既可以调用类型(T)的方法，也可以调用类型指针(`*T`)的方法。go语言自身代为完成了取址和取值操作。

变量的方法也可以存放单独的变量中，然后通过变量调用：

	f := t.Mv; f(7)   // like t.Mv(7)
	f := pt.Mp; f(7)  // like pt.Mp(7)
	f := pt.Mv; f(7)  // like (*pt).Mv(7)
	f := t.Mp; f(7)   // like (&t).Mp(7)
	f := makeT().Mp   // invalid: result of makeT() is not addressable

变量的类型为接口时，用同样的方式调用方法：

	var i interface { M(int) } = myVal
	f := i.M; f(7)  // like i.M(7)

#### 索引表达式(Index expressions)

索引表达式格式如下：

	a[x]

a的类型不同，表达式的运行结果不同。

	如果a不是字典，x的必须是整数，并且0<= x <len(a)
	如果a是数组，返回数组中x位置处的成员，如果x超出数组范围，程序panic
	如果a是指向数组的指针，a[x]等同于(*a)[x]
	如果a是分片(Slice)， a[x]返回x位置处的数组成员，如果x超出范围，程序panic
	如果a是字符串，返回x位置处的字符，如果x超出范围，程序panic，且a[x]不能被赋值
	如果a是字典(map)，x的类型必须是字典的key的类型，返回字典中x对应的值，和表示对应成员是否存在的布尔类型的值(bool)
	如果a是字典(map)，且a的值是nil，a[x]返回字典中成员类型的零值

#### 分片表达式(Slice expressions)

分片表达式适用于字符串、数组、指向数组的指针和分片。

	a[low : high]

返回一个从零开始，长度为high-low的分片。

	a := [5]int{1, 2, 3, 4, 5}
	s := a[1:4]

得到分片s的情况如下：

	s[0] == 2
	s[1] == 3
	s[2] == 4

分片表达式中low和high省略：

	a[2:]  // same as a[2 : len(a)]
	a[:3]  // same as a[0 : 3]
	a[:]   // same as a[0 : len(a)]

如果a是指向数组的指针，a[low:high]等同于`(*a)[low:high]`。

如果a是字符串、数组、指向数组的指针，low和high的取值范围为：

	0 <= low <= high <= len(a)

如果a是分片，low和high的取值范围为：

	0 <= low <= high <= cap(a)

low和high超出范围时，引发panic。

如果a是已经声明字符串、分片，返回值也是字符串、分片。

如果a是未声明的字符串，返回一个类型为字符串的变量.

如果a是数组，返回指向这个数组的分片。

#### 完整分片表达式(Full slice expressions)

完整的分片表达式还带有一个max，限定返回的分片的容量为(capacity)为`max-low`。

	a[low : high : max]

在完整的分片表达式中，只有low可以省略，默认为0。

如果a是字符串、数组、指向数组的指针，low和high的取值范围为：

	0<= low <= high <= max <= len(a)

如果a是分片，low、high和max的取值范围为：

	0<= low <= high <= max <= cap(a)

如果超出范围，引发panic。

#### 类型断言表达式(Type assertions expressions)

断言表达式用来判断x是否不为nil，且它的类型是否与T匹配。

	x.(T)

如果T不是接口类型，x的类型必须是接口，判断T是否可以成为x的动态类型。

如果T是接口类型，判断x是否实现了接口T。

如果T不是接口类型，x的类型也不是接口，引发panic。

如果断言成立，表达式的值就是类型为T的x，和布尔值true；如果断言不成立，表达式的值是类型T的零值，和布尔值false。

#### 调用表达式(Call expressions)

调用表达式适用于函数和方法：

	f(a1, a2, … an)

针对方法使用时，需要带有receiver:

	math.Atan2(x, y)  // function call
	var pt *Point
	pt.Scale(3.5)     // method call with receiver pt

传入值按值、按顺序传递给函数或方法的参数，返回值也是按值传递的。

如果一个函数的返回值，满足另一个参数的传入参数要求，可以写成`f(g(parameters_of_g))`，例如：

	func Split(s string, pos int) (string, string) {
	        return s[0:pos], s[pos:]
	}
	
	func Join(s, t string) string {
	        return s + t
	}
	
	if Join(Split(value, len(value)/2)) != value {
	        log.Panic("test fails")
	}

调用表达式支持变长参数，变长参数必须是最后一个，且类型前是`...`。

例如在下面的函数中：

	func Greeting(prefix string, who ...string)

如果以这种方式调用，参数who的值是nil：

	Greeting("nobody")

如果以这种方式调用，参数who的值的类型是[]string：

	Greeting("hello:", "Joe", "Anna", "Eileen")

如果以这种方式调用，参数who等于s：

	s:= []string{"James", "Jasmine"}
	Greeting("goodbye:", s...)

### 运算符(Operator)

运算符用于构成表达式。

	Expression = UnaryExpr | Expression binary_op Expression .
	UnaryExpr  = PrimaryExpr | unary_op UnaryExpr .

	binary_op  = "||" | "&&" | rel_op | add_op | mul_op .
	rel_op     = "==" | "!=" | "<" | "<=" | ">" | ">=" .
	add_op     = "+" | "-" | "|" | "^" .
	mul_op     = "*" | "/" | "%" | "<<" | ">>" | "&" | "&^" .

	unary_op   = "+" | "-" | "!" | "^" | "*" | "&" | "<-" .

运算符都是go语言内置的。

	Precedence    Operator
	    5             *  /  %  <<  >>  &  &^
	    4             +  -  |  ^
	    3             ==  !=  <  <=  >  >=
	    2             &&
	    1             ||

优先级相同的二元运算符按照先左后右的顺序结合：

	x / y * z

等同于：

	(x / y) * z

#### 算数运算符(Arithmetic operators)

	+    sum                    integers, floats, complex values, strings
	-    difference             integers, floats, complex values
	*    product                integers, floats, complex values
	/    quotient               integers, floats, complex values
	%    remainder              integers
	
	&    bitwise AND            integers
	|    bitwise OR             integers
	^    bitwise XOR            integers
	&^   bit clear (AND NOT)    integers
	
	<<   left shift             integer << unsigned integer
	>>   right shift            integer >> unsigned integer

#### 字符串拼接(String concatenation)

字符串可以用运算符"+"进行拼接：

	:= "hi" + string(c)
	s += " and good bye"

#### 比较运算符(Comparison operators)

	==    equal
	!=    not equal
	<     less
	<=    less or equal
	>     greater
	>=    greater or equal

#### 逻辑运算符(Logical operators)

	&&    conditional AND    p && q  is  "if p then q else false"
	||    conditional OR     p || q  is  "if p then true else q"
	!     NOT                !p      is  "not p"

#### 地址运算符(Address operators)

	&     
	*  

#### 读取运算符(Receive operator)

	v1 := <-ch
	v2 = <-ch
	f(<-ch)
	<-strobe  // wait until clock pulse and discard received value

#### 类型转换(Conversions)

	Conversion = Type "(" Expression [ "," ] ")" .

### 语句

Go 的状态语句 

	Statement =
	    Declaration | LabeledStmt | SimpleStmt |
	    GoStmt | ReturnStmt | BreakStmt | ContinueStmt | GotoStmt |
	    FallthroughStmt | Block | IfStmt | SwitchStmt | SelectStmt | ForStmt |
	    DeferStmt .
	
	SimpleStmt = EmptyStmt | ExpressionStmt | SendStmt | IncDecStmt | Assignment | ShortVarDecl .


#### 终止语句(Terminating statements)

终止语句是指下的情况：

	return
	goto
	调用内置函数panic(interface{})
	if语句以及else语句中语句的结束
	for语句语句的结束
	switch语句语句
	select
	labeled 

#### 空白语句(Empty statements)

空白语句不做任何事情：

	EmptyStmt = .

#### 标记语句(Labeled statements)

标记语句可以是goto、break、continue的目标。

	LabeledStmt = Label ":" Statement .
	Label       = identifier .

#### 表达式语句(Expression statements)

除了下面的内置函数，其它的函数、方法和接收操作符都可以用于表达式语句。

	append cap complex imag len make new real
	unsafe.Alignof unsafe.Offsetof unsafe.Sizeof

#### 发送语句(Send statements)

发送语句是专用于向通道(channel)发送数据的。

	SendStmt = Channel "<-" Expression .
	Channel  = Expression .

#### 递增递减语句(IncDec statements)

	IncDecStmt = Expression ( "++" | "--" ) .

#### 赋值语句(Assignments)

	Assignment = ExpressionList assign_op ExpressionList .
	assign_op = [ add_op | mul_op ] "=" .

#### if语句(If statements)

	IfStmt = "if" [ SimpleStmt ";" ] Expression Block [ "else" ( IfStmt | Block ) ] .

#### switch语句(Switch statements)

switch语句分为以表达式为依据，和以类型为依据两种形式。

	SwitchStmt = ExprSwitchStmt | TypeSwitchStmt .

使用表达式作为分支依据：
	
	ExprSwitchStmt = "switch" [ SimpleStmt ";" ] [ Expression ] "{" { ExprCaseClause } "}" .
	ExprCaseClause = ExprSwitchCase ":" StatementList .
	ExprSwitchCase = "case" ExpressionList | "default" .

例如:

	switch tag {
	default: s3()
	case 0, 1, 2, 3: s1()
	case 4, 5, 6, 7: s2()
	}
	
	switch x := f(); {  // missing switch expression means "true"
	case x < 0: return -x
	default: return x
	}
	
	switch {
	case x < y: f1()
	case x < z: f2()
	case x == 4: f3()
	}

使用类型为依据：

	TypeSwitchStmt  = "switch" [ SimpleStmt ";" ] TypeSwitchGuard "{" { TypeCaseClause } "}" .
	TypeSwitchGuard = [ identifier ":=" ] PrimaryExpr "." "(" "type" ")" .
	TypeCaseClause  = TypeSwitchCase ":" StatementList .
	TypeSwitchCase  = "case" TypeList | "default" .
	TypeList        = Type { "," Type } .

例如：

	switch i := x.(type) {
	case nil:
	    printString("x is nil")                // type of i is type of x (interface{})
	case int:
	    printInt(i)                            // type of i is int
	case float64:
	    printFloat64(i)                        // type of i is float64
	case func(int) float64:
	    printFunction(i)                       // type of i is func(int) float64
	case bool, string:
	    printString("type is bool or string")  // type of i is type of x (interface{})
	default:
	    printString("don't know the type")     // type of i is type of x (interface{})
	}

#### for语句(For statements)

for的语句循环条件有三种。

	ForStmt = "for" [ Condition | ForClause | RangeClause ] Block .
	Condition = Expression .

简略条件判断：

	for a < b {
	    a *= 2
	}

完整条件判断：

	ForClause = [ InitStmt ] ";" [ Condition ] ";" [ PostStmt ] .
	InitStmt = SimpleStmt .
	PostStmt = SimpleStmt .

例如:

	for i := 0; i < 10; i++ {
	    f(i)
	}
	
	for cond { S() }    is the same as    for ; cond ; { S() }
	for      { S() }    is the same as    for true     { S() }

range判断：

	RangeClause = [ ExpressionList "=" | IdentifierList ":=" ] "range" Expression .

需要特别注意的是Expression不同时，`range Expression`的返回值不同。

	Range expression                          1st value          2nd value
	
	array or slice  a  [n]E, *[n]E, or []E    index    i  int    a[i]       E
	string          s  string type            index    i  int    see below  rune
	map             m  map[K]V                key      k  K      m[k]       V
	channel         c  chan E, <-chan E       element  e  E

#### go语句(Go statements)

	Stmt = "go" Expression .

#### select语句(Select statements)

select语句用于执行当前可以执行的语句。

	SelectStmt = "select" "{" { CommClause } "}" .
	CommClause = CommCase ":" StatementList .
	CommCase   = "case" ( SendStmt | RecvStmt ) | "default" .
	RecvStmt   = [ ExpressionList "=" | IdentifierList ":=" ] RecvExpr .
	RecvExpr   = Expression .

如果有多个语句当前都可以执行，需要特别注意这些语句的执行顺序。

	1. 通道(channel)相关的语句如果同时进入可执行状态，只执行在源码中位置靠前的语句
	2. 如果多个语句可以执行，随机选择一个执行。
	3. 如果所有语句都不能执行，那么执行default语句，如果没有default语句，进入等待状态

例如:

	var a []int
	var c, c1, c2, c3, c4 chan int
	var i1, i2 int
	select {
	case i1 = <-c1:
	    print("received ", i1, " from c1\n")
	case c2 <- i2:
	    print("sent ", i2, " to c2\n")
	case i3, ok := (<-c3):  // same as: i3, ok := <-c3
	    if ok {
	        print("received ", i3, " from c3\n")
	    } else {
	        print("c3 is closed\n")
	    }
	case a[f()] = <-c4:
	    // same as:
	    // case t := <-c4
	    //    a[f()] = t
	default:
	    print("no communication\n")
	}

	for {  // send random sequence of bits to c
	    select {
	    case c <- 0:  // note: no statement, no fallthrough, no folding of cases
	    case c <- 1:
	    }
	}

	select {}  // block forever

#### 返回语句(Return statements)

	ReturnStmt = "return" [ ExpressionList ] .

例如:

	func simpleF() int {
	    return 2
	}

支持多值返回:

	func complexF1() (re float64, im float64) {
	    return -7.0, -4.0
	}

可以直接将表达式的结果返回：

	func complexF2() (re float64, im float64) {
	    return complexF1()
	}

还可以命名返回：

	func complexF3() (re float64, im float64) {
	    re = 7.0
	    im = 4.0
	    return
	}

	func (devnull) Write(p []byte) (n int, _ error) {
	    n = len(p)
	    return
	}

命名的返回的时候，不同有同名的其它变量：

	func f(n int) (res int, err error) {
	    if _, err := f(n-1); err != nil {
	        return  // invalid return statement: err is shadowed
	    }
	    return
	}

#### break语句(Break statement)

	BreakStmt = "break" [ Label ] .

例如:

	OuterLoop:
	    for i = 0; i < n; i++ {
	        for j = 0; j < m; j++ {
	            switch a[i][j] {
	            case nil:
	                state = Error
	                break OuterLoop
	            case item:
	                state = Found
	                break OuterLoop
	            }
	        }
	    }

#### continue语句(Continue statements)

	ContinueStmt = "continue" [ Label ] .

例如:

	RowLoop:
		for y, row := range rows {
			for x, data := range row {
				if data == endOfRow {
					continue RowLoop
				}
				row[x] = data + bias(x, y)
			}
		}

#### goto语句(Goto statements)

	GotoStmt = "goto" Label .

使用goto的时候要特别注意，不要在goto与Label直接存在变量的声明。

例如下面的做法符合语法要求，但是容易造成混乱，在`L:`之后的位置使用i，会报错：

		goto L  // BAD
		v := 3
	L:

goto只能跳转到所在区块中的标记位置。

例如下面的做法是不符合语法的，L1是另一个区块中的标记。

	if n%2 == 1 {
		goto L1
	}
	for n > 0 {
		f()
		n--
	L1:
		f()
		n--
	}

#### fallthrough语句(Fallthrough statements)

fallthrouch用于switch语句中，表示紧邻的下一个语句需要被执行。

	FallthroughStmt = "fallthrough" .

#### defer语句(Defer statements)

defer表示跟随的语句需要在函数执行结束的时候执行。

	DeferStmt = "defer" Expression .

例如：

	lock(l)
	defer unlock(l)  // unlocking happens before surrounding function returns

	// prints 3 2 1 0 before surrounding function returns
	for i := 0; i <= 3; i++ {
		defer fmt.Print(i)
	}

	// f returns 1
	func f() (result int) {
		defer func() {
			result++
		}()
		return 0
	}

### 包定义和导入

声明包：

	PckageClause  = "package" PackageName .
	PackageName    = identifier .

导入包(Import declarations)：

	ImportDecl       = "import" ( ImportSpec | "(" { ImportSpec ";" } ")" ) .
	ImportSpec       = [ "." | PackageName ] ImportPath .
	ImportPath       = string_lit .

例如：

	Import declaration          Local name of Sin
	
	import   "lib/math"         math.Sin
	import m "lib/math"         m.Sin
	import . "lib/math"         Sin
	import _ "lib/math"

## 语句用法

### 遍历 － For statements

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
10. [go Lexical elements][10]

[1]: http://127.0.0.1:8080/ref/spec  "Go Language Specification"
[2]: http://127.0.0.1:8080/ref/spec#Pointer_types  "Go Spec: Pointer Type" 
[3]: http://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2017/04/28/golang-specification.html "The Go Programming Language Specification"
[4]: https://127.0.0.1:8080/ref/spec#Address_operators "Go Spec: Address operators"
[5]: http://127.0.0.1:8080/ref/spec#Struct_types "Go Spec: Struct Type"
[6]: http://127.0.0.1:8080/ref/spec#Types "Go Spec: Types"
[7]: http://127.0.0.1:8080/ref/spec#For_statements "Go Spec: For statements"
[8]: http://127.0.0.1:8080/ref/spec#Map_types  "Go Spec: Map types"
[9]: http://127.0.0.1:8080/ref/spec#Index_expressions  "Go Spec: Index expressions"
[10]: https://golang.org/ref/spec#Lexical_elements "go Lexical elements"
