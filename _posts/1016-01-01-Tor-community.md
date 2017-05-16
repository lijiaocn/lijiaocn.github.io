---
layout: default
title: Tor的社区资源与文章汇总
author: lijiaocn
createdate: 2017/05/14 14:40:05
changedate: 2017/05/15 22:09:32
categories: 手册
tags: tor
keywords: tor,tor的社区资源
description: tor是一个有名的网络匿名工具，大名顶顶的暗网就是基于tor形成的。

---

* auto-gen TOC:
{:toc}

## 下载

Tor是开源的，它的源码托管在它自己的git服务器上: [Tor' git repo][3]。

Tor的git服务器被墙了，获取源码需要翻墙，有人在Github上做了一个Tor的[repo mirror][4]。

Tor的网站了提供了最新稳定版的软件和源码的下载，[Tor's download][8]。

## 编译

在tor项目根目录下的INSTALL文件中，介绍了编译方法，包括怎样编译一个静态链接的tor程序。

[Running the Tor client on Linux/BSD/Unix][9]介绍了编译后，怎样运行。

## 配置

tor参数`-f`，用来指定配置文件。

[Tor's manual][10]中介绍了Tor的使用和配置。

epel源中提供了tor，可以安装使用:

	yum install -y epel-release
	yum install -y tor

默认配置文件为/etc/tor/torrc。

### Socks Service

	SocksListenAddress 127.0.0.1
	SocksListenAddress 192.168.x.x:9100
	SocksListenAddress 0.0.0.0:9100

## 参考

1. [Tor's website][1]
2. [Tor's git repo][2]
3. [Tor's trac][3]
4. [Tor's github mirror][4]
5. [Tor's wiki][5]
6. [HOWTO:Run a transparent TOR proxy on Openwrt][6]
7. [Tor's release plan][7]
8. [Tor's download][8]
9. [Running the Tor client on Linux/BSD/Unix][9]
10. [Tor's manual][10]
11. [Tor's communication principle][11]
12. [Why can a Tor exit node decrypt data, but not the entry node?][12]
13. [Tor's FAQ][13]
14. [key establishment][14]
15. [OpenWrt Tor proxy and anonymizing middlebox setup guide][15]

[1]: https://www.torproject.org/  "Tor's website"
[2]: https://gitweb.torproject.org/  "Tor's git repo" 
[3]: https://trac.torproject.org/projects/tor "Tor's trac"
[4]: https://github.com/torproject/ "Tor's github mirror"
[5]: https://trac.torproject.org/projects/tor/wiki/WikiStart "Tor's wiki"
[6]: https://forum.openwrt.org/viewtopic.php?id=27354 "HOWTO:Run a transparent TOR proxy on Openwrt"
[7]: https://trac.torproject.org/projects/tor/wiki/org/teams/NetworkTeam/CoreTorReleases "Tor's release plan"
[8]: https://www.torproject.org/download/download.html.en "Tor's download"
[9]: https://www.torproject.org/docs/tor-doc-unix "Running the Tor client on Linux/BSD/Unix"
[10]: https://www.torproject.org/docs/tor-manual.html.en "Tor's manual"
[11]: https://www.torproject.org/about/overview.html.en "Tor's communication principle"
[12]: https://security.stackexchange.com/questions/36571/why-can-a-tor-exit-node-decrypt-data-but-not-the-entry-node "Why can a Tor exit node decrypt data, but not the entry node?"
[13]: https://www.torproject.org/docs/faq "Tor's FAQ"
[14]: https://www.zhihu.com/question/25116415 "key establishment"
[15]: https://fixmynix.com/openwrt-tor-proxy-setup/ "OpenWrt Tor proxy and anonymizing middlebox setup guide"
