---
layout: default
title: "Chrome 浏览器扩展插件能够适用的 Chrome 能力"
author: 李佶澳
date: "2022-07-21 11:33:42 +0800"
last_modified_at: "2022-07-21 17:12:34 +0800"
categories:  编程
cover:
tags: 浏览器
keywords:
description:
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

简单了解下 Chrome 浏览器扩展插件都有哪些能力可以用。Chrome浏览器插件开发的基本过程前篇 [Chrome/Edge/Safari/Firefox/Opera浏览器扩展插件的开发过程概览](/编码/2022/07/19/brower-extension-basic.html)。

## 插件运行机制

插件在隔离的沙箱环境中运行：

```
Extensions are built on web technologies such as HTML, JavaScript, and CSS. 
They run in a separate, sandboxed execution environment and interact with the Chrome browser.
```

## Manifest V3 概览

manifest.json 是 Chrome 插件的入口文件，它有不同的定义版本，当前最新版本是 [Manifest V3][3]，从 Chrome 88 开始支持。Manifest v2版本的插件从2023年开始不能在 Chrome 内使用。

## API 手册

[Chrome Extensions API Reference][4]

## Samples

[GoogleChrome/chrome-extensions-samples][5]

## 参考

1. [李佶澳的博客][1]
2. [Chrome Extensions Getting Started][2]
3. [Welcome to Manifest V3][3]
4. [Chrome Extensions API Reference][4]
5. [GoogleChrome/chrome-extensions-samples][5]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developer.chrome.com/docs/extensions/mv3/getstarted/ "Chrome Extensions Getting Started"
[3]: https://developer.chrome.com/docs/extensions/mv3/intro/ "Welcome to Manifest V3"
[4]: https://developer.chrome.com/docs/extensions/reference/ "Chrome Extensions API Reference"
[5]: https://github.com/GoogleChrome/chrome-extensions-samples "GoogleChrome/chrome-extensions-samples"
