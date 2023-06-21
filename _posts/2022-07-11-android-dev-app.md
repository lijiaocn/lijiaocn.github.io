---
layout: default
title: "Android apk 文件解压缩与内容读取方法"
author: 李佶澳
date: "2022-07-11 11:48:19 +0800"
last_modified_at: "2023-05-08 14:15:10 +0800"
categories: 编程
cover:
tags: android
keywords: Android,AndroidManifest.xml
description: Android App 由 AndroidManifest.xml、组件实现代码、资源文件组件，均位于 app/src/main 目录中
---

## 目录

* auto-gen TOC:
{:toc}

## Apk 文件解压缩

Apk 是 Android 应用使用的文件格式，它实际上是一个 zip 压缩包，可以直接用 tar 命令解压：

```sh
tar -xvf app-debug.apk
```

```sh
✗ tree -L 1
.
├── AndroidManifest.xml
├── DebugProbesKt.bin
├── META-INF
├── classes.dex
├── classes2.dex
├── classes3.dex
├── classes4.dex
├── kotlin
├── res
└── resources.arsc

3 directories, 7 files
```

## 读取 AndroidManifest.xml 

tar 解压缩得到的 AndroidManifest.xml 是一个二进制文件，不是直接可读的文本文件，格式是 Android 自行实现的 [Binary XML][5]，不是 xml 通用的二进制的格式，没用标准的解读工具。

```sh
Android application package uses an undocumented binary XML format.[5]
```

### 用 axmldex 解读

[axmldec: Android Binary XML Decoder][6] 解读 AndroidManifest.xml：

```sh
brew tap ytsutano/toolbox
brew install axmldec
```

将二进制格式的 AndroidManifest.xml 转换成文本格式：

```sh
axmldec -o output.xml AndroidManifest.xml
```

### 用 apktool 解读

[apktool][8] 是 apk 修改器，能够将 apk 文件反向解析，然后将其重新打包成 apk 文件，为修改闭源的第三方 apk 提供了方便。

```sh
brew install apktool
```

apktool 会将整个 apk 文件反向解析：

```sh
apktool d app-debug.apk
```

## 参考

1. [李佶澳的博客][1]
2. [Android 开发者指南][2]
3. [Android Studio 开发Android应用][3]
4. [App Manifest Overview][4]
5. [Binary XML][5]
6. [axmldec: Android Binary XML Decoder][6]
7. [在AVD_7.1_x86 emulator上安装微信][7]
8. [apktool][8]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developer.android.com/guide "Android 开发者指南"
[3]: https://developer.android.com/studio/write "Android Studio 开发Android应用"
[4]: https://developer.android.com/guide/topics/manifest/manifest-intro "App Manifest Overview"
[5]: https://en.wikipedia.org/wiki/Binary_XML "Binary XML"
[6]: https://github.com/ytsutano/axmldec "axmldec: Android Binary XML Decoder"
[7]: https://blog.imlk.top/posts/wechat-in-avd-7-1-x86/   "在AVD_7.1_x86 emulator上安装微信"
[8]: https://ibotpeaches.github.io/Apktool/ "apktool"
