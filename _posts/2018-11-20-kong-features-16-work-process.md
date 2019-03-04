---
layout: default
title: "API网关Kong学习笔记（十六）：Kong转发请求的工作过程"
author: 李佶澳
createdate: "2018-11-20 17:08:27 +0800"
changedate: "2019-03-04 14:36:35 +0800"
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关
description: 刚刚才发现kong的网页上有一篇文档非常详细的介绍了kong转发请求的过程
---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的学习笔记](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

刚刚(2018-11-20 17:11:36)才发现kong的网页上有一篇文档非常详细的介绍了kong转发请求的过程：[Kong: Proxy Reference][1]。

**相关笔记**，这些笔记是学习过程做的记录，写的比较仓促，有疑惑的地方以Kong官方文档为准：

[《API网关Kong学习笔记（零）：使用过程中遇到的问题以及解决方法》](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/29/kong-usage-problem-and-solution.html)

[《API网关Kong学习笔记（一）：Nginx、OpenResty和Kong的基本概念与使用方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html)

[《API网关Kong学习笔记（二）：Kong与Kubernetes集成的方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/integrate-kubernetes-with-kong.html)

[《API网关Kong学习笔记（三）：功能梳理和插件使用-基本使用过程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-00-basic.html)

[《API网关Kong学习笔记（四）：功能梳理和插件使用-认证插件使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-01-auth.html)

[《API网关Kong学习笔记（五）：功能梳理和插件使用-安全插件使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-02-security.html)

[《API网关Kong学习笔记（六）：Kong数据平面的事件、初始化与插件加载》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-03-data-plane-implement.html)

[《API网关Kong学习笔记（七）：Kong数据平面Plugin的调用与实现》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html)

[《API网关Kong学习笔记（八）：Kong Ingress Controller的实现》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/02/kong-features-05-ingress-controller-analysis.html)

[《API网关Kong学习笔记（九）：Kong对WebSocket的支持》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/06/kong-features-06-websocket.html)

[《API网关Kong学习笔记（十）：Kong在生产环境中的部署与性能测试方法》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/08/kong-features-06-production-and-benchmark.html)

[《API网关Kong学习笔记（十一）：自己动手写一个插件》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/09/kong-features-07-write-plugins.html)

[《API网关Kong学习笔记（十二）：插件的目录中schema分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-08-plugin-schema.html)

[《API网关Kong学习笔记（十三）：向数据库中插入记录的过程分析》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/16/kong-features-09-database-insert.html)

[《API网关Kong学习笔记（十四）：Kong的Admin API概览和使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/19/kong-features-10-apis.html)

[《API网关Kong学习笔记（十五）：KongIngress的定义细节》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-11-kong-ingress-definition.html)

[《API网关Kong学习笔记（十六）：Kong转发请求的工作过程》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/20/kong-features-16-work-process.html)

[《API网关Kong学习笔记（十七）：Kong Ingress Controller的使用》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/21/kong-features-17-kong-ingress-controller-run.html)

[《API网关Kong学习笔记（十八）：Kong Ingress Controller的CRD详细说明》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/11/30/kong-features-18-kong-ingress-controller-crd.html)

[《API网关Kong学习笔记（十九）：Kong的性能测试（与Nginx对比）》](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/12/03/kong-features-19-kong-performance.html)

## 需要考虑的一些问题

### 怎样设置会话粘连？

可以通过哈希设置，比如说按照consumer、ip、header、cookie中的一个进行hash，使得有相同的特征的请求被同一个后端服务处理。

在[upstream](https://docs.konghq.com/0.14.x/admin-api/#upstream-objects)中设置。

## 从 Route 到 Service

[Route](https://docs.konghq.com/0.14.x/admin-api/#route-object)是kong的代理规则，定义了哪些请求代理给哪些service，以请求的方法、host、路径等作为转发依据，见[Route的配置](https://docs.konghq.com/0.14.x/admin-api/#request-body-3)。

Route与Service是多对一的关系，多个Route可以对应一个Service，每个Route中定义一种类型的Path。

Route中host匹配的是请求中的host，可以使用通配符`*`，但只能使用一个，可以是前匹配或者后匹配：

	{
	    "hosts": ["*.example.com", "service.com"]
	}

Route将请求代理给Service时，默认将请求头中的host修改为Route中配置的host，如果不希望这样，可以设置`preserve_host`，使用原始请求头中的host。

Route的path可以是正则表达式，正则表达式的优先级低于非正则表达式描述的path。如果同一个url能匹配多个path，`非正则表达式描述的path`选用最长匹配，并且优先级高于正则表达式，`正则表达式描述的path`需要明确设置优先级`regex_priority`，按照设置的优先级选择。

正则语法为[PCRE](http://pcre.org/)，并且使用正则表达式描述的path支持捕获，捕获的数据位于`ngx.ctx.route_matches`中，可以在代码中获取：

```lua
--/version/(?<version>\d+)/users/(?<user>\S+)
--/version/1/users/john
local route_matches = ngx.ctx.route_matches

-- route_matches.uri_captures is:
-- { "1", "john", version = "1", user = "john" }
```

从Route将请求转发给Service时，默认使用原始的path，不做更改，如果设置了`strip_path`，会将path修改，去掉匹配的部分。

Route中的匹配条件有`host`、`path`、`method`三个，条件越多的Route的优先级越高。可以创建一个优先级最低的Route作为最后的“兜底”Route：

	{
	    "paths": ["/"],
	    "service": {
	        "id": "..."
	    }
	}

## 从 Service 到 Upstream

每个[Service](https://docs.konghq.com/0.14.x/proxy/#reminder-how-to-configure-a-service)对应一个upstream，service中配置了对应的upstream的host、port、path等，也就是upstream的地址，以及相关的访问参数，见[Service的定义](https://docs.konghq.com/0.14.x/admin-api/#request-body)。

>Service中的Host可以不是Upstream的名字，可以是一个外部的域名，这样请求直接被转发给外部。

[Upstream](https://docs.konghq.com/0.14.x/admin-api/#upstream-objects)就是隐藏在kong后面的服务，它的`name`就是Service中的`host`，upstream中配置的是负载均衡算法，以及健康检查等，这些配置针对的是upstream关联的[Target](https://docs.konghq.com/0.14.x/admin-api/#target-object)。

代理请求的时候有一些参数设置，例如下面的默认超时时间：

	upstream_connect_timeout    默认60000毫秒
	upstream_send_timeout       默认60000毫秒
	upstream_read_timeout       默认60000毫秒

这些参数都是在[Service](https://docs.konghq.com/0.14.x/admin-api/#service-object)中配置的，除了超时时间，还有重试次数等。

将请求转发给Upstream的时候使用HTTP/1.1，并且会请求头中设置下面的字段：

	Host: <your_upstream_host>
	Connection: keep-alive
	X-Forwarded-For: <address>
	X-Forwarded-Proto: <protocol>
	X-Forwarded-Host: <host>
	X-Forwarded-Port: <port>

如果是websocket请求，kong会设置下面的请求头，升级为websocket连接：

	Connection: Upgrade
	Upgrade: websocket

将Upstream的响应返回的时候，会在响应头中设置字段：

	Via: kong/x.x.x
	X-Kong-Proxy-Latency: <latency>
	X-Kong-Upstream-Latency: <latency>

## 从 Upstream 到 Target

对请求进行代理的时候，主要有两项处理，一是进行负载均衡，二是调用插件进行处理。

一个Upstream可以包含多个Target，负载均衡的过程，就是为当前的请求选择一个Target的过程。

[Target](https://docs.konghq.com/0.14.x/admin-api/#target-object)是IP或者host加端口，是提供服务的最小单位，每个target可以设置不同的权重：

```json
{
    "target": "1.2.3.4:80",
    "weight": 15,
    "upstream_id": "ee3310c1-6789-40ac-9386-f79c0cb58432"
}
```

第一种负载均衡方式是通过DNS进行负载均衡，这是Service中直接配置的是外部服务的域名或者IP，而不是Upstream的name的时候，可以采用的方法。

这种方式其实是把负载均衡放在kong外部做的，kong只需要把请求转发给对应域名，具体的负载均衡方法在DNS中设置，涉及不到Upstream和Target，kong的[文档中](https://docs.konghq.com/0.14.x/loadbalancing/#dns-based-loadbalancing)把这也算作一种kong的负载均衡方法。

第二种方式是`Ring-balancer`，这种方式是kong管理的，kong相当于一个服务注册中心，负责动态增删后端服务（也就是Target），以及平衡负载，这种方式通过`upstream`和`target`设置。

Upstream是对多个target封装，多个target封装成一个虚拟的host，这个虚拟的host就是upstream的name，被用在Service的host中。

每个upstream中有一个预先设置好的slot数量，upstream中的多个target按照各自的权重分到slot中的一块，slot需要是预计的target数量的100倍。

Target可以通过admin api进行增加、删除，变更target的开销很小，upstream变更的开销比较大，因为涉及到slot的重新分配。

Target的权重设置为0，target将不被选用。

[Upstream的api](https://docs.konghq.com/0.14.x/admin-api/#upstream-objects)

[Target的api](https://docs.konghq.com/0.14.x/admin-api/#target-object)

负载均衡算法默认是带有权重的轮询（weighted-round-robin ），除此之外还可使用hash的方式，hash的输入可以是：none（不使用hash的方式）, consumer, ip, header, cookie。

使用hash方式的时候，要注意，第一，target地址要使用IP，不能是域名，域名解析会带来开销，而且有些域名服务器不会返回所有可用IP，第二，选择的hash输入要是足够变化多端的，使hash的输出要足够分散。

负载均衡的细节参考[Loadbalancing reference](https://docs.konghq.com/0.14.x/loadbalancing/)。

### 蓝绿部署

蓝绿的切换只需要修改service关联的upstream即可，一个“蓝色”的upstream，一个“绿色”的upstream，蓝绿切换的时候，两个upstream使用不同的名字和不同的target。

蓝绿切换的时候直接修改service中的host即可。

### 金丝雀部署

金丝雀部署通过修改target的权重即可实现，target的权重设置为零，则不被使用，权重越高分担的流量越高。

## Target的健康检查

Target的健康检查是一个有坑的地方，[Health Checks and Circuit Breakers][2]中有具体描述。

健康检查在Upstream中配置，有主动(active)和被动(passive)两种方式。

主动方式是按照配置的，定时访问Target，判断Target是否存货。Paasive的方式被动响应结果，如果发现失败的响应，则将对应的Target标记为失败。

第一个坑是，健康检查需要配置，如果不配置，默认就没有健康检查。

第二个坑是，如果只使用被动的方式，当一个Target被认为失败后，就会一直被认为失败，修复以后，必须手动发起一次访问，才能将其重新加载负载均衡列表中：

	$ curl -i -X POST http://localhost:8001/upstreams/my_upstream/targets/10.1.2.3:1234/healthy
	HTTP/1.1 204 No Content

一定要配置健康检查，并且最好使用主动的方式。

## SSL配置

首先要创建certificates对象，certificate包含证书和私钥，以及snis，snis指定了证书绑定的host。

	$ curl -i -X POST http://localhost:8001/certificates \
	    -F "cert=@/path/to/cert.pem" \
	    -F "key=@/path/to/cert.key" \
	    -F "snis=ssl-example.com,other-ssl-example.com"
	HTTP/1.1 201 Created
	...

使用了snis中的host的route，可以通过https协议访问。

可以在route中配置接受的协议类型，如果只配置了http，那么http和https协议都接受，如果只配置了https，只接受https协议：

	{
	    "hosts": ["..."],
	    "paths": ["..."],
	    "methods": ["..."],
	    "protocols": ["http", "https"],
	    "service": {
	        "id": "..."
	    }
	}

## 参考

1. [Kong: Proxy Reference][1]
2. [Health Checks and Circuit Breakers][2]

[1]: https://docs.konghq.com/0.14.x/proxy/ "Kong: Proxy Reference"
[2]: https://docs.konghq.com/0.14.x/health-checks-circuit-breakers/ "Health Checks and Circuit Breakers"
