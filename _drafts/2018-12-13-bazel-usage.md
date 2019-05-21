---
layout: default
title: "Bazel-usage"
author: 李佶澳
createdate: "2018-12-13 14:41:08 +0800"
changedate: "2018-12-13 14:41:08 +0800"
categories:
tags:
keywords:
description:
---

* auto-gen TOC:
{:toc}

## 说明

[Bazel](https://docs.bazel.build/versions/master/bazel-overview.html)是一个新型的构建、测试工具。

## 安装Bazel

## 设置workspace

workspace中包含要编译的项目的所有文件，以及编译得到的文件。

## 编写Build文件

```
cc_binary(
    name = "hello-world",
    srcs = ["hello-world.cc"],
)
```



## 运行Bazel

bazel build //main:hello-world


## 参考

1. [文献][1]

[1]: 1.com "文献1
