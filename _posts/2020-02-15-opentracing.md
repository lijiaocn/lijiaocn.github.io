---
layout: default
title: "链路追踪：OpenTracing SDK 与 Jaeger 的对接方法"
author: 李佶澳
date: "2020-02-15T18:42:46+0800"
last_modified_at: "2020-02-15T18:42:46+0800"
categories: 编程
cover:
tags: 软件工程
keywords: monitoring
description: OpenTracing 收集了各种语言的埋点 SDK，能与多种链路跟踪系统无缝对接， 譬如 Jaeger
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

>`OpenTracing 项目已经终止，OpenTelemetry 接替了它:`
>
>[用 OpenTelemetry 开发可观测的软件系统（Observability）](/方法/2024/05/06/opentelemetry.html)

链路跟踪就是在每个处理环节埋点，通过埋点记录每个处理环节的开始时间和结束时间，并将信息发送到链路跟踪服务，譬如 Jaeger，从而掌握了整个请求链路的处理情况。

譬如 http 请求发送时时间、接收时间、和处理过程中的每次函数调用的耗时。

## 准备 Jaeger

在本地启动一个 Jaeger 服务，简单起见，直接用 docker 运行：

```sh
docker run -d -p 6831:6831/udp -p 16686:16686 jaegertracing/all-in-one:1.17.0
```

6831 是 Jaeger 的 udp 监听端口，用于接收埋点发送的数据，16686 是 Jageer 的页面服务端口，可以在浏览器中打开，127.0.0.1:16686：

![jaeger的查看页面]({{ site.article}}/jaeger-ui-1.png)


## Opentracing

>Opentracing 项目已经归档停止开发，[CNCF Archives the OpenTracing Project][6]。

[OpenTracing][2] 收集了各种语言的埋点 SDK，能与多种链路跟踪系统无缝对接， 譬如 [Jaeger][5]。[opentracing-go][4] 是 OpenTracing 收录的 Go SDK，可以与 Jaeger 的 Go SDK 对接：

```go
package main

import (
    "io"
    "log"

    opentracing "github.com/opentracing/opentracing-go"
    oplog "github.com/opentracing/opentracing-go/log"
    jaeger "github.com/uber/jaeger-client-go"
    jaegercfg "github.com/uber/jaeger-client-go/config"
    jaegerlog "github.com/uber/jaeger-client-go/log"
    "github.com/uber/jaeger-lib/metrics"
)
```

Jaeger 连接的初始化方法：

```go
func initJaeger(service, addr string) (opentracing.Tracer, io.Closer, error) {
    cfg := jaegercfg.Configuration{
        ServiceName: service,
        Sampler: &jaegercfg.SamplerConfig{
            Type:  jaeger.SamplerTypeConst,
            Param: 1,
        },
        Reporter: &jaegercfg.ReporterConfig{
            LogSpans:           true,
            LocalAgentHostPort: addr,
        },
    }
    jLogger := jaegerlog.StdLogger
    jMetricsFactory := metrics.NullFactory

    return cfg.NewTracer(
        jaegercfg.Logger(jLogger),
        jaegercfg.Metrics(jMetricsFactory),
    )
}
```

用 opentracing-go 发送埋点数据：

```go
//docker run -d -p 6831:6831/udp -p 16686:16686 jaegertracing/all-in-one:latest
func main() {
    tracer, closer, err := initJaeger("00-quickstart", "127.0.0.1:6831")
    if err != nil {
        log.Fatal(err.Error())
    }
    defer closer.Close()
    opentracing.SetGlobalTracer(tracer)

    rootspan := opentracing.StartSpan("rootcall")
    defer rootspan.Finish()
    rootspan.SetTag("rootcall", "rootcall")

    subspan := opentracing.StartSpan("subcall",
        opentracing.ChildOf(rootspan.Context()))
    defer subspan.Finish()
    subspan.SetTag("subcall", "subcall")
    subspan.LogFields(oplog.String("event", "testlog"))
}
```

HTTP 发送端的埋点方法：

```go
func client() {
    url := "http://localhost:8082/publish"
    req, _ := http.NewRequest("GET", url, nil)

    tracer := opentracing.GlobalTracer()

    clientSpan := tracer.StartSpan("client")
    defer clientSpan.Finish()

    ext.SpanKindRPCClient.Set(clientSpan)
    ext.HTTPUrl.Set(clientSpan, url)
    ext.HTTPMethod.Set(clientSpan, "GET")

    tracer.Inject(clientSpan.Context(), opentracing.HTTPHeaders, opentracing.HTTPHeadersCarrier(req.Header))
    http.DefaultClient.Do(req)
}
```

HTTP 接收端的埋点方法：

```go
func server() {
    tracer := opentracing.GlobalTracer()
    http.HandleFunc("/publish", func(w http.ResponseWriter, r *http.Request) {
        spanctx, _ := tracer.Extract(opentracing.HTTPHeaders,
            opentracing.HTTPHeadersCarrier(r.Header))
        serverspan := tracer.StartSpan("server", ext.RPCServerOption(spanctx))
        defer serverspan.Finish()
    })
    log.Fatal(http.ListenAndServe(":8082", nil))
}
```

## 参考

1. [李佶澳的博客][1]
2. [opentracing教程][2]
3. [yurishkuro/opentracing-tutorial][3]
4. [opentracing-go][4]
5. [jaegertracing][5]
6. [CNCF Archives the OpenTracing Project][6]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://opentracing.io/docs/supported-languages/ "opentracing教程"
[3]: https://github.com/yurishkuro/opentracing-tutorial/tree/master/go "yurishkuro/opentracing-tutorial"
[4]: https://github.com/opentracing/opentracing-go "opentracing-go"
[5]: https://www.jaegertracing.io/ "jaegertracing"
[6]: https://www.cncf.io/blog/2022/01/31/cncf-archives-the-opentracing-project/ 
