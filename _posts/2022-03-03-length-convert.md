---
layout: default
title: "CSS 长度单位转换: pixels、points、picas 与 inches 等"
author: 李佶澳
date: "2022-03-03 17:30:00 +0800"
last_modified_at: "2022-04-08 14:27:16 +0800"
categories: 编程
cover:
tags: web
keywords: css,长度单位
description: CSS长度单位说明以及不同单位之间的转换关系，cm/mm/in/px/pt/pc/em/ex/rem...
---

## 本篇目录

* auto-gen TOC:
{:toc}

## CSS 学习资料

[Cascading Style Sheetsarticles and tutorials][4]

[CSS tips & tricks][5]

## CSS 像素单位与长度单位的关系

[CSS different units for expressing length][3] 详细介绍了 CSS 使用的长度单位，以及使用解释。

其中绝对长度单位转换关系如下：

```vi
unit    definition
----    ----------
‘cm’    centimeters
‘mm’    millimeters
‘in’    inches; 1in is equal to 2.54cm
‘px’    pixels; 1px is equal to 1/96th of 1in
‘pt’    points; 1pt is equal to 1/72nd of 1in
‘pc’    picas; 1pc is equal to 12pt
```

px 是一个特殊单位，在屏幕上显示时，1px 是一个像素，在打印物上显示时，1px = 1/96 in：

>In fact, CSS requires that 1px must be exactly 1/96th of an inch in all printed output. CSS considers that printers, unlike screens, do not need to have different sizes for px in order to print sharp lines. In print media, a px thus not only has the same visual appearance from one device to another, but indeed it is measurably the same.

对 point/pt 的介绍：[Point (typography)][2]

相对单位（em、ex 等）的定义和使用见 [CSS different units for expressing length][3]。

## 参考

1. [李佶澳的博客][1]
2. [Point (typography)][2]
3. [CSS different units for expressing length][3]
4. [Cascading Style Sheetsarticles and tutorials][4]
5. [CSS tips & tricks][5]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://en.wikipedia.org/wiki/Point_(typography) "Point (typography)"
[3]: https://www.w3.org/Style/Examples/007/units.en.html "CSS different units for expressing length"
[4]: https://www.w3.org/Style/CSS/learning "Cascading Style Sheetsarticles and tutorials"
[5]: https://www.w3.org/Style/Examples/007/ "CSS tips & tricks"

