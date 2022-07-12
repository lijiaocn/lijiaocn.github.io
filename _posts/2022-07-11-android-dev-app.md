---
layout: default
title: "Android App 的构成成分以及 apk 文件解读方法"
author: 李佶澳
date: "2022-07-11 11:48:19 +0800"
last_modified_at: "2022-07-11 18:35:15 +0800"
categories: 编程
cover:
tags: Android
keywords: Android,AndroidManifest.xml
description: Android App 由 AndroidManifest.xml、组件实现代码、资源文件组件，均位于 app/src/main 目录中
---

## 目录

* auto-gen TOC:
{:toc}

## Android App 的构成

Android App 由三部分组成：AndroidManifest.xml、组件代码、资源文件。均位于 Andorid 项目的 app/src/main 目录中。

### AndroidManifest.xml

AndroidManifest.xml 是 xml 格式的应用描述文件，指定了应用的代码，定义了应用基本信息（图标、权限、最低适用Android版本等），索引了使用的所有组件。

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.example.android_01_first_proj">             <-- 使用的代码 package

    <application
        android:allowBackup="true"                           <-- 应用基本信息
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.Android01firstproj">
        <activity                                            <-- 使用的 activity 组件
            android:name=".MainActivity"                        <-- 对应的代码是 「package」.MainActivity
            android:exported="true"
            android:label="@string/app_name"
            android:theme="@style/Theme.Android01firstproj.NoActionBar">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />

                <category android:name="android.intent.category.LAUNCHER" />    <-- Activity 是 app 启动的首页，即  app 运行入口 
            </intent-filter>
        </activity>
    </application>

</manifest>
```

AndroidManifest.xml 文件的名称`不可更改`，编译工具通过 AndroidManifest.xml 收录需要编译打包的代码和文件。

详细说明见 [App Manifest Overview][4]。

### 组件代码

Andorid 应用的全部功能由构成 app 的一堆组件提供，组件类型一共有四种，分别是：Activity、Service、Receiver、Provider。

下面是四种类型的组件在 AndroidManifest.xml 的声明标签，[App Manifest Overview][4] 的列出了所有可配置项：

```xml
<activity> 
<service>
<receiver>
<provider>
```

组件代码位于 app/src/main/java 目录中。

### 资源文件 

Android 应用的代码和资源文件是分开存放，app/src/main/res 中存放的是资源文件，资源文件保存布局/layout、菜单/menu、数值/value、图片等等。

AndroidManifest.xml 和组件代码通过资源的唯一 ID 引用资源，布局/layout 资源通过资源文件中的 tools:context 和组件关联。


```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">       <-- 应用于.MainActivity 的布局/layout
    ....
</androidx.coordinatorlayout.widget.CoordinatorLayout>
```

## Apk 文件解读方法

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

### Apk 的 AndroidManifest.xml 

tar 解压缩得到的 AndroidManifest.xml 是一个二进制文件，不是直接可读的文本文件。这个二进制文件是 Android 自行实现的，不是 xml 通用的二进制的格式，[Binary XML][5]，没用标准的解读工具。

```sh
Android application package uses an undocumented binary XML format.[5]
```

#### 用 axmldex 解读

[axmldec: Android Binary XML Decoder][6] 解读 AndroidManifest.xml：

```sh
brew tap ytsutano/toolbox
brew install axmldec
```

将二进制格式的 AndroidManifest.xml 转换成文本格式：

```sh
axmldec -o output.xml AndroidManifest.xml
```


#### 用 apktool 解读

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
