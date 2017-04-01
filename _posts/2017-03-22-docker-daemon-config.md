---
layout: default
title: 配置docker daemon运行参数的几种方式
author: lijiaocn
createdate: 2017/03/29 11:11:53
changedate: 2017/03/29 14:07:11
categories:
tags: docker 问题
keywords: docker,daemon,运行参数
description: 配置docker deamon运行参数的几种方式。可以通过服务的配置文件或者daemon.json。

---

* auto-gen TOC:
{:toc}

## 方式1，在服务配置文件中配置

如果是CentOS，可以在"/etc/sysconfig/docker"中添加启动参数：

	OPTIONS='--selinux-enabled --log-driver=journald --signature-verification=false"

这里配置的参数，将会作为docker daemon的启动参数，通过"ps |grep docker"可以看到：

	/usr/bin/dockerd-current --add-runtime docker-runc=/usr/libexec/docker/docker-runc-current --default-runtime=docker-runc --exec-opt native.cgroupdriver=systemd --userland-proxy-path=/usr/libexec/docker/docker-proxy-current --selinux-enabled --log-driver=journald --signature-verification=false --registry-mirror=https://pee6w651.mirror.aliyunc

## 方式2，在/etc/docker/daemon.json中配置

docker启动的时候会自动加载/etc/docker/deamon.json，读取其中的配置。通过这种方式配置的参数在"ps |grep docker"中看不到：

	$cat /etc/docker/daemon.json
	{
	    "live-restore": true,
	    "insecure-registries": ["docker-registry.i.bbtfax.com:5000"]
	}

注意同一个参数只能使用一种方式配置，如果既在配置文件中配置了，也在daemon.json中配置了，docker daemon将会启动失败。
