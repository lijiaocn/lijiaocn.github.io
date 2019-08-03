---
layout: default
title: "分析微信公众号协议，探索微信公众号文章的爬取方法"
author: 李佶澳
createdate: "2018-12-23 17:14:15 +0800"
changedate: "2018-12-23 17:14:15 +0800"
categories: 技巧
tags: spider
keywords: 爬虫,微信公众号,文章爬取
description: 从搜狗中爬取，只能爬取最近10篇文章，之前见过有人直接爬取了微信公众号的所有历史信息，应该还有别的渠道
---

* auto-gen TOC:
{:toc}

## 说明

一直很好奇微信公众号的文章是怎样被爬到的，花费了些时间研究了下，搞明白了一些。

## 从搜狗中爬取

搜狗是腾讯系的公司，独家提供微信订阅号文章的搜索。之前认为是要通过分析查询接口构造请求，现在才知道哪里用得着这么麻烦，早就鸟枪换炮了：现在可以直接通过代码调用浏览器。

这款神器叫[Selenium][1]，一个web自动化测试工具。Selenium有python的sdk，可以用写python代码调用，强大到爆炸：[Selenium with Python][2]。

有了工具之后，剩下的就是分析页面格式，然后从中提取需要的内容就可以了。但是从搜狗中爬取，只能爬取最近10篇文章，之前见过有人直接爬取了微信公众号的所有历史信息，应该还有别的渠道。

## 从微信中爬取 

在微信上是可以看到所有历史文章的，从微信中爬取实际是解析出url，然后模拟微信发起请求，从而获得所有历史文章。

url可以用charles、fiddler等工具分析，见[PC电脑端、手机移动端通信数据报文的抓取、破解、改写（请求拦截）的方法][3]。

分析charles中记录的http请求，找到了获取文章列表的请求：

```bash
GET /mp/profile_ext?action=getmsg&__biz=MzAwMDkzMzQxMg==&f=json&offset=12&count=10&is_ok=1&scene=126&uin=777&key=777&pass_ticket=9SXu1e%2B%2BEELott8G7DtwjdOTm6K%2FEAg%2Fly9G%2FT6VWcC0Dskjjs1FqD3QBuClm81%2F&wxtoken=&appmsg_token=988_wmj1WDH6IB%252FvaB3n_uWF9Rrw4e0owoBNRkZ_oQ~~&x5=0&f=json HTTP/1.1
Host: mp.weixin.qq.com
Accept-Encoding: br, gzip, deflate
Cookie: devicetype=iOS12.0; lang=zh_CN; pass_ticket=9SXu1e++EELott8G7DtwjdOTm6K/EAg/ly9G/T6VWcC0Dskjjs1FqD3QBuClm81/; version=17000027; wap_sid2=CIy47I4KElx2YV9yMENmWHUwMU5RbGNwajZZMElROHJlbXlLWGQ1dnJkb185YjRVUTJ0VDJoSWtJZlJGX3VZdTJuN0R6NXp5bFoydVFNaTRpbkRMMDNNSVV3Q2Z0dHdEQUFBfjCg9f3gBTgNQJVO; wxuin=2715491340
Connection: keep-alive
Accept: */*
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Referer: https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzAwMDkzMzQxMg==&scene=126&bizpsid=0&sessionid=1545566864&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=9SXu1e%2B%2BEELott8G7DtwjdOTm6K%2FEAg%2Fly9G%2FT6VWcC0Dskjjs1FqD3QBuClm81%2F&wx_header=1
Accept-Language: zh-cn
X-Requested-With: XMLHttpRequest

```
 
下面是查询另一个公众号时的请求：

```bash
GET /mp/profile_ext?action=getmsg&__biz=MjM5MzI5NjQxMA==&f=json&offset=10&count=10&is_ok=1&scene=126&uin=777&key=777&pass_ticket=AcQ14aHj%2Fkg3tFT52SoBwsGDIUk4ZS6YHGlqN6iYe62ZbJcW4rXJpOVInRlLdGgU&wxtoken=&appmsg_token=988_gh5MAoozDeEQTAf3H7_1VV2zcA30d7ZU1oeyzw~~&x5=0&f=json HTTP/1.1
Host: mp.weixin.qq.com
Accept-Encoding: br, gzip, deflate
Cookie: devicetype=iOS12.0; lang=zh_CN; pass_ticket=AcQ14aHj/kg3tFT52SoBwsGDIUk4ZS6YHGlqN6iYe62ZbJcW4rXJpOVInRlLdGgU; version=17000027; wap_sid2=CIy47I4KElxlZ0IxLVFRcUtOUXNDN2tlQXBRZWtaYVhDbmVyOF92NUc2REZic2xMNVA1WDNwa19QMm5vYXMwb2ZrVkJBRVVobW5xeXFGVjYzVHlneFJYODlfd2FITndEQUFBfjD0y/3gBTgNQJVO; wxuin=2715491340
Connection: keep-alive
Accept: */*
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Referer: https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MjM5MzI5NjQxMA==&scene=126&bizpsid=0&sessionid=1545561318&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=AcQ14aHj%2Fkg3tFT52SoBwsGDIUk4ZS6YHGlqN6iYe62ZbJcW4rXJpOVInRlLdGgU&wx_header=1
Accept-Language: zh-cn
X-Requested-With: XMLHttpRequest
```

