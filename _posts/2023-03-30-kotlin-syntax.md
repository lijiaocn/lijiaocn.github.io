---
layout: default
title: "Kotlin 语法一站式手册"
author: 李佶澳
date: "2023-03-30 11:36:56 +0800"
last_modified_at: "2023-04-06 20:18:35 +0800"
categories: 编程
cover:
tags: 语法手册 kotlin
keywords:
description: "Google 给出的 Android 应用示例都用 kotlin 了，简单了解下它的语法，主要内容来自 Kotlin Bootcamp for Programmers"
---

## 目录

* auto-gen TOC:
{:toc}

Google 给出的 Android 应用示例都在用 kotlin ，简单了解下它的语法。主要内容来自 [Kotlin Bootcamp for Programmers][2]。

## kotlin 交互命令行

用 IntelliJ IDEA 创建 kotlin 项目后，点击 Tools->Kotlin->Kotlin REPL 打开 kotlin 的交互命令行。（需要等 Idea 完成项目构建后 Kotlin REPL 菜单才会可用）

![Kotlin REPL]({{ site.article }}/kotlin-repl.png)


## 常量和变量

### 常量

* const 常量只能在文件作用域中定义
* 在编译时确定数值的常量用 const val 声明，运行时确定数值的“常量”（不可更改的变量）用 val 声明
* class 的常量属性需要在 companion object 中定义

```kotlin
fun hello():String{
    return "hello"
}

const val cval1 = "hello"
//const val cval2 = hello()   //函数不能用于常量初始化（编译时无法确定数值）
val val1 = hello()            //val 可以用函数初始化（运行时确认数值）

class ConstDemo{
    companion object{
        const val classConst = "class hello"
//        const val classConst = hello() //也不能用函数
    }
}

fun main() {
//    const val cval3 = "hello"  //局部作用域不能定义常量
    println(cval1)
    println(ConstDemo.classConst)
}
```

### 变量

kotlin 中的变量用关键字 var 声明，不可更改的变量用 val 声明，声明时在 : 后指定类型。

```kotlin
var vr: Int = 6    // Int 类型的变量
val vl: Int = 6    // Int 类型的常量
```

如果对不可更改的变量赋值，会报错：

```kotlin
error: val cannot be reassigned
vl=7
```

声明时如果没有指定类型，自动根据字面值进行推断：

```kotlin
var i = 1_000_000
//i
//res12: kotlin.Int = 1000000

var i = 100.00
//i
//res13: kotlin.Double = 100.0
```

不同类型的变量间赋值时，需要明确进行类型转换，IDE 会自动提示支持的 toXX() 函数：

```kotlin
var i : Int=6
var b = i.toByte()
var c = i.toChar()
var d = i.toDouble()
var s = i.toString()
...
```

变量的字面数值可以用下划线分隔：

```kotlin
val oneMillion = 1_000_000
val socialSecurityNumber = 999_99_9999L
val hexBytes = 0xFF_EC_DE_5E
val bytes = 0b11010010_01101001_10010100_10010010
```

字符串类型支持变量解析，字符串中用 $ 引领的变量会被自动转换成字符串：

```kotlin
var name: String = "小明"
var age: Int = 10
var years: Int = 5
var desc : String = "$name 今年 $age 岁，$years 年后是 ${age+years}岁"
// desc
// res15: kotlin.String = 小明 今年 10 岁，5 年后是 15岁
```

### 允许/不允许 null 的变量

kotlin 自称的一个主要特点就是对 null 的处理，在变量声明时指定该变量是否可以为 null。默认所有变量都不能为 null，如果要允许赋值 null，在声明时用 ? 标记：

```kotlin
var i : Int = 1
i = null
// error: null can not be a value of a non-null type Int
// i = null
```

用 ? 标记后，可以赋值 null：

```kotlin
var i : Int? = 1
i = null
// i
// res24: kotlin.Int? = null
```

Int 和 Int? 是两种不同的类型：

