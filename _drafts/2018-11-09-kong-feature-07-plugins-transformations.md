---
layout: default
title: "API网关Kong（十）：功能梳理和插件使用-内容改写插件"
author: 李佶澳
createdate: 2018/11/09 15:17:00
changedate: 2018/11/09 15:17:00
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关
description: Kong的plugins中列出了Kong的社区版支持的一些插件，这里尝试使用一下其中更改请求和响应数据的插

---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

[Kong的plugins](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#kong%E7%9A%84%E6%8F%92%E4%BB%B6)中列出了Kong的社区版支持的一些插件，这里尝试使用一下其中的内容修改插件(Transformations)：

	Correlation ID
	Request Transformer
	Response Transformer

## Request Transformer

[Kong Plugin: Request Transformer][1]用来

## 参考

1. [Kong Plugin: Request Transformer][1]

[1]: https://docs.konghq.com/hub/kong-inc/request-transformer/  "Kong Plugin: Request Transformer"
