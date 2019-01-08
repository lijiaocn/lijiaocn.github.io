---
layout: default
title: "Envoy Proxy使用介绍（七）：envoy动态配置xDS的使用方法"
author: 李佶澳
createdate: "2018-12-29 10:53:58 +0800"
changedate: "2018-12-29 10:53:58 +0800"
categories: 项目
tags: envoy 视频教程
keywords: envoy动态配置,envoy management server,envoy服务发现,cds,lds,ads,xds协议
description: 可以通过Management Server动态配置listener、cluster、endpoint、route等envoy用到的资源
---

* auto-gen TOC:
{:toc}

## 说明

Envoy使用的资源可以在配置文件中静态配置，可以通过配置文件中设置的地址，进行动态配置，
[Dynamic configuration](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/dynamic_configuration#arch-overview-dynamic-config)中对CDS/EDS/LDS/RDS/SDS作了介绍，其它页面中介绍了
[ADS](https://www.envoyproxy.io/docs/envoy/latest/configuration/overview/v2_overview#aggregated-discovery-service)和
[HDS](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto#config-bootstrap-v2-bootstrap)，另外
[data-plane-api](https://github.com/envoyproxy/data-plane-api/blob/master/API_OVERVIEW.md#apis)中介绍说，还有`RLS`（Rate Limit Service）和`MS`（Metric Service）。

**TODO:**

- [x] cds:  Cluster（upstream cluster）发现
- [x] eds:  Endpoint（upstream server）发现
- [x] lds:  Listener（监听器）发现
- [x] rds:  Route（路由规则）发现
- [ ] sds:  Secret（证书）发现

- [x] ads: Aggregated Discovery Service
- [ ] hds: Health discovery service 
- [ ] rls: Rate Limit Service 
- [ ] ms:  Metric Service

## 概览

动态配置主要是在[dynamic_resources](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html#dynamic_resources---%E5%8A%A8%E6%80%81%E5%8F%91%E7%8E%B0)中配置，
[Dynamic](https://www.envoyproxy.io/docs/envoy/latest/configuration/overview/v2_overview#dynamic)中给出了一个例子：

```yaml
admin:
  access_log_path: /tmp/admin_access.log
  address:
    socket_address: { address: 127.0.0.1, port_value: 9901 }

dynamic_resources:
  lds_config:
    api_config_source:
      api_type: GRPC
      grpc_services:
        envoy_grpc:
          cluster_name: xds_cluster
  cds_config:
    api_config_source:
      api_type: GRPC
      grpc_services:
        envoy_grpc:
          cluster_name: xds_cluster

static_resources:
  clusters:
  - name: xds_cluster
    connect_timeout: 0.25s
    type: STATIC
    lb_policy: ROUND_ROBIN
    http2_protocol_options: {}
    load_assignment:
      cluster_name: xds_cluster
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 5678
```

这个例子中`static_resources`只配置了一个`xds_cluster`，这是`Management Server`的地址。

`lds_config`和`cds_config`都指向了这个`xds_cluster`，它们用的是同一个`Management Server`，envoy从中从Mangement Server中获取cluster、listener列表以及其中的endpoint、route列表等。

## Management Server

要实现动态配置，需要有一个实现了[data-plane-api](https://github.com/envoyproxy/data-plane-api)的Management Server。
Data-plane-api是envoy项目定义的，目标是成为数据平面的接口标准，api的详细定义参阅：[API_OVERVIEW.md](https://github.com/envoyproxy/data-plane-api/blob/master/API_OVERVIEW.md#apis)，这个文件中以及包含的链接中的介绍，比envoy的官方的文档清晰、细致。

Data-plane-api的定义有以下特定：

1. 使用GRPC协议，支持转换成Json（gRPC-JSON）。
2. 通过xDS发现的内容是最终一致的，CDS/LDS等不同渠道的服务发现有先有后，可以通过ADS保证配置的下发顺序。
3. Listener发生变化的时候，需要等已有的连接被“排空”，或者排空等待超时后，才会应用最新的配置。
4. CDS/EDS/LDS/RDS/SDS有REST-JSON接口，HDS,/ADS/EDS multi-dimensional LB只支持GRPC。

Envoy提供了一个用Go语言实现的[go-control-plane](https://github.com/envoyproxy/go-control-plane)，是data-plane-api的go语言代码接口。 

### xDS协议

[xDS REST and gRPC protocol][3]详细介绍了xDS协议，采用长连接、流式更新（stream）。 

下面是阅读[xDS REST and gRPC protocol][3]时做的摘要，如有冲突，以原始文档为准。

Envoy先发送消息请求数据，版本号为空：

```yaml
version_info:
node: { id: envoy }
resource_names:
- foo
- bar
type_url: type.googleapis.com/envoy.api.v2.ClusterLoadAssignment
response_nonce:
```

Management Server返回带有版本号的数据：

```yaml
version_info: X
resources:
- foo ClusterLoadAssignment proto encoding
- bar ClusterLoadAssignment proto encoding
type_url: type.googleapis.com/envoy.api.v2.ClusterLoadAssignment
nonce: A
```

Envoy需要给Management Server回馈，之后只有当Envoy请求的资源发生变化的时候，Management Server才会主动向Envoy推送更新。

由envoy决定要监控哪些资源，对于CDS和LDS，如果`resource_names`为空，表示监控所有Cluster和Listener的变化，EDS和RDS则是从属于各自的CDS和LDS。

Management Server对EDS和RDS的响应有些特别，响应中可能不包含请求的资源，并且可能会多回应一些资源。这是因为Management Server会根据node的ID，推断Envoy需要哪些EDS/RDS。

Envoy可以用同样的版本号再次向Management Server发送请求，通过在这个请求中更改resource_names，从而变更要监控的资源。

请求与响应之间是通过`nonce`字段关联的，注意不是通过`version_info`，因为envoy在更新要监控的资源时，会使用相同的version_info。

![envoy监控的资源更新过程](https://raw.githubusercontent.com/envoyproxy/data-plane-api/master/diagrams/update-race.svg?sanitize=true)

版本过期的请求，Management Server不予回应。

![envoy发送过去的请求](https://raw.githubusercontent.com/envoyproxy/data-plane-api/master/diagrams/stale-requests.svg?sanitize=true)

需要特别注意的是，Managerment Sserver可以有多个。

比方说CDS和LDS可以分别连接两个不同的Management Server，它们各自的EDS以及RDS可以继续连接其它的Management Server。

不同的xDS可以分别连接不同的Management Server，因此更新会有先后，因此可能出现数据不一致的情况。
比如一个路由规则更新了，需要转发到另一个新加的cluster，但是新的cluster配置可能还没有收到，这时候请求无处转发。

data-plane-api保证的是`最终一致性`，保证envoy最终会得到完整一直的配置，但是数据不一致期间可能会丢失一些请求，

可以在实现Management Server时，严格控制的响应的顺序，避免这种情况：

	CDS updates (if any) must always be pushed first.
	EDS updates (if any) must arrive after CDS updates for the respective clusters.
	LDS updates must arrive after corresponding CDS/EDS updates.
	RDS updates related to the newly added listeners must arrive in the end.
	Stale CDS clusters and related EDS endpoints (ones no longer being referenced) can then be removed.

更好的方法是使用能够响应所有资源请求的[ADS（Aggregated Discovery Services）](https://github.com/envoyproxy/data-plane-api/blob/master/XDS_PROTOCOL.md#aggregated-discovery-services-ads)

![ADS](https://raw.githubusercontent.com/envoyproxy/data-plane-api/master/diagrams/ads.svg?sanitize=true)

[go-control-plane][1]已经通过了提供ADS接口。

使用GRPC协议的`ADS`、`CDS`和`RDS`支持`增量更新（Incremental xDS）`，即Management Server只返回发生变化的资源。

### go-control-plane

[go-control-plane][1]。

#### go-control-plane不是Manager Server

需要注意的是[go-control-plane](https://github.com/envoyproxy/go-control-plane)本身不是manager server，它是一个实现了[data-plane-api][4]的代码库。

go-control-plane将grpc通信的功能都实现了，可以直接用于Management Server开发，是可以直接使用的`数据平面的SDK`。
在go-control-plane的基础上开发manager server时，只需要考虑配置数据的存取，不需要考虑如何与eonvy通信。

逻辑层次如下：


```
                                 ***************       
                             ****               ****   
                          ***      配置数据存放     ***
                          *         譬如数据库等       *
                          ***                       ***
                             ****               ****   
                                 ***************       
                                        ^
                                        |
                                        |
                                Manager Server实现
                  +--------------------------------------------+
                  |                                            |
                  |           实现配置的存储逻辑               |
                  |                                            |
                  |--------------------------------------------|
                  |             go-control-plane               |
                  |                  GRPC                      |
                  +--------------------------------------------+
                         ^                             ^
                         | grpc                        | grpc
                         |                             |
                   ***********                    ***********      
                ***           ***              ***           ***   
              **      Envoy      **          **      Envoy      ** 
                ***           ***              ***           ***   
                   ***********                    ***********      
```

#### 安装go-control-plane

本地需要安装protobuf，make运行时指定的脚本中用到`protoc`命令来自于protobuf，go-control-plane要求grpc是3.5.0及以上版本。

```bash
echo "Expecting protoc version >= 3.5.0:"
protoc=$(which protoc)
$protoc --version
```

在mac上可以直接用brew安装protobuf：

```bash
$ brew install protobuf
$ protoc --version
libprotoc 3.6.1
```

下载go-control-plane代码，并编译：

```bash
go get github.com/envoyproxy/go-control-plane
cd $GOPATH/src/github.com/envoyproxy/go-control-plane

make tools
make depend.install
make generate
make check
make build
```

注意编译结束后，没有可执行文件的生成。因为go-control-plane只是一个代码库，没有`main`函数。

#### 使用go-control-plane开发Manager Server

在go-control-plane目录下创建文件`main.go`，代码结构如下：

```go
package main

import (
    api "github.com/envoyproxy/go-control-plane/envoy/api/v2"
    "github.com/envoyproxy/go-control-plane/envoy/api/v2/core"
    discovery "github.com/envoyproxy/go-control-plane/envoy/service/discovery/v2"
    "github.com/envoyproxy/go-control-plane/pkg/cache"
    xds "github.com/envoyproxy/go-control-plane/pkg/server"
    "google.golang.org/grpc"
    "net"
)

func main() {
    //TODO：需要自己实现snapshotCache
    //snapshotCache := cache.NewSnapshotCache(false, NodeHashImpl{}, nil)
    server := xds.NewServer(snapshotCache, nil)
    grpcServer := grpc.NewServer()
    lis, _ := net.Listen("tcp", ":5678")

    discovery.RegisterAggregatedDiscoveryServiceServer(grpcServer, server)
    api.RegisterEndpointDiscoveryServiceServer(grpcServer, server)
    api.RegisterClusterDiscoveryServiceServer(grpcServer, server)
    api.RegisterRouteDiscoveryServiceServer(grpcServer, server)
    api.RegisterListenerDiscoveryServiceServer(grpcServer, server)
    func() {
        if err := grpcServer.Serve(lis); err != nil {
            // error handling
        }
    }()
}
```

这是[go-control-plane][1]给出的示例，这个实例代码有一些小问题，会编译失败，这里只是借助这个代码了解一下go-control-plane的用法。
能够通过编译、并实现了配置下发功能的例子见下一章节。

如果不了解怎样用Go实现GRPC通信，一定要先阅读一下[Go实现grpc server和grpc client(protobuf消息格式通信)介绍教程][5]，不然会完全搞不清楚这些代码是在做什么，以及掉进自动生成的pb.go文件。

`xds.NewServer()`的参数有两个，一个是存放所有配置的cache，另一个是在处理envoy的请求时会调用的回调函数：

```go
func NewServer(config cache.Cache, callbacks Callbacks) Server {
    return &server{cache: config, callbacks: callbacks}
}
```

所有的FetchXXX函数（处理envoy请求的的函数）最终调用的都是`Fetch()`，它的实现如下：

```go
// Fetch is the universal fetch method.
func (s *server) Fetch(ctx context.Context, req *v2.DiscoveryRequest) (*v2.DiscoveryResponse, error) {
    if s.callbacks != nil {
        if err := s.callbacks.OnFetchRequest(ctx, req); err != nil {
            return nil, err
        }
    }
    resp, err := s.cache.Fetch(ctx, *req)
    if err != nil {
        return nil, err
    }
    out, err := createResponse(resp, req.TypeUrl)
    if s.callbacks != nil {
        s.callbacks.OnFetchResponse(req, out)
    }
    return out, err
}
```

可以看到返回给enovy的数据是通过`s.cache.Fetch(ctx, *req)`获取的， req是envoy发送的请求消息，protobuf格式。

`cache.Cache`是一个接口，实现了下面接口的变量都可以作为`NewServer(config cache.Cache, callbacks Callbacs)`的第一个参数：

```go
// envoyproxy/go-control-plane/pkg/cache/cache.go: 46
// Cache is a generic config cache with a watcher.
type Cache interface {
    ConfigWatcher

    // Fetch implements the polling method of the config cache using a non-empty request.
    Fetch(context.Context, Request) (*Response, error)

    // GetStatusInfo retrieves status information for a node ID.
    GetStatusInfo(string) StatusInfo

    // GetStatusKeys retrieves node IDs for all statuses.
    GetStatusKeys() []string
}
```

go-control-plane中实现了一个SanpshotCache，可以参照它的做法实现自己的Cahce：

```go
// envoyproxy/go-control-plane/pkg/cache/simple.go: 86
func NewSnapshotCache(ads bool, hash NodeHash, logger log.Logger) SnapshotCache {
    return &snapshotCache{
        log:       logger,
        ads:       ads,
        snapshots: make(map[string]Snapshot),
        status:    make(map[string]*statusInfo),
        hash:      hash,
    }
}
```

至于Cache中的配置如何更新，就各显神通，自由发挥了，SnapshotCache实现了`SetSnapshot()`接口：

```go
// SetSnapshotCache updates a snapshot for a node.
func (cache *snapshotCache) SetSnapshot(node string, snapshot Snapshot) error {
...
}
```

`Snapshot`是对应node上的全量配置：

```go
type Snapshot struct {
	// Endpoints are items in the EDS response payload.
	Endpoints Resources

	// Clusters are items in the CDS response payload.
	Clusters Resources

	// Routes are items in the RDS response payload.
	Routes Resources

	// Listeners are items in the LDS response payload.
	Listeners Resources
}
```

下一节是一个更完整的例子，会演示Snapshot的使用。

## 一个简单的Management Server实现

这里实现一个超级简单的Envoy Management Server：直接在代码中注入了一个Envoy的配置。

这个超级的简单的实现，很形象地说明了[go-control-plane][1]的用法，可以用来做简单的测试。

代码全部列出不方便查看，下面只给出了轮廓，具体的配置定义分散后面的各个章节中。

main.go文件位于`go-control-plane`目录中，这里用的go-control-plane版本是`v0.6.5`。

```go
// Create: 2018/12/29 18:32:00 Change: 2018/12/29 18:32:00
// FileName: main.go
// Copyright (C) 2018 lijiaocn <lijiaocn@foxmail.com>
//
// Distributed under terms of the GPL license.

package main

import (
	"fmt"
	api "github.com/envoyproxy/go-control-plane/envoy/api/v2"
	"github.com/envoyproxy/go-control-plane/envoy/api/v2/core"
	"github.com/envoyproxy/go-control-plane/envoy/api/v2/endpoint"
	"github.com/envoyproxy/go-control-plane/envoy/api/v2/listener"
	"github.com/envoyproxy/go-control-plane/envoy/api/v2/route"
	http_router "github.com/envoyproxy/go-control-plane/envoy/config/filter/http/router/v2"
	http_conn_manager "github.com/envoyproxy/go-control-plane/envoy/config/filter/network/http_connection_manager/v2"
	envoy_type "github.com/envoyproxy/go-control-plane/envoy/type"
	"github.com/envoyproxy/go-control-plane/pkg/util"
	proto_type "github.com/gogo/protobuf/types"
	"time"
	//		"github.com/envoyproxy/go-control-plane/envoy/api/v2/route"
	discovery "github.com/envoyproxy/go-control-plane/envoy/service/discovery/v2"
	"github.com/envoyproxy/go-control-plane/pkg/cache"
	xds "github.com/envoyproxy/go-control-plane/pkg/server"
	"github.com/golang/glog"
	"google.golang.org/grpc"
	"net"
)

type NodeConfig struct {
	node      *core.Node
	endpoints []cache.Resource //[]*api.ClusterLoadAssignment
	clusters  []cache.Resource //[]*api.Cluster
	routes    []cache.Resource //[]*api.RouteConfiguration
	listeners []cache.Resource //[]*api.Listener
}

//implement cache.NodeHash
func (n NodeConfig) ID(node *core.Node) string {
	return node.GetId()
}

func ADD_Cluster_With_Static_Endpoint(n *NodeConfig) {
	// 见`CDS：Upstream Cluster发现`

	n.clusters = append(n.clusters, cluster)
}

func ADD_Cluster_With_Dynamic_Endpoint(n *NodeConfig) {
	// 见`EDS：Upstream Server发现`

	n.endpoints = append(n.endpoints, endpoint)
	n.clusters = append(n.clusters, cluster)
}

func ADD_Listener_With_Static_Route(n *NodeConfig) {
	// 见`LDS: Listener发现`

	n.listeners = append(n.listeners, listener)
}

func ADD_Listener_With_Dynamic_Route(n *NodeConfig) {
	// 见`RDS：Route发现`

	n.listeners = append(n.listeners, listener)
	n.routes = append(n.routes, route)
}

func Update_SnapshotCache(s cache.SnapshotCache, n *NodeConfig, version string) {
	err := s.SetSnapshot(n.ID(n.node), cache.NewSnapshot(version, n.endpoints, n.clusters, n.routes, n.listeners))
	if err != nil {
		glog.Error(err)
	}
}

func main() {
	snapshotCache := cache.NewSnapshotCache(false, NodeConfig{}, nil)
	server := xds.NewServer(snapshotCache, nil)
	grpcServer := grpc.NewServer()
	lis, _ := net.Listen("tcp", ":5678")

	discovery.RegisterAggregatedDiscoveryServiceServer(grpcServer, server)
	api.RegisterEndpointDiscoveryServiceServer(grpcServer, server)
	api.RegisterClusterDiscoveryServiceServer(grpcServer, server)
	api.RegisterRouteDiscoveryServiceServer(grpcServer, server)
	api.RegisterListenerDiscoveryServiceServer(grpcServer, server)

	go func() {
		if err := grpcServer.Serve(lis); err != nil {
			// error handling
		}
	}()

	node := &core.Node{
		Id:      "envoy-64.58",
		Cluster: "test",
	}

	node_config := &NodeConfig{
		node:      node,
		endpoints: []cache.Resource{}, //[]*api.ClusterLoadAssignment
		clusters:  []cache.Resource{}, //[]*api.Cluster
		routes:    []cache.Resource{}, //[]*api.RouteConfiguration
		listeners: []cache.Resource{}, //[]*api.Listener
	}

	input := ""

	fmt.Printf("Enter to update version 1: ADD_Cluster_With_Static_Endpoint")
	fmt.Scanf("\n", &input)
	ADD_Cluster_With_Static_Endpoint(node_config)
	Update_SnapshotCache(snapshotCache, node_config, "1")
	fmt.Printf("ok")

	fmt.Printf("\nEnter to update version 2: ADD_Cluster_With_Dynamic_Endpoint")
	fmt.Scanf("\n", &input)
	ADD_Cluster_With_Dynamic_Endpoint(node_config)
	Update_SnapshotCache(snapshotCache, node_config, "2")
	fmt.Printf("ok")

	fmt.Printf("\nEnter to update version 3: ADD_Listener_With_Static_Route")
	fmt.Scanf("\n", &input)
	ADD_Listener_With_Static_Route(node_config)
	Update_SnapshotCache(snapshotCache, node_config, "3")
	fmt.Printf("ok")

	fmt.Printf("\nEnter to update version 4: ADD_Listener_With_Dynamic_Route")
	fmt.Scanf("\n", &input)
	ADD_Listener_With_Dynamic_Route(node_config)
	Update_SnapshotCache(snapshotCache, node_config, "4")
	fmt.Printf("ok")

	fmt.Printf("\nEnter to exit: ")
	fmt.Scanf("\n", &input)
}
```

运行后，每键入一次回车，下发一个配置。

注入的配置是ID为`envoy-64.58`的node的：

```go
    node := &core.Node{
        Id:      "envoy-64.58",
        Cluster: "test",
    }
    UpdateSnapshotCache(snapshotCache, node)
```

在配置文件envoy.yaml中配置了同样ID的envoy才能收到这里设置的配置：

```
node:
  id: "envoy-64.58"
  cluster: "test"
```

## 配置Management Server

Mnagement Server的地址在每个envoy的配置文件静态配置，要在`static_resource`中配置。

```yaml
static_resources:
  clusters:
  - name: xds_cluster
    connect_timeout: 0.25s
    type: STATIC
    lb_policy: ROUND_ROBIN
    http2_protocol_options: {}
    load_assignment:
      cluster_name: xds_cluster
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 5678
```

clusters的名字自行选取，后面的配置通过它的名字进行引用。

接下来就是在`dynamic_resources`以及Cluster和Listener中配置envoy支持的多种动态配置。

这里使用的envoy的完整配置如下：

```yaml
node:
  id: "envoy-64.58"
  cluster: "test"
runtime:
  symlink_root: /srv/runtime/current
  subdirectory: envoy
  override_subdirectory: envoy_override
watchdog:
  miss_timeout: 0.2s
  megamiss_timeout: 1s
  kill_timeout: 0s
  multikill_timeout: 0s
flags_path: /etc/envoy/flags/
stats_flush_interval: 5s
stats_config:
  use_all_default_tags: true
stats_sinks:
  name: envoy.stat_sinks.hystrix
  config:
    num_buckets: 10
admin:
  access_log_path: /tmp/admin_access.log
  profile_path: /var/log/envoy/envoy.prof
  address:
    socket_address:
      protocol: TCP
      address: 0.0.0.0
      port_value: 9901
dynamic_resources:
  cds_config:
    api_config_source:
      api_type: GRPC
      grpc_services:
        envoy_grpc:
          cluster_name: xds_cluster
  lds_config:
    api_config_source:
      api_type: GRPC
      grpc_services:
        envoy_grpc:
          cluster_name: xds_cluster
static_resources:
  clusters:
  - name: xds_cluster
    connect_timeout: 0.25s
    type: STATIC
    lb_policy: ROUND_ROBIN
    http2_protocol_options: {}
    load_assignment:
      cluster_name: xds_cluster
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 5678
```

envoy版本是1.8.0，启动方式如下：

```bash
./envoy-1.8.0 --log-level info --v2-config-only -c `pwd`/envoy-dynamic.yaml 2>&1 1>`pwd`/envoy.log
```

## CDS：Upstream Cluster发现

`cds_config`在`dynamic_resources`中配置：

```yaml
dynamic_resources:
  cds_config:
    api_config_source:
      api_type: GRPC
      grpc_services:
        envoy_grpc:
          cluster_name: xds_cluster
```

前面实现的简单的Management Server注入一个使用静态Endpoint配置的Cluster：

```go
func ADD_Cluster_With_Static_Endpoint(n *NodeConfig) {
    cluster := &api.Cluster{
        Name:           "cluster_with_static_endpoint",
        ConnectTimeout: 1 * time.Second,
        Type:           api.Cluster_STATIC,
        LbPolicy:       api.Cluster_ROUND_ROBIN,
        LoadAssignment: &api.ClusterLoadAssignment{
            ClusterName: "none",
            Endpoints: []endpoint.LocalityLbEndpoints{
                endpoint.LocalityLbEndpoints{
                    LbEndpoints: []endpoint.LbEndpoint{
                        endpoint.LbEndpoint{
                            Endpoint: &endpoint.Endpoint{
                                Address: &core.Address{
                                    Address: &core.Address_SocketAddress{
                                        SocketAddress: &core.SocketAddress{
                                            Protocol: core.TCP,
                                            Address:  "172.16.129.26",
                                            PortSpecifier: &core.SocketAddress_PortValue{
                                                PortValue: 80,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    }
    n.clusters = append(n.clusters, cluster)
}
```

CDS查询响应格式如下：

```yaml
version_info: "0"
resources:
- "@type": type.googleapis.com/envoy.api.v2.Cluster
  name: some_service
  connect_timeout: 0.25s
  lb_policy: ROUND_ROBIN
  type: EDS
  eds_cluster_config:
    eds_config:
      api_config_source:
        api_type: GRPC
        grpc_services:
          envoy_grpc:
            cluster_name: xds_cluster
```

启动envoy之后，通过admin地址`/config_dum`能够查看envoy的配置，配置下发以后，会发现多出了一个`dynamic_active_clusters`：

```json
"dynamic_active_clusters": [
  {
    "version_info": "1",
    "cluster": {
      "name": "cluster_with_static_endpoint",
      "connect_timeout": "1s",
      "load_assignment": {
        "cluster_name": "none",
        "endpoints": [
          {
            "lb_endpoints": [
              {
                "endpoint": {
                  "address": {
                    "socket_address": {
                      "address": "172.16.129.26",
                      "port_value": 80
                    }
                  }
                }
              }
            ]
          }
        ]
      }
    },
    "last_updated": "2019-01-04T09:05:14.709Z"
  }
]
```

### EDS：Upstream Server发现

EDS隶属于Cluster，要在每个Cluster中配置，下面是一个配置了eds的Cluster：

```yaml
  clusters:
  - name: some_service
    connect_timeout: 0.25s
    lb_policy: ROUND_ROBIN
    type: EDS
    eds_cluster_config:
      eds_config:
        api_config_source:
          api_type: GRPC
          grpc_services:
            envoy_grpc:
              cluster_name: xds_cluster
```

Management Server中下发了一个使用eds的Cluster：

```go
func ADD_Cluster_With_Dynamic_Endpoint(n *NodeConfig) {
    endpoint := &api.ClusterLoadAssignment{
        ClusterName: "cluster_with_dynamic_endpoint",
        Endpoints: []endpoint.LocalityLbEndpoints{
            endpoint.LocalityLbEndpoints{
                LbEndpoints: []endpoint.LbEndpoint{
                    endpoint.LbEndpoint{
                        Endpoint: &endpoint.Endpoint{
                            Address: &core.Address{
                                Address: &core.Address_SocketAddress{
                                    SocketAddress: &core.SocketAddress{
                                        Protocol: core.TCP,
                                        Address:  "182.16.129.26",
                                        PortSpecifier: &core.SocketAddress_PortValue{
                                            PortValue: 80,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        Policy: &api.ClusterLoadAssignment_Policy{
            DropOverloads: []*api.ClusterLoadAssignment_Policy_DropOverload{
                &api.ClusterLoadAssignment_Policy_DropOverload{
                    Category: "drop_policy1",
                    DropPercentage: &envoy_type.FractionalPercent{
                        Numerator:   3,
                        Denominator: envoy_type.FractionalPercent_HUNDRED,
                    },
                },
            },
            OverprovisioningFactor: &proto_type.UInt32Value{
                Value: 140,
            },
        },
    }

    cluster := &api.Cluster{
        Name:           "cluster_with_dynamic_endpoint",
        ConnectTimeout: 1 * time.Second,
        Type:           api.Cluster_EDS,
        LbPolicy:       api.Cluster_ROUND_ROBIN,
        EdsClusterConfig: &api.Cluster_EdsClusterConfig{
            EdsConfig: &core.ConfigSource{
                ConfigSourceSpecifier: &core.ConfigSource_ApiConfigSource{
                    ApiConfigSource: &core.ApiConfigSource{
                        ApiType: core.ApiConfigSource_GRPC,
                        GrpcServices: []*core.GrpcService{
                            &core.GrpcService{
                                TargetSpecifier: &core.GrpcService_EnvoyGrpc_{
                                    EnvoyGrpc: &core.GrpcService_EnvoyGrpc{
                                        ClusterName: "xds_cluster",
                                    },
                                },
                            },
                        },
                    },
                },
            },
            //            ServiceName: "dynamic_endpoints", //与endpoint中的ClusterName对应。
        },
    }

    n.endpoints = append(n.endpoints, endpoint)
    n.clusters = append(n.clusters, cluster)
}

```

EDS查询响应内容格式如下：

```yaml
version_info: "0"
resources:
- "@type": type.googleapis.com/envoy.api.v2.ClusterLoadAssignment
  cluster_name: some_service
  endpoints:
  - lb_endpoints:
    - endpoint:
        address:
          socket_address:
            address: 127.0.0.2
            port_value: 1234
```

和前面类似，在admin地址`/config_dump`中可以看到多出了一个cluster。

需要注意的是动态下发的endpoint在`/config_dump`中不可见，需要到`/clusters`中查看：

```
...
cluster_with_static_endpoint::default_priority::max_connections::1024
cluster_with_static_endpoint::default_priority::max_pending_requests::1024
cluster_with_static_endpoint::default_priority::max_requests::1024
cluster_with_static_endpoint::default_priority::max_retries::3
cluster_with_static_endpoint::high_priority::max_connections::1024
cluster_with_static_endpoint::high_priority::max_pending_requests::1024
cluster_with_static_endpoint::high_priority::max_requests::1024
cluster_with_static_endpoint::high_priority::max_retries::3
cluster_with_static_endpoint::added_via_api::true
cluster_with_static_endpoint::172.16.129.26:80::cx_active::0
cluster_with_static_endpoint::172.16.129.26:80::cx_connect_fail::0
cluster_with_static_endpoint::172.16.129.26:80::cx_total::0
cluster_with_static_endpoint::172.16.129.26:80::rq_active::0
cluster_with_static_endpoint::172.16.129.26:80::rq_error::0
cluster_with_static_endpoint::172.16.129.26:80::rq_success::0
cluster_with_static_endpoint::172.16.129.26:80::rq_timeout::0
...
```

## LDS: Listener发现

LDS动态配置`lds_config`在`dynamic_resources`中配置：

```yaml
dynamic_resources:
  lds_config:
    api_config_source:
      api_type: GRPC
      grpc_services:
        envoy_grpc:
          cluster_name: xds_cluster
```

Listener组成比较复杂，下面是一个配置了静态路由的listener：

```go
func ADD_Listener_With_Static_Route(n *NodeConfig) {
    http_filter_router_ := &http_router.Router{
        DynamicStats: &proto_type.BoolValue{
            Value: true,
        },
    }
    http_filter_router, err := util.MessageToStruct(http_filter_router_)
    if err != nil {
        glog.Error(err)
        return
    }

    listen_filter_http_conn_ := &http_conn_manager.HttpConnectionManager{
        StatPrefix: "ingress_http",
        RouteSpecifier: &http_conn_manager.HttpConnectionManager_RouteConfig{
            RouteConfig: &api.RouteConfiguration{
                Name: "None",
                VirtualHosts: []route.VirtualHost{
                    route.VirtualHost{
                        Name: "local",
                        Domains: []string{
                            "webshell.com",
                        },
                        Routes: []route.Route{
                            route.Route{
                                Match: route.RouteMatch{
                                    PathSpecifier: &route.RouteMatch_Prefix{
                                        Prefix: "/",
                                    },
                                    CaseSensitive: &proto_type.BoolValue{
                                        Value: false,
                                    },
                                },
                                Action: &route.Route_Route{
                                    Route: &route.RouteAction{
                                        ClusterSpecifier: &route.RouteAction_Cluster{
                                            Cluster: "cluster_with_static_endpoint",
                                        },
                                        HostRewriteSpecifier: &route.RouteAction_HostRewrite{
                                            HostRewrite: "webshell.com",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        HttpFilters: []*http_conn_manager.HttpFilter{
            &http_conn_manager.HttpFilter{
                Name: "envoy.router",
                ConfigType: &http_conn_manager.HttpFilter_Config{
                    Config: http_filter_router,
                },
            },
        },
    }
    listen_filter_http_conn, err := util.MessageToStruct(listen_filter_http_conn_)
    if err != nil {
        glog.Error(err)
        return
    }

    listener := &api.Listener{
        Name: "listener_with_static_route_port_9000",
        Address: core.Address{
            Address: &core.Address_SocketAddress{
                SocketAddress: &core.SocketAddress{
                    Protocol: core.TCP,
                    Address:  "0.0.0.0",
                    PortSpecifier: &core.SocketAddress_PortValue{
                        PortValue: 9000,
                    },
                },
            },
        },
        FilterChains: []listener.FilterChain{
            listener.FilterChain{
                Filters: []listener.Filter{
                    listener.Filter{
                        Name: "envoy.http_connection_manager",
                        ConfigType: &listener.Filter_Config{
                            Config: listen_filter_http_conn,
                        },
                    },
                },
            },
        },
    }

    n.listeners = append(n.listeners, listener)
}

```

LDS返回的数据格式如下：

```yaml
version_info: "0"
resources:
- "@type": type.googleapis.com/envoy.api.v2.Listener
  name: listener_0
  address:
    socket_address:
      address: 127.0.0.1
      port_value: 10000
  filter_chains:
  - filters:
    - name: envoy.http_connection_manager
      config:
        stat_prefix: ingress_http
        codec_type: AUTO
        rds:
          route_config_name: local_route
          config_source:
            api_config_source:
              api_type: GRPC
              grpc_services:
                envoy_grpc:
                  cluster_name: xds_cluster
        http_filters:
        - name: envoy.router
```

下发了listener之后，在admin地址`/config_dump`中，会发现多出了两组配置：

```
{
  "@type": "type.googleapis.com/envoy.admin.v2alpha.ListenersConfigDump",
  "version_info": "4",
  "dynamic_active_listeners": [
    {
 .....
{
  "@type": "type.googleapis.com/envoy.admin.v2alpha.RoutesConfigDump",
  "static_route_configs": [
    {
 ...
```

分别是`ListenerConfig`和`RoutesConfig`，RoutesConfig中是一个静态配置的路由。

### RDS：Route发现

RDS隶属于listener中的envoy.http_connection_manager插件，需要在http_connection_manager中配置。

```go
func ADD_Listener_With_Dynamic_Route(n *NodeConfig) {
    route := &api.RouteConfiguration{
        Name: "dynamic_route",
        VirtualHosts: []route.VirtualHost{
            route.VirtualHost{
                Name: "local",
                Domains: []string{
                    "webshell.com",
                },
                Routes: []route.Route{
                    route.Route{
                        Match: route.RouteMatch{
                            PathSpecifier: &route.RouteMatch_Prefix{
                                Prefix: "/",
                            },
                            CaseSensitive: &proto_type.BoolValue{
                                Value: false,
                            },
                        },
                        Action: &route.Route_Route{
                            Route: &route.RouteAction{
                                ClusterSpecifier: &route.RouteAction_Cluster{
                                    Cluster: "cluster_with_static_endpoint",
                                },
                                HostRewriteSpecifier: &route.RouteAction_HostRewrite{
                                    HostRewrite: "webshell.com",
                                },
                            },
                        },
                    },
                },
            },
        },
    }

    http_filter_router_ := &http_router.Router{
        DynamicStats: &proto_type.BoolValue{
            Value: true,
        },
    }
    http_filter_router, err := util.MessageToStruct(http_filter_router_)
    if err != nil {
        glog.Error(err)
        return
    }

    listen_filter_http_conn_ := &http_conn_manager.HttpConnectionManager{
        StatPrefix: "ingress_http",
        RouteSpecifier: &http_conn_manager.HttpConnectionManager_Rds{
            Rds: &http_conn_manager.Rds{
                RouteConfigName: "dynamic_route",
                ConfigSource: core.ConfigSource{
                    ConfigSourceSpecifier: &core.ConfigSource_ApiConfigSource{
                        ApiConfigSource: &core.ApiConfigSource{
                            ApiType: core.ApiConfigSource_GRPC,
                            GrpcServices: []*core.GrpcService{
                                &core.GrpcService{
                                    TargetSpecifier: &core.GrpcService_EnvoyGrpc_{
                                        EnvoyGrpc: &core.GrpcService_EnvoyGrpc{
                                            ClusterName: "xds_cluster",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        HttpFilters: []*http_conn_manager.HttpFilter{
            &http_conn_manager.HttpFilter{
                Name: "envoy.router",
                ConfigType: &http_conn_manager.HttpFilter_Config{
                    Config: http_filter_router,
                },
            },
        },
    }
    listen_filter_http_conn, err := util.MessageToStruct(listen_filter_http_conn_)
    if err != nil {
        glog.Error(err)
        return
    }

    listener := &api.Listener{
        Name: "listener_with_dynamic_route_port_9001",
        Address: core.Address{
            Address: &core.Address_SocketAddress{
                SocketAddress: &core.SocketAddress{
                    Protocol: core.TCP,
                    Address:  "0.0.0.0",
                    PortSpecifier: &core.SocketAddress_PortValue{
                        PortValue: 9001,
                    },
                },
            },
        },
        FilterChains: []listener.FilterChain{
            listener.FilterChain{
                Filters: []listener.Filter{
                    listener.Filter{
                        Name: "envoy.http_connection_manager",
                        ConfigType: &listener.Filter_Config{
                            Config: listen_filter_http_conn,
                        },
                    },
                },
            },
        },
    }

    n.listeners = append(n.listeners, listener)
    n.routes = append(n.routes, route)
}
```

RDS查询响应的数据格式如下：

```yaml
version_info: "0"
resources:
- "@type": type.googleapis.com/envoy.api.v2.RouteConfiguration
  name: local_route
  virtual_hosts:
  - name: local_service
    domains: ["*"]
    routes:
    - match: { prefix: "/" }
      route: { cluster: some_service }
```

配置下发后，在admin的`/config_dump`中可以看到动态下发的路由：

```json
"dynamic_route_configs": [
 {
  "version_info": "4",
  "route_config": {
   "name": "dynamic_route",
   "virtual_hosts": [
    {
     "name": "local",
     "domains": [
      "webshell.com"
     ],
     "routes": [
      {
       "match": {
        "prefix": "/",
        "case_sensitive": false
       },
       "route": {
        "cluster": "cluster_with_static_endpoint",
        "host_rewrite": "webshell.com"
       }
      }
     ]
    }
   ]
  },
  "last_updated": "2019-01-04T09:05:19.379Z"
 }
]
```

## SDS：证书发现

## ADS：聚合服务发现

[Aggregated Discovery Service](https://www.envoyproxy.io/docs/envoy/latest/configuration/overview/v2_overview#aggregated-discovery-service)

[Aggregated Discovery Services (ADS)](https://github.com/envoyproxy/data-plane-api/blob/master/XDS_PROTOCOL.md#aggregated-discovery-services-ads)

ADS配置示意：

```yaml
node:
  id: <node identifier>
dynamic_resources:
  cds_config: {ads: {}}
  lds_config: {ads: {}}
  ads_config:
    api_type: GRPC
    grpc_services:
      envoy_grpc:
        cluster_name: ads_cluster
static_resources:
  clusters:
  - name: ads_cluster
    connect_timeout: { seconds: 5 }
    type: STATIC
    hosts:
    - socket_address:
        address: <ADS management server IP address>
        port_value: <ADS management server port>
    lb_policy: ROUND_ROBIN
    http2_protocol_options: {}
```

ADS的使用单独列一篇：[Envoy Proxy使用介绍（八）：envoy动态配置ADS的使用方法][6]

## 参考

1. [go-control-plane][1]
2. [Mostly static with dynamic EDS][2]
3. [Envoy: XDS_PROTOCOL][3]
4. [data-plane-api][4]
5. [Go实现grpc server和grpc client(protobuf格式消息通信)介绍教程][5]
6. [Envoy Proxy使用介绍（八）：envoy动态配置ADS的使用方法][6]

[1]: https://github.com/envoyproxy/go-control-plane "go-control-plane"
[2]: https://www.envoyproxy.io/docs/envoy/latest/configuration/overview/v2_overview#example "Mostly static with dynamic EDS"
[3]: https://github.com/envoyproxy/data-plane-api/blob/master/XDS_PROTOCOL.md "Envoy: XDS_PROTOCOL"
[4]: https://github.com/envoyproxy/data-plane-api/ "data-plane-api"
[5]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2019/01/02/go-grpc-usage.html "Golang实现grpc server和grpc client(protobuf格式消息通信)介绍教程"
[6]: https://www.lijiaocn.com/2019/01/07/envoy-08-features-3-dynamic-discovery-ads.html "Envoy Proxy使用介绍（八）：envoy动态配置ADS的使用方法"
