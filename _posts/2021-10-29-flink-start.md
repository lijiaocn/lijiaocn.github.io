---
layout: default
title: "流式数据处理系统 Apache Flink 简单了解"
author: 李佶澳
date: "2021-10-29 14:35:10 +0800"
last_modified_at: "2021-10-29 14:35:10 +0800"
categories: 编程
cover: 
tags: flink 
keywords: flink,数据处理,大数据,流式数据
description: 用于处理在「一段时间内」逐渐产生的数据，即数据流，数据流中的单个数据称为事件/event
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

学习资料是官网文档 [What is Apache Flink? ][2]，简单了解下使用场景和原理。

## 使用场景

用于处理在「一段时间内」逐渐产生的数据，即数据流，数据流中的单个数据称为事件/event。

处理流式数据有两种思路：

1. 等数据都生成后，对完整数据进行处理
2. 在数据生成过程中就开始处理，数据生成的同时进行处理

方式1存在的问题：

1. 需要等数据全部就绪，获得结果要等太久
2. 有些场景下，数据是永续生成的，没有终止，譬如日志

永续生成没有截止的数据，flink 将其称为「Unbounded streams」，与之相对的是「Bounded streams」，如下图所示：

![unbounded streams 和 bounded streams]({{ site.article }}/flink_stream.png)

flink 是一个专门用于处理流式数据的开发框架，同时支持 unbounded streams 和 bounded streams。

## 运算资源的获取

flink 可以自行管理服务器的资源，也可以部署到其它资源调度系统中，从第三方资源调度系统申请资源，支持以下系统：

1. Hadpoop YARN
2. Apache Mesos
3. Kubernetes

## 基本概念

flink 有三个基本概念：

1. streams：即数据流
2. state：流式数据处理系统的状态
3. time：时间

开发者基于 flink 开发运行在 flink 上的流式处理应用，stream 是应用的输入，应用处理事件的中间态是 state（即有状态服务），开发者在应用代码中事件处理的时间策略。

整个 flink 就是围绕 state 构建的，简单说就是如何保持住中间结果。

事件到达应用的顺序和它的产生顺序可能不一致，并且事件产生和到达之间有时延，所以需要设置事件处理的时间策略。flink 支持两种时间策略：

1. Event-time Mode：按照事件发生时间处理，无论事件到达情况怎样，统一按照事件发生顺序处理
2. Processing-time Mode：按照事件的到达顺序处理，忽略事件的发生顺序

方式1可以保证中间结果和实际情况一致，但是可能要过度等待，避免漏掉还在传输中的事件。

方式2收到事件时即处理，延迟低，但是中间输出的结果可能和实际不符。

为了协调方式1和方式2各自的优缺点，flink 提供了 Watermark Support 和 Late Data Handing。

1. Watermark Support：在 Event-time Mode 中，通过设置允许时差，协调延迟事件和结果准确性
2. Late Data Handing：在 Processing-time Mode 中，设定「先发生后到达」的事件的处理策略

## 操作接口

flink 提供了三个层面的操作接口：

![flink 操作接口]({{ site.article }}/flink_api.png)

控制粒度最细的是 ProcessFunction，即编写事件的处理代码，直接操作到达的事件。

其次是 DataStream API，DataStream API 提供了一些汇聚函数。

最后是 SQL & Table API，提供类似 SQL 的操作接口 。

### ProcessFunction

```java
/**
 * Matches keyed START and END events and computes the difference between
 * both elements' timestamps. The first String field is the key attribute,
 * the second String attribute marks START and END events.
 */

public static class StartEndDuration
    extends KeyedProcessFunction<String, Tuple2<String, String>, Tuple2<String, Long>> {

  private ValueState<Long> startTime;

  @Override
  public void open(Configuration conf) {
    // obtain state handle
    startTime = getRuntimeContext()
      .getState(new ValueStateDescriptor<Long>("startTime", Long.class));
  }

  /** Called for each processed event. */
  @Override
  public void processElement(
      Tuple2<String, String> in,
      Context ctx,
      Collector<Tuple2<String, Long>> out) throws Exception {

    switch (in.f1) {
      case "START":
        // set the start time if we receive a start event.
        startTime.update(ctx.timestamp());
        // register a timer in four hours from the start event.
        ctx.timerService()
          .registerEventTimeTimer(ctx.timestamp() + 4 * 60 * 60 * 1000);
        break;
      case "END":
        // emit the duration between start and end event
        Long sTime = startTime.value();
        if (sTime != null) {
          out.collect(Tuple2.of(in.f0, ctx.timestamp() - sTime));
          // clear the state
          startTime.clear();
        }
      default:
        // do nothing
    }
  }

  /** Called when a timer fires. */
  @Override
  public void onTimer(
      long timestamp,
      OnTimerContext ctx,
      Collector<Tuple2<String, Long>> out) {

    // Timeout interval exceeded. Cleaning up the state.
    startTime.clear();
  }
}
```

### DataStream API 

```java
// a stream of website clicks
DataStream<Click> clicks = ...

DataStream<Tuple2<String, Long>> result = clicks
  // project clicks to userId and add a 1 for counting
  .map(
    // define function by implementing the MapFunction interface.
    new MapFunction<Click, Tuple2<String, Long>>() {
      @Override
      public Tuple2<String, Long> map(Click click) {
        return Tuple2.of(click.userId, 1L);
      }
    })
  // key by userId (field 0)
  .keyBy(0)
  // define session window with 30 minute gap
  .window(EventTimeSessionWindows.withGap(Time.minutes(30L)))
  // count clicks per session. Define function as lambda function.
  .reduce((a, b) -> Tuple2.of(a.f0, a.f1 + b.f1));
```


### SQL & Table API

```sql
SELECT userId, COUNT(*)
FROM clicks
GROUP BY SESSION(clicktime, INTERVAL '30' MINUTE), userId
```

## 最后

这里只简单了解下 flink 是干嘛的，至于怎么搭建、怎么使用，使用时注意些什么，以后有时间再研究。

## 参考

1. [李佶澳的博客][1]
2. [What is Apache Flink? ][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://flink.apache.org/flink-architecture.html "What is Apache Flink? "
