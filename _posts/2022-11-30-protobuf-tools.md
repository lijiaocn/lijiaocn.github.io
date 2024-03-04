---
layout: default
title: "Protocol Buffers 使用建议以及生态工具"
author: 李佶澳
date: "2022-11-30 18:29:32 +0800"
last_modified_at: "2024-04-25 19:56:04 +0800"
categories: 编程
cover:
tags: protobuf 
description: Protocol Buffers 官方给出的一些使用建议、部分细节说明以及一些配套工具介绍记录在这里，协议语法要点见上一篇。
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

Protocol Buffers 官方给出的一些使用建议、部分细节说明以及一些配套工具介绍记录在这里。

入门教程 [Protocol Buffers Tutorials][18]，协议语法要点见 [tag: protobuf](/tags/all.html#protobuf)。

## 风格建议 - Style Guide

[Style Guide][3] 是 Protocol Buffers 给出的风格建议。

### 内容结构

* 每行最长 80 字符
* 缩进 2 个空格
* 首先使用双引号
* 文件内容按下面顺序组织
```text
1. License header (if applicable)
2. File overview
3. Syntax
4. Package
5. Imports (sorted)
6. File options
7. Everything else
```

### 命名风格

* package name 使用小写字幕
* message name 使用驼峰命名，field name 使用下划线命名
```proto
message SongServerRequest {
  optional string song_name = 1;
}
```
* field name 如果包含数字，数字紧贴上一个字母，例如 song_name1
* repeated filed 命名用复数形式
* 枚举项用大写字母和下划线命名
```proto
enum FooBar {
  FOO_BAR_UNSPECIFIED = 0;
  FOO_BAR_FIRST_VALUE = 1;
  FOO_BAR_SECOND_VALUE = 2;
}
```
* service 和 rpc 接口使用驼峰命名
```proto
service FooService {
  rpc GetSomething(GetSomethingRequest) returns (GetSomethingResponse);
  rpc ListSomething(ListSomethingRequest) returns (ListSomethingResponse);
}
```

## 使用场景建议

[Design Patterns for Dealing with Protocol Buffers][5] 给出了部分场景下的使用说明/建议。

### 场景1: 传递超过 1MB 的数据

Protobuf Buffers 不适合传输大段数据，如果需要发送的 message 超过 1MB，需要考虑使用其它方式。

### 场景2: 定义自描述消息

可以用下面的方式实现自描述的消息（Google 内部没有遇到需要使用自描述消息的情形）：

```proto
syntax = "proto3";

import "google/protobuf/any.proto";
import "google/protobuf/descriptor.proto";

message SelfDescribingMessage {
  // Set of FileDescriptorProtos which describe the type and its dependencies.
  google.protobuf.FileDescriptorSet descriptor_set = 1;

  // The message and its type, encoded as an Any message.
  google.protobuf.Any message = 2;
}
```

## Protocol Buffers 编码方式

[Protocol Buffer Wire Format][4] 介绍了 protobuf 的编码方式，即二进制格式， 按需了解。

## Protocol Buffer 编译

Proto 文件编写完成后，需要再将 .proto 文件转化成目标语言的代码文件或 object 文件。
Protocol Buffer 提供了编译命令 [protoc][11]。protoc 自身内置支持 cpp/csharp/java 等语音。还没内置支持的语言，可以用插件辅助编译：[Compiler Plugins][9] 。有很多第三方开发维护的 addon: [Third-Party Add-ons][6]。

编译后生成的代码通常会引用对应语言的 runtime 库：[Protobuf Runtime][12]。

### 编译成 Go 代码

参考：[Protocol Buffer Basics: Go][19] 

Google 开发了 [protobuf-go][20] 项目实现对 go 语言的支持。protobuf-go 实现了插件 protoc-gen-go，同时也是 go 版本的 protobuf runtime 库： google.golang.org/protobuf。

protoc-gen-go 用 go 或者 mac 的 brew 命令安装：

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@latest
# 或者
brew install protoc-gen-go
```

将 proto 文件编译成 go 代码，--go_out 即编译成 go 代码的意思，protoc 会搜寻 protoc-gen-go 插件：

```bash
protoc -I=$SRC_DIR --go_out=$DST_DIR $SRC_DIR/*.proto
```

如果要为 protoc-gen-go 传入参数，用 go_opt=X=xx 的方式指定。比如下面指定参数 paths=source_relateive。paths 是用来设置生成的的代码的位置，详情见 [Compiler Invocation][21]。

```bash
protoc -I=$SRC_DIR --go_opt=paths=source_relative --go_out=$DST_DIR $SRC_DIR/*.proto
````

也可以用 --plugin 明确指定要使用的插件：

```text
--plugin=EXECUTABLE         Specifies a plugin executable to use.
                            Normally, protoc searches the PATH for
                            plugins, but you may specify additional
                            executables not in the path using this flag.
                            Additionally, EXECUTABLE may be of the form
                            NAME=PATH, in which case the given plugin name
                            is mapped to the given executable even if
                            the executable's own name differs.
```

### 编译成 grpc 代码

proto 文件还可以编译成支持 proto 的 rpc 框架的代码，比如 [gRPC][17]，还有 [RPC Implementations][14] 等。
grpc 框架本身也是支持多语言的，这里以 go 语言为例，需要同时安装 protoc-gen-go 和 protoc-gen-go-grpc 两个插件：

```bash
go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.28
go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2
# 或者
brew install protoc-gen-go protoc-gen-go-grpc
```

编译成 grpc 代码：

```bash
protoc --go_out=. --go-grpc_out=. helloworld/helloworld.proto
```

## 解析 proto 文件

一个可以解析 proto 文件的 package：[github.com/jhump/protoreflect][10]。


## 参考

1. [李佶澳的博客][1]
2. [protocol-buffers overview][2]
3. [Style Guide][3]
4. [Protocol Buffer Wire Format][4]
5. [Commonly-used Design Patterns for Dealing with Protocol Buffers][5]
6. [Third-Party Add-ons][6]
7. [Protocol Buffers Reference][7]
8. [Go support for Protocol Buffers][8]
9. [Compiler Plugins][9]
10. [github.com/jhump/protoreflect][10]
11. [Protocol Compiler][11]
12. [Protobuf Runtime][12]
13. [Programming Languages Support][13]
14. [RPC Implementations][14]
15. [protoc-gen-go][15]
16. [github.com/golang/protobuf][16]
17. [gRPC][17]
18. [Protocol Buffers Tutorials][18]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developers.google.com/protocol-buffers/docs/overview "protocol-buffers overview"
[3]: https://developers.google.com/protocol-buffers/docs/style "Style Guide"
[4]: https://developers.google.com/protocol-buffers/docs/encoding "Encoding"
[5]: https://developers.google.com/protocol-buffers/docs/techniques "commonly-used design patterns for dealing with Protocol Buffers"
[6]: https://github.com/protocolbuffers/protobuf/blob/main/docs/third_party.md "Third-Party Add-ons"
[7]: https://developers.google.com/protocol-buffers/docs/reference/overview "Protocol Buffers Reference"
[8]: https://pkg.go.dev/google.golang.org/protobuf#readme-package-index "Go support for Protocol Buffers"
[9]: https://developers.google.com/protocol-buffers/docs/reference/other#plugins "Compiler Plugins"
[10]: https://github.com/jhump/protoreflect "github.com/jhump/protoreflect"
[11]: https://github.com/protocolbuffers/protobuf#protocol-compiler-installation "Protocol Compiler"
[12]: https://github.com/protocolbuffers/protobuf#protobuf-runtime-installation "Protobuf Runtime"
[13]: https://github.com/protocolbuffers/protobuf/blob/main/docs/third_party.md#programming-languages  "Programming Languages"
[14]: https://github.com/protocolbuffers/protobuf/blob/main/docs/third_party.md#rpc-implementations "RPC Implementations"
[15]: https://pkg.go.dev/github.com/golang/protobuf/protoc-gen-go "protoc-gen-go"
[16]: https://github.com/golang/protobuf "github.com/golang/protobuf"
[17]: https://grpc.io/ "gRPC"
[18]: https://developers.google.com/protocol-buffers/docs/tutorials "Protocol Buffers Tutorials"
[19]: https://protobuf.dev/getting-started/gotutorial/#compiling-protocol-buffers 
[20]: https://github.com/protocolbuffers/protobuf-go 
[21]: https://grpc.io/docs/languages/go/quickstart/ 
[22]: https://protobuf.dev/reference/go/go-generated/#invocation
