---
createtime: "2024-12-19 13:20:04 +0800"
last_modified_at: "2024-12-27 14:58:37 +0800"
categories: "编程"
title: 微信小程序开发笔记
tags:
keywords:
description: 微信小程序从零开始过程中记录的一些笔记，主要是各种解决方法的索引，比如怎样使用微信风格的UI等
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

### 使用微信风格的组件 weui

由微信官方设计团队和小程序团队为微信小程序量身设计了一套组件库：[wechat-miniprogram/weui][2]。

在小程序的 app.json 中添加下面的配置即可使用，并且这种方式不占用小程序的包体积：

```json
{
  "useExtendedLib": {
    "weui": true
  }
}
```

* 支持的 [icon][100]

### 使用 less 

用 less 写样式要比直接写 css 方便太多了，less 支持的特性：[less][3] 。

如果项目创建的时候没有选择 less，可以修改项目的 project.config.json，在 setting 中添加下面的配置。参考 [原生支持 TypeScript和Less][101]。

```json
    "useCompilerPlugins": [
      "less"
    ]
```

## wx.getWindowInfo() 返回数值说明

[wx.getWindowInfo()][10] 文档对返回数值的说明太简陋了，经过试验得知具体参数含义如下。

微信小程序的页面上的导航栏可以自定义，在页面的.json文件中添加 "navigationStyle": "custom" 即可。

```json
{
  "navigationStyle": "custom"
}
```

是否使用自定义导航栏，会影响 wx.getWindowInfo() 返回的部分数值。

不受导航栏类型影响的返回值，其中 safeArea 只有物理屏幕时异形屏幕时才有数值：

**safeArea.top**：从物理屏幕上边缘到物理屏幕非异形部分之前的高度。

**screenTop**：物理屏幕上边沿到导航栏底部的高度（包括小程序的默认导航栏）。（文档里说这个数值是窗口上边缘的y值，介绍的真够含糊...）

**safeArea.bottom**：从物理屏幕上边缘到物理屏幕底部异形部分之前的高度。

**screenHeight**：物理屏幕最上边沿到物理屏幕最下边缘的高度。

下面的页面代码

```html

<view style="height:{{windowInfo.screenHeight}}px;background-color:green">
  <view style="height:{{windowInfo.safeArea.bottom}}px;background-color: blue;">
    <view style="height:{{windowInfo.screenTop}}px;background-color:yellow">
      <view style="height:{{windowInfo.safeArea.top}}px;background-color: red;">
      </view>
    </view>
  </view>
</view>
```

![页面效果]({{ site.article }}/screen.jpg){:style="width:30%;"}


受导航栏类型影响的返回值：

**windowHeight**：如果使用小程序默认的导航栏，数值等于 screenHeight-screenTop，即从导航栏下边沿到物理屏幕下边沿的区域。如果使用自定义导航栏，等于 screenHeight，即整个物理屏幕的高度。

## 参考

1. [李佶澳的博客][1]
2. [wechat-miniprogram/weui][2]
3. [less][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://wechat-miniprogram.github.io/weui/docs/ "wechat-miniprogram/weui"
[3]: https://lesscss.org/#overview "less"
[100]: https://wechat-miniprogram.github.io/weui/docs/icon.html#%E4%BB%A3%E7%A0%81%E5%BC%95%E5%85%A5 "icon"
[101]: https://developers.weixin.qq.com/miniprogram/dev/devtools/compilets.html "原生支持 TypeScript和Less"
[102]: https://developers.weixin.qq.com/miniprogram/dev/api/base/system/wx.getWindowInfo.html "Object wx.getWindowInfo()"
