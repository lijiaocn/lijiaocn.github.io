---
layout: default
title:  "API网关Kong学习笔记（十九）：Kong的性能测试（与Nginx对比）"
author: 李佶澳
createdate: "2018-12-03 10:20:54 +0800"
last_modified_at: "2019-03-05 15:00:34 +0800"
categories: 项目
tags: kong 
keywords: kong,apigateway,API网关,压力测试,benchmark
description: "Kong在生产环境中的部署与性能测试方法中简单测试过kong的性能，当时环境有限，只是用虚拟机大概估计了下"
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

在[API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法][1]中简单测试过kong的性能，当时环境有限，只是用虚拟机大概估计了下。这次正式测试下。

{% include kong_pages_list.md %}

## 环境

两台机器，这两台机器是云主机，如果提供商超卖，测试结果可能不稳定（实际测试中观察的情况还好，浮动不大）：

	请求端： 10.10.173.203   4C8G    
	服务端： 10.10.64.58     4C8G 

iperf测速显示，机器之间的带宽为2G：

```bash
[root@10-10-64-58 ~]# iperf -c 10.10.173.203
------------------------------------------------------------
Client connecting to 10.10.173.203, TCP port 5001
TCP window size: 45.0 KByte (default)
------------------------------------------------------------
[  3] local 10.10.64.58 port 24708 connected with 10.10.173.203 port 5001
[ ID] Interval       Transfer     Bandwidth
[  3]  0.0-10.0 sec  2.56 GBytes  2.20 Gbits/sec
```

先用ansible脚本，在这两台机器行部署kubernetes：

	ansible-playbook -i inventories/staging/hosts  gencerts.yml
	ansible-playbook -i inventories/staging/hosts -u root  prepare.yml
	ansible-playbook -i inventories/staging/hosts -u root  site.yml

然后在集群中部署kube-dns和kong。

最终在10.10.64.58上有一个pod，分别通过10.10.64.58上的nginx和kong代理，对比两者的效率。

测试方法见：[用siege进行测试][2]

## 参数调整

注意下面测试使用的nginx版本是`nginx-1.12.2`，运行kong的OpenResty版本是`openresty-1.13.6.2`，Kong的版本是0.14.1。

>开始分别用nginx中做转发和用kong做转发，后来直接在运行kong的OpenResty中配置了转发代理，测试通过OpenResty代理访问的情况，与通过nginx代理访问的效果基本相同，OpenResty进程的CPU使用率远未饱和。

对nginx和kong的参数调整，下面只列出了调整的参数：

	worker_processes 2;
	worker_cpu_affinity 0010 1000;
	worker_rlimit_nofile  10340;
	worker_priority -20;
	events {
	    worker_connections 10240;
	    worker_aio_requests 32;
	}
	http{
	...
	    upstream webshell_upstream{
	        keepalive 16;
	        keepalive_timeout 60s;                # nginx 1.15.3
	    }
	    ...
	    server {
	        ...
	        keepalive_requests  10000000;
	        location / {
	            ...
	            proxy_socket_keepalive on;
	            proxy_connect_timeout  60s;       # nginx 1.15.6
	            proxy_send_timeout     60s;
	            proxy_read_timeout     60s;
	            proxy_http_version     1.1;
	            proxy_set_header Connection "";
	        }
	    }
	}

将nginx worker数量设置为2，并绑定到两个核上，是因为 

作为backend server的pod在同一台机器上，并分配了两个核，因此将nginx worker数量设置为2，并绑定到两个核上，这样可以大量减少与pod竞争CPU的情况。

upstream中keepalive设置为16，是因为测试中发现16个并发的时候，2个CPU核已经耗尽。

