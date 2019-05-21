---
layout: default
title: 怎样用MySQL Workbench设计数据库？
author: 李佶澳
createdate: 2017/10/24 18:59:04
changedate: 2017/10/30 10:41:30
categories: 方法
tags: database
keywords: mysqlworkbench,数据库设计,database
description: MySQL WorkBench是mysql社区提供一个数据库设计软件。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明 

[MySQL WorkBench][1]是mysql社区提供的一个数据库设计软件。

可以通过这里快速上手: [怎样用MySQL WorkBench设计数据库?][2]

![MySql WorkBench Design]({{ site.imglocal }}/mysql-workbench/08-complex-example.png)

这里是一些更深入的内容，主要参考了[MySQL Document][3]、[MYSQL's SQL Statement Syntax][4]。

## 关于外键

[MySQL's FOREIGN KEY][5]中对MySQL的外链做了很详细的说明。

	[CONSTRAINT [symbol]] FOREIGN KEY
	    [index_name] (index_col_name, ...)
	    REFERENCES tbl_name (index_col_name,...)
	    [ON DELETE reference_option]
	    [ON UPDATE reference_option]
	
	reference_option:
	    RESTRICT | CASCADE | SET NULL | NO ACTION | SET DEFAULT

表A中的列可以索引到表B中的行，表A是child、表B是parent，外键在child上设置。

使用外键的关键点是，parent中的数据更新时，索引到parent的child中的数据应该如何处理。

在child的外键定义中，可以通过`ON DELETE`和`ON UPDATE`指定下列五种Action中的一种：

	CASCADE:      级连，更新或删除parent中的数据时，也更新或删除child中对应的行。
	SET NULL:     置空，更新或删除parent中的数据时，将child中对应行的列设置为NULL。
	RESTRICT:     禁止，如果child中存在对应的数据，禁止更新或操作parent中对应的行。
	NO ACTION:    禁止，等同于RESTRICT，表中SQL中用`NO ACTION`表示RESTRICT。
	SET DEFAULT:  重置，设置为默认值

关于`SET DEFAULT`:

	This action is recognized by the MySQL parser, but both InnoDB and NDB reject table
	definitions containing ON DELETE SET DEFAULT or ON UPDATE SET DEFAULT clauses. 

在MySql Workbench左侧的工具栏中，有五个外键按钮，分别为：

	key1: 1:1 Non-identifying Relationship  parent与child是1对1的关系，child的primary key不包含外键
	key2: 1:n Non-identifying Relationship  parent与child是1对N的关系，child的primary key不包含外键
	key3: 1:1 Identifying Relationship      parent与child是1对1的关系，child的primary key中包含外键
	key4: 1:n Identifying Relationship      parent与child是1对N的关系，child的primary key中包含外键
	key5: n:m Identifying Relationship      创建一张新表记录parent与child的`多对多`关系

需要注意`key1和key2`, `key3和key4`，虽然分别是1:1和1:n，但是生成的数据库表其实并没有区别。

## 导出的mysql

EER图设计完之后，可以直接导出到mysql数据库：

	Database -> Synchronize Model

## 记录的修改时间

在如果一个列的类型为`TIMESTAMP`，创建得到的表中，这个列的定义将如下:

	`updatetime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

创建、修改记录的时候，都会更新时间。

如果要只在创建的时候，自动写入创建时间，可以将创建一个类型`DATETIME`的列，默认值设置为`now()`:

![自动写入创建时间]({{ site.imglocal }}/mysql-workbench/09-createtime.png )

生成的数据库表中定义:

	`createtime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,

>注意，必须勾选not null。

## 参考

1. [MySQL WorkBench主页][1]
2. [怎样用MySQL WorkBench设计数据库?][2]
3. [MySQL Document][3]
4. [MySQL's SQL Statement Syntax][4]
5. [MySQL's FOREIGN KEY][5]
6. [MySQL Workbench's Document][6]

[1]: https://www.mysql.com/products/workbench/  "MySQL WorkBench主页" 
[2]: https://jingyan.baidu.com/article/636f38bb69c3dbd6b9461076.html "怎样用MySQL WorkBench设计数据库?"
[3]: https://dev.mysql.com/doc/refman/5.7/en/create-table.html "MySQL's Document"
[4]: https://dev.mysql.com/doc/refman/5.7/en/sql-syntax.html  "MySQL's SQL Statement Syntax"
[5]: https://dev.mysql.com/doc/refman/5.7/en/create-table-foreign-keys.html "MySQL's FOREIGN KEY"
[6]: https://dev.mysql.com/doc/workbench/en/ "MySQL Workbench's Document"
