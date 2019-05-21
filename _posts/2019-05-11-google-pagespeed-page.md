---
layout: default
title: "根据Google的PageSpeed Insights的建议优化页面"
author: 李佶澳
createdate: "2019-05-11 14:30:14 +0800"
changedate: "2019-05-11 17:27:23 +0800"
categories: 方法
tags: SEO
cover:
keywords: pagespeed,网页加载速度测试
description: PageSpeed Insigths用于展示网页的加载速度，诊断网页存在的问题，给出优化建议，尝试使用
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

[PageSpeed Insigths](https://developers.google.com/speed/pagespeed/insights/)用于诊断网页存在的问题，给出优化建议。
用PageSpeed诊断了一个网页，得分只有41分，非常低，按照提示开始优化最后稳定在60分以上。

![PageSpeed Insigts]({{ site.imglocal }}/article/pagespeed.png)

## 使用下一代图片格式

JPEG 2000, JPEG XR, and WebP 的压缩效果比PNG、JPEG更好，可以减少图片体积，提高加载速度。图片色彩多的时候jpeg文件格式小，纯色图片png文件格式小。

然而，这上来就是一个大坑，[Serve Images in Next-Gen Formats][2]中给出的数据显示，很多浏览器还不支持WebP、JEPE 2000、JPEG XR...

忽略该优化建议继续使用png和jpeg，意外收获是找到了修改文件格式的命令行工具[sips][1]，mac上可用：

```sh
sips -s format 目标文件格式 -s formatOptions 图片效果  被转换文件  --out 转换生成的文件
```
例如：

```sh
sips  -s format jpeg  -s formatOptions default img.png--out  img.jpeg
```

sips的更多用法见[在命令行用sips进行图片格式转换、图片大小修改、图片属性设置等操作](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/05/12/sips-modify-img-cmd.html)。

## 去掉没有用到的css和js

多余的css和js统统去除，特别是js，它会导致main-thread工作时间过程，去除了，直接从41分升到67分。

## 比较尴尬的是..

网页里添加了ads代码，导致得分的低一部分原因是加载ads广告，广告图片下载慢等，另外网页渲染耗时略长，因为是用bootstrap做的排版，暂时也无处下手，如果按照AMP中的要求所有的style都要是inline...

测试了一下百度移动端首页，得分只有61，github是63...感觉平衡了些....这不妨碍我们认真分析PageSpeed给出的优化建议。

## 参考

1. [Converting Image File Formats with the Command Line & sips][1]
2. [Serve Images in Next-Gen Formats][2]

[1]: http://osxdaily.com/2013/01/11/converting-image-file-formats-with-the-command-line-sips/ "Converting Image File Formats with the Command Line & sips"
[2]: https://developers.google.com/web/tools/lighthouse/audits/webp?utm_source=lighthouse&utm_medium=unknown  "Serve Images in Next-Gen Formats"
