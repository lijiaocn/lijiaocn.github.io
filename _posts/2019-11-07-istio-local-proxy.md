---
layout: default
title: "公众号文章同步：istio是怎样强行代理Pod的进出请求的？"
author: 李佶澳
date: "2019-11-07 23:52:13 +0800"
last_modified_at: "2019-11-07 23:55:49 +0800"
categories: 项目
cover:
tags: istio
keywords: istio,envoy,服务网格,servicemesh,iptables,sidecar
description: 掌握了 envoy 的使用方法后，回过头来学习 istio 给出的示例，然后通过上面的一通分析
---

## 说明

完整分析过程：[服务网格/ServiceMesh 项目 istio 的流量重定向、代理请求过程分析](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/11/01/istio-packet-forward.html)

## 公众号原文

到微信页面阅读：[istio是怎样强行代理Pod的进出请求的？](https://mp.weixin.qq.com/s/NXH7N6QipCtxb7wcsl4AEg)。

抓紧时间写一写，不然拖一拖，就没下文了。

最近想实现一个小功能，连续做了几次尝试，都不成功。后来一想，我想要做的事不就是 istio 已经实现的功能吗？它是怎么做到的？

这件事就是：如何实现一个透明的本地代理。

Pod 内的进程依然用原先的方式发起请求，譬如直接访问 www.baidu.com，但是该请求实际上被送到了本地代理，本地代理代为请求，然后将结果返回给 Pod。整个过程中，Pod 感知不到本地代理的存在，以为自己直连百度。



引入这样一个设计的好处是，可以在本地代理上做很多文章，譬如我想要的功能：篡改请求。这其实就是 ServiceMesh，不过我只想要一个小功能，还不想引入一整套服务网格。


这件事 istio 早就做到了，在 istio 中，进出 pod 的流量都是经过 sidecar 中的 envoy，那么它是怎样做到的呢？


完整的分析过程在阅读原文里，istio 是什么、istio 的几个基本概念是什么、要如何用，以及示例应用是怎么回事等，这些前期铺垫这里不做说明了，通过阅读原文都能找到。


istio 使用 iptables 实现了透明的强制代理，不过，如果你直接到 Pod 内查看 iptables 规则是不会有收获的，无论是在应用容器里，还是在名为 istio-proxy 的 sidecar 容器中， iptables-save 的结果都为空：



➜  ~ kubectl exec productpage-v1-8554d58bff-wlkg7 -c istio-proxy iptables-save

➜  ~ <空>



这是因为常驻运行的应用容器和 istio-proxy 容器都没有修改网络的权限。查看的 pod 的 yaml 文件，会发现下面的这个 NET_ADMIN 的权限，只授予了 initContainer：






因此只有 initContainer 有查看、修改 iptables 规则的能力，但是 initContainer 完成初始化设置后就退出了，我们没有办法进入已经退出的容器。



那么怎么办？为常驻运行的容器设置 NET_ADMIN 是一个方法，不过还有一个更简单，而且更有用的方法。



托管了 pod 容器的 node 是在我们的管辖范围内，我们在 node 上有很高的权限，没有看不了的数据，问题只是怎么看？这个场景下，用  nsenter。



nsenter 可以进入到目标进程的 net namespace中。方法如下：



1. 找到目标容器的进程号：







2. 进入容器进程的 net namespace。这步操作需要 root 权限，-t 指定目标进程，-n 表示进入 net namespace，后面跟随要执行的命令：







3. 进入容器的 net namespace 之后，就能够看到 initContainers 设置的 iptables 规则了，nat 表中的规则如下：







看到 istio 设置的规则后，我恍然大悟，知道为什么之前的尝试不成功了，istio 的规则中有两条使用了 owner 模块的规则，将 1337 用户的报文排除了。


这个 1337 用户就是 envoy 进程的所属用户，查看 pod 的 yaml 文件，会发现 istio-proxy 容器有这样一段配置：







istio 在  pod 中设置的 iptables 规则，迫使 pod 内发出的报文，通过 REDIRECT 模块改发到本地的 15001 端口，这个端口是 envoy 的监听端口。然后 envoy 进行代理请求，envoy 代理时发出的报文不能被再次重定向到 envoy，因此把 1337 用户产生的报文排除。


我之前的试验不成功，是因为没有把代理进程发出的报文排除，导致报文进入重定向死循环，直到代理软件报 500 错误。


值得提一下的，istio 不仅强行代理 pod 内进程发出的报文，而且强行代理了从 pod 外部发来的到 pod 端口的报文，同时管控了进出两个方向。时间有限，这里不啰嗦了。



搞清楚 iptables 的规则就明白了，iptables 的使用方法可以参考： 



https://www.lijiaocn.com/soft/linuxsys/iptables.html



详细分析过程在阅读原文中，或者打开网址：



https://www.lijiaocn.com



另外最开始了解 istio 的时候，感觉好复杂、好重、好难懂，完全不知道在干什么。掌握了 envoy 的使用方法后，回过头来学习 istio 给出的示例，然后通过上面的一通分析，突然感觉其实还好啦。



envoy学习笔记（持续修正更新）：


https://www.lijiaocn.com/soft/envoy/



istio 学习笔记（持续修正更新）：



https://www.lijiaocn.com/soft/istio/


## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
