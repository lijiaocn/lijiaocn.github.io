---
title: GRPC 的功能、使用方式以及配套的生态工具
createtime: '2024-05-06 11:33:53 +0800'
last_modified_at: '2025-02-14 16:27:49 +0800'
categories: 项目
tags: grpc
keywords: null
description: grpc 具备多种常用的功能，比如 Authentication、Flow Control 等等
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

grpc 具备多种常用的功能，比如 Authentication、Flow Control 等等。

* [grpc Guides][2]：概要介绍了这些功能的用法
* [grpc examples/features][4]： 提供相关功能的使用代码。

## 配套的生态工具

[grpc-ecosystem][5] 中有多个和 grpc 相关的生态项目，比如：

* [grpc-gateway][6]：生成将 restful 接口代理到 grpc 服务接口的代码
* [go-grpc-middleware][11]：一些可复用的 grpc middleware

## grpc-gateway：将 grpc 服务转换成 http 服务

[grpc-gateway][6] 根据 proto 文件生成处理 http 请求的代码，这写代码将收到的 http 请求转换成对 grpc 服务的调用。

### 标记字段映射关系

用注解标记映射关系需要更改接口定义文件。如果不能修改接口定义文件，可以:

* 方法1：生成 generate_unbound_methods，uri 为 servername/methodname
* 方法2：用单独的一个文件描述 rest 接口和 rpc 接口之间的映射关系。

具体用法见：[gRPC API Configuration][12]。

如果使用注解标记，需要将下面的文件复制到本地项目 idl 目录的 google/api 中，就可以使用其中的 option google.api.http 进行标注。

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

### 生成 http 服务代码

代码生成需要在 protoc-gen-go 和 protoc-gen-go-grpc 之外，再安装两个 protoc 插件：

```bash
go install \
    github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-grpc-gateway@latest \
    github.com/grpc-ecosystem/grpc-gateway/v2/protoc-gen-openapiv2@latest \
```

然后用 protoc 生成转换 http 请求的代码：

```bash
protoc -I ./idl --grpc-gateway_out  ./ \
    --grpc-gateway_opt module=NAME \
    ./idl/NAME/v1beta/*.proto    \
    ./idl/NAME/v1beta/*/*.proto
```

然后在 grpc 服务中启动一个 http 服务注入生成的 handler

```go
func RunHttpServer(ctx context.Context, services []Service) {
    mux := runtime.NewServeMux(
        runtime.WithIncomingHeaderMatcher(func(key string) (string, bool) {
            return runtime.DefaultHeaderMatcher(key)
        }),
        runtime.WithOutgoingHeaderMatcher(func(key string) (string, bool) {
            return key, true
        }),
        runtime.WithOutgoingTrailerMatcher(func(key string) (string, bool) {
            return key, true
        }),
    )

    opts := []grpc.DialOption{
        grpc.WithTransportCredentials(insecure.NewCredentials()),
        grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
        grpc.WithChainUnaryInterceptor(interceptor.ClientTraceUnary),
        grpc.WithChainStreamInterceptor(interceptor.ClientTraceStream)}

    err = frontend.RegisterFrontendApiServiceHandlerFromEndpoint(ctx, mux, conf.GetHTTPBackend()/*grpc服务的地址*/, opts)
    if err != nil {
        utils.FATAL(ctx, "failed to register http handler", map[string]interface{}{"err": err, "srv": srv})
    }

    utils.INFO(ctx, "http listening at "+conf.GetHTTPListenAddr(), nil)
    if err = http.ListenAndServeTLS(conf.GetHTTPListenAddr(), conf.GetHTTPCert(), conf.GetHTTPKey(), mux); err != nil {
        utils.FATAL(ctx, "http serve fail", map[string]interface{}{"err": err})
    }
}
```

## 生成 http 接口描述文件

指定服务在 proto 文件，生成一个 swagger 格式的接口说明文件：

```bash
protoc -I ./idl --openapiv2_out  ./ \
    --openapiv2_opt output_format=json \
    ./idl/NAME/v1beta/*.proto    \
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
10. [google api][10]
11. [go-grpc-middleware][11]
12. [grpc api configuration][12]

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
[11]: https://github.com/grpc-ecosystem/go-grpc-middleware "go-grpc-middleware"
[12]: https://grpc-ecosystem.github.io/grpc-gateway/docs/mapping/grpc_api_configuration/ "gRPC API Configuration"
