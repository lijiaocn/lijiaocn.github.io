---
layout: default
title: "API网关Kong学习笔记（五）：功能梳理和插件使用-安全插件使用"
author: 李佶澳
createdate: 2018/10/22 10:32:00
changedate: 2018/10/22 10:32:00
categories: 项目
tags: 视频教程 kong 
keywords: kong,apigateway,API网关
description: Kong的plugins中列出了Kong的社区版支持的一些插件，这里尝试使用一下其中的安全插件

---

* auto-gen TOC:
{:toc}

## 说明

这是[API网关Kong的学习笔记](https://www.lijiaocn.com/tags/class.html)中的一篇，使用过程中遇到的问题和解决方法记录在[API网关Kong的使用过程中遇到的问题以及解决方法](https://www.lijiaocn.com/%E9%97%AE%E9%A2%98/2018/09/30/kong-usage-problem-and-solution.html)。

[Kong的plugins](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#kong%E7%9A%84%E6%8F%92%E4%BB%B6)中列出了Kong的社区版支持的一些插件，这里尝试使用一下其中的认证插件：

	Bot Detection (机器人检测)
	CORS (跨域请求)
	IP Restriction (IP限制)

Kong-Ingress-Controller的版本是0.2.0，Kong的版本是0.14.1，是用下面的方式部署的：

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/kong-all-in-one.yaml

部署了一个[echo应用](https://github.com/introclass/kubernetes-yamls/blob/master/all-in-one/echo-all-in-one.yaml)：

	./kubectl.sh create -f https://raw.githubusercontent.com/introclass/kubernetes-yamls/master/all-in-one/echo-all-in-one.yaml

各个服务地址如下：

	$ ./kubectl.sh get svc  -o wide --all-namespaces
	NAMESPACE     NAME                      TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)                      AGE       SELECTOR
	default       kubernetes                ClusterIP   172.16.0.1       <none>        443/TCP                      11h       <none>
	demo-echo     echo                      NodePort    172.16.29.181    <none>        80:30136/TCP,22:31818/TCP    10h       app=echo
	kong          kong-dashboard            NodePort    172.16.108.196   <none>        80:30538/TCP                 10h       app=dashboard
	kong          kong-ingress-controller   NodePort    172.16.100.111   <none>        8001:30233/TCP               10h       app=ingress-kong
	kong          kong-proxy                NodePort    172.16.77.90     <none>        80:30198/TCP,443:32205/TCP   10h       app=kong
	kong          postgres                  ClusterIP   172.16.97.45     <none>        5432/TCP                     10h       app=postgres
	kube-system   kube-dns                  ClusterIP   172.16.0.2       <none>        53/UDP,53/TCP                10h       k8s-app=kube-dns

{% include kong_pages_list.md %}

## Bot Detection

[Kong Plugin: Bot Detection][2]用来保护Route和Service，屏蔽机器人访问，支持黑白名单，类型名为`bot-detection`。

Bot Detection只作用于Route和Service，因此直接创建KongPlugin，并绑定到Route或者Service即可，不需要创建KongConsumer。

创建KongPlugin：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: echo-bot-detection
	  namespace: demo-echo
	disabled: false  # optional
	plugin: bot-detection
	config:
	#  whitelist:    #黑白名单是一组用“,”间隔的正则表达式，匹配的是User-Agent
	   blacklist: curl/7.54.0

编辑Ingress：

	./kubectl.sh -n demo-echo edit ingress ingress-echo

添加Annotations，绑定bot-detection：

	metadata:
	  annotations:
	    plugins.konghq.com: echo-bot-detection

通过分析bot-detection插件的代码，[bot-detection插件的实现](https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/10/30/kong-features-04-plugins-implement.html#bot-detection%E6%8F%92%E4%BB%B6%E7%9A%84%E5%AE%9E%E7%8E%B0)，它的用途是检查http请求中的user agent，如果user agent在黑名单中，或者被判定为机器人且不在白名单中，则拒绝请求。

[Kong Plugin: Bot Detection Default Rules][3]中给出了机器人检测的规则，这些规则会被用来检查每一个请求。

上面的配置中将`curl/7.54.0`加入了黑名单，结果如下：

	$ curl 192.168.33.11:30198 -H "Host: echo.com"
	<html>
	<head><title>403 Forbidden</title></head>
	<body bgcolor="white">
	<center><h1>403 Forbidden</h1></center>
	<hr><center>openresty/1.13.6.2</center>
	</body>
	</html>

改一些User-Agent就可以了：

	$ curl  192.168.33.11:30198 -H "Host: echo.com" -H "User-Agent: chrome"
	Hostname: echo-676ff9c67f-444dg
	Pod Information:
		-no pod information available-

bot-detection只是很弱的防护，改一下User-Agent就可以绕过。

应该做一个人机检测的插件，通过返回验证码等方式，判断请求者是不是机器人。

## CORS

[Kong Plugin: CORS(Cross-origin resource sharing)][4]为Route和Server设置跨域请求策略，类型名为`cors`。

[CORS][5]是浏览器的安全策略，浏览器默认不允许跨域访问，以防止A网站在浏览器端获取到B网站的信息。

但是有时候，跨域访问又是需要的，譬如，同一家公司的多个相关服务使用了不同的域名，这时候可以通过在响应头中添加`Access-Crontrol-XXXX`等字段，告知浏览器该服务可以被哪些域名跨域访问。

Kong的CORS插件就是直接在响应头中添加配置的字段，创建KongPlugin如下：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: echo-cors
	  namespace: demo-echo
	disabled: false  # optional
	plugin: cors
	config:
	  origins: "*"        #用“,”间隔的一组域名或者PCRE正则，被添加到响应头的Access-Control-Allow-Origin字段
	  methods: GET,POST   #用“,”间隔的HTTP方法，被添加到响应头的Access-Control-Allow-Methods字段
	#  headers:         #Access-Control-Allow-Headers
	#  exposed_headers: #Access-Control-Expose-Headers
	#  credentials:     #Access-Control-Allow-Credentials
	#  max_age:         #how long the results of the preflight request can be cached, in seconds
	#  preflight_continue  # A boolean value that instructs the plugin to proxy the OPTIONS preflight request to the upstream service.

编辑Ingress：

	./kubectl.sh -n demo-echo edit ingress ingress-echo

添加Annotations，绑定echo-cors：

	metadata:
	  annotations:
	    plugins.konghq.com: echo-bot-detection,echo-cors

用`curl -v`打印出响应头，可以看到多了一个`Access-Control-Allow-Origin: *`：

	$ curl -v  192.168.33.11:30198 -H "Host: echo.com"
	
	* Rebuilt URL to: 192.168.33.11:30198/
	*   Trying 192.168.33.11...
	* TCP_NODELAY set
	* Connected to 192.168.33.11 (192.168.33.11) port 30198 (#0)
	> GET / HTTP/1.1
	> Host: echo.com
	> User-Agent: curl/7.54.0
	> Accept: */*
	>
	< HTTP/1.1 200 OK
	< Content-Type: text/plain; charset=UTF-8
	< Transfer-Encoding: chunked
	< Connection: keep-alive
	< Date: Sun, 21 Oct 2018 17:31:43 GMT
	< Server: echoserver
	< Access-Control-Allow-Origin: *
	< X-Kong-Upstream-Latency: 18
	< X-Kong-Proxy-Latency: 20
	< Via: kong/0.14.1

## IP Restriction

[Kong Plugin: IP Restriction][6]用来为Route和Service添加CIDR格式的IP黑白名单，可以绑定到Consumer，类型名为`ip-restriction`。

创建KongPlugin：

	apiVersion: configuration.konghq.com/v1
	kind: KongPlugin
	metadata:
	  name: echo-ip-restriction
	  namespace: demo-echo
	disabled: false  # optional
	plugin: ip-restriction
	config:
	#  whitelist:     #用“,”间隔的一组IP或者CIDR，要么白名单、要么黑名单
	  blacklist: 192.168.33.12,172.16.129.1

测试：

	$ curl  192.168.33.11:30198 -H "Host: echo.com"
	{"message":"Your IP address is not allowed"}

需要特别注意的是这里配置的IP需要是kong-proxy收到的请求报文的源IP。如果kong-proxy部署在kubernetes中，且通过NodePort方式暴露出来，kong-proxy看到的源IP可能是所在的node的虚IP，或者另一台node的IP。

例如kong-proxy容器是在192.168.33.11上运行的，通过192.168.33.11访问，看到源IP是192.168.33.11的虚拟IP

	//需要将上面的ip-restriction插件去掉
	$ curl  192.168.33.11:30198 -H "Host: echo.com" 2>/dev/null |grep x-real-ip=
		x-real-ip=172.16.129.1

通过192.168.33.12访问，看到的源IP则是192.168.33.12的node IP：

	//需要将上面的ip-restriction插件去掉
	$ curl  192.168.33.12:30198 -H "Host: echo.com" 2>/dev/null |grep x-real-ip=
		x-real-ip=192.168.33.12

注意，我这里使用的网络方案是kube-router，所以是这种情况，如果使用其他的网络方案，情况可能有所不同。

## 参考

1. [Kong的plugins][1]
2. [Kong Plugin: Bot Detection][2]
3. [Kong Plugin: Bot Detection Default Rules][3]
4. [Kong Plugin: CORS(Cross-origin resource sharing)][4]
5. [Wiki: Cross-origin resource sharing][5]
6. [Kong Plugin: IP Restriction][6]

[1]: https://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/09/29/nginx-openresty-kong.html#kong%E7%9A%84%E6%8F%92%E4%BB%B6 "Kong的Plugin"
[2]: https://docs.konghq.com/hub/kong-inc/bot-detection/ "Kong Plugin: Bot Detection"
[3]: https://github.com/Kong/kong/blob/master/kong/plugins/bot-detection/rules.lua "Kong Plugin: Bot Detection Default Rules"
[4]: https://docs.konghq.com/hub/kong-inc/cors/ "Kong Plugin: CORS(Cross-origin resource sharing)"
[5]: https://en.wikipedia.org/wiki/Cross-origin_resource_sharing "Wiki: Cross-origin resource sharing"
[6]: https://docs.konghq.com/hub/kong-inc/ip-restriction/ "Kong Plugin: IP Restriction"
