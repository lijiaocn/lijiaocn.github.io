---
layout: default
title: networkmanger
author: lijiaocn
createdate: 2017/08/03 15:44:44
changedate: 2017/08/03 17:01:43
categories: 技巧
tags: linuxtook networkmanager
keywords:  networkmanger,netconfig
description: NetworkManager的管理工具，该更新知识储备了。

---

* auto-gen TOC:
{:toc}

## NetworkManager

NetworkManager是CentOS的上的一个服务，负责管理系统的网络。

	$cat /usr/lib/systemd/system/NetworkManager.service
	[Unit]
	Description=Network Manager
	Documentation=man:NetworkManager(8)
	Wants=network.target
	After=network-pre.target dbus.service
	Before=network.target network.service
	
	[Service]
	Type=dbus
	BusName=org.freedesktop.NetworkManager
	ExecReload=/bin/kill -HUP $MAINPID
	ExecStart=/usr/sbin/NetworkManager --no-daemon
	Restart=on-failure
	# NM doesn't want systemd to kill its children for it
	KillMode=process
	#CapabilityBoundingSet=CAP_NET_ADMIN CAP_DAC_OVERRIDE CAP_NET_RAW CAP_NET_BIND_SERVICE CAP_SETGID CAP_SETUID CAP_SYS_MODULE CAP_AUDIT_WRITE CAP_KILL CAP_SYS_CHROOT
	
	# ibft settings plugin calls iscsiadm which needs CAP_SYS_ADMIN (rh#1371201)
	CapabilityBoundingSet=CAP_NET_ADMIN CAP_DAC_OVERRIDE CAP_NET_RAW CAP_NET_BIND_SERVICE CAP_SETGID CAP_SETUID CAP_SYS_MODULE CAP_AUDIT_WRITE CAP_KILL CAP_SYS_CHROOT CAP_SYS_ADMIN
	
	ProtectSystem=true
	ProtectHome=read-only
	
	[Install]
	WantedBy=multi-user.target
	Alias=dbus-org.freedesktop.NetworkManager.service
	Also=NetworkManager-dispatcher.service

与之配套的一系列工具的linux手册:

	NetworkManager(8)
	NetworkManager.conf(5)
	nmcli-examples(7)
	nmcli(1)
	nmtui(1)
	nm-online(1)
	nm-settings(5)
	nm-applet(1)
	nm-connection-editor(1)

## nmcli

nmcli是NetworkManager的命令行管理工具，可以查看、设置网络设备。

	nmcli [OPTIONS...] {help | general | networking | radio | connection | device | agent | monitor} [COMMAND] [ARGUMENTS...]

nmcli支持8大类命令，每个大类命令又有各自的子命令:

	help           Show usage
	general        Show NetworkManager status and permissions
	networking     Query NetworkManager networking status, enable and disable networking
	radio          Show radio switches status, or enable and disable the switches
	connection     All network configuration as "connections"
	device         Show and manage network interfaces
	agent          Run nmcli as a NetworkManager secret agent, or polkit agent
	monitor        Observe NetworkManager activity. Watches for changes in connectivity state, devices or connection profiles

## nmtui

nmtui提供了一个Text Screen界面，可以在图形界面中配置。

## 参考

1. [setup-network-centos-7][1]

[1]: http://www.krizna.com/centos/setup-network-centos-7/ "setup-network-centos-7" 
