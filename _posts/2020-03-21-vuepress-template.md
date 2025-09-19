---
layout: default
title: "VuePress 静态网站生成器的使用体验"
author: 李佶澳
date: "2020-03-21T21:34:13+0800"
last_modified_at: "2020-03-21T21:34:13+0800"
categories: 技巧
cover:
tags: jekyll
keywords: vuepress,jekyll,gitbook,静态内容站
description: gitbook 已经无人维护了，偶然发现 vue 也在苦恼静态站的问题，开发了 VuePress
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

一直挺喜欢 gitbook 的，但是 gitbook 已经无人维护了，文件数量一多，生成起来巨慢无比，偶然发现，vue 也在苦恼静态站的问题，他们自己开发了 VuePress，赶紧拿来用。

## 初体验

安装：

```sh
$ brew install yarn
```

```sh
$ mkdir vuepress-study
$ cd vuepress-study
$ yarn add -D vuepress   # 会在当前目录下生成 node_modules package.json yarn.lock
```

假定要在当前目录中创建多个 VuePress 静态站，其中一个站是 book1：

```sh
$ mkdir book1
$ echo '# Hello World' >book1/README.md
```

生成静态站 book1，并本地查看：

```sh
$ npx vuepress dev book1
success [11:58:14] Build 946ece finished in 7786 ms!
> VuePress dev server listening at http://localhost:8080/
```

为了使用方便，在 package.json 中添加命令：

```json
{
  "devDependencies": {
    "vuepress": "^1.4.0"
  },
  "scripts": {
    "book1:dev": "vuepress dev book1",
    "book1:build": "vuepress build book1"
  }
}
```

添加上面的命令，就可以用 yarn 命令查看：

```sh
$ yarn book1:dev
```

用下面的命令编译静态站：

```sh
$ yarn book1:build   # 编译后的文件目录： book1/.vuepress/dist
```

## VuePress 静态站配置

VuePress 静态站的配置全部位于对应目录（这里是 book1）的 .vuepress 目录中：

```
├── .vuepress (可选的)
│   ├── components (可选的)
│   ├── theme (可选的)
│   │   └── Layout.vue
│   ├── public (可选的)
│   ├── styles (可选的)
│   │   ├── index.styl
│   │   └── palette.styl
│   ├── templates (可选的, 谨慎配置)
│   │   ├── dev.html
│   │   └── ssr.html
│   ├── config.js (可选的)
│   └── enhanceApp.js (可选的)
```

.vuepress 目录默认是空的，根据自己的需要添加配置，至于配置的方法，嗯，还是有些门槛的，初次体验时先略过，后面一点点了解。 


## VuePress 静态站内容

静态站的内容就是目录（这里是 book1 ）中的 .md 文件，和 gitbook 不同，vuepress 没有类似 summary.md 的索引文件，目录中的每个文件页面路由是自动生成的，规则如下：

```sh
文件的相对路径     页面路由地址
/README.md         /
/guide/README.md   /guide/
/config.md         /config.html
```

在 book1 中创建几个章节：

```sh
$ mkdir book1/chapter1 book1/chapter2
$ echo "# Chpater1" >book1/chapter1/README.md
$ echo "# Reference" >book1/chapter1/reference.md
$ echo "# Chpater2" >book1/hapter2/README.md
```

运行 `yarn book1:dev`，可以通过下面的 url 访问刚创建的三个页面：

```sh
http://127.0.0.1:8080/chapter1/
http://127.0.0.1:8080/chapter1/reference.html
http://127.0.0.1:8080/chapter2/
```

如果要认为记住这些 url，那可麻烦了。有没有一个页面的所有索引呢？类似于 gitbook 的侧边栏？有，看下一节。 

## 静态站页面索引

VuePress 支持侧边栏（sidebar），侧边栏中可以是包含页内标题的索引，也可以包含站内其它网页的索引。

页内标题的索引非常简单，在每个页面中添加 sidebar: auto 就可以了。（可以在 .vuepress 中设置为默认开启）

```md
---
sidebar: auto
---

# VuePress 使用

## 安装

先完成安装

## 编写内容

然后开始编写内容
```

站内页面的索引有些麻烦了，首先这是通过 VuePress 的主题实现的，然后要到 VuePress 主题中进行设置。

VuePress 支持使用主题（theme），主题文件位于 .vuepress/theme 目录中，或者在 .vuepress/config 中指定 theme：

```js
module.exports = {
  theme: '选择一个实际存在的主题，没有使用默认的'
}
```

现在都有哪些主题可以用？我们先不关心，现在只需要知道，如果明确指定主题，就会使用 VuePress 的默认主题，默认主题支持设置侧边栏，设置方法如下： 

