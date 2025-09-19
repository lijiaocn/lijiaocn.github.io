---
layout: default
title: "Linux 发行版 Ubuntu 系统的基本使用"
author: 李佶澳
date: "2023-02-22 14:37:38 +0800"
last_modified_at: "2023-02-23 16:42:46 +0800"
categories: 技巧
cover:
tags: linux
keywords: linux,ubuntu
description: Official Ubuntu Documentation 提供最新版本的使用手册，这里使用的是 Ubuntu 20.04 LTS (Focal Fossa)
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

[Official Ubuntu Documentation][5] 提供最新版本的使用手册，这里使用的是 [Ubuntu 20.04 LTS (Focal Fossa)][4]。

## 系统服务管理

系统服务用 systemd 管理，1 号进程的程序文件 /sbin/init 是 systemd 的符号连接：

```sh
$ ls -l /sbin/init
lrwxrwxrwx 1 root root 20 Sep  8 09:58 /sbin/init -> /lib/systemd/systemd
```

systemd 介绍：man systemd

systemd 管理服务用命令 systemctl 操作：man systemctl

```sh
# 重启服务 
sudo systemctl restart sshd
```

systemd 的使用见 [systemd: Linux 系统服务管理](/%E6%8A%80%E5%B7%A7/2017/07/26/linux-tool-systemd.html)。


## 参考

1. [李佶澳的博客][1]
2. [Linux发行版][2]
3. [Linux发行版列表][3]
4. [Ubuntu 20.04 LTS (Focal Fossa)][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://zh.wikipedia.org/zh-hans/Linux%E5%8F%91%E8%A1%8C%E7%89%88 "Linux发行版"
[3]: https://zh.wikipedia.org/zh-hans/Linux%E5%8F%91%E8%A1%8C%E7%89%88%E5%88%97%E8%A1%A8 "Linux发行版列表"
[4]: https://assets.ubuntu.com/ubuntu-server-guide "Ubuntu 20.04 LTS (Focal Fossa)"
[5]: https://help.ubuntu.com/ "Official Ubuntu Documentation"
