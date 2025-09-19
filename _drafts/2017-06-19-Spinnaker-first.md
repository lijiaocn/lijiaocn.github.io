---
layout: default
title: Spinnaker初次了解
author: lijiaocn
createdate: 2017/06/19 09:27:42
last_modified_at: 2017/06/19 10:53:06
categories: 项目
tags: spinnaker
keywords: spinnaker,入门,初次使用
description: spinnaker是Netflix开发一个持续部署系统，特点是支持AWS、Google Cloud、Azure、k8s、Openstack等多种平台。

---

* auto-gen TOC:
{:toc}

## docker-compose本地部署

从[spinnaker github][2]下载源码：

	git clone  https://github.com/spinnaker/spinnaker.git
	cd spinnaker/experimental/docker-compose
	DOCKER_IP=127.0.0.1 docker-compose -f docker-compose.yml up -d

## 参考

1. [spinnaker website][1]
2. [spinnaker github][2]
3. [spinnaker architecture][3]

[1]: https://www.spinnaker.io/  "spinnaker" 
[2]: https://github.com/spinnaker/spinnaker  "spinnaker github" 
[3]: https://www.spinnaker.io/reference/architecture/ "spinnaker architecture"
