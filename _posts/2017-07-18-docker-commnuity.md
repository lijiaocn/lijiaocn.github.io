---
layout: default
title: Moby、docker-ce与docker-ee
author: lijiaocn
createdate: 2017/07/18 13:06:43
changedate: 2017/09/11 16:22:30
categories: 项目
tags: docker
keywords: docker,community
description: docker的社区资源和社区计划

---

* auto-gen TOC:
{:toc}

## moby、docker-ce与docker-ee

最早的时候docker就是一个开源项目，主要由docker公司维护。

2017年年初，docker公司将原先的docker项目改名为moby，并创建了docker-ce和docker-ee。

这三者的关系是：

	moby是继承了原先的docker的项目，是社区维护的的开源项目，谁都可以在moby的基础打造自己的容器产品
	docker-ce是docker公司维护的开源项目，是一个基于moby项目的免费的容器产品
	docker-ee是docker公司维护的闭源产品，是docker公司的商业产品。

[moby project][3]由社区维护，[docker-ce project][6]是docker公司维护，docker-ee是闭源的。

要使用免费的docker，从网页[docker-ce][4]上获取。

要使用收费的docker，从网页[docker-ee][5]上获取。

## docker-ce的发布计划

v1.13.1之后，发布计划更改为:

	Edge:   月版本，每月发布一次，命名格式为YY.MM，维护到下个月的版本发布
	Stable: 季度版本，每季度发布一次，命名格式为YY.MM，维护4个月

[docker-ce的release计划][7]跟随[moby的release计划][1]，可以使用下面的命令直接安装最新的docker-ce:

	curl -fsSL https://get.docker.com/ | sh

### CentOS

如果是centos，上面的安装命令会在系统上添加yum源:

	/etc/yum.repos.d/docker-ce.repo

然后用yum安装:

	yum install -y docker-ce

yum源文件和rpm包都在网页[download.docker.com][2]中，可以自己下载安装:

	wget https://download.docker.com/linux/centos/docker-ce.repo
	mv docker-ce.repo /etc/yum.repos.d
	yum install -y docker-ce

## 参考

1. [moby release][1]
2. [docker download][2]
3. [moby][3]
4. [docker-ce][4]
5. [docker-ee][5]
6. [docker-ce code][6]
7. [docker-ce release][7]

[1]: https://github.com/moby/moby/releases  "moby release" 
[2]: https://download.docker.com "docker download"
[3]: https://github.com/moby/moby  "moby" 
[4]: https://github.com/docker/docker-ce "docker-ce"
[5]: https://www.docker.com/enterprise-edition "docker-ee"
[6]: https://github.com/docker/docker-ce "docker-ce code"
[7]: https://github.com/docker/docker-ce/releases "docker-ce release"
