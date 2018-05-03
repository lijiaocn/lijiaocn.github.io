---
layout: default
title:  hyperledger的cello项目的部署和使用
author: 李佶澳
createdate: 2018/04/25 10:32:00
changedate: 2018/05/03 11:05:44
categories: 方法
tags: hyperledger
keywords: 区块链,hyperledger,cello,blockchain
description: cello是一个用来部署、管理fabric的系统

---

* auto-gen TOC:
{:toc}

## 说明

cello是一个用来部署、管理fabric的系统。

在cello中录入一批机器(host)后，可以在指定的机器上创建chain，也就是部署一个fabric。

cello是一个很初期的系统，当前最大的问题是：

	它在以中心化的方式管理chain!

这里暂时只收录下文档。

## 应用场景

![cello应用场景](http://cello.readthedocs.io/en/latest/imgs/scenario.png)

## 源码

	git clone http://gerrit.hyperledger.org/r/cello && cd cello

## master安装

到cello的项目目录中执行make:

	$ make setup-master

启动全部服务：

	$ make start

重新部署指定服务：

	$ make redeploy service=dashboard

查看日志：

	$ make logs
	$ make log service=watchdog

访问：

	http://MASTER_NODE_IP:8080

## workder安装(docker)

确定dockerd监听2375端口：

	$ sudo systemctl stop docker.service
	$ sudo dockerd -H tcp://0.0.0.0:2375 -H unix:///var/run/docker.sock --api-cors-header='*' --default-ulimit=nofile=8192:16384 --default-ulimit=nproc=8192:16384 -D &

确保在master上能联通workder上的docker:

	docker -H 10.39.0.122:2375 info

到cello项目目录中执行make：

	$ make setup-worker
	cd scripts/worker_node && bash setup.sh
	Downloading fabric images from DockerHub...with tag = 1.0.5... need a while
	...

开启路由功能：

	sysctl -w net.ipv4.ip_forward=1

然后在cello的管理页面中，将worker添加即可。

![区块链实践分享]({{ site.imglocal }}/xiaomiquan-blockchain.jpg)

## 参考

1. [Cello Setup][1]
2. [Cello Master的安装][2]
3. [Cello Worker的安装][3]

[1]: http://cello.readthedocs.io/en/latest/setup/ "Cello Setup"
[2]: http://cello.readthedocs.io/en/latest/setup_master/ "Cello Master的安装" 
[3]: http://cello.readthedocs.io/en/latest/setup_worker_docker/ "Cello Worker的安装"
