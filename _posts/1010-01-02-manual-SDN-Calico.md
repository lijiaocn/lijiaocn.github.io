---
layout: default
title: 1010-01-01-manual-SDN-Calico
author: lijiaocn
createdate: 2017/04/11 10:58:34
changedate: 2017/04/14 10:53:00
categories:
tags: 手册
keywords:
description: Calico是一个比较有趣的SDN解决方案，利用路由规则在大二层中实现网络隔离。

---

* auto-gen TOC:
{:toc}

## Calico

Calico是一个比较有趣的SDN解决方案，利用路由规则在大二层中实现网络隔离，通过BGP协议，将每个物理机编程一个自治系统。

Calico方案中SDN IP之间完全都是三层互联，IP可以自由漂移，没有Overlay带来的额外开销和运维难度，是一个比较理想的私有云SDN网络方案。

## 名词解释

	endpoint:  接入到网络中的设备称为endpoint
	AS:        网络自治系统，一个完全自治的网络，通过BGP协议与其它AS交换路由信息。
	ibgp:      AS内部的bgp speaker，与同一个AS内部的ibgp、ebgp交换路由信息。
	ebgp:      AS边界的bgp speaker，与其它AS的ebgp交换路由信息。
	
	workloadEndpoint:  Calico用来特指Calico网络中的虚拟机、容器。
	hostEndpoints:     Calico用来特指Calico网络中的物理机。

## 组网原理

Calico组合的核心原理就是IP路由，nodeA上的endpoint访问nodeB上的endpoint时，nodeA中的enpoints发出的报文的下一跳是nodeB的地址，nodeA直接通过设置目的MAC(中间可能经过TOR交换机、核心交换机)将报文送达nodeB。

核心问题是，nodeA怎样得知下一跳的地址？答案是node之间通过BGP协议交换路由信息。

node上运行的BGP软件bird是一个bgp speaker，它与其它node上的bird、路由器等通过标准的BGP协议，交换路由信息。

可以简单理解为，每一个bird都会向其它bird通知这样的信息:

	我是X.X.X.X，某个IP或者网段在我这里，它们的下一跳地址是我。

BGP是路由器之间的通信协议，主要有AS（Autonomous System,自治系统）的场景下使用。

AS，自治系统，是一个自治的网络，内部拥有交换机、路由器等，可以独立运转。

每个AS拥有一个全球统一分配的16位的ID号，其中64512到65535共1023个AS号码被预留用于本地或者私用。

	calico默认使用的AS号是64512，可以修改：
	calicoctl config get asNumber         //查看
	calicoctl config set asNumber 64512   //设置

每个AS有一个或多个ebgp（与其它AS建立BGP连接的bgp speaker)，ebgp从ibgp（AS内部的bgp speaker)中获得本AS内部的路由信息，然后通告给其它的AS，ibgp从ebgp那里得知其它AS系统的地址和到达方式。

BGP原本是路由器之间的通信协议，Calico将其运用在了node之间，相当于把node改造成了一个路由器，node上的虚拟机、容器等就是接入这个路由器的设备。

### 默认的bgp speaker全互联模式

一个AS内部的bgp speaker之间有两种BGP组网方式：

	全互联模式
	Router reflection(RR)模式

全互联模式，就是一个bgp speaker需要与其它所有的bgp speaker建立bgp连接（形成一个bgp mesh），网络中bgp总连接数是O(n^2)，这种模式下，网络中不能有太多的bgp speaker。

RR模式，就是在网络中指定一个或多个bgp speaker作为Router Reflection，RR与所有的bgp speaker建立bgp连接，其它bgp speaker只需要与RR交换路由信息。

Calico默认使用全互联的方式，扩展性比较差，只能支持小规模集群，可以打开/关闭全互联模式：

	calicoctl config set nodeToNodeMesh off
	calicoctl config set nodeToNodeMesh on

### 使用Global Peer切换到RR模式

Global Peer是一个bgp speaker，需要手动在Calico中创建，所有的node都会与Global peer建立BGP连接。

	A global BGP peer is a BGP agent that peers with every Calico node in the network. A typical use case for a global peer might be a mid-scale deployment where all of the Calico nodes are on the same L2 network and are each peering with the same Route Reflector (or set of Route Reflectors).

关闭了全互联模式后，再将RR作为Global Peers添加到Calico中，Calico网络就切换到了RR模式，可以支撑容纳更多的node。

Global Peer可以有多个。

### 使用Node Peer进行精细规划

