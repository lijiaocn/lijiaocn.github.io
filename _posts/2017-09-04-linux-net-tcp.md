---
layout: default
title: linux的tcp连接
author: 李佶澳
createdate: 2017/09/04 19:24:20
changedate: 2017/09/16 15:58:23
categories: 技巧
tags: linux
keywords: tcp,linux,timeout,tcp连接状态
description: 了解tcp的状态以及每个状态的超时时间，对排查问题和提高Server性能非常有用。

---

* auto-gen TOC:
{:toc}

## 说明 

了解tcp的状态以及每个状态的超时时间，对排查问题和提高Server性能非常有用。

## 准备

虽然Google、百度等可以提供很多信息，但是绝大多数都是碎片化，碎片化的知识是有害的。

因此首要任务就是借助Google、百度等找到权威并且系统的资料。

第一份资料是tcp的rfc文档，它对tcp协议、连接状态做了最系统、最权威的介绍：[transmission control protocol][1]。

第二份资料是[linux kernel documention][2]，了解了tcp的原理，要进行参数调整的时候，需要参考这份文档。

另外还会用到一个工具：`netstat`。

## rfc-793

rfc-793中的内容分为三部分：介绍，设计理念(philosophy)、功能说明(functional specification)。

重点是第三部分，第三部分的目录如下：

	3.1  Header Format ................................................ 15
	  3.2  Terminology .................................................. 19
	  3.3  Sequence Numbers ............................................. 24
	  3.4  Establishing a connection .................................... 30
	  3.5  Closing a Connection ......................................... 37
	  3.6  Precedence and Security ...................................... 40
	  3.7  Data Communication ........................................... 40
	  3.8  Interfaces ................................................... 44
	  3.9  Event Processing ............................................. 52

另外，当前(2017-09-05 10:40:22)有四个rfc文档对tcp进行了更新补充，这四个rfc又被其它多个rfc更新补充：

	Obsoletes RFC 761, Updated by RFC 1122, RFC 3168, RFC 6093, RFC 6528, Errata

这里不对rfc做太多研究，只大概了解TCP的关键细节。

### 连接状态

一个tcp连接总共有11个状态：

	//连接建立过程有四个状态
	LISTEN           :服务端等待远端的连接
	SYN-SENT         :客户端已经发送SYN，等待对方的确认
	SYN-RECEIVED     :服务端接收到SYN，并回应ACK，并发送回应SYN
	ESTABLISHED      :客户端收到SYN的ACK和回应SYN并发出了ACK，服务端收到回应SYN的ACK
	
	//连接端口过程有7个状态
	FIN-WAIT-1       :主动端连接关闭，发送FIN
	CLOSE-WAIT       :被动端收到FIN，回应了ACK，等待本地连接关闭
	FIN-WAIT-2       :主动端收到了FIN的ACK，等待被动端的连接关闭
	CLOSING          :被动端连接关闭，回应FIN
	LAST-ACK         :被动端等待主动端回应FIN的ACK
	TIME-WAIT        :主动端收到被动端的FIN，回应ACK，等待2MSL
	CLOSED           :被动端收到FIN的ACK，主动端等待了2MSL，连接完全关闭

### TCP连接状态转换

	                              +---------+ ---------\      active OPEN  
	                              |  CLOSED |            \    -----------  
	                              +---------+<---------\   \   create TCB  
	                                |     ^              \   \  snd SYN    
	                   passive OPEN |     |   CLOSE        \   \           
	                   ------------ |     | ----------       \   \         
	                    create TCB  |     | delete TCB         \   \       
	                                V     |                      \   \     
	                              +---------+            CLOSE    |    \   
	                              |  LISTEN |          ---------- |     |  
	                              +---------+          delete TCB |     |  
	                   rcv SYN      |     |     SEND              |     |  
	                  -----------   |     |    -------            |     V  
	 +---------+      snd SYN,ACK  /       \   snd SYN          +---------+
	 |         |<-----------------           ------------------>|         |
	 |   SYN   |                    rcv SYN                     |   SYN   |
	 |   RCVD  |<-----------------------------------------------|   SENT  |
	 |         |                    snd ACK                     |         |
	 |         |------------------           -------------------|         |
	 +---------+   rcv ACK of SYN  \       /  rcv SYN,ACK       +---------+
	   |           --------------   |     |   -----------                  
	   |                  x         |     |     snd ACK                    
	   |                            V     V                                
	   |  CLOSE                   +---------+                              
	   | -------                  |  ESTAB  |                              
	   | snd FIN                  +---------+                              
	   |                   CLOSE    |     |    rcv FIN                     
	   V                  -------   |     |    -------                     
	 +---------+          snd FIN  /       \   snd ACK          +---------+
	 |  FIN    |<-----------------           ------------------>|  CLOSE  |
	 | WAIT-1  |------------------                              |   WAIT  |
	 +---------+          rcv FIN  \                            +---------+
	   | rcv ACK of FIN   -------   |                            CLOSE  |  
	   | --------------   snd ACK   |                           ------- |  
	   V        x                   V                           snd FIN V  
	 +---------+                  +---------+                   +---------+
	 |FINWAIT-2|                  | CLOSING |                   | LAST-ACK|
	 +---------+                  +---------+                   +---------+
	   |                rcv ACK of FIN |                 rcv ACK of FIN |  
	   |  rcv FIN       -------------- |    Timeout=2MSL -------------- |  
	   |  -------              x       V    ------------        x       V  
	    \ snd ACK                 +---------+delete TCB         +---------+
	     ------------------------>|TIME WAIT|------------------>| CLOSED  |
	                              +---------+                   +---------+
	
	                      TCP Connection State Diagram
	                               Figure 6.

