---
layout: default
title: docker的社区资源和计划
author: lijiaocn
createdate: 2017/07/18 13:06:43
changedate: 2017/07/18 15:03:58
categories: 项目
tags: docker
keywords: docker,community
description: docker的社区资源和社区计划

---

* auto-gen TOC:
{:toc}

## 发布计划

docker从v1.13.1之后，将发布计划更改为:

	月版本: 每月发布一次，命名格式为YY.MM，维护到下个月的版本发布
	季版本: 每季度发布一次，命名格式为YY.MM，维护4个月

版本发布在在[docker release][1]中，可以通过下面命令安装dep/rpm形式发布的docker：

	curl -fsSL https://get.docker.com/ | sh

如果是centos，会在系统上添加文件:

	/etc/yum.repos.d/docker-ce.repo

然后可以通过yum安装:

	yum install -y docker-ce

也可以到[download.docker.com](https://download.docker.com)下载。

## 参考

1. [docker release][1]

[1]: https://github.com/moby/moby/releases  "docker release" 
