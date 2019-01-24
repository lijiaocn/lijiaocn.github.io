---
layout: default
title: "将Mac上的iterm改造成类似于SecureCRT/Xshell的ssh登录管理器"
author: 李佶澳
createdate: "2019-01-17 14:06:54 +0800"
changedate: "2019-01-23 13:58:06 +0800"
categories: 技巧
tags: mac
keywords: mac,iterm,SecureCRT,ssh
description: SecureCRT和Xshell的最常用的功能是保存地址、会话复制、上传下载文件，用iterm都可以实现
---

* auto-gen TOC:
{:toc}

## 说明

在[MAC上的SSH客户端工具][1]中记录过iterm的一些用法，这它们抽出来单独作为一篇，同时补充一些内容。

SecureCRT是有Mac版本的，不过是收费的，体验上感觉凑合，免费的Xshell在Windows上也特别好用，但是没有找到它的Mac版。

SecureCRT和Xshell的最常用的功能其实就下面三个：

1. 保存目标机器地址以及登录密码等
2. Session窗口的Clone，可以直接clone当前登录的session，不需要再次登录
3. 用sz/rz命令快速的上传、下载文件 

这三个功能用iterm都可以实现，并且体验很好。

## 实现登录地址保存

详细的配置过程见：[Mac的iterm保存ssh登陆信息方法，类似SecureCRT](https://jingyan.baidu.com/article/af9f5a2d72b16143140a459b.html)

可以为每个远程地址创建一个profile，通过切换profile直接登陆对应的地址。

如果要自动用密码登陆，可以创建一个可执行脚本iterm_login.sh ：

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

>注意在mac上使用这个expect脚本会使后面提到的rz/sz命令失效，怎样避免？见后面关于rz/sz的一章。

然后将profile中的Command命令设置为

	/Users/lijiao/Bin/iterm_login.sh 22 root@10.39.1.217 12345

三个参数分别为：端口、用户名@地址、登陆密码。

上面的脚本只是一个例子，可以根据需要灵活编写自己的脚本。

## 实现Session Clone

[MAC下iterm2 实现clone session](https://blog.csdn.net/xusensen/article/details/72785592)

在`~/.ssh`目录中创建一个config文件，输入如下内容：

	host *
	ControlMaster auto
	ControlPath ~/.ssh/master-%r@%h:%p

这样之后，只有第一次登陆时需要输入密码，打开新窗口登陆同一个地址，会直接复用已经有的session，不需要再次连接、输入密码等。

>~/.ssh/目录下会生成一个名称样式为master-*的sock文件。它是当前的会话session。

[ssh_config](https://linux.die.net/man/5/ssh_config)

## 实现rz/sz上传下载文件

### 方法1：ssh + lrzsz

在Mac上安装lrzsz：

	brew install lrzsz

下载[ZModem integration for iTerm 2](https://github.com/mmastrac/iterm2-zmodem)提供的脚本：

	wget https://raw.githubusercontent.com/mmastrac/iterm2-zmodem/master/iterm2-recv-zmodem.sh
	wget https://raw.githubusercontent.com/mmastrac/iterm2-zmodem/master/iterm2-send-zmodem.sh
	chmod +x *.sh
	mv iterm2*.sh /usr/local/bin/

到iterm的"Preferences->Profiles->Advanced->Triggers"中添加下面两个trigger:

	Regular expression: rz waiting to receive.\*\*B0100
	Action: Run Silent Coprocess
	Parameters: /usr/local/bin/iterm2-send-zmodem.sh
	Instant: checked
	
	Regular expression: \*\*B00000000000000
	Action: Run Silent Coprocess
	Parameters: /usr/local/bin/iterm2-recv-zmodem.sh
	Instant: checked

这种方式直接将rz/sz与iterm关联起来了，可以在iterm中直接使用rz/sz命令，并且会自动在mac上打开文件窗口，便于选取要发送的文件和选择接收文件的存放路径。

但是这种方法有一个问题，如果使用expect登录的，rz和sz命令会无响应。

Github Issuer：[Does not work w/`expect`, `tmux`, `screen`, etc...](https://github.com/mmastrac/iterm2-zmodem/issues/25)

### 方法2：zssh + lrzsz 

在Mac上安装lrzsz：

	brew install lrzsz

在Mac上安装zssh：

	brew install zssh

[zssh (Zmodem SSH) ][2]是一个自身支持rz/sz的shell：

	zssh (Zmodem SSH) is a program for interactively transferring files to a remote machine while using the secure  shell (ssh).  
	It  is intended to be a convenient alternative to scp , allowing to transfer files without  having  to  open another session and re-authenticate oneself. 

然后用下面的脚本替换`实现登录地址保存`中用到的iterm_login.sh脚本：

```bash
#!/bin/bash
# Usage:   iterm_login.sh  PORT  USER  PASSWORD
# Example: iterm_login.sh  22   lijiao@192.168.88.2  123456

PATH=$PATH:/usr/local/bin

cat >/tmp/expect.sh << XXX
#!/usr/bin/expect -f
set timeout 30

spawn zssh -p [lindex \$argv 0] [lindex \$argv 1]
expect {
        "(yes/no)?"
        {send "yes\n";exp_continue}
        "password:"
        {send "[lindex $argv 2]\n"}
        "Last login"
        {interact}
}
interact
XXX

chmod +x /tmp/expect.sh
/tmp/expect.sh $*
```

这里的iterm_login.sh脚本实质就是将原先的expect脚本封装了一次，将登录命令由`ssh`换成了`zssh`。

要把expect脚本封装一次，是因为profile中的shell命令执行时，变量PATH中不包含/usr/local/bin/目录，会导致找不到zssh命令，以及在进入zssh的传输模式后，找不到rz/sz命令，如下：

```
$
zssh > rz
error: execvp rz
```

没有找到设置profile中的PATH变量的方法，所以用一个bash脚本封装了一下， 纯粹是为了加上`PATH=$PATH:/usr/local/bin`，进行曲线救国。 

上传文件操作过程：

```
[192.168.88.11 ~]
$                         << -- 在当前登录的服务器的shell中直接键入`ctrl+2`，进入传输模式
zssh > ls                 << -- 传输模式中，ls命令看到的是mac本地的文件：
Applications            Documents            Library                Pictures     
CLionProjects            Downloads            Movies                Public                cpu_busy.json
zssh > sz cpu_busy.json   << -- 直接用sz命令将本地文件发送到当前登录的服务器
^XB00000000000000rz waiting to receive.Sending: cpu_busy.json
Bytes Sent:  16077   BPS:1220

Transfer complete
rz[192.168.88.11 ~]       << -- 文件发送完成
$
$ ls
cpu_busy.json  cpu_busy.json.bak  ssh.sh
```

下载文件操作过程：

```
[192.168.88.11 ~]
$ sz cpu_busy.json.bak     << -- 在当前登录的服务器中用sz命令发送要下载的文件
*B00000000000000
zssh > cd Desktop          << -- 键入`ctrl+2`进入传输模式后，进入要存放下载的文件的目录
zssh > rz                  << -- 输入rz开始接收文件
rz waiting to receive.Retry 0: Got TIMEOUT
Receiving: cpu_busy.json.bak
Bytes received:   16077/  16077   BPS:816138

Transfer complete
*CÝQ¢3cpu_busy.json.bak16077 13417762337 100644 0 1 16077k×øL
$
```

在Mac的Desktop目录中可以找到刚下载的文件。

## 参考

1. [MAC上的SSH客户端工具][1]
2. [zssh (Zmodem SSH) ][2]

[1]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/03/29/mac-ssh-client-tools.html  "MAC上的SSH客户端工具"
[2]: http://zssh.sourceforge.net/ "zssh (Zmodem SSH) "
