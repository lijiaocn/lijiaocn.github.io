---
layout: default
title: https证书的制作
author: lijiaocn
createdate: 2017/08/18 17:57:09
changedate: 2017/08/18 18:31:00
categories: 技巧
tags: cryptography
keywords: https,cert
description: https证书的制作

---

* auto-gen TOC:
{:toc}

## 说明

这里介绍如何自行制作根证书，并用自制的根证书签署证书。

## 准备根证书 

[create_root_cert.sh][1]中完成了根证书的制作，基本过程如下：

	//生成1024位的私钥
	openssl genrsa -out root.key 1024               
	
	//生成证书签署请求, 会提示输入证书相关信息, 注意输入的域名或hostname
	openssl req -new -key root.key -out root.csr
	
	    //这一步会提示输入证书信息, 注意Common Name要输入正确, 如下:
	        Common Name (eg, your name or your server's hostname) []:192.168.88.130
	    //或者使用通配符, 如下
	        Common Name (eg, your name or your server's hostname) []:*.baidu.com
	
	//自签署证书
	openssl x509 -req -days 365 -in root.csr -signkey root.key -out root.crt

也可以使用下面的命令，一步生成:

	openssl req  -nodes -new -x509 -days 365 -keyout root.key -out root.crt

## 导入浏览器

firefox:

	选项  -> 高级 -> 证书 -> 查看证书 -> 证书机构 -> 导入 -> 勾选信任项 -> 确认

## 用根证书签署证书

制作一个key，然后用自制的根证书签署。

### 制作key

	openssl genrsa -out server.key 1024               
	openssl req -new -key server.key -out server.csr
	openssl x509 -req -days 365 -in server.csr -signkey server.key -out server.crt

### 制作签署请求

	openssl genrsa -out server.key 1024               
	openssl req -new -key server.key -out server.csr

## 参考

1. [create_root_cert.sh][1]

[1]: https://github.com/lijiaocn/https-certs/blob/master/RootCA/create_root_cert.sh  "create_root_cert.sh"
