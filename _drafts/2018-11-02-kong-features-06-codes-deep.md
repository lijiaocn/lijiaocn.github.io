---
layout: default
title:  "API网关Kong（九）：Kong数据平面代码深入阅读"
author: 李佶澳
createdate: "2018-11-02 17:50:18 +0800"
last_modified_at: "2018-11-02 17:50:18 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关,code,代码分析
description: 对kong的数据平面代码进行比较深入的阅读，这里记录一些阅读过程中了解到的细节，比较琐碎，不成系统。
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。


对kong的数据平面代码进行比较深入的阅读，这里记录一些阅读过程中了解到的细节，比较琐碎，不成系统。

[API网关Kong（六）：Kong数据平面的实现分析][1]、[API网关Kong（七）：Kong数据平面Plugin的调用过程][2]中对Kong数据平面的大概情况作了分析，这篇可以看做是它们的延续，关注的实现细节。

分析的代码版本是0.14.1。

## kong/pdk

kong/pdk是为插件开发准备的一系列变量和方法，PDK是Plugin Development Kit的意思。

kong_global

-- kong/init.lua
_G.kong = kong_global.new() -- no versioned PDK for plugins for now
function Kong.init()
	...
	  kong_global.init_pdk(kong, config, nil) -- nil: latest PDK
	...



## Kong.ssl_certificate()

## 参考

1. [API网关Kong（六）：Kong数据平面的实现分析][1]
2. [API网关Kong（七）：Kong数据平面Plugin的调用过程][2]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html "API网关Kong（六）：Kong数据平面的实现分析" 
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html "API网关Kong（七）：Kong数据平面Plugin的调用过程"
