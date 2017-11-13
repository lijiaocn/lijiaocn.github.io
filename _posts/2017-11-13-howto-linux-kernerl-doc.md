---
layout: default
title: 怎样获取linux kernel相关的知识？
author: lijiaocn
createdate: 2017/11/13 10:55:50
changedate: 2017/11/13 18:03:58
categories: 方法
tags: linux
keywords: kernel,linux,获取知识,documention
description: 使用linux是躲不开的kernel，但kernel的内容又实在是太多了

---

* auto-gen TOC:
{:toc}

## 说明

使用linux是躲不开的kernel，但是kernel的内容实在是太多了，随便一个子系统，都可以出好几本书。

期望在遇到问题之前，将kernel的知识全部了解，是不实际，需要找到一种方法，能够快速地找到与问题相关的知识。

百度和google都是不靠谱的，因为通过搜索只能得到零碎、不一定正确的内容，构建起知识体系，加注第一手资料的索引才是王道。

幸好，kernel的文档很丰富、并且很集中： [linux kernel documentation][1]

kernel.org中收集的文档对各自的问题有非常系统的讲解： [][]

redhat的产品文档是特别优秀的资料：[Product Documentation for Red Hat Enterprise Linux][5]

redhat的知识库也是很靠谱的：[redhat knowledgebase][6]

## 00-INDEX

每个目录下通常都有一个名为`00_INDEX`的文件，对当前目录下的所有文件和和子目录做了说明，例如根目录下[Documentation 00-INDEX][3]。

## sysctl 

内核有非常多可调整参数，它们在/proc和/sys目录中以文件的形式暴露出来。

Kernnel的[Documentation/sysctl][12]目录汇聚了所有内核参数。

## memory

[Documentation/vm][10]

[Understanding the Linux Virtual Memory Manager][7]

[Overview of Linux Memory Management Concepts: Slabs][9]

[Linux slab 分配器剖析][4]

[Where is my memory?][11]


可以用命令`slabtop`查看kernel memory的使用情况，或者直接查看`/proc/slabinfo`。

## networking

网络相关的文档位于[Documentation/networking][2]中。

## 参考

1. [linux kernel documentation][1]
2. [Documentation/networking][2]
3. [Documentation 00-INDEX][3]
4. [Linux slab 分配器剖析][4]
5. [Product Documentation for Red Hat Enterprise Linux][5]
6. [redhat knowledgebase][6]
7. [Understanding the Linux Virtual Memory Manager][7]
8. [kernel docs][8]
9. [Overview of Linux Memory Management Concepts: Slabs][9]
10. [Documentation/vm][10]
11. [Where is my memory?][11]
12. [Documentation/sysctl][12]

[1]: https://www.kernel.org/doc/Documentation/  "linux kernel documentation" 
[2]: https://www.kernel.org/doc/Documentation/networking/ "Documentation/networking"
[3]: https://www.kernel.org/doc/Documentation/00-INDEX "Documentation 00-INDEX"
[4]: https://www.ibm.com/developerworks/cn/linux/l-linux-slab-allocator/index.html "Linux slab 分配器剖析"
[5]: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/ "Product Documentation for Red Hat Enterprise Linux"
[6]: https://access.redhat.com/search/#/knowledgebase  "redhat knowledgebase"
[7]: https://www.kernel.org/doc/gorman/html/understand/  "Understanding the Linux Virtual Memory Manager"
[8]: https://www.kernel.org/doc/  "kernel docs"
[9]: http://www.secretmango.com/jimb/Whitepapers/slabs/slab.html "Overview of Linux Memory Management Concepts: Slabs"
[10]: https://www.kernel.org/doc/Documentation/vm/  "Documentation/vm"
[11]: https://www.dedoimedo.com/computers/slabinfo.html  "Where is my memory?"
[12]: https://www.kernel.org/doc/Documentation/sysctl/  "Documentation/sysctl"

