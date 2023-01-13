---
layout: default
title: "CentOS7/6内核升级的简单方法: 借助ELRepo，用yum命令更新内核"
author: 李佶澳
createdate: "2019-02-25 15:52:10 +0800"
last_modified_at: "2019-02-28 19:05:49 +0800"
categories: 技巧
tags: linux
keywords: 升级内核,内核更新,yum升级内核,centos内核更新,centos内核版本
description: 内核代码编译安装繁琐耗时，在CentOS7和CentOS6中，可以安装ELRepo，用yum命令直接更新内核
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

研究一些新的内核特性时经常需要升级到高版本的内核，如果下载内核代码自己进行编译安装，繁琐耗时，在CentOS7和CentOS6中，可以安装ELRepo，用yum命令直接更新内核。
可以使用[How to Upgrade Kernel on CentOS 7][8]中的做法，注意根据[Welcome to the ELRepo Project][9]中的内容实时调整url地址。

## 安装elrepo

先用rpm命令安装elrepo源：

```
rpm --import https://www.elrepo.org/RPM-GPG-KEY-elrepo.org 
# for centos 7
rpm -Uvh https://www.elrepo.org/elrepo-release-7.0-3.el7.elrepo.noarch.rpm
```

## 安装最新稳定版内核

安装elrepo包含的最新的稳定版内核：

```
yum --enablerepo=elrepo-kernel install kernel-ml

yum --enablerepo=elrepo-kernel install kernel-ml-devel    #如果要编译内核模块、eBPF程序等
```

可以用下面命令查看elrepo支持的内核：

```
yum --enablerepo=elrepo-kernel search kernel
```

## 更改grub配置使用最新的内核启动

配置grub2，下次启动时使用新安装的内核，用下面命令列出grub2中配置的内核：

```
$ awk -F\' '$1=="menuentry " {print i++ " : " $2}' /etc/grub2.cfg
0 : CentOS Linux (4.20.12-1.el7.elrepo.x86_64) 7 (Core)
1 : CentOS Linux (3.10.0-693.11.6.el7.x86_64) 7 (Core)
2 : CentOS Linux (3.10.0-327.22.2.el7.x86_64) 7 (Core)
3 : CentOS Linux (0-rescue-f180f4f45ab34cdc85a5a7b5b599b20e) 7 (Core)
```

将CentOS Linux （4.20.12..) 设置为默认启动项，对应的序号是`0`：

```
grub2-set-default 0
grub2-mkconfig -o /boot/grub2/grub.cfg
```

## 重启机器

```
reboot
```

内核更新了：

```
# uname -r
4.20.12-1.el7.elrepo.x86_64
```

## 参考

1. [How to Upgrade Kernel on CentOS 7][8]
2. [Welcome to the ELRepo Project][9]

[8]: https://www.howtoforge.com/tutorial/how-to-upgrade-kernel-in-centos-7-server/ "How to Upgrade Kernel on CentOS 7"
[9]: http://elrepo.org/tiki/tiki-index.php "Welcome to the ELRepo Project"
