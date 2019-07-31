---
layout: default
title: kuberntes的node无法通过物理机网卡访问Service
author: 李佶澳
createdate: 2017/03/31 16:26:56
last_modified_at: 2017/09/27 13:46:56
categories: 问题
tags: kubernetes
keywords:  
description: 在kubernetes的一台物理机上访问service的clusterIP，没有响应，经过调查发现通过物理机的网卡无法访问服务。

---

## 目录
* auto-gen TOC:
{:toc}

在kubernetes的一台物理机上访问service的clusterIP，没有响应，经过调查发现默认路由是"dev eth0"，而通过物理机的Underlay网卡无法访问服务。

## 环境

服务地址

	10.254.51.153

服务的endpoint: 

	 192.168.67.4:8082

物理服务器eth0地址:

	10.39.0.17/24

flannel0地址：

	192.168.82.0/24

物理机上的默认路由是dev eth0。

## 现象

通过flannel0可以访问:

	$curl  --interface flannel0 http://10.254.51.153/api/v1/model/namespaces/default/pods/busybox-1865195333-zkwtt/containers/busybox/metrics/cpu/usage
	{
	  "metrics": [
	   {
	    "timestamp": "2017-03-31T08:47:00Z",
	    "value": 7846847
	   },
	   {
	    "timestamp": "2017-03-31T08:48:00Z",
	    "value": 7846847
	   },
	   {
	    "timestamp": "2017-03-31T08:49:00Z",
	    "value": 7846847
	   }
	  ],
	  "latestTimestamp": "2017-03-31T08:49:00Z"
	 }

通过默认路由eth0访问时:

	$curl  http://10.254.51.153/api/v1/model/namespaces/default/pods/busybox-1865195333-zkwtt/containers/busybox/metrics/cpu/usage
	^C  

## 客户端包处理日志

清空iptables：

	iptables -t raw -F
	iptables -t mangle -F
	iptables -t filter -F
	iptables -t nat -F
	systemctl restart kube-proxy

添加iptables日志规则:

	iptables -t raw -I OUTPUT -d 10.254.51.153 -j LOG --log-level 7 --log-prefix "raw out: "
	iptables -t mangle -I OUTPUT -d 10.254.51.153 -j LOG --log-level 7 --log-prefix "mangle out: "
	iptables -t nat -I OUTPUT -d 10.254.51.153 -j LOG --log-level 7 --log-prefix "nat out: "
	iptables -t filter -I OUTPUT -d 10.254.51.153 -j LOG --log-level 7 --log-prefix "filter out: "
	iptables -t mangle -I POSTROUTING -d 10.254.51.153 -j LOG --log-level 7 --log-prefix "mangle post: "
	iptables -t nat -I POSTROUTING -d 10.254.51.153 -j LOG --log-level 7 --log-prefix "nat post: "
	iptables -t nat -A POSTROUTING -d 10.254.51.153 -j LOG --log-level 7 --log-prefix "nat post: "

	iptables -t raw -I OUTPUT -d 192.168.67.4 -j LOG --log-level 7 --log-prefix "raw out: "
	iptables -t mangle -I OUTPUT -d 192.168.67.4 -j LOG --log-level 7 --log-prefix "mangle out: "
	iptables -t nat -I OUTPUT -d 192.168.67.4 -j LOG --log-level 7 --log-prefix "nat out: "
	iptables -t filter -I OUTPUT -d 192.168.67.4 -j LOG --log-level 7 --log-prefix "filter out: "
	iptables -t mangle -I POSTROUTING -d 192.168.67.4 -j LOG --log-level 7 --log-prefix "mangle post: "
	iptables -t nat -I POSTROUTING -d 192.168.67.4 -j LOG --log-level 7 --log-prefix "nat post: "
	iptables -t nat -A POSTROUTING -d 192.168.67.4 -j LOG --log-level 7 --log-prefix "nat post: "

