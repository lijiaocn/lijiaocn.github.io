---
layout: default
title:  docker搜索其它registry中的镜像
author: 李佶澳
createdate: 2017/03/27 16:59:53
changedate: 2017/09/11 16:20:20
categories: 问题
tags: docker
keywords: docker,registry,搜索镜像
description: docker搜索其它registry中的镜像

---

## 目录
* auto-gen TOC:
{:toc}

### docker搜索其它registry中的镜像

默认搜索docker.io中的镜像，现在要搜索192.168.1.104中镜像:

	docker search 192.168.1.104:5000/redis
	docker search 192.168.1.104:5000/*
