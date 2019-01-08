---
layout: default
title: "怎样测试Web应用服务器性能，评估运行效率？"
author: 李佶澳
createdate: "2018-11-02 10:53:46 +0800"
changedate: "2018-11-02 10:53:46 +0800"
categories: 方法
tags: 方法
keywords: benchmark,web server,性能测试
description: 最近在研究学习openresty和kong，openresty将处理逻辑直接内置在nginx中，这样做带来怎样提升？需要有一套测量方法
---

* auto-gen TOC:
{:toc}

## 说明

最近在研究学习openresty和kong，openresty将处理逻辑直接内置在nginx中，这样做会带来怎样提升？需要有一套测量方法。

## 关注的指标

### 外在指标

从外在来看，直接关心的是在多并发的情况下，每个请求的处理效率。

并发数量是一个可控的条件，每个请求的处理效率是测量的数值。
主观揣测，如果以并发数量为横轴，每个请求的处理效率为纵轴，可能会得到一个抛物线：随着并发数量增加，每个请求的处理效率越来越高，当并发数量超过一个界值，处理效率开始平稳或者下降。

#### 请求处理效率的测量

每个请求的处理效率如何测量是个问题。

最容易想到的是请求的平均处理时间，可以用`每秒钟处理的请求数`来度量，每秒钟处理的请求数量越多，平均处理时间越短，每秒钟处理的请求数也更能直观反应Web服务器的处理能力。

但只看平均数据是不够的，请求处理的平稳性也很重要，如果有的请求响应特别快，有的请求响应特别慢，即使平均响应时间很短，也不是一个好的结果，可控、可预测比更好看的平均数字更重要。
请求处理的平稳性可以通过`请求响应时间的分布情况`来度量。

请求的类型也需要关注，需要对不同类型的请求分别测量，可以想到的几种类型有：

	1. 响应型，请求后，立即响应，没有复杂的处理逻辑，传输的数据量也非常少，仅仅就是回应
	2. 传输型，每次请求需要上传或者回应大量数据，Web服务器上的文件数量、被请求的文件的分布情况是重要的场景因素
	3. 计算型，请求需要在后台进行一些计算，需要经过一段时间的CPU运算，才能返回字节数很少的结果

#### 并发处理效率的测量

从实际场景来看，Web Server通常面对的是分布在天南海北的客户端，瞬间涌入大量新建连接的请求的场景，会更常见一些，因此`并发增加速率`也是非常重要的指标。

### 内在指标

如果从外在看来，两个Web Server软件的处理能力相同，每秒钟处理的请求、请求处理时间分布也随着并发数量的变化保持一致，那么需要关注一下它们的内在指标，例如CPU使用率等。

如果内在指标有明显的不同，可以理解为实现机制上有显著不同，或者遭遇了不同瓶颈，择优选取。

测试时带宽占用情况也需要关注，如果是传输型的请求，瓶颈可能在于带宽。

## 外在压测工具

[How to do Web Server Performance Benchmark in FREE?][1]中介绍了几种常见的BenchMark测试工具。

[Modern HTTP Benchmarking Tools ready for 2018 – h2load, hey & wrk][8]中介绍了另外几个比较新的压测工具。

对Web应用压测之前，先要测试一下发起请求的机器与目标机器之间的带宽：[iperf、netperf等网络性能测试工具的使用][7]

### wrk

建议使用wrk，wrk效率非常非常，可以用10~20%的cpu将目标机器上的多个cpu打满， siege则几乎是一个cpu只能打满对方一个cpu）：

	git clone https://github.com/wg/wrk.git
	cd wrk 
	make

wrk使用方法如下：

```
./wrk -t 32 -c 64 -d 60s -H "Host: webshell.com" http://172.16.129.4/ping
```

### ApacheBench

ApacheBench的测试结果中包括每秒钟的请求次数、请求的处理时间分布、请求的平均耗时、传输的数据量，以及连接建立、处理过程的时间分布，非常详细。

	yum install httpd-tools

