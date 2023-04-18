---
layout: default
title: "Android 开发环境搭建，模拟器以及设备上运行"
author: 李佶澳
date: "2022-04-30 18:30:39 +0800"
last_modified_at: "2023-04-18 14:23:18 +0800"
categories: 编程
cover:
tags: Android 
keywords: android,移动应用开发
description: AndroidStudio的File->NewProject创建BasicActivity，选择Java/Kotlin语言、最小的sdk版本
---

## 目录

* auto-gen TOC:
{:toc}

## 创建项目

通过 Android Studio 的 File->New Project 创建一个 Basic Activity，选择 Java 或者 Kotlin 语言，选择最小的 sdk  版本。

* [Build Your First Android App in Java][4]。
* [Build Your First Android App in Kotlin][6]
* [Create XML layouts for Android][7]

## 项目目录

项目中有两个 build.gradle 文件：一个位于项目根目录，另一个位于 app 目录中。

![Android Studio目录结构]({{ site.article }}/android-studio-proj1.png)

源代码目录主要是 app/src/main，在 Android Studio 的左侧面板中看到目录树的根是 app/src/main。

```sh
➜  01-first-proj git:(main) ✗ ls app/src/main   
AndroidManifest.xml java res
```

其中 AndroidManifest.xml 是对 app 内各组件的描述，android runtime 读取该文件。 

java 目录中是 app 的源代码。res 目录中是 app 使用的资源文件，包括以下子目录：

* drawable 存放图片
* layout 存放每个交互界面的 UI 布局
* menu 存放 app 中的菜单
* mipmap 存放 app 的图标
* navigation 存放交互界面的切换顺讯
* values 存放颜色、字符串等自定义资源

### AndroidManifest.xml 

[App manifest overview][10] 介绍了 AndroidManifest.xml 的用途和支持的配置项。

* AndroidManifest.xml 位于项目根目录且名称固定，提供了构建相关的信息
* 声明 app 包含的组件 activity、service、broadcast receiver、content provider
* 声明 app 需要的权限
* 声明 app 需要的硬件和软件限制

### Layouts xml

* [Create XML layouts for Android][7]

## 用模拟器运行

通过 Android Studio 的 Tools -> AVD Manager 安装本地安卓模拟器，然后就可以用运行按钮启动：

![Android Studio运行本地安卓模拟器]({{ site.article }}/android-studio-run1.png)

## 用物理设备运行

进入 android 手机的开发者设置，打开 USB 调试，将手机脸上电脑上，在 Android Studio 中就可以看到增加的设备，选择并运行即可。

![Android Studio设备上运行]({{ site.article }}/adroid-studio-run2.png)

## 应用架构

App component 加载顺序是不确定的，而且可能会被随时销毁，不能在 app component 中存放数据。

>it's possible for your app components to be launched individually and out-of-order, and the operating system or user can destroy them at any time. Because these events aren't under your control, you shouldn't store or keep in memory any application data or state in your app components, and your app components shouldn't depend on each other.

[Guide to app architectur][5] 给出以下架构原则：

* 代码按功能分离，不要都写在 activity 和 fragment 中。Activity 和 Fragment 是连接 Android OS 和 App 的 glue classes，操作系统的会在需要的将其销毁，要尽可能减少对其 Activity 和 Fragment 的依赖。
* Data model 和 UI 等组件分离且持久化。
* 每个数据都有唯一的出处(SSOT, single source of truth)，且只能通过 SSOT 提供的方法修改。
* 数据保持单向流动，application data 从 data sources 流向 UI，操作事件从 UI 流向数据的唯一出处。

### 推荐的应用架构

三层架构：UI Layer -> Domain Layer(optional) -> Data Layer。

![Android 推荐应用架构]({{ site.article }}/mad-arch-overview.png)


## 参考

1. [李佶澳的博客][1]
2. [Android][2]
3. [Android开发课][3]
4. [Build Your First Android App in Java][4]
5. [Guide to app architectur][5]
6. [Build Your First Android App in Kotlin][6]
7. [Create XML layouts for Android][7]
8. [Android Basics in Kotlin][8]
9. [Modern Android App Architecture][9]
10. [App manifest overview][10]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.android.com/ "Android"
[3]: https://developer.android.com/courses "Android开发课"
[4]: https://developer.android.com/codelabs/build-your-first-android-app#2 "Build Your First Android App in Java"
[5]: https://developer.android.com/topic/architecture?hl=en "Guide to app architectur"
[6]: https://developer.android.com/codelabs/build-your-first-android-app-kotlin "Build Your First Android App in Kotlin"
[7]: https://developer.android.com/codelabs/basic-android-kotlin-training-xml-layouts#0 "Create XML layouts for Android"
[8]: https://developer.android.com/courses/android-basics-kotlin/course "Android Basics in Kotlin"
[9]: https://developer.android.com/courses/pathways/android-architecture "Modern Android App Architecture"
[10]: https://developer.android.com/guide/topics/manifest/manifest-intro "App manifest overview"
