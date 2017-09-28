---
layout: default
title: 访问haproxy的监听地址间歇性"503"的问题调查
author: lijiaocn
createdate: 2017/09/19 16:09:12
changedate: 2017/09/27 13:40:24
categories: 问题
tags: haproxy
keywords: haproxy,间歇性失败,重启haproxy
description: 运行一端时间后会出现client连接haproxy间歇性失败的情况，重启haproxy后恢复

---

* auto-gen TOC:
{:toc}

## 说明

这里的调查承接[连接haproxy间歇性失败的问题调查][1]。

[连接haproxy间歇性失败的问题调查][1]中描述的现象，实际上是两个问题，这里进一步细化区分：

	现象1： 频繁对haproxy进行reload，一段时间后，client访问haproxy的同一个监听地址，
	        会很频繁地返回haproxy中配置的503页面，重复访问几次就会出现503。
	        重启haproxy后恢复。
	
	现象2： 频繁对haproxy进行reload，一段时间后，client访问haproxy的多个监听器中的某一个
	        的时候，会长时间得不到响应，可以正常的访问其它的监听器。
	        重启haproxy后恢复。

这里找到了`现象1`的根源，`现象2`还在尝试复现。

>2017-09-27 13:40:20 压测时复现出了现象2，是因为haproxy发起的到backend连接超过设置的最大连接数，新连接一直等待得不到响应。

## 复现过程

在运行haproxy的容器中，使用下面的脚本，每一秒钟做一次reload:

	#!/bin/bash
	
	PidFile=/var/run/$(basename $0).pid
	ChildPidFile=/var/run/haproxy.pid
	echo "$$">${PidFile}
	function reloadchild
	{
		echo "Reloading"
		EXT_CMD=
		CHPID=
		if [ -f "$ChildPidFile" ]; then
			CHPID=$(cat ${ChildPidFile})
			if [ -n "$CHPID" ] && [ -n $(ps -o pid | grep  "$CHPID") ]; then
			EXT_CMD="-sf $(cat ${ChildPidFile})"
			fi
		fi
		haproxy -f /etc/haproxy/haproxy.cfg -db ${EXT_CMD} &
		CHPID=$!
		echo "$CHPID" >${ChildPidFile}
	}
	
	while true
	do
		reloadchild
		ps aux
		sleep 1
	done

在容器中观察连接状态:

	$cat >> netstat.sh <EOF
	#!/bin/bash
	a=`netstat -ntp |grep haproxy`
	echo $a
	EOF
	
	$watch  -n 1 netstat.sh 

用ab建立长连接，持续访问haproxy的监听地址：

	ab -n 100000 -c 1 -k http://webshell-lijiaob-space.odev.xxxcloud.cn/

## 现场观察

ab建立了长连接以后，haproxy频繁reload，预期会有较多的haproxy进程会因为连接还存在而一直没有退出：

	PID   USER     TIME   COMMAND
	...
	 1071 haproxy    0:02 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1060
	 1192 haproxy    0:09 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1176
	 1242 haproxy    0:03 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1233
	 1616 haproxy    0:01 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1600
	 1684 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1670
	 1779 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1763
	 1821 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1810
	 2405 haproxy    0:01 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 2387
	17072 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 17059
	...

观察监听端口，发现所有的haproxy进程都在监听80端口：

	# netstat -lntp |grep 80
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      19337/haproxy
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      2405/haproxy
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      1821/haproxy
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      1779/haproxy
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      1684/haproxy
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      1616/haproxy
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      1242/haproxy
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      1192/haproxy

因为曾遇到配置文件中已经配置了监听地址，但是访问失败的情况。
猜测访问请求被旧的haproxy处理，而旧的haproxy的内存中没有对应的监听器。

在`watch -n 1 ./netstat.sh`中，观察当前ab建立的长连接是被进程号为1192的haproxy处理的：

	tcp 0 523 10.39.0.140:80 10.4.110.62:59695 ESTABLISHED 1192/haproxy

将ab暂停，然后重新建立长链接，期待新建的长链接会被最新的haproxy进程(19337)处理：

	tcp 0 523 10.39.0.140:80 10.4.110.62:59719 ESTABLISHED 1684/haproxy

出现了`预期外的情况`，发现新建的长链接被1684号进程处理，而非最新运行的haproxy。

断开ab，重建连接，新建的长连接又被另一个旧的haproxy进程(2405)处理:

	tcp 0 523 10.39.0.140:80 10.4.110.62:59760 ESTABLISHED 2405/haproxy

