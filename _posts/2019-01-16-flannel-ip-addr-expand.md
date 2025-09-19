---
layout: default
title: "flannel ip 地址段扩容方法"
author: 李佶澳
createdate: "2019-01-16 13:53:08 +0800"
last_modified_at: "2023-04-12 16:39:53 +0800"
categories: 技巧
tags: flannel
keywords: flannel,flanneld,kubernetes
description: flannel的网段设置的过小，导致kuberntes集群最多只能有256个node，需要对flannel的网段进行扩容。
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

历史原因，flannel的网段设置的过小，导致kubernetes集群最多只能有256个node，这显然是不行的，需要对flannel进行扩容。Flannel版本是0.7.0。

[Kubernetes网络方案Flannel的学习笔记](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/09/kubernetes-flannel-study-note.html#%E5%85%B6%E5%AE%83%E5%86%85%E5%AE%B9)

## Flannel的子网的获取

Flannel的子网有几种获取方式。

第一种是所有flanneld都直连etcd，自主决定要使用的子网，抢占的方式。

第二种是部署flannel server（运行在server模式的flannel），flanneld连接flannel server。

第三种是flanneld直连kube-apiserver，从kube-apiserver中获取子网网段，`-kube-subnet-mgr`

当前接手的环境使用的是第一种方式，后两种方式没用过，这里也不探讨了。

阅读0.7.0代码，找到了申请子网的实现代码：

```go
// flannel/subnet/local_manager.go: 124
func (m *LocalManager) tryAcquireLease(ctx context.Context, network string, config *Config, extIaddr ip.IP4, attrs *LeaseAttrs) (*Lease, error) {
	leases, _, err := m.registry.getSubnets(ctx, network)
	if err != nil {
		return nil, err
	}
	// try to reuse a subnet if there's one that matches our IP
	if l := findLeaseByIP(leases, extIaddr); l != nil {
		...（省略）...
	}
	
	// no existing match, grab a new one
	sn, err := m.allocateSubnet(config, leases)
	if err != nil {
		return nil, err
	}
	
	exp, err := m.registry.createSubnet(ctx, network, sn, attrs, subnetTTL)
	switch {
		...（省略）...
	}
}

```

可以看到首先会用node的IP查找子网，如果子网已经存在就不新建。

创建新子网的过程就是找到一个还没有被使用的子网：

```go
// flannel/subnet/local_manager.go: 178
func (m *LocalManager) allocateSubnet(config *Config, leases []Lease) (ip.IP4Net, error) {
	log.Infof("Picking subnet in range %s ... %s", config.SubnetMin, config.SubnetMax)
	
	var bag []ip.IP4
	sn := ip.IP4Net{IP: config.SubnetMin, PrefixLen: config.SubnetLen}
	
OuterLoop:
	for ; sn.IP <= config.SubnetMax && len(bag) < 100; sn = sn.Next() {
		for _, l := range leases {
			if sn.Overlaps(l.Subnet) {
				continue OuterLoop
			}
		}
		bag = append(bag, sn.IP)
	}
	
	if len(bag) == 0 {
		return ip.IP4Net{}, errors.New("out of subnets")
	} else {
		i := randInt(0, len(bag))
		return ip.IP4Net{IP: bag[i], PrefixLen: config.SubnetLen}, nil
	}
}
```

子网信息写入etcd的时候，是以子网地址为key的，从而确保子网不会重叠、冲突：

```go
// flannel/subnet/registry.go: 165
func (esr *etcdSubnetRegistry) createSubnet(ctx context.Context, network string, sn ip.IP4Net, attrs *LeaseAttrs, ttl time.Duration) (time.Time, error) {
	key := path.Join(esr.etcdCfg.Prefix, network, "subnets", MakeSubnetKey(sn))
	value, err := json.Marshal(attrs)
	if err != nil {
		return time.Time{}, err
	}
	
	opts := &etcd.SetOptions{
		PrevExist: etcd.PrevNoExist,
		TTL:       ttl,
	}
	
	resp, err := esr.client().Set(ctx, key, string(value), opts)
	if err != nil {
		return time.Time{}, err
	}
	
	exp := time.Time{}
	if resp.Node.Expiration != nil {
		exp = *resp.Node.Expiration
	}
	
	return exp, nil
}
```

## Flannel网段扩容

根据上面的分析，可以得到初步结论： 只要每个node上的子网前缀是不变的，调整flannel整个网段的前缀就是安全的，已有node分配的网段不会发生变化，新增node的网段不会与其它node的网段重叠。

直接修改Flannel网段：

```
etcdctl set  /coreos.com/network/config  '{"Network":"11.0.0.0/8"}'
```

>这个配置相当简洁，默认使用udp模式，不是推荐的方式，这里只是试验，就不考虑那么多了。

扩容之后，新增node的网段情况如下：
 
```
$ cat /run/flannel/subnet.env
FLANNEL_NETWORK=11.0.0.0/8      《《 网段前缀是/8
FLANNEL_SUBNET=11.0.47.1/24
FLANNEL_MTU=1426
FLANNEL_IPMASQ=false
```

已有node的上的网段还是以前的配置，
 
```
$ cat /run/flannel/subnet.env
FLANNEL_NETWORK=11.0.0.0/16     《《  注意还是/16
FLANNEL_SUBNET=11.0.98.1/24
FLANNEL_MTU=1426
FLANNEL_IPMASQ=false
```
 
Pod之间的通信不受影响，并且将已有node上的flannel重启后，子网配置会自动刷新：

```
$ cat /run/flannel/subnet.env
FLANNEL_NETWORK=11.0.0.0/8     《《  前缀刷新
FLANNEL_SUBNET=11.0.98.1/24    《《  子网网段不变
FLANNEL_MTU=1426
FLANNEL_IPMASQ=false
```

## Flannel多网段

Flannel曾经支持“多网段的方式”，但是后来又将这个特性移除了[Remove the experimental support for multiple networks](https://github.com/coreos/flannel/pull/633)，因此不考虑也无须考虑多网段方案。

## 参考

1. [flannel is a network fabric for containers, designed for Kubernetes ][1]

[1]: https://github.com/coreos/flannel  "flannel is a network fabric for containers, designed for Kubernetes "
