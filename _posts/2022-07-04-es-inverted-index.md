---
layout: default
title: "ElasticSearch 零基础入门（5）: 倒排索引适用场景、Mysql的全文索引使用"
author: 李佶澳
date: "2022-07-04 11:42:40 +0800"
last_modified_at: "2022-07-05 19:26:26 +0800"
categories: 项目
cover:
tags: ElasticSearch
keywords: ElasticSearch,es
description: "如果倒排索引（inverted index）那么好，为什么关系型数据库里不使用？"
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

笔记列表：[ElasticSearch](/tags/all.html#ElasticSearch)

不少讲解 ElasticSearch 的资料，都会重点讲解 ElasticSearch 使用的倒排索引（inverted index）多么高效/优异，但是都忘了提及倒排索引的应用场景。如果倒排索引那么好，为什么关系型数据库里不使用？ [为啥mysql等关系型数据库的索引实现方式不用lucene的这种倒排索引呢？][2]

## 倒排索引适用于全文检索

倒排索引适用的场景非常明确——全文检索。

倒排索引将大段 text 文本分拆成多个单词，用分拆后的部分内容（单词）索引记录的 ID 。这正是全文检索的过程，或者说倒排索引是为全文检索场景设计的。

在 ES 中 text 类型的字段支持全文检索，keyword 等精确类型是不支持全文检索的。

输入 title 的完整值 “背影”，返回一条命中记录：

```sh
GET demo/_search
{
  "query":{
    "match": {
      "title.keyword": "背影"  <-- 返回结果背影
    }
  }
}
```

如果只输入 “背”，没有命中结果返回，keyword 类型不支持全文检索：

```sh
GET demo/_search
{
  "query":{
    "match": {
      "title.keyword": "背"
    }
  }
}
```

ES 作为搜索引擎，它的主要特点是用倒排索引技术实现了全文检索功能，但是不能把 ES 的所有查询能力都归功于倒排索引的应用。

## 关系型数据也支持倒排索引 

倒排索引只是索引的一种实现方式，并非只在 ES 中有应用，关系型数据库同样支持。比如 [InnoDB Full-Text Indexes][3] 就是用倒排索引实现了全文检索的功能。

## 倒排索引的缺点

全文检索的时候，倒排索引的优势明显，但是当需要进行精确值查询时， 倒排索引就不是一个高效的技术方案了。

假设有一个如下的地址字段，查询场景是精确找到「山东省济南市」这条记录：

```sh
address
_______
山东省
山东省济南市
山东省济南市历下区
山东省烟台市
山东省烟台市开发区
```

如果使用倒排索引，输入「山东省济南市」时，会同时返回「山东省济南市」和「山东省济南市历下区」两条记录。要想得到「山东省济南市」这条记录，需要对返回的结果再次检查。如果「山东省济南市XXX」格式的记录数有很多，查询效率就很低了，如果查询「山东省」效率更低。。 

精确查询「山东省济南市」这种场景下，要用常规的 B+ 树索引。

ES 通过为一个字段指定多种类型的方式，满足了精确查询和全文检索两种场景，猜测应该是建立了两套索引（未看ES的实现，这里纯猜测）。关系型数据库绝大多数场景都是精确值查询，最经常使用的索引类型是 B+ 树。

## Mysql 全文索引使用

参照 [InnoDB Full-Text Indexes][3] 试验一下。下面的操作在 mysql 8.0 上执行。

```sql
CREATE TABLE opening_lines (
       id INT UNSIGNED AUTO_INCREMENT NOT NULL PRIMARY KEY,
       opening_line TEXT(500),
       author VARCHAR(200),
       title VARCHAR(200),
       FULLTEXT idx (opening_line)
       ) ENGINE=InnoDB;
```

查看 mysql 创建的索引表，testdb 是所在的数据库名，如果上面的表在 abc 中创建的，就用 abc/%：

```sql
mysql> SELECT table_id, name, space from INFORMATION_SCHEMA.INNODB_TABLES  WHERE name LIKE 'testdb/%';
+----------+------------------------------------------------------+-------+
| table_id | name                                                 | space |
+----------+------------------------------------------------------+-------+
|     1067 | testdb/test                                          |     2 |
|     1068 | testdb/scores                                        |     3 |
|     1069 | testdb/opening_lines                                 |     4 |
|     1070 | testdb/fts_000000000000042d_being_deleted            |     5 |
|     1071 | testdb/fts_000000000000042d_being_deleted_cache      |     6 |
|     1072 | testdb/fts_000000000000042d_config                   |     7 |
|     1073 | testdb/fts_000000000000042d_deleted                  |     8 |
|     1074 | testdb/fts_000000000000042d_deleted_cache            |     9 |
|     1075 | testdb/fts_000000000000042d_00000000000000a6_index_1 |    10 |
|     1076 | testdb/fts_000000000000042d_00000000000000a6_index_2 |    11 |
|     1077 | testdb/fts_000000000000042d_00000000000000a6_index_3 |    12 |
|     1078 | testdb/fts_000000000000042d_00000000000000a6_index_4 |    13 |
|     1079 | testdb/fts_000000000000042d_00000000000000a6_index_5 |    14 |
|     1080 | testdb/fts_000000000000042d_00000000000000a6_index_6 |    15 |
+----------+------------------------------------------------------+-------+
```

操作：

```sql
INSERT INTO opening_lines (opening_line) values ("春天来了"),("夏天来了"),("秋天来了"),("冬天到了"),("春天 夏天");

INSERT INTO opening_lines(opening_line,author,title) VALUES
       ('Call me Ishmael.','Herman Melville','Moby-Dick'),
       ('A screaming comes across the sky.','Thomas Pynchon','Gravity\'s Rainbow'),
       ('I am an invisible man.','Ralph Ellison','Invisible Man'),
       ('Where now? Who now? When now?','Samuel Beckett','The Unnamable'),
       ('It was love at first sight.','Joseph Heller','Catch-22'),
       ('All this happened, more or less.','Kurt Vonnegut','Slaughterhouse-Five'),
       ('Mrs. Dalloway said she would buy the flowers herself.','Virginia Woolf','Mrs. Dalloway'),
       ('It was a pleasure to burn.','Ray Bradbury','Fahrenheit 451');
```

查询：

```sql
mysql >SELECT *  FROM opening_lines WHERE MATCH(opening_line) AGAINST('happened');
+----+----------------------------------+---------------+---------------------+
| id | opening_line                     | author        | title               |
+----+----------------------------------+---------------+---------------------+
| 10 | All this happened, more or less. | Kurt Vonnegut | Slaughterhouse-Five |
+----+----------------------------------+---------------+---------------------+
```

但是查询中文时会发现要输入完整内容才会有结果，这涉及到中文分词的问题，mysql 的分词能力配置方式未知，大概率比 ES 差很多。

```sql
mysql> SELECT * FROM opening_lines WHERE MATCH(opening_line) AGAINST('春天');
Empty set (0.00 sec)

mysql>  SELECT *  FROM opening_lines WHERE MATCH(opening_line) AGAINST('春天来了');
+----+--------------+--------+-------+
| id | opening_line | author | title |
+----+--------------+--------+-------+
|  1 | 春天来了     | NULL   | NULL  |
+----+--------------+--------+-------+
```


## 参考

1. [李佶澳的博客][1]
2. [为啥mysql等关系型数据库的索引实现方式不用lucene的这种倒排索引呢？][2]
3. [InnoDB Full-Text Indexes][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.zhihu.com/question/317949649 "为啥mysql等关系型数据库的索引实现方式不用lucene的这种倒排索引呢？"
[3]: https://dev.mysql.com/doc/refman/5.6/en/innodb-fulltext-index.html#:~:text=Inverted%20indexes%20store%20a%20list,stored%2C%20as%20a%20byte%20offset. "InnoDB Full-Text Indexes"
