---
layout: default
title: "微信小程序多端应用+微信云开发，平替 flutter & firebase"
author: 李佶澳
categories: [solo-income]
tags: [独立赚钱日记]
keywords: 
description: firebase 太好用了，唯一的问题就是在国内用不了，需要找个国内的平替。微信小程序的多端应用+微信云开发是一个好的选择。
---

## 目录

* auto-gen TOC:
{:toc}

## 背景

firebase 在国内用不了，需要找个国内的平替。尝试用微信小程序的多端应用+微信云开发平替 flutter 和 firebase。

* [小程序多端框架概述][4] 能把小程序直接转成 ios/android/鸿蒙应用，支持微信登陆和 apple 原生登陆。
* 微信云开发底层就是腾讯云的 cloudbase

微信一共有三个管理平台，分别用来管理不同形态的业务，后面会在这几个后台里跳转：

* [微信**公众**平台][6]：管理公众号、小程序。
* [微信**开放**平台][8]: 管理要集成微信能力（比如微信登录/微信支付）的独立应用或网站等。 
* [微信**开发者**平台][7]: 管理微信生态内的各种类型应用的，多端应用在这里管理。

还没有解决的问题(多端应用是个成熟方案么，有点疑虑了)：

* 接入 apple 登录时，多端应用后台保存 apple key 弹系统错误
* 微信小程序升级为多端应用后，虚拟支付接口出错：requestVirtualPayment: fail createOperateWXData: fail SDK 暂不支持 operateWXData API。如果不能直接复用小程序里的购买代码，用的多端应用意义似乎不大了

## 小程序转换成多端应用

现有的小程序代码能够升级为多端应用（微信开发者工具->工具->升级为多端项目），按照提示进行操作即可，升级时会提示到微信开发者平台上创建一个和当前小程序绑定的多端应用。

升级成功后可以进行以下操作：

1. 在微信开发者工具右上角进行小程序模式和多端应用模式之间切换，
2. 切换到多端模式后，开发者工具右上角出现 andoird/ios 等设备选项（复用 xcode/android studio 中的设备）

此时就可以用开发者工具在模拟器上或真机上部署多端应用。如果运行失败可能是以下原因：

1. 当选择本地模拟器时，mac 上的微信开发者工具默认构建的可能是 x86 架构的 app（没找到解决方法）
2. 选择在真机运行时，需要用数据线连接手机

但是此时部署到模拟器或真机上的多端应用，可能还无法正常运行，还需要有一系列的处理。

## 多端应用的开发配置

多端应用的 Bundle ID 或者 PackageName 在管理后台配置：[微信**开发者**平台][7]->我的业务和服务->多端应用。但是正如下面图片中的提示，如果需要使用微信的能力，则必须绑定 [微信**开放**平台][8] 里的移动应用。

![移动应用信息配置1]({{ site.article }}/bundleconfig.png)

通常情况下，多端应用需要按下面步骤绑定一个移动应用(除非对应的小程序完全不使用微信的能力,比如 wx.login)。
完成绑定后，多端应用的开发配置操作要到[微信**开放**平台平台][8]中进行，比如 [多端应用包名配置][28]。

绑定操作：

* 登录 [微信开放平台][8] 创建移动应用，ios/andorid 等开发配置可以先不配置
* 然后在 [微信开发者平台][7] 找到已经创建的多端应用，和开放平台中的移动应用绑定

微信多端应用也要按照 andoird/ios 平台分布构建安装包，以及把安装包发布到应用商店。因此 app 发布需要的事项，多端应用都需要。
首先要设置安装文件的包名以及签名证书：

### android 开发配置

android 版本需要在[微信开放平台][8]中配置应用包名和应用签名。

![android应用开发配置]({{ site.article }}/android-app-config.png)

包名按需要填写即可，多端应用构建时会自动使用后台配置的包名（[多端应用包名配置][28]）。

应用签名通过下面的几个步骤生成（[生成微信开放平台移动应用 Android 签名][29]）：

