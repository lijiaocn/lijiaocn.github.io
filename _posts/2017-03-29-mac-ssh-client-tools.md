---
layout: default
title: MAC上的SSH客户端工具
author: lijiaocn
createdate: 2017/03/29 18:50:52
changedate: 2017/05/20 16:03:27
categories: 技巧
tags: mac ssh
keywords: MAC,SSH客户端,ZOC
description:  mac上虽然有iterm等shell终端，可以直接ssh登陆，但是不能保存机器列表和密码，每次输入IP，比较烦。可以使用ZOC

---

* auto-gen TOC:
{:toc}

## securtCRT 

收费

## ZOC 

收费

## ~/.ssh/config

在~/.ssh/目录中创建config文件，在其中按照如下格式记录主机:

	Host T1
	    HostName 10.39.0.12
	    User root
	    Port 22
	    IdentityFile ~/.ssh/T1.key
	
	Host T2
	    HostName 10.39.0.42
	    User root
	    Port 22
	    IdentityFile ~/.ssh/T2.key

Identityfile是登陆机的私钥，公钥追加写入到目标机器的~/.ssh/authorized_keys文件。

生成key:

	ssh-keygen -t rsa -P ''

登陆T1:

	ssh T1

## 参考

1. [ZOC download][1]

[1]: http://www.emtec.com/download.html "ZOC download"
