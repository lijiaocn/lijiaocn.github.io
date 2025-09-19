---
layout: default
title: "SEO民间经验分享摘录: 来自微信公众号、知识星球的干货汇总（一）"
author: 李佶澳
createdate: "2019-05-11 09:23:02 +0800"
last_modified_at: "2019-05-11 17:34:36 +0800"
categories: 技巧
tags: SEO
cover:
keywords: SEO,SEO经验汇总,SEO知识,搜索优化,搜索排名
description: 汇总从微信公众号、知识星球、SEO网站上看到的具有启发性、实操性、真实性的SEO知识或经验
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

汇总从微信公众号、知识星球、SEO网站上看到的具有启发性、实操性、真实性的SEO知识或经验。

## 经验数据

1. 2018：SearchMetrics实验，Google TOP 10 网页的停留时长为3分钟10秒；
2. 2018: 60%的Google搜索来自移动设备；
3. 2018: Cisco的预测，线上视频在 2021 年将占到线上流量的 80%；
4. 2018: HubSpot的调查表明，43% 的用户希望看到更多的视频内容；
5. 2018: YouTube 已经是世界上第二大搜索引擎，越来越多用户在 YouTube 上搜索，甚至跳过了Google；
6. 2018: Huffington 的报告显示，用户花在 YouTube 上的时间比去年提高了 60%；
7. 2018: 大多数营销人员太懒而没有制作视频；
8. 2018: 因为 55% 的 Google 搜索结果至少有一个视频结果，基本都是来自 YouTube；
9. 2018: 40% 成人用户每天至少有一次语音搜索；
10. 2018: Google 上的语音搜索已经较 2008 年提升了35倍多；
11. 2018: 手机端 20% 用户都是语音搜索；
12. 2018: 通过分析一百万个 Google 搜索结果，我们发现：网站获得的外链数量，是跟网站排名正相关，并且超过排名的其他因素；
13. 2018: 37% 的营销人员表明图形化营销已经是内容营销中最重要的部分；
14. 2018: 得益于 Pinterest 和 Instagram，图形化内容将会在 2018年持续增长；
15. 2018: 6700 万的美国人每月至少听一个 podcast（比去年提升了 14%）；
16. 2018：买卖链接、发外链成为历史，若中招要去删外链；
18. 2018：大规模采集、伪原创逐渐消失；
19. 2015: 百度长尾词第一页平均正文字数500，第二页～第五页依次递减
20. 2015: 百度长尾词第一页平均网页包含链接数量130，第二页～第五页依次递增

## 关键字挖掘

百度/Google的搜索框提示、页面底部的相关搜索不必多说。可以通过提取API接口，用下面的规则遍历提示词：

1. 关键字
2. 关键字[26个英文字母单个循环]
3. 关键字[26个英文字母*26个英文字母]
4. 将查询到的相关搜索作为关键字再次查询

注意百度的PC端和移动端是两个接口，通过这种方式可以知道关键字的周边情况，人们的实际需求。



## 搜索规则

Google工作人员Twitter：Gary Illyes、John Mueller。

