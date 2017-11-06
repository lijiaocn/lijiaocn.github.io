---
layout: default
title: kubernetes的Kube-proxy的转发规则分析
author: lijiaocn
createdate: 2017/03/27 10:16:55
changedate: 2017/05/10 11:22:22
categories: 项目
tags: kubernetes
keywords: kube-proxy转发规则分析
description:  kube-proxy转发规则分析

---

* auto-gen TOC:
{:toc}

## 概要

kube-proxy是kubernetes中设置转发规则的组件，通过iptables修改报文的流向。

以下是在一台kubernetes node节点上观察到的结果，kube-proxy是一个独立的组件，下面的观察结果适用于运行在其它地方的kube-proxy。

	$kube-proxy --version
	kubernetes v1.5.2

通过“iptables -L -t [iptables表名]”可以看到，kube-proxy只修改了filter和nat表。

五个检查点:

	              INPUT                 OUPUT
	                .                     |
	               /_\           +--------+
	                |           _|_
	                +--------+  \ /
	                         |   ' 
	                         Router --------|> FORWARD
	                         .   |                |
	                        /_\  +--------+       |
	                         |           _|_     _|_
	               +---------+           \ /     \ /
	               |                      '       ' 
	    PKT ---> PREROUTING              POSTROUTING  ---> PKT

## filter表

filter表中Chain:

	$iptables -t filter -L
	Chain INPUT (policy ACCEPT)
	target     prot opt source               destination
	KUBE-FIREWALL  all  --  anywhere         anywhere

	Chain FORWARD (policy ACCEPT)
	target     prot opt source               destination
	DOCKER-ISOLATION  all  --  anywhere      anywhere
	DOCKER     all  --  anywhere             anywhere
	ACCEPT     all  --  anywhere             anywhere        ctstate RELATED,ESTABLISHED
	ACCEPT     all  --  anywhere             anywhere
	ACCEPT     all  --  anywhere             anywhere

	Chain OUTPUT (policy ACCEPT)
	target     prot opt source               destination
	KUBE-FIREWALL  all  --  anywhere         anywhere
	KUBE-SERVICES  all  --  anywhere         anywhere        /* kubernetes service portals */

	Chain DOCKER (1 references)
	target     prot opt source               destination

	Chain DOCKER-ISOLATION (1 references)
	target     prot opt source               destination
	RETURN     all  --  anywhere             anywhere

	Chain KUBE-FIREWALL (2 references)
	target     prot opt source               destination
	DROP       all  --  anywhere             anywhere        /* kubernetes firewall for dropping marked packets */ mark match 0x8000/0x8000

	Chain KUBE-SERVICES (1 references)
	target     prot opt source               destination
	REJECT     tcp  --  anywhere             10.254.153.61   /* first/webshell:http has no endpoints */ tcp dpt:http reject-with icmp-port-unreachable
	REJECT     tcp  --  anywhere             10.254.153.61   /* first/webshell:ssh has no endpoints */ tcp dpt:ssh reject-with icmp-port-unreachable

可以看到kube-proxy只设置了filter表中INPUT chain和OUTPUT chain，增加了KUBE-FIREWALL和KUBE-SERVICES两个规则链。

所有的出报文都要经过KUBE-SERVICES，如果一个Service没有对应的endpoint，则拒绝将报文发出:

	$./kubectl.sh get services -o wide -n first
	NAME       CLUSTER-IP      EXTERNAL-IP   PORT(S)         AGE       SELECTOR
	webshell   10.254.153.61   <none>        80/TCP,22/TCP   3d        name=webshell,type=pod

注意在KUBE-FIREWALL中，所有标记了0x8000的包都会被丢弃，标记动作可以发生在其它的表中。

## nat表

nat表中设置的规则比较多:

	1. (inbound)在PREROUTING阶段，将所有报文转发到KUBE-SERVICES
	2. (outbound)在OUTPUT阶段，将所有报文转发到KUBE-SERVICES
	3. (outbound)在POSTROUTING阶段，将所有报文转发到KUBE-POSTROUTING

### Chain KUBE-SERVICES

	target     prot opt source               destination
	KUBE-SVC-QMBTMOHBQS5DJKOG  tcp  --  anywhere    10.254.153.61   /* first/webshell:http cluster IP */ tcp dpt:http
	KUBE-SVC-TRP5S22NJPNCPLI2  tcp  --  anywhere    10.254.153.61   /* first/webshell:ssh cluster IP */ tcp dpt:ssh
	KUBE-SVC-XGLOHA7QRQ3V22RZ  tcp  --  anywhere    172.16.60.36    /* kube-system/kubernetes-dashboard: cluster IP */ tcp dpt:http
	KUBE-SVC-NPX46M4PTMTKRN6Y  tcp  --  anywhere    10.254.0.1      /* default/kubernetes:https cluster IP */ tcp dpt:https
	KUBE-NODEPORTS  all  --  anywhere             anywhere          /* kubernetes service nodeports; NOTE: this must be the last rule in this chain */ ADDRTYPE match dst-type LOCAL