下面是ab的测试输出：

	[root@lab ~]# ab -n 5000 -c 500 http://localhost:80/
	This is ApacheBench, Version 2.3 <$Revision: 655654 $>
	Copyright 1996 Adam Twiss, Zeus Technology Ltd, http://www.zeustech.net/
	Licensed to The Apache Software Foundation, http://www.apache.org/
	Benchmarking localhost (be patient)
	Completed 500 requests
	Completed 1000 requests
	Completed 1500 requests
	Completed 2000 requests
	Completed 2500 requests
	Completed 3000 requests
	Completed 3500 requests
	Completed 4000 requests
	Completed 4500 requests
	Completed 5000 requests
	Finished 5000 requests
	Server Software:        Apache/2.2.15
	Server Hostname:        localhost
	Server Port:            80
	Document Path:          /
	Document Length:        4961 bytes
	Concurrency Level:      500
	Time taken for tests:   13.389 seconds
	Complete requests:      5000
	Failed requests:        0
	Write errors:           0
	Non-2xx responses:      5058
	Total transferred:      26094222 bytes
	HTML transferred:       25092738 bytes
	Requests per second:    373.45 [#/sec] (mean)
	Time per request:       1338.866 [ms] (mean)
	Time per request:       2.678 [ms] (mean, across all concurrent requests)
	Transfer rate:          1903.30 [Kbytes/sec] received
	Connection Times (ms)
	min  mean[+/-sd] median   max
	Connect:        0   42  20.8     41    1000
	Processing:     0  428 2116.5     65   13310
	Waiting:        0  416 2117.7     55   13303
	Total:         51  470 2121.0    102   13378
	Percentage of the requests served within a certain time (ms)
	50%    102
	66%    117
	75%    130
	80%    132
	90%    149
	95%    255
	98%  13377
	99%  13378
	100%  13378 (longest request)
	[root@lab ~]#

ab不支持http 1.1，如果要测试http1.1，可以使用[siege](https://www.joedog.org/siege-home/)或者[apib](https://github.com/apigee/apib)等

### siege

[siege](https://www.joedog.org/siege-home/)安装：

	yum install -y siege

siege的配置参数可以通过`siege -C`看到，配置项保存在`$HOME/.siege/siege.conf`中，比较常用的有：

```bash
protocol = HTTP/1.1      # 配置使用的协议
connection = keep-alive  # 使用长链接 
concurrent = 25          # 并发数量，可以用命令行参数-c覆盖
timeout = 600            # 链接超时时间
verbose = false          # 不显示每个请求
failures =  1024         # 可以容忍的失败数
```

另外siege还有一些命令行参数，命令行参数优先于配置文件中的设置：

```bash
[root@192.168.33.11 vagrant]# siege -h
SIEGE 4.0.2
Usage: siege [options]
       siege [options] URL
       siege -g URL
Options:
  -V, --version             VERSION, prints the version number.
  -h, --help                HELP, prints this section.
  -C, --config              CONFIGURATION, show the current config.
  -v, --verbose             VERBOSE, prints notification to screen.
  -q, --quiet               QUIET turns verbose off and suppresses output.
  -g, --get                 GET, pull down HTTP headers and display the
                            transaction. Great for application debugging.
  -c, --concurrent=NUM      CONCURRENT users, default is 10
  -r, --reps=NUM            REPS, number of times to run the test.
  -t, --time=NUMm           TIMED testing where "m" is modifier S, M, or H
                            ex: --time=1H, one hour test.
  -d, --delay=NUM           Time DELAY, random delay before each requst
  -b, --benchmark           BENCHMARK: no delays between requests.
  -i, --internet            INTERNET user simulation, hits URLs randomly.
  -f, --file=FILE           FILE, select a specific URLS FILE.
  -R, --rc=FILE             RC, specify an siegerc file
  -l, --log[=FILE]          LOG to FILE. If FILE is not specified, the
                            default is used: PREFIX/var/siege.log
  -m, --mark="text"         MARK, mark the log file with a string.
                            between .001 and NUM. (NOT COUNTED IN STATS)
  -H, --header="text"       Add a header to request (can be many)
  -A, --user-agent="text"   Sets User-Agent in request
  -T, --content-type="text" Sets Content-Type in request
```

siege的设计思路和ab是反的，ab是指定并发数和总的请求数，运行完所有请求后，统计时间，siege是指定并发数和运行时间，统计这段时间内完成的请求数。

例如下面是用10个并发，进行一分钟的benchmark测试，参数`-b`表示使用benchmark的方式：

```bash
$ siege -c 10 -b -t 1M -H "host: echo.com"  192.168.33.12:8000
** SIEGE 4.0.2
** Preparing 10 concurrent users for battle.
The server is now under siege...

Transactions:		      102797 hits
Availability:		       99.01 %
Elapsed time:		       28.07 secs
Data transferred:	       61.37 MB
Response time:		        0.00 secs
Transaction rate:	     3662.17 trans/sec
Throughput:		        2.19 MB/sec
Concurrency:		        9.71
Successful transactions:      102797
Failed transactions:	        1024
Longest transaction:	        0.03
Shortest transaction:	        0.00
```
#### 遇到的问题

siege压测时遇到一个问题：

```bash
[root@192.168.33.11 vagrant]# siege -q -c 10 -b -t 10s -H "host: echo.com"  192.168.33.12:7000
[error] socket: read error Connection reset by peer sock.c:539: Connection reset by peer
[error] socket: read error Connection reset by peer sock.c:539: Connection reset by peer
siege aborted due to excessive socket failure; you can change the failure threshold in $HOME/.siegerc
```

可以修改`$HOME/.siege/siege.conf`中的配置，增加容忍的失败数：

	failures =  1024         # 可以容忍的失败数

把failures调高，是治标不治本的做法，还要找到被reset的原因，但是在nginx日志和dmesg中都没有找到日志，access.log中的请求日志全部是成功的。

从[Tuning NGINX for Performance](https://www.nginx.com/blog/tuning-nginx/)知道了[keepalive_requests](https://nginx.org/en/docs/http/ngx_http_core_module.html?&_ga=2.131946575.1318856059.1542940760-488530544.1533263950#keepalive_requests)，这个参数限制了一个keep-alive连接中可以发起的请求的数量，调大即可：

```bash
	server {
	    listen       7000 ;
	    listen       [::]:7000 ;
	    server_name  echo.com;                         # 在本地host配置域名
	    keepalive_requests  10000000;
	
	    location / {
	      proxy_pass http://172.16.128.20:8080;
	    }
	}
```

## 内在测量工具

## 性能分析工具

用火焰图进行性能分析的案例： [Web开发平台OpenResty（三）：火焰图性能分析][6]。

## 参考

1. [How to do Web Server Performance Benchmark in FREE?][1]
2. [如何读懂火焰图？][2]
3. [SystemTAP Documentation][3]
4. [SystemTAP WiKi][4]
5. [SystemTAP初学者手册][5]
6. [Web开发平台OpenResty（三）：火焰图性能分析][6]
7. [iperf、netperf等网络性能测试工具的使用][7]
8. [Modern HTTP Benchmarking Tools ready for 2018 – h2load, hey & wrk][8]

[1]: https://geekflare.com/web-performance-benchmark/ "How to do Web Server Performance Benchmark in FREE?"
[2]: http://www.ruanyifeng.com/blog/2017/09/flame-graph.html "如何读懂火焰图？"
[3]: https://sourceware.org/systemtap/documentation.html "SystemTAP Documentation"
[4]: https://sourceware.org/systemtap/wiki "SystemTAP WiKi"
[5]: https://sourceware.org/systemtap/SystemTap_Beginners_Guide/ "SystemTAP初学者手册"
[6]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/11/02/openresty-study-03-frame-md.html "Web开发平台OpenResty（三）：火焰图性能分析"
[7]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2016/04/08/network-benchmark.html "iperf、netperf等网络性能测试工具的使用"
[8]: https://malloc.fi/modern-http-benchmarking-tools-h2load-hey-wrk "Modern HTTP Benchmarking Tools ready for 2018 – h2load, hey & wrk"
z
