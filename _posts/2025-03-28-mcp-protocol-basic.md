---
title: AI 扫盲贴：Model Context Protocol (MCP) 是做什么的？
createtime: '2025-03-28 14:29:11 +0800'
last_modified_at: '2025-03-28 14:41:50 +0800'
categories:
- 方法
tags:
- llm
keywords: mcp,Model Context Protocol
description: MCP 只是一套接口定义标准，接口的实现（ 即MCP 层的 MCP Server） 需要自行开发的。开放接口标准，借助社区的力量扩展能力，成功的概率非常大。
author: 李佶澳
layout: default
---

## 目录

* auto-gen TOC:
{:toc}

## 说明

扫盲贴系列文章都特别浅显。如果你能回答标题中的问题，就不用浪费时间继续阅读。

##  Anthropic 公司
Anthropic 是一家非常有技术实力的公司，大模型领域主要玩家之一。它开发的 Claude 模型是第一个风靡全球的侧重于编程的大模型。著名的 AI 代码编辑器 Curosr 利用 Claude 模型实现了比较惊艳的 AI 编程效果，其它的 AI 编辑器通常也都把 Cluade 模型作为必选项。

Anthropic 公司除了提供 Claude 模型服务（通过 api 调用），还开发了一个桌面软件 Claude for Desktop。软件打开后就是一个和deepseek/豆包/元宝等类似对话框，输入内容后得到 Claude 大模型的回复。

现在手机端或者电脑端部署的同类软件，主要还是一问一答的交互方式。步伐迈的比较快的公司，提供图片生成/修改等功能。但总体而言还在非常初级的阶段，远远没有达到预想的终极阶段：输入一句话后，不只是得到大模型的回复，而是会操作设备的上的资源进行一系列复杂动作后完成目标。

## MCP 协议

Anthropic  公司采用下面的方式实现终极目标。 Host 就是部署在手机或者电脑上的软件，比如 Anthropic 公司的  Claude for Desktop。Host 软件和远端或者本地的 Server 建立连接，从 Server 中获取数据或调用 Server 中的功能。


![mcp core]({{ 'img/article/mcp-core.png' | relative_url }})


如果 Host 连接的众多 Server 使用完全不一样的接口定义，那几乎需要为每个 Server 开发 client，这显然不是一个好的方式。解决方法就是再加一层：`用 MCP Server 层规范所有  Server 的接口`。

上图中的 Server1/Server2/Server3 就是实现  MCP 接口的 MCP Server，它们分别封装了：外部服务的api、本地Files&git操作、Database操作。

## 怎样和 MCP 层交互？

实现终结目标有一个关键问题：Host 如何自主判断调用哪个 MCP Server，以及调用 MCP Server 的哪个功能？看起来很难的问题，解决方法反而非常简答：让大模型自己判断。

步骤如下：

 *  Host 软件中添加需要的多个 MCP Server 地址
 *  Host 软件调用 MCP Server 中的「描述型」接口得知 MCP Server 能够提供的能力
 *  Host 软件将用户输入和已知的 MCP Server 能力说明一并提交给大模型，让大模型给出功能调用顺序
*  Host 按照大模型给出的调用顺序，依次调用 MCP Server，将最终结果返回给用户

上面是感性的描述，现在 MCP 协议中主要定义了以下几类接口：

* list_tools： 获取 MCP Server 支持的所有 tool，获得 tool 的名称、能力描述、参数
* call_tool： 调用 MCP Server 的一个 tool，要指定 tool 的名称、传递给它的参数
* list_prompts: 获取 MCP Server 内置的提示词列表
* get_prompt:  获取提示词具体的提示语句

此外还有  resoruce/roots/sampling 等接口，这里只做 MCP 扫盲，没有必要讨论太细。可以预见，如果 MCP 在大范围内被认可，以后还会增加各种类型的接口。

下图是 MCP 文档上给出一个代码示例：

![mcp client ]({{ 'img/article/mcp-client.png' | relative_url }})

## 其它

MCP 只是一套接口定义标准，接口的实现（ 即MCP 层的 MCP Server） 需要自行开发的。社区里不仅有各种语言的 SDK 来帮助简化开发过程，还有很多已经开发好的 MCP Server。
 
![mcp sdk]({{ 'img/article/mcp-sdk.png' | relative_url }})

![mcp server]({{ 'img/article/mcp-servers.png' | relative_url }})

## 最后

开放接口标准，借助社区的力量扩展能力，成功的概率非常大。占据先发优势后，MCP Server 的种类和数量越来越多，其它的 Host 端软件以及各种 Server 端服务将必须选用或支持 MCP 协议。


1. [李佶澳的博客][1]
2. [MCP项目][2]
3. [MCP文档][3]
4. [社区中的 MCP Servers][4]

[1]: https://www.lijiaocn.com "李佶澳的博客"
[2]: https://github.com/modelcontextprotocol "MCP 项目"
[3]: https://modelcontextprotocol.io/introduction "MCP 文档"
[4]: https://github.com/modelcontextprotocol/servers "社区中的 MCP Servers"