```kotlin
var i : Int = 1
var j : Int?= 2
i = j
// error: type mismatch: inferred type is Int? but Int was expected
// i = j
```

提供了两个判定变量数值是否为 null 的语法糖：? 和 !!。

? 表示变量不为 null 时执行对应方法：

```kotlin
var i : Int? = 3
var j=i?.dec()          // i 不为 null 时，执行 i.dec()，j 为 2
// j
// res27: kotlin.Int? = 2

var i : Int? = 3
i = null
var j=i?.dec()          // i 为 null 时，i.dec() 不执行，j 默认值为 null
// j
// res28: kotlin.Int? = null   
```

? 通常可以和 ?: 一起使用：

```kotlin
var i : Int? = 3
i = null
var j=i?.dec()?:0      // i 为 null 时，j 的值为 ?: 后的值
// j
// res35: kotlin.Int = 0
```

!! 在变量为 null 时抛出异常：

```kotlin
var i : Int? = null
i!!.dec()
// java.lang.NullPointerException
```

## 表达式和语句

在 kotlin 中一切都是表达式，所有表达式都有返回值，函数体中没有返回任何内容的函数表达式的返回值是 kotlin.Unit。

```kotlin
var ret = println("hello world\n")
println(ret)
// hello world
// kotlin.Unit
```

### 循环语句

支持以下循环语句：

* for ( x in XX ) { ... }
* while
* do ... while
* repeat

for 遍历 array 和 list：

```kotlin
var array = arrayOf('a','b','c','d','e','f')   // list 同样适用
for (e in array){
     println(e + " ")
}
println("\n")
for ((i,e) in array.withIndex()){
    println("index $i is $e\n")
}
// a b c d e f 
// index 0 is a
// index 1 is b
// index 2 is c
// index 3 is d
// index 4 is e
// index 5 is f
```

for 支持几种语法糖：

```kotlin
for (i in 1..5 ) println("$i ")
// 1 2 3 4 5 

for (i in 5 downTo 1 ) println("$i ")
// 5 4 3 2 1 

for (i in 1..5 step 2 ) println("$i ")
// 1 3 5 

for (i in 'e' downTo 'a' ) println("$i ")
// e d c b a

for (i in 'a'..'e' ) println("$i ")
// a b c d e 

for (i in 'a'..'e' step 2 ) println("$i ")
// a c e 
```

while 写法：

```kotlin
var i : Int = 1
while (i<10){
    i++
}
i
// res44: kotlin.Int = 10
```

do...while 写法：

```kotlin
var i : Int = 1
do {
    i++
} while (i<10)
i
// res45: kotlin.Int = 10
```

repeat 写法：

```kotlin
var i : Int = 5
repeat(i){
    println("hello\n")
}
// hello
// hello
// hello
// hello
// hello
```

### 条件判断

if...else... 语句和其它语言类似：

```kotlin
val numberOfFish = 50
val numberOfPlants = 23
if (numberOfFish > numberOfPlants) {
    println("Good ratio!") 
} else {
    println("Unhealthy ratio")
}
```

支持 in 语法：

```kotlin
val fish = 50
if (fish in 1..100) {
    println(fish)
}
```

还有一个比较特殊的 when 语法，作用和 go 的 switch 类似：

```kotlin
val numberOfFish = 0

when (numberOfFish) {
     0  -> println("Empty tank")
     in 1..39 -> println("Got fish!")
     else -> println("That's a lot of fish!")
}
```

### 断言语句

* check(xx){XX} 中的表达式 xx 为 false 时，抛出内容为 XX 的异常

```kotlin
fun div(a :Int,b :Int) :Int{
    check(b!=0){ "b is zero"}
    return  a/b
}

fun main() {
    div(10,0)
}
```

如下：

```
Exception in thread "main" java.lang.IllegalStateException: b is zero
    at CheckKt.div(check.kt:3)
    at CheckKt.main(check.kt:8)
    at CheckKt.main(check.kt)
```

