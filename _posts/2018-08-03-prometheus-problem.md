---
layout: default
title: Prometheus（普罗米修斯）使用过程中遇到的问题
author: 李佶澳
createdate: 2018/08/03 10:26:00
changedate: 2018/08/27 12:04:48
categories: 问题
tags: prometheus
keywords: prometheus,监控
description: prometheus是最近几年开始流行的一个新兴监控告警工具，特别是kubernetes的流行带动了prometheus的应用。

---

## 说明

prometheus是最近几年开始流行的一个新兴监控告警工具，特别是kubernetes的流行带动了prometheus的应用。

这里持续记录使用过程中遇到的一些问题。

## 更改标签的时机：抓取前修改、抓取后修改、告警时修改

prometheus支持修改标签。metric的标签可以在采集端采集的时候直接打上，这是最原始的标签。

除此之外，还可以在prometheus的配置文件里，对metric的label进行修改。

修改的时机有两个：采集数据之前，通过`relabel_config`；采集数据之后，写入存储之前，通过`metric_relabel_configs`。

两个的配置方式是相同的：


	relabel_configs:
	- source_labels: [__meta_kubernetes_pod_label_app]
	  regex: 'rabbitmq01-exporter'
	  replacement: 'public-rabbitmq01.paas.production:5672'
	  target_label: instance
	
	metric_relabel_configs:
	- source_labels: [node]
	  regex: 'rabbit01@rabbit01'
	  replacement: 'public-rabbitmq01.paas.production:5672'
	  target_label: node_addr

第一个是采集之前通过已有的标签，采集之前的标签通常是服务发现时设置的，生成新的标签instance。

第一个是采集之后，检查采集的指标，如果标签`node`匹配正则，生成新的标签node_addr。

如果要修改标签，target_label指定同名的标签。

另外`alert_relabel_configs`可以在告警前修改标签。