断开连接时，主动端在发出了最后一个ACK之后，不会再收到被动端发送过来的任何报文，它为什么还要继续等待`2MSL`的时间？

	这是之前面试的时候被问到的一个很有意义的问题。
	
	如果主动端发送了最后一个ACK之后，没有等待，而是立即释放了连接。会在下面的场景中出现问题:
	1. 被动端可能在收到主动端的ACK之前，认为自己发送的FIN报文没有送达，于是重新发送
	   注意这时候网络中有两个FIN
	2. 主动端回应ACK之后释放了连接，被动段收到最后一个ACK之后也释放连接，这时候连接完成释放
	3. 在网络中残余的第二个FIN报文被丢弃之前，主动端与被动端之间使用与上一个连接完全相同的端口重新建立连接，
	4. 这时候，网络中残存的FIN到达了主动端，就干扰了重新建立的连接
	
	主动端等待2MSL后，因为最后一个ACK送达到被动端需要1MSL，被动端重发的FIN报文被丢弃需要1MSL的时间，合计2MSL。

### TCP连接建立过程

#### A向B发起连接

	TCP A                                                TCP B
	
	  1.  CLOSED                                               LISTEN
	
	  2.  SYN-SENT    --> <SEQ=100><CTL=SYN>               --> SYN-RECEIVED
	
	  3.  ESTABLISHED <-- <SEQ=300><ACK=101><CTL=SYN,ACK>  <-- SYN-RECEIVED
	
	  4.  ESTABLISHED --> <SEQ=101><ACK=301><CTL=ACK>       --> ESTABLISHED
	
	  5.  ESTABLISHED --> <SEQ=101><ACK=301><CTL=ACK><DATA> --> ESTABLISHED
	
	          Basic 3-Way Handshake for Connection Synchronization

#### A和B同时向对方发起连接

	TCP A                                            TCP B
	
	  1.  CLOSED                                           CLOSED
	
	  2.  SYN-SENT     --> <SEQ=100><CTL=SYN>              ...
	
	  3.  SYN-RECEIVED <-- <SEQ=300><CTL=SYN>              <-- SYN-SENT
	
	  4.               ... <SEQ=100><CTL=SYN>              --> SYN-RECEIVED
	
	  5.  SYN-RECEIVED --> <SEQ=100><ACK=301><CTL=SYN,ACK> ...
	
	  6.  ESTABLISHED  <-- <SEQ=300><ACK=101><CTL=SYN,ACK> <-- SYN-RECEIVED
	
	  7.               ... <SEQ=101><ACK=301><CTL=ACK>     --> ESTABLISHED
	
	                Simultaneous Connection Synchronization

注意观察，双方同时发起连接时，是在各做各的三次握手，一个三次握手是A->B，另一个三次握手B->A。

#### A向B发起两次SYN，第一次SYN失效

A向B发起连接的时候，早先由A发送给B的一个过时的SYN先到达B（第3行）。

B以为是正常的TCP建立，按约定回应A（第4行）。

A收到B的回应后发现不对，向B发出RST（第5行）。

