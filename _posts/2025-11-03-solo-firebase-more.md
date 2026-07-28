---
layout: default
title: "独立赚钱笔记：firebase 的更多用法"
author: 李佶澳
categories: [solo-income]
tags: [firebase]
keywords: 
description: 
---

## 目录

* auto-gen TOC:
{:toc}


## firebase 一键部署到新环境

## 为不同运行环境定义不同的数值

如果同一套代码要在不同的的 firebase 项目中运行，可能需要配置不同的数值。比如 firebase storage 的 bucket 是全球唯一的不能重名，每个环境都需要单独指定名称。这时可以用环境参数解决。

在根目录创建 .env-{项目名称} 文件，里面写入对应配置：

```
# Cloud Storage Buckets
STORAGE_BUCKET_REFERENCE=reference-dev
STORAGE_BUCKET_ORIGIN=origin-dev
STORAGE_BUCKET_RESULT=result-dev
```

然后用下面的方式读取： 

```js
const { defineString } = require('firebase-functions/params');

// 定义一个参数，Firebase 在部署时会询问或读取配置
const aiBucketName = defineString('AI_STORAGE_BUCKET');

exports.myFunction = onRequest((req, res) => {
    // 使用 .value() 获取当前环境的值
    const bucket = getStorage().bucket(aiBucketName.value());
    // ... 逻辑
});
```

## ios 模拟器连接 firebase emulator 

xcode 中调试 app 时， app 运行在本地的模拟器中。ios 的模拟器中默认会把 localhost 转发到宿主机的。所以在模拟器中运行的应用可以连接开发机上运行的 firebase 模拟器。（anroid 说是要用一个特殊的 10.0.2.2 地址）。

不过 google sign-in sdk 登录的时候，打开的还是真正的 google 地址，但是认证通过会在本地模拟器中创建用户。只有登录的过程还需要连接真正的 google 服务。


## 和 gcloud 的联动

firebase 的本地模拟器中只包含 firebase 支持的功能。如果代码中使用了第三方服务，比如用 sdk 调用了 glcoud 上的服务，在本地模拟执行时，这部分请求依然是发送到第三方服务的。

如果使用的 gcloud 服务，可以在本地生成一个 token，然后使用 google 的 sdk 会自动检索 token 用于认证：

```bash
gcloud auth application-default login
```

认证通过后本地会生成保存相关 token 的文件：

```bash
~/.config/gcloud/application_default_credentials.json
```

这样就可以本地运行完整服务了。

## 开发/测试/正式环境

开发/测试/正式环境，每个都需要一个单独的 firebase 项目，然后可以在同一个 firebase 项目的代码库连接这三个不同的项目。

```bash
$ firebase use --add  # 在当前的 firebase 项目代码目录中关联在控制台创建的 firebase 项目
What alias do you want to use for this project? (e.g. staging)  # 给新关联的项目起个别名，之后可以通过别名切换
```

当前关联的 alias 记录在 ~/.config/configstore/firebase-tools.json 中，比如：

```bash
"activeProjects": {
    "/Users/lijiao/Project/looksync": "default"
},
```

firebase use 显示以及关联的项目和当前关联的活跃项目，通过 firebase use [alias] 在不同项目之间切换。

## 使用 AI 能力

firebase 提供几种方式:

* AI Logic： 控制台的功能，一个代理网关，客户端可以直接安全的调用 google 的 gemini api。
* Genkit：说是一个服务端的 AI 开发框架，当前还没有了解
* Vertex AI：云函数内直接用 Vertex AI sdk 调用 google 的模型服务，只需要在 gcloud 中开通即可，云函数内部调用不需要 ak/sk

### 云函数使用 Vertex AI

在云函数代码目录中安装 vertexai sdk：
```bash
npm install @google-cloud/vertexai
```


## 云函数中实现类似消息订阅的功能

firebase 的云函数有多种类型，其中有一系列类型是在特定资源发生变化时触发执行，比如 firestore 中的 doc 变动，cloud storage 中的文件变动等。保证最少一次投递，默认重试七次，还可以设置私信队列。

```ts
import {onDocumentCreated} from 'firebase-functions/v2/firestore';
import {logger} from 'firebase-functions';
import {SyncDocument} from '../../shared/types';

/**
 * 监听 syncs 表的新文档创建事件
 * 当有新的同步任务创建时，触发执行
 */
export const onSyncCreated = onDocumentCreated(
  {
    document: 'syncs/{syncId}',
    retry: true,
    // 注意：deadLetterTopic 配置在 Firebase Functions v2 SDK 中可能尚未支持
    // 需要在部署时通过 gcloud 命令行或云控制台配置死信队列
    // 死信队列主题名称：PUBSUB_TOPICS.SYNC_JOB_DEAD_LETTER
  },
  async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
      logger.warn('onSyncCreated: 文档快照不存在');
      return;
    }

    const syncData = snapshot.data() as SyncDocument;
    const syncId = event.params.syncId;

    logger.debug('检测到新的同步任务创建', {
      syncId,
      userId: syncData.user_id,
      referenceId: syncData.reference_id,
      originalId: syncData.original_id,
      status: syncData.status,
    });
  },
);
```

## 使用 secret manager 

直接用 firebase 将 secrett 保存到 secret manager：

```bash
firebase functions:secrets:set APPLE_PURCHASE_KEY < xxx.p8
```

创建的 key 需要到 glcoud 的 sercet manager 控制台中查看和管理。

在 firebase 云函数中用下面的方式访问 secret

```js
const { onCall } = require("firebase-functions/v2/https");

// 在定义函数时指定 secrets
exports.verifyAppleTransaction = onCall({
  secrets: ["APPLE_PURCHASE_KEY"] 
}, async (request) => {
  // 此时你可以通过 process.env 访问到它
  const p8Content = process.env.APPLE_PURCHASE_KEY;
  
  // 使用 p8Content 初始化 Apple 客户端...
});
```

## 

## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
