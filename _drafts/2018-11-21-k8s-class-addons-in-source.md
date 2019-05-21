---
layout: default
title:  "Kubernetes1.12从零开始（八）：源代码中包含的插件（addons）"
author: 李佶澳
createdate: "2018-11-21 19:45:06 +0800"
changedate: "2019-04-23 14:39:04 +0800"
categories: 项目
tags: 视频教程 kubernetes
Keywords: Kubernetes,基本概念,pod,docker
description: "cluster/addons/中提供了一些插件，值得好好研究一下"
---

* auto-gen TOC:
{:toc}

## 说明

本系列`所有文章`可以在**[系列教程汇总](https://www.lijiaocn.com/tags/class.html)**中找到，`演示和讲解视频`位于**[网易云课堂·IT技术快速入门学院 ](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)**，`课程说明`、`资料`和`QQ交流群`见 **[Kubernetes1.12从零开始（初）：课程介绍与官方文档汇总](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/01/k8s-class-kubernetes-intro.html#说明)**，探索过程遇到的问题记录在：[Kubernetes1.12从零开始（一）：遇到的问题与解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html)。

[Kubernetes1.12从零开始（六）：从代码编译到自动部署][1]中已经用过一次cluster/addons目录中的文件，当时安装的是[dns插件](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/04/k8s-class-build-and-deploy-by-ansible.html#%E5%AE%89%E8%A3%85kube-dns%E6%8F%92%E4%BB%B6)，这里逐渐研究一下其他插件的使用。

## 参考

1. [Kubernetes1.12从零开始（六）：从代码编译到自动部署][1]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/04/k8s-class-build-and-deploy-by-ansible.html "Kubernetes1.12从零开始（六）：从代码编译到自动部署"
