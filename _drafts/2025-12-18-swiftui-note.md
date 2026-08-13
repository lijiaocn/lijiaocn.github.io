---
layout: default
title: "独立赚钱笔记：SwiftUI 文档浏览笔记"
author: 李佶澳
categories: [solo-income]
tags: [独立赚钱日记]
keywords: 
description: 如果完全不了解相应技术，全部交付给 AI 完成，最终耗费的时间可能会更多。磨刀不误砍柴工，把相关的技术文档通读一遍有了充分认识之后，再指挥 AI 干活可能才会真正提高效率。
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

最近用 AI 成功做成了一个 ios 应用。app 的基本功能都实现了，但是有一些细节布局一直不理想。
比如想要实现类似 x 首页信息流的交互效果，反复和 AI 沟通，耗费了很多时间依然没有实现。
如果完全不了解相应技术，全部交付给 AI 完成，最终耗费的时间可能会更多。
磨刀不误砍柴工，把相关的技术文档通读一遍有了充分认识之后，再指挥 AI 干活可能才会真正提高效率。

这里是通读 SwiftUI 技术文档时做的笔记。

## 名词

scene: 窗口

interface: 在 swiftui 语境中，这个单词显然是界面的意思

modifier: 在 view 上添加的修饰符

animation: 动画

inline closure: 直接在 view 定义的时候写上处理代码（不需要单独定义一个函数）

gesture: 手势

## swiftUI 基本概念

### app/scene/view

* App: 应用入口
* Scene: 一个 scene 是一个窗口
* View: 在 scene 中使用的各种可视元素

### data-driven changes 

数据驱动界面变化，属性定义时使用的 wrapper 定义了数据和界面的关系

* @State: view 本地变量数值变化时界面自动更新
* @Bindable: 可以被另一个 view 用 @Binding 引用的本地变量
* @Binding: 绑定另一个 view 的 @Bindable 变量
* @StateObject: 本地创建的 object ，可以传递给其他 view 使用
* @ObservedObject: 监听其他 view 中的 @StateObject 
* @EnvironmentObject: 本地变量，指向 view environment 中的一个数值

### 事件处理

* 在定义 view 的时候直接用 inline closure 方式编写相应的事件处理代码
* 手势响应通过在 view 上添加对应的 modifier 来实现, modifier 里编写处理代码

支持的其他事件：

* cut/copy/paste
* drag and drop
* focus 相关
* system event,

### swiftui 其它特性

* visionOS 中可以创建 immersive space （沉浸式空间）
* canvas 支持绘图
* swiftui 和 UIKit 可以互相嵌套使用
* 可以集成其它 system frameworks 中定义的 view 

## layout

[Laying Out Views][4] 是一个在线的代码示例教程，介绍了 swiftui 中的布局概念。[Laying out a simple view][7] 则是更详细的说明。

这里面关键的一点的各层级的 view 需要的空间计算。
* 上层 view 向内部的 view 提议一个空间大小
* 内部 view 根据自己的内容和需求决定实际占用的空间大小，然后再向上层 view 报告实际占用的空间大小。
* 上层 view 根据内部 view 报告的实际占用空间大小来调整自己的布局，完成渲染

这里关键的就是 view 怎么决定自己的实际占用空间大小：

* 一类是占据所有可用空间：比如 Circle()、Rectangle() 等 shape view（还有其它类型）
* 一类是根据内容占据相应空间：比如 Text()、Image() 等
* 一类是占用固定的理想空间：比如 Togger()

.frame modifier 可以用来调整 view 的实际占用空间大小，它会新建一个固定大小的 view 继而改变传入给子 view 的可用空间大小。

## views

* container view: 用于包裹其它 view
* shape view: 位于 container view 中，默认扩充填满 container view 中的所有空间
* vstack/hstack/zstack 中的 view 分别是是垂直、水平、叠加分布。

### container views

container view 有多种：[Picking container views for your content][5]

* .alignment: 调整 container view 中 view 的对齐方式，支持 .leading/.trailing/.top/.bottom/
* .frame modifier 中也可以设置 alignment
.spacing: 用于设置 container view 中子 view 之间的间距
.padding(.trailing,20) 用于设置 container view 边缘和内部 view 的间距, 可以用 .leading/.top/.bottom/.horizontal 分别指定不同边缘

Spacer() 用于自动占据所有剩余可用空间

### 非 container views

有的 view 默认扩充填满所在的 container view ，比如 Rectangle() 等 shape vie。有的 view 根据其中等内容占据相应空间，比如 text 和 image view。

* frame(width:height:alignment:) 可以调整 view 占用的空间。

在 image view 上使用 frame 影响的是展示出来的图片区域大小，如果要让图片自动适应，需要先用 .resizable()。
因为 .frame 实际是创建一个新的 view ，因此 .resizable() 要在 .frame 之前使用。

### 调试方法

* 在 view 上添加 .border(Color.red) 可以看到 view 的边框
* 注意每次使用 .frame modifier 实际都是在创建了一个新的 view ，所以在 .frame 前和后都可以加 border


## 参考

1. [李佶澳的博客][1]
2. [SwiftUI Pathway][2]
3. [SwiftUI apps][3]
4. [Laying Out Views][4]
5. [Picking container views for your content][5]
6. [swiftui documentation][6]
7. [Laying out a simple view][7]


[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developer.apple.com/cn/swiftui/get-started/ "SwiftUI Pathway"
[3]: https://developer.apple.com/documentation/technologyoverviews/swiftui "SwiftUI apps"
[4]: https://developer.apple.com/tutorials/sample-apps/layingoutviews/ "Laying Out Views"
[5]: https://developer.apple.com/documentation/SwiftUI/Picking-Container-Views-for-Your-Content "Picking container views for your content"
[6]: https://developer.apple.com/documentation/swiftui "swiftui documentation"
[7]: https://developer.apple.com/documentation/swiftui/laying-out-a-simple-view "Laying out a simple view"