用Beyond Compare对比发现，URI中以下参数不同：

```bash
__biz
pass_ticket
appmsg_token
```

cookie中以下参数不同：

```bash
pass_ticket  # 和uri中参数一致
wap_sid2
```

带上所有的头信息，用curl模拟请求能够返回json格式的文章列表，但是如果不带cookie，会出错：

```json
{
    "base_resp": {
        "cookie_count": 1,
        "csp_nonce": 20452345,
        "errmsg": "no session",
        "ret": -3
    },
    "cookie_count": 1,
    "errmsg": "no session",
    "ret": -3
}
```

错误信息是`no session`，分析cookie，发现有个`wap_sid2`，这个session id从其它请求中获得的。

检查发现是这个请求：

```bash
GET /mp/profile_ext?action=home&__biz=MzAwMDkzMzQxMg==&scene=126&bizpsid=0&sessionid=1545566864&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=9SXu1e%2B%2BEELott8G7DtwjdOTm6K%2FEAg%2Fly9G%2FT6VWcC0Dskjjs1FqD3QBuClm81%2F&wx_header=1 HTTP/1.1
Host: mp.weixin.qq.com
X-WECHAT-KEY: ac92af8b12ec9e8e4d5d36e08a3190036bd15f7582dad48310eba6540cec86760d8ea383bc835832a270beffc50b439a2a57ea63816199a738ec5db62a974b9318a3b063b68bf32b9795da1f7e0f0273
X-WECHAT-UIN: MjcxNTQ5MTM0MA%3D%3D
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Accept-Language: zh-cn
Accept-Encoding: br, gzip, deflate
Connection: keep-alive
```

这个请求的返回会设置cookie。


知道了是哪些请求之后，请空所有记录，重新操作一边，做一份干净的记录，先记录查看“南方周末”文章列表的请求：


获取南方周末的文章列表页：

```bash
GET /mp/profile_ext?action=home&__biz=Njk5MTE1&scene=126&bizpsid=0&sessionid=1545568846&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=P48iPZPrIx8KAASsVV0Ai0ME2FEA6iX2dN8%2BXkFWAW7MHFGqWCNHDe1HFvLXj3Kz&wx_header=1 HTTP/1.1
Host: mp.weixin.qq.com
X-WECHAT-KEY: fb4c212d7c885279b42bd2e0f8b03f9e64c31a180a60f6e0a8acd68cf4d0043b3c62e7603aa0263e2b46736f191d781c9e49fc1f53a72820bc69ef2da6306b52d6f3fed036b120bf93973e6336e2541c
X-WECHAT-UIN: MjcxNTQ5MTM0MA%3D%3D
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Accept-Language: zh-cn
Accept-Encoding: br, gzip, deflate
Connection: keep-alive
```

加载南方周末的更多文章：

```bash
GET /mp/profile_ext?action=getmsg&__biz=Njk5MTE1&f=json&offset=10&count=10&is_ok=1&scene=126&uin=777&key=777&pass_ticket=P48iPZPrIx8KAASsVV0Ai0ME2FEA6iX2dN8%2BXkFWAW7MHFGqWCNHDe1HFvLXj3Kz&wxtoken=&appmsg_token=988_DhMRH3YVUCof4sqg6l5aExx8N22DJe0ND--VAA~~&x5=0&f=json HTTP/1.1
Host: mp.weixin.qq.com
Accept-Encoding: br, gzip, deflate
Cookie: devicetype=iOS12.0; lang=zh_CN; pass_ticket=P48iPZPrIx8KAASsVV0Ai0ME2FEA6iX2dN8+XkFWAW7MHFGqWCNHDe1HFvLXj3Kz; version=17000027; wap_sid2=CIy47I4KElxtVXVZUWwtZnFoMEpwcUVvRjdRUHA5ZkJuX1IwcG5OUk1IdkVFZEtoVWhuMWpPTkh6aUZ2U05fVkNya05fZ2dkaHRzU25aeU1aVExGMTRBb1JxQkdMdHdEQUFBfjDWhP7gBTgNQJVO; wxuin=2715491340
Connection: keep-alive
Accept: */*
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Referer: https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=Njk5MTE1&scene=126&bizpsid=0&sessionid=1545568846&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=P48iPZPrIx8KAASsVV0Ai0ME2FEA6iX2dN8%2BXkFWAW7MHFGqWCNHDe1HFvLXj3Kz&wx_header=1
Accept-Language: zh-cn
X-Requested-With: XMLHttpRequest
```

