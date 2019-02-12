---
layout: default
title: "编译构建工具CMake的安装使用教程 & 配置文件CMakeLists.txt内容格式详解"
author: 李佶澳
createdate: "2019-01-22 15:30:27 +0800"
changedate: "2019-02-12 16:04:29 +0800"
categories: 技巧
tags: make
keywords: cmake,CMake,cmake使用,cmake配置,CMakeLists.txt,cmake教程
description: "CMakeLists.txt是Cmake的指令文件，类似于make的makefile，执行'cmake  CMakeLists.txt'生成CMakeCache.txt等文件"

---

* auto-gen TOC:
{:toc}

## 说明

最近在了解libfuse的用法，重新写C代码，顺便学习一下之前一直没花时间了解的cmake。

主要参考这两份文档：

1. [CMake Usage: A Basic Starting Point][1]
2. [CMake 入门实战][2]

另外[CMake Documentation][3]是最好的速查手册：

1. [CMakeLists.txt中可以使用的Cmake命令手册][4]
2. [CMakeLists.txt中可以使用的Cmake变量手册][5]

## CMakeLists.txt

CMakeLists.txt是Cmake的指令文件，类似于make的makefile。

编写完CMakeLists.txt之后，执行下面的命令生成makefile等文件：

	cmake  CMakeLists.txt

执行过后，目录如下所示，会多出`CMakeCache.txt`、`cmake_install.cmake`和`Makefile`三个文件，以及一个名为`CMakeFiles`的目录：

	CMakeCache.txt  CMakeFiles/  cmake_install.cmake  CMakeLists.txt  main.c  Makefile  operations.c  operations.h

这些文件生成以后，直接执行make命令开始编译：

	make

## 最简洁的用法

```bash
cmake_minimum_required (VERSION 2.6)
project (Tutorial)
add_executable(Tutorial tutorial.cxx)
```

第一行限定camek的版本：

	cmake_minimum_required (VERSION 2.6)

第二行设置项目名称：

	project (Tutorial)

第三行添加源代码文件：

	add_executable(Tutorial tutorial.cxx)

## 稍微复杂一点的例子——带有编译选项

```make
cmake_minimum_required (VERSION 2.8)

# projectname is the same as the main-executable
project(demo-fake)

# 添加编译选项
add_definitions('-g')
add_definitions('-Wall')

# -D定义宏变量
add_definitions('-D_FILE_OFFSET_BITS=64')
add_definitions('-DFUSE_USE_VERSION=26')

# 查找当前目录中的所有源文件，并将结果列表存放在变量DIR_SRCS中
aux_source_directory(. DIR_SRCS)

# 指定可执行文件名称，PROJECT_NAME是前面定义的project名称
add_executable(${PROJECT_NAME} ${DIR_SRCS})

# 添加依赖的链接库
target_link_libraries(${PROJECT_NAME} fuse)
```

## 参考

1. [CMake Usage: A Basic Starting Point][1]
2. [CMake 入门实战][2]
3. [CMake Documentation][3]
4. [CMake Documentation：cmake-commands][4]
5. [CMake Documentation：cmake-variables][5]

[1]: https://cmake.org/cmake-tutorial/ "CMake Usage: A Basic Starting Point"
[2]: https://www.hahack.com/codes/cmake/ "CMake 入门实战"
[3]: https://cmake.org/cmake/help/v3.13/ "CMake Documentation"
[4]: https://cmake.org/cmake/help/v3.13/manual/cmake-commands.7.html "CMake Documentation：cmake-commands"
[5]: https://cmake.org/cmake/help/v3.13/manual/cmake-variables.7.html "CMake Documentation：cmake-variables"
