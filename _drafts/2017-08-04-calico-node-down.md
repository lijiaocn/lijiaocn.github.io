---
layout: default
title: Calico的workloadEndpoint无法访问网络的问题调查
author: lijiaocn
createdate: 2017/08/04 10:22:14
changedate: 2017/08/05 18:34:00
categories: 问题
tags: calico
keywords: calico,k8s,workloadEndpoint
description: 

---

* auto-gen TOC:
{:toc}

## 现象

k8s中的一个名为"XXXXX"（敏感信息用X替换)的pod无法访问网络：

	/opt # ping www.baidu.com
	ping: bad address 'www.baidu.com'
	/opt # ping 114.114.114.114
	PING 114.114.114.114 (114.114.114.114): 56 data bytes

使用calicoctl找到这个容器的网卡，在calico中称为`workloadEndpoint`：

	$calicoctl get workloadEndpoint  --workload=XXXXX -o yaml
	- apiVersion: v1
	  kind: workloadEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: XXXXXX
	      name: group
	      pod-template-hash: "83380476"
	      XXXXXX.com/appName: group
	      XXXXXX.com/svcName: group
	    name: eth0
	    node: slave-96
	    orchestrator: k8s
	    workload: XXXXX
	  spec:
	    interfaceName: calic577831ffc7
	    ipNetworks:
	    - 192.168.156.177/32
	    mac: 96:fb:dc:4a:26:e7
	    profiles:
	    - k8s_ns.XXXXX

可以看到，该容器的网卡分配到了slave-96上，名称为calic577831ffc7。

到slave-96上抓包:

	$tcpdump -i calic577831ffc7
	tcpdump: WARNING: calic577831ffc7: no IPv4 address assigned
	tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
	listening on calic577831ffc7, link-type EN10MB (Ethernet), capture size 65535 bytes
	10:31:43.775985 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:44.777494 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:45.779434 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:46.781508 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:47.783432 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28
	10:31:48.786429 ARP, Request who-has 169.254.1.1 tell 192.168.156.177, length 28

pod中的route信息与其它正常的pod的route信息相同：

	/opt # ip route
	default via 169.254.1.1 dev eth0
	169.254.1.1 dev eth0

问题来了，为什么arp请求没有被回应。

## 解决

阅读[felix][4]的代码，发现在创建workloadEndpoint的时候，会设置一个静态的arp:



## calico的node原理

在[Calico网络的原理、组网方式与使用][1]中粗略地分析过calico的原理，但是没有分析通信的详细过程，现在需要补上这一课了。

在使用kubeadm部署的k8s集群中，calico以一个工作在host模式容器的形式部署在每台node上。

可以看到calico容器中运行有下列进程:

	$ps aux
	PID   USER     TIME   COMMAND
	    1 root       0:00 /sbin/runsvdir -P /etc/service/enabled
	   50 root       0:00 runsv felix
	   51 root       0:00 runsv bird
	   52 root       0:00 runsv bird6
	   53 root       0:00 runsv confd
	   54 root       0:00 svlogd /var/log/calico/felix
	   55 root      16:32 calico-felix
	   56 root       0:00 svlogd -tt /var/log/calico/bird6
	   57 root       0:00 svlogd /var/log/calico/confd
	   59 root       0:01 confd -confdir=/etc/calico/confd -interval=5 -watch --log-level=debug 
	                            -node=https://kubernetes.default.svc.cluster.local:2379 
	                            -client-key=/etc/kubernetes/pki/client-key.pem 
	                            -client-cert=/etc/kubernetes/pki/client.pem 
	                            -client-ca-keys=/etc/kubernetes/pki/ca.pem
	   60 root       0:25 bird6 -R -s /var/run/calico/bird6.ctl -d -c /etc/calico/confd/config/bird6.cfg
	   61 root       0:00 svlogd -tt /var/log/calico/bird
	   62 root       0:36 bird -R -s /var/run/calico/bird.ctl -d -c /etc/calico/confd/config/bird.cfg
	   86 root       0:00 calico-iptables-plugin
	   87 root       3:29 calico-iptables-plugin
	  435 root       0:00 /bin/sh
	 4354 root       0:00 /bin/sh
	 4523 root       0:00 ps aux

从容器启动时执行的命令start_runit中，可以得知，主要就是用runsvdir启动了四个服务：

	bird      ipv4协议的软路由
	bird6     ipv6协议的软路由
	confd     配置管理
	felix     calico的agent

其中bird和bird6都是[bird][2]，一个是支持ipv4协议的，一个是支持ipv6协议的。

[confd][3]是用来管理配置文件的。

[felix][4]是calico的组件，用来设置所在node的上的网络。


## 参考

1. [calico网络的原理、组网方式与使用][1]
2. [bird][2]
3. [confd][3]
4. [felix][4]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/04/11/calico-usage.html  "calico网络的原理、组网方式与使用" 
[2]: http://bird.network.cz/ "bird"
[3]: http://www.confd.io/  "confd"
[4]: https://github.com/projectcalico/felix  "felix"
