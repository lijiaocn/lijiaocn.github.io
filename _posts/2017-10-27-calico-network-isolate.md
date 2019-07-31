---
layout: default
title: 未在calico中创建hostendpoint，导致开启隔离后，在kubernetes的node上无法访问pod
author: 李佶澳
createdate: 2017/10/27 14:45:26
last_modified_at: 2018/05/18 18:28:52
categories: 问题
tags: calico kubernetes
keywords: calico,hostendpoint,workloadendpoint,网络隔离
description: 在calico上开启policy后，node无法访问pod

---

## 目录
* auto-gen TOC:
{:toc}

## 现象描述

kubernetes集群的网络组件是calico，在kubernetes中设置网络隔离后，在node上无法访问pod。

## 更改一下calico的kube-policy-controller

kubernetes中的networkpolicy没有考虑到node，虽然在1.8.x版本中支持IP，但还是很麻烦。

因此，修改了calico的kube-policy-controller中的代码，在calico管理的每个policy中增加了一条规则。

这里使用的[calico: kube-controllers][3]的v0.7.0版本，在`handlers/network_policy.py`中增加两行：

	 50         extra_rule=Rule(action="allow", src_selector="calico/k8s_ns in { \"kube-system\" }")
	 51         inbound_rules.append(extra_rule)

这两行代码将会在calico的所有policy增加一条规则:

	 - action: allow
	   destination: {}
	   source:
	     selector: calico/k8s_ns in { "kube-system" }

## 未开启ipip模式的时候

calico中的endpoint，分为[workloadendpoint][2]和[hostendpoint][1]。

workloadendpoint对应在k8s中对应的就是分配给pod的接口，hostendpoint对应的是node的接口。

如果想在node上直接访问pod，需要为node创建带有合适标签的hostendpoint。

例如在集群中创建的一个policy如下:

	$ calicoctl get policy lijiaocn-space.isolation-access-rules -o yaml
	- apiVersion: v1
	  kind: policy
	  metadata:
	    name: lijiaocn-space.isolation-access-rules
	  spec:
	    egress:
	    - action: allow
	      destination: {}
	      source: {}
	    ingress:
	    - action: allow
	      destination: {}
	      source:
	        selector: calico/k8s_ns in { "kube-system", "lijiaocn-space" }
	    order: 1000
	    selector: calico/k8s_ns == 'lijiaocn-space'

这个policy允许带有`calico/k8s_ns=kube-system`或者`calico/k8s_ns=lijiaocn-space`标签的endpoint访问。

为ip地址为10.39.0.113的node创建的hostendpoint如下：

	$ calico get hostendpoint --node=10.39.0.113 -o yaml
	- apiVersion: v1
	  kind: hostEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: kube-system
	    name: eth0
	    node: 10.39.0.113
	  spec:
	    expectedIPs:
	    - 10.39.0.113
	    interfaceName: eth0
	    profiles:
	    - k8s_ns.kube-system

node的ip地址是10.39.0.113，带有标签`calico/k8s_ns: kube-system`，符合policy的要求。

如果没有使用ipip，这时候在node10.39.0.113上就可以访问了pod。

## 如果开启了ipip模式

如果开启了ipip模式：

	$ calicoctl get ippool -o yaml
	- apiVersion: v1
	  kind: ipPool
	  metadata:
	    cidr: 192.168.0.0/16
	  spec:
	    ipip:
	      enabled: true
	    nat-outgoing: true

还需要为每个node再次添加一个hostendpoint的。

这是因为开启ipip模式后，node访问pod的报文是封装在ipip隧道中传送的，这时候node使用的源ip是ip tunnl的ip：

	$ ip addr |grep tun
	84: tunl0@NONE: <NOARP,UP,LOWER_UP> mtu 1440 qdisc noqueue state UNKNOWN qlen 1
	    inet 192.168.139.230/32 scope global tunl0

因此还需要为tunl0创建一个对应的hostendpoint：

	$ calicoctl get hostendpoint tunl0 --node=10.39.0.113  -o yaml
	- apiVersion: v1
	  kind: hostEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: kube-system
	    name: tunl0
	    node: 10.39.0.113
	  spec:
	    expectedIPs:
	    - 192.168.139.230
	    interfaceName: tunl0
	    profiles:
	    - k8s_ns.kube-system

这时候又可以访问pod了。

## 提供几个脚本

提供几个用于方便操作的脚本。

脚本1，为kubernetes的所有的node创建hostendpoint：

{% raw %} 

	#!/bin/bash
	for i in `kubectl get node  -o go-template="{{ range .items }} {{ index .status.addresses 1 \"address\" }} {{end}}"`
	do
	    echo $i
	cat >/tmp/hostendpoint.yaml <<EOF
	apiVersion: v1
	kind: hostEndpoint
	metadata:
	  name: eth0
	  node: $i
	  labels:
	    calico/k8s_ns: kube-system
	spec:
	  interfaceName: eth0
	  expectedIPs:
	  - $i
	  profiles:
	  - k8s_ns.kube-system
	EOF
	calicoctl create -f /tmp/hostendpoint.yaml
	done
{% endraw %}

这个脚本在master上执行，可以一次性为所有的node的创建hostendpoint。

脚本2，生成每个node上的tunl0对应的hostendpoint：

{% raw %}

	#!/bin/bash
	IP=`ip addr |grep tunl0 |grep inet|awk '{print $2}'|sed -e 's@/32@@'`
	NAME=`ip addr |grep eth0  |grep inet|awk '{print $2}'|sed -e 's@/24@@'`
	
	cat >./hostendpoint-tunl0.yaml <<EOF
	apiVersion: v1
	kind: hostEndpoint
	metadata:
	  name: tunl0
	  node: $NAME
	  labels:
	    calico/k8s_ns: kube-system
	spec:
	  interfaceName: tunl0
	  expectedIPs:
	  - $IP
	  profiles:
	  - k8s_ns.kube-system
	EOF
{% endraw %}

这个脚本在每个node上执行，生成这个node上的tunl0对应的hostendpoint文件。
之后还需要手动的创建:

	$ calicoctl create -f hostendpoint-tunl0.yaml

脚本3，也可以将以上过程在一个脚本中完成： [create_hostendpoint_for_all_node.sh][4]

## 参考

1. [calico hostendpoint][1]
2. [calico workloadendpoint][2]
3. [calico: kube-controllers][3]
4. [create_hostendpoint_for_all_node.sh][4]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/04/11/calico-usage.html#hostendpoint  "calico hostendpoint" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2017/04/11/calico-usage.html#workloadendpoint "calico workloadendpoint"
[3]: https://github.com/projectcalico/kube-controllers  "calico: kube-controllers"
[4]: https://github.com/lijiaocn/kube-tools/blob/master/calico-hostendpoint/create_hostendpoint_for_all_node.sh "create_hostendpoint_for_all_node.sh"
