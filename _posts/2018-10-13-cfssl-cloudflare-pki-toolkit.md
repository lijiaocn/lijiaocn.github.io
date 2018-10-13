---
layout: default
title:  "用CloudFlare的PKI工具CFSSL生成Certificate Bundle"
author: 李佶澳
createdate: 2018/10/13 17:05:00
changedate: 2018/10/13 17:05:00
categories: 技巧
tags: cryptography
keywords: cfssl,https证书,cert bundle,Certificate Bundle
description: 在阅读Kubernetes文档的时候知道了CFSSL，cfssl有一个bundle命令，直到阅读了CloudFlare技术博客才知道它的用途是生成Certificate Bundle

---

* auto-gen TOC:
{:toc}

## 说明

在阅读[Kubernetes文档][1]的时候知道了[CFSSL][2]，在CFFL的[Github Readme][2]中看到它有一个`bundle`命令，不知道用来做什么的。
直到阅读了[CloudFlare](https://www.cloudflare.com/)技术博客上的文章：[Introducing CFSSL - CloudFlare's PKI toolkit][3]。

## 非对称加密与PKI(Public key infrastructure)

要想知道cfssl项目的用途和bundle命令的目的，必须要知道非对称加密和PKI是怎么回事。

加密算法可以粗略非为`对称加密`与`非对称加密`两种类型。对称加密算法中加密和解密时使用相同的密码，非对称加密算法中密码是一对，加密和解密时使用不同的密码。

使用非对称加密算法，用来加密的密码可以完全只由加密人自己持有，其它人只需要持有解密用的密码。因为加密密码只有加密人自己知道，所以没有人能够伪造出可以被正确解密的密文。

非对称加密算法的这种特性，使它非常适合用来做电子签名：只要能够用解密密码解开，就能确定这是加密人发送的密文。
最经典最常用的非对称加密算法是`RSA`算法，可以参考《[RSA的私钥和公钥，以及用openssl制作的方法][5]》。

## 怎样验证网站的真实性？

现在大部分主要网站都使用https加密，当我们在浏览器的地址栏中看到绿色的证书状态时，可以认定这是一个真实的网站（其实还有“同形”域名的蒙蔽方法）。

浏览器为什么认为这个网站是真实的？背后的机制是怎样的？这个需要知晓。

使用https加密的网站，首先要生成一堆非对称加密算法用到的密钥，这对密钥非为私钥和公钥。
网站的Web服务器用私钥对发送给浏览器的网页加密，浏览器用公钥解密收到的内容(实际中要比这负责，注意后文的解释)。
这样子实现了对传输内容的加密。

但是浏览器是怎样得到公钥的呢？是在浏览器向网站发起请求的时候，网站回应给浏览器的。也就是说，浏览器器发起请求的时候，网站首先把公钥传给浏览器，然后浏览器用这个公钥解密后续的内容。

看到这，你或许有疑问了：这不是把锁连同钥匙一起发送了吗？如果别人伪造一个公钥给浏览器咋办？

你的质疑是正确的。事实上网站返回给浏览器的不是一个纯粹的公钥，而是`用另外一个私钥签署的公钥`，这个被签署的公钥，通常被称为`Https证书`。

浏览器收到这个`被另一个私钥签署过的`证书后，先用`另一个私钥对应的公钥`检查这个证书是否正确，如果正确就在地址栏中显示绿色的图标，并继续后续请求。
如果不正确，就提示证书不可信。

那么，这另一个公钥是怎么来的？浏览器怎样知道的？它是内置在浏览器中的，直接包含在浏览器的安装文件中。

实际的情况还要再复杂一点，这个用来验证证书的公钥，通常也需要被另一个公钥验证，以此类推，直到被浏览器中内置的证书验证。
这样一个链条，称为“信任链”，如下图所示：

![CA infrastructure](https://blog.cloudflare.com/content/images/image01_4.png)

一个证书和验证它所需要的一系列证书，被称为`Certificate Bundle`。这套机制被称为：[Public key infrastructure][4]。

专门负责签署证书的机构被称为CA，它们依靠自己的公信力，得到浏览器厂商的支持后，将自己的公钥内置在浏览器中，成为浏览器验证其它证书是否真实的最后一个证书。

>注意：https协议比上面说的过程要复杂。因为非对称加密算法的开销很高，https协议中首先用非对称加密选择出对称加密算法，然后用对称加密的方式加密数据，并且会定时更换对称加密算法或者密钥。

## 现实中存在的问题

现实中，浏览器厂商有很多家，签署证书的CA也有很多家。一些早期的浏览器中只包含了那时候已知的CA厂商的公钥。
即使同一时期的浏览器，内置的CA厂商的公钥也可能不同，CA厂商的公钥也会随着技术发展而更新，支持新的安全特性。

这样一来，一个网站要想被所有的浏览器信任，就变成了一件困难的事情：它的公钥需要得到多个CA多个时期的公钥的签署。
直接导致管理起来也比较繁琐，容易出错。

可能导致需要被网站服务器传送的证书数量增加，继而浏览器端的验证工作也增加，从而使用户等待网页内容的时间增加。
还可能导致明明应当使用更新更安全的方法，结果用了早期的不安全的方法。

CFSSL就是用来解决这些问题的，通过用它可以方便地生成Certificate Bundle。由CFSSL统一负责Certificate Bundle的生成，能够覆盖更多的浏览器，并且可以统一优化，管理也极为方便。

只需要把CA厂商签署的证书，直接提交到CFSSL中，CFSSL自动将这个证书依赖的其它证书打包。就是下面这个命令：

	cfssl bundle -cert mycert.crt

## CFSSL的CA功能

CFSSL同时具有CA功能，它除了可以生成Ceritificate Bundle，还可以生成CA证书、公钥、私钥，以及签署公钥。

可以说，只要部署一套CFSSL，就可以成为一个CA机构了（要发挥作用，还需要得到浏览器厂商的认可和支持，将公钥内置到浏览器中）。

### 生成CA证书

命令如下：

	./cfssl gencert -initca ca_csr.json

ca_csr.json是一个CA证书的信息，格式如下：

	{
	  "CN": "CN",
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names":[{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "class"
	  }]
	}

