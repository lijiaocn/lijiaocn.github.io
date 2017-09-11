---
layout: default
title: 在OpenWRT上使用tor
author: lijiaocn
createdate: 2017/06/12 21:57:40
changedate: 2017/09/11 16:18:18
categories: 技巧
tags: openwrt tor
keywords: openwrt,tor,匿名网络,暗网
description: 将tor内置在Openwrt中，Wi-Fi连接后直接进入tor网络。

---

* auto-gen TOC:
{:toc}

## 安装tor 

可以直接用opkg安装:

	opkg update
	opkg install tor

源在/etc/opkg目录下的文件中配置:

	$ls /etc/opkg
	customfeeds.conf  distfeeds.conf    keys

如果所使用的固件的源中没有tor，只能自己制作固件，参考[Openwrt固件制作][14]。

## 创建bridge

在/etc/config/network中添加：

	config interface 'tor'
		option type 'bridge'             #要使用bridge类型
		option ifname 'eth0.3'           #注意对命名格式有要求
		option proto 'static'
		option ipaddr '192.168.10.1'
		option netmask '255.255.255.0'

eth0.3表示是eth0网卡虚拟出的第三个网卡，执行`/etc/init.d/network reload`之后可以看到:

	23: eth0.3@eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP qlen 1000
	link/ether 78:a3:51:2b:69:06 brd ff:ff:ff:ff:ff:ff
	inet 192.168.10.1/24 brd 192.168.10.255 scope global eth0.3
	   valid_lft forever preferred_lft forever
	inet6 fe80::7aa3:51ff:fe2b:6906/64 scope link
	   valid_lft forever preferred_lft forever

注意要使用bridge模式，否则热点无法连接, [openwrt network config][4]中给出相关的说明。

### 配置dhcp

在/etc/config/dhcp中添加:

	config dhcp 'tor'
	    option interface    'tor'
	    option start        '100'
	    option limit        '150'
	    option leasetime    '1h'

### 添加热点

在/etc/config/wirelss中添加:
	
	config wifi-iface
	        option device 'radio1'      #无线网卡
	        option network 'tor'
	        option mode 'ap'
	        option ssid 'tor'
	        option encryption 'psk-mixed'
	        option key 'goodlife1'

这时候重启启动网络`/etc/init.d/network restart`，就会发现tor热点，可以连接。

### 配置防火墙

只允许040和9053端口，后面会看到这两个端口是tor的服务端口。

在/etc/config/firewall中添加:

	config zone
	        option name             tor
	        list network            'tor'
	        option input            REJECT
	        option output           ACCEPT
	        option forward          REJECT
	        option syn_flood        1
	        option conntrack        1
	
	config rule
	        option name             Allow-Tor-Tran
	        option src              tor
	        option proto            tcp
	        option dest_port        9040
	        option family           ipv4
	        option target           ACCEPT
	
	config rule
	        option name             Allow-Tor-DNS
	        option src              tor
	        option proto            udp
	        option dest_port        9053
	        option family           ipv4
	        option target           ACCEPT
	
	config rule
	        option name             Allow-DHCP-Renew
	        option src              tor
	        option proto            udp
	        option dest_port        67
	        option family           ipv4
	        option target           ACCEPT
	
	config rule
	        option name             Allow-Ping
	        option src              tor
	        option proto            icmp
	        option icmp_type        echo-request
	        option family           ipv4
	        option target           ACCEPT
	
	config rule
	        option name             Allow-IGMP
	        option src              tor
	        option proto            igmp
	        option family           ipv4
	        option target           ACCEPT

## 设置转发规则

在/etc/firewall.user中添加:

	iptables -t nat -A PREROUTING -i br-tor -p tcp --syn -j REDIRECT --to-ports 9040
	iptables -t nat -A PREROUTING -i br-tor -p udp --dport 53 -j REDIRECT --to-ports 9053 
	iptables -t nat -A POSTROUTING -o br-tor -p udp -s 192.168.10.1 --sport 9053 -j SNAT --to 192.168.10.1:53

或者只允许http和https:

	iptables -t nat -A PREROUTING -i br-tor ! -d 192.168.10.1 -p tcp  --dport 80 --syn -j REDIRECT --to-ports 9040
	iptables -t nat -A PREROUTING -i br-tor ! -d 192.168.10.1 -p tcp  --dport 443 --syn -j REDIRECT --to-ports 9040
	iptables -t nat -A PREROUTING -i br-tor -p udp --dport 53 -j REDIRECT --to-ports 9053
	iptables -t nat -A POSTROUTING -o br-tor -p udp -s 192.168.10.1 --sport 9053 -j SNAT --to 192.168.10.1:53