B进入重新等待连接的状态，直到收到正确的SYN（第6行）。

	 TCP A                                                TCP B
	
	  1.  CLOSED                                               LISTEN
	
	  2.  SYN-SENT    --> <SEQ=100><CTL=SYN>               ...
	
	  3.  (duplicate) ... <SEQ=90><CTL=SYN>               --> SYN-RECEIVED
	
	  4.  SYN-SENT    <-- <SEQ=300><ACK=91><CTL=SYN,ACK>  <-- SYN-RECEIVED
	
	  5.  SYN-SENT    --> <SEQ=91><CTL=RST>               --> LISTEN
	  
	
	  6.              ... <SEQ=100><CTL=SYN>               --> SYN-RECEIVED
	
	  7.  SYN-SENT    <-- <SEQ=400><ACK=101><CTL=SYN,ACK>  <-- SYN-RECEIVED
	
	  8.  ESTABLISHED --> <SEQ=101><ACK=401><CTL=ACK>      --> ESTABLISHED
	
	                    Recovery from Old Duplicate SYN

这里面还有一个问题，A发出的RST报文比正常的SYN报文晚到达B的时候，B会给A发出RST，双方清空，重新建立连接。

### 半连接的检测和恢复

半连接就是一端因为本地故障丢失了连接信息，而另一端的连接依然正常打开的。

这时候需要能够被检测到，恢复连接状态。

#### A端连接丢失，B端连接依然存在，A向B重新发起连接

A因为本地Crash丢失了连接，但B端的连接还是打开的，也就是处于半连接状态。

A恢复后尝试重新建立连接，而B还在按照自己的节奏发送数据，A发现后，发起RST。

	TCP A                                           TCP B
	
	  1.  (CRASH)                               (send 300,receive 100)
	
	  2.  CLOSED                                           ESTABLISHED
	
	  3.  SYN-SENT --> <SEQ=400><CTL=SYN>              --> (??)
	
	  4.  (!!)     <-- <SEQ=300><ACK=100><CTL=ACK>     <-- ESTABLISHED
	
	  5.  SYN-SENT --> <SEQ=100><CTL=RST>              --> (Abort!!)
	
	  6.  SYN-SENT                                         CLOSED
	
	  7.  SYN-SENT --> <SEQ=400><CTL=SYN>              -->
	
	                     Half-Open Connection Discovery

#### A端连接丢失，B端依然向A端发送数据

B端继续向A发送数据，A端没有对应连接存在，回应RST。

	TCP A                                              TCP B
	
	  1.  (CRASH)                                   (send 300,receive 100)
	
	  2.  (??)    <-- <SEQ=300><ACK=100><DATA=10><CTL=ACK> <-- ESTABLISHED
	
	  3.          --> <SEQ=100><CTL=RST>                   --> (ABORT!!)
	
	           Active Side Causes Half-Open Connection Discovery

### RST的规则

在前面的几个场景中都出现了RST，导致RST的情况不止这几种。

譬如，A端口很久前发出的SYN报文被B收到了，B给出了回应，但是A早已不是当初的状态，于是向B发出了RST。

	 TCP A                                         TCP B
	
	  1.  LISTEN                                        LISTEN
	
	  2.       ... <SEQ=Z><CTL=SYN>                -->  SYN-RECEIVED
	
	  3.  (??) <-- <SEQ=X><ACK=Z+1><CTL=SYN,ACK>   <--  SYN-RECEIVED
	
	  4.       --> <SEQ=Z+1><CTL=RST>              -->  (return to LISTEN!)
	
	  5.  LISTEN                                        LISTEN
	
	       Old Duplicate SYN Initiates a Reset on two Passive Sockets

rfc中明确规定了何时应当回应RST:

	As a general rule, reset (RST) must be sent whenever a segment arrives
	which apparently is not intended for the current connection.  A reset
	must not be sent if it is not clear that this is the case.

意思就是，当且只当连接的一端收到了一个明显不属于本连接的报文的时候，需要向对方发送RST。

RST的场景可以分为三类:

	1. 连接已经关闭（不存在），却依然有包发送过来
	2. 连接的一端处于LISTEN／SYN-SENT／SYN-RECEIVED状态，这时收到对方的ACK确认的却是
	   当前连接不曾发送过的数据（譬如，网络中过期残留报文导致的回应)
	3. If an incoming segment has a security level, or compartment, or
	   precedence which does not exactly match the level, and compartment,
	   and precedence requested for the connection,a reset is sent and
	   connection goes to the CLOSED state.  The reset takes its sequence
	   number from the ACK field of the incoming segment.

