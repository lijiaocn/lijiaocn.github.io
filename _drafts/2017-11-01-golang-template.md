---
layout: default
title: go的template模版语法
author: lijiaocn
createdate: 2017/11/01 17:23:42
changedate: 2017/11/15 10:45:31
categories: 编程
tags: go
keywords:
description: 

---

* auto-gen TOC:
{:toc}

## 说明

[go模板语法简明教程][1]

## 嵌套子模版 

	kubectl -n $1 get pod -o=go-template=\'{{ define "getimage" }}{{ range .spec.containers }}{{ .image }}\n{{end}}{{ end }}{{ range .items }}{{ template "getimage" . }}{{ end }}'|
	|sed -e "s@\\\n@\n@g"

## 参考

1. [go模板语法简明教程][1]

[1]: http://www.cnblogs.com/Pynix/p/4154630.html "go模板语法简明教程" 
