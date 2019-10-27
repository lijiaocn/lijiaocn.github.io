---
layout: default
title: "ingress-nginx 启用 tls 加密，配置了不存在的证书，导致 unable to get local issuer certificate"
author: 李佶澳
date: "2019-10-12 11:27:53 +0800"
last_modified_at: "2019-10-12 14:36:07 +0800"
categories: 问题
cover:
tags:  kubernetes_problem 
keywords: kubernetes,ingress-nginx,tls,certificate
description: 一个特别低级的错误，浪费了我很多时间，找出原因后，哭笑不得，ingress 指向了一个不存在的证书

---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

一个特别低级的错误，浪费了我很多时间，找出原因后，哭笑不得。

在执行 [ingress-nginx 的认证功能使用示例][2] 中的操作时遇到的问题。

## 现象

用 curl 访问一个用自制 ca 签署的证书的网址，curl 提示找不到 ca，即使用 --cacert 指定了也不行：

```sh
$ curl  --cacert  ca.crt  -H "Host: auth-cert.echo.example" https://192.168.99.100:30358/
curl: (60) SSL certificate problem: unable to get local issuer certificate
More details here: https://curl.haxx.se/docs/sslcerts.html

curl performs SSL certificate verification by default, using a "bundle"
 of Certificate Authority (CA) public keys (CA certs). If the default
 bundle file isn't adequate, you can specify an alternate file
 using the --cacert option.
If this HTTPS server uses a certificate signed by a CA represented in
 the bundle, the certificate verification probably failed due to a
 problem with the certificate (it might be expired, or the name might
 not match the domain name in the URL).
If you'd like to turn off curl's verification of the certificate, use
 the -k (or --insecure) option.
HTTPS-proxy has similar options --proxy-cacert and --proxy-insecure.
```

## 调查

先用 openssl 验证 ca.crt 和 server.crt，自签署的 ca.crt  和被签署的 server.crt 都没有问题。

```sh
$ openssl verify -CAfile ca.crt ca.crt
ca.crt: OK

$ openssl verify -CAfile ca.crt server.crt
server.crt: OK
```

用 Google 搜索，有好多人说这是因为 macOS 上的 curl 会使用 keychain（钥匙串） 中的证书，建议安装 gnu 版本的 curl 等等。
被这些回答带到沟里了，安装 gnu curl 后还是不行，把自签署的 ca.crt 加入 keychain 后，还是不行。最后干脆在 centos 系统上试了一下，同样的问题！

后来用 chrome 打开网址，查看证书详情，发现服务端证书不是指定域名的证书，而是 ingress-nginx 的一个 fake 证书（Kubernetes Ingress Controller Fake Certificate）：

![Kubernetes Ingress Controller Fake Certificate]({{ site.imglocal }}/article/ingress-nginx-fake.png)

回去查看创建的 ingress，指定的证书是 tls-secret：

```yaml
tls:
- hosts:
  - auth-cert.echo.example
  secretName: tls-secret
```

当前 namespace 中不存在这个 secret，在创建 tls-secret 时没有指定 namespace，错误的把 tls-secret 存放到 default 中。ingress 指向了一个不存在的证书，所以出现了上述问题。

## 参考

1. [李佶澳的博客][1]
2. [ingress-nginx 的认证功能使用示例][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/auth.html#client-certificate-authentication%EF%BC%88%E5%AE%A2%E6%88%B7%E7%AB%AF%E8%AF%81%E4%B9%A6%E8%AE%A4%E8%AF%81%EF%BC%89 "ingress-nginx 的认证功能使用示例"