通过flannel0访问服务10.254.51.153时候：

	Mar 31 16:57:22 slave1 kernel: raw out: IN= OUT=flannel0 SRC=192.168.82.0 DST=10.254.51.153 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=23666 DF PROTO=TCP SPT=58156 DPT=80 WINDOW=28640 RES=0x00 SYN URGP=0
	Mar 31 16:57:22 slave1 kernel: mangle out: IN= OUT=flannel0 SRC=192.168.82.0 DST=10.254.51.153 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=23666 DF PROTO=TCP SPT=58156 DPT=80 WINDOW=28640 RES=0x00 SYN URGP=0
	Mar 31 16:57:22 slave1 kernel: nat out: IN= OUT=flannel0 SRC=192.168.82.0 DST=10.254.51.153 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=23666 DF PROTO=TCP SPT=58156 DPT=80 WINDOW=28640 RES=0x00 SYN URGP=0
	Mar 31 16:57:22 slave1 kernel: filter out: IN= OUT=flannel0 SRC=192.168.82.0 DST=192.168.67.4 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=23666 DF PROTO=TCP SPT=58156 DPT=8082 WINDOW=28640 RES=0x00 SYN URGP=0
	Mar 31 16:57:22 slave1 kernel: mangle post: IN= OUT=flannel0 SRC=192.168.82.0 DST=192.168.67.4 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=23666 DF PROTO=TCP SPT=58156 DPT=8082 WINDOW=28640 RES=0x00 SYN URGP=0
	Mar 31 16:57:22 slave1 kernel: nat post: IN= OUT=flannel0 SRC=192.168.82.0 DST=192.168.67.4 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=23666 DF PROTO=TCP SPT=58156 DPT=8082 WINDOW=28640 RES=0x00 SYN URGP=0

通过eth0访问服务10.254.51.153时候：

	Mar 31 16:38:42 slave1 kernel: raw out: IN= OUT=eth0 SRC=10.39.0.17 DST=10.254.51.153 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=46455 DF PROTO=TCP SPT=34397 DPT=80 WINDOW=29200 RES=0x00 SYN URGP=0
	Mar 31 16:38:42 slave1 kernel: mangle out: IN= OUT=eth0 SRC=10.39.0.17 DST=10.254.51.153 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=46455 DF PROTO=TCP SPT=34397 DPT=80 WINDOW=29200 RES=0x00 SYN URGP=0
	Mar 31 16:38:42 slave1 kernel: nat out: IN= OUT=eth0 SRC=10.39.0.17 DST=10.254.51.153 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=46455 DF PROTO=TCP SPT=34397 DPT=80 WINDOW=29200 RES=0x00 SYN URGP=0
	Mar 31 16:38:42 slave1 kernel: filter out: IN= OUT=eth0 SRC=10.39.0.17 DST=192.168.67.4 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=46455 DF PROTO=TCP SPT=34397 DPT=8082 WINDOW=29200 RES=0x00 SYN URGP=0
	Mar 31 16:38:42 slave1 kernel: mangle post: IN= OUT=flannel0 SRC=10.39.0.17 DST=192.168.67.4 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=46455 DF PROTO=TCP SPT=34397 DPT=8082 WINDOW=29200 RES=0x00 SYN URGP=0
	Mar 31 16:38:42 slave1 kernel: nat post: IN= OUT=flannel0 SRC=10.39.0.17 DST=192.168.67.4 LEN=60 TOS=0x00 PREC=0x00 TTL=64 ID=46455 DF PROTO=TCP SPT=34397 DPT=8082 WINDOW=29200 RES=0x00 SYN URGP=0

可以看到两者最大的区别是SRC地址，通过flannel0出去的报文原地址是192.168.82.0，通过eth0出去的报文源地址是10.39.0.17

初步判断，通过eth0发出的报文源地址是eth0的IP，但是在经过了DNAT之后，目标地址是flannel0网段IP，所以报文被通过flannel0送出，但是源IP却不是flannel0网段的，所以迟迟地收不到回应包。

在flannel0上抓包，发现第一个syn报文被送出，但一直没有收到回应。

>注意：抓包时看到的链路层协议是raw ip，也就是没有链路层头的报文，因为flannel0是一个TUN设备，处理的是没有二层头的三层包

## 对比客户端与endpoint端的报文情况

### 通过flannel0访问Service

客户端:

	10:03:44.685400 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [S], seq 2191192236, win 28640, options [mss 1432,sackOK,TS val 230893328 ecr 0,nop,wscale 7], length 0
	10:03:44.686347 IP 192.168.67.4.us-cli > 192.168.82.0.37025: Flags [S.], seq 2617803445, ack 2191192237, win 28960, options [mss 1460,sackOK,TS val 1347268161 ecr 230893328,nop,wscale 7], length 0
	10:03:44.686443 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [.], ack 1, win 224, options [nop,nop,TS val 230893329 ecr 1347268161], length 0
	10:03:44.686630 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [P.], seq 1:176, ack 1, win 224, options [nop,nop,TS val 230893329 ecr 1347268161], length 175
	10:03:44.698455 IP 192.168.67.4.us-cli > 192.168.82.0.37025: Flags [.], ack 176, win 235, options [nop,nop,TS val 1347268173 ecr 230893329], length 0
	10:03:44.699126 IP 192.168.67.4.us-cli > 192.168.82.0.37025: Flags [P.], seq 1:396, ack 176, win 235, options [nop,nop,TS val 1347268174 ecr 230893329], length 395
	10:03:44.699200 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [.], ack 396, win 233, options [nop,nop,TS val 230893342 ecr 1347268174], length 0
	10:03:44.699489 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [F.], seq 176, ack 396, win 233, options [nop,nop,TS val 230893342 ecr 1347268174], length 0
	10:03:44.701185 IP 192.168.67.4.us-cli > 192.168.82.0.37025: Flags [F.], seq 396, ack 177, win 235, options [nop,nop,TS val 1347268176 ecr 230893342], length 0
	10:03:44.701248 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [.], ack 397, win 233, options [nop,nop,TS val 230893344 ecr 1347268176], length 0

