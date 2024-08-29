---
createtime: "2024-05-06 15:37:19 +0800"
last_modified_at: "2024-05-17 14:51:20 +0800"
categories: 方法
title: "用 OpenTelemetry 开发可观测的软件系统（Observability）"
tags: 软件工程
keywords: 
description: 软件系统要向外暴露足够的信息，不仅反映出系统的运行状态，而且只需依据暴露出来的信息就可以定位故障原因。
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

OpenTelemetry 项目在 [Observability Primer][2] 中介绍可观测的定义（Observability）。简单来说就是软件系统要向外暴露足够的信息。暴露的数据不仅反映出系统的运行状态，而且足以用来定位故障原因。有一系列工具可以被用来实现软件系统的可观测。关于 OpenTelemetry、OpenTracing、OpenCensus 的关系见：[OpenTelemetry 介绍][19]。

## OpenTelemetry 是什么？

[OpenTelemetry][3] 是一系列系统观测相关的 api、sdk 和工具。它定义采集测量数据的方法框架，并提供了 Golang/Java/JavaScript 等十多种语言的实现，以及支持对接几十种第三方系统。开发者用 OpenTelemetry 提供的 API 可以直接生成测量数据，并导入到选用的数据系统中。测量数据目前有 metrics、trace 和 log 三类。

OpenTelemetry 支持将测量数据以多种格式输出，可以按照 [OpenTelemetry Protocol][9]（简称 otlp) 格式输出。或者以第三方系统支持的格式输出，比如 [Prometheus][5] 使用的 metrics 数据格式，[Jaeger][4] 使用的 tracer 数据格式。通过切换 exporter 改变数据的输出格式。

OpenTelemetry 同时提供了一系列配套代码库，适配各种开发框架。在开发框架中引入对应的代码库中方法，就可以生成测量数据。

## OpenTelemetry 架构

[OpenTelemetry Client Architecture][20] 介绍了整体架构。

* 以 signal 为中心进行组织同类型的观测数据，比如 Tracing、Metricing、Loging 是三个不同的 signal；
* signal 共用一套 context propagation 机制；
* signal 由四部分组成： api、sdk、Semantic Conventions、Contrib Packages。

signal 的构成：

* api：  最基础的接口定义
* sdk：  api 实现以及额外的接口
* [Semantic Conventions][22]：常用的属性名称和属性数值命名约定
* Contrib Packages： 未纳入 sdk 的可选代码

每种语言单独实现，比如 Go 语言实现包括下面的项目：[otel go][21]

* [opentelemetry-go][14]：          OpenTelemetry Go API and SDK
* [opentelemetry-go-contrib][23]：  Collection of extensions for OpenTelemetry-Go

### Semantic Conventions 

Semantic Conventions 是一套命名约定，目的为了将观测数据中的名称统一，定义了各种场景里 metrics 名称、通用的属性名称等。在项目 [Semantic Conventions][22] 中用 yaml 文件的方式维护，页面 [OpenTelemetry Semantic Conventions 1.25.0][24] 中进行了分类展示。

每种实现语言需要根据描述文档生成对应的常量或者枚举

* Go 语言实现的 Semantic Conventions ：[opentelemetry-go/semconv][25]

Go 的实现中对于通用的属性提供了function，可以直接用来创举属性的键值对，比如下面的 semconv.ServerAddress()。metrics 名称等则是用常量定义的。

```go
counter.Add(ctx, 1, metric.WithAttributes(
    semconv.ServerAddress(serverAddr),
    semconv.ClientAddress(clientAddr),
    semconv.RPCMethod(method),
))
```

### instrumentation libraries

otel 还包括一系列的 [instrumentation libraries][13]。它们是针对特定的开发框架提供的 sdk，可以在 [OpenTelemetry Registry][15] 中查找相关项目。

* 适用于 grpc 的配套代码：[instrumentation/google.golang.org/grpc/][16]

## 基础使用

Tracing、Metricing 和 Logging 数据生成需要分别引用不同的代码包。它们是独立声明的 go package，虽然都位于一个 repo。

api 定义分别是下面的三个 package：

```go
"go.opentelemetry.io/otel/trace"
"go.opentelemetry.io/otel/metric"
"go.opentelemetry.io/otel/log"
```

还有各自的 sdk 代码包：

```go
sdktrace "go.opentelemetry.io/otel/sdk/trace"
sdkmetric "go.opentelemetry.io/otel/sdk/metric"
sdklog "go.opentelemetry.io/otel/sdk/log"
```

