---
layout: default
title: "docker 使用：moby、docker-ce 与 docker-ee 的关系"
author: 李佶澳
createdate: 2017/07/18 13:06:43
last_modified_at: 2017/12/14 18:49:27
categories: 项目
tags: docker
keywords: docker,community
description: docker的社区资源和社区计划

---

## 目录
* auto-gen TOC:
{:toc}

## moby、docker-ce与docker-ee

最早的时候 docker 就是一个开源项目，主要由 docker 公司维护。

在 2017 年的时候，docker 公司将原先的 docker 项目改名为 [moby][1]。[moby][1] 是面向整个社区开源项目，任何人都可以贡献。docker 公司使用 moby 项目以及其它的项目构建了的自己的产品 [docker-ce][4]。

docker-ce 是 docker 公司维护的免费产品，docker-ee 是 docker 公司的企业产品。

```
moby 是继承了原先的 docker 的项目，是社区维护的的开源项目，谁都可以在 moby 的基础打造自己的容器产品
docker-ce 是 docker 公司维护的开源项目，是一个基于 moby 项目的免费的容器产品
docker-ee 是 docker 公司维护的闭源产品，是 docker 公司的商业产品。
```

[moby][3] 由社区维护，[docker-ce][6] 是 docker 公司维护，docker-ee 是闭源的。

免费的 docker-ce 从网页 [docker-ce][4] 上获取。

收费的 docker-ee 从网页 [docker-ee][5] 上获取。

## docker-ce 的发布计划

v1.13.1 之后，发布计划更改为:

	Edge:   月版本，每月发布一次，命名格式为YY.MM，维护到下个月的版本发布
	Stable: 季度版本，每季度发布一次，命名格式为YY.MM，维护4个月

docker-ce 的 [release 计划][7]跟随 moby 的 [release计划][1]，可以使用下面的命令直接安装最新的 docker-ce:

	curl -fsSL https://get.docker.com/ | sh

### CentOS

如果是 CentOS，上面的安装命令会在系统上添加 yum 源:

	/etc/yum.repos.d/docker-ce.repo

然后用 yum 安装:

	yum install -y docker-ce

yum 源文件和 rpm 包都在网页 [download.docker.com][2]中，可以自己下载安装:

	wget https://download.docker.com/linux/centos/docker-ce.repo
	mv docker-ce.repo /etc/yum.repos.d
	yum install -y docker-ce

或者直接下载 rpm 安装:

	wget https://download.docker.com/linux/centos/7/x86_64/stable/Packages/docker-ce-17.09.0.ce-1.el7.centos.x86_64.rpm
	yum localinstall docker-ce-17.09.0.ce-1.el7.centos.x86_64.rpm

## docker-ce的编译

[docker-ce][6] 是一个项目，第一个版本是`17.06`，docker 以往版本的代码在 [moby][1] 项目中。

	git clone https://github.com/docker/docker-ce.git

然后可以直接构建:

```sh
$ make help
 help                  show make targets
 test-integration-cli  test integration of cli and engine
 deb                   build deb packages
 rpm                   build rpm packages
 static                build static packages
 clean                 clean the build artifacts
```

## moby的编译

```sh
git clone https://github.com/moby/moby.git
```

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
