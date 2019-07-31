---
layout: default
title: "WEB页面SEO优化：HTML5编码规范与重要的标签属性"
author: 李佶澳
createdate: "2019-05-04 17:21:33 +0800"
last_modified_at: "2019-05-04 21:53:51 +0800"
categories: 技巧
tags: SEO
cover:
keywords: SEO,HTML优化,标签优化,搜索引擎兼容
description: HTML的一些标签属性必须要设置，否则浏览器多次渲染网页呈现慢，搜索引擎爬虫的工作量增加
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

HTML的标签属性是必须要设置的，如果没有设置会导致浏览器多次渲染，降低网页的呈现速度，同时会增加搜索引擎爬虫的工作量。

## HTML5编码风格约定

[HTML5 Style Guide and Coding Conventions][1] 中对html5的编码风格做了统一约定，尽量按照这个约定编码。

### 必须包含的内容

在第一行声明文档类型：

```html
<!DOCTYPE html>
```

不要省略html、body和head标签，即使html5支持省略这这些标签。 

一定要在html标签中设置lang属性，明确文档编码：

```html
<!DOCTYPE html>
<html lang="en-US">
```

语言和字符编码一定在最靠前的位置设置：

```html
<!DOCTYPE html>
<html lang="en-US">
<head>
  <meta charset="UTF-8">
  <title>HTML5 Syntax and Coding Style</title>
</head>
```

一定要设置title：

<title>HTML5 Syntax and Coding Style</title>

一定要设置viewport，viewport是用户可见的页面区域：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### 文件约定

文件名全部使用小写字母！（apache是区分大小的，iis不区分）

html文件扩展名为`.html`或者`.htm`，.htm是因为早期的dos系统限制扩展名只能有3个字符，现在建议使用.html。

css文件扩展名为`.css`。

js文件扩展名为`.js`。

如果url中没有指定文件名称，默认文件是index.html、index.htm、default.html、default.htm。

### 编码规范

标签名全部使用小写字母，虽然html支持大小写混合，但是建议全部用小写： 

```html
<section>
  <p>This is a paragraph.</p>
</section>
```

所有的标签都要闭合，即使有些标签不闭合也能使用：

```html
<section>
  <p>This is a paragraph.</p>
  <p>This is a paragraph.</p>
</section>
```

即使是空的标签，也要闭合：

```html
<meta charset="utf-8" />
```

标签的属性名，全部用小写：

```html
<div class="menu">
```

标签的属性值要加上双引号：

```html
<table class="striped">
```

img标签必须要设置alt属性：

```html
<img src="html5.gif" alt="HTML5" style="width:128px;height:128px">
```

标签赋值的等号前后不要有空格：

```html
<link rel="stylesheet" href="styles.css">
```

适当添加空行，不添加不必要的空行和缩进，缩进使用两个空格，不使用tab：

```html
<body>

<h1>Famous Cities</h1>

<h2>Tokyo</h2>
<p>Tokyo is the capital of Japan, the center of the Greater Tokyo Area,
and the most populous metropolitan area in the world.
It is the seat of the Japanese government and the Imperial Palace,
and the home of the Japanese Imperial Family.</p>

</body>
```

单行注释的写法：

```html
<!-- This is a comment -->
```

多行注释的写法：

```html
<!-- 
  This is a long comment example. This is a long comment example.
  This is a long comment example. This is a long comment example.
-->
```

样式表的导入方法，type属性不是必须的：

```html
<link rel="stylesheet" href="styles.css">
```

js文件的导入方法，type属性不是必须的：

```html
<script src="myscript.js">
```

## HTML5带来的变化

HTML5删除了一些老特性，同时增加了一些新特性，被删除的特性不要再使用，新特性谨慎使用，防止旧的浏览器不兼容。

### 不再支持的标签

下面这些标签html5不支持了，不要再用：

```
Removed Element          Use Instead
<acronym>                 <abbr>
<applet>                  <object>
<basefont>                CSS
<big>                     CSS
<center>                  CSS
<dir>                     <ul>
<font>                    CSS
<frame>           
<frameset>           
<noframes>           
<strike>                  CSS, <s>, or <del>
<tt>                      CSS
```


### 谨慎使用新特性

Internet Explorer 8以及以前的版本不支持自定义标签，自定义标签用法如下：

```html
<!DOCTYPE html>
<html>
<head>
<script>document.createElement("myHero")</script>
<style>
myHero {
  display: block;
  background-color: #dddddd;
  padding: 50px;
  font-size: 30px;
} 
</style> 
</head>
<body>

<h1>A Heading</h1>
<myHero>My Hero Element</myHero>

</body>
</html>
```

### 增加的新标签

数量比较多，不列出来了，见：[HTML5 New Elements][3]。

使用HTML5的新标签进行布局：

![html5 layout]({{ site.imglocal }}/article/html5_layout.gif)

## 主要标签的重要属性

有一些属性是全局属性，所有的标签都支持，见[HTML Global Attributes][4]。其中比较关键的有：

**lang**：指定标签内容使用的语言，[ISO 639-1 Language Codes][5]中给出了每种语言的编码，中文为zh、zh-Hans（中文简体）、zh-Hant（中文繁体）。

### html标签

html标签没有独有的属性，只有全部的全局属性，一定要设置html标签的lang属性。

### meta标签

meta标签用来设置元数据，独有的属性有：

	charset：指定字符集，html5新增属性
	name:    要设置的元数据名称，常用的有：description、keywords、author、viewport
	content: 为元数据设置的内容
	http-equiv: Provides an HTTP header for the information/value of the content attribute
	scheme:  html5不再支持

```html
<head>
  <meta charset="UTF-8">
  <meta name="description" content="Free Web tutorials">
  <meta name="keywords" content="HTML,CSS,XML,JavaScript">
  <meta name="author" content="John Doe">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
```

### link标签

[link](https://www.w3schools.com/tags/tag_link.asp)的标签的rel属性指定导入的文档与当前文档的关系，支持的关系有：

```
alternate
author
dns-prefetch
help
icon
license
next
pingback
preconnect
prefetch
preload
prerender
prev
search
stylesheet
```

### script标签

[script](https://www.w3schools.com/tags/tag_script.asp)导入js代码，其中指定js运行时间的属性比较重要。

async： html5新支持属性，引入的外部脚本异步执行。

defer：引入的脚本在整个网页解析完成后再执行。

## 参考

1. [HTML5 Style Guide and Coding Conventions][1]
2. [HTML5 Introduction][2]
3. [HTML5 New Elements][3]
4. [HTML Global Attributes][4]
5. [ISO 639-1 Language Codes][5]

[1]: https://www.w3schools.com/html/html5_syntax.asp "HTML5 Style Guide and Coding Conventions"
[2]: https://www.w3schools.com/html/html5_intro.asp "HTML5 Introduction"
[3]: https://www.w3schools.com/html/html5_new_elements.asp "HTML5 New Elements"
[4]: https://www.w3schools.com/tags/ref_standardattributes.asp "HTML Global Attributes"
[5]: https://www.w3schools.com/tags/ref_language_codes.asp "ISO 639-1 Language Codes"
