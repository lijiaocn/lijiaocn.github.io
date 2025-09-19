---
layout: default
title: "用js实现一些不需要服务端的纯网页版工具"
author: 李佶澳
createdate: "2018-09-12 15:13:01 +0800"
last_modified_at: "2018-09-12 15:13:01 +0800"
categories: 技巧
tags: 前端
keywords: javascript,前端
description:
---

* auto-gen TOC:
{:toc}

## 说明

## Json编辑器

[github: jsoneditor][2]是一个实现了json字符串处理功能的js代码库，使用它可以很快的作出一个网页版的json编辑器，例如: [json editor online][3]。

使用方法可以参考：[自己写JSON编辑器][1]，以及：[json editor examples][4]。

jsoneditor的使用比较简单，引入css和js文件：

	<link href="https://cdn.bootcss.com/jsoneditor/5.13.1/jsoneditor.min.css" rel="stylesheet">
	...
	<script src="https://cdn.bootcss.com/jsoneditor/5.13.1/jsoneditor.min.js"></script>

然后在body中定义:

	<div id="jsoneditor" style="width: 400px; height: 400px;"></div>

## Json、Yaml互转

[json2yaml online][5]是一个json、yaml互相转换的应用，但它的转换过程是在服务端完成的。[json-to-yaml online][6]是在浏览器端实现的。

可以使用代码库：

[JS-YAML - YAML 1.2 parser / writer for JavaScript][10]

[npmjs: json2yaml][9]

## Javascript、Html代码格式化

[Online JavaScript Beautifier][7]是一个在线的js、html代码格式化应用，使用[js-beautify][8]实现。

## 内容比对

[自己写代码对比工具][11]中用[mergely][12]实现的，效果如下[merge editor online][13]。

## 时间转换

## 进制转换

## 参考

1. [自己写JSON编辑器][1]
2. [github: jsoneditor][2]
3. [json editor online][3]
4. [json editor examples][4]
5. [json2yaml online][5]
6. [json-to-yaml online][6]
7. [Online JavaScript Beautifier][7]
8. [js-beautify][8]
9. [npmjs: json2yaml][9]
10. [JS-YAML - YAML 1.2 parser / writer for JavaScript][10]
11. [自己写代码对比工具][11]
12. [mergely][12]
13. [merge editor online][13]

[1]: https://my.oschina.net/jojo76/blog/1607734 "自己写JSON编辑器"
[2]: https://github.com/josdejong/jsoneditor "https://github.com/josdejong/jsoneditor"
[3]: http://jsoneditoronline.org/ "json editor online"
[4]: https://github.com/josdejong/jsoneditor/tree/master/examples "json editor examples"
[5]: https://www.json2yaml.com/ "json2yaml online"
[6]: https://jsonformatter.org/json-to-yaml "json-to-yaml online"
[7]: https://beautifier.io/ "Online JavaScript Beautifier"
[8]: https://github.com/beautify-web/js-beautify "js-beautify"
[9]: https://www.npmjs.com/package/json2yaml "npmjs: json2yaml"
[10]: https://github.com/nodeca/js-yaml "JS-YAML - YAML 1.2 parser / writer for JavaScript"
[11]: https://my.oschina.net/jojo76/blog/1609851 "自己写代码对比工具"
[12]: http://www.mergely.com/ "mergely"
[13]: http://www.mergely.com/editor "merge editor online"
