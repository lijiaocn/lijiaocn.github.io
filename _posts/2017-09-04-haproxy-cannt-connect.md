---
layout: default
title: 连接haproxy间歇性失败的问题调查
author: lijiaocn
createdate: 2017/09/04 09:39:54
changedate: 2017/09/05 18:18:15
categories: 问题
tags: haproxy
keywords: haproxy，
description: 运行一端时间后会出现client连接haproxy间歇性失败的情况，重启haproxy后恢复

---

* auto-gen TOC:
{:toc}

## 现象 

haproxy运行在容器中，一个agent会管理haproxy，频繁地设置规则，频繁地对haproxy进行reload操作。

发现运行一端时间后会出现client连接haproxy的间歇性失败的情况，重启haproxy后恢复。

抓包观察时发现，client向haproxy发起连接后一直在等待，而haproxy并没有与backend建立连接。

因现场丢失，下面的调查是在还未出现故障的环境中进行的。

## 准备

在调查之前，先阅读了一下的[haproxy的管理手册][1]，从手册中得知:

	1. haproxy是单进程的，事件驱动的，非阻塞的
	2. haproxy是tcp proxy，通过netstat可以看到监听的端口
	3. haproxy的退出有两种方式: 1 直接退出；2 graceful stop，释放监听端口，已有连接处理完成后结束

haproxy在启动时候可以用`-sf`和`-st`指定一组进程号：

	-sf:  新启动的haproxy将向指定的进程发送SIGUSR1信号，目标haproxy graceful stop
	-st:  新启动的haproxy将向指定的进程发送SIGUSR1信号，目标haproxy直接退出

[stopping and restarting haproxy][2]详细介绍了haproxy的启动过程：

	1. 新启动的haproxy尝试绑定所有的监听端口
		2. 如果要绑定的监听端口已经被占用，向-sf和-st指定的已有的haproxy进程发送信号: SIGTTOU
		3. 收到SIGTTOU信号的haproxy释放自己监听的所有端口，但继续处理已经建立的连接
		4. 新启动的haproxy再次尝试绑定监听端口
			5. 如果绑定再次失败，向-sf和-st指定的已有的haproxy进程发送信号：SIGTTIN
			6. 收到SIGTTIN信号haproxy进程重新监听端口，恢复原先的工作状态
	7. 如果新启动haproxy绑定端口成功，那么向-sf指定的进程发送SIGUSR1信号，向-st指定的进程发送SIGTERM信号

在上面的过程中，有两个时间窗口，连接会失败：

	1. 新的haproxy进程绑定端口再次失败，旧的haproxy进程释放端口又重新恢复的间隙
	2. 旧的haproxy进程已经关闭端口，kernel中积压的在端口关闭前极端时间窗口内的报文:
		2.1 如果是SYN报文，会导致回应RST
		2.2 在端口关闭前处于SYN_RECV状态，在端口关闭后收到client的ACK报文，会导致回应RST
	
对于窗口1，kernel3.9之后，socket支持SO_REUSEPORT选项，可以在端口没有被释放的情况下绑定。

对于窗口2，可以通过在reload操作前1s中的时候，设置防火墙规则，禁止SYN报文通过，使client端重传报文。

这两个时间窗口导致连接失败的概率大概是：在1秒内，每10000个新建连接，会出现1次失败。

## 调查

到运行haproxy中的容器中进行调查。

	# docker exec -it  <容器ID>  /bin/sh
	# ps aux | grep proxy
	24 haproxy    0:31 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 133
	41 haproxy    0:26 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 24
	56 haproxy    0:26 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 41
	71 haproxy    0:37 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 56
	88 haproxy    2:57 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 71
	103 haproxy    0:14 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 88
	118 haproxy    0:15 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 103
	133 haproxy    1:27 haproxy -f /etc/haproxy/haproxy.cfg -db -sf 118

haproxy中设置的连接的超时时间为1天，如果client端使用长链接，旧的haproxy进程就会一直存在。

重新以特权模式进入容器，查看其中一个haproxy的进程情况：

(注意必须使用特权模式`--privileged`，不然netstat -p看不到进程号和程序名称)

	# docker exec --privileged  -it de15288b00a4 /bin/sh
	# netstat -anp |grep 24\/haproxy
	Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
	tcp        0      0 10.39.1.67:51122        192.168.93.132:10120    ESTABLISHED 24/haproxy
	tcp        0      0 10.39.1.67:54334        192.168.217.9:10120     ESTABLISHED 24/haproxy
	tcp        0      0 10.39.1.67:17972        10.39.1.219:48908       ESTABLISHED 24/haproxy
	tcp        0      0 10.39.1.67:16141        10.39.1.195:60332       ESTABLISHED 24/haproxy
	udp        0      0 0.0.0.0:36062           0.0.0.0:*                           24/haproxy

