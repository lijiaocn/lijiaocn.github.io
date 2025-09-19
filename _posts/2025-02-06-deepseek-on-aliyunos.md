---
title: 免费使用云厂商提供的 DeepSeek 大模型
createtime: '2025-02-06 16:59:17 +0800'
last_modified_at: '2025-02-06 17:10:27 +0800'
categories:
- 工具
tags:
- llm
keywords: null
description: null
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

DeepSeek 的官网和 APP 压力过大经常不可用，并且自我审查厉害，经常突然就要求换个话题。


## 火山引擎上直接用

50 万个免费token：

![deep-seek]({{ 'img/article/deepseek-at-ark.png' | relative_url }})
 
## 开通阿里云百炼

阿里云上线 DeepSeek 模型，免费提供 1000 万 Token。


登录阿里云，进入百炼控制台，然后按提示开通就好了。创建 API-KEY 后验证一下是否可用：

```bash
pip install  openai
```

用阿里云文档上的代码试一下：

```python
import os
from openai import OpenAI

client = OpenAI(
    # 若没有配置环境变量，请用百炼API Key将下行替换为：api_key="sk-xxx",
    api_key=os.getenv("DASHSCOPE_API_KEY"), # 如何获取API Key：https://help.aliyun.com/zh/model-studio/developer-reference/get-api-key
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1",
)

completion = client.chat.completions.create(
    model="deepseek-r1-distill-qwen-7b",  # 此处以 deepseek-r1-distill-qwen-7b 为例，可按需更换模型名称。
    messages=[
        {'role': 'system', 'content': 'You are a helpful assistant.'},
        {'role': 'user', 'content': '9.9和9.11谁大'}
        ]
)
print(completion.choices[0].message.content)
```



部署一个  open-webui

```bash

docker run -d  \
-e ENABLE_OPENAI_API=true \
-e OPENAI_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1 \
-e OPENAI_API_KEY=XXX \
-e WEBUI_AUTH=False \
-e ENABLE_OLLAMA_API=false \
-p 3000:8080 -v open-webui:/app/backend/data --name open-webui ghcr.io/open-webui/open-webui:main
```


本地打开：127.0.0.1:3000

![open-webui]({{ 'img/article/open-webui-1.png' | relative_url }})


>晕死，此路不通。阿里云的API返回的 models 只有千问系列，在open-webui 中找不到deepseek。


## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
