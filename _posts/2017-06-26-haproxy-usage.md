---
layout: default
title: haproxy的基本使用与常见实践
author: lijiaocn
createdate: 2017/06/26 10:40:02
changedate: 2018/01/04 10:47:10
categories: 技巧
tags: haproxy
keywords:  haproxy,lb 
description:  负载均衡器haproxy的使用与常见的一些实践

---

* auto-gen TOC:
{:toc}

## 启动

[haproxy management guide][10]中详细说明了如何运行haproxy。

## 配置文件格式

haproxy的配置文件由四部分组成：

	global
	defaults
	listen
	frontend
	backend

global和defaults中配置的是haproxy的参数，其中global做的是全局设置，defaults中设置的是proxy参数，会被下一个defaults中的同名设置覆盖。

frontend和backend分别配置监听地址和后端地址，listen中同时配置了监听地址和后端地址，相当于frontend和backend的融合。

haproxy的全局配置参数很多：[Global parameters][22]

haproxy的[Proxy keywords matrix][23]

### example1

	global
	    daemon
	    maxconn 256
	
	defaults
	    mode http
	    timeout connect 5000ms
	    timeout client 50000ms
	    timeout server 50000ms
	
	frontend http-in
	    bind *:80
	    default_backend servers
	
	backend servers
	    server server1 127.0.0.1:8000 maxconn 32

### example2

	global
	    daemon
	    maxconn 256
	
	defaults
	    mode http
	    timeout connect 5000ms
	    timeout client 50000ms
	    timeout server 50000ms
	
	listen http-in
	    bind *:80
	    server server1 127.0.0.1:8000 maxconn 32



## socket命令

需要在配置文件中，启动指定socket，[unix socket cmds][9]中介绍了如何使用。

	global
	    ...
	    stats socket /var/lib/haproxy/stats
	    stats timeout 2m
	    ...

然后可以通过向socket发送指令，例如：

	echo "show info;show stat;show table" | socat /var/lib/haproxy/stats stdio

也可以以交互的方式，下面的`prompt`是输入的命令：

	socat /var/lib/haproxy/stats readline
	   prompt
	   > show info
	   ...
	   >

`help`可以查看所有可以使用的命令：

	> help
	Unknown command. Please enter one of the following commands only :
	  help           : this message
	  prompt         : toggle interactive mode with prompt
	  quit           : disconnect
	  disable agent  : disable agent checks (use 'set server' instead)
	  disable health : disable health checks (use 'set server' instead)
	  disable server : disable a server for maintenance (use 'set server' instead)
	  enable agent   : enable agent checks (use 'set server' instead)
	  enable health  : enable health checks (use 'set server' instead)
	  enable server  : enable a disabled server (use 'set server' instead)
	  set maxconn server : change a server's maxconn setting
	  set server     : change a server's state, weight or address
	  get weight     : report a server's current weight
	  set weight     : change a server's weight (deprecated)
	  disable frontend : temporarily disable specific frontend
	  enable frontend : re-enable specific frontend
	  set maxconn frontend : change a frontend's maxconn setting
	  show servers state [id]: dump volatile server information (for backend <id>)
	  show backend   : list backends in the current running config
	  shutdown frontend : stop a specific frontend
	  clear table    : remove an entry from a table
	  set table [id] : update or create a table entry's data
	  show table [id]: report table usage stats or dump this table's contents
	  show errors    : report last request and response errors for each proxy
	  clear counters : clear max statistics counters (add 'all' for all counters)
	  show info      : report information about the running process
	  show stat      : report counters for each proxy and server
	  show sess [id] : report the list of current sessions or dump this session
	  shutdown session : kill a specific session
	  shutdown sessions server : kill sessions on a server
	  show pools     : report information about the memory pools usage
	  add acl        : add acl entry
	  clear acl <id> : clear the content of this acl
	  del acl        : delete acl entry
	  get acl        : report the patterns matching a sample for an ACL
	  show acl [id]  : report available acls or dump an acl's contents
	  add map        : add map entry
	  clear map <id> : clear the content of this map
	  del map        : delete map entry
	  get map        : report the keys and values matching a sample for a map
	  set map        : modify map entry
	  show map [id]  : report available maps or dump a map's contents
	  show stat resolvers [id]: dumps counters from all resolvers section and
	                          associated name servers
	  set maxconn global : change the per-process maxconn setting
	  set rate-limit : change a rate limiting value
	  set timeout    : change a timeout setting
	  show env [var] : dump environment variables known to the process
	  show tls-keys [id|*]: show tls keys references or dump tls ticket keys when id specified

