---
layout: default
title:  docker搜索其它registry中的镜像
author: lijiaocn
createdate: 2017/03/27 16:59:53
changedate: 2017/03/27 17:01:01
categories: 问题
tags: 问题
keywords: docker,registry,搜索镜像
description: docker搜索其它registry中的镜像

---

* auto-gen TOC:
{:toc}

### docker搜索其它registry中的镜像

默认搜索docker.io中的镜像，现在要搜索192.168.1.104中镜像:

	docker search 192.168.1.104:5000/redis
	docker search 192.168.1.104:5000/*
