---
createtime: "2024-09-05 17:40:46 +0800"
last_modified_at: "2024-09-05 19:36:11 +0800"
categories: 技巧
title: "在 Mac M3 上使用 vagrant 启动虚拟机"
tags: vagrant
keywords:
description: vagrant 上的 amd64 架构的 box 镜像咋新版的 Mac 上就无法使用。因为 Mac 现在使用的自研的 M1/M2/M3 等芯片 arm64 架构。
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

vagrant 上的 amd64 架构的 box 镜像咋新版的 Mac 上就无法使用。因为 Mac 现在使用的自研的 M1/M2/M3 等芯片 arm64 架构。

如果想在 arm64 的 Mac 上使用 vagrant，需要使用同样使用 arm64 架构的 box，以及选择对应的 provider。

## 寻找 arm64 架构的 box

[Discover Vagrant Boxes][2] 有个 Architecture 筛选项，可以筛选出 arm64 的 box。

![arm64 box]({{ site.article }}/vagrant-m3-1.png)

可以看到目前（2024-09-05 17:52:42）大部分 arm64 都不是官方维护的，使用量比较到的是最前面的 bento 项目维护的 box：

* [bento][3]

bento 也不是为每一个版本提供全部 provider 和全部 architecture 的 box，比如 [bento/ubuntu-22.04][4]：

* 版本 v202407.23.0 只提供了 amd64，只适用于 paralles 和 virtualbox
* 版本 v202401.31.0 提供了 amd64 和 arm64，其中 arm64 只适用于 paralles 和 vmware_destop。

![v202407.23.0 ]({{ site.article }}/vagrant-m3-2.png)

![v202407.23.0 ]({{ site.article }}/vagrant-m3-3.png)

## 使用 vmware_destop 启动 arm64 box

vmware 现在针对个人免费了，优先用 vmware。

先安装 vmware：

**安装完成之后，需要在本地打开一次 vmware 完成使用设置，否则 vagrant 启动 vmware 时会出错。**

```bash
brew install vmware-fusion
```

然后安装 Vagrant VMware Utility，参考 [Install Vagrant VMware Utility][6] 中说明，从[下载页][7]下载以后打开按提示安装。

![Vagrant VMware Utility]({{ site.article }}/vagrant-m3-4.png)

再安装 vagrant 的 vmware plugin：

```bash
vagrant plugin install vagrant-vmware-desktop
```

这时候就可以用 vagrant 启动虚拟机，用参数 --provider 指定 vmware_desktop：

```bash
vagrant init bento/ubuntu-22.04       # 指定支持 vmware 和 arm64 的 box
vagrant up --provider vmware_desktop
```

也可以在 Vagrantfile 中指定 provider，避免每次启动用参数指定：

```bash
   config.vm.provider "vmware_desktop" do |v|
   # 这里可以设置 vmware 特有的配置
   end
```

可以在其中添加 provider 相关的配置，这些配置项的名称和 virtualbox 是不同的，比如 vmware 设置内存和 CPU 的方式为：

* vmware 相关的参数设置：[providers/vmware/configuration][8]

```bash
   config.vm.provider "vmware_desktop" do |v|
    v.vmx["memsize"] = "1024"
    v.vmx["numvcpus"] = "2"
   end
```

和 provider 无关的配置项用法都是相同的。

## 参考

1. [李佶澳的博客][1]
2. [Discover Vagrant Boxes][2]
3. [bento][3]
4. [bento/ubuntu-22.04][4]
5. [vagrant provider: vmware][5]
6. [Install Vagrant VMware Utility][6]
7. [Install Vagrant VMware Utility][7]
8. [providers/vmware/configuration][8]


[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://portal.cloud.hashicorp.com/vagrant/discover?architectures=arm64&providers=virtualbox&query=ubuntu "Discover Vagrant Boxes"
[3]: https://app.vagrantup.com/bento "bento"
[4]: https://app.vagrantup.com/bento/boxes/ubuntu-22.04 "bento/ubuntu-22.04"
[5]: https://developer.hashicorp.com/vagrant/install "vagrant provider: vmware"
[6]: https://developer.hashicorp.com/vagrant/docs/providers/vmware/installation "vagrant provider:vmware"
[7]: https://developer.hashicorp.com/vagrant/install/vmware "Install Vagrant VMware Utility"
[8]: https://developer.hashicorp.com/vagrant/docs/providers/vmware/configuration "providers/vmware/configuration"