```

## 数组和列表

array 和 list 是 kotlin 的基本类型：array 是定长、不可变更的数组；list 有可变更和不可边更两种类型。

### array

array 用 arrayOf 创建，可以包含不同类型的 element：

```kotlin
var i: Int = 1
var j: Double = 2.0
var c: Char = 'a'
var array = arrayOf(i,j,c)
println(java.util.Arrays.toString(array))
```

可以约定 array 中只能有一种类型，用 xxArrayOf() 创建，如果传入 element 类型不匹配会报错：

```kotlin
var array2 = intArrayOf(1,2,3)
```

array 初始包含的 element 可以根据下标计算得出，用 Array() 创建，it 表示从 0 开始的 index：

```kotlin
var array = Array(5){ it * 2 }
 println(java.util.Arrays.toString(array))
[0, 2, 4, 6, 8]
```

array 支持下标取值

```kotlin
var array = arrayOf(1,2,3,4.0,'a',"bcd")
println(array[2])
println(array[5])
// 3bcd
```

array 支持用 + 拼接，但是两个 array 的类型必须相同，否则会报错：

```kotlin
var array = intArrayOf(1,2,3)
var array2 = intArrayOf(4,5,6)
var array3 = array + array2
println(java.util.Arrays.toString(array3))
// [1, 2, 3, 4, 5, 6]
```

### list

用 listOf() 创建的 list 是不可更改的，用 mutableListOf() 创建的 list 是可更改的：

```kotlin
var list1 = listOf(1,2,3,4,'a',"bc")
println(list1)
// [1, 2, 3, 4, a, bc]
```

mutableList 是可改、可删的：

```kotlin
var list = mutableListOf('a','b','c')
list[2]='C'
list
// res36: kotlin.collections.MutableList<kotlin.Char> = [a, b, C]

var list2 = mutableListOf(1,2,3,4,'a',"bc")
list2.remove('a')
println(list2)
// [1, 2, 3, 4, bc]

```

如果有多个数值相同的 element，remove 只删除第一个：

```kotlin
var list1 = mutableListOf(1,'2','2','3','3',"ab","ab",3)
list1.remove("ab")
list1
// res26: kotlin.collections.MutableList<out kotlin.Any> = [1, 2, 2, 3, 3, ab, 3]
```

list 支持用 + 进行拼接，但是拼接后的 list 是不可更改的，即使被被拼接的 list 是可更改的：

```kotlin
var list1 = mutableListOf(1,2,3,4,'a',"bc")
var list2 = mutableListOf(1,2,3,4,'a',"bc")
var list3 = list1+list2
println(list3)
// [1, 2, 3, 4, a, bc, 1, 2, 3, 4, a, bc]

list1
// res21: kotlin.collections.MutableList<out kotlin.Any> = [1, 2, 3, 4, a, bc]

list3
// res20: kotlin.collections.List<kotlin.Any> = [1, 2, 3, 4, a, bc, 1, 2, 3, 4, a, bc]
```

### 操作: filter 和 map

list/array 支持 filter 和 map 操作，在跟随的函数体 {...} 中对代表当前 element 的 it进行处理，相当于传入了一个 lambdas 函数。

* filter 根据{...}中代码结果过滤出部分 element 组成新的 list
* map 遍历处理所有的 element，将每个 element 的处理结果组成新的 list （疑似）

filter 和 map 有立即执行的 eager 模式和延后执行的 lazy 模式。默认是 eager 模式，例如调用 filter() 时立即生成一个 list：

```kotlin
fun eagerFilter(list :List<String>){
    val eager = list.filter { it[0] == 'p' }
    println("eager: $eager")      // eager 是一个已经包含 element 的 list
}
```

lazy 模式返回的是一个变量，需要调用它的 .toList() 才会开始执行生成新的 list 的操作。lazy 模式需要用 .asSequence() 转成 Sequence。

```kotlin
fun lazyFileter(list :List<String>){
    val lazy = list.asSequence().filter { it[0] == 'p' }
    println("lazy: $lazy")
    val newList = lazy.toList()
    println("lazy to list: $newList")
}
```

两种方式的执行效果如下：

```kotlin
fun main() {
    val list = listOf("rock", "pagoda", "plastic plant", "alligator", "flowerpot")
    eagerFilter(list)
    lazyFileter(list)
}
```

```bash
eager: [pagoda, plastic plant]
lazy: kotlin.sequences.FilteringSequence@2f2c9b19
lazy to list: [pagoda, plastic plant]
```

map 也支持两种方式，lazy 模式同样需要先将 list 转成 Sequence：

```kotlin
fun eagerMap(list :List<String>){
    val eagermap = list.map {
        println("eager access: $it")
        it
    }
    println("eagermap: $eagermap")
}