三者的 api 和 sdk 使用方式是类似的：

* 生成一个 sdk 中定义的 exporter
* 用上一步的 exporter 生成 api 中定义的 tracer/meter/logger
* 用上一步的 tracer/meter/logger 的各自的方法生成观测数据

以 tracing 为例，InitTrace 中创建了 exporter，然后生成 tracerProvider 和 tracer。在 DemoDepth0 中用 tracer.Start() 生成 trace 数据。

```go
import (
    "context"
    "go.opentelemetry.io/otel"
    "go.opentelemetry.io/otel/exporters/stdout/stdouttrace"
    "go.opentelemetry.io/otel/propagation"
    sdktrace "go.opentelemetry.io/otel/sdk/trace"
    "go.opentelemetry.io/otel/trace"
)

func InitTrace(ctx context.Context, name string) (*sdktrace.TracerProvider, trace.Tracer, error) {
   exporter, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
   if err != nil {
      return nil, nil, err
   }
   tracerProvider := sdktrace.NewTracerProvider(
      sdktrace.WithBatcher(exporter),
   )

   otel.SetTracerProvider(tracerProvider)
   otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

   tracer :=  otel.GetTracerProvider().Tracer(name)

   return tracerProvider, tracer, nil
}

func DemoDepth0(ctx context.Context, tracer trace.Tracer) {
   ctx, span := tracer.Start(ctx, "DemoDepth1")
   defer span.End()
   DemoDepth1(ctx, tracer)
}
```

## Exporter

OpenTelemetry 通过内置的 [Exporter][6] 将数据转换成各类第三方系统能够识别的格式。[opentelemetry-go/example][12] 给出了一些例子。
其中 [example/otel-collector][18] 使用了一个配套工具 [opentelemetry-collector-contrib][10]，该工具可以将 otlp 格式的数据转换成其它格式。

* [stdout][11] 单纯将数据输出到 stdout
* [otlp][8] 按照  OpenTelemetry 制定的 [opentelemetry-proto][9] 格式输出数据

Exporter 的使用方式是相似的:

* 调用对应的 New() 创建 expoter
* 调用 sdk 中的方法创建使用 expoter 的 provider
* 注册 provider
* 随时可以用 otel.GetTracerProvider().Trace() 创建的 tracer 生成 trace 数据

```go
func TestExporterStdout(t *testing.T) {
    ctx := context.Background()

    exporter, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
    if err != nil {
        t.Fatalf("create exporter stdout fail: %s", err.Error())
    }
    tracerProvider := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
    )
    defer tracerProvider.Shutdown(ctx)

    otel.SetTracerProvider(tracerProvider)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

    tracer := otel.GetTracerProvider().Tracer("stdout demo")

    DemoDepth0(ctx, tracer)
}

```

使用 tracer 生成 trace 数据：

```go
func DemoDepth0(ctx context.Context, tracer trace.Tracer) {
   ctx, span := otel.GetTracerProvider().Tracer("demo").Start(ctx, "DemoDepth1")
   defer span.End()
   DemoDepth1(ctx, tracer)
}

func DemoDepth1(ctx context.Context, tracer trace.Tracer) {
   ctx, span := otel.GetTracerProvider().Tracer("demo").Start(ctx, "DemoDepth2")
   defer span.End()
   DemoDepth2(ctx, tracer)
}

func DemoDepth2(ctx context.Context, trace trace.Tracer) {
}
```


## 在 grpc 中使用 OpenTelemetry

例子：[instrumentation/google.golang.org/grpc/otelgrpc/example][17]

expoter 的选择以及 provider 的注册需要自行编写，方法同 stdout exporter 的使用。

```go
var (
    tracerProvider *sdktrace.TracerProvider
)

func InitTrace(ctx context.Context, name string) error {
    exporter, err := stdouttrace.New(stdouttrace.WithPrettyPrint())
    if err != nil {
        return err
    }
    tracerProvider = sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exporter),
    )

    otel.SetTracerProvider(tracerProvider)
    otel.SetTextMapPropagator(propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{}))

    return nil
}

func StopTrace(ctx context.Context) error {
    return tracerProvider.Shutdown(ctx)
}
```

client 端创建连接时添加 grpc.WithStatsHandler(otelgrpc.NewClientHandler()) 后，就会自动为所有 rpc 请求添加 trace 信息。

