---
layout: default
title: docker使用前的检查清单
author: 李佶澳
createdate: 2017/03/29 11:11:53
changedate: 2017/09/11 16:20:32
categories: 技巧
tags: docker
keywords: docker,使用手册,docker的使用手册
description: 使用docker时的检查清单。

---

## 目录
* auto-gen TOC:
{:toc}

## 摘要

将在使用docker的时候遇到的一些问题记录在这里, 这样下次使用就可以来这里进行核对, 避免同样的错误。

## 是否在image中正确的设置了时区?

物理机上的时区正确不意味着docker中的时区也是正确的。

CentOS设置方式:

	ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

## 设置--default-ulimit

[--default-ulimit][2]是在dokerd中设置的，在启动容器的时候会传递给容器。

如果容器运行的时候指定了[--ulimit][3]，会覆盖default-ulimit。

--ulimit的每个设置项格式如下:

	<type>=<soft limit>[:<hard limit>]

例如:

	docker run --ulimit nofile=1024:1024 --rm debian sh -c "ulimit -n"

可以设置以下项目，参考手册`man limits.conf`:

	core - limits the core file size (KB)
	data - max data size (KB)
	fsize - maximum filesize (KB)
	memlock - max locked-in-memory address space (KB)
	nofile - max number of open file descriptors
	rss - max resident set size (KB)
	stack - max stack size (KB)
	cpu - max CPU time (MIN)
	nproc - max number of processes
	as - address space limit (KB)
	maxlogins - max number of logins for this user
	maxsyslogins - max number of logins on the system
	priority - the priority to run user process with
	locks - max number of file locks the user can hold
	sigpending - max number of pending signals
	msgqueue - max memory used by POSIX message queues (bytes)
	nice - max nice priority allowed to raise to values: [-20, 19]
	rtprio - max realtime priority

需要特别注意的是，nproc限制的是用户进程数不是容器的进程数。

## debug

有时候可能需要打开debug日志:

在/usr/lib/systemd/system/docker.service:

	ExecStart=/usr/bin/dockerd -D

## forkbomb

通过kernel4.3中的[CGROUP_PIDS][4]特性限制容器内的进程数。

docker 1.12.6可以通过下面的脚本设置所有已经运行的容器的pids，每个容器最多10个进程:

	#!/bin/bash
	
	MAX_PIDS=10
	CGROUP_PIDS=/sys/fs/cgroup/pids
	SYSTEM_SLICE=/sys/fs/cgroup/pids/system.slice/
	
	if [ ! -d $CGROUP_PIDS ];then
		mkdir -p $CGROUP_PIDS
		mount -t cgroup -o pids none $CGROUP_PIDS
	fi
	for i in `ls $SYSTEM_SLICE | grep "docker-"`;
	do
		echo $i
		echo $MAX_PIDS > $SYSTEM_SLICE/$i/pids.max
	done

[docker-forkbomb-fix][5]中提供了脚本。

[Add pids-limit support in docker update][6]中增加了`--pids-limit`参数，但是代码还没有合入。2017-07-27 17:27:02

代码合入以后，可以通过`--pids-limit`参数限制每个容器的最大进程数。

## 代理设置

如果让docker通过代理去获取镜像:

如果是centos7:

	mkdir  /etc/systemd/system/docker.service.d/
	touch /etc/systemd/system/docker.service.d/http-proxy.conf

在http-proxy.conf中添加:

	Service]
	Environment="HTTP_PROXY=http://proxy.ip.com:80"
	Environment="HTTPS_PROXY=https://proxy.ip.com:80"

然后重启:

	systemctl daemon-reload
	systemctl restart docker

检查变量是否加载:

	systemctl show docker --property Environment

## 添加镜像源

在/etc/sysconfig/docker的OPTION中添加:

	--registry-mirror=https://pee6w651.mirror.aliyuncs.com

## 参考

1. [Fork bomb prevention][1]
2. [default ulimits][2]
3. [set ulimit in container][3]
4. [cgroup pid][4]
5. [docker-forkbomb-fix][5]
6. [Add pids-limit support in docker update][6]
7. [docker proxy][7]

[1]: https://github.com/moby/moby/issues/6479  "Fork bomb prevention" 
[2]: https://docs.docker.com/engine/reference/commandline/dockerd/#default-ulimits "default-ulimits"
[3]: https://docs.docker.com/engine/reference/commandline/run/#set-ulimits-in-container-ulimit  "set ulimit in container"
[4]: https://www.kernel.org/doc/Documentation/cgroup-v1/pids.txt "cgroups pid"
[5]: https://github.com/lijiaocn/docker-forkbomb-fix.git  "docker-forkbomb-fix"
[6]:  https://github.com/moby/moby/pull/32519   "Add pids-limit support in docker update" 
[7]: https://my.oschina.net/tinkercloud/blog/638960  "docker proxy"
