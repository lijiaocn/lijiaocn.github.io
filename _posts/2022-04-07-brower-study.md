---
layout: default
title: "浏览器的能力和行为学习，通用的 WebAPIs"
author: 李佶澳
date: "2022-04-07 17:44:19 +0800"
last_modified_at: "2023-06-21 16:48:31 +0800"
categories: 编程
cover:
tags: web
keywords: webapi,浏览器
description: Web 开发技术提供大量 Web 相关知识，如果想了解某个浏览器特有的api，查看浏览器手册
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

[Web 开发技术][2]提供大量 Web 相关知识，譬如通用的 [Web APIs][2]。如果想了解某个浏览器特有的 api，查看浏览器手册，譬如 [Chrome APIs][4]。

## Window 的属性、方法与事件

window 是一个全局变量，将脚本正在运行的窗口暴露给 js 代码。

window 中有有较多的事件，譬如：

[DOMContentLoaded](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/DOMContentLoaded_event)：HTML文档被完全加载和解析完成后触发，不等待样式表、图像和子框架的加载。

[load](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/load_event)：HTML文档以及依赖的资源（样式表/图片等）全部加载完成后触发。

事件监听：

```js
window.addEventListener('load', (event) => {
  console.log('page is fully loaded');
});
```

## 参考

1. [李佶澳的博客][1]
2. [Web 开发技术][2]
3. [Web APIs][3]
4. [Chrome APIs][4]
5. [Web API: Window][5]


[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developer.mozilla.org/zh-CN/docs/Web "Web 开发技术"
[3]: https://developer.mozilla.org/zh-CN/docs/Web/API "Web APIs"
[4]: https://developer.chrome.com/docs/extensions/api_other/ "Chrome APIs"
[5]: https://developer.mozilla.org/zh-CN/docs/Web/API/Window "Web API: Window"
