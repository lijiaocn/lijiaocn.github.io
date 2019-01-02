---
layout: default
title: "Golang实现grpc server和grpc client(protobuf格式消息通信)介绍教程"
author: 李佶澳
createdate: "2019-01-02 13:19:40 +0800"
changedate: "2019-01-02 13:19:40 +0800"
categories: 技巧
tags: grpc
keywords: golang,protobuf
description: 用Go语言实现grpc通信，即用protobuf消息格式实现client和server之间的高效通信
---

* auto-gen TOC:
{:toc}

## 说明

下面使用的例子是[grpc-go](https://github.com/grpc/grpc-go)中的[gRPC in 3 minutes (Go)][1]，没有将完整的代码复制粘贴到这里，只截取了一些代码片段。

## 生成定义文件

先安装需要的工具、下载代码，后面再分析是怎样做的。

安装protobuf compile，安装以后，本地会有一个`protoc`命令可用，在mac上可以直接用brew安装：

```bash
$ brew install protobuf
```

安装protobuf的go代码生成工具，确保`protoc-gen-go`命令存在：

```bash
$ go get -u github.com/golang/protobuf/protoc-gen-go
$ which protoc-gen-go
/Users/lijiao/Work/Bin/gopath/bin/protoc-gen-go
```

下载示例代码，分为client和server两部分：

```bash
$ go get -u google.golang.org/grpc/examples/helloworld/greeter_client
$ go get -u google.golang.org/grpc/examples/helloworld/greeter_server
$ cd $GOPATH/src/google.golang.org/grpc/examples/helloworld
```

`helloworld/helloworld.proto`是用grpc的语法定义的消息格式，这个文件无法被直接使用的，需要转成对应语言的文件。

generate命令在`greeter_server/main.go`中：

```bash
$ grep -R -n "//go:generate" .
./greeter_server/main.go:19://go:generate protoc -I ../helloworld --go_out=plugins=grpc:../helloworld ../helloworld/helloworld.proto
```

`greeter_server/main.go`中的`go:generate`命令，会被`go generate`命令执行，生成`helloworld.proto`的go语言定义文件：

```bash
$ go generate google.golang.org/grpc/examples/helloworld/...
$ ls helloworld
helloworld.pb.go helloworld.proto
```

`helloworld/helloworld.pb.go`是生成的go文件，可以被引用、使用。

## 消息格式：.proto文件

.proto文件中定义了grpc通信的消息格式和接口，以`helloworld/helloworld.proto`为例：

```proto
syntax = "proto3";

option java_multiple_files = true;
option java_package = "io.grpc.examples.helloworld";
option java_outer_classname = "HelloWorldProto";

package helloworld;

// The greeting service definition.
service Greeter {
  // Sends a greeting
  rpc SayHello (HelloRequest) returns (HelloReply) {}
}

// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}

// The response message containing the greetings
message HelloReply {
  string message = 1;
}
```

.proto文件中定义的是protobuf格式的消息，定义语法可以在[Language Guide (proto3) ][4]中看到。

这里的.proto中定义了一个名为`SayHello`的接口，并且定义了这个接口接收的消息格式`HelloRequest`和返回的消息格式`HelloReply`。

.proto文件中的内容都会在生成的.pb.go文件中体现出来。例如：

```go
type HelloRequest struct {
    Name                 string   `protobuf:"bytes,1,opt,name=name,proto3" json:"name,omitempty"`
    XXX_NoUnkeyedLiteral struct{} `json:"-"`
    XXX_unrecognized     []byte   `json:"-"`
    XXX_sizecache        int32    `json:"-"`
}
...
type GreeterClient interface {
    // Sends a greeting
    SayHello(ctx context.Context, in *HelloRequest, opts ...grpc.CallOption) (*HelloReply, error)
}
type GreeterServer interface {
    // Sends a greeting
    SayHello(context.Context, *HelloRequest) (*HelloReply, error)
}
...
```

## 服务端：grpc server

Go提供了[package grpc][2]，服务端和客户端的开发都可以考虑使用这个包。

```
import "google.golang.org/grpc"

Package grpc implements an RPC system called gRPC.

See grpc.io for more information about gRPC.
```

使用protobuf协议的接口已经在前面的.proto文件中定义了，并且在.pb.go文件中生成对应的interface定义：

```go
// GreeterServer is the server API for Greeter service.
type GreeterServer interface {
	// Sends a greeting
	SayHello(context.Context, *HelloRequest) (*HelloReply, error)
}
```

服务端首先需要做的实现这些接口，例如`greeter_server/main.go`的server：

```go
package main

import (
	...
	pb "google.golang.org/grpc/examples/helloworld/helloworld"
	...
)

// server is used to implement helloworld.GreeterServer.
type server struct{}

// SayHello implements helloworld.GreeterServer
func (s *server) SayHello(ctx context.Context, in *pb.HelloRequest) (*pb.HelloReply, error) {
	log.Printf("Received: %v", in.Name)
	return &pb.HelloReply{Message: "Hello " + in.Name}, nil
}
```

注意接口第二个输入参数类型是`*pb.HelloRequest`，它是在生成的pb.go文件中定义的，是接口接收的消息。

然后创建grpc server，并将实现了接口的struct注入：

```go
func main() {
	lis, err := net.Listen("tcp", port)
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}
	s := grpc.NewServer()
	pb.RegisterGreeterServer(s, &server{})
	// Register reflection service on gRPC server.
	reflection.Register(s)
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
```

注册函数`pb.RegisterGreeterServer`也是在pb.go文件中定义的，是自动生成的。所以需要做的事情，就是创建lis，启动grpc server等很简单工作。

## 客户端：grpc client

客户端的更简单，建立grpc连接，然后直接调用接口就可以了。

建立grpc连接，创建对应的client：

```go
	conn, err := grpc.Dial(address, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := pb.NewGreeterClient(conn)
```

创建client的`pb.NewGreeterClient()`函数也是在.pb.go中定义的，自动生成的。

剩下的工作就是直接调用client的接口：

```go
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	r, err := c.SayHello(ctx, &pb.HelloRequest{Name: name})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("Greeting: %s", r.Message)
```

`c.SayHello()`的第二个参数就是要发送的数据，第一个参数是go标准库中的context，可以用来传递数据。

## 怎样找到grpc实现的接口？

如果一套grpc server代码是其他人实现的，并且.proto文件分散到了各个地方，这时候要怎样知道server实现了哪些接口？

可以在`ResiterXXX`方法中找到：

```go
	pb.RegisterGreeterServer(s, &server{})
```

`RegisterGreeterServer()`的实现：

```go
func RegisterGreeterServer(s *grpc.Server, srv GreeterServer) {
    s.RegisterService(&_Greeter_serviceDesc, srv)
}
```

`_Greeter_serviceDesc`对这个接口的描述是完整的，包含了所有支持的方法：

```bash
var _Greeter_serviceDesc = grpc.ServiceDesc{
    ServiceName: "helloworld.Greeter",
    HandlerType: (*GreeterServer)(nil),
    Methods: []grpc.MethodDesc{
        {
            MethodName: "SayHello",
            Handler:    _Greeter_SayHello_Handler,
        },
    },
    Streams:  []grpc.StreamDesc{},
    Metadata: "helloworld.proto",
}
```

另一种方法是找到`RegisterGreeterServer()`对应的Client创建函数，这里是`NewGreeterClient()`，它们在同一个.pb.go文件中。

```bash
func NewGreeterClient(cc *grpc.ClientConn) GreeterClient {
    return &greeterClient{cc}
}
```

`NewGreeterClient()`返回的类型的方法就是可以调用的方法：

```bash
+GreeterClient : interface
    [methods]
   +SayHello(ctx context.Context, in *HelloRequest, opts ...grpc.CallOption) : *HelloReply, error
```

## 参考

1. [gRPC in 3 minutes (Go)][1]
2. [package grpc][2]
3. [GRPC Go Quick Start][3]
4. [Language Guide (proto3) ][4]

[1]: https://github.com/grpc/grpc-go/tree/master/examples "gRPC in 3 minutes (Go)"
[2]: https://godoc.org/google.golang.org/grpc "package grpc"
[3]: https://grpc.io/docs/quickstart/go.html "GRPC Go Quick Start"
[4]: https://developers.google.com/protocol-buffers/docs/proto3 "Language Guide (proto3) "
