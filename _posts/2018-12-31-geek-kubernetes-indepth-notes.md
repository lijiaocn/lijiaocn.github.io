---
layout: default
title: 《深入剖析Kubernetes》专栏的阅读笔记(持续更新)
author: 李佶澳
createdate: 2018/09/20 22:37:00
changedate: 2018/09/28 00:23:19
categories: 好货
tags: 阅读笔记
keywords: 极客时间,Kubernetes,docker,张磊,深入剖析,原理
description: 张磊是《Docker容器与容器云》的作者，Kubernetes多个核心特性的作者之一。他在极客时间

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

张磊是《Docker容器与容器云》的作者，Kubernetes多个核心特性的作者之一。他在极客时间开了一个收费专栏，我订阅了。我把阅读过程中了解到的一些新知识记录在这里。

注意：因为我研究Docker和Kubernetes比较早，这个专栏里的大部分内容对我来说都已知的，这里主要记录我以前不知道的内容。

## 极客时间介绍

最早抱着试一试的态度，订阅了左耳朵耗子的[《左耳听风》](https://www.lijiaocn.com/%E5%A5%BD%E8%B4%A7/2018/10/09/geek-chenghao-zhuanlan.html)，读了几篇之后发现内容不错。和买一本书差不多，但是内容是最新的、持续更新，可以在地铁上用手机阅读，可以在评论中与作者和其它读者互动。

订阅之后可以在移动端和PC端`永久阅读`。**新用户可以领取** ：[极客时间首次注册30元优惠券](https://time.geekbang.org/activity/getinvite?gk_ucode=E274D90C022D49)

## 《深入剖析Kubernetes》专栏介绍

专栏详情可以直接扫码查看，有很详细的内容目录，并且可以试读。

<span style="display:block;text-align:center">![深入剖析Kubernetes极客时间专栏介绍]({{ site.imglocal }}/geek/kubernetes.jpeg){: width="250px"}</span>

## 让top显示容器自己的状态 —— 06 | 白话容器基础（二）：隔离与限制 

在容器中用`top`命令看到的是宿主机的状态，要怎样做才能够在容器中看到容器的状态呢？

从评论中得知，可以用lxcfs实现。

top命令是从`/proc/stats`目录中读取数据的，因为容器中挂载的是宿主机的目录所以读到的是宿主机信息。
使用lxcfs之后，将lxcfs伪造的proc目录`/var/lib/lxcfs/proc/*`挂载到容器中，使`top`等命令从lxcfs中读取数据。

注: 还没有尝试 @2018-09-20 23:20:02

## 容器的根文件系统的形成方式与修改原理 —— 07 | 白话容器基础（三）：深入理解容器镜像 

这一章的大部分内容对我来说比较容易，很早之前就了解过容器的原理：[一个最简容器的实现][1]。
但是镜像部分没有深入了解，后半部对`Docker如何应用aufs`的讲解，对我很有用。

`image inspect`命令可以查看镜像的分层：

	$ docker image inspect ubuntu:latest
	...      
	"RootFS": {      
		"Type":"layers",
		"Layers": [        
			"sha256:f49017d4d5ce9c0f544c...",        
			"sha256:8f2b771487e9d6354080...",        
			"sha256:ccd4d61916aaa2159429...",        
			"sha256:c01d74f99de40e097c73...",        
			"sha256:268a067217b5fe78e000..."
		]
	}

使用AUFS的方式，挂载点在`/var/lib/docker/aufs/mnt/`，里面是一个完整的rootfs：

	/var/lib/docker/aufs/mnt/6e3be5d2ecccae7cc0fcfa2a2f5c89dc21ee30e166be823ceaeba15dce645b3e

关键是镜像的多个分层是怎样“捏合”成这个挂载点的，可以在`/proc/mounts`中找到这个挂载目录的详细信息：

	$ cat /proc/mounts| grep  "6e3be5d2ecccae7cc0":w
	none /var/lib/docker/aufs/mnt/6e3be5d2ecccae7cc0fc... aufs rw,relatime,si=972c6d361e6b32ba,dio,dirperm1 0 0

这里的`si=972c6d361e6b32ba`是找到镜像中另外多个分层挂载信息关键，在目录`/sys/fs/aufs/`中查找：

	$ cat /sys/fs/aufs/si_972c6d361e6b32ba/br[0-9]*
	/var/lib/docker/aufs/diff/6e3be5d2ecccae7cc...=rw
	/var/lib/docker/aufs/diff/6e3be5d2ecccae7cc...-init=ro+wh
	/var/lib/docker/aufs/diff/32e8e20064858c0f2...=ro+wh
	/var/lib/docker/aufs/diff/2b8858809bce62e62...=ro+wh
	/var/lib/docker/aufs/diff/20707dce8efc0d267...=ro+wh
	/var/lib/docker/aufs/diff/72b0744e06247c7d0...=ro+wh
	/var/lib/docker/aufs/diff/a524a729adadedb90...=ro+wh

后五个只读层和第一个读写层好理解，详情可以去看专栏。有意思的第二个`init=ro+wh`层。

`init`层是Docker项目生成的，专门用来存放/etc/hosts、/etc/resolve.conf等信息的层。这些信息需要是可修改的，但不能被提交到镜像中。

Docker单独设计了可修改的`init`层，docker commit提交镜像的时候，init层会被忽略，不被包含在镜像中。

如果在读写层中修改下面的只读层中的文件，会使用`copy-on-write`的方法，将文件从只读层复制到读写层后，在读写层修改，从上面看起来就覆盖了下面的同名文件。

如果要在读写层中删除下面的只读层中的文件，则是在只读层里创建一个`.文件名`的whiteout(ro+wh中的wh)文件，挡住下面的只读层中的文件。

aufs文件系统的知识有必要了解一下，还有devicemapper、btrfs、overlayfs、vfs、zfs等。

这一章给出了一个技能图谱，很实用：

![Kubernetes技能图谱](https://static001.geekbang.org/resource/image/0d/cb/0da944e5bac4fe1d00d3f01a747e86cb.jpg)

## 为什么需要Kubernetes，与Borg的关系 —— 09 | 从容器到容器云：谈谈Kubernetes的本质 

之前阅读Borg论文的时候做过笔记：[Borg论文阅读笔记][2]

这里提到的[Google Stack][3]很赞！

![Google Stack](https://static001.geekbang.org/resource/image/c7/bd/c7ed0043465bccff2efc1a1257e970bd.png)

kubelet通过gRPC 协议同一个叫作 Device Plugin 的插件进行交互。这个插件，是 Kubernetes 项目用来管理 GPU 等宿主机物理设备的主要组件，也是基于 Kubernetes 项目进行机器学习训练、高性能作业支持等工作必须关注的功能。

## 怎样部署Kubernetes —— 10 | Kubernetes一键部署利器：kubeadm

主要介绍了kubeadm的用法，kubeadm用起来很简单，但还不能用于生产！

推荐使用kops或者 SaltStack 这样更复杂的部署工具。

以前写过一套Ansible部署脚本[kubefromscratch-ansible](https://github.com/introclass/kubefromscratch-ansible)。

## 参考

1. [一个最简容器的实现][1]
2. [Borg论文阅读笔记][2]
3. [Google Stack][3]
4. [《左耳听风》陈皓专栏的阅读笔记(持续更新)][4]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2015/02/25/%E4%B8%80%E4%B8%AA%E6%9C%80%E7%AE%80%E5%AE%B9%E5%99%A8%E7%9A%84%E5%AE%9E%E7%8E%B0.html  "一个最简容器的实现" 
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/02/22/borg-note.html "Borg论文阅读笔记"
[3]: http://malteschwarzkopf.de/research/assets/google-stack.pdf "Google Stack"
[4]: https://www.lijiaocn.com/%E5%A5%BD%E8%B4%A7/2018/10/09/geek-chenghao-zhuanlan.html "《左耳听风》陈皓专栏的阅读笔记(持续更新)"
