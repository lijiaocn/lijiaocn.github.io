---
layout: default
title: MAC上的SSH客户端工具
author: lijiaocn
createdate: 2017/03/29 18:50:52
changedate: 2017/12/22 15:40:41
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

	brew install caskroom/cask/zoc

## iterm

免费

	brew search iterm

### 用iterm的profile保存远程地址

可以为每个远程地址创建一个profile，通过切换profile直接登陆对应的地址。

如果要自动用密码登陆，可以创建一个可执行脚本：

	#!/usr/bin/expect
	
	set timeout 30
	spawn ssh -p [lindex $argv 0] [lindex $argv 1]
	expect {
	        "(yes/no)?"
	        {send "yes\n";exp_continue}
	        "password:"
	        {send "[lindex $argv 2]\n"}
	}
	interact

然后将profile中的Command命令设置为

	/Users/lijiao/Bin/iterm_login.sh 22 root@10.39.1.217 12345

三个参数分别为：端口、用户名@地址、登陆密码。

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
