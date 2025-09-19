---
layout: default
title: 容器中运行的haproxy的端口复用问题再解决
author: 李佶澳
createdate: 2018/01/10 13:51:44
last_modified_at: 2018/01/11 13:08:02
categories: 问题
tags: haproxy
keywords: haproxy,docker,容器,端口复用
description: 使用haproxy代理的部分http服务突然不能访问，一直没有数据返回。

---

## 目录
* auto-gen TOC:
{:toc}

## 现象 

使用haproxy代理的部分http服务突然不能访问，一直没有数据返回。

## 调查

发现有两个haproxy进程都在监听80端口：

	/ # netstat -lntp |grep 80
	tcp      860      0 10.39.1.68:18091        0.0.0.0:*      LISTEN      26939/haproxy
	tcp        0      0 10.39.1.68:28046        0.0.0.0:*      LISTEN      26939/haproxy
	tcp        0      0 10.39.1.68:80           0.0.0.0:*      LISTEN      31013/haproxy
	tcp        5      0 10.39.1.68:28080        0.0.0.0:*      LISTEN      26939/haproxy
	tcp        0      0 10.39.1.68:38480        0.0.0.0:*      LISTEN      26939/haproxy
	tcp     3285      0 10.39.1.68:80           0.0.0.0:*      LISTEN      26939/haproxy
	tcp        0      0 10.39.1.68:28017        0.0.0.0:*      LISTEN      31013/haproxy

之前解决过类似问题：[使用端口复用(SO_REUSEPORT)、反复对haproxy进行reload操作，导致访问haproxy间歇性返回503][1]。

发现通过netstat查看的26939号进程的第二栏数据为3285。

查看netstat的手册(man netstat)，该列数据的含义为：

	Recv-Q
	    Established: The count of bytes not copied by the user program connected to this socket.
	    Listening: Since Kernel 2.6.18 this column contains the current syn backlog.

手动将26939进程杀死后，访问恢复。

## 分析

需要对这个问题进行彻底调查，防止同样的问题再次发生。

为了保证已经建立的连接不受影响，更改haproxy的配置后，是通过新运行haproxy，同时对旧的haproxy发送`SIGUSR1`(-sf)的方式完成配置更新。

因此系统上会有大量的haproxy进程：

	   34 haproxy    6:54 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 5519
	17968 haproxy    0:40 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 17951 34 8111 11280 14352 14386 15134 16676 
	21164 haproxy    0:29 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 21147 34 8111 15134 17968 18631 20076 20127
	22541 haproxy    0:26 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 22524 34 15134 17968 20127 20144 20229 20246
	23289 haproxy    0:24 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 23272 34 15134 17968 20127 20144 20229 20246
	26939 root       0:00 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 26924 34 15134 17968 21164 22541 23289 24513
	29787 haproxy    0:05 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 29770 34 17968 21164 22541 23289 26939 28971
	30110 haproxy    0:03 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30093 34 17968 21164 22541 23289 26939 29549
	30625 haproxy    0:02 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30608 34 17968 21164 22541 23289 26939 29702
	30642 haproxy    0:13 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30625 34 17968 21164 22541 23289 26939 29719
	30727 haproxy    0:01 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30710 34 17968 21164 22541 23289 26939 29787
	30806 haproxy    0:01 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30789 34 17968 21164 22541 23289 26939 29787
	30845 haproxy    0:02 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30828 34 17968 21164 22541 23289 26939 29787
	30940 haproxy    0:04 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30923 34 17968 21164 22541 23289 26939 29787
	30973 haproxy    0:01 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30960 34 17968 21164 22541 23289 26939 29787
	30989 haproxy    0:02 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30973 34 17968 21164 22541 23289 26939 29787
	31013 haproxy    0:04 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 30989 34 17968 21164 22541 23289 26939 29787

比较奇怪的是，26939号进程的用户是root，而其它haproxy进程的用户都是haproxy。

试验确定以haproxy身份运行的进程可以给以root身份运行的进程发送SIGUSR1信号。

在容器直接运行一个新的haproxy，并且不用`-sf`指定已经存在的haproxy进程的时候，可以出现多个haproxy监听同一个端口的情况：

	/ # haproxy -f /etc/haproxy/haproxy.cfg -db &
	/ # netstat -lntp |grep 80
	tcp        0      0 10.39.0.110:80          0.0.0.0:*               LISTEN      74/haproxy
	tcp        0      0 10.39.0.110:80          0.0.0.0:*               LISTEN      49/haproxy

在容器外运行的haproxy就没有这种情况。

暂时在容器内用脚本进行监测，自动清除多出的haproxy进程。

	#!/bin/sh
	PORT_80_PID=/tmp/port_80.pid
	HA_PID=/tmp/ha.pid
	KILL_LOG=/tmp/ha.kill.log
	while true;do
	    rm $PORT_80_PID
	    n=0
	    for p in `netstat -lntp |grep ":80 "|grep "/haproxy"|awk '{print $7}'|sort -g -r|awk -F "/" '{ print $1 }'`;do
	        echo "$p " >>$PORT_80_PID
	        let n=n+1
	    done
	
	    if [ $n -gt 2 ];then
	        ps -o pid,comm |grep " haproxy"  > $HA_PID
	        pid=`grep -f $PORT_80_PID $HA_PID |awk  '{ if(NR==1 ){print $1} }'`
	        if [[ "$pid" != "" ]];then
	                echo "kill -9 $pid @ `date`" >>$KILL_LOG
	                kill -9  $pid
	        fi
	    fi
	    sleep 60
	done

## 参考

1. [使用端口复用(SO_REUSEPORT)、反复对haproxy进行reload操作，导致访问haproxy间歇性返回503][1]

[1]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2017/09/19/haproxy-inter-not-found.html "使用端口复用(SO_REUSEPORT)、反复对haproxy进行reload操作，导致访问haproxy间歇性返回503" 
