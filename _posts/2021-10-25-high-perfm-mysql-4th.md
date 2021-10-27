---
layout: default
title: "《High Performance MySQL, 4th Edition》高性能 MySQL 第四版阅读笔记"
author: 李佶澳
date: "2021-10-25 17:58:48 +0800"
last_modified_at: "2021-10-25 17:58:48 +0800"
categories: 编程
cover:
tags: database
keywords: mysql,数据库,高性能mysql
description: High Performance MySQL, 4th Edition 还没有正式出版，O’Reilly 的网站上可读

---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

《High Performance MySQL, 4th Edition》还没有正式出版（2021-10-27 15:48:25），在 [O’Reilly 的网站][2]上可读，新注册用户可以免费阅读全文 10 天。

## Chapter 1. MySQL Architecture

![mysql逻辑架构]({{ site.article }}/hsql_0101.png)

最外层：承接网络连接、认证等功能。

中间层：查询分析、优化、缓存、内置函数等。

最底层：存储引擎，向中间层提供操作 API，存储引擎不理解 SQL 也不产生通信。

mysql 服务端已经支持了连接池，也提供对接第三方连接池等接口。

优化器执行优化动作时，需要获得存储引擎的特性、存储引擎执行特定操作的耗时、表中数据情况的统计值。

Mysql 5.7.20 移除了查询缓存，它会成为并发时的性能瓶颈，结果缓存要由客户程序实现。

### 并发读写

并发读写的管理方法：

1. 首先，用读写锁解决同一段数据的并发读写问题
2. 其次，通过降低锁的粒度，提高并发读写性能，但是锁的粒度越小，锁管理带来的开销越大
3. 表锁：server 实现了独立于存储引擎的表锁，譬如 alter table 时使用 server 实现的表锁
4. 行锁：行锁由存储引擎实现，server 通常不感知存储引擎内部实现的锁

### 事务 

事务内容这里主要讲解了熟知的 ACID 和隔离级别，提供了两篇参考阅读：

