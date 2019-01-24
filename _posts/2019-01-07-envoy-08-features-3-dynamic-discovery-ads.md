---
layout: default
title: "Envoy Proxy使用介绍教程（八）：envoy动态配置-聚合发现ADS的使用方法"
author: 李佶澳
createdate: "2019-01-07 11:27:27 +0800"
changedate: "2019-01-09 19:47:09 +0800"
categories: 项目
tags: envoy 视频教程
keywords: envoy ads,envoy动态配置,envoy management server,envoy服务发现,cds,lds,ads,xds协议
description: ADS(Aggregated Discovery Service)可以将所有的动态配置聚合，有序地发送给envoy
---

* auto-gen TOC:
{:toc}

## 说明

这里记录的比较简单，如果对Envoy动态配置不了解，建议参阅[Envoy Proxy使用介绍教程（七）：envoy动态配置xDS的使用方法][7]。

[《Envoy Proxy使用介绍教程（一）：新型L3~L7层访问代理软件Envoy的使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/12/envoy-01-usage.html)

[《Envoy Proxy使用介绍教程（二）：envoy源代码阅读、集成开发环境(IDE)》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/17/envoy-02-ide.html)

[《Envoy Proxy使用介绍教程（三）：envoy设计思路、配置文件和功能特性概览》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/20/envoy-03-arch.html)

[《Envoy Proxy使用介绍教程（四）：envoy源代码走读&启动过程分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/24/envoy-04-codes.html)

[《Envoy Proxy使用介绍教程（五）：envoy的配置文件完全展开介绍》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/27/envoy-05-configfile.html)

[《Envoy Proxy使用介绍教程（六）：envoy一些简单功能/基础配置的使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/28/envoy-06-features-1-basic.html)

[《Envoy Proxy使用介绍教程（七）：envoy动态配置xDS的使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/29/envoy-07-features-2-dynamic-discovery.html)

[《Envoy Proxy使用介绍教程（八）：envoy动态配置-聚合发现ADS的使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2019/01/07/envoy-08-features-3-dynamic-discovery-ads.html)

