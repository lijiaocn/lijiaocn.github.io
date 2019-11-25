---
layout: default
title:  超级账本HyperLedger：Fabric的Chaincode开发过程中遇到的问题
author: 李佶澳
createdate: 2018/07/20 16:22:00
last_modified_at: 2018/09/01 15:15:31
categories: 问题
tags: HyperLedger
keywords: Chaincode,智能合约,HyperLedger,链码开发
description: 这里记录在开发ChainCode的过程中遇到的一些问题，以及解决方法。

---

## 目录
* auto-gen TOC:
{:toc}

## 说明

这是网易云课堂“[IT技术快速入门学院](https://study.163.com/provider/400000000376006/course.htm?share=2&shareId=400000000376006)”使用的素材。讲解视频位于[《HyperLedger Fabric进阶实战课》第四章](https://study.163.com/course/courseMain.htm?courseId=1005359012&share=2&shareId=400000000376006)。演示用的合约代码托管在在Github上：[合约代码][1]。

{% include fabric_page_list.md %}

## 本地编译报错: undefined: tar.FormatPAX

写完ChainCode后，在本地编译时报错：

	go build
	# github.com/hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive
	../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:364:5: hdr.Format undefined (type *tar.Header has no field or method Format)
	../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:364:15: undefined: tar.FormatPAX
	../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:1166:7: hdr.Format undefined (type *tar.Header has no field or method Format)
	../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:1166:17: undefined: tar.FormatPAX
	lijiaos-MacBook-Pro:demo lijiao$ cd ../../../hyperledger/fabric/vendor/github.com/docker/docker/pkg/archive/archive.go:364:5: hdr.Format undefined (type *tar.Header has no field or method Format)

报错的代码是docker的代码：

	 355 // FileInfoHeader creates a populated Header from fi.
	 356 // Compared to archive pkg this function fills in more information.
	 357 // Also, regardless of Go version, this function fills file type bits (e.g. hdr.Mode |= modeISDIR),
	 358 // which have been deleted since Go 1.9 archive/tar.
	 359 func FileInfoHeader(name string, fi os.FileInfo, link string) (*tar.Header, error) {
	 360 |   hdr, err := tar.FileInfoHeader(fi, link)
	 361 |   if err != nil {
	 362 |   |   return nil, err
	 363 |   }
	 364 |   hdr.Format = tar.FormatPAX

本地使用的go版本是1.9.2：

	$ go version
	go version go1.9.2 darwin/amd64

查看本地HyperLedger代码，发现是最新的release-1.2的代码：

	$ cd ../../../hyperledger/fabric
	$ git branch
	  release-1.1
	* release-1.2

HyperLedger 1.2使用的是go1.10，所以需要升级本地Go版本，或者将HyperLedger代码切换为1.1版本。

>使用go get拉取代码时，会直接拉取依赖代码的最新版本，所以直接拉取了Hyperledger 1.2版本的代码。

因为我的目标环境是1.1的，所以将HyperLedger代码切换回到1.1解决：

	$ cd ../../../hyperledger/fabric
	$ git branch release-1.1 -t origin/release-1.1
	$ git checkout release-1.1

## 参考

1. [《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》][1]
2. [《超级账本HyperLedger：Fabric Chaincode（智能合约、链码）开发方法》][2]

[1]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/07/17/hyperledger-fabric-chaincodes-example.html "《超级账本HyperLedger：Fabric的Chaincode（智能合约、链码）开发、使用演示》" 
[2]: http://www.lijiaocn.com/%E9%A1%B9%E7%9B%AE/2018/05/05/hyperledger-fabric-chaincode.html  "《超级账本HyperLedger：Fabric Chaincode（智能合约、链码）开发方法》" 
