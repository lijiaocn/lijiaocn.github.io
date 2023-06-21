---
layout: default
title: "各大云厂商的 API 设计风格"
author: 李佶澳
date: "2023-06-20 16:21:51 +0800"
last_modified_at: "2023-06-21 17:57:11 +0800"
categories: 方法
cover:
tags: 系统设计
keywords:
description: 没想到各大公有云厂商的 API 是这么乱糟糟的，自家不同服务的风格都不统一。
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

没想到各大公有云厂商的 API 是这么乱糟糟的，自家不同服务的风格都不统一。

## AWS

AWS 的 API 设计的借鉴价值最低。它较早期的服务 API 没有使用 REST 风格，较新的服务的 API 又开始采用 REST 风格。文档写的很烂很烂，比如 EKS 等使用新的 API 风格，但从文档里完全看不出以前的 Action、api-version 等通用参数是否还需要。
国内的阿里云/腾讯云等明显抄了 AWS 的早期设计，AWS 自家风格都乱了，还跟着瞎抄。 AWS 的 API 做成这个样子，丝毫不影响它成为公有云市场的 No1，值得思考。

### AWS：RunInstances 

[AWS: RunInstances][5] 应该是 aws 最早的 api 之一。文档里没有明确提到的认作未使用，比如文档里没有提 http method，就认为是不区分（这个判断可能不对）。风格如下：

* 不区分 http method，用 Action 参数指定操作：https://ec2.amazonaws.com/?Action=RunInstances
* 参数全都是 query 参数，不支持路径参数
* 通过公用参数 Version 指定 API 版本
* 错误码位于 Response 的 body 中，http reponse code 可能全都是 200 
* 借助 client token 实现幂等

```bash
https://ec2.amazonaws.com/?Action=RunInstances
&ImageId=ami-beb0caec
&InstanceType=m1.large
&MaxCount=1
&MinCount=1
&KeyName=my-key-pair
&NetworkInterface.1.DeviceIndex=0
&NetworkInterface.1.PrivateIpAddresses.1.Primary=true
&NetworkInterface.1.PrivateIpAddresses.1.PrivateIpAddress=10.0.2.106
&NetworkInterface.1.PrivateIpAddresses.2.Primary=false
&NetworkInterface.1.PrivateIpAddresses.2.PrivateIpAddress=10.0.2.107
&NetworkInterface.1.PrivateIpAddresses.3.Primary=false
&NetworkInterface.1.PrivateIpAddresses.3.PrivateIpAddress=10.0.2.108
&NetworkInterface.1.SubnetId=subnet-a61dafcf
&AUTHPARAMS
```

### AWS EKS: UpdateClusterVersion

[AWS EKS: UpdateClusterVersion][9] 还有  [AWS Lambda][10] 等换了另一种风格，更像 REST：

* 区分 http method，为 uri 添加 `/动词` 后缀进一步区分 http method 无法表达的操作，Action 等参数文档也没说是否取消
* 按照 http method 使用 query 参数或者 body
* api-version 也没有提及，感觉应该还是使用
* 复用 http status code

## Azure

Azure 在全平台 API 风格统一方面也好不到哪去，整体在趋向统一，主流的是 [Azure: Virtual Machines Create Or Update][3] 的做法：

* 区分 http method，为 uri 添加 `/动词` 后缀进一步区分 http method 无法表达的操作
* 同时使用 query 参数、路径参数和 body 数据，有不同定位：query 参数是公用参数，路径参数是用于资源定位，body 承接其它参数
* 通过公用参数 api-version 指定版本: api-version=2023-03-01，日期映射到具体的 Major.Minor 版本号
* 复用 http status code，用 ApiError 标识具体错误

微软出了一份 [Microsoft REST API Guidelines][6]，在 `Versioning` 中提到 api group version 可以是日期形式，但是系统内部要将其映射到 Major.Minor 版本号。并且发布新版本后，需要提供历史版本的接口文档。
这方面 azure 做的比较 aws 要好，aws 的 API 完全不知道有多少个版本，每个版本的差异是什么。

