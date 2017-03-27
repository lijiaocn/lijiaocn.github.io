---
layout: default
title: "cannot change locale (UTF-8), No such file or directory"
author: lijiaocn
createdate: 2017/03/27 16:55:28
changedate: 2017/03/27 19:01:32
categories:
tags: 问题
keywords: 
description: "cannot change locale (UTF-8), No such file or directory"

---

* auto-gen TOC:
{:toc}

### cannot change locale (UTF-8): No such file or directory

编辑/etc/environment，添加：

	LANG=en_US.utf-8
	LC_ALL=en_US.utf-8
