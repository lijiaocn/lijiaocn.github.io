---
layout: default
title: "Mysql 数据使用问题记录"
author: 李佶澳
date: "2020-07-19 16:04:02 +0800"
last_modified_at: "2020-07-19 16:04:02 +0800"
categories:
cover:
tags:
keywords:
description:
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

## this user requires mysql native password authentication

```sh
[mysql] 2020/07/19 16:01:36 driver.go:94: connect to localhost:3306 err: this user requires mysql native password authentication.
```

访问 mysql 8.0 时遇到的问题，[参考](https://github.com/go-sql-driver/mysql/issues/785)，在 my.cnf 中修改用 mysql 5 的插件：

```sh
[mysqld]
default-authentication-plugin = mysql_native_password
```


## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"