然后换一个微信号，请求另一个公众号“观点推荐”的文章列表：

获取观点推荐的文章列表页：

```bash
GET /mp/profile_ext?action=home&__biz=MzI0ODAwNzcyOQ==&scene=126&bizpsid=0&sessionid=1545569099&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=OH5QKPzWR%2Fa8zzGhUulhdHr%2Bhbs63P2MM84dorG7cn6wYcxzKn%2FFaODJnagqo7Q5&wx_header=1 HTTP/1.1
Host: mp.weixin.qq.com
X-WECHAT-KEY: c39a264a227b9301394c74702f2a9e1bbad5551b1c70d20164732312fb9c2fdaace0c601f1540b6180634ba1ae18626ccd923af9e6dbdf77e3f94d05a34f3337e0c2cfc201ab722f01a396f0829717ac
X-WECHAT-UIN: XXXXXXNg%3D%3D
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Accept-Language: zh-cn
Accept-Encoding: br, gzip, deflate
Connection: keep-alive
```

加载观点推荐的更多文章：

```bash
GET /mp/profile_ext?action=getmsg&__biz=MzI0ODAwNzcyOQ==&f=json&offset=23&count=10&is_ok=1&scene=126&uin=777&key=777&pass_ticket=OH5QKPzWR%2Fa8zzGhUulhdHr%2Bhbs63P2MM84dorG7cn6wYcxzKn%2FFaODJnagqo7Q5&wxtoken=&appmsg_token=988_rsPtD7IlXicNsEZYRUwLlMYRwwEojhVgaYzX_A~~&x5=0&f=json HTTP/1.1
Host: mp.weixin.qq.com
Accept-Encoding: br, gzip, deflate
Cookie: devicetype=iOS12.0; lang=zh_CN; pass_ticket=OH5QKPzWR/a8zzGhUulhdHr+hbs63P2MM84dorG7cn6wYcxzKn/FaODJnagqo7Q5; version=17000027; wap_sid2=CKi1q+0MElxuYWMyMW82bVd1andFT2E4VUw5MGw2Y2tRWlI0WHplRV9XUFpzbjg3enMxeGhIeDNDV2NzYlF6bkdaWEFiMjVOc1l1ek9VVFNBN3phd2pMX1BXeXdOdHdEQUFBfjDRhv7gBTgNQJVO; wxuin=3450526376
Connection: keep-alive
Accept: */*
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Referer: https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzI0ODAwNzcyOQ==&scene=126&bizpsid=0&sessionid=1545569099&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=OH5QKPzWR%2Fa8zzGhUulhdHr%2Bhbs63P2MM84dorG7cn6wYcxzKn%2FFaODJnagqo7Q5&wx_header=1
Accept-Language: zh-cn
X-Requested-With: XMLHttpRequest
```

用beyond compare进行对比，观察数值不同的参数。

然后用curl模拟请求，并且通过增删改参数，确定参数作用。

如下所示，如果去掉X-WECHAT-KEY和X-WECHAT-UIN，会返回`暂无权限查看此页面内容`的页面。

```bash
curl  --compressed \
"https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=Njk5MTE1&scene=126&bizpsid=0&sessionid=1545568840&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=P48iPZPrIx8KAASsVV0Ai0ME2FEA6iX2dN8%2BXkFWAW7MHFGqWCNHDe1HFvLXj3Kz&wx_header=1" \
-H "Host: mp.weixin.qq.com" \
-H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
-H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN" \
-H "Accept-Language: zh-cn" \
-H "Accept-Encoding: br, gzip, deflate" \
-H "Connection: keep-alive" \

#-H "X-WECHAT-KEY: fb4c212d7c885279b42bd2e0f8b03f9e64c31a180a60f6e0a8acd68cf4d0043b3c62e7603aa0263e2b46736f191d781c9e49fc1f53a72820bc69ef2da6306b52d6f3fed036b120bf93973e6336e2541c" \
#-H "X-WECHAT-UIN: MjcxNTQ5MTM0MA%3D%3D" \
```