这个现象印证了猜测：

	请求被旧的haproxy处理，而旧的haproxy的内存中没有对应的监听器

## 猜测证实

需要构建`旧的haproxy进程`:

	1. 用ab建立长链接:
	
	   ab -n 100000 -c 1 -k http://webshell-lijiaob-space.odev.xxxcloud.cn/
	
	2. 频繁进行reload操作，当旧的haproxy稳定存在后，停止reload的操作
	
	3. 在haproxy中创建新的监听器，进行一次reload操作

旧的haproxy进程号为953:

	PID   USER     TIME   COMMAND
	953  haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 941
	1479 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1470

`netstat -ntp|grep haproxy`显示，长链接是953处理的:

	tcp 0 523 10.39.0.140:80 10.4.110.62:59942 ESTABLISHED 953/haproxy

在配置文件中创建一个新的监听器，执行一次reload后:

	PID   USER     TIME   COMMAND
	953 haproxy    0:02 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 941
	1571 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1562
	1618 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1601

多出的1571号进程，应当是因为环境中有别的连接存在，暂时不管它。

用curl访问新的监听器，注意，`需要用curl`，浏览器可能将多次请求在同一个tcp连接中发送。

	curl http://webshell3-lijiaob-space.odev.xxxcloud.cn/

`重复30次，访问成功9次，失败20次`，此时系统中一共3个haproxy进程，成功的概率接近1/3。

	    0   1   2
	---------------
	1	O	X	X
	2	X	O	X
	3	X	O	X
	4	O	X	X
	5	X	X	O
	6	X	X	X
	7	O	X	X
	8	X	O	O
	9	X	X	X
	10	X	O	X

将多出的haproxy进程杀死后重试：

	kill -9 1571
	
	PID   USER     TIME   COMMAND
	953 haproxy    0:13 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 941
	1618 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1601

重复30次，访问成功15次，失败15次，此时系统中一共2个haproxy，成功的概率接近1/2。

	    0   1   2
	---------------
	1	X	O	O
	2	X	O	O
	3	O	O	X
	4	X	O	X
	5	O	O	X
	6	O	O	X
	7	O	O	O
	8	X	X	X
	9	X	X	X
	10	O	X	X

将953进程杀死后，不再出现访问失败的情况。

## 深入分析

多个haproxy监听了同一个端口是最直接的原因。

在[连接haproxy间歇性失败的问题调查][1]中，阅读[haproxy的文档][2]时，曾经遇到说明:

	HAProxy works around this on systems that support the
	SO_REUSEPORT socket options, as it allows the new process to bind without
	first asking the old one to unbind. Most BSD systems have been supporting
	this almost forever. Linux has been supporting this in version 2.0 and
	dropped it around 2.2, but some patches were floating around by then. It
	was reintroduced in kernel 3.9, so if you are observing a connection
	failure rate above the one mentioned above, please ensure that your kernel
	is 3.9 or newer, or that relevant patches were backported to your kernel
	(less likely).

也就是说从kernel 3.9版本开始，监听端口是可以复用的，haproxy使用了这个特性。这个特性使新的haproxy进程
可以快速创建，不需要考虑旧的haproxy的是否释放了端口。

在[lwn.net][7]中找到了对`SO_REUSEPORT`的详细说明：[The SO_REUSEPORT socket option][3]

	Incoming connections and datagrams are distributed to the server sockets using a hash 
	based on the 4-tuple of the connection—that is, the peer IP address and port plus the
	local IP address and port.

在最后一条评论中，发现了一个连接:

	Nice work for deffect workarround was provided by using SCM_RIGHTS
	https://www.haproxy.com/blog/truly-seamless-reloads-with-...

这个连接里的内容提供了`很重要很重要`的信息：[Truly Seamless Reloads with HAProxy – No More Hacks!][4]

## 继续分析

虽然[Truly Seamless Reloads with HAProxy – No More Hacks!][4]指出了haproxy在频繁reload的时候会出现问题，但是这些问题发生的频率相对来说还是很小的。而本文复现出来的现象，发生的频率却是非常高:

	重复30次，访问成功15次，失败15次，此时系统中一共2个haproxy，成功的概率接近1/2。

猜测还有其它的问题，根据在实际操作中感受到的一些情况，进行了第二次实验。

用ab建立一个长链接:

	ab -n 100000 -c 1 -k http://webshell-lijiaob-space.odev.xxxcloud.cn/

对haproxy进行一次reload操作，这时候系统中有两个haproxy进程：

	6954 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 6938
	7090 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 7086

断开长链接后，预期6954进程会因为已经没有连接存在了而退出，结果发现6954进程依然存在：

	6954 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 6938
	7090 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 7086

