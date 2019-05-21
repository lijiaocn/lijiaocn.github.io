---
layout: default
title: "keepalived的vrrp多播报文被禁，导致VIP同时位于多个机器上"
author: 李佶澳
createdate: "2018-11-12 17:37:51 +0800"
changedate: "2018-11-12 17:37:51 +0800"
categories: 问题
tags:  keepalived
keywords: keepalived,vip,多播,单播
description: 原本好好的vip，突然同时存在于两个机器上了，发现是默认用的多播被禁了，需要换成单播
---

## 目录
* auto-gen TOC:
{:toc}

两台机器通过keepalived设置了可以动态漂移的vip，发现两个机器上同时存在vip。

从[Keepalived原理与实战精讲--VRRP协议](https://blog.csdn.net/u010391029/article/details/48311699)了解到，默认用的是多播，目的地址为`224.0.0.18`。

用tcpdump在一起机器上抓包，发现收不到另一台机器发送的多播报文：

	tcpdump -i eth0 src host 172.18.117.30 and dst host 224.0.0.18

同事告诉说需要用单播的方式，多播被禁了。

查看`man keepalived.conf`，VRRP instances中给出了单播的设置方法，添加`unicast_peer`即可：

	VRRP instance(s)
	describes the movable IP for each instance of a group in vrrp_sync_group.  
	Here are described two IPs (on inside_network and on outside_network), 
	on machine "my_hostname", which belong to the
	       group VG_1 and which will transition together on any state change.
	
	        #You will need to write another block for outside_network.
	        vrrp_instance inside_network {
	           ...
	           unicast_peer {
	             <IPADDR>
	             ...
	           }

配置文件如下；

	$ cat /etc/keepalived/keepalived.conf
	global_defs {
	    router_id  backup_172.18.117.31
	}
	
	vrrp_sync_group VG_1 {
	    group {
	        VG_1
	    }
	}
	
	vrrp_script chk_alive {
	    script "/export/Shell/keepalived/alive.sh"
	    interval 1
	    fall 3
	    rise 3
	}
	
	vrrp_instance VG_1 {
	    state BACKUP
	    interface eth0
	    lvs_sync_daemon_interface eth0
	    virtual_router_id 87
	    priority 150
	    advert_int 1
	    authentication {
	        auth_type PASS
	        auth_pass 123456
	    }
	    unicast_peer {
	        172.18.117.30
	        172.18.117.31
	    }
	    virtual_ipaddress {
	        17.18.117.33/24 dev eth0 label eth0:0
	    }
	    track_script {
	        chk_alive
	    }
	    nopreempt
	!When vip is enabled.
	    notify_master  /export/Shell/keepalived/to_master.sh
	    notify_backup  /export/Shell/keepalived/to_backup.sh
	    notify_fault   /export/Shell/keepalived/fault.sh
	    notify         /export/Shell/keepalived/notify.sh
	}
