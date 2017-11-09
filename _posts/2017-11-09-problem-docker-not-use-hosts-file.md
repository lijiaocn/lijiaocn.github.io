---
layout: default
title: 容器内部的go程序没有使用/etc/hosts中记录的地址
author: lijiaocn
createdate: 2017/11/09 20:31:14
changedate: 2017/11/09 21:12:26
categories: 问题
tags: golang
keywords: hosts,nsswitch.conf,go,docker,alpine
description: 运行在容器内的go程序发起http请求的时候，没有使用/etc/host中配置的地址

---

* auto-gen TOC:
{:toc}

## 现象

一个用go语言开发程序，运行时会使用"net/http"中的方法请求一个url。

	http://www.XXX.com

url中的域名对应的ip地址配置在了/etc/hosts中:

	1.1.1.1  www.XXX.com

预期go程序会使用/hosts中配置的域名，但实际使用的却是从dns中查询到ip。

## 调查

比较奇怪的是，同样的go程序，同样的容器，在另一个环境中运行的时候，没有这个问题。
在宿主机中运行时也没有问题。

[net.Dial seems to ignore /etc/hosts if I don't provide GODEBUG=netdns=(c)go][1]中提到了nsswitch.conf文件。

查看容器(基于alpine 3.5)，发现容器中没有这个文件。

将宿主机(centos7.2)的`/etc/nsswitch.conf`复制到容器中，问题解决:

	$ cat /etc/nsswitch.conf|grep host
	hosts:      files dns myhostname

另外，[pkg/net: Name Resolution][2]提到，可以通过环境变量指定go程序使用的resover:

	export GODEBUG=netdns=go    # force pure Go resolver
	export GODEBUG=netdns=cgo   # force cgo resolver

经验证可行。

另一个环境中不存在这个问题，是因为它使用的url中域名，在它使用的dns中查询不到，所以使用了/etc/hosts中的地址。

## 解决

在容器中运行go程序中，要检查下容器中是否已经在/etc/nsswitch.conf中指定了域名的解析顺序。

## 参考

1. [net.Dial seems to ignore /etc/hosts if I don't provide GODEBUG=netdns=(c)go][1]
2. [pkg/net: Name Resolution][2]

[1]: https://groups.google.com/forum/#!topic/golang-nuts/G-faJ0bthz0  "net.Dial seems to ignore /etc/hosts if I don't provide GODEBUG=netdns=(c)go" 
[2]: https://golang.org//pkg/net/#hdr-Name_Resolution "pkg/net: Name Resolution" 
