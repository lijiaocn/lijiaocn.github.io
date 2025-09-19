---
layout: default
title: 零碎的前端知识
author: 李佶澳
createdate: 2018/05/22 13:31:00
last_modified_at: 2018/06/06 13:37:28
categories: 编程
tags: web
keywords: 前端知识
description: 没有系统学习过前端开发，这里都是道听途说的一些内容。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

没有系统学习过前端开发，这里都是道听途说的一些内容。

## 布局

### Flex布局

[Flex 布局教程：语法篇][1]： 布局的首选方案，已经得到所有浏览器支持。

建议直接使用上面连接中讲解的内容，讲解的非常细致，下面只是我的笔记，方便自己查阅。

Flex容器的六个属性：

	flex-direction:   主轴的排列方向，row、row-reverse、column、column-reverse
	flex-wrap:        换行方案，nowrap、wrap、wrap-reverse
	flex-flow:        flex-direction属性和flex-wrap属性的简写形式，默认值为row nowrap
	justify-content:  主轴对齐方式，flex-start、flex-end、center、space-between、space-around
	align-items:      交叉轴对其方式，flex-start、flex-end、center、baseline、stretch
	align-content:    多轴对齐方式，flex-start、flex-end、center、space-between、space-around、stretch

Flex容器中的项目的属性：

	order:       项目的排列顺序。数值越小，排列越靠前，默认为0
	flex-grow:   项目的放大比例，默认为0，如果存在剩余空间，也不放大
	             如果所有项目的flex-grow属性都为1，则它们将等分剩余空间（如果有的话）
	             如果一个项目的flex-grow属性为2，其他项目都为1，
	             则前者占据的剩余空间将比其他项多一倍
	flex-shrink: 项目的缩小比例，默认为1，即如果空间不足，该项目将缩小
	flex-basis:  分配多余空间之前，项目占据的主轴空间
	             默认值为auto，即项目的本来大小
	flex:        flex-grow, flex-shrink 和 flex-basis的简写，默认值为0 1 auto
	align-self:  允许单个项目有与其他项目不一样的对齐方式，可覆盖align-items属性
	             auto | flex-start | flex-end | center | baseline | stretch;

## 参考

1. [Flex 布局教程：语法篇][1]

[1]: http://www.ruanyifeng.com/blog/2015/07/flex-grammar.html  "Flex 布局教程：语法篇"
