---
layout: default
title:  "API网关Kong使用教程（十）：Kong在生产环境中的部署与性能测试方法"
author: 李佶澳
createdate: "2018-11-02 17:36:17 +0800"
changedate: "2018-11-02 17:36:17 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关,压力测试,benchmark
description: 生产环境中，将kong单独部署比较好，也方便进行压力测试，以及用火焰图进行性能分析
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的系列教程](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

生产环境中，将kong的数据平面单独部署比较好，也方便进行压力测试，以及用[火焰图进行性能分析][3]，这里将kong的管理平面和数据平面分开，数据平面独占一台机器，负责请求转发。

下面是一个大体可用的性能测试方法，测试的场景单一，只比较了直接访问Pod，和通过Kong访问Pod的效果，没有测试不同类型应用、对比Kong与Nginx-Ingress，以及对比开启不同插件时的结果。

## 测试结果

测试结果：

	环境                 Request/sec        Kbytes/sec       
	----------------------------------------------------------------------
	请求端到Kong带宽           NAN           74600.00
	Kong到Pod带宽              NAN           43400.00
	无并发，请求端到Pod    2760.69            1515.01 
	无并发，经Kong到Pod     722.00             539.39 
	100并发，请求端到Pod   7192.25            3948.62
	100并发，经Kong到Pod   5812.13            4344.57 

从请求端直接访问Pod，和从Kong所在的机器上直接访问Pod，测试结果基本相同，可以确定Kong到Pod的过程中不存在额外的干扰。

在Kong所在的机器上通过Kong访问应用，单并发时，平均每秒处理985.80个请求(请求端发起经过Kong访问的结果为722.00)，100并发时，平均每秒处理5339.20个请求（请求端经过Kong访问结果为5812.13)。

## 测试环境

请求端：8C16G，用ab等测试软件向Kong发起请求

Kong：4C8G，部署kong的数据平面0.14.1，响应请求

目标应用：mirrorgooglecontainers/echoserver:1.8

安装了17个插件：

	[root@request]# kubectl get kp --all-namespaces
	NAMESPACE NAME AGE
	kong-test correlationid-test 21d
	kong-test file-log-test 21d
	kong-test hebin-test-key-auth-plu 23d
	kong-test http-log-test 2d
	kong-test http-repeat-test 1d
	kong-test my-prometheus 21d
	kong-test ratelimiting-plu-test 22d
	kong-test request-size-limiting-plu-test 22d
	kong-test request-terminate-plu-test 22d
	kong-test request-tran-test 21d
	kong-test response-terminate-plu-test 22d
	kong-test response-tran-test 21d
	kong-test set-path 22d
	kong-test svc-virt-plu-test 21d
	kong-test syslog-log-test 21d
	kong-test udp-log-test 21d

## 带宽测试方法

请求端到Kong的带宽，Kong到Kubernetes中的容器的带宽，是不能被超越的。如果压测时，发现速率接近了这两个带宽中的一个，就说明已经达到极限。

网络带宽的测试结果和报文大小高度相关，报文很小时，测试到的带宽会明显下降，因此测试带宽时用的报文应当与访问应用时产生的报文大小接近。

通过kong返回报文和直接访问应用产生的报文大小不同，kong会在响应头中添加一些信息，如果压测时占用的带宽远远小于下面测试到的带宽，可以忽略报文大小的细微差异。

### 请求端到Kong的带宽

用iperf测试请求端到Kong的带宽，[iperf、netperf等网络性能测试工具的使用][2]。

在Kong启动iperf：

	$ iperf -p 5001 -s

在请求端发起测试，tcp报文大小为434时，请求端与Kong之间的带宽是`597Mbits/sec`：
 

	[root@request]# iperf -p 5001 -c 10.10.64.58 -t 120 -l 434
	------------------------------------------------------------
	Client connecting to 10.10.64.58, TCP port 5001
	TCP window size: 45.0 KByte (default)
	------------------------------------------------------------
	[  3] local 10.10.199.154 port 40322 connected with 10.10.64.58 port 5001
	[ ID] Interval       Transfer     Bandwidth
	[  3]  0.0-120.0 sec  8.35 GBytes   597 Mbits/sec

### Kong与Kubernetes集群中的Pod之间的带宽

在kubernetes集群中创建iperf-server容器：

	kubectl create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/iperf-server-all-in-one.yaml

Pod的IP地址为`192.168.7.8`：

	$ kubectl -n demo-iperf get pod -o wide
	NAME                           READY     STATUS    RESTARTS   AGE       IP            NODE
	iperf-server-6bd95d8bc-76v82   2/2       Running   0          2m        192.168.7.8   10.10.192.35

Service的ClusterIP为`10.254.136.179`：

	$ kubectl -n demo-iperf get svc
	NAME           TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)           AGE
	iperf-server   ClusterIP   10.254.136.179   <none>        5001/TCP,22/TCP   2m

