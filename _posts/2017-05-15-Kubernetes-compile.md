---
layout: default
title: Kubernetes-compile
author: lijiaocn
createdate: 2017/05/15 15:25:04
changedate: 2017/05/15 16:17:52
categories:
tags: k8s
keywords: k8s,kubernetes,compile,编译
description: kubernetes编译有两种方式，直接编译和在docker中编译。

---

* auto-gen TOC:
{:toc}

kubernetes编译有两种方式，直接编译和在docker中编译。

如果是在MAC上操作，需要安装[GNU command tools][3]。

	brew install coreutils
	brew install gnu-tar

## 直接编译 

[Development Guide][1]中给出了直接编译的方法。

构建过程，用make管理:

	make all

## 在容器中编译

[Building Kubernetes][2]中给出了在容器中编译的方法。

如下所示，make命令将在容器中运行。

	build/run.sh make all

## 参考

1. [k8s development Guide][1]
2. [Building Kubernetes][2]
3. [Install and Use GNU Command Line Tools on macOS/OS X][3] 

[1]: https://github.com/kubernetes/community/blob/master/contributors/devel/development.md "k8s development"
[2]: https://github.com/kubernetes/kubernetes/blob/885ddcc1389bf744f00e7a5f96fbff5515423022/build/README.md "Building Kubernetes"
[3]: https://www.topbug.net/blog/2013/04/14/install-and-use-gnu-command-line-tools-in-mac-os-x/ "Install and Use GNU Command Line Tools on macOS/OS X"