### TCP连接关闭过程

#### A主动关闭连接

	TCP A                                                TCP B
	
	  1.  ESTABLISHED                                          ESTABLISHED
	
	  2.  (Close)
	      FIN-WAIT-1  --> <SEQ=100><ACK=300><CTL=FIN,ACK>  --> CLOSE-WAIT
	
	  3.  FIN-WAIT-2  <-- <SEQ=300><ACK=101><CTL=ACK>      <-- CLOSE-WAIT
	
	  4.                                                       (Close)
	      TIME-WAIT   <-- <SEQ=300><ACK=101><CTL=FIN,ACK>  <-- LAST-ACK
	
	  5.  TIME-WAIT   --> <SEQ=101><ACK=301><CTL=ACK>      --> CLOSED
	
	  6.  (2 MSL)
	      CLOSED                                                      
	
	                         Normal Close Sequence

#### A和B同时关闭连接

	 TCP A                                                TCP B
	
	  1.  ESTABLISHED                                          ESTABLISHED
	
	  2.  (Close)                                              (Close)
	      FIN-WAIT-1  --> <SEQ=100><ACK=300><CTL=FIN,ACK>  ... FIN-WAIT-1
	                  <-- <SEQ=300><ACK=100><CTL=FIN,ACK>  <--
	                  ... <SEQ=100><ACK=300><CTL=FIN,ACK>  -->
	
	  3.  CLOSING     --> <SEQ=101><ACK=301><CTL=ACK>      ... CLOSING
	                  <-- <SEQ=301><ACK=101><CTL=ACK>      <--
	                  ... <SEQ=101><ACK=301><CTL=ACK>      -->
	
	  4.  TIME-WAIT                                            TIME-WAIT
	      (2 MSL)                                              (2 MSL)
	      CLOSED                                               CLOSED
	
	                      Simultaneous Close Sequence

### 更多内容

rfc中还有更多的内容，以后用到的时候会在这里继续补充，感兴趣的可以直接阅读[rfc793: transmission control protocol][1]。

## 查看tcp状态

在linux上可以使用netstat查看系统上的连接状态。

### 查看连接的状态分布

	$netstat -nat|awk '{print awk $NF}'|sort|uniq -c|sort -n
	      1 CLOSE_WAIT
	      1 SYN_RECV
	      1 State
	      1 established)
	      2 FIN_WAIT2
	     27 FIN_WAIT1
	     73 TIME_WAIT
	    151 LISTEN
	   1406 ESTABLISHED

`netstat -nat`显示所有的tcp连接。

`awk '{print awk $NF }'`打印每一行的最后一列，也就是每个连接的状态。

`sort | uniq -c | sort -n`排序后统计每个状态的数量，然后按照从低到高显示。

### 查看连接的源IP分布

查看每个源IP建立了多少个连接：

	 netstat -nat|grep ":80"|awk '{print $5}' |awk -F: '{print $1}' | sort| uniq -c|sort -n
	      1 0.0.0.0
	      1 10.24.200.135
	      1 10.37.33.104
	      6 10.39.1.227
	      7 36.98.102.22
	     12 192.168.237.249

## linux kernel documention

从[linux kernel doc: sysctl][3]目录中可以找到linux的`/proc/sys/`目录下的参数的说明。

不过目录中的README上来就挑明了观点:

	'Why', I hear you ask, 'would anyone even _want_ documentation
	for them sysctl files? If anybody really needs it, it's all in
	the source...'
	
	Well, this documentation is written because some people either
	don't know they need to tweak something, or because they don't
	have the time or knowledge to read the source code.
	
	Furthermore, the programmers who built sysctl have built it to
	be actually used, not just for the fun of programming it :-)

也就是说，很多人都认为，应该去看代码，那么这里的文档是不是非常完善的呢...

