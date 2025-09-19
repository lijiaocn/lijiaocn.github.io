---
layout: default
title: "数据库表结构设计: 字段类型与取值范围"
author: 李佶澳
date: "2020-02-18T09:28:26+0800"
last_modified_at: "2020-02-18T09:28:26+0800"
categories: 编程
cover: 
tags: database
keywords: database,mysql,design
description: 最常用的数据库知识收集，SQL语法、表定义、字段类型与取值范围等。
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

最常用的数据库知识收集，SQL语法、表定义、字段类型与取值范围等。

文档：[mysql: sql syntax: CREATE TABLE Statement][3]

列类型定义，[mysql: sql syntax: Data Types][4]，mysql 5.7 支持以下类型：

## 数值

整数类型：

```sh
Type         Storage    Minimum Value    Minimum Value   Maximum Value   Maximum Value
             Bytes      Signed           Unsigned        Signed          Unsigned
TINYINT        1        -128             0               127             255
SMALLINT       2        -32768           0               32767           65535
MEDIUMINT      3        -8388608         0               8388607         16777215
INT            4        -2147483648      0               2147483647      4294967295
BIGINT         8        -2^63            0               2^63-1          2^64-1
```

精确数值，精确的十进制数：

```sh
salary DECIMAL(5,2)   # 数值位数是 5，精确位数是 2，取值范围为：-999.99 ~ 999.99
```

浮点数，非精确值：

```sh
FLOAT
DOUBLE
```

位值：

```sh
BIT(M)    # M 的范围是 1～64
```

## 日期

```sh
Data Type     “Zero” Value
 DATE          '0000-00-00'
 TIME          '00:00:00'
 DATETIME      '0000-00-00 00:00:00'
 TIMESTAMP     '0000-00-00 00:00:00'
 YEAR           0000
```

## 字符串

```sh
DataType   
 CHAR
 VARCHAR
 BINARY
 VARBINARY
 BLOB
 TEXT
 ENUM
 SET
```

## 位置

```sh
GEOMETRY
POINT
LINESTRING
POLYGON 
MULTIPOINT
MULTILINESTRING
MULTIPOLYGON
GEOMETRYCOLLECTION 
```

## Json

```sh
mysql> CREATE TABLE t1 (jdoc JSON);
Query OK, 0 rows affected (0.20 sec)

mysql> INSERT INTO t1 VALUES('{"key1": "value1", "key2": "value2"}');
Query OK, 1 row affected (0.01 sec)
```

## 参考

1. [李佶澳的博客][1]
2. [mysql: SQL Statements][2]
3. [mysql: sql syntax: CREATE TABLE Statement][3]
4. [mysql: sql syntax: Data Types][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://dev.mysql.com/doc/refman/5.7/en/sql-statements.html "mysql: SQL Statements"
[3]: https://dev.mysql.com/doc/refman/5.7/en/create-table.html "mysql: sql syntax: CREATE TABLE Statement"
[4]: https://dev.mysql.com/doc/refman/5.7/en/data-types.html "mysql: sql syntax: Data Types"