* [生成 Android 签名证书][30]：在开发者工具的设备选择下拉列表中，点签名证书管理->Android签名证书生成，按提示输入名称/设定密码，在指定路径生成一个 keystore 文件
* 导入 Android 签名证书：在开发者工具的设备选择下拉列表中，选择签名证书管理->Android签名证书管理，导入上一步生成的证书文件。
* 构建 Android app：在开发者工具中指定 android 设备，构建得到 apk 文件（构建信息里最后显示 apk 文件所在路径）
* 获得 Android 签名和公钥：签名证书管理->Andorid签名与公钥，选中 apk 文件，得到签名和公钥

微信开放平台上要求填的这个签名实质上是签名证书的 md5 值，只要签名证书没换就一直有效，应用代码改动不影响这个签名。也可以用下面命令获取 md5 值：

```bash
# 从 keystore 文件中导出二进制格式的公钥 test.cer：
keytool -exportcert -alias 证书别名 -keystore test.keystore -file test.cer  
# 二进制格式公钥的 md5 值就是微信开放平台要求填写的应用签名
md5 test.cer
# 查看公钥
openssl x509 -in test.cer -inform DER -noout -pubkey
```

### ios 开发配置

ios 版本需要配置 Bundle ID 和 Universal Links。

![ioS应用配置]({{ site.article }}/ios-app-config.png)

Bundle ID 按需要填写就可，多端应用构建时会自动使用。

Universal Links 需要两步操作：

* 规划应用使用的 Universal Links 路径并后台填入，比如 https://www.abc.com/links/app1/
* 把 AASA 文件放到网址: https://www.abc.com/.well-known/apple-app-site-association

AASA 文件的路径必须是直接在域名后面，中间不能再有其它路径，这是 apple 约定的获取方式。
AASA 文件中需要配置 path 和 appid 的对应关系：

```bash
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TeamID.BundleID",   //用TeamID和BundleID拼接
      "paths": ["/links/app1/*"]    //必须包含Universal Link的path
    }]
  }
}
```

多端应用使用微信小程序/微信登录的时候，用微信开放平台中配置的 Universal Link 返回 App，并且会在后面附加一些传入参数。因此 AASA 文件中的 paths 需要带有通配符，能覆盖追加了参数的 Universal Link 。

AASA 文件未配置或者配置错误，ios 版本的微信小程序/微信登录时可能会失败：从多端应用能够跳转到微信，并且能在授权页中授权，授权后能够返回到多端应用，但是多端应用中的 wx.login 执行失败，错误信息是“wx.getMiniProgramCode fail: -700000.系统登录页登录失败”，多端应用没有获得登录态。

**ios 应用的开发和发布证书**

ios 应用不需要在微信开发者平台上配置证书信息，需要用另外的方式设置开发和发布的签署证书。
最简单的做法是 [iOS 证书自动管理][32]，让微信开发者工具使用 App Store Connect 的 API 自动管理证书：

* 打开 App Store Connect 后台，进入用户和访问->集成，创建 App Store Connect API 的访问密钥
* 回到项目的 project.miniapp.json，在其中配置 Apple Connect 的访问密钥（`密钥文件需要在多端项目中`）

在构建 ios 版本时，勾选自动管理功能：

![微信开发者工具 ios 证书自动管理]({{ site.article }}/wechat-ios-auto-sign.png)

构建过程中自动创建的证书，在苹果开发者后台可见：

![apple developer certs]({{ site.article }}/apple-dev-cert.png)

手动设置也是可以的，就是比较繁琐，因为 apple 的证书设置本身就比较繁琐（[iOS 证书申请与配置][31]）:

* 证书不能是自签署，必须在 [apple developer certificates][33] 中提交签署请求
* 只有证书不行，还需要一个包含证书、AppId、Device 等对应关系的 profile
* 证书分为开发、发布等不同类型，至少需要准备两套

可能是为了简化繁琐的操作过程，Apple 提供了证书自动管理功能，比如在 xcode 勾选自动管理后，开发者不需要处理各个阶段的证书、profile 等，xcode 自动处理了。微信开发者工具不能像 xcode 那样登录 apple 账号，要配置 api key 然后调用 api 实现证书自动管理。

