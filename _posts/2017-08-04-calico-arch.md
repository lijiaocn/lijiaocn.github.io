---
layout: default
title: Calico的架构设计与组件交互过程
author: lijiaocn
createdate: 2017/08/04 15:46:27
changedate: 2017/09/13 12:09:01
categories: 项目
tags: calico
keywords: felix,calico,源码分析,原理说明
description: felix是calico的关键组件，负责设置所在node上的calico网络。

---

* auto-gen TOC:
{:toc}

## 架构

calico由5部分组成,[architecture][2]:

	felix:   部署在每个node上的agent，负责更新dataplane，设置路由、IPtables等
	plugin:  上层应用(k8s/mesos/openstack等)使用plugin与calico绑定
	etcd:    calico的数据存储与变动通知
	bird:    部署在每个node上的bgp client
	BGP Route Reflector:  可选，用于支持更大规模的网络

其中plugin有好多种，例如用于k8s的[cni plugin][3]、用于docker的[libnetwork plugin][4]

## felix

felix监听状态更新，然后设置所在node上的数据面(dataplane)。

felix不会创建endpoint，而是监听endpoint后，为其进行相关设置。

在v2.4.0中的源码中，felix可以调用外部的dataplane程序，也可以使用内置的基于iptable的intdataplane。

intdataplane/int_dataplane.go:

	func NewIntDataplaneDriver(config Config) *InternalDataplane {
		log.WithField("config", config).Info("Creating internal dataplane driver.")
		...
		dp.RegisterManager(newIPSetsManager(ipSetsV4, config.MaxIPSetSize))
		dp.RegisterManager(newPolicyManager(rawTableV4, mangleTableV4, filterTableV4, ruleRenderer, 4))
		dp.RegisterManager(newEndpointManager(
			rawTableV4,
			mangleTableV4,
			filterTableV4,
			ruleRenderer,
			routeTableV4,
			4,
			config.RulesConfig.WorkloadIfacePrefixes,
			dp.endpointStatusCombiner.OnEndpointStatusUpdate))
		dp.RegisterManager(newFloatingIPManager(natTableV4, ruleRenderer, 4))
		dp.RegisterManager(newMasqManager(ipSetsV4, natTableV4, ruleRenderer, config.MaxIPSetSize, 4))
		...

遇到更新时，会依次调用多个Manager的OnUpdate()方法。

intdataplane/int_dataplane.go:

	func (d *InternalDataplane) loopUpdatingDataplane() {
		...
		for _, mgr := range d.allManagers {
			mgr.OnUpdate(msg)
		}
		...

EndpointManager会调用routeTableV4的方法进行路由设置

### 编译

	DOCKER_GO_BUILD := mkdir -p .go-pkg-cache && \
	                   docker run --rm \
	                              --net=host \
	                              $(EXTRA_DOCKER_ARGS) \
	                              -e LOCAL_USER_ID=$(MY_UID) \
	                              -v $${PWD}:/go/src/github.com/projectcalico/felix:rw \
	                              -v $${PWD}/.go-pkg-cache:/go/pkg:rw \
	                              -w /go/src/github.com/projectcalico/felix \
	                              $(GO_BUILD_CONTAINER)
	
	bin/calico-felix: $(FELIX_GO_FILES) vendor/.up-to-date
	    @echo Building felix...
	    mkdir -p bin
	    $(DOCKER_GO_BUILD) \
	        sh -c 'go build -v -i -o $@ -v $(LDFLAGS) "github.com/projectcalico/felix" && \
	               ( ldd bin/calico-felix 2>&1 | grep -q "Not a valid dynamic program" || \
	                 ( echo "Error: bin/calico-felix was not statically linked"; false ) )'

编译过程比较简单，就是将代码目录挂载到容器中，然后在容器中编译。

## cni-plugin

cni-plugin会在指定的network ns中创建veth pair。

位于容器中的veth，将被设置ip，并设置169.254.1.1为默认路由，在容器内可以看到:

	$ip route
	default via 169.254.1.1 dev eth0
	169.254.1.1 dev eth0  scope link

因为169.254.1.1是无效IP，因此，cni-plugin还要在容器内设置一条静态arp:

	$ip neighbor
	169.254.1.1 dev eth0 lladdr ea:88:97:5f:06:d9 STALE

169.254.1.1的mac地址被设置为了veth设备在host中的一端mac地址，容器中所有的报文就会发送到了veth的host端。

cni-plugin创建了endpoint之后，会将其保存到etcd中，felix从而感知到endpoint的变化。

之后，felix会在host端设置一条静态arp:

	192.168.8.42 dev cali69de609d5af lladdr b2:21:5b:82:e1:27 PERMANENT

这样在host上就可以访问容器的地址。

### 非k8s

calico-cni-plugin中将k8s场景下的使用和非k8s场景下的使用分离开了。

	if orchestrator == "k8s" {
		if result, err = k8s.CmdAddK8s(args, conf, nodename, calicoClient, endpoint); err != nil {
			return err
		}
	} else {
		// Default CNI behavior - use the CNI network name as the Calico profile.
		profileID := conf.Name
	......

非k8s的场景中,github.com/projectcalico/cni-plugin/calico.go：

	// There's no existing endpoint, so we need to do the following:
	// 1) Call the configured IPAM plugin to get IP address(es)
	// 2) Configure the Calico endpoint
	// 3) Create the veth, configuring it on both the host and container namespace.

过程很简单，首先查看calico是中是否已经存在了同名的endpoint，如果不存在则创建。

然后在host上创建veth设备，host端命令默认以"caliXX"，容器端命名指定的ifname.

最后更新endpoint的信息，并提交到calico中。

cni-plugin/k8s/k8s.go:

	...
	if _, err := calicoClient.WorkloadEndpoints().Apply(endpoint); err != nil {
		// Cleanup IP allocation and return the error.
		utils.ReleaseIPAllocation(logger, conf.IPAM.Type, args.StdinData)
		return nil, err
	...

### k8s

如果是在k8s下使用，主要是添加对k8s注解的解读，实现指定IP等功能。

github.com/projectcalico/cni-plugin/k8s/k8s.go:

	func CmdAddK8s(args *skel.CmdArgs, conf utils.NetConf, nodename string, calicoClient *calicoclient.Client, endpoint *api.WorkloadEndpoint) (*current.Result, error) {
		var err error
		var result *current.Result

		k8sArgs := utils.K8sArgs{}
		err = types.LoadArgs(args.Args, &k8sArgs)
		......
		ipAddrsNoIpam := annot["cni.projectcalico.org/ipAddrsNoIpam"]
		ipAddrs := annot["cni.projectcalico.org/ipAddrs"]
		......

设置endpoint，创建veth的过程与非k8s场景下的使用相同。

## BIRD

[Bird][6]是一个BGP client，它会主动读取felix在host上设置的路由信息，然后通过BGP协议广播出去。

birdc是bird的client，可以用来查看bird的状态，例如：

查看配置的协议:

	$birdcl -s /var/run/calico/bird.ctl show protocols
	BIRD 1.5.0 ready.
	name     proto    table    state  since       info
	static1  Static   master   up     2017-07-25
	kernel1  Kernel   master   up     2017-07-25
	device1  Device   master   up     2017-07-25
	direct1  Direct   master   up     2017-07-25
	Mesh_10_39_0_105 BGP      master   up     2017-07-25  Established
	Mesh_10_39_0_108 BGP      master   up     05:12:01    Established
	Mesh_10_39_0_109 BGP      master   up     03:24:19    Established
	Mesh_10_39_0_110 BGP      master   up     2017-07-25  Established
	Mesh_10_39_0_112 BGP      master   up     2017-08-01  Established
	Mesh_10_39_0_140 BGP      master   up     2017-08-01  Established

查看所有的路由:

	$birdcl -s /var/run/calico/bird.ctl show route
	BIRD 1.5.0 ready.
	0.0.0.0/0          via 10.39.0.1 on eth0 [kernel1 2017-07-25] * (10)
	192.168.106.64/26  via 10.39.0.108 on eth0 [Mesh_10_39_0_108 05:12:02] * (100/0) [i]
	192.168.8.19/32    dev calibfe34e88015 [kernel1 2017-08-04] * (10)
	192.168.70.0/26    via 10.39.0.110 on eth0 [Mesh_10_39_0_110 2017-07-25] * (100/0) [i]
	192.168.75.192/26  via 10.39.0.140 on eth0 [Mesh_10_39_0_140 2017-08-01] * (100/0) [i]
	192.168.79.0/26    via 10.39.0.109 on eth0 [Mesh_10_39_0_109 03:28:16] * (100/0) [i]
	192.168.8.22/32    dev cali68272c96e2e [kernel1 02:52:03] * (10)
	192.168.8.9/32     dev calia4b4c4fe2bc [kernel1 2017-07-25] * (10)
	192.168.60.128/26  via 10.39.0.140 on eth0 [Mesh_10_39_0_140 2017-08-01] * (100/0) [i]
	192.168.8.0/26     blackhole [static1 2017-07-25] * (200)
	192.168.8.7/32     dev cali4712b101c8e [kernel1 2017-07-26] * (10)
	10.39.0.0/24       dev eth0 [direct1 2017-07-25] * (240)
	192.168.8.60/32    dev calife44c1f2fa1 [kernel1 2017-07-25] * (10)
	192.168.8.61/32    dev cali80bf21ab5d3 [kernel1 2017-08-04] * (10)
	192.168.8.55/32    dev cali4a97c0ab796 [kernel1 2017-07-25] * (10)
	192.168.8.42/32    dev cali69de609d5af [kernel1 2017-08-05] * (10)
	172.17.0.0/16      dev docker0 [direct1 2017-07-25] * (240)
	192.168.8.32/32    dev cali28e5159257d [kernel1 2017-07-25] * (10)
	192.168.136.0/26   via 10.39.0.105 on eth0 [Mesh_10_39_0_105 2017-07-25] * (100/0) [i]
	192.168.141.64/26  via 10.39.0.112 on eth0 [Mesh_10_39_0_112 2017-08-01] * (100/0) [i]
	192.168.8.36/32    dev cali225764131fc [kernel1 2017-07-25] * (10)

可以到[birdc][7]中查看更多的命令。

## 参考

1. [felix][1]
2. [calico architecture][2]
3. [cni-plugin][3]
4. [libenetwork plugin][4]
5. [containernetworking skel][5]
6. [bird][6]
7. [birdc][7]

[1]: https://github.com/projectcalico/felix "felix"
[2]: https://docs.projectcalico.org/v2.4/reference/architecture/ "calico architecture"
[3]: https://github.com/projectcalico/cni-plugin "calico cni-plugin"
[4]: https://github.com/projectcalico/libnetwork-plugin "libenetwork plugin"
[5]: https://github.com/containernetworking/cni/tree/master/pkg/skel "skel" 
[6]: http://bird.network.cz/ "bird"
[7]: http://bird.network.cz/?get_doc&f=bird-4.html "birdc"
