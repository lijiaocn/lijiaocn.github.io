---
layout: default
title: postgres数据库的基本使用
author: lijiaocn
createdate: 2017/08/31 09:43:20
changedate: 2017/09/08 14:26:42
categories: 技巧
tags: PostgreSQL
keywords: posgres,postgresql,database
description: postgresql的基本使用，最常用的操作。

---

* auto-gen TOC:
{:toc}

## 介绍 

postgresql是一个老牌的数据库，它的文档[postgresql manuals][1]中包含更多的内容。

## 部署启动

### 1. 在CentOS上使用

安装：

	yum install -y  postgresql-server

启动前初始化：

	postgresql-setup initdb

启动：

	systemctl start postgresql

需要以postgre用户身份登陆管理：

	su - postgres
	psql

### 2. 在容器中启动

获取镜像:

	docker pull docker.io/postgres:latest

如果要把sql文件打包到镜像中，在启动postgre时自动创建相关到库，需要以postgres为base，加入sql文件制作成新镜像:

	$cat Dockerfile
	FROM postgres:latest
	ADD ./your.sql  /docker-entrypoint-initdb.d
	
	$docker build -t mypostgres:latest .

通过查看镜像docker.io/postgres可以知道，容器的entrypoint是镜像中的脚本`docker-entrypoint.sh`。
该脚本运行的时候会自动创建用户，并加载执行目录`/docker-entrypoint-initdb.d`中的.sh、.sql和.sql.gz文件。

启动postgres:

	docker run -idt \
		-e POSTGRES_PASSWORD="alice" \
		-e POSTGRES_USER="alice" \
		-e POSTGRES_DB="alice"  \
		-p 5432:5432  \
		mypostgres:latest

## postgres的用户创建

这个需要认真说下，很多很多人在这踩坑。

postgre启动后，默认用户是postgres，需要在运行postgres的机器上，切换为postgres用户，然后才能通过psql直接进入：

	# su - postgres
	Last login: Fri Sep 28 15:23:41 CST 2018 on pts/2
	-bash-4.2$ psql
	psql (9.2.24)
	Type "help" for help.
	
	postgres=#

如果要增加新用户，进入postgres之后，直接使用create创建：

	create user tony with password '123';

创建之后是不是就可以登陆了？当然不是！参考：

## 命令行psql

posgresql的client是psql，通过`psql --help`可以查看具体用法。

在mac上可以用brew安装psql:

	 brew install pgcli
	 echo 'export PATH="/usr/local/opt/libpq/bin:$PATH"' >> ~/.bash_profile
	 source ~/.bash_profile

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

## SQL基本操作

### ROLE

创建role，postgres的中的`role`比`user`的包含更多的内容，user是可以login的role。

	CREATE ROLE name;
	DROP ROLE name;

所有的role信息存放在`pg_roles`表中：

	SELECT rolname FROM pg_roles;

为了方便，pg支持了下面的命令:

	createuser name
	dropuser name

默认会有一个名为`postgres`的`superuser`。

[create role][3]的语法：

	CREATE ROLE name [ [ WITH ] option [ ... ] ]
	
	where option can be:
	
	      SUPERUSER | NOSUPERUSER
	    | CREATEDB | NOCREATEDB
	    | CREATEROLE | NOCREATEROLE
	    | CREATEUSER | NOCREATEUSER
	    | INHERIT | NOINHERIT
	    | LOGIN | NOLOGIN
	    | REPLICATION | NOREPLICATION
	    | CONNECTION LIMIT connlimit
	    | [ ENCRYPTED | UNENCRYPTED ] PASSWORD 'password'
	    | VALID UNTIL 'timestamp'
	    | IN ROLE role_name [, ...]
	    | IN GROUP role_name [, ...]
	    | ROLE role_name [, ...]
	    | ADMIN role_name [, ...]
	    | USER role_name [, ...]
	    | SYSID uid

可以设置role的属性:

	login privilege:         CREATE ROLE name LOGIN;
	superuser status:        CREATE ROLE name SUPERUSER;
	database creation:       CREATE ROLE name CREATEDB;
	role creation:           CREATE ROLE name CREATEROLE;
	initiating replication:  CREATE ROLE name REPLICATION LOGIN;
	password:                CREATE ROLE name PASSWORD 'string';

使用[alter role][2]修改role的属性。

	ALTER ROLE name [ [ WITH ] option [ ... ] ]
	
	where option can be:
	
	      SUPERUSER | NOSUPERUSER
	    | CREATEDB | NOCREATEDB
	    | CREATEROLE | NOCREATEROLE
	    | CREATEUSER | NOCREATEUSER
	    | INHERIT | NOINHERIT
	    | LOGIN | NOLOGIN
	    | REPLICATION | NOREPLICATION
	    | CONNECTION LIMIT connlimit
	    | [ ENCRYPTED | UNENCRYPTED ] PASSWORD 'password'
	    | VALID UNTIL 'timestamp'
	
	ALTER ROLE name RENAME TO new_name
	
	ALTER ROLE { name | ALL } [ IN DATABASE database_name ] SET configuration_parameter { TO | = } { value | DEFAULT }
	ALTER ROLE { name | ALL } [ IN DATABASE database_name ] SET configuration_parameter FROM CURRENT
	ALTER ROLE { name | ALL } [ IN DATABASE database_name ] RESET configuration_parameter
	ALTER ROLE { name | ALL } [ IN DATABASE database_name ] RESET ALL

### database 

连接postgres数据库的时候必须指定目标数据库，因此第一个database是用`initdb`命令创建的。

	The first database is always created by the initdb command when the data storage area is initialized. 

postgres支持数据库模版，数据库可以从模版创建，如果模版修改了，所有从这个模版创建的数据库都会随之修改。

数据库的创建语法:

	CREATE DATABASE name
	    [ [ WITH ] [ OWNER [=] user_name ]
	           [ TEMPLATE [=] template ]
	           [ ENCODING [=] encoding ]
	           [ LC_COLLATE [=] lc_collate ]
	           [ LC_CTYPE [=] lc_ctype ]
	           [ TABLESPACE [=] tablespace_name ]
	           [ CONNECTION LIMIT [=] connlimit ] ]

创建数据库：

	create database secured;

修改数据库:

	ALTER DATABASE mydb SET geqo TO off;
	ALTER DATABASE dbname RESET varname

删除数据库:

	DROP DATABASE name;

用`grant`赋予role操作database的权限：

	GRANT { { CREATE | CONNECT | TEMPORARY | TEMP } [, ...] | ALL [ PRIVILEGES ] }
	    ON DATABASE database_name [, ...]
	    TO { [ GROUP ] role_name | PUBLIC } [, ...] [ WITH GRANT OPTION ]

## 执行脚本


## 参考

1. [postgresql manuals][1]
2. [alter role][2]
3. [create role][3]
4. [sql commands][4]

[1]: https://www.postgresql.org/docs/manuals/  "postgresql manuals" 
[2]: https://www.postgresql.org/docs/9.4/static/sql-alterrole.html  "alter role"
[3]: https://www.postgresql.org/docs/9.4/static/sql-createrole.html "create role"
[4]: https://www.postgresql.org/docs/9.4/static/sql-commands.html "postgres sql commands"
