---
layout: default
title: iperf、netperf等网络性能测试工具的使用
author: 李佶澳
createdate: 2016/04/08 19:54:59
changedate: 2017/08/10 16:09:23
categories: 技巧
tags: network
keywords: 网络指令,netperf,iperf
description: iperf、netperf等网络性能测试工具的使用。

---

## iperf

	yum install -y epel-release
	yum install -y iperf

### 启动server

[iperf-doc][7]中介绍iperf的参数。

	$iperf -p 5201 -s 
	
	-s: server模式
	-p: 监听端口，默认5001

### 启动client

	$iperf -p 5201 -c 192.168.10.2  -l 1M -t 120
	
	-p: server端口，默认5001
	-c: server地址
	-l: 每次发送的数据的长度，默认tcp是128K，UDP是8K。
	-t: 持续的时间

## netperf

[tools-NetBenchmark][5]中收录了netperf。

在两台机器上执行下列操作：

	yum install -y gcc make git
	git clone  https://github.com/lijiaocn/tools-NetBenchmark.git
	cd tools-NetBenchmark/netperf
	./0_install.sh

### 设置Server

在脚本1_start_server.sh中设置监听的端口：

	$cat 1_start_server.sh
	#!/bin/bash
	netserver -4 -p 7777
	ps aux|grep netserver

然后Server的机器上执行:

	./1_start_server.sh

这时候Server上应当开启了7777端口:

	$netstat -lnt
	Active Internet connections (only servers)
	Proto Recv-Q Send-Q Local Address           Foreign Address         State
	tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN
	tcp        0      0 0.0.0.0:7777            0.0.0.0:*               LISTEN
	tcp6       0      0 :::22                   :::*                    LISTEN

### 启动client

在作为client的机器上，进入目录tools-NetBenchmark/netperf/cases。

在config中配置服务端地址：

	$cat config
	PORT=7777
	HOST=192.168.10.2
	IPVERSION=4

case目录中创建了与测试类型同名的脚本，测试时，直接运行对应的脚本即可。

	$ls
	DG_RR.sh        LOC_CPU.sh           STREAM_RR.sh      TCP_STREAM.sh
	DG_STREAM.sh    REM_CPU.sh           STREAM_STREAM.sh  UDP_RR.sh
	DLCL_RR.sh      SCTP_RR.sh           TCP_CRR.sh        UDP_STREAM.sh
	DLCL_STREAM.sh  SCTP_RR_MANY.sh      TCP_MAERTS.sh     config
	DLCO_RR.sh      SCTP_STREAM.sh       TCP_RR.sh
	DLCO_STREAM.sh  SCTP_STREAM_MANY.sh  TCP_SENDFILE.sh

譬如，进行TCP流传输测试：

	 $./TCP_STREAM.sh
	 MIGRATED TCP STREAM TEST from 0.0.0.0 (0.0.0.0) port 0 AF_INET to 192.168.10.2 () port 0 AF_INET
	 Recv   Send    Send
	 Socket Socket  Message  Elapsed
	 Size   Size    Size     Time     Throughput
	 bytes  bytes   bytes    secs.    10^6bits/sec
	
	 87380  87380  87380    10.31     728.66

## 参考

1. [netperf.org][1]
2. [netperf与网络性能测量][2]
3. [netperf使用][3]
4. [netperf download][4]
5. [tools-NetBenchmark][5]
6. [iperf][6]
7. [iperf-doc][7]

[1]: http://netperf.org/netperf"netperf.org"
[2]: http://www.ibm.com/developerworks/cn/linux/l-netperf/ "netperf与网络性能测量" 
[3]: http://blog.itpub.net/22664653/viewspace-714569/ "netperf使用" 
[4]: ftp://ftp.netperf.org/netperf/netperf-2.7.0.tar.gz "netperf download"
[5]: https://github.com/lijiaocn/tools-NetBenchmark/tree/master/netperf "tools-NetBenchmark"
[6]: https://iperf.fr/ "iperf"
[7]: https://iperf.fr/iperf-doc.php "iperf-doc"
