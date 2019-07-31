---
layout: default
title: docker、docker-ce、moby的编译
author: 李佶澳
createdate: 2017/07/24 15:47:28
last_modified_at: 2017/12/14 19:03:53
categories: 项目
tags: docker
keywords: docker,build
description: docker项目的编译构建过程

---

## 目录
* auto-gen TOC:
{:toc}


## 说明

最早的时候 docker 是 docker 公司维护的开源项目的名称。

在 2017 年的时候，docker 公司将原先的 docker 项目改名为 [moby][1]。[moby][1] 是面向整个社区开源项目，任何人都可以贡献。docker 公司使用 moby 项目以及其它的项目构建了的自己的产品 [docker-ce][2]。

docker-ce 是 docker 公司维护的免费产品，docker-ee 是 docker 公司的企业产品。

## docker-ce的编译

[docker-ce][2] 是一个项目，第一个版本是`17.06`，docker 以往版本的代码在 [moby][1] 项目中。

	git clone https://github.com/docker/docker-ce.git

然后可以直接构建:

	$make help
	 help                  show make targets
	 test-integration-cli  test integration of cli and engine
	 deb                   build deb packages
	 rpm                   build rpm packages
	 static                build static packages
	 clean                 clean the build artifacts

## moby的编译

	git clone https://github.com/moby/moby.git

## 参考

1. [github: moby][1]
2. [github: docker-ce][2]

[1]: https://github.com/moby/moby  "github moby" 
[2]: https://github.com/docker/docker-ce "docker-ce"
