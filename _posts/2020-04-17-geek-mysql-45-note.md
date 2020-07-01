---
layout: default
title: "《MySQL实战45讲》事务与隔离级别、索引优化和锁等面试必知"
author: 李佶澳
date: "2020-04-17T14:55:26+0800"
last_modified_at: "2020-04-26T14:22:10+0800"
categories: 编程
cover:
tags: database
keywords: mysql,事务隔离,索引优化,存储过程,全局锁,表级锁,行级锁
description: MySQL下载安装后，还需掌握事务隔离、索引优化、存储过程、全局锁、表级锁以及行级锁等高级知识
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 《MySQL实战45讲》说明

MySQL 下载安装完成，知道如何修改 root 密码，学会基本的增删改查语句后，要真正掌握它，还需要知道 `存储引擎`、`事务的用法`（特别是事务的`隔离级别`）、`索引优化`、`全局锁`、`表级锁`、`行级锁`等更多更多知识。

前阿里资深专家林晓斌的《MySQL实战45讲》，大概是最好最好的进阶材料，有很多出超出「想当然认识」的知识。掌握这些知识的应聘者绝对能让面试官感到惊喜，更关键的是可以避免在以后工作中踩坑。

下面是我的学习笔记，专栏地址在本页最后。

## SQL 语句的执行过程

MySQL 客户端（mysql 命令、各种语言的 sdk）和 MySQL 数据库的连接器建立连接，连接器将 sql 语句交给分析器，经过优化后执行。

![MySQL语句执行]({{ site.article}}/mysql-sql-arch-1.png)

查询缓存往往弊大于利，将 query_cache_type 设置为 DEMAND，对于默认的 SQL 语句都不使用缓存。

>MySQL 8.0 将查询缓存的整块功能删掉了

查看客户端：

```sql
show processlist
```

## redolog 与 binlog 日志 

redolog 是 MySQL InnoDB 引擎特有的日志：更新记录时，先将更新的内容写入 redolog 和内存，然后在系统空闲的时候刷新到磁盘。redolog 采用环状设计，循环写，写满后就刷新到磁盘，继续写。

binlog 是 MySQL Server 层的日志：所有引擎都可以开启，采用追加写的方式，形成一个个日志文件。 

MySQL 的更新过程，浅颜色是 InnoDB 的操作，深颜色是 Server 的操作：

![mysql更新时redolog和binlog的更新过程]({{ site.article }}/mysql-log-1.png)

MySQL 使用「两阶段提交」，prepare 阶段引擎写入 redolog，server 写入 binlog，然后开始 commit。

如果这期间宕机，MySQL 重启时根据 redolog 和 binlog 判断更新操作是否完成：只有 redolog 没有 binlog，撤回更新（评论中的说法）。

binlog 记录了过去一段时间里的所有操作记录，主要用来恢复数据：binlog 有两种格式，statement 格式记 sql 语句；row 格式记录行的内容，记两条，更新前和更新后的。

redolog 记录数据页 “做了什么改动”。

相关参数：

```sh
innodb_flush_log_at_trx_commit：建议值为1，每次事务的 redolog 直接持久化到磁盘
sync_binlog：                   建议值为1，每次事务的 binlog 都持久化到磁盘
```

数据库多久备份一次？备份间隔时间越长，从 binlog 恢复耗时越久。

## 事务、事务隔离级别和当前读

多个事务在数据库上同时执行时，按照每个事务看到的数据的样子，可以把事务的隔离分为 4 个级别：

```
1. 读未提交：当前事务还没提交时，其它事务就能看到变更
2. 读提交：  当前事务提交之后，其它事务才能看到变更
3. 可重复读：事务执行过程看到的数据和事务启动时看到的数据严格一致，无论其它进行了变更的事务是否提交
4. 串行化：  事务串行执行，写时加写锁，读时加读锁（最高等级，相当于无并发）
```

事务的隔离通过 MVCC（多版本并发控制）实现，事务执行过程中，被改动的行会保留每次变更的回滚，以及当前行上事务，其它事务要读取当前行按照一定规则选择合适的值。

如果事务存续时间太长，会形成大量回滚日志，所以一定要 `避免长事务`。

事务启动方式：

```
1. 用 begin 或 start transaction 显式启动，用 commit 提交，用 rollback 回滚
2. set autocommit=0，会关闭当前线程的自动提交，事务从第一个语句开始，直到主动 commit 或 rollback 或连接断开才结束
```

建议：

```
1. set autocommit=1，总是通过显式语句启动事务
2. 或者用 commit work and chain，提交事务并自动启动下一个事务
```

查询长事务：

```sql
select * from information_schema.innodb_trx where TIME_TO_SEC(timediff(now(),trx_started))>60
```

