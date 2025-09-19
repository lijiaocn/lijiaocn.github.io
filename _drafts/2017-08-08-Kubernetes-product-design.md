---
layout: default
title: docker-ee、tectonic、dc/os、rancher与hyper
author: lijiaocn
createdate: 2017/08/08 10:16:21
last_modified_at: 2017/08/11 15:07:20
categories: 项目
tags: kubernetes
keywords: kubernetes,产品化
description: docker公司的docker-ee，coreos公司的tectonic、mesosphere公司的dc/os和rancher、hyper公司的产品大概是现在最能引领容器管理平台潮流的作品了。

---

* auto-gen TOC:
{:toc}

## 说明

docker公司的docker-ee，coreos公司的tectonic、mesosphere的dc/os大概现在最能引领容器管理平台潮流的产品了。

[docker-ee][1]以docker公司的一度令人眼花缭乱的项目(compose/machine/[swarm][8]/)为基础，docker-ee是闭源的，不晓得具体细节。

[tectonic][2]以google开源的kubernetes为基础，使用原生的kubernetes（网站说是100% upstream，no forks）。

[dc/os][3]以apache基金会管理的mesos为基础，dc/os是开源的，[dc/os code][4]。

docker-ce、tectonic和dc/os分别代表了三个开源的技术方向。

[rancher][5]是更高一层的管理系统，目前支持了在rancher中部署kubernetes。

[hyper][6]是基于传统的虚拟机化技术[hyperd][7]，经过改造后，可以直接运行docker的镜像，3秒内完成启动。

hyper提供的是公有云服务，使用方式与docker基本相同，但是管理操作的资源位于hyper的云端。

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
                            
1. [docker-ee][1]
2. [tectonic][2]
3. [dc/os][3]
4. [dc/os code][4]
5. [rancher][5]
6. [hyper][6]
7. [hyperd][7]
8. [swarm][8]

[1]: https://www.docker.com/enterprise-edition  "docker-ee" 
[2]: https://coreos.com/tectonic/  "tectonic" 
[3]: https://mesosphere.com/product/  "dc/os"
[4]: https://github.com/dcos/dcos  "dc/os code"
[5]: http://rancher.com/  "rancher"
[6]: https://docs.hyper.sh/  "hyper"
[7]: https://github.com/hyperhq/hyperd  "hyperd"
[8]: https://github.com/docker/swarm  "swarm"
