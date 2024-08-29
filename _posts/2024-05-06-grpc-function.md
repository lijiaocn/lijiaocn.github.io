---
createtime: "2024-05-06 11:33:53 +0800"
last_modified_at: "2024-08-29 21:22:49 +0800"
categories: 项目
title:  grpc 的功能、使用方式以及配套的生态工具
tags: grpc
keywords: 
description: grpc 具备多种常用的功能，比如 Authentication、Flow Control 等等
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

grpc 具备多种常用的功能，比如 Authentication、Flow Control 等等。[grpc Guides][2] 概要介绍了这些功能的用法，[grpc examples/features][4] 提供相关功能的使用代码。

## 配套的生态工具

[grpc-ecosystem][5] 中有多个和 grpc 相关的生态项目。

## grpc-gateway：生成对应的 http 接口

[grpc-ecosystem][5] 中的 [grpc-gateway][6] 实现了 http 接口和 rpc 接口之间的映射，自动根据 proto 定义生成 http 接口代码。

### 使用注解标记和 http 接口的映射关系

option 复用google api 中的的定义，将下面的文件复制到本地项目 idl 目录的 google/api 中。然后就可以使用其中的 option google.api.http 进行标注。

* [google/api/http.proto][7] 
* [google/api/annotations.proto][8]

google.api.http 支持参数都列在 [google/api/http.proto][7] 中的 HttpRule 结构体中，用途分别如下：

* selector 
* pattern 指定使用的 http method，指定 rpc 接口参数和 uri 路径参数的映射关系
* body 指定映射到 http request body 的 rpc 参数
* response_body 指定映射到 http response body 的 rpc 响应参数

```proto
message HttpRule {
  string selector = 1;
  oneof pattern {
    string get = 2;
    string put = 3;
    string post = 4;
    string delete = 5;
    string patch = 6;
    CustomHttpPattern custom = 8;
  }
  string body = 7;
  string response_body = 12;
  repeated HttpRule additional_bindings = 11;
}
```

路径参数指定方式如下（[example/library/v1/library.proto][9]），定义了两个路径参数 schelves 和 books，其中 schelves 对应请求参数中的 name。Google 的 api 使用了这种风格的路径参数：[google api][10]。

```proto
  rpc DeleteBook(DeleteBookRequest) returns (google.protobuf.Empty) {
    option (google.api.http) = {
      delete: "/v1/{name=shelves/*/books/*}"
    };
    option (google.api.method_signature) = "name";
  }
```

### http 接口代码生成

代码生成需要在 protoc-gen-go 和 protoc-gen-go-grpc 之外，再安装两个 protoc 插件：

```bash
go install \
    github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest \
    github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest \
```

然后用 protoc 生成代码：

```bash
protoc -I ./idl --grpc-gateway_out  ./ \
    --grpc-gateway_opt module=NAME \
    ./idl/NAME/v1beta/*.proto    \
    ./idl/NAME/v1beta/*/*.proto
```

## 参考

1. [李佶澳的博客][1]
2. [grpc Guides][2]
3. [grpc Metadata][3]
4. [grpc examples/features][4]
5. [grpc-ecosystem][5]
6. [grpc-gateway][6]
7. [google/api/http.proto ][7]
8. [google/api/annotations.proto][8]
9. [example/library/v1/library.proto][9]
10 [google api][10]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://grpc.io/docs/guides/ "grpc Guides"
[3]: https://grpc.io/docs/guides/metadata/ "grpc Metadata"
[4]: https://github.com/grpc/grpc-go/tree/master/examples/features "grpc examples/features"
[5]: https://github.com/grpc-ecosystem/ "grpc-ecosystem"
[6]: https://github.com/grpc-ecosystem/grpc-gateway "grpc-gateway"
[7]: https://github.com/googleapis/googleapis/blob/master/google/api/http.proto "google/api/http.proto "
[8]: https://github.com/googleapis/googleapis/blob/master/google/api/annotations.proto "google/api/annotations.proto"
[9]: https://github.com/googleapis/googleapis/blob/master/google/example/library/v1/library.proto "example/library/v1/library.proto"
[10]: https://cloud.google.com/apis/design/standard_methods?hl=zh-cn "google api 标准方法"
