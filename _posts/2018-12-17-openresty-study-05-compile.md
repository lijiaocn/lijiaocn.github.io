---
layout: default
title: "Web开发平台OpenResty（五）：OpenResty项目自身的编译"
author: 李佶澳
createdate: "2018-12-17 11:06:47 +0800"
changedate: "2019-01-17 16:53:44 +0800"
categories: 编程
tags: openresty 视频教程
keywords: openresty,nginx,lua,openresty开发
description: 需要了解一下OpenResty的原理和编译构建方法，以后或许可能要根据需要定制OpenResty
---

* auto-gen TOC:
{:toc}

## 说明

## 下载项目代码

```bash
git clone https://github.com/openresty/openresty.git
cd openresty
git checkout v1.13.6.1
```

## 下载继承的模块的代码

CentOS或者Federa上需要安装：

	sudo yum install perl dos2unix mercurial

Mac上需要安装：

	brew install unix2dos mercurial


直接执行make：

	make

执行Make的时候会执行脚本`./util/mirror-tarballs`，下载OpenResty集成的nginx模块代码。

```bash
.PHONY: all test try-luajit try-lua

all:
	./util/mirror-tarballs

test:
	prove -r t

try-luajit: all
	cd openresty-`./util/ver` && ./configure --with-luajit

try-lua: all
	cd openresty-`./util/ver` && ./configure && $(MAKE)
```

执行make如果遇到下面的错误：

```bash
mv: rename simpl-ngx_devel_kit* to ngx_devel_kit-0.3.0: No such file or directory
make: *** [all] Error 1
```

是因为v1.13.16.1依赖的一个ngx_devel_kit模块的的被移到了另一个Repo中，openresty的脚本还没有更新：

将`/util/mirror-tarballs`中的`simpl-ngx_devel_kit*`修改为`simplresty-ngx_devel_kit*`

```bash
#将这一行
mv simpl-ngx_devel_kit* ngx_devel_kit-$ver || exit 1   
#修改为
mv simplresty-ngx_devel_kit* ngx_devel_kit-$ver || exit 1
```

## 参考

1. [github: openresty][1]

[1]: https://github.com/openresty/openresty "github: openresty"