可以看到，每个Service的每个服务端口都会在Chain KUBE-SERVICES中有一条对应的规则，发送到clusterIP的报文，将会转发到对应的Service的规则链，没有命中ClusterIP的，转发到KUBE-NODEPORTS。

Chain KUBE-SVC-XGLOHA7QRQ3V22RZ (2 references)

	target     prot opt source               destination
	KUBE-SEP-IIXSAVQWZXISB6RA  all  --  anywhere      anywhere             /* kube-system/kubernetes-dashboard: */

而每一个SERVICE，又将报文提交到了各自的KUBE-SEP-XXX。

Chain KUBE-SEP-IIXSAVQWZXISB6RA (1 references)

	target     prot opt source               destination
	KUBE-MARK-MASQ  all  --  172.16.167.1    anywhere        /* kube-system/kubernetes-dashboard: */
	DNAT            tcp  --  anywhere        anywhere        /* kube-system/kubernetes-dashboard: */ tcp to:172.16.167.1:9090

最后在KUBE-SEP-XX中完整了最终的DNAT，将目的地址转换成了POD的IP和端口。

这里的KUBE-MARK-MASQ为报文打上了标记，表示这个报文是由kubernetes管理的，Kuberntes将会对它进行NAT转换。

	Chain KUBE-MARK-MASQ (3 references)
	target     prot opt source               destination
	MARK       all  --  anywhere             anywhere             MARK or 0x4000

### Chain KUBE-NODEPORTS (1 references)

	target     prot opt source               destination
	KUBE-MARK-MASQ  tcp  --  anywhere             anywhere       /* kube-system/kubernetes-dashboard: */ tcp dpt:31275
	KUBE-SVC-XGLOHA7QRQ3V22RZ  tcp  --  anywhere  anywhere       /* kube-system/kubernetes-dashboard: */ tcp dpt:31275

可以看到，KUBE-NODEPORT中，根据目的端口，将报文转发到对应的Service的规则链，然后就如同在“Chain KUBE-SERVICES”中的过程，将报文转发到了对应的POD。

只有发送到被kubernetes占用的端口的报文才会进入KUBE-MARK-MASQ打上标记，并转发到对应的服务规则链。

例如这里分配给SERVICE的端口是31275，其它端口的包不由kuberentes管理.

### Chain KUBE-POSTROUTING (1 references)

	target     prot opt source               destination
	MASQUERADE  all  --  anywhere             anywhere             /* kubernetes service traffic requiring SNAT */ mark match 0x4000/0x4000

这里表示k8s管理的报文(也就是被标记了0x4000的报文)，在离开Node（物理机）的时候需要进行SNAT转换。

也就是POD发出的报文，

## 报文处理流程图

下面的图中，没有画出KUBE-FIREWALL，KUBE-FIREWALL发生在filter表的INPUT和OUTPUT Chain中，下面的图中(FW)表示带有KUBE-FIREWALL。

(KUBE-SERVICES@nat): 表示nat表中的KUBE-SERVICES chain。

(KUBE-SERVICES@filter,nat): 表示在filter和nat中各有一个名为KUBE-SERVICES的chain。

### 发送到Node的报文的处理过程

报文先经过nat.prerouting，然后经过filter.input。

                                                       (KUBE-SVC@nat)              
                                                         +->SVC1
                    (KUBE-SERVICES@nat)                  |           (KUBE-SEP@nat)
                +--->命中ClusterIP   --------------------+->SVC2 -->SEP1,Mark0x0400,DNAT
    PREROUTING  |                              ^         |                 |
        PKT  -->|                              |         +->SVC3           |
                |                              |                           |
                +--->未命中ClusterIP --->命中服务端口                      |       
                                      |                                    |       
                                      +->未命中服务端口                    |       
                                               |                           |       
                                               v                           v
                                             +-----------------------------+
                                             |         INPUT(FW)           |--> END
                                             +-----------------------------+

### Node发出的报文的处理过程

                                          (KUBE-SVC@nat)              
                   (KUBE-SERVICES         +->SVC1
      OUTPUT(FW)   @filter,nat)           |             (KUBE-SEP@nat)
       PKT  ----->命中ClusterIP ----------+->SVC2 -->SEP1,Mark0x0400,DNAT
              |                           |                 |
              |                           +->SVC3           |
              |                                             |
              |                                             |
              |              +-----------------+            | 
              +------------> |   POSTROUTING   | <----------+
                             +--------+--------+
                                      |         
                                      v         
                              match 0x0400，SNAT@nat                 
                                      |
                                      v
                                     NIC 
