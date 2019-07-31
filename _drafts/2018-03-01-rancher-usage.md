---
layout: default
title: rancher的使用 
author: lijiaocn
createdate: 2018/03/01 15:31:00
last_modified_at: 2018/03/02 10:43:50
categories: 项目
tags:
keywords:
description: 

---

* auto-gen TOC:
{:toc}

## 说明

## 快速部署

启动rancher server：

	docker run -d --restart=unless-stopped -p 8080:8080 rancher/server

容器启动需要等几分钟后，就可以打开网址`127.0.0.1:8080`，进入rancher管理页面。

这时候，任何人都可以打开这个网址，且拥有所有权限。需要在`系统管理->访问控制`进行设置。

rancher支持以下几种认证方式：

	Active Directory
	Azure AD
	GITHUB
	LOCAL
	OpenLDAP
	SHIBBOLETH

之后按照页面提示操作即可。

## 参考

1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