## 统计查询

统计信息有两种查询方式，一种是直接用socket命令查询:

	  show info      : report information about the running process
	  show stat      : report counters for each proxy and server
	  show sess [id] : report the list of current sessions or dump this session

另一种是通过访问特定的url获取。

[haproxy proxy keywords][8]中以`stats`开头的配置项，都是统计相关的配置。

可以在defaults、frontend、listen和backend中分别设置不同的url和报表访问。

配置一个可以看到所有统计数据的url:

	listen stats
	    bind *:8889
	    mode http
	    stats enable
	    stats uri  /admin?stats           # 通过8889端口访问，可以看到所有的统计数据
	    stats realm   Haproxy\ Statistics
	    stats auth    admin:admin

分别在frontend和backend中配置只能看到frontend和backend的统计数据的url:

	frontend lb1
	    bind *:5000
	    default_backend  lb1
	    stats enable
	    stats hide-version
	    stats scope   .                   # 只能看到frontend lb1的统计信息
	    stats uri     /lb1/f?stats        # 通过:5000/lb1/f?stats访问
	    stats realm   LB1\ frontend\ Statistics
	    stats auth    lb1:lb1
	
	backend lb1
	    balance roundrobin
	    server  lb1-1 192.168.136.220:80 check
	    server  lb1-2 192.168.7.208:80 check
	    stats enable
	    stats hide-version
	    stats scope   .                   # 只能看到backend lb1的统计信息
	    stats uri     /lb1/b?stats
	    stats realm   LB1\ backend\ Statistics
	    stats auth    lb1:lb1

在listen中配置url，同时查看frontend和backend的统计数据:

	listen lb2
	    bind *:5001
	    balance roundrobin
	    server  lb2-1 192.168.136.220:80 check
	    server  lb2-2 192.168.7.208:80 check
	    stats enable
	    stats hide-version
	    stats scope   .
	    stats uri     /lb2?stats
	    stats realm   LB2\ frontend\ Statistics
	    stats auth    lb2:lb2

## 重新加载

	haproxy -D -p /var/run/haproxy.pid -f ./haproxy.cfg -sf `cat /var/run/haproxy.pid`

haproxy在启动时候可以用`-sf`和`-st`指定一组进程号：

	-sf:  新启动的haproxy将向指定的进程发送SIGUSR1信号，目标haproxy graceful stop
	-st:  新启动的haproxy将向指定的进程发送SIGTERM信号，目标haproxy直接退出

### 加载过程

[stopping and restarting haproxy][15]详细介绍了haproxy的启动过程：

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

### Zero Downtime Reloads

上面提到的，在reload期间禁止SYN报文的做法，会导致客户端的访问延迟增加。因为RFC6298中规定SYN报文的c超时时间是1秒。而且不同的client可能设置了不同的重试时间。

yelp在这方面做过一些工作，可以在低延迟情况下做到Zero Downtime：[True Zero Downtime HAProxy Reloads][17]，[Taking Zero-Downtime Load Balancing even Further][16]。

基本原理就是将haproxy reload期间的SYN报文暂存在`plug`类型的qdisc中，reload完成后再放行SYN报文。

## 超时配置

haproxy1.7中有11个以`timeout`开头的[配置][11]。[连接haproxy间歇性失败的问题调查][12]中分析了一个因为timeout设置不合理导致的现象。

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


## https证书

