---
layout: default
title: "ios app 开发中遇到的问题记录"
author: 李佶澳
categories: [solo-income]
tags: [独立赚钱日记]
keywords: 
description: 记录 ios app 开发过程中遇到一些问题，或者一定功能开通、使用方法。比如 xcode 使用中的问题，不同开发环境的问题，内购商品的创建以及沙盒环境支付等
---

## 目录

* auto-gen TOC:
{:toc}

## Add Package 增加 firebase sdk 依赖后，依然提示找不到 module

按照 firebase 的文档在 add package 中添加 firebase sdk 以后，在应用入口处初始化 firebase。 IDE 报错找不到 firebasecore 模块。

在 add package 的操作的最后阶段，还需要一步操作，在 Add To Target 中选中当前 Target，默认是不添加到 target 的。

![add to target]({{ site.article }}/xcode-add-package.png)

## 针对 Debug 和 Release 使用不同的配置文件

后端有两个 firebase 项目，一个用于开发环境，一个用于线上正式环境。每个 firebase project 有各自 GoogleService-Info.plist 文件，但是 ios app 代码中只能有一个。

用 run script 脚本解决

* 把两个 plist 文件分别用不同的名字存放在项目外的目录。
* target->Build Phases 中添加 Run Script，构建的时候复制对应的 plist 文件

```bash
#!/bin/bash
# 严格模式：遇到任何非零退出状态 (即错误) 时立即终止脚本
set -e

PLIST_DESTINATION="${SRCROOT}/demoproject/"
PLIST_NAME="GoogleService-Info.plist"
case "${CONFIGURATION}" in
    "Debug" | "Development" | "Debug (Development)")
        CONFIG_FILE_NAME="GoogleService-Info-Dev.plist"
        ;;
    "Staging")
        CONFIG_FILE_NAME="GoogleService-Info-Staging.plist"
        ;;
    "Release" | "Production" | "Release (Production)")
        CONFIG_FILE_NAME="GoogleService-Info-Prod.plist"
        ;;
    *)
        echo "ERROR: Unknown build configuration: ${CONFIGURATION}"
        exit 1 # 无法识别配置，立即退出
        ;;
esac

# 源文件路径：假设文件位于 $SRCROOT
PLIST_SOURCE="${SRCROOT}/${CONFIG_FILE_NAME}"
echo "Source File Path: ${PLIST_SOURCE}"

# 检查源文件是否存在
if [ ! -f "${PLIST_SOURCE}" ]; then
    echo "🚨 ERROR: Source Firebase config file NOT FOUND! Expected at: ${PLIST_SOURCE}"
    exit 1
fi

echo "Attempting to copy from ${PLIST_SOURCE} to ${PLIST_DESTINATION}/${PLIST_NAME}"
cp -f "${PLIST_SOURCE}" "${PLIST_DESTINATION}/${PLIST_NAME}"
echo "✅ SUCCESS: Configuration file copied successfully for configuration ${CONFIGURATION}"
```


还需要在 run script 配置界面的下方明确指定要复制的 input file 和要复制到的 output file：

![run script]({{ site.article }}/xcode-run-script.png)

否则会遇到类似下面的错误：

```
Operation not permitted...
Sandbox: cp(11494) deny(1) file-read-data
Sandbox: cp(11979) deny(1) file-write-create
```

## ios 设备上访问局域网中的 firebase emulator

在 firebase.json 中模拟器 host 指定为局域网可访问的地址：

```json
{
  "emulators": {
    "auth": {
      "host": "0.0.0.0",
      "port": 9099
    }
  }
}
```

然后在 ios app 中修改将 emualtor 的连接地址修改为 firebase emulator 服务的局域网地址。

```swift
class AppDelegate: NSObject, UIApplicationDelegate {
  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey : Any]? = nil) -> Bool {
    
    FirebaseApp.configure()
    
    // 在 debug 模式下连接本地 Firebase Emulator
    #if DEBUG
    setupEmulator()
    #endif

    return true
  }
  
  private func setupEmulator() {
    let emulatorHost = EmulatorConfig.host
    
    // 配置 Firebase Auth Emulator
    Auth.auth().useEmulator(withHost: emulatorHost, port: EmulatorConfig.authPort)
      
    // 配置 Firebase Functions Emulator
    Functions.functions().useEmulator(withHost: emulatorHost, port: EmulatorConfig.functionsPort)
    
    print("🔥 [App] Firebase Emulator configured: \(emulatorHost):\(EmulatorConfig.functionsPort)")
  }
}
```

