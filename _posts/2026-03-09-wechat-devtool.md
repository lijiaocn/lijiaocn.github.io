---
layout: default
title: "微信小程序多端应用+微信云开发，平替 flutter & firebase"
author: 李佶澳
categories: [resolution]
tags: [独立赚钱笔记]
keywords: 
description: firebase 太好用了，唯一的问题就是在国内用不了，需要找个国内的平替。微信小程序的多端应用+微信云开发是一个好的选择。
---

## 目录

* auto-gen TOC:
{:toc}

## 背景

firebase 太好用了，唯一的问题就是在国内用不了，需要找个国内的平替。在国内，微信小程序的多端应用+微信云开发应该是最好的选择，直接平替了 flutter 和 firebase 的组合。

## 微信小程序多端应用

[小程序多端框架概述][4] 能把小程序直接转成 ios/android/鸿蒙 应用，支持微信登陆和 apple 原生登陆。

除了直接新建一个多端应用,还可以把现有的小程序代码直接升级为多端应用（微信开发者工具->工具->升级为多端项目），升级时会提示到微信开发者平台上创建一个和当前小程序绑定的多端应用。

### 小程序升级为多端应用

点击「工具->升级为多端应用」按照提示进行操作即可。

* 升级成功后，可以在微信开发者工具右上角进行小程序模式和多端应用模式切换
* 可以选择部署到模拟器或真机，模拟器复用的是 xcode 以及 android 开发的模拟器
* 升级为多端应用后，需

### 多端应用微信云开发

如果小程序使用了微信云开发，转换为多端应用后，需要在 wx.cloud.init 中明确指定 appid 和 envid:

* [多端应用使用微信云开发][16]

如果要正常使用微信云开发的功能，多端应用还需要接入小程序登录或者微信登录，或者开启未登录用户访问权限。

### 多端应用使用小程序登陆

微信一共有三个管理后台：

* [微信公众平台][6]：公众号、小程序的注册和管理。
* [微信开发者平台][7]: 感觉是管理微信生态内的各种类型应用的，多端应用的有些操作需要在这里进行，
* [微信开放平台][8]: 接入微信相关的能力，比如微信登陆等 

多端应用使用小程序登陆需要有在三个平台都进行操作：

1. 微信公众平台: 完成小程序
2. 微信开发者平台: 创建多端应用，并且和上面的小程序绑定（升级为多端应用时会自动完成）
3. 微信开放平台: 创建移动应用，然后回到微信开发者平台将多端应用将与其关联

微信开放平台中新创建的移动应用需要等1～7个工作日审核，我申请后一天就通过了。

然后按照 [快速接入小程序登录服务][9] 文档中操作就可以了。注意必须给多端应用绑定一个移动应用以后才可以正常跳转到微信小程序登陆。

### 多端应用使用微信登陆

