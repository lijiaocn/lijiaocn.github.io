---
layout: default
title: "《Redis核心技术与实践》阅读笔记: 数据类型/存储开销/Rehash/案例等"
author: 李佶澳
date: "2021-10-08 16:44:38 +0800"
last_modified_at: "2021-10-09 16:44:38 +0800"
categories: 编程
cover:
tags: 阅读笔记 系统设计
keywords: 缓存,redis
description: Redis 的存储开销方面讲的具体生动，特别是通过压缩列表减少内存空间的分析过程很细致
---

* auto-gen TOC:
{:toc}

## 说明


Redis 的存储开销方面讲的具体生动，特别是通过压缩列表减少内存空间的分析过程很细致，设计的几个案例也比较典型如果对这篇笔记中的内容感到陌生，推荐阅读：：

**试读链接**：[任意四章试读入口](https://time.geekbang.org/column/intro/100056701?code=dQqx1JcLTCjGZabRJS4Tn6Lr98ibK6HXCMOmQvnABlU%3D)

**新人优惠**：[极客时间新注册38元代金券](https://time.geekbang.org/hybrid/activity/invite/INV?giftType=1&uid=E274D90C022D49&source=app_share)

<span style="display:block;text-align:center">![蒋德钧《Redis核心技术与实践》]({{ site.article }}/geek/redis.jpeg){: width="350px"}</span>


## 常用操作

### 查看配置

```sh
127.0.0.1:6379> config get hash-max-ziplist-entries
1) "hash-max-ziplist-entries"
2) "512"
127.0.0.1:6379> config get hash-max-ziplist-value
1) "hash-max-ziplist-value"
2) "64"
```

## 数据类型

redis 采用单线程设计，没有额外的并发开销，利用操作系统的 epoll 实现I/O 的多路复用：

![redis的 I/O多路复用]({{ site.article }}/redis-io.webp)

redis 中 key 和 value 的管理：

![redis的key-value的存放方式 ]({{ site.article }}/redis-hash.webp)

哈希冲突解决方法：维护两个哈希表，先使用第一个哈希表，当第一个哈希表中的数据过多时，创建第二个容量扩大一倍的哈希表，然后在以后的每次请求处理时，将对应的数据复制到第二个哈希表，渐进的完成哈希表的拷贝，最后删除第一个哈希表。

redis 的渐进式 rehash：

![redis的rehash]({{ site.article }}/redis-rehash.webp)

对于集合类型（list/hash/set等），redis 会根据数据量选择合适的底层数据结构：

![redis数据类型与底层数据结构对应关系]({{ site.article}}/redis-struct.webp)

压缩列表就是带有起始偏移和和结束未知记录的数组。第一个元素和最后一个元素查询复杂度O(1)，其它元素查询复杂度O(n)。数据量比较少时，用压缩列表可以极大减少内存占用（省去了指针）。

![压缩列表]({{ site.article }}/redis-zlist.webp)


hash 类型的压缩列表使用边界：

```sh
hash-max-ziplist-entries： hash中元素小于等于该数值时，使用压缩列表，否则使用哈希表，默认配置 512
hash-max-ziplist-value：   压缩列表中单个元素最大长度，默认配置 64

```

set 类型的压缩列表使用边界：

```sh
zset-max-ziplist-entries： 默认 128
```

## 存储开销

redis 的 key 和 value 保存在 RedisObject 中，全局哈希表中的 key/value 是指向 RedisObject 的指针。对于一对 kv，哈希表的开销是 3 个指针 24 字节，考虑内存对齐，实际分配内存是 32 个字节。

![redis的kv存储]({{ site.article }}/redis-object.webp)

RedisObject 由 8 字节的元数据和 8 字节的指针组成，如果是 int 数据直接存放到指针位置，如果是字符串数据，以 44 字节为界使用两种存放方式，redisObject 额外开销至少 8 字节，hash/list/set等集合类型另论。

![redisobject编码]({{ site.article}}/redis-value.webp)

## 设计案例

### 海量数值类型 key-value 存储

key 为 8 字节数值，value 也是 8 字节数值，直接用 string 类型的存放，一对 kv 耗费 64 字节，额外开销占比高。如果拆分成用无数个成员不到 512 的 hash 存放，redis 会使用压缩列表存放每个 hash 中的成员，减少额外的存储开销，但是会浪费 CPU，单个 hash 中的成员查询采用遍历的方式。


### 计算每日留存用户

以天为单位创建 set，每天一个 set，在 set 中记录下当前登陆用户 id，通过两天的集合做并集得出留存用户

注意事项：Set 的集合运算开销高，数据量较大时，可能阻塞 redis 线程，考虑用从库计算。

### 用户每日签到记录

创建“用户-年度-月份”粒度的 bitmap，第 N 个 bit 位数值表示对应月份第 N 天的签到情况。

### 网页 UV 统计

方式1：每个页面一个 set，记录访问该页面的用户 uid。当页面 uv 超级大时，譬如千万，set 集合过大。

方式2：使用 HyperLogLog 模糊统计。 HyperLogLog 基于概率统计，标准错算率 0.81%。

### 地理空间查询

geo

### 时序数据保存

扩展模块 RedisTimeSeries。

>用redis保存时序数据太费力，功能少问题多，应当用于专门的时序数据库。 


## 缓存不一致/缓存雪崩/缓存击穿/缓存穿透

这部分参考 [《高并发系统设计40问》阅读笔记](https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2021/10/08/geek-gaobingfa.html#%E7%BC%93%E5%AD%98%E4%BC%98%E5%8C%96)，内容基本一样。高并发讲解的内容更全一些。



## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"

