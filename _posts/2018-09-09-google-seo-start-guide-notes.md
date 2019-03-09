---
layout: default
title:  Google搜索引擎优化手册（SEO手册）学习笔记-要点记录
author: 李佶澳
createdate: 2018/09/09 12:00:00
changedate: 2018/09/11 16:37:31
categories: 技巧
tags: SEO
keywords: SEO,搜索排名,搜索优化,Google手册
description: 在网站SEO方面，Google官方给出了很详细的建议，分别从技术和内容的方面给出推荐做法，并且明确说明哪些是应该做的，哪些是应当避免的，值得好好学习下

---

* auto-gen TOC:
{:toc}

## 说明

在网站SEO方面，Google官方给出了很详细的建议，分别从技术和内容的方面给出推荐做法，并且明确说明哪些是应该做的，哪些是应当避免的，值得好好学习下

这是阅读[Search Engine Optimization (SEO) Starter Guide][1]手册时做的摘要。

{% include google_list.md %}

## 工具

[Google Webmaster Guidelines][2]提供了建站建议，怎样的网页是对Google友好的。

[Google Search Console][3]提供了向Google提交内容的工具，并且会在Google遇到抓取问题的时候进行告警通知。

[Google Webmasters][4]提供了更多的建议。

[Google 101: How Google crawls, indexes and serves the web][5]中介绍了Google的工作原理。

## 内容提交

通过向Google提交Sitemap，告知Google有了哪些新页面以及修改过的页面： [Learn more about how to build and submit a sitemap][7]。

用robots.txt通知Google哪些内容不希望被抓取：[using robots.txt files][8]。

	站内搜索页不要被Google抓取：Users dislike clicking a search engine result only to land on another search result page on your site

## 内容优化

确保Google看到的页面和用户看到的页面是相同的，不要禁止Google抓取js/css/image等用户可以访问的内容。

[URL Inspection tool][9]可以用来展示Google看到的内容。

### title优化

`<title>`标签中的网页标题要`每个网页都不同`，并且`简要``精确`地匹配每个网页的内容。

网页的title会出现在搜索结果的第一行：[the anatomy of a search result video][10]中介绍了搜索结果中呈现的内容。

会对搜索排名造成损坏的做法：

	标题内容与网页内容完全不相关
	使用一些默认的无意义的标题，例如"untitled","New Page1"
	整个网页的很多页面使用同样的title
	title非常长，并且填充了很多不要的关键字

总结：直接用网页中文章的题目做title，是个不错的选择。

### description优化

`<description>`中的内容是整个网页内容的摘要，摘要可以比标题长，例如一到两个小段落。

Google会根据用户查询的内容，自动从网页中选择最匹配用户需求的内容作为摘要。当Google无法从网页内容中摘取合适内容作为摘要时，会
考虑使用description中的摘要。因此，写好`<description>`也是很重要的：

[improving snippets with better description meta tags][11]

[better snippets for your users][12]

[how to create good titles and snippets][13]

应当：

	精确总结页面内容，description没有长度限制，最好能够正好在搜索结果中完全呈现
	用户需要能够根据description中的摘要，判断出是不是自己需要的内容
	每个页面的摘要都是独一无二、不相同的

不应当（可能会损伤排名的做法）：

	摘要内容完全和页面内容不相关
	摘要内容太宽泛，没有实际意义，例如："This is a web page" or "Page about baseball cards"
	摘要中全都是关键字，纯粹堆积关键字
	把整个页面的内容全都拷贝到摘要中
	多个页面使用同样的摘要

### 标题优化

`<h>`标签中内容会在页面中突出显示，也是非常重要的内容。

应当：

	标题构成整个页面内容的大纲

不应当（可能会损伤排名的做法）：

	标题没有对页面的内容进行有效地分割
	标题滥用，在应当使用<en>和<strong>等标签的地方使用标题
	标题层次不清，标题的等级变换错乱，无规律
	在网页中使用大量的标题
	标题非常非常长
	将标题作为调整样式的方法，而不是用于厘清文章结构

### 添加结构化数据标记

可以在网页中添加[Structured data][14]，搜索引擎可以根据这些结构化的数据标记，呈现给用户包含更多信息的"rich results"。
例如，店铺位置、商品种类、服务时间等。

这个链接中给出了Google支持的所有结构化数据类型：[See a full list of supported content types in our developer site][15]