在bind后面可以用crt命令指定证书：

	frontend LB
	    mode http
	    option forwardfor       except 127.0.0.0/8
	    errorfile 503 /etc/haproxy/errors/503.http
	    bind 10.39.0.140:443 ssl crt /etc/sslkeys/default.pem crt /etc/sslkeys/lijiao.pem
	    acl lijiaob-space-nginx-nginx-0 hdr(host) -i  test.lijiaocn.com server1.ca.lijiaocn
	    use_backend lijiaob-space-nginx-nginx-0 if lijiaob-space-nginx-nginx-0 { ssl_fc_sni test.lijiaocn.com server1.ca.lijiaocn }

每个pem文件是一对证书的证书文件和key文件，例如:

	-----BEGIN CERTIFICATE-----
	MIIHYjCCBUqgAwIBAgICEAIwDQYJKoZIhvcNAQELBQAwgYQxCzAJBgNVBAYTAkNO
	MRAwDgYDVQQIDAdCZWlKaW5nMREwDwYDVQQKDAhsaWppYW9jbjERMA8GA1UECwwI
	QWhraNeeufoP0u/0H2sJCAweKkaQeKIyt3RPnw9r5U1obadhQa0cP16jLSpY7iK4
	...(省略)...
	d4F0kKt/7D/h6VZOYQmoTbfLCy114A==
	-----END CERTIFICATE-----
	-----BEGIN RSA PRIVATE KEY-----
	MIIJKwIBAAKCAgEAtfAWQqsYZ/M9xAJQhWNhofiincF1F204FGmGsHaeq7OzcBfY
	Zhi5L1tXPvMHXYSJgIN6dwN51FIejL6uLCRMKGba/1vxZYcarQPPL1TecmerZxF3
	...(省略)...
	b7RrvbvS+8xUnlXQFjAcZWTG7dGZ1JnxJkzNCAo3EOBNioLR51tg2fY8h7WzDbIn
	yH1UaA/vCx7kqKDp5U1vmWwPMF0614NK3cnbAZbwu87eqVnSv0hvxC5prTzB13s=
	-----END RSA PRIVATE KEY-----

指定多个证书的时候，每个证书会有不同的CommonName，haproxy会根据请求头的host，选择对应的证书。

如果没有和host匹配的证书，使用第一个证书。


## 会话保持

会话保持，也叫做粘滞会话(Sticky Sessions)。

如果业务没有做session同步，需要将同一个用户的多个请求转发给同一个backend server。

### backend source

`backend source`根据源IP选取backend server，来自同一个IP的请求将被转发到同一个backend server。

适用于TCP和HTTP。

### backend rdp-cookie

[RDP Cookies][14]中特别细致的介绍了rdp-cookie。

rdp-cookie是rdp client在设置的cookie，分为`User Cookies(mstshash)`和`IP Cookies(msts)`两种。

User Cookie 格式:

	Cookie:[space]mstshash=[ANSI string][0x0d0a]

IP Cookie 格式:

	Cookie:[space]msts=[ip address].[port].[reserved][0x0d0a]

backend rdp-cookie依据rdb-cookie选择backend server，从而做到会话保持。

这种方式只适用于rdp协议。

### backend url_param

haproxy可以获取http协议中的url参数，根据url参数选择backend server。

如果设置了`check_post`，在url中没有找到指定参数的时候，会到body中继续查找。

如果url中带有用户或者session的ID，就可以用这种方式做到会话保持:

	balance url_param userid
	balance url_param session_id check_post 64

userid和session_id是url中的参数名称，需要根据实际情况修改。

### cookie-based persistence

haproxy依据cookie选择backend server，cookie的设置方式有很多种。

cookie命令可以用于`defaults`、`listen`、`backend`。

	cookie <name> [ rewrite | insert | prefix ] [ indirect ] [ nocache ] 
	              [ postonly ] [ preserve ] [ httponly ] [ secure ] 
	              [ domain <domain> ]* [ maxidle <idle> ] [ maxlife <life> ]

更多cookies设置方法，可以参考: [haproxy cookies][18]。

#### prefix模式
 
prefix模式中，haproxy修改server已经设置的同名cookie，给cookie的value添加一个前缀，如下：

	backend webshell-lijiaob-space-80
	    cookie test prefix
	    server webshell-3996411472-yyioz 192.168.170.120:80 cookie abc  check maxconn 500