[Core functionality](https://nginx.org/en/docs/ngx_core_module.html)

[Module ngx_http_proxy_module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

[Module ngx_http_upstream_module](https://nginx.org/en/docs/http/ngx_http_upstream_module.html)

[Enable Keepalive connections in Nginx Upstream proxy configurations](https://ma.ttias.be/enable-keepalive-connections-in-nginx-upstream-proxy-configurations/)

[TCP keepalive overview](http://tldp.org/HOWTO/TCP-Keepalive-HOWTO/overview.html)

## 初始测试

在没有做任何调整的、都使用默认配置的情况下，测试一下结果。

第一次测试时使用应用是[echo-all-in-one](https://github.com/introclass/kubernetes-yamls/blob/master/all-in-one/echo-all-in-one.yaml)，直接对Pod进行测试，存在连接被reset的情况，后来发现
echo应用中用到了nginx，而ngxin默认keepalive连接中的请求数上限是1024，见[keepalive_requests](https://www.lijiaocn.com/%E6%96%B9%E6%B3%95/2018/11/02/webserver-benchmark-method.html#%E9%81%87%E5%88%B0%E7%9A%84%E9%97%AE%E9%A2%98)。

后来换用应用[webshell-all-in-one](https://github.com/introclass/kubernetes-yamls/blob/master/all-in-one/webshell-all-in-one.yaml)，使用它的/ping接口，这个url直接返回一个ok。

### 极限带宽

请求目标应用的/ping，抓包发现：

	10.10.173.203 -> 10.10.64.58 请求包的TCP负载数据长度为81
	10.10.173.203 <- 10.10.64.58 回应包的TCP负载数据长度为181

下面通过限制`iperf发送端`的写入字节长度(`-l`)、最大分片长度(`-M`)、TCP窗口大小(`-w`)的方式，模拟请求过程。

#### 请求极限速率

测试一下从10.10.173.203向10.10.64.58发送TCP负载数据长度为81字节的报文时的速率。

在10.10.64.58上启动iperf server：

```bash
[root@10.10.64.58 conf.d]# iperf -s
------------------------------------------------------------
Server listening on TCP port 5001
TCP window size: 85.3 KByte (default)
------------------------------------------------------------
```

在10.10.173.203上启动iperf client：

```bash
[root@10.10.173.203 admin]# iperf -c 10.10.64.58 -l 81 -M 81 -w 81   -N
WARNING: TCP window size set to 81 bytes. A small window size
will give poor performance. See the Iperf documentation.
WARNING: attempt to set TCP maxmimum segment size to 81 failed.
Setting the MSS may not be implemented on this OS.
------------------------------------------------------------
Client connecting to 10.10.64.58, TCP port 5001
TCP window size: 4.50 KByte (WARNING: requested 81.0 Byte)
------------------------------------------------------------
[  3] local 10.10.173.203 port 19664 connected with 10.10.64.58 port 5001
[ ID] Interval       Transfer     Bandwidth
[  3]  0.0-10.0 sec  7.06 MBytes  5.92 Mbits/sec
```

可以看到单包发送81字节TCP数据，一去一回（服务端立即回应ack）的情况下，极限速度是5.92Mbits/sec。

#### 响应的极限速率

将请求端和发送端对调，并将相应size设置为181，测试结果如下：

```bash
[root@10.10.64.58 conf.d]# iperf -c 10.10.173.203 -l 181 -M 181 -w 181  -N
WARNING: TCP window size set to 181 bytes. A small window size
will give poor performance. See the Iperf documentation.
WARNING: attempt to set TCP maximum segment size to 181, but got 536
------------------------------------------------------------
Client connecting to 10.10.173.203, TCP port 5001
TCP window size: 4.50 KByte (WARNING: requested  181 Byte)
------------------------------------------------------------
[  3] local 10.10.64.58 port 12904 connected with 10.10.173.203 port 5001
[ ID] Interval       Transfer     Bandwidth
[  3]  0.0-10.0 sec  16.7 MBytes  14.0 Mbits/sec
```

可以看到单包发送181字节TCP数据，一去一回（服务端立即回应ack）的情况下，极限速度是14.0Mbits/sec。

## 直接访问nginx

修改nginx的默认index.html的内容，只返回两个字母“ok”：

	echo "ok" >  /usr/share/nginx/html/index.html

单个长连接时：

```bash
[root@10.10.173.203 admin]# siege -c 1 -b -t 1M -H "Host: webshell.com"  10.10.64.58:80
** SIEGE 4.0.2
** Preparing 1 concurrent users for battle.
The server is now under siege...
Lifting the server siege...
Transactions:		      145426 hits
Availability:		      100.00 %
Elapsed time:		       59.09 secs
Data transferred:	        0.42 MB
Response time:		        0.00 secs
Transaction rate:	     2461.09 trans/sec
Throughput:		        0.01 MB/sec
Concurrency:		        0.95
Successful transactions:      145426
Failed transactions:	           0
Longest transaction:	        0.01
Shortest transaction:	        0.00
```

	并发（个）     1     2      4      8     10     12     14     16      18     32
	吞吐（每秒)    2.4k  4.7k   8.4k   13k   14.7k  15.6k  15.5k  15.9k   15.6k  16.6k

16并发的时候，两个nginx worker的CPU使用率基本保持在90%以上。

## 直接访问Pod

Pod的CPU上限设置为2。

使用单个连接不间断发起请求：

```bash
[root@10.10.173.203 admin]# siege -c 1 -b -t 1M -H "Host: webshell.com"  172.16.129.17/ping
** SIEGE 4.0.2
** Preparing 1 concurrent users for battle.
The server is now under siege...
Lifting the server siege...
Transactions:		      139321 hits
Availability:		      100.00 %
Elapsed time:		       59.79 secs
Data transferred:	        0.40 MB
Response time:		        0.00 secs
Transaction rate:	     2330.17 trans/sec
Throughput:		        0.01 MB/sec
Concurrency:		        0.95
Successful transactions:      139321
Failed transactions:	           0
Longest transaction:	        0.01
Shortest transaction:	        0.00
```

	并发（个）     1      2      4      8      10     12     14     16      18     32
	吞吐（每秒)    2.3k   4.4k   7.8k   11.6k  11.8k  12k    12.3k  12.5k   12.4k  12.4k

在10个并发的时候，CPU开始稳定在200%，Pod的处理能力比nginx低，下面的对比以直接访问Pod的数据为基准。

## 通过Nginx访问Pod

单个长连接时，从2.3K下降到1.6K，减少30%：

```bash
[root@10.10.173.203 admin]# siege -c 1 -b -t 1M -H "Host: webshell.com"  10.10.64.58:7000/ping
** SIEGE 4.0.2
** Preparing 1 concurrent users for battle.
The server is now under siege...
Lifting the server siege...
Transactions:		       96596 hits
Availability:		      100.00 %
Elapsed time:		       59.74 secs
Data transferred:	        0.28 MB
Response time:		        0.00 secs
Transaction rate:	     1616.94 trans/sec
Throughput:		        0.00 MB/sec
Concurrency:		        0.97
Successful transactions:       96596
Failed transactions:	           0
Longest transaction:	        0.02
Shortest transaction:	        0.00
```

16并发时，从12.5K下降到11.9K，基本持平：

```bash
[root@10.10.173.203 admin]# siege -c 16 -b -t 1M -H "Host: webshell.com"  10.10.64.58:7000/ping
** SIEGE 4.0.2
** Preparing 16 concurrent users for battle.
The server is now under siege...
Lifting the server siege...
Transactions:		      708638 hits
Availability:		      100.00 %
Elapsed time:		       59.22 secs
Data transferred:	        2.03 MB
Response time:		        0.00 secs
Transaction rate:	    11966.19 trans/sec
Throughput:		        0.03 MB/sec
Concurrency:		       15.67
Successful transactions:      708638
Failed transactions:	           0
Longest transaction:	        0.03
Shortest transaction:	        0.00
```

## 通过Kong访问Pod

单个连接时，从2.3k下降到1.1k，减少52%，相比nginx多损耗20%：

```bash
[root@10.10.173.203 admin]# siege -c 1 -b -t 1M -H "Host: webshell.com"  10.10.64.58:8000/ping
** SIEGE 4.0.2
** Preparing 1 concurrent users for battle.
The server is now under siege...
Lifting the server siege...
Transactions:		       68226 hits
Availability:		      100.00 %
Elapsed time:		       59.68 secs
Data transferred:	        0.20 MB
Response time:		        0.00 secs
Transaction rate:	     1143.20 trans/sec
Throughput:		        0.00 MB/sec
Concurrency:		        0.97
Successful transactions:       68226
Failed transactions:	           0
Longest transaction:	        0.01
Shortest transaction:	        0.00
```

16并发时，从12.5K下降到不足6K，减少50%以上，相比nginx多损耗40%以上：

```bash
[root@10.10.173.203 ~]#  siege -c 16 -b -t 1M -H "Host: webshell.com"  10.10.64.58:8000/ping
** SIEGE 4.0.2
** Preparing 16 concurrent users for battle.
The server is now under siege...
Lifting the server siege...
Transactions:		      393297 hits
Availability:		      100.00 %
Elapsed time:		       59.94 secs
Data transferred:	        1.13 MB
Response time:		        0.00 secs
Transaction rate:	     6561.51 trans/sec
Throughput:		        0.02 MB/sec
Concurrency:		       15.85
Successful transactions:      393297
Failed transactions:	           0
Longest transaction:	        0.03
Shortest transaction:	        0.00
```

## 16并发时，通过kong访问相比通过nginx访问性能大幅下降原因分析

1个长连接的时候，通过nginx转发给pod，性能下降接近30%，将并发升高到16以后，性能持平。

1个长连接的时候，通过kong转发给pod，性能下降接近50%，将并发升高到16以后，还是下降50%。

通过nginx代理时产生的损耗，可以通过提高并发消除，nginx多使用两个cpu，综合性能可以追上直连pod。

通过kong代理时，多使用两个cpu，综合性能只有直连pod的50%，如果为kong分配4个CPU或许可以追上直连pod。

测试了在不同并发数下的情况：

	并发（个）         1      2      4      8       10      12     14     16      18     32      50
	直连Pod（每秒)     2.3k   4.4k   7.8k   11.6k   11.8k   12k    12.3k  12.5k   12.4k  12.4k   12.7
	通过Nginx（每秒）  1.6k   3k     5.3k   8.4k    9.4k    10.5k  10.9k  11.9k   12k    12.8k   13.5k
	通过Kong（每秒)    1.2k   2.4k   4.2k   6.3k    6.5k    6.6k   6.7k   6.6k    6.6k   6.9k    7.1k

测试过程中同时观测CPU，发现下面的情况：

通过Nginx访问时，16并发的时候，Pod中的进程CPU占用率最高停留在180%，没有达到200%，两个nginx worker合计CPU使用合计140%。

通过Kong访问时，10并发的时候，Pod中进程CPU使用率最高停留在100%，只耗用了一个核，而两个OpenResty进程CPU使用合计就超过180%，CPU已经成为瓶颈。

由此可见kong对CPU的耗费是相当大的，远超过nginx，但这是可以理解的，毕竟kong是nginx的超集，是构建在nginx之上的，耗费当然要比nginx高。将Kong与其它实现了同样功能的API网关才是合理的。

但是Kong与Nginx对比的结果也告诉我们：直接用Kong替代Nginx是要付出很高的代价的，仅仅使用kong的代理转发功能，还没有使用任何插件，就要多耗费一倍的资源。

>以上测试使用的nginx版本是`nginx-1.12.2`，运行kong的OpenResty版本是`openresty-1.13.6.2`，后来直接在OpenResty中配置了转发代理，测试通过OpenResty代理访问的情况，通过nginx代理访问的效果基本相同，OpenResty进程的CPU使用率远未饱和。

## Kong的性能瓶颈分析方法

抓一下[火焰图][3]，看看主要在哪里耗费CPU了：

	./stapxx/samples/lj-lua-stacks.sxx  --arg depth=100 --arg detailed=100 --arg time=20  --skip-badvars -x 16809 >resty.bt
	./FlameGraph/stackcollapse-stap.pl resty.bt  >resty.cbt
	./FlameGraph/flamegraph.pl resty.cbt > resty.svg

可以将火焰图和用[perf stop](https://www.lijiaocn.com/linux/chapter1/03-cpu-2.html#%E7%94%A8perf%E5%88%86%E6%9E%90cpu%E4%BD%BF%E7%94%A8%E7%8E%87%E9%AB%98)看到的结果对应。

[sample-bt](https://github.com/openresty/openresty-systemtap-toolkit#sample-bt)可以抓取用户态和内核态的调用栈：

	./stapxx/samples/sample-bt.sxx --arg time=20 --skip-badvars -D  MAXSKIPPED=100000 -x 17816 >resty.bt
	./FlameGraph/stackcollapse-stap.pl resty.bt  >resty.cbt
	./FlameGraph/flamegraph.pl resty.cbt > resty.svg

直接运行可能会遇到[WARNING: Missing unwind data for a module，rerun with XXX](https://www.lijiaocn.com/2018/12/06/nginx-systemtap-toolkit-usage-md.html#warning-missing-unwind-data-for-a-modulererun-with-xxx)的问题，链接中给出了解决方法。

将Kong的火焰图与Nginx的火焰图对比，可以发现多出的开销。

## 参考

1. [API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法][1]
2. [API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法: 用siege进行测试][2]
3. [Web开发平台OpenResty（三）：火焰图性能分析][3]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/08/kong-features-06-production-and-benchmark.html  "API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法"
[2]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/08/kong-features-06-production-and-benchmark.html#%E7%94%A8siege%E8%BF%9B%E8%A1%8C%E6%B5%8B%E8%AF%95 "API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法"
[3]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2018/11/02/openresty-study-03-frame-md.html#%E9%87%87%E9%9B%86%E5%8E%8B%E6%B5%8B%E6%95%B0%E6%8D%AE  "Web开发平台OpenResty（三）：火焰图性能分析"