[00-Index][4]中显示net.txt是`/proc/sys/net`目录中文档：

	00-index
	    - this file.
	README
	    - general information about /proc/sys/ sysctl files.
	abi.txt
	    - documentation for /proc/sys/abi/*.
	fs.txt
	    - documentation for /proc/sys/fs/*.
	kernel.txt
	    - documentation for /proc/sys/kernel/*.
	net.txt
	    - documentation for /proc/sys/net/*.
	sunrpc.txt
	    - documentation for /proc/sys/sunrpc/*.
	vm.txt
	    - documentation for /proc/sys/vm/*.

[net.txt][5]中显示ipv4参数的说明文档是[ip-sysctl.txt][6]和[ipvs-sysctl.txt][7]。

	...(省略)...
	3. /proc/sys/net/ipv4 - IPV4 settings
	-------------------------------------------------------
	Please see: Documentation/networking/ip-sysctl.txt and ipvs-sysctl.txt for
	descriptions of these entries.
	...(省略)...

### tcp内核参数

tcp的内核参数很多，kernel3.10中tcp的内核参数多达55个，这也印证了tcp是一个复杂的协议。

	[root@/proc/sys/net/ipv4]# ls tcp*
	tcp_abort_on_overflow             tcp_keepalive_probes    tcp_rfc1337
	tcp_adv_win_scale                 tcp_keepalive_time      tcp_rmem
	tcp_allowed_congestion_control    tcp_limit_output_bytes  tcp_sack
	tcp_app_win                       tcp_low_latency         tcp_slow_start_after_idle
	tcp_autocorking                   tcp_max_orphans         tcp_stdurg
	tcp_available_congestion_control  tcp_max_ssthresh        tcp_syn_retries
	tcp_base_mss                      tcp_max_syn_backlog     tcp_synack_retries
	tcp_challenge_ack_limit           tcp_max_tw_buckets      tcp_syncookies
	tcp_congestion_control            tcp_mem                 tcp_thin_dupack
	tcp_dsack                         tcp_min_tso_segs        tcp_thin_linear_timeouts
	tcp_early_retrans                 tcp_moderate_rcvbuf     tcp_timestamps
	tcp_ecn                           tcp_mtu_probing         tcp_tso_win_divisor
	tcp_fack                          tcp_no_metrics_save     tcp_tw_recycle
	tcp_fastopen                      tcp_notsent_lowat       tcp_tw_reuse
	tcp_fastopen_key                  tcp_orphan_retries      tcp_window_scaling
	tcp_fin_timeout                   tcp_reordering          tcp_wmem
	tcp_frto                          tcp_retrans_collapse    tcp_workaround_signed_windows
	tcp_invalid_ratelimit             tcp_retries1
	tcp_keepalive_intvl               tcp_retries2

内核参数可以通过直接修改内核参数文件的方式修改，但是重启后失效。

最好的做法是写入到`/etc/sysctl.conf`文件中，通过`/sbin/sysctl -p`使之生效，格式如下：

	net.ipv4.tcp_fin_timeout = 30
	net.ipv4.tcp_keepalive_time = 1200

这里会持续记录研究过参数。2017-09-05 16:05:18

#### tcp_fin_timeout

FIN_WAIT_2状态的等待时间，单位s，默认60s。

#### tcp_syncookies

	Only valid when the kernel was compiled with CONFIG_SYN_COOKIES
	Send out syncookies when the syn backlog queue of a socket
	overflows. This is to prevent against the common 'SYN flood attack'
	Default: 1

SYN等待队列溢出的时候，启用cookies。

syn cookies是用来防止syn flood攻击的技术。基本的原理的就是服务端在收到SYN请求并回应
了ACK+SYN的时候，不会立即为该链接分配空间，而是计算出一个cookie值，只有收到客户端返
会的ACK通过了cookie检查之后，才会分配空间。

通过延迟分配连接空间的方式，降低了SYN Flood对系统的影响。

#### tcp_tw_reuse

	Allow to reuse TIME-WAIT sockets for new connections when it is
	safe from protocol viewpoint. Default value is 0.
	It should not be changed without advice/request of technical
	experts.

允许重用位于TIME-WAIT状态的socket，默认关闭。

注意：打开这个选项，可以减少TIME-WAIT状态的连接。

#### tcp_keepalive_time

	How often TCP sends out keepalive messages when keepalive is enabled.
	Default: 2hours.

#### tcp_keepalive_probes

	How many keepalive probes TCP sends out, until it decides that the
	connection is broken. 
	Default value: 9.

#### tcp_keepalive_intvl

	How frequently the probes are send out. Multiplied by
	tcp_keepalive_probes it is time to kill not responding connection,
	after probes started. Default value: 75sec i.e. connection
	will be aborted after ~11 minutes of retries.

#### tcp_fastopen

Enable TCP Fast Open (RFC7413) to send and accept data in the opening
SYN packet.

	The values (bitmap) are
	      0x1: (client) enables sending data in the opening SYN on the client.
	      0x2: (server) enables the server support, i.e., allowing data in
	            a SYN packet to be accepted and passed to the
	            application before 3-way handshake finishes.
	      0x4: (client) send data in the opening SYN regardless of cookie
	            availability and without a cookie option.
	    0x200: (server) accept data-in-SYN w/o any cookie option present.
	    0x400: (server) enable all listeners to support Fast Open by
	            default without explicit TCP_FASTOPEN socket option.

Default: 0x1

#### tcp_max_orphans

	Maximal number of TCP sockets not attached to any user file handle,
	held by system.	If this number is exceeded orphaned connections are
	reset immediately and warning is printed. This limit exists
	only to prevent simple DoS attacks, you _must_ not rely on this
	or lower the limit artificially, but rather increase it
	(probably, after increasing installed memory),
	if network conditions require more than default value,
	and tune network services to linger and kill such states
	more aggressively. Let me to remind again: each orphan eats
	up to ~64K of unswappable memory.

#### tcp_max_syn_backlog

	Maximal number of remembered connection requests, which have not
	received an acknowledgment from connecting client.
	The minimal value is 128 for low memory machines, and it will
	increase in proportion to the memory of machine.
	If server suffers from overload, try increasing this number.

#### tcp_orphan_retries

	This value influences the timeout of a locally closed TCP connection,
	when RTO retransmissions remain unacknowledged.
	See tcp_retries2 for more details.
	
	The default value is 8.
	If your machine is a loaded WEB server,
	you should think about lowering this value, such sockets
	may consume significant resources. Cf. tcp_max_orphans.

注意： 0表示默认值，也就是8。

	/* Calculate maximal number or retries on an orphaned socket. */
	static int tcp_orphan_retries(struct sock *sk, int alive)
	{
	         int retries = sysctl_tcp_orphan_retries; /* May be zero. */
	 
	         /* We know from an ICMP that something is wrong. */
	         if (sk->sk_err_soft && !alive)
	                 retries = 0;
	 
	         /* However, if socket sent something recently, select some safe
	          * number of retries. 8 corresponds to >100 seconds with minimal
	          * RTO of 200msec. */
	         if (retries == 0 && alive)
	                 retries = 8;
	         return retries;
	}