最后在 info.plist 中添加下面的配置，否则 ios app 对局域网地址的访问会被阻止：

```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

## ios app 内测

在[appstoreconnect](https://appstoreconnect.apple.com/) 创建 app 后，可以先进行内测，内测试时不需要完成所有资料填写。

创建 app 的时候需要指定 bundle identifier，和 xcode Target 中的保持一致。

用 xcode 直接上传：

* Product->Achrive 

## 配置使用 apple id 登录

>如果只在 ios 平台上支持 apple id 登录，不需要过多设置，启用相关能力即可：

![xcode 添加 Sign in with Apple]({{ site.article}}/xcode-add-signin.png)

如果还要在 android 等平台或者网页上支持 apple id 登录，需要进行额外配置， [Authenticate Using Apple][2]，具体需要执行下面的操作。

* 在 identifiers 中对应的 apple id 中开启 apple sign in。

![App Ids]({{ site.article }}/appids.png)

![Enable Sign In With Apple]({{ site.article }}/enalbesingin.png)

* 按照 [Configure Sign in with Apple for the web](https://developer.apple.com/help/account/capabilities/configure-sign-in-with-apple-for-the-web) 中的说明创建 Service，并进入 Service ID 中启用 Sign In With Apple。在 Configure 中选中目标应用以及填入对应的 firebase 项目的域名和回调地址：

![eanble service id sign in with apple]({{ site.article }}/enableserviceid.png )

![add url]({{ site.article }}/addurl.png)

* 最后再 [Create a Sign in with Apple private key](https://developer.apple.com/help/account/capabilities/create-a-sign-in-with-apple-private-key/)

## 应用内购买

### 开发环境的本地商品

开发阶段可以直接使用本地模拟商品，点击 File-> File From Template 选择 StoreKit Configuration File，然后在选择一个位置创建文件。这个文件的实际存放位置可以位于 ios 项目目录之外，xcode 中会自动创建引用。然后在 Xcode 中点击新创建的 config 文件，可以用图形界面下，点击左下角的 + 号，手动添加商品 (创建文件的时候不要勾选自动同步)。

然后在 scheme -> Run -> Option 中启用 Storekit Configuration 选中创建的配置文件，然后就可以在本地环境下直接查询展示购买商品。

* 注意正式打包的时候需要去掉，否则正式 app 就是无法购买。可以创建两个 scheme 一个用于本地开发，一个用于发布。

### 生产环境的本地商品

首先需要提供资料以及完成一系列协议签署，否则即使创建了商品， ios 端也获取不到：

* 在 appstoreconnect->商务 中签署付费 App 协议，
* 如果要在欧洲地区分发，需要签署数字服务法，需要提供地址证明
* 签署付费协议
* 添加银行账号
* 提交报税表

在 appstore connect 中配置，在目标应用左侧的 app 内购买项目中创建商品。填充需要的信息，是商品状态变成准备提交状态。注意本地化也是必须设置的，否则会提示元数据缺失，可以先只设置主区域的本地化。

然后还需要创建沙盒账号，只有沙盒账号才可以访问草稿状态的商品。沙盒账号需要使用真实的有效，否则在设备上添加沙盒账号时会收不到验证码。可以使用 gmail 的 「账号+后缀@gmail.com」邮箱，一个账号可以模拟出多个邮箱，比如 xxx+bbb@gamil.com，将会发送到 xxx@gmail.com。

* 在 用户和访问->沙盒 中创建沙盒账号。
* 在手机上添加沙盒账号：设置->开发者->沙盒账号。

如果先创建的商品后签署协议，可能存在一定的同步延迟，最多可能需要等 24 小时。能够看到商品列表后，就可以在手机上直接购买，支付页面下方会显示只是测试。

### 购买过程处理

apple 的应用内购买是先买后验模式:

* 用户在 ios 端完成购买后，app 里需要有一段代码把订单 ID 发送到服务端
* 服务端调用 appstore 的接口获取订单信息，验证订单，完成相应的商品处理
* apple 提供了用于请求的官方库 @apple/app-store-server-library，调用的时候需要设置密钥（密钥在 appstore connect 中创建）
* 需要在 appstore connect 配置退款时的回调 url，回调 url 的处理逻辑中需要用 apple 公钥进行校验

密钥创建操作：用户和访问->集成。

apple 根证书下载：[https://www.apple.com/certificat](https://www.apple.com/certificat)

安全起见，使用的密钥不要写在代码中，放到 secret manager 中， firebase 支持和 gcloud  secret manager 联通。

## 国内备案

阿里云上直接可以进行国内备案，按照网页提示填写相关内容即可，唯一有点费劲的是 ios 平台还需要提交一个公钥。备案需要提交的公钥，不是开发者公钥而是发布公钥。将 app 提交到 app store 审核时，会用发布证书对 app 进行重新签署，审核需要的时发布时签署的证书的公钥。本地 debug 模式、本地运行时使用的 app 包使用开发者证书签署的。开发者证书和发布证书不是一回事。

在 [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/certificates/list) 中列出的是存放于云端的证书。TYPE 	Development 是开发者，	Distribution Managed 是云端托管的发布证书。

云端托管发布证书的概念： 开发设备本地不存放发布证书，xcode 项目中通常都是勾选了自动签名的选项，在 archive->distribute 提交 app 时，xcode 会用云端托管的发布证书进行签署。这种情况下需要用 Distribution Managed 的公钥进行备案。

developer 网站上 Distribution Managed 证书的 download 是不可用的，没法直接下载。可以从 app 包中解析出来。

在 archive 的结果页面中（windows->organizer）中选择一个 archive 结果，点击 distribute app -> Custom -> App Store Connect -> Export(选择导出文件) -> 默认 -> Automatically manage signing -> Export。

然后进入到 export 导出到目录中，将 .ipa 文件解压：

1. 将 .ipa 文件后缀改成 .zip，直接用 unzip 解压
2. 在解压得到的 payload 文件中找到 embedded.mobileprovision
3. 添加 embedded.mobileprovision 中 DeveloperCertificates 后面的 base64 文本 （注意如果不是通过 distritube export 得到的 .ipa 文件，那么这个内容会是开发者证书公钥，必须从 distritube export 的 .ipa 文件中获得的才是发布证书公钥）
4. 把 base64 文件复制出来然后用 base64 解码保存为一个 .cer 文件
5. 再用 openssl 命令将 .cer 文件转换为 .pem 格式，输出的内容就是公钥：

```bash
openssl x509 -inform der -in ./cert.cer -out cert.pem
```

注意 embedded.mobileprovision 有可能还有多个证书，用任何一个证书都可以，但是备案是提交的公钥匙和SHA1要匹配。

sha1签名是对 cer 格式文件的处理结果，直接用 sha1 命令获得。在 finder 中直接查看  embedded.mobileprovision 文件也能看到

xcode 中还可以设置本地证书，在 Xcode -> Apple Account -> Manage Cert.. 中可以用 + 新创建 Distribute 证书。在这里创建的证书会保存到本地 keychain（同时也会出现的 developer 网站上）。如果本地有 distribute 证书，xcode 进行 distriube 的时候会使用本地证书。显然用本地证书不如直接用云端托管的证书。

## 构建版本-缺少出口合规证明

用 xcode 上传以后，在 TestFlight 中显示版本缺少出口合规证明，这主要是需要声明使用的加密算法。可以在 appstore connect 网页上手动指定，也可以在代码里一劳永逸的声明 App Uses Non-Exempt Encryption  为 false。

```
<dict>
	<key>ITSAppUsesNonExemptEncryption</key>
	<false/>
</dict>
```

## 参考

1. [李佶澳的博客][1]
2. [Authenticate Using Apple][2]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://firebase.google.com/docs/auth/ios/apple?authuser=0&_gl=1*1ql6ary*_ga*MTQxNDY5MTY1OS4xNzYxNzkxNjkw*_ga_CW55HF8NVT*czE3NjY1NDE2NjEkbzMzJGcxJHQxNzY2NTQyNTQyJGo2MCRsMCRoMA.. "Authenticate Using Apple"
