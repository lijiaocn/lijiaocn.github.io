---
layout: default
title: "各大搜索引擎官方的SEO优化建议，与AMP/MIP等技术"
author: 李佶澳
createdate: "2019-05-04 22:25:28 +0800"
changedate: "2019-05-11 17:34:14 +0800"
categories:  方法
tags:  SEO
cover:
keywords: SEO,搜索引擎,Google SEO,百度搜索优化
description: Google、百度等搜索引擎官方提供的SEO优化建议，哪些该做，哪些不能做，以及AMP/MIP技术
---

* auto-gen TOC:
{:toc}

## 说明

Google、百度等搜索引擎官方提供的SEO优化建议是最直接的最靠谱的，哪些该做，哪些不能做都有说明。特别是Google的文档，数量多内容丰富。

## AMP/MIP网页加速技术

Google推出AMP技术有几年的时间了，采用该技术的网站不多，Google自己的首页都没有使用AMP。

AMP技术还遭遇到了一些抵制，[A letter about Google AMP](http://ampletter.org/)召集了不少签名，大概意思是说AMP技术会让Google掌管整个互联网，要求Google不对AMP偏心......

1. [Why *Not* Google AMP?](https://medium.com/@uistephen/why-not-google-amp-cf1aeb974463)

2. [Should You Use Accelerated Mobile Pages (AMP)? What is Wrong With AMP and What Can You Do To Improve Your Site](https://love2dev.com/blog/should-you-amp/)

Facebook在自家的网站推广了类似技术，Instant Articles：[Instant Articles：A new way for any publisher to create fast, interactive articles on Facebook.](https://instantarticles.fb.com/)。

现在的微信小程序、百度小程序，也都是在现有的网页技术上改良，通过更严格的规则，提升加载速度和移动端体验。这个趋势是不可逆转的，不能死抱过去的观点，网页的加载渲染速度必须要越来越快，问题是谁会主导这一技术：是选择在大公司构建的体系内玩耍，享受这个公司的优待，还是选择一套独立于任何公司的技术。

我感觉前者前者更现实一些，大厂能够提供的流量和技术是不能小觑的，问题就是得听话，利益分配权不在自己手里。

## Google

[Google：搜索引擎优化 (SEO) 新手指南](https://support.google.com/webmasters/answer/7451184?hl=zh-Hans)

为网页添加结构化数据，这个非常有用：

[Understand how structured data works](https://developers.google.com/search/docs/guides/intro-structured-data)

Google开放的AMP技术，要重点关注，AMP不是新的标记语言，而一套HTML网页的优化技术：

[AMP Websites Guides & Tutorials：Create your AMP HTML page](https://amp.dev/documentation/guides-and-tutorials/start/create/basic_markup?format=websites)

[Understand how AMP looks in search results](https://developers.google.com/search/docs/guides/about-amp)

**重点**：符合AMP标准的网页，会被缓存到Google的CDN中，从而大大加快相应速度。

## 百度

Google推出AMP后，百度推出了类似的MIP技术，百度同时支持这两种类型网页的提交：[MIP & AMP](https://ziyuan.baidu.com/mip/index)。

[MIP：移动网页加速器](https://www.mipengine.org/v2/docs/getting-start/newbie.html)

考虑到Google在搜索领域的话语权更重，应当拥抱AMP，不过百度一篇[访谈](https://ziyuan.baidu.com/college/articleinfo?id=1254)中说当初推出MIP是因为AMP的一些服务在国内无法使用，这个要重点关注。

**重点**：符合MIP标准的网页，会被缓存到百度的CDN中，从而大大加快相应速度。（不知道AMP网页会不会进入百度CDN）
