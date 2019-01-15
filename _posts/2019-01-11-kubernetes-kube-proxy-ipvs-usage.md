---
layout: default
title: "Kubernetes组件kube-proxy的IPVS功能的使用"
author: 李佶澳
createdate: "2019-01-11 11:13:52 +0800"
changedate: "2019-01-15 16:27:02 +0800"
categories: 项目
tags: kubernetes
keywords: ipvs,kube-proxy,kubernetes
description:  Kubernetes 1.8版本kube-proxy开始支持ipvs，ipvs在1.10版本中成为默认模式，1.11版本中成为stable状态
---

* auto-gen TOC:
{:toc}

## 说明

[Kube-proxy][1]是kubernetes的标准组件之一，负责将访问service的cluster ip的请求，转发给service的endpoint，通常就是pod。

Kube-proxy最早使用iptables实现这一功能，但是iptables的性能较低，而且随着service数量增加，iptables规则数量快速增加，在规则更新、维护、性能方面有潜在的隐患。

Kubernetes 1.8版本中开始用ipvs实现同样的功能，在1.10版本中将ipvs设置为默认模式，在1.11版本中ipvs模式成为正式的（stable）特性。

## 使用

要使用ipvs模式需要安装有`ipvsadm`和`ipset`：

```
yum install -y ipvsadm ipset
```

对于ipvs还是试用特性的版本（1.8~1.9），用下面的方式启用：

```
--feature-gates SupportIPVSProxyMode=true --proxy-mode=ipvs
```

1.10以后，默认就是ipvs模式。特性在不同版本中的状态见[Kubernetes Feature Gates][2]，在其中搜索“SupportIPVSProxyMode”：

```
SupportIPVSProxyMode    false    Alpha   1.8     1.8
SupportIPVSProxyMode    false    Beta    1.9     1.9
SupportIPVSProxyMode    true     Beta    1.10    1.10
SupportIPVSProxyMode    true     GA      1.11    
```

启动之后最明显的变化就是，多了一个绑定很多cluster service ip的kube-ipvs0网卡：

```
4: kube-ipvs0: <BROADCAST,NOARP> mtu 1500 qdisc noop state DOWN
    link/ether 7a:f9:85:2f:45:7e brd ff:ff:ff:ff:ff:ff
    inet 172.16.38.10/32 brd 172.16.38.10 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
    inet 172.16.0.2/32 brd 172.16.0.2 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
    inet 172.16.53.73/32 brd 172.16.53.73 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
    inet 172.16.102.254/32 brd 172.16.102.254 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
    inet 172.16.28.217/32 brd 172.16.28.217 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
    inet 172.16.98.239/32 brd 172.16.98.239 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
    inet 172.16.0.1/32 brd 172.16.0.1 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
    inet 172.16.123.182/32 brd 172.16.123.182 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
    inet 172.16.31.68/32 brd 172.16.31.68 scope global kube-ipvs0
       valid_lft forever preferred_lft forever
```

如果从ipvs模式切换到iptables模式，ipvs的规则会被清空，包括kube-ipvs0网卡。反过来从iptables模式切换到ipvs模式，iptables规则会被清空。

## 参考

1. [kube-proxy][1]
2. [Kubernetes Feature Gates][2]

[1]: https://kubernetes.io/docs/reference/command-line-tools-reference/kube-proxy/ "kube-proxy"
[2]: https://kubernetes.io/docs/reference/command-line-tools-reference/feature-gates/#overview  "Kubernetes Feature Gates"
