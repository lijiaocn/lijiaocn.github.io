---
layout: default
title: 怎样选择开源源代码的license?
author: lijiaocn
createdate: 2017/10/22 20:09:47
changedate: 2017/10/22 21:38:41
categories: 方法
tags: IT方法
keywords: license,opensource
description: 在发布源代码的时候需要选择合适的license，在使用开源代码的时候更是要注意所用代码的license。

---

* auto-gen TOC:
{:toc}

## 说明

在发布源代码的时候需要选择合适的license，在使用开源代码的时候更是要注意所用代码的license。

在对知识产权会越来越重视的今天，更是要特别注意。

[开源许可证教程][2]中对开源许可证做了很好的介绍：

	版权法默认禁止共享，没有许可证的软件，就等同于保留版权，即使开源了，也不能使用源码，否则侵犯版权。

![six-opensouce-license]({{ site.imglocal }}/opensource-license/six-licenses.png)

## GPL, General Public License

GPL要求任何引用了源码的软件、源码衍生出来的软件，都必须使用GPL协议开源，不得有流通限制。

## LGPL, Lesser General Public License

LGPL要求任何由源码衍生出来的软件，都必须使用LGPL协议开源。

LGPL允许以类库方式引用源码的软件，以商业的形式闭源。

## MPL, Mozilla Public License

MPL要求修改的源码，必须使用MPL协议开源。

## Apache License

Apache License要求衍生的源码中需要保留原有协议、商标、专利和作者要求的声明。

Apache License要求如果再发布的产品中包含Notice，需要带有Apache License。

## BSD

BSD要求被使用的源码，需要保留BSD协议。

BSD要求使用了源码的二进制类库/软件，文档和版权声明中需要包含BSD协议。

BSD不允许用源码的作者或者机构的名字，以及原产品的名字做市场推广。

## MIT, Massachusetts Institute of Technology

MIT要求使用了源码的产品，包含版权声明和许可声明。

## 参考

1. [开源软件License汇总][1]
2. [开源许可证教程][2]

[1]: http://blog.csdn.net/fengbingchun/article/details/55106926 "开源软件License汇总" 
[2]: http://www.ruanyifeng.com/blog/2017/10/open-source-license-tutorial.html "开源许可证教程"
