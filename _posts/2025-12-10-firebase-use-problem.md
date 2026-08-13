---
layout: default
title: "firebase 使用中遇到的问题记录"
author: 李佶澳
categories: [solo-income]
tags: [独立赚钱日记]
keywords: 
description:  记录使用 firebase 时遇到的一些问题以及对应的处理方法
---

## 目录

* auto-gen TOC:
{:toc}

## 云函数中签署 url 时出错

日志显示缺少权限:

```bash
errorMessage: "Permission 'iam.serviceAccounts.signBlob' denied on resource (or it may not exist)."
errorStack: "Error: Permission 'iam.serviceAccounts.signBlob' denied on resource (or it may not exist).
```

经过一堆排查，确认是 firebase 默认使用的 service account 没有这个权限。

查看对应云函数的使用的 servcie account：

```bash
gcloud functions describe images-getUploadUrl --gen2  --region=us-central1  --project=你的gcloud项目 
```

返回的内容中有一项：

```bash
serviceAccount: XXXXX @developer.gserviceaccount.com
```

这就是这个云函数使用的 serviceAccount。在 google cloud 控制台上没找到云函数的这个信息，最后还是通过 cli 才看到。Google 的 web 控制台真是不友好。注意这个是 firebase 的 gen2 云函数。

然后到 web 控制台的 iam/serviceAccount 中给对应的账号添加角色：Service Account Token Creator

重新部署云函数（权限可以立即生效）:

```bash
firebase deploy --only functions:images-getUploadUrl
```

## 通过singeurl 上传文件失败

返回错误404，如果不是使用默认的 bucket，需要到控制台上手动创建 bucket。

本地 firebase 模拟器是自动创建的

## 查询 firestore 失败，其实没有 index

```
The query requires an index. You can create it here:
```

需要到控制台上手动创建 index。模拟器上似乎是不需要 index。

要避免以后发布时手动创建索引，可以把索引记录在 firestore.indexes.json ，例如

```json
{
  "indexes": [
    {
      "collectionGroup": "cities",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "country", "order": "ASCENDING" },
        { "fieldPath": "name", "order": "ASCENDING" }
      ]
    },
    // 添加您的索引定义...
  ]
}
```

注意需在 firebase.json 配置 firestore target：

```json
{
   "firestore": {
    "indexes": "firestore.indexes.json"
   }
}
```

## 图片本地缓存

使用 [Kingfisher](https://github.com/onevcat/Kingfisher) 避免每次都进行网络请求


## 参考

1. [李佶澳的博客][1]

[1]: https://www.lijiaocn.com "李佶澳的博客"
