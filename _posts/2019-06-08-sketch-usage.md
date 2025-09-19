---
layout: default
title: "矢量绘图工具 Sketch 的基本用法"
author: 李佶澳
createdate: "2019-06-08T14:25:07+0800"
last_modified_at: "2019-06-09T16:53:51+0800"
categories: 方法
tags: sketch
cover:
keywords: sketch,矢量工具,产品设计
description: Sketch是一个矢量绘图工具，可以用来做产品设计，比 PhotoShop 轻巧很多，组件复用等功能都支持
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

[Sketch](https://www.sketch.com/pricing/) 是一个矢量绘图工具，可以用来做设计，比 PhotoShop 轻巧很多。

## 安装 

```sh
brew cask install Sketch
```

## 工作面板

画布 Canvas 是矢量的，可以无限放大。

右侧面板是属性设置，面板底部的 Export 进行导出设置。

左侧面板是多个页面，以及页面上图层，最底部可以过滤要显示的类型。

## 绘制区域

[Page](https://www.sketch.com/docs/grouping/pages/) 是独立的画板，一个 Sketch 文档可以包含多个 Page。

[Artboards](https://www.sketch.com/docs/grouping/artboards/) 是画板上的一块固定大小的区域，可以用来模仿指定大小的屏幕，插入方式 Insert->Artboard。
Artboard 在左侧面板中的图标是一个竖立画板：

![Artboard]({{ site.imglocal }}/article/sketch-1-artboard.png)

## 复用功能

在同一个文档中、以及跨文档复用已经做好的组件。

### 复用 Symbol

[Symbol](https://www.sketch.com/docs/symbols/) 是可以在 Page 、 Artboard 中复用组件。

创建 Symbol：选中已经绘制好的图形，点击面板上方的 "Create Symbol"，就以选中的图形为模版创建了一个 Symbol，之后可以通过 Instert->Symbol 插入 Symbol 的 instance。

Symbol 的母版修改后，所有的 instance 随之修改，可以单独设置每个 instance 属性，覆盖母版的设置。

Symbol 可以嵌套。

下面的 youtube 视频介绍很详细，观看需要翻Q：

<iframe width="100%" height="414" src="https://www.youtube.com/embed/3fcIp5OXtVE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

### 复用 Style

[Layer Style](https://www.sketch.com/docs/styling/shared-styles/) 的目的是让不同的 Page、图层使用相同的设置，在右侧面板的 APPERANCE 选择框中选择。

Style 的创建方法：选中图层后，通过 Layer -> Create new Layer Style 创建。

### 跨文档复用

把已经创建的 sketch 文档加入 Library 后，可以在其它文档中使用其中的组件。

添加方法：Preferences -> Libraries，Add Library，选中要加入 Library 的 sketch 文档。

然后就可以通过 Insert 插入 [Library Symbols](https://www.sketch.com/docs/libraries/library-symbols)，即其它文件中的 Symbols、[Library Styles](https://www.sketch.com/docs/libraries/library-styles) 等。

## 图层操作 

插入一个形状，即插入一个图层，在左侧面板中选择图层，设置图层是否可见，见 [Layer Basics](https://www.sketch.com/docs/layer-basics/)。

## 形状操作

[Shapes](https://www.sketch.com/docs/shapes/) 是最常用的组件。

### 图层掩盖 - Mask

Mask 用于遮挡其它图层。

任意一个形状都可以被转换成一个 Mask，选中形状后，选择 Layer -> Mask -> Use as Mask 即可。

### 形状组合 - Combined Shapes

将多个形状堆叠到一起后，点击面板上方的 Union、Substrac、Intersect、Difference，创建新的形状。

[Boolean Operations](https://www.sketch.com/docs/shapes/boolean-operations/)

### 形状剪切 - Scissors

[Scissors](https://www.sketch.com/docs/shapes/scissors/) 可以将形状的一部分剪掉。

使用：Layer -> Path -> Scissors。

## 矢量编辑

Insert 中的 [Vector Tool](https://www.sketch.com/docs/vector-editing/vector-tool)，钢笔形状的工具，用来绘制矢量图形，画笔有 Staight、Mirrored、Disconnected、Asymmetric 四种。

## 原型制作

Sketch 支持[原型制作](https://www.sketch.com/docs/prototyping/)，可以在 ArtBoard 直接添加 Link、Hostspots 等。

## 其它

其它功能比较直观，见 [Sketch Documentation][2]。

## 参考

1. [Sketch][1]
2. [Sketch Documentation][2]

[1]: https://www.sketch.com/ "Sketch"
[2]: https://www.sketch.com/docs/ "Sketch Documentation"
