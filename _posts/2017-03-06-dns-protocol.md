---
layout: default
title:  DNS，DNS-Domain Name System
author: lijiaocn
createdate: 2018/06/28 18:57:00
changedate: 2018/06/28 18:59:16
categories: 编程
tags:  dns
keywords:
description: DNS-Domain Name System是互联网服务的基石，是互联网服务的第一入口。

---

* auto-gen TOC:
{:toc}

## 说明

DNS-Domain Name System是互联网服务的基石，是互联网服务的第一入口。

[rfc-1035 | Domain names - implementation and specification ][1]中规定了DNS系统的实现方式和通信协议。

<!--more-->

    Obsoletes RFC 973, RFC 882, RFC 883,
    Updated by RFC 1101, RFC 1183, RFC 1348, RFC 1876, RFC 1982, RFC 1995,
    RFC 1996, RFC 2065, RFC 2136, RFC 2181, RFC 2137, RFC 2308, RFC 2535,
    RFC 2673, RFC 2845, RFC 3425, RFC 3658, RFC 4033, RFC 4034, RFC 4035,
    RFC 4343, RFC 5936, RFC 5966, RFC 6604, RFC 7766, Errata


## DNS系统结构

DNS服务由resolver和name server两部分组成。

<img src="https://k8s.top/wp-content/uploads/2017/01/dns-arch.png" alt="" width="600" height="400" class="alignnone size-full wp-image-243" />

**resolver**是用户直接面对的、运行在本地的一个agent，负责接收用户输入的域名，然后主动向name server发起查询，并将name server返回的域名信息呈现给用户。

**name server**是存储域名信息的一组服务器（dns服务器），负责接收resolver的查询请求、向resolver返回域名信息。

域名信息分布存储在多个name server上，所有的域名信息组成了一个树状结构（domain space）。

每个name server以zone为单位存储域名信息，一个zone是域名空间中的一个子树（subtree），在多台name server上冗余存储，name server之间通过dns的zone传送协议，同步更新zone的每个备份。

name server以本地master file中或者另一台name server上（通过dns的zone传送协议）的信息为最新信息，定期检查、更新zone中的信息，确保zone中的信息是最新的。

**master file** 是用来存储域名信息的文件。

为了降低开销和加快响应，name server还会在本地维护一份缓存数据，缓存曾经响应过的域名信息。

## 约定

域名由多个label组成，label之间以“.”号间隔，label由字母、数字和“-”组成，最长63个字符。

拼写相同，但是字母大小写不同的域名被视为同一个域名，域名最长255个字节。

    <domain> ::= <subdomain> | " "
    <subdomain> ::= <label> | <subdomain> "." <label>
    <label> ::= <letter> [ [ <ldh-str> ] <let-dig> ]
    <ldh-str> ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
    <let-dig-hyp> ::= <let-dig> | "-"
    <let-dig> ::= <letter> | <digit>
    <letter> ::= any one of the 52 alphabetic characters A through Z in
                 upper case and a through z in lower case
    <digit> ::= any one of the ten digits 0 through 9


## RR (Resource Record)

RR是name server中记录的域名信息，用户发起域名查询的时候，正是为了获得对应的RR。每一个RR按照如下格式传输。

<img src="https://k8s.top/wp-content/uploads/2017/01/dns-RR.png" alt="" width="600" height="300" class="alignnone size-full wp-image-248" />

    NAME:  名称
    TYPE:  类型
    CLASS: 类别
    TTL:   缓存有效时间，如果为0，表示该RR不能被缓存
    RDLENGTH: RDATA数据长度
    RDATA：RR数据


### RR.TYPE

rfc-1035中定义了16种类型的RR：

<img src="https://k8s.top/wp-content/uploads/2017/01/dns-RR-type.png" alt="" width="600" height="756" class="alignnone size-full wp-image-253" />

除了上面的16中类型的RR，查询的时候还可以使用16中类型之外的类型，以此实现一些特定的功能：

<img src="https://k8s.top/wp-content/uploads/2017/01/dns-RR-query-type.png" alt="" width="600" height="100" class="alignnone size-full wp-image-258" />

另外，在rfc-2782（替换了更早的rfc-2052）定义了一种新的RR：SRV。SRV中记录了指定服务的服务地址、服务端口和优先级，适用于需要发现服务地址的场景。k8s.top将会单独写一篇介绍SRV的文章。

### RR.CLASS

rfc-1035定义了4种类别：

<img src="https://k8s.top/wp-content/uploads/2017/01/dns-RR-class.png" alt="" width="600" height="100" class="alignnone size-full wp-image-261" />