Node peer也是一个bgp speaker，需要手动在Calico中创建。

与Global Peer不同的是，只有Node Peer中指定的Node才会与它建立BGP链接。

因此，可以关闭全互联模式、也不创建Global Peer，而为每一个Node指定不同的BGP Peer，实现更精细的规划。

例如当集群规模进一步扩大的时候，可以使用[AS Per Pack model][10]:

	TOR交换机之间全互联，而机架上的node只与所在机架TOR交换机建立BGP连接，每个机架是一个AS。

另外，可以明确的指定一个node所属的AS（见后面node的资源格式），结合Node Peer实现精细的规划。

## 组网方式

Calico网络对底层的网络的要求很少，只要求node之间能够通过IP联通。可以有以下的几种组网方式。

需要注意的是，无论采用下面哪种组网方式，一定会有一个设备存放全网路由。在Calico中，全网路由的数目和endpoints的数目一致。（可以有有优化措施，但不会改变最坏情况）

如果有1万个endpoints，那么就至少要有处理1万条路由的能力，路由数量过多时，很可能会超过物理交换机和路由器的处理能力。全网能够处理的路由数目就是Calico网络规模的上限。

### 全网一个AS

	1. RR和所有的node使用同一个AS
	2. 被指定为RR的设备与所有的node建立BGP连接

Node数量太多时，RR需要维持太多的BGP连接。

这种组网方式能够实现的网络规模最小，每个Node都需要与RR建立一个BGP连接，很容易就超出RR的处理能力，不仅全网路由数目是个问题，RR能够保持的BGP连接数也是问题。

除非能够开发一个分布式部署、可以水平扩展的RR系统，就是因为缺少一个这样的RR系统，才会有后续的三种组网方式，它们试图将全网路由的处理压力、BGP连接的保持压力，分散到TOR交换机和核心交换机。

![calico-l2-rr-spine-planes]({{ site.imglocal }}/calico-l2-rr-spine-planes.png)

每个node接入了四个独立的二层网络，每个二层网络内部使用RR模式，node根据ECMP（等价路由协议）决定使用哪一个二层网络。（使用了四个二层网络是为了提高容灾能力，只要有一个二层网没有瘫痪，就可以运转）

endpoints之间的通信过程:

	EndpointA发出报文  --> NodeA找到了下一跳地址NodeB --> 报文送到TOR交换机
	                                                         |
	EndpointB收到了报文 <-- TOR交换机将报文转发给NodeB  <---------+

因为Calico只将node、router等物理设备接入到二层网络，endpoints只接入到了node这个虚拟机的路由器，不会向承载网络中发送广播包，因此不会形成一个包含大量endpoints、广播风暴频发、变换频繁的二层网。

>同一个广播域的二层网承受不了太多的接入点，大量广播包会占用大量带宽，如果接入点频繁变化（由容器和虚拟机组成的二层网中这种情况很常见），情况会更糟糕，会导致交换机疲于更新链路信息（生成树协议）。Calico通过将endpoint的广播域限制在Node中，防止这种情况的发生。

### 每个机架一个AS，TOR交换机将多个AS连接

	1. 同一个机架上的TOR交换机和node使用同一个AS
	2. TOR交换机与同一个机架上的所有node建立BGP连接
	3. TOR交换机与其它所有的TOR交换机建立BGP连接

每个机架上node的数目是有限的，但机架数量可能很多。

因此TOR交换机数量太多时，每个TOR交换机还是需要维持太多的BGP连接。

![calico-l3-fabric-diagrams-as-rack-l2-spine]({{ site.imglocal }}/calico-l3-fabric-diagrams-as-rack-l2-spine.png)

endpoints之间的通信过程:

	EndpointA发出报文  --> NodeA找到了下一跳地址NodeB --> 报文送到TOR交换机A --> 报文送到核心交换机
	                                                                                      |
	                                                                                      v
	EndpointB收到了报文 <--  NodeB收到了报文 <-- TOR交换机B收到了报文 <--  核心交换机将报文送达TOR交换机B


### 每个机架一个AS，TOR交换机和核心交换机将多个AS连接

	1. 同一个机架上的TOR交换机和node使用同一个AS
	2. TOR交换机与同一个机架上的所有node建立BGP连接
	3. 核心交换机与所有的TOR交换机建立BGP连接

TOR交换机数量太多时，核心交换机的需要维持太多的BGP连接，核心交换机的配置一般要好于TOR交换机。

![calico-l3-fabric-diagrams-as-rack-l3-spine]({{ site.imglocal }}/calico-l3-fabric-diagrams-as-rack-l3-spine.png)

