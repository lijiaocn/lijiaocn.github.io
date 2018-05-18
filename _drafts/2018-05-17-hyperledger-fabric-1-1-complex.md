---
layout: default
title:  "超级账本HyperLedger Fabric1.1的使用进阶"
author: lijiaocn
createdate: 2018/05/17 14:54:00
changedate: 2018/05/18 16:09:33
categories: 项目
tags: hyperledger
keywords: hyperledger,fabric,使用进阶,生产实践
description: 

---

* auto-gen TOC:
{:toc}

## 说明

在Hyperledger Fabric最新(2018-05-17 15:04:40)文档中增加了[Adding an Org to a Channel][2]和
[Upgrading Your Network Components][3]两个章节。这是实践中会遇到的很实际的场景。

## 快速体验

这里先通过[fabric-samples][1]中提供的脚本，快速地体验一下。

	git clone https://github.com/hyperledger/fabric-samples.git
	cd fabric-samples
	git checkout v1.1.0

这里使用的版本是1.1.0，fabric-samples v1.1.0中的演示脚本对fabric版本是有要求的，不支持1.0.6版本的。

从网址[HyplerLedger Fabric Download][4]下载1.1.0版本的fabric文件：

	wget https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/darwin-amd64-1.1.0/hyperledger-fabric-darwin-amd64-1.1.0.tar.gz
	tar -xvf hyperledger-fabric-darwin-amd64-1.1.0.tar.gz

一定要更新Docker镜像，fabric-samples中的脚本会通过运行Docker容器获取版本信息：

	./bin/get-docker-images.sh

>需要对这个脚本做修改：BASE_DOCKER_TAG=x86_64-1.1.0

别忘了将bin目录添加到环境变量PATH中。

### Adding an Org to a Channel

在目录`fabric-samples/first-network/`中操作，如果本地已经有运行的fabric，先停止：

	./byfn.sh down

然后生成将会使用的配置文件：

	./byfn.sh generate

最后启动，需要指定版本号1.1.0：

	./byfn.sh up -i 1.1.0

在Channel中添加新的组织`Org3`的过程被打包在`./eyfn.sh`脚本中，直接执行就可以完成Org3的添加：

	./eyfn.sh up

## 

## 参考

1. [github fabric-samples][1]
2. [HyplerLedger Fabric: Adding an Org to a Channel][2]
3. [HyplerLedger Fabric: Upgrading Your Network Components][3]
4. [HyplerLedger Fabric Download][4]

[1]: https://github.com/hyperledger/fabric-samples.git "github fabric-samples" 
[2]: http://hyperledger-fabric.readthedocs.io/en/latest/channel_update_tutorial.html "HyplerLedger Fabric: Adding an Org to a Channel"
[3]: http://hyperledger-fabric.readthedocs.io/en/latest/upgrading_your_network_tutorial.html "HyplerLedger Fabric: Upgrading Your Network Components"
[4]: https://nexus.hyperledger.org/content/repositories/releases/org/hyperledger/fabric/hyperledger-fabric/ "HyplerLedger Fabric Download"
