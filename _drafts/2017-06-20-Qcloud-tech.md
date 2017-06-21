---
layout: default
title: 腾讯云的技术原理学习
author: lijiaocn
createdate: 2017/06/20 12:48:05
changedate: 2017/06/20 18:38:34
categories: 
tags:
keywords:
description: 

---

* auto-gen TOC:
{:toc}

腾讯云的文档大概是国内的云厂商中写的最好的了。

## 负载均衡

腾讯云的负载均衡(CLB)由叫做TGW(Tencent Gateway)的设备组成, TGW通过GRE隧道将流量分发到后端的RS(虚拟机)。

![](https://mccdn.qcloud.com/static/img/cf8f46731a218bf7fef43843eef0d4e4/image.png)

TGW与接入交换机之间运行OSPF/BGP协议，可以在10秒钟内，将不可用的TGW剔除。

![](https://mccdn.qcloud.com/static/img/4cdd6084a39561e04539a8866374bb24/image.png)

TGW之间通过组播同步建立了5秒上的连接。

![](https://mccdn.qcloud.com/static/img/397479668381a345c8bae877e4aa4ff3/image.png)

CLB可以定期(5s)监测每个业务的流量情况，通过令牌筒的方式丢弃超过上限的流量。

![](https://mccdn.qcloud.com/static/img/86cd36ef04f3200b8d0c591b0c4e7675/image.png)

CLB代理后端的RS完成三次握手，收到第一个数据包后，才开始与RS建立链接。

![](https://mccdn.qcloud.com/static/img/5c96f1c2548dd15bd00d0ff01b63eddf/image.png)

### 四层负载均衡

通过`vip:vport:protocol`区分流量。

![](https://mccdn.qcloud.com/static/img/bb969f908e3931c61267c316e6e4f909/image.png)

后来又增加了新的纬度`domain`。

![](https://mccdn.qcloud.com/static/img/e9d4ed8a62b76264f811d6b0dbf24c2e/image.png)

### 七层负载均衡

七层负载均衡通过在TGW和RS之间插入nginx实现，在部署了nginx的机器通过一个名为L7.ko的内核模块完成报文封装。

![](https://mccdn.qcloud.com/static/img/9874ed32509218619ef4cea119bc3790/image.png)

![公网应用型](https://www.qcloud.com/document/product/214/8975)

### 服务承诺

99.95%的可用性，一年不可用时间4.6小时。

## 云硬盘

[技术原理](https://www.qcloud.com/document/product/362/4138)

## VPC

公网网关: 开启了转发功能的云主机。

NAT网关:

![](https://mccdn.qcloud.com/static/img/4772b9bc1e78436104f89f943f06ac97/image.png)

## PaaS


## 参考

1. [负载均衡技术原理][1]
2. [云硬盘技术原理][2]
3. [公网网关][3]
4. [NAT网关][4]
5. [弹性公网IP][5]
6. [PaaS蓝鲸][6]

[1]: https://www.qcloud.com/document/product/214/530  "负载均衡" 
[2]: https://www.qcloud.com/document/product/362/4138 "云硬盘"
[3]: https://www.qcloud.com/document/product/215/4972 "公网网关"
[4]: https://www.qcloud.com/document/product/215/4975 "NAT网关"
[5]: https://www.qcloud.com/document/product/215/4958 "弹性公网IP"
[6]: https://www.qcloud.com/product/blueking "蓝鲸"
