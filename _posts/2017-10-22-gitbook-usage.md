---
layout: default
title: 怎样在gitbook上写一本书?
author: 李佶澳
createdate: 2017/10/22 16:50:56
changedate: 2017/12/03 23:10:13
categories: 方法
tags: gitbook
keywords: gitbook,写书
description: gitbook2014年成立于法国的第二大城市`Lyon`，它致力于提供更时尚、更简单的文档管理和数字创作出版方案。

---

* auto-gen TOC:
{:toc}

## 说明 

[gitbook][1]2014年成立于法国的第二大城市`Lyon`，它致力于提供更时尚、更简单的文档管理和数字创作出版方案。
可以按照[怎样在gitbook上写一本电子书？][4]中步骤，快速的登录、体验一下。

这里关注偏向程序员的一些用法。

## 在github上存管

虽然在gitbook上可以直接创建编辑电子书，但程序员可能更倾向于用github管理自己的资料。

gitbook支持将素材存放在github上。

[gitbook手册][3]中没有找到对素材目录结构的说明，所以先在gitbook上创建一本电子书，然后用git clone到本地。

	git clone https://git.gitbook.com/lijiaocn/my-first-book.git

![gitbook clone]({{ site.imglocal }}/gitbook-usage/d-git-clone.png)

得到的素材目录结构如下:

	.
	├── README.md         <-- 封面
	├── SUMMARY.md        <-- 目录结构
	├── chapter1.md       <-- 页面内容
	└── content           <-- 目录
	    └── traffic.md    <-- 页面

查看`SUMMARY.md`文件，会发现，这个文件里描述了整本书的目录结构:

	# Summary
	
	* [Introduction](README.md)
	* [About Me](chapter1.md)
	* [Chapter 1:  live in Beijing](content.md)
	  * [Traffic](content/traffic.md)

### 创建github项目

参照上面的目录结构和SUMMARY文件的内容创建一个github项目:

	.
	├── README.md
	├── SUMMARY.md
	├── chapter1
	│   ├── 00-about.md
	│   ├── 01-airport.md
	│   └── 02-train.md
	└── chapter2
	    ├── 00-about.md
	    └── 01-snack.md

在SUMMARY.md中编辑目录：

	# Summary
	
	* [关于这本书]( ./README.md )
	* [第一章：北京的交通]( ./chapter1/00-about.md )
		* [飞机场]( ./chapter1/01-airport.md )
		* [火车站]( ./chapter1/02-train.md )
	* [第二章：北京的美食]( chapter2/00-about.md )
		* [小吃]( ./chapter2/01-snack.md )

然后提交到github，可以直接使用这里已经创建的github项目[study-gitbook][5]。

### 在gitbook中新建book

然后登录到gitbook中，创建一本新书，选择github。

![关联github]({{ site.imglocal }}/gitbook-usage/e-sync-github.png)

按照提示完成github关联后，可以看到github上的项目列表:

![选择github项目]({{ site.imglocal }}/gitbook-usage/f-choose-repo.png)

填写Title和Dsecription后，点击创建，等待一会就可以了。

![book创建完成]({{ site.imglocal }}/gitbook-usage/g-book-ok.png)

之后在github中的更新，都会被`自动同步`到gitbook中。

## 绑定域名

虽然gitbook上的所有的图书都可以通过地址`http://{author}.gitbooks.io/{book}/content`访问，
但我们有时候还是希望将图书绑定我们自己的域名上。

[Can I use a custom domain for my book?][6]中介绍了如何做成这件事。

整个过程只需要三步，详细过程可以参考[][]。

第一步，gitbook的网站上到目标图书的`setting`中设置要绑定的域名，比如设置为`go.lijiaocn.com`；

第二步，到你的dns服务商那里，添加一条cname记录，将`go.lijiaocn.com`解析为`www.gitbooks.io`；

第三步，就是等待域名解析记录在全球范围内生效，然后就可以直接通过`go.lijiaocn.com`阅读图书。

等待的时候不是固定的，如果你等待了很久还是不能访问，不妨翻墙试一下。

## 参考

1. [gitbook主页][1]
2. [gitbook介绍][2]
3. [gitbook手册][3]
4. [怎样在gitbook上写一本电子书？][4]
5. [github: study-gitbook][5]
6. [Can I use a custom domain for my book?][6]
7. [gitbook图书绑定自定义的域名要怎样做？][7]

[1]: https://www.gitbook.com/  "gitbook主页" 
[2]: https://www.gitbook.com/about  "gitbook介绍" 
[3]: https://help.gitbook.com/ "gitbook手册"
[4]: https://jingyan.baidu.com/article/08b6a59182ffae14a9092272.html "怎样在gitbook上写一本电子书？"
[5]: https://github.com/lijiaocn/study-gitbook "github: study-gitbook"
[6]: https://help.gitbook.com/books/can-i-use-custom-domain.html "Can I use a custom domain for my book? "
[7]:   "gitbook图书绑定自定义的域名要怎样做？"
