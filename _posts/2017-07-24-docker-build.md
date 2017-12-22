---
layout: default
title: docker、docker-ce、moby的编译
author: lijiaocn
createdate: 2017/07/24 15:47:28
changedate: 2017/12/14 19:03:53
categories: 项目
tags: docker
keywords: docker,build
description: docker项目的编译构建过程

---

* auto-gen TOC:
{:toc}


## 说明

最早的时候docker是一个开源项目，主要由docker公司维护。

在2017年的时候，docker公司将原先的docker项目改名为[moby][1]。[moby][1]是面向整个社区开源的，任何人都可以贡献。

docker公司使用moby项目以及其它的项目构建了的自己的产品[docker-ce][2]。

docker-ce是开源的，是只有docker公司才能维护的产品，docker-ee是docker公司的闭源的企业产品。

## docker-ce的编译

[docker-ce][2]是一个新建的项目，第一个版本是`17.06`，docker以往版本的代码在[moby][1]项目中。

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
