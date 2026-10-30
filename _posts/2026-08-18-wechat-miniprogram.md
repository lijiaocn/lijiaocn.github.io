---
layout: default
title: "独立赚钱日记：微信小程序开发"
author: 李佶澳
categories: [solo-income,invest,project,resolution,problems,others]
tags: [独立赚钱日记]
keywords: 
description: 
---

## 目录


* auto-gen TOC:
{:toc}

## 使用微信虚拟虚拟支付

微信支付和虚拟支付是两个概念:

* 微信支付使用 [wx.requestPayment][3] 接口，主要用购买实体商品，是商户收款
* 虚拟支付使用 [wx.requestVirtualPayment][3] 接口，`虚拟商品必须用虚拟支付`，收款到小程序账号中

虚拟支付的[开发流程][2]：

![微信虚拟支付处理流程]({{ site.article}}/wechat-virtual-pay.png)

* wx.requestVirtualPayment 参数中的支付态签名和用户态签名，自行在小程序端的服务端生成，[签名详解][5]
* 支付签名 paySig：用小程序后台虚拟支付 -> 基本配置 -> 基础配置中的 appKey 签署生成
* 用户态签名 signature：用 session_key 签署
* session_key: 在小程序端用 wx.login 获得 code，然后在小程序服务端用 code 从微信服务端获取，有效期用 [wx.checkSession][7] 检查，更多信息见 [session_ke获取方法][6]、[开放数据校验与解密][8]
* 商品在小程序后台创建（分为道具商品和代币商品两类），微信小程序本身不提供商品列表接口，自行维护
* 回调路径在小程序后台配置，支付成功后微信服务端发起调用，对接方式见 [消息推送][9]

### 商品的展示

微信似乎没有提供一个可以直接获取已经配置的好的商品商品。提供的服务端接口的用途是代替手动在后台创建商品的操作。所以需要自行管理商品信息，保证前端展示的商品信息和小程序后台配置的商品信息一致。

### 用微信云函数接收支付事件

[消息推送][9] 中说微信云函数只支持客服消息推送，这个说似乎过时了。在微信开发者工具->云开发->设置->其它设置中，现在已经包含支付的事件，应该是能用微信云函数对接了：

![云开发消息推送配置]({{ site.article }}/wechat-pay-event.png)

* 在云开发中配置的事件将不会再推送到小程序后台配置的地址

### 沙盒环境调试

* 小程序后台提供了沙盒环境的 appKey，然后调用指定接口的时候指定 env 为沙箱环境。
* 沙箱测试的订单，能够在小程序后台看到： 虚拟支付->交易订单->虚拟支付订单->沙箱环境
* 沙箱环境使用真实的支付，可在后台订单上发起退款

![虚拟支付订单]({{ site.article }}/xpay_order.png)


## 参考

1. [李佶澳的博客][1]
2. [虚拟支付说明][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/business-capabilities/virtual-payment.html "虚拟支付" 
[3]: https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestPayment.html "wx.requestPayment"
[4]: https://developers.weixin.qq.com/miniprogram/dev/api/payment/wx.requestVirtualPayment.html "wx.requestVirtualPayment"
[5]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/business-capabilities/virtual-payment.html#_2-5-%E7%AD%BE%E5%90%8D%E8%AF%A6%E8%A7%A3 "虚拟支付签名参数说明"
[6]: https://developers.weixin.qq.com/minigame/dev/guide/open-ability/login.html "session_key获取"
[7]: https://developers.weixin.qq.com/minigame/dev/api/open-api/login/wx.checkSession.html "wx.checkSession"
[8]: https://developers.weixin.qq.com/minigame/dev/guide/open-ability/signature.html "开放数据校验与解密"
[9]: https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/message-push.html "消息推送"