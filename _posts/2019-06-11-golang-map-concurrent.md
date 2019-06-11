---
layout: default
title: "以Go的map是否并发安全为例，介绍最权威的Go语言资料的使用方法"
author: 李佶澳
createdate: "2019-06-11 14:56:05 +0800"
changedate: "2019-06-11 20:54:19 +0800"
categories: 编程 
tags: golang
cover:
keywords: go,map,并发安全,Go语法,Go实现
description: 只有在更新 map 的时候，map 是并发不安全的，全部是读操作的并发是安全的,runtime会监测
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

相比于细节，更在意知识框架的构建和完善，因此有时候对一些技术细节不是很清楚，只是知道如何找答案。最近要认真编码，需要仔细考虑、敲定细节，趁此机会将 Go 语言的知识整理一下。

## 正确使用正确的资料

找到正确的资料、能够正确的使用、正确的理解，是最关键的一步。除非是初学者，否则不要使用二手、三手和倒了无数手的资料，长期来看使用非一手资料，就是在浪费时间和引入错误。 
第一手的资料常常晦涩难懂，需要经过长时间的积累和沉淀，才能比较熟练的运用，刚开始的时候可以用二手、三手的资料帮助理解，但一定要逼迫自己在一手资料中找到解答，这个过程会极大地提升认知。

下面以`Go 语言的 map 是否是并发安全的？`为例，演示一下 Go 语言的一手资料的用法。

## 最权威的 Go 语言资料是？

最权威的 Go 语言资料是什么？Go 官网上的语言规范：[The Go Programming Language Specification][3]。

![The Go Programming Language Specification]({{ site.imglocal }}/article/go-spec-1.png)

这份资料可以理解为 Go 语言的设计文档之一，用表达式的方式对 Go 语言语法做出了最精确的定义，对 Go 语言特性的介绍也是最全面的。掌握了这一份资料，基本就掌握了 100% 的 Go 语言语法和大部分使用时应注意的细节。如果要了解 Go 语言的实现和一些更复杂的内容，需要去查阅其它文档。

Go Spec 不容易看懂，里面的每一个英文单词都认识，但是联在一起就看不明白了。因为这份文档是在从更高的维度描述 Go 语言，使用的是「编程入门」类书籍中没有的术语，譬如`Lexical elements`、`Assignability`，就好像把「桌子」被称为「一种用木材制作而成的家具」一样。习惯了这种表达方式，并知道常见「称呼」的含义后，会发现从这份文档中找答案的效率非常高！


## Go 语言的 map 是否是并发安全的？

到 Go Spec 的 map 章节中阅读 map 的细节：