![xcode自动签署功能]({{ site.article }}/xcode-auto-signing.png)

xcode 自动管理使用的`发布证书`存放在 apple 云端，没有下载证书公钥和指纹的途径。如果需要发布证书的公钥和指纹（比如国内备案），只能从构建好的 ipk 文件解析。apple 如果在云端更新了发布证书，备案里提交的证书会和实际证书不一致。

```bash
unzip -q XXXX.ipa
APP=$(find Payload -maxdepth 2 -name '*.app' -type d | head -1)
codesign -d --extract-certificates "$APP"

#可能会得到多个证书文件，codesign0 通常是最后的签名证书，从中提取公钥和指纹：

# 证书公钥
openssl x509 -inform DER -in codesign0 -pubkey -noout
# 证书 SHA-1 指纹
openssl x509 -inform DER -in codesign0 -noout -fingerprint -sha1
```

微信开发者工具通过 api 创建的发布证书是可以下载的。Distribution Managed 类型证书是托管在 Apple 云端的证书，没有下载途径，xcode 的自动签署使用的是此类证书。而微信开发者工具构建 ios 版本时，使用的常规的 Distribution 证书，可以从 apple 开发者后台下载。

![苹果开发者发布证书]({{ site.article }}/apple-dev-certs.png)


## 多端应用的构建和发布

多端应用支持 ios、android 和鸿蒙，一套代码可以构建出适配三个平台的安装包。

### ios 版本构建、部署、发布

用下面方法构建多端应用的 ipa 文件：`必选勾选远程构建，本地构建的 ipa 文件在 iphone 上闪退`

* 开发者工具右上角的构建（锤子图案）-> 打包生成 IPA -> 勾选`远程构建`，构建结束后得到 ipa 文件 
* Mac 安装 Apple Configurator，识别到用数据线连接到电脑的 iphone
* 在 Configurator 进入目标手机，然后点 + -> App -> Choose from My Mac，选中 ipa 文件

Configurator 安装完成后，就可以在 iphone 上使用刚安装的 app。

**注意构建界面中的选项**：

* 是否采用分发证书，要提交到 app store 到 ipa 构建，需要选择分发证书
* 选择打包类型：正式版、开发版、开发版（远程调试）、开发版（热更新）

此外，微信开发者工具因为不支持 ios26 系统，无法直接在 ios 模拟器和真机上部署开发版。现阶段只能通过远程构建 ipa 然后手动部署到 ios 设备的方式。[多端应用在iOS26真机运行时出现闪退，怎么办？][34]。

正式版的 ipk 文件发布到的 appstore 

**get valid profile fail **

构建 iOS 版本构建时，勾选证书自动管理可能遇到下面的问题:

![get valid profile fail]({{ site.article }}/getvalidprofilefail.png)

从错误信息来看是没有开启 APPLE_ID_AUTH。进入 apple developer -> Identifiers，给对应的 appid 开通 Sign In With Apple。

![开通 sign-in-with-apple]({{ site.article }}/sign-in-with-apple.png)

比较奇怪的是在 apple developer 勾选以后 sign in with apple 后，开发者工具中还是会出现这个错误。先把 project.miniapp.json 中的 Idaas SDK 关闭，再进入构建界面选择证书（此时不会出错），然后再把 Idaas SDK 打开，再次回到构建界面就不会出错，并且远程构建的 ipa 能够正常使用第三方登录。 

![idaas-sdk]({{ site.article }}/idaas-sdk.png)

### android 版本构建、部署、发布

开发阶段，直接在开发者工具中选择目标 andorid 设备，然后点运行即可。

对外发布时，构建->打包生成 APK，确认签署证书，然后点确定即可。

## 多端应用的远程调试

在 project.miniapp.json 中启用 Network SDK，然后构建的时候选择：开发版（远程调试）。

## 多端应用的云开发初始化和配置

如果使用了微信云开发，升级为多端应用后，需要进行一些细微调整：[多端应用使用微信云开发][16]

