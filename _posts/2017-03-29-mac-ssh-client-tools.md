---
layout: default
title: MAC上的SSH客户端工具
author: 李佶澳
createdate: 2017/03/29 18:50:52
changedate: 2017/12/22 17:50:51
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

详细的配置过程见：[Mac的iterm保存ssh登陆信息方法，类似SecureCRT][4]

可以为每个远程地址创建一个profile，通过切换profile直接登陆对应的地址。

如果要自动用密码登陆，可以创建一个可执行脚本：

	#!/usr/bin/expect -f
	
	set timeout 30
	spawn ssh -p [lindex $argv 0] [lindex $argv 1]
	expect {
	        "(yes/no)?"
	        {send "yes\n";exp_continue}
	        "password:"
	        {send "[lindex $argv 2]\n"}
	        "Last login"
	        {interact}
	}
	interact

然后将profile中的Command命令设置为

	/Users/lijiao/Bin/iterm_login.sh 22 root@10.39.1.217 12345

三个参数分别为：端口、用户名@地址、登陆密码。

### 配置lrzsz

[ZModem integration for iTerm 2](https://github.com/mmastrac/iterm2-zmodem)

	brew install lrzsz

	wget https://raw.githubusercontent.com/mmastrac/iterm2-zmodem/master/iterm2-recv-zmodem.sh
	wget https://raw.githubusercontent.com/mmastrac/iterm2-zmodem/master/iterm2-send-zmodem.sh
	chmod +x *.sh
	mv iterm2*.sh /usr/local/bin/

然后到iterm的"Preferences->Profiles->Advanced->Triggers"中添加下面两个trigger:

    Regular expression: rz waiting to receive.\*\*B0100
    Action: Run Silent Coprocess
    Parameters: /usr/local/bin/iterm2-send-zmodem.sh
    Instant: checked

    Regular expression: \*\*B00000000000000
    Action: Run Silent Coprocess
    Parameters: /usr/local/bin/iterm2-recv-zmodem.sh
    Instant: checked

## ssh 实现Session Clone

[MAC下iterm2 实现clone session](https://blog.csdn.net/xusensen/article/details/72785592)

在~目录下的.ssh文件夹冲创建一个config文件，文件内容输入：

	host *
	ControlMaster auto
	ControlPath ~/.ssh/master-%r@%h:%p

然后只需要第一次登陆时输入密码，打开新窗口再次登陆，直接输入名称就可以了，不需要密码。

> ~/.ssh/目录下会发现master-*的sock文件。它记录了你目前登录到的机器，这样的话，你登录同样的机器就会重用同一个链接了。

[ssh_config](https://linux.die.net/man/5/ssh_config)

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
2. [Mac 让 iTerm2 记住用户名密码 expect 脚本][2]
3. [Create SSH Bookmarks in Terminal][3]
4. [Mac的iterm保存ssh登陆信息方法，类似SecureCRT][4]

[1]: http://www.emtec.com/download.html "ZOC download"
[2]: http://blog.csdn.net/fenglailea/article/details/50895867 "Mac 让 iTerm2 记住用户名密码 expect 脚本"
[3]: http://osxdaily.com/2012/06/03/create-ssh-bookmarks-in-terminal-for-mac-os-x/ "Create SSH Bookmarks in Terminal"
[4]: https://jingyan.baidu.com/article/af9f5a2d72b16143140a459b.html  "Mac的iterm保存ssh登陆信息方法，类似SecureCRT"