![数据库接口]({{ site.article }}/azure-api-2.png)

## Google Cloud

[Google Cloud: Creates an instance resource][4]：

* 区分 http method，为 uri 添加 `/动词` 后缀进一步区分 http method 无法表达的操作（注意这是早期做法，现在用 `:动词` 后缀）
* 同时使用 query 参数、路径参数和 body 数据用：其中路径参数用于资源定位，query 似乎通常是共用/简单的参数，body 数据是主体
* 通过 uri 中 /v1 样式的前缀区分 api 版本
* instances.insert 没有具体说明错误码，应当也是 http status code 和具体的 Error 结合 

Google 也有一份 [RESTful API Guidelines][7]，它也没有完全遵守，应该是部分接口的实现早于规范的原因：

```sh
POST https://compute.googleapis.com/compute/v1/projects/{project}/zones/{zone}/instances/{instance}/detachDisk
// 按照 Google 的 Guidelines 应该是下面样式，用 : 分割动词
POST https://compute.googleapis.com/compute/v1/projects/{project}/zones/{zone}/instances/{instance}:detachDisk
```

新接口比如 [projects.locations.batchPredictionJobs.cancel][8] 采用的是规范：

```sh
POST https://{service-endpoint}/v1/{name}:cancel
```

## 总结 

整体来看接口风格都在往 REST 靠齐， Google 的 [RESTful API 设计规范][7] 和微软的 [REST API Guidelines][6] 也有很多共同的地方。
不过 Azure 和 AWS 用日期字符串作为版本，我感觉这是奇葩设计，日期做版本会鼓励 API 版本滥发而且用户用的时候要指定日期，更倾向于 Google 通过 /v1 区别版本的方式。

Google 对待 API 更重视，除了发布 [RESTful API 设计规范][7]，还发起了一个 API 改善计划：[API Improvement Proposals][11]。发起人 JJ Geewax 还在 2021 年初出版了《API Design Patterns》对 API 设计规范进行解释。

## 参考

1. [李佶澳的博客][1]
2. [Amazon EC2 Common query parameters][2]
3. [Azure: Virtual Machines Create Or Update][3]
4. [Google Cloud: Creates an instance resource][4]
5. [AWS: RunInstances][5]
6. [Microsoft REST API Guidelines][6]
7. [Google 是如何实践 RESTful API 设计的？][7]
8. [Google Method: projects.locations.batchPredictionJobs.cancel][8]
9. [AWS EKS: UpdateClusterVersion][9]
10. [AWS Lambda][10]
11. [Google: API Improvement Proposals][11]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://docs.aws.amazon.com/AWSEC2/latest/APIReference/CommonParameters.html "Amazon EC2 Common query parameters"
[3]: https://learn.microsoft.com/en-us/rest/api/compute/virtual-machines/create-or-update?tabs=HTTP "Azure: Virtual Machines Create Or Update"
[4]: https://cloud.google.com/compute/docs/reference/rest/v1/instances/insert "Google Cloud: Creates an instance resource"
[5]: https://docs.aws.amazon.com/AWSEC2/latest/APIReference/API_RunInstances.html "AWS: RunInstances"
[6]: https://github.com/Microsoft/api-guidelines/blob/master/Guidelines.md "Microsoft REST API Guidelines"
[7]: /方法/2022/11/24/google-api-design.html "Google 是如何实践 RESTful API 设计的？"
[8]: https://cloud.google.com/vertex-ai/docs/reference/rest/v1/projects.locations.batchPredictionJobs/cancel "Google: Method: projects.locations.batchPredictionJobs.cancel"
[9]: https://docs.aws.amazon.com/eks/latest/APIReference/API_UpdateClusterVersion.html "AWS EKS: UpdateClusterVersion"
[10]: https://docs.aws.amazon.com/lambda/latest/dg/API_GetProvisionedConcurrencyConfig.html "AWS Lambda" 
[11]: https://google.aip.dev/ "Google: API Improvement Proposals"