endpoints之间的通信过程与上一个组网方式中的过程相同。

是否将核心交换机作为TOR交换机的RR，是这两种组网方式的唯一区别。

### 使用“Downward Default model”减少需要记录的路由

Downward Default Model只是在上面的几种组网方式的基础上，优化了路由的管理。

在上面的三种方式中，每个node、每个TOR交换机、每个核心交换机都需要记录全网路由。

"Downward Default model"模式中:

	1. 每个node只记录自己所承担的endpoint的路由，默认路由设置为TOR
	2. 每个TOR只记录连接到自己的Node中的路由，默认路由设置为核心交换机
	3. 核心交换机依然需要记录全网路由

这种模式减少了TOR交换机和Node上的路由数量，但缺点是，发送到无效IP的流量必须到达核心交换机以后，才能被确定为无效。

endpoints之间的通信过程:

	EndpointA发出报文  --> NodeA默认路由到TOR交换机A --> TOR交换机A默认路由到核心交换机 --+
	                                                                                      |
	                                                                                      v
	EndpointB收到了报文 <--  NodeB收到了报文 <-- TOR交换机B收到了报文 <-- 核心交换机找到了下一跳地址NodeB
## 组成

Calico系统组成:

	1. Felix, the primary Calico agent that runs on each machine that hosts endpoints.
	2. etcd, the data store.
	3. BIRD, a BGP client that distributes routing information.
	4. BGP Route Reflector (BIRD), an optional BGP route reflector for higher scale.
	5. The Orchestrator plugin, orchestrator-specific code that tightly integrates Calico into that orchestrator.

[Felix][3]负责管理设置node，

[bird][12]是一个开源的软路由，支持多种路由协议。

## 概念

[文献7][7]介绍了每类资源的格式。

### bgpPeer


	apiVersion: v1
	kind: bgpPeer
	metadata:
	  scope: node
	  node: rack1-host1
	  peerIP: 192.168.1.1
	spec:
	  asNumber: 63400
	  
bgpPeer的scope可以是node、global。

### hostEndpoint

	apiVersion: v1
	kind: hostEndpoint
	metadata:
	  name: eth0
	  node: myhost
	  labels:
	    type: production
	spec:
	  interfaceName: eth0
	  expectedIPs:
	  - 192.168.0.1
	  - 192.168.0.2
	  profiles:
	  - profile1
	  - profile2

### ipPool

	apiVersion: v1
	kind: ipPool
	metadata:
	  cidr: 10.1.0.0/16
	spec:
	  ipip:
	    enabled: true
	    mode: cross-subnet
	  nat-outgoing: true
	  disabled: false

### node

	apiVersion: v1
	kind: node
	metadata:
	  name: node-hostname
	spec:
	  bgp:
	    asNumber: 64512
	    ipv4Address: 10.244.0.1/24
	    ipv6Address: 2001:db8:85a3::8a2e:370:7334/120

### policy

	apiVersion: v1
	kind: policy
	metadata:
	  name: allow-tcp-6379
	spec:
	  selector: role == 'database'
	  ingress:
	  - action: allow
	    protocol: tcp
	    source:
	      selector: role == 'frontend'
	    destination:
	      ports:
	      - 6379
	  egress:
	  - action: allow
	  
A Policy resource (policy) represents an ordered set of rules which are applied to a collection of endpoints which match a label selector.

### profile

	apiVersion: v1
	kind: profile
	metadata:
	  name: profile1
	  labels:
	    profile: profile1 
	spec:
	  ingress:
	  - action: deny
	    source:
	      net: 10.0.20.0/24
	  - action: allow
	    source:
	      selector: profile == 'profile1'
	  egress:
	  - action: allow 
	  
A Profile resource (profile) represents a set of rules which are applied to the individual endpoints to which this profile has been assigned.

### workloadEndpoint

	apiVersion: v1
	kind: workloadEndpoint
	metadata:
	  name: eth0 
	  workload: default.frontend-5gs43
	  orchestrator: k8s
	  node: rack1-host1
	  labels:
	    app: frontend
	    calico/k8s_ns: default
	spec:
	  interfaceName: cali0ef24ba
	  mac: ca:fe:1d:52:bb:e9 
	  ipNetworks:
	  - 192.168.0.0/16
	  profiles:
	  - profile1
	  
A Workload Endpoint resource (workloadEndpoint) represents an interface connecting a Calico networked container or VM to its host.

## 安装

