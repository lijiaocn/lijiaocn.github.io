---
layout: default
title: Golang项目的开发过程
author: lijiaocn
createdate: 2017/05/18 16:38:29
changedate: 2017/05/18 16:58:53
categories: 编程
tags: golang
keywords: golang,项目开发,开发过程
description: golang提供自己的一套工具，要善用go的工具。

---

* auto-gen TOC:
{:toc}

## 程序入口，main

$GOPATH/src/hello/hello.go

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/23 06:28:50  Lastchange:2014/07/23 06:28:50
	//changlog:  1. create by lja
	
	package main
	
	import (
	|   "fmt"
	)
	
	func main() {
	|   fmt.Printf("Hello world！\n")
	}

编译、安装:

	go install hello    //注意目标目录的表示方法: 从src/hello/hello.go中去掉了src和hello.go

在$GOPATH/bin目录下生成程序hello:

	$ pwd
	/opt/example/bin
	$ ls
	hello

>注意如果设置了环境变量GOBIN， hello程序将被安装到GOBIN所指的目录

## 代码分组，package

创建目录:

	mkdir $GOPATH/src/hellopkg

创建文件, $GOPATH/src/hellopkg/hellopkg.go

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/23 07:10:53  Lastchange:2014/07/23 07:10:53
	//changlog:  1. create by lja
	
	package hellopkg  
	
	import (
	|   "fmt"
	)
	
	func Helloworld(){        //注意首字母是大写，表示可以被外部调用
	|   fmt.Printf("Hello world from hellopkg!\n")
	}

编译安装:

	go install hellopkg

在$GOPATH/pkt目录生成hellopkg.a

	$ pwd
	/opt/example/pkg/linux_amd64
	$ ls
	hellopkg.a

注意: hellopkg.go中隶属的package最好与所在的目录名一致。如果不一致, 在import的时候需要包含目录名, 使用的时候需要使用package名

## 引用项目内代码包

创建目录:

	mkdir $GOPATH/src/hellopkg_use

创建文件, $GOPATH/src/hellopkg/hello_pkg.go

	//Copyright 2014. All rights reserved. 
	//Author: lja  
	//Createtime: 2014/07/23 07:15:07  Lastchange:2014/07/23 07:15:07
	//changlog:  1. create by lja
	
	package main
	
	import (
	|   "hellopkg"
	)
	
	func main() {
	|   hellopkg.Helloworld()
	}

编译安装:

	go install hellopkg_use

在$GOPATH/bin目录下生成程序hellopkg_use:

	$ pwd
	/opt/example/bin
	$ ls
	hello  hellopkg_use

注意编译后的可执行程序的名称是目录名helloppkt_use, 不是文件名hello_pkg.go中的hello_pkg

通过上面过程可以发现, 如果src的子目录中包含package main, 这个子目录被编译成可执行程序, 否则编译成pkg

## 引用项目外代码包

项目外的代码包用godep管理，开始时直接在程序中应用，之后用`godep save`保存依赖关系。

## 自动化文档，godoc

go的注释可以自动转换成文档。只需将注释写在package、func之前, 中间不能有空行

例如:

	//这时一个hellopkt
	//你可以用它来输出一行Hello world
	package hellopkt
	
	//这是一个helloword函数
	func Helloworld(){
		fmt.Printf("Hello world from hellopkg!\n")
	}

在代码中这样写入注释后,就可以直接使用godoc查看文档。

查看package的文档:

	$ godoc hellopkg
	PACKAGE DOCUMENTATION
	
	package hellopkg
		import "hellopkg"
		
		这是一个hellopkt 你可以用它来输出一行Hello world
		
	FUNCTIONS

	func Helloworld()
		这时一个Helloworld函数

可以直接查看指定函数的文档:

	$ godoc hellopkg Helloworld
	func Helloworld()
		这时一个Helloworld函数

另外，go自身的源码中专门用了一个doc.go文件作为pkg的说明文件，可以借鉴这种方式. 例如/opt/go/src/pkg/fmt/doc.go

	/*
	    Package fmt implements formatted I/O with functions analogous
	    to C's printf and scanf.  The format 'verbs' are derived from C's but
	    are simpler.
	
	    Printing
	
	    The verbs:
	
	    General:
	        %v  the value in a default format.
	            when printing structs, the plus flag (%+v) adds field names
	        %##v a Go-syntax representation of the value
	        %T  a Go-syntax representation of the type of the value
	        %%  a literal percent
	    ....
	....
	*/
	package fmt

## 单元测试

测试源码的命名必须采用如下格式::

	Target_test.go    //Target没有要求，建议以文件为单位，每个目标文件file.go对应一个测试文件file_test.go

测试源码必须包含testing, 测试函数必须按照如下格式定义:

	func Test函数名(t *testing.T){
	}

例如$GOPATH/src/hellopkg/hellopkg_test.go:

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/23 09:06:19  Lastchange:2014/07/23 09:06:19
	//changlog:  1. create by lja
	
	package hellopkg
	
	import (
	|   "testing"
	)
	
	func TestHelloworld(t *testing.T) {
	|   //t.Errorf("没有什么好测的, 给出个测试不通过的例子")
	}                                                            

测试过程:

	go test hellopkg     //执行hellopkg包的测试程序
	go test              //执行所有测试程序

测试结果如下:

	$ go test hellopkg
	--- FAIL: TestHelloworld (0.00 seconds)
	FAIL
	FAIL    hellopkg        0.004s

## Benchmark

Benchmark是测试框架的一部分, 用来获得函数的运行效率信息。参考[how-to-write-benchmarks-in-go][1]

在$GOPATH/src/hellopkg/hellopkg.go中添加函数Multi:

	func Multi(n int, m int)int{ 
		return n*m 
	}  

在$GOPATH/src/hellopkg/hellopkg_test.go中添加Benchmark测试代码:

	func BenchmarkMulti(b *testing.B) {
	    for i := 0; i < b.N; i++ {
	        Multi(88,99)
	    }

执行test，并执行Benchmark

	//-bench参数正则匹配要执行的benchmark函数
	$ go test hellopkg -bench=BenchmarkMulti 
	PASS
	BenchmarkMulti  2000000000               1.04 ns/op
	ok      hellopkg        2.211s

如果test没有通过, 后续的benchmark测试也不会执行

不执行test, 只执行Benchmark

	//-run参数正则匹配要执行的test函数, 这里随便写一个XXX, 使正则匹配结果为空
	$ go test hellopkg -run=XXX -bench=BenchmarkMulti
	PASS
	BenchmarkMulti  2000000000               1.09 ns/op
	ok      hellopkg        2.311s

## 参考

1. [how to write benchmark in go][1]

[1]: http://dave.cheney.net/2013/06/30/how-to-write-benchmarks-in-go "how to write benchmark in go"