fun lazyMap(list :List<String>){
    val lazymap = list.asSequence().map{
        println("lazy access: $it")
        it
    }
    println("lazymap: $lazymap")
    println("lazymap first: ${lazymap.first()}")
    println("lazymap last: ${lazymap.last()}")
}

fun main() {
    val list = listOf("rock", "pagoda", "plastic plant", "alligator", "flowerpot")
    eagerMap(list)
    lazyMap(list)
}
```

执行结果如下，eager map 立即访问了全部 element，而 lazymap 是在被调用的时候执行：

```bash
eager access: rock
eager access: pagoda
eager access: plastic plant
eager access: alligator
eager access: flowerpot
eagermap: [rock, pagoda, plastic plant, alligator, flowerpot]
lazymap: kotlin.sequences.TransformingSequence@87aac27
lazy access: rock
lazymap first: rock
lazy access: rock
lazy access: pagoda
lazy access: plastic plant
lazy access: alligator
lazy access: flowerpot
```

## pair/triple 和 map

### pair/triple

* pairs 是一个双值类型
* triple 是一个三值类型

```kotlin
fun main() {
    val pair = "value1" to "value2"
    println("${pair.first}  ${pair.second}")

    val pairInPair = ("value1" to "value2") to "value3"
    println("${pairInPair.first}  ${pairInPair.second}")

    val(first,second) = pairInPair
    println("$first $second")

    val tripple = Triple(1,2,3)
    println(tripple.toString())
    println(tripple.toList())

    val(n1,n2,n3) = tripple
    println("$n1 $n2 $n3")
}
```

### map

* map 也分不可更改的和可更改的两类

```kotlin
fun main() {
    val immuableMap = mapOf<String,Int>("xiao ming" to 23,"xiao wang" to 26)
    println(immuableMap.toString())
    println(immuableMap["xiao ming"])
//    immuableMap["xiao ming"] = 20   // 不能更改
//    immuableMap["xiao hong"] = 20   // 不能更改

    val map = mutableMapOf<String,Int>("xiao ming" to 23,"xiao wang" to 26)
    // 或者 val map = hashMapOf<String,Int>("xiao ming" to 23,"xiao wang" to 26)
    println(map.get("xiao ming"))
    println(map["xiao wang"])
    println(map["xiao hong"])
    println(map.getOrDefault("xiao hong",0))
    println(map.getOrElse("xiao hong"){"no value"})

    map["xiao hong"] = 27
    println(map.toString())
    map["xiao hong"] = 28
    map["xiao ming"] = 20
    println(map.toString())
    map.remove("xiao hong")
    println(map.toString())
}
```

## 函数

函数使用关键字 fun 声明。函数本身也是一种类型，入参为 Int 返回值也为 Int 的函数的类型是：(Int)->Int。

>js 函数声明关键字是 function，go 是 func，kotlin 是 fun。真是恶趣味，干脆直接用 f 得了。

```kotlin
fun main(args: Array<String>) {
    println("Hello, world!")
    for ((i,e) in args.withIndex()){
        println("$i: $e")
    }
}
```

函数入参和返回值定义参考 getRandomInt，返回值类型前面有一个 : 号。kotlin 可以直接引用 java 包中的函数，例如下面的 Random() 来自 java.util.*：

```kotlin
import java.util.*

