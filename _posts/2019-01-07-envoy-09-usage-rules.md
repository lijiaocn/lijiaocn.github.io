---
layout: default
title: "Envoy Proxy使用介绍教程（九）: envoy的应用方法与使用约束"
author: 李佶澳
createdate: "2019-01-07 14:52:23 +0800"
last_modified_at: "2019-05-07 18:51:36 +0800"
categories: 项目
tags: envoy
keywords: envoy,envoy proxy,envoy的使用约束,envoy的配置文件
description: envoy有自己的一些使用规范，譬如配置文件envoy.yaml中有的名称或端口是可以重复的有些不可以重复的
---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这篇笔记比较老，不再更新维护，请移步最新的手册：[envoy相关笔记](https://www.lijiaocn.com/soft/envoy/)。

## Listener使用限制

### 同一个“IP:Port”不能被多个Listener使用

如果envoy启动时获得的配置中，有端口冲突，会打印一条日志：

```
[2019-01-07 14:51:19.417][16000][critical][config] source/server/listener_manager_impl.cc:836] listener 'listener_with_dynamic_route_port_9001_repeat' failed to listen on address '0.0.0.0:9001' on worker
```

如果envoy动态获取的一个新的Listener与已有的Listener端口冲突，会不停的打印下面的日志：

```
[2019-01-07 14:53:30.086][16108][warning][config] bazel-out/k8-opt/bin/source/common/config/_virtual_includes/grpc_mux_subscription_lib/common/config/grpc_mux_subscription_impl.h:70] gRPC config for type.googleapis.com/envoy.api.v2.Listener rejected: Error adding/updating listener listener_with_dynamic_route_port_9001_repeat: cannot bind '0.0.0.0:9001': Address already in use
[2019-01-07 14:53:30.087][16108][warning][upstream] source/common/config/grpc_mux_impl.cc:226] gRPC config for type.googleapis.com/envoy.api.v2.Listener update rejected: Error adding/updating listener listener_with_dynamic_route_port_9001_repeat: cannot bind '0.0.0.0:9001': Address already in use
[2019-01-07 14:53:30.088][16108][warning][config] bazel-out/k8-opt/bin/source/common/config/_virtual_includes/grpc_mux_subscription_lib/common/config/grpc_mux_subscription_impl.h:70] gRPC config for type.googleapis.com/envoy.api.v2.Listener rejected: Error adding/updating listener listener_with_dynamic_route_port_9001_repeat: cannot bind '0.0.0.0:9001': Address already in use
```

### Listener可以使用多个同名的filter

```go
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
```

## 名为envoy.http_connection_manager的filter中可以用多个同名的http filter

## 名为envoy.http_connection_manager的filter中vhost的域名必须不相同

如果vhost的名称相同会触发告警，并且在/config_dump中看不到域名重复的vhost：

```
[2019-01-07 15:08:14.004][16790][warning][upstream] source/common/config/grpc_mux_impl.cc:226] gRPC config for type.googleapis.com/envoy.api.v2.RouteConfiguration update rejected: Only unique values for domains are permitted. Duplicate entry of domain ads.webshell.com
[2019-01-07 15:08:14.004][16790][warning][config] bazel-out/k8-opt/bin/source/common/config/_virtual_includes/grpc_mux_subscription_lib/common/config/grpc_mux_subscription_impl.h:70] gRPC config for type.googleapis.com/envoy.api.v2.RouteConfiguration rejected: Only unique values for domains are permitted. Duplicate entry of domain ads.webshell.com
```