都是边学习边记录的，时间比较紧，难免有些地方记录的比较粗糙，[查看更多相关内容](https://www.lijiaocn.com/tags/class.html)。

## 概要

[Aggregated Discovery Service][1]中简单介绍了ADS，简单说就是，CDS/EDS/RDS等动态配置的Managerment Server可以是同一个ADS。[xDS REST and gRPC protocol: Aggregated Discovery Services (ADS)][2]给出了一个例子：

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

## 准备支持ADS的Management Server

[go-control-plane][4]提供了实现ADS功能的API，[一个简单的Management Server实现][3]中的Management Server用go-control-plane提供的API实现了ADS，如下：

```
func main() {
	snapshotCache := cache.NewSnapshotCache(false, NodeConfig{}, nil)
	server := xds.NewServer(snapshotCache, nil)
	grpcServer := grpc.NewServer()
	lis, _ := net.Listen("tcp", ":5678")

	discovery.RegisterAggregatedDiscoveryServiceServer(grpcServer, server)
	...
```

完整代码这里不贴了，可以到[一个简单的Management Server实现][3]中查看。

## 配置ADS

ADS在`dynamic_resources`中配置，可以指向`static_resources`中的一个cluster，这也是推荐的做法。

static_resources中配置的cluster（Management Server地址）：

```yaml
static_resources:
  clusters:
  - name: ads_cluster
    connect_timeout: 0.25s
    type: STATIC
    lb_policy: ROUND_ROBIN
    http2_protocol_options: {}
    load_assignment:
      cluster_name: ads_cluster
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 5678
```

`dynamic_resources`中的配置的ads_config:

```yaml
dynamic_resources:
  ads_config:
      api_type: GRPC
      grpc_services:
        envoy_grpc:
          cluster_name: ads_cluster
```

然后将dynamic_resources中的cds_config和lds_config指向ads:

```yaml
dynamic_resources:
  cds_config: {ads: {}}
  lds_config: {ads: {}}
```

注意，在1.8.0和1.9.0版本中（更早的版本没有查看），cds_config和lds_config中的ads都是一个`空的结构体`，在[core.ConfigSource][5]和[core.AggregatedConfigSource][6]中可以看到：

```json
{
  "path": "...",
  "api_config_source": "{...}",
  "ads": "{...}"
}
```

>Aggregated Discovery Service (ADS) options. This is currently empty, but when set in ConfigSource can be used to specify that ADS is to be used.

另外，Cluster中的EDS和LDS中的RDS，既可以使用其它的Mangement Server，也可以使用ADS（配置成`{ads: {}}`）。将所有的动态配置都设置为ADS，似乎是一个好的做法。

最终相关配置如下：

```yaml
dynamic_resources:
  ads_config:
      api_type: GRPC
      grpc_services:
        envoy_grpc:
          cluster_name: ads_cluster
  cds_config: {ads: {}}
  lds_config: {ads: {}}
static_resources:
  clusters:
  - name: ads_cluster
    connect_timeout: 0.25s
    type: STATIC
    lb_policy: ROUND_ROBIN
    http2_protocol_options: {}
    load_assignment:
      cluster_name: ads_cluster
      endpoints:
      - lb_endpoints:
        - endpoint:
            address:
              socket_address:
                address: 127.0.0.1
                port_value: 5678
```

## 使用ADS的EDS

```go
func ADD_Cluster_With_ADS_Endpoint(n *NodeConfig) {
	endpoint := &api.ClusterLoadAssignment{
		ClusterName: "ads_endpoint",
		Endpoints: []endpoint.LocalityLbEndpoints{
			endpoint.LocalityLbEndpoints{
				LbEndpoints: []endpoint.LbEndpoint{
					endpoint.LbEndpoint{
						Endpoint: &endpoint.Endpoint{
							Address: &core.Address{
								Address: &core.Address_SocketAddress{
									SocketAddress: &core.SocketAddress{
										Protocol: core.TCP,
										Address:  "192.16.129.26",
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
		Name:           "cluster_with_ads_endpoint",
		ConnectTimeout: 1 * time.Second,
		Type:           api.Cluster_EDS,
		LbPolicy:       api.Cluster_ROUND_ROBIN,
		EdsClusterConfig: &api.Cluster_EdsClusterConfig{
			EdsConfig: &core.ConfigSource{
				ConfigSourceSpecifier: &core.ConfigSource_Ads{
					Ads: &core.AggregatedConfigSource{}, //使用ADS
				},
			},
			ServiceName: "ads_endpoint", //与endpoint中的ClusterName对应。
		},
	}

	n.endpoints = append(n.endpoints, endpoint)
	n.clusters = append(n.clusters, cluster)
}
```

## 使用ADS的RDS

```go
func ADD_Listener_With_ADS_Route(n *NodeConfig) {
	route := &api.RouteConfiguration{
		Name: "ads_route",
		VirtualHosts: []route.VirtualHost{
			route.VirtualHost{
				Name: "local",
				Domains: []string{
					"ads.webshell.com",
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
									Cluster: "cluster_with_ads_endpoint",
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
				RouteConfigName: "ads_route",
				ConfigSource: core.ConfigSource{
					ConfigSourceSpecifier: &core.ConfigSource_Ads{
						Ads: &core.AggregatedConfigSource{},   //使用ADS
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
		Name: "listener_with_dynamic_route_port_9002",
		Address: core.Address{
			Address: &core.Address_SocketAddress{
				SocketAddress: &core.SocketAddress{
					Protocol: core.TCP,
					Address:  "0.0.0.0",
					PortSpecifier: &core.SocketAddress_PortValue{
						PortValue: 9002,
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

这里记录的比较简单，如果对Envoy动态配置不了解，建议参阅[Envoy Proxy使用介绍教程（七）：envoy动态配置xDS的使用方法][7]。

## 参考

1. [Aggregated Discovery Service][1]
2. [xDS REST and gRPC protocol: Aggregated Discovery Services (ADS)][2]
3. [一个简单的Management Server实现][3]
4. [go-control-plane][4]
5. [core.ConfigSource][5]
6. [core.AggregatedConfigSource][6]
7. [Envoy Proxy使用介绍教程（七）：envoy动态配置xDS的使用方法][7]

[1]: https://www.envoyproxy.io/docs/envoy/latest/configuration/overview/v2_overview#aggregated-discovery-service  "Aggregated Discovery Service"
[2]: https://github.com/envoyproxy/data-plane-api/blob/master/XDS_PROTOCOL.md#aggregated-discovery-services-ads "xDS REST and gRPC protocol: Aggregated Discovery Services (ADS)"
[3]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/29/envoy-07-features-2-dynamic-discovery.html#%E4%B8%80%E4%B8%AA%E7%AE%80%E5%8D%95%E7%9A%84management-server%E5%AE%9E%E7%8E%B0 "一个简单的Management Server实现"
[4]: https://github.com/envoyproxy/go-control-plane "go-control-plane"
[5]: https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/core/config_source.proto#envoy-api-msg-core-configsource "core.ConfigSource"
[6]: https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/core/config_source.proto#envoy-api-msg-core-aggregatedconfigsource "core.AggregatedConfigSource"
[7]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/29/envoy-07-features-2-dynamic-discovery.html "Envoy Proxy使用介绍教程（七）：envoy动态配置xDS的使用方法"
