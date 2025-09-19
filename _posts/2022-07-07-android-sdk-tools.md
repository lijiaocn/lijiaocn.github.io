---
layout: default
title: "Android：SDK 安装和使用"
author: 李佶澳
date: "2022-07-07 10:56:44 +0800"
last_modified_at: "2023-11-28 14:27:26 +0800"
categories: 编程
cover:
tags: android
keywords: android,android sdk
description: 简单了解下 Android SDK 提供的工具，为下一步自动化操作移动端应用、采集应用内数据做技术储备。
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

简单了解下 Android SDK 提供的工具，为下一步自动化操作移动端应用、采集应用内数据做储备。主要是为准备 appium 的运行环境， [The UiAutomator2 Driver for Android][4]。

## Android SDK 安装

最简单快捷的安装方法下载安装 [Android Studio][2]，Google 提供的 Android 集成开发环境，自带 Android SDK 和图形管理界面。 

Tools->SDK Manager 打开下面的管理界面：

![Android Studio SDK Manager]({{ site.article }}/android-sdk-tool.png)

可以看到 sdk 安装到了目录 /Users/lijiaocn/Library/Android/sdk 中。

## Android SDK 目录

顶层目录结构如下，主要工具命令位于 platform-tools 和 tools，比如管理模拟器和真实设备的 adb 命令在 platform-tools 中。

```sh
➜  sdk tree -L 1 .
.
├── build-tools
├── emulator
├── fonts
├── licenses
├── ndk
├── ndk-bundle
├── patcher
├── platform-tools
├── platforms
├── skins
├── sources
├── system-images
└── tools

13 directories, 0 files
```

platforms 目录中存放不同版本的 android 的 api，通过 Tools->AVD Manger 添加虚拟设备以及下载不同版本的 android api：

```sh
➜  sdk ls platforms
android-29 android-30 android-31
```

build-tools 是不同版本的构建工具：

```sh
➜  build-tools ls
29.0.2 30.0.2 31.0.0
```

## Android SDK tool 

工具命令的用途见 [Android SDK 命令行工具][3]，了解 Android Studio 整体功能阅读 [Android Studio][2]。

adb 管理本地已启动的模拟器和本地连接的真实设备：

```sh
$ ./platform-tools/adb  devices -l
List of devices attached
emulator-5554          device product:sdk_gphone_x86 model:Android_SDK_built_for_x86 device:generic_x86 transport_id:4
```

## 参考

1. [李佶澳的博客][1]
2. [Android Studio][2]
3. [Android SDK 命令行工具][3]
4. [The UiAutomator2 Driver for Android][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developer.android.com/studio/intro "Android Studio 文档"
[3]: https://developer.android.com/studio/command-line "命令行工具"
[4]: https://appium.io/docs/en/drivers/android-uiautomator2/index.html "The UiAutomator2 Driver for Android"