另外sessionid和pass_ticket是客户端确定的，可以断定要抓去一个公众号的文章列表，只需要确定下面的参数：

```bash
__biz：        每个公众号的唯一编码
X-WECHAT-KEY： 微信账号的KEY
X-WECHAT-UIN： 微信账号的ID
```

将脚本修改为如下：

```bash
BIZ=Njk5MTE1  #南方周末
KEY=fb4c212d7c885279b42bd2e0f8b03f9e64c31a180a60f6e0a8acd68cf4d0043b3c62e7603aa0263e2b46736f191d781c9e49fc1f53a72820bc69ef2da6306b52d6f3fed036b120bf93973e6336e2541c
UIN=MjcxNTQ5MTM0MA%3D%3D

curl  --compressed \
"https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=${BIZ}&scene=126&bizpsid=0&sessionid=1545568841&subscene=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=P48iPZPrIx8KAASsVV0Ai0ME2FEA6iX2dN8%2BXkFWAW7MHFGqWCNHDe1HFvLXj3KZ&wx_header=1" \
-H "Host: mp.weixin.qq.com" \
-H "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" \
-H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN" \
-H "Accept-Language: zh-cn" \
-H "Accept-Encoding: br, gzip, deflate" \
-H "Connection: keep-alive" \
-H "X-WECHAT-KEY: ${KEY}" \
-H "X-WECHAT-UIN: ${UIN}" \
```

然后将BIZ换成“观点推荐”的：

```
BIZ="MzI0ODAwNzcyOQ=="  #观点推荐
```

返回无权查看，比较奇怪，把KEY和UIN也换掉以后就可以了：

```
KEY=c39a264a227b9301394c74702f2a9e1bbad5551b1c70d20164732312fb9c2fdaace0c601f1540b6180634ba1ae18626ccd923af9e6dbdf77e3f94d05a34f3337e0c2cfc201ab722f01a396f0829717ac
UIN=XXXXXXNg%3D%3D
```

然这个KEY和UIN是公众号有对应关系？

用同一个账号，请求另一个公众号：

小道消息的文章列表：

```bash
GET /mp/profile_ext?action=home&__biz=MjM5ODIyMTE0MA==&scene=126&bizpsid=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=OH5QKPzWR%2Fa8zzGhUulhdHr%2Bhbs63P2MM84dorG7cn6wYcxzKn%2FFaODJnagqo7Q5&wx_header=1 HTTP/1.1
Host: mp.weixin.qq.com
Cookie: devicetype=iOS12.0; lang=zh_CN; pass_ticket=OH5QKPzWR/a8zzGhUulhdHr+hbs63P2MM84dorG7cn6wYcxzKn/FaODJnagqo7Q5; version=17000027; wap_sid2=CKi1q+0MElxuYWMyMW82bVd1andFT2E4VUw5MGw2Y2tRWlI0WHplRV9XUFpzbjg3enMxeGhIeDNDV2NzYlF6bkdaWEFiMjVOc1l1ek9VVFNBN3phd2pMX1BXeXdOdHdEQUFBfjDRhv7gBTgNQJVO; wxuin=3450526376
X-WECHAT-KEY: 4c6eab00a00a2b3d53dbd2294245d4765435a5c8bf41af3a8b1fea0a85612be22d6d4e38b3f0c0f87bc0558acc00c1b938598300d9645b761667394fff057252c9a7c96ca9dd00a4cae098529173a394
X-WECHAT-UIN: XXXXXXNg%3D%3D
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Accept-Language: zh-cn
Accept-Encoding: br, gzip, deflate
Connection: keep-alive
```

X-WECHAT-UIN是相同的，X-WECHAT-KEY变化了，果然和公众号有关联关系。

将应用退出，然后用同一个账号再次打开小道消息的列表，发现KEY又变了：

