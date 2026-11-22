---
title: "cannot change locale (UTF-8): No such file or directory"
tags: centos shell
permalink: "/问题/2017/03/21/cannot-change-local.html"
---

## 目录
* auto-gen TOC:
{:toc}

### cannot change locale (UTF-8): No such file or directory

编辑/etc/environment，添加：

	LANG=en_US.utf-8
	LC_ALL=en_US.utf-8
