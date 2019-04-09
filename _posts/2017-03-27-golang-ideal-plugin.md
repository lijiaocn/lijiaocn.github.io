---
layout: default
title: Golang开发环境-使用idea
author: 李佶澳
createdate: 2017/03/27 17:38:05
changedate: 2018/07/16 17:20:35
categories: 技巧
tags: golang
keywords: golang,idea,IDE
description: 在idea中安装golang插件

---

* auto-gen TOC:
{:toc}

## 激活方法

v2017.1.4:

	When you have to enter the license, change to [License server]
	
	In the Server URL input field enter:
	
	    http://idea.imsxm.com. 
	
	Click on [Ok] and everything should work

v15.0.2:

	use http://idea.lanyus.com as license server. 
	This site is maybe locked in some regions, to bypass it use:
	    http://nfsgkyi.nrqw46lvomxgg33n.dresk.ru

v14.1.5:

	08874-ECE2P-YNS1I-EZQXU-GZXVH-DV070
All in all there are now 7 license server:

	http://idea.lanyus.com          - For IntelliJ 15.0.2 and older
	http://nfsgkyi.nrqw46lvomxgg33n.dresk.ru
	http://idea.qinxi1992.cn        - Worked until IntelliJ 2016.1.4
	http://114.215.133.70:41017     - For IntelliJ 2016.2 and later
	http://jetbrains.tencent.click  - For IntelliJ 2016.2.4 / 2016.3 / 2016.3.1
	http://jetbrains.tech           - For IntelliJ 2017.1 (Offline)
	http://idea.imsxm.com           - For IntelliJ 2017.1.4

## 安装golang插件

1 打开Idea -> Perferences，点击“Plugins”，打开插件管理窗口

2 点击“ Browse repositories”，打开插件仓库管理窗口

3 在“Browse repositories”窗口搜索名为`"Go"`的插件，安装即可（注意不要用名为Golang的插件）

4 安装插件之后，重启idea。

插件安装期间，idea最底部会显示安装进度，如果提示超时安装失败，可能需要翻qiang。

(当前go插件不支持go1.10.x版本，@2018-07-16 13:20:30)

如果习惯用vim，还可以安装一个vim插件。

## 配置Go语言环境

### 先安装Go

到[golang.org](https://golang.org)或者[www.golangtc.com](https://www.golangtc.com)下载Go安装文件。

下载后解压即可：

	$ mkdir -p ~/Work/Bin/go-1.9.7
	$ cd ~/Work/Bin/go-1.9.7
	$ wget https://dl.google.com/go/go1.9.7.darwin-amd64.tar.gz  (这里下载的是mac版)
	$ tar -xvf go1.9.7.darwin-amd64.tar.gz

并在~/.bash_profile中设置环境变量：

	export PATH="/Users/lijiao/Work/Bin/go-1.9.7/go/bin:$PATH"
	export GOROOT="/Users/lijiao/Work/Bin/go-1.9.7/go"
	export GOPATH="/Users/lijiao/Work/Bin/gopath"
	export PATH="$GOPATH/bin/:$GOPATH:$PATH"

更新：

	source ~/.bash_profile

### 设置Idea

打开Idea -> Perferences -> Languages & Frameworks -> Go

分别设置GOROOT和GOPATH，以及保存时的动作。

	GOROOT指定使用Go安装文件目录
	GOPATH指定用来存放Go代码、以及编译文件的目录

可以在GOPATH中添加多个路径。

Go插件使idea具有goland的所有功能。

语法高亮到Perferences -> Editor -> Colors & Fonts -> Go中设置。

## 代码自动格式化

Idea -> Perferences -> Tool -> File Wathcers，在右侧窗口中添加`go fmt`和`goimports`。

## 使用Idea查看HyperLedger Fabric的代码

先下载代码：

	go get github.com/hyperledger/fabric

或者：

	mkdir -p $GOPATH/src/github.com/hyperledger
	cd $GOPATH/src/github.com/hyperledger
	git clone https://github.com/hyperledger/fabric.git

然后打开Idea，创建一个新的项目，类型为Go，并选择好SDK，路径为刚下载的源码。

## 参考

1. [idea crack][1]

[1]: https://www.haxotron.com/jetbrains-intellij-idea-crack-123/  "idea crack" 
