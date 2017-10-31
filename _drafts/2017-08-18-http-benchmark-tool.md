---
layout: default
title: HTTP的压力测试工具
author: lijiaocn
createdate: 2017/08/18 15:12:29
changedate: 2017/10/31 20:55:40
categories: 问题
tags: benchmark
keywords: http,benchmark,压力测试,tool
description: 对http协议进行压力测试工具

---

* auto-gen TOC:
{:toc}

## ab 

ab是apache的一个压力测试工具，可以并发发出指定数量的http请求，[使用方法][1]。

但是ab只支持http 1.0。

## 参考

1. [ab][1]
2. [siege][2]

[1]: https://httpd.apache.org/docs/2.4/programs/ab.html  "ab" 
[2]: https://www.joedog.org/siege-home/  "siege" 