访问`webshell-lijiaob-space.xotest.enncloud.cn/cookie?v=test&n=test`的时候，
server会设置名为test的cookie，value也是test，但是client端得到的cookie却是:

	test:abc~test    

`abc~`就是增加的前缀。

当haproxy将带有cookie的请求转发给backend server的时候，又回去掉添加的前缀。

当client端不支持多个cookie的时候，可以考虑使用prefix模式。

#### insert模式

insert模式中，haproxy会在backend server的回应中添加cookie设置。

`preserve`选项： 

	如果没有使用`preserve`选项，backend server的回应中设置的同名的cookie会被删除。

`indirect`选项：

	如果没有使用`indirect`选项，haproxy添加的cookie会被转到backend server。

`nocache`选项：

	将被haproxy插入了cookie的响应，设置为non-cacheable，防止cookie被缓存。

`postonly`选项：

	只在post请求的响应中插入cookie，相比nocache可以更充分地利用cache。

看一下，做下面的设置的时候，结果会怎样。

	backend webshell-lijiaob-space-80
	    cookie test-insert insert indirect postonly
	    server webshell-3996411472-uzsvz 192.168.116.141:80 cookie abc check maxconn 500

在client端发送了post请求后，发现设置了名为test-insert的cookie：

	test-insert:
	    value: abc
	    path:  /

在服务端则看不到这个cookie。

如果cookie对应的backend server已经不存在或者宕机，使用roundrobin的方式处理。

### appsession 

haproxy1.6中删除了appsession，推荐使用stick-tables

	appsession <cookie> len <length> timeout <holdtime> 
	           [request-learn] [prefix] [mode <path-parameters|query-string>]

appsession根据指定的cookie，判断session stickiness:

	Define session stickiness on an existing application cookie.

### stick系列指令

stick-table相关的配置命令比较多:

	stick-table             :创建stick表
	stick store-request
	stick store-response
	stick match             :查stick表
	stick on

#### stick-tables

`stick-tables`指令用来创建后续指令会用到的stick表。

	stick-table type {ip | integer | string [len <length>] | binary [len <length>]} 
	            size <size> [expire <expire>] [nopurge] [peers <peersect>] 
	            [store <data_type>]*

#### stick store-request/store-response

`stick store-request`和`stick store-response`在指定的stick表中插入记录。

	stick store-request <pattern> [table <table>] [{if | unless} <condition>]
	stick store-response <pattern> [table <table>] [{if | unless} <condition>]

`pattern`是haproxy的ACL中使用的pattern，[haproxy pattern][19]中列出所有可用的pattern。

这两条指令分别将request和reponse中的特定pattern写入到指定的table表中。

每个请求或者每个响应最多可以记录8个pattern。

`if|unless`是条件判断。

#### stick match

指定要查询的stick表，如果在stick中查找到了记录，那么就转发到写入记录时使用的backend server。

	stick match <pattern> [table <table>] [{if | unless} <cond>]

table指定的可以是其它配置组(section)中的table。

#### stick on

`stick on`是`stick match`和`stick store-request`组合命令的简写。

	stick on <pattern> [table <table>] [{if | unless} <condition>]

例如命令：

	stick on src table pop if !localhost

等同于：

	stick match src table pop if !localhost
	stick store-request src table pop if !localhost

## fetching samples

haproxy支持从请求、响应、客户端、服务端以及环境变量中截取数据。通常和acl配合使用。

haproxy可以以下几个地方截取数据，[haproxy fetching samples][21]:

	internal states   : 状态数据
	layer4            : 传输层数据，IP、端口、连接状态等
	layer5            : 会话层数据，主要是ssl相关的信息
	layer6            : 转发的数据
	layer7            : HTTP协议数据

## ACLs 

`acl`指令用于创建规则，指示在什么条件下，执行什么操作。

	acl <aclname> <criterion> [flags] [operator] [<value>] ...

也可以与其它指令配合使用:

	use_backend <backend> [{if | unless} <condition>]

`use_backend`指令中的condition就是acl的组合。