fun getRandomInt(bound: Int): Int {
    return Random().nextInt(bound)
}

fun main() {
    var v : Int = 0
    for (i in 10..50 step 10){
        v = getRandomInt(i)
        println("[0,$i): $v")
    }
}
```

支持参数默认值、命名参数以及压缩写法：

```kotlin
fun defaultParamValue(content :String = "default"){     // 默认
    println("content value is: $content")
}

fun compactFunction(num :Int) = num >20                 //函数压缩写法

fun main() {
    defaultParamValue()                                 //使用默认值
    defaultParamValue("positional argument")            //位置参数
    defaultParamValue(content="named parameter")        //命名参数

    println(compactFunction(10))
    println(compactFunction(30))
}
```

支持将函数名作为参数传入，被传入的函数名前面用 :: 提示：

```kotlin
fun divide3(v :Int): Int{
    return v/3
}

fun funAsParam(v :Int, operation :(Int)->Int) :Int{
    return operation(v)
}

fun main(){
    println("funAsParam: ${funAsParam(9, ::divide3)}")   // divide3前面用 :: 提示

}
```

支持 lambda 函数，lambda 函数有两种写法，一种是带有类型声明，一种是不带类型声明。lambda 函数直接作为函数参数，不需要在名称加 ::。

```kotlin
fun funAsParam(v :Int, operation :(Int)->Int) :Int{
    return operation(v)
}

fun lambdaFunction(){
    val halfValue = {v :Int -> v / 2}                 // 不带类型声明写法，value 直接是函数体
    val doubleValue: (Int) -> Int = { v -> v * 2}     // 带有声明类型， = 后为函数体
    var age :Int = 10
    val ageAdd: () -> Int = { age + 1}                // lambda函数体中可以使用外部变量
    println("halfValue: $halfValue; doubleValue: $doubleValue")
    println("call halfValue: ${halfValue(4)}; call doubleValue: ${doubleValue(4)}")
    println("lambdaAsParam: ${funAsParam(4, halfValue)}")   // lambda 函数直接作为参数，无需在名称前加 ::
    println("ageAdd: ${ageAdd()}")
}
```

执行结果如下：

```
halfValue: Function1<java.lang.Integer, java.lang.Integer>; doubleValue: Function1<java.lang.Integer, java.lang.Integer>
call halfValue: 2; call doubleValue: 8
lambdaAsParam: 2
ageAdd: 11
```

## 类和对象

kotlin 的定义和其它面对对象语言使用的定义类似：

* class 是 object 的蓝图 blueprint，object 是 class 的实例 instance。
* class 包含属性 Properties 和方法 Methods
* interface 用于指代实现了约定 Methods 的 class
* packages 用于代码分组

### package

在 kotlin 代码目录上右键->New->Package 创建 package：

![创建 package]({{ site.article }}/kotlin-new-package.png)

实际上就是创建了一个和 package 同名的目录：

```sh
$ ls kotlin 
example      functions.kt hello.kt     list.kt
```

在 kotlin 的 package 上右键->New->Kotlin Class 创建 class：

![创建 class]({{ site.article }}/kotlin-new-class.png)

实际创建了一个同名的 kotlin 文件：

```sh
$ ls kotlin/example 
Student.kt
```

class 的文件头声明了隶属的 package：

```kotlin
package example

class Student {
}
```

### class

class 支持常见的面像对象设计：

* 支持构造函数，并且支持多个第二构造函数，第二个构造函数用 constructor 关键字声明
* 多个构造函数之间通过函数签名（入参类型和数量）的差异区分
* 第二个构造函数声明中包含要调用第一构造函数或其它的第二构造函数
* 支持构造时执行的初始化函数 init()
* 支持属性的 get 和 set 设置
* 支持属性和方法的可见性：public（默认都是对外可见）、internal（module内部可见）、private（class内可见）、protected（子类可见）

Student class 的定义：

```kotlin
package example

