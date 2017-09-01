---
layout: default
title: postgres数据库的基本使用
author: lijiaocn
createdate: 2017/08/31 09:43:20
changedate: 2017/09/01 15:56:39
categories: 技巧
tags: database
keywords: posgres,postgresql,database
description: postgresql的基本使用，最常用的操作。

---

* auto-gen TOC:
{:toc}

## 介绍 

postgresql是一个老牌的数据库，它的文档[postgresql manuals][1]中包含更多的内容。

## 命令行psql

posgresql的client是psql，通过`psql --help`可以查看具体用法。

登录数据库:

	psql -U <用户名>  <数据库>
	
	Connection options:
	  -h, --host=HOSTNAME      database server host or socket directory (default: "local socket")
	  -p, --port=PORT          database server port (default: "5432")
	  -U, --username=USERNAME  database user name (default: "root")
	  -w, --no-password        never prompt for password
	  -W, --password           force password prompt (should happen automatically)

退出命令为`\q`。

控制台命令:

	\h：查看SQL命令的解释，比如\h select。
	\?：查看psql命令列表。
	\l：列出所有数据库。
	\c [database_name]：连接其他数据库。
	\d：列出当前数据库的所有表格。
	\d [table_name]：列出某一张表格的结构。
	\du：列出所有用户。
	\e：打开文本编辑器。
	\conninfo：列出当前数据库和连接的信息。

## 在容器中启动

获取镜像:

	docker pull docker.io/postgres:latest

以postgres为base，加入sql文件制作得到新镜像:

	$cat Dockerfile
	FROM postgres:latest
	ADD ./tenxcloud_2_0.postgres.sql  /docker-entrypoint-initdb.d

	$docker build -t mypostgres:latest .

启动postgres:

	docker run -idt \
		-e POSTGRES_PASSWORD="alice" \
		-e POSTGRES_USER="alice" \
		-e POSTGRES_DB="alice"  \
		-p 5432:5432  \
		mypostgres:latest

通过查看镜像docker.io/postgres可以知道，容器的entrypoint是镜像中的脚本`docker-entrypoint.sh`。该脚本运行的时候会自动创建用户，并执行目录`/docker-entrypoint-initdb.d`中的.sh、.sql和.sql.gz文件。

## 参考

1. [postgresql manuals][1]

[1]: https://www.postgresql.org/docs/manuals/  "postgresql manuals" 

