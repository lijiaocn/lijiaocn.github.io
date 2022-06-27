---
layout: default
title: "ElasticSearch 零基础入门（2）：集群设计和配置原则"
author: 李佶澳
date: "2022-06-23 14:35:24 +0800"
last_modified_at: "2022-06-24 17:35:34 +0800"
categories: 项目
cover:
tags: ElasticSearch
keywords: ElasticSearch,es
description: "ElasticSearch集群原理和配置原则,es 定义了多种节点角色，一个节点可以同时担任多种角色"
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

ES 支持集群模式部署 [Set up a cluster for high availability][30]，支持数据多副本备份。

## 节点角色

ES 支持的功能较多（譬如机器学习），为了更好的支持这些功能，es 定义了多种节点角色，一个节点可以同时担任多种角色，默认具有以下角色：

1. master
2. data
3. data_content
4. data_hot
5. data_warm
6. data_cold
7. data_frozen
8. ingest
9. ml
10. remote_cluster_client
11. transform

ES 集群中的节点大致可以分为`管理节点`、`数据节点`和`任务节点`。

**管理节点** ：

1. 角色配置为 master，能够参与 leader 投票、可以被选为 leader 的节点
2. 被选为 leader 的节点负责集群的管理工作
3. 如果同时配置了 voting_only 角色，该节点只参与选举投票，不做候选人

**数据节点**：

1. 角色配置为 data，负责存储数据和提供数据查询、聚合处理的节点
2. 数据节点可以进一步细分：data_content，data_hot，data_warm，data_cold，data_frozen
3. data_content: 存放 document 数据
4. data_hot： 存放刚写入的时间序列数据（热点数据），要能够快速读写
5. data_warm：不再经常更新、低频查询的数据
6. data_cold：极少访问的只读数据
7. data_frozen：缓存从快照中查询出的数据，如果不存在从快照读取后缓存，

**任务节点** 类型较多，每个角色负责专门的任务：

1. []： 角色为空，coordinating node，没有任何角色，只负责将收到的请求转发到其它节点
2. ingest：承担 pipeline 处理任务的节点
3. remote_cluster_client：跨集群操作时，与其它机器进行通信的节点
4. ml：执行机器学习任务和处理机器学习 api 的节点，通常建议同时配置角色 remote_cluster_client
5. transform：数据处理节点，对文档数据进行再次加工，通常建议同时配置角色 remote_cluster_client

## 数据存储方式

[Scalability and resilience: clusters, nodes, and shards][32]

Index 是文档的基本组织单位，以 Index 为单位，将文档被存放在称为 shard 的存储单元上。

Shard 分为 `primary shard` 和 `replica shard`，后者是前者的数据备份 。

**primary shards**：和其它 primariy shard 一起存储 index 中全部文档，每个文档只会被 primariy shard 存储一次。primariy shard 的目的是用水平扩展方式提高存储容量。

**replica shards**：每个 primariy shard 对应的备份。replica shard 的目的是数据备份，防丢失。

`primary shards 的数量在 index 创建时指定，replica shards 数量可以随时更改。`如果修改 primary shard 数量，需要 ReIndex。
## primariy shards 数量建议

primariy shards 的数量如果太多：

1. 每个 shard 上存储的数据越少，管理开销会增加
2. 单个 shard 的查询虽然加快，但是用户的一次查询可能要被分发到更多 shard 上执行，整体变慢

primariy shards 的数量如果太少：

1. 单个 shard 过大，es 进行数据迁移的时间增加

推荐做法：

1. 单个 shard 的大小控制在几GB～几十GB，如果是时间序列数据，单个 Shard 建议 20GB～40GB

更多建议：[testing with your own data and queries][33]

## 跨集群备份

ES 支持跨集群备份，可以创建另外一个集群做为备集群。主集群负责写操作，副集群平时只读，在主集群故障时接替主集群，见 [Cross-cluster replication][34]。

容灾方案参考：[Designing for resilience][35]

## 正确性与一致性等级

[Reading and Writing Documents][36] 介绍了 ES 的读写行为。

ES 数据备份使用的是 `primary-backup` 模型：

