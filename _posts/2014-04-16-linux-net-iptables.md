---
layout: default
title: "iptables: Linux iptables 使用"
author: 李佶澳
createdate: 2014/04/16 10:16:55
last_modified_at: 2018/06/17 21:48:31
categories: 技巧
tags: manual
keywords: iptables规则,iptables使用方法,iptables原理,iptables报文处理,linux,iptables
description: 介绍了iptables的原理、表之间的关系、报文处理时经过规则链的顺序。以及iptables的调试方法和比较有意思的应用。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

iptables 是 linux 自带的防火墙，可以到 [iptables-contents][5]、[Iptables Tutorial 1.2.2][8] 中学习。

## 基本概念

Linux Kernel 的 netfilter 机制在报文的处理路径中总共设置了五个 hook 点，在这些 hook 点上可以挂载额外处理过程，来影响报文的后续处理。Iptables 就是一个基于 netfilter hook 的应用。

五个 hook 点分别处理位于不同阶段的报文：

* PREROUTING:  packets as soon as they come in
* INPUT:       packets destined to local sockets
* OUTPUT:      locally-generated packets before routing
* FORWARD:     packets being routed through the box
* POSTROUTING: packets as they are about to go out

```
          INPUT                 OUPUT
            .                     |
           /_\           +--------+
            |           _|_
            +--------+  \ /
                     |   ' 
                     Router ------|> FORWARD
                     .   |                |
                    /_\  +--------+       |
                     |           _|_     _|_
           +---------+           \ /     \ /
           |                      '       ' 
PKT ---> PREROUTING              POSTROUTING  ---> PKT

```

iptables 规则按照“表(table)->规则链(chain)->规则(rule)”的层级规则。首先定义了多张用于不同的用途的表，每张表作用于不同的 hook 点组合。然后为每个 netfilter hook 点定义了同名的 chain，在 chain 中添加串行的处理规则。

表名     |       用途                               | 作用的 Hook 点
---------|------------------------------------------|--------------------
raw      | 用于连接跟踪/connection tracking 豁免    | prerouting、output
         | (主要和 NOTRACT target 配合使用)         | 
mangle   | 用于报文内容修改                         | prerouting、input、output、forward、postrouting
nat      | 用于新连接的建立过程                     | prerouting、input、output、postrouting
filter   | 默认表                                   | input、forward、output
security | 用于 Linux Security Modules/SELinux 的   | input、forward、output
         | Mandatory Access Control 功能            |

不同来源的报文按照不同的顺序依次经过不同表的不同 Chain，[structure-of-iptables][2] 中做了非常详细的说明：

目的为当前主机的接收报文:

	raw.PREROUTING -> mangle.PREROUTING -> nat.PREROUTING -> mangle.INPUT -> filter.INPUT 

经过当前主机的转发报文:

	raw.PREROUTING -> mangle.PREROUTING -> nat.PREROUTING -> mangle.FORWARD -> filter.FORWARD
	-> mangle.POSTROUTING -> nat.POSTROUTING

当前主机产生的发送报文:

	raw.OUTPUT -> mangle.OUTPUT -> nat.OUTPUT -> filter.OUTPUT -> mangle.POSTROUTING 
	->nat.POSTROUTING

![nf-packet-flow]({{ site.imglocal }}/iptables/nf-packet-flow.png )


	//查看fitler表中的所有chain，如果不指定table，默认查看的是filter表。
	iptables -t filter -L
	
	//查看fitler表中input chain中的所有规则
	iptables -t filter -L INPUT

除了和 netfilter hook 同名的 chain，还可以自定义 chain，但是自定义的 Chain 只能经由已有的 chain 跳转。

## iptables 操作命令

