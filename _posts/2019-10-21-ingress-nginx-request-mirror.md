---
layout: default
title: "kubernetes ingress-nginx http 请求复制功能与 nginx mirror 的行为差异"
author: 李佶澳
date: "2019-10-21 16:41:31 +0800"
last_modified_at: "2023-06-21 17:01:12 +0800"
categories: 问题
cover:
tags: kubernetes gateway
keywords: ingress-nginx,请求复制,流量复制
description: ingress-nginx 的请求复制行为不是预期的行为，不方便应用，想办法让它与 nginx mirror 相同
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

Kubernetes 以及 ingress-nginx 的用法已经整理到 [小鸟笔记][2] 中，大量的操作方法和操作细节，以及用到的素材都在笔记中。对某一具体问题或功能的分析用这里的单篇文章记录。

Nginx 从 1.13.4 开始提供了 [ http 请求复制功能][3]，Ingress-nginx 也及时跟进提供了同样的功能，[Nginx 请求复制功能][3]。但是实际测试发现两者的行为不一致。

## （更正）更好的解决方法 2019-11-08 21:56:47

下面的方法走弯路了，只需要对接收复制流量的 ingress 做一次 rewrite 就可以了，如下：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    # 使用原始的 uri
    nginx.ingress.kubernetes.io/rewrite-target: $request_uri
  name: ingress-echo-with-mirror-backend
spec:
  rules:
  - host: mirror.echo.example
    http:
      paths:
      - path: /echo
        backend:
          serviceName: http-record
          servicePort: 80
```

具体效果见：[ingress-nginx 复制原始的 uri][5]

## nginx 与 ingress-ningx 请求复制的差异

采用 [nginx 的请求复制][3] 中的配置，请求是`原封不动`复制，接收端收到的请求从 uri 到 body 完全相同。

采用 [ingress-nginx 的请求复制功能][4] 中的配置，请求 `不是` 原封不动地转发过去的，uri 被改变，原始的 uri 记录在 header 头中。

例如，发起下面的请求：

```sh
$ curl -X POST -d "111111" -H "Host: mirror.echo.example" "192.168.99.100:30933/aaaaaa/bbbb?c=a"
```

复制后的请求如下，request uri 变成 `/echo?c=a`：

```json
{
    "RemoteAddr": "172.17.0.11:59784",
    "Method": "POST",
    "Host": "mirror.echo.example",
    "RequestURI": "/echo?c=a",
    "Header": {
        "Accept": [
            "*/*"
        ],
        "Content-Length": [
            "6"
        ],
        "Content-Type": [
            "application/x-www-form-urlencoded"
        ],
        "User-Agent": [
            "curl/7.54.0"
        ],
        "X-Forwarded-For": [
            "172.17.0.1"
        ],
        "X-Forwarded-Host": [
            "mirror.echo.example"
        ],
        "X-Forwarded-Port": [
            "80"
        ],
        "X-Forwarded-Proto": [
            "http"
        ],
        "X-Original-Uri": [
            "/aaaaaa/bbbb?c=a"
        ],
        "X-Real-Ip": [
            "172.17.0.1"
        ],
        "X-Request-Id": [
            "86e25adfcd7f2a673925d9a17769272a"
        ],
        "X-Scheme": [
            "http"
        ]
    },
    "Body": "1111"
```

ingress-nginx 的请求复制行为不是我们预期的行为，也不方便应用，需要想办法让它的行为与 nginx 相同。

## 差异原因分析

以 [ingress-nginx 的请求复制功能][4] 中的环境为例，mirror 的 uri 是 /echo

```conf
  annotations:
    nginx.ingress.kubernetes.io/mirror-uri: "/echo"
```

检查 ingress-nginx 生成的配置文件，发现在 location 中设置了变量 $location_path：

```conf
## start server mirror.echo.example
server {
    server_name mirror.echo.example ;
    ...
    location /echo {
        set $namespace      "demo-echo";
        set $ingress_name   "ingress-echo-with-mirror-backend";
        set $service_name   "http-record";
        set $service_port   "{0 80 }";
        set $location_path  "/echo";
        ... 省略 ...
    }

    location / {
        set $namespace      "demo-echo";
        set $ingress_name   "ingress-echo-with-mirror";
        set $service_name   "echo";
        set $service_port   "{0 80 }";
        set $location_path  "/";

        mirror /echo;
        mirror_request_body on;
        ... 省略 ...
}
```

$location_path 的值是 /echo，正好是 mirror 的 uri，不过这个变量不是 nginx 的内置变量，会不会是 ingress-nginx 中的 lua 变量用该变量改写了 request_uri？

...走弯路了...

## 修改 ingress-nginx 的模板文件

比对 ingress-nginx 的配置文件和 [nginx 请求复制功能][3] 中的配置文件，注意到两者的 proxy_pass 不同。

nginx 中：

```sh
proxy_pass http://http-record_upstream$request_uri;
```

ingress-nginx 生成的配置文件中配置如下:

```sh
proxy_pass http://upstream_balancer;
```

特别注意：上面的 ingress-nginx 的 proxy_pass 是在 go 代码中写死的，不在 nginx.tmpl 模板中。

```go
// internal/ingress/controller/tempalte/template.go: 522
func buildProxyPass(host string, b interface{}, loc interface{}) string {
    ...
    defProxyPass := fmt.Sprintf("%v %s%s;", proxyPass, proto, upstreamName)
    ...
}
```

简单修改一下：

```go
// internal/ingress/controller/tempalte/template.go: 522
func buildProxyPass(host string, b interface{}, loc interface{}) string {
    ...
    defProxyPass := fmt.Sprintf("%v %s%s;", proxyPass, proto, upstreamName)
    if proto == "http://" || proto == "https://" {
        defProxyPass = fmt.Sprintf("%v %s%s$request_uri;", proxyPass, proto, upstreamName)
    }
    ...
```

重新编译，打包镜像：

```sh
make build
make container
```

## 效果

测试一下，搞定！

```sh
/go/src/Server/echo.go:46: {
    "RemoteAddr": "172.17.0.27:36124",
    "Method": "GET",
    "Host": "mirror.echo.example",
    "RequestURI": "/adba?abcdd",     # 接收端收到的 uri
```

## 参考

1. [李佶澳的博客][1]
2. [ingress-nginx 的使用方法][2]
3. [Nginx 请求复制功能][3]
4. [Ingress-nginx 的请求复制功能][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/ "ingress-nginx 的使用方法"
[3]: https://www.lijiaocn.com/soft/nginx/mirror.html "Nginx 请求复制功能"
[4]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/mirror.html "Ingress-nginx 的请求复制功能"
[5]: https://www.lijiaocn.com/k8s/ingress-nginx/mirror.html#%E5%A4%8D%E5%88%B6%E5%8E%9F%E5%A7%8B%E7%9A%84-uri  "复制原始的 uri"