事务的隔离中存在一个当前读的场景：更新行时是先读后写，更新时读只能读当前值，称为「当前读」。

假设事务 A 要更新一行的值时，事务 B 在事务 A 启动后就修改了该行，那么事务 A 会在当前值（即事务 B 修改后的数值）上修改。
事务 A 完成修改后进行查询时，查到的是事务 A 修改后的值，而不是事务 A 启动时的值（可重复读中的情况，如果 A 没有修改操作，查询结果是事务 A 启动时的值）。

select 语句如果加锁，也是当前读：

```sql
select k from t where id=1 lock in share mode;
select k from t where id=1 for update;
```

## 主键索引、普通索引和联合索引

索引的三种结构：哈希表、有序数组、N 叉树。InnoDB 引擎中每个索引是一棵 B+ 树。 

主键索引的叶子节点是整行数据，非主键索引的叶子节点是主键的值，因此通过非主键索引查询会查两棵树，第二次查询为「回表」，要尽量避免`回表`。

索引优化点：

```
1. 减少普通索引的叶子节点的大小，即主键要尽可能小
2. 高频的查询尽量通过覆盖索引，避免回表
```

主键长度越小，普通索引的叶子节点越小，占用空间越小，自增主键往往是更合理的选择。如果只有一个索引并且是唯一索引，例如 KV 场景，就不需要考虑其它索引的叶子节点大小问题。

查询主键值可以避免回表，这种情况称为「覆盖索引」，即目标数据已经在当前查询的索引上，无需回表。
联合索引也是覆盖索引，经常互相查询的字段可以建立联合索引。

联合索引最左匹配的特性可以减少索引数量。

假设为字段（a,b）建立了联合索引，那么 a 就可以不建索引，以 a 为查询条件时，可以利用联合索引的最左匹配特性。但是如果以 b 为查询条件，就不能利用最左匹配，需要为 b 单独建索引。

MySQL 5.6 引入了联合索引下推优化（index condition pushdown），在索引遍历过程中，直接过滤不满足的记录，减少回表次数。

![MySQL联合索引的下推优化]({{ site.article }}/mysql-1-index-pushdown.png)


## 全局锁、表级锁、行级锁

**全局读锁**：flush tables with read lock，整个库处于只读状态，其它线程中的操作语句都会被阻塞，全局锁通常用来做全库逻辑备份。

如果引擎支持可重复读事务，可以在备份前启动事务，确保备份正确，如果引擎不支持只能用全局锁。mysqldump 的 -single-transaction 参数在导数据之前启动事务。

**表级锁**：表级锁分为表锁和元数据锁。

表锁用法：对其它线程和当前线程都起作用。

```
locka tables ... read/write
unlock tables 
locak tables t1 read,t2 write
```

**元数据锁**：MDL，在访问一个表的时候自动加锁，MySQL 5.5 引入。

给一个表加字段、修改字段、加索引时，需要扫描全表的数据，在对大表操作时，要特别小心：
第一，如果有正在执行的长事务，暂定更新，或者 kill 长事务；第二，在 alter table 语句中设置等待时间，如果等待时间里没有拿到 MDL 写锁就放弃。

```sql
ALTER TABLE tbl_name WAIT N add column ...
```

**行锁**：在需要的时候被自动加上，如果在事务中，要等到事务结束时才释放，因此一个事务中要更新行，要尽可能把会造成冲突的放在最后，减少锁等待。

>MyISAM 不支持行锁，InnoDB 支持

行锁可能存在死锁的情形，事务A和事务B更新同样的两行，但两者更新的顺序不同，会出现互相需要对方释放锁的情况。

```
innodb_lock_wait_timeout: 锁超时时间，默认 50s
innodb_deadlock_detect：  默认为 on，开启死锁检测，主动回滚一个事务（建议方案）
```

开启死锁检测后，每个新来的线程都要检测自己的加入是否会导致死锁，如果 1000 个线程同时更新相同行，检测次数是 1000 * 1000 量级的。

解决方法：

1. 如果确定不会死锁，临时关掉死锁检测（有风险）
2. 控制并发读，同一行只允许 10 个并发线程，其它线程等待（需要改动数据库服务端）
3. 将单行记录拆分为多行

未完待续，还在学习中...

## 实践经验

### 普通索引与唯一索引的选择

**场景**：按照身份证号查询姓名，业务保证不会写入重复的身份证号。

```sql
select name from CUser where id_card = 'xxxxxxxyyyyyyzzzzz';
```

**查询时的区别**：

id_card 比较大，不建议设置为主键

```sh
1. 唯一索引：因为索引唯一，找到第一个记录后就停止后续查找
2. 普通索引：找到第一个满足条件的记录后继续查找，直到遇到不满足条件的记录
```

