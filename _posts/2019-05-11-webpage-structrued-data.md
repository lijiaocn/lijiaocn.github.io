---
layout: default
title: "为网页添加结构化数据：Google支持的JSON-LD格式的结构化数据"
author: 李佶澳
createdate: "2019-05-11 18:33:54 +0800"
last_modified_at: "2019-05-12T00:30:58+0800"
categories: 方法
tags: SEO
cover:
keywords: SEO,结构化数据,Structured Data
description: 结构化数据让搜索引擎更好的理解页面内容、以富媒体方式呈现页面，这里演示Google结构化数据用法
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

结构化数据是网页中一段固定格式的字符串，是个网页内容的元数据。搜索引擎通过结构化数据可以更好的理解页面内容，在搜索结构中呈现页面的时候，以富媒体方式展示。

Google支持的结构化数据格式有：JSON-LD、Microdata、RDFa。Google建议使用JSON-LD。推荐阅读[Learn how content appears in Google Search][3]中的全部内容。

## 注意事项

1. 不要滥用，不要作弊；
2. 选定结构化数据后，一定要填充所有属性，否则被认为不适合以富媒体的方式展现；
3. 设置的结构化数据属性越丰富，展现给用户的状态越好；
4. 不要在列表页上使用结构化数据（轮播Carousel除外），要用在详情页上；
5. 两个内容相同的网页，它们的结构化数据也要完全一致；
6. 一个网页上可以添加多个结构化数据，确保结构化数据索引的内容都是用户可见的；
7. 结构化数据中指定的图片必须要位于当前网页上；
8. 图片的URL必须允许搜索引擎抓取和索引；
9. 结构化数据不能连接其它的网页；
10. 列表类型的页面上要么标记所有的对象，要么都不标记，除了轮播Carousel外，结构化数据不得链接到详情页。

## 结构化数据添加方法