报文大小为430时，Kong到Pod的带宽为`347Mbits/sec`：

	[root@kong ~]# iperf -p 5001 -c  192.168.7.8 -t 120 -l 434
	------------------------------------------------------------
	Client connecting to 192.168.7.8, TCP port 5001
	TCP window size: 45.0 KByte (default)
	------------------------------------------------------------
	[  3] local 192.168.38.0 port 35790 connected with 192.168.7.8 port 5001
	[ ID] Interval       Transfer     Bandwidth
	[  3]  0.0-120.0 sec  4.85 GBytes   347 Mbits/sec

顺手测试一下通过cluster ip访问时的带宽：

	[root@kong ~]# iperf -p 5001 -c 10.254.136.179  -t 120 -l 434
	------------------------------------------------------------
	Client connecting to 10.254.136.179, TCP port 5001
	TCP window size: 45.0 KByte (default)
	------------------------------------------------------------
	[  3] local 10.10.64.58 port 59508 connected with 10.254.136.179 port 5001
	[ ID] Interval       Transfer     Bandwidth
	[  3]  0.0-120.0 sec  4.64 GBytes   332 Mbits/sec

## 通过kong访问应用与直接访问应用

在kubernetes中创建应用：

	$ kubectl create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/echo-all-in-one.yaml

绑定的域名为`echo.com`，pod的IP为`192.168.7.2`：

	$[root@request tmp] kubectl -n demo-echo get ingress -o wide
	NAME           HOSTS      ADDRESS         PORTS     AGE
	ingress-echo   echo.com   10.10.173.203   80        1h
	
	[root@request tmp]# kubectl -n demo-echo get pod -o wide
	NAME                    READY     STATUS    RESTARTS   AGE       IP            NODE
	echo-7f4c564c84-7pds2   2/2       Running   0          1h        192.168.7.2   10.10.192.35


### 无并发的情况

对比在无并发的情况下的结果，请求端发起访问的结果。

#### 从请求端直接访问Pod