>业务代码保证 id_card 不重复，两种类型索引的查询开销相差不大（B+树的存储结构决定了）

**更新时的区别**：

```sh
1. 唯一索引：不能使用 change buffer
2. 普通索引：可以使用 change buffer，「写多读少」的情况下收益最大
```

>除非更新后立即查询，否则应当使用普通索引。

change buffer 是数据库中持久化的缓存（会记入 redo log）：更新数据页时，如果数据页不在内存中（否则直接更新），`在不影响一致性的情况下`，将更新暂存到 change buffer，等数据页下次被读入的时候进行 merge。

唯一索引在更新时要判断是否违反唯一性，一定要先读数据，不能使用 change buffer。如果 id_card 为唯一索引，插入时会频繁将数据页加载到内存，这是数据操作里成本最高的操作之一。

change buffer 特别适合「写多读少」的场景，如果读很多立即触发 merge，则得不偿失。

change buffer 与 redolog 的区别：

![mysql change buffer 与 redolog的区别]({{ site.article }}/mysql-chagne-buffer-redolog.png)

redolog 暂存操作记录，将随机写磁盘转换成顺序写磁盘，chang buffer 减少随机读磁盘操作。

`注意：使用普通索引的前提是业务正确、可接受。`

### MySQL选错索引

优化器负责选择索引，选择执行代价最小的索引，扫描的行数是执行代价的重要因素，另外还有临时表、排序等因素。

扫描行数的估算：1、索引的基数；2、如果使用普通索引还要考虑回表。

```sh
1. 索引上不同值的个数称为「基数」，基数越大区分度越好。用 `show index from TABLE` 查看索引基数
2. 索引基数是采样估算的，用 N 个数据页上的值的个数 * 索引的页面数
3. 变更的数据行数超过 1/M，触发重新统计
4. innodb_stats_persistent on：  N=20，M=10
5. innodb_stats_persistent off： N=8， M=16
```

修正统计：

```sql
analyze table t
```

用 explain 查看语句的执行情况：

```sh
explain select * from t where a between 10000 and 20000;
```

慢查询阈值设置 set long_query_time，force index 指定索引：

```sh
set long_query_time=0;
select * from t where a between 10000 and 20000; /*Q1*/
select * from t force index(a) where a between 10000 and 20000;/*Q2*/
```

### 字符串字段加索引

字符串可以使用前缀索引，默认包含整个字符串：

```sql
alter table SUser add index index1(email);
alter table SUser add index index2(email(6));  //前缀 6 个字节
```

前缀索引减少了空间占用，但可能增加额外的扫描次数，并且可能带来额外的回表（取索引字段的完整值）。

如果字符串的前缀区分度不够，可以采用`倒叙存储`（字符串反转后存储）、`增加 hash 字段`。

倒叙存储查询举例：

```sql
select field_list from t where id_card = reverse('input_id_card_string');
```

使用 crc32 作为 hash 字段：

```sql
alter table t add id_card_crc int unsigned, add index(id_card_crc);
select field_list from t where id_card_crc=crc32('input_id_card_string') and id_card='input_id_card_string'
```

### SQL 语句执行抖动

抖的瞬间可能在「刷脏页」：

```sh
1. redolog 写满
2. 系统内存不足，置换脏页时要刷脏页到磁盘
3. 空闲的时候刷脏页
4. MySQL 关闭的时候刷所有脏页
```

将 innodb_io_capacity 设置为磁盘的 IOPS，让 InnoDB 知道刷脏页可以多快：

```sh
fio -filename=$filename -direct=1 -iodepth 1 -thread -rw=randrw -ioengine=psync -bs=16k -size=500M -numjobs=10 -runtime=10 -group_reporting -name=mytest 
```

innodb_max_dirty_pages_pct 脏页比例，默认 75%。

### 数据库表空间的回收

InnoDB 表由表结构定义和表数据组成，MySQL 8.0 前表结构以 .frm 为后缀单独存储，现在可以放在系统数据表中。

```sh
innodb_file_per_table on:   每个表数据存放在一个 .ibd 文件中，默认为 on
innodb_file_per_table off:  表数据存放在系统共享表空间
```

删除记录时，只会将 B+ 树中对应位置标记为删除，以后可以复用，磁盘文件大小不会缩小。

数据页面上的所有记录都删除后，整个页可以被复用到任意位置。删除整张表后，所有数据页标记为可复用，但是文件不会变小。



## 林晓斌极客时间专栏《MySQL实战45讲》

林晓斌《MySQL实战45讲》：[特别优惠地址](http://gk.link/a/10hL6)

<span style="display:block;text-align:center">![林晓斌《MySQL实战45讲》MySQL深度学习]({{ site.article }}/lxbmysql.jpeg){: width="250px"}</span>

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