```bash
GET /mp/profile_ext?action=home&__biz=MjM5ODIyMTE0MA==&scene=126&bizpsid=0&devicetype=iOS12.0&version=17000027&lang=zh_CN&nettype=WIFI&a8scene=0&fontScale=100&pass_ticket=AZi%2BPqkk8%2BTeQUS3d5jRiT%2BhzdSOHhP6YMrzAjhDisSwrttpwNtsfu8tS419j6mL&wx_header=1 HTTP/1.1
Host: mp.weixin.qq.com
X-WECHAT-KEY: XXXXXXXXXXXXX244bf0afa9548b78948cbb0800935f9c877d186d97ea7f01c9029a25d980ef49bff2e1a43ab195df8270a2a1aeb92d3c5ca4e954e091b12912605536593bd331fa6a4f1bbd
X-WECHAT-UIN: XXXXXXNg%3D%3D
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8
User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/16A366 MicroMessenger/7.0.0(0x17000024) NetType/WIFI Language/zh_CN
Accept-Language: zh-cn
Accept-Encoding: br, gzip, deflate
Connection: keep-alive
```

同个账号同个公众号以前的key也好使。现在的问题就是X-WECHAT-KEY是怎样生成的了，这不是一个随便的值，是和公众号有关系的，而且肯能还是和时间有关系的，每次打开文章列表页面，都会生成一个新的KEY，而前一个KEY依然有效，因此应当是用客户端算法生成的。

X-WECHAT-KEY会在一段时间后失效，是通过公众号和时间生成的确定无疑。

从微信中查询出来的url是：

http://mp.weixin.qq.com/s?__biz=MjM5ODIyMTE0MA==&amp;mid=2650972001&amp;idx=1&amp;sn=bae1307dc353bd0fc7b17331bf0ab312&amp;chksm=bd383b5a8a4fb24ce3e97a5fb86a9584b3092fe2c028cdbc2c740134cdcf76d7b8db66d5bf71&amp;scene=27#wechat_redirect

搜狗搜索中同一篇文章的url是:

https://mp.weixin.qq.com/s?timestamp=1546227145&src=3&ver=1&signature=IMHaqBKKaqm6DjqS6FPRuZKg8*BPVPP9VLFwXDoaIJ-A5Ull3QopG2C9FTmnH06PYWkV-Hmf6O1og3U4HssvgPJi4g820*gc9l--MFCGoKqQcVgs3VRm6ZHdW2yk3k8SUmPOcnjhYVweLhNKkOTCmcBvI8fBbr1IajWb30KUZSQ=

两个url没有什么相关性，只能根据title和js中的创建时间去重：

```js
var svrDate=new Date("1546227211"*1000);
var ct="1545985761"*1;
```

## 创建Django项目将数据入库

```bash
virtualenv env
source env/bin/activate
pip install --upgrade pip
curl https://bootstrap.pypa.io/get-pip.py | python
pip install django
pip freeze > requirements.txt
django-admin.py startproject banyung
cd banyung
python manage.py startapp portal
```

设置数据库`banyung/settings.py`，[Django Setting文件设置](https://docs.djangoproject.com/en/2.1/ref/settings/)：

```python

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'portal',                       # 加上app
]

# 设置数据库
DATABASES = {
#    'default': {
#        'ENGINE': 'django.db.backends.sqlite3',
#        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
#    }
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'HOST': '127.0.0.1',
        'NAME': 'wechatspider',
        'USER': 'wechat',
        'PASSWORD': '123456',
        'OPTIONS':{
            'charset': 'utf8mb4',
        },
    }
}

```

创建models：

```python
# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models

# Create your models here.
class Pages(models.Model):
    author_id = models.CharField(max_length=64)
    author_name = models.CharField(max_length=64)
    pub_date = models.DateTimeField('date published')
    title = models.CharField(max_length=256)
    url = models.CharField(max_length=1024)
    file = models.CharField(max_length=128)

    class Meta():
        index_together = ["author_id","pub_date","title"] 
```

创建数据库表：

```sh
pip install  mysqlclient
ln  -s  /usr/local/Cellar/mysql\@5.7/5.7.24/ /usr/local/opt/mysql
python manage.py makemigrations
python manage.py migrate
```

## 后续

剩下的工作以后有时间在整理，爬取结果在 [https://www.lijiaocn.com/wechat/news/ ](https://www.lijiaocn.com/wechat/news/) 中可以看到。上面探索出来的爬取方法比较简单，可以抓取完整的公众号文章，但是没有包括点赞和评论。点赞和评论应该也能获取到，不排除还有其它的爬取方式。

## 参考

1. [Selenium Website][1]
2. [Selenium with Python][2]
3. [PC电脑端、手机移动端通信数据报文的抓取、破解、改写（请求拦截）的方法][3]

[1]: https://www.seleniumhq.org/ "Selenium Website"
[2]: https://selenium-python.readthedocs.io/ "Selenium with Python"
[3]: https://www.lijiaocn.com/%E6%8A%80%E5%B7%A7/2018/02/05/pkt-capture.html "网络报文抓取破解的方法"