进程号为24的haproxy进程应当是第一个haproxy进程，长链接确实存在没有什么问题。

继续看下一个haproxy进程：

	# netstat -anp |grep " 41/haproxy"
	tcp        0      0 10.39.1.67:53238        192.168.176.73:6001     CLOSE_WAIT  41/haproxy
	tcp        0      0 10.39.1.67:44084        10.39.1.199:57008       FIN_WAIT2   41/haproxy
	tcp        0      0 10.39.1.67:17972        10.39.1.114:37112       ESTABLISHED 41/haproxy
	tcp        0      0 10.39.1.67:16141        10.39.1.228:51376       ESTABLISHED 41/haproxy
	tcp        0      0 10.39.1.67:50716        192.168.67.73:8080      CLOSE_WAIT  41/haproxy
	tcp        0      0 10.39.1.67:59842        192.168.17.147:8080     CLOSE_WAIT  41/haproxy
	tcp        0      0 10.39.1.67:44084        10.39.1.200:44646       FIN_WAIT2   41/haproxy
	tcp        0      0 10.39.1.67:42194        192.168.237.249:80      CLOSE_WAIT  41/haproxy
	tcp        0      0 10.39.1.67:18730        113.240.212.187:32931   FIN_WAIT2   41/haproxy
	tcp        0      0 10.39.1.67:44084        10.39.1.230:40324       FIN_WAIT2   41/haproxy
	tcp        0      0 10.39.1.67:16141        10.39.1.220:41836       ESTABLISHED 41/haproxy
	tcp        0      0 10.39.1.67:54712        192.168.134.29:6001     CLOSE_WAIT  41/haproxy
	tcp        0      0 10.39.1.67:42192        192.168.237.249:80      CLOSE_WAIT  41/haproxy
	tcp        0      0 10.39.1.67:42260        192.168.237.249:80      CLOSE_WAIT  41/haproxy
	tcp        0      0 10.39.1.67:54640        192.168.217.9:10120     ESTABLISHED 41/haproxy
	tcp        0      0 10.39.1.67:18730        117.136.47.132:56180    FIN_WAIT2   41/haproxy
	tcp        0      0 10.39.1.67:28080        10.39.1.209:37055       FIN_WAIT2   41/haproxy
	tcp        0      0 10.39.1.67:55204        192.168.217.9:10120     ESTABLISHED 41/haproxy
	tcp        0      0 10.39.1.67:44084        10.39.1.136:50290       FIN_WAIT2   41/haproxy
	tcp        0      0 10.39.1.67:18080        10.39.0.226:41614       FIN_WAIT2   41/haproxy
	tcp        0      0 10.39.1.67:51434        192.168.93.132:10120    ESTABLISHED 41/haproxy
	tcp        0      0 10.39.1.67:55168        192.168.217.9:10120     ESTABLISHED 41/haproxy
	tcp        0      0 10.39.1.67:42268        192.168.237.249:80      CLOSE_WAIT  41/haproxy
	tcp        0      0 10.39.1.67:16141        10.39.1.204:40424       ESTABLISHED 41/haproxy
	udp        0      0 0.0.0.0:55353           0.0.0.0:*                           41/haproxy

发现有不少连接处于`CLOSE_WAIT`和`FIN_WAIT2`状态，根据远端IP地址可以判断：

	CLOSE_WAIT：haproxy向backend发起的连接，backend发起了FIN，haproxy没有回应FIN
	FIN_WAIT2： client向haproxy发起的连接，haproxy发起了FIN，没有收到client发送的FIN

CLOSE_WAIT和FIN_WAIT2的连接基本是一一对应的关系，可以推测：

	backend要终止连接，向haproxy发起了FIN
	haproxy与backend的连接进入CLOSE_WAIT状态，需要等待与client的连接断开后，才发送FIN关闭连接
	haproxy向client发起FIN，并得到了client的回应，进入FIN_WAIT2状态
	
	client迟迟不发送FIN给haproxy，导致haproxy与client的连接一直出于FIN_WAIT2状态，haproxy与backend的连接也始终为CLOSE_WAIT状态。

到CLOSE_WAIT对应的backend中，发现后端中已经没有对应的socket，应当是等待超时后自动关闭了。

通过查阅[haproxy configuration][4]手册，得知haproxy使用配置项`timeout client-fin`设置FIN_WAIT的时间。

在调查的目标环境中，没有设置这个配置项，默认使用`timeout client`，而目标环境中的timeout时间是一天。