//在构造函数中声明属性 val 不可更改，var 可更改
class Student(val name: String , var age: Int) { 
    init { // 构造初始化函数 1
        println("-- init step 1($name,$age)")
    }
    init { // 构造初始化函数 2
        println("-- init step 2($name,$age)")
    }

    var home: String = ""  // 在 class 体内定义的属性
    var nextYearAge: Int   // 设置 get 和 set 的属性
        get() = age + 1
        private set(value){ age = value -1 }  //只在class内可见

    // 第二构造函数可以有多个，可以调用第一构造函数或其它第二构造函数
    constructor(name: String, age: Int, home: String) : this(name,age){
        this.home = home
    }

    fun setNextYearAget(value:Int){
        nextYearAge = value   // 会触发 nextYeaAge 的 set(value)
    }

    fun printBasicInfo(){
        when(home){
            "" -> println("${name}今年${age}岁明年${nextYearAge}岁。")
            else -> println("${name}今年${age}岁明年${nextYearAge}岁，家乡是${home}。")
        }
    }
}
```
Student 对象的创建和使用：

```kotlin
package example

fun main() {
    val stu = Student("小明",5)
    stu.printBasicInfo()
    val stu2 = Student("小王",5,"北京")  //通过参数列表匹配构造函数
    stu2.printBasicInfo()

    println("set nextYearAget to 15: ")
    stu2.setNextYearAget(15)
    stu2.printBasicInfo()
}
```

### 继承

* class 默认不能被继承，只有用 open 关键字声明的 class 才可以被继承（即可以拥有子类）
* class 的属性默认不能被子类继承，如果需要被继承也要用 open 关键字声明
* 声明子类的时候，子类从父类继承的属性需要用 override 关键字声明
* 子类中可以直接调用对子类可见的父类方法或属性（非 private ）

```kotlin
package example

// class 和允许继承的属性用 open 关键字声明
open class People(open val name: String,open var age: Int, open var monthSalary: Int) {
    open val yearSalary :Int
        get() = 12*monthSalary
    fun peopleResume() :String{
        return "姓名: $name，年龄: $age，月薪: $monthSalary"
    }

}

// Doctor 继承了 People，继承了 name 和 age 属性
class Doctor(override val name: String, override var age: Int,
             override var monthSalary: Int, var hospital: String): People(name,age,monthSalary){
    override val yearSalary :Int
        get() = 15*monthSalary
    fun doctorResume() :String{
        return  peopleResume() + "，医院: $hospital"
    }
}

fun main() {
    val doctor = Doctor("李大夫",25,10000,"中心医院")
    println("doctor year salary: ${doctor.yearSalary}")
    println("people resume: ${doctor.peopleResume()}")
    println("doctor resume: ${doctor.doctorResume()}")
}
```

执行结果如下：

```
doctor year salary: 150000
people resume: 姓名: 李大夫，年龄: 25，月薪: 10000
doctor resume: 姓名: 李大夫，年龄: 25，月薪: 10000，医院: 中心医院
```

### 单例

* 单例用 object 关键字声明

```kotlin
package example

object BlackColor {
    val color :String = "black"
}

fun main() {
    println("${BlackColor.color}")
}
```

### 数据类 Data Class

kotlin 定义了一种类似于 struct 的 data class。

* data class 用关键字 data 声明
* data class 可以包含方法，以及 get set
* data class 的实例通过判断属性是否相等来判定 instance 是否相等，和 class 对象显著不同！
* data class 的数值属性可以直接 destruct 到变量

```kotlin
package example

class School(val name: String,var size :Int){
    var tenSize :Int
        get() = size *10
        set(value) {size=value/10}
    fun age() :Int{
        return size
    }
}

data class DataSchool(val name: String,var size :Int){
    var tenSize :Int
        get() = size *10
        set(value) {size=value/10}
    fun age() :Int{
        return size
    }
}