**cloud.init 中指定对应的小程序 appid**

如果不指定，开发者工具控制台会报错误信息：“多端模式下使用云开发，wx.cloud.init 需要传入 appid, 具体可参考文档 https://dev.weixin.qq.com/docs/framework/dev/cloud”。

```js
   wx.cloud.init({
      ...
      appid: 'xxx' //对应小程序的appid
    });
```

**如果使用了云函数，需配置函数访问权限**

如果存在不需要登录就可以访问的云函数，需要额外配置云函数权限：([多端应用使用微信云开发][16])
否则请求云函数时会报错错误信息，“cloud.callFunction:fail Error: errCode: -501023 permission denied | errMsg: Unauthenticated access is denied 更多错误信息请访问：https://docs.cloudbase.net/error-code/basic/PERMISSION_DENIED ”

1. 在云开发环境的设置中将云函数设置为允许未登陆用户访问
2. 然后再到云函数权限中修改自定义规则，允许匿名调用


## 多端应用接入小程序登录

不改动代码就可以接入小程序登录，登录页面都可以不添加，因为多端应用对微信小程序登录进行了特殊处理：

* 处理1：将代码中的 wx.login 自动适配成多端应用 API wx.getMiniProgramCode 
* 处理2：wx.getMiniProgramCode 返回的 code 可以像小程序的 code 那样用 [code2session][13] 校验
* 处理3：为小程序登录提供了默认的登录页面

代码可以不改，但是还需要进行一些配置操作 [快速接入小程序登录服务][9]：

1. 完成微信开放平台的账号认证(个人开发者可以不认证)，否则小程序登录页时会显示: has_no_permission；
2. 登录 [微信开发者平台][7]，进入多端应用-身份管理，开通微信小程序登录
3. 微信开发者工具：打开项目里的 project.miniapp.json，勾选 OpenSDK（android/ios都需要勾选）;
4. 微信开发者工具：工具->配置小程序登录服务，点击后按提示操作即可。

最后一步跳转到网页 [Donut控制台][26]（不知道这又是个啥控制台），按页面提示输入就可以了。回到开发者工具会看到提示配置已经完成。 app.json 和 app.miniapp.json 中多出下面的配置：

```json
//app.json

"miniApp": {
  "useAuthorizePage": true    //把小程序授权页内置到小程序中（不占用小程序代码包大小）
}

//app.miniapp.json

"identityServiceConfig": {
  "authorizeMiniprogramType": 1,         //小程序版本，1开发版，2体验版，0正式版，
  "miniprogramLoginPath": "__default__", //__defalut__是donut内置的登录页，可以更换为自定义页面
  "adaptWxLogin": true                   //将 wx.login 适配为 wx.getMiniProgramCode
}
```

多端应用中的 wx.login（被适配为 wx.getMiniProgramCode ）执行时，先判断是否处于登录状态，如果不是登录状态就唤起 miniprogramLoginPath 指定的页面请求登录授权([快速接入小程序登录][9])。授权成功后，wx.getMiniProgramCode 返回的 code 可以被小程序的 [code2session][13] 接口校验。在不修改小程序前后端的情况下，就适配了小程序登录。

如果对内置的默认登录页不满意，可以配置指向自定义的小程序页面。在定义登录页中，用 wx.weixinMiniProgramLogin 唤起小程序，授权成功后 wx.weixinMiniProgramLogin 返回 code。经测试，这是一个可以用[code2session][13] 校验的code，所以使用自定义登录页时，小程序服务端代码也不需要调整。

## 多端应用接入第三方登录

多端应用接入第三方登录（[支持的登录方式][27]）时，使用[多端应用的身份管理 API][36]（和 [微信小程序 API][37] 是两套）。
里面的 API 大体可以分为两类。

第一类 API 和小程序的 wx.login 对应，这类 API 执行过程唤起第三方 APP 或者发送登录信息，但是最终都像 wx.login 那样在登录成功后返回登录凭证（code)。

