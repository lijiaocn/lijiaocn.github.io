---
layout: default
title: "Android开发环境搭建，模拟器以及设备上运行"
author: 李佶澳
date: "2022-04-30 18:30:39 +0800"
last_modified_at: "2022-04-30 19:35:24 +0800"
categories: 编程
cover:
tags: android 
keywords: android,移动应用开发
description: AndroidStudio的File->NewProject创建BasicActivity，选择Java/Kotlin语言、最小的sdk版本
---

## 本篇目录

* auto-gen TOC:
{:toc}

## 说明

## 第一个 Android 项目

学习资料：[Build Your First Android App in Java][4]。

通过 Android Studio 的 File->New Project 创建一个 Basic Activity，选择 Java 或者 Kotlin 语言，选择最小的 sdk  版本。

### 项目目录

项目目录说明：源代码核心目录是 app/src/main，在 Android Studio 的左侧面板中看到目录树的根是 app/src/main。

```sh
➜  01-first-proj git:(main) ✗ ls app/src/main   
AndroidManifest.xml java                res
```

![Android Studio目录结构]({{ site.article }})/android-studio-proj1.png)

manifests/AndroidManifest.xml 是对 app 内各组件的描述，android runtime 读取该文件。 

java 目录中是 app 的源代码。

res 目录中是 app 使用的资源文件，其中：

* drawable 存放图片
* layout 存放每个交互界面的 UI 布局
* menu 存放 app 中的菜单
* mipmap 存放 app 的图标
* navigation 存放交互界面的切换顺讯
* values 存放颜色、字符串等自定义资源

### 模拟器运行

通过 Android Studio 的 Tools -> AVD Manager 安装本地安卓模拟器，然后就可以用运行按钮启动：

![Android Studio运行本地安卓模拟器]({{ site.article }}/android-studio-run1.png)

### 设备上运行

进入 android 手机的开发者设置，打开 USB 调试，将手机脸上电脑上，在 Android Studio 中就可以看到增加的设备，选择并运行即可。

![Android Studio设备上运行]({{ site.article }}/adroid-studio-run2.png)


## 参考

1. [李佶澳的博客][1]
2. [Android][2]
3. [Android开发课][3]
4. [Build Your First Android App in Java][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://www.android.com/ "Android"
[3]: https://developer.android.com/courses "Android开发课"
[4]: https://developer.android.com/codelabs/build-your-first-android-app#2 "Build Your First Android App in Java"