1. primary shard 承接写操作，负责将改动同步到 replica shards
2. primary shard 和 replica shards 一起承接读操作

primay-backup 模型参考 [PacificA: Replication in Log-Based Distributed Storage Systems][37]。

**`ES 的正确性等级较低`**，可能读到脏数据：

1. 读到未确认的数据：primary shard 完成本地写之后，数据就对外可见，此时这些数据被没有同步到 replia shards
2. 读到过时的脏数据：primary shard 失去了 primary 身份而不自知，继续执行无法同步到 replia shard 的本地写，发送到该 primary shard 的读请求读到过时的脏数据

ES的一致性等级应该是 **「[会话单调写一致](/编程/2021/10/11/geek-fenbushi-jr.html#单会话单调写一致)」**，等级较低，只能保证每个节点上的数据写入顺序相同。

## 写操作过程

**写操作**：

1. coordinating stage：根据文档 ID 找到对应的 primary shard，将请求转发过去，
2. primary stage：primary shard 完成本地操作后，将操作同步到 master 节点维护的 in-sync 队列中的 replica shards， 所有 replica shards 操作完成后 ，primary shard 向客户端返回成功
3. replica stage：replica shards 本地回放 primary shard 上的操作，更新本地数据

coordinating stage、primary stage、replica stage，三个阶段串行执行，每个阶段都要下个阶段完成后，才返回完成。 

**异常处理**：

1. 如果 primary shard 故障，当前写操作等待 master 节点选出新的 primary shard （默认等待 1 分钟），然后将请求转发给新选出的 primary shard
2. 如果 primary shard 发起同步时，replica shard 无回应，primary shard 通知 master 将问题 replica shard 从 in-sync 队列移除。master 回应后，primary shard 即回应客户端，与此同时，master 新建了一个 replica shard 进行数据同步
3. 如果在执行期间 primary shard 失去了 primary 身份而不自知（断网隔离/长GC导致），向 replica shard 发送的同步请求被拒绝后，primary shard 向 mater 请求最新的 primary shard，将请求转发给新的 primary shard

## 读操作过程

**读操作**：

读操作有两类，一类是通过 ID 直接读，一类是条件查询。收到读请求的节点为 coordinating node，es 的所有节点都具备 coordinating 能力。
coordinating node 对读请求的处理过程：
 
1. 解析请求内容，找出需要的 replica groups（replica group：primary shard 和它的 replica shards）
2. 从每个 replica group 中选出一个 shard，可能是 primary shard 也可能是  replica shard
3. 将请求分拆后发送给选出的 shards
4. 汇总 shards 返回的数据，整理后返回客户端

从 replica group 中选 shard 的时候，使用轮询法或者 [Adaptive replica selection][38]。

**异常处理**：

1. 如果 shard 未响应，coordinating node 选择下一个 shard，直到成功或 shard 用尽

一次读请求涉及多个 shard 时，如果部分成功部分失败，`Search`、`Multi Search`、`Bulk`、`Multi Get` 操作会返回成功部分的数据，返回码是 200 ok，即`可能返回不完整的数据`。客户端需要从返回的响应头中获取失败 shard 的信息。

## 参考

0. [李佶澳的博客][1]
1. [es官网文档][21]
2. [Install Kibana With Docker][2]
3. [Install Elasticsearch With Docker][3]
4. [Elastic Stack Doc][4]
5. [Running the Elastic Stack On Docker][5]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.elastic.co/guide/en/elasticsearch/reference/current/docker.html "Install Elasticsearch With Docker"
[3]: https://www.elastic.co/guide/en/kibana/current/docker.html "Install Kibana With Docker" 
[4]: https://www.elastic.co/guide/index.html "Elastic Stack Doc"
[5]: https://www.elastic.co/guide/en/elastic-stack-get-started/current/get-started-docker.html "Running the Elastic Stack On Docker"
[6]: https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-params.html "Mapping Parameters"
[7]: https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-types.html "Mapping types"
[8]: https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping-fields.html "Metadata fields"
[9]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html "ES Query DSL"
[10]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html "ES Aggregation"
[11]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-query.html "ES Match query"
[12]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html  "ES Boolean query"
[13]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-boosting-query.html "ES boosting query"
[14]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-constant-score-query.html "ES constant score"
[15]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-dis-max-query.html  "ES Disjunction max query"
[16]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-function-score-query.html "ES Function score query"
[17]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-all-query.html "ES match all query"
[18]: https://www.elastic.co/guide/en/elasticsearch/reference/current/term-level-queries.html "ES term level query"
[19]: https://elkguide.elasticsearch.cn/ "ELK Stack 中文指南"
[20]: https://www.elastic.co/guide/en/elasticsearch/reference/7.1/sql-syntax-select.html "SQL查询"
[21]: https://www.elastic.co/guide/index.html "es官网文档"
[22]: https://www.elastic.co/guide/en/elasticsearch/reference/current/multi-fields.html#multi-fields "multi-fields"
[23]: https://www.elastic.co/guide/en/elasticsearch/reference/current/term-level-queries.html "term-level-queries"
[24]: https://www.elastic.co/guide/en/elasticsearch/reference/current/full-text-queries.html "full text queries"
[25]: https://www.elastic.co/guide/en/elasticsearch/reference/current/compound-queries.html "Compound queries"
[26]: https://www.elastic.co/guide/en/elasticsearch/reference/current/joining-queries.html "Joining queries"
[27]: https://www.elastic.co/guide/en/elasticsearch/reference/current/geo-queries.html "Geo queries"
[28]: https://www.elastic.co/guide/en/elasticsearch/reference/current/shape-queries.html "Shape queries"
[29]: https://www.elastic.co/guide/en/elasticsearch/reference/current/specialized-queries.html "Specialized queries"
[30]: https://www.elastic.co/guide/en/elasticsearch/reference/current/high-availability.html "Set up a cluster for high availability"
[31]: https://www.elastic.co/guide/en/elasticsearch/reference/current/modules-node.html "Node roles"
[32]: https://www.elastic.co/guide/en/elasticsearch/reference/current/scalability.html "Scalability and resilience: clusters, nodes, and shards"
[33]: https://www.elastic.co/cn/elasticon/conf/2016/sf/quantitative-cluster-sizing "testing with your own data and queries."
[34]: https://www.elastic.co/guide/en/elasticsearch/reference/current/xpack-ccr.html "Cross-cluster replication"
[35]: https://www.elastic.co/guide/en/elasticsearch/reference/current/high-availability-cluster-design.html "Designing for resilience"
[36]: https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-replication.html "Reading and Writing documents"
[37]: https://www.microsoft.com/en-us/research/wp-content/uploads/2008/02/tr-2008-25.pdf "PacificA: Replication in Log-Based Distributed Storage Systems"
[38]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-shard-routing.html#search-adaptive-replica "Adaptive replica selection"
[39]: https://www.elastic.co/guide/en/elasticsearch/reference/current/getting-started.html "Quick Start"
[40]: https://www.elastic.co/guide/en/elasticsearch/reference/current/search-search.html "Search API"
[41]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-range-query.html "range"
[42]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-exists-query.html "exists"
[43]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-fuzzy-query.html "fuzzy"
[44]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-ids-query.html "ids"
[45]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-prefix-query.html "prefix"
[46]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-regexp-query.html "regexp"
[47]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-term-query.html "term"
[48]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-terms-query.html "terms"
[49]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-terms-set-query.html "terms-set"
[50]: https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-wildcard-query.html "wildcard"
[51]: https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html "Elasticsearch Guide"
[52]: https://www.elastic.co/guide/en/elasticsearch/reference/7.17/mapping.html "Mapping"
[53]: https://www.elastic.co/guide/en/elasticsearch/reference/7.17/rest-apis.html "Elastic Api"
[54]: https://www.elastic.co/guide/en/elasticsearch/reference/7.17/indices-create-index.html "Create Index Api"
[55]: https://www.elastic.co/guide/en/elasticsearch/reference/7.17/mapping-params.html "Mapping Parameters"
[56]: https://www.elastic.co/guide/en/elasticsearch/reference/7.17/indices.html "Index Apis"
[57]: https://www.elastic.co/guide/en/elasticsearch/reference/7.17/multi-fields.html "multi-fields"