### CentOS上安装

需要提前准备一个etcd，etcd的安装，这里不介绍。

#### 安装calicoctl

calicoctl是Calico的管理工具:

	wget https://github.com/projectcalico/calicoctl/releases/download/v1.1.0/calicoctl
	chmod +x calicoctl

By default calicoctl looks for a configuration file at /etc/calico/calicoctl.cfg:

	apiVersion: v1
	kind: calicoApiConfig
	metadata:
	spec:
	  datastoreType: "etcdv2"
	  etcdEndpoints: "http://etcd1:2379,http://etcd2:2379"
	  ...

如果配置文件不存在，则使用环境变量，spec中的field与环境变量的对应关系:

	Spec field     Environment      Examples                 Description   
	---------------------------------------------------------------------------
	datastoreType  DATASTORE_TYPE    etcdv2               Indicates the datastore to use (optional, defaults to etcdv2)
	etcdEndpoints  ETCD_ENDPOINTS    http://etcd1:2379    A comma separated list of etcd endpoints (optional, defaults to http://127.0.0.1:2379)
	etcdUsername   ETCD_USERNAME     "user"               Username for RBAC (optional)
	etcdPassword   ETCD_PASSWORD     "password"           Password for the given username (optional)
	etcdKeyFile    ETCD_KEY_FILE     /etc/calico/key.pem  Path to the etcd key file (optional)     
	etcdCertFile   ETCD_CERT_FILE    /etc/calico/cert.pem Path to the etcd client cert (optional)     
	etcdCACertFile ETCD_CA_CERT_FILE /etc/calico/ca.pem   Path to the etcd CA file (optional)     

#### 安装felix

可以直接在每个机器上安装felix的二进制文件，也可以用容器的方式部署felix。

##### 二进制安装

或者在每个节点上单独安装felix，创建文件/etc/yum.repos.d/calico.repo，并添加内容:

	[calico]
	name=Calico Repository
	baseurl=http://binaries.projectcalico.org/rpm/calico-2.1/
	enabled=1
	skip_if_unavailable=0
	gpgcheck=1
	gpgkey=http://binaries.projectcalico.org/rpm/calico-2.1/key
	priority=97

安装:

	yum install calico-felix

查看已经安装文件:

	$rpm -ql  calico-felix
	/etc/calico/felix.cfg.example
	/etc/logrotate.d/calico-felix
	/usr/bin/calico-felix
	/usr/lib/systemd/system/calico-felix.service

	$rpm -ql  calico-common
	/usr/bin/calico-diags
	/usr/bin/calico-gen-bird-conf.sh
	/usr/bin/calico-gen-bird-mesh-conf.sh
	/usr/bin/calico-gen-bird6-conf.sh
	/usr/bin/calico-gen-bird6-mesh-conf.sh
	/usr/share/calico/bird/calico-bird-peer.conf.template
	/usr/share/calico/bird/calico-bird.conf.template
	/usr/share/calico/bird/calico-bird6-peer.conf.template
	/usr/share/calico/bird/calico-bird6.conf.template

##### 容器的方式

默认使用的镜像quay.io/calico/node，但quay.io在国内被墙，用docker.io中的镜像代替：

	 docker pull docker.io/calico/node

启动felix:

	calicoctl node run --node-image=docker.io/calico/node:latest

下面是启动过程中日志:

	Running command to load modules: modprobe -a xt_set ip6_tables
	Enabling IPv4 forwarding
	Enabling IPv6 forwarding
	Increasing conntrack limit
	Removing old calico-node container (if running).
	Running the following command to start calico-node:

	docker run --net=host --privileged --name=calico-node -d --restart=always -e CALICO_NETWORKING_BACKEND=bird -e CALICO_LIBNETWORK_ENABLED=true -e CALICO_LIBNETWORK_CREATE_PROFILES=true -e CALICO_LIBNETWORK_LABEL_ENDPOINTS=false -e ETCD_SCHEME=http -e ETCD_ENDPOINTS= -e NODENAME=compile -e NO_DEFAULT_POOLS= -e IP_AUTODETECTION_METHOD=first-found -e IP6_AUTODETECTION_METHOD=first-found -e CALICO_LIBNETWORK_IFPREFIX=cali -e ETCD_AUTHORITY=127.0.0.1:2379 -v /var/log/calico:/var/log/calico -v /var/run/calico:/var/run/calico -v /lib/modules:/lib/modules -v /run/docker/plugins:/run/docker/plugins -v /var/run/docker.sock:/var/run/docker.sock docker.io/calico/node:latest

	Image may take a short time to download if it is not available locally.
	Container started, checking progress logs.

	Skipping datastore connection test
	Using autodetected IPv4 address on interface eth1: 192.168.40.2/24
	No AS number configured on node resource, using global value
	Created default IPv4 pool (192.168.0.0/16) with NAT outgoing enabled. IPIP mode: off
	Created default IPv6 pool (fd80:24e2:f998:72d6::/64) with NAT outgoing enabled. IPIP mode: off
	Using node name: compile
	Starting libnetwork service
	Calico node started successfully

