---
layout: default
title: "Linux 网络观察调试: 查看连接跟踪表、报文跟踪等"
author: 李佶澳
createdate: 2018/06/15 10:23:00
last_modified_at: 2018/09/01 15:27:24
categories: 技巧
tags: linux
keywords: linux iptables conntrack debuging 网络调试
description: 突然发现，一直没有掌握一套行之有效的调试iptables规则、追踪linux上的连接、报文的方法

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

在调查[kubernetes的node上的重启linux网络服务后，pod无法联通][1]的问题时，突然发现没有掌握一套行之有效的调试 linux 网络的方法。

## conntrack 查看连接跟踪表

安装：

```sh
yum install -y conntrack-tools
```

使用：

```sh
$ conntrack -h
Command line interface for the connection tracking system. Version 1.4.4
Usage: conntrack [commands] [options]

Commands:
  -L [table] [options]        List conntrack or expectation table
  -G [table] parameters       Get conntrack or expectation
  -D [table] parameters       Delete conntrack or expectation
  -I [table] parameters       Create a conntrack or expectation
  -U [table] parameters       Update a conntrack
  -E [table] [options]        Show events
  -F [table]            Flush table
  -C [table]            Show counter
  -S                    Show statis
```

连接跟踪表的参数可以在 kernel 文档 `Documentation/networking/nf_conntrack-sysctl.txt` 中找到。

## iptables 报文跟踪

用 iptables 追踪报文的方法见：[iptables 规则调试](/%E6%8A%80%E5%B7%A7/2014/04/16/linux-net-iptables.html#iptables-%E8%A7%84%E5%88%99%E8%B0%83%E8%AF%95)

## 参考

1. [kubernetes的node上的重启linux网络服务后，pod无法联通][1]
2. [linux的iptables使用-调试方法][2]
3. [netfilter/iptables/conntrack debugging][3]
4. [nftables HOWTO][4]
5. [利用raw表实现iptables调试][5]
6. [iptables：Linux的iptables使用][6]

[1]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/06/12/Kubernetes-network-restart-not-avalible.html "kubernetes的node上的重启linux网络服务后，pod无法联通" 
[2]: http://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2014/04/16/linux-net-iptables.html#%E8%B0%83%E8%AF%95%E6%96%B9%E6%B3%95 "linux的iptables使用-调试方法"
[3]: https://strlen.de/talks/nfdebug.pdf "netfilter/iptables/conntrack debugging"
[4]: https://wiki.nftables.org/wiki-nftables/index.php/Main_Page "nftables HOWTO"
[5]: http://www.360doc.com/content/14/1009/11/2633_415482198.shtml "利用raw表实现iptables调试"
[6]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2014/04/16/linux-net-iptables.html#%E7%94%A8log%E6%A8%A1%E5%9D%97%E5%9C%A8%E4%BB%BB%E6%84%8F%E4%BD%8D%E7%BD%AE%E6%89%93%E5%8D%B0%E6%8A%A5%E6%96%87 "iptables：Linux的iptables使用"
