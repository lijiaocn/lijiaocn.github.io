---
layout: default
title: "虚拟机管理利器 vagrant 的基本概念和使用方法"
author: 李佶澳
date: "2020-09-25 15:54:07 +0800"
last_modified_at: "2020-09-25 15:54:07 +0800"
categories: 技巧
cover:
tags: vagrant
keywords:  vagrant,虚拟机管理
description: vagrant 是虚拟机管理利器
---

## 本篇目录


* auto-gen TOC:
{:toc}

## 说明

[Vagrantup.com][2] 是虚拟机管理利器。

## 安装 

安装 virtualbox：

```
brew cask install virtualbox
brew cask virtualbox-extension-pack
brew cask install vagrant
```

如果用 brew 安装 virtualbox 失败，到 [Download VirtualBox][3] 下载。

## 查找、下载系统镜像

到 [vagrant boxes search][4] 中查找操作系统镜像，然后用 vagrant box 下载，例如：

```
vagrant box add centos/7
```

## 创建启动虚拟机

创建一个目录，创建虚拟机:

```
mkdir centos & cd centos
vagrant init centos/7
```

启动：

```
vagrant up
```

进入虚拟机：

```
vagrant ssh
```

## 参考

1. [李佶澳的博客][1]
2. [Vagrantup][2]
3. [Download VirtualBox][3]
4. [vagrant boxes search][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.vagrantup.com/ "https://www.vagrantup.com/"
[3]: https://www.virtualbox.org/wiki/Downloads "Download VirtualBox"
[4]: https://app.vagrantup.com/boxes/search "https://app.vagrantup.com/boxes/search"