Google给出一个[例子](https://codelabs.developers.google.com/codelabs/structured-data/index.html#0)，演示了如何将结构化数据添加到head中：

```html
<head>
<script type="application/ld+json">
{
  "@context": "http://schema.org/",
   ...
</script>
</head>
```

1、首先用@context指明要使用的schema.org结构化数据：

```json
"@context": "http://schema.org/",
```

2、然后指定结构化数据类型：

```json
"@type": "Recipe"
```

3、填充该结构化数据类型的属性，一定要填充所有的属性：

```json
"@type": "Recipe"
"@context": "http://schema.org/",
"name": "Party Coffee Cake",
"image": "https://www.leannebrown.com/wp-content/uploads/2016/12/up-close-pear-cake.jpg",
"author": {
  "@type": "Person",
  "name": "Mary Stone"
},
```

4、在当前结构化数据中添加其它类型的结构化数据，注意包含关系：

```json
{
"@context": "http://schema.org/",
"@type": "Recipe",
// other recipe structured data
"review": {
  "@type": "Review"
    "author": {
      "@type": "Person",
    }
    ...
 }
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingCount": "18",
  "ratingValue": "4"
  ...
}
}
```

5、检察并预览结构化数据：用在线工具[Structured Data Testing Tool](https://search.google.com/structured-data/testing-tool/u/0/)。

## 添加多个类型的结构化数据

可以在一个网页中添加多个相同类型或不同类型的结构化数据，参考[JSON-LD Schema.org: Multiple video/image page](https://stackoverflow.com/questions/30505796/json-ld-schema-org-multiple-video-image-page/30506476#30506476)。

### 多个同类型的结构化数据

用数组的方式组合起来：

```html
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "WebPage",
  "video":
  [
    {
      "@type": "VideoObject"
    },
    {
      "@type": "VideoObject"
    }
  ]
}
</script>
```

### 多个不同类型的结构化数据

在顶层用@graph组合起来：

```html
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@graph": 
  [
    {
       "@type": "VideoObject"
    },
    {
       "@type": "VideoObject"
    }
  ]
}
</script>
```
### 分拆到多个script中

```html
<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "WebPage",
  "video": 
  {
    "@type": "VideoObject"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "WebPage",
  "video": 
  {
    "@type": "VideoObject"
  }
}
</script>
```

## 结构化数据放置范围

一些类型的结构化数据，譬如Article，每个页面都是不同的，可以在所有的页面上放置。

另外一些结构化数据，譬如Logo，是否要在每个网页放置？[Google: Do Not Put ‘Organization’ Schema Markup on Every Page](https://www.searchenginejournal.com/google-do-not-put-organization-schema-markup-on-every-page/289981/#close) 中提供了一段Google的交流视频，Google的回答是`Organization`（就是Logo）被放置到所有网页上不会改变什么，Google一般去主页和联系页寻找Logo，但是如果在别的地方找到了，也没有什么影响。

但是`review`是不建议被放置的所有网页上的，有一些公司将review放置到所有网页上，试图让每个网页都在搜索结果中显示星级，Google认为“too bad”。

所以理解为将Logo等不随页面变换的结构化数据放置到所有网页上不会产生负面影响。

## 结构化数据类型

[Explore the search gallery](https://developers.google.com/search/docs/guides/search-gallery)列出的富媒体的呈现样式。结构化数据类型不同，在搜索结果中呈现的样式不同。

比较通用的有：**Article**、 **Breadcrumb**、 **Carousel**、 **Corporate Contact**、 **Logo**、 **Sitelinks Searchbox**、 **Social Profile**、 **Speakable**。

它们详细属性见[Google Structured Data Definitation][4]，需要特别注意，有些类型的结构化数据结合AMP使用会得到更多优待，例如Article应用AMP中有更多的展示位：

>AMP with structured data: [Recommended] AMP pages with structured data can appear in the Top stories carousel, host carousel of rich results, Visual stories, and rich results in mobile Search results. These results can include images, page logos, and other interesting search result features.

>Non-AMP web page with structured data: Non-AMP article pages that include structured data can increase the likelihood of appearing in search results with rich result features.

**Article**：文章页，在搜索框下方展示图文；

**Book**：呈现图书价格和购买链接；

**Breadcrumb**：呈现面包屑导航位置；

**Carousel**: 同时展示同一个网站中的一组页面，均是图文方式展现；

**Corporate Contact**：展现公司的联系方式；

**Cours**：课程描述和进入指示；

**Critic review**：评论要点；

**Dataset*：展示数据集

**Employer Aggregate Rating**：员工评价；

**Event**：新闻事件；

**Fact Checkt**：

**FAQ Page**：问答页；

**How-to**：图片展示操作步骤；

**Job Posting**：招聘职位；

**Livestream**：视频；

**Local Business**：附近店铺；

**Logo**：展示组织的Logo；

**Media actions**：富媒体操作按钮；

**Occupation**：职位信息；

**Product**：商品信息；

**Q&A Page**：展示问题答案；

**Recipe**：食谱；

**Review snippet**：点评信息；

**Sitelinks Searchbox**：展示站内搜索框；

**Social Profile**：社交账号信息；

**Software App (Beta)**：APP信息；

**Speakable**：合成语音播放；

**Subscription and paywalled content**：

**Top Places List**：最佳列表；

**Video**：视频；

## 配置示范

将代码复制粘贴到[Structured Data Testing Tool](https://search.google.com/structured-data/testing-tool?utm_campaign=devsite&utm_medium=jsonld&utm_source=review-snippet)进行语法检查：

```html
<script type="application/ld+json">
{
  "@context": "http://schema.org/",
  "@graph":[
    {
      "@type": "Organization",
      "logo": "https://www.lijiaocn.com/logo.jpg",    //LOGO图片地址，必须是112x112，.jpg,.png,.gif
      "url": "https://www.lijiaocn.com"               //与Logo相关联的url
    },
/*
    {
      "@type": "WebSite",
      "url": "https://www.lijiaocn.com",              //被搜索的网站
      "potentialAction": {
        "@type": "SearchAction",
                                                      //targe指定的域名必须是站点域名，不能用第三方搜索
        "target": "https://www.lijiaocn.com/search?q={search_term_string}+site%3Alijiaocn.com",
        "query-input": "required name=search_term_string"
      }
    },
    {
      "@type": "Person",                         //社交账号
      "name": "lijiaocn博客",                    //组织或个人名称
      "url": "https://www.lijiaocn.com",         //网站地址
      "sameAs": [
        "http://www.facebook.com/your-profile",  //社交账号地址，不支持的国内的
        "http://instagram.com/yourProfile",
        "http://www.linkedin.com/in/yourprofile",
        "http://plus.google.com/your_profile"
      ]
    },
*/
    {
      "@type": "BreadcrumbList",
       "itemListElement": [{
          "@type": "ListItem",
          "position": 1,
          "name": "图书",
          "item": "https://www.lijiaocn.com/图书"
       },{
          "@type": "ListItem",
          "position": 2,
          "name": "小说",
          "item": "https://www.lijiaocn.com/图书/小说"
       }]
    },
    {
      "@type": "Article",
      "dateModified": "2015-02-05T08:00:00+08:00",
      "datePublished": "2015-02-05T08:00:00+08:00",
      "headline": "标题，不超过110个字符",
      "image": [                 //提供三张不同比例的高清图片， 长x宽>=300 000
        "https://example.com/photos/1x1/photo.jpg",  //至少：600*600 = 360 000
        "https://example.com/photos/4x3/photo.jpg",  //至少：800*600 = 480 000
        "https://example.com/photos/16x9/photo.jpg"  //至少：960*540 = 518 400
      ],
      "author": {
        "@type": "Person",
        "name": "李XX"    //作者名称
      },
      "publisher": {
         "@type": "Organization",
         "name": "lijiaocn博客",                          //发布机构名称
         "logo": {
           "@type": "ImageObject",
           "url": "https://www.lijiaocn.com/logo.jpg"    //发布机构Logo,遵循
         }
      },
      "description": "内容描述",
      "mainEntityOfPage": "canonical URL of the article page",   //网页权威链接，无重复网页就设置成当前页地址
      "speakable": {
        "@type": "SpeakableSpecification",
        "xpath": [
          "/html/head/title",                              //指向head中的title
          "/html/head/meta[@name='description']/@content"  //指向head中的description
         ]
      }
    }
  ]
 }
</script>
```

## 参考

1. [Understand how structured data works][1]
2. [Follow the structured data guidelines][2]
3. [Learn how content appears in Google Search][3]
4. [Google Structured Data Definitation][4]

[1]: https://developers.google.com/search/docs/guides/intro-structured-data "Understand how structured data works"
[2]: https://developers.google.com/search/docs/guides/sd-policies "Follow the structured data guidelines"
[3]: https://developers.google.com/search/docs/guides/search-features "Learn how content appears in Google Search"
[4]: https://developers.google.com/search/docs/data-types/article "Google Structured Data Definitation"
