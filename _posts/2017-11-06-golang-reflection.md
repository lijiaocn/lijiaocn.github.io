---
layout: default
title: "go 语言的反射操作 reflection"
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

在 go 的官网上有一篇文章很详细的介绍了go语言的反射机制: [The Laws of Reflection][1]。

## 反射实现的前提

反射是建立在类型之上:

	reflection builds on the type system

go 的变量类型是静态的，在创建变量的时候就已经确定。反射主要与 interface 类型一起提供一定的动态类型能力。

在 go 的实现中，每个 interface 变量都有一个对应 pair，pair 中记录了实际变量的值和类型:

	(value, type)
	
	value是实际变量值，type是实际变量的类型

例如，创建类型为 `*os.File` 的变量，然后将其赋给一个接口变量 `r`：

	tty, err := os.OpenFile("/dev/tty", os.O_RDWR, 0)
	
	var r io.Reader
	r = tty

接口类型变量 r 的pair 中将记录如下信息：

	(tty, *os.File)   // value tty，类型 *os.File

这个 pair 在接口变量的连续赋值过程中是不变的，将接口变量 r 赋给另一个接口变量 w:

	var w io.Writer
	w = r.(io.Writer)

接口变量 w 的 pair 与 r 的 pair 相同，都是:

	(tty, *os.File)

即使 w 是空接口类型，pair 也是不变的。

pair 是 go中实现反射的前提，理解了pair，就更容易理解反射。

##  TypeOf 和 ValueOf

`reflect.TypeOf()` 是获取 pair 中的 type，`reflect.ValueOf()`获取 pair 中的 value：

```go
func TestReflect(t *testing.T) {
    var x float64 = 3.14526
    t.Logf("type: %v", reflect.TypeOf(x))
    t.Logf("value: %v", reflect.ValueOf(x))
}
```

运行时输出的结果是:

	type:  float64
	value: 3.14526

pair 中的 value 和 type 用类型 `reflect.Value`和 `reflect.Type` 描述。

### reflect.Type

reflect.Type 是一个 interface，通过它可以获取类型相关信息：

```go
func TestReflectType(t *testing.T) {
    type Demo struct {
        Name string  `json:"name"`
        Age  int     `json:"age"`
        Desc *string `yaml:"desc" json:"desc"`
    }
    d := Demo{Name: "hello", Age: 10}
    dtype := reflect.TypeOf(d)
    for i := 0; i < dtype.NumField(); i++ {
        field := dtype.Field(i)
        t.Logf("%d name: %s, type: %v, tag: %v", i, field.Name, field.Type, field.Tag)
    }
}
```

输出：

```
0 name: Name, type: string, tag: json:"name"
1 name: Age, type: int, tag: json:"age"
2 name: Desc, type: *string, tag: yaml:"desc" json:"desc"``
```

### reflect.Value

reflect.Value 是一个 struct 类型，可以通过它的 method 获取 value 的 type 和 kind，并根据 kind 类型转换成对应数值以及发起操作（函数调用、channel读取写入）。

#### Type() 和 Kind()

注意 type 和 kind 的区别，type 是编码时定义的各种类型，kind 是有限的变量种类，有且只有几种 [kind][2]：

```go
func TestRefelctValue(t *testing.T) {
    type Demo struct {
        Name string
        Desc *string
    }

    d := Demo{
        Name: "hello",
        Desc: nil,
    }

    // 非指针类型
    dvalue := reflect.ValueOf(d)
    t.Logf("value type: %v", dvalue.Type())
    t.Logf("value kind: %v", dvalue.Kind())

    // 指针类型
    pvalue := reflect.ValueOf(&d)
    t.Logf("ptr value type: %v", pvalue.Type())
    t.Logf("ptr value kind: %v", pvalue.Kind())
}
```

输出：

```
value type: main.Demo
value kind: struct
ptr value type: *main.Demo
ptr value kind: ptr
```

Kind 的全部定义：

```go
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
```
#### Convert()

reflect.Value 提供多种类型转换方法，除了 String 类型转换，其它类型转换都相应提供了一个 Can 方法：

```go
func TestReflectValue_Convert(t *testing.T) {
    str := "this is a str"
    strValue := reflect.ValueOf(str)

    t.Logf("String(): %v", strValue.String())

    if strValue.CanInterface() {
        t.Logf("Interface(): %v", strValue.Interface())
    } else {
        t.Logf("Interface() not allowed")
    }

    if strValue.CanInt() {
        t.Logf("Int(): %v", strValue.Int())
    } else {
        t.Logf("Int() not allowed")
    }

    strType := reflect.TypeOf("")
    if strValue.CanConvert(strType) {
        t.Logf("Str Convert(): %v", strValue.Convert(strType))
    } else {
        t.Logf("Str Convert() not allowed")
    }

    intType := reflect.TypeOf(10)
    if strValue.CanConvert(intType) {
        t.Logf("int Convert(): %v", strValue.Convert(intType))
    } else {
        t.Logf("int Convert() not allowed")
    }
}
```