```js
module.exports = {
// theme: '如果不指定，就是使用 VuePress 的默认主题',
  themeConfig: {
    sidebar: [
      '/',
      '/chapter1/',
      ['/chapter2/', '章节2']
    ]
  }
}
```

**注意：这时候页面文件的 .md 中不要再在设置 sidebar: auto，否则会覆盖此处的设置。**

![vuePress 默认主题的侧边栏]({{ site.article }}/vuepress-sidebar.png)

在侧边栏中设置了 '/'、`'/chapter1/` 和 `/chatper2/` 三个索引，页面上就只展示了这三个以及当前页面的业内标题，chapter1 中的 reference 不会被自动添到 sidebar 中。

如果要在不同的页面中现实不同的 sidebar，可以上面的 sidebar 从列表类型修改为对象，然后按照 uri 设置 sidebar：

```js
module.exports = {
// theme: '如果不指定，就是使用 VuePress 的默认主题',
  themeConfig: {
//    sidebar: [
//      '/',
//      '/chapter1/',
//      ['/chapter2/', '章节2']
//    ],
    sidebar: {
      '/chapter1/': getChapter1SideBar('章节1'),
      '/chapter2/': getChapter2SideBar('章节2'),
      '/': getRootSideBar('首页'),                //注意要把最短的 uri 放在最后，否则会覆盖其它 uri
    }
  }
}


function getRootSideBar(title){
  return [
    {
      title: title,
      collapsable: false,
      children: [
        '/chapter1/',
        '/chapter2/'
      ]
    }
  ]
}

function getChapter1SideBar(title){
  return [
    {
      title: title,
      collapsable: false,
      children: [
        ['/','返回首页'],
        '/chapter1/',
        '/chapter1/reference'
      ]
    }
  ]
}

function getChapter2SideBar(title){
  return [
    {
      title: title,
      collapsable: false,
      children: [
        ['/','返回首页'],
        '/chapter2/'
      ]
    }
  ]
}
```

config.js 是 js 代码，可以写函数，所以想要把页面自动添加到 sidebar 不是一件困难的事，写个函数试试。

## 默认主题的配置

VuePress 的默认主题有很多 [配置目][4]，可以参考 [.vuepress/config.js][5]。

大部分配置都在 .vuepress/config.js 中设置，但也有例外：首页的一些配置可以在根目录的 README.md 中设置。

[Vue 默认主题配置][4] 中介绍的很详细了，无脑学习就行。

## 修改主题布局

最让人关心的页面布局的修改，默认主题的页面布局有时候不能满足需求，需要能够自行修改。VuePress 没有给出直接的方法。

从 [VuePress 主题开发][6] 中得知，主题文件位于 .vuepress/theme 目录中，约定目录如下：

```sh
theme
├── global-components
│   └── xxx.vue
├── components
│   └── xxx.vue
├── layouts
│   ├── Layout.vue (必要的)
│   └── 404.vue
├── styles
│   ├── index.styl
│   └── palette.styl
├── templates
│   ├── dev.html
│   └── ssr.html
├── index.js
├── enhanceApp.js
└── package.json
```

[vuepress/theme-default][7] 是 vuepress 的默认主题，实验一下本地的 .vuepress/theme 中创建同名的文件会不会覆盖默认主题中的文件。

结果是不行....，要使用 [Vue 主题继承][8] 的方法，在本地主题文件 .vuepress/theme/index.js 中继承主题，譬如继承默认主题：

```js
module.exports = {
  extend: '@vuepress/theme-default'
}
```

继承了继承设置后，本地主题中的文件才能覆盖父主题的文件。 

but，要先学会用 vue....

## SEO 相关

VuePress 生成的页面是 SEO 友好的，但是在写页面的时候，还是要注意在 Front Matter 中设置 [预定义变量][9]。

主要有：

```
title:        标题，默认是 h1
lang:         页面语言，默认是 en-US，中文用 zh-Hans-CN
```

