---
layout: default
title: https证书的制作
author: 李佶澳
createdate: 2017/08/18 17:57:09
changedate: 2018/01/18 18:33:11
categories: 技巧
tags: cryptography
keywords: https,cert
description: https证书的制作

---

* auto-gen TOC:
{:toc}

## 说明

在制作证书的过程了，为了避免多次手动输入，可以使用配置文件`-config configfile`。

系统中存在一个可以作为参照的配置文件：

	/etc/pki/tls/openssl.cnf

下面的过程在[make certs methord1][3]中实现了:

	methord1是最简单的方式，制作自签署的根证书，然后签署服务证书。

[OpenSSL Certificate Authority][4]中的做法在[make certs methord2][4]中实现了：

	制作一个自签署的根证书
	制作一个用根证书签署的中间证书
	用中间证书签署服务证书

## 准备根证书 

生成1024位的私钥，`man genrsa`：

	openssl genrsa -out root.key 1024               

生成证书签署请求, 会提示输入证书相关信息, 注意输入的域名或hostname，`man req`：

	openssl req -new -key root.key -out root.csr
	
	    //这一步会提示输入证书信息, 注意Common Name要输入正确, 如下:
	        Common Name (eg, your name or your server's hostname) []:192.168.88.130
	    //或者使用通配符, 如下
	        Common Name (eg, your name or your server's hostname) []:*.baidu.com

自签署证书，-signkey表示进行自签署，`man x509`：

	openssl x509 -req -days 365 -in root.csr -signkey root.key -out root.crt

查看证书的内容:

	openssl x509 -in root.crt -noout -text

也可以使用下面的命令，一步生成:

	openssl req  -nodes -new -x509 -days 365 -keyout root.key -out root.crt

可以参考[create_root_cert.sh][1]中的根证书的制作。

## 导入浏览器

firefox:

	选项  -> 高级 -> 证书 -> 查看证书 -> 证书机构 -> 导入 -> 勾选信任项 -> 确认

## 用根证书签署证书

制作key，`man genrsa`:

	openssl genrsa -out server.key 1024               

制作签署请求，`man req`:

	openssl req -new -key server.key -out server.csr

签署，`man x509`:

	openssl x509 -req -days 365 -in server.csr -CA root.crt -CAkey root.key -CAcreateserial -out server.crt

注意用根证书签署证书时的命令和自签署时的命令是不同的，根证书签署时使用的是`-CA，-CAkey`，自签署时使用的是`-signkey`。

## 如果绑定的是IP，并且有多个

通过-extfile，设置subjectAltName属性：

	$echo "subjectAltName = IP:10.42.0.1,IP:127.0.0.1" > /tmp/extfile
	$openssl x509 -req -days 365 -in server.csr -CA root.crt -CAkey root.key -CAcreateserial -out server.crt  -extfile /tmp/extfile

## 校验证书

	openssl verify  -CAfile /etc/kubernetes/pki/ca.pem /etc/cni/net.d/calico-tls/etcd-cert

## 参考

1. [setting-openssl-create-certificates][1]
2. [OpenSSL Certificate Authority][2]
3. [make certs methord1][3]
4. [make certs methord2][4]

[1]: http://www.flatmtn.com/article/setting-openssl-create-certificates  "setting-openssl-create-certificates"
[2]: https://jamielinux.com/docs/openssl-certificate-authority/index.html  "OpenSSL Certificate Authority"
[3]: https://github.com/lijiaocn/https-certs/tree/master/methord1  "make certs methord1"
[4]: https://github.com/lijiaocn/https-certs/tree/master/methord2  "make certs methord2"
