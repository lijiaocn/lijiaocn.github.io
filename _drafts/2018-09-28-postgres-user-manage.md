---
layout: default
title: "PostgreSQL的用户到底是这么回事？新加用户怎样才能成功登陆？
author: 李佶澳
createdate: "2018-09-28 15:54:43 +0800"
changedate: "2018-09-28 15:54:43 +0800"
categories: 技巧
tags: PostgreSQL
keywords: postgres,PostgreSQL,用户登陆,pg_hab.conf,数据库
description: PostgreSQL数据库的用法和MySQL很不一样，新创建的用户的创建要和pg_hba.conf中的配置对应才能成功登陆
---

* auto-gen TOC:
{:toc}

## 说明

PostgreSQL数据库的用法和MySQL很不一样，新创建的用户的创建要和pg_hba.conf中的配置对应才能成功登陆。很多人在这个地方卡壳，用Google或者Baidu搜索到一些资料，说得也不清楚。这里特别阐述一下。

## User与Role

创建用户使用的是PostgreSQL的[CREATE USER][1]命令。在[CREATE USER][1]的命令手册中有这样一个说明：

	CREATE USER is now an alias for CREATE ROLE. 
	The only difference is that when the command is spelled CREATE USER, LOGIN is assumed by default,
	whereas NOLOGIN is assumed when the command is spelled CREATE ROLE.
	

首先记住一点：`创建User`就是在`创建Role`。

那么PostgreSQL的Role是什么？

[PostgreSQL Documentation: Database Roles][2]中有五节关于role的内容。简单说在PostgreSQL中权限控制的目标是Role，这个Role相当于MySQL中的用户。

可以为Role设置多种属性，控制Role能够执行的操作，这些属性可以在创建的时候指定，[PostgreSQL SQL Commands: CREATE ROLE][3]:

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

也可以创建后，用alter修改，[PostgreSQL SQL Commands: ALTER ROLE][4]：

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
	
	ALTER ROLE name [ IN DATABASE database_name ] SET configuration_parameter { TO | = } { value | DEFAULT }
	ALTER ROLE name [ IN DATABASE database_name ] SET configuration_parameter FROM CURRENT
	ALTER ROLE name [ IN DATABASE database_name ] RESET configuration_parameter
	ALTER ROLE name [ IN DATABASE database_name ] RESET ALL

这些属性当中有一个名字为`LOGIN`的属性，只有拥有这个属性的Role才能登陆PostgreSQL。

[CREATE USER][1]创建的就是一个带有LOGIN属性的`Role`：

	CREATE USER name [ [ WITH ] option [ ... ] ]
	
	where option can be:
	
	      SUPERUSER | NOSUPERUSER
	    | CREATEDB | NOCREATEDB
	    | CREATEROLE | NOCREATEROLE
	    | INHERIT | NOINHERIT
	    | LOGIN | NOLOGIN
	    | REPLICATION | NOREPLICATION
	    | BYPASSRLS | NOBYPASSRLS
	    | CONNECTION LIMIT connlimit
	    | [ ENCRYPTED ] PASSWORD 'password'
	    | VALID UNTIL 'timestamp'
	    | IN ROLE role_name [, ...]
	    | IN GROUP role_name [, ...]
	    | ROLE role_name [, ...]
	    | ADMIN role_name [, ...]
	    | USER role_name [, ...]
	    | SYSID uid

也正是因为如此，`\du`命令看到的都是`Role`：

	postgres=# \du
	                              List of roles
	  Role name  |                   Attributes                   | Member of
	-------------+------------------------------------------------+-----------
	 local_user1 |                                                | {}
	 postgres    | Superuser, Create role, Create DB, Replication | {}
 
带有LOGIN的属性的Role是否就一定能成功登陆呢？不是！请继续往下看。

## pg_hba.conf对认证方式的限制

PostgreSQL中用[pg_hba.conf][5]文件控制用户登陆时的认证方式，这个文件和数据库的数据文件在同一个目录中。
在CentOS7中的位置是`/var/lib/pgsql/data/pg_hba.conf`。

pg_hba.conf文件内容如下：

	# "local" is for Unix domain socket connections only
	local   all             all                                     peer
	# IPv4 local connections:
	host    all             all             127.0.0.1/32            ident
	# IPv6 local connections:
	host    all             all             ::1/128                 ident

最后一列是认证方式，支持11种[认证方式][6]：

	20.3.1. Trust Authentication
	20.3.2. Password Authentication
	20.3.3. GSSAPI Authentication
	20.3.4. SSPI Authentication
	20.3.5. Ident Authentication
	20.3.6. Peer Authentication
	20.3.7. LDAP Authentication
	20.3.8. RADIUS Authentication
	20.3.9. Certificate Authentication
	20.3.10. PAM Authentication
	20.3.11. BSD Authentication

其中最常接触到的是`peer`、`ident`和`paasword`。

