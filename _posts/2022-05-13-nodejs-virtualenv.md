---
layout: default
title: "nodejs 隔离运行环境(virutalenv)设置方法"
author: 李佶澳
date: "2022-05-13 18:49:07 +0800"
last_modified_at: "2022-05-13 19:12:34 +0800"
categories: 技巧
cover:
tags: nodejs
keywords: nodeenv,nodejs,virtualenv,隔离运行
description: nodejs开发的工具的代码和本地nodejs版本不匹配时，可能报语法错误无法运行，用隔离运行环境解决
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

使用一些用 nodejs 开发的工具经常遇到代码和本地 node 版本不匹配的问题，同样的 js 代码在 nodejs A 版本中可以运行，到了 nodejs B 版本可能就报告语法错误，无法运行。

## 类似于 virtualenv 的 nodeenv

[nodeenv][2] 是一款类似于 python 的 virtualenv 的工具，可以创建一个隔离的 nodejs 运行环境，在隔离环境中安装任意版本的 nodejs。

### 安装 nodeenv

```sh
sudo pip install nodeenv
```

### 初始化隔离环境

nodeenv env 命令用来创建一个隔离运行环境，--node 指定要在隔离运行中安装的 node 版本：

```sh
nodeenv env --node=8.17.0
```

命令执行后，会在本地创建一个 env 目录，里面包含隔离运行的文件 

### 进入隔离环境

用 source 命令进入隔离环境中：

```sh
$ source env/bin/activate
(env) $ node --version
v8.17.0
```

### 退出隔离环境

deactivate_node 命令退出隔离环境：

```sh
(env) $ deactivate_node
$ node --version
v16.4.0
```

## 参考

1. [李佶澳的博客][1]
2. [nodeenv：Node.js virtual environment][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://pypi.org/project/nodeenv/ "nodeenv：Node.js virtual environment"
