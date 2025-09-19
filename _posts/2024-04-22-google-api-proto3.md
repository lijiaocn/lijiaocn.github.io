---
createtime: "2024-04-22 11:07:37 +0800"
last_modified_at: "2024-05-29 15:30:34 +0800"
categories: "方法"
title: "谷歌是怎样用 Protobuf 定义开放 API 的？"
tags: API设计 protobuf
keywords:
description: Google 为了能让用户更好的理解以及使用 API，将 API 的原始定义开源了。通过 Google 开源的 API 定义文件，我们可以更具体的了解它的 API 管理方式。
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

之前有过一篇 [Google 是如何实践 RESTful API 设计的？][2]，这篇可以算是它的后续。Google 为了能让用户更好的理解以及使用 API，将 API 的原始定义开源了。通过 Google 开源的 API 定义文件，我们可以更具体的了解它的 API 管理方式。

```
git clone https://github.com/googleapis/googleapis.git
```

推荐用 goland 或安装了 protobuf 插件的 Idea 查看项目文件。vscode 的 protobuf 插件效果差太多了，要么搞语法高亮不准，要么不支持跳转到定义或只支持部分。

## 用 bazel 构建

bazel 是 Google 开发的构建工具。Google 用 bazel 实现 API client 代码的生成以及测试。

```bash
brew install bazel
```

项目根目录中的 WORKSPACE 文件是 bazel 使用的工作区定义文件，子目录中的 BUILD.bazel 中描述要构建的内容以及构建方式。googleapi 提供了一个示例接口 [example/library][5]。子目录 v1 中的 BUILD.bazel 文件里声明了可以用 bazel 构建的目标，比如下面的 gapi-cloud-example-library-v1-go。

```bash
# Open Source Packages
go_gapic_assembly_pkg(
    name = "gapi-cloud-example-library-v1-go",
    deps = [
        ":library_go_gapic",
        ":library_go_gapic_srcjar-metadata.srcjar",
        ":library_go_gapic_srcjar-snippets.srcjar",
        ":library_go_gapic_srcjar-test.srcjar",
        ":library_go_proto",
    ],
)
```

用 bazel 命令构建指定的目标：

```bash
# 构建 v1 中的一个目标：
bazel build //google/example/library/v1:gapi-cloud-example-library-v1-go

# 构建 v1 中的所有目标：
bazel build //google/example/library/v1/...
```

构建结束后，在本地会出现几个以 bazel- 为前缀的目录，这些目录中的内容就是构建产物。

构建的产物让人有些搞不懂，根据[bazel 输出目录布局][4]说明，可以知道构建产物位于 xxx-fastbuild/bin 目录。但是这些产物似乎还需要和其它的系统配合才能被流畅的使用。此外还有一些产物似乎是根据 library_example_gapic.yaml/library_grpc_service_config.json/library_example_v1.yaml 等文件生成的。这些文件不是 protobuf 需要的，应该 google 使用的一些工具链用到的配置，这部分暂时也搞不清楚是怎么回事。


## proto 文件的组织方式

每个大版本独占一个目录，比如 v1、v1beta 等。每个大版本目录内是一套完整的接口定义，不会和其它大版本目录的里文件互相引用。比如 [example/library][5] 中的 v1 目录，[google/ai/generativelanguage][6] 中的 v1、v1beta、v1beta2、v1beta3。

大版本目录内的 proto 文件组织方式，在不同产品线里是不同的，应该是历史因素造成的。根据一些公开资料判断[google/ai/generativelanguage][6] 中的文件应该是按照最新的规范组织的，具体规范见 [Google 是如何实践 RESTful API 设计的？][2]。

以 google/ai/generativelanguage/v1 为例：

```sh
v1
├── generative_service.proto         # GenerativeService，rpc 接口以及 request/response
├── model_service.proto              # ModelService，rpc 接口以及 request/response
├── citation.proto                   # Message 定义
├── content.proto                    # Message 定义
├── model.proto                      # Message 定义
└── safety.proto                     # Message 定义
├── BUILD.bazel                      # bazel 构建目标
├── generativeai_grpc_service_config.json  # 不知道哪里使用的服务描述文件
├── generativelanguage_v1.yaml             # 可以应用到 grpc-gateway 的配置文件
```

其中 generativelanguage_v1.yaml  是适用于 [grpc-gateway][10] 的配置文件。grpc-gateway 可以通过该文件中的配置生成和 rpc 接口对应的 http gateway 代码。grpc-gateway 感觉就是 goole 内部使用方式的开源实现，它支持两种配置方式：1 在 proto 文件中定义每个方法时用 google.api.http 标注；2 用单独的 yaml 文件描述。方式1 的好处是可以在编写 rpc 接口同时完成 http 定义，方式 2 的好处是可以不用修改 proto 文件。Google 公开的


## 扩展的 option

