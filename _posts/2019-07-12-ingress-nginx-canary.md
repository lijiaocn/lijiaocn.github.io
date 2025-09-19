---
layout: default
title: "kubernetes ingress-nginx 的金丝雀（canary）/灰度发布功能的使用方法"
author: 李佶澳
createdate: "2019-07-12 18:00:45 +0800"
last_modified_at: "2019-10-28 17:21:48 +0800"
categories: 项目
tags: kubernetes
cover:
keywords: kubernetes,ingress-nginx,canary,金丝雀
description: "ingress-nginx 从 0.21.0 开始支持金丝雀（canary）模式，只需要额外创建一个Canary Ingress"
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

下面使用的 [ingress-nginx][2]  的版本是 [0.25.0](https://github.com/kubernetes/ingress-nginx/releases)。

## 尝试使用相同的 PATH

阿里云提供了一种[添加重复路径](https://yq.aliyun.com/articles/594019)的方法，应该是阿里云自己的实现，不是 ingress-nginx 的特性，这里试验一下。
配置两个 path 相同，backend 不同的规则，看看会遇到什么情况： 

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/upstream-fail-timeout: "10"
    nginx.ingress.kubernetes.io/upstream-max-fails: "2"
  creationTimestamp: 2018-08-23T08:15:19Z
  generation: 2
  name: demo-echo-ingress
  namespace: demo-echo
spec:
  rules:
  - host: demo.echo.test
    http:
      paths:
      - path: /abc
        backend:
          serviceName: webshell
          servicePort: 80
      - path: /abc
        backend:
          serviceName: echo
          servicePort: 80
```

访问 '/abc'，发现一直在访问同一个 backend，如果 path 重复，其中一个会被覆盖。

## 使用 canary ingress

ingress-nginx 从 0.21.0 开始支持金丝雀（canary）模式，对应的 merge 是 [3341](https://github.com/kubernetes/ingress-nginx/pull/3341)。
[Canary deploys with ingress-nginx][4] 介绍了用法。

首先创建一个普通的 ingress A 指向 Service A：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/upstream-fail-timeout: "10"
    nginx.ingress.kubernetes.io/upstream-max-fails: "2"
  name: demo-echo-ingress
  namespace: demo-echo
spec:
  rules:
  - host: demo.echo.test
    http:
      paths:
      - path: /
        backend:
          serviceName: webshell
          servicePort: 80
```

然后创建一个设置了相同 host 和 path 的 ingress B，Ingress B 指向了另一个服务 Service B，并且在 annotations 中注明这是一个 canary ingress：

```yaml
apiVersion: extensions/v1beta1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-by-header: "version"
    nginx.ingress.kubernetes.io/canary-by-header-value: "canary"
    nginx.ingress.kubernetes.io/canary-by-cookie: "canary-cookie"
    nginx.ingress.kubernetes.io/canary-weight: "50"
    nginx.ingress.kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/upstream-fail-timeout: "10"
    nginx.ingress.kubernetes.io/upstream-max-fails: "2"
  name: demo-echo-ingress-canary
  namespace: demo-echo
spec:
  rules:
  - host: demo.echo.test
    http:
      paths:
      - path: /
        backend:
          serviceName: echo
          servicePort: 80
```

带有 "version: canary" 头的请求都被发送到 canary 版本：

```sh
curl -H "version: canary" -H "Host: demo.echo.test" 10.10.64.58
```

相关参数为：

```sh
nginx.ingress.kubernetes.io/canary-by-header: "version"
nginx.ingress.kubernetes.io/canary-by-header-value: "canary"
```

不带有 "version: canary" 头的请求一半被转发给 canary 版本，相关参数为：

```sh
nginx.ingress.kubernetes.io/canary-weight: "50"
```

还支持按照 cookie 选择，cookie 的值为 `always` 或者 `never`，前者转发给 canary，后者不转发，指定 cookie 名称的参数为 ：

```sh
nginx.ingress.kubernetes.io/canary-by-cookie: "canary-cookie"
```

```sh
curl -v  -b canary-cookie=always demo.echo.test   # 访问金丝雀版本
curl -v  -b canary-cookie=never demo.echo.test    # 访问非金丝雀版本
```

header、cookie、weight 的作用顺序是：canary-by-header -> canary-by-cookie -> canary-weight。

## 参考

1. [李佶澳的博客笔记][1]
2. [kubernetes/ingress-nginx][2]
3. [ingress-nginx canary][3]
4. [Canary deploys with ingress-nginx][4]

[1]: https://www.lijiaocn.com "李佶澳的博客笔记"
[2]: https://kubernetes.github.io/ingress-nginx/ "kubernetes/ingress-nginx"
[3]: https://kubernetes.github.io/ingress-nginx/user-guide/nginx-configuration/annotations/#canary "ingress-nginx canary"
[4]: https://docs.google.com/document/d/1qKTyLBLuKIYE6d6BsFXRM7zYB-2MUk6qJjtBL1KCz78/edit#heading=h.x7809bn5opjd "Canary deploys with ingress-nginx"
