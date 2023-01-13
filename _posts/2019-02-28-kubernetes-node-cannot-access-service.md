---
layout: default
title: "Kubernetes集群node无法访问service: kube-proxy没有正确设置cluster-cidr"
author: 李佶澳
createdate: "2019-02-27 18:21:19 +0800"
last_modified_at: "2019-09-16 14:14:16 +0800"
categories: 问题
tags: kubernetes_problem
keywords: kubernetes
description: "异常机器上的kube-proxy缺失参数--cluster-cidr，pod的网段和service的cluster ip不是一个网段"

---

## 目录
* auto-gen TOC:
{:toc}

## 现象

Kubernetes集群版本1.9.11，使用了kube-proxy，并且启用了ipvs模式。
在kubernetes的一个node节点上直接访问kubernetes中的service不通，注意是`访问服务不通`，不是ping不通。
以apiserver对应的kubernetes service为例：

```
$ kubectl get service -o wide
NAME         TYPE        CLUSTER-IP   EXTERNAL-IP   PORT(S)   AGE       SELECTOR
kubernetes   ClusterIP   10.20.0.1    <none>        443/TCP   1y        <none>
```

直接在node-10.19.136.10上发起访问是不通的，如下：

```
$ telnet  10.20.0.1 443
Trying 10.20.0.1...
```

注意只是从node上、在使用了host网络模式的pod中，无法访问kubernetes中的service，在非host网络模式的pod中可以访问service。

## 调查

没有什么技巧，抓包分析，在node上用telnet访问，同时抓包：

```
[root@10.39.136.10]# tcpdump -n -i eth0 tcp and host 10.20.0.1
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 65535 bytes
18:20:12.414803 IP 10.20.0.1.58816 > 10.19.9.120.6443: Flags [S], seq 955806855, win 43690, options [mss 65495,sackOK,TS val 2968731388 ecr 0,nop,wscale 7], length 0
18:20:13.416674 IP 10.20.0.1.58816 > 10.19.9.120.6443: Flags [S], seq 955806855, win 43690, options [mss 65495,sackOK,TS val 2968732390 ecr 0,nop,wscale 7], length 0
18:20:15.418667 IP 10.20.0.1.58816 > 10.19.9.120.6443: Flags [S], seq 955806855, win 43690, options [mss 65495,sackOK,TS val 2968734392 ecr 0,nop,wscale 7], length 0
18:20:19.426669 IP 10.20.0.1.58816 > 10.19.9.120.6443: Flags [S], seq 955806855, win 43690, options [mss 65495,sackOK,TS val 2968738400 ecr 0,nop,wscale 7], length 0
```

目标地址10.19.9.120是apiserver的真实IP，目标IP被转换成了真实IP，符合预期。

`源地址比较诡异`，源地址是10.20.0.1，10.20.0.1是我们要访问的服务的cluster IP，它怎么能成为报文的源IP？

在服务端（10.19.9.120）抓包核对一下：

```
[root@10.19.9.120]$ tcpdump -nn -i eth0 tcp and host 10.20.0.1
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), capture size 65535 bytes
18:20:43.445144 IP 10.20.0.1.58816 > 10.19.9.120.6443: Flags [S], seq 955806855, win 43690, options [mss 65495,sackOK,TS val 2968762432 ecr 0,nop,wscale 7], length 0
18:20:43.445227 IP 10.19.9.120.6443 > 10.20.0.1.58816: Flags [S.], seq 3167222560, ack 955806856, win 28040, options [mss 1414,sackOK,TS val 2470949992 ecr 2968731388,nop,wscale 7], length 0
18:20:59.825767 IP 10.19.9.120.6443 > 10.20.0.1.58816: Flags [S.], seq 3167222560, ack 955806856, win 28040, options [mss 1414,sackOK,TS val 2470966373 ecr 2968731388,nop,wscale 7], length 0
18:21:15.481764 IP 10.20.0.1.58816 > 10.19.9.120.6443: Flags [S], seq 955806855, win 43690, options [mss 65495,sackOK,TS val 2968794496 ecr 0,nop,wscale 7], length 0
18:21:15.481843 IP 10.19.9.120.6443 > 10.20.0.1.58816: Flags [S.], seq 3167222560, ack 955806856, win 28040, options [mss 1414,sackOK,TS val 2470982029 ecr 2968731388,nop,wscale 7], length 0
```