fun main() {
    val a = School("小学",1)
    val b = School("小学",1)
    println("a=${a} b=${b}")
    println(a == b)

    val da = DataSchool("小学",1)
    val db = DataSchool("小学",1)
    println("da=${da} db=${db}")
    println(da == db)

    val (first ,second) = db    // destructuring
    println("$first $second")
}
```

运行结果如下：

```
a=example.School@4dc63996 b=example.School@d716361
false
da=DataSchool(name=小学, size=1) db=DataSchool(name=小学, size=1)
true
name=小学,size=1
```

### 枚举类 enum class

* 枚举类用 enum class 声明
* 枚举值也可以是 String 等类型

```kotlin
package example

enum class Direction(val direction :Int) {
    NORTH(1), SOUTH(2), EAST(3),WEST(4)
}

enum class Grade(val value :String) {
    First("一年级"), Second("二年级")
}

fun checkGrade(inputGrade :String) :String{
   return when(inputGrade){
        Grade.First.value -> "这是一年级"
        Grade.Second.value -> "这是二年级"
        else -> "这是未知年级"
    }
}

fun main() {
    println("${Direction.EAST.name}, ${Direction.EAST.ordinal},${Direction.EAST.direction}")
    println("${Grade.First.name}, ${Grade.First.ordinal},${Grade.First.value}")

    println(checkGrade("一年级"))
    println(checkGrade("三年级"))
}
```

### 封闭类 sealed class

* sealed class 只能在定义它的当前文件被被继承（同一个 package 的不同文件中也不行）

```kotlin
sealed class Seal
class SeaLion : Seal()    // 如果在其它文件中，会报错
class Walrus : Seal()

fun matchSeal(seal: Seal): String {
   return when(seal) {
       is Walrus -> "walrus"
       is SeaLion -> "sea lion"
   }
}
```

### 抽象类


* 抽象类不能直接实例化，可以有构造函数以及非抽象的属性（接口没有构造函数以及状态存储属性）
* 抽象类永远是 open（可继承的），不需要用 open 关键字来声明
* 抽象类的方法和属性默认是非抽象的，抽象的方法/属性需要用 abstract 关键字声明
* 抽象类的子类必须实现抽象类中所有的 abstract 方法/属性


```kotlin
package example

abstract class Fish {
    abstract val color : String
}

class Shark: Fish(){
    override val color = "gray"
}

class Dolphin: Fish(){
    override val color = "white"
}

fun fishColor(fish :Fish) :String{
    return fish.color
}

fun main() {
    val shark = Shark()
    val dolphin = Dolphin()

    println("Shark: ${fishColor(shark)}")
    println("dolphin: ${fishColor(dolphin)}")
}
```

### 接口

* 接口中不仅可以包含方法，还可以包含属性
* class 声明时指定实现的接口
* class 实现的接口方法/属性需要用 override 声明
* class 可以实现多个接口（相比之下，只能继承一个抽象类）
* class 声明实现的接口时可以用 by 声明对应接口的实现对象（可以是单例或者 class 的实例化语句）

```kotlin
package example

import kotlin.math.pow


interface Color{
    val color :String
}

interface Graph {
    fun area(): Double
}

object GoldColor: Color{
    override val color: String
        get() = "gold"
}

object RedColor: Color{
    override val color: String
        get() = "red"
}

// 实现了两个接口 Graph Color
class Rectangle(val len: Double,val width:Double, override val color: String): Graph,Color{
    override fun area(): Double {
        return len * width
    }
}

// 实现了两个接口 Graph Color，其中  Color 默认用 GoldColor
class Circle(val radius :Double): Graph,Color by GoldColor{
    override fun area(): Double {
        return Math.PI * radius.pow(2.0)
    }
}

class Circle2(val radius :Double): Graph,Color by AnyColor("green"){
    override fun area(): Double {
        return Math.PI * radius.pow(2.0)
    }
}

