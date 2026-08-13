---
layout: default
title: "flutter 的常规使用，一套代码适配多平台"
author: 李佶澳
categories: [solo-income,invest,project,resolution,problems,others]
tags: [独立赚钱日记]
keywords: 
description: 即使在 ai code 效果和成本都越来越好的情况，flutter 用一套代码完成 ios 和 android 两个平台应用的设计依旧能节省不少时间，比如不需要反复对齐两个平台的 ui 
---

## 目录

* auto-gen TOC:
{:toc}

## 在 vscode 中安装 flutter 

按照 [Set up and test drive Flutter][2] 中的说明进行操作。

通过命令行的 flutter doctor -v 查看本地环境存在的问题。

配置国内地址，否则指定在模拟器上运行的时候，可能会下载不了文件，一直处于 Flutter: Lauching ... 状态

```bash
export PUB_HOSTED_URL=https://pub.flutter-io.cn
export FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn
```

### 连接 anroid 模拟器

如果要启动 andorid 模拟器并运行应用，需要手动安装 android sdk 的 cmdline-tool。Android Studio 默认不会安装命令行工具：

```bash
1. 打开 Android Studio → 点击顶部菜单栏「Tools」→「SDK Manager」；
2. 在弹出的窗口中，选择「SDK Tools」标签页（顶部）；
3. 勾选「Android SDK Command-line Tools (latest)」（确保版本是最新）；
4. 点击「Apply」→「OK」，等待组件下载安装完成（需联网，大小约 100MB）。
```

### 连接 ios 模拟器

如果要启动 ios 模拟器并运行应用，需要手动将 xcode-select 指向完整的 xcode 开发目录：

```bash
$ xcode-select -p
/Library/Developer/CommandLineTools  # 不完整的，只包含基础命令行工具

# 切换到完整的Xcode开发者目录
$ sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

$ xcode-select -p
/Applications/Xcode.app/Contents/Developer
```

还需要安装 CocoaPods：

```bash
$ sudo gem install cocoapods
$ pod --version 
1.16.2  # 安装成功
```

## 新建 flutter 项目

shfit + cmd + p， 输入 flutter，选择 flutter: New Project

## 打包发布

### ios 应用构建以及提交

* 用 flutter build ipa 完成构建
* 安装 transporter 应用，用它将上一步构建的产物直接上传到 appstoreconnect（需要先在 appstoreconnect 中完成应用创建）
* 或者用 xocde 打开项目下的 ios/runner 目录，在 xcode 中重新 product->archive 然后提交

### android 应用构建以及提交

* android 应用要构建可以提交到 play 的产物，需要先配置上传证书。 
* 证书配置完成后，用 flutter build appbundle 构建
* 在 play 网页中直接上传构建产物

#### android 上传证书设置

andorid/app/build.gradle.kts 中为默认为 release 指定的 debug 证书签名，需要生成一个上传密钥，然后构建出的 bundle 文件才能被 google play 接受。

andorid/app/build.gradle.kts 中默认用的是 debug：
```bash
    buildTypes {
        release {
            // TODO: Add your own signing config for the release build.
            // Signing with the debug keys for now, so `flutter run --release` works.
            signingConfig = signingConfigs.getByName("debug")
        }
    }
```

新作一个上传密钥：
```bash
keytool -genkeypair -v \
  -keystore ~/google-play-upload-keystore.jks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload
```

回到 andorid/app/build.gradle.kts 中，添加新的签名证书，信息和证书生成时用保持一致：

```bash
signingConfigs {
    create("release") {
        keyAlias = "upload"
        keyPassword = "xxx"
        storeFile = file("/Users/xxx/google-play-upload-keystore.jks")
        storePassword = "xxx"
    }
}

buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
    }
}
```

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://docs.flutter.dev/install/quick "Set up and test drive Flutter"