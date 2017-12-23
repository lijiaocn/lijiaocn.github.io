---
layout: default
title: html、css、scss、js入门
author: lijiaocn
createdate: 2017/12/23 11:18:46
changedate: 2017/12/23 17:18:51
categories: 编程
tags: web
keywords: html,css,scss,web,入门手册
description: 有很多关于html、css等前端技术等文档、手册，都不能让一个完全不懂的人对html、css、scss等形成一个整体的认识

---

* auto-gen TOC:
{:toc}

## 说明

有很多关于html、css等前端技术等文档、手册，都不能让一个完全不懂的人对html、css、scss等形成一个整体的认识。

## HTML

HTML是一门标记语言（Hypertext Markup Language）。这门语言与其它的编程语言，例如C/JAVA/GO等非常的不同。

HTML是完全标签化的，它由一整套的标签组成，标签与标签之间没有很强逻辑、依赖关系，基本都是平铺的，因此给人的感觉非常的零碎。

### 快速感知

一个html文件的格式如下：

	<!DOCTYPE html>
	<html>
	  <head>
	    <title>Sample page</title>
	  </head>
	  <body>
	    <h1>Sample page</h1>
	    <p>This is a <a href="demo.html">simple</a> sample.</p>
	    <!-- this is a comment -->
	  </body>
	</html>

整个文件由`元素(element)`和`文本(text)`组成，被`<>`包裹的组成了元素，其余的是文本。

元素通常由两个`标签(tag)`组成，一个是开始标签，例如`<body>`，一个是结束标签，例如`</body>`。

元素是有属性(attributes)的，属性在开始标签中，以"属性名=属性值"的格式设置。

例如下面设置了元素a的href属性。

	<a href="demo.html">simple</a>

如果属性值中没有空格、单引号、双引号、等号和尖括号，可以省略双引号。

如果属性值是空字符串，可以直接省略。

	<!-- empty attributes -->
	<input name=address disabled>
	<input name=address disabled="">
	
	<!-- attributes with a value -->
	<input name=address maxlength=200>
	<input name=address maxlength='200'>
	<input name=address maxlength="200">

浏览器或者其它处理html文件的工具，将html文件读取后，在系统内存中构造了一个树形的结构。

这个位于内存中的树形的结构叫做DOM(Document Object Model) Tree，组成它的每个节点叫做DOM。

html文件中的元素(element)，在DOM树中是一个一个object。

这些object是有API的，html页面中的脚本可以通过调用object的API，来修改它们属性。

	<form name="main">
	  Result: <output name="result"></output>
	  <script>
	    document.forms.main.elements.result.value = 'Hello World';
	  </script>
	</form>

html支持将内容和展示分离，用一个叫做CSS的样式语言(a styling language)来描述展示。

	<!DOCTYPE html>
	<html>
	  <head>
	    <title>Sample styled page</title>
	    <style>
	      body { background: navy; color: yellow; }
	    </style>
	  </head>
	  <body>
	    <h1>Sample styled page</h1>
	    <p>This page is just a demo.</p>
	  </body>
	</html>

学习html，就是掌握它的所有元素，所有元素的属性和修改方法。

html的元素很多，不同元素的属性又是有差异的，需要记住大量的内容。

### 演变历史

[wikipedia: HTML][1]中介绍了HTML的前世今生。

第一个正式的HTML标准是1995年发布的HTML 2.0，以RFC的形式发布：[RFC 1866: Hypertext Markup Language - 2.0][2]。

之后HTML标准主要由[w3c][3]制定和发布。

2017年12月14日，w3c发布了[HTML 5.2][4]。但是需要特别注意的是，w3cHTML标准只是一个推荐标准。

用HTML写的网页最终是在浏览器里呈现的，浏览器怎样解读HTML完全是浏览器的开发者自己的事情，没有人能够约束。

因此，同样的HTML文件，在不同的浏览器里，可能呈现出不同的样子。w3c建议的一些最新特性，浏览器可能还没有支持。

没有一个大一统的浏览器，是web前端开发者痛苦的根源。

2004年时候，一个名为[whatwg][6]的新组织成立，

w3c与whatwg几度分合之后，开始html5标准的开发，但之后出现分歧。

w3c倾向于将标准划断，不同的标准包含不同的特性。whatwg致力于维护一份[HTML Living Standard][7]，在一份标准中持续增加特性，该标准有[中文版][8]。

目前w3c正在持续吸收whatwg的改进。

### HTML5.2

w3c的HTML的标准托管在[github: w3c's html][5]，whatwg的标准：w[github: whatwg's html][9]。

初学者可以随意选择一份开始学习，鉴于w3c和whatwg都有强大的影响力，最终不仅两份标准都要学习，还要知晓它们的差异。

这里学习的是w3c的标准[html 5.2][4]，目的是对html形成一个整体上的认识。

标准文档一共12个章节：

	1. Introduction，介绍了html的历史，设计原则，对形成整体认识特别有帮助
	2. Common infrastructure，术语和基础概念
	3. Semantics, structure, and APIs of HTML documents，介绍了Dom和element的属
	4. The elements of HTML，HTML的元素
	5. User interaction，HTML的交互机制
	6. Loading Web pages，HTML在浏览器中的加载过程
	7. Web application APIs，在HTML中使用的脚本的基本特性
	8. The HTML syntax，HTML语法
	9. The XML syntax，XML语法
	10. Rendering，浏览器渲染HTMl的过程
	11. Obsolete features，过时的特性
	12. IANA considerations， IANA的一些考虑

## 参考

1. [wikipedia: HTML][1]
2. [Hypertext Markup Language - 2.0][2]
3. [w3c][3]
4. [w3c HTML 5.2][4]
5. [github: w3c's html][5]
6. [whatwg][6]
7. [html Living Standard][7]
8. [whatwg: html Living Standard(中文版)][8]
9. [github: whatwg's html][9]

[1]: https://en.wikipedia.org/wiki/HTML  "wikipedia: HTML" 
[2]: https://tools.ietf.org/html/rfc1866 " Hypertext Markup Language - 2.0"
[3]: https://www.w3.org/ "w3c"
[4]: https://www.w3.org/TR/2017/REC-html52-20171214/ "HTML 5.2"
[5]: https://github.com/w3c/html "github: w3c's html"
[6]: https://whatwg.org/ "whatwg"
[7]: https://html.spec.whatwg.org/ "whatwg: html Living Standard"
[8]: https://whatwg-cn.github.io/html/ "whatwg: html Living Standard(中文版)`"
[9]: https://github.com/whatwg/html "github: whatwg's html"
