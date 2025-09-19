---
layout: default
title: "Netflix 的异地多活设计: Active-Active for Multi-Regional Resiliency"
author: 李佶澳
date: "2022-09-20 16:34:19 +0800"
last_modified_at: "2022-09-20 17:28:44 +0800"
categories: 方法
cover:
tags: 系统设计
keywords: 异地多活,active-active,netflix
description: 《Active-Active for Multi-Regional Resiliency》是 2013 年的资料。从时间上来看资料比较老，那时候应该处于 IaaS 形式的云计算普及阶段，kubernetes、云原生等概念还在孕育中，从技术理念来说不过时，异地多活需要考虑的问题还是那么多，没有随着时间发展而消失。

---

## 目录

* auto-gen TOC:
{:toc}

## 说明

[《Active-Active for Multi-Regional Resiliency》][2]是 2013 年的资料。从时间上来看资料比较老，那时候应该处于 IaaS 形式的云计算普及阶段，kubernetes、云原生等概念还在孕育中，从技术理念来说不过时，异地多活需要考虑的问题还是那么多，没有随着时间发展而消失。

这里是我的阅读摘要。

## Target

A failure of any kind in one region should not affect services running in another.

A networking partitioning event should not affect quality of services in either region.

## Implement Target

1. Services must be stateless, all data/state replication needs to handled in data tier
2. Must access resources locally in-Region
3. There should not be any cross-regional calls on user's call path
4. Data replication should be asynchronous

简单来说就是在每个区域都部署一整套服务，每个区域的系统能够独立运行，服务都是无状态的，数据层在不同区域之间的进行数据同步。

## Technical Challenges

**Effective tooling for directing traffic to the correct Region：**

* DNS
* AWS Route53

**Traffic shaping and load shedding, to handling thundering herd event：**

* zuul：服务框架支持熔断、限流
	* Ability to identify and handle mis-routed requests.  (user request is defined as mis-routed if it does not conform to our geo directional records)
	* Ability to declare a region in failover mode
	* Ability to define a maximum traffic level at any point in time, so that any additional requests will be automatically shed, in order to protect downstream services against a thundering herd of requests.

**State/Data asynchronous cross-regional replication：**

* Cassandra：使用 cassandra 的 multi-region 模式，生产负载下实测500ms完成数据同步
	* Wrote 1 million records in one region of a multi-region cluster, 500ms later, initiated a reading of the records that were just written in the initial region in the other region, while keeping a production level of load on the cluster.
* EvCache：一个 memcache client，Netflix没有用缓存的多主部署而是用远程失效的方式处理，远程 region 中的缓存被清除后，在后续请求中触发重新加载
	* Whenever there is a write in one region, EvCache client will send a message to another region(via SQS) to invalidate the corresponding entry
* 后面在 split-brain 中提到即使数据同步过程阻塞了，也要正常服务：
	* We were looking to demonstrate that services in each Region continued to function normally, even though some of the data replication was getting queued up. Over the course of the Active-Active project we ran Split-brain exercise many times, and found and fixed many issues


此外，还实现了支持多区域的自动部署工具方便系统数据，设计了各种 Monkeys 检验系统的可靠性。

**Monkeys：**
- Chaos Gorilla：taks out a whole Availability Zone
- Split-brain：servered the connectivity between Regions
- Chaos Kong：模拟 Region 失败进行流量迁移，为了避免损害用户体验，这个 monkey 执行的时候流量迁移会更平滑、同时不会向用户返回错误。

## 参考

1. [李佶澳的博客][1]
2. [Active-Active for Multi-Regional Resiliency][2]
3. [Netflix 开源的相关工具][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b "Active-Active for Multi-Regional Resiliency"
[3]: https://netflix.github.io/ "Netflix 开源的相关工具"

