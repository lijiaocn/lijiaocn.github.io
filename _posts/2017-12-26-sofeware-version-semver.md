---
layout: default
title: "怎样为软件的不同版本命名？"
author: 李佶澳
createdate: 2017/12/26 14:22:25
changedate: 2017/12/26 15:22:22
categories: 方法
tags: spec
keywords: semver,版本命名
description: 可以参考软件版本命名规范Semantic Versioning 2.0.0

---

* auto-gen TOC:
{:toc}

## 说明

[Semantic Versioning][1]是一份版本命名规则，在软件开发过程中可以依据这份标准，对不同的版本进行命名。

## 规范

Semver规定的版本号格式为：

	 正式版本：  MAJOR.MINOR.PATCH
	 预发布版本：MAJOR.MINOR.PATCH-XXX

MAJOR是主版本号，不兼容上一个版本的API的时候，使用新的MAJOR。

MINOR是次版本号，在兼容上一个版本API的前提下，增加了新的特性，使用新的MINOR。

PATCH是补丁号，在兼容上一个版本API的前提下，修复了Bug。

-XXX用来标记预发布版本。

## 示例

`0.y.z`，即MAJOR为0，命名处于初级阶段，尚不稳定的版本。

`1.0.0`，第一个公开版本或正式版本，之后的版本需要考虑是否要兼容以往版本。

`x.y.Z`，x>0，修复Bug后，且兼容性不变，需要将Z增加。

`x.Y.z`，x>0，增加新特性，且兼容性不变，需要将Y增加，将z归零。

`X.y.z`，x>0，兼容性变化时，需要将X增加，y和z归零。

`1.0.0-alpha，1.0.0-alpha.1`，预发布版本增加以`-`开头的后缀，表示当前版本尚不稳定。

`1.0.0-alpha+20130313144700`，可以用以`+`开头的后缀，标记编译信息。

下面是一个软件的版本变更过程：

	1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1 < 1.0.0

## 版本与开发分支

可以参照[client-go][2]中的做法：

	MAJOR或者MINOR更新的时候，创建对应的Branch和TAG
	PATCH更新的时候，创建对应的TAG
	Master是最新状态的代码

具体的开发过程，可以参考[beego][3]的做法：

![git project]({{ site.imglocal }}/git/01project.png )

## 参考

1. [Semantic Versioning 2.0.0][1]
2. [client-go][2]
3. [beego git branch][3]

[1]: https://semver.org/  "Semantic Versioning 2.0.0" 
[2]: https://github.com/kubernetes/client-go "client-go"
[3]: https://beego.me/docs/install/ "beego git branch"
