---
layout: default
title: Github Load Balancer的设计思路与实现
author: lijiaocn
createdate: 2017/09/20 11:03:25
last_modified_at: 2017/09/20 16:08:12
categories: 项目
tags:  lb
keywords: glb,github,load,balancer
description: github的load blancer的实现，可水平扩展、不丢失连接

---

* auto-gen TOC:
{:toc}

## 说明 

Github在[Introducing the GitHub Load Balancer][1]介绍了自己的load blancer的设计实现。

这里是阅读时做的摘要。

## 面临的问题

起初，github直接在高规格的机器上运行haproxy，专门做了硬件参数优化和网络规划。

与网络环境深度结合，无法水平扩展。

随着服务数量的增加，haproxy的配置文件增加到了上千行，并且有很多关联的ACL规则。

## GLB的目标

	Runs on commodity hardware
	Scales horizontally
	Supports high availability, avoids breaking TCP connections during normal operation and failover
	Supports connection draining
	Per service load balancing, with support for multiple services per load balancer host
	Can be iterated on and deployed like normal software
	Testable at each layer, not just integration tests
	Built for multiple POPs and data centers
	Resilient to typical DDoS attacks, and tools to help mitigate new attacks

## 设计思考

### 使用DNS做负载均衡的缺陷

通过DNS可以将流量分发给多个IP，但是存在下面的问题：

	网络中的DNS服务器非常倾向缓存查询结果，经常忽略DNS的TTL
	
	一些github的用户直接使用了IP地址，绕过了DNS
	
	需要准备一组IP地址，单个服务器的宕机会导致对应的IP不能访问

期待： 用一个IP地址，就可以完成负载均衡。

### ECMP存在的问题

ECMP(Equal-Cost Multi-Path，等价路由协议)，可以将发送给同一个IP的流量通过多个链路送出。通过hash算法计算单个报文的流向，避免了报文乱序，保证会话亲和。

ECMP只做报文转发，不记录连接的状态，因此存在一下的问题：

	服务器宕机，从ECMP摘除对应的路径时，会出现“rehash”的现象。
	即，报文的hash结果发生变化，导致转发目的地变更，影响了原本正常的连接。

### L4/L7负载均衡切分

通过ECMP，路由器将流量发送到多个L4负载均衡器，通常是lvs，lvs保存连接状态，并且可以配置成同步的模式，与其它的lvs通过连接状态信息。L4负载均衡器称为`Director`。

L4层负载均衡器再将流量发送到L7负载均衡器，通常是haproxy。L7负载均衡器称为`Proxy`。

这种切分与实现方法有下面的优点：

	Director会记录连接状态，一个Proxy宕机不会更改其它正常报文转发目的地，将Proxy上的连接排出(drain)，再从Director摘除后，就可以对proxy进行管理操作。
	
	Driector之间启用同步模式后(或者所有的Director使用相同的算法，并配置相同的Proxy)，一个Driector宕机后，报文经过ECMP到达其它的Driector后，依然能被转发给原先的Proxy。

存在以下的不足:

	所有Driector都是同样的视图(have the same view of the world)，并且要使用相同的算法
	依然存在连接中断的场景
	使得DDos防御变得更为复杂

>文章里没有对后两点不足做详细的说明。

## 新的设计

Github依然沿用`ECMP->L4 Director ->L7 Proxy`的传统模式，通过重新设计其中的L4 Director来实现自己的目标。

新设计的L4 Director是无状态的，L4 Director和L7 Proxy都可以安全地(不干扰已有连接)移除。

新设置的L4 Director通过一下步骤实现目标：

	1. 保存每个L7 Proxy，并设置它的状态，这些状态会在排出连接的时候使用
	2. 每个L4 Director都维护一个使用Rendezvous hash定位的转发表，表中记录L7 Proxy以及它们的状态
	3. 报文到达时，使用报文的源IP查询转发表，得到目标L7 Proxy
	4. L4 Director将报文封装后(Fool-over-UDP)发送到L7 Proxy
	5. L7 Proxy收到报文后，解封报文，直接回应给Client(Direct Server Return)

详细的设计和实现还没有公开。 2017-09-20 14:33:26

## 改进haproxy



## 参考

1. [Introducing the GitHub Load Balancer][1]
2. [GLB part 2: HAProxy zero-downtime, zero-delay reloads with multibinder][2]

[1]: https://githubengineering.com/introducing-glb/ "Introducing the GitHub Load Balancer"
[2]: https://githubengineering.com/glb-part-2-haproxy-zero-downtime-zero-delay-reloads-with-multibinder/ "GLB part 2: HAProxy zero-downtime, zero-delay reloads with multibinder"