acl可用的flags:

	-i : ignore case during matching of all subsequent patterns.
	-f : load patterns from a file.
	-m : use a specific pattern matching method
	-n : forbid the DNS resolutions
	-M : load the file pointed by -f like a map file.
	-u : force the unique id of the ACL
	-- : force end of flags. Useful when a string looks like one of the flags.

其中`-m`可以指定的pattern matching method有：

	found :
	bool  :
	int   :
	ip    :
	bin   :  二进制匹配
	len   :  长度匹配
	str   :  字符串匹配
	sub   :  字串匹配
	reg   :  正则匹配
	beg   :  前缀匹配
	end   :  后缀匹配
	dir   :  子目录匹配
	dom   :  域名匹配

例如:

	acl jsess_present cook(JSESSIONID) -m found          //如果包含cookie
	acl script_tag payload(0,500) -m reg -i <script>     //忽略大小写正则匹配
	acl script_tag payload(0,500),lower -m reg <script>  //先转换成小写，然后正则匹配

## 参考

1. [haproxy site][1]
2. [haproxy doc 1.7][2]
3. [haproxy introduction][3]
4. [haproxy config][4]
5. [haproxy-metrics1][5]
6. [haproxy-metrics2][6]
7. [haproxy with datadog][7]
8. [haproxy proxy keywords][8]
9. [unix socket cmds][9]
10. [haproxy management guide][10]
11. [haproxy keywords matrix][11]
12. [连接haproxy间歇性失败的问题调查][12]
13. [Haproxy的三种保持客户端会话保持方式][13]
14. [RDP Cookies][14]
15. [stopping and restarting haproxy][15]
16. [Taking Zero-Downtime Load Balancing even Further][16]
17. [True Zero Downtime HAProxy Reloads][17]
18. [haproxy cookies][18]
19. [haproxy pattern][19]
20. [haproxy acls][20]
21. [haproxy fetching samples][21]
22. [Global parameters][22]
23. [haproxy: Proxy keywords matrix][23]

[1]: http://www.haproxy.org/  "haproxy site" 
[2]: http://www.haproxy.org/#doc1.7 "haproxy doc v1.7"
[3]: http://cbonte.github.io/haproxy-dconv/1.7/intro.html#1 "haproxy introduction"
[4]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html "haproxy config"
[5]: https://www.datadoghq.com/blog/monitoring-haproxy-performance-metrics/ "haproxy-metrics-1"
[6]: https://www.datadoghq.com/blog/how-to-collect-haproxy-metrics/  "haproxy-metrics-2"
[7]: https://www.datadoghq.com/blog/monitor-haproxy-with-datadog/ "haproxy with datadog"
[8]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#4.1 "haproxy proxy keywords"
[9]: http://cbonte.github.io/haproxy-dconv/1.7/management.html#9.3 "unix socket cmds"
[10]: http://cbonte.github.io/haproxy-dconv/1.7/management.html
[11]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#4.1 "haproxy proxy keywords matrix"
[12]: http://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2017/09/04/haproxy-cannt-connect.html "连接haproxy间歇性失败的问题调查"
[13]: http://jinyudong.blog.51cto.com/10990408/1910320  "Haproxy的三种保持客户端会话保持方式"
[14]: http://www.jasonfilley.com/rdpcookies.html "RDP Cookies"
[15]: http://cbonte.github.io/haproxy-dconv/1.7/management.html#4 "stopping and restarting haproxy"
[16]: https://engineeringblog.yelp.com/2017/05/taking-zero-downtime-load-balancing-even-further.html  "Taking Zero-Downtime Load Balancing even Further"
[17]: https://engineeringblog.yelp.com/2015/04/true-zero-downtime-haproxy-reloads.html "True Zero Downtime HAProxy Reloads"
[18]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#4-cookie  "haproxy cookies"
[19]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#7.3  "haproxy pattern"
[20]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#7 "haproxy acls"
[21]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#7.3  "haproxy fetching samples"
[22]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#3 "haproxy: Global parameters"
[23]: http://cbonte.github.io/haproxy-dconv/1.7/configuration.html#4.1 "haproxy: Proxy keywords matrix"
