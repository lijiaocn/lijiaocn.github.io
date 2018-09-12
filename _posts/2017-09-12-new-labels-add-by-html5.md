---
layout: default
title: "HTML5引进的新的html元素"
author: 李佶澳
createdate: "2018-09-12 12:22:07 +0800"
changedate: "2018-09-12 12:22:07 +0800"
categories: 编程
tags: 前端
keywords: html5,html标签,新标签
description: html5引进了新的html元素，改进了互操作性，并减少了开发成本，这里粗略汇总一下

---

* auto-gen TOC:
{:toc}

## 说明

[html5][1]引进了新的html元素，改进了互操作性，并减少了开发成本，这里粗略汇总一下。

## 新元素

	<article>  用于定义独立的内容，比如论坛的帖子、用户评论。
	<aside>    所处内容之外的内容，例如文章的侧边栏
	<audio>    音频内容
	<bdi>      脱离父元素的的文本方向设置
	<canvas>   图形容器
	<command>  命令按钮，位于<menu>中才可见
	<datalist> 用在input中，记录可能的输入值
	<details>  展开或者收起详细内容，在其中用<summary>定义标题
	<summary>  标签包含 details 元素的标题
	<embed>    嵌入其它文件 
	<figure>   独立的流内容图像、图表、照片、代码等等
	<figcaption> figure中的标题，"figcaption" 元素应该被置于 "figure" 元素的第一个或最后一个子元素的位置。
	<footer>     标签定义 section 或 document 的页脚。
	             假如您使用 footer 来插入联系信息，应该在 footer 元素内使用 <address> 元素。
	<header>     标签定义文档的页眉（介绍信息）
	<hgroup>     标签用于对网页或区段（section）的标题进行组合。
	<keygen>     标签规定用于表单的密钥对生成器字段。
	<mark>       标签定义带有记号的文本。
	<meter>      标签定义度量衡，占比等。
	<nav>        标签定义导航链接的部分
	<output>     标签定义不同类型的输出，比如脚本的输出。
	<progress>   标签定义运行中的进度（进程）。
	<rp>         标签在 ruby 注释中使用，以定义不支持 ruby 元素的浏览器所显示的内容。
	<rt>         标签定义字符（中文注音或字符）的解释或发音。
	<ruby>       标签定义 ruby 注释（中文注音或字符）。
	             在东亚使用，显示的是东亚字符的发音。
	<section>    标签定义文档中的节（section、区段）。比如章节、页眉、页脚或文档中的其他部分。
	<source>     标签为媒介元素（比如 <video> 和 <audio>）定义媒介资源。
	<time>       标签定义公历的时间（24 小时制）或日期，时间和时区偏移是可选的。
	<track>      标签为诸如 video 元素之类的媒介规定外部文本轨道。
	<video>      标签定义视频，比如电影片段或其他视频流。

html5之前就有的部分有特殊效果的标签：

	<sub> <sup>  下标、上标文本
	<small>      行内文本缩小
	<menu>       定义菜单列表。
	<map>        定义图像映射，图片上的点击。
	<fieldset>   定义 fieldset。
	<legend>     定义 fieldset 中的标题。
	<iframe>     定义行内的子窗口（框架）。
	<col>        定义表格列的属性。
	<colgroup>   定义表格列的分组。
	<caption>    定义表格标题。
	<bdo>        定义文本显示的方向。
	<base>       定义页面中所有链接的基准 URL。

## HTML 5 标准属性

摘录自[HTML 5 标准属性][2]

html5新增属性：

	contenteditable: 规定是否允许用户编辑内容。
	contextmenu:     规定元素的上下文菜单。
	data-yourvalue:  创作者定义的属性。
	draggable:       规定是否允许用户拖动元素。
	hidden:          规定该元素是无关的。被隐藏的元素不会显示。
	item:            用于组合元素。
	itemprop:        用于组合项目。
	spellcheck:      规定是否必须对元素进行拼写或语法检查。
	subject:         规定元素对应的项目。

html5之前就有的：

	accesskey: 规定访问元素的键盘快捷键
	class:     规定元素的类名（用于规定样式表中的类）。
	dir:       规定元素中内容的文本方向。
	id:        规定元素的唯一 ID。
	tabindex:  规定元素的 tab 键控制次序。
	title:     规定有关元素的额外信息。

## HTML 5 事件属性

[HTML 5 事件属性][3]。

## 参考

1. [HTML 5 参考手册][1]
2. [HTML 5 标准属性][2]
3. [HTML 5 事件属性][3]

[1]: http://www.w3school.com.cn/html5/html5_reference.asp "HTML 5 参考手册"
[2]: http://www.w3school.com.cn/html5/html5_ref_standardattributes.asp "HTML 5 标准属性"
[3]: http://www.w3school.com.cn/html5/html5_ref_eventattributes.asp "HTML 5 事件属性"
