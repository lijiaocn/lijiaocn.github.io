---
layout: default
title: "Web开发平台OpenResty（三）：火焰图性能分析"
author: 李佶澳
createdate: "2018-11-02 16:31:57 +0800"
changedate: "2018-11-02 16:31:57 +0800"
categories: 编程
tags: openresty
keywords: openresty,nginx,lua,openresty开发
description: 通过火焰图观察OpenResty函数调用情况，每个函数的调用耗时，找出性能瓶颈
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这是[Web开发平台OpenResty系列文章](https://www.lijiaocn.com/tags/class.html)中的一篇。

以下操作在CentOS7上进行，[火焰图分析法][2]非常直观好用，可以用多种方式生成，也可以用于各种场景。

下面是用火焰图分析OpenResty应用性能瓶颈的方法，用[systemtap][4]采集信息。

## 安装SystemTAP

[SystemTAP][4]可以收集运行中的Linux系统的所有信息。

安装SystemTAP：

	yum install -y systemtap systemtap-runtime

安装SystemTAP依赖的内核模块：

	stap-prep

`stap-prep`命令会尝试安装kernel的debuginfo，但debuginfo在单独repo中，默认没有enable，通常会安装失败。

先确定文件`/etc/yum.repos.d/CentOS-Debuginfo.repo`存在：

	$ cat /etc/yum.repos.d/CentOS-Debuginfo.repo
	# CentOS-Debug.repo
	#
	# The mirror system uses the connecting IP address of the client and the
	# update status of each mirror to pick mirrors that are updated to and
	# geographically close to the client.  You should use this for CentOS updates
	# unless you are manually picking other mirrors.
	#
	
	# All debug packages from all the various CentOS-7 releases
	# are merged into a single repo, split by BaseArch
	#
	# Note: packages in the debuginfo repo are currently not signed
	#
	
	[base-debuginfo]
	name=CentOS-7 - Debuginfo
	baseurl=http://debuginfo.centos.org/7/$basearch/
	gpgcheck=1
	gpgkey=file:///etc/pki/rpm-gpg/RPM-GPG-KEY-CentOS-Debug-7
	enabled=1
	#

如果文件不存在，新建，并且执行`yum makecache`，然后用下面的命令安装：

	yum --enablerepo=base-debuginfo makecache
	yum --enablerepo=base-debuginfo install -y kernel-debuginfo-$(uname -r)
	yum install kernel-devel

如果还是找不到kernel-debuginfo安装包，可以看一下`/etc/yum.conf`中是否将将kernel包排除了：

	# 将/etc/yum.conf中的exclude
	 exclude=kernel* centos-release*
	
	#修改为
	  exclude=centos-release*

如果还是找不到，直接到[ http://debuginfo.centos.org/7/x86_64/ ](http://debuginfo.centos.org/7/x86_64/)下载对应的RPM包。

建议做完上面的操作后，重新执行`stap-prep`，防止以后遗漏依赖的RPM。

	stap-prep

测试一下工作状态，下面的指令的意思是，探测到vfs.read操作时，执行{}中的指令：

	stap -v -e 'probe vfs.read {printf("read performed\n"); exit()}'

例如：

	[root@10 vagrant]#  stap -v -e 'probe vfs.read {printf("read performed\n"); exit()}'
	Pass 1: parsed user script and 470 library scripts using 139632virt/41604res/3356shr/38380data kb, in 280usr/130sys/466real ms.
	Pass 2: analyzed script: 1 probe, 1 function, 7 embeds, 0 globals using 298172virt/193072res/2708shr/196920data kb, in 2790usr/2330sys/7791real ms.
	Pass 3: translated to C into "/tmp/stapSV4lBm/stap_d76eef0cd12de84ab75c0e467da5ae6a_2696_src.c" using 298172virt/193328res/2956shr/196920data kb, in 20usr/100sys/205real ms.
	Pass 4: compiled C into "stap_d76eef0cd12de84ab75c0e467da5ae6a_2696.ko" in 8400usr/2600sys/12066real ms.
	Pass 5: starting run.
	read performed
	Pass 5: run completed in 0usr/70sys/393real ms.

## 安装OpenResty

因为要用到debuginfo，用yum安装OpenResty：

	yum install yum-utils
	yum-config-manager --add-repo https://openresty.org/package/centos/openresty.repo
	yum install openresty
	yum install openresty-resty

启动一个OpenResty应用：

	openresty -p `pwd` -c nginx.conf

nginx.conf的内容如下：

	worker_processes  1;        #nginx worker 数量
	error_log logs/error.log;   #指定错误日志文件路径
	events {
	  worker_connections 1024;
	}
	
	 http {
	     lua_shared_dict dogs 10m;
	     server {
	         listen 6699;
	         location /set {
	             content_by_lua_block {
	                 local dogs = ngx.shared.dogs
	                 dogs:set("Jim", 8)
	                 ngx.say("STORED")
	             }
	         }
	         location /get {
	             content_by_lua_block {
	                 local dogs = ngx.shared.dogs
	                 ngx.say(dogs:get("Jim"))
	             }
	         }
	     }
	 }

## 采集压测数据

用yum安装openresty的debuginfo：

	yum install -y openresty-debug-debuginfo openresty-debuginfo -y

下载SystemStap拓展脚本：

	git clone https://github.com/openresty/stapxx
	export PATH=$PATH:`pwd`/stapxx

>别忘了设置PATH！

然后用`stapxx/samples`中的脚本抓取指定进程的数据，例如抓取nginx进程的lua级别的数据，-x指定进程号：

	./stapxx/samples/lj-lua-stacks.sxx --arg time=60 --skip-badvars -x 6949 > resty.bt

stapxx/samples目录中有很多文件，分别适用于不同情况，`lj-lua-stacks.sxx`采集lua的调用栈。

参数time指定监测时间，单位是秒，这期间可以用ab等工具压测，例如：

	ab -n 1000 -c 3  192.168.33.12:6699/get

最后得到的a.bt中内容格式如下：

	0xffffffffc04cd20b
	C:ngx_http_lua_shdict_get
	=content_by_lua(nginx.conf:22):1
	        5
	0xffffffff9289db4a
	C:ngx_http_lua_ngx_say
	=content_by_lua(nginx.conf:22):1
	        5
	0xffffffff9289db4a
	C:ngx_http_lua_shdict_get
	=content_by_lua(nginx.conf:22):1
	        3

## 生成火焰图

下载火焰图生成工具：

	git clone https://github.com/brendangregg/FlameGraph

用其中的`stackcollapse-stap.pl`和`flamegraph.pl`生成火焰图：

	./FlameGraph/stackcollapse-stap.pl resty.bt  >resty.cbt
	./FlameGraph/flamegraph.pl resty.cbt > resty.svg

用浏览器打开生成的a.svg，在下面的图片上右键选“在浏览器中打开”，可以看到鼠标放在图片上的动态效果：

![OpenResty火焰图]({{ site.imglocal }}/openresty/a.svg)

这个图片的意思是，`content_by_lua()`函数调用了`ngx_http_lua_ngx_say()`和`ngx_http_lua_shdict_get()`两个函数，它们的长度就是各自占用的时长比例。

火焰图的内容参考：[如何读懂火焰图？][2]

## 问题

需要安装openresty的debuginfo，否则后面采集火焰图的时候会报下面的错误：

	Found exact match for libluajit: /usr/local/openresty/luajit/lib/libluajit-5.1.so.2.1.0
		WARNING: cannot find module /usr/local/openresty/nginx/sbin/nginx debuginfo: No DWARF information found [man warning::debuginfo]
		WARNING: cannot find module /usr/local/openresty/luajit/lib/libluajit-5.1.so.2.1.0 debuginfo: No DWARF information found [man warning::debuginfo]
		semantic error: while processing function luajit_G

	semantic error: type definition 'lua_State' not found in '/usr/local/openresty/luajit/lib/libluajit-5.1.so.2.1.0': operator '@cast' at stapxx-rNq9WU9J/luajit.stp:162:12
			source:     return @cast(L, "lua_State", "/usr/local/openresty/luajit/lib/libluajit-5.1.so.2.1.0")->glref->ptr32
							   ^

	Missing separate debuginfos, use: debuginfo-install openresty-1.13.6.2-1.el7.centos.x86_64

## 参考

1. [How to do Web Server Performance Benchmark in FREE?][1]
2. [如何读懂火焰图？][2]
3. [SystemTAP Documentation][3]
4. [SystemTAP WiKi][4]
5. [SystemTAP初学者手册][5]

[1]: https://geekflare.com/web-performance-benchmark/ "How to do Web Server Performance Benchmark in FREE?"
[2]: http://www.ruanyifeng.com/blog/2017/09/flame-graph.html "如何读懂火焰图？"
[3]: https://sourceware.org/systemtap/documentation.html "SystemTAP Documentation"
[4]: https://sourceware.org/systemtap/wiki "SystemTAP WiKi"
[5]: https://sourceware.org/systemtap/SystemTap_Beginners_Guide/ "SystemTAP初学者手册"
