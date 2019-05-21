---
layout: default
title: "Linux内核功能eBPF入门学习（一）：BPF、eBPF、BCC等基本概念"
author: 李佶澳
createdate: "2019-02-22 17:11:28 +0800"
changedate: "2019-03-01 14:51:52 +0800"
categories:  技巧
tags: linux
keywords: ebpf,bpf,bcc,入门介绍
description: eBPF支持在用户态将C语言编写的“内核代码”注入到内核中运行，bcc是python库封装了C代码的注入操作
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

eBPF是kernel 3.15中引入的全新设计，将原先的BPF发展成一个指令集更复杂、应用范围更广的“内核虚拟机”。

eBPF支持在用户态将C语言编写的一小段“内核代码”注入到内核中运行，注入时要先用llvm编译得到使用BPF指令集的elf文件，然后从elf文件中解析出可以注入内核的部分，最后用bpf_load_program方法完成注入。
用户态程序和注入到内核中的程序通过共用一个位于内核中`map`实现通信。为了防止注入的代码导致内核崩溃，eBPF会对注入的代码进行严格检查，拒绝不合格的代码的注入。

[BCC][2]是一个python库，实现了map创建、代码编译、解析、注入等操作，使开发人员只需聚焦于用C语言开发要注入的内核代码。
文章[eBPF简史][1]从eBPF的前身BPF讲起，将eBPF的来龙去脉介绍的很明白，是难得的好文章，建议直接过去阅读，这里就不摘抄了。
[BPF: the universal in-kernel virtual machine][18]介绍了BPF从网络子系统中的报文复制功能到内核通用虚拟机eBPF的演变过程。

## BPF

BPF是很早就有的内核特性，在内核中将报文“镜像”了一份，并用BPF指令检查镜像出来的报文、决定报文的去留，即在1)抛弃报文和2)将其复制到用户空间之间抉择。

具体实现就不去了解了，BPF好歹设计了一套指令集，虽然比较简单，但没有扎实的编译原理基础，估计一时半会儿也看不懂，这里只收集一下相关文档： 

1. [The BSD Packet Filter: A New Architecture for User-level Packet Capture][5]
2. [Kernel Documentation：BPF Documentation][3]
3. [Linux Socket Filtering aka Berkeley Packet Filter (BPF)][4]

另外学到了一个新知识，tcpdump使用的libpcap是基于BPF的，在使用tcpdump或者libpcap时传入的“host 192.168.1.1”、“tcp and port 80”等是`过滤表达式`。

过滤表达式会被编译成`BPF指令`，在tcpdump命令后面加上`-d`参数可以看到：

```
$ tcpdump -d -i eth0 tcp and port 80
(000) ldh      [12]
(001) jeq      #0x86dd          jt 2	jf 8
(002) ldb      [20]
(003) jeq      #0x6             jt 4	jf 19
(004) ldh      [54]
(005) jeq      #0x50            jt 18	jf 6
(006) ldh      [56]
(007) jeq      #0x50            jt 18	jf 19
(008) jeq      #0x800           jt 9	jf 19
(009) ldb      [23]
(010) jeq      #0x6             jt 11	jf 19
(011) ldh      [20]
(012) jset     #0x1fff          jt 19	jf 13
(013) ldxb     4*([14]&0xf)
(014) ldh      [x + 14]
(015) jeq      #0x50            jt 18	jf 16
(016) ldh      [x + 16]
(017) jeq      #0x50            jt 18	jf 19
(018) ret      #65535
(019) ret      #0
```

这些BPF指令是在内核中被BPF解释执行的。

## eBPF带来的新变化

原先的BPF依然支持，用cBPF指代。eBPF全新设计了更丰富的指令集、增加了寄存器，性能大幅提高：

>The original patch that added support for eBPF in the 3.15 kernel showed that eBPF was up to four times faster on x86-64 than the old classic BPF (cBPF) implementation for some network filter microbenchmarks, and most were 1.5 times faster.


