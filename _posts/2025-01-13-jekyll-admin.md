---
title: Jekyll可视化编辑：Jekyll Admin
createtime: '2025-01-13 16:18:45 +0800'
last_modified_at: '2025-01-13 16:19:51 +0800'
categories:
- 技巧
tags:
- jekyll
keywords: jekyll
description: jekyll-admin是一个 jekyll 插件，安装该插件后。就可以在浏览器里编辑 jekyll 笔记了，在文章里添加图片方便多了
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

用 Vim 写 Jekyll  笔记有两个很烦人的问题：

1.  所见非所得
2.  引用图片的时候非常麻烦

特别是第二个问题，要手写图片的地址，记笔记的效率非常低。需要找一个可视化编辑的方法。这样的方法还真有。 

## Jekyll-Admin

[jekyll-admin][2] 是一个 jekyll 插件，安装该插件后。就可以在浏览器里编辑 jekyll 笔记了。


安装方式和其它 jekyll 插件相同，在 Gemfile 文件中配置即可：

```yaml
gem 'jekyll-admin',"0.11.1"
```

安装之后，本地启动 jekyll server，jekyll server 地址后面添加  /admin 就可以打开可视化编辑环境。 

效果如下，在文章里添加图片方便多了：

![jekyll-admin可视化编辑页面]({{ 'img/article/jekyll-admin.png' | relative_url }})


## 遇到的问题

###   Error: conflicting chdir during another chdir block

在可视化页面保存后，Jekyll 后台进程出现这样的错误：

```
Error: conflicting chdir during another chdir block
Error: Run jekyll build --trace for more information.
```

这应该是因为 jekyll server 的监听变动触发的 build 和 jekyll-admin 触发的 build 冲突。启动 jekyll server 的时候指定 --no-watch 就可以：

```
 bundle exec jekyll serve --no-watch
```

由于指定了 --no-watch，jekyll server 不会自动构建，需要可视化页面上点击 Save 触发构建。

## 参考

1. [李佶澳的博客][1]
2. [jekyll-admin][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://github.com/jekyll/jekyll-admin "jekyll-admin"
