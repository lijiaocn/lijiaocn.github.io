---
layout: default
title:  "Kubernetes容器集群从零开始：Docker入门"
author: 李佶澳
createdate: 2018/09/01 15:12:00
changedate: 2018/09/02 23:11:20
categories: 项目
tags: docker kubernetes 
keywords: kubernetes,容器集群,docker
description: 这里对docker做一个系统的梳理，重点是说明docker是什么，怎么用，文档在哪里

---

* auto-gen TOC:
{:toc}

## 说明

用前辈们的话来说，Docker没有什么新技术，是一些老技术的组合。但组合，也是一种创新，正如刚问世的iphone也是一堆已有技术的组合。

要想知道Docker是什么，最好的方式当然是查看[Docker的Website][1]。但官网上刻板、教条的[文档][2]，对初学者来说实在是不友好，所以有了这篇文章。

## Docker官方文档介绍

Docker官方文档的地址是：[https://docs.docker.com/ ][2]。

需要注意的是，Docker作为一家私立公司是有自己的盈利目标和战略规划的。它曾经开发了一套叫做"[Swarm][3]"的系统，试图在更高层面上占有一席之地。
不幸的是，这个项目基本上可以宣告为失败，Google主导的[Kubernetes][4]成了最后的赢家和事实上标准。

但是自己家的狗粮，含泪也要吃下去，在Docker的文档中还有不少关于Swarm以及Docker公司其它产品的内容，对于这些内容可以少投入或者不投入时间了解，因为对
我们来说，Docker就是一个运行容器的引擎，我们对它的诉求仅此一点，Docker公司其它的产品，我们不关心。

对于绝大多数Docker的使用者来说，最常用的文档页应当是[Docker Document Reference][5]。

另外，对于入门的同学来说， [Docker Get Started][6]也是一份不错的文档，不过当然比不过我这篇附带有[视频讲解和操作演示](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)的文档。

## Docker的版本

Docker现在分为社区版[Docker CE][7]和企业版[Docker EE][8]。企业版有更多的特性，但是收费。

有人会问：Docker不是开源的吗？怎么还会有特性差异？

这就要谈起Docker的一段历史了，最开始的时候，Docker是Docker公司的产品，同时也是这个开源项目的名字。后来可能是出于盈利的考虑，Docker公司将Docker项目的名称
改成了[Moby][9]，Docker不再是一个项目的名字，而纯粹是Docker公司的产品名称。

Moby继承了原先开源的Docker代码，这个项目是Docker的母体，Docker-CE和Docker-EE使用的都是Moby项目中的代码。但是
Docker公司在维护开源的[Moby][9]项目的同时，还做了一些不开源的私有工作，这些工作被集成到了收费的[Docker EE][8]中。

版本的发布计划和源代码编译方式，可以参考之前的两篇笔记：[moby、docker-ce与docker-ee][10]、[docker、docker-ce、moby的编译][11]。

在下面的章节中，提到的docker默认为docker ce。

## Docker的安装

Docker支持多个平台，在[supported platforms][12]中给出的每个支持平台的链接中，详细介绍了安装方法。

这里以CentOS上的安装为例：[Get Docker CE for CentOS][13]。

安装方法有三种，第一种是安装包含了docker的repo之后，用yum命令安装，第二种是将docker的rpm包下载下来，再用yum安装，第三种是用docker提供的shell脚本安装。

没啥意外应该使用第一种方式，如果生产环境中的服务器不能随意联网，用第二种方式。

安装repo：

	yum install -y yum-utils
	yum-config-manager  --add-repo https://download.docker.com/linux/centos/docker-ce.repo

如果容器文件存储使用device mapper，还需要安装lvm等工具：

	yum install -y yum-utils device-mapper-persistent-data lvm2

什么是device mapper以及容器文件存储是怎么回事，后面讲到docker的原理的时候再详细说明。

device mapper可以参考以前的两篇笔记：[device mapper：linux的device mapper原理与使用][14]、[lvm：lvm的使用][15]

版本v1.13.1之后，Docker每三个月发布一个稳定(Stable)版，每个月发布一个Edge版，另外还有测试版本。

在前面安装的repo中默认启用了stable版本，如果要用edge或者test版本，需要分别用下面的命令启用：

	yum-config-manager --enable docker-ce-edge
	yum-config-manager --enable docker-ce-test

然后就可以直接安装docker：

	yum install docker-ce

如果要特别安装某一个版本的docker，可以用下面的命令查看所有支持的docker版本，然后指定全名安装：

	yum list docker-ce --showduplicates | sort -r
	yum install docker-ce-<VERSION STRING>

安装完成之后启动：

	systemctl start docker

## Docker的配置

一般情况下使用Docker默认的配置就可以了，但保不齐什么时候会有更改配置的需求，所以需要了解一下Docker的配置。

[Post-installation steps for Linux][16]中列出了一些常用的配置，比如允许非root用户使用docker、设置开机启动、更改存储引擎、更改监听地址等。

[Post-installation steps for Linux][16]中给出的说明和操作已经非常具体了，这里不赘述，只说一下`/etc/docker/daemon.json`。

Docker的配置参数可以在启动dockerd的时候，在命令行指定，也可以在`/etc/docker/daemon.json`中指定。

Docker是由负责容器管理的服务端dockerd，和用来操作的docker命令组成的，修改配置主要是修改docker的配置，文档[Dockerd CLI Usage][17]中列出了Dockerd所有
的命令行参数，并做了详细地说明。

其中`--config-file`是用来指定配置文件，默认为`/etc/docker/daemon.json`，[docker daemon configuration file][18]中给出了这个文件的完整格式。

## Docker的使用

参考以前的笔记： [docker的常用操作][19]。

## Docker的原理

可以先阅读一下以前的笔记：[一个最简容器的实现][20]。

## 参考

1. [Docker Website][1]
2. [Docker Document][2]
3. [Docker Swarm][3]
4. [Kubernetes Website][4]
5. [Docker Document Reference][5]
6. [Docker Get Started][6]
7. [Docker CE][7]
8. [Docker EE][8]
9. [Moby][9]
10. [moby、docker-ce与docker-ee][10]
11. [docker、docker-ce、moby的编译][11]
12. [Docker ce support platforms][12]
13. [Get Docker CE for CentOS][13]
14. [device mapper：linux的device mapper原理与使用][14]
15. [lvm：lvm的使用][15]
16. [Post-installation steps for Linux][16]
17. [Dockerd CLI Usage][17]
18. [docker daemon configuration file][18]
19. [docker的常用操作][19]
20. [一个最简容器的实现][20]

[1]: https://www.docker.com/ "Docker Website" 
[2]: https://docs.docker.com/  "Docker Document" 
[3]: https://docs.docker.com/swarm/ "Docker Swarm"
[4]: https://kubernetes.io/ "Kubernetes Website"
[5]: https://docs.docker.com/reference/ "Docker Document Reference"
[6]: https://docs.docker.com/get-started/ "Docker Get Started"
[7]: https://docs.docker.com/install/ "Docker CE"
[8]: https://docs.docker.com/ee/supported-platforms/ "Docker EE"
[9]: https://github.com/moby/moby "Moby"
[10]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/07/18/docker-commnuity.html "moby、docker-ce与docker-ee"
[11]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/07/24/docker-build.html "docker、docker-ce、moby的编译"
[12]: https://docs.docker.com/install/#supported-platforms "Docker ce support platforms"
[13]: https://docs.docker.com/install/linux/docker-ce/centos/ "Get Docker CE for CentOS"
[14]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/07/linux-tool-devicemapper.html "device mapper：linux的device mapper原理与使用"
[15]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/07/05/linux-tool-lvm.html "lvm：lvm的使用"
[16]: https://docs.docker.com/install/linux/linux-postinstall/ "Post-installation steps for Linux"
[17]: https://docs.docker.com/engine/reference/commandline/dockerd/ "Dockerd CLI Usage"
[18]: https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-configuration-file "docker daemon configuration file"
[19]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/03/29/docker-usage.html "docker的常用操作"
[20]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2015/02/25/%E4%B8%80%E4%B8%AA%E6%9C%80%E7%AE%80%E5%AE%B9%E5%99%A8%E7%9A%84%E5%AE%9E%E7%8E%B0.html "一个最简容器的实现"