在当前环境下，再建立一个长链接，这时候其中一个haproxy进程上会有连接:

	ab -n 100000 -c 1 -k http://webshell-lijiaob-space.odev.xxxcloud.cn/

手动做haproxy reload，在-sf后面指定当前存在的所有的haproxy进程的进程号：

	haproxy -f /etc/haproxy/haproxy.cfg -db -sf 6954 7090

查看系统上的haproxy进程，可以看到原先的两个haproxy进程只剩下了一个：

	 7097 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 6954 7090
	 7107 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 7090

断开长连接后，现存的两个haproxy上都没有了连接，这时再次手动reload:

	haproxy -f /etc/haproxy/haproxy.cfg -db -sf 7097 7107

发现两个haproxy进程都退出了：

	7111 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 7097 7107

有理由相信，当进行reload的时候，如果haproxy进程上还有连接存在，haproxy进程不会退出。
残存的连接断开后，对应的haproxy进程应该主动退出，但是因为`还未知的原因`，这个进程
没有退出。重新对它发送一个`SIGUSR1`信号后，才最终退出。

## 解决方法

针对本文中复现的现象，可以通过修改reload过程修复。

在本文使用的系统中，原先reload的时候`-sf`只会指定上一个haproxy进程的进程号。
将其改为`-sf 系统中所有haproxy的进程号`以后，问题消失。

	CHPIDS=`ps aux|grep "haproxy -f"|grep -v grep|awk '{print $1}'`
	EXT_CMD="-sf $CHPIDS"

并且发现，即使旧的haproxy没有退出，也不再出现多个haproxy监听同一个端口的情况：

	$ ps aux|grep haproxy
	823 haproxy    0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 788 788
	1068 haproxy   0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 1047 823 1047
	
	$netstat -lnpt |grep haproxy
	tcp        0      0 10.39.0.140:80          0.0.0.0:*               LISTEN      1068/haproxy
	tcp        0      0 0.0.0.0:8889            0.0.0.0:*               LISTEN      1068/haproxy
	tcp        0      0 10.39.0.140:443         0.0.0.0:*               LISTEN      1068/haproxy
	tcp        0      0 10.39.0.140:22560       0.0.0.0:*               LISTEN      1068/haproxy
	tcp        0      0 10.39.0.140:16481       0.0.0.0:*               LISTEN      1068/haproxy
	tcp        0      0 10.39.0.140:17953       0.0.0.0:*               LISTEN      1068/haproxy

而[Truly Seamless Reloads with HAProxy – No More Hacks!][4]描述的现象则需要haproxy1.8版本，或者
参考连接中给出的方法，例如[github的做法][6]。

haproxy计划在1.8版本中实现这样一个特性: reload过程中，旧的haproxy的监听socket被传送给新的haproxy。
	
	we tried using the HAProxy CLI socket which often is a UNIX socket and on top
	of which it is possible to transfer file descriptors using SCM_RIGHTS. 
	SCM_RIGHTS is one of the little known features of UNIX sockets which allows 
	one process to transfer one or several of its file descriptors to another process.
	The other process receives them in the same state they were in (generally with 
	a different FD number) just as if they had been duplicated using dup():

## 参考

1. [连接haproxy间歇性失败的问题调查][1]
2. [Stopping and restarting HAProxy][2]
3. [The SO_REUSEPORT socket option][3]
4. [Truly Seamless Reloads with HAProxy – No More Hacks!][4]
5. [Introducing the GitHub Load Balancer][5]
6. [GLB part 2: HAProxy zero-downtime, zero-delay reloads with multibinder][6]
7. [lwn.net][7]

[1]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2017/09/04/haproxy-cannt-connect.html  "连接haproxy间歇性失败的问题调查" 
[2]: http://cbonte.github.io/haproxy-dconv/1.7/management.html#4  "Stopping and restarting HAProxy"
[3]: https://lwn.net/Articles/542629/  "The SO_REUSEPORT socket option"
[4]: https://www.haproxy.com/blog/truly-seamless-reloads-with-haproxy-no-more-hacks/ "Truly Seamless Reloads with HAProxy – No More Hacks!"
[5]: https://githubengineering.com/introducing-glb/ "Introducing the GitHub Load Balancer"
[6]: https://githubengineering.com/glb-part-2-haproxy-zero-downtime-zero-delay-reloads-with-multibinder/ "GLB part 2: HAProxy zero-downtime, zero-delay reloads with multibinder"
[7]: https://lwn.net/ "lwn.net"