果然，服务端将报文回应给了10.20.0.1！但是服务端根本不知道这个10.20.0.1在哪（apiserver上没有安装kube-proxy，如果安装了会有不同吗？）。

## 继续调查1

关键问题是从node上发起访问时，为什么报文的源IP是service的cluster IP？

通过检查node上的网卡和ipvs规则，发现了端倪：在node上有一个网卡设置了IP`10.20.0.1`，发送到10.20.0.1的报文都被送给了这个本地网卡，这个网卡是kube-proxy创建的kube-ipvs0：

```
$ ip addr |grep 10.20.0.1
784: kube-ipvs0: <BROADCAST,NOARP> mtu 1500 qdisc noop state DOWN
    inet 10.20.0.1/32 brd 10.20.0.1 scope global kube-ipvs0
```

这也解释了为什么ping是通的。ipvs中对应的转发规则如下：

```
-A -t 10.20.0.1:443 -s rr -p 10800
-a -t 10.20.0.1:443 -r 10.19.9.120:6443 -m -w 1
-a -t 10.20.0.1:443 -r 10.19.14.106:6443 -m -w 1
-a -t 10.20.0.1:443 -r 10.19.111.132:6443 -m -w 1
```

ipvs转发规则正确，问题变成：报文被ipvs转出时，源IP应该怎样处理？

先尝试用另一种方法发起访问，看看源IP是node的IP的时候，能否访问服务，用telnet的`-b`参数绑定源IP ：

```
$ telnet -b 10.19.136.10 10.20.0.1 443
Trying 10.20.0.1...
Connected to 10.20.0.1.
Escape character is '^]'.
```

结果是通的！这就有意思了。

继续在这条路上探索一下，在node上加上一条规则，将源IP强制转换：

```
iptables -t nat -A POSTROUTING -s 10.20.0.1/32 -j SNAT --to-source 10.19.136.10
```

加上规则之后，可以直接访问10.20.0.1:443了：

```
$ telnet 10.20.0.1 443
Trying 10.20.0.1...
Connected to 10.20.0.1.
Escape character is '^]'.
```

## 继续调查2

刚开始的时候想是不是因为apiserver上没有安装kube-proxy，但是想到其它非apiserver的服务也是不能访问的，排除这个因素，重点还是ipvs和iptables本身。

正好手里有一个使用kube-proxy 1.9.2的集群不存在上面的问题，但是如果把它的iptables规则清空，就会出现同样的情况，`问题范围缩小到iptables`。 
接下来对比正常机器的iptables规则和异常机器的iptables规则。

下面是正常机器的iptables，问题在于nat表，这是事后补录，就不记录所有信息了:

```
*nat
-A PREROUTING -m comment --comment "kubernetes service portals" -j KUBE-SERVICES
-A OUTPUT -m comment --comment "kubernetes service portals" -j KUBE-SERVICES
-A POSTROUTING -m comment --comment "kubernetes postrouting rules" -j KUBE-POSTROUTING
-A KUBE-FIREWALL -j KUBE-MARK-DROP
-A KUBE-LOAD-BALANCER -j KUBE-MARK-MASQ
-A KUBE-MARK-MASQ -j MARK --set-xmark 0x4000/0x4000
-A KUBE-NODE-PORT -p tcp -m comment --comment "Kubernetes nodeport TCP port for masquerade purpose" -m set --match-set KUBE-NODE-PORT-TCP dst -j KUBE-MARK-MASQ
-A KUBE-POSTROUTING -m comment --comment "kubernetes service traffic requiring SNAT" -m mark --mark 0x4000/0x4000 -j MASQUERADE
-A KUBE-POSTROUTING -m comment --comment "Kubernetes endpoints dst ip:port, source ip for solving hairpin purpose" -m set --match-set KUBE-LOOP-BACK dst,dst,src -j MASQUERADE
-A KUBE-SERVICES ! -s 172.16.128.0/17 -m comment --comment "Kubernetes service cluster ip + port for masquerade purpose" -m set --match-set KUBE-CLUSTER-IP dst,dst -j KUBE-MARK-MASQ
-A KUBE-SERVICES -m addrtype --dst-type LOCAL -j KUBE-NODE-PORT
-A KUBE-SERVICES -m set --match-set KUBE-CLUSTER-IP dst,dst -j ACCEPT
```

异常机器的iptables：

```
*nat
-A PREROUTING -m comment --comment "kubernetes service portals" -j KUBE-SERVICES
-A PREROUTING -m addrtype --dst-type LOCAL -j DOCKER
-A OUTPUT -m comment --comment "kubernetes service portals" -j KUBE-SERVICES
-A OUTPUT ! -d 127.0.0.0/8 -m addrtype --dst-type LOCAL -j DOCKER
-A POSTROUTING -m comment --comment "kubernetes postrouting rules" -j KUBE-POSTROUTING
-A POSTROUTING -s 11.0.113.0/24 ! -o docker0 -j MASQUERADE
-A DOCKER -i docker0 -j RETURN
-A KUBE-MARK-DROP -j MARK --set-xmark 0x8000/0x8000
-A KUBE-MARK-MASQ -j MARK --set-xmark 0x4000/0x4000
-A KUBE-POSTROUTING -m comment --comment "kubernetes service traffic requiring SNAT" -m mark --mark 0x4000/0x4000 -j MASQUERADE
-A KUBE-POSTROUTING -m set --match-set KUBE-LOOP-BACK dst,dst,src -j MASQUERADE
-A KUBE-SERVICES -p tcp -m tcp -m set --match-set KUBE-NODE-PORT-TCP dst -j KUBE-MARK-MASQ
```

因为两台机器使用的kube-proxy小版本不同，因此iptables规则样式不完全相同，但是跟踪“nat.OUTPUT->KUBE-SERVICES”规则时，还是能够发现`正常的机器中多出了一个打标记的规则`：

```
-A KUBE-SERVICES ! -s 172.16.128.0/17 -m comment --comment "Kubernetes service cluster ip + port for masquerade purpose" -m set --match-set KUBE-CLUSTER-IP dst,dst -j KUBE-MARK-MASQ
-A KUBE-MARK-MASQ -j MARK --set-xmark 0x4000/0x4000
-A KUBE-POSTROUTING -m comment --comment "kubernetes service traffic requiring SNAT" -m mark --mark 0x4000/0x4000 -j MASQUERADE
```

上面三条规则的意思是：当源IP不是`-s 172.16.128.0/17`，进入`-j KUBE-MARK-MASQ`，打上标记`0x4000/0x4000`，在随后的POSTROUTING阶段，带有0x4000/0x4000标记的报文会被`SNAT`（-j MASQUERADE）。

前面分析时，在异常的机器上手动添加了SNAT规则之后，问题就消失了，结合起来考虑可以断定原因就是缺少了这条iptables规则。问题是，为什么会缺失？

## 继续调查3

对比正常机器上的kube-proxy和异常机器上的kube-proxy，发现异常机器上的kube-proxy启动时缺失了一个参数：`--cluster-cidr`。 补上这个参数问题消失。

