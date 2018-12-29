---
layout: default
title: "Envoy Proxy使用介绍（五）：envoy的配置文件完全展开"
author: 李佶澳
createdate: "2018-12-27 10:55:12 +0800"
changedate: "2018-12-27 10:55:12 +0800"
categories: 项目
tags: envoy 视频教程
keywords: envoy配置文件,envoy完整配置,dynamic_resources,static_resource,runtime
description: 将envoy的配置文件完全展开，形成全景式认识，适用envoy 1.8.0
---

* auto-gen TOC:
{:toc}

## 说明

该系列所有笔记可以在[系列教程汇总](https://www.lijiaocn.com/tags/class.html)中找到。

[Envoy（三）：envoy设计思路、配置文件和功能特性概览][1]中给出了envoy配置模板的完整定义，这里将envoy的配置文件完全展开，形成全景式认识。

这里使用的是envoy 1.8.0，对应文档是[1.8.0](https://www.envoyproxy.io/docs/envoy/v1.8.0/api-v2/config/bootstrap/v2/bootstrap.proto)。

## 配置文件概览

```json
{
  "node": {
  	"id": "...",
  	"cluster": "...",
  	"metadata": "{...}",
  	"locality": "{...}",
  	"build_version": "..."
  },
  "static_resources": {
  	"listeners": [],
  	"clusters": [],
  	"secrets": []
  },
  "dynamic_resources": {
  	"lds_config": "{...}",
  	"cds_config": "{...}",
  	"ads_config": "{...}"
  },
  "cluster_manager": {
  	"local_cluster_name": "...",
  	"outlier_detection": "{...}",
  	"upstream_bind_config": "{...}",
  	"load_stats_config": "{...}"
  },
  "hds_config": {
  	"api_type": "...",
  	"cluster_names": [],
  	"grpc_services": [],
  	"refresh_delay": "{...}",
  	"request_timeout": "{...}",
  	"rate_limit_settings": "{...}"
  },
  "flags_path": "...",
  "stats_sinks": [
  	{
  		"name": "...",
  		"config": "{...}"
  	}
  ],
  "stats_config": {
  	"stats_tags": [],
  	"use_all_default_tags": "{...}",
  	"stats_matcher": "{...}"
  },
  "stats_flush_interval": "{...}",
  "watchdog": {
  	"miss_timeout": "{...}",
  	"megamiss_timeout": "{...}",
  	"kill_timeout": "{...}",
  	"multikill_timeout": "{...}"
  },
  "tracing": {
  	"http": "{...}"
  },
  "rate_limit_service": {
  	"grpc_service": "{...}"
  },
  "runtime": {
  	"symlink_root": "...",
  	"subdirectory": "...",
  	"override_subdirectory": "..."
  },
  "admin": {
  	"access_log_path": "...",
  	"profile_path": "...",
  	"address": "{...}"
  },
  "overload_manager": {
  	"refresh_interval": "{...}",
  	"resource_monitors": [],
  	"actions": []
  }
}
```

## admin  -- 管理接口

[config.bootstrap.v2.Admin](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto#envoy-api-msg-config-bootstrap-v2-admin)

```json
{
  "access_log_path": "...",
  "profile_path": "...",
  "address": {
    "socket_address": {
      "protocol": "...",
      "address": "...",
      "port_value": "...",
      "named_port": "...",
      "resolver_name": "...",
      "ipv4_compat": "..."
    },
    "pipe": {
      "path": "..."
    }
  }
}
```

## node -- 节点信息

[core.Node](https://www.envoyproxy.io/docs/envoy/v1.8.0/api-v2/api/v2/core/base.proto#core-node)

`node`中配置的是envoy的标记信息，是呈现给management server的。 


```json
{
  "id": "...",
  "cluster": "...",
  "metadata": "{...}",
  "locality": {
    "region": "...",
    "zone": "...",
    "sub_zone": "..."
  },
  "build_version": "..."
}
```

`id`可以用命令行参数`--service-node`指定，`cluster`可以用命令行参数`--service-cluster`指定。

`metadata`是自定义的结构，会被原原本本地发送给management server。

## flags_path  -- 参数

[flags_path](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto)

string，指定文件参数目录。

## runtime  --  运行时状态

[config.bootstrap.v2.Runtime](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto#envoy-api-msg-config-bootstrap-v2-runtime)

```json
{
  "symlink_root": "...",
  "subdirectory": "...",
  "override_subdirectory": "..."
}
```

## watchdog  -- 看门狗设置

[config.bootstrap.v2.Watchdog](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto#envoy-api-msg-config-bootstrap-v2-watchdog)

```json
{
  "miss_timeout": "{...}",
  "megamiss_timeout": "{...}",
  "kill_timeout": "{...}",
  "multikill_timeout": "{...}"
}
```

## overload_manager -- 过载管理

[config.overload.v2alpha.OverloadManager](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/overload/v2alpha/overload.proto#envoy-api-msg-config-overload-v2alpha-overloadmanager)

```json
{
  "refresh_interval": "{...}",
  "resource_monitors": [
    {
      "name": "...",
      "config": "{...}"
    }
  ],
  "actions": [
    {
      "name": "This is just a well-known string that listeners can use for registering callbacks. ",
      "triggers": [
        {
          "name": "...",
          "threshold": "{...}"
        }
      ]
    }
  ]
}
```

目前支持的[resource_monitors](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/overload/v2alpha/overload.proto#envoy-api-msg-config-overload-v2alpha-resourcemonitor)有两个：

	envoy.resource_monitors.fixed_heap
	envoy.resource_monitors.injected_resource

目前支持的[Action](https://www.envoyproxy.io/docs/envoy/latest/configuration/overload_manager/overload_manager#overload-actions)：

	envoy.overload_actions.stop_accepting_requests:   
	    Envoy will immediately respond with a 503 response code to new requests
	envoy.overload_actions.disable_http_keepalive
	    Envoy will disable keepalive on HTTP/1.x responses
	envoy.overload_actions.stop_accepting_connections
	    Envoy will stop accepting new network connections on its configured listeners

## stats_\* -- 状态数据

通过envoy admin的`/stats/prometheus`接口，可以获得prometheus格式的状态数据，感觉有这个功能就足够了。`stats_sinks`或许是为了支持prometheus之外的监控系统。

### stats_sinks  -- 状态输出插件

[config.metrics.v2.StatsSink](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/metrics/v2/stats.proto#envoy-api-msg-config-metrics-v2-statssink)

Envoy可以将状态数据输出到多种采集系统中，在stats_sinks中配置：

```json
{
  "name": "...",
  "config": "{...}"
}
```

envoy内置了以下stats sinks：

	envoy.statsd
	envoy.dog_statsd
	envoy.metrics_service
	envoy.stat_sinks.hystrix

分别对应不同的收集、展示系统。

### stats_config  -- 状态指标配置

[config.metrics.v2.StatsConfig](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/metrics/v2/stats.proto#envoy-api-msg-config-metrics-v2-statsconfig)

```json
{
  "stats_tags": [],
  "use_all_default_tags": "{...}",
  "stats_matcher": "{...}"
}
```

### stats_flush_interval  -- 状态刷新时间

[stats_flush_interval](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto#config-bootstrap-v2-bootstrap)

直接定义状态刷新时间。

## tracing  -- 调用跟踪

[config.trace.v2.Tracing](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/trace/v2/trace.proto#envoy-api-msg-config-trace-v2-tracing)

对接外部的tracing服务。

```json
{
  "http": {
    "name": "...",
    "config": "{...}"
  }
}
```

支持下列的[tracing服务](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/trace/v2/trace.proto#config-trace-v2-tracing-http)：

	envoy.lightstep
	envoy.zipkin
	envoy.dynamic.ot
	envoy.tracers.datadog

## rate_limit_service  -- 限速服务

[config.ratelimit.v2.RateLimitServiceConfig](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/ratelimit/v2/rls.proto#envoy-api-msg-config-ratelimit-v2-ratelimitserviceconfig)

Envoy采用的限速方案是[Global rate limiting](https://www.envoyproxy.io/docs/envoy/latest/intro/arch_overview/global_rate_limiting#arch-overview-rate-limit)。限速时需要对接外部的限速服务，Lyft共享了一个基于redis的限速服务：[lyft/ratelimit](https://github.com/lyft/ratelimit)。

对接外部的限速服务：

```json
{
  "grpc_service": "{...}"
}
```

支持`Network level`和`HTTP level`级别的限速，前者在创建连接时限速，后者在发送http请求时限速。

具体的限制规则在每个listener的filter中设置。

## static_resources -- 静态配置

[config.bootstrap.v2.Bootstrap.StaticResources](https://www.envoyproxy.io/docs/envoy/v1.8.0/api-v2/config/bootstrap/v2/bootstrap.proto#envoy-api-msg-config-bootstrap-v2-bootstrap-staticresources)

`static_resources`中是静态配置的资源，这里的资源也就是envoy要承担的核心工作，由`listeners`、`clusters`和`secrets`三部分组成。

```json
{
  "listeners": [],
  "clusters": [],
  "secrets": []
}
```

### listeners -- 监听器

[listener](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/lds.proto#envoy-api-msg-listener)

`listener`是envoy要监听的地址：

```json
{
  "name": "...",
  "address": {
    "socket_address": {
      "protocol": "...",
      "address": "...",
      "port_value": "...",
      "named_port": "...",
      "resolver_name": "...",
      "ipv4_compat": "..."
    },
    "pipe": {
      "path": "..."
    }
  },
  "filter_chains": [
    {
      "name": "...",
      "config": "{...}"
    }
  ],
  "use_original_dst": "BoolValue",
  "per_connection_buffer_limit_bytes": "UInt32Value",
  "metadata": "{...}",
  "drain_type": "DEFAULT/MODIFY_ONLY",
  "listener_filters": [
    {
      "name": "...",
      "config": "{...}"
    }
  ],
  "transparent": "BoolValue",
  "freebind": "BoolValue",
  "socket_options": [
    {
      "description": "...",
      "level": "...",
      "name": "...",
      "int_value": "...",
      "buf_value": "...",
      "state": "..."
    }
  ],
  "tcp_fast_open_queue_length": "UInt32Value",
  "bugfix_reverse_write_filter_order": "BoolValue"
}
```

`name`是listener的名字，不能重复。

`address`有`socket`（对应socket_address）和`unix socket`（对应pipe）两种类型。

`filter_chains`是为listener配置的插件，支持下面这些插件，[listener.Filter](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/listener/listener.proto#listener-filter)：

	envoy.client_ssl_auth
	envoy.echo
	envoy.http_connection_manager
	envoy.mongo_proxy
	envoy.ratelimit
	envoy.redis_proxy
	envoy.tcp_proxy

`listener_filters`中的插件在`filter_chains`之前执行，支持下面这些插件，[listener.ListenerFilter](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/listener/listener.proto#envoy-api-msg-listener-listenerfilter)：

	envoy.listener.original_dst
	envoy.listener.tls_inspector

每个插件的配置都不相同，可以在各自的详情页中看到。

需要特别注意的是[envoy.http_connection_manager](https://www.envoyproxy.io/docs/envoy/latest/configuration/http_conn_man/http_conn_man#config-http-conn-man)，`http_connection_manager`插件中还有`http_filters`插件。

#### envoy.http_connection_manager

[config.filter.network.http_connection_manager.v2.HttpConnectionManager](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/filter/network/http_connection_manager/v2/http_connection_manager.proto#http-connection-manager)

```json
{
  "codec_type": "...",
  "stat_prefix": "...",
  "rds": "{...}",
  "route_config": "{...}",
  "http_filters": [
    {
      "name": "...",
      "config": "{...}"
    }
  ],
  "add_user_agent": "{...}",
  "tracing": "{...}",
  "http_protocol_options": "{...}",
  "http2_protocol_options": "{...}",
  "server_name": "...",
  "idle_timeout": "{...}",
  "stream_idle_timeout": "{...}",
  "request_timeout": "{...}",
  "drain_timeout": "{...}",
  "delayed_close_timeout": "{...}",
  "access_log": [],
  "use_remote_address": "{...}",
  "xff_num_trusted_hops": "...",
  "internal_address_config": "{...}",
  "skip_xff_append": "...",
  "via": "...",
  "generate_request_id": "{...}",
  "forward_client_cert_details": "...",
  "set_current_client_cert_details": "{...}",
  "proxy_100_continue": "...",
  "represent_ipv4_remote_address_as_ipv4_mapped_ipv6": "...",
  "upgrade_configs": [],
  "bugfix_reverse_encode_order": "{...}"
}
```

正如前面说的，它包含有`http_filters`，总共支持下面[这些插件](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/filter/network/http_connection_manager/v2/http_connection_manager.proto#config-filter-network-http-connection-manager-v2-httpfilter)

	envoy.buffer
	envoy.cors
	envoy.fault
	envoy.gzip
	envoy.http_dynamo_filter
	envoy.grpc_http1_bridge
	envoy.grpc_json_transcoder
	envoy.grpc_web
	envoy.health_check
	envoy.header_to_metadata
	envoy.ip_tagging
	envoy.lua
	envoy.rate_limit
	envoy.router
	envoy.squash

### clusters  -- 集群

[cluster](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/cds.proto#envoy-api-msg-cluster)

```json
{
  "name": "string, 名称，必须",
  "alt_stat_name": "string, 发送状态时使用的名字，名称中:会被转换成_",
  "type": "cluster 发现方式, STATIC/STRICT_DNS/LOGICAL_DNS/EDS/ORIGINAL_DST",
  "eds_cluster_config": {
    "eds_config": {
      "path": "string，用来观测配置文件更新的路径",
      "api_config_source": {
        "api_type": "string，REST_LEGACY/REST/GRPC",
        "cluster_names": ["string，只用于REST_LEGACY/REST，可以配置多个"],
        "grpc_services": ["string，只用于GRPC，可以配置多个"],
        "refresh_delay": "{...}",
        "request_timeout": "{...}",
        "rate_limit_settings": {
          "max_tokens": "Uint32Value，默认值100",
          "fill_rate": "DoubleValue，默认100 token/s"
        }
      },
      "ads": "{ This is currently empty }"
    },
    "service_name": "..."
  },
  "connect_timeout": "{...}",
  "per_connection_buffer_limit_bytes": "{...}",
  "lb_policy": "负责均衡策略，ROUND_ROBIN/LEAST_REQUEST/RING_HASH/RANDOM/ORIGINAL_DST_LB/MAGLEV",
  "hosts": [
    {
      "socket_address": "{...}",
      "pipe": "{...}"
    }
  ],
  "load_assignment": {
    {
      "cluster_name": "...",
      "endpoints": [],
      "policy": {
        "drop_overloads": [],
        "overprovisioning_factor": "{...}"
      }
    }
  },
  "health_checks": [
    {
      "timeout": "{...}",
      "interval": "{...}",
      "interval_jitter": "{...}",
      "interval_jitter_percent": "...",
      "unhealthy_threshold": "{...}",
      "healthy_threshold": "{...}",
      "reuse_connection": "{...}",
      "http_health_check": {
        "host": "...",
        "path": "...",
        "service_name": "...",
        "request_headers_to_add": [],
        "request_headers_to_remove": [],
        "use_http2": "..."
      },
      "tcp_health_check": {
        "send": "{...}",
        "receive": []
      },
      "grpc_health_check": {
        "service_name": "...",
        "authority": "..."
      },
      "custom_health_check": {
        "name": "...",
        "config": "{...}"
      },
      "no_traffic_interval": "{...}",
      "unhealthy_interval": "{...}",
      "unhealthy_edge_interval": "{...}",
      "healthy_edge_interval": "{...}",
      "event_log_path": "...",
      "always_log_health_check_failures": "..."
    }
  ],
  "max_requests_per_connection": "{...}",
  "circuit_breakers": {
    "thresholds": []
  },
  "tls_context": {
    "common_tls_context": "{...}",
    "sni": "...",
    "allow_renegotiation": "...",
    "max_session_keys": "{...}"
  },
  "common_http_protocol_options": {
    "idle_timeout": "{...}"
  },
  "http_protocol_options": {
    "allow_absolute_url": "{...}",
    "accept_http_10": "...",
    "default_host_for_http_10": "..."
  },
  "http2_protocol_options": {
    "hpack_table_size": "{...}",
    "max_concurrent_streams": "{...}",
    "initial_stream_window_size": "{...}",
    "initial_connection_window_size": "{...}",
    "allow_connect": "..."
  },
  "extension_protocol_options": "{...}",
  "dns_refresh_rate": "{...}",
  "dns_lookup_family": "AUTO/V4_ONLY/V6_ONLY",
  "dns_resolvers": [],
  "outlier_detection": {
    "consecutive_5xx": "{...}",
    "interval": "{...}",
    "base_ejection_time": "{...}",
    "max_ejection_percent": "{...}",
    "enforcing_consecutive_5xx": "{...}",
    "enforcing_success_rate": "{...}",
    "success_rate_minimum_hosts": "{...}",
    "success_rate_request_volume": "{...}",
    "success_rate_stdev_factor": "{...}",
    "consecutive_gateway_failure": "{...}",
    "enforcing_consecutive_gateway_failure": "{...}"
  },
  "cleanup_interval": "{...}",
  "upstream_bind_config": {
    "source_address": "{...}",
    "freebind": "{...}",
    "socket_options": []
  },
  "lb_subset_config": {
    "fallback_policy": "...",
    "default_subset": "{...}",
    "subset_selectors": [],
    "locality_weight_aware": "...",
    "scale_locality_weight": "..."
  },
  "ring_hash_lb_config": {
    "minimum_ring_size": "{...}"
  },
  "original_dst_lb_config": {
    "use_http_header": "..."
  },
  "least_request_lb_config": {
    "choice_count": "{...}"
  },
  "common_lb_config": {
    "healthy_panic_threshold": "{...}",
    "zone_aware_lb_config": "{...}",
    "locality_weighted_lb_config": "{...}",
    "update_merge_window": "{...}"
  },
  "transport_socket": {
    "name": "...",
    "config": "{...}"
  },
  "metadata": "{...}",
  "protocol_selection": "USE_CONFIGURED_PROTOCOL/USE_DOWNSTREAM_PROTOCOL",
  "upstream_connection_options": {
    "tcp_keepalive": "{...}"
  },
  "close_connections_on_host_health_failure": "...",
  "drain_connections_on_host_removal": "..."
}
```

### secrets  -- 证书

[auth.Secret](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/auth/cert.proto#envoy-api-msg-auth-secret)

```json
{
  "name": "...",
  "tls_certificate": {
  	"certificate_chain": "{...}",
  	"private_key": "{...}",
  	"password": "{...}"
  },
  "session_ticket_keys": {
  	"keys": []
  },
  "validation_context": {
  	"trusted_ca": "{...}",
  	"verify_certificate_spki": [],
  	"verify_certificate_hash": [],
  	"verify_subject_alt_name": [],
  	"crl": "{...}",
  	"allow_expired_certificate": "..."
  }
}
```

## cluster_manager  -- 集群管理

[config.bootstrap.v2.ClusterManager](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto#envoy-api-msg-config-bootstrap-v2-clustermanager)

cluster_manager管理所有的upstream cluster，它封装了连接host的操作，当filter认为可以建立连接时，调用cluster_manager的API完成连接创建。
cluster_manager负责处理负载均衡、健康检查等细节。

```json
{
  "local_cluster_name": "...",
  "outlier_detection": {
  	"event_log_path": "..."
  },
  "upstream_bind_config": {
  	"source_address": {
  		"protocol": "...",
  		"address": "...",
  		"port_value": "...",
  		"named_port": "...",
  		"resolver_name": "...",
  		"ipv4_compat": "..."
  	},
  	"freebind": "{...}",
  	"socket_options": [
  		{
  			"description": "...",
  			"level": "...",
  			"name": "...",
  			"int_value": "...",
  			"buf_value": "...",
  			"state": "..."
  		}
  	]
  },
  "load_stats_config": {
  	"api_type": "...",
  	"cluster_names": [],
  	"grpc_services": [],
  	"refresh_delay": "{...}",
  	"request_timeout": "{...}",
  	"rate_limit_settings": "{...}"
  }
}
```

## dynamic_resources  -- 动态发现

[config.bootstrap.v2.Bootstrap.DynamicResources](https://www.envoyproxy.io/docs/envoy/latest/api-v2/config/bootstrap/v2/bootstrap.proto#envoy-api-msg-config-bootstrap-v2-bootstrap-dynamicresources)

`lds_config`、`cds_config`、`ads_config`的格式是完全相同的。

```json
{
  "lds_config": {
  	"api_type": "string，REST_LEGACY/REST/GRPC",
  	"cluster_names": ["string，只用于REST_LEGACY/REST，可以配置多个"],
  	"grpc_services": ["string，只用于GRPC，可以配置多个"],
  	"refresh_delay": "{...}",
  	"request_timeout": "{...}",
  	"rate_limit_settings": {
  		"max_tokens": "Uint32Value，默认值100",
  		"fill_rate": "DoubleValue，默认100 token/s"
  	}
  },
  "cds_config": {
  	"api_type": "...",
  	"cluster_names": [],
  	"grpc_services": [],
  	"refresh_delay": "{...}",
  	"request_timeout": "{...}",
  	"rate_limit_settings": "{...}"
  },
  "ads_config": {
  	"api_type": "...",
  	"cluster_names": [],
  	"grpc_services": [],
  	"refresh_delay": "{...}",
  	"request_timeout": "{...}",
  	"rate_limit_settings": "{...}"
  }
}
```

## hds_config  -- 健康检查

[core.ApiConfigSource](https://www.envoyproxy.io/docs/envoy/latest/api-v2/api/v2/core/config_source.proto#envoy-api-msg-core-apiconfigsource)

```json
{
  "api_type": "...",
  "cluster_names": [],
  "grpc_services": [],
  "refresh_delay": "{...}",
  "request_timeout": "{...}",
  "rate_limit_settings": "{...}"
}
```

## 参考

1. [Envoy（三）：envoy设计思路、配置文件和功能特性概览][1]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/20/envoy-03-arch.html#envoy%E7%9A%84%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6  "Envoy（三）：envoy设计思路、配置文件和功能特性概览"
