---
layout: default
title: "中文分词包 THULAC 使用"
author: 李佶澳
date: "2022-07-06 15:00:59 +0800"
last_modified_at: "2022-07-06 15:07:06 +0800"
categories: 编码
cover:
tags:  ElasticSearch
keywords: thulac,中文分词,分词工具
description: THULAC 由清华大学自然语言处理与社会人文计算实验室研制推出的一套中文词法分析工具包
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

THULAC（THU Lexical Analyzer for Chinese）由清华大学自然语言处理与社会人文计算实验室研制推出的一套中文词法分析工具包，
具有中文分词和词性标注功能，详情见 [thulac](http://thulac.thunlp.org/)。

## python 包使用

安装[THULAC-Python](https://github.com/thunlp/THULAC-Python)：

```sh
pip install thulac
```

代码：

```python
import thulac

# 执行时如果遇到 AttributeError: module 'time' has no attribute 'clock'
# 是因为 pytyhon 3.8 已经废弃了 time.clock()
# 到出错的位置将 time.clock() 修改成 time.time()

if __name__ == "__main__":
    thul = thulac.thulac()
    result =thul.cut("我爱北京天安门", text=False)
    print(result)
```

执行结果：

```python
Model loaded succeed
[['我', 'r'], ['爱', 'v'], ['北京', 'ns'], ['天安门', 'ns']]
```

其中 r/v/ns 等是词性，含义如下：

```sh
n/名词 np/人名 ns/地名 ni/机构名 nz/其它专名
m/数词 q/量词 mq/数量词 t/时间词 f/方位词 s/处所词
v/动词 a/形容词 d/副词 h/前接成分 k/后接成分 i/习语 
j/简称 r/代词 c/连词 p/介词 u/助词 y/语气助词
e/叹词 o/拟声词 g/语素 w/标点 x/其它
```

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"

