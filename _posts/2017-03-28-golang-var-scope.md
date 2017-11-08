---
layout: default
title: go的变量作用域，局部变量的存放位置是？
author: lijiaocn
createdate: 2017/05/18 16:18:01
changedate: 2017/05/20 16:07:26
categories: 编程
tags: golang
keywords: golang,变量,作用域,栈空间
description:  因为Go的编译器会把存在没有使用的变量的情况当作语法错误处理, 因此在涉及到变量作用域时

---

* auto-gen TOC:
{:toc}

## 变量作用域

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

## 局部变量位于堆还是位于栈?

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
