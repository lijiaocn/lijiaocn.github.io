---
layout: default
title: PostgresSQL数据库的基本使用——新手入门
author: lijiaocn
createdate: 2017/08/31 09:43:20
last_modified_at: 2017/09/08 14:26:42
categories: 技巧
tags: postgre database
keywords: posgres,postgresql,database
description: postgresql的基本使用，最常用的操作，postgresql是一个老牌的数据库，它的文档中包含更多的内容。

---

## 目录
* auto-gen TOC:
{:toc}

## 介绍 

postgresql是一个老牌的数据库，它的文档[postgresql manuals][1]中包含更多的内容。

[PostgresSQL数据库的基本使用——新手入门](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/08/31/postgre-usage.html)

[PostgreSQL的用户到底是这么回事？新建用户怎样才能用密码登陆？](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/09/28/postgres-user-manage.html)

## 部署启动

在CentOS上部署和用以容器的方式启动。

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

安装非默认版本的PostgreSQL，以9.6为例，如果安装其它版本将下面连接中的9.6换成对应版本号：

	yum install https://download.postgresql.org/pub/repos/yum/9.6/redhat/rhel-7-x86_64/pgdg-centos96-9.6-3.noarch.rpm
	yum install postgresql96
	yum install postgresql96-server
	export PATH=$PATH:/usr/pgsql-9.6/bin/
	postgresql96-setup initdb
	systemctl start postgresql-9.6
	su - postgres 
	psql
	CREATE USER kong; CREATE DATABASE kong OWNER kong;
	alter user kong with encrypted password '123456';
	\q

### 2. 在容器中启动

下载镜像:

	docker pull docker.io/postgres:latest

查看镜像docker.io/postgres可以知道，容器的entrypoint是镜像中的脚本`docker-entrypoint.sh`。
该脚本运行时会创建用户，并执行目录`/docker-entrypoint-initdb.d`中的.sh、.sql和.sql.gz文件。

可以把sql文件打包到镜像中或者挂载到/docker-entrypoint-initdb.d目录中，postgre启动运行时自动加载运行：

	$cat Dockerfile
	FROM postgres:latest
	ADD ./your.sql  /docker-entrypoint-initdb.d
	
	$docker build -t mypostgres:latest .

启动postgres:

	docker run -idt \
		-e POSTGRES_PASSWORD="alice" \
		-e POSTGRES_USER="alice" \
		-e POSTGRES_DB="alice"  \
		-p 5432:5432  \
		mypostgres:latest

## 配置

在CentOS中，postgre默认使用的数据目录是`/var/lib/pgsql/9.6/`，配置文件是`/var/lib/pgsql/9.6/data/postgresql.conf`，[Setting Parameters](https://www.postgresql.org/docs/9.6/config-setting.html)。

### 配置服务监听地址

Postgre默认监听`localhost:5432`，相关参数为`listen_addresses`和`port`：

```
listen_addresses='localhost,10.10.64.58'
port=5432
```

## postgres用户创建/删除

这个需要认真说下，很多人在这踩坑。

Postgre的默认用户是postgres，需要在运行postgres的机器上，`切换为系统的postgres用户`，然后才能通过psql直接进入：

	# su - postgres
	Last login: Fri Sep 28 15:23:41 CST 2018 on pts/2
	-bash-4.2$ psql
	psql (9.2.24)
	Type "help" for help.
	
	postgres=#

创建新用户，进入postgres之后，使用create创建：

	create user tony with password '123';

创建之后是不是就可以登陆了？ **不是！** 见[新用户怎样才能用密码登陆？][5]。

查看用户使用`du`命令，删除用户使用`drop user USERNAME`。

## 命令行psql

Postgresql的client命令是psql，通过`psql --help`可以查看具体用法。

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

例如： 

	psql -h 172.19.133.100  -p 40001 -U kong

退出命令为`\q`，其它控制台命令:

	\h：查看SQL命令的解释，比如\h select。
	\?：查看psql命令列表。
	\l：列出所有数据库。
	\c [database_name]：连接其他数据库。
	\d：列出当前数据库的所有表格。
	\d [table_name]：列出某一张表格的结构。
	\du：列出所有用户。
	\e：打开文本编辑器。
	\conninfo：列出当前数据库和连接的信息。

## SQL语句

收录一些常用的SQL语句。

### SQL语句——role

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

可以设置的role属性:

	login privilege:         CREATE ROLE name LOGIN;
	superuser status:        CREATE ROLE name SUPERUSER;
	database creation:       CREATE ROLE name CREATEDB;
	role creation:           CREATE ROLE name CREATEROLE;
	initiating replication:  CREATE ROLE name REPLICATION LOGIN;
	password:                CREATE ROLE name PASSWORD 'string';

使用[alter role][2]修改role的属性：

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

### SQL语句——database 

连接postgres数据库时必须指定一个数据库，第一个库是初始化时用`postgresql-setup initdb`命令创建的：

	The first database is always created by the initdb command when the data storage area is initialized. 

Postgres支持数据库模版，数据库可以从模版创建，模版修改了，所有从这个模版创建的数据库都会随之修改。

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

赋予role操作database的权限，`grant`语句：

	GRANT { { CREATE | CONNECT | TEMPORARY | TEMP } [, ...] | ALL [ PRIVILEGES ] }
	    ON DATABASE database_name [, ...]
	    TO { [ GROUP ] role_name | PUBLIC } [, ...] [ WITH GRANT OPTION ]

## 执行脚本


## 参考

1. [postgresql manuals][1]
2. [alter role][2]
3. [create role][3]
4. [sql commands][4]
5. [PostgreSQL的用户到底是这么回事？新用户怎样才能用密码登陆？][5]

[1]: https://www.postgresql.org/docs/manuals/  "postgresql manuals" 
[2]: https://www.postgresql.org/docs/9.4/static/sql-alterrole.html  "alter role"
[3]: https://www.postgresql.org/docs/9.4/static/sql-createrole.html "create role"
[4]: https://www.postgresql.org/docs/9.4/static/sql-commands.html "postgres sql commands"
[5]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/09/28/postgres-user-manage.html "PostgreSQL的用户到底是这么回事？新用户怎样才能用密码登陆？"
