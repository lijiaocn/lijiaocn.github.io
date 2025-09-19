---
layout: default
title: go的常用package
author: 李佶澳
createdate: 2017/05/18 17:05:34
last_modified_at: 2017/05/18 17:08:58
categories: 编程
tags: golang
keywords: golang,编程
description: golang自身提供了一些最基本的package。

---

## 目录
* auto-gen TOC:
{:toc}

## 非核心Package

[https://godoc.org/-/subrepo](https://godoc.org/-/subrepo)

## 类型转换

[Golang Type Converstion](https://golang.org/ref/spec#Conversions)

Go中类型转换必须显示声明

## flag -- 命令行解析

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

## IO -- IO操作

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


## log -- 日志

毋庸置疑, 这个很重要。Go提供了log和log/syslog。log可以将日志写入任意一个io.Writer, syslog可将日志发送到syslog服务。

### log

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

### syslog

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

## net -- 网络通信

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

## errors -- 报错

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

## database

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

## 第三方包

### github.com/samalba/dockerclient

dockerclient, 封装了docker的REST API。

### github.com/codegangsta/cli

统一定义了命令行程序常用到交互, 参数、tab补全等。

### globalconf

在查看coreos的fleetd的代码时遇到的, globalconf将命令行参数、环境变量、配置文件统一了起来。

无论是通过哪种方式配置, 配置项在程序可以被随时访问、修改、删除。

如果重复, 优先级: 命令行>环境变量>配置文件。

	github.com/coreos/fleet/Godeps/_workspace/src/github.com/rakyll/globalconf

### dbus

D-Bus是一套IPC的工具。因为采用了二进制格式的协议, 因此开销小, 适合本地进程间通信。

[D-Bus](http://www.freedesktop.org/wiki/Software/dbus/)

[D-Bus-tutorial](http://dbus.freedesktop.org/doc/dbus-tutorial.html)

	github.com/godbus/dbus

## 时间

Go在time包中提供时间操作函数

## protobuf

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
