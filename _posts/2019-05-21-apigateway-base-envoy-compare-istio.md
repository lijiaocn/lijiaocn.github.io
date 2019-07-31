---
layout: default
title: "基于Envoy的ApiGateway/Ingress Controller项目梳理（四）：Istio"
author: 李佶澳
createdate: "2019-05-21 11:03:40 +0800"
last_modified_at: "2019-06-01 17:16:10 +0800"
categories: 项目
tags: apigateway envoy
cover:
keywords: apigateway,envoy,kong,nginx,servicemesh,ingress controller
description: "对比Kubernetes文档列出的Ingress Controller：ambassador,contour,gloo,istio, traefik, voyager"
---

## 目录
* auto-gen TOC:
{:toc}

## Istio

[Istio](https://istio.io/docs/concepts/what-is-istio/) 是 ServiceMesh 方向的明星项目，它已经超出了 apigateway 的范畴，是一个微服务管理平台。Istio 绑定到 kubernetes（现在已经支持独立部署），通过为每个 Pod 注入一个 envoy 旁路容器，接管所有进出流量，实现了全局流量可视、全局调度、全局控制管理。

如果说 gloo 是一个比较新颖轻量级的 apigateway 解决方案，那么 istio 就是一个超前设计的重型方案。

![istio的架构]({{ site.imglocal }}/article/istio-arch.svg)

galley：istio 配置的验证、处理、下发，是 istio 的对外接口。

mixer: 进行访问控制管理、验证请求信息、收集 envoy 状态数据。

pilot: 将控制规则转换成 envoy 配置，是 envoy 对接的 xds。

citadel：管理服务与服务之间、终端用户与服务之间的认证。

## 在集群中部署Istio

Istio的部署文件位于项目源码中，用 [helm部署到kubernetes](https://istio.io/docs/setup/kubernetes/install/helm/) 比较方便：

```sh
git clone https://github.com/istio/istio.git
cd istio
git chckout 1.1.7
```

部署前的初始化设置，主要操作是创建 CRD：

```sh
$ kubectl create namespace istio-system
$ helm template install/kubernetes/helm/istio-init --name istio-init --namespace istio-system | kubectl apply -f -
configmap/istio-crd-10 created
configmap/istio-crd-11 created
serviceaccount/istio-init-service-account created
clusterrole.rbac.authorization.k8s.io/istio-init-istio-system created
clusterrolebinding.rbac.authorization.k8s.io/istio-init-admin-role-binding-istio-system created
job.batch/istio-init-crd-10 created
job.batch/istio-init-crd-11 created
```

核对 CRD 数量：

```sh
$ kubectl get crds | grep 'istio.io\|certmanager.k8s.io' | wc -l
53
```

部署 istio：

```sh
$ helm template install/kubernetes/helm/istio --name istio --namespace istio-system | kubectl apply -f -
```

查看 istio 各个组件的运行状态：

```sh
$ kubectl -n istio-system get pod -o wide  |grep -v Completed
NAME                                        READY   STATUS      RESTARTS   AGE   IP               NODE            NOMINATED NODE
istio-citadel-67d66d65d7-59fdt              1/1     Running     0          23h   172.16.128.146   10.10.173.203   <none>
istio-galley-86f577c98-86ggb                1/1     Running     0          23h   172.16.128.147   10.10.173.203   <none>
istio-ingressgateway-56556449d9-qrx72       1/1     Running     0          23h   172.16.128.143   10.10.173.203   <none>
istio-pilot-85dcbf9f7d-4tt5d                2/2     Running     0          23h   172.16.129.88    10.10.64.58     <none>
istio-policy-568d788cd7-w2ctp               2/2     Running     2          23h   172.16.128.144   10.10.173.203   <none>
istio-sidecar-injector-79f667994b-9fh2f     1/1     Running     0          23h   172.16.128.148   10.10.173.203   <none>
istio-telemetry-84df54dc85-vjzrf            2/2     Running     2          23h   172.16.128.145   10.10.173.203   <none>
prometheus-5977597c75-ln2x7                 1/1     Running     0          23h   172.16.129.89    10.10.64.58     <none>
```

istio 的管理命令 `istioctl` 可以用brew安装：

```sh
$ brew install istioctl
```

注意，如果要使用 istio 的自动注入功能（[Automatic sidecar injection](https://istio.io/docs/setup/kubernetes/additional-setup/sidecar-injection/#automatic-sidecar-injection)），kube-apiserver 的 --admission-control 参数中需要包含：MutatingAdmissionWebhook,ValidatingAdmissionWebhook。

## 部署Istio应用

Istio官网上给出了一个特别好的例子，[Bookinfo Application](https://istio.io/docs/examples/bookinfo/)：

使用istio之前：

![bookinfo without istio]({{ site.imglocal }}/article/app-noistio.svg)

使用istio之后，图中的深棕色长条是注入到每个pod的envoy容器：

![bookinfo with istio]({{ site.imglocal }}/article/app-withistio.svg)

创建一个namespace，专门用于部署 istio 应用：

```sh
$ kubectl create  namespace istio-app
namespace/istio-app created

# 打上istio标签后，部署在该 ns 中的 pod 会被自动注入 envoy 容器 
$ kubectl label namespace istio-app istio-injection=enabled
namespace/istio-app labeled
```

部署 bookinfo 应用：

```sh
$ kubectl -n istio-app apply -f samples/bookinfo/platform/kube/bookinfo.yaml
```

也可以用手动方式将应用设置为 istio 应用，用下面的命令转换部署文件：

```sh
$ istioctl kube-inject -f samples/bookinfo/platform/kube/bookinfo.yaml   > bookinfo-istio.yaml
```

每个 pod 被注入一个 envoy 容器，从原先的一个容器变成了2个容器：

```sh
$ kubectl -n istio-app get pod -o wide
NAME                              READY   STATUS    RESTARTS   AGE   IP               NODE            NOMINATED NODE
details-v1-5cb65fd66c-d2tlq       2/2     Running   0          16m   172.16.128.161   10.10.173.203   <none>
productpage-v1-6cd65b46b9-bsx2x   2/2     Running   0          16m   172.16.129.99    10.10.64.58     <none>
ratings-v1-6cf8478cc5-92rrn       2/2     Running   0          16m   172.16.129.97    10.10.64.58     <none>
reviews-v1-85fd9d5d54-glb5d       2/2     Running   0          16m   172.16.128.163   10.10.173.203   <none>
reviews-v2-f7cddcd8b-4l2nv        2/2     Running   0          16m   172.16.129.98    10.10.64.58     <none>
reviews-v3-7c647f4ddb-l5gz4       2/2     Running   0          16m   172.16.128.162   10.10.173.203   <none>
```

## 创建应用寻址规则：DestinationRule

DestinationRule 是 Pod 的筛选规则， Istio 路由中会用到，创建 bookinfo 的寻址规则：

```sh
$ kubectl -n istio-app apply -f samples/bookinfo/networking/destination-rule-all.yaml
```

定义如下，通过 labels 筛选不同的 pod：

```sh
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: productpage
spec:
  host: productpage
  subsets:
  - name: v1
    labels:
      version: v1
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: reviews
spec:
  host: reviews
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
  - name: v3
    labels:
      version: v3
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: ratings
spec:
  host: ratings
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
  - name: v2-mysql
    labels:
      version: v2-mysql
  - name: v2-mysql-vm
    labels:
      version: v2-mysql-vm
---
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: details
spec:
  host: details
  subsets:
  - name: v1
    labels:
      version: v1
  - name: v2
    labels:
      version: v2
---
```

查看创建的 destinationrules：

```sh
$ kubectl -n istio-system get destinationrules
NAME              HOST                                             AGE
details           details                                          6m
istio-policy      istio-policy.istio-system.svc.cluster.local      3d
istio-telemetry   istio-telemetry.istio-system.svc.cluster.local   3d
productpage       productpage                                      6m
ratings           ratings                                          6m
reviews           reviews                                          6m
```

## 创建Istio应用网关

为 istio 应用创建网关，之后通过 istio 的网关访问应用：

```sh
$ kubectl -n istio-app apply -f samples/bookinfo/networking/bookinfo-gateway.yaml
```

网关配置如下：

```sh
apiVersion: networking.istio.io/v1alpha3
kind: Gateway
metadata:
  name: bookinfo-gateway
spec:
  selector:
    istio: ingressgateway # use istio default controller
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - "*"
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: bookinfo
spec:
  hosts:
  - "*"
  gateways:
  - bookinfo-gateway
  http:
  - match:
    - uri:
        exact: /productpage
    - uri:
        exact: /login
    - uri:
        exact: /logout
    - uri:
        prefix: /api/v1/products
    route:
    - destination:
        host: productpage
        port:
          number: 9080
```

通过 istio 的 ingressgateway 访问 istio 应用，网关地址是：

```sh
$ kubectl -n istio-system get svc istio-ingressgateway
NAME                   TYPE       CLUSTER-IP     EXTERNAL-IP   PORT(S)                                                                                                                                      AGE
istio-ingressgateway   NodePort   172.16.44.61   <none>        15020:30624/TCP,80:31380/TCP,443:31390/TCP,31400:31400/TCP,15029:31983/TCP,15030:31500/TCP,15031:30734/TCP,15032:30488/TCP,15443:30962/TCP   3d21h
```

访问 http://10.10.64.58:31380/productpage：

![istio示范应用]({{ site.imglocal }}/article/istio-app.png)

这时候刷新网页，会显示不同的页面，有的页面带有评分，有的没有评分，带有评分的页面如下：

![istio示范应用带有评分的页面]({{ site.imglocal }}/article/istio-app-1.png)

这是因为 productpage 依赖的 reviews 服务指向了三个不同版本的 deployment，productpage 对 reviews 服务的调用会分别被不同版本的 Pod 处理。下一节为每个服务创建各自的 virutalservice，在 virtualservice 中指定 destination 能解决这个问题。

## 创建VirtualService

上面部署的 istio 应用的 service 的筛选标签中没有版本信息：

```sh
$ kubectl -n istio-app get svc --show-labels
NAME          TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE     LABELS
details       ClusterIP   172.16.37.245   <none>        9080/TCP         2d18h   app=details,service=details
productpage   NodePort    172.16.56.87    <none>        9080:31600/TCP   2d18h   app=productpage,service=productpage
ratings       ClusterIP   172.16.34.54    <none>        9080/TCP         2d18h   app=ratings,service=ratings
reviews       ClusterIP   172.16.7.67     <none>        9080/TCP         2d18h   app=reviews,service=reviews
```

实际部署了多个版本的 deployment：reviews-v1、reviews-v2、reviews-v3，它们被同一个 service（reviews）代理，所以会出现上一节刷新页面显示不同内容的情况：

```sh
$ kubectl -n istio-app get deployment --show-labels
NAME             DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE     LABELS
details-v1       1         1         1            1           2d18h   app=details,version=v1
productpage-v1   1         1         1            1           2d18h   app=productpage,version=v1
ratings-v1       1         1         1            1           2d18h   app=ratings,version=v1
reviews-v1       1         1         1            1           2d18h   app=reviews,version=v1
reviews-v2       1         1         1            1           2d18h   app=reviews,version=v2
reviews-v3       1         1         1            1           2d18h   app=reviews,version=v3
```

为每个 service 创建对应的 virtualservice：

```sh
$ kubectl -n istio-app apply -f samples/bookinfo/networking/virtual-service-all-v1.yaml
```

virtualservice 的定义如下，route 中的 destination 就是前面创建的寻址规则：

```sh
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: productpage
spec:
  hosts:
  - productpage
  http:
  - route:
    - destination:
        host: productpage
        subset: v1
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: reviews
spec:
  hosts:
  - reviews
  http:
  - route:
    - destination:
        host: reviews
        subset: v1
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: ratings
spec:
  hosts:
  - ratings
  http:
  - route:
    - destination:
        host: ratings
        subset: v1
---
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: details
spec:
  hosts:
  - details
  http:
  - route:
    - destination:
        host: details
        subset: v1
---
```

查看创建的 vs，如果有重名的 crd，在 vs 后面加上 api group，istio 的 vs 是 vs.networking.istio.io 或 virtualservice.networking.istio.io：

```sh
$ kubectl -n istio-app get vs.networking.istio.io
NAME          GATEWAYS   HOSTS           AGE
details                  [details]       4s
productpage              [productpage]   4s
ratings                  [ratings]       4s
reviews                  [reviews]       4s
```

创建了 virtualservice 后，再次访问应用就不会出现页面不同的情况，reviews 的 destination 是“subset: v1”，指向的是没有评分信息的版本，修改成 v2 切换到有评分的版本（蓝绿部署）。

## 初步印象

istio 相对前面的几个网关要复杂得多，从 Pod 的数量上就可以感受到。

### 好的方面

1. 完全开源，活跃度高，有标杆项目的势头； 
2. 管控粒度细，发生作用的位置紧邻Pod，可以在第一时间截获请求；
3. 功能设计完善。

### 不好的方面

1. 有些复杂，上手难度稍高，完全掌握需要耗费较多时间；
2. 为每个pod注入一个envoy，占用了计算节点上的资源。

