---
layout: default
title:  "Kubernetes1.12从零开始（二）：部署环境准备"
author: 李佶澳
createdate: 2018/09/03 20:43:00
changedate: 2018/09/04 17:24:51
categories: 项目
tags: 视频教程 kubernetes
keywords: kubernetes,容器集群,docker
description: 这一节准备一下接下来将要使用的环境

---

* auto-gen TOC:
{:toc}

## 说明

这一节准备一下接下来将要使用的环境。我这里使用的是三个运行CentOS 7的虚拟机，用vagrant管理的virtualbox。使用哪种虚拟化软件没有关系，virtualbox、vmware都可以了，vagrant只是一个方便创建启动虚拟机的工具，也不是必须的。

本系列所有文章可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到，[Kubernetes1.12从零开始（一）：遇到的问题与解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/10/01/k8s-class-problem-and-soluation.html)记录了探索过程遇到的问题。

## Vagrant和VirtualBox

[Vagrant][2]是一个虚拟化管理软件，它本身是一个命令行工具，可以通过它方便的创建、设置虚拟机，可以节对接virtualbox、vmware等虚拟化软件，甚至aws的云端虚拟机。

可以到Vagrant的[官网][2]上了解详情，后续操作只用到了最常的几个指令，见[虚拟化技术汇总-工具Vagrant][1]。

在Mac上的安装方法：

	brew cask install virtualbox
	brew cask install vagrant

到网址[Discover Vagrant Boxes](https://app.vagrantup.com/boxes/search?provider=virtualbox&q=centos&sort=downloads&utf8=%E2%9C%93)中，找到virutalbox的CentOS 7镜像，然后下载到本地：

	$ vagrant box add centos/7
	==> box: Loading metadata for box 'centos/7'
	    box: URL: https://vagrantcloud.com/centos/7
	This box can work with multiple providers! The providers that it
	can work with are listed below. Please review the list and choose
	the provider you will be working with.
	
	1) hyperv
	2) libvirt
	3) virtualbox
	4) vmware_desktop
	
	Enter your choice: 3
	==> box: Adding box 'centos/7' (v1809.01) for provider: virtualbox
	    box: Downloading: https://vagrantcloud.com/centos/boxes/7/versions/1809.01/providers/virtualbox.box
	    box: Download redirected to host: cloud.centos.org
	    box: Progress: 0% (Rate: 2156/s, Estimated time remaining: 90:05:49)

在国内下载可能会非常慢，我挂着翻`qiang`的vpn通过从香港下载快一些，可以想办法先把网址 “https://vagrantcloud.com/centos/boxes/7/versions/1809.01/providers/virtualbox.box” 中的virtualbox.box文件下载下来。然后用`vagrant box add ./virtualbox.box`加载。

加载完成之后，用vagrant box list可以看到本地可以用的虚拟机镜像：

	$ vagrant box list
	centos/7 (virtualbox, 1809.01)

[VirtualBox][3]没什么好说的，它和vmware都是本地虚拟化软件，virtualbox是开源的，后来被Oracle收购了。

用了vagrant之后，完全可以不接触virtualbox的管理界面，因为虚拟机的相关配置直接通过vagrant设置就可以了。

## 创建虚拟机

上一节准备好CentOS 7的虚拟机镜像之后，这一节创建虚拟机。先创建三个目录，每个虚拟机一个：

	➜  mkdir node{1,2,3}
	➜  ls
	node1 node2 node3

node1虚拟机准备：

	cd node1
	vagrant init centos/7

node1目录中会生成一个名为Vagrantfile的文件，在其中被注掉的一行去掉注释，并将地址更改为88.10：

	config.vm.network "private_network", ip: "192.168.88.11"

同时设置一下内存和CPU，注意把vb.gui设置为false，不然启动时会弹出virtualbox窗口：

	config.vm.provider "virtualbox" do |vb|
	  # Display the VirtualBox GUI when booting the machine
	  vb.gui = false
	
	  # Customize the amount of memory on the VM:
	  vb.memory = "1024"
	  vb.cpus = "2"
	end

>CPU最少两个，不然可能会影响Kubernetes一些组件的运行（资源不足，部署失败）。

然后执行下面的命令启动虚拟机，并登陆虚拟机：

	vagrant up
	vagrant ssh

要推出虚拟机，直接exit就可以了。

用同样方式准备node2和node3，不同的是分别将它们的IP地址配置为`192.168.88.12`、`192.168.88.13`。

## 如果你用其它的方式创建虚拟机，要创建host模式网卡

使用Vagrant创建虚拟机的时候，在Vagrantfile中设置了IP之后：

	config.vm.network "private_network", ip: "192.168.88.11"

会自动在虚拟机中创建一个host模式的网卡，并将它的IP按照配置文件进行设置。

我们后续部署的Kubernetes集群，组件之间通信都用这个host模式网卡的IP。

如果你是直接用vmware或者virtualbox等创建的虚拟机，注意在它们的管理页面中添加一个host模式的网卡。

## 虚拟机时间同步

虚拟机的时间需要保持一致，否则可能导致证书认定失败。这里用ntp进行时间同步：

	sudo yum install ntp
	sudo systemctl start ntpd
	sudo systemctl enable ntpd

## 参考

1. [虚拟化技术汇总-工具Vagrant][1]
2. [vagrant][2]
3. [virtualbox][3]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2015/12/10/%E8%99%9A%E6%8B%9F%E5%8C%96.html#vagrant "虚拟化技术汇总-工具Vagrant"
[2]: https://www.vagrantup.com/ "vagrant"
[3]: https://www.virtualbox.org/ "virtualbox"