知乎语言编码的讨论：[网页头部的声明应该是用 lang="zh" 还是 lang="zh-cn"？](https://www.zhihu.com/question/20797118)。如果使用了后面的多语种功能，可以在 config.js 中统一设置，不需要每个页面单独设置。

可以用 meta 注入其它 meta 标签，譬如 description 和 keywords：

```sh
---
meta:
  - name: description
    content: hello
  - name: keywords
    content: super duper SEO
---
```

## 修改站点路径

VuePress 默认发布的根目录 `/`，如果要发布到其它路径中，在 .vuepress/config.js 中设置 base：

```js
module.exports = {
  base: '/book1/',
  ...
```

base 指定的路径必须是 `/XXX/` 样式，即前后都需要有斜线。

## 多语言支持

如果要同时用多种语言发布，目录结构需要调整，为每种语言单独准备一个目录，譬如要发布英文版本：

```sh
$ mkdir en
$ cp * en/   #所有页面文件复制到 en 页面中 
```

book1 的目录结构最终如下，顶层是中文内容，en 中是英文内容：

```sh
.
├── README.md
├── chapter1
│   ├── README.md
│   └── reference.md
├── chapter2
│   └── README.md
└── en
    ├── README.md
    ├── chapter1
    │   ├── README.md
    │   └── reference.md
    └── chapter2
        └── README.md
```


并在 .vuepress/config.js 中设置 locales。

```js
  locales: {
  '/':
    {
      lang: 'zh-Hans-CN',
      title: 'VuePress 使用体验',
      description: '这里是 VuePress 的使用体验'
    },
  '/zh/':
    {
      lang: 'zh-Hans-CN',
      title: 'VuePress 使用体验',
      description: '这里是 VuePress 的使用体验'
    },
  '/en/':
    {
      lang: 'en-US',  // /en/目录下的页面  lang 被自动设置为 en-US
      title: 'VuePress Example',
      description: 'This a VuePress Example'
    },
  }
```

VuePress 的默认模版也支持多语言，也需要进行相应设置，设置的时候注意同步修改连接的文件（切换到 en 等）：

```js
  themeConfig: {
    locales:{
      '/':{
        selectText: 'Language',   // 多语言下拉菜单的标题
        label: '简体中文',        // 该语言在下拉菜单中的标签
        serviceWorker: {
          updatePopup: {
            message: "发现新内容可用.",
            buttonText: "刷新"
          }
        },
        sidebar: [
          {
            title: '回到主页',
            path: '/',
            collapsable: true,
            sidebarDepth: 1,
          },
          {
            title: '第一章',
            path: '/chapter1/',
            collapsable: true,
            sidebarDepth: 1,
            children:[
              '/chapter1/reference'
            ]
          },
          {
            title: '第二章',
            path: '/chapter2/',
            collapsable: true,
            sidebarDepth: 1,
            children:[
            ]
          },
        ]
      },
      '/en/':{
        selectText: '选择语言',   // 多语言下拉菜单的标题
        label: 'English',         // 该语言在下拉菜单中的标签
        serviceWorker: {
          updatePopup: {
            message: "New content is available.",
            buttonText: "Refresh"
          }
        },
        sidebar: [
          {
            title: 'Back Home',
            path: '/',
            collapsable: true,
            sidebarDepth: 1,
          },
          {
            title: 'Chapter One',
            path: '/en/chapter1/',
            collapsable: true,
            sidebarDepth: 1,
            children:[
              '/en/chapter1/',
              '/en/chapter1/reference'
            ]
          },
          {
            title: 'Chapter Tw0',
            path: '/en/chapter2/',
            collapsable: true,
            sidebarDepth: 1,
            children:[
              '/en/chapter2/',
            ]
          },
        ]
      },
    }
```

## TODO

集成百度自动推送、百度统计、Google 统计代码等。

官方有一个 Google analytics 插件：

```sh
$ yarn add -D @vuepress/plugin-google-analytics
```
 
```js
module.exports = {
  plugins: [
    [
      '@vuepress/google-analytics',
      {
        'ga': '' // UA-00000000-0
      }
    ]
  ]
}
```


## 参考

1. [李佶澳的博客][1]
2. [VuePress 快速上手][2]
3. [VuePress 默认主题][3]
4. [Vue 默认主题配置][4]
5. [.vuepress/config.js][5]
6. [VuePress 主题开发][6]
7. [vuepress/theme-default][7]
8. [Vue 主题继承][8]
9. [预定义变量][9]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://vuepress.vuejs.org/zh/guide/ "VuePress 快速上手"
[3]: https://www.vuepress.cn/theme/using-a-theme.html "VuePress 默认主题"
[4]: https://vuepress.vuejs.org/zh/theme/default-theme-config.html#%E9%A6%96%E9%A1%B5 "Vue 默认主题配置"
[5]: https://github.com/vuejs/vuepress/blob/v1.4.0/packages/docs/docs/.vuepress/config.js ".vuepress/config.js"
[6]: https://vuepress.vuejs.org/zh/theme/writing-a-theme.html "VuePress 主题开发"
[7]: https://github.com/vuejs/vuepress/tree/v1.4.0/packages/@vuepress/theme-default "vuepress/theme-default "
[8]: https://vuepress.vuejs.org/zh/theme/inheritance.html#%E6%A6%82%E5%BF%B5 "Vue 主题继承"
[9]: https://vuepress.vuejs.org/zh/guide/frontmatter.html#%E9%A2%84%E5%AE%9A%E4%B9%89%E5%8F%98%E9%87%8F "预定义变量"