```go
    conn, err := grpc.NewClient(ADDR,
        grpc.WithStatsHandler(otelgrpc.NewClientHandler()),
    )
```

server 端创建 server 时添加 grpc.StatsHandler(otelgrpc.NewServerHandler()) 后，就会自动从请求头中解析出 trace 信息。如果请求头中没有 trace 信息，就初始生成。

```go
    s := grpc.NewServer(
        grpc.StatsHandler(otelgrpc.NewServerHandler()),
    )
```

## 参考

1. [李佶澳的博客][1]
2. [Observability Primer][2]
3. [What is OpenTelemetry?][3]
4. [Jaeger: open source, distributed tracing platform][4]
5. [Prometheus：From metrics to insight][5]
6. [exporters][6]
7. [example/otel-collector][7]
8. [exporters/otlp][8]
9. [opentelemetry-proto][9]
10. [opentelemetry-collector-contrib][10]
11. [exporters/stdout][11]
12. [opentelemetry-go/example][12]
13. [Using instrumentation libraries][13]
14. [opentelemetry-go][14]
15. [OpenTelemetry Registry][15]
16. [instrumentation/google.golang.org/grpc/][16]
17. [instrumentation/google.golang.org/grpc/otelgrpc/example][17]
18. [example/otel-collector][18]
19. [OpenTelemetry介绍][19]
20. [OpenTelemetry Client Architecture][20]
21. [otel go][21]
22. [OpenTelemetry Semantic Conventions][22]
23. [opentelemetry-go-contrib][23]
24. [OpenTelemetry Semantic Conventions 1.25.0][24]
25. [v1.26.0/semconv][25]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://opentelemetry.io/docs/concepts/observability-primer/ "Observability Primer"
[3]: https://opentelemetry.io/docs/what-is-opentelemetry/ "What is OpenTelemetry?"
[4]: https://www.jaegertracing.io/ "Jaeger: open source, distributed tracing platform"
[5]: https://prometheus.io/ "Prometheus：From metrics to insight"
[6]: https://github.com/open-telemetry/opentelemetry-go/tree/main/exporters "exporters"
[7]: https://github.com/open-telemetry/opentelemetry-go/tree/main/example/otel-collector "example/otel-collector"
[8]: https://github.com/open-telemetry/opentelemetry-go/tree/main/exporters/otlp "otlp"
[9]: https://github.com/open-telemetry/opentelemetry-proto "opentelemetry-proto"
[10]: https://github.com/open-telemetry/opentelemetry-collector-contrib "opentelemetry-collector-contrib"
[11]: https://github.com/open-telemetry/opentelemetry-go/tree/example/basic/v0.15.0/exporters/stdout "exporters/stdout"
[12]: https://github.com/open-telemetry/opentelemetry-go/tree/main/example "opentelemetry-go/example"
[13]: https://opentelemetry.io/docs/languages/go/libraries/ "Using instrumentation libraries"
[14]: https://github.com/open-telemetry/opentelemetry-go "opentelemetry-go"
[15]: https://opentelemetry.io/ecosystem/registry/?language=go&component=instrumentation "OpenTelemetry Registry"
[16]: https://github.com/open-telemetry/opentelemetry-go-contrib/tree/main/instrumentation/google.golang.org/grpc "instrumentation/google.golang.org/grpc/"
[17]: https://github.com/open-telemetry/opentelemetry-go-contrib/tree/main/instrumentation/google.golang.org/grpc/otelgrpc/example "instrumentation/google.golang.org/grpc/otelgrpc/example"
[18]: https://github.com/open-telemetry/opentelemetry-go/tree/main/example/otel-collector "example/otel-collector"
[19]: https://goframe.org/pages/viewpage.action?pageId=3673499 "OpenTelemetry介绍" 
[20]: https://opentelemetry.io/docs/specs/otel/overview/ "OpenTelemetry Client Architecture"
[21]: https://github.com/orgs/open-telemetry/repositories?type=all&q=go "otel go"
[22]: https://github.com/open-telemetry/semantic-conventions "OpenTelemetry Semantic Conventions"
[23]: https://github.com/open-telemetry/opentelemetry-go-contrib "opentelemetry-go-contrib"
[24]: https://opentelemetry.io/docs/specs/semconv/ "OpenTelemetry Semantic Conventions 1.25.0"
[25]: https://github.com/open-telemetry/opentelemetry-go/tree/v1.26.0/semconv "v1.26.0/semconv"