## 调查2

调整了超时时间后，再次观察，发现系统中处于`FIN_WAIT1`状态的连接有几十个，并且持续时间很长。

	$netstat -nat|awk '{print awk $NF}'|sort|uniq -c|sort -n
	      1 CLOSE_WAIT
	      1 FIN_WAIT2
	      1 State
	      1 established)
	      3 LAST_ACK
	     30 FIN_WAIT1
	    151 LISTEN
	    280 TIME_WAIT
	   1548 ESTABLISHED

调整内核参数：

	echo "net.ipv4.tcp_orphan_retries=1" >> /etc/sysctl.conf
	sysctl -p

调整内核参数，快速回收TIME_WAIT状态的socket：

	echo "net.ipv4.tcp_tw_reuse=1"   >>/etc/sysctl.conf
	echo "net.ipv4.tcp_tw_recycle=1" >>/etc/sysctl.conf
	sysctl -p

## 结论

其实还没有结论！到目前为止，只知道因为timeout设置的不合理，导致haproxy的很多连接处于半连接状态。

但是并没有真凭实据可以证明，是因为存在过多的半连接导致有时候访问haproxy会失败的问题。

将haproxy的timeout时间调整后，正在继续观察分析中。(2017-09-05 09:34:44)

	defaults
	    mode                    http
	    log                     global
	    option                  dontlognull
	    option http-server-close
	    option                  redispatch
	    retries                 3
	    timeout check           3s
	    timeout client          900s
	    timeout client-fin      3s
	    timeout connect         5s
	    timeout http-keep-alive 900s
	    timeout http-request    60s
	    timeout queue           300s
	    timeout server          900s
	    timeout server-fin      3s
	    timeout tarpit          900s
	    timeout tunnel          24h
	    maxconn                 5000

## 附录: haproxy中的时间配置

haproxy1.7中有11个以`timeout`开头的[配置][5]。

### timeout check

	If set, haproxy uses min("timeout connect", "inter") as a connect timeout
	for check and "timeout check" as an additional read timeout.

### timeout client

	The inactivity timeout applies when the client is expected to acknowledge or send data.

### timeout client-fin

	The inactivity timeout applies when the client is expected to acknowledge or
	send data while one direction is already shut down. 

### timeout connect

	the maximum time to wait for a connection attempt to a server to succeed.

### timeout http-keep-alive

	It will define how long to wait for a new HTTP request to start coming after
	a response was sent. Once the first byte of request has been seen, the 
	"http-request" timeout is used to wait for the complete request to come.

### timeout http-request

	the maximum allowed time to wait for a complete HTTP request

### timeout queue

	When a server's maxconn is reached, connections are left pending in a queue
	which may be server-specific or global to the backend. In order not to wait
	indefinitely, a timeout is applied to requests pending in the queue. If the
	timeout is reached, it is considered that the request will almost never be
	served, so it is dropped and a 503 error is returned to the client.

### timeout server

	the maximum inactivity time on the server side.

### timeout server-fin

	The inactivity timeout applies when the server is expected to acknowledge or
	send data while one direction is already shut down. This timeout is different
	from "timeout server" in that it only applies to connections which are closed
	in one direction.

### timeout tarpit

	When a connection is tarpitted using "http-request tarpit" or
	"reqtarpit", it is maintained open with no activity for a certain
	amount of time, then closed. "timeout tarpit" defines how long it will
	be maintained open.

### timeout tunel

	The tunnel timeout applies when a bidirectional connection is established
	between a client and a server, and the connection remains inactive in both
	directions. This timeout supersedes both the client and server timeouts once
	the connection becomes a tunnel. In TCP, this timeout is used as soon as no
	analyser remains attached to either connection (eg: tcp content rules are
	accepted). In HTTP, this timeout is used when a connection is upgraded (eg:
	when switching to the WebSocket protocol, or forwarding a CONNECT request
	to a proxy), or after the first response when no keepalive/close option is
	specified.

## 参考

1. [hproxy management guide][1]
2. [stopping and restarting haproxy][2]
3. [tcp状态][3]
4. [haproxy configuration][4]
5. [haproxy keywords matrix][5]

[1]: http://cbonte.github.io/haproxy-dconv/1.7/management.html  "haproxy management guide" 
[2]: http://cbonte.github.io/haproxy-dconv/1.7/management.html#4 "stopping and restarting haproxy"
[3]: http://www.cnblogs.com/qlee/archive/2011/07/12/2104089.html "tcp状态"
[4]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html  "haproxy configuration"
[5]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#4.1 "haproxy proxy keywords matrix"
