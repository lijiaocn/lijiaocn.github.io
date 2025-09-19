---
layout: default
title: "在 Mac 上安装使用 MySQL 数据库，通过 MysqlWorkBench 操作"
author: 李佶澳
createdate: "2018-12-31 15:11:19 +0800"
changedate: "2018-12-31 15:11:19 +0800"
categories: 技巧
tags: mac
keywords: mysql,mac,mysqlworkbench
description: 在 Mac 上安装运行 Mysql 数据库，方便本地搭建开发环境，本地调试。安装mysql和相应的命令行、管理、设计工具，安装mysql server
---

* auto-gen TOC:
{:toc}

## 说明

在 Mac 上安装运行 Mysql 数据库，方便本地搭建开发环境，本地调试。

## 安装

>注意默认的mysql的版本比较高是8.0，当前（2018-12-31 17:31:19)有一些数据库工具还不支持mysql8.0，可以安装mysql5.7：

```
brew install  mysql@5.7
brew services start mysql@5.7
```

安装mysql和相应的命令行、管理、设计工具。

安装mysql server：

```bash
$ brew install mysql 
We've installed your MySQL database without a root password. To secure it run:
    mysql_secure_installation

MySQL is configured to only allow connections from localhost by default

To connect run:
    mysql -uroot

To have launchd start mysql now and restart at login:
  brew services start mysql
Or, if you don't want/need a background service you can just run:
  mysql.server start
```

默认没有root密码，启动后可以直接`mysql -uroot`登陆：

启动mysql server：

```bash
  brew services start mysql
```

安装mysql命令行工具：

```bash
brew install mysql-client 
echo 'export PATH="/usr/local/opt/mysql-client/bin:$PATH"' >> ~/.bash_profile
source  ~/.bash_profile
```

然后就可以直接登陆mac本地的mysql：

```bash
lijiaos-mbp:~ lijiao$ mysql -u root
Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 10
Server version: 8.0.13 Homebrew

Copyright (c) 2000, 2018, Oracle and/or its affiliates. All rights reserved.

Oracle is a registered trademark of Oracle Corporation and/or its
affiliates. Other names may be trademarks of their respective
owners.

Type 'help;' or '\h' for help. Type '\c' to clear the current input statement.

mysql>
```

安装有图形界面的数据库管理工具：

```
brew cask install mysqlworkbench sequel-pro
```

## mac上安装的mysql的配置文件

以mysql@5.7为例，查看正在运行的服务：

```bash
lijiaos-mbp:~ lijiao$ brew services list
Name      Status  User   Plist
mysql@5.7 started lijiao /Users/lijiao/Library/LaunchAgents/homebrew.mxcl.mysql@5.7.plist
```

打开文件Plist一栏中的文件，就可以看到mysql的配置：

```bash
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>KeepAlive</key>
  <true/>
  <key>Label</key>
  <string>homebrew.mxcl.mysql@5.7</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/opt/mysql@5.7/bin/mysqld_safe</string>
    <string>--datadir=/usr/local/var/mysql</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>/usr/local/var/mysql</string>
</dict>
</plist>
```

## 问题

如果安装的是mysql 8.0，在查看数据库的时候可能会遇到下面的错误：

```
ERROR 1449 (HY000): The user specified as a definer ('mysql.infoschema'@'localhost') does not exist
```

在shell上执行下面的命令可解决：

```bash
mysql_upgrade -u root 
```

## 参考

1. [mysql升级8.0后遇到的坑][1]

[1]: https://www.shiqidu.com/d/358 "mysql升级8.0后遇到的坑 "