[![The Go Programming Language Specification - map types]({{ site.imglocal }}/article/go-spec-2.png)](https://golang.org/ref/spec#Map_types)

map 是这样定义的：

```sh
A map is an unordered group of elements of one type, called the element type, 
indexed by a set of unique keys of another type, called the key type. 

MapType     = "map" "[" KeyType "]" ElementType .
KeyType     = Type .
```

从这一章里得知:

1. map 的 key 必须是可比（!=、==），不能是 function、map、slice，如果是接口类型，实际用到的值要可比；
2. 没有初始化的 map 变量的值是 nil，空 map 要用内置的 `make` 函数创建，`未初始化的 map` 不等于 `空的map`；
3. map 的 `size 是无限制的`，用 make 函数创建 map 时，设置的 capacity 不会限制 map 的 size，map 的容量是随着 element 的插入动态增长的；

遗憾的是，在这里没有找到对并发操作的说明，用 golang.org 的站内搜索也没找到相关的信息。

## 扩大搜索范围

这时候用 Google 搜到了 stackoverflow 上的一篇问答：[How safe are Golang maps for concurrent Read/Write operations?][4]，引起注意的是这篇问答中的两个链接：

1. [Go maps in action][5]
2. [Go 1.6 Release Notes: Runtime][6]

第一个连接是 Go 官方的博客的一篇文章，第二个连接是 Go 1.6 的 Releaste Notes，然后又从第一个连接中找到了一个 Go 问答：

1. [Why are map operations not defined to be atomic?][7]

把这个网页下拉到顶部，发现了一个宝藏，[Frequently Asked Questions (FAQ)][8]：

![Frequently Asked Questions (FAQ)]({{ site.imglocal }}/article/go-spec-3.png)

从上面几个链接中的内容得知，Go 的 map 不是并发安全的，这是设计人员经过长期讨论做出的决定：因为大部分使用 map 的场景不需要并发读写，如果将 map 设计为并发安全的，将降低大多数程序的性能。

只有在更新 map 的时候，map 才是并发不安全的，全部是读操作的并发是安全的。Go 1.6 对 map 的并发读写进行了[更明确的规定][6]：当一个协程正在对 map 进行写操作的时候，不能有其它协程在对同一个 map 进行操作，读和写都不行。Go 的 runtime 会对 map 的并发读写进行监测，如果发现不安全的操作直接 crash。

## 找到答案不等于结束

上一节找到了`Go 语言的 map 是否是并发安全的？`这个问题的答案，但是事情没有结束。

在上一节找答案的过程，纯粹是运气好，遇到三篇预期外的文档，一篇是 Go 的[博客文章][5]，一篇是 Go 的 [Release Notes][6]， 一篇是 Go 的 [FAQ](8)，这三篇权威的官方文档给出了准确的答案。

可以使用的权威资料得到了扩充，同时第一个问题来了：这次是运气好，用 Google 找到了这三篇官方的权威的资料，如果下次查找其它问题的答案时，运气没这么好该怎么办？

在 Go 的官网上溜达溜达，最后发现这三篇文档都可以通过 [Documentation](https://golang.org/doc/) 页面中的连接找到：

![The Go Programming Language Specification]({{ site.imglocal }}/article/go-spec-4.png)

![The Go Programming Language Specification]({{ site.imglocal }}/article/go-spec-5.png)

![The Go Programming Language Specification]({{ site.imglocal }}/article/go-spec-6.png)

同时也记住了 golang.org 站内搜索的结果是不全面的，用 Google 进行站内搜索能找到更多内容：

![golang.org 站内搜索]({{ site.imglocal }}/article/go-spec-7.png)

![用 google 对 golang.org 进行搜索]({{ site.imglocal }}/article/go-spec-8.png)

第二个问题是：既然基本类型 map 是并发读写不安全的，那么要怎样实现并发读写安全的 map 呢？自己加锁实现不难，不过继续查一下会发现，Go 标准库中提供了一个通用的、并发读写安全的 [type Map][9]：

![Go Pacakge sync 中并发读写安全的 Map]({{ site.imglocal }}/article/go-spec-9.png)

如果技术热情高涨，可以继续研究下标准库中的实现有什么特点，毕竟提出需求的 [issues/18177](https://github.com/golang/go/issues/18177) 中说了一句：“RWMutex has some scaling issues，巴拉巴拉巴......”。伪技术迷就先告辞做任务去了 😭.....

## 为什么要执着于一手资料？

因为一手资料是最全的、并且会及时更新的资料。一本《Go 语言编程入门》出版之后，几年内都不会变化，而几年的时间对于一门编程语言来说很久了，如果只会从书本里找答案，那么永远不会知道最新的情况。

一手资料以外的资料，很难做到及时更新，所以我们才会经常用 Google 、baidu 搜索到过时的解答和方案。有些非一手资料还是不靠谱的，漫天搜索、东试西试的不仅耗费大量时间，即使碰巧找到正确方法把问题解决了，依旧云里雾里不知其所以然，下次遇到同一个领域的问题，还要漫天搜索。

## 参考

1. [李佶澳的博客][1]
2. [Go: Map types][2]
3. [The Go Programming Language Specification][3]
4. [How safe are Golang maps for concurrent Read/Write operations?][4]
5. [Go maps in action][5]
6. [Go 1.6 Release Notes: Runtime][6]
7. [Why are map operations not defined to be atomic?][7]
8. [Frequently Asked Questions (FAQ)][8]
9. [Go: Package sync][9]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://golang.org/ref/spec#Map_types "Go: Map types"
[3]: https://golang.org/ref/spec "The Go Programming Language Specification"
[4]: https://stackoverflow.com/questions/36167200/how-safe-are-golang-maps-for-concurrent-read-write-operations "How safe are Golang maps for concurrent Read/Write operations?"
[5]: https://blog.golang.org/go-maps-in-action  "Go maps in action"
[6]: https://golang.org/doc/go1.6#runtime "Go 1.6 Release Notes: Runtime"
[7]: https://golang.org/doc/faq#atomic_maps "Why are map operations not defined to be atomic?"
[8]: https://golang.org/doc/faq#atomic_maps "Frequently Asked Questions (FAQ)"
[9]: https://golang.org/pkg/sync/#Map "Go: Package sync"
