---
layout: default
title: docker项目的编译构建
author: lijiaocn
createdate: 2017/07/24 15:47:28
changedate: 2017/08/09 15:45:27
categories: 项目
tags: docker
keywords: docker,build
description: docker项目的编译构建过程

---

* auto-gen TOC:
{:toc}


## 说明

最早的时候docker就是一个开源项目，主要由docker公司维护。

在2017年的时候，docker公司将原先的docker项目改名为[Moby][1]。[Moby][1]是面向整个社区开源的，任何人都可以贡献。

docker公司使用moby项目以及其它的项目构建了的自己的产品[docker-ce][2]。

docker-ce是开源的，是只有docker公司才能维护的产品，docker-ee是docker公司的闭源的企业产品。

## 编译docker-ce

	git clone https://github.com/docker/docker-ce.git

然后可以直接构建:

	$make help
	 help                  show make targets
	 test-integration-cli  test integration of cli and engine
	 deb                   build deb packages
	 rpm                   build rpm packages
	 static                build static packages
	 clean                 clean the build artifacts

## 参考

1. [github moby][1]
2. [docker-ce][2]

[1]: https://github.com/moby/moby  "github moby" 
[2]: https://github.com/docker/docker-ce "docker-ce"
