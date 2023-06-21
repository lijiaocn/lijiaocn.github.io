---
layout: default
title: "Android 声明式 UI 开发工具 JetPack Compose"
author: 李佶澳
date: "2023-05-09 10:59:18 +0800"
last_modified_at: "2023-06-05 10:53:24 +0800"
categories: 编程
cover:
tags: android
keywords:
description: jetpack/compose是当前推荐使用的 android 原生 UI 开发工具，用少量代码完成 UI 编写，替代之前用 xml 文件描述 UI 布局的做法。 
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

[jetpack/compose][2] 是当前（2023-05-09 11:00:59）推荐使用的 android 原生 UI 开发工具，用声明式代码完成 UI 编写，替代之前用 xml 文件描述 UI 布局的做法。 

* [JetPack Quick Start][6]： JetPack 手册
* [jetpack/compose/tutorial][3]：JetPack Start Tutorial
* [jetpack-compose/course][5]：JetPack 系列教程


## 原理说明

继承 ComponentActivity()，在它的 setContent 设置当前 Activity 的 UI。

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Text("Hello World!")
        }
    }
}
```

setContent 方法中需要使用 `Composable` 函数。Composable 函数是带有注解 @Composable 的函数，是一类可以被转换成 UI 元素的函数，编译的时候 Jetpack Compose 会使用 Kotlin 的插件将其转换成具体的 UI 组件。androidx.compose.* 中提供的 UI 组件一般都是 Composable 函数，比如 [androidx.compose.material3][4] 中定义了 Text、Button 等函数，可以直接在 setContent 中使用。

Composable 函数也可以自定义，添加 @Composable 注解成为 Composable 函数后，即可在自定义的 composable 函数中使用其它的 composable 函数，完成 UI 设计。

```kotlin

import androidx.compose.material3.Text

@Composable
fun Greeting(name: String, modifier: Modifier = Modifier) {
    Text(                       //  androidx.compose.material3 提供的 Composable 函数
        text = "Hello $name!",
        modifier = modifier
    )
}
```

## Material Design 3

Material Design 3 是 jetpact 中的一个包 [androidx.compose.material3][8]提供了 buttons、text、checkbox 等大量 UI 组件，并且可以通过 MaterialTheme 统一调整包含的 UI 组件的风格。

* [Material Design 3 in Compose][7]： material3 介绍文档
* [androidx.compose.material3][8]：material3 api

### MaterialTheme

使用 material3 时，通常是在 setContent 中使用自定义的 composable 函数，比如下面的 JetpackTheme：

```kotlin
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            JetpackTheme {   /* 自定义的 composable 函数*/
                // A surface container using the 'background' color from the theme
                Surface(     /* mateiral3 的组件*/
                    modifier = Modifier.fillMaxSize(),   /* 组件支持的参数  */
                    color = MaterialTheme.colorScheme.background
                ) {
                    Greeting("Android")    /* activity 的 UI */
                }
            }
        }
    }
}
```

JetpackTheme 中经过一系列逻辑判断后，最终声明了 material3 中的 MaterialTheme，向其传入 UI 内容 content、风格相关的配置 colorTheme/typography/shapes 等。

```kotlin
@Composable
fun JetpackTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {

   /* ...省略.... */
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
```

### colorScheme

[colorScheme][9] 是 material3 中定义的配色区域的颜色设置。

![colorScheme]({{ site.article }}/m3-light.png)


### typography

[typography][10] 是 material3  中定义的各个等级的字体的配置，Typegraphy 定义如下：

```kotlin
 class Typography(
    val displayLarge: TextStyle = TypographyTokens.DisplayLarge,
    val displayMedium: TextStyle = TypographyTokens.DisplayMedium,
    val displaySmall: TextStyle = TypographyTokens.DisplaySmall,
    val headlineLarge: TextStyle = TypographyTokens.HeadlineLarge,
    val headlineMedium: TextStyle = TypographyTokens.HeadlineMedium,
    val headlineSmall: TextStyle = TypographyTokens.HeadlineSmall,
    val titleLarge: TextStyle = TypographyTokens.TitleLarge,
    val titleMedium: TextStyle = TypographyTokens.TitleMedium,
    val titleSmall: TextStyle = TypographyTokens.TitleSmall,
    val bodyLarge: TextStyle = TypographyTokens.BodyLarge,
    val bodyMedium: TextStyle = TypographyTokens.BodyMedium,
    val bodySmall: TextStyle = TypographyTokens.BodySmall,
    val labelLarge: TextStyle = TypographyTokens.LabelLarge,
    val labelMedium: TextStyle = TypographyTokens.LabelMedium,
    val labelSmall: TextStyle = TypographyTokens.LabelSmall,
) {
    /* 省略 */
}
```

### shape

[material3#shapes][11]

## UI 预览

没有入参的 Composable 函数可以在 IDE 中直接预览 UI 效果，加上 @Preview 注解即可：

![jetpack 预览]({{ site.article }}/jetpack-1.png)


## 参考

1. [李佶澳的博客][1]
2. [jetpack/compose][2]
3. [jetpack/compose/tutorial][3]
4. [androidx.compose.material3][4]
5. [jetpack-compose/course][5]
6. [JetPack Quick Start][6]
7. [Material Design 3 in Compose][7]
8. [androidx.compose.material3][8]
9. [material3#color-scheme][9]
10. [material3#typography][10]
11. [material3#shapes][11]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://developer.android.com/jetpack/compose "jetpack/compose"
[3]: https://developer.android.com/jetpack/compose/tutorial "jetpack/compose/tutorial"
[4]: https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary "androidx.compose.material3"
[5]: https://developer.android.com/courses/jetpack-compose/course "jetpack-compose/course"
[6]: https://developer.android.com/jetpack/compose/setup "JetPack Quick Start"
[7]: https://developer.android.com/jetpack/compose/designsystems/material3 "Material Design 3 in Compose"
[8]: https://developer.android.com/reference/kotlin/androidx/compose/material3/package-summary "androidx.compose.material3"
[9]: https://developer.android.com/jetpack/compose/designsystems/material3#color-scheme "material3#color-scheme"
[10]: https://developer.android.com/jetpack/compose/designsystems/material3#typography "material3#typography"
[11]: https://developer.android.com/jetpack/compose/designsystems/material3#shapes "material3#shapes"
