---
layout: default
title: "ingress-nginx 的限速功能在 nginx.conf 中的对应配置"
author: 李佶澳
date: "2019-12-03 18:03:38 +0800"
last_modified_at: "2019-12-03 19:48:59 +0800"
categories: 项目
cover:
tags: kubernetes
keywords: kubernetes,ingrss-nginx
description: 解读 ingress-nginx 针对源 IP 限速的配置、白名单设置方法和不足
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

[ingress-nginx 针对源 IP 限速][2] 示例了 ingress-nginx 的基于源 IP 限速的方法，这里解读一下配置文件。

## 配置

location 中增加的配置：

```conf
location /fastjson {
      ... 省略 ....
      limit_req zone=test-fastjson_rpm burst=25 nodelay;
      ... 省略 ....
}
```

zone 指向的是统计请求次数的共享内存，设置如下：

```sh
limit_req_zone $limit_dGVzdC1qaW5nYW5naHVpZ3VpeWlfZmFzdGpzb24 zone=test-fastjson_rpm:5m rate=5r/m;
```

内存大小是 5 兆，限速频率为每分钟 5 次。重点是作为 key 的变量 $limit_XXX 的值。
$limit_XXX 变量是共享内存中的次数统计的 key，用 map 指令定义，它的值取决于 $whitelist_XXX，如果 $whitelist_XXX 为 0，$limitXXX 的值是 $binary_remote_addr，即源 IP，否则为空。

```conf
map $whitelist_dGVzdC1qaW5nYW5naHVpZ3VpeWlfZmFzdGpzb24 $limit_dGVzdC1qaW5nYW5naHVpZ3VpeWlfZmFzdGpzb24 {
        0 $binary_remote_addr;
        1 "";
}
```

用白名单用 geo 变通实现，$the_real_ip 与名单中的 1.1.0.0/16 匹配时，$whitelist_XXX 是 1：

```conf
geo $the_real_ip $whitelist_dGVzdC1qaW5nYW5naHVpZ3VpeWlfZmFzdGpzb24 {
        default 0;
        
        1.1.0.0/16 1;
}
```

$the_real_ip 是 $remote_addr：

```conf
map '' $the_real_ip {

    default          $remote_addr;
}
```

## 不足 

ingress-nginx 的限速功能只支持白名单，可以对部分 IP 不限速，但不支持黑名单，有时候希望只对特定的 IP 限速。

另外默认都是 nodelay 方式，好像不支持自定义：

```conf
location /fastjson {
      ... 省略 ....
      limit_req zone=test-fastjson_rpm burst=25 nodelay;
      ... 省略 ....
}
```

## 参考

1. [李佶澳的博客][1]
2. [ingress-nginx 针对源 IP 限速][2]
3. [Nginx Alphabetical index of directives][3]
4. [Nginx Alphabetical index of variables][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.lijiaocn.com/soft/k8s/ingress-nginx/ratelimit.html "ingress-nginx 针对源 IP 限速"
[3]: https://nginx.org/en/docs/dirindex.html "Nginx Alphabetical index of directives"
[4]: https://nginx.org/en/docs/varindex.html "Nginx Alphabetical index of variables"