endpoint端:

	10:03:44.636957 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [S], seq 2191192236, win 28640, options [mss 1432,sackOK,TS val 230893328 ecr 0,nop,wscale 7], length 0
	10:03:44.637063 IP 192.168.67.4.us-cli > 192.168.82.0.37025: Flags [S.], seq 2617803445, ack 2191192237, win 28960, options [mss 1460,sackOK,TS val 1347268161 ecr 230893328,nop,wscale 7], length 0
	10:03:44.638093 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [.], ack 1, win 224, options [nop,nop,TS val 230893329 ecr 1347268161], length 0
	10:03:44.649241 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [P.], seq 1:176, ack 1, win 224, options [nop,nop,TS val 230893329 ecr 1347268161], length 175
	10:03:44.649266 IP 192.168.67.4.us-cli > 192.168.82.0.37025: Flags [.], ack 176, win 235, options [nop,nop,TS val 1347268173 ecr 230893329], length 0
	10:03:44.650030 IP 192.168.67.4.us-cli > 192.168.82.0.37025: Flags [P.], seq 1:396, ack 176, win 235, options [nop,nop,TS val 1347268174 ecr 230893329], length 395
	10:03:44.651534 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [.], ack 396, win 233, options [nop,nop,TS val 230893342 ecr 1347268174], length 0
	10:03:44.651596 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [F.], seq 176, ack 396, win 233, options [nop,nop,TS val 230893342 ecr 1347268174], length 0
	10:03:44.651682 IP 192.168.67.4.us-cli > 192.168.82.0.37025: Flags [F.], seq 396, ack 177, win 235, options [nop,nop,TS val 1347268176 ecr 230893342], length 0
	10:03:44.652512 IP 192.168.82.0.37025 > 192.168.67.4.us-cli: Flags [.], ack 397, win 233, options [nop,nop,TS val 230893344 ecr 1347268176], length 0

### 通过default路由eth0时

客户端:

	 $tcpdump -i flannel0
	 tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	 listening on flannel0, link-type RAW (Raw IP), capture size 65535 bytes
	 10:00:18.136220 IP 10.39.0.17.55735 > 192.168.67.4.us-cli: Flags [S], seq 2791854768, win 29200, options [mss 1460,sackOK,TS val 230686779 ecr 0,nop,wscale 7], length 0
	 10:00:19.136867 IP 10.39.0.17.55735 > 192.168.67.4.us-cli: Flags [S], seq 2791854768, win 29200, options [mss 1460,sackOK,TS val 230687780 ecr 0,nop,wscale 7], length 0
	 10:00:21.140809 IP 10.39.0.17.55735 > 192.168.67.4.us-cli: Flags [S], seq 2791854768, win 29200, options [mss 1460,sackOK,TS val 230689784 ecr 0,nop,wscale 7], length 00

endpoint端:

	 $tcpdump -i flannel0
	 tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	 listening on flannel0, link-type RAW (Raw IP), capture size 65535 bytes
	 10:00:18.088526 IP 10.39.0.17.55735 > 192.168.67.4.us-cli: Flags [S], seq 2791854768, win 29200, options [mss 1460,sackOK,TS val 230686779 ecr 0,nop,wscale 7], length 0
	 10:00:19.089163 IP 10.39.0.17.55735 > 192.168.67.4.us-cli: Flags [S], seq 2791854768, win 29200, options [mss 1460,sackOK,TS val 230687780 ecr 0,nop,wscale 7], length 0
	 10:00:21.093064 IP 10.39.0.17.55735 > 192.168.67.4.us-cli: Flags [S], seq 2791854768, win 29200, options [mss 1460,sackOK,TS val 230689784 ecr 0,nop,wscale 7], length 00

可以看到，当flannel0收到源IP不属于flannel0管理的网段的报文时没有回应SYN。

也就是说当flannel0收到的报文的源IP是underlay网络的IP时，报文将不被处理。
