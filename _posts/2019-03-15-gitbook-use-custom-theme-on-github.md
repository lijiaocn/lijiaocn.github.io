---
layout: default
title: "GitBook项目中用插件的方式安装github上的第三方模板"
author: 李佶澳
createdate: "2019-03-15 14:32:16 +0800"
changedate: "2019-03-23 21:12:10 +0800"
categories: 技巧
tags: gitbook
keywords: gitbook,theme-default,gitbook模板,gitbook插件
description: Gitbook默认模板是theme-default，把自定义模板做成插件引用，实现一处更改处处更新的效果
---

* auto-gen TOC:
{:toc}

## 说明

Gitbook的默认模板是[theme-default][1]，可以把它fork一份，然后自由修改，并且可以直接引用github上repo作为插件。


## 准备一个新的theme

将[theme-default][1]fork为[theme-lijiaocn][2]，可以在里面增加或删除一些字符，便于与theme-default区分开。

`package.json`中的名称一定要修改：

将：

```
"name": "gitbook-plugin-theme-default",
"description": "Default theme for GitBook",
```

修改为：

```
"name": "gitbook-plugin-theme-lijiaocn",
"description": "Default theme for GitBook",
```

文件中的连接也修改：

	1,$ s#https://github.com/GitbookIO/#https://github.com/lijiaocn/#

## 创建gitbook项目

先安装[gitbook-cli][3]：

	npm install gitbook-cli -g

gitbook命令默认位于/usr/local/bin中，需要将这个目录添加到环境变量PATH中：

	export PATH="/usr/local/bin/":$PATH

创建一个gitbook项目：

	mkdir custom-theme-example
	cd custom-theme-example
	gitbook init

如果遇到[dyld: Library not loaded: /usr/local/opt/icu4c/lib/libicui18n.62.dylib][4]的问题，可以用下面方法解决：

```
问题现象：
dyld: Library not loaded: /usr/local/opt/icu4c/lib/libicui18n.62.dylib
  Referenced from: /usr/local/bin//node
  Reason: image not found
[1]    55441 abort      gitbook init

解决方法：
brew update node
brew cleanup
```

## 设置项目的book.json

在gitbook目录中创建项目的配置文件[book.json][6]。

```json
{
    "author": "lijiaocn@foxmail.com",
    "isbn": "",
    "language":"zh",
    "gitbook": ">=3.0.0",
    "plugins":""
}
```

采用[How to use a custom theme hosted on Github?][7]中的建议，将github上theme repo作为插件安装：

```json
{
    "author": "lijiaocn@foxmail.com",
    "isbn": "",
    "language":"zh",
    "gitbook": ">=3.0.0",
    "plugins":[
        {
            "name": "theme-lijiaocn",
            "version": "git+https://github.com/lijiaocn/theme-lijiaocn.git"
        }
    ]
}
```


运行`gitbook install`安装：

```
$ gitbook install
info: installing 1 plugins using npm@3.9.2
info:
info: installing plugin "theme-lijiaocn"
info: install plugin "theme-lijiaocn" (git+https://github.com/lijiaocn/theme-lijiaocn.git) from NPM with version git+https://github.com/lijiaocn/theme-lijiaocn.git
/Users/lijiao/Work-Finup/books/custom-theme-example
└── gitbook-plugin-theme-default@1.0.7  (git+https://github.com/lijiaocn/theme-lijiaocn.git#3be9e673448b4a8e13e6405cb061cf4e172f2377)
```

启动：

```
gitbook serve --port 4005 --lrport 35735
```

## 插件更新

theme-lijiaocn插件更新之后，在使用该插件的gitbook项目中直接重新安装一遍插件，就会应用最新的版本：

	gitbook install 

## 安装sitemap插件

[sitemap插件](https://plugins.gitbook.com/plugin/sitemap)：

```json
{
    "plugins": ["sitemap"],
    "pluginsConfig": {
        "sitemap": {
            "hostname": "http://mybook.com/"
        }
    }
}
```

## 参考

1. [theme-default][1]
2. [theme-lijiaocn][2]
3. [怎样在gitbook上写一本书?][3]
4. [dyld: Library not loaded: /usr/local/opt/icu4c/lib/libicui18n.62.dylib][4]
5. [GitBook Toolchain Documentation][5]
6. [GitBook Configuration][6]
7. [How to use a custom theme hosted on Github?][7]

[1]: https://github.com/GitbookIO/theme-default "theme-default"
[2]: https://github.com/lijiaocn/theme-lijiaocn "theme-lijiaocn"
[3]: https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2017/10/22/gitbook-usage.html#%E6%9C%AC%E5%9C%B0%E9%A2%84%E8%A7%88 "怎样在gitbook上写一本书?"
[4]: https://stackoverflow.com/questions/53828891/dyld-library-not-loaded-usr-local-opt-icu4c-lib-libicui18n-62-dylib-error-run  "dyld: Library not loaded: /usr/local/opt/icu4c/lib/libicui18n.62.dylib"
[5]: https://toolchain.gitbook.com/ "GitBook Toolchain Documentation"
[6]: https://toolchain.gitbook.com/config.html "GitBook Configuration"
[7]: https://github.com/GitbookIO/gitbook/issues/1368 "How to use a custom theme hosted on Github?"
