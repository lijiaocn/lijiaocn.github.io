---
layout: default
title: "基于Envoy的ApiGateway/Ingress Controller项目梳理（二）: Contour"
author: 李佶澳
createdate: "2019-05-21 10:58:56 +0800"
last_modified_at: "2019-06-01 17:15:48 +0800"
categories: 项目
tags: gateway envoy
cover:
keywords: apigateway,envoy,kong,nginx,servicemesh,ingress controller
description: "对比Kubernetes文档列出的Ingress Controller：ambassador,contour,gloo,istio, traefik, voyager"
---

## 目录
* auto-gen TOC:
{:toc}

## Contour

[Contour](https://github.com/heptio/contour) 是[heptio](https://heptio.com/)公司开发的，这是一家做 kubernetes 解决方案的公司，[Making it easy to use Envoy as a Kubernetes load balancer](https://blog.heptio.com/making-it-easy-to-use-envoy-as-a-kubernetes-load-balancer-dde82959f171)介绍了 Contour 的诞生过程，从介绍中可以感受到 Contour 就是单纯的要用 envoy 替代 nginx ，提供一个基于 envoy 的 ingress：

1. Contour 适用于 Kubernetes1.10 以及以后的版本，用到了 RBAC 功能；
2. Contour 用名为 [IngressRoute](https://github.com/heptio/contour/blob/master/docs/ingressroute.md) 的 CRD 完全取代了 kubernetes 原生的 Ingress，功能更丰富；
3. Contour 的 Pod 独立工作互不干扰，每个 Pod 中包含一个 Contour 容器、一个标准的 Envoy 容器；
4. Contour 的 IngressRoute Delegation 功能比较有特色，很创新。

[Example-workload/ingressroute](https://github.com/heptio/contour/tree/master/deployment/example-workload/ingressroute)是 Contour 的使用示例。

### 在集群中部署Contour

yaml 文件不复杂，就是定义 CRD、创建 Deployment、设置 RBAC 等，镜像在 gcr.io 上需要翻Q：

```sh
$ ./kubectl.sh apply -f https://j.hept.io/contour-deployment-rbac
```

Contour 部署在名为 heptio-contour 的 namespace 中：

```sh
$ ./kubectl.sh -n heptio-contour get svc
NAME      TYPE           CLUSTER-IP    EXTERNAL-IP   PORT(S)                      AGE
contour   NodePort      172.16.9.36   <none>     80:30587/TCP,443:30961/TCP   114s
```

为了便于查看 envoy 的配置，将 envoy 的admin-adress设置为0.0.0.0，并暴露 9001 端口：

```sh
initContainers:
- args:
  - bootstrap
  - --admin-address=0.0.0.0
  - /config/contour.json
...省略...
containers:
  - envoy
  image: docker.io/envoyproxy/envoy:v1.10.0
  ...
  ports:
  - containerPort: 9001
    name: admin
    protocol: TCP
  ...
```

在svc中添加9001端口：

```sh
apiVersion: v1
kind: Service
metadata:
 name: contour
 ...
spec:
 ports:
 - port: 9001
   name: admin
   protocol: TCP
   targetPort: 9001
 ...
```

然后就可以通过9001查看envoy的状态：

```sh
$ ./kubectl.sh  -n heptio-contour get svc -o wide
NAME      TYPE       CLUSTER-IP    EXTERNAL-IP   PORT(S)                                     AGE   SELECTOR
contour   NodePort   172.16.9.36   <none>        80:30587/TCP,443:30961/TCP,9001:32051/TCP   22h   app=contour
```

![contour中envoy的状态]({{ site.imglocal }}/article/contour-envoy-stat.png)

### 代理到集群内部

创建一个IngressRoute，IngressRoute的用法和Ingress类似，只不过功能更多：

```yaml
apiVersion: contour.heptio.com/v1beta1
kind: IngressRoute
metadata:
  name: contour-echo-demo
spec:
  virtualhost:
    fqdn: echo.com
  routes:
    - match: /
      services:
        - name: echo
          port: 80
```

通过contour访问：

```sh
$ curl -H "Host:echo.com" 10.10.64.58:30587

Hostname: echo-7df87d5c6d-s4vhq

Pod Information:
	-no pod information available-
......
```

envoy中route的EDS是指向contour：

![contour中envoy的EDS]({{ site.imglocal }}/article/contour-eds.png)

contour向envoy下发的是pod的ip：

![contour中envoy clsuter的状态]({{ site.imglocal }}/article/contour-envoy-cluster.png)

### 代理到集群外部

从 Contour Servie的[代码注释](https://github.com/heptio/contour/blob/master/apis/contour/v1beta1/ingressroute.go#L87)可以知道，service 是 endpoints 的名称：

```go
// Service defines an upstream to proxy traffic to
type Service struct {
	// Name is the name of Kubernetes service to proxy traffic.
	// Names defined here will be used to look up corresponding endpoints which contain the ips to route.
	Name string `json:"name"`
// Port (defined as Integer) to proxy traffic to since a service can have multiple defined
```

代理到集群外部，要创建一个包含外部服务 IP 的 endpoints，然后在 IngressRoute 中指向它。

### IngressRoute Delegation（路由级联）

Contour 的 IngressRoute Delegation 比较有特色，定义了 IngressRoute 的级联关系：一个 IngressRoute 可以指向另一个 IngressRoute（支持跨 namespace ），上层 IngressRoute 的配置被下层继承。

IngressRoute Delegation 的典型用法是，在最上层的 IngressRoute 中配置域名等通用信息，在下层 IngressRoute 中只配置各自的路径相关信息，无需重复设置通用信息。

用 IngressRoute Delegation 实现蓝绿部署非常方便！只需要在上层 IngressRoute 中稍作修改，切换到另一个下级 IngressRoute，例如：

```yaml
apiVersion: contour.heptio.com/v1beta1
kind: IngressRoute
metadata: 
  name: blue-green-root
  namespace: default
spec: 
  virtualhost:
    fqdn: blue-green.bar.com
  routes: 
    - match: / 
      delegate:
        name: blue # Changing this to `green` will immediately switch to the other ingressroute object
                   # This can be helpful for testing different ingressroute configs
                   # or for improved UX doing blue/green application deployments
```

### 初步印象

Contour 是一个很简练的项目，它的定位是 kubernetes 的一个附加组件，专注发挥 envoy 自身的功能，没有繁杂花哨的设计。

#### 好的方面

1. 简单精炼，容易上手；
2. 充分利用envoy自身的功能，整体结构清晰明了，配置简单；
3. 自定义CRD，管理方便；
4. IngressRoute的级联设计非常有特色，用级联功能做蓝绿部署非常方便。

#### 不好的方面

1. 已经实现的功能较少，主要实现了http、websocket、tcp代理、https、权重配置、探活、rewrite等功能，Qos限速、认证、流量复制等功能尚未实现；
2. 热度较低，fork 229，贡献人员57人，以后的发展可能比较缓慢；
3. 用自定义的IngressRoute，完全绕过了kubernetes内置的Ingress。

