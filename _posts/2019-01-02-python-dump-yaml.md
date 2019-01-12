---
layout: default
title: "python-dump-yaml"
author: 李佶澳
createdate: "2019-01-02 23:05:40 +0800"
changedate: "2019-01-02 23:05:40 +0800"
categories:
tags:
keywords:
description:
---

* auto-gen TOC:
{:toc}

## 说明

[PyYAML Documentation](https://pyyaml.org/wiki/PyYAMLDocumentation)

pip install PyYAML

```python
import yaml
import os

data = {
        "title": "this is title",
        "list": ['item1','item2','item3'],
        "zh": "中文",
        "map": {
            "sub-map1": "sub-map1",
            "sub-map2": "sub-map2",
            }
        }

print  dump(data,default_flow_style=False,allow_unicode=True)
```

输出结果如下：

```yaml
list:
- item1
- item2
- item3
map:
  sub-map1: sub-map1
  sub-map2: sub-map2
title: this is title
zh: !!python/str '中文'
```

注意如果没有将设置参数`default_flow_style=False`，输出的会是下面的样式：

```yaml
list: [item1, item2, item3]
map: {sub-map1: sub-map1, sub-map2: sub-map2}
title: this is title
zh: !!python/str '中文'
```

## 参考

1. [文献][1]

