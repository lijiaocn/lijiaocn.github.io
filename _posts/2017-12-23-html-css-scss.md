---
layout: default
title: html、css、scss、js入门
author: lijiaocn
createdate: 2017/12/23 11:18:46
changedate: 2017/12/24 20:36:17
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

其中第二章的难度相当大，看不懂可以跳过，毕竟不是所有人都需要实现html标准的。

### 语法、结构和API

Dom的api:

	document.referrer 
	document.cookie[=value]
	document.lastModified
	document.readyState
	document.head
	document.title[=value]
	document.body[=value]
	document.images
	document.embeds
	document.plugins
	document.links
	document.forms
	document.scripts
	collection = document.getElementsByName(name)
	document.currentScript

元素的定义包括以下几个方面的信息：

	类别，Categories
	在哪些上下文中可以使用，Contexts in which this element can be used
	内容类型，Content model，可以包含哪些类型
	标签是否可以省略，Tag omission in text/html
	内容属性，Content attributes
	允许的ARIA属性，Allowed ARIA role attribute values
	允许的ARIA状态属性，Allowed ARIA state and property attributes
	DOM接口，DOM interface

元素的内容可以是以下几类：

	Metadata content
	Flow content
	Sectioning content
	Heading content
	Phrasing content
	Embedded content
	Interactive content

这些类别不是并列的，而是互相交合的，一个元素可以属于多个类别。

![element cataery]({{ site.imglocal }}/html/html-mode-cate.png )

类别内容如下：

	Metadata content: 
		base link meta noscript script style template title 
	Flow content: 大多数元素都是流式的
		a abbr address area (if it is a descendant of a map element) article aside audio b
		bdi bdo blockquote br button canvas cite code data datalist del details dfn dialog 
		div dl em embed fieldset figure footer form h1 h2 h3 h4 h5 h6 header hr i iframe img
		input ins kbd label link (if it is allowed in the body) main map mark MathML math 
		meter nav noscript object ol output p picture pre progress q ruby s samp script 
		section select small span strong style sub sup SVG svg table template textarea time
		u ul var video wbr text 
	Sectioning content: 
		article aside nav section 
	Heading content:
		h1 h2 h3 h4 h5 h6 
	Phrasing content :
		a abbr area (if it is a descendant of a map element) audio b bdi bdo br button canvas
		cite code data datalist del dfn em embed i iframe img input ins kbd label link (if it
		is allowed in the body) map mark MathML math meter noscript object output picture 
		progress q ruby s samp script select small span strong sub sup SVG svg template textarea
		time u var video wbr text 
	Embedded content:
		audio canvas embed iframe img MathML math object picture SVG svg video 
	Interactive content:
		a (if the href attribute is present) audio (if the controls attribute is present) button 
		details embed iframe img (if the usemap attribute is present) input (if the type attribute 
		is not in the Hidden state) label select textarea video (if the controls attribute is present) 
	Palpable content:
		a abbr address article aside audio (if the controls attribute is present) b bdi bdo 
		blockquote button canvas cite code data details dfn div dl (if the element’s children
		include at least one name-value group) em embed fieldset figure footer form h1 h2 h3 
		h4 h5 h6 header i iframe img input (if the type attribute is not in the Hidden state) 
		ins kbd label main map mark MathML math meter nav object ol (if the element’s children 
		include at least one li element) output p pre progress q ruby s samp section select 
		small span strong sub sup SVG svg table textarea time u ul (if the element’s children 
		include at least one li element) var video text that is not inter-element white space 
	Script-supporting elements:
		 script template 

元素的共有属性：

	accesskey
	class
	contenteditable
	dir
	draggable
	hidden
	id
	lang
	spellcheck
	style
	tabindex
	title
	translate
	data-foldername
	data-msgid

所有元素可用的事件：

	onabort
	onauxclick
	onblur*
	oncancel
	oncanplay
	oncanplaythrough
	onchange
	onclick
	onclose
	oncuechange
	ondblclick
	ondrag
	ondragend
	ondragenter
	ondragexit
	ondragleave
	ondragover
	ondragstart
	ondrop
	ondurationchange
	onemptied
	onended
	onerror*
	onfocus*
	oninput
	oninvalid
	onkeydown
	onkeypress
	onkeyup
	onload*
	onloadeddata
	onloadedmetadata
	onloadend
	onloadstart
	onmousedown
	onmouseenter
	onmouseleave
	onmousemove
	onmouseout
	onmouseover
	onmouseup
	onwheel
	onpause
	onplay
	onplaying
	onprogress
	onratechange
	onreset
	onresize*
	onscroll*
	onseeked
	onseeking
	onselect
	onshow
	onstalled
	onsubmit
	onsuspend
	ontimeupdate
	ontoggle
	onvolumechange
	onwaiting

元素的API:

	element.dataset
	element.innerText[=value]

### 元素列表

## CSS

[w3c: Cascading Style Sheets][10]上定期发布[CSS][11]的标准。

## SASS

[sass][13]

## JavaScript

[What’s the difference between JavaScript and ECMAScript?][12]

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
10. [w3c: Cascading Style Sheets][10]
11. [CSS Snapshot 2017][11]
12. [What’s the difference between JavaScript and ECMAScript?][12]
13. [sass][13]


[1]: https://en.wikipedia.org/wiki/HTML  "wikipedia: HTML" 
[2]: https://tools.ietf.org/html/rfc1866 " Hypertext Markup Language - 2.0"
[3]: https://www.w3.org/ "w3c"
[4]: https://www.w3.org/TR/2017/REC-html52-20171214/ "HTML 5.2"
[5]: https://github.com/w3c/html "github: w3c's html"
[6]: https://whatwg.org/ "whatwg"
[7]: https://html.spec.whatwg.org/ "whatwg: html Living Standard"
[8]: https://whatwg-cn.github.io/html/ "whatwg: html Living Standard(中文版)`"
[9]: https://github.com/whatwg/html "github: whatwg's html"
[10]: https://www.w3.org/Style/CSS/Overview.en.html  "w3c: Cascading Style Sheets"
[11]: https://www.w3.org/TR/css-2017/ "CSS Snapshot 2017"
[12]: https://medium.freecodecamp.org/whats-the-difference-between-javascript-and-ecmascript-cba48c73a2b5 "What’s the difference between JavaScript and ECMAScript?"
[13]: http://sass-lang.com/  "sass"
