---
layout: default
title: docker的社区资源和计划
author: lijiaocn
createdate: 2017/07/18 13:06:43
changedate: 2017/07/29 23:02:29
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

## CentOS安装

如果是centos，会在系统上添加文件:

	/etc/yum.repos.d/docker-ce.repo

然后可以通过yum安装:

	yum install -y docker-ce

也可以到[download.docker.com][2]下载。

	wget https://download.docker.com/linux/centos/docker-ce.repo
	mv docker-ce.repo /etc/yum.repos.d
	yum install -y docker-ce

在/etc/sysctl.conf中添加:

net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-arptables = 1


## 参考

1. [docker release][1]
2. [docker download][2]

[1]: https://github.com/moby/moby/releases  "docker release" 
[2]: https://download.docker.com "docker download"