可以借助工具[Data Highlighter][16]、[Markup Helper][17]。

Google提供了一个结构化数据检查工具：[Google Structured Data Testing Tool][18]

应当：

	添加结构化数据后，一定要用Google的结构化数据检查工具，确保没有错误
	使用前面给出的Data Heighlighter，在不修改页面代码的情况下，添加结构化数据
	如果要修改页面，通过Markup Helper工具获取结构化数据代码

不应当（可能会损伤排名的做法）：

	使用无效的结构化数据
	不要在对结构化标签不了解的情况下，就修改页面代码
	添加用户看不到的结构化数据
	添加伪造的或者无关的结构化数据

[Enhancement reports][19]中会给出过去90天，结构化数据的呈现次数，以及用户的点击情况。

### 搜索呈现页面优化

[the gallery of search result types that your page can be eligible for][20]

### 站点结构优化

Google建议网站使用https，并且区分带有www前缀和不带www前缀的：

	When adding your website to Search Console, we recommend adding both http:// 
	and https:// versions, as well as the "www" and "non-www" versions.

对于首页，最后带有`/`和不带有`/`，被认为是相同的：

	"https://example.com/" is the same as "https://example.com"

对于带有路径或者文件名的则不是：

	"https://example.com/fish" is not the same as "https://example.com/fish/"

网站导航很重要，Google会试图理解一个页面在整个网站中的角色，网站导航可以帮助搜索引擎判断哪些页面是重要的。

在使用面包屑导航的时候，建议使用[breadcrumb structured data markup][21]。

应当：

	创建自然的层次结构，满足用户的查阅需求，通过导航最终能找到所有的页面
	在导航连接中使用文本，如果导航连接使用js生成的，在页面加载的时候就生成
	导航页面向用户，sitemap面向搜索引擎
	404页面中包含连接到主页以及相关内容的连接

不应当（可能会损伤排名的做法）：

	创建过于复杂的导航链接，例如每一个页面都连接到其它所有页面
	内容划分过于细致，从主页到达最终页面的深度超过20
	导航连接中用的全是图片或者动画
	导航栏依赖脚本或者事件生成
	导航页中包含已经不存在的连接
	导航页中只罗列页面，没有对页面按照主题进行组织
	返回404页面的时候，没有使用404返回码
	通过robots.txt限制搜索引擎对404页面的访问

[sources of URLs causing "not found" errors][22]提供查找404页面的功能。

[custom 404 page][23]

### URL优化

Url应当是人类可读的，包含关于内容的信息，url会在搜索结果中展示，应当尽量简单易懂。

应当：

	在url中使用与内容相关的单词
	url中的目录层级简单易懂
	每个页面只能通过一个url访问，防止页面被多个url分权

不应当（可能会损伤排名的做法）：

	使用很长的url，带有不必要的参数和会话ID等
	使用没有显著意义的名称，例如page1.html
	过多的使用关键字，例如：baseball-cards-baseball-cards-baseballcards.htm
	url中目录层次过多，例如：.../dir1/dir2/dir3/dir4/dir5/dir6/page.html
	url中的目录名与内容不相关
	同一个页面可以通过多个url访问到

如果想让多个链接连接到相同的内容，可以使用[301跳转][24]。

