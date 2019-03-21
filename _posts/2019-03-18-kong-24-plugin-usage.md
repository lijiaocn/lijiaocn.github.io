---
layout: default
title: "API网关Kong学习笔记（二十四）：在kubernetes中启用kong的插件"
author: 李佶澳
createdate: "2019-03-18 17:23:38 +0800"
changedate: "2019-03-21 16:48:03 +0800"
categories: 项目
tags: kong 视频教程
keywords: kong,kong 1.0.3,kong插件,kubernetes中使用kong,代码学习
description: 在kubernetes中启用kong插件，创建kongplugins，绑定到service或router
---

* auto-gen TOC:
{:toc}

## 说明

之前整理过[插件][3]的用法：[基本使用方法](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-00-basic.html)、[认证插件](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-01-auth.html)、[安全插件](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/30/kong-features-02-security.html)。这里试验一下其它的插件。

注意这里使用的kong是1.0.3，之前使用的是0.14.1，有些插件的配置发生了变化，例如IP黑白名单插件`ip-restriction`中的IP列表，以前是用“,”间隔的字符串，现在是数组。

插件的启用方法和作用范围没有变，[Kong Custom Resource Definitions][1]:

1. 全局插件，global: "true"，设置为启用后，对所有请求进行处理；

2. 局部插件，global: "false"，设置为启用后，在ingress中用annotations绑定；

3. 全局插件可以在任意namespace中创建，为了管理方便建议和kong-ingress-controller放在同一个namespace中，局部插件需要和用到它的ingress或者service在同一个namespaces中;

4. `局部插件覆盖全局插件`。

{% include kong_pages_list.md %}

## 日志插件

