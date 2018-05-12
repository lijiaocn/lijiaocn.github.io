---
layout: default
title: Calico的hostendpoint的IP地址为空，导致felix退出
author: 李佶澳
createdate: 2018/01/19 15:48:39
changedate: 2018/05/12 11:50:11
categories: 问题
tags: calico
keywords: calico,felix
description: calico

---

* auto-gen TOC:
{:toc}

## 现象 

calico2.5.1运行过程中突然panic，日志如下：

	panic: interface conversion: interface is nil, not ip.Addr
	goroutine 150 [running]:
	github.com/projectcalico/felix/calc.(*EventSequencer).flushAddedIPSets.func1.1(0x0, 0x0)
	/go/src/github.com/projectcalico/felix/calc/event_sequencer.go:498 +0x4e
	github.com/projectcalico/felix/multidict.stringToIfaceMap.Iter(0xc42025ba40, 0xc4207914d0, 0x28, 0xc420d74020)
	/go/src/github.com/projectcalico/felix/multidict/multidict.go:249 +0xd3
	github.com/projectcalico/felix/calc.(*EventSequencer).flushAddedIPSets.func1(0x1505c00, 0xc4211fadf0, 0xc420761c08, 0x40eb82)
	/go/src/github.com/projectcalico/felix/calc/event_sequencer.go:499 +0x237
	github.com/projectcalico/felix/vendor/github.com/projectcalico/libcalico-go/lib/set.mapSet.Iter(0xc42025b9e0, 0xc421205f30)
	/go/src/github.com/projectcalico/felix/vendor/github.com/projectcalico/libcalico-go/lib/set/set.go:102 +0xaf
	github.com/projectcalico/felix/calc.(*EventSequencer).flushAddedIPSets(0xc42009d600)
	/go/src/github.com/projectcalico/felix/calc/event_sequencer.go:507 +0x75
	github.com/projectcalico/felix/calc.(*EventSequencer).Flush(0xc42009d600)
	/go/src/github.com/projectcalico/felix/calc/event_sequencer.go:517 +0x4b
	github.com/projectcalico/felix/calc.(*AsyncCalcGraph).maybeFlush(0xc420128c80)
	/go/src/github.com/projectcalico/felix/calc/async_calc_graph.go:196 +0xe5
	github.com/projectcalico/felix/calc.(*AsyncCalcGraph).loop(0xc420128c80)
	/go/src/github.com/projectcalico/felix/calc/async_calc_graph.go:175 +0x2ab
	created by github.com/projectcalico/felix/calc.(*AsyncCalcGraph).Start
	/go/src/github.com/projectcalico/felix/calc/async_calc_graph.go:219 +0xe1

## 调查

打开debug:

	...
	   - name: FELIX_LOGSEVERITYSCREEN
	     value: debug
	...

找到以下日志：

	2018-01-19 07:18:28.097 [DEBUG][3550] ipset_member_calc.go 153: IP set s:Z7rI3bnfRb7o_jW1QBo5SzZ9BMs5SEDCgMiEPg now matches IPs [<nil> <nil>] via HostEndpoint(node=10.39.1.48, name=eth0)
	2018-01-19 07:18:28.097 [DEBUG][3550] ipset_member_calc.go 153: IP set s:Z7rI3bnfRb7o_jW1QBo5SzZ9BMs5SEDCgMiEPg now matches IPs [10.39.20.42 192.168.234.2] via HostEndpoint(node=paas-slave-20-42, name=eth0)

在ipset中添加Ip的时候，有一个hostendpoint的IP地址为两个`nil`：

	calicoctl get hostendpoint --node=10.39.1.48 -o yaml
	- apiVersion: v1
	  kind: hostEndpoint
	  metadata:
	    labels:
	      calico/k8s_ns: kube-system
	    name: eth0
	    node: 10.39.1.48
	  spec:
	    expectedIPs:
	    - ""
	    - ""
	    interfaceName: eth0
	    profiles:
	    - k8s_ns.kube-system

管理操作时，创建的hostendpoint的有错误，修改后恢复。