* wx.weixinAppLogin  微信登录
* wx.weixinMiniProgramLogin 微信小程序登录
* wx.phoneSmsLogin 手机号验证码登录
* wx.appleLogin Apple账号登录

第二类 API 分别和小程序的 wx.checkSession、wx.login 对应，用于检查登录态、在登录态时获取登录凭证（小程序在登录状态时获取登录凭证也用 wx.login)。

* wx.checkIdentitySession  检查当前是否登录状态
* wx.getIdentityCode  获取登录凭证（处于登录状态时）
* wx.getMiniProgramCode 获取小程序的登录凭证（只适用于微信小程序登录成功的场景）

多端应用 API 返回的登录凭证，和小程序里 wx.login 返回的登录凭证是不同的，服务端要用不同的接口校验：

* [code2Verifyinfo][12]：校验多端应用 API 返回的 code，接口使用时指定多端应用的 appid 和 secret
* [code2session][13]：校验小程序的 wx.login 返回的 code，接口使用时指定小程序的 appid 和 secret

### 接入微信登录 

微信登录用多端应用的 wx.weixinAppLogin 唤起，这个接口返回的 code 的校验方式和小程序不一样。而且云开发服务端的 cloud.getWXContext() 读不到微信登录时的 openid。接入微信登录时，前后端代码都需要改造：

* 增加微信登录入口，用多端应用 wx.weixinAppLogin 唤起微信登录
* 服务端必须用 [code2Verifyinfo][12] 校验 code 获得用户信息（解析小程序用 code 的 [code2session][13] 无法识别）
* 设计一套鉴权机制，比如请求云开发时，携带登录时下发的 webtoken，云开发服务端解析 webtoken 鉴权

除了改造代码，还需要完成以下设置：

* 在[微信开放平台][8]，给多端应用绑定的移动应用启用微信登录（企业账号认证后能开启，个人开发者账号有次数限制）
* 如果使用了微信云开发，将移动应用 appid 加入云开发的环境共享

**开通微信登录权限**

微信登陆接口的权限开通以后，可能需要等一段时间才能生效。
未生效的时候跳转到微信时会提示：“此公众号没有这些scope权限，错误码：10005”。

![微信登陆接口权限开通]({{ site.article }}/wxlogin.png)

**加入云开发环境共享**

将微信移动应用的 appid 加入云开发的环境共享后，多端应用才能调用对应云开发中的资源，否则会出现环境未授权错误。
被设置成匿名访问的云函数不受环境共享的影响，参考 [多端应用使用微信云开发][16]。

云开发的环境共享就是访问云开发的 appid 白名单，在云开发->设置->扩展功能->环境共享中添加。
接入微信登录时，在云开发环境共享添加的 appid 是微信开放平台中的移动应用的 appid（不是小程序的 appid，也不是多端应用的 appid）。

![云开发环境共享]({{ site.article }}/cloud-env-share.png)

**云开发环境共享后，需要改变调用方式**

启用如果使用了云开发时，改成用实例化的方式调用云开发，参考[多端应用使用云开发][38]。

### 小程序登录和微信登录用户的关联

小程序登录和微信登录是两套登录系统，同一个微信号用这两种方式登录得到的 openid 分别隶属于小程序和移动应用，是两个不同的 openid。但是从用户角度来看，通过微信小程序登录和微信登录，唤起的是同一个微信，应当是同一个用户。

小程序绑定移动开放平台后，[code2session][13] 会返回一个 unionid，这个 unionid 在两种登录方式中是相同的。后续若果使用微信登录，可以借助 unionid 实现小程序和微信登录用户的关联。

这个绑定在**开发者平台**操作，我的服务与业务->开放平台：

![小程序绑定开放平台]({{ site.article }}/wexin-unionid.png)

### 接入 Apple 登录

[多端应用接入 Apple 登录][39] 需要进行如下操作：

* 在苹果开发者后台的 Identifies 中，在多端应用对应的 appid 中开启 Sign in with Apple
* 在苹果开发者后台的 Keys 中，新建一个启用 Sing in with Apple 并绑定了多端应用 appid 的 key
* 在微信开发者平台，多端应用->身份管理->Apple登录中，填入刚创建的 key