You may also use canonical URL or use the [rel="canonical"](https://support.google.com/webmasters/answer/139066) link element if you cannot redirect.

### 内容优化

内容是最重要的。

在编写内容的时候，考虑搜索这些内容的用户可能使用的关键词。

可以借助[Keyword Planner][25]找到关键词的不同变种，以及每个关键词的相关搜索。

Google Search Console会在[Performance Report][26]中告知用户通过哪些关键字到达了网站。

应当：

	内容需要简单易读
	主题明确，有逻辑分段，提供内容索引
	内容是最新的，独一无二的
	内容是为用户优化的，不是为搜索引擎优化

不应当（可能会损伤排名的做法）：

	内容散漫没有主题，并且有拼写和语法错误
	垃圾内容
	文本内容嵌入到图片或者视频中，导致用户无法复制，搜索引擎无法读取
	在一个页面上罗列大量文字，主题散漫，没有分段、子标题等
	重新编排或者复制已经存在内容
	网站上大量重复的或者相似的内容
	插入大量没有必要出现的关键词
	大段对用户没有意义的内容
	存在只对搜索引擎展示，不对用户呈现的内容

关于重复的内容：[Learn more about duplicate content][27]

关于欺骗用户的内容：[Deceptively hiding text from users][28]

### 链接优化

通过文本(anchor text)连接到其它页面时，文本内容要准确易懂。

应当：

	文本中表明所连接到的页面是关于什么的
	文本要简洁
	带有链接的文本和无链接的文本要有视觉上的区别
	站内相关的内容也做链接

不应当（可能会损伤排名的做法）：

	文本内容宽泛无意义，例如： "page", "article", or "click here".
	被连接的网页偏离主题，和当前页内容无关
	直接使用连接的地址作为文本（连接到主页时是合理的）
	文本过长，以至于成为一个句子或者一段话
	通过css等，使有链接的文本和普通文本看起来相同
	链接文本中填充了大量的关键字
	添加没有必要的链接

在自己的站点中添加链接的时候，会为目标页面增加一些权重，如果不想为目标页面增加权重，使用“nofollow"标记：

	<a href="http://www.example.com" rel="nofollow">Anchor text here</a>

如果不想为整个页面中的所有链接增加权重，在`<head>`中设置：

	 <meta name="robots" content="nofollow">

### 图片优化

应当：

	图片的alt属性中要添加描述
	alt中的图片描述和图片名称要简单
	使用标准图片格式
	图片后缀名和图片格式匹配

不应当（可能会损伤排名的做法）：

	文件名宽泛无意义，例如："image1.jpg", "pic.gif", "1.jpg"
	图片文件名称太长
	在alt中大量填充关键词或者粘贴大段句子

可以通过[Image sitemap][29]告诉Google站点的图片情况，增加在图片搜索中出现的机会。

### 移动端优化

2016年时候开始，Google已经开始试验把一个站点的移动端版本作为首要内容：
[Google has begun experiments to primarily use the mobile version of a site's conten][30]

移动端设备包括：

	智能手机
	平板
	多媒体手机
	功能机

适应移动端可以有多种方式，Google建议使用[响应式设计][31]。

可以用[Google's Mobile-friendly test][32]检查网站是否适配了移动端。

如果网站包含大量静态内容，使用[Accelerated Mobile Pages][33]，可以使网页在各个平台上都能快速加载。

	使用Dynamic Serving或者有一个单独的移动站点，需要告诉google这个页面是专门为移动端优化的。
	使用响应式设计，需要在meta中通过`viewport`告诉浏览器怎样动态调整内容
	使用Dynamic Serving，在返回的http头中告知依据用户客户端类型作出的变化
	使用单独的移动端url，需要用<link>和rel="canonical" and rel="alternate"，表明url之间的关系
	保证资源是可抓取的，不要禁止css,js等文件的抓取，否则可能无法判断页面是否适配了移动端
	不要添加移动端无法使用的功能，例如flash视频等
	在所有类型的设备上，完整提供相同的功能

如果移动端没有好的搜索体验，会被降权，例如插入全屏广告等。

[Google's mobile-friendly guide][34]

### 推广优化

需要注意：过度推广，会降低站点权重。

应当：

	及时通知访客，新更新的内容
	线下推广
	加入Google My Business

[Google My Business][35]

不应当（可能会损伤排名的做法）：

	为很小的变动做推广： Attempting to promote each new, small piece of content you create; go for big, interesting items.
	Involving your site in schemes where your content is artificially promoted to the top of these services.
	到处提交垃圾连接
	从别的网站上购买连接

## 搜索表现和用户行为分析

搜索表现可以使用[Google Search Console][3]分析，用户行为可以使用[Google Analytics][36]获得。

## 最后

Google官方手册地址是：[Search Engine Optimization (SEO) Starter Guide][1]

## 参考

1. [Search Engine Optimization (SEO) Starter Guide][1]
2. [Google Webmaster Guidelines][2]
3. [Google Search Console][3]
4. [Google Webmasters][4]
5. [Google 101: How Google crawls, indexes and serves the web][5]
6. [How to hire an SEO][6]
7. [Learn more about how to build and submit a sitemap][7]
8. [using robots.txt files][8]
9. [Use the URL Inspection tool][9]
10. [the anatomy of a search result video][10]
11. [improving snippets with better description meta tags][11]
12. [better snippets for your users][12]
13. [how to create good titles and snippets][13]
14. [Structured data][14]
15. [See a full list of supported content types in our developer site][15]
16. [Data Highlighter][16]
17. [Markup Helper][17]
18. [Google Structured Data Testing Tool][18]
19. [Enhancement reports][19]
20. [the gallery of search result types that your page can be eligible for][20]
21. [breadcrumb structured data markup][21]
22. [sources of URLs causing "not found" errors][22]
23. [custom 404 page][23]
24. [301 redirect][24]
25. [Keyword Planner][25]
26. [Performance Report][26]
27. [Learn more about duplicate content][27]
28. [Deceptively hiding text from users][28]
29. [Image sitemap][29]
30. [Google has begun experiments to primarily use the mobile version of a site's conten][30]
31. [Responsive web design][31]
32. [Google's Mobile-friendly test][32]
33. [Accelerated Mobile Pages][33]
34. [Google's mobile-friendly guide][34]
35. [Google My Business][35]
36. [Google Analytics][36]

[1]: https://support.google.com/webmasters/answer/7451184?hl=en  "Search Engine Optimization (SEO) Starter Guide" 
[2]: https://support.google.com/webmasters/answer/35769 "Google Webmaster Guidelines"
[3]: https://search.google.com/search-console/about "Google Search Console"
[4]: https://www.google.com/webmasters/ "Google Webmasters"
[5]: https://support.google.com/webmasters/answer/70897 "Google 101: How Google crawls, indexes and serves the web"
[6]: https://www.youtube.com/watch?v=piSvFxV_M04 "How to hire an SEO"
[7]: https://support.google.com/webmasters/answer/156184 "Learn more about how to build and submit a sitemap."
[8]: https://support.google.com/webmasters/answer/6062608 "using robots.txt files"
[9]: https://support.google.com/webmasters/answer/9012289 "Use the URL Inspection tool"
[10]: https://www.youtube.com/watch?v=MOfhHPp5sWs "the anatomy of a search result video"
[11]: http://googlewebmastercentral.blogspot.com/2007/09/improve-snippets-with-meta-description.html "improving snippets with better description meta tags"
[12]: https://webmasters.googleblog.com/2017/06/better-snippets-for-your-users.html "better snippets for your users"
[13]: https://support.google.com/webmasters/answer/35624 "how to create good titles and snippets"
[14]: https://developers.google.com/search/docs/guides/intro-structured-data "Structured data"
[15]: https://developers.google.com/search/docs/guides/search-gallery "See a full list of supported content types in our developer site"
[16]: https://www.google.com/webmasters/tools/data-highlighter "Data Highlighter"
[17]: https://www.google.com/webmasters/markup-helper/ "Markup Helper"
[18]: https://search.google.com/structured-data/testing-tool "Google Structured Data Testing Tool"
[19]: https://support.google.com/webmasters/answer/7552505 "Enhancement reports"
[20]: https://developers.google.com/search/docs/guides/search-gallery "the gallery of search result types that your page can be eligible for"
[21]: https://developers.google.com/search/docs/data-types/breadcrumbs "breadcrumb structured data markup"
[22]: http://googlewebmastercentral.blogspot.com/2008/10/webmaster-tools-shows-crawl-error.html "sources of URLs causing not found errors"
[23]: https://support.google.com/webmasters/answer/93641 "custom 404 page"
[24]: http://support.google.com/webmasters/answer/93633 "301 redirect"
[25]: https://ads.google.com/home/tools/keyword-planner/ "Keyword Planner"
[26]: https://support.google.com/webmasters/answer/7576553 "Performance Report"
[27]: https://support.google.com/webmasters/answer/66359 "Learn more about duplicate content"
[28]: https://support.google.com/webmasters/answer/66353 "Deceptively hiding text from users"
[29]: https://support.google.com/webmasters/answer/178636 "Image sitemap"
[30]: https://webmasters.googleblog.com/2016/11/mobile-first-indexing.html "Google has begun experiments to primarily use the mobile version of a site's conten"
[31]: https://developers.google.com/search/mobile-sites/mobile-seo/responsive-design "Responsive web design"
[32]: https://search.google.com/test/mobile-friendly "Google Mobile-friendly test"
[33]: https://www.ampproject.org/ "Accelerated Mobile Pages"
[34]: https://developers.google.com/search/mobile-sites/ "Google's mobile-friendly guide."
[35]: https://www.google.com/business/ "Google My Business"
[36]: https://analytics.google.com "Google Analytics"
