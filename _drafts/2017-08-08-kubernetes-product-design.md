---
layout: default
title: kubernetes的产品化设计
author: lijiaocn
createdate: 2017/08/08 10:16:21
changedate: 2017/08/08 20:25:41
categories: 项目
tags: k8s
keywords: kubernetes,产品化
description: 

---

* auto-gen TOC:
{:toc}

## 应用部署方式

标准部署，可选的floating ip绑定到proxy(s):

	                                  -> pod ----> volume
	                               --/  
	                 --> service -/----> pod ----> volume 
	               --/  
	 [fip]     ---/     
	proxy(s) ----------> service ------> external
	           \--      
	              \---  
	                  \> pod --------------------> volume

独立service：

	             -> pod ----> volume
	 [fip]    --/  
	service -/----> pod ----> volume

外部服务:

	 [fip]
	service ------> external

独立pod:

	[fip]
	 pod ----> volume

floating ip可以在pod、service、proxy之间漂移。

## 参考                     
                            
1. [文献1][1]
2. [文献2][2]

[1]: 1.com  "文献1" 
[2]: 2.com  "文献1" 