接手的集群是很早部署的，当时部署人员估计就是在网上找了个教程，按照教程部署的，没有搞清楚原理...。在梳理所有机器的配置时，发现除了漏配，还有一部分机器将--cluster-cidr参数配错了，升级kube-proxy并采用了ipvs模式后，才偶然发现问题。

## 注意事项

实际调查过程远比上面记录的过程复杂，走过一个弯路。最开始补上--cluster-cidr参数时，设置成了apiserver中的指定的service-cluster-ip，导致问题继续存在。

查了好久，把[ipvs重新捡起来回顾][3]，然后又是抓包、又是[打印iptables日志][2]的，一度怀疑难道是内核不同，做ip转换的时机不同了？最后用iptables中打印出对应包的日志后，才发现犯了一个低级错误...

**Kube-proxy中的--cluster-dir指定的是集群中pod使用的网段，pod使用的网段和apiserver中指定的service的cluster ip网段不是同一个网段。**

附录一下[iptables打印出的日志][2]，留个纪念：

```
Feb 28 16:48:11 10 kernel: nat output: IN= OUT=lo SRC=172.16.0.1 DST=172.16.0.1 LEN=52 TOS=0x10 PREC=0x00 TTL=64 ID=49938 DF PROTO=TCP SPT=19383 DPT=443 WINDOW=43690 RES=0x00 SYN URGP=0
Feb 28 16:48:11 10 kernel: kube-service before tag: IN= OUT=lo SRC=172.16.0.1 DST=172.16.0.1 LEN=52 TOS=0x10 PREC=0x00 TTL=64 ID=49938 DF PROTO=TCP SPT=19383 DPT=443 WINDOW=43690 RES=0x00 SYN URGP=0
Feb 28 16:48:11 10 kernel: kube-service after tag: IN= OUT=lo SRC=172.16.0.1 DST=172.16.0.1 LEN=52 TOS=0x10 PREC=0x00 TTL=64 ID=49938 DF PROTO=TCP SPT=19383 DPT=443 WINDOW=43690 RES=0x00 SYN URGP=0 MARK=0x4000
Feb 28 16:48:11 10 kernel: filter output : IN= OUT=eth0 SRC=172.16.0.1 DST=10.10.173.203 LEN=52 TOS=0x10 PREC=0x00 TTL=64 ID=49938 DF PROTO=TCP SPT=19383 DPT=443 WINDOW=43690 RES=0x00 SYN URGP=0 MARK=0x4000
Feb 28 16:48:11 10 kernel: nat postrouting: IN= OUT=eth0 SRC=172.16.0.1 DST=10.10.173.203 LEN=52 TOS=0x10 PREC=0x00 TTL=64 ID=49938 DF PROTO=TCP SPT=19383 DPT=443 WINDOW=43690 RES=0x00 SYN URGP=0 MARK=0x4000
Feb 28 16:48:11 10 kernel: post before snat: IN= OUT=eth0 SRC=172.16.0.1 DST=10.10.173.203 LEN=52 TOS=0x10 PREC=0x00 TTL=64 ID=49938 DF PROTO=TCP SPT=19383 DPT=443 WINDOW=43690 RES=0x00 SYN URGP=0 MARK=0x4000
Feb 28 16:48:11 10 kernel: filter output : IN= OUT=eth0 SRC=172.16.0.1 DST=10.10.173.203 LEN=40 TOS=0x10 PREC=0x00 TTL=64 ID=49939 DF PROTO=TCP SPT=19383 DPT=443 WINDOW=342 RES=0x00 ACK URGP=0
```

## 参考

1. [Linux的iptables的常规使用][1]
2. [Linux的iptables规则调试、连接跟踪、报文跟踪][2]
3. [Linux的ipvs的常规使用][3]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2014/04/16/linux-net-iptables.html "Linux的iptables的常规使用"
[2]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/06/15/debug-linux-network.html "Linux的iptables规则调试、连接跟踪、报文跟踪"
[3]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/02/01/ipvs-usage.html "Linux的ipvs的常规使用"