从请求端直接访问Pod，无并发时，平均每秒处理`2760.69`个请求，带宽为`1515.01Kbytes/s`，远远没有达到饱和状态。

	[root@request]# ab -k -n 100000 -c 1 -H "Host: echo.com" http://192.168.7.2:8080/
	This is ApacheBench, Version 2.3 <$Revision: 1430300 $>
	Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
	Licensed to The Apache Software Foundation, http://www.apache.org/
	
	Benchmarking 192.168.7.2 (be patient)
	...
	Finished 100000 requests
	
	
	Server Software:        echoserver
	Server Hostname:        192.168.7.2
	Server Port:            8080
	
	Document Path:          /
	Document Length:        415 bytes
	
	Concurrency Level:      1
	Time taken for tests:   36.223 seconds
	Complete requests:      100000
	Failed requests:        0
	Write errors:           0
	Keep-Alive requests:    99000
	Total transferred:      56195000 bytes
	HTML transferred:       41500000 bytes
	Requests per second:    2760.69 [#/sec] (mean)
	Time per request:       0.362 [ms] (mean)
	Time per request:       0.362 [ms] (mean, across all concurrent requests)
	Transfer rate:          1515.01 [Kbytes/sec] received
	
	Connection Times (ms)
	              min  mean[+/-sd] median   max
	Connect:        0    0   0.0      0       1
	Processing:     0    0   0.1      0       8
	Waiting:        0    0   0.1      0       8
	Total:          0    0   0.2      0       8
	
	Percentage of the requests served within a certain time (ms)
	  50%      0
	  66%      0
	  75%      0
	  80%      0
	  90%      0
	  95%      0
	  98%      1
	  99%      1
	 100%      8 (longest request)

#### 从请求端通过Kong访问Pod

从请求端通过kong访问Pod，无并发时，每秒中处理`722.00`个请求，带宽为`539.39Kbytes/s`，远远没有达到饱和状态：

	[root@request]# ab -k -n 100000 -c 1 -H "Host: echo.com" http://10.10.64.58:8000/
	This is ApacheBench, Version 2.3 <$Revision: 1430300 $>
	Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
	Licensed to The Apache Software Foundation, http://www.apache.org/
	
	Benchmarking 10.10.64.58 (be patient)
	...
	Finished 100000 requests
	
	
	Server Software:        echoserver
	Server Hostname:        10.10.64.58
	Server Port:            8000
	
	Document Path:          /
	Document Length:        558 bytes
	
	Concurrency Level:      1
	Time taken for tests:   138.504 seconds
	Complete requests:      100000
	Failed requests:        0
	Write errors:           0
	Keep-Alive requests:    0
	Total transferred:      76500004 bytes
	HTML transferred:       55800000 bytes
	Requests per second:    722.00 [#/sec] (mean)
	Time per request:       1.385 [ms] (mean)
	Time per request:       1.385 [ms] (mean, across all concurrent requests)
	Transfer rate:          539.39 [Kbytes/sec] received
	
	Connection Times (ms)
	              min  mean[+/-sd] median   max
	Connect:        0    0   0.2      0      18
	Processing:     1    1   0.4      1      18
	Waiting:        0    1   0.4      1      17
	Total:          1    1   0.5      1      19
	
	Percentage of the requests served within a certain time (ms)
	  50%      1
	  66%      1
	  75%      1
	  80%      1
	  90%      2
	  95%      2
	  98%      2
	  99%      3
	 100%     19 (longest request)

###  100并发，总数10万个请求

#### 从请求端直接访问Pod

平均每秒钟处理`7192.25`个请求，占用带宽为`3948.62Kbytes/s`，远远未达到饱和状态。

	[root@request]#  ab -k -n 100000 -c 100 -H "Host: echo.com" http://192.168.7.2:8080/
	This is ApacheBench, Version 2.3 <$Revision: 1430300 $>
	Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
	Licensed to The Apache Software Foundation, http://www.apache.org/
	
	Benchmarking 192.168.7.2 (be patient)
	...
	Finished 100000 requests
	
	
	Server Software:        echoserver
	Server Hostname:        192.168.7.2
	Server Port:            8080
	
	Document Path:          /
	Document Length:        415 bytes
	
	Concurrency Level:      100
	Time taken for tests:   13.898 seconds
	Complete requests:      100000
	Failed requests:        0
	Write errors:           0
	Keep-Alive requests:    99049
	Total transferred:      56195245 bytes
	HTML transferred:       41500000 bytes
	Requests per second:    7195.25 [#/sec] (mean)
	Time per request:       13.898 [ms] (mean)
	Time per request:       0.139 [ms] (mean, across all concurrent requests)
	Transfer rate:          3948.62 [Kbytes/sec] received
	
	Connection Times (ms)
	              min  mean[+/-sd] median   max
	Connect:        0    0   0.1      0       5
	Processing:     4   14  11.2     13     584
	Waiting:        1   14  11.2     13     584
	Total:          4   14  11.3     13     588
	
	Percentage of the requests served within a certain time (ms)
	  50%     13
	  66%     14
	  75%     14
	  80%     14
	  90%     15
	  95%     16
	  98%     17
	  99%     24
	 100%    588 (longest request)

#### 从请求端通过Kong访问Pod

平均每秒钟处理`5812.13`个请求，占用带宽为`4344.57Kbytes/s`，远远未达到饱和状态。

	[root@request]#  ab -k -n 100000 -c 100 -H "Host: echo.com" http://10.10.64.58:8000/
	This is ApacheBench, Version 2.3 <$Revision: 1430300 $>
	Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
	Licensed to The Apache Software Foundation, http://www.apache.org/
	
	Benchmarking 10.10.64.58 (be patient)
	...
	Finished 100000 requests
	
	
	Server Software:        echoserver
	Server Hostname:        10.10.64.58
	Server Port:            8000
	
	Document Path:          /
	Document Length:        558 bytes
	
	Concurrency Level:      100
	Time taken for tests:   17.205 seconds
	Complete requests:      100000
	Failed requests:        0
	Write errors:           0
	Keep-Alive requests:    0
	Total transferred:      76544051 bytes
	HTML transferred:       55800000 bytes
	Requests per second:    5812.13 [#/sec] (mean)
	Time per request:       17.205 [ms] (mean)
	Time per request:       0.172 [ms] (mean, across all concurrent requests)
	Transfer rate:          4344.57 [Kbytes/sec] received
	
	Connection Times (ms)
	              min  mean[+/-sd] median   max
	Connect:        0    2   2.0      2      11
	Processing:     1   15   8.0     14     148
	Waiting:        1   14   8.0     13     148
	Total:          1   17   7.9     16     151
	
	Percentage of the requests served within a certain time (ms)
	  50%     16
	  66%     18
	  75%     19
	  80%     19
	  90%     21
	  95%     24
	  98%     30
	  99%     46
	 100%    151 (longest request)

## 参考

1. [怎样测试Web应用服务器性能，评估运行效率？][1]
2. [iperf、netperf等网络性能测试工具的使用][2]
3. [Web开发平台OpenResty（三）：火焰图性能分析][3]

[1]: https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2018/11/02/webserver-benchmark-method.html  "怎样测试Web应用服务器性能，评估运行效率？"
[2]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2016/04/08/network-benchmark.html "iperf、netperf等网络性能测试工具的使用"
[3]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/11/02/openresty-study-03-frame-md.html "Web开发平台OpenResty（三）：火焰图性能分析"