## 配置tor

[tor config][5]中介绍了tor的配置项。

tor的配置文件是/etc/tor/torrc，一般不需要更改，使用默认配置即刻。

默认情况下tor启动后，会在本地创建一个代理:

	127.0.0.1:9050

目标就是将流量从这个代理发出去。

可以参考的配置，注意这里配置了透明代理和匿名DNS：

	TransPort 9040
	TransListenAddress 192.168.10.1
	DNSPort 9053
	DNSListenAddress 192.168.10.1
	VirtualAddrNetwork 10.192.0.0/10
	AutomapHostsOnResolve 1

### 配置Bridge

默认情况下，tor通过访问directory server获得一份节点列表，然后建立虚拟链路。

但是在国内，tor无法访问directory。而且directory server中提供的节点是公开的，很容易被封杀。

因此tor组织，设计开发了bridge，bridge是半公开的，只能通过[https://bridges.torproject.org][https://bridges.torproject.org]获取到部分。

在国内使用tor，最麻烦的就是要找到能用的bridge，下面给出的这些bridge已经都不能用了。

在torrc中，添加bridges: 

	UseBridges 1
	Bridge  obfs4 45.56.125.64:9443 8F188C976653ED2697BBBB14D83FAB7038D30242 cert=8+HYXC2jIvLlD9WZhmPy+Zdx72xho/Z9FNTpzXP+p5eVi/vOFDUUpvzf4BtyJXj3dwsACg iat-mode=0
	+Bridge obfs4 35.185.195.251:9443 17D02DEF6BD6A4251EDA338D6FAD185ADD4DD362 cert=jdJ3b6/+W3zPYgRROI33TWk6Q5JWcaSX5dGRZkhacy6qwmUBHNykbWYs7S1dtDdlMs4PGg iat-mode=0
	+Bridge obfs4 104.153.209.217:25447 D28E0345809AE4BAC903EF7FC78CAAF111A63C58 cert=DtNNYXeRG4ds+iTM7sdbJHJgH7RmxDb1lt8JR17BiT7eHnORyn+4y+RcoqAI65XGvhXKJg iat-mode=0
	+Bridge fte 194.132.208.167:3629 B532A3961CD658A75A9B2BF1C70970FD358B2CC2
	+Bridge fte 194.132.208.63:30990 E824F547C900B2082418CC4FF71045BA32F91A8F
	+Bridge obfs3 194.132.209.16:45753 D07A31AE11B8D81027E839E449ECE075A2D7416C
	+Bridge obfs3 194.132.208.167:43166 B532A3961CD658A75A9B2BF1C70970FD358B2CC2
	+Bridge obfs3 176.56.237.144:88 0A94AAA5BAB7CCA6F94B0ACA97870FAF28CD3643
	+Bridge scramblesuit 85.159.237.97:3690 FF7030283C326B0AF40546409E88C8612B8EF48A password=T6DFT3BAR4GLX5BRX7XPRXQ3PCMOIBQE
	+Bridge scramblesuit 194.132.209.16:42739 D07A31AE11B8D81027E839E449ECE075A2D7416C password=XC5PTSV7ASLPMUUG7N2A4I7U2ZGONEOA
	+Bridge scramblesuit 194.132.208.167:37707 B532A3961CD658A75A9B2BF1C70970FD358B2CC2 password=VM2YDXPMPEON4THOBZWDNRCOZ5O36APZ

注意从第二个Bridge开始前面要有`+`表示追加，bridge后跟随的第一个字段是插件名称，用于流量变形，防止被识别。

## 使用meek

[meek][8]是一个新技术，有专门的[研究论文][9]。

它的代码是tor自己的仓库，可以能需要[配置git代理][10]后才能获取到。

	git clone https://git.torproject.org/pluggable-transports/meek.git

### golang1.8

如果目标架构是mips，并且支持FPU(浮点运算指令集) ,可以直接golang1.8以及以上的版本编译:

### go-mips32

如果不支持FPU的mips，可以使用go-mips32:

	git clone https://github.com/gomini/go-mips32.git
	cd go-mips32/src
	GOARCH=mips32le GOOS=linux ./make.bash

编译结束后提示：

	Installed Go for linux/mips32le in /home/vagrant/GOPATH/src/github.com/gomini/go-mips32
	Installed commands in /home/vagrant/GOPATH/src/github.com/gomini/go-mips32/bin

需要使用编译得到的go来编译程序，这里直接通过创建符号连接方式，替换系统中已经安装的go:

	sudo ln -s /home/vagrant/GOPATH/src/github.com/gomini/go-mips32  /usr/local/go：

查看一下默认的go命令的路径是否正确：

	$which go
	/usr/local/go/bin/go

### 编译meek

按照上面的章节准备好go命令后，到meek目录中编译meek:

	cd meek/meek-client
	GOPATH=~/GOPATH/ GOARCH=mips32le GOOS=linux go get
	GOPATH=~/GOPATH/ GOARCH=mips32le GOOS=linux go build
	
	GOARGH可以是mips、mipsle、mips64、mips64le

在当前目录下可以得到meek-client文件：

	$file meek-client
	meek-client: ELF 32-bit LSB executable, MIPS, MIPS32 rel2 version 1 (SYSV), statically linked, not stripped

将其上传到openwrt上后，在torrc中添加:

	ClientTransportPlugin meek exec /root/meek-client --log /var/log/tor/meek-client.log
	Bridge meek 0.0.2.0:2 B9E7141C594AF25699E0079C1F0146F409495296 url=https://d2cly7j4zqgua7.cloudfront.net/ front=a0.awsstatic.com
	+Bridge meek 0.0.2.0:3 97700DFE9F483596DDA6264C4D7DF7641E1E39CE url=https://meek.azureedge.net/ front=ajax.aspnetcdn.com

可以在[meek addr][11]中找到可用的meek地址。

然后启动tor

	/etc/init.d/tor start

如果遇到错误:

	error in handling request: dial tcp: lookup ajax.aspnetcdn.com": invalid domain name

说明配置文件中域名写错了，例如这里是后面多写了一个引号。

如果遇到错误： 

	error in handling request: x509: failed to load system roots and no roots provided

说明openwrt上缺少root证书，上传一个：

	scp /etc/ssl/certs/ca-bundle.crt root@192.168.9.1:/etc/certs/ca-certificates.crt

[install certs on openwrt][13]给出了手动添加证书的方法。

## 启动tor

	/etc/init.d/tor enable
	/etc/init.d/tor start

如果需要调试，可以在/etc/tor/torc中打开日志:

	Log notice file /var/log/tor/notices.log
	## Send every possible message to /var/log/tor/debug.log
	#Log debug file /var/log/tor/debug.log
	## Use the system log instead of Tor's logfiles
	Log notice syslog
	## To send all messages to stderr:
	#Log debug stderr

## 参考

1. [Here is the Tor firmware][1]
2. [HOWTO: Transparent TOR proxy][2]
3. [tor manual][3]
4. [openwrt network config][4]
5. [tor config][5]
6. [tor bridge][6]
7. [Transparent_Access_to_Tor_Hidden_Services][7]
8. [tor meek][8]
9. [domain fronting][9]
10. [git proxy][10]
11. [meek addr][11]
12. [go-mips32 compile][12]
13. [install certs on openwrt][13]
14. [Openwrt固件制作][14]

[1]: http://www.gl-inet.com/here-is-the-tor-firmware/?lang=en  "Here is the Tor firmware" 
[2]: https://forum.openwrt.org/viewtopic.php?id=27354 "HOWTO: Transparent TOR proxy" 
[3]: https://wiki.archlinux.org/index.php/tor "tor"
[4]: https://wiki.openwrt.org/doc/uci/network "openwrt network config"
[5]: https://www.torproject.org/docs/tor-manual.html.en "tor config"
[6]: https://bridges.torproject.org "tor bridge"
[7]: https://www.grepular.com/Transparent_Access_to_Tor_Hidden_Services "Transparent_Access_to_Tor_Hidden_Services"
[8]: https://trac.torproject.org/projects/tor/wiki/doc/meek "tor meek"
[9]: https://www.bamsoftware.com/papers/fronting/ "domain fronting"
[10]: http://www.lijiaocn.com/%E6%89%8B%E5%86%8C/1004/01/01/manual-git.html#%E8%AE%BE%E7%BD%AE%E4%BB%A3%E7%90%86  "git proxy"
[11]: https://gitweb.torproject.org/builders/tor-browser-bundle.git/tree/Bundle-Data/PTConfigs/bridge_prefs.js "meek addr"
[12]: https://github.com/xtaci/kcptun/issues/79 "go-mips32 compile"
[13]: https://wiki.openwrt.org/doc/howto/wget-ssl-certs "install certs on openwrt"
[14]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/06/03/openwrt-build.html  "openwrt固件制作"
