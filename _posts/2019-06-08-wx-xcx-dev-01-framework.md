---
layout: default
title: "微信小程序开发（一）：概览"
author: 李佶澳
createdate: "2019-06-08T13:17:23+0800"
changedate: "2019-06-12T23:48:22+0800"
categories: 项目
tags: 小程序
cover:
keywords:  微信小程序,小程序开发,小程序,微信
description:  微信小程序的概念、技术本质、开发方法、微信提供的配套工具、云服务等微信小程序知识框架的建立
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 技术本质

2015 年，微信发布了一整套网页开发工具，开放了拍摄、录音、语音识别、二维码、地图、支付、分享、卡券等几十个API，在微信的 WebView 中运行的页面，可以调用的微信原生组件的 JS API，后来演变成了小程序。

![微信小程序开发]({{ site.imglocal }}/article/wx-xcx-1.png)

虽然小程序等开发过程类似于网页开发，但是它本身已经不是传统意义上的网页，更像是托管在微信上的应用，与微信的结合更紧密，发布修改需要经过微信的审核。

参考：[小程序技术发展史](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/#%E5%B0%8F%E7%A8%8B%E5%BA%8F%E6%8A%80%E6%9C%AF%E5%8F%91%E5%B1%95%E5%8F%B2)

	运行环境             逻辑层             渲染层
	iOS                  JavaScriptCore     WKWebView
	安卓                 V8                 chromium定制内核
	小程序开发者工具     NWJS               Chrome WebView

## 变现方式

流量主获取广告收益，不需要认证，开通条件如下：

1. 累计独立访客（UV）不低于 1000
2. 没有严重的违规记录

小程序内增值服务，已经认证的小程序可以申请微信支付，在 IOS 系统上不能展示、提供购买、支付功能。

## 开发工具

微信提供了 sketch 和 PS 格式设计组件，可以直接使用： [微信小程序设计UI组件](https://developers.weixin.qq.com/miniprogram/design/#%E8%B5%84%E6%BA%90%E4%B8%8B%E8%BD%BD)。

[Sketch](https://www.sketch.com/) 是一个矢量绘图设计工具， 使用方法见：[矢量绘图工具 Sketch 的基本用法](https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2019/06/08/sketch-usage.html)。

开发者工具才是重点，微信提供了专门用于小程序开发的 IDE， 代码编辑、调试、辅助工具等都有，可以实时预览，支持 Windows 和 macOS： [微信开发者工具下载](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。

## 可用资源

开发小程序可以使用的资源有：[小程序开发框架](https://developers.weixin.qq.com/miniprogram/dev/reference/)、[小程序前端组件](https://developers.weixin.qq.com/miniprogram/dev/component/)、[小程序前端交互 API](https://developers.weixin.qq.com/miniprogram/dev/api/)、[小程序服务端接口](https://developers.weixin.qq.com/miniprogram/dev/api-backend/)、[云端运行的计算存储资源](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)。

### 前端组件

组件内容角度，直接阅读 [组件文档](https://developers.weixin.qq.com/miniprogram/dev/component/)。

计划单独写一篇笔记。 2019-06-12 23:33:07

### 交互 API

交互 API，直接阅读 [API 文档](https://developers.weixin.qq.com/miniprogram/dev/api/)

计划单独写一篇笔记。 2019-06-12 23:33:11

### 服务端 API

[服务端 API 文档](https://developers.weixin.qq.com/miniprogram/dev/api-backend/)

计划单独写一篇笔记。 2019-06-12 23:33:16

### 云开发资源

微信提供了专门用于小程序的云服务，不需要自己维护服务器、创建服务，可以直接使用云函数、数据库、存储、云调用等接口：[云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)。

云开发提供了四种能力：数据库、云存储、云函数、云调用。

云开发还提供了 HTTP 接口，开发者可以在自己的服务器上调用云开发的功能：[云开发 HTTP API 文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-http-api/)。

#### 数据库

云开发提供的[数据库](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/database.html)是 json 文档数据库，支持条件查询、结果排序等。

1. 小程序端和服务端的访问权限能够分开设置，支持设置只能被数据创建者访问的权限（这个很强大，数据访问权限不用自己实现了，配置下就可以了）；
2. 通过服务端访问数据库，是指云函数访问，云函数拥有的是管理员权限，可以操作所有数据；
3. 批量修改只能通过云函数进行；
4. 支持按照 json 对象的某个字段值（包括数组类型的值）查询；
5. 支持索引，单字段索引可以用"点"表示嵌套的字段，单索引的排序和查询指定排序无关，数据能正确排序；
6. 组合索引包含多个字段，多个字段组合的任意前缀命中组合索引，字段顺序是组合索引的一部分，顺序不同索引不同；
7. 组合索引的字段排序和查询指定的排序相关，指定排序要么每个字段都和组合索引的字段排序相同，要么都相反；
8. 索引可以设置唯一性，即不允许在相同的索引；
9. 支持地理位置数据类型，使用地理位置查询时，必须建立地理位置索引；
10. 微信开发工具支持数据的导入导出；
11. 支持 orderBy，有相关的 API。

数据库 API 分为小程序端和服务端：[小程序端数据库 API](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-client-api/database/)、[服务端数据库 API](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-server-api/database/)。

####  存储

云开发提供非结构化的[云存储](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/storage.html)，支持文件夹、文件和目录搜索、权限设置、临时连接（有效期 2h），可以用 image、audio 等组件直接导入。

文件名编码长度最大为 850 个字节，不能以 /  开头，不能有连续的 /，特殊字符不要用，中文按照 URL Encode 规则转化，建议用大小写字母、数字和富豪 "-、!、_、.、*"组合。

存储的 API 比数据库简单多了，但同样分为小程序端和服务端： [小程序端存储 API](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-client-api/storage/)、[服务端存储 API](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-server-api/storage/)

#### 云函数

[云函数](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/functions.html)就是在云端运行一个或者多个程序文件，占用 CPU 和内存资源，云函数完全独立部署，可以分别部署在不同的地区，云函数可以互相调用。

1. 云函数用 js 编译，在云端的 node.js 中运行；
2. 云函数和微信登陆鉴权无缝结合，开发者不需要再校验 openid；
3. 可以使用 npm 安装的第三方依赖，依赖可以在云端安装也可以上传 node_modules 文件夹；
4. 云函数可以在本地调试；
5. 云函数可以设置为定时触发；
6. 云函数是幂等、无状态的，单次调用过程中可以使用 /tmp 目录的 512MB 临时磁盘空间（调用完成后可能被销毁）；
7. 云函数的运行环境是 CentOS 7.2 （2019-06-09 19:17:22），以后可能会变，云函数实现不能依赖特定的操作系统；
8. 云函数的根目录通过 `__dirname` 获取，可以在从根目录中获得上传的云函数文件；
9. Node.js native 依赖需要在对应的平台下编译后上传，必须是 Linux 平台，最好是 CentOS 7，否则可能出现兼容性问题；
10. 提供了云函数的日志和监控，可以看到调用次数和运行时间等。

#### 云调用

[云调用](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/guide/openapi/openapi.html#%E4%BA%91%E8%B0%83%E7%94%A8)就是云函数中调用小程序开发的接口 ,。

支持云调用的服务端接口标识有`云调用`，见 [微信小程序服务端接口](https://developers.weixin.qq.com/miniprogram/dev/api-backend/)。

开发数据也可以通过云调用获取：[服务端获取开放数据](https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/signature.html)。

## 开发框架

配置文件：app.json，小程序全局配置。

工具配置：project.config.json，开发者工具配置。

页面配置：page.json，独立定义页面属性。

WXML 模板：类似于 HTML 的存在，小程序的页面文件，小程序提供的组件和 api，可以在这里使用。

WXSS 样式：类似于 CSS 的存在，对 CSS 做了一些扩充和修改。

目录结构如下：

```sh
├── app.js 
├── app.json                # 小程序全局配置
├── app.wxss
├── pages
│   │── index
│   │   ├── index.wxml
│   │   ├── index.js
│   │   ├── index.json
│   │   └── index.wxss
│   └── logs
│       ├── logs.wxml
│       └── logs.js
└── utils
```

当前（2019-06-09 23:00:33） [app.json](https://developers.weixin.qq.com/miniprogram/dev/reference/configuration/app.html)  一共有 16 个配置项。

pages:  []string，字符串列表，必须，包含小程序的所有页面，排在最前面的就是小程序的首页；

window: Object，可选，全局设置小程序的状态栏、导航条、标题、背景色等，总共 11 项；

tabBar：Object，可选，小程序的 tab 标签设置，最多 5 个 tab；

networkTimeout: 网络请求超时时间；

debug：debug 模式，输出调试信息；

functionalPages：启用[插件功能页](https://developers.weixin.qq.com/miniprogram/dev/framework/plugin/functional-pages.html)；

subpackages： 项目分包结构，启用[分包加载](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages.html)时使用，分包加载就是将小程序打包成多个包，按需加载；

preloadRule： [分包预下载的规则](https://developers.weixin.qq.com/miniprogram/dev/framework/subpackages/preload.html) ，就是分包预先下载；

workers：处理多线程任务的 [woker](https://developers.weixin.qq.com/miniprogram/dev/framework/workers.html) 的代码目录，worker 在小程序后台运行；

requiredBackgroundModes： 申请要用到的后台运行的功能；

plugins： 用到的小程序[插件](https://developers.weixin.qq.com/miniprogram/dev/framework/plugin/using.html)；

resizable：在 iPad 上是否可以屏幕旋转； 

navigateToMiniProgramAppIdLis： 当前小程序会跳转到的其它小程序的 appid 列表，最多允许填写 10 个；

usingComponents：将自定义组件声明为全局组件，在小程序内可直接使用，不需要再次声明；

permission：小程序需要的接口权限；

sitemapLocation： sitemap.json 文件的路径，默认就是根目录下的 sitemap.json。

开发相关：[框架接口](https://developers.weixin.qq.com/miniprogram/dev/reference/api/App.html)、[WXML语法](https://developers.weixin.qq.com/miniprogram/dev/reference/wxml/)、[WXS语法](https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/)。

## 小程序入门

把[小程序开发指南](https://developers.weixin.qq.com/miniprogram/dev/framework/quickstart/getstart.html#%E4%BD%A0%E7%9A%84%E7%AC%AC%E4%B8%80%E4%B8%AA%E5%B0%8F%E7%A8%8B%E5%BA%8F)中的步骤走一遍，就完成入门了。指南文档非常详细，不得不说，原始文档为中文，学习起来顺畅太多了！下面只记录一些要点。

使用微信开发者工具的时候，要用微信登陆。

## 常见需求

### 获取用户进入小程序的路径

就是知道用户是从那里进入小程序的，调用[相关接口](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/scene.html)可以得到一个场景值，每个场景值是一类进入场景：
[场景值列表](https://developers.weixin.qq.com/miniprogram/dev/reference/scene-list.html)。

有些场景还会附带来源的 appid ，可精确知道用户如何过来的，[能够返回来源 appid 的场景](https://developers.weixin.qq.com/miniprogram/dev/framework/app-service/scene.html)：

```sh
场景值       场景                                     appId含义
1020         公众号 profile 页相关小程序列表         来源公众号
1035         公众号自定义菜单                        来源公众号
1036         App 分享消息卡片                        来源App
1037         小程序打开小程序                        来源小程序
1038         从另一个小程序返回                      来源小程序
1043         公众号模板消息                          来源公众号
```

## 参考

1. [微信小程序开发指南][1]

[1]: https://developers.weixin.qq.com/miniprogram/dev/framework/ "微信小程序开发指南"