[file-log](https://docs.konghq.com/hub/kong-inc/file-log/)，在kubernetes中创建KongPlugin：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-file-log
  namespace: demo-echo
  labels:
    global: "false"
disabled: false  # optional
plugin: file-log
config:
  path: /tmp/req.log
  reopen: true
```

```bash
$ ./kubectl.sh -n demo-echo get kp -o wide
NAME                  PLUGIN-TYPE      AGE   DISABLED   CONFIG
echo-file-log         file-log         1m    false      map[path:/tmp/req.log reopen:true]
```

在ingress中设置绑定：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    plugins.konghq.com: echo-file-log
  ...
```

发起请求后，可以带对应的kong中看到日志：

```bash
sh-4.2# ls /tmp/
ks-script-h2MyUP  req.log  yum.log
sh-4.2# cat /tmp/req.log
{"latencies":{"request":8,"kong":6,"proxy":2},"service":{"host":"demo-echo.echo.80","created_at"
:1552460203,"connect_timeout":60000,....
```

日志格式见[kong plugin: file-log][2]。

## 关联ID

[correlation-id](https://docs.konghq.com/hub/kong-inc/correlation-id/)，在kubernetes中创建KongPlugin：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-correlation-id
  namespace: demo-echo
  labels:
    global: "false"
disabled: false  # optional
plugin: correlation-id
config:
  header_name: kong-correlation-id
  generator: uuid
  echo_downstream: true
```

```bash
$ ./kubectl.sh -n demo-echo get kp -o wide
echo-correlation-id   correlation-id   22s   false      map[echo_downstream:true generator:uuid#counter header_name:kong-correlation-id]
```

在ingress中设置绑定：

```
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    plugins.konghq.com: echo-correlation-id
````

发起请求，可以看到请求头增加了一个关联ID：

```
$ curl   -H "host: echo.com"  -H "User-Agent: curl/7.54.1"  10.10.64.58:8000
...
Request Headers:
	accept=*/*
	connection=keep-alive
	host=172.16.129.47:8080
	kong-correlation-id=1d1a97d3-13af-4ec0-8462-f63757c8ec00
	user-agent=curl/7.54.1
	x-forwarded-for=10.255.3.1
	x-forwarded-host=echo.com
	x-forwarded-port=8000
	x-forwarded-proto=http
	x-real-ip=10.255.3.1
...
```

## 监控数据

[prometheus](https://docs.konghq.com/hub/kong-inc/prometheus/)，在kubernetes中创建KongPlugin：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-prometheus
  namespace: demo-echo
  labels:
    global: "false"
disabled: false  # optional
plugin: prometheus
```

```bash
$ ./kubectl.sh -n demo-echo get kp -o wide
echo-prometheus       prometheus       4s    false
```

在ingress中设置绑定：

```
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    plugins.konghq.com: echo-prometheus
````

然后访问kong的admin接口`IP:admin端口/metrics`，注意必须是用admin端口，并且只能获取经过当前的kong处理的请求的数据。

在部署的时候，一般是把kong的管理平面和数据平面严格分开：管理平面的kong只开启管理端口，不处理数据请求；数据平面的kong只开放数据端口，admin端口不开启。
但这样就无妨从数据平面获取prometheus格式的监控数据，可以在数据平面的kong的配置文件`nginx-kong.conf`中添加下面代码，暴露一个专门提供监控数据的端口：

```conf
server {
    server_name kong_prometheus_exporter;
    listen 0.0.0.0:9542; # can be any other port as well

    location / {
        default_type text/plain;
        content_by_lua_block {
            local serve = require "kong.plugins.prometheus.serve"
            serve.prometheus_server()
        }
    }
}
```

也可以加载[nginx模板](https://docs.konghq.com/1.0.x/configuration/#custom-nginx-templates)中，默认的template是[kong/templates](https://github.com/Kong/kong/tree/master/kong/templates)中的`nginx.lua`和`nginx_kong.lua`，直接修改这两个文件也是比较方便的做法。

然后直接访问数据平面的"IP:9542/metrics"：

```
$ curl 127.0.0.1:9542/metrics
# HELP kong_bandwidth Total bandwidth in bytes consumed per service in Kong
# TYPE kong_bandwidth counter
kong_bandwidth{type="egress",service="demo-echo.echo.80"} 923
kong_bandwidth{type="ingress",service="demo-echo.echo.80"} 71
# HELP kong_datastore_reachable Datastore reachable from Kong, 0 is unreachable
# TYPE kong_datastore_reachable gauge
kong_datastore_reachable 1
# HELP kong_http_status HTTP status codes per service in Kong
# TYPE kong_http_status counter
kong_http_status{code="200",service="demo-echo.echo.80"} 1
# HELP kong_latency Latency added by Kong, total request time and upstream latency for each service in Kong
# TYPE kong_latency histogram
kong_latency_bucket{type="kong",service="demo-echo.echo.80",le="00025.0"} 1
kong_latency_bucket{type="kong",service="demo-echo.echo.80",le="00030.0"} 1
kong_latency_bucket{type="kong",service="demo-echo.echo.80",le="00040.0"} 1
kong_latency_bucket{type="kong",service="demo-echo.echo.80",le="00050.0"} 1
kong_latency_bucket{type="kong",service="demo-echo.echo.80",le="00060.0"} 1
kong_latency_bucket{type="kong",service="demo-echo.echo.80",le="00070.0"} 1
...
```

如果出错在error.log中有下日志：

```
2019/03/19 15:27:48 [error] 1217#1217: *100 lua entry thread aborted: runtime error: /usr/share/lua/5.1/kong/plugins/prometheus/serve.lua:3: module 'kong.tools.responses' not found:No LuaRocks module found for kong.tools.responses
no field package.preload['kong.tools.responses']
no file '/usr/lib64/lua/5.1/kong/tools/responses.lua'
no file '/usr/lib64/lua/5.1/kong/tools/responses/init.lua'
...
```

可能是因为系统上安装的kong-plugin-promethues版本太旧，依赖版本在kong1.0.3的kong-1.0.3-0.rockspec文件中设置，修改一些版本譬如0.3.2然后重新安装`make install`:

```
"kong-prometheus-plugin ~> 0.3",
```

>我遇到了系统上kong-plugin-promethues代码和kong不匹配的问题，但是把kong-prometheus-plugin调整到0.3.2，重新安装之后在改回0.3，并将插件删除重新安装后，发现安装的代码是匹配的，问题没有复现，比较蹊跷。

## IP黑白名单

[IP Restriction](https://docs.konghq.com/hub/kong-inc/ip-restriction/)

从echo服务的返回内容中找到kong看到的客户端IP`10.255.3.1`：

```bash
$ curl   -H "host: echo.com"  -H "User-Agent: curl/7.54.1"  10.10.64.58:8000/

Request Headers:
	accept=*/*
	connection=keep-alive
	host=172.16.129.47:8080
	kong-correlation-id=eb885d41-dc67-4169-a3c4-6f27f4207d90#2
	user-agent=curl/7.54.1
	x-forwarded-for=10.255.3.1
	x-forwarded-host=echo.com
	x-forwarded-port=8000
	x-forwarded-proto=http
	x-real-ip=10.255.3.1
```
在kubernetes中创建KongPlugin：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-ip-restriction
  namespace: demo-echo
disabled: false  # optional
plugin: ip-restriction
config:
#   whitelist:     # 黑名单和白名单只能选一
  blacklist: [1.1.1.1,10.255.3.1]
```

```bash
$ ./kubectl.sh -n demo-echo get kp -o wide
echo-ip-restriction   ip-restriction   4d    false      map[blacklist:[1.1.1.1 10.255.3.1]]
```

在ingress中设置绑定：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    plugins.konghq.com: echo-ip-restriction
...
```

这时候再访问，发现被禁止访问：

```bash
$ curl   -H "host: echo.com"  -H "User-Agent: curl/7.54.1"  10.10.64.58:8000/
{"message":"Your IP address is not allowed"}%
```

## 请求速率限制 

[rate-limiting](https://docs.konghq.com/hub/kong-inc/rate-limiting/)，在kubernetes中创建KongPlugin：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-req-rate-limit
  namespace: demo-echo
  labels:
    global: "false"
disabled: false  # optional
plugin: rate-limiting
config:
  second: 1
  limit_by: ip
  policy: local  #local,cluster,redis
```

```bash
$ ./kubectl.sh -n demo-echo get kp -o wide
echo-req-rate-limit   rate-limiting    8s    false      map[limit_by:ip policy:local second:1]
```

在ingress中设置绑定：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    plugins.konghq.com: echo-req-rate-limit
...
```

这时候频繁发起请求会发现，超过速率限制后，被限制访问：

```
$ curl -v  -H "host: echo.com"  -H "User-Agent: curl/7.54.1"  10.10.64.58:8000/
*   Trying 10.10.64.58...
* TCP_NODELAY set
* Connected to 10.10.64.58 (10.10.64.58) port 8000 (#0)
> GET / HTTP/1.1
> host: echo.com
> Accept: */*
> User-Agent: curl/7.54.1
>
< HTTP/1.1 429 Too Many Requests
< Date: Tue, 19 Mar 2019 09:19:41 GMT
< Content-Type: application/json; charset=utf-8
< Connection: keep-alive
< Content-Length: 37
< X-RateLimit-Remaining-second: 0
< X-RateLimit-Limit-second: 1
< Server: kong/1.0.3
<
* Connection #0 to host 10.10.64.58 left intact
{"message":"API rate limit exceeded"}%
```

## 调用链路跟踪

部署一个单机版的[Zipkin](https://zipkin.io/pages/quickstart)：

	docker run -d -p 9411:9411 openzipkin/zipkin

在浏览器用地址`http://IP:9411/zipkin/`查看zipkin中的数据。

[Zipkin](https://docs.konghq.com/hub/kong-inc/zipkin/)，在kubernetes中创建KongPlugin：

```yaml
apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: echo-http-zipkin-trace
  namespace: demo-echo
  labels:
    global: "false"
enabled: true  # optional
plugin: zipkin
config:
  http_endpoint: "http://10.10.173.203:9411/api/v2/spans"
  sample_ratio: 1  # 不带tracid的请求的采样比率，1是100%，全部采集
```

```bash
$ ./kubectl.sh -n demo-echo get kp -o wide
echo-http-zipkin-trace   zipkin   8s   map[http_endpoint:http://10.10.173.203:9411/api/v2/spans sample_ratio:1]
```

在ingress中设置绑定：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    plugins.konghq.com: echo-http-zipkin-trace
...
```

这时候发起请求，会发现kong在请求头中打上了tarceid和spanid，x-b3-parentspanid、x-b3-spanid、x-b3-traceid、x-b3-sampled：

```
$ curl -H "host: echo.com"  -H "User-Agent: curl/7.54.1"  10.10.64.58:8000/ddddddd
...
Request Headers:
	accept=*/*
	connection=keep-alive
	host=172.16.129.47:8080
	kong-correlation-id=4f34701a-fb47-4ee1-8884-657130b4353a#10
	user-agent=curl/7.54.1
	x-b3-parentspanid=e357326aaa445213
	x-b3-sampled=0
	x-b3-spanid=98cffa4b4f60b8c5
	x-b3-traceid=ddda77bee1ef08eb686ca5006aa8b3a0
	x-forwarded-for=10.255.3.1
	x-forwarded-host=echo.com
	x-forwarded-port=8000
	x-forwarded-proto=http
	x-real-ip=10.255.3.1
...
```

这里直接用curl发起的请求是没有自带traceID的，kong在转发的请求的时候会设置traceID。因为对于这种不带traceID的请求，前面配置的采样比是1，所以每个请求的信息都被发送到了zipkin。

在zipkin中能看到下面的信息：

![用zipkin查看kong的调用链延迟信息]({{ site.imglocal}}/kong/kong-zipkin.png)

## 参考

1. [Kong Custom Resource Definitions][1]
2. [kong plugin: file-log][2]
3. [kong plugins][3]

[1]: https://github.com/Kong/kubernetes-ingress-controller/blob/master/docs/custom-resources.md "Custom Resource Definitions"
[2]: https://docs.konghq.com/hub/kong-inc/file-log/ "kong plugin: file-log"
[3]: https://docs.konghq.com/hub/ "kong plugins"
