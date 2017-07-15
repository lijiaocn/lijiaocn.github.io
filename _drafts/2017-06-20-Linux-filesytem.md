---
layout: default
title:  在Linux上的使用各种文件系统
author: lijiaocn
createdate: 2017/06/20 18:39:02
changedate: 2017/06/21 10:11:55
categories: 技巧
tags: linuxtool
keywords: linuxtool,文件系统,nfs,iscsi
description: 常用的文件系统在Linux上的挂载方法。

---

* auto-gen TOC:
{:toc}

## NFS

	yum install -y nfs-utils
	mount -t nfs 192.168.4.211:/data/nfs_share /root/remote_dir

nfs服务器可能需要设置为允许Client端的IP访问。

## iSCSI

	yum install -y iscsi-initiator-utils

在/etc/iscsi/initiatorname.iscsi中添加iSCSI 客户端的 initiator name。

	iscsiadm -m discovery -t st -p <Virtual SAN 服务器IP>  //发现node
	iscsiadm -m node                                       //查看node
	iscsiadm -m node -T <目标IQN> -p <Virtual SAN 服务器IP> --login  //登陆node
	iscsiadm -m session                                              //查看当前session

这时候通过`lsblk`可以看到多出了一块磁盘。

希望重启时自动登陆:

	iscsiadm -m node -T <目标IQN> -p <Virtual SAN 服务器IP> --op update -n node.startup -v automatic

退出、删除node：

	umount /data (/data是共享存储挂载的目录)
	iscsiadm -m node -T <目标IQN> -p <Virtual SAN 服务器IP> --logout
	iscsiadm -m node -T <目标IQN> -p <Virtual SAN 服务器IP> --op=delete

退出所有node:

	iscsiadm -m node --logout

例如:

	$iscsiadm -m discovery -t st -p 10.39.0.139
	10.39.0.139:3260,1 iqn.2014-12.com.qingcloud.s2:sn.1
	
	$iscsiadm -m node  -T iqn.2014-12.com.qingcloud.s2:sn.1 -p 10.39.0.139 --login
	Logging in to [iface: default, target: iqn.2014-12.com.qingcloud.s2:sn.1, portal: 10.39.0.139,3260] (multiple)
	Login to [iface: default, target: iqn.2014-12.com.qingcloud.s2:sn.1, portal: 10.39.0.139,3260] successful.

## 参考

1. [iSCSI usage][1]
2. [iSCSI wiki][2]
3. [Configure iSCSI Target][3]

[1]: https://docs.qingcloud.com/guide/vsan.html#id2  "iSCSI" 
[2]: https://zh.wikipedia.org/wiki/ISCSI "iSCSI wiki"
[3]: http://www.server-world.info/en/note?os=Fedora_21&p=iscsi "Configure iSCSI Target"
