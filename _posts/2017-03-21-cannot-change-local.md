---
layout: default
title: "cannot change locale (UTF-8): No such file or directory"
author: 李佶澳
createdate: 2017/03/27 16:55:28
changedate: "2019-01-17 14:12:45 +0800"
categories: 问题
tags: centos shell
keywords: ssh,shell,locale,centos
description: "cannot change locale (UTF-8): No such file or directory"

---

* auto-gen TOC:
{:toc}

### cannot change locale (UTF-8): No such file or directory

编辑/etc/environment，添加：

	LANG=en_US.utf-8
	LC_ALL=en_US.utf-8