增加了名为`bpf`的系统调用，为用户态程序提供与内核中的eBPF进行交互的途径：

```c
int bpf(int cmd, union bpf_attr *attr, unsigned int size);
```

`cmd`是eBPF支持的cmd，分为三类： 操作注入的代码、操作用于通信的map、前两个操作的混合。

通过eBPF可以做更多的事情，不再仅仅是进行报文复制和过滤，网络方面可以切入到更深的层次，在更“靠前”的阶段进行干预，例如[XDP][7]借助eBPF在报文刚收到的时候就进行干预，[使用XDP(eXpress Data Path)防御DDoS攻击][19]。

还可以：

1. 限制进程可以使用的系统调用，[seccomp](https://lwn.net/Articles/656307/);

2. 输出内核中的数据，进行内核调试、性能分析、调用跟踪；

3. 调试用户态程序，[Userland Statically Defined Tracepoints ](https://www.memsql.com/blog/bpf-linux-performance/)；

## eBPF使用

eBPF是kernel 3.15开始支持的，在kernel 3.17源码中获得了一个单独的bpf目录，建议直接使用3.17以及以上版本的内核。下面这四篇文章可以帮你搭建对eBPF的认知框架：

1. [LWN.net: A thorough introduction to eBPF][6]

2. [LWN.net: An introduction to the BPF Compiler Collection][11]

3. [LWN.net: Some advanced BCC topics][13]

4. [LWN.net: Using user-space tracepoints with BPF][14]

### 升级内核

见：[CentOS7/6内核升级的简单方法：借助ELRepo，用yum命令更新内核][10]。

### eBPF代码示例

[samples/bpf][12]，暂时没有找到相关资料，目前以学习bcc的使用为主，2019-02-25 18:11:40

### eBPF代码编译装载

同上一节。

## 使用BCC简化eBPF应用开发过程

[BCC][2]首先提供了一个名为bcc的python库，简化了eBPF应用的开发过程，然后它收集大量的eBPF应用，主要是性能分析相关的。
可以直接使用bcc已经收集的命令调查问题（[bcc Tutorial][16]），也可以用bcc提供的python库自己开发eBPF应用（[bcc Python Developer Tutorial][17]）。

Kernel版本需要是4.1以上（2019-02-25 18:08:15），并且要安装kernel-devel，如果没有安装kernel-devel，eBPF应用会汇编译失败（bcc收集的命令运行时也会出现下面错误）：

```
# execsnoop
chdir(/lib/modules/4.20.12-1.el7.elrepo.x86_64/build): No such file or directory
Traceback (most recent call last):
  File "/usr/share/bcc/tools/execsnoop", line 166, in <module>
    b = BPF(text=bpf_text)
  File "/usr/lib/python2.7/site-packages/bcc/__init__.py", line 318, in __init__
    raise Exception("Failed to compile BPF text")
Exception: Failed to compile BPF text
```

### BCC安装

直接用yum安装：

```
yum install bcc-tools
```

用`rpm -ql`可以看到所有bcc文件，`tools/`目录中是bcc提供的命令，可以用`man`查看对应的手册，比如`man bcc-argdist`：

```
$ rpm -ql bcc-tools
/usr/share/bcc
/usr/share/bcc/introspection
/usr/share/bcc/introspection/bps
/usr/share/bcc/tools
/usr/share/bcc/tools/argdist
/usr/share/bcc/tools/bashreadline
/usr/share/bcc/tools/biolatency
...
/usr/share/bcc/tools/doc
/usr/share/bcc/tools/doc/argdist_example.txt
/usr/share/bcc/tools/doc/bashreadline_example.txt
/usr/share/bcc/tools/doc/biolatency_example.txt
/usr/share/bcc/tools/doc/biosnoop_example.txt
...
/usr/share/man/man8/bcc-argdist.8.gz
/usr/share/man/man8/bcc-bashreadline.8.gz
/usr/share/man/man8/bcc-biolatency.8.gz
/usr/share/man/man8/bcc-biosnoop.8.gz
/usr/share/man/man8/bcc-biotop.8.gz
```

### BCC收集的eBPF应用

BCC的命令较多，单开一篇笔记，这篇到此为止。

## 参考

1. [张亦鸣: eBPF 简史][1]
2. [BCC - Tools for BPF-based Linux IO analysis, networking, monitoring, and more ][2]
3. [Kernel Documentation：BPF Documentation][3]
4. [Linux Socket Filtering aka Berkeley Packet Filter (BPF)][4]
5. [The BSD Packet Filter: A New Architecture for User-level Packet Capture][5]
6. [A thorough introduction to eBPF][6]
7. [XDP：eXpress Data Path][7]
8. [How to Upgrade Kernel on CentOS 7][8]
9. [Welcome to the ELRepo Project][9]
10. [CentOS7/6内核升级的简单方法：借助ELRepo，用yum命令更新内核][10]
11. [LWN.net: An introduction to the BPF Compiler Collection][11]
12. [samples/bpf][12]
13. [LWN.net: Some advanced BCC topics][13]
14. [LWN.net: Using user-space tracepoints with BPF][14]
15. [Installing BCC][15]
16. [bcc Tutorial][16]
17. [bcc Python Developer Tutorial][17]
18. [BPF: the universal in-kernel virtual machine][18]
19. [使用XDP(eXpress Data Path)防御DDoS攻击][19]

[1]: https://www.ibm.com/developerworks/cn/linux/l-lo-eBPF-history/index.html "张亦鸣: eBPF 简史"
[2]: https://github.com/iovisor/bcc "BCC - Tools for BPF-based Linux IO analysis, networking, monitoring, and more "
[3]: https://www.kernel.org/doc/Documentation/bpf/ "Kernel Documentation：BPF Documentation"
[4]: https://www.kernel.org/doc/Documentation/networking/filter.txt "Linux Socket Filtering aka Berkeley Packet Filter (BPF)"
[5]: https://www.tcpdump.org/papers/bpf-usenix93.pdf "The BSD Packet Filter: A New Architecture for User-level Packet Capture"
[6]: https://lwn.net/Articles/740157/ "A thorough introduction to eBPF"
[7]: https://www.iovisor.org/technology/xdp "XDP：eXpress Data Path"
[8]: https://www.howtoforge.com/tutorial/how-to-upgrade-kernel-in-centos-7-server/ "How to Upgrade Kernel on CentOS 7"
[9]: http://elrepo.org/tiki/tiki-index.php "Welcome to the ELRepo Project"
[10]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/02/25/centos-kernel-upgrade.html "CentOS7/6内核升级的简单方法：借助ELRepo，用yum命令更新内核"
[11]: https://lwn.net/Articles/742082/ "LWN.net: An introduction to the BPF Compiler Collection"
[12]: https://elixir.bootlin.com/linux/v4.14.2/source/samples/bpf "samples/bpf"
[13]: https://lwn.net/Articles/747640/ "LWN.net: Some advanced BCC topics"
[14]: https://lwn.net/Articles/753601/ "LWN.net: Using user-space tracepoints with BPF"
[15]: https://github.com/iovisor/bcc/blob/master/INSTALL.md "Installing BCC"
[16]: https://github.com/iovisor/bcc/blob/master/docs/tutorial.md "bcc Tutorial"
[17]: https://github.com/iovisor/bcc/blob/master/docs/tutorial_bcc_python_developer.md "bcc Python Developer Tutorial"
[18]: https://lwn.net/Articles/599755/ "BPF: the universal in-kernel virtual machine"
[19]: https://blog.csdn.net/dog250/article/details/77993218 "使用XDP(eXpress Data Path)防御DDoS攻击"
