---
layout: default
title:  "超级账本HyperLedger：Fabric源码走读(一)：源代码阅读环境准备"
author: 李佶澳
createdate: 2018/07/17 09:52:00
changedate: 2018/07/26 19:32:25
categories: 项目
tags: HyperLedger
keywords: 区块链,源代码走读,Hyperledger,超级账本,Fabric
description: 超级账本HyperLedger Fabric源代码走读第一部分，准备源代码阅读环境。

---

* auto-gen TOC:
{:toc}

## 说明

这是网易云课堂“[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。

“工欲善其事，必先利其器”，这一节我们准备好源代码，以及阅读源代码的工具。

可以根据自己的喜好选择IDE，这里使用的安装了go插件的IntelliJ IDEA。

## Go开发环境准备

到[golang.org](https://golang.org)或者[www.golangtc.com](https://www.golangtc.com)下载Go安装文件。

下载后解压即可：

	$ mkdir -p ~/Work/Bin/go-1.10.3
	$ cd ~/Work/Bin/go-1.10.3
	$ wget https://dl.google.com/go/go1.10.3.darwin-amd64.tar.gz  (这里下载的是mac版)
	$ tar -xvf go1.10.3.darwin-amd64.tar.gz

准备存放源代码的GOPATH目录：

	$ mkdir -p ~/Work/Bin/gopath/{src,pkg,bin}

在~/.bash_profile中设置环境变量：

	export PATH="/Users/lijiao/Work/Bin/go-1.10.3/go/bin:$PATH"
	export GOROOT="/Users/lijiao/Work/Bin/go-1.10.3/go"
	export GOPATH="/Users/lijiao/Work/Bin/gopath"
	export PATH="$GOPATH/bin/:$GOPATH:$PATH"

更新：

	source ~/.bash_profile

## IntelliJ IDEA阅读环境准备

### 安装golang插件

1 打开Idea -> Perferences，点击“Plugins”，打开插件管理窗口

2 点击“ Browse repositories”，打开插件仓库管理窗口

3 在“Browse repositories”窗口搜索名为`"Go"`的插件，安装即可（注意不要用名为Golang的插件）

4 安装插件之后，重启idea。

插件安装期间，idea最底部会显示安装进度，如果提示超时安装失败，可能需要翻qiang。

(当前go插件不支持go1.10.x版本，@2018-07-16 13:20:30)

如果习惯用vim，还可以安装一个vim插件。

### 设置Go语言的SDK

打开Idea -> Perferences -> Languages & Frameworks -> Go

分别设置GOROOT和GOPATH，以及保存时的动作。

	GOROOT指定使用Go安装文件目录
	GOPATH指定用来存放Go代码、以及编译文件的目录

可以在GOPATH中添加多个路径。

Go插件使idea具有goland的所有功能。

语法高亮到Perferences -> Editor -> Colors & Fonts -> Go中设置。

### 导入HyperLedger Fabric源码

用git下载源代码：

	mkdir -p $GOPATH/src/github.com/hyperledger
	cd $GOPATH/src/github.com/hyperledger
	git clone https://github.com/hyperledger/fabric.git

然后打开Idea，创建一个新的项目，类型为Go，选择好SDK，路径设置为刚下载的源码所在的目录。

通过Idea右下角的git图标，可以切换源代码的分支和Tag。

## Vim阅读环境准备

还可以使用Vim阅读代码，Vim的配置过程略微复杂，可以直接使用我已经配置的[插件包][1]。

	git clone --recursive https://github.com/lijiaocn/vim-config.git
	cd vim-config/vim
	./install.sh

## 参考

1. [vim插件包][1]

[1]: https://github.com/lijiaocn/vim-config  "https://github.com/lijiaocn/vim-config" 
