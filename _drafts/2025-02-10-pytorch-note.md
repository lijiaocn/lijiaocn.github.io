---
title: PyTorch 入门学习笔记
createtime: '2025-02-10 19:44:55 +0800'
last_modified_at: '2025-02-10 19:49:44 +0800'
categories: 项目
tags: []
keywords: null
description: null
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明


## 安装

```bash
virtualenv env
source ./env/bin/activate
pip3 install torch torchvision
```

验证：

```python
import torch
x = torch.rand(5, 3)
print(x)
```
 
## Basic

## 参考

1. [李佶澳的博客][1]
2. [PyTorch 安装][2]
3. [Learn the Basics][3]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://pytorch.org/get-started/locally/ "PyTorch 安装"
[3]: https://pytorch.org/tutorials/beginner/basics/intro.html "Learn the Basics"
