---
layout: default
title: HTTP与curl使用手册
author: lijiaocn
createdate: 2017/04/26 17:18:17
changedate: 2017/09/21 19:29:30
categories: 技巧
tags: linuxnet
keywords: curl使用手册,http
description: curl是一个看似简单、实则强大的命令，看它的参数有多少就知道了。

---

* auto-gen TOC:
{:toc}

## Https  

### 访问Https站点

访问https站点时，需要验证https站点返回的证书是否合法。

#### 指定根证书

	--cacert FILE   CA certificate to verify peer against (SSL)
	--capath DIR    CA directory to verify peer against (SSL)

例如：

	curl https://10.0.0.1:443 --cacert /run/secrets/kubernetes.io/serviceaccount/ca.crt

#### 指定client端的证书:

	-E, --cert CERT[:PASSWD] Client certificate file and password (SSL)
	    --cert-type TYPE Certificate file type (DER/PEM/ENG) (SSL)
	    --ciphers LIST  SSL ciphers to use (SSL)
	    --compressed    Request compressed response (using deflate or gzip)



## 参考

1. man curl
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
