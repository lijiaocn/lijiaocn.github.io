---
layout: default
title: "一个最简 APP 开发和发布"
categories: "solo-income"
author: 李佶澳
tags: [独立赚钱]
keywords: 独立赚钱
description: 完成一个功能最简单的 app，发布到 App Store 和 Google Play。通过这个过程把需要的账号等都准备完成，为之后主力应用的发布铺好路。
---

## 目录

* auto-gen TOC:
{:toc}

## 目标

完成一个功能最简单的 app，发布到 App Store 和 Google Play。通过这个过程把需要的账号等都准备完成，为之后主力应用的发布铺好路。

## APP 开发

用 Gemini-cli 和 Cursor 分别完成 Android 版本和 ios 版本的开发，用两个不同的 AI 主要是为了感受下两者的能力高低。 AI 完成开发以后，人还需要学习下代码，理清代码结构和运行过程，确保代码是人在掌控。

## 开通移动广告账号

admob 是移动端广告展示，和 web 端的广告平台 adsense 都是 Google 的服务，但是两个账号不通用，需要分别开通。admob 账号开通以后，在里面创建一个应用，不同设备端需要分别创建应用，比如 ios 端和 adroind 端的 app 需要对应 admob 中的两个应用。然后在每个应用中创建将来用于在 app 中展示的广告单元。

App 中植入广告的方式，Google 在文档中都说清楚了。借助 AI 可以加速这一过程，把广告单元 ID 告知 AI 由 AI 负责完成加载。Google 文档中提供了专门用于测试的广告单元 ID，模拟器上能够加载展示测试广告单元。

### android 植入 Admod 广告

[导入 Google 移动广告 SDK](https://developers.google.com/admob/android/quick-start?hl=zh-cn) 和添加广告：

* 在 settings.gradle.kts 中添加依赖仓库
* 在 module 级别的 build.gradle.kts 中添加 ads sdk
* 添加后点击 Sync 加载
* 在 AndroidManifest.xml 中录入在 Admod 中创建的应用 id

然后就可以在代码里初始化sdk，以及在合适位置广告单元.如果要把测试广告单元和正式广告区分开，可以在 build.gradle.kts 中启用 buildConfig，在 debug 和 release 中分别定义不同的广告单元 ID：

```kotlin
android {
    ....
    buildTypes {
        debug {
            buildConfigField("String", "ADMOB_BANNER_AD_UNIT_ID", "\"ca-app-pub-3940256099942544/9214589741\"")
        }
        release {
            ....
            buildConfigField("String", "ADMOB_BANNER_AD_UNIT_ID", "\"ca-app-pub-8176866190626448/4336615346\"")
        }
    }
    buildFeatures {
        ....
        buildConfig = true   //设置为true
        ....
    }
}
```

### ios 植入 AdMod 广告 tips

[导入 Google 移动广告 SDK](https://developers.google.com/admob/ios/quick-start?hl=zh-CN#import_the_mobile_ads_sdk)大部分操作文档中讲解的比较清楚了，SKAdNetworkItems 设置方式如下：

* 在 xcode 的左侧点击项目名称中，在 Info tab 中添加新的 key: GADApplicationIdentifier
* 项目中会出现名为 Info.plist 文件，可以在这个文件中直接添加完整的 SKAdNetworkItems。 

按照接入文档中的做法添加依赖包，然后直接让 AI 在指定位置植入广告。ios 用下面的方式分别加载测试广告单员和正式的广告单元：

```swift
// 从 Info.plist 读取广告ID
#if DEBUG
bannerView.adUnitID = Bundle.main.object(forInfoDictionaryKey: "AdMobBannerTestUnitID") as? String 
#else
bannerView.adUnitID = Bundle.main.object(forInfoDictionaryKey: "AdMobBannerUnitID") as? String 
#endif
```

## 开发者账号注册

Google Play 和 Apple 的开发者身份类型分为个人和公司。个人开发者身份会在应用信息中显示个人姓名，个人承担法律责任。公司身份注册则展示的公司名称，可能会让人感觉更有保证。但是用公司身份注册，收入要先进入公司然后再转到个人，收入低的时候会有比较大的损耗。早期还是直接以个人身份注册。如果收入超过一定水平，比如达到个税收入的高税率区间，这时候可以考虑再用公司身份注册，把个人账号中的 app 直接转让给公司账号。

![个人身份和公司身份收款差异]({{ site.article}}/duns-money.png)

### 个人开发者注册

Google Play 直接按照提示注册就可以了，需要上传身份证明文件和地址证明文件，审核需要几天时间，注册时一次缴费25美金。

* [Google Play 账号注册](https://play.google.com/apps/publish/signup)

Apple 开发者在 Developer APP 上进行注册，每年支付 688 元费用，注册之后要等收到邮件才生效。

* [apple 开发者注册过程](https://developer.apple.com/cn/help/account/membership/enrolling-in-the-app/)

### 公司邓白氏编码申请

使用公司身份注册时需要为注册公司申请D-U-N-S 邓白氏编码。邓白氏编码可以[免费申请][2]，申请入口有三个。对于应用开发者而言最方便的两个免费渠道是 Apple 和 Google。Apple 和 Google 的申请过程、时效是不同的。Apple 全免费需 5 个工作日，Google 全免费需要 30 个工作日，但是可以付费成 1 个工作日。

![邓白氏编码的三个申请入口]({{site.article }}/duns-entry.png)

点击苹果业务申请进入的是 apple 的页面 [D-U-N-S® Number][3]，按下面步骤操作：

* 在页面的下方有一行提交申请的小字，也可以先查询然后未找到页面中提交申请
* 提交之后会收到邓白氏的邮件，然后按照邓白氏的邮件指示操作
* 第一封邮件是当天就收到的受理通知
* 第二封需要1～2个工作日后收到包含验证码的操作邮件

![苹果开发者duns申请入口]({{ site.article }}/duns-apple-entry.png)

![提交申请]({{ site.article }}/apple-duns-submit.png)

点击 Google 业务进入的是[邓白氏自助服务平台][4]：

* 填写公司信息、完成公司核验
* 自助平台上直接点邓白氏编码申请会弹出添加客服的提示，联系客服沟通发现，其实就是需要进入这个网址申请：[https://www.dnbportal.cn/apply-specific-duns-number][5]
* 申请页面下方有场景选择，选择不同场景进入不同的申请通道，如果选 apple 开发者进入的就是需要提供 apple 生成的订单号和验证码信息的页面，如果选择 google 进入的就是另一套可以选择1个工作日完结的通道
* `注意：不要同时办理两个通道！只要有一个通道完成就可了，两个通道同时办理反而容易信息混乱。`

![邓白氏alert]({{ site.article }}/duns-alert.png)

![申请页面场景选择]({{ site.article }}/duns-apply-scene.png)

## 应用发布

### ios 应用发布

* 到 [app store connect](https://appstoreconnect.apple.com/) 网站上创建应用
* 创建应用的时候填写 bundler id 和代码里的一致
* 需要准备应用的支持网页和推广网页
* 在 xcode 中配置证书签署自动管理
* 通过 archive 打包把编译产物提交到 app store connect


## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.dnb.com.cn/duns-registered-solution/duns-application-cn.html "邓白氏"
[3]: https://developer.apple.com/support/D-U-N-S/ "apple duns support"
[4]: https://www.dnbportal.cn/ "邓白氏自助服务平台"
[5]: https://www.dnbportal.cn/apply-specific-duns-number "dnus 自助申请页面"