上面命令执行结果是一堆字符串，可以用`cfssljson`把它们导入文件中：

	./cfssl gencert -initca cert/ca-csr.json | ./cfssljson -bare ca

执行结束后得到三个文件：ca-key.pem、ca.csr、ca.pem。

### 生成公钥和私钥

命令如下：

	cfssl genkey csr.json

csr.json包含的是要生成的公钥和私钥的信息，格式如下：

	{
	    "hosts": [
	        "example.com",
	        "www.example.com"
	    ],
	    "key": {
	        "algo": "rsa",
	        "size": 2048
	    },
	    "names": [
	        {
	            "C":  "US",
	            "L":  "San Francisco",
	            "O":  "Internet Widgets, Inc.",
	            "OU": "WWW",
	            "ST": "California"
	        }
	    ]
	}

依然用cfssljson将其导入到文件中：

	./cfssl genkey csr.json  |./cfssljson -bare server

会得到下面两个文件：

	server-key.pem  server.csr

`server-key.pem`是私钥，`server.csr`是包含公钥的签署请求，可以理解为等待被签署的公钥。

### 签署公钥

命令如下：

	./cfssl sign -ca=ca.pem -ca-key=ca-key.pem -csr=./server.csr  |./cfssljson -bare server

执行之后得到可以直接使用的证书`server.pem`。

也可以将生成和签署的过程一起执行：

	./cfssl gencert -ca=ca.pem -ca-key=ca-key.pem --config=ca-config.json -profile=kubernetes server1-csr.json | ../cfssljson -bare server1

`ca-config.json`是签署相关的配置：

	{
	  "signing": {
	    "default": {
	      "expiry": "8760h"
	    },
	    "profiles": {
	      "kubernetes": {
	        "usages": [
	          "signing",
	          "key encipherment",
	          "server auth",
	          "client auth"
	        ],
	        "expiry": "8760h"
	      }
	    }
	  }
	}

`server1-csr.json`是要生成的证书信息：

	{
	  "CN": "kubernetes",
	  "hosts": [
	    "127.0.0.1",
	    "192.0.0.1",
	    "10.0.0.1",
	    "kubernetes",
	    "kubernetes.default",
	    "kubernetes.default.svc",
	    "kubernetes.default.svc.cluster",
	    "kubernetes.default.svc.cluster.local"
	  ],
	  "key": {
	    "algo": "rsa",
	    "size": 2048
	  },
	  "names": [{
	    "C": "CN",
	    "ST": "BeiJing",
	    "L": "BeiJing",
	    "O": "lijiaocn.com",
	    "OU": "class"
	  }]
	}

## CFSSL以服务的方式运行

上面都是用cfssl的命令完成证书制作的，cfssl还可以以服务的方式运行：

	cfssl serve -address=localhost -port=8888 -ca-key=test-key.pem -ca=test-cert.pem

之后可以用cfssl的API提交操作，或者直接用cfssl命令连接cfssl服务，例如：

	cfssl gencert -remote="localhost:8888" www.example.com csr.json

## 参考

1. [Kubernetes Certificates: cfssl][1]
2. [Github: CFSSL][2]
3. [Introducing CFSSL - CloudFlare's PKI toolkit][3]
4. [Public key infrastructure][4]
5. [RSA的私钥和公钥，以及用openssl制作的方法][5]
6. [https证书的制作][6]

[1]: https://kubernetes.io/docs/concepts/cluster-administration/certificates/#cfssl  "Kubernetes Certificates: cfssl" 
[2]: https://github.com/cloudflare/cfssl  "Github: CFSSL" 
[3]: https://blog.cloudflare.com/introducing-cfssl/ "Introducing CFSSL - CloudFlare's PKI toolkit"
[4]: https://en.wikipedia.org/wiki/Public_key_infrastructure "Public key infrastructure"
[5]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/01/23/rsa-key.html "RSA的私钥和公钥，以及用openssl制作的方法"
[6]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2017/08/18/https-certs-creat.html "https证书的制作"
