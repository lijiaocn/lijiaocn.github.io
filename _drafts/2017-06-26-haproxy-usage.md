---
layout: default
title: HAProxy的使用
author: lijiaocn
createdate: 2017/06/26 10:40:02
changedate: 2017/09/04 15:36:46
categories: 项目
tags: lb
keywords:  haproxy,lb 
description:  负载均衡器haproxy的使用

---

* auto-gen TOC:
{:toc}

## 启动

[haproxy management guide][10]中详细说明了如何运行haproxy。

## haproxy的时间配置

haproxy

## 重新加载配置

	haproxy -D -p /var/run/haproxy.pid -f ./haproxy.cfg -sf `cat /var/run/haproxy.pid`

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

## 配置https证书

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

## 开启统计

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