按照文档操作最后保存的报错，这个问题25年就有人遇到了，等解决方案。[https://developers.weixin.qq.com/community/develop/doc/000acae6688768f87f3498f9866000?highLine=Apple%25E7%2599%25BB%25E5%25BD%2595](https://developers.weixin.qq.com/community/develop/doc/000acae6688768f87f3498f9866000?highLine=Apple%25E7%2599%25BB%25E5%25BD%2595)

多端应用是不是个试验品啊

## 多端应用的虚拟支付

升级为多端应用后，虚拟支付好像不能用了，虚拟支付的接口似乎没有适配多端应用。




## 微信云开发

微信云开发提供了类似 firebase 的云函数、云数据库、云存储等。基础支持都有了，但是工具生态不如 firebase 完整，比如登陆方式就是微信，本地模拟环境不完整（只支持云函数本地运行）。但是也够用了。

微信云开发，通过微信开发者工具右侧的云开发按钮点开管理面板：

![打开云开发环境面板]({{ site.article }}/open-cloud-env.png)

### 指定云环境

通过指定不同的云环境进行开发数据、线上数据的隔离。如果当前小程序尚未发布，可以创建一个在开发期免费的云环境。开发期免费的云环境只支持一个。[说明文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloud/billing/price.html)

```bash
为更好地助力小程序开发者高效开发，云开发推出开发阶段免费体验活动，具体细则如下：

自 2025 年 2 月 19 日起，每个没有云环境或云环境已注销超过 1 个月的小程序账号，可创建一个免费云环境；
免费云环境在小程序未发布上线阶段，无需开发者续费；
小程序发布上线后，免费云环境将转为付费环境，在下一云环境续费周期生效。
具体付费信息将提前通过微信公众平台、腾讯云等渠道下发通知，开发者需留意并自行处理；
此活动时间截止到 2026 年 12 月 31 日，如有调整将提前 3 个月在微信开放社区及腾讯云官网进行通知。

```

可以在云开发管理面板中随时切换当前代码的发布、运行环境：

![切换当前代码的运行环境]({{ site.article }}/switch-cloud-env.png)

微信云开发的云环境和腾讯云的 CloudBase 的云环境是直接对应的（微信云开发是构建在腾讯云 CloudBase 之上），所以除了在开发者工具上查看云环境资源情况，还可以登陆腾讯云 [CloudBase][25] 查看：选择微信公众号平台登录，然后微信扫码，选择目标应用。

![选择微信公众平台登陆]({{ site.article }}/tcb-cloud-env-login.png)


### 本地调试

目前只支持云函数本地调试，数据库和存储都是在云环境中的，本地调试时，云函数虽然是在本地执行，但是操作的资源还都是云环境中的。

* 在云函数目录上点击右键，然后选择开启本地调试

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

## 腾讯云托管解决云函数最长60s的问题

微信云函数使用的腾讯云函数实际支持执行900秒的，但是微信云开发的配置最大只能配置到60秒，微信云函数每次执行如果超过 60s会被直接终结。如果一个接口的处理耗时超过 60s，可以把这接口部署到腾讯云托管。

微信云开发、微信云托管、腾讯云开发、腾讯云托管的关系如下：

* 微信提供的服务：微信云开发、微信云托管，这两个中间没有关系，是两个独立服务。
* 腾讯云提供服务：腾讯云开发，其中包含腾讯云托管形态
* 微信云开发：对腾讯云开发的封装，一个微信云开发环境对应一个腾讯云开发环境，可以直接登录到底层腾讯云开发控制台进行操作（扫码登录）
* 微信云托管：底层也使用了腾讯云的服务，但是在一个单独环境中，腾讯云开发控制台看不到微信云托管的资源，只能在[微信云托管控制台][19]操作。

腾讯的[云托管的收费方式][18] 中提到：

```
  云托管如今在两个不同环境中提供服务：
  - 微信云托管
  - 云开发中的云托管
```
有点搞不懂微信是怎么想的，怎么搞了一个和微信云开发、腾讯云开发都独立的微信云托管。在应用没有太多访问量早期，用微信云开发实现低耗时接口，然后用腾讯云托管实现高耗时接口比较合适。因为这样就可以在腾讯云开发的控制台中同时管理所有用到资源，资源之间也能互通。

### 腾讯云托管访问微信云开发资源

直接在腾讯云开发中创建，可以通过模版创建，也可以直接配置代码库通过代码库创建

* [腾讯云托管使用文档][20]: 本质就是打包成成一个 docker 镜像。

腾讯云托管能够访问对应的微信云开发资源，使用腾讯云提供的 [js sdk][21]，可以在客户端使用也可以在服务端使用（[js sdk 的服务端接口][22])。这套 sdk 自动从环境变量读取 api key 用于鉴权。