iptables 命令支持多种针对规则的操作([man 8 iptables][1]），每个操作用不同的参数指定：

```sh
-A --append        chain rule-specification
-C --check         chain rule-specification
-D --delete        chain rule-specification / chain rulenum
-I --insert        chain [rulenum] rule-specification
-R --replace       chain rulenum rule-specification
-L --list          [chain]
-S --list-rules    [chain]
-F --flush         [chain]
-Z --zero          [chain [rulenum]]
-N --new-chain     chain
-X --delete-chain  [chain]
-P --policy        chain target
-E --rename-chain  old-chain new-chain
-h 
```

## iptables 规则语法

chain 中的规则主要由 matches 和 target 两部分组成，matches 是多个匹配条件， target 是处理动作：

```sh
rule-specification = [matches...] [target]
match = -m matchname [per-match-options]
target = -j targetname [per-target-options]
```

matches 部分可使用的 options，!表示取反:

```sh
-4, --ipv4
-6, --ipv6
[!] -p, --protocol protocol
     protocol 可以是:
       1. tcp, udp, udplite, icmp, icmpv6,esp, ah, sctp, mh or the special keyword "all"
       2. 协议号，0 等同于"all"
       3. /etc/protocols 中列出的协议名
[!] -s, --source address[/mask][,...]
     Address can be either:
         a network name, a hostname, a network IP address (with /mask), or a plain IP address.
         Multiple addresses can be specified, but this will expand to multiple rules (when
         adding with -A), or will cause multiple rules to be deleted (with -D).
[!] -d, --destination address[/mask][,...]
[!] -i, --in-interface name                 
      报文的来源网卡，只适用于 input, forward, prerouting
[!] -o, --out-interface name
      报文的目标网卡, 只适用于 output, forward, prerouting
[!] -f, --fragment
      IP报文的第二个以及之后的分片，取反表示报文第一个分片，只适用于 ipv4
      This means that the rule only refers to second and further IPv4 fragments of fragmented packets.
      Since there is no way to tell the source or destination ports of  such  a  packet  (or ICMP type), 
      such a packet will not match any rules which specify them.  
      When the "!" argument precedes the "-f" flag, the rule will only match head fragments, or unfragmented packets.
      This option is IPv4 specific, it is not available in ip6tables.
-m, --match match
     上述参数不能满足需要时，可以用 -m 选择 match 扩展模块
```

target 部分可使用的 options：

```sh
-c, --ssetet-counters packets bytes
      This enables the administrator to initialize the packet and byte counters of a rule 
      (during INSERT, APPEND, REPLACE operations).
-g, --goto chain
      Unlike the --jump option return will not continue processing in this chain but instead 
      in the chain that called us via --jump
-j, --jump target
      可以用 -j 选择 target 扩展模块
```

-m 和 -j 可以指定 iptables 的扩展模块，用 [man iptables-extensions][6] 查看。

### match 扩展模块

通过 `-m name [module-options...]` 指定，标准的 iptables 包括下列 match module（[man iptables-extensions][6]）:

```sh
addrtype
ah (IPv6-specific)
ah (IPv4-specific)
bpf
cgroup
cluster
comment
connbytes
connlabel
connlimit
connmark
conntrack
cpu
dccp
devgroup
dscp
dst (IPv6-specific)
ecn
esp
eui64 (IPv6-specific)
frag (IPv6-specific)
hashlimit
hbh (IPv6-specific)
helper
hl (IPv6-specific)
icmp (IPv4-specific)
icmp6 (IPv6-specific)
iprange
ipv6header (IPv6-specific)
ipvs
length
limit
mac
mark
mh (IPv6-specific)
multiport
nfacct
osf
owner
physdev
pkttype
policy
quota
rateest
realm (IPv4-specific)
recent
rpfilter
rt (IPv6-specific)
sctp
set
socket
state
statistic
string
tcp
tcpmss
time
tos
ttl (IPv4-specific)
u32
udp
unclean (IPv4-specific)
```

### target 扩展模块

target modules 是通过 `-j modulename` 指定，标准的 iptables 中包括以下 target modules（[man iptables-extensions][6]：

```sh
AUDIT
CHECKSUM
CLASSIFY
CLUSTERIP (IPv4-specific)
CONNMARK
CONNSECMARK
CT
DNAT
DNPT (IPv6-specific)
DSCP
ECN (IPv4-specific)
HL (IPv6-specific)
HMARK
IDLETIMER
LED
LOG
MARK
MASQUERADE
MIRROR (IPv4-specific)
NETMAP
NFLOG
NFQUEUE
NOTRACK
RATEEST
REDIRECT
REJECT (IPv6-specific)
REJECT (IPv4-specific)
SAME (IPv4-specific)
SECMARK
SET
SNAT
SNPT (IPv6-specific)
TCPMSS
TCPOPTSTRIP
TEE
TOS
TPROXY
TRACE
TTL (IPv4-specific)
ULOG (IPv4-specific)
```

### 扩展模块详解

#### -m set 

set模块监测是否命中ipset。ipset是用命令`ipset`管理的，可以查看:

```sh
yum install -y ipset
man ipset
```

## iptables 规则查看

iptables 规则用 -L 命令查看：

```sh
// -t 指定表名，-L 指定链名，-v 显示规则命中的报文统计等信息 -n 显示为数字 -x 精确显示报文统计数据
iptable [-t table] [-L Chain] -v -x -n
```

如下：

```sh
$ iptables -t mangle -L OUTPUT -n -v -x
Chain OUTPUT (policy ACCEPT 53331068 packets, 3623998374 bytes)
    pkts      bytes target     prot opt in     out     source               destination
3532457971 12906903226015 ACCEPT     all  --  *      !lo     0.0.0.0/0            0.0.0.0/0            cgroup 589943
3911690880 14549090892740 ACCEPT     all  --  *      !lo     0.0.0.0/0            0.0.0.0/0            cgroup 2424951
4071912527 15110041940189 ACCEPT     all  --  *      !lo     0.0.0.0/0            0.0.0.0/0            cgroup 4259959
4080422934 15319386069183 ACCEPT     all  --  *      !lo     0.0.0.0/0            0.0.0.0/0            cgroup 5701751
3799441028 14030243487461 ACCEPT     all  --  *      !lo     0.0.0.0/0            0.0.0.0/0            cgroup 7536759
3868222704 14382061580818 ACCEPT     all  --  *      !lo     0.0.0.0/0            0.0.0.0/0            cgroup 8978551
```

## iptables 修改规则

`man iptables`。

追加、检查、删除规则：

	iptables [-t table] {-A|-C|-D} chain rule-specification    

插入规则:

	iptables [-t table] -I chain [rulenum] rule-specification

替换规则:

	iptables [-t table] -I chain [rulenum] rule-specification

插入和替换规则时，rule编号从1开始。

## iptables 规则调试

iptables 的日志信息是 kernel 日志，可以通过 dmesg 查看，为了方便，在 /etc/(r)syslog.conf 中配置一下，将 kernel 日志写到一个文件中：

```sh
#在/etc/rsyslog.conf添加
kern.=debug     /var/log/kern.debug.log
```

重启rsyslog:

```sh
systemctl restart rsyslog
```

### 方法1: 用 -j LOG 扩展在任意位置打印报文

下面规则在本地发出的报文经过的每个检查点上都设置了日志:

```sh
iptables -t raw    -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "raw out: "
iptables -t mangle -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "mangle out: "
iptables -t nat    -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "nat out: "
iptables -t filter -A OUTPUT -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "filter out: "
iptables -t mangle -A POSTROUTING -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "mangle post: "
iptables -t nat -A POSTROUTING -m limit --limit 5000/minute -j LOG --log-level 7 --log-prefix "nat post: "
```

>设置--limit 防止打印出太多的日志，如果设置的太小可能会恰好丢弃要观察的包

执行命令“ping -c 1 3.3.3.3”，然后查看iptables的日志记录：

```sh
$cat /var/log/kern.debug.log  |grep 3.3.3.3
Mar 31 05:48:29 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
Mar 31 05:48:29 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
Mar 31 05:48:29 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
Mar 31 05:48:29 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
Mar 31 05:48:29 compile kernel: mangle post: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
Mar 31 05:48:29 compile kernel: nat post: IN= OUT=eth0 SRC=10.0.2.15 DST=3.3.3.3 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=29101 DF PROTO=ICMP TYPE=8 CODE=0 ID=4232 SEQ=1
```

从日志中可以看到，报文依次经过了raw out、mangle out、nat out、filter out、mangle out、nat post。

设置一条规则，在filter阶段丢弃到1.1.1.1的报文:

```sh
iptables -t filter -A OUTPUT -d 1.1.1.1 -j DROP 
```

执行命令`ping -c 1.1.1.1`后，查看日志

```sh
$cat /var/log/kern.debug.log  |grep 1.1.1.1
Mar 31 06:10:02 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
Mar 31 06:10:02 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
Mar 31 06:10:02 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
Mar 31 06:10:02 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=1.1.1.1 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=24260 DF PROTO=ICMP TYPE=8 CODE=0 ID=4426 SEQ=1
```

从日志中可以看到，发送到1.1.1.1的报文到达filter表的OUTPUT规则后就终止了。

设置一条规则nat规则:

```sh
iptables -t nat -A OUTPUT -d 2.2.2.2 -j DNAT  --to-destination 8.8.8.8
```

`ping -c 2.2.2.2` 之后，可以看到下面的日志:

```sh
$cat /var/log/kern.debug.log |grep 2.2.2.2
Mar 31 06:12:38 compile kernel: raw out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
Mar 31 06:12:38 compile kernel: mangle out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
Mar 31 06:12:38 compile kernel: nat out: IN= OUT=eth0 SRC=10.0.2.15 DST=2.2.2.2 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1

$ cat /var/log/kern.debug.log |grep 8.8.8.8
Mar 31 06:12:38 compile kernel: filter out: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
Mar 31 06:12:38 compile kernel: mangle post: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
Mar 31 06:12:38 compile kernel: nat post: IN= OUT=eth0 SRC=10.0.2.15 DST=8.8.8.8 LEN=84 TOS=0x00 PREC=0x00 TTL=64 ID=2791 DF PROTO=ICMP TYPE=8 CODE=0 ID=4431 SEQ=1
```

从日志中可以看到，报文经过nat表的OUTPUT规则时进行了DNAT，然后使用新的DST地址经过filter的OUTPUT规则直到发送出。

### 方法2: 用-j TRACE 扩展进行全程跟踪

[netfilter/iptables/conntrack debugging][12] 中通过 `-j TRACE` 跟踪报文（只能用于 raw 表）。

```sh
iptables -t raw -A PREROUTING -p icmp -s 8.8.8.8/32 -j TRACE
```

在 `man iptables-extensions` 中可以找到对 `TRACE` 的介绍：

```sh
This target marks packets so that the kernel will log every rule which match
the packets as those traverse the tables, chains, rules.
```

TRACE模块会在符合规则的报文上打上标记，将该报文经过的每一条规则打印出来，很方便的对报文做全程跟踪。`TRACE模块只能在raw表中使用`，还需要加载内核模块：

```sh
modprobe ipt_LOG ip6t_LOG nfnetlink_log
```

之后可以通过`dmesg`，或者在/var/log/message中查看到匹配的报文的日志：

```sh
Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:PREROUTING:rule:2 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:rule:1 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:rule:3 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-from-host-endpoint:return:1 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
Jun 16 17:44:05 dev-slave-110 kernel: TRACE: raw:cali-PREROUTING:return:5 IN=eth0 OUT= MAC=52:54:15:5d:39:58:02:54:d4:90:3a:57:08:00 SRC=8.8.8.8 DST=10.39.0.110 LEN=84 TOS=0x00 PREC=0x00 TTL=32 ID=0 PROTO=ICMP TYPE=0 CODE=0 ID=4064 SEQ=24
```

## iptables 应用

### 常用规则

屏蔽接收：

	iptables -A INPUT -s xxx.xxx.xxx.xxx -j DROP
	iptables -A INPUT -p tcp -s xxx.xxx.xxx.xxx -j DROP
	iptables -A INPUT -p tcp --dport xxx -j ACCEPT
	iptables -A INPUT -p icmp -i eth0 -j DROP
	iptables -A INPUT -m mac --mac-source 00:00:00:00:00:00 -j DROP

屏蔽发送：

	 iptables -A OUTPUT -p tcp --dport xxx -j DROP

多端口设置：

	iptables -A INPUT  -p tcp -m multiport --dports 22,80,443 -j ACCEPT
	iptables -A OUTPUT -p tcp -m multiport --sports 22,80,443 -j ACCEPT

使用IP网段：

	iptables -A OUTPUT -p tcp -d 192.168.100.0/24 --dport 22 -j ACCEPT

本地端口转发：

	iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 25 -j REDIRECT --to-port 2525

限制连接速率，每分钟100个，上限200：

	iptables -A INPUT -p tcp --dport 80 -m limit --limit 100/minute --limit-burst 200 -j ACCEPT

限制并发连接：

	iptables -A INPUT -p tcp --syn --dport 22 -m connlimit --connlimit-above 3 -j REJECT

允许建立连接：

	iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
	iptables -A OUTPUT -m conntrack --ctstate ESTABLISHED -j ACCEPT

### 使用 iptables 做通信数据劫持

被劫持机:

	ip: 192.168.1.10
	netmask: 255.255.255.0
	gateway: 192.168.1.1

劫持机有两个网卡eth0和eth1

	eth0:  内网口, 接入被劫持机
		ip: 192.168.1.1
		netmask: 255.255.255.0
	
	eth1:  外网口, 接入外网
		ip: 172.19.1.10
		netmask: 255.255.255.0
		gateway: 172.19.1.1
		dns: 172.19.1.1

在劫持机上配置规则:

	eth1发出的源IP为192.168.1.10的包，源地址被改写为172.19.1.10
		iptables -t nat -A POSTROUTING -o eth1 -s 192.168.1.10 -j SNAT --to 172.19.1.10

	eth1接收的目的地址为172.19.1.10的包，目的地址被改写为192.168.1.10
		iptables -t nat -A PREROUTING -i eth1 -d 172.19.1.10 -j DNAT --to 192.168.1.10


## 参考

1. [man 8 iptables][1]
2. [sturcture of iptables][2]
3. [利用raw表实现iptables调试][3]
4. [iptables-debugging][4]
5. [iptables-contents][5]
6. [man 8 iptables-extensions][8]
7. [target REDIRECT][7]
8. [Iptables Tutorial 1.2.2][8]
9. [netfilter][9]
10. [使用TRACE模块对报文进行全程跟踪][10]
11. [20条IPTables防火墙规则用法！][11]
12. [netfilter/iptables/conntrack debugging][12]

[1]: https://man7.org/linux/man-pages/man8/iptables.8.html "man 8 iptables"
[2]: http://www.iptables.info/en/structure-of-iptables.html "structure-of-iptables"
[3]: http://flymanhi.blog.51cto.com/1011558/1276331 "利用raw表实现iptables调试"
[4]: http://adminberlin.de/iptables-debugging/ "iptables-debugging"
[5]: http://www.iptables.info/en/iptables-contents.html "iptables-contents"
[6]: https://man7.org/linux/man-pages/man8/iptables-extensions.8.html "man 8 iptables-extensions"
[7]: https://www.frozentux.net/iptables-tutorial/chunkyhtml/x4529.html "target REDIRECT"
[8]: https://www.frozentux.net/iptables-tutorial/iptables-tutorial.html "Iptables Tutorial 1.2.2"
[9]: https://www.netfilter.org/projects/iptables/index.html "netfilter"
[10]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/06/15/debug-linux-network.html#%E4%BD%BF%E7%94%A8trace%E6%A8%A1%E5%9D%97%E5%AF%B9%E6%8A%A5%E6%96%87%E8%BF%9B%E8%A1%8C%E5%85%A8%E7%A8%8B%E8%B7%9F%E8%B8%AA "使用TRACE模块对报文进行全程跟踪"
[11]: https://www.cnblogs.com/linuxprobe/p/5643684.html "20条IPTables防火墙规则用法！"
[12]: https://strlen.de/talks/nfdebug.pdf "netfilter/iptables/conntrack debugging"