1. 进行301跳转的网页原网页和目标网页必须是1:1，不然原网页被当作404，不要滥用301/302等，恪守它们的本意；
2. Google搜索算法不使用Google Analytics的数据；
3. 采集站是打击重点，一定在采集的基础上提供附加价值：增加评论、相关内容推荐、内容整合；
4. Google排序三大因素：内容、连接、RankBraina，已经能够识别用户的真实需求，理解网页的文本语义；
5. 在移动端隐藏的内容，在PC端也会被算法忽略；
6. Google推荐将M站换成响应式设计；
7. 当有语音搜索时，Google 会抓取一个既有问题又有答案的网页；
8. 2017 Google：博客评论会对排名有“很大帮助”；
9. 2018 Google：在用户参与度上，评论是比 SNS 更有效的方式；
10. 2018 Google：移动优先
11. 收录分索引库和进快照库的区别，大众上说的收录是指进快照库的，而决定引入流量大小的是进入索引库的页面，[原文](https://mp.weixin.qq.com/s/auHrxnpW6jONDh73mOt5IA)；
12. 做新站首选老域名，据说是因为新域名在百度的审核期太长，收录都得等很长时间；
13. 挑选老域名建站，可以优先选择历史收录高、建站时间长的域名；

倒排占比：进入索引库的页面比例。指能在百度通过关键词搜索出来，有机会拿流量的页面。小伙伴可以到：site.itseo.net 来查询一批页面的倒排占比。

正排占比：进入快照库的页面比例。指能通过url搜出来页面，但通过关键词不能。只建立快照，但没编入索引的页面。是基本拿不了流量的页面。

收录占比：进入快照库 + 索引库的页面比例

未收录占比：快照都没有的页面比例。要么还没抓到，要么页面质量太渣


## 排名技巧

1. 优化长尾搜索词不如优化中等搜索词，RankBrain能分辨长尾搜索词是否表达了同样的需求，需求相同的长尾搜索词的搜索结果基本相同，因此刷中等搜索词更重要；
2. 切换https；
3. 使用结构化数据SERP；
4. 使用AMP技术提高网页加载速度；
5. 为重复的网页添加 canonical，保证 URL 的唯一性；
6. 通过关键词调研，确定各频道的关键词定位，明确主频道和次频道；
7. 网页符合W3C标准，减少到达正文的div路径，现写网页结构、然后加样式、最后加交互。

## 内容技巧

0. 确定页面的目标关键字；
1. 图文并茂、带有小标题；
2. 标题带有主动性，引导点击、分享；
3. 带有括号标题的点击率比无括号标题高33%；
4. 标题中使用数字能提升点击率；
5. Description生动丰富、突出卖点、包含目标关键字；
6. 上方内容在第一时刻抓住用户，吸引用户停留；
7. 开头使用简短介绍，一目了然，让用户知道自己能得到什么；
8. 内容要长，满足更多需求，2000字，用小标题分割；
9. 标题中带有品牌，打造用户对站点的认可度；
10. 包含LSI关键字，（网页主题相关联的一些词语或短语，帮助RankBrain更方便的理解网页的内容）；
11. 推荐将视频内容嵌入到博客正文中，这将大大提升用户的停留时长；
12. 面向语音搜索优化：大多数语音搜索都是基于一个问题的，例如“怎么科学的做俯卧撑”，“颐和园的女主角是谁”，当有语音搜索时，Google 会抓取一个既有问题又有答案的网页；
13. 包含文字信息的图片是有非常好的效果的，容易被其他网站引用，并嵌入到他们内容中的图片；
14. 发表一项统计、调查，或者一项研究，他们会引用这个内容，并列上你的原文链接；
15. Google高质量网站定义：Expertise, Authoritativeness, Trustworthiness （具有专业度、权威性、信任度）；
16. 根据热搜创建频道页；
17. 动态渲染实时页面：爬虫来访问时，提供渲染完成当网页；


## 算法技巧

### Google RankBrain

Google RankBrain是机器学习算法，发现有一批搜索结果的用户满意度偏低，则上线某个新算法，比如降低外链的权重比例，如果用户满意度提升了，则说明这个算法是有效的。
所有的流程都是自动化进行，可以分析出用户真实的搜索需求。

关键是如何判定网页对用户有用：

1. 点击率
2. 停留时间
3. 跳出率
4. Pogo-sticking

其中Pogo-sticking的意思是：点击返回查看下一个网页。被返回的网页减分，让用户停止了Pogo-sticking的网页加分。和跳出搜索词异曲同工。

### Google熊猫算法

打击低质量网站，大规模采集、伪原创基本消失。

### Google企鹅算法

打击人工外链，买卖链接、发外链成为历史。

## 在线工具

1. [LSI关键字挖掘1](https://natural-language-understanding-demo.mybluemix.net/#url) （需要翻Q）
2. [LSI关键字挖掘2](https://lsigraph.com/)
3. [Google Keyword Planner](https://ads.google.com/home/tools/keyword-planner/)
4. [Google 网页加载速度分析](https://developers.google.com/speed/pagespeed/insights/)
5. 词库抓取工具：火车头、Python - scrapy。
6. [AMP在线验证工具](https://search.google.com/test/amp)
7. [WordPress AMP插件](https://wordpress.org/plugins/amp/)
8. 国外代理：[scrapinghub](https://scrapinghub.com/pricing)
9. 国内代理：[西刺](http://www.xicidaili.com)、[快代理](http://www.kuaidaili.com)、[站大爷](http://ip.zdaye.com/)、[云代理](http://www.ip3366.net)
10. [长尾词挖掘工具5118.com](https://www.5118.com/)

## 学习资料

1. 百度站长学院；
2. Google Search Console帮助；
3. 《走进搜索引擎》、《这就是搜索引擎》、《信息检索导论》
4. [Search Engine Roundtable](https://www.seroundtable.com/)
5. [谷歌搜索引擎优化初学者指南](http://www.google.cn/intl/zh-CN/webmasters/docs/search-engine-optimization-starter-guide-zh-cn.pdf)
6. [2018 Google人工质量评分指南](https://static.googleusercontent.com/media/www.google.com/en//insidesearch/howsearchworks/assets/searchqualityevaluatorguidelines.pdf)
7. [2018 ZAC解读Google质量评分指南简介](https://www.seozac.com/gg/google-raters-guide/)