protobuf 在 [google/protobuf/descriptor.proto][7] 中定义了默认提供不同级别的 option。包括 FieldOptions、OneofOptions、EnumOptions、EnumValueOptions、ServiceOptions、MethodOptions 等。并且支持对内置的 option 进行扩展（[自定义 option][8]）。

Google 扩展了大量的 options，扩展的 option 定义统一存放在 [google/api/][9] 目录，但是分散在里面的众多文件中。此外这些众多 options 的用途，会对代码生成过程产生具体怎样的影响，暂时也搞不清楚。

下面 option(*) 中的 google.api.default_host、google.api.http、google.api.field_behavior、google.api.resource_reference 等都是 google 扩展的 options。

```go
service GenerativeService {
  option (google.api.default_host) = "generativelanguage.googleapis.com";

  // Generates a response from the model given an input
  // `GenerateContentRequest`.
  rpc GenerateContent(GenerateContentRequest)
      returns (GenerateContentResponse) {
    option (google.api.http) = {
      post: "/v1/{model=models/*}:generateContent"
      body: "*"
      additional_bindings {
        post: "/v1/{model=tunedModels/*}:generateContent"
        body: "*"
      }
    };
    option (google.api.method_signature) = "model,contents";
    ...省略...

message GenerateContentRequest {
  // Required. The name of the `Model` to use for generating the completion.
  //
  // Format: `name=models/{model}`.
  string model = 1 [
    (google.api.field_behavior) = REQUIRED,
    (google.api.resource_reference) = {
      type: "generativelanguage.googleapis.com/Model"
    }
  ];

...省略...
```

## 生成的代码

用下面的命令生成 google/ai/generativelanguage/v1 的代码。

```sh
bazel  build //google/ai/generativelanguage/v1:generativelanguage_go_gapic
```

感觉下面就是生成的代码，目录结构和 proto 文件的 go_package 配置相同。proto 文件中定义的 servcie 有对应的带 `_client` 后缀的 go 文件，里面提供对应的 NewXXClient 函数。

```sh
$ tree   bazel-out/darwin_arm64-fastbuild/bin/google/ai/generativelanguage/v1/generativelanguage_go_gapic_srcjar_main.go
bazel-out/darwin_arm64-fastbuild/bin/google/ai/generativelanguage/v1/generativelanguage_go_gapic_srcjar_main.go
└── cloud.google.com
    └── go
        └── ai
            └── generativelanguage
                └── apiv1
                    ├── auxiliary.go
                    ├── doc.go
                    ├── generative_client.go  // 实现了 NewGenerativeClient
                    └── model_client.go       // 实现了 NewModelClient
```

Google 已经把这些代码发布了，在项目里可以直接使用 Google 发布的代码。如下，建一个空白的 go 项目，然后直接引用代码：

```bash
go get cloud.google.com/go/ai/generativelanguage/apiv1/
```

每个 service 提供了两种类型的 Client，一种使用 grpc 协议通信，一种使用 http 协议通信。基于 grpc 的 client 必须要主动 close。

```go
package main

import (
    "cloud.google.com/go/ai/generativelanguage/apiv1"
    "context"
)

func main() {
    ctx := context.Background()
    genClient, err := generativelanguage.NewGenerativeClient(ctx)
    if err != nil {
        panic(err)
    }
    defer genClient.Close()
    _, _ = genClient.GenerateContent(ctx, nil)


    modelClient, err := generativelanguage.NewModelClient(ctx)
    if err != nil {
        panic(err)
    }
    defer modelClient.Close()
    _, _ = modelClient.GetModel(ctx, nil)

    modelRestClient, err := generativelanguage.NewModelRESTClient(ctx)
    if err != nil {
        panic(err)
    }
    defer modelRestClient.Close()
    _, _ = modelRestClient.GetModel(ctx, nil)
}
```

## 参考

1. [李佶澳的博客][1]
2. [Google 是如何实践 RESTful API 设计的？][2]
3. [Bazel 简介][3]
4. [bazel 输出目录布局][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2022/11/24/google-api-design.html "Google 是如何实践 RESTful API 设计的？"
[3]: https://bazel.build/about/intro?hl=zh-cn "Bazel 简介"
[4]: https://bazel.build/remote/output-directories?hl=zh-cn "bazel 输出目录布局"
[5]: https://github.com/googleapis/googleapis/tree/master/google/example/library 
[6]: https://github.com/googleapis/googleapis/tree/master/google/ai/generativelanguage 
[7]: https://github.com/protocolbuffers/protobuf/blob/main/src/google/protobuf/descriptor.proto 
[8]: /编程/2022/11/29/protobuf-v3.html#自定义-options
[9]: https://github.com/googleapis/googleapis/tree/master/google/api
[10]: https://grpc-ecosystem.github.io/grpc-gateway/docs/mapping/grpc_api_configuration/ "gRPC API Configuration"
