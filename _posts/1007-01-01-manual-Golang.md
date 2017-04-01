---
layout: default
title: Golang手册
author: lijiaocn
createdate: 2017/03/28 10:01:38
changedate: 2017/04/01 11:27:05
categories:
tags: 手册
keywords: Go编程
description: Go编程

---

## Golang编译相关

### 编译

可以到godoc启动本地文档或者golang的golang.org/doc/asm目录下查看说明: A Quick Guide to Go's Assembler

golang的编译命令"go build"背后依然是编译、链接等过程。

go help build

	-a
	    force rebuilding of packages that are already up-to-date.
	-n
	    print the commands but do not run them.
	-p n
	    the number of builds that can be run in parallel.
	    The default is the number of CPUs available.
	-v
	    print the names of packages as they are compiled.
	-work
	    print the name of the temporary work directory and
	    do not delete it when exiting.
	-x
	    print the commands.
	-compiler name
	    name of compiler to use, as in runtime.Compiler (gccgo or gc)
	-gccgoflags 'arg list'
	    arguments to pass on each gccgo compiler/linker invocation
	-gcflags 'arg list'
	    arguments to pass on each 5g, 6g, or 8g compiler invocation      //go tool 6g -h
	-ldflags 'flag list'
	    arguments to pass on each 5l, 6l, or 8l linker invocation        //go tool 6l -h
	-tags 'tag list'
	    a list of build tags to consider satisfied during the build.
	    See the documentation for the go/build package for
	    more information about build tags.

go自带的工具, go的全部工具列表golang.org/cmd:

	go tool

查看gc和ld的可用flags:

	go tool 5g/6g/8g      //5X表示plan9, 6X表示x64, 8X表示x86
	go tool 5l/6l/8l
	
	2016-12-26 06:26:53 5g/6g等是golang的早期版本包含的工具，在golang1.7中已经去除