运行结果如下：

```
String(): this is a str
Interface(): this is a str
Int() not allowed
Str Convert(): this is a str
int Convert() not allowed
```

#### Set()

value 提供了用于修改数值的 Set() 方法，但不是所有的 value 都可以被 set，只有可寻址的 value 可以 set

```go
// CanSet reports whether the value of v can be changed.
// A Value can be changed only if it is addressable and was not
// obtained by the use of unexported struct fields.
// If CanSet returns false, calling Set or any type-specific
// setter (e.g., SetBool, SetInt) will panic.
func (v Value) CanSet() bool {
    return v.flag&(flagAddr|flagRO) == flagAddr
}
```

指针类型的 Elem() 是可以修改的：

```go
func TestRefelctValue_Set(t *testing.T) {
    type Demo struct {
        Name string
        Desc *string
    }
    d := Demo{
        Name: "hello",
        Desc: nil,
    }
    d2 := Demo{
        Name: "hello2",
        Desc: nil,
    }

    // 非指针
    dvalue := reflect.ValueOf(d)
    t.Logf("dvalue CanSet: %v CanAddr: %v", dvalue.CanSet(), dvalue.CanAddr())
    if dvalue.CanSet() {
        dvalue.Set(reflect.ValueOf(d2))
    }
    t.Logf("d: %v", d)

    pvalue := reflect.ValueOf(&d)
    t.Logf("pvalue.Elem() CanSet: %v CanAddr: %v", pvalue.Elem().CanSet(), pvalue.Elem().CanAddr())
    if pvalue.Elem().CanSet() {
        pvalue.Elem().Set(reflect.ValueOf(d2)) //需要用 Elem() 获取指针所指 Value
    }
    t.Logf("d: %v", d)
}
```

运行结果如下：

```
dvalue CanSet: false CanAddr: false
d: {hello <nil>}
pvalue.Elem() CanSet: true CanAddr: true
d: {hello2 <nil>}
```


#### Field  操作

value 提供了 field 相关操作，如果 value 是指针类型，需要先用 Elem() 获取指针所指的 value：

```go
func TestRefelctValue_Field(t *testing.T) {
    type Demo struct {
        Name string
        Desc *string
    }

    d := Demo{Name: "hello", Desc: nil}

    // 非指针类型
    dvalue := reflect.ValueOf(d)
    for i := 0; i < dvalue.NumField(); i++ {
        field := dvalue.Field(i)
        t.Logf("field %d kind: %v, canSet: %v", i, field.Kind(), field.CanSet())
    }

    // 指针类型，需要通过 Elem() 获取指定的 value，只有指针的 Elem().Field 是 canSet
    pvalue := reflect.ValueOf(&d)
    for i := 0; i < pvalue.Elem().NumField(); i++ {
        field := pvalue.Elem().Field(i)
        t.Logf("field %d kind: %v, canSet: %v", i, field.Kind(), field.CanSet())
    }
}
```

运行结果如下：

```
field 0 kind: string, canSet: false
field 1 kind: ptr, canSet: false
field 0 kind: string, canSet: true
field 1 kind: ptr, canSet: true
```

#### Value 的新建 

reflect 的 New() 方法用于创建一个指向指定类型 value 的指针，支持 Set() 操作。可以用下面的方法创建一个 value 并赋值：

```go
func NewTypeValue(t reflect.Type, fields map[string]interface{}) (interface{}, error) {
    var err error
    newValue := reflect.New(t)
    switch newValue.Elem().Kind() {
    case reflect.Struct:
        for fieldName, fieldValue := range fields {
            field := newValue.Elem().FieldByName(fieldName)
            if field.CanSet() {
                field.Set(reflect.ValueOf(fieldValue))
            }
        }
    default:
        err = fmt.Errorf("not struct type")
    }
    if err != nil {
        return nil, err
    }
    if !newValue.CanInterface() {
        return nil, fmt.Errorf("can't convert")
    }
    return newValue.Interface(), nil
}
```

用 type 和 fieldMap 的方式新建变量：

```go
func TestReflect_NewTypeValue(t *testing.T) {
    type Demo struct {
        Name string
        Desc *string
    }

    desc := "this is a desc"
    fieldValue := map[string]interface{}{
        "Name": "hello",
        "Desc": &desc,
    }

    newValue, err := NewTypeValue(reflect.TypeOf(Demo{}), fieldValue)
    if err != nil {
        t.Errorf("fail: err=%v", err)
    } else {
        bytes, _ := json.Marshal(newValue)
        t.Logf("newValue: %s", bytes)
    }
}
```

运行结果如下：

```
newValue: {"Name":"hello","Desc":"this is a desc"}
```

## 参考

1. [The Laws of Reflection][1]
2. [package: reflect][2]

[1]: https://blog.golang.org/laws-of-reflection  "The Laws of Reflection" 
[2]: https://golang.org/pkg/reflect/#Kind "package: reflect"
