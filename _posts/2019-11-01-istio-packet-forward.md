---
layout: default
title: "服务网格/ServiceMesh 项目 istio 的流量重定向、代理请求过程分析"
author: 李佶澳
date: "2019-11-01 11:01:07 +0800"
last_modified_at: "2019-11-07 23:51:57 +0800"
categories: 项目
cover:
tags: istio
keywords: istio,envoy,服务网格,servicemesh,iptables,sidecar
description: istio 使用手册的配套笔记，以 Bookinfo Application 为例分析 istio 流量转发过程
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

这是 [istio 使用手册][2] 的配套笔记，以 [Bookinfo Application ][3] 为例分析 istio 的流量转发过程，使用的是 [istio 使用手册][2] 中的环境。
如果你不想看这个略微繁杂的过程，或者完全搞不懂这是在做什么，就看公众号上的文章：[istio是怎样强行代理Pod的进出请求的？][5]

## 环境简单说明

[Bookinfo Application][3] 由四个子系统组成，每个子系统都配置了对应的 VirutalService 和 DestinationRule，网关 bookinfo-gateway 的设置了监听端口 80。

![Bookinfo Application](https://www.lijiaocn.com/soft/img/envoy/bookinfo.svg)

下面是组成 istio 的 pod，这里分析的是作为边界网关的 istio-ingressgateway-585b9b66b8-fvz8v：

```sh
$ kubectl -n istio-system get pod
NAME                                      READY   STATUS      RESTARTS   AGE
grafana-6575997f54-d8ltw                  1/1     Running     3          62d
istio-citadel-555dbdfd6b-kfd86            1/1     Running     3          62d
istio-cleanup-secrets-1.2.5-kv7jf         0/1     Completed   0          62d
istio-egressgateway-79f5b5b958-vr5hf      1/1     Running     3          62d
istio-galley-6855ffd77f-2ln6p             1/1     Running     0          7d18h
istio-grafana-post-install-1.2.5-894k2    0/1     Completed   0          62d
istio-ingressgateway-585b9b66b8-fvz8v     1/1     Running     2          60d
istio-pilot-6d4dcbd54b-8p2fs              2/2     Running     6          62d
istio-policy-56588bf46d-8ft9v             2/2     Running     16         62d
istio-security-post-install-1.2.5-wzbkd   0/1     Completed   0          62d
istio-sidecar-injector-74f597fb84-p5n5p   1/1     Running     6          62d
istio-telemetry-76c5645cd9-k2r7n          2/2     Running     14         62d
istio-tracing-555cf644d-kcwll             1/1     Running     5          62d
kiali-6cd6f9dfb5-rvqg2                    1/1     Running     3          62d
prometheus-7d7b9f7844-hngc6               1/1     Running     6          62d
```

下面是组成 Bookinfo 的 pod，这里分析的是 productpage-v1-8554d58bff-wlkg7：

```sh
$ kubectl get pod
NAME                              READY   STATUS    RESTARTS   AGE
details-v1-74f858558f-f75m9       2/2     Running   4          60d
productpage-v1-8554d58bff-wlkg7   2/2     Running   4          60d
ratings-v1-7855f5bcb9-56jdn       2/2     Running   4          60d
reviews-v1-59fd8b965b-zphll       2/2     Running   4          60d
reviews-v2-d6cfdb7d6-f8xfm        2/2     Running   4          60d
reviews-v3-75699b5cfb-4w7qg       2/2     Running   4          60d
```

## 边界 envoy 的规则：istio-ingressgateway

网关 [bookinfo-gateway][4] 指示 istio-ingressgateway 监听 80 端口，接收从外部到来的请求，80 端口在 kubernetes 中的映射端口为 31380：

```sh
$ kubectl -n istio-system get svc |grep 31380
istio-ingressgateway     LoadBalancer   10.101.187.91    <pending>     15020:31270/TCP,80:31380/TCP...
```

能够通过 31380 访问 bookinfo：

```
$ curl http://192.168.99.100:31380/productpage
...省略...
```

进入istio-ingressgateway 查看 pod 中运行的组件：

```sh
$ kubectl -n istio-system exec -it istio-ingressgateway-585b9b66b8-fvz8v /bin/sh
# ps aux
USER   PID  COMMAND
root     1  /usr/local/bin/pilot-agent proxy router --domain istio-system.svc.cluster.local --log_output_level=default:info
root    35  /usr/local/bin/envoy -c /etc/istio/proxy/envoy-rev1.json --restart-epoch 1 --drain-time-s 45 --parent-shutdown-
root    76  /bin/sh
root    81  ps aux
```

只有两个组件，一个是 pilot-agent，一个是 envoy。

envoy 的启动配置文件是 /etc/istio/proxy/envoy-rev1.json，查看该文件可以发现 envoy 使用的 ads 地址是 `istio-pilot:15010`：

```json
"ads_config": {
  "api_type": "GRPC",
  "grpc_services": [
    {
      "envoy_grpc": {
        "cluster_name": "xds-grpc"
      }
    }
  ]
}
...省略...
{
  "name": "xds-grpc",
  "type": "STRICT_DNS",
  "dns_refresh_rate": "300s",
  "dns_lookup_family": "V4_ONLY",
  "connect_timeout": "10s",
  "lb_policy": "ROUND_ROBIN",

  "hosts": [
    {
      "socket_address": {"address": "istio-pilot", "port_value": 15010}
    }
  ],
  "circuit_breakers": {
    "thresholds": [
      {
        "priority": "DEFAULT",
        "max_connections": 100000,
        "max_pending_requests": 100000,
        "max_requests": 100000
      },
      {
        "priority": "HIGH",
        "max_connections": 100000,
        "max_pending_requests": 100000,
        "max_requests": 100000
      }
    ]
  }
}
```

envoy admin 监听地址是 127.0.0.1:15000，在容器获取完整配置：

```sh
$ curl 127.0.0.1:15000/config_dump
```

从完整配置中看到，envoy 有一个 80 端口的 listener，负责接收并转发从外部的请求，该 listener 使用从 ads 中获取的名为 http.80 的 route：

![envoy的80端口的listener]({{ site.imglocal }}/article/listener-80.png)

route 规则很简单，就是 domain、prefix 配置，对应一个 cluster：

![bookinfo 的 envoy 的 route]({{ site.imglocal }}/article/bookinfo-route.png)

route 中设置的 cluster 是 bookinfo 应用的 productpage：

![bookinfo 的 envoy 的 route]({{ site.imglocal }}/article/bookinfo-cluster-product.png)

用下面的命令获取 cluster 对应的 ip:

```sh
$ curl 127.0.0.1:15000/clusters |grep  "outbound|9080||productpage.default.svc.cluster.local"
outbound|9080||productpage.default.svc.cluster.local::default_priority::max_connections::1024
outbound|9080||productpage.default.svc.cluster.local::default_priority::max_pending_requests::1024
outbound|9080||productpage.default.svc.cluster.local::default_priority::max_requests::1024
outbound|9080||productpage.default.svc.cluster.local::default_priority::max_retries::1024
outbound|9080||productpage.default.svc.cluster.local::high_priority::max_connections::1024
outbound|9080||productpage.default.svc.cluster.local::high_priority::max_pending_requests::1024
outbound|9080||productpage.default.svc.cluster.local::high_priority::max_requests::1024
outbound|9080||productpage.default.svc.cluster.local::high_priority::max_retries::3
outbound|9080||productpage.default.svc.cluster.local::added_via_api::true
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::cx_active::5
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::cx_connect_fail::0
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::cx_total::6
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::rq_active::0
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::rq_error::0
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::rq_success::20
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::rq_timeout::0
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::rq_total::21
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::health_flags::healthy
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::weight::1
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::region::
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::zone::
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::sub_zone::
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::canary::false
outbound|9080||productpage.default.svc.cluster.local::172.17.0.20:9080::success_rate::-1
```

cluster 中的 172.17.0.20 是 pod productpage 的 ip ：

```sh
$  kubectl get pod -o wide  |grep 172.17.0.20
productpage-v1-8554d58bff-wlkg7   2/2     Running   4          60d   172.17.0.20   minikube   <none>           <none>
```

istio-ingressgateway 比较简单，用途是将外部的请求转发到目标 pod。

## pod productpage 的组成

pod productpage 用到三个镜像，启动了三个容器。

第一个是 initContainers 容器，在完成初始化设置后即退出，使用的镜像是 docker.io/istio/proxy_init:1.2.5。它的启动参数为：

```yaml
- args:
   - -p
   - "15001"
   - -u
   - "1337"
   - -m
   - REDIRECT
   - -i
   - '*'
   - -x
   - ""
   - -b
   - "9080"
   - -d
   - "15020"
   image: docker.io/istio/proxy_init:1.2.5
```

第二个是常驻运行的 istio-proxy 容器，使用的镜像是 docker.io/istio/proxyv2:1.2.5。它的启动参数为：

```yaml
image: docker.io/istio/proxyv2:1.2.5
imagePullPolicy: IfNotPresent
name: istio-proxy
args:
- proxy
- sidecar
- --domain
- $(POD_NAMESPACE).svc.cluster.local
- --configPath
- /etc/istio/proxy
- --binaryPath
- /usr/local/bin/envoy
- --serviceCluster
- productpage.$(POD_NAMESPACE)
- --drainDuration
- 45s
- --parentShutdownDuration
- 1m0s
- --discoveryAddress
- istio-pilot.istio-system:15010
- --zipkinAddress
- zipkin.istio-system:9411
- --dnsRefreshRate
- 300s
- --connectTimeout
- 10s
- --proxyAdminPort
- "15000"
- --concurrency
- "2"
- --controlPlaneAuthPolicy
- NONE
- --statusPort
- "15020"
- --applicationPorts
- "9080"
```

第三个容器是负责执行业务逻辑的 productpage，使用的 docker.io/istio/examples-bookinfo-productpage-v1:1.15.0。启动参数由用户定义：

```yaml
- image: docker.io/istio/examples-bookinfo-productpage-v1:1.15.0
  imagePullPolicy: IfNotPresent
  name: productpage
  ports:
  - containerPort: 9080
    protocol: TCP
```

initContainers 和 istio-proxy 不是用户创建的，是 istio 自动注入的，这两个容器是分析的重点。

## initContainers 用途分析

镜像 docker.io/istio/proxy_init:1.2.5 的 entrypoint 是一个设置 iptables 规则的脚本：

```json
"Entrypoint": [
    "/usr/local/bin/istio-iptables.sh"
],
```

istio-iptables.sh 的用法如下：

```sh
$ ./istio-iptables.sh  -p PORT -u UID -g GID [-m mode] [-b ports] [-d ports] [-i CIDR] [-x CIDR] [-k interfaces] [-t] [-h]

-p: Specify the envoy port to which redirect all TCP traffic (default $ENVOY_PORT = 15001)
-u: Specify the UID of the user for which the redirection is not
    applied. Typically, this is the UID of the proxy container
    (default to uid of $ENVOY_USER, uid of istio_proxy, or 1337)
-g: Specify the GID of the user for which the redirection is not
    applied. (same default value as -u param)
-m: The mode used to redirect inbound connections to Envoy, either "REDIRECT" or "TPROXY"
    (default to $ISTIO_INBOUND_INTERCEPTION_MODE)
-b: Comma separated list of inbound ports for which traffic is to be redirected to Envoy (optional). The
    wildcard character "*" can be used to configure redirection for all ports. An empty list will disable
    all inbound redirection (default to $ISTIO_INBOUND_PORTS)
-d: Comma separated list of inbound ports to be excluded from redirection to Envoy (optional). Only applies
    when all inbound traffic (i.e. "*") is being redirected (default to $ISTIO_LOCAL_EXCLUDE_PORTS)
-i: Comma separated list of IP ranges in CIDR form to redirect to envoy (optional). The wildcard
    character "*" can be used to redirect all outbound traffic. An empty list will disable all outbound
    redirection (default to $ISTIO_SERVICE_CIDR)
-x: Comma separated list of IP ranges in CIDR form to be excluded from redirection. Only applies when all
    outbound traffic (i.e. "*") is being redirected (default to $ISTIO_SERVICE_EXCLUDE_CIDR).
-o: Comma separated list of outbound ports to be excluded from redirection to Envoy (optional).
-k: Comma separated list of virtual interfaces whose inbound traffic (from VM)
    will be treated as outbound (optional)
-t: Unit testing, only functions are loaded and no other instructions are executed.

Using environment variables in $ISTIO_SIDECAR_CONFIG (default: /var/lib/istio/envoy/sidecar.env)
```

这时，我们就明白了 initContainers 参数的含义：

```yaml
- args:
   - -p
   - "15001"         # 接收重定向报文的 envoy 端口
   - -u
   - "1337"          # 重定向时排除用户 1337 的报文
   - -m
   - REDIRECT        # 重定向方式， REDIRECT 和 TPROXY
   - -i
   - '*'             # 重定向这些网段的报文，* 表示所有
   - -x
   - ""              # 重定向时排除这些网段的报文，"" 表示无
   - -b
   - "9080"          # 需要被重定向的报文的目的端口
   - -d
   - "15020"         # 重定向时排除使用这些目标端口的报文
   image: docker.io/istio/proxy_init:1.2.5
```

注意，在运行中的容器里是看不到 ./istio-iptables.sh 设置的 iptables 规则的：

```sh
$ kubectl exec -it productpage-v1-8554d58bff-wlkg7 -c istio-proxy  /bin/sh
$ iptables-save
$ <为空>
```

这是因为在容器内操作 iptables 规则需要设置 NET_ADMIN 权限。
istio 只为 initContainers 设置 NET_ADMIN 权限， 由 initContainers 完成 iptables 规则设置。
istio-proxy 容器和 productpage 容器没有 NET_ADMIN 权限，不能查看和更改  的 iptables 规则。

在 initContainers 的定义文件中可以看到下面的授权：

```yaml
securityContext:
  capabilities:
    add:
    - NET_ADMIN
```

initContainers 完成初始化设置后就退出了，需要到  所在的 node 上查看 iptables 规则：

```sh
$ docker inspect 9eece9720233 |grep Pid   # 确定容器的进程号，这里是 11308
            "Pid": 11308,
            "PidMode": "",
            "PidsLimit": 0,
$ nsenter -t  11308 -n /bin/sh            # 用 nsenter 进入进程的网络 namespace空间
$ iptables-save                           # 查看 pod 的 iptables 规则
```

istio 为 pod 设置的 iptables 规则如下：

```sh
-A PREROUTING -p tcp -j ISTIO_INBOUND
-A OUTPUT -p tcp -j ISTIO_OUTPUT
-A ISTIO_INBOUND -p tcp -m tcp --dport 9080 -j ISTIO_IN_REDIRECT
-A ISTIO_IN_REDIRECT -p tcp -j REDIRECT --to-ports 15001
-A ISTIO_OUTPUT ! -d 127.0.0.1/32 -o lo -j ISTIO_REDIRECT
-A ISTIO_OUTPUT -m owner --uid-owner 1337 -j RETURN
-A ISTIO_OUTPUT -m owner --gid-owner 1337 -j RETURN
-A ISTIO_OUTPUT -d 127.0.0.1/32 -j RETURN
-A ISTIO_OUTPUT -j ISTIO_REDIRECT
-A ISTIO_REDIRECT -p tcp -j REDIRECT --to-ports 15001
```

1. pod 外部发起的对 9080 端口的请求被重定向到 envoy 的 15001 端口
2. pod 内部发起的到外部的请求（非 1337 用户的进程），被重定向到 envoy 的端口 15001

运行 envoy 的 istio-proxy 容器以用户 1337 的身份运行，因此 envoy 进程的报文不会被重定向：

```yaml
name: istio-proxy
...省略...
securityContext:
  readOnlyRootFilesystem: true
  runAsUser: 1337
...省略...
```

通过上面的分析可以得知 initContainers 的用途是设置 iptables 的规则，使进入 pod 的报文和从 pod 发出的报文改道经过 envoy 接收或送出。

## istio-proxy 用途分析

istio-proxy 使用的镜像是 docker.io/istio/proxyv2:1.2.5，这个容器的 entrypoint 是：

```yaml
"Entrypoint": [
    "/usr/local/bin/pilot-agent"
]
```

pilot-agent 是 istio 的组件，它的具体用途需要研读代码才能知道，但是从 istio-proxy 内的进程状态来看，可以确定它的主要用途是唤起 envoy：

```sh
$ ps aux
USER       PID    TIME COMMAND
istio-p+     1    7:21 /usr/local/bin/pilot-agent proxy sidecar --domain default.svc.cluster.local --configPath /etc/istio/proxy --bin
istio-p+    32   13:56 /usr/local/bin/envoy -c /etc/istio/proxy/envoy-rev1.json --restart-epoch 1 --drain-time-s 45 --parent-shutdown-
istio-p+    45    0:00 /bin/sh
istio-p+    52    0:00 bash
istio-p+   127    0:00 /bin/sh
istio-p+   138    0:00 ps aux
```

前面分析的边界 envoy 容器中也有一个 pilot-agent 进程，但是两者的参数不同，一个是 sidecar 一个是 router：

```sh
# istio-proxy in productpage                # istio-proxy in ingressgateway
- args:                                     - args:
  - proxy                                     - proxy
  - sidecar                                   - router
  - --domain                                  - --domain
  - $(POD_NAMESPACE).svc.cluster.local        - $(POD_NAMESPACE).svc.cluster.local
  - --configPath                              - --log_output_level=default:info
  - /etc/istio/proxy                          - --drainDuration
  - --binaryPath                              - 45s
  - /usr/local/bin/envoy                      - --parentShutdownDuration
  - --serviceCluster                          - 1m0s
  - productpage.$(POD_NAMESPACE)              - --connectTimeout
  - --drainDuration                           - 10s
  - 45s                                       - --serviceCluster
  - --parentShutdownDuration                  - istio-ingressgateway
  - 1m0s                                      - --zipkinAddress
  - --discoveryAddress                        - zipkin:9411
  - istio-pilot.istio-system:15010            - --proxyAdminPort
  - --zipkinAddress                           - "15000"
  - zipkin.istio-system:9411                  - --statusPort
  - --dnsRefreshRate                          - "15020"
  - 300s                                      - --controlPlaneAuthPolicy
  - --connectTimeout                          - NONE
  - 10s                                       - --discoveryAddress
  - --proxyAdminPort                          - istio-pilot:15010                     
  - "15000"
  - --concurrency
  - "2"
  - --controlPlaneAuthPolicy
  - NONE
  - --statusPort
  - "15020"
  - --applicationPorts
  - "9080"
```

查看 sidecar envoy 的配置文件：

```sh
$ kubectl exec -it  productpage-v1-8554d58bff-wlkg7 -c istio-proxy  cat  /etc/istio/proxy/envoy-rev1.json
```

sidecar envoy 和边界网关 envoy 使用的是同一个 ADS，都是 istio-pilot.istio-system:15010。

```json
"name": "xds-grpc",
"type": "STRICT_DNS",
"dns_refresh_rate": "300s",
"dns_lookup_family": "V4_ONLY",
"connect_timeout": "10s",
"lb_policy": "ROUND_ROBIN",

"hosts": [
  {
    "socket_address": {"address": "istio-pilot.istio-system", "port_value": 15010}
  }
],
```

查看 sidecar envoy 的所有配置：

```sh
kubectl exec -it  productpage-v1-8554d58bff-wlkg7 -c istio-proxy curl 127.0.0.1:15000/config_dump
```

sidecar envoy 和边界网关 envoy 的全量配置有一个明显的区别：sidecar envoy 为集群中的每个 svc 都创建了 listener。

![sidecar envoy的多个listener]({{ site.imglocal }}/article/istio-sidecar-lis.png)

结合前面 initContainers 设置的 iptables 规则，可以判定，从 pod 内部发起的到 svc 的访问被重定向到 sidecar envoy 后，envoy 根据 listener 中的规则转发给 svc 背后的 pod。

综上，istio-proxy 容器的用途就是代理外部对 pod 的请求，代理 pod 到 svc 的等外部服务请求。 

initContainers 设置的 iptables 规则强行将报文重定向到 envoy，envoy 实现代理访问。

## 参考

1. [李佶澳的博客][1]
2. [istio 使用手册][2]
3. [istio 的 Bookinfo Application 示例拆解][3]
4. [创建 Gateway，边界 envoy 开始监听][4]
5. [istio是怎样强行代理Pod的进出请求的？][5]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/soft/istio/ "Istio 使用手册"
[3]: https://www.lijiaocn.com/soft/istio/bookinfo.html "Istio 的 Bookinfo Application 示例拆解"
[4]: https://www.lijiaocn.com/soft/istio/bookinfo.html#%E5%88%9B%E5%BB%BA-gateway%EF%BC%8C%E8%BE%B9%E7%95%8C-envoy-%E5%BC%80%E5%A7%8B%E7%9B%91%E5%90%AC "创建 Gateway，边界 envoy 开始监听"
[5]: https://mp.weixin.qq.com/s/NXH7N6QipCtxb7wcsl4AEg "istio是怎样强行代理Pod的进出请求的？"