// 实现了两个接口 Graph Color，其中  Color 默认用传入的 color
class Square(val len :Double, color: Color): Graph, Color by color{
    override fun area(): Double {
        return len * len
    }
}

fun area(graph :Graph): Double{
    return graph.area()
}

fun main() {
    val rectangle = Rectangle(1.0,2.0,"white")
    val circle = Circle(1.0)
    val square = Square(1.0, RedColor)

    println("circle area: ${area(rectangle)} ${rectangle.color}")
    println("circle area: ${area(circle)} ${circle.color}")
    println("square area: ${area(square)} ${square.color}")
}
```

## 自定义扩展

* 在不修改 class 定义的情况下，为已有的 class 增加方法或者属性


```kotlin
// 扩展方法
fun String.hasSpace(): Boolean{
    val found = this.find{ it == ' '}
    return found != null
}

// 扩展属性
val String.isEmptyStr: Boolean
    get() {return this.isEmpty() }

// 允许 receiver 为 null
val String?.firstChar: Char
    get() {return this?.get(0) ?: 'Z'}

fun main() {
    val str1 :String = "hello"
    val str2 :String = "hello world"
    val str3 :String? = null
    println(str1.hasSpace())
    println(str2.hasSpace())
    println(str2.isEmptyStr)

//  println(str3.isEmpty)  // not allowed
    println(str3.firstChar)
}
```

## 泛型 generic

* 用 T 来指代类型，T 的实质定义为 T: Any? ，即可以为 null 的 Any 类型
* 如果不允许 null，在泛型定义中用 T: Any
* 如果只允许特定类型的 class/interface，使用  T: class/interface 声明

```kotlin
package example

class GenericList<T>(v :T) {  // 实际是 class GenericList<T: Any?>(v :T)
    var list  = mutableListOf<T>(v)
    fun add(v:T){
        list.add(v)
    }
}

class UnNullList<T: Any>(v :T){
    var list  = mutableListOf<T>(v)
    fun add(v:T){
        list.add(v)
    }
}

open class Fruit(open var weight :Float){}
class Apple(override var weight :Float, val price :Float):Fruit(weight){}
class FruitList<T :Fruit?>(v :T){    //必须是 Fruit class
    var list  = mutableListOf<T>(v)
    fun add(v:T){
        list.add(v)
    }
}

interface Animal{ var weight: Float }
class Pig(override var weight :Float, val price :Float):Animal{}
class AnimalList<T :Animal?>(v :T){   //必须是 Animal
    var list  = mutableListOf<T>(v)
    fun add(v:T){
        list.add(v)
    }
}

fun main() {
    //完整写法
    val strList :GenericList<String> = GenericList<String>("hello")
    strList.add("world")
    println("strList is: ${strList.list}")

    //简单写法
    val intList = GenericList(1)
    intList.add(2)
    println("intList is: ${intList.list}")

    val nullList = GenericList(null)
    nullList.add(null)
    println("nullList is: ${nullList.list}")

    //val unNullList = UnNullList(null) //不能是 Null

    val fruitList = FruitList<Fruit>(Apple(1.0.toFloat(),2.0.toFloat()))
    //val fruitList = FruitList("hello") //不接受非 Fruit class 的类型
    println("fruitList is: ${fruitList.list}")

    val animalList = AnimalList<Animal>(Pig(1.0.toFloat(),2.0.toFloat()))
    //val animalList = AnimalList<String>("hello") //不接受非 Animal 的类型
    println("animalList is: ${animalList.list}")
}
```

执行结果如下：

```
strList is: [hello, world]
intList is: [1, 2]
nullList is: [null, null]
fruitList is: [example.Apple@2f92e0f4]
animalList is: [example.Pig@28a418fc]
```



## 参考

1. [李佶澳的博客][1]
2. [Kotlin Bootcamp for Programmers][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developer.android.com/courses/kotlin-bootcamp/overview?hl=en "Kotlin Bootcamp for Programmers"