#### tcp_retries2

	This value influences the timeout of an alive TCP connection,
	when RTO retransmissions remain unacknowledged.
	Given a value of N, a hypothetical TCP connection following
	exponential backoff with an initial RTO of TCP_RTO_MIN would
	retransmit N times before killing the connection at the (N+1)th RTO.

	The default value of 15 yields a hypothetical timeout of 924.6
	seconds and is a lower bound for the effective timeout.
	TCP will effectively time out at the first RTO which exceeds the
	hypothetical timeout.

	RFC 1122 recommends at least 100 seconds for the timeout,
	which corresponds to a value of at least 8.

#### tcp_tw_recycle

开启tcp连接中TIME-WAIT的socket的快速回收功能，默认为0，表示关闭。

注: 内核文档没有介绍这个参数.

## 参考

1. [rfc793: transmission control protocol][1]
2. [linux kernel documention][2]
3. [linux kernel doc: sysctl][3]
4. [linux kernel doc: sysctl INDEX][4]
5. [linux kernel doc: net.txt][5]
6. [linux kernel doc: ip-sysctl.txt][6]
7. [linux kernel doc: ipvs-sysctl.txt][7]
8. [防止linux出现大量 FIN_WAIT1,提高性能][8]

[1]: https://www.rfc-editor.org/rfc/rfc793.txt  "rfc793: transmission control protocol" 
[2]: https://github.com/torvalds/linux/tree/master/Documentation "linux kernel documentation"
[3]: https://github.com/torvalds/linux/tree/master/Documentation/sysctl "linux kernel doc: sysctl"
[4]: https://github.com/torvalds/linux/blob/master/Documentation/sysctl/00-INDEX "linux kernel doc: sysctl INDEX"
[5]: https://github.com/torvalds/linux/blob/master/Documentation/sysctl/net.txt "linux kernel doc: net.txt"
[6]: https://github.com/torvalds/linux/blob/master/Documentation/networking/ip-sysctl.txt "linux kernel doc: ip-sysctl.txt"
[7]: https://github.com/torvalds/linux/blob/master/Documentation/networking/ipvs-sysctl.txt  "linux kernel doc: ipvs-sysctl.txt"
[8]: http://soarwilldo.blog.51cto.com/5520138/1337535 "防止linux出现大量 FIN_WAIT1,提高性能"
