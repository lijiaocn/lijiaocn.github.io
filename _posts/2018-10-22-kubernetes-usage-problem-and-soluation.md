---
layout: default
title:  Kubernetes使用过程中遇到的一些问题与解决方法
author: 李佶澳
createdate: 2018/10/22 14:25:00
last_modified_at: 2018/10/22 14:25:00
categories: 问题
tags: kubernetes_problem
keywords: kubernetes,问题记录
description: 这里记录Kubernetes使用过程中遇到的一些比较的问题与解决方法

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这里记录Kubernetes使用过程中遇到的一些`比较简单`的问题与解决方法，比较复杂的问题会单独分析：[关于Kubernetes的所有文章](https://www.lijiaocn.com/tags/kubernetes.html)。

## kubectl exec登陆容器后，shell终端窗口宽度太小

这个其实不是kubectl的问题，而是shell终端的问题，在shell终端中可以通过变量`COLUMNS`修改宽度：

	export COLUMNS=210

这个变量可以进入容器后设置，也可以在执行exec命令时传入，例如：

	kubectl exec -ti busybox -- env COLUMNS=500 LINES=100 bash 

参考：[解决kubectl exec terminal size问题](http://ju.outofmemory.cn/entry/331098)

## docker无法启动：Failed to start docker.service: Unit not found

在CentOS 7上安装了docker-ce 18.03，启动的时候说是找不到unit，莫名其妙：

	Failed to start docker.service: Unit not found

后来发现是因为机器上的flanneld服务要在docker服务之前启动：

	$ cat /usr/lib/systemd/system/flanneld.service
	[Unit]
	Description=Flanneld overlay address etcd agent
	After=network.target
	After=network-online.target
	Wants=network-online.target
	After=etcd.service
	Before=docker.service
	..

文件/usr/lib/systemd/system/flanneld.service早就被我删除了，但是`/etc/systemd/system/docker.service.requires/`中还有一个flanneld.service，它是个符号链接，链接的文件已经删除：

	$ ls  -l /etc/systemd/system/docker.service.requires/
	total 0
	lrwxrwxrwx 1 root root 40 Jan 26  2018 flanneld.service -> /usr/lib/systemd/system/flanneld.service

将/etc/systemd/system/docker.service.requires/flanneld.service删除后，docker启动成功。

参考[docker.service启动失败：Unit not found](https://www.cnblogs.com/ggsmida/p/6738539.html)
