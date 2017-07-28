---
layout: default
title: crond定时任务的使用
author: lijiaocn
createdate: 2017/07/28 13:32:55
changedate: 2017/07/28 15:46:35
categories: 技巧
tags: linuxtool  crond
keywords: crond定时任务的使用
description:  crond定时任务的使用

---

* auto-gen TOC:
{:toc}

## 说明 

crond是linux定时任务，启动服务:

	systemctl start crond

crontab用来管理crond。

## 任务描述

	Example of job definition:
	.---------------- minute (0 - 59)
	|  .------------- hour (0 - 23)
	|  |  .---------- day of month (1 - 31)
	|  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
	|  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
	|  |  |  |  |
	*  *  *  *  * user-name  command to be executed

每一项中可以使用特殊字符:

	* :  所有的取值范围内的数字
	/ :  每的意思,"/5"表示每5个单位
	- :  从某个数字到某个数字
	, :  分开几个离散的数字

`crontab -e`: 直接编辑当前用户的定时任务，每个用户的定时任务存放在`/var/spool/cron`目录中。

`/etc/crontab`: 负责安排由系统管理员制定的维护系统以及其他任务的crontab。

`/etc/cron.d/`: 这个目录用来存放任何要执行的crontab文件或脚本。

## 参考

1. [linux下定时执行任务的方法][1]

[1]: http://www.cnblogs.com/juandx/archive/2015/11/24/4992465.html  "linux下定时执行任务的方法" 
