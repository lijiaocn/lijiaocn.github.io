---
layout: default
title: docker的检查清单
author: lijiaocn
createdate: 2017/03/29 11:11:53
changedate: 2017/07/05 10:55:44
categories: 项目
tags: docker
keywords: docker,使用手册,docker的使用手册
description: 使用docker时的检查清单。

---

* auto-gen TOC:
{:toc}

## 摘要

将在使用docker的时候遇到的一些问题记录在这里, 这样下次使用就可以来这里进行核对, 避免同样的错误。

## 是否在image中正确的设置了时区?

	物理机上的时区正确不意味着docker中的时区也是正确的。

	CentOS设置方式: ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