参考：[relabel_configs vs metric_relabel_configs](https://www.robustperception.io/relabel_configs-vs-metric_relabel_configs)

## alertmamanger持续产生告警

alertmanager中配置了重复报警的时间间隔为1小时，但是还是会不间断的重复告警：

	global:
	  resolve_timeout: 5m
	route:
	  group_by: ['alertname']
	  group_wait: 60s
	  group_interval: 60s
	  repeat_interval: 1h
	  receiver: 'web.hook'

alertmanager版本为0.15，查看代码发现DeupStage的Exec方法:

	//notify/notify.go:552
	func (n *DedupStage) Exec(ctx context.Context, l log.Logger, alerts ...*types.Alert) (context.Context, []*types.Alert, error) {
		...
			if a.Resolved() {
				resolved = append(resolved, hash)
				resolvedSet[hash] = struct{}{}
			} else {
				firing = append(firing, hash)
				firingSet[hash] = struct{}{}
			}
		...
	}

在这个函数里加上了一些调试日志，将alert的hash以及记录告警的entry打印了出来：

	Aug 27 10:36:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:36:50.054147307Z caller=notify.go:571 component=dispatcher hash=14034539317761184482
	Aug 27 10:36:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:36:50.054210085Z caller=notify.go:571 component=dispatcher hash=5916134610179335251
	Aug 27 10:36:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:36:50.05422632Z caller=notify.go:571 component=dispatcher hash=5226677708725188421
	...
	Aug 27 10:36:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:36:50.054305744Z caller=notify.go:603 component=dispatcher entry="{\"group_key\":
	\"e306e2FsZXJ0bmFtZT0iQ0xVU1RFUl9SQUJCSVRNUV9RVUVVRV9NRVNTQUdFX1JFQUNIX0xJTUlUIn0=\",\"receiver\":{\"group_name\":\"web.hook\",\"integration\":\"webhook\"},
	\"timestamp\":\"2018-08-27T02:35:50.050573575Z\",\"firing_alerts\":[5620343742213913902,16233499605334993645,10697707034807529478]}"
	...
	Aug 27 10:36:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:36:50.054726823Z caller=notify.go:612 component=dispatcher needsUpdates=yes

观察发现每个alert的hash是稳定的，但是entry中记录的`firing_alerts`是变化的，下面日志中的`firing_alert`就不同于上面日志中的：

	Aug 27 10:39:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:39:50.055405663Z caller=notify.go:571 component=dispatcher hash=14034539317761184482
	Aug 27 10:39:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:39:50.05549795Z caller=notify.go:571 component=dispatcher hash=5916134610179335251
	Aug 27 10:39:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:39:50.055515498Z caller=notify.go:571 component=dispatcher hash=5226677708725188421
	Aug 27 10:39:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:39:50.055526024Z caller=notify.go:584 component=dispatcher gkey="{}:{alertname=\"CLUSTER_RABBITMQ_QUEUE_MESSAGE_REACH_LIMIT\"}"
	Aug 27 10:39:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:39:50.055550197Z caller=notify.go:585 component=dispatcher n.recv="web.hook webhook %!u(uint32=0)"
	Aug 27 10:39:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:39:50.056361811Z caller=notify.go:603 component=dispatcher entry="{\"group_key\":
	\"e306e2FsZXJ0bmFtZT0iQ0xVU1RFUl9SQUJCSVRNUV9RVUVVRV9NRVNTQUdFX1JFQUNIX0xJTUlUIn0=\",\"receiver\":{\"group_name\":\"web.hook\",\"integration\":\"webhook\"},\"timestamp\":
	\"2018-08-27T02:38:50.05889615Z\",\"firing_alerts\":[14034539317761184482,5916134610179335251,5226677708725188421]}"

`entry`一直在被改写，导致告警有时候被认为是已经产生的，又是被认为是新的，alertmanager不停地把旧告警当作新告警处理。

	//notify/notify.go:552
	func (n *DedupStage) Exec(ctx context.Context, l log.Logger, alerts ...*types.Alert) (context.Context, []*types.Alert, error) {
		...
		entries, err := n.nflog.Query(nflog.QGroupKey(gkey), nflog.QReceiver(n.recv))
		...
	}

查看n.nflog的实现代码`nflog/nflog.go`，告警记录记录在data目录中的nflog文件中。

nflog在运行中会不停地合并alertmanger集群中，其它alertmanager广播过来的告警记录：

	//nflog/nflog.go:518
	// Merge merges notification log state received from the cluster with the local state.
	func (l *Log) Merge(b []byte) error {
		...
		for _, e := range st {
			if merged := l.st.merge(e); merged && !cluster.OversizedMessage(b) {
				// If this is the first we've seen the message and it's
				// not oversized, gossip it to other nodes. We don't
				// propagate oversized messages because they're sent to
				// all nodes already.
				l.broadcast(b)
				l.metrics.propagatedMessagesTotal.Inc()
				level.Debug(l.logger).Log("msg", "gossiping new entry", "entry", e)
			}
		}
		...
	}

我们的alertmanager集群有两个节点，对比两个节点上的日志，惊奇的发现，两个alertmanager为同名告警生成的hash是不同的：

	//第一个alertmanger
	Aug 27 10:33:50 prod-k8s-node-11-7 alertmanager[20393]: level=debug ts=2018-08-27T02:33:50.04789635Z caller=notify.go:571 component=dispatcher hash=5620343742213913902
	Aug 27 10:33:50 prod-k8s-node-11-7 alertmanager[20393]: level=debug ts=2018-08-27T02:33:50.048045568Z caller=notify.go:571 component=dispatcher hash=16233499605334993645
	Aug 27 10:33:50 prod-k8s-node-11-7 alertmanager[20393]: level=debug ts=2018-08-27T02:33:50.048068063Z caller=notify.go:571 component=dispatcher hash=10697707034807529478
	
	//第二个alertmanger
	Aug 27 10:34:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:34:50.053086065Z caller=notify.go:571 component=dispatcher hash=14034539317761184482
	Aug 27 10:34:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:34:50.053141229Z caller=notify.go:571 component=dispatcher hash=5916134610179335251
	Aug 27 10:34:50 10-19-117-30 alertmanager[3500]: level=debug ts=2018-08-27T02:34:50.053155944Z caller=notify.go:571 component=dispatcher hash=5226677708725188421

而nflog在收到其它alertmanger传送过来的告警记录后，直接用新告警记录替换旧的告警记录：

	//nflog/nflog.go:229
	func (s state) merge(e *pb.MeshEntry) bool {
		k := stateKey(string(e.Entry.GroupKey), e.Entry.Receiver)
		prev, ok := s[k]
		if !ok || prev.Entry.Timestamp.Before(e.Entry.Timestamp) {
			s[k] = e
			return true
		}
		return false
	}

因为两个alertmanager对同一个告警产生的hash是不同的，导致每个alertmanger记录的alert被不停地改写。

nflog的合并策略简单粗暴是原因之一，但起源是alertmanager对同名的告警产生了不同的hash，继续追查。

	//notify/notify.go:552
	func (n *DedupStage) Exec(ctx context.Context, l log.Logger, alerts ...*types.Alert) (context.Context, []*types.Alert, error) {
		gkey, ok := GroupKey(ctx)
		...
		for _, a := range alerts {
				hash = n.hash(a)
				level.Debug(l).Log("hash_", hash)
				bytes, err:=json.Marshal(a)
				if err !=nil{
					level.Debug(l).Log("recvalert", err.Error())
				}else{
					level.Debug(l).Log("recvalert", string(bytes))
				}
				...
			}
	...
	}

把两个alertmanager节点的alert打印出来，发现label不同。

最后发现，分别接入各自alertmanager的prometheus的配置文件不同，设置了不同的标签。

## WAL log samples: log series: write /data/prometheus/wal/000007: file already closed

Prometheus的Target的列表上显示：

	WAL log samples: log series: write /data/prometheus/wal/000007: file already closed

查看日志，发现出现这行日志之前，还有一个日志：

	err="WAL log samples: log series: open /data/prometheus/wal: too many open files"

Github上有人提交过这个问题：

[2.3.0 - WAL log samples: log series: /wal/007913: file already closed ](https://github.com/prometheus/prometheus/issues/4303)

原因是打开文件太多超过ulimit设置。

查看promethesu进程的limits，发现open file的限制是1024，明显不够:

	$ cat /proc/1895/limits
	Limit                     Soft Limit           Hard Limit           Units
	Max cpu time              unlimited            unlimited            seconds
	Max file size             unlimited            unlimited            bytes
	Max data size             unlimited            unlimited            bytes
	Max stack size            8388608              unlimited            bytes
	Max core file size        0                    unlimited            bytes
	Max resident set          unlimited            unlimited            bytes
	Max processes             127964               127964               processes
	Max open files            1024                 4096                 files
	Max locked memory         65536                65536                bytes
	Max address space         unlimited            unlimited            bytes
	Max file locks            unlimited            unlimited            locks
	Max pending signals       127964               127964               signals
	Max msgqueue size         819200               819200               bytes
	Max nice priority         0                    0
	Max realtime priority     0                    0
	Max realtime timeout      unlimited            unlimited            us

在system/prometheus.service中扩大上文件数:

	LimitNOFILE=10240
	

