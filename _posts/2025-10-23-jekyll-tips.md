---
layout: default
title:  "Jekyll 的一些更高效的使用方法"
author: 李佶澳
categories: 技巧
tags: [jekyll]
keywords:  jekyll,使用技巧
description:  这个博客站点是在没有完全了解 jekyll 功能的情况下，摸索着用 jekyll 生成，走了不少弯路。有一些功能其实只要安装下 jekyll 的插件就能很好的支持。这里记录一些更好的 jekyll 用法。
---

## 目录

* auto-gen TOC:
{:toc}

>测试


## 说明

这个博客站点是在没有完全了解 jekyll 功能的情况下，摸索着用 jekyll 生成，走了不少弯路。有一些功能其实只要安装下 jekyll 的插件就能很好的支持。这里记录一些更好的 jekyll 用法。

## 在 vscode 中编辑

**vim 插件**

最开始对命令行的 vim 有点不合理的偏爱，实际上还是带有图形界面的编辑器更高效。我一直喜欢 vim 主要是喜欢 vim 编辑模式下的快捷键。现在在编辑器里使用 vim 快捷键是可行的，比如 visual code studio 中安装 vim 插件后，就可以在编辑器窗口使用 vim 的编辑方式了。

**jekyll-post 插件**

vscode 的 jekyll-post 插件安装以后可以直接在 vscode 中创建 post 文件。还可以在顶层目录中创建名为 .post-template 自定义模版。不过这个插件比较老也没有更新，模版中似乎不支持变量。但对我而言目前足够了。

## post 的时间维护

**创建时间**

之前我是在每个 post 文件中都设置具体的 date 数值，通过 vim 的模版插入的。后来发现其实没有必要，jekyll 的 post 命名中带日期前缀，jekyll 在构建的时候能够通过文件名推断出 date，没必要在 post 中手动设置（除非需要特定的时间格式）。

**更新时间**

之前也是在在 post 中维护更新时间，在保存文件时自动刷新。后来发现直接用 jekyll-last-modified-at 插件就可以了，这个插件可以自动从 git 提交记录中获取最后一次更新时间，并且是 jekyll-sitemap 等插件可以读取的时间。

在 gemfile 中安装：

```ruby
gem 'jekyll-last-modified-at'
```

在 _config.yml 中启用： 

```yaml
plugins:
    - jekyll-last-modified-at
```

## 多语言支持

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"