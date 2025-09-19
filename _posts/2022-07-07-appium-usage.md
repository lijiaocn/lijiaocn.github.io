---
layout: default
title: "Appium：安装和使用"
author: 李佶澳
date: "2022-07-07 15:24:12 +0800"
last_modified_at: "2023-11-28 14:28:59 +0800"
categories: 编程
cover:
tags: appium
keywords:  Appium Android
description: 通过 appium 的 http api 可以模拟人工操作 android/ios/windows 上的应用
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

[Appium][2] 是一个提供了 http api 自动化测试工具，通过 appium 的 http api 可以模拟人工操作 android/ios/windows 上的应用。

## Appium 服务安装

Appium 主体是一个 Node.js 开发的服务，可以用 npm 安装，或者下载带有图形界面的安装包 [appium server gui][5]：

```sh
npm install -g appium
```

也可以通过 brew 安装：

```sh
brew install appium            # 安装
brew services restart appium   # 启动 appium 服务
```

appium 启动后只作为一个后台 server 存在，默认端口 4723，没有管理界面（appium serer gui 只是提供了配置和启停界面）。appium 接收各种语言的 client 发送来的请求去驱动设备或模拟器中的应用。

## Appium Driver 环境配置

Appium 通过各种各样的 Driver 实现对不同平台上的应用操控，[Appium Getting Started][3] 中列出可以的 Driver：

```sh
The XCUITest Driver (for iOS and tvOS apps)
The Espresso Driver (for Android apps)
The UiAutomator2 Driver (for Android apps)
The Windows Driver (for Windows Desktop apps)
The Mac Driver (for Mac Desktop apps)
```

使用 Driver 前需要完成相关的环境配置。

###  UiAutomator2 环境配置

UiAutomator2 能够驱动 Android 上的 app： [The UiAutomator2 Driver for Android][4]。
需要本地安装有 java8、android sdk、android sdk build tool 版本不小于 24。

配置环境变量 JAVA_HOME，指向 java 的安装路径：

```sh
export JAVA_HOME="`/usr/libexec/java_home -v 1.8`"  # 根据实际情况配置
```

配置环境变量 ANDROID_HOME，指向 Android SDK 安装路径，Andorid SDK 安装方法见 [Android SDK 安装目录以及相关文件说明][6]：

```sh
export ANDROID_HOME="/Users/lijiaocn/Library/Android/sdk"
```

配置完成后，用 appium-doctor 检测下环境：

```sh
$ npm install -g appium-doctor
$ appium-doctor  --android   # 检查 android 环境是否设置正确
```

## 准备 Client Library

Apppium 主体是 http 服务，操作指令要用 Client Library 发送，[List of client libraries with Appium server support][8]：

Appium 官方支持的语言：

```
Ruby            https://github.com/appium/ruby_lib, https://github.com/appium/ruby_lib_core
Python          https://github.com/appium/python-client
Java            https://github.com/appium/java-client
C# (.NET)       https://github.com/appium/appium-dotnet-driver
```

社区维护的 Client：

```
JavaScript (Node.js)          https://github.com/webdriverio/webdriverio
JavaScript (Browser)          https://github.com/projectxyzio/web2driver
RobotFramework                https://github.com/serhatbolsu/robotframework-appiumlibrary
```

### webdriverio （Node.js)

创建一个 node.js 项目，安装 webdriverio：

```sh
npm init -y 
npm install webdriverio
```

启动本地模拟器（Android Studio->Tools->SDK Manager）后，用 adb 命令获取到模拟器名称 emulator-5554：

```sh
➜  $ANDROID_HOME/platform-tools/adb devices -l
List of devices attached
emulator-5554          device product:sdk_gphone_x86 model:Android_SDK_built_for_x86 device:generic_x86 transport_id:2
```

用 aapt 解析出 appPackage（com.example.android_01_first_proj）和 appActivity（com.example.android_01_first_proj.MainActivity）：

```sh
➜ $ANDROID_HOME/build-tools/29.0.2/aapt dump badging /tmp/app-debug.apk |grep package
package: name='com.example.android_01_first_proj' versionCode='1' versionName='1.0' compileSdkVersion='31' compileSdkVersionCodename='12'

➜ $ANDROID_HOME/build-tools/29.0.2/aapt dump badging /tmp/app-debug.apk |grep launchable-activity
launchable-activity: name='com.example.android_01_first_proj.MainActivity'  label='android-01-first-proj' icon=''
```

在代码中指定：


```js
const wdio = require("webdriverio");
const assert = require("assert");

const opts = {
    path: '/wd/hub', /*appium 接口路径*/
    port: 4723,      /*appium 端口*/
    capabilities: {
        platformName: "Android",          /*目标系统*/
        platformVersion: "10",            /*目标系统版本*/
        deviceName: "emulator-5554",      /*adb管理的模拟器/设备名称*/
        app: __dirname+"/app-debug.apk",  /*安装到目标设备的应用文件*/
        appPackage: "com.example.android_01_first_proj",                 /*目标 app 的包名*/    
        appActivity: "com.example.android_01_first_proj.MainActivity",   /*目标 app 的登陆Activity*/    
        automationName: "UiAutomator2"  /*驱动类型*/
    }
};

async function main () {
    const client = await wdio.remote(opts);     /*建立session*/

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    readline.question('Press any key to exit', name => {
        console.log(`${name}!`);
        readline.close();
        client.deleteSession();    /*释放session*/
    });

}

main();
```

### python-client

```sh
pip install Appium-Python-Client 
```

## 参考

1. [李佶澳的博客][1]
2. [Appium介绍][2]
3. [Appium Getting Started][3]
4. [The UiAutomator2 Driver for Android][4]
5. [appium release][5]
6. [Android SDK 安装目录以及相关文件说明][6]
7. [appium + python 基于windows 平台][7]
8. [List of client libraries with Appium server support][8]
9. [移动端爬虫工具与方法介绍][9]
10. [Python + Appium 自动化操作微信入门看这一篇就够了][10]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://appium.io/docs/cn/about-appium/intro/ "Appium介绍" 
[3]: https://appium.io/docs/en/about-appium/getting-started/index.html "Appium Getting Started"
[4]: https://appium.io/docs/en/drivers/android-uiautomator2/index.html "The UiAutomator2 Driver for Android"
[5]: https://github.com/appium/appium-desktop/releases "appium release"
[6]: https://www.lijiaocn.com/%E7%BC%96%E7%A8%8B/2022/07/07/android-sdk-tools.html "Android SDK 安装目录以及相关文件说明"
[7]: https://www.cnblogs.com/shenh/p/11758917.html "appium + python 基于windows 平台"
[8]: https://appium.io/docs/en/about-appium/appium-clients/index.html "List of client libraries with Appium server support"
[9]: https://www.cnblogs.com/163yun/p/9681061.html "移动端爬虫工具与方法介绍"
[10]: https://blog.csdn.net/ityard/article/details/109498443 "Python + Appium 自动化操作微信入门看这一篇就够了"
