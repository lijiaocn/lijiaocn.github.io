---
layout: default
title: "ios以及safari中的pre标签设置overflow后，不显示水平滚动条"
author: 李佶澳
createdate: 2017/09/04 23:01:31
changedate: 2017/09/04 23:23:50
categories: 问题
tags: 前端
keywords: scroll-x, safari, ios
description: "ios和safari中，为`pre标签`设置了overflow:auto，没有产生水平滚动条"

---

* auto-gen TOC:
{:toc}

## 现象 

ios和safari中，为`pre标签`设置了overflow:auto，标签中的内容折叠换行了，而不是产生水平滚动条。

设置的属性如下：

	div.center pre{
		font-family: Inconsolata, Consolas, "DEJA VU SANS MONO", "DROID SANS MONO", Proggy, monospace;
		font-size: 90%;
		border: solid 1px lightgrey;
		background-color: rgba(185, 239, 66, 0.3);
		padding: 5px;
		line-height: 1.3;
		overflow: auto;
	}

在firefox、chrome中，当pre标签中的内容超过水平宽度的时候，可以显示水平滚动条，在safari以及ios上不显示。

## 解决

使用google搜索`safari overflow-x not work scroll`得到结果中，即使是stackoverflow中给出的各种解决方法，也都不起作用。

后来发现stackoverflow页面中的pre在safari中是可以水平滚动，用开发者工具查看对应的样式，发现只需要添加一个属性即可:

	word-wrap: normal;

你现在看到的这个页面中的pre，在ios上就可以水平滚动:

	div.center pre{
		font-family: Inconsolata, Consolas, "DEJA VU SANS MONO", "DROID SANS MONO", Proggy, monospace;
		font-size: 90%;
		border: solid 1px lightgrey;
		background-color: rgba(185, 239, 66, 0.3);
		padding: 5px;
		line-height: 1.3;
		word-wrap: normal;
		overflow: auto;
	}