>**`特别注意`**：    
>微信登陆返回的 token 的校验用接口： [code2Verifyinfo][12] (使用多端应用的 appid 和 secret）     
>小程序登陆返回的 token 的校验用接口：[code2session][13]   (使用小程序的 appid 和 secret )

先到 [微信开放平台][8] 中，给多端应用绑定的移动应用开通微信登录接口权限（能力专区->微信登陆）。个人开发者就可以开通，但是有调用次数限制(好像是每天20次），如果要接触限制需要用非个人身份注册账号并完成认证。

![微信登陆接口权限开通]({{ site.article }}/wxlogin.png)

然后将小程序中使用 [微信登陆][9] 中的登录方法即可，可以用多端应用支持的[条件编译][11]在小程序平台和移动端app使用不同的登录方法：

>微信登陆接口的权限开通以后，可能需要等一段时间才能生效，未生效的时候跳转到微信时会提示：此公众号没有这些scope权限，错误码：10005

```js
// #if MP
wx.login({
  success: res => {
    ObtainUserTokenPromise(res.code).then((res)=>{
      console.log("new token: ",res.data.jwtToken)
    }).catch((err)=>{
      reject(err)
    })
  }
})
// #else
wx.weixinAppLogin({
  success: res => {
    ObtainUserTokenPromise(res.code).then((res)=>{
      console.log("new token: ",res.data.jwtToken)
    }).catch((err)=>{
      reject(err)
    })
  }
})
// #endif
```

## 微信云开发

微信云开发提供了类似 firebae 的云函数、云数据库、云存储等。基础支持都有了，但是工具生态不如 firebase 完整，比如登陆方式就是微信，本地模拟环境不完整（只支持云函数本地运行）。但是也够用了。

微信云开发，通过微信开发者工具右侧的云开发按钮点开管理面板：

![打开云开发环境面板]({{ site.article }}/open-cloud-env.png)

### 指定云环境

通过指定不同的云环境进行开发数据、线上数据的隔离。如果当前小程序尚未发布，可以创建一个在开发期免费的云环境。开发期免费的云环境只支持一个，如果需要更多个云环境就需要购买了。

![创建免费的云开发环境]({{ site.article }}/create-free-env.png)

```
为更好地助力小程序开发者高效开发，云开发推出开发阶段免费体验活动，具体细则如下：

自 2025 年 2 月 19 日起，每个没有云环境或云环境已注销超过 1 个月的小程序账号，可创建一个免费云环境；
免费云环境在小程序未发布上线阶段，无需开发者续费；
小程序发布上线后，免费云环境将转为付费环境，在下一云环境续费周期生效。具体付费信息将提前通过微信公众平台、腾讯云等渠道下发通知，开发者需留意并自行处理；
此活动时间截止到 2026 年 12 月 31 日，如有调整将提前 3 个月在微信开放社区及腾讯云官网进行通知。

https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/billing/price.html
```

可以在云开发管理面板中随时切换当前代码的发布、运行环境：

![切换当前代码的运行环境]({{ site.article }}/switch-cloud-env.png)

微信云开发的云环境和腾讯云的 CloudBase 的云环境是直接对应的（微信云开发是构建在腾讯云 CloudBase 之上），所以除了在开发者工具上查看云环境资源情况，还可以登陆腾讯云查看: 选择微信公众号平台登录，然后微信扫码，选择目标应用。

腾讯云 CloudBase: [https://tcb.cloud.tencent.com/](https://tcb.cloud.tencent.com/)

![选择微信公众平台登陆]({{ site.article }}/tcb-cloud-env-login.png)


### 本地调试

目前只支持云函数本地调试，数据库和存储都是在云环境中的，本地调试时，云函数虽然是在本地执行，但是操作的资源还都是云环境中的。

在云函数目录上点击右键，然后选择开启本地调试：

![开启云函数本地调试]({{ site.article }}/cloud-function-debug.png)

### CloudBase-MCP 

腾讯的 CloudBase 提供 MCP：[CloudBase-MCP](https://github.com/TencentCloudBase/CloudBase-MCP?tab=readme-ov-file)。在 cursor 配置 mcp 之后，可以直接通过对话方式创建数据库、云函数上传等等。

```json
{
  "mcpServers": {
    "cloudbase": {
      "command": "npx",
      "args": ["@cloudbase/cloudbase-mcp@latest"]
    }
  }
}
```
CloudBase-MCP 提供给 AI 的是操作腾讯云中的云环境的方法，而不是操作本地微信开发者工具IDE，应该是不能在预览中操作小程序进行测试的。目前（2026/03/25) 有一些个人开发的自动化工具，关注度都比较低，可用性不确定，搜索微信开发者工具 MCP 可以看到。

### 微信开发者工具的调试功能

[小程序自动化][14]：微信官方提供的一个可以连接模拟器中小程序、模拟操作以及提取页面元素的 sdk。可以用它来编写 e2e 自动化测试。

[录制回放][15]: 将操作过程录制下来，然后可以进行回放测试。

## 微信云开发和腾讯云托管搭配使用

微信云开发的云函数每次执行最多只有 60s，超过 60s 会被直接终结。如果一个接口的处理耗时超过 60s，可以把这接口部署到云托管中。

这里需要下梳理一下「微信云开发」、「微信云托管」、「腾讯云开发」、「腾讯云托管」之间的关系。

* 微信云开发和微信云托管是微信提供的两套互不隶属的服务。
* 腾讯云开发是腾讯云提供的云开发服务，其中包含腾讯云托管。
* 微信云开发构建在腾讯云开发中，和腾讯云开发是一一对应的关系。通过小程序登录腾讯云开发后，可以腾讯云开发控制台看到微信云开发使用的云函数、文档数据库、云存储等等。
* 微信云托管构建腾讯云为微信提供的一个单独环境中，在腾讯云开发控制台看不到微信云托管的资源，需要通过微信云托管单独的控制台操作。

微信云托管技术上是构建在腾讯云开发中，但是它是一套独立环境，在腾讯云开发的控制台中看不到微信云托管中的内容，它们的环境是隔离的。[云托管的收费方式][18] 中提到：

```
  云托管如今在两个不同环境中提供服务：
  - 微信云托管
  - 云开发中的云托管
```

微信云托管有独立的控制台：[微信云托管控制台][19]，而且微信云托管控制台中看到的资源和微信云开发中看到的资源是不一样的。因为它们分别位于不同的腾讯开发环境，微信云托管中使用的资源和微信云开发中使用的也不是同一个。有点搞不懂微信是怎么想的，怎么搞了一个和微信云开发、腾讯云 Cloudbase 都独立的微信云托管。

经过反复权衡，我感觉在应用没有太多访问量早期，用微信云开发实现低耗时接口，然后用腾讯云云托管实现高耗时接口比较合适。因为这样就可以在腾讯云开发控制台中同时管理所有用到资源，资源之间的互通也更自然。

### 腾讯云托管访问微信云开发资源

直接在腾讯云开发中创建，可以通过模版创建，也可以直接配置代码库通过代码库创建

* [腾讯云托管使用文档][20]: 本质就是打包成成一个 docker 镜像。

腾讯云托管内访问微信云开发中的资源（也就是同一个腾讯云开发中的资源），目前腾讯云官方主要提供的是 [js sdk][21]，这套 sdk 可以在客户端使用也可以在服务端使用：[js sdk 的服务端接口][22]。

最简单的鉴权配置方式是在腾讯云托管控制台为目标的服务配置 api 鉴权：（这个api key权限拥有管理员权限，能访问腾讯云开发所有资源）

![配置 api 鉴权 ]({{ site.article }}/cloudrun-api-key.png)

开启之后， 云托管启动的容器的环境变量中会包含 api key，js sdk 自动读取，不需要在代码里指定。

本地开发环境配置下面的变量以后（可以从腾讯云托管实例内部获取），也能直接访问腾讯云开发的资源：

```bash
CLOUDBASE_APIKEY_ID=XXX 
CLOUDBASE_APIKEY=XXX
```

### 从微信云函数调用腾讯云托管接口

原则上在腾讯云函数中是可以直接使用 [js sdk][22] 访问腾讯云托管接口的，但是在实测中发现微信开发者工具中本地调试的 node 环境和 js sdk 似乎存在不匹配，存在 fetch is not defined 的问题。已经被宣布不再维护的 [node sdk][23] 反而可以工作。

但是比较奇怪的是通过 node sdk 发送的请求，使用的 path 中增加了一个前缀（目标托管服务的名称），而且腾讯云函数中通过 node sdk 发送的请求不会包含微信鉴权相关的信息。

### 从微信小程序调用腾云托管接口

这个是腾讯云托管直接支持的：[微信小程序调用腾讯云托管][24]。

上面的文档中腾讯云托管暂时不支持直接获取微信用户信息（微信云托管可以），但是实测发现后端收到的请求头包含相关信息。

### 问题记录

#### 在 ios 模拟器中运行时，编译生成的是 x86 文件，app 无法运行

m3 版本的 macbook，微信开发者工具在 ios 模拟器中运行多端应用时，似乎默认构建成 x86 架构的文件（没有找到修改的地方），在 ios 模拟器中运行不了。没找到直接了当的解决方法， 还好连接真机是可以的。

## 腾讯云的 CloudBase（放弃）

腾讯云的 CloudBase（下称 tcb） 从设计上看是最能对标 firebase 的，多种登陆注册方式、云函数、文档数据库等等。现在只有上海区可用，免费计划可以使用 6 个月。

它的 apple 账号原生登陆我没有调通。

>apple 规定如果 app 使用了第三方登陆那么必须支持 apple 账号的原生登陆，所以这个支持很重要。

tcb 的文档上写的是支持第三方令牌登陆（[auth.signInWithIdToken][3]），但是我把 apple 原生登陆获得的 token 传入后，总是返回 kid not found。apple 原生方式生成的token 是用 Apple 官方的密钥签署的， jwt token 中的 kid 明明就在 appple 公布的证书列表汇总。不知道 tcb 怎么会找不到。

tcb 后台中开启apple 账号登陆配置中，要求传入 client id 等。这些按理是在非 apple 原生登陆方式时才需要的。按照 [tcb Apple 登录][2] 中进行配置以后，使用 apple 令牌登陆还是不行。tcb 后台还有一个 web 登陆页，我试了一下也不通。

微信登陆，需要先去微信开放平台注册并完成认证。微信开放平台又不支持个人认证，而且认证一次 300元，每年都要重新认证一下。没有尝试

直接放弃了，不在这浪费时间。

>其实微信云开发使用的就是 CloudBase，微信云开发包装的更好用了，直接就能用微信小程序/微信登陆。


## 参考

1. [李佶澳的博客][1]
2. [tcb Apple 登录][2]
3. [快速接入小程序登录服务"][8]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://docs.cloudbase.net/authentication-v2/method/apple-login "tcb Apple 登录"
[3]: https://docs.cloudbase.net/api-reference/flutter/#signinwithidtoken "tcb signInWithIdToken"
[4]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/intro/intro.html "小程序多端框架概述"
[5]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/quickstart/auth.html "多端应用使用小程序登陆"
[6]: https://mp.weixin.qq.com/cgi-bin/loginpage "微信公众平台"
[7]: https://developers.weixin.qq.com/platform "微信开发者平台"
[8]: https://open.weixin.qq.com/ "微信开放平台"
[9]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/quickstart/auth.html "快速接入小程序登录服务"
[10]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/api/auth/wx.weixinAppLogin.html "微信登陆"
[11]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/pre-read/condition-compile.html "条件编译"
[12]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/openapi/code2 "code2Verifyinfo"
[13]: https://developers.weixin.qq.com/miniprogram/dev/server/API/user-login/ "小程序登录接口列表"
[14]: https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/quick-start.html "小程序自动化"
[15]: https://developers.weixin.qq.com/miniprogram/dev/devtools/auto/record.html "录制回放"
[16]: https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/quick-start/framework.html "多端应用使用微信云开发"
[17]: https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/ "微信云托管"
[18]: https://docs.cloudbase.net/run/faq/fee "云托管的收费方式"
[19]: https://cloud.weixin.qq.com/cloudrun/console "微信云托管控制台"
[20]: https://docs.cloudbase.net/run/quick-start/introduce "腾讯云托管使用文档"
[21]: https://docs.cloudbase.net/api-reference/webv3/initialization "js sdk"
[22]: https://docs.cloudbase.net/api-reference/webv3/server "js sdk 服务端接口"
[23]: https://docs.cloudbase.net/api-reference/server/node-sdk/cloudrun "node sdk"
[24]: https://docs.cloudbase.net/run/develop/access/mini "微信小程序调用腾讯云托管"