---
layout: default
title: "移除Gitbook生成的网页中的`Published with GitBook`连接"
author: 李佶澳
createdate: "2019-01-21 17:51:14 +0800"
changedate: "2019-01-21 18:04:11 +0800"
categories: 技巧
tags: gitbook 
keywords: gitbook,删除网页连接,Published with GitBook
description: "用GitBook生成的网页左侧目录下方默认的`Published with GitBook`连接可以去掉或者替换成其它连接"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

用GitBook生成的网页中，在左侧目录下方默认有一个`Published with GitBook`连接，可以将这个连接去掉，或者替换成其它连接。

## 方法

[How to remove “Published with Gitbook” #1404][1]中提供两个方法，第二个修改模板的方法更好。

将[GitbookIO/theme-default][2]中的[_layouts](https://github.com/GitbookIO/theme-default/tree/master/_layouts)目录下载到你自己的gitbook目录中。

在自己的gitbook目录下，将`_layouts/website/summary.html`中的：

```html
    <li>
        <a href="https://www.gitbook.com" target="blank" class="gitbook-link">
            {{ "GITBOOK_LINK"|t }}
        </a>
    </li>
```

修改为：

```html
    <li>
        <a href="https://www.lijiaocn.com" target="blank" class="gitbook-link">
           以上内容由 www.lijiaocn.com 提供
        </a>
    </li>
```

## 参考

1. [How to remove “Published with Gitbook” #1404][1]
2. [GitbookIO/theme-default][2]

[1]: https://github.com/GitbookIO/gitbook/issues/1404 "How to remove “Published with Gitbook” #1404"
[2]: https://github.com/lijiaocn/theme-default "GitbookIO/theme-default"
