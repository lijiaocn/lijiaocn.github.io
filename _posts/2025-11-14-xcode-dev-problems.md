---
layout: default
title: "在 xcode 中开发 ios 原生应用遇到的一些傻瓜问题"
author: 李佶澳
categories: [problems]
tags: [ios开发]
keywords: 
description: 记录在 xcode 中开发 ios 应用遇到的一些很初级但是又很容易让初学者有挫折感的小问题。这些问题通常不是什么复杂问题，都是配置或使用方式的问题，通常是因为操作时参考的文档过时或者不具体导致的。
---

## 目录

* auto-gen TOC:
{:toc}

## Run Script 中的文件复制命令无法执行

用 Run Script 功能不同的构建目标使用不同的 firebase plist 配置文件。gemini 给出的脚本操作是，构建时选择一个 plist 文件将其复制到构建目录中。在构建的时候，cp 命令始终不成功， 遇到类似错误：

```
Operation not permitted...
Sandbox: cp(11494) deny(1) file-read-data
Sandbox: cp(11979) deny(1) file-write-create
```

原因是还需要在 run script 配置界面的下方明确指定要复制的 input file 和要复制到的 output file：

![run script]({{ site.article }}/xcode-run-script.png)


## Add Package 增加 firebase sdk 依赖后，依然提示找不到 module

按照 firebase 的文档在 add package 中添加 firebase sdk 以后，在应用入口处初始化 firebase。 IDE 报错找不到 firebasecore 模块。

在 add package 的操作的最后阶段，还需要一步操作，在 Add To Target 中选中当前 Target，默认是不添加到 target 的。

![add to target]({{ site.article }}/xcode-add-package.png)

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