最简单的鉴权配置方式：在腾讯云托管控制台配置 api key。配置完成之后，云托管启动的容器的环境变量中会包含 api key，js sdk 自动读取，不需要在代码里指定。

![配置 api 鉴权 ]({{ site.article }}/cloudrun-api-key.png)


本地开发环境配置下面的变量以后（从腾讯云托管实例内部获取，控制台只能在首次创建时获得Key的内容），本地能直接访问：

```bash
CLOUDBASE_APIKEY_ID=XXX 
CLOUDBASE_APIKEY=XXX
```

### 从微信云函数调用腾讯云托管接口

腾讯云函数应该是可以使用 [js sdk][22] 访问腾讯云托管接口的，但是在实测中发现微信开发者工具的本地 node 环境和 js sdk 似乎存在不匹配，存在 fetch is not defined 的问题，已经被宣布不再维护的 [node sdk][23] 反而可以工作。

而 node sdk 也有一个奇怪的地方，它发出请求时在 path 中增加了一个前缀（目标托管服务的名称），此外腾讯云函数中通过 node sdk 发送的请求不会包含微信鉴权相关的信息。

### 从微信小程序调用腾云托管接口

这个是腾讯云托管直接支持的：[微信小程序调用腾讯云托管][24]。

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
[12]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/openapi/code2Verifyinfo "code2Verifyinfo"
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
[25]: https://tcb.cloud.tencent.com/ "https://tcb.cloud.tencent.com/"
[26]: https://dev.weixin.qq.com/console "Donut控制台"
[27]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/new-capability/auth/introduction.html "多端应用支持的登录方式"
[28]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/handbook/web/packagename-guide.html "多端应用包名配置"
[29]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/handbook/build/open_android_cert.html "生成微信开放平台移动应用 Android 签名"
[30]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/handbook/build/android-cert.html "生成 Android 签名证书"
[31]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/handbook/certificate/ios.html "iOS 证书申请与配置"
[32]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/handbook/certificate/ios-mgnt.html "iOS 证书自动管理"
[33]: https://developer.apple.com/account/resources/certificates/list "apple developer certificates"
[34]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/troubleshooting/dev.html#_12%E3%80%81-%E5%A4%9A%E7%AB%AF%E5%BA%94%E7%94%A8%E5%9C%A8iOS26%E7%9C%9F%E6%9C%BA%E8%BF%90%E8%A1%8C%E6%97%B6%E5%87%BA%E7%8E%B0%E9%97%AA%E9%80%80%EF%BC%8C%E6%80%8E%E4%B9%88%E5%8A%9E%EF%BC%9F "多端应用ios26闪退"
[35]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/api/auth/wx.weixinMiniProgramLogin.html "wx.weixinMiniProgramLogin"
[36]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/api/auth/wx.weixinAppLogin.html "多端应用的身份管理 API"
[37]: https://developers.weixin.qq.com/miniprogram/dev/api/ "微信小程序 API"
[38]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/new-capability/cloud/cloud.html "多端应用使用云开发"
[39]: https://developers.weixin.qq.com/miniprogram/dev/platform-capabilities/miniapp/api/auth/wx.appleLogin.html "多端应用接入 Apple 登录"
