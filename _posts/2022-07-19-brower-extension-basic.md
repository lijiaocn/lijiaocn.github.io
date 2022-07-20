---
layout: default
title: "Chrome/Edge/Safari/Firefox/Opera浏览器扩展插件的开发过程概览"
author: 李佶澳
date: "2022-07-19 18:40:28 +0800"
last_modified_at: "2022-07-20 16:43:37 +0800"
categories: 编码
cover:
tags: 浏览器
keywords: 浏览器插件,chrome插件,插件开发
description: 执行 Chrome Extensions Getting Started 中的例子，感受下 chrome extension 的实现过程
---

## 目录

* auto-gen TOC:
{:toc}

## 浏览器市场份额

[Top Browsers Market Share][2] 给出了主流浏览器的市场份额，桌面的和移动端的份额分布差距挺大，下面是 2022年6月份数据（不包含中国）：。


```
2022年6月份数据（不包含中国）：

Desktop: Chrome 64.86%,  Edge   12.57%,   Safari  9.71%,  Firefox 6.97%,  Opera     1.94%,  Other 3.95%
Mobile:  Chrome 48.80%,  Safari 41.84%,   Samsung 5.68%,  Opera   1.47%,  Firefox   0.65%,  Other 1.57%
Tablet:  Chrome 52.44%,  Safari 33.77%,   Samsung 3.48%,  Opear   1.08%,  YaBrowser 1.00%,  Other 8.24%
```

## Chrome 浏览器插件开发概览

执行 [Chrome Extensions Getting Started][3] 中的例子，感受下 chrome extension 的实现过程。

建立一个空目录来存放插件的代码文件。

创建顶层文件 manifest.json，该文件是插件的入口文件，索引了插件的运行代码、权限、资源等。

```js
{
  "name": "Getting Started Example",
  "description": "Build an Extension!",
  "version": "1.0",
  "manifest_version": 3,
  "background": {  
    "service_worker": "background.js"     // 插件加载后执行的后台脚本
  },
  "permissions": [
    "storage","activeTab","scripting"     // 插件需要的权限
  ],
  "action": {
    "default_popup": "popup.html",        // 在工具栏点击插件图标出现的弹窗
    "default_icon": {
      "16": "/images/get_started16.png",  // 插件的显示图标
      "32": "/images/get_started32.png",
      "48": "/images/get_started48.png",
      "128": "/images/get_started128.png"
    }
  },
  "icons": {
    "16": "/images/get_started16.png",    // 插件的显示图标
    "32": "/images/get_started32.png",
    "48": "/images/get_started48.png",
    "128": "/images/get_started128.png"
  },
  "options_page": "options.html"          // 右击插件图标后点击「选项」弹出的插件配置页面
}
```

background 中 service_worker 代码的运行日志，点击插件中的视图链接查看（开发模式下会显示重新加载图标）：

![backgroud运行日志]({{ site.article }}/chrome-ext-1.png)


插件代码有错误，或者未正确配置权限时，会出现「错误」日志：

![插件运行错误日志]({{ site.article }}/chrome-ext-2.png)


如果插件权限配置错误也会报错，例如下面的错误是没有在 "permissions" 中添加 "scripting" 导致的：

Uncaught (in promise) TypeError: Cannot read properties of undefined (reading 'executeScript')

![插件运行错误日志]({{ site.article }}/chrome-ext-3.png)


## 参考

1. [李佶澳的博客][1]
2. [Top Browsers Market Share][2]
3. [Chrome Extensions Getting Started][3]
4. [Microsoft Edge extensions][4]
5. [Safari App Extensions][5]
6. [Firefox Browser Extensions][6]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.similarweb.com/browsers/ "Top Browsers Market Share"
[3]: https://developer.chrome.com/docs/extensions/mv3/getstarted/ "Chrome Extensions Getting Started"
[4]: https://docs.microsoft.com/en-us/microsoft-edge/extensions-chromium/ "Microsoft Edge extensions"
[5]: https://developer.apple.com/documentation/safariservices/safari_app_extensions "Safari App Extensions"
[6]: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions "Firefox Browser Extensions"
