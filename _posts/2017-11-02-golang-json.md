---
layout: default
title: go的json库反序列化时，会忽略未知的字段
author: lijiaocn
createdate: 2017/11/02 15:00:58
changedate: 2017/11/02 16:27:02
categories: 编程
tags: golang
keywords: json,unmarshal,golang
description: golang的json库反序列化时，会忽略未知的字段，不会报错

---

* auto-gen TOC:
{:toc}

## 描述 

go1.8.1，在进行json字符串的反序列化时，发现多出的字段会被忽略，而不报错。

例如，结构体定义如下:

	type BackendInput struct {
		Name        string
		Type        string
		Namespace   string
		Service     string
		Podlabels   string
		Description string
		ListenerId  int
	}

反序列化时输入的json字符串为：

	{
	  "Description": "string",
	  "ListenerId": 4,
	  "Namespace": "string",
	  "Podlabels": "string",
	  "Service": "string",
	  "Type": "string",
	  "namex": "string"
	}

输入的json字符串中缺失了`name`字段，多出了一个`namex`字段，json.Unmarshal()不会报错，反序列化后得到的变量中的Name字段为空。

因为json的Unmarshal不会报错，所以需要开发者自己检查输入的json字符串。如果Unmarshal的时候能够做一些检查，可以减轻开发工作。

## 解决

github上有用户提出了建议: [proposal: encoding/json: reject unknown fields in Decoder ][1]

golang已经做出了改动([golang commit 74830][2])，增加了DisallowUnknownFields标记。

	DisallowUnknownFields causes the Decoder to return an error when
	the the decoding destination is a struct and the input contains
	object keys which do not match any non-ignored, public field the
	destination, including keys whose value is set to null.

## 参考

1. [proposal: encoding/json: reject unknown fields in Decoder ][1]
2. [golang commit 74830][2]

[1]: https://github.com/golang/go/issues/15314  "proposal: encoding/json: reject unknown fields in Decoder " 
[2]: https://golang.org/cl/74830  "golang commit 74830" 