[peer](https://www.postgresql.org/docs/current/static/auth-methods.html#AUTH-PEER)是用当前使用的操作系统上的用户做认证。
在刚部署PosgreSQL之后，需要切换到系统上的postgres用户，才能进入PostgreSQL就是这个道理。

上面配置中的第一项设置本地用户通过unix socket登陆时，使用peer方式认证。

	# "local" is for Unix domain socket connections only
	local   all             all                                     peer

peer方式中，client必须和postgresql在同一台机器上，[ident](https://www.postgresql.org/docs/current/static/auth-methods.html#AUTH-IDENT)则可以跨主机。

上面配置中后两项，第一列变成了host，表示通过IP地址访问时，使用ident认证：

	# IPv4 local connections:
	host    all             all             127.0.0.1/32            ident
	# IPv6 local connections:
	host    all             all             ::1/128                 ident

需要注意，host方式需要在通过psql登陆时，用`-h`指定要登陆的postgreSQL的IP。如果不指定IP，默认使用的unix socket。
即使就在PostgreSQL本地登陆，也要用-h指定：`-h 127.0.0.1`。

创建一个没有密码的用户之后：

	create user local_user1;

在本机创建一个同名的用户：

	useradd local_user1;

然后切换到同名用户后，就可以直接通过`unix_socket`的方式登陆:

	# su - local_user1
	[local_user1@10 ~]$ psql postgres     
	psql (9.2.24)
	Type "help" for help.
	
	postgres=>

注意：要指定数据库名，如果不指定默认使用与用户同名的数据库。

peer和ident这两种方式都不是常用的方式！最常用的方式是通过密码远程登陆。

[password](https://www.postgresql.org/docs/current/static/auth-methods.html#AUTH-PASSWORD)提供这样的功能，见下一节。

## 使用密码登陆

[password](https://www.postgresql.org/docs/current/static/auth-methods.html#AUTH-PASSWORD)认证又分为三种方式：

	scram-sha-256
	md5
	password

这三种方式指定的是密码在PostgreSQL上存储的形式和登陆时密码的传输形式。

`scram-sha-256`和`md5`分别用sha-256和md5算法对设置的密码进行保护，传输和保存的都是难以逆向破解的散列字符串，`password`方式传输和保存的则都是原始的明文密码。

无论使用哪种方式，都需要在`pg_hba.conf`中设置，例如将前面的配置中的ident修改成：

	host    all             all             127.0.0.1/32           md5

注意，修改pg_hba.conf之后，要重启PostgreSQL，以重新加载配置文件。

修改了认证方式之后，接下来就要为Role设置密码，密码可以在创建Role的时候就设置

也可以是创建后用alter设置。

在为Role设置密码的时候，可以指定密码是否加密存储：

	[ ENCRYPTED | UNENCRYPTED ] PASSWORD 'password'

如果没有指定，则根据配置的[password_encryption](https://www.postgresql.org/docs/9.4/static/runtime-config-connection.html#GUC-PASSWORD-ENCRYPTION)参数决定，默认是加密的。

然后创建用户：

	create user user1 with encrypted password '123';

这样之后，就可以用user1登陆了:

	psql -h 127.0.0.1 -U user_password1  postgres -W

注意，必须用`-h`指定IP，否则就通过unix socket链接，使用peer的方式认证了。

如果为用户配置了密码，但是pg_hba.conf中配置的认证方式是ident等非密码的认证方式，则会登陆失败。

例如当pg_hda.conf中配置的是：

	host    all             all             127.0.0.1/32           ident

这时候登陆，会提示认证失败：

	$ psql -h 127.0.0.1  -U user_password1  postgres -W
	Password for user user_password1:
	psql: FATAL:  Ident authentication failed for user "user_password1"

>注意：修改了pg_hba.conf之后，需要重启PostgreSQL，才会应用新配置。

## 为不同数据库、不同用户设置不同的认证方式

pg_hba.conf文件内容如下：

	# "local" is for Unix domain socket connections only
	local   all             all                                     peer
	# IPv4 local connections:
	host    all             all             127.0.0.1/32            ident
	# IPv6 local connections:
	host    all             all             ::1/128                 ident

它的语法规则是这样的：

	local      database  user  auth-method  [auth-options]
	host       database  user  address  auth-method  [auth-options]
	hostssl    database  user  address  auth-method  [auth-options]
	hostnossl  database  user  address  auth-method  [auth-options]
	host       database  user  IP-address  IP-mask  auth-method  [auth-options]
	hostssl    database  user  IP-address  IP-mask  auth-method  [auth-options]
	hostnossl  database  user  IP-address  IP-mask  auth-method  [auth-options]



## 参考

1. [PostgreSQL SQL Commands:CREATE USER][1]
2. [PostgreSQL 9.1.24 Documentation:  Database Roles][2]
3. [PostgreSQL SQL Commands: CREATE ROLE][3]
4. [PostgreSQL SQL Commands: ALTER ROLE][4]
5. [PostgreSQL: The pg_hba.conf File][5]
6. [PostgreSQL: Authentication Methods][6]

[1]: https://www.postgresql.org/docs/current/static/sql-createuser.html "PostgreSQL SQL Commands:CREATE USER"
[2]: https://www.postgresql.org/docs/9.1/static/user-manag.html "PostgreSQL 9.1.24 Documentation:  Database Roles"
[3]: https://www.postgresql.org/docs/9.4/static/sql-createrole.html "PostgreSQL SQL Commands: CREATE ROLE"
[4]: https://www.postgresql.org/docs/9.2/static/sql-alterrole.html "PostgreSQL SQL Commands: ALTER ROLE"
[5]: https://www.postgresql.org/docs/9.2/static/auth-pg-hba-conf.html "PostgreSQL: The pg_hba.conf File"
[6]: https://www.postgresql.org/docs/current/static/auth-methods.html#AUTH-PASSWORD "PostgreSQL: Authentication Methods"