1. [A Critique of ANSI SQL Isolation Levels](https://blog.acolyer.org/2016/02/24/a-critique-of-ansi-sql-isolation-levels/ )
2. [Consistency Models](http://jepsen.io/consistency)

在事务中进行更新操作时，`如果两个事务中的更新顺序不同，可能出现死锁`。

事务1，先更改 stock_id = 4：

```sql
START TRANSACTION;
UPDATE StockPrice SET close = 45.50 WHERE stock_id = 4 and date = '2020-05-01';
UPDATE StockPrice SET close = 19.80 WHERE stock_id = 3 and date = '2020-05-02';
COMMIT;
```

事务2，先更改 stock_id = 3：

```sql
START TRANSACTION;
UPDATE StockPrice SET high = 20.12 WHERE stock_id = 3 and date = '2020-05-02';
UPDATE StockPrice SET high = 47.20 WHERE stock_id = 4 and date = '2020-05-01';
COMMIT;
```

innodb 会识别这种循环依赖，发现后直接报错，其它数据库有可能使用超时的方式。

innodb 发现死锁后，会把加锁数量最少（使用估计数值）的事务回滚，客户程序需要处理这种情况，譬如重试。

事务日志/Transaction Logging 用来提高事务效率，将随机IO操作尽可能转变成顺序IO操作。

Mysql 事务的特点：

1. insert/update/delete 语句自动提交事务，可以用会话变量 AUTOCOMMIT 关闭自动提交
2. set AUTOCOMMIT = 0，执行 commit 或者 rollback 后会立即开启一个新事务，即`会话一直处于事务中`
3. set AUTOCOMMIT = 1，用 begin、start transaction 开启需要执行多语句的事务
4. 有些语句在事务中使用时，会自动提交当前事务，然后再执行自身，譬如 alter table、lock tables 等
5. 事务由存储引擎实现，一个事务不能跨两个不同的存储引擎
6. 事务由存储引擎实现，`如果在一个不支持事务的表上执行事务，mysql 不会给出提示`
7. 事务中加的锁，都在 commit 或者 rollback 时释放

如果两个表使用不同的存储引擎，其中一张表不支持事务。在一个事务中同时操作这两张表，事务执行不会报错，`回滚时，不支持事务的表上的数据不会回滚`。

可以按会话设置事务的隔离级别：

```sql
mysql> SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;
```

显式加锁方法：

```sql
SELECT … LOCK IN SHARE MODE   // mysql 8.0 之前
SELECT ... FOR SHARE          // mysql 8.0 之后
SELECT ... FOR UPDATE
```

### MVCC

MVCC 目的是减少行锁的使用。

读已提交和可重复读中使用了 MVCC，读未提交和串行化不需要使用 MVCC。

MVCC 没有统一的实现标准，各个引擎按自己理解实现。

### Replication

Mysql 的 Replication 含义是： 一个节点把收到的请求分发到其它多个节点上。

这部分内容后面有个专门章节说明。

### 存储引擎

Innodb 引擎情况：

1. InnoDB 5.7 开始 支持动态 DDL，不需要锁全表
2. InnoDB 5.7 开始支持 json
3. InnoDB 8.0.7 开始支持 json 多值索引

Mysql 支持的其它存储引擎以及特点：

1. MyISAM engine：MySql 8.0 已经移除，不再支持
2. Archive engine，只支持 select 和 insert，用于高速写入和存储压缩，每行数据用zlib压缩后存储，查询时全表扫描，不支持事务
3. Blackhoe engine，只写日志，不存储数据
4. CSV engine，直接读写 csv 文件 
5. Federated engine，代理到其它 server，容易引发各种问题 mysql 默认关闭，mariadb 开发了继任 FederatedX
6. Memory engine，不支持行锁，varchar等都是存放固定大小
7. Merge storage engine，把几个 MyISAM 表虚拟成一个表，已经不建议使用
8. NDB Cluster engine，对接 NDB 集群存储


## Chapter 2. Monitoring in a Reliability Engineering World

略

## Chapter 3. Operating System And Hardware Optimization

略

## Chapter 4. Optimizing Server Settings

默认配置文件路径：

```sh
$ /usr/sbin/mysqld --verbose --help | grep -A 1 'Default options'
Default options are read from the following files in the given order:
/etc/mysql/my.cnf ~/.my.cnf /usr/etc/my.cnf
```

每个程序在配置文件中有自己的同名配置章节，譬如服务端的 mysqld 对应的配置章节是 [mysqld]。

配置项的作用域：

1. global scope：对后续所有新建会话有效
2. session scope：只对当前会话有效，断开连接后丢失

能在运行时修改的配置为动态配置（mysql重启后丢失），session scope 和 global scope 的修改方法：

```sql
SET sort_buffer_size = <value>;
SET GLOBAL sort_buffer_size = <value>;
SET @@sort_buffer_size := <value>;
SET @@session.sort_buffer_size := <value>;
SET @@global.sort_buffer_size := <value>;
```

mysql 8.0 开始支持「持久化的修改」：

```sql
SET PERSIST ...
```

查看所有全局变量：

```sql
show global variables\G;
```

内存相关：

1. 每个执行语句的连接占用的内存需要得到保证，否则会因为内存不足而执行失败
2. 预留操作系统使用的内存
3. InnoDB Buffer poll 是内存大户，缓存索引、行数据、change buffer、锁等，需要得到足够的保障

磁盘IO：

1. InnoDB 通过日志文件，减少随机写
2. tablespace 相关

## Chapter 5. Optimizing Schema And Data Types

字段类型原则：

1. smaller is usually better
2. simple is good，能用数值不用字符串
3. avoid null if possible，不允许存在 NULL 会有一定的提升，但是有限！

### 数值

整数/whole numbers：

	tinyint      8 bits
	smallint    16 bits
	mediumint   24 bits
	int         32 bits
	bigint      64 bits

实数/real numbers：

1. float 和 double 使用标准的浮点数运算计算出近似值
2. float 32 bits，double 64 bits
3. decimal 是精确的实数，没有精度损失

注意事项：

1. mysql 进行整数运算使用的是 bigint，float 和 double 的运算使用的是 double
2. decimal 能够提供精确运算可以用于金融数字，但是运算开销大。建议把小数扩大一定倍数后，按整数对待

### 字符串

对于字符串，不同的存储引擎实现方式不同，下面都是 innodb 的行为。

变长字符串/varchar：

1. 额外使用 1～2个字节存储字符串长度，超过 255 时使用两个字节记录
2. varchar 节省存储空间，但是被更改时，一行数据的长度发生变化，会产生碎片或者页面分裂，导致额外的处理
3. varchar 适用于最大长度比较大，很少被修改的场景
4. mysql 在处理 varchar 时会对它占用的内存进行悲观假设，varchar 的最大长度不要超过实际需要

定长字符串/char：

1. 适用于短小的定长字符串，譬如密码的 md5 数值
2. 通常比 varchar 更高效，并且对修改友好

变长字节/varbinary：

1. 和 varchar 类似，存放变长的二进制字符串

定长字节/binary：

1. 和 char 类似，存放二进制字符串

注意事项：

1. binary 字符串的比较操作比 char 字符串更高效
2. 如果 varchar(5) 满足需求，不要使用 varchar(200），mysql 内部处理会对需要的内存进行悲观假设，譬如临时表

### 文本

文本被作为一个单独对象处理，innodb 会把大的文本单独存放。

字符文本/text：

	tinytext
	smalltext
	text  等同于 smalltext
	mediumtext
	longtext

二进制文本/blob：

	tinyblob
	smallblob
	blob 等同于 smallblob
	mediumblob
	longblob

注意事项：

1. 对文本进行比较，mysql 只比较最前面 max_sort_length 个字符
2. 不能建立索引
3. 不要把图片存放成 blob，建议存到磁盘上，在数据库里记录位置

### 枚举 

enum 会根据枚举值集合的大小，选择适当的数值存储。

enum 的每个值被存储成`按表定义中声明顺序排列的整数`：

```sql
mysql> CREATE TABLE enum_test(
-> e ENUM('fish', 'apple', 'dog') NOT NULL
-> );
mysql> INSERT INTO enum_test(e) VALUES('fish'), ('dog'), ('apple');

mysql> SELECT e + 0 FROM enum_test;
+-------+
| e + 0 |
+-------+
| 1     |
| 3     |
| 2     |
+-------+
```

如果要按照字符顺序排序：

```sql
mysql> SELECT e FROM enum_test ORDER BY FIELD(e, 'apple', 'dog', 'fish');
+-------+
| e     |
+-------+
| apple |
| dog   |
| fish  |
+-------+
```

注意事项：

1. enum 被存储为数值，相比字符串，更节省存储空间
2. enum 和字符串拼接时，会有一个从数值到字符串的转换过程，额外开销明显
3. enum 和 enum 的拼接会更快
4. enum 被转换成数值存储，但是在字符串上下文中会被转换成字符串

### 时间

datetime：

1. 时间范围广 1000～9999年，精度毫秒，8 字节，日期部分 YYYYMMDDHHMMSS 存储为整数，和时区分开存放
2. 跨时区使用时，显示存入的字面时间，不转换

timestamp：

1. 1970 年开始的秒数，GMT 时间，精度为秒，4 字节，最多到 2038年1月19日
2. 跨时区使用时，显示在当前时区的时间，会转换

注意事项：

1. 为了避免 timestamp 的 2038 问题，直接用整数类型存放时间戳，unsigned 32-bit 支持到 2106 年

### 位

bit 底层使用的是能够容纳它的最小整数类型，`和数值类型相比，没有节省空间`。

mysql 默认把 bit 类型的字段值看作字符串。

例如 b'00111001' 转换成十进制是 57 ，对应 ascii 字符 '9'，如果直接读取，mysql 认为它是字符 '9'：

```sql
mysql> CREATE TABLE bittest(a bit(8));
mysql> INSERT INTO bittest VALUES(b'00111001');
mysql> SELECT a, a + 0 FROM bittest;
+------+-------+
| a    | a + 0 |
+------+-------+
| 9    | 57    |    
+------+-------+
```

如果用于数值运算， b'00111001' 会被转换成数值 57，`bit 的数值行为容易让人困惑，尽量避免使用`。

1. 如果表示一个Y/N，建议用 tinyint，耗费的存储空间和 bit(1) 相同
2. 如果要表示多个Y/N，建议用 Set 或整数（在代码中标记每个位的含义）

### Set

用 Set 存放多个 Y/N：

```sql
mysql> CREATE TABLE acl (
    -> perms SET('CAN_READ', 'CAN_WRITE', 'CAN_DELETE') NOT NULL
    -> );
mysql> INSERT INTO acl(perms) VALUES ('CAN_READ,CAN_DELETE');
mysql> SELECT perms FROM acl WHERE FIND_IN_SET('CAN_READ', perms);
+---------------------+
| perms               |
+---------------------+
| CAN_READ,CAN_DELETE |
+---------------------+
```

用整数存放多个 Y/N：

```sql
mysql> SET @CAN_READ := 1 << 0,
    -> @CAN_WRITE := 1 << 1,
    -> @CAN_DELETE := 1 << 2;
mysql> CREATE TABLE acl (
    -> perms TINYINT UNSIGNED NOT NULL DEFAULT 0
    -> );
mysql> INSERT INTO acl(perms) VALUES(@CAN_READ + @CAN_DELETE);
mysql> SELECT perms FROM acl WHERE perms & @CAN_READ;
+-------+
| perms |
+-------+
| 5     |
+-------+
```

注意事项：

1. Set 方式优点是直观，查询时直接显示实际含义，缺点是增加新值时，要修改字段定义

### Json

相比拆分成多个列，json 的存储空间增加，查询开销也小幅增加。

### 主键的选择

1. 设定主键后，其它表引用主键时，一定要用同样的定义，避免额外转换开销或转换错误
2. 主键类型占用的空间应尽可能小
3. 优先选择整数类型，避免使用字符串
4. 避免使用完全随机数，随机会导致数值分布空间大，数值分布不可预测，影响缓存加载，增加插入和查询开销
5. 如果要存放UUID，转换成16字节的数字存放

注意事项：

1. ORM 以及一些框架自动生成的表定义，很可能使用了不合理的字段类型

## 其它注意事项

1. 表的列数如果有上百行，会带来大量的 cpu 开销，即使只使用几列，innodb 也需要解析所有数据列
2. 太多表 join 会成为严重问题，mysql 设置的上限为 61 张表

## Chapter 6. Indexing For High Performance

索引分类：

1. B树索引
2. 全文索引

Mysql 实现的B树索引的限制：

1. 不支持非最左匹配场景
2. 不能跳过索引中的某一列，索引中的列整体构成 key，不能跳过中间某一个，以右侧的列为索引（还是最左匹配的问题）

索引推荐读物：Relational Database Index Design and the Optimizers, by Tapio Lahdenmaki and Mike Leach (Wiley)

B树索引优点：

1. 数值临近的索引，在存储空间上临近，可以为 order by 、 group by 提供优化手段
2. 索引中备份了构成给索引的字段值，如果查询请求只需要这些字段，可以避免回表查询整行数据

索引评价三星指标：

1. 是否将相关的行临近存放
2. 存放顺序是否和查询顺序一致
3. 是否包含查询需要的列

索引适合中型表和大型表，如果特别小的表，直接扫表更高效。如果表的规模非常大，索引的额外开销会很高，可以使用分区的方式处理。

### 提高索引性能的策略

目标索引包含的列在 `where 条件中单独呈现，不要加函数处理，或者放在运算表达式中`：

```sql
mysql> SELECT actor_id FROM sakila.actor WHERE actor_id + 1 = 5;      // 不会命中 actor_id 索引
```

如果区分度足够，没必要使用整个列，可以使用这个列中数值的前缀，以减少索引占用的空间。对于 blog/text，以及过长的 varchar，mysql 不允许对完整值建索引。

如果发现某个语句使用了 index_merge，需要考虑下索引能不能优化：

```sql
mysql> EXPLAIN SELECT film_id, actor_id FROM sakila.film_actor
    -> WHERE actor_id = 1 OR film_id = 1\G
*************************** 1. row ***************************
           id: 1
  select_type: SIMPLE
        table: film_actor
         type: index_merge
possible_keys: PRIMARY,idx_fk_film_id
          key: PRIMARY,idx_fk_film_id
      key_len: 2,2
          ref: NULL
         rows: 29
        Extra: Using union(PRIMARY,idx_fk_film_id); Using where
```

>TODO: Multicolumn Indexes 这节没有看明白，说是如果为每个列单独建索引，mysql 可能使用 index_merge 技术，并发过滤多个索引，然后将结果汇和，这个汇和可能非常耗费内存和CPU。

未完待续

## 参考

1. [李佶澳的博客][1]
2. [High Performance MySQL, 4th Edition][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.oreilly.com/library/view/high-performance-mysql/9781492080503/ "High Performance MySQL, 4th Edition"