[最新的工具列表](https://golang.org/cmd/)

### 跨平台编译

	$ cd /usr/local/go/src
	$ CGO_ENABLED=0 GOOS=linux GOARCH=amd64 ./make.bash

### 变量作用域

因为Go的编译器会把存在没有使用的变量的情况当作语法错误处理, 因此在涉及到变量作用域时有一些奇怪的问题, 例如下面的代码

	//Copyright 2014. All rights reserved.                                                                                                                                                                     
	//Author: lja  
	//Createtime: 2014/08/03 08:43:13  Lastchange: 2014/08/03 08:46:18
	//changlog:  1. create by lja

	package main

	func main() {
	    st := map[int]string{
	        1: "first",
	        2: "second",
	        3: "third",
	    }

	    var str string         //line 15
	    {
	        str, ok = st[2]    //line 17
	    }
	}

编译时会提示:

	./local.go:17: undefined: ok

而如果将"str, ok = st[2]"修改为"str, ok := st[2]", 又会提示

	./local.go:17: str declared and not used

根本原因如下:

	    var str string         //line 15
	    {
	        str, ok = st[2]    //line 17, 这里的str与line15的str是同一个
	    }


	    var str string         //line 15
	    {
	        str, ok := st[2]   //line 17, 这里的str是一个全新的变量
	    }

### 局部变量位于堆还是位于栈?

以下面的程序为例子:

	//Copyright 2014. All rights reserved.                                                                                                                                                                     
	//Author: lja  
	//Createtime: 2014/08/02 15:29:55  Lastchange: 2014/08/02 16:34:45
	//changlog:  1. create by lja

	package main
	import (
	    "fmt"
	)

	var pa *int
	var pb *int

	//如果改成只有一个参数，反汇编时会发现没有符号xxxfun, 直接被优化了
	func xxxfun(n,x,y,z,r,s,t,p,q int) *int{    

	    var a,b,c int 
	    a = n 
	    b = n+1 
	    c = n      //c只在函数xxxfun中使用
	    c = c+2 

	    y=x
	    z=y
	    r=z
	    s=r
	    t=s
	    p=t
	    q=p
	    q=q+1

	    pa = &a    //a的地址被赋给函数外的变量
	    return &b  //b的地址被做为返回值
	}


	//这个函数用来覆盖栈空间
	func xxxfun2(x,y,z int)(a4,b4,c4 int){
	    a1 := x
	    a2 := a1+1
	    a3 := a2+2
	    a4 = a3+3
	    b1 := y
	    b2 := b1+1
	    b3 := b2+2
	    b4 = b3+3
	    c1 := z
	    c2 := c1+1
	    c3 := c2+2
	    c4 = c3+3
	    return
	}

	func main() {
	    pb := xxxfun(5)

	    //覆盖栈空间
	    a,b,c := xxxfun2(100,200,300)
	    fmt.Printf("a = %d, b = %d, c = %d\n",a ,b, c)

	    //检查指针指向的取值
	    fmt.Printf("*pa(5) = %d, *pb(6) = %d\n", *pa, *pb)
	}
                           

运行结果发现pa和pb指向的值是5和6。反汇编后可以发现，a和b使用的内存是动态分配的。

	0000000000400c00 <main.xxxfun>:
	  400c00:|  64 48 8b 0c 25 f0 ff |  mov    %fs:0xfffffffffffffff0,%rcx
	  400c07:|  ff ff 
	  400c09:|  48 3b 21             |  cmp    (%rcx),%rsp
	  400c0c:|  77 0c                |  ja     400c1a <main.xxxfun+0x1a>
	  400c0e:|  b8 50 00 00 00       |  mov    $0x50,%eax
	  400c13:|  e8 b8 64 02 00       |  callq  4270d0 <runtime.morestack01_noctxt>
	  400c18:|  eb e6                |  jmp    400c00 <main.xxxfun>
	  400c1a:|  48 83 ec 18          |  sub    $0x18,%rsp             //0x18,24个字节，3个64bit,由低到高，记作v1 v2 v3
	  400c1e:|  48 c7 04 24 20 5f 49 |  movq   $0x495f20,(%rsp)       //0x495f20应 当是new的参数Type
	  400c25:|  00 
	  400c26:|  e8 95 13 02 00       |  callq  421fc0 <runtime.new>
	  400c2b:|  48 8b 5c 24 08       |  mov    0x8(%rsp),%rbx         //new的返回值放在v2处
	  400c30:|  48 89 5c 24 10       |  mov    %rbx,0x10(%rsp)        // 第一块动态内存地址放在v3处
	  400c35:|  48 c7 04 24 20 5f 49 |  movq   $0x495f20,(%rsp)              
	  400c3c:|  00 
	  400c3d:|  e8 7e 13 02 00       |  callq  421fc0 <runtime.new>   //再次调用new, 第二块动态内存地址放在v2处
	  400c42:|  48 8b 54 24 10       |  mov    0x10(%rsp),%rdx        //v3存放到rdx
	  400c47:|  48 8b 5c 24 20       |  mov    0x20(%rsp),%rbx        //参数n的值保存到rbx
	  400c4c:|  48 8b 44 24 08       |  mov    0x8(%rsp),%rax         //v2存放到rax
	  400c51:|  48 89 1a             |  mov    %rbx,(%rdx)            //v3 所指的地址赋值n, v3就是变量a的地址
	  400c54:|  48 89 dd             |  mov    %rbx,%rbp              //rbp就是变量b
	  400c57:|  48 ff c5             |  inc    %rbp                   //变量b加1
	  400c5a:|  48 89 28             |  mov    %rbp,(%rax)            //变量b存放在rax所指的地址v2
	  400c5d:|  48 83 c3 02          |  add    $0x2,%rbx              //变量c+2, 从这里往下，因为代码里没做什么事情，一堆赋值都被优化掉了
	  400c61:|  48 8b 5c 24 28       |  mov    0x28(%rsp),%rbx        //     
	  400c66:|  48 ff c3             |  inc    %rbx   
	  400c69:|  48 89 14 25 b0 54 54 |  mov    %rdx,0x5454b0
	  400c70:|  00 
	  400c71:|  48 89 44 24 68       |  mov    %rax,0x68(%rsp)
	  400c76:|  48 83 c4 18          |  add    $0x18,%rsp             //回收栈                                                                                                                                 
	  400c7a:|  c3                   |  retq   
	  400c7b:|  00 00                |  add    %al,(%rax)
	  400c7d:|  00 00                |  add    %al,(%rax)
	|   ...


## Golang调试

### Debugging Go Code with GDB

[Debugging Go Code with GDB](https://golang.org/doc/gdb)

gdb不能完全的理解golang程序, 只能够用来解决部分问题，如果程序是并发的，gdb能够发挥的作用就更小了。

使用golang的gc工具链编译的程序默认包含DWARF3调试信息，gdb能够使用这些信息去调试一个运行的进程或者core dump。

如果要去掉DWARF3信息：

	go build -ldflags "-w" prog.go

gc会默认对inline函数等进行优化，从而增加了使用gdb调试的困难，可以在编译时禁止这些优化：

	go build -gcflags "-N -l"  prog.go

## Golang开发环境

### 安装go

下载安装文件go1.3.linux-amd64.tar.gz, 解压到/opt

### 运行环境
在.bashrc中添加:

	#golang的安装目录
	export GOROOT=/opt/go            
	
	#golang工程目录
	export GOPATH=/opt/go-workspace
	
	export PATH=$PATH:$GOROOT/bin:$GOPATH/bin:$GOPATH/bin 

执行`source ./bashrc`后，查看go环境变量:

	[root@localhost dockerImages]## go env
	GOARCH="amd64"
	GOBIN=""
	GOCHAR="6"
	GOEXE=""
	GOHOSTARCH="amd64"
	GOHOSTOS="linux"
	GOOS="linux"
	GOPATH="/opt/go-workspace"       ##GOPATH is workspace's location
	GORACE=""
	GOROOT="/opt/go-1.3.1"
	GOTOOLDIR="/opt/go-1.3.1/pkg/tool/linux_amd64"
	CC="gcc"
	GOGCCFLAGS="-fPIC -m64 -pthread -fmessage-length=0"
	CXX="g++"
	CGO_ENABLED="1"

### workspace

设置workspace:
	
	mkdir -p $GOPATH/src
	mkdir -p $GOPATH/bin
	mkdir -p $GOPATH/pkg

### 安装git

go get命令可以直接从github中获取代码，自动完成代码拉取、编译、安装的过程。依赖git

	yum install -y git

### 安装godep

godep用于将工程中依赖的package打包(godep save)到Godeps目录中, 以及恢复workspace(go restore).

安装：

	go get github.com/tools/godep

### (可选)安装gotag

[gotag](https://github.com/jstemmer/gotags)用来与vim配合，生成ctags文件:

安装:

	go get -u github.com/jstemmer/gotags

### (可选)安装gocode

[gocode](https://github.com/nsf/gocode)用于golang代码的自动补全，与vim等配合使用

	go get -u github.com/nsf/gocode

### (可选)配置VIM

可以直接使用[github.com/lijiaocn/vim](https://github.com/lijiaocn/vim)中的vim配置，已经包含了多种常用插件。

vim的相关内容可以参考：[Vim](/2014/07/21/Vim.html)

#### 安装vim-go

将vim-go中的内容复制到.vim目录中:

	git clone https://github.com/fatih/vim-go

插件安装完成后，在vim安装依赖的程序:

	:GoInstallBinaries

命令执行过程中去获取缺失的程序的源码，完成安装和编译。

#### 安装gocode的vim插件

	#!/bin/sh
	mkdir -p "$HOME/.vim/autoload"
	mkdir -p "$HOME/.vim/ftplugin/go"
	cp "${0%/*}/autoload/gocomplete.vim" "$HOME/.vim/autoload"
	cp "${0%/*}/ftplugin/go/gocomplete.vim" "$HOME/.vim/ftplugin/go"

#### 安装neosnippet-snippets

	git clone https://github.com/Shougo/neosnippet-snippets.git

## Golang工程管理

### go的自带工具

位于$GOTOOLDIR目录。

	[root@localhost dockerImages]## go tool 
	6a
	6c
	6g
	6l
	addr2line
	cgo
	cover
	dist
	fix
	nm
	objdump
	pack
	pprof
	tour
	vet
	yacc

### 第一个执行程序

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

	[lja@localhost bin]$ pwd
	/opt/example/bin
	[lja@localhost bin]$ ls
	hello

>注意如果设置了环境变量GOBIN， hello程序将被安装到GOBIN所指的目录

### 第一个程序库(library)

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

	[lja@localhost linux_amd64]$ pwd
	/opt/example/pkg/linux_amd64
	[lja@localhost linux_amd64]$ ls
	hellopkg.a

注意: hellopkg.go中隶属的package最好与所在的目录名一致。如果不一致, 在import的时候需要包含目录名, 使用的时候需要使用package名

### 第一次使用pkg

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


	[lja@localhost bin]$ pwd
	/opt/example/bin
	[lja@localhost bin]$ ls
	hello  hellopkg_use

>注意编译后的可执行程序的名称是目录名hellppkt_use, 不是文件名hello_pkg.go中的hello_pkg

通过上面过程可以发现, 如果src的子目录中包含package main, 这个子目录被编译成可执行程序, 否则编译成pkg

### 第一个远程代码

安装gocode, 远程地址: https://github.com/nsf/gocode

	go get -u github.com/nsf/gocode

gocode源码被下载到src

	[lja@localhost gocode]$ pwd
	/opt/example/src/github.com/nsf/gocode
	[lja@localhost gocode]$ ls
	autocompletecontext.go  client.go  cursorcontext.go  declcache.go  docs   emacs-company  _gccgo     _goremote  os_posix.go    package.go  ripper.go  scope.go   _testing  vim
	autocompletefile.go     config.go  debian            decl.go       emacs  formatters.go  gocode.go  LICENSE    os_windows.go  README.md   rpc.go     server.go  utils.go

gocode程序被编译生成到bin:

	[lja@localhost bin]$ ls
	gocode  hello  hellopkg_use
	[lja@localhost bin]$ pwd
	/opt/example/bin
	[lja@localhost bin]$ ls
	gocode  hello  hellopkg_use

gocode可以使在用vim编辑go程序时给出代码提示, 用法如下:

安装vim插件:

	cd $GOPATH/src/github.com/nsf/gocode/vim
	./pathogen_update.sh      //里面有三个安装脚本, 根据vim的情况做选择

配置gocode:

	gocode set propose-builtins true      //提示go自带的内容
	gocode set autobuild true             //自动编译pkg

用vim打开.go文件, 补全时键入Ctrl+x,Ctrl+o, 需要注意只会提示已经被import的pkg中成员。

### 自动化文档

go的注释可以自动转换成文档。只需将注释写在package、func之前, 中间不能有空行

例如:

	//这时一个hellopkt
	//你可以用它来输出一行Hello world
	package hellopkt


	//这是一个helloword函数
	func Helloworld(){
		fmt.Printf("Hello world from hellopkg!\n")
	}

在代码中这样写入注释后,就可以直接使用godoc查看文档，例如:

	[lja@localhost hellopkg]$ godoc hellopkg
	PACKAGE DOCUMENTATION

	package hellopkg
		import "hellopkg"

		这是一个hellopkt 你可以用它来输出一行Hello world

	FUNCTIONS

	func Helloworld()
		这时一个Helloworld函数


	[lja@localhost hellopkg]$ godoc hellopkg Helloworld
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

### 测试框架

测试源码的命名必须采用如下格式:

	Target_test.go    //Target没有要求，建议以文件为单位，每个目标文件file.go对应一个测试文件file_test.go

测试源码必须包含testing, 测试函数必须按照如下格式定义:

	func Test函数名(t *testing.T){
	}

例如 $GOPATH/src/hellopkg/hellopkg_test.go

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

	[lja@localhost hellopkg]$ go test hellopkg
	--- FAIL: TestHelloworld (0.00 seconds)
			hellopkg_test.go:13: 没有什么好测的, 给出个测试不通过的例子
	FAIL
	FAIL    hellopkg        0.004s

### Benchmark

Benchmark是测试框架的一部分, 用来获得函数的运行效率信息。参考下面的文章:

[how-to-write-benchmarks-in-go](http://dave.cheney.net/2013/06/30/how-to-write-benchmarks-in-go)

在$GOPATH/src/hellopkg/hellopkg.go中添加函数Multi:

	func Multi(n int, m int)int{ 
		return n*m 
	}  

在$GOPATH/src/hellopkg/hellopkg_test.go中添加Benchmark测试代码:

	func BenchmarkMulti(b *testing.B) {
	    for i := 0; i < b.N; i++ {
	        Multi(88,99)
	    }

执行test,并执行Benchmark

	//-bench参数正则匹配要执行的benchmark函数
	[lja@localhost hellopkg]$ go test hellopkg -bench=BenchmarkMulti 
	PASS
	BenchmarkMulti  2000000000               1.04 ns/op
	ok      hellopkg        2.211s

>如果test没有通过, 后续的benchmark测试也不会执行

不执行test, 只执行Benchmark

	//-run参数正则匹配要执行的test函数, 这里随便写一个XXX, 使正则匹配结果为空
	[lja@localhost hellopkg]$ go test hellopkg -run=XXX -bench=BenchmarkMulti
	PASS
	BenchmarkMulti  2000000000               1.09 ns/op
	ok      hellopkg        2.311s

### godep

godep用于将工程中依赖的package打包(godep save)到Godeps目录中, 以及恢复workspace(go restore).

安装：

	go get github.com/tools/godep

用godep获取项目代码:

	godep get github.com/XXX/A  

	1. $GOPATH/src目录下将会自动建立github.com/XXX/A
	2. godep使用git clone将github.com/XXX/A的代码拉取到目录github.com/XXX/A中
	3. godep使用go build编译github.com/XXX/A

## Golang零碎事项

### 换行

没错，在Go中换行是一个需要注意的问题。因为Go没有向C语言那样用";"作为一行代码的结束。因此有时候需要一些特别处理

例如1:

	 res, err := db.Execute("insert into Session set ItemID=?,ItemType=?,LoginOK=0,"+ 
			 "LoginErr=0,CreateTime=NOW(),LastConnect=NOW()", humanid, itemtype)

	 注意: 连接字符串的"+"必须在第一行，不然Go会以为第一行已经结束了

例如2

	err = db.QueryRow("select NickName, MailIdentify, TIMEDIFF(UnLockTime, NOW()) from "+ 
			"Human where HumanID=? and Passwd=SHA(?)",humanid, zainar.AddSalt(password, email)).
			Scan(&nickname, &realmail, &timewait)

	注意"."号必须位于第二行的行尾，原理同上

>吐槽: 在用Go做一些小东西过程中遇到这个问题, 突然发现整个编码过程中基本就没用的";", 突然感觉C中的";"好冗余。。

### 使用在其他包中定义的结构体

假设在包A中定义了:

	type  AA struct {
		X int
		Y int
		Z int
		x int
		y int
		z int
	}

当在B包使用时, 只能使用大写字母开头的成员(X Y Z):

	var xx A.AA

	xx.X = 1
	xx.Y = 2
	xx.Z = 3

	xx.x = 1 //报错, 因为小写字母开头的成员对外不可见，只能在A包中访问。

### 取消证书验证

golang的net/http中提供了http客户端client, 可以用client发起http操作。但是当目标是https时，client默认会检查证书。在做demo的时候，往往会做一个自己做一个临时证书, 因此需要关闭Client的证书检查。

这里有同样的问题: [https://groups.google.com/forum/##!topic/golang-nuts/TC5DVxYLjjg](https://groups.google.com/forum/#!topic/golang-nuts/TC5DVxYLjjg)

上述连接中，给出的解决方法:

	//Matthew R Chase 12-6-16

	import ("net/http"; "crypto/tls")
	//...
	tr := &http.Transport{
		TLSClientConfig: &tls.Config{InsecureSkipVerify : true},   //
	}
	client := &http.Client{Transport: tr}
	resp, err := client.Get("https://someurl:443/)

经过实际验证可行！如下:

	tr := http.Transport{TLSClientConfig: &tls.Config{InsecureSkipVerify:true}}
	client := http.Client{Transport: &tr}
	
	//用client发起访问:
	client.Post.....

>其实就是替换了默认的设置

## Golang Packages

用过的一些Golang Packages。

### 类型转换

[Golang Type Converstion](https://golang.org/ref/spec#Conversions)

Go中类型转换必须显示声明

### flag -- 命令行解析

并不是所有的程序都会图形界面, 因此命令行解析很重要。在linuxC中可以使用getopt, 在Go中可以使用flag

代码示例:

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/23 15:16:00  Lastchange:2014/07/23 15:16:00
	//changlog:  1. create by lja

	package main

	import (
	|   "flag"
	|   "fmt"
	)

	func main() {
	|   
	|   host := flag.String("host","127.0.0.1","remote host ip")
	|   port := flag.Uint("port", 80, "remote host port")

	|   flag.Usage()   //display usage

	|   flag.Parse()   //parse cmdline

	|   fmt.Printf("host: %s, port: %d\n", *host, *port)

	}
 
执行结果:

	[lja@localhost flag_use]$ go install flag_use 

	//默认参数
	[lja@localhost flag_use]$ flag_use  
	Usage of flag_use:
	  -host="127.0.0.1": remote host ip
	  -port=80: remote host port
	host: 127.0.0.1, port: 80

	//如果输入参数类型不正确, 运行时能够检测到:
	[lja@localhost flag_use]$ flag_use -port -1 
	Usage of flag_use:
	  -host="127.0.0.1": remote host ip
	  -port=80: remote host port
	invalid value "-1" for flag -port: strconv.ParseUint: parsing "-1": invalid syntax
	Usage of flag_use:
	  -host="127.0.0.1": remote host ip
	  -port=80: remote host port

	//指定参数
	[lja@localhost flag_use]$ flag_use -port=2 
	Usage of flag_use:
	  -host="127.0.0.1": remote host ip
	  -port=80: remote host port
	host: 127.0.0.1, port: 2

贡献一个snippet:

	snippet flag
		${1} := flag.${2:String}(${3:"name"},${4:"default"},${4:"usage description"})
		flag.Parse()  

另外一个很重的是对.ini样式的配置文件的解析(类似于glib中Key-value file parser), 在Go的自带Pkg中还没有找到有这样功能的。

### IO -- IO操作

golang提供两个IO相关的pkg, 分别是bufio和io。前者带有缓存, 后者是一些IO操作原语(可以认为是对系统调用的封装)。

使用bufio基本可以完成大多数需要的操作。 如下是一个对文件的追加写的操作:

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/23 18:40:40  Lastchange: 2014/07/24 05:56:01
	//changlog:  1. create by lja

	package  main

	import (
	    "os"
	    "log"
	    "bufio"
	    "fmt"
	)

	func main() {
	    
	    f, err := os.OpenFile("/tmp/io_use.dat", os.O_APPEND os.O_WRONLY, 0666)

	    if err != nil{
	        log.Fatal(err)
	    }

	    w := bufio.NewWriter(f);       //使用bufio.NewWriter, 可以用统一的方式IO进行操作
	    n, err := w.Write([]byte("Hello World!\n"))
	    if err != nil{
	        log.Fatal(err)
	    }

	    err = w.Flush()

	    if err != nil{
	        log.Fatal(err)
	    }

	    fmt.Printf("write %d bytes\n", n)

	    f.Close()

	}                                 


### log -- 日志

毋庸置疑, 这个很重要。Go提供了log和log/syslog。log可以将日志写入任意一个io.Writer, syslog可将日志发送到syslog服务。

#### log

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/23 18:17:48  Lastchange: 2014/07/24 06:18:24
	//changlog:  1. create by lja

	package main

	import (
	    "log"
	    "os"
	)

	func main() {

	    f, err := os.OpenFile("/tmp/log", os.O_WRONLY | os.O_CREATE, 0666)

	    if err != nil {
	        log.Fatal(err)
	    }

	    //这里创建了一个新的Logger, 如果要使用默认log, 直接调用log.XXX
		//这里日志将被写入f,替换f可以写入不同的位置,比如pipe、socket等
	    l := log.New(f, "["+os.Args[0]+"] ", log.Ldate | log.Lmicroseconds | log.Llongfile)

	    l.Printf("this is a log printf")
	}

记录的日志格式如下:

	[log_use] 2014/07/24 06:18:30.559099 /opt/example/src/log_use/log_use.go:23: this is a log printf

贡献一个snippet:

	##Go Create a new Logger
	snippet nlog
		${1:name} := log.New(${2:io.wirter}, "["+os.Args[0]+"] ". log.Ldate|log.Lmicroseconds|log.Llongfile)

#### syslog

log/syslog用来记录syslog日志, 可以将日志发送到指定的syslog服务器。

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/24 06:39:12  Lastchange: 2014/07/24 06:56:33
	//changlog:  1. create by lja

	package main

	import (
	    "log/syslog"
	    "os"
	    "log"
	)

	func main() {
	
	    //network addr为空表示发送到本地syslog服务
	    logger, err := syslog.Dial(""/*network*/,""/*addr*/,syslog.LOG_INFO|syslog.LOG_LOCAL0, os.Args[0])

	    if err != nil {
	        log.Fatal(err)
	    }
	    
	    err = logger.Info("this is a syslog info");                                                                                                                                                                                      

	    if err != nil {
	        log.Fatal(err)
	    }
	}

运行后在/var/message中记录了一条日志:

	Jul 24 06:56:43 localhost syslog_use[15505]: this is a syslog info

贡献一个snippet:

	##Go syslog
	snippet syslog
		${1:logger}, err := syslog.Dial("${2}"/*network*/,"${3}"/*addr*/,syslog.LOG_INFO|syslog.LOG_LOCAL0, os.Args[0])
		if err != nil{
			log.Fatal(err)
		}

### net -- 网络通信

Go提供的net包中包含了必要网络通信函数。下面一个udp通信的例子:

Client:

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/24 07:21:25  Lastchange: 2014/07/24 08:43:10
	//changlog:  1. create by lja

	package main

	import (
	    "net"
	    "log"
	    "fmt"
	    "flag"
	)


	func main() {

	    addr := flag.String("addr","127.0.0.1:80","remote server addr")
	    flag.Parse()

	    conn, err := net.Dial("udp", *addr)

	    if err != nil {
	        log.Fatal(err)
	    }

	    var response []byte  = make([]byte, 100)
	    size, err := conn.Write([]byte("hello"))
	    if err != nil {
	        log.Fatal(err)
	    }

	    size, err = conn.Read(response)
	    if err != nil {
	        log.Fatal(err)
	    }
	    fmt.Print("Response: ", response)
	}

Server:

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/23 14:56:47  Lastchange: 2014/07/24 08:38:55
	//changlog:  1. create by lja

	package main

	import (
	    "net"
	    "flag"
	    "log"
	)

	func response(b []byte, size int, addr net.Addr, conn net.PacketConn) {

	    _, err := conn.WriteTo([]byte("Got you request"), addr)

	    if err != nil {
	        log.Fatal(err)
	    }

	}

	func main() {

	    addr := flag.String("addr","127.0.0.1:80","server addr, default is 127.0.0.1:80")
	    flag.Parse()

	    conn, err := net.ListenPacket("udp",*addr)

	    if err != nil {
	        log.Fatal(err)
	    }

	    for {
	        var b []byte = make([]byte, 1500)
	        size, saddr, err := conn.ReadFrom(b)
	        if err != nil {
	            log.Print(err)
	        }

	        if size != 0 { 
	            go response(b[:size], size, saddr, conn)
	        }
	    }
	}

### errors -- 报错

Go提供了errors, 函数检测到错误时直接返回一个error

	//Copyright 2014. All rights reserved. 
	//Author: lja  
	//Createtime: 2014/07/24 09:15:08  Lastchange: 2014/07/24 09:20:35
	//changlog:  1. create by lja

	package main

	import (
	    "errors"
	    "log"
	)

	func dosomething() (err error) {

	    err = errors.New("do something errors")

	    return
	}

	func main() {
	    
	    err := dosomething()

	    if err != nil {
	        log.Print(err)
	    }
	}

贡献一个snippet:

	##Go New error
	snippet nerr
	    ${1: err} := errors.New("${2:reason}")

### database

Go提供了一个database/sql, 其中定义了数据的操作接口。可以通过这个接口进行数据库操作，前提是安装或者撰写了目标数据库的驱动。

下面是一个mysql的驱动:

[https://github.com/go-sql-driver/mysql](https://github.com/go-sql-driver/mysql)

	//Copyright 2014. All rights reserved.
	//Author: lja  
	//Createtime: 2014/07/27 17:35:53  Lastchange: 2014/07/27 18:49:48
	//changlog:  1. create by lja

	package main

	import (
	    "database/sql"
	    _ "github.com/go-sql-driver/mysql"
	    "log"
	    "fmt"
	    "time"
	)

	func main() {
	    
	    db,err := sql.Open("mysql", "root:@tcp(127.0.0.1:3306)/shangwei")

	    if err != nil {
	        log.Fatal(err)
	    }

	    regmail := "test@test.com"

	    var userid uint64
	    var nickname string
	    var locktime string

	    err = db.QueryRow("select UserID, RegMail, NickName, LockTime from User where RegMail=? and LockTime>?", regmail, time.Now()).Scan(&userid, &regmail, &nickname, &locktime)

	    switch  {
	    case err == sql.ErrNoRows:
	        log.Fatal(err)
	    case err != nil:
	        log.Fatal(err)
	    default:
	        fmt.Printf("UserID: %d \nRegMail: %s\nNickName: %s\nLockTime: %s\n",
	                userid, regmail, nickname, locktime)
	    }
	}

在Golang的database/sql/sql.go中可以看到,  其中已经考虑到了数据库连接的缓存和重用。

例如Stmt的Query()过程: 

	func (s *Stmt) Query() ->func (s *Stmt)connStmt()

	...
	// Make a new conn if all are busy.
	// TODO(bradfitz): or wait for one? make configurable later?
	if !match {
		dc, err := s.db.conn()    //!!
		if err != nil {
			return nil, nil, nil, err
		}
		dc.Lock()
		si, err := dc.prepareLocked(s.query)
		dc.Unlock()
		if err != nil {
			s.db.putConn(dc, err) 
			return nil, nil, nil, err
		}
		s.mu.Lock()
		cs = connStmt{dc, si}
		s.css = append(s.css, cs)
		s.mu.Unlock()
	}

	...

其中调用s.db.conn()获取一个新的连接,s.db.conn()对应的函数是:

	func (db *DB) conn()

从这个函数的实现中可以看到, 作用是从DB的连接池中取出一个数据库连接，如果没有则新建。

因此DB中的数据库连接池是源头, 可以用下面两个函数，控制连接池:

	func (db *DB) SetMaxOpenConns(n int)  
		//数据库连接的最大数量, 如果请求连接时发现已经达到最大连接数,阻塞请求
		//连接不是预先全部建立，而是在需要时建立
		//如果n<=0, 连接数不受限制

	func (db *DB) SetMaxIdleConns(n int) 
		//空闲连接的最大数目, 如果空闲连接超过这个数目, 多出的连接将被释放
		//如果n<=0, 空闲连接数不受限制

### 第三方包

#### github.com/samalba/dockerclient

dockerclient, 封装了docker的REST API。

#### github.com/codegangsta/cli

统一定义了命令行程序常用到交互, 参数、tab补全等。

#### globalconf

在查看coreos的fleetd的代码时遇到的, globalconf将命令行参数、环境变量、配置文件统一了起来。

无论是通过哪种方式配置, 配置项在程序可以被随时访问、修改、删除。

如果重复, 优先级: 命令行>环境变量>配置文件。

	github.com/coreos/fleet/Godeps/_workspace/src/github.com/rakyll/globalconf

#### dbus

D-Bus是一套IPC的工具。因为采用了二进制格式的协议, 因此开销小, 适合本地进程间通信。

[D-Bus](http://www.freedesktop.org/wiki/Software/dbus/)

[D-Bus-tutorial](http://dbus.freedesktop.org/doc/dbus-tutorial.html)

	github.com/godbus/dbus

### 时间

Go在time包中提供时间操作函数

### protobuf

[protocol-buffers](https://developers.google.com/protocol-buffers/)是google开发的与编程语言、系统平台无关的数据交换格式。

[protocol-buffers doc](https://developers.google.com/protocol-buffers/docs/overview)

[golang protobuf](https://github.com/golang/protobuf)

安装:

	yum install -y protobuf
	go get -u github.com/golang/protobuf/{proto,protoc-gen-go}

编写protobuf描述文件：

	package example;
	enum FOO { X = 17; };
	
	message Test {
	    required string label = 1;
	    optional int32 type = 2 [default=77];
	    repeated int64 reps = 3;
	    optional group OptionalGroup = 4 {
	        required string RequiredField = 5;
	    }
	}

使用protoc自动生成相关代码:

	protoc --go_out=. *.proto

## 文献

