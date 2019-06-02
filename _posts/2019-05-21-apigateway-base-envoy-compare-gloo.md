---
layout: default
title: "基于Envoy的ApiGateway/Ingress Controller项目梳理（三）：Gloo"
author: 李佶澳
createdate: "2019-05-21 11:02:53 +0800"
changedate: "2019-06-01 17:16:00 +0800"
categories: 项目
tags: apigateway envoy
cover:
keywords: apigateway,envoy,kong,nginx,servicemesh,ingress controller
description: "对比Kubernetes文档列出的Ingress Controller：ambassador,contour,gloo,istio, traefik, voyager"
---

## 目录
* auto-gen TOC:
{:toc}

## Gloo

[Gloo](https://gloo.solo.io/) 是一个设计很新颖的 api gateway，[功能](https://gloo.solo.io/introduction/#routing-features)和支持的[平台](https://gloo.solo.io/introduction/#)很丰富，文档也非常好，[架构设计](https://gloo.solo.io/introduction/architecture/)、[基本概念](https://gloo.solo.io/introduction/concepts/)等介绍的很清楚。设计架构如下：

![gloo网关]({{ site.imglocal }}/article/gloo_diagram.png)

![gloo的设计架构]({{ site.imglocal }}/article/gloo-arch.png)

基本概念：

1. Virtual Service 是路由配置，由 Routes、Matchers 和 Destiantions 组成；
2. Uptreams 是后端应用，gloo 很创新地为 upstreams 引入了 functions（函数服务和应用的API）。

### 在集群中部署Gloo

Gloo 提供了一个名为 glooctl 的工具，用来管理 gloo ，用 brew 直接安装：

```sh
brew install solo-io/tap/glooctl.
# 或者
curl -sL https://run.solo.io/gloo/install | sh
```

#### 用glooctl部署

直接用 glooctl 部署 gloo ，默认安装在名为 gloo-system 的 namespace 中，用`-n`修改默认的 namespace，例如“glooctl install gateway -n my-namespace”。

gloo有三种部署方式，分别是Gloo Gateway、 Gloo Ingress Controller、Gloo Knative Cluster Ingress，官方文档建议使用gateway的方式，三种方式部署命令如下：

```sh
glooctl install gateway  （推荐方式，可以应用gloo提供的特性，glooctl使用helm安装gloo）
glooctl install ingress  （兼容kubernete的ingress）
glooctl install knative  （兼容knative应用）
```

安装的过程会访问需要翻Q才能访问的 https://storage.googleapis.com/solo-public-helm/charts/gloo-0.13.28.tgz，与此同时又要访问kuberetes。

这里的操作端mac上开启了全局VPN，访问内部网中的kubernetes 10.10.173.203，需要进行路由设置：

开启vpn后，默认路由是通过vpn的网卡：

```sh
$ route get 10.10.173.203
   route to: 10.10.173.203
destination: default
       mask: default
  interface: utun3
      flags: <UP,DONE,CLONING,STATIC>
 recvpipe  sendpipe  ssthresh  rtt,msec    rttvar  hopcount      mtu     expire
       0         0         0         0         0         0      1280         0
```

修改为经过本地网卡en0，参考[mac设置路由表](https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/10/06/mac-route.html#%E6%B7%BB%E5%8A%A0%E8%B7%AF%E7%94%B1)：

```sh
$ route -n add -net 10.10.0.0 -netmask 255.255.0.0  172.16.111.254
```

gloo默认安装在gloo-system中：

```sh
$ kubectl -n gloo-system get svc
NAME            TYPE           CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE
gateway-proxy   LoadBalancer   172.16.46.252    <pending>     80:31403/TCP,443:32649/TCP   2m47s
gloo            ClusterIP      172.16.126.174   <none>        9977/TCP                     2m48s

$ kubectl -n gloo-system get deployment
NAME            DESIRED   CURRENT   UP-TO-DATE   AVAILABLE   AGE
discovery       1         1         1            1           2m50s
gateway         1         1         1            1           2m50s
gateway-proxy   1         1         1            1           2m50s
gloo            1         1         1            1           2m50s
```

删除方法：

```sh
glooctl uninstall
```

#### 用helm部署

安装[helm](https://github.com/helm/helm)命令：

```sh
$ brew install kubernetes-helm
$ helm init
$ helm repo add gloo https://storage.googleapis.com/solo-public-helm
```

用helm搜索gloo：

```sh
$ helm search gloo/gloo --versions
NAME     	CHART VERSION	APP VERSION	DESCRIPTION
gloo/gloo	0.13.28      	           	Gloo Helm chart for Kubernetes
gloo/gloo	0.13.27      	           	Gloo Helm chart for Kubernetes
gloo/gloo	0.13.26      	           	Gloo Helm chart for Kubernetes
gloo/gloo	0.13.25      	           	Gloo Helm chart for Kubernetes
gloo/gloo	0.13.24      	           	Gloo Helm chart for Kubernetes
...
```

部署方法：

```sh
$ helm install gloo/gloo --name gloo-0-7-6 --namespace my-namespace
```

将helm charts获取到本地的方法：

```sh
$ helm fetch gloo/gloo
 gloo-0.13.28.tgz
```

### 代理到集群内部

先在kubernetes集群中部署一个应用，这是gloo文档中给出的应用，部署在default namespace中：

```sh
$ kubectl apply \
  --filename https://raw.githubusercontent.com/solo-io/gloo/master/example/petstore/petstore.yaml
```

#### Ingress的方式

Ingress方式就是直接识别Kubernetes的ingress，将它们转换成envoy中的配置。

创建ingress：

```
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
 name: petstore-ingress
 annotations:
    kubernetes.io/ingress.class: gloo
spec:
  rules:
  - host: gloo.example.com
    http:
      paths:
      - path: /.*
        backend:
          serviceName: petstore
          servicePort: 8080
```

用proxy命令获得代理服务地址：

```
$ glooctl proxy url --name ingress-proxy
http://192.168.64.46:30949
```

#### Gateway的方式

Gateway方式中，gloo自定义的CRD完全取代了kubernetes的ingress，使用gateway方式，需要用glooctl install gateway部署gloo。

##### upstream发现

用下面的命令查看所有的upstream，也就是集群中的所有pod和它们的服务端口：

```sh
$ glooctl get upstreams
+-------------------------------+------------+----------+--------------------------------+
|           UPSTREAM            |    TYPE    |  STATUS  |            DETAILS             |
+-------------------------------+------------+----------+--------------------------------+
| amb-demo-httpbin-80           | Kubernetes | Accepted | svc name:      httpbin         |
|                               |            |          | svc namespace: amb-demo        |
|                               |            |          | port:          80              |
| default-petstore-8080         | Kubernetes | Accepted | svc name:      petstore        |
|                               |            |          | svc namespace: default         |
|                               |            |          | port:          8080            |
|                               |            |          | REST service:                  |
|                               |            |          | functions:                     |
|                               |            |          | - addPet                       |
|                               |            |          | - deletePet                    |
|                               |            |          | - findPetById                  |
|                               |            |          | - findPets                     |
|                               |            |          |                                |
...
```

注意 default-petstore-8080 的`DETAILS`明显不同，其中有一段 REST Service 和 functions 信息：

```sh
REST service: 
functions:    
- addPet      
- deletePet   
- findPetById 
- findPets    
```

[Petstore](https://raw.githubusercontent.com/solo-io/gloo/master/example/petstore/petstore.yaml)的部署方式和其它应用没有区别，这些信息是从petstore的/swagger.json中发现的，在yaml文件中可以看到：

```sh
$ glooctl get upstream default-petstore-8080 --output yaml
...
    serviceSpec:
      rest:
        swaggerInfo:
          url: http://petstore.default.svc.cluster.local:8080/swagger.json
...
```

自动从swagger文件中发现应用支持的接口，这个设计非常非常赞！除了[swagger](https://github.com/OAI/OpenAPI-Specification)，gloo还支持[gRPC reflection](https://github.com/grpc/grpc-go/blob/master/Documentation/server-reflection-tutorial.md)。

##### 路径转发

为指定的upstream配置转发路径，将路径 /sample-route-1  转发到 default-petstore-8080 ，并且将路径前缀修改为  /api/pets。

```sh
$ glooctl add route \
    --path-exact /sample-route-1 \
    --dest-name default-petstore-8080 \
    --prefix-rewrite /api/pets
creating virtualservice default with default domain *
+-----------------+--------------+---------+------+---------+---------+--------------------------------+
| VIRTUAL SERVICE | DISPLAY NAME | DOMAINS | SSL  | STATUS  | PLUGINS |             ROUTES             |
+-----------------+--------------+---------+------+---------+---------+--------------------------------+
| default         |              | *       | none | Pending |         | /sample-route-1 ->             |
|                 |              |         |      |         |         | default-petstore-8080          |
+-----------------+--------------+---------+------+---------+---------+--------------------------------+
```

设置路径转发实质是创建一个对应的virtual service， virtual service 中不仅有 routes ，还有 domains 、ssl、plugins字段，没有指定域名的路径转发位于 default virtualservice 中，domains 字段是`*`：

```sh
$ glooctl get virtualservice
+-----------------+--------------+---------+------+----------+---------+--------------------------------+
| VIRTUAL SERVICE | DISPLAY NAME | DOMAINS | SSL  |  STATUS  | PLUGINS |             ROUTES             |
+-----------------+--------------+---------+------+----------+---------+--------------------------------+
| default         |              | *       | none | Accepted |         | /sample-route-1 ->             |
|                 |              |         |      |          |         | default-petstore-8080          |
+-----------------+--------------+---------+------+----------+---------+--------------------------------+
$ glooctl get virtualservice --output yaml  (yaml格式输出)
...
```

用proxy命令获取代理服务地址：

```sh
$ glooctl proxy url
http://10.10.173.203:31403

$ curl http://10.10.173.203:31403/sample-route-1
[{"id":1,"name":"Dog","status":"available"},{"id":2,"name":"Cat","status":"pending"}]
```

创建另一个路径转发，观察 prefix-rewrite 的作用：

```sh
$ glooctl add route \
    --path-exact /isecho \
    --dest-name demo-echo-echo-80 \
    --prefix-rewrite /prefix/a

selected virtualservice default for route
+-----------------+--------------+---------+------+----------+---------+--------------------------------+
| VIRTUAL SERVICE | DISPLAY NAME | DOMAINS | SSL  |  STATUS  | PLUGINS |             ROUTES             |
+-----------------+--------------+---------+------+----------+---------+--------------------------------+
| default         |              | *       | none | Accepted |         | /echo ->                       |
|                 |              |         |      |          |         | demo-echo-echo-echo-80         |
|                 |              |         |      |          |         | /sample-route-1 ->             |
|                 |              |         |      |          |         | default-petstore-8080          |
+-----------------+--------------+---------+------+----------+---------+--------------------------------+

```

echo应用将收到的请求信息回显，可以看到echo应用收到的请求的uri为`/prefix/a`，而不是`echo`：

```sh
$ curl  http://10.10.173.203:31403/echo
Hostname: echo-7df87d5c6d-s4vhq

Pod Information:
    -no pod information available-

Server values:
    server_version=nginx: 1.13.3 - lua: 10008

Request Information:
    client_address=172.16.128.136
    method=GET
    real path=/prefix/a
    query=
    request_version=1.1
    request_uri=http://10.10.173.203:8080/prefix/a
...
```

**注意** 在添加路径的过程中遇到一个比较严重的问题：添加的转发信息没有被及时刷新到envoy中，将容器quay.io/solo-io/gloo-envoy-wrapper删除重建后，envoy中才有了相关配置，这个问题需要特别注意。

##### 函数转发

upstream default-petstore-8080 实现了四个函数，这些函数可能是应用的API接口也可能是函数服务，gloo 通过 [swagger](https://github.com/OAI/OpenAPI-Specification) 或者 [gRPC reflection](https://github.com/grpc/grpc-go/blob/master/Documentation/server-reflection-tutorial.md) 自动发现应用支持的函数：

```sh
$ glooctl get upstream default-petstore-8080
+-----------------------+------------+----------+-------------------------+
|       UPSTREAM        |    TYPE    |  STATUS  |         DETAILS         |
+-----------------------+------------+----------+-------------------------+
| default-petstore-8080 | Kubernetes | Accepted | svc name:      petstore |
|                       |            |          | svc namespace: default  |
|                       |            |          | port:          8080     |
|                       |            |          | REST service:           |
|                       |            |          | functions:              |
|                       |            |          | - addPet                |
|                       |            |          | - deletePet             |
|                       |            |          | - findPetById           |
|                       |            |          | - findPets              |
|                       |            |          |                         |
+-----------------------+------------+----------+-------------------------+
```


在 upstream 中找到 findPetById 的定义，这个函数用 GET 方法， uri 是 /api/pets/\{\{id}}，id 为输入参数：

{% raw %}
```sh
$ glooctl get  upstream  default-petstore-8080  -o yaml
          ...
          findPetById:
            body: {}
            headers:
              :method:
                text: GET
              :path:
                text: /api/pets/{{ default(id, "") }}
              content-length:
                text: "0"
              content-type: {}
              transfer-encoding: {}
           ...
```
{% endraw %}

1、配置一条路由，将请求转发给函数 findPetById，传入参数默认是 body 中的 json 字符串：

```sh
$ glooctl add route \
  --path-exact /petstore/findPet \
  --dest-name default-petstore-8080 \
  --rest-function-name findPetById
selected virtualservice default for route
+-----------------+--------------+---------+------+----------+---------+--------------------------------+
| VIRTUAL SERVICE | DISPLAY NAME | DOMAINS | SSL  |  STATUS  | PLUGINS |             ROUTES             |
+-----------------+--------------+---------+------+----------+---------+--------------------------------+
| default         |              | *       | none | Accepted |         | /petstore/findPet ->           |
|                 |              |         |      |          |         | default-petstore-8080          |
|                 |              |         |      |          |         | ...                            |
+-----------------+--------------+---------+------+----------+---------+--------------------------------+
```

通过gloo调用函数，body中包含json格式的传入参数，gloo将参数提取后转发fucntion：

```sh
$ curl  http://10.10.173.203:31403/petstore/findPet -d '{"id": 1}'
{"id":1,"name":"Dog","status":"available"}

$ curl  http://10.10.173.203:31403/petstore/findPet -d '{"id": 2}'
{"id":2,"name":"Cat","status":"pending"}
```

2、同样转发给函数  findPetById ，传入参数从uri中提取，--rest-parameters 指定提取方法：

```sh
$ glooctl add route \
  --path-prefix /petstore/findWithId/ \
  --dest-name default-petstore-8080 \
  --rest-function-name findPetById \
  --rest-parameters ':path=/petstore/findWithId/{id}'
```

这时可以用下面的方式调用：

```sh
$ curl  http://10.10.173.203:31403/petstore/findWithId/1
{"id":1,"name":"Dog","status":"available"}

$ curl  http://10.10.173.203:31403/petstore/findWithId/2
{"id":2,"name":"Cat","status":"pending"}
```

### 代理到集群外部

Gloo 自身定位是一个支持 kubernetes、aws、azure 等平台的独立网关，将请求代理到 kubernetes 集群外部不是问题。只需创建一个对应集群外部服务的 upstream：

```sh
$ glooctl create upstream static jsonplaceholder-80 --static-hosts jsonplaceholder.typicode.com:80
+--------------------+--------+---------+---------------------------------+
|      UPSTREAM      |  TYPE  | STATUS  |             DETAILS             |
+--------------------+--------+---------+---------------------------------+
| jsonplaceholder-80 | Static | Pending | hosts:                          |
|                    |        |         | -                               |
|                    |        |         | jsonplaceholder.typicode.com:80 |
|                    |        |         |                                 |
+--------------------+--------+---------+---------------------------------+
```

接下来的操作和上一节类似，创建指向该upstream的路由即可，例如：

```sh
$ glooctl add route \
  --dest-name jsonplaceholder-80 \
  --path-exact /api/posts \
  --prefix-rewrite /posts
```

### 其它高级功能

前面用 glooctl 创建的 virtual service 存放在 kubernetes 集群中，是一个类型为 `VirtualService` 的 CRD，包含很多配置项：

```sh
$ kubectl get virtualservices default --namespace gloo-system  -o yaml |less
apiVersion: gateway.solo.io/v1
kind: VirtualService
metadata:
  creationTimestamp: "2019-05-15T10:02:25Z"
  generation: 1
  name: default
  namespace: gloo-system
...
```

路由匹配规则见 [Advanced Route Matching ](https://gloo.solo.io/user_guides/advanced_routing/)、路由动作见 [Advanced Route Actions ](https://gloo.solo.io/user_guides/advanced_routing_action/)（可以为一组目标，设置不同的权重）。Gloo route 支持下列 [插件](https://gloo.solo.io/user_guides/advanced_route_plugins/)：transformations（内容修改）、faults（注入一定比例的错误返回，用于测试）、prefixRewrite（uri改写）、timeout（超时设置）、retries（重试次数）、extensions。

### 初步印象

Gloo 是一个值得跟进的项目，它的使用感受非常非常好，如果有能力和时间可以参与这个项目，美中不足的是一些高级功能只有企业版支持。

#### 好的方面

1. gloo的配套工具glooctl非常好用，用起来非常流畅，文档也非常好；
2. gloo的设计很先进，在网关的基本功能之外，设计了函数路由的功能，虽然函数路由本质上也是代理转发，但是gloo设计了自动发现以及灵活的参数提取方法，使函数转发的功能特别实用。如果在业务系统中得到普及这种做法，相信会带来极大的便利。（函数路由的本质是：代理转发+api管理）
3. gloo本身是一个很独立的系统，支持的平台比较多，能够很好的和其它平台上的服务融合到一起。

#### 不好的方面

1. 整体来说还处于比较早期的阶段，有待实践检验；
2. gloo支持的功能主要还是常规的网关功能，算不上丰富，缺少活跃的插件社区；
3. 认证、限速等功能目前只有企业版支持；
4. 社区后续的活跃度和发展情况难以估计。

