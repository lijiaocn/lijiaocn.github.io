---
layout: default
title: "Go 语言实现 grpc 的 server 和 client，用 protobuf 定义消息格式和接口"
author: 李佶澳
createdate: "2019-01-02 13:19:40 +0800"
last_modified_at: "2024-04-30 15:25:25 +0800"
categories: 技巧
tags: protobuf grpc
keywords: protobuf
description: 用Go语言实现grpc通信，即用protobuf消息格式实现client和server之间的高效通信
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

下面使用的例子是 [grpc-go](https://github.com/grpc/grpc-go) 中的 [gRPC in 3 minutes (Go)][1]，没有将完整的代码复制粘贴到这里，只截取了一些代码片段。

## 安装 grpc 工具

需要先安装需要的工具，用来根据 grpc 的消息格式定义文件生成响应的 .go 文件。

安装 protobuf compile，安装以后，本地会有一个 `protoc` 命令可用，在 mac 上可以直接用 brew 安装：

```bash
$ brew install protobuf
```

安装 protobuf 的 go 代码生成工具，确保 `protoc-gen-go` 命令存在：

```bash
$ go get -u github.com/golang/protobuf/protoc-gen-go
$ which protoc-gen-go
/Users/lijiao/Work/Bin/gopath/bin/protoc-gen-go
```

## grpc 通信示例

下载示例代码，分为 client 和 server 两部分：

```bash
$ go get -u google.golang.org/grpc/examples/helloworld/greeter_client
$ go get -u google.golang.org/grpc/examples/helloworld/greeter_server

$ cd $GOPATH/src/google.golang.org/grpc/examples/helloworld
```

编译：

```bash
cd greeter_server
go build

cd greeter_client
go build

```

启动服务端：

```bash
./greeter_server      #监听端口50051，代码中写死了
```

客户端发起请求：

```bash
$ ./greeter_client
2019/02/21 14:41:43 Greeting: Hello world
```

## 代码实现说明

`helloworld/helloworld.proto` 是用 protobuf 定义的消息格式，这个文件无法被直接使用的，需要转成对应语言的文件。

generate 命令在 `greeter_server/main.go` 中：

```bash
$ grep -R -n "//go:generate" .
./greeter_server/main.go:19://go:generate protoc -I ../helloworld --go_out=plugins=grpc:../helloworld ../helloworld/helloworld.proto
```

greeter_server/main.go 中的 `go:generate` 命令，会在执行 go generate 时运行，生成 helloworld.proto 对应的 go 文件：

```bash
$ go generate google.golang.org/grpc/examples/helloworld/...
$ ls helloworld
helloworld.pb.go helloworld.proto
```

helloworld/helloworld.pb.go 是生成的go文件。

## 消息格式：.proto文件

.proto文件中定义了 grpc 通信的消息格式和接口，以 `helloworld/helloworld.proto` 为例：

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

.proto 文件中定义的是 protobuf 格式的消息，定义语法可以在 [Language Guide (proto3) ][4] 中看到。

这里的 .proto 中定义了一个名为 `SayHello` 的接口，并且定义了这个接口接收的消息格式 `HelloRequest` 和返回的消息格式 `HelloReply`。

.proto 文件中的内容都会在生成的 .pb.go 文件中体现出来。例如：

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

Go 提供了[package grpc][2]，服务端和客户端的开发都可以考虑使用这个包。

```go
import "google.golang.org/grpc"

Package grpc implements an RPC system called gRPC.

See grpc.io for more information about gRPC.
```

使用 protobuf 协议的接口已经在前面的 .proto 文件中定义了，并且在 .pb.go 文件中生成对应的 interface 定义：

```go
// GreeterServer is the server API for Greeter service.
type GreeterServer interface {
	// Sends a greeting
	SayHello(context.Context, *HelloRequest) (*HelloReply, error)
}
```

服务端首先需要做的实现这些接口，例如 greeter_server/main.go 的server：

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

注意接口第二个输入参数类型是 `*pb.HelloRequest`，它是在生成的 pb.go 文件中定义的，是接口接收的消息。

然后创建 grpc server，并将实现了接口的 struct 注入：

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

注册函数 `pb.RegisterGreeterServer` 也是在 pb.go 文件中定义的，是自动生成的。所以需要做的事情，就是创建 lis，启动 grpc server 等很简单工作。

## 消息的 struct 定义

通过 .proto 生成的 pb.go 文件中包含每个消息的 struct 定义，在写代码的时候可以直接使用这些struct。

以 .proto 中的 `HelloRequest` 为例：

```proto
// The request message containing the user's name.
message HelloRequest {
  string name = 1;
}
```

生成的 struct 如下：

```go
// The request message containing the user's name.
type HelloRequest struct {
    Name                 string   `protobuf:"bytes,1,opt,name=name,proto3" json:"name,omitempty"`
    XXX_NoUnkeyedLiteral struct{} `json:"-"`
    XXX_unrecognized     []byte   `json:"-"`
    XXX_sizecache        int32    `json:"-"`
}
```

注意生成的结构体中多出了三个以`XXX_`开头的成员，[XXX_* type in generated .pb.go file][5]中的回答说，这些是 protobuf 用来存储未知的 field，并且可用来实现 protobuf 的扩展。目前对 protobuf 的了解的比较少，暂时就不深究了。

## 客户端：grpc client

客户端的更简单，建立 grpc 连接，然后直接调用接口就可以了。

建立 grpc 连接，创建对应的 client：

```go
	conn, err := grpc.Dial(address, grpc.WithInsecure())
	if err != nil {
		log.Fatalf("did not connect: %v", err)
	}
	defer conn.Close()
	c := pb.NewGreeterClient(conn)
```

创建 client 的 `pb.NewGreeterClient()` 函数也是在.pb.go中定义的，自动生成的。

剩下的工作就是直接调用 client 的接口：

```go
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	r, err := c.SayHello(ctx, &pb.HelloRequest{Name: name})
	if err != nil {
		log.Fatalf("could not greet: %v", err)
	}
	log.Printf("Greeting: %s", r.Message)
```

`c.SayHello()` 的第二个参数就是要发送的数据，第一个参数是 go 标准库中的 context，可以用来传递数据。

## 怎样找到 grpc 实现的接口？

如果一套 grpc server 代码是其他人实现的，并且 .proto 文件分散到了各个地方，这时候要怎样知道 server 实现了哪些接口？

可以在 `ResiterXXX` 方法中找到：

```go
	pb.RegisterGreeterServer(s, &server{})
```

RegisterGreeterServer()的实现：

```go
func RegisterGreeterServer(s *grpc.Server, srv GreeterServer) {
    s.RegisterService(&_Greeter_serviceDesc, srv)
}
```

`_Greeter_serviceDesc` 对这个接口的描述是完整的，包含了所有支持的方法：

```go
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

另一种方法是找到 `RegisterGreeterServer()` 对应的Client创建函数，这里是 `NewGreeterClient()`，它们在同一个.pb.go文件中。

```bash
func NewGreeterClient(cc *grpc.ClientConn) GreeterClient {
    return &greeterClient{cc}
}
```

NewGreeterClient() 返回的类型的方法就是可以调用的方法：

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
5. [XXX_* type in generated .pb.go file][5]

[1]: https://github.com/grpc/grpc-go/tree/master/examples "gRPC in 3 minutes (Go)"
[2]: https://godoc.org/google.golang.org/grpc "package grpc"
[3]: https://grpc.io/docs/quickstart/go.html "GRPC Go Quick Start"
[4]: https://developers.google.com/protocol-buffers/docs/proto3 "Language Guide (proto3) "
[5]: https://stackoverflow.com/questions/50704319/xxx-type-in-generated-pb-go-file "XXX_* type in generated *.pb.go file"
