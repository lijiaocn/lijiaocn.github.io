---
layout: default
title: "《MySQL实战45讲》学习笔记：索引/事务/锁等"
author: 李佶澳
date: "2020-04-17T14:55:26+0800"
last_modified_at: "2021-10-08T15:30:06+0800"
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

这个专栏不介绍基础的增删改查语句等，主要讲解 `存储引擎`、`索引`、`锁`、`事务`等概念的细节。专栏作者是前阿里资深专家（现在腾讯云数据库负责人）林晓斌的《MySQL实战45讲》。这个专栏大概是最好最好的 MySQL 进阶材料，受益良多。


<span style="display:block;text-align:center">![林晓斌《MySQL实战45讲》MySQL深度学习]({{ site.article }}/lxbmysql.jpeg){: width="250px"}</span>

下面是我的学习笔记，[专栏地址](http://gk.link/a/10hL6)。

## 常用操作

### 配置项数值 

```sql
mysql> SHOW VARIABLES like '%sync_wait%';
+-----------------+-------+
| Variable_name   | Value |
+-----------------+-------+
| wsrep_sync_wait | 0     |
+-----------------+-------+
1 row in set (0.00 sec)
```


### 数据库状态

```sql
mysql> SHOW STATUS like '%transaction%';
+----------------------------------+-------+
| Variable_name                    | Value |
+----------------------------------+-------+
| Aria_transaction_log_syncs       | 0     |
| Rpl_transactions_multi_engine    | 0     |
| Slave_retried_transactions       | 0     |
| Transactions_gtid_foreign_engine | 0     |
| Transactions_multi_engine        | 0     |
+----------------------------------+-------+
5 rows in set (0.00 sec)
```

### innoDB 状态

```sql
mysql> SHOW ENGINE INNODB STATUS\G
*************************** 1. row ***************************
  Type: InnoDB
  Name:
Status:
=====================================
2021-09-23 16:35:34 0x7f1e44406700 INNODB MONITOR OUTPUT
=====================================
Per second averages calculated from the last 8 seconds
-----------------
BACKGROUND THREAD
-----------------
srv_master_thread loops: 2 srv_active, 0 srv_shutdown, 8067 srv_idle
srv_master_thread log flush and writes: 8064
...
```

### 表状态

```sql
mysql> show table status like "scores"\G;
*************************** 1. row ***************************
            Name: scores
          Engine: InnoDB
         Version: 10
      Row_format: Dynamic
            Rows: 4
  Avg_row_length: 4096
     Data_length: 16384
 Max_data_length: 0
    Index_length: 0
       Data_free: 0
  Auto_increment: 7
     Create_time: 2021-09-23 14:20:58
     Update_time: 2021-09-23 17:15:41
      Check_time: NULL
       Collation: latin1_swedish_ci
        Checksum: NULL
  Create_options:
         Comment:
Max_index_length: 0
       Temporary: N
1 row in set (0.00 sec)
```

>这里的Rows是采样数值，最坏会有40%～50% 的偏差

### 索引状态

```sql
mysql> show index from t;
+-------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| Table | Non_unique | Key_name | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment |
+-------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| t     |          0 | PRIMARY  |            1 | id          | A         |      100256 |     NULL | NULL   |      | BTREE      |         |               |
| t     |          1 | a        |            1 | a           | A         |      100256 |     NULL | NULL   | YES  | BTREE      |         |               |
| t     |          1 | b        |            1 | b           | A         |      100256 |     NULL | NULL   | YES  | BTREE      |         |               |
+-------+------------+----------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
3 rows in set (0.01 sec)
```

### 会话（session）状态

```sql
mysql> show  processlist;
+----+-------------+------------------+--------+---------+------+--------------------------+-------------------+----------+
| Id | User        | Host             | db     | Command | Time | State                    | Info              | Progress |
+----+-------------+------------------+--------+---------+------+--------------------------+-------------------+----------+
|  1 | system user |                  | NULL   | Daemon  | NULL | InnoDB purge coordinator | NULL              |    0.000 |
|  2 | system user |                  | NULL   | Daemon  | NULL | InnoDB purge worker      | NULL              |    0.000 |
|  3 | system user |                  | NULL   | Daemon  | NULL | InnoDB purge worker      | NULL              |    0.000 |
|  4 | system user |                  | NULL   | Daemon  | NULL | InnoDB purge worker      | NULL              |    0.000 |
|  5 | system user |                  | NULL   | Daemon  | NULL | InnoDB shutdown handler  | NULL              |    0.000 |
|  9 | root        | 172.18.0.1:56484 | testdb | Sleep   |  276 |                          | NULL              |    0.000 |
| 10 | root        | 172.18.0.1:56488 | testdb | Query   |    0 | Init                     | show  processlist |    0.000 |
+----+-------------+------------------+--------+---------+------+--------------------------+-------------------+----------+
7 rows in set (0.00 sec)
```

### kill 指定会话

终止线程会话，kill 或着 kill connection：

```sql
mysql> kill 9;
Query OK, 0 rows affected (0.01 sec)
```

终止线程当前执行的语句，kill query：

```sql
mysql> kill query 9;
Query OK, 0 rows affected (0.01 sec)
```



### 开启慢查询日志

慢查询日志是否开启，以及慢查询时间限定：

```sql
mysql> show variables like 'slow_query%';
+---------------------+---------------------------------+
| Variable_name       | Value                           |
+---------------------+---------------------------------+
| slow_query_log      | OFF                             |
| slow_query_log_file | /var/log/mysql/mariadb-slow.log |
+---------------------+---------------------------------+
2 rows in set (0.01 sec)

mysql> show variables like 'long_query_time';
+-----------------+-----------+
| Variable_name   | Value     |
+-----------------+-----------+
| long_query_time | 10.000000 |
+-----------------+-----------+
1 row in set (0.00 sec)
```

打开慢查询记录功能：

```sql
mysql> set global slow_query_log='ON';   /*需要设置 global 变量*/
Query OK, 0 rows affected (0.01 sec)

mysql> set global long_query_time=0;           /*设置为0，在慢查询日志记录所有查询语句*/
                                               /*如果不使用 global，只对当前会话有效 */
Query OK, 0 rows affected (0.00 sec)
```

或者修改配置文件后重启 mysql：

```sh
$ cat /etc/mysql/my.cnf  |grep _query_
#slow_query_log[={0|1}]
slow_query_log_file	= /var/log/mysql/mariadb-slow.log
long_query_time = 10
```

慢查询日志：

```bash
# Time: 210924 15:31:45
# User@Host: root[root] @  [172.20.0.1]
# Thread_id: 12  Schema: testdb  QC_hit: No
# Query_time: 0.001352  Lock_time: 0.000213  Rows_sent: 2  Rows_examined: 2
# Rows_affected: 0  Bytes_sent: 408
SET timestamp=1632468705;
select * from scores where id in (1,2,3);
```

### 开启 binlog 日志

log_bin 是 mysql 中的只读变量，只能通过配置文件修改：

```sh
cat my.cnf|grep log_bin
log_bin			= /var/log/mysql/mariadb-bin
#log_bin_index		= /var/log/mysql/mariadb-bin.index
```

修改配置后重启，验证是否开启：

```sql
mysql> show variables like "log_bin%";
+---------------------------------+----------------------------------+
| Variable_name                   | Value                            |
+---------------------------------+----------------------------------+
| log_bin                         | ON                               |
| log_bin_basename                | /var/log/mysql/mariadb-bin       |
| log_bin_compress                | OFF                              |
| log_bin_compress_min_len        | 256                              |
| log_bin_index                   | /var/log/mysql/mariadb-bin.index |
| log_bin_trust_function_creators | OFF                              |
+---------------------------------+----------------------------------+
6 rows in set (0.01 sec)
```

对应目录下生成 binlog 文件：

```sh
mariadb-bin.000001 mariadb-bin.index  mariadb-slow.log
```

查看 binlog 状态：

```sh
mysql> show binary logs;
+--------------------+-----------+
| Log_name           | File_size |
+--------------------+-----------+
| mariadb-bin.000001 |       330 |
+--------------------+-----------+
1 row in set (0.00 sec)
```

查看 binlog 事件，如果不指定 binlog 文件，默认使用第一个：

```sql
mysql> mysql> show binlog events in 'mariadb-bin.000001';
+--------------------+-----+-------------------+-----------+-------------+---------------------------------------------------------------------+
| Log_name           | Pos | Event_type        | Server_id | End_log_pos | Info                                                                |
+--------------------+-----+-------------------+-----------+-------------+---------------------------------------------------------------------+
| mariadb-bin.000001 |   4 | Format_desc       |         1 |         256 | Server ver: 10.4.1-MariaDB-1:10.4.1+maria~bionic-log, Binlog ver: 4 |
| mariadb-bin.000001 | 256 | Gtid_list         |         1 |         285 | []                                                                  |
| mariadb-bin.000001 | 285 | Binlog_checkpoint |         1 |         330 | mariadb-bin.000001                                                  |
| mariadb-bin.000001 | 330 | Gtid              |         1 |         372 | BEGIN GTID 0-1-1                                                    |
| mariadb-bin.000001 | 372 | Intvar            |         1 |         404 | INSERT_ID=7                                                         |
| mariadb-bin.000001 | 404 | Query             |         1 |         522 | use `testdb`; insert into scores(name,score) values('??',0)         |
| mariadb-bin.000001 | 522 | Xid               |         1 |         553 | COMMIT /* xid=15 */                                                 |
| mariadb-bin.000001 | 553 | Gtid              |         1 |         595 | BEGIN GTID 0-1-2                                                    |
| mariadb-bin.000001 | 595 | Intvar            |         1 |         627 | INSERT_ID=8                                                         |
| mariadb-bin.000001 | 627 | Query             |         1 |         745 | use `testdb`; insert into scores(name,score) values('wanger',0)     |
| mariadb-bin.000001 | 745 | Xid               |         1 |         776 | COMMIT /* xid=18 */                                                 |
+--------------------+-----+-------------------+-----------+-------------+---------------------------------------------------------------------+
11 rows in set (0.01 sec)
```

用 mysqlbinlog 命令读取 binlog 文件，如果没有解析出 sql，尝试换用和数据库版本一致的 mysqlbinlog 程序：

```sql
$ mysqlbinlog /var/log/mysql/mariadb-bin.000001
/*...省略...*/
/*!50530 SET @@SESSION.PSEUDO_SLAVE_MODE=1*/;
/*!40019 SET @@session.max_insert_delayed_threads=0*/;
BEGIN
/*!*/;
# at 818
#210924 16:16:59 server id 1  end_log_pos 850 CRC32 0x31472b26 	Intvar
SET INSERT_ID=9/*!*/;
# at 850
#210924 16:16:59 server id 1  end_log_pos 969 CRC32 0x3f535ffe 	Query	thread_id=9	exec_time=0error_code=0
SET TIMESTAMP=1632471419/*!*/;
insert into scores(name,score) values('wanger2',0)
/*!*/;
# at 969
#210924 16:16:59 server id 1  end_log_pos 1000 CRC32 0x207c38ef 	Xid = 21
COMMIT/*!*/;
/*...省略...*/
```

[binlog_format](https://dev.mysql.com/doc/refman/8.0/en/binary-log-setting.html)


### 正在执行的事务

```sql
select trx_id,trx_state,trx_started,trx_isolation_level from information_schema.innodb_trx;
+-----------------+-----------+---------------------+---------------------+
| trx_id          | trx_state | trx_started         | trx_isolation_level |
+-----------------+-----------+---------------------+---------------------+
| 421242965144032 | RUNNING   | 2021-09-23 17:28:34 | REPEATABLE READ     |
+-----------------+-----------+---------------------+---------------------+
1 row in set (0.00 sec)
```

支持的字段：

```sql
mysql> describe information_schema.innodb_trx;
+----------------------------+---------------------+------+-----+---------------------+-------+
| Field                      | Type                | Null | Key | Default             | Extra |
+----------------------------+---------------------+------+-----+---------------------+-------+
| trx_id                     | varchar(18)         | NO   |     |                     |       |
| trx_state                  | varchar(13)         | NO   |     |                     |       |
| trx_started                | datetime            | NO   |     | 0000-00-00 00:00:00 |       |
| trx_requested_lock_id      | varchar(81)         | YES  |     | NULL                |       |
| trx_wait_started           | datetime            | YES  |     | NULL                |       |
| trx_weight                 | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_mysql_thread_id        | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_query                  | varchar(1024)       | YES  |     | NULL                |       |
| trx_operation_state        | varchar(64)         | YES  |     | NULL                |       |
| trx_tables_in_use          | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_tables_locked          | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_lock_structs           | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_lock_memory_bytes      | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_rows_locked            | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_rows_modified          | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_concurrency_tickets    | bigint(21) unsigned | NO   |     | 0                   |       |
| trx_isolation_level        | varchar(16)         | NO   |     |                     |       |
| trx_unique_checks          | int(1)              | NO   |     | 0                   |       |
| trx_foreign_key_checks     | int(1)              | NO   |     | 0                   |       |
| trx_last_foreign_key_error | varchar(256)        | YES  |     | NULL                |       |
| trx_is_read_only           | int(1)              | NO   |     | 0                   |       |
| trx_autocommit_non_locking | int(1)              | NO   |     | 0                   |       |
+----------------------------+---------------------+------+-----+---------------------+-------+
```

### 排队中的锁

```sql
select * from information_schema.innodb_lock_waits;
+-------------------+-------------------+-----------------+------------------+
| requesting_trx_id | requested_lock_id | blocking_trx_id | blocking_lock_id |
+-------------------+-------------------+-----------------+------------------+
| 200836            | 200836:11:3:3     | 200833          | 200833:11:3:3    |
+-------------------+-------------------+-----------------+------------------+
```

### 目标表的加锁情况

```sql
mysql> select * from information_schema.innodb_locks where lock_table = '`testdb`.`phantom`';
+---------------+-------------+-----------+-----------+--------------------+------------+------------+-----------+----------+-----------+
| lock_id       | lock_trx_id | lock_mode | lock_type | lock_table         | lock_index | lock_space | lock_page | lock_rec | lock_data |
+---------------+-------------+-----------+-----------+--------------------+------------+------------+-----------+----------+-----------+
| 200838:11:3:3 | 200838      | X,GAP     | RECORD    | `testdb`.`phantom` | PRIMARY    |         11 |         3 |        3 | 5         |
| 200833:11:3:3 | 200833      | X         | RECORD    | `testdb`.`phantom` | PRIMARY    |         11 |         3 |        3 | 5         |
+---------------+-------------+-----------+-----------+--------------------+------------+------------+-----------+----------+-----------+
2 rows in set (0.01 sec)
```


### 开启/关闭间隙锁

`innodb_locks_unsafe_for_binlog` 为 OFF 表示启用了间隙锁：

```sql
$ show variables like 'innodb_locks_unsafe_for_binlog';
+--------------------------------+-------+
| Variable_name                  | Value |
+--------------------------------+-------+
| innodb_locks_unsafe_for_binlog | OFF   |
+--------------------------------+-------+
1 row in set (0.00 sec)
```

innodb_locks_unsafe_for_binlog 是只读变量，只能通过配置文件修改：

```sql
[mysqld]
/*...省略 ...*/
innodb_locks_unsafe_for_binlog = 1
```

## 执行过程

MySQL 客户端（mysql 命令、各种语言的 sdk）和 MySQL 数据库的连接器建立连接，连接器将 sql 语句交给分析器，经过优化后执行。

![MySQL语句执行]({{ site.article}}/mysql-sql-arch-1.png)

查询缓存往往弊大于利，将 query_cache_type 设置为 DEMAND，对于默认的 SQL 语句都不使用缓存。

>MySQL 8.0 将查询缓存的整块功能删掉了


## 主键索引、二级索引和联合索引

InnoDB 引擎中每个索引是一棵 B+ 树。 

`主键索引`的叶子节点是整行数据，`非主键索引`的叶子节点是主键的值。主键索引被称为`聚簇索引（clustered index）`，非主键索引被称为`二级索引（secondary index)`，区别就是前者的叶子节点中存放整行记录，后者叶子节点中存放的记录的主键ID。

主键长度越小，二级索引的叶子节点越小，占用空间越小，自增主键往往是更合理的选择。通过二级索引查询会查两棵树，第一次查询到主键 ID，第二次用主键 ID 查询出记录，这个过程叫「`回表`」，要尽量避免。

查询主键值可以避免回表，这种情况称为「覆盖索引」，即目标数据已经在当前查询的索引上，经常互相查询的字段可以用建立联合索引的方式避免回表。

索引使用「最左前缀原则」，即只要是索引的最左前缀就可以命中索引，设计联合索引时可利用最左匹配的特性减少索引数量。

假设为字段（a,b）建立了联合索引，那么 a 就可以不建索引，以 a 为查询条件时，可以利用联合索引的最左匹配特性。但是如果以 b 为查询条件，就不能利用最左匹配，需要为 b 单独建索引。

MySQL 5.6 引入了联合索引下推优化（index condition pushdown），在索引遍历过程中，直接过滤不满足的记录，减少回表次数。

![MySQL联合索引的下推优化]({{ site.article }}/mysql-1-index-pushdown.png)


索引优化方法：

```
1. 减少普通索引的叶子节点的大小，即主键要尽可能小
2. 高频的查询尽量通过覆盖索引，避免回表
```

### 唯一索引与普通索引

唯一索引：查询找到一个命中的记录即停止，更新时需要进行唯一性检查，将记录读取到内存中，并直接更新内存。

普通索引：查询找到第一个不再匹配的记录时停止，更新时不需要进行唯一性检查，可以缓存到 change buffer。。

如果表上有唯一索引，写入成本显著高于只有普通索引的表，将数据读取到内存时高开销操作。

写多读少的场景，尽量不使用唯一索引，用代码保证唯一性。写完立即读的场景，使用唯一索引，写入时完成即将记录加载到内存。


change buffer 是数据库的持久化的缓存，更新数据页时，如果数据页在内存中就直接更新内存，如果不在内存中，`在不影响一致性的情况下`，将更新暂存到 change buffer，对应的数据页被读入的时候再进行 merge。

change buffer 与 redolog 的区别：

![mysql change buffer 与 redolog的区别]({{ site.article }}/mysql-chagne-buffer-redolog.png)

redolog 暂存操作记录，将随机写磁盘转换成顺序写磁盘，chang buffer 减少随机读磁盘操作。

### 字符串索引使用技巧

如果区分度足够，可以只使用字符串的前缀（可减少空间占用，但是获取完整字符串时会产生回表）：

```sql
alter table SUser add index index1(email);
alter table SUser add index index2(email(6));  //前缀 6 个字节
```

如果字符串的前缀区分度不够，可以采用`倒叙存储`（字符串反转后存储）：


```sql
select field_list from t where id_card = reverse('input_id_card_string');
```

或者用 hash 值代替，使用 crc32 作为 hash 字段：

```sql
alter table t add id_card_crc int unsigned, add index(id_card_crc);
select field_list from t where id_card_crc=crc32('input_id_card_string') and id_card='input_id_card_string'
```

### 对字段进行函数计算不使用索引

如果对一个有索引的字段进行函数计算，无法使用索引的快速定位能力，导致全索引扫描。


```sql
mysql> CREATE TABLE `tradelog` (
  `id` int(11) NOT NULL,
  `tradeid` varchar(32) DEFAULT NULL,
  `operator` int(11) DEFAULT NULL,
  `t_modified` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tradeid` (`tradeid`),
  KEY `t_modified` (`t_modified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

t_modified 上索引失效，通过全表扫描的方式查找符合条件的记录：

```sql
mysql> select count(*) from tradelog where month(t_modified)=7;
```

改进成:

```sql
mysql> select count(*) from tradelog where
    -> (t_modified >= '2016-7-1' and t_modified<'2016-8-1') or
    -> (t_modified >= '2017-7-1' and t_modified<'2017-8-1') or 
    -> (t_modified >= '2018-7-1' and t_modified<'2018-8-1');
```

### 隐式类型转换导致全索引扫描

tradeid 在数据库中的类型是 varchar，下面的语句使用的比较数值是数字，mysql 默认将字符串转化成数值：

```sql
mysql> select * from tradelog where tradeid=110717;

```

等同于对字段进行函数转换，导致全索引扫描：

```sql

mysql> select * from tradelog where  CAST(tradid AS signed int) = 110717;
```

如果两个表使用了不同的编码，这两个表的字段进行比较时，默认进行编码转换，也可能导致全索引扫描。

## 锁

### 全局锁

**全局读锁**：flush tables with read lock，整个库处于只读状态，其它线程中的操作语句都会被阻塞，全局锁通常用来做全库逻辑备份。

如果引擎不支持可重复读，全库数据备份时需要加全局读锁，如果支持可重复，备份时开启一个事务，备份该事务中的视图数据，mysqldump 的 -single-transaction 参数在导数据之前启动事务。

### 表级锁 

**表级锁**：表级锁分为`表锁`和`元数据锁`。

表锁用法：对其它线程和当前线程都起作用。

```
locka tables ... read/write
unlock tables 
locak tables t1 read,t2 write
```

**元数据锁**：MDL，MySQL 5.5 引入，进行增删改查操作时，会自动对 MDL 加读锁，修改表结构时（修改字段/索引）会对 MDL 加写锁。

对一个热点表就行修改时，修改操作因为等待写锁阻塞，后续的数据操作随即因为等待读锁而阻塞，会导致数据库的线程耗尽（一个表加字段、修改字段、加索引时，需要扫描全表的数据，在对大表操作时，要特别小心）。 

在 alter table 语句中设置等待时间，如果等待时间里没有拿到 MDL 写锁就放弃，不阻塞后续线程。

```sql
ALTER TABLE tbl_name WAIT N add column ...
```

### 行级锁

行锁是每个存储引擎自行实现的。

InnoDB 在修改行记录是自动加行锁，如果是在事务中加了行锁，要等到整个事务结束时释放。因此如果一个事务中要更新行，尽可能把会造成冲突操作放在最后，减少锁等待。

>MyISAM 不支持行锁，InnoDB 支持

### 间隙锁（Gap Lock）

为了解决「幻读」问题，innoDB 引入了间隙锁，`隔离级别为可重复读时，间隙锁才会启用`。

间隙锁解决了幻读问题，但是存在会导致在事务中更新一行数据时，锁住了一片，从而使其它事务无法插入数据。

`innodb_locks_unsafe_for_binlog` 为 OFF 表示启用了间隙锁。

>幻读的后果是通过binlog恢复的数据和主库的数据不同，关闭了间隙锁意味着 binlog 可能是不可靠的（unsafe）。 

```sql
$ show variables like 'innodb_locks_unsafe_for_binlog';
+--------------------------------+-------+
| Variable_name                  | Value |
+--------------------------------+-------+
| innodb_locks_unsafe_for_binlog | OFF   |
+--------------------------------+-------+
1 row in set (0.00 sec)
```


### 死锁检测成本

开启死锁检测后，每个新来的`被阻塞`线程都要检测自己的加入是否会导致死锁，如果 1000 个线程等待更新被锁住的同一行，检测次数是 1000 * 1000。


解决方法：

1. 如果确定不会死锁，临时关掉死锁检测（有风险）
2. 控制并发数，同一行只允许 10 个并发线程，其它线程等待（需要改动数据库服务端）
3. 将单行记录拆分为多行

```
innodb_lock_wait_timeout: 锁超时时间，默认 50s
innodb_deadlock_detect：  默认为 on，开启死锁检测，主动回滚一个事务（建议方案）
```

## 可靠性保证

### WAL（Write-Ahead logging）：预写式日志 与 redolog

WAL：先记录数据变更日志，然后择机更新数据。

Mysql InnoDB 引擎使用了 Wal 技术，收到更新指令式，更新操作保存在 redo log 中，然后更新内存中数据，最后在适当时候完成磁盘中的数据更新。redo log 的存在减少了对磁盘的「随机写」。redolog 采用环状设计进行循环写，写满后就刷新到磁盘。redo log 数据持久化保存，进程崩溃时已写入数据不丢失。

InnoDB 采用 redo log 实现了 crash-safe（崩溃时不丢数据），最早的 MyISAM 引擎不具备 crash-safe  的能力。

### redolog、binlog 与两阶段提交

redolog 是 innoDB 引擎的日志，循环写，用于数据暂存。binlog 是 MySQL Server 层的日志，所有引擎都可以开启，采用追加写的方式，形成一个个日志文件。 

redolog 记录数据页 “做了什么改动”。binlog 记录了过去一段时间里的所有操作记录，主要用来恢复数据。binlog 有两种格式，statement 格式记 sql 语句，row 格式记录行的内容，记两条，更新前和更新后的。

数据更新时，先写入 redo log，然后再写入 binlog，写入 binlog 成功后才提交事务。浅颜色是 InnoDB 的操作，深颜色是 Server 的操作：

![mysql更新时redolog和binlog的更新过程]({{ site.article }}/mysql-log-1.png)


这个更新过程叫「两阶段提交」，prepare 阶段引擎写入 redolog，server 写入 binlog，然后开始 commit。
如果这期间宕机，MySQL 重启时根据 redolog 和 binlog 判断更新操作是否完成：只有 redolog 没有 binlog，撤回更新。


相关参数：

```sh
innodb_flush_log_at_trx_commit：建议值为1，每次事务的 redolog 直接持久化到磁盘
sync_binlog：                   建议值为1，每次事务的 binlog 都持久化到磁盘
```

数据库多久备份一次？备份间隔时间越长，从 binlog 恢复耗时越久。

## 事务

Atomicity（原子性）： 事务中语句要么同时成功，要么同时失败。

Consistency（一致性）：事务操作必须将数据库从一个有效状态转换到另一个有效状态，不存在违反数据库其它约束的无效状态。

Isolation（隔离性）：事务与事务之间隔离。

Durability（持久性）：事务提交成功后，相应数据持久化，不会丢失。

### InnoDB 的视图快照

理解视图快照是理解事务特性的窍门。

如果用 begin/start transaction 开启事务，在执行第一个语句的时候创建视图。如果要立即创建视图，使用命令：

```sql
start transaction with consistent snapshot
```

InnoDB 事务开启后，修改一行数据时，生成一个以当前事务号为版本的数据记录， 因此一行数据有多个事务编号下的多个不同的数值。其它事务在读取该行数据时，select 方法只会读取到对应事务编号版本的数据（可重复读），update 方法或加锁的 select 方法读取的是改行的最新版本中的数值（`当前读，即读取当前数值`）。

在事务中，执行 update 操作，或者用下面的 select 语句，读取的是该行的最新版本数值：

```sql
mysql> select k from t where id=1 lock in share mode;
mysql> select k from t where id=1 for update;
```

为了避免当前读引发错误，`当前读必须等待行锁释放`，如果另一个事务还没提交，当前读会阻塞等待行锁释放（即另一个事务提交）。


### MVCC（多版本并发控制）

同一条记录在系统中存在多个版本，每个事务开启时会创建一个 「视图」。

事务执行过程中，被改动的行会保留每次变更的回滚，其它事务要读取当前行数值时，按照事务隔离级别选择对应的回滚数值。

如果一个事务长时间存在，会形成大量回滚日志，所以要 `避免长事务`。

事务1看到的是第一个版本，然后事务2连续进行N次更新，形成多个undo log：

![长事务]({{site.article}}/mysql-long-tranaction.webp)


### 事务隔离级别

按照事务中可以看到的行数据的版本，把事务的隔离分为 4 个级别：

```
1. 读未提交：可以读取到其它事务没有提交的改动。
2. 读提交  ：可以读取到其它事务已经提交的改动。
3. 可重复读：只能读取当前事务创建时快照版本的数据。
事务执行中读取「快照」数据（建立一个事务试图），事务执行过程看到的数据和事务启动时看到的数据严格一致，无论其它进行了变更的事务是否提交
4. 串行化：  事务串行执行，写时加写锁，读时加读锁（最高等级，相当于无并发）
```

### 事务操作建议

查询长事务：

```sql
select * from information_schema.innodb_trx where TIME_TO_SEC(timediff(now(),trx_started))>60
```

### 脏读、不可重复读、幻读

事务中的据读取错误场景：

* 脏读：读取到其它事务尚未提交到数据
* 不可重复读：在一个事务中，对于同一行记录，两次读取到不同数值，第二次读取到其它事务已提交的修改
* 幻读：在一个事务中，两次条件查询，得到的记录数不同，第二次查询到其它事务新插入的记录

不同隔离级别下存在读读取错误现象：

| 隔离级别 |  脏读(dirty reads) |  不可重复读(non-repeatable reads | 幻读 (phantom reads) |
|----------|--------------------|----------------------------------|----------------------|
| 读未提交 |        会          |         会                       |      会              |
| 读已提交 |        不会        |         会                       |      会              | 
| 可重复读 |        不会        |         不会                     |      会              |
| 可序列化 |        不会        |         不会                     |      不会            |


* [事务隔离中的读现象](https://zh.wikipedia.org/wiki/%E4%BA%8B%E5%8B%99%E9%9A%94%E9%9B%A2#%E8%AF%BB%E7%8E%B0%E8%B1%A1%E4%B8%BE%E4%BE%8B)
* [英文wiki](https://en.wikipedia.org/wiki/Isolation_(database_systems))

### 幻读与 binlog 结合的后果

只有要使用 binlog 的时候，幻读才会有实际影响，会导致通过 binlog 恢复的数据和语句执行时产生的数据不一致。

初始数据如下：

```sql
mysql> select * from phantom;
+----+------+------+
| id | c    | d    |
+----+------+------+
|  0 |    0 |    0 |
|  5 |    5 |    5 |
| 10 |   10 |   10 |
| 15 |   15 |   15 |
| 20 |   20 |   20 |
| 25 |   25 |   25 |
+----+------+------+
6 rows in set (0.01 sec)
```

事务 A 开启后，修改所有 d=5 的记录，将其扩大 10 倍：

```sql
/*事务A*/
mysql> begin;
Query OK, 0 rows affected (0.00 sec)

mysql> update phantom set d=d*10 where d=5;
Query OK, 1 row affected (0.01 sec)
Rows matched: 1  Changed: 1  Warnings: 0

mysql> select * from phantom;
+----+------+------+
| id | c    | d    |
+----+------+------+
|  0 |    0 |    0 |
|  5 |    5 |   50 |
| 10 |   10 |   10 |
| 15 |   15 |   15 |
| 20 |   20 |   20 |
| 25 |   25 |   25 |
+----+------+------+
6 rows in set (0.01 sec)
```

在事务 A 还没有提交的时候，事务 B 插入了一条新的 d=5 的记录：：

>注意：必须在关闭间隙锁，事务 B 才能完成插入，间隙锁是 innoDB 为了解决幻读问题引入的锁。打开间隙锁后，阻止了事务B的写入，从而不会出现幻读问题。

>间隙锁关闭方法在前面章节中。

```sql
/*事务B*/
mysql> insert into phantom(id,c,d) values(1,1,5);
Query OK, 1 row affected (0.01 sec)
/*事务B提交*/
```

事务A在事务B之后提交：

```sh
# 事务A 提交
mysql> commit;
Query OK, 0 rows affected (0.01 sec)
```

事务A中的更新语句在事务B之前完成，`不会更新事务B新写入的记录`，最终结果如下：

```sql
mysql> select *  from phantom;
+----+------+------+
| id | c    | d    |
+----+------+------+
|  0 |    0 |    0 |
|  1 |    1 |    5 |  /*事务B写入的记录，数值没有放大10倍*/
|  5 |    5 |   50 |
| 10 |   10 |   10 |
| 15 |   15 |   15 |
| 20 |   20 |   20 |
| 25 |   25 |   25 |
+----+------+------+
7 rows in set (0.01 sec)
```

最终的数据值是按照两个事务中语句实际执行顺序确定的，但是 binlog 中记录的语句是按照事务的提交顺序记录的：


```sql
mysql> show binlog events in 'mariadb-bin.000002';
/*...省略...*/
| mariadb-bin.000002 | 1412 | Gtid  |  1 |  1454 | BEGIN GTID 0-1-12                                         |
| mariadb-bin.000002 | 1454 | Query |  1 |  1564 | use `testdb`; insert into phantom(id,c,d) values(1,1,5)   |
| mariadb-bin.000002 | 1564 | Xid   |  1 |  1595 | COMMIT /* xid=67 */                                       |
| mariadb-bin.000002 | 1595 | Gtid  |  1 |  1637 | BEGIN GTID 0-1-13                                         |
| mariadb-bin.000002 | 1637 | Query |  1 |  1741 | use `testdb`; update phantom set d=d*10 where d=5         |
| mariadb-bin.000002 | 1741 | Xid   |  1 |  1772 | COMMIT /* xid=65 */                                       |
+--------------------+------+-------+----+-------+-----------------------------------------------------------+
```

同步主库数据或数据恢复的时候，是按照 binlog 中的顺序执行的，这时候事务 B 写入的记录会被事务 A 的语句更新，`通过 binlog 生成的数据和主库数据不一致`：


```sql
/*主库事务A和B执行后的数据*/                 /*从库或通过binlog恢复的数据*/
mysql> select *  from phantom;             mysql> select *  from phantom; 
+----+------+------+                       +----+------+------+
| id | c    | d    |                       | id | c    | d    |
+----+------+------+                       +----+------+------+
|  0 |    0 |    0 |                       |  0 |    0 |    0 |
|  1 |    1 |    5 |  < different value >  |  1 |    1 |   50 |
|  5 |    5 |   50 |                       |  5 |    5 |   50 |
| 10 |   10 |   10 |                       | 10 |   10 |   10 |
| 15 |   15 |   15 |                       | 15 |   15 |   15 |
| 20 |   20 |   20 |                       | 20 |   20 |   20 |
| 25 |   25 |   25 |                       | 25 |   25 |   25 |
+----+------+------+                       +----+------+------+
7 rows in set (0.01 sec)                   7 rows in set (0.01 sec)       
```

## 临时表与内存表

临时表：

* 只能被创建它的 session 访问，对其它线程不可见
* `临时表与普通表同名时，临时表覆盖普通表`
* show tables 不展示临时表
* 临时表会被自动回收，不需要手动清除
* binlog format 为 row 时，不记录临时表操作
* 创建方法：create temporary table

内存表：

* 内存表是使用`memory`存储引擎的表，数据全存放在内存中，重启后消失
* 不支持行锁，只支持表锁，串行更新
* create table temp_t(id int primary key, a int, b int, index (b)) engine=`memory`;

临时表可以是内存表，即使用 memory 存储引擎的临时表。

### 利用临时表提高 join 性能 

如果被驱动表上有条件筛选并且不适合加索引，创建临时表，将数据读取到临时表中：

```sql

create temporary table temp_t(id int primary key, a int, b int, index(b))engine=innodb;
insert into temp_t select * from t2 where b>=1 and b<=2000;
select * from t1 join temp_t on (t1.b=temp_t.b);
```

### 利用临时表解决分库分表实现难度

如果查询语句中没有用到分区字段，不能根据分区字段值锁定分表实例，这时候需要在所有实例上进行查询：

```sql
select v from ht where k >= M order by t_modified desc limit 100;
```

一种实现方式是，创建临时表，存入从所有分表实例上查询出的数据，在临时表上进行后续的的排序等操作。



## 语句执行分析

### 排序

使用 order by 时，如果筛选出的数据本身是无序的，需要对结果数据进行排序。如果数据量过大，使用外部排序。

### Join


对驱动表进行全表扫描，如果被驱动表对应字段上有索引，进行树搜索，否则全表扫描。

如果被驱动表上有条件筛选并且不适合加索引，可以创建临时表，将数据读取到临时表中：

```sql

create temporary table temp_t(id int primary key, a int, b int, index(b))engine=innodb;
insert into temp_t select * from t2 where b>=1 and b<=2000;
select * from t1 join temp_t on (t1.b=temp_t.b);
```


## MySQL运维实践

### 选错索引

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

### sql 执行抖动

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

### 表空间的回收

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
