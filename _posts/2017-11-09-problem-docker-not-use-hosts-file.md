---
layout: default
title: 容器内部的go程序没有使用/etc/hosts中记录的地址
author: 李佶澳
createdate: 2017/11/09 20:31:14
last_modified_at: 2017/12/22 16:06:50
categories: 问题
tags: golang
keywords: hosts,nsswitch.conf,go,docker,alpine
description: 运行在容器内的go程序发起http请求的时候，没有使用/etc/host中配置的地址

---

## 目录
* auto-gen TOC:
{:toc}

## 现象

一个用go语言开发程序，运行时会使用"net/http"中的方法"http.Client.Do()"发起http请求：

	http://www.XXX.com

url中的域名对应的ip地址配置在了/etc/hosts中:

	1.1.1.1  www.XXX.com

预期go程序会使用/etc/hosts中配置的IP，但实际使用的却是从dns server中查询到的ip。

## 调查

比较奇怪的是，同样的go程序，同样的容器，在另一个环境中运行的时候，没有这个问题，
在宿主机中运行时也没有问题。

[net.Dial seems to ignore /etc/hosts if I don't provide GODEBUG=netdns=(c)go][1]中提到了nsswitch.conf文件。

查看出现的问题的容器(基于alpine 3.5)，发现容器中没有这个文件。将宿主机(centos7.2)的`/etc/nsswitch.conf`复制到容器中，问题解决。

复制到容器中的nsswitch.conf中明确指定了地址解析顺序：

	$ cat /etc/nsswitch.conf|grep host
	hosts:      files dns myhostname

另外，[pkg/net: Name Resolution][2]提到，可以通过环境变量指定go程序使用的resover:

	export GODEBUG=netdns=go    # force pure Go resolver
	export GODEBUG=netdns=cgo   # force cgo resolver

经验证可行，不过最好还是用nsswitch.conf明确规定地址解析顺序。

另一个环境中不存在这个问题是因为它的dns server中查询不到目标域名，所以使用了/etc/hosts中的地址。

## 经验

在使用容器的时候，要检查下容器中的/etc/nsswitch.conf文件是否存在，是否指定了解析顺序。

## 参考

1. [net.Dial seems to ignore /etc/hosts if I don't provide GODEBUG=netdns=(c)go][1]
2. [pkg/net: Name Resolution][2]

[1]: https://groups.google.com/forum/#!topic/golang-nuts/G-faJ0bthz0  "net.Dial seems to ignore /etc/hosts if I don't provide GODEBUG=netdns=(c)go" 
[2]: https://golang.org//pkg/net/#hdr-Name_Resolution "pkg/net: Name Resolution" 