与RR.TYPE类似，查询的时候还可以使用4中类别的之外的类别，以此实现一些特定的功能：

<img src="https://k8s.top/wp-content/uploads/2017/01/dns-RR-query-class.png" alt="" width="600" height="30" class="alignnone size-full wp-image-263" />

## 反向查询

在已知IP的情况下，可以通过反向查询查找到IP对应的域名。也可以通过反向查询方式，查询指定网段的网关的域名。

反向查询时，需要使用特定格式的域名，假设要查询IP地址“p1.p2.p3.p4”的域名，查询的目标域名为：

    p4.p3.p2.p1.IN-ADDR.ARPA


如果要查找网段“p1.p2.p3.0/24”的网关，查询的目标域名为：

    p3.p2.p1.IN-ADDR.ARPA


注意，在构造目标查询域名的时候，需要将IP反转，这样与域名的命名规则保持一致，越前面的label越具体。

## RR TYPEs介绍

### CNAME

rfc-1035，RDATA中记录的是canonical/primary name，name server需要继续查询，处理逻辑见rfc-1034。

### HINFO

rfc-1035，RDATA中记录的CPU和OS信息，value格式见rfc-1010。

### MX

rfc-1035，RDATA中记录优先级和邮件交换服务器域名，见rfc-974。

### NS

rfc-1035，RDATA中记录包含由目标域名信息的权威（authoritative）服务器的域名。

### PTR

rfc-1035，RDATA记录目标域名空间中另一个地址，不会引发继续查询。

### SOA

rfc-1035，RDATA中记录zone的来源地址、维护人邮箱、版本号、刷新时间间隔、重试次数、有效期、最小TTL等管理信息。

### TXT

rfc-1035，RDATA中记录文本描述信息。

### A

rfc-1035，RDATA中记录的32位的IP地址。

### WKS

rfc-1035，RDATA中记录开放的服务端口。

### SRV

rfc-2782，RDATA中记录目标服务的服务地址、服务端口和优先级。k8s.top将单独写一篇文章介绍SRV。

## rfc更新记录

### rfc-1101, unknown, DNS encoding of network names and other types, april 1989

### rfc-1183, experimental, New DNS RR DEfinitions, october 1990

#### rfc-5864, proposed standard, DNS SRV Resource Records for AFS, april 2010

#### rfc-6895, best current practice, Domain Name System(DNS) IANA Considerations, april 2013

### rfc-1348, experimental, DNS NSAP RRs, july 1992

### rfc-1876, experimental, A Means for Expressing Location Information in the Domain Name System, january 1996

### rfc-1982, proposed standard, Serial Number Arithmetic, august 1996

### rfc-1995, proposed standard, Incremental Zone Transfer in DNS, august 1996

### rfc-1996, proposed standard, A Mechanism for Prompt Notification of Zone Changes(DNS NOTIFY), august 1996

### rfc-2065, proposed standard, Domain Name System Security Extensions, january 1997

### rfc-2136, proposed standard, Dynamic Updates in the Domain Name System(DNS UPDATE), aprial 1997

### rfc-2181, proposed standard, Clarifications to the DNS Specification, july 1997

### rfc-2137, proposed standard, Secure Domain Name System Dynamic Update, april 1997

### rfc-2308, proposed standard, Negative Caching of DNS Queries(DNS NCACHE), march 1998

### rfc-2535, proposed standard, Domain Name System Security Extensions, march 1999

### rfc-2782, proposed standard, A DNS RR for specifying the location of services(DNS SRV),february 2000

### rfc-2845, proposed standard, Secret Key Transaction Authentication for DNS(TSIG), may 2000

### rfc-3425, proposed standard, Obsoleting IQUERY, novemeber 2002

### rfc-3658, proposed standard, Delegation Signer(DS) Resource Record(RR), decemeter 2003

### rfc-4033, proposed standard, DNS Security Introduction and Requirements, march 2005

### rfc-4034, proposed standard, Resource Records for the DNS Security Extensions, march 2005

### rfc-4035, proposed standard, Protocol Modifications for the DNS Security Extensions, march 2005

### rfc-4343, proposed standard, Domain Name System(DNS) Case Insensitivity Clarification, january 2006

### rfc-5936, proposed standard, DNS Zone Transfer Protocol(AXFR), june 2010

### rfc-6604, proposed standard, xNAME RECODE and Status Bits Clarification, april 2012

### rfc-7766, proposed standard, DNS Transport over TCP - Implementation Requirements, march 2016

## 参考

1. [rfc1035][1]

[1]: https://www.rfc-editor.org/rfc/pdfrfc/rfc1035.txt.pdf