从日志中可以看到，容器使用的是host net、通过-e传入环境变量。

## 使用

在calico中，IP被称为Endpoint，宿主机上的容器IP称为workloadEndpoint，物理机IP称为hostEndpoint。ipPool等一同被作为资源管理。

查看默认的地址段:

	./calicoctl get ippool -o wide
	CIDR                       NAT    IPIP
	192.168.0.0/16             true   false
	fd80:24e2:f998:72d6::/64   true   false

### Node管理

查看当前Node是否满足运行calico的条件:

	calicoctl node <command> [<args>...]
	
	    run          Run the Calico node container image.
	    status       View the current status of a Calico node.
	    diags        Gather a diagnostics bundle for a Calico node.
	    checksystem  Verify the compute host is able to run a Calico node instance.

### 运行时设置

[calicoctl config][6]更改calico的配置项.

### 创建/查看/更新/删除资源

分别使用creat/get/replace/delete来创建/查看/更新/删除资源。

创建资源:

	calicoctl create --filename=<FILENAME> [--skip-exists] [--config=<CONFIG>]

资源使用yaml文件描述，可以创建以下资源:

	node                //物理机
	bgpPeer             //与本机建立了bgp连接的node
	hostEndpoint 
	workloadEndpoint
	ipPool 
	policy 
	profile

查看资源:

	calicoctl get ([--scope=<SCOPE>] [--node=<NODE>] [--orchestrator=<ORCH>]
	          [--workload=<WORKLOAD>] (<KIND> [<NAME>]) |
	          --filename=<FILENAME>)
	          [--output=<OUTPUT>] [--config=<CONFIG>]

可以通过下面命令查看所有资源:

	calicoctl  get  [资源类型］
	
	例如:
	    calicoctl get node

### IP地址管理

	calicoctl ipam <command> [<args>...]
	
	  release      Release a Calico assigned IP address.         
	  show         Show details of a Calico assigned IP address.

## 参考

1. [洪强宁：宜信PaaS平台基于Calico的容器][1]
2. [calico architecture][2]
3. [felix code][3]
4. [felix bare-metal-install][4]
5. [calicoctl][5]
6. [calicoctl config][6]
7. [calicoctl resource definitions][7]
8. [Battlefield-Calico-Flannel-Weave-and-Docker-Overlay-Network][8]
9. [calico bgpPeer][9]
10. [AS Per Rack model][10]
11. [Calico over an Ethernet interconnect fabric][11]
12. [bird][12]

[1]: http://mt.sohu.com/20160225/n438516745.shtml "洪强宁：宜信PaaS平台基于Calico的容器"
[2]: http://docs.projectcalico.org/master/reference/architecture/ "calico architecture"
[3]: https://github.com/projectcalico/felix  "felix code"
[4]: http://docs.projectcalico.org/v2.1/getting-started/bare-metal/bare-metal-install "felix bare-metal-install"
[5]: http://docs.projectcalico.org/v2.1/reference/calicoctl/ "calicoctl"
[6]: http://docs.projectcalico.org/v2.1/reference/calicoctl/commands/config "calicoctl config"
[7]: http://docs.projectcalico.org/v2.1/reference/calicoctl/resources/ "calicoctl resource definitions"
[8]: http://chunqi.li/2015/11/15/Battlefield-Calico-Flannel-Weave-and-Docker-Overlay-Network/ "Battlefield-Calico-Flannel-Weave-and-Docker-Overlay-Network"
[9]: http://docs.projectcalico.org/v2.1/usage/configuration/bgp "cacilo bgpPeer"
[10]: http://docs.projectcalico.org/v2.1/reference/private-cloud/l3-interconnect-fabric#the-as-per-rack-model "AS Per Rack model"
[11]: http://docs.projectcalico.org/v2.1/reference/private-cloud/l2-interconnect-fabric "Calico over an Ethernet interconnect fabric"
[12]: http://bird.network.cz/ "bird"
