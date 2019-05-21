---
layout: default
title: DNS的benchmark工具
author: 李佶澳
createdate: 2017/08/01 16:00:12
changedate: 2017/09/21 19:26:39
categories: 技巧
tags: linux
keywords: dns,benchmark,namebench
description: 用来测试dns服务器性能的benchmark工具。

---

## 目录
* auto-gen TOC:
{:toc}

## dnsperf 

[dnsperf][4]是一个用来压测dns服务器的工具。

[docker-dnsperf][5]中fork了一份dnsperf的代码，并且做成了docker镜像。

## namebench

[namebench][2]是google的员工做的一个业余项目，通过分析浏览器的历史记录，发现最适合的dns服务器。

在mac上可以直接用brew安装。不过这个工具的目的是找到最快的上网用的dns服务器，而不是压测dns服务。

## 参考

1. [如何写一个DNS压力测试工具][1]
2. [namebench][2]
3. [grc's dns benchmark][3]
4. [dnsperf][4]
5. [docker-dnsperf][5]

[1]: http://www.freebuf.com/column/132793.html "如何写一个DNS压力测试工具"
[2]: https://github.com/google/namebench "namebench" 
[3]: https://www.grc.com/dns/benchmark.htm "grc's dns benchmark"
[4]: https://github.com/cobblau/dnsperf "dnsperf"
[5]: https://github.com/lijiaocn/docker-dnsperf "docker-dnsperf